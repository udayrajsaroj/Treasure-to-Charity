const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

router.post('/send-otp', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase().trim(); 

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ success: false, error: "Email already registered" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true });

        await sendEmail(email, {
            subject: "Verification Code - Treasure to Charity",
            message: `Aapka signup OTP hai: <b>${otp}</b>. Ye 5 minute tak valid hai.`
        });

        res.status(200).json({ success: true, message: "OTP sent successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to send OTP." });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, password, role, phone, address, registrationNumber, otp } = req.body;
        const email = req.body.email.toLowerCase().trim(); 
        
        const otpRecord = await OTP.findOne({ email, otp: otp.toString() });
        if (!otpRecord) {
            return res.status(400).json({ success: false, error: "Invalid or Expired OTP." });
        }

        const emailExist = await User.findOne({ email });
        if (emailExist) return res.status(400).json({ success: false, error: "Email already registered." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const isVerified = role !== 'Orphanage';

        const newUser = new User({
            name, email, password: hashedPassword, role, 
            phone: phone || '', address: address || '',
            registrationNumber: registrationNumber || '', isVerified
        });

        await newUser.save();
        await OTP.deleteOne({ email }); 

        res.status(201).json({ success: true, message: "Registration successful!" });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/login', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase().trim();
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "User not found." });

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been blocked." });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials." });

        if (user.role === 'Orphanage' && !user.isVerified) {
            return res.status(403).json({ success: false, message: "Account pending Admin approval." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.TOKEN_SECRET || 'secret_key');
        res.json({ success: true, token, user });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/all', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).select('-password');
        res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

router.get('/delivery-partners', async (req, res) => {
    try {
        const partners = await User.find({ role: 'DeliveryPartner' }).select('-password');
        res.status(200).json(partners);
    } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

router.get('/pending-orphanages', async (req, res) => {
    try {
        const pending = await User.find({ role: 'Orphanage', isVerified: false });
        res.status(200).json(pending);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.patch(['/verify/:id', '/verify-user/:id'], async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isVerified: true });
        res.status(200).json({ success: true, message: "Orphanage Verified!" });
    } catch (err) { res.status(500).json({ success: false, message: "Failed" }); }
});

router.get('/count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.status(200).json({ success: true, totalUsers: count });
    } catch (err) { res.status(500).json({ error: "Count failed" }); }
});

router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

router.patch(['/update/:id', '/update-user/:id'], async (req, res) => {
    try {
        const { name, email, role, phone, address, status, bankName, accountNumber, ifscCode, upiId } = req.body;
        
        const updateData = { name, email, role, phone, address };

        if (bankName !== undefined) updateData.bankName = bankName;
        if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
        if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
        if (upiId !== undefined) updateData.upiId = upiId;

        if (status === 'Blocked') updateData.isBlocked = true;
        if (status === 'Active') updateData.isBlocked = false;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true, runValidators: true } 
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User Profile Updated!", data: updatedUser });
    } catch (err) { 
        console.error("Update Error:", err.message);
        res.status(500).json({ success: false, message: "Update Failed. Check Data Format." }); 
    }
});

router.put('/complete-profile/:id', async (req, res) => {
    try {
        const { ownerName, phone, address, bankName, accountNumber, ifscCode, upiId } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { 
                ownerName, phone, address, bankName, accountNumber, 
                ifscCode: ifscCode?.toUpperCase(), 
                upiId, 
                isProfileComplete: true 
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "Profile Completed & Saved!", user: updatedUser });
    } catch (err) { 
        console.error("Save Error:", err.message);
        res.status(500).json({ success: false, message: "Update failed. Check Bank/Phone digits." }); 
    }
});

router.delete('/delete-user/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, message: "User Deleted Permanently!" });
    } catch (err) { res.status(500).json({ success: false, message: "Delete failed" }); }
});

router.patch('/toggle-block/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isBlocked = !user.isBlocked; 
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: user.isBlocked ? "User Blocked!" : "User Unblocked!",
            isBlocked: user.isBlocked 
        });
    } catch (err) { res.status(500).json({ success: false, message: "Action failed" }); }
});

module.exports = router;