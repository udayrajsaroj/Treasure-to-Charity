const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product'); 
const Razorpay = require('razorpay'); 
const crypto = require('crypto');
const sendPurchaseEmail = require('../utils/sendEmail');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post('/create', async (req, res) => {
    try {
        const { productId, buyerWantsToDonate, orphanageId, orphanageName, ...details } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) return res.status(404).json({ error: "Product not found" });

        const original = Number(product.price) || 0;
        
        const adminShare = original * 0.30;
        
        const donorShare = original * 0.30;
        
        let discount = (!buyerWantsToDonate) ? (original * 0.40) : 0;
        const orphanageShare = Math.max(0, original * 0.40 - discount);

        const newOrder = new Order({
            ...details,
            productId: product._id,
            itemName: product.itemName,
            originalPrice: original,
            price: original - discount, 
            
            adminShare, 
            donorShare, 
            orphanageShare, 
            buyerDiscountAmount: discount,

            payoutPreference: product.payoutPreference, 
            targetedOrphanageId: product.targetedOrphanageId, 
            
            orphanageId: orphanageId || null, 
            orphanageName: orphanageName || "Warehouse",
            
            donorId: product.donorId,
            donorName: product.donorName,
            status: (original - discount) > 0 ? 'Pending Payment' : 'Requested',
            orderType: 'OUTGOING'
        });

        let razorpayOrder = null;
        if (newOrder.price > 0) {
            const options = {
                amount: Math.round(newOrder.price * 100),
                currency: "INR",
                receipt: `rcpt_${Date.now()}`
            };
            razorpayOrder = await razorpay.orders.create(options);
            newOrder.razorpayOrderId = razorpayOrder.id;
        }

        await newOrder.save();
        console.log(`✅ Dual NGO Order Created: Donor NGO=${newOrder.targetedOrphanageId}, Buyer NGO=${newOrder.orphanageId}`);
        
        res.status(201).json({ success: true, razorpayOrder, orderId: newOrder._id });
    } catch (err) { 
        console.error("🔥 Order Creation Crash:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, userEmail } = req.body;
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                        .update(body.toString())
                                        .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const updatedOrder = await Order.findByIdAndUpdate(orderId, { 
                status: 'Purchased', 
                paymentMode: 'Razorpay (Verified)',
                razorpayPaymentId: razorpay_payment_id,
                orderType: 'OUTGOING' 
            }, { new: true });

            if (updatedOrder) {
                if (userEmail) {
                    sendPurchaseEmail(userEmail, updatedOrder)
                        .then(() => console.log("Email sent."))
                        .catch(e => console.error("Email Error:", e.message));
                }

                await Product.findByIdAndUpdate(updatedOrder.productId, { 
                    status: 'Purchased',
                    lockedBy: null,
                    claimedBy: updatedOrder.requesterId 
                });
            }
            res.status(200).json({ success: true, message: "Payment Verified!" });
        } else {
            await Order.findByIdAndDelete(orderId); 
            res.status(400).json({ success: false, error: "Invalid Signature." });
        }
    } catch (err) { 
        res.status(500).json({ error: "Verification process failed." }); 
    }
});

router.get('/all', async (req, res) => {
    try {
        const allOrders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(allOrders);
    } catch (err) { res.status(500).json({ error: "Logistics fetch failed" }); }
});

router.patch('/updateStatus/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        if (updatedOrder && status !== 'Settled') {
            await Product.findByIdAndUpdate(updatedOrder.productId, { status });
        }
        res.status(200).json(updatedOrder);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

router.get('/history/:userId/:role', async (req, res) => {
    try {
        const { userId, role } = req.params;
        const cleanFilter = { status: { $nin: ['Pending Payment'] } };

        let query = { _id: null }; 
        if (role === 'Donor') {
            query = { donorId: userId, ...cleanFilter };
        } 
        else if (role === 'Buyer') {
            query = { requesterId: userId, ...cleanFilter }; 
        }
        else if (role === 'Orphanage') {
            query = { 
                $or: [
                    { requesterId: userId },         
                    { orphanageId: userId },        
                    { targetedOrphanageId: userId }  
                ],
                ...cleanFilter
            }; 
        }

        const history = await Order.find(query).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: "History fetch failed" });
    }
});

router.delete('/cancel/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order && order.status === 'Pending Payment') {
            await Product.findByIdAndUpdate(order.productId, { 
                status: 'Live',
                lockedBy: null 
            });
            await Order.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: "Cleaned and Product Resetted" });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (err) { res.status(500).json({ error: "Cleanup failed" }); }
});

router.patch('/updateBulkStatus', async (req, res) => {
    try {
        const { orderIds, status } = req.body; 

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ success: false, error: "No orders selected!" });
        }

        await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status: status } }
        );

        const orders = await Order.find({ _id: { $in: orderIds } });
        const productIds = orders.map(o => o.productId).filter(id => id);

        if (productIds.length > 0) {
            await Product.updateMany(
                { _id: { $in: productIds } },
                { $set: { status: status } }
            );
        }

        res.status(200).json({ success: true, message: `Updated ${orderIds.length} items to ${status}` });
    } catch (err) {
        console.error("Bulk Update Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;