const router = require('express').Router();
const Product = require('../models/Product');
const Order = require('../models/Order'); 

router.get('/all', async (req, res) => {
    try {
        const allRecords = await Product.find()
            .populate('lockedBy', 'name email') 
            .sort({ createdAt: -1 });
            
        res.status(200).json(allRecords);
    } catch (err) {
        res.status(500).json({ error: "Global history fetch failed" });
    }
});

router.get('/approved', async (req, res) => {
    try {
        const items = await Product.find({ 
            status: { $in: ['Live', 'In Cart'] } 
        }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: "Buyer items fetch failed" });
    }
});

router.get('/pending', async (req, res) => {
    try {
        const pendingItems = await Product.find({ status: 'Pending' }).sort({ createdAt: -1 });
        res.status(200).json(pendingItems);
    } catch (err) {
        res.status(500).json({ error: "Pending list fetch failed" });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { 
            itemName, description, category, 
            donorId, donorName, donorEmail, 
            image, address, phone, price,
            payoutPreference, targetedOrphanageId
        } = req.body;
        
        const newProduct = new Product({
            itemName, description, category, 
            donorId, donorName, donorEmail, 
            image, address, phone,
            price: Number(price) || 0, 
            payoutPreference: payoutPreference || 'DONATE_ALL',
            targetedOrphanageId: targetedOrphanageId || null,
            status: 'Pending' 
        });
        
        const savedProduct = await newProduct.save();
        res.status(201).json({ success: true, data: savedProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: "Submission failed" });
    }
});

router.get('/my-donations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const history = await Product.find({ donorId: userId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: "Donor history fetch failed" });
    }
});

router.patch('/approve/:id', async (req, res) => {
    try {
        const { itemName, category, description, price, status } = req.body; 

        const updateData = {};
        if (itemName) updateData.itemName = itemName;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (status) updateData.status = status;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ error: "Product not found" });

        if (status) {
            try {
                const existingOrder = await Order.findOne({ productId: updatedProduct._id, orderType: 'INCOMING' });
                
                if (existingOrder) {
                    await Order.findByIdAndUpdate(
                        existingOrder._id,
                        { status: updatedProduct.status }
                    );
                } else if (status === 'Going for Pickup') { 
                    const pickupOrder = new Order({
                        productId: updatedProduct._id,
                        itemName: updatedProduct.itemName || "Unnamed Item",
                        originalPrice: updatedProduct.price || 0,
                        price: updatedProduct.price || 0,
                        donorId: updatedProduct.donorId,
                        donorName: updatedProduct.donorName || "Anonymous Donor",
                        shippingAddress: updatedProduct.address || "Address not provided",
                        phone: updatedProduct.phone || "No phone",
                        status: 'Going for Pickup',
                        orderType: 'INCOMING', 
                        requesterName: "Logistics Pipeline", 
                        orphanageName: "Central Warehouse"
                    });
                    await pickupOrder.save();
                    console.log("✅ Order Table Synced"); 
                }
            } catch (orderErr) {
                console.error("⚠️ Order Sync Error (But product updated):", orderErr.message);
            }
        }

        res.status(200).json({ success: true, data: updatedProduct });

    } catch (err) {
        console.error("🔥 Global Approve Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/make-live/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { status: 'Live' }, 
            { new: true }
        );

        await Order.findOneAndUpdate({ productId: productId, orderType: 'INCOMING' }, { status: 'Live' });

        res.status(200).json({ success: true, message: "Item verified and Live!", data: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: "Verification process failed" });
    }
});

router.patch('/reject/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { status: 'Rejected' });
        await Order.updateMany({ productId: req.params.id }, { status: 'Rejected' });
        res.status(200).json({ success: true, message: "Donation Rejected!" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Reject action failed" });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        await Order.deleteMany({ productId: req.params.id });
        res.status(200).json({ success: true, message: "Deleted permanently" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Delete failed" });
    }
});

router.patch('/dispatch-to-user/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { status: 'Ready for Pickup' }, 
            { new: true }
        );

        await Order.findOneAndUpdate(
            { productId: req.params.id, orderType: 'OUTGOING' }, 
            { status: 'Ready for Pickup' }
        );

        res.status(200).json({ success: true, message: "Warehouse to User: Ready for Pickup!", data: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: "Leg 2 dispatch failed" });
    }
});

router.patch('/lock/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        if (product.status !== 'Live') {
            return res.status(400).json({ success: false, message: "Item already taken!" });
        }

        product.status = 'In Cart';
        product.lockedBy = userId;
        await product.save();
        
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: "Lock failed" }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: "Donation cancelled successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ success: false, message: "Server error while deleting" });
    }
});

router.patch('/unlock/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product && product.status === 'In Cart') {
             product.status = 'Live';
             product.lockedBy = null;
             await product.save();
             return res.status(200).json({ success: true });
        }
        res.status(200).json({ success: true, message: "Item was not in cart or not found" });
    } catch (err) { res.status(500).json({ error: "Unlock failed" }); }
});

module.exports = router;