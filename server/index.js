require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// Setup EJS for dynamic HTML rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public'));

// Serve static assets like JS, CSS, images
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
let db;

async function connectDB() {
    try {
        if (!mongoUri) throw new Error("Missing MONGODB_URI");
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db("BCCData");
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
}

// Route: Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Route: Maps page with injected API key
app.get('/maps', (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    res.render('maps', { apiKey });
});

// Route: Crash Data API
app.get('/api/crashes', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not connected" });
        const collection = db.collection("LACityData");
        const crashes = await collection.find({}).limit(1000).toArray();
        res.json(crashes);
    } catch (error) {
        console.error("❌ Error fetching crash data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, async () => {
    await connectDB();
    console.log(`🚀 Server running on http://localhost:${port}`);
});
