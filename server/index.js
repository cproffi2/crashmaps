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

    console.log('does this even do anything')
    try {
        if (!mongoUri) throw new Error("❌ Missing MONGODB_URI");

        console.log("🔌 Connecting to MongoDB using URI:", mongoUri);

        const client = new MongoClient(mongoUri, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 60000, // Timeout after 60 seconds
            // Enables more verbose logging for connections
           // You can also try 'trace' for even more verbosity
        });

        await client.connect();

        console.log("✅ Connected to MongoDB client.");

        // Ping the database to ensure the connection is working properly
        const pingResult = await client.db("admin").command({ ping: 1 });
        console.log("✅ Ping successful! MongoDB connection is alive:", pingResult);

             // Get the database instance
       db = client.db("BCCData");


        // You can now perform further operations, like fetching data
        const collection = db.collection("LACityData");
        const data = await collection.find({}).limit(1).toArray();
        console.log("Sample data from LACityData collection:", data);

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
