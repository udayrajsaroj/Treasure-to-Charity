const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. FIXED CORS - Sabhi Cloudflare URLs ke liye
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Frontend ka address
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "bypass-tunnel-reminder"]
}));

// 2. Pre-flight Fix (Regex Literal - Sabse safe tarika)
app.options(/.*/, cors()); 

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 4. Base Route
app.get('/', (req, res) => {
    res.send("🚀 TREASURE TO CHARITY Backend is Live!");
});

// 5. Modular Routes
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/users', require('./routes/users')); 
app.use('/api/products', require('./routes/products')); 
app.use('/api/orders', require('./routes/orders')); 
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));

// 6. ✅ FIXED 404 Handler (Named Parameter Fix)
// Ise hamesha sabse neeche rakhein
app.use('/:any*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: `Route ${req.originalUrl} not found` 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});