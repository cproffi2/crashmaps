require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

console.log("every env var:", process.env);

// Setup MongoDB Debug Level (if set in .env file)
const debug = process.env.DEBUG || 'mongodb*';  // Default to 'mongodb*' if not set in the .env
console.log("Mongo debug level from env:", debug);

// Setup EJS for dynamic HTML rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public'));

// Serve static assets like JS, CSS, images
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;

//globally scoped db
let db;  
async function connectDB() {
    console.log("🔌 Connecting to MongoDB...");

    // Check if the Mongo URI exists
    if (!process.env.MONGODB_URI) {
        console.error("❌ Missing MONGODB_URI");
        return;
    }

    const mongoUri = process.env.MONGODB_URI;

    try {
        // Initialize the MongoDB client
        const client = new MongoClient(mongoUri, {
            serverSelectionTimeoutMS: 60000,  // Timeout after 60 seconds
        });

        // Try to connect to MongoDB
        await client.connect();

        console.log("✅ Connected to MongoDB client.");

        // Ping the database to ensure connection is active
        await client.db("admin").command({ ping: 1 });

        console.log("✅ Ping successful! MongoDB connection is alive.");

        // Assign the global db variable after successful connection
        db = client.db("BCCData");

        // If needed, log the database name or perform any necessary actions
        console.log("Database set to:", db.databaseName);

    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message, error.stack);
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
        const crashes = await collection.find({}).limit(60).toArray();
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
