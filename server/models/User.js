const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true,
        lowercase: true, 
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'] 
    },
    role: { 
        type: String, 
        enum: ['Donor', 'Buyer', 'Admin', 'Orphanage', 'DeliveryPartner'], 
        required: true 
    },
    registrationNumber: { 
        type: String, 
        default: '',
        trim: true
    },
    isVerified: { 
        type: Boolean, 
        default: true 
    },
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
    
    ownerName: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    phone: { 
        type: String, 
        default: '',
        trim: true,
        match: [/^\d{10}$/, 'Phone number must be exactly 10 digits']
    },
    
    accountNumber: { 
        type: String, 
        default: '',
        match: [/^\d+$/, 'Account number must contain only digits'] 
    },
    ifscCode: { 
        type: String, 
        default: '',
        uppercase: true,
        trim: true 
    },
    bankName: { type: String, default: '', trim: true },
    upiId: { type: String, default: '', lowercase: true, trim: true },

    isProfileComplete: { 
        type: Boolean, 
        default: false 
    }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);