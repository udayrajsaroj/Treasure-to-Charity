const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, "Item name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please provide a description"]
    },
    category: {
        type: String,
        required: true,
        enum: ['Clothing', 'Books', 'Electronics', 'Furniture', 'Toys', 'Food', 'Other'],
        index: true 
    },
    donorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true 
    },
    targetedOrphanageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    donorName: {
        type: String,
        required: true
    },
    donorEmail: { 
        type: String,
        required: [true, "Donor email is required"],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    image: {
        type: String, 
        default: '' 
    },
    price: { 
        type: Number, 
        default: 0 
    },
    payoutPreference: {
        type: String,
        required: true,
        enum: ['TAKE_30', 'DONATE_ALL'],
        default: 'DONATE_ALL'
    },
    address: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: [true, "Phone number is required"],
        match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number']
    },
    status: {
        type: String,
        default: 'Pending',
        enum: [
            'Pending', 'Requested', 'In Cart', 'Purchased',
            'Going for Pickup', 'Ready for Pickup', 'On the Way',
            'Delivered', 'Received', 'Live', 'Completed',
            'Pending Payment', 'Paid', 'Settled', 'Rejected'
        ],
        index: true 
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

productSchema.index({ category: 1, status: 1 });
productSchema.index({ donorId: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);