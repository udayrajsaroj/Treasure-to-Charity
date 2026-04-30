const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const donorCount = await User.countDocuments({ role: 'Donor' });
        const orphanageCount = await User.countDocuments({ role: 'Orphanage' });
        const buyerCount = await User.countDocuments({ role: 'Buyer' });

        const pendingVerifications = await User.countDocuments({ 
            role: 'Orphanage', 
            isVerified: false 
        });

        const totalProducts = await Product.countDocuments();
        const pendingProducts = await Product.countDocuments({ status: 'Pending' }); 
        const approvedProducts = await Product.countDocuments({ status: 'Approved' });
        const claimedProducts = await Product.countDocuments({ status: 'Claimed' });

        const totalOrders = await Order.countDocuments();
        const successfulOrders = await Order.countDocuments({ status: 'Delivered' });
        
        const pendingOrderCount = await Order.countDocuments({ 
            status: { $ne: 'Delivered' } 
        });

        const financialData = await Order.aggregate([
            { $match: { status: 'Delivered' } }, 
            { $group: { _id: null, totalRaised: { $sum: "$price" } } }
        ]);

        const totalFunds = financialData.length > 0 ? financialData[0].totalRaised : 0;

        const categories = await Product.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            users: {
                total: totalUsers,
                donors: donorCount,
                orphanages: orphanageCount,
                buyers: buyerCount,
                pendingVerifications: pendingVerifications
            },
            products: {
                total: totalProducts,
                pending: pendingProducts,
                approved: approvedProducts,
                claimed: claimedProducts
            },
            orders: {
                total: totalOrders,
                successful: successfulOrders,
                pending: pendingOrderCount
            },
            financials: {
                totalFundsRaised: totalFunds,
                totalTransactions: totalOrders
            },
            categoryStats: categories
        });

    } catch (err) {
        console.error("Report Error:", err);
        res.status(500).json({ success: false, error: "Failed to generate report" });
    }
});

module.exports = router;