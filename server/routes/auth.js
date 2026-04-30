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
        res.status(500).json({ success: false, error: "Email service failed." });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, password, role, phone, registrationNumber, otp } = req.body;
        const email = req.body.email.toLowerCase().trim(); 
        
        const otpRecord = await OTP.findOne({ email, otp });
        
        console.log(`Checking DB for ${email} with OTP ${otp}`);

        if (!otpRecord) {
            return res.status(400).json({ success: false, error: "Invalid or Expired OTP" });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const isVerified = role !== 'Orphanage';

        const newUser = new User({ 
            name, email, role, phone, registrationNumber,
            password: hashedPassword, isVerified 
        });

        await newUser.save();
        await OTP.deleteOne({ email }); 

        res.status(201).json({ success: true, message: "Registration successful!" });
    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.status(200).json({ success: true, totalUsers: count });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch count" });
    }
});

router.get('/all', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, registrationNumber } = req.body;
        
        if (role === 'Admin') return res.status(403).json({ success: false, error: "Admin creation is restricted" });

        const emailExist = await User.findOne({ email });
        if (emailExist) return res.status(400).json({ success: false, error: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const isVerified = role !== 'Orphanage'; 

        const newUser = new User({ 
            name, email, role, registrationNumber,
            password: hashedPassword, 
            isVerified 
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "Registration successful!" });

    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).json({ success: false, message: "Invalid credentials" });

        if (user.role === 'Orphanage' && !user.isVerified) {
            return res.status(403).json({ success: false, message: "Account pending Admin approval." });
        }
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Account has been blocked by Admin." });
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role }, 
            process.env.TOKEN_SECRET || 'secret_key' 
        );
        
        res.status(200).json({ 
            success: true,
            token, 
            user: { 
                _id: user._id, 
                name: user.name, 
                role: user.role,
                isProfileComplete: user.isProfileComplete
            }, 
            message: "Login successful!" 
        });

    } catch (err) { 
        res.status(500).json({ success: false, error: "Server Error" }); 
    }
});

router.get('/pending-orphanages', async (req, res) => {
    try {
        const pending = await User.find({ role: 'Orphanage', isVerified: false });
        res.status(200).json(pending);
    } catch (err) { res.status(500).json({ error: "Failed to fetch pending requests" }); }
});

router.patch('/verify-user/:id', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isVerified: true });
        res.status(200).json({ success: true, message: "Orphanage Verified Successfully" });
    } catch (err) { res.status(500).json({ success: false, error: "Verification failed" }); }
});

router.post('/complete-profile', async (req, res) => {
    try {
        const { userId, ...profileData } = req.body;
        await User.findByIdAndUpdate(userId, { ...profileData, isProfileComplete: true });
        res.status(200).json({ success: true, message: "Profile Updated!" });
    } catch (err) { res.status(500).json({ success: false, error: "Profile update failed" }); }
});

router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, error: "User not found" });
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

router.patch('/update-user/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (err) { res.status(500).json({ success: false, error: "Update Failed" }); }
});

module.exports = router;