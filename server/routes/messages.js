const router = require('express').Router();
const Message = require('../models/Message');

router.post('/send', async (req, res) => {
    try {
        const newMessage = new Message(req.body);
        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(500).json({ error: "Failed to send message." });
    }
});

router.get('/all', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve messages." });
    }
});

router.get('/user/:name', async (req, res) => {
    try {
        const messages = await Message.find({ senderName: req.params.name }).sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve user messages." });
    }
});

router.put('/reply/:id', async (req, res) => {
    try {
        const { replyContent, adminName } = req.body;
        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            { 
                replyContent: replyContent, 
                adminName: adminName 
            },
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ error: "Message not found." });
        }

        res.status(200).json(updatedMessage);
    } catch (err) {
        res.status(500).json({ error: "Failed to send reply." });
    }
});

router.patch('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body; 
        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        res.status(200).json(updatedMessage);
    } catch (err) {
        res.status(500).json({ error: "Status update failed." });
    }
});

module.exports = router;