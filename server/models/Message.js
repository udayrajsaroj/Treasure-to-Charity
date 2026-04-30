const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderName: { 
        type: String, 
        required: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    senderRole: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    replyContent: { 
        type: String, 
        default: '' 
    },
    adminName: { 
        type: String, 
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['Unread', 'Read', 'Resolved'], 
        default: 'Unread' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);