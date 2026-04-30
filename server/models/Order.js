const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    price: { 
        type: Number, 
        default: 0 
    },
    adminShare: { 
        type: Number, 
        default: 0
    },
    donorShare: { 
        type: Number, 
        default: 0
    },
    orphanageShare: { 
        type: Number, 
        default: 0 
    },
    buyerDiscountAmount: { 
        type: Number, 
        default: 0
    },
    orderType: {
        type: String,
        enum: ['INCOMING', 'OUTGOING'],
        default: 'INCOMING',
        index: true
    },
    requesterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false,
        index: true 
    },
    requesterName: {
        type: String,
        default: "Central Logistics" 
    },
    orphanageId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false 
    },
    orphanageName: { 
        type: String,
        default: "Warehouse" 
    },
    targetedOrphanageId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Donor ID is mandatory"],
        index: true
    },
    donorName: { 
        type: String 
    },
    shippingAddress: { 
        type: String, 
        required: [true, "Address is missing"] 
    },
    phone: { 
        type: String, 
        required: [true, "Contact number is required"],
        match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number']
    },
    status: {
        type: String,
        default: 'Ready for Pickup',
        enum: [
            'Pending', 'Requested', 'In Cart', 'Purchased',
            'Going for Pickup', 'Ready for Pickup', 'On the Way',
            'Delivered', 'Received', 'Live', 'Completed',
            'Pending Payment', 'Paid', 'Settled', 'Rejected'
        ],
        index: true
    },
    paymentMode: { 
        type: String, 
        default: 'None' 
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
}, { timestamps: true }); 

orderSchema.index({ requesterId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);