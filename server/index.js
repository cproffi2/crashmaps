require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');
const { type } = require('os');

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
        db = client.db("CrashData");

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

        const { year, dr_no } = req.query;
        console.log("Query parameters:", req.query);
        console.log("Year from query:", year);

        let query = {};

        if (year) {

            console.log("Year provided:", year);
            console.log("Type of year:", typeof year);
            // Check if the year is a valid number
            if (isNaN(year) || year.length !== 4) {
                return res.status(400).json({ error: "Invalid year format" });
            }
            // Convert year to a number
            const yearNum = parseInt(year, 10);
            console.log("Parsed year:", yearNum);
            // Check if the year is within a reasonable range
            if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
                return res.status(400).json({ error: "Year out of range" });
            }
            console.log("Year is valid and in range:", yearNum);
            // Construct a date range filter for the year
            const startDate = new Date(`${yearNum}-01-01T00:00:00Z`); // Start of the year
            const endDate = new Date(`${yearNum}-12-31T23:59:59Z`); // End of the year

            console.log("Start date:", startDate);
            console.log("End date:", endDate);
         
            console.log("Type of start date:", typeof startDate);
            console.log("Type of end date:", typeof endDate);
            // Filter by date range (start of year to start of next year)
            query['date_occ'] = { 
                [$gte]: startDate,
                [$lt]: endDate
            };
        }

        if(dr_no){
            query.dr_no = dr_no
        }
        console.log("MongoDB query:", query);
        console.log("object values:", Object.values(query));
        console.log("object keys:", Object.keys(query));
        console.log("object length:", Object.keys(query).length);
        console.log(query.date_occ.$gte)
        console.log(typeof query.date_occ.$gte)
        console.log(query.date_occ.$gt)
        console.log(typeof query.date_occ.$gt)
        console.log("query object:", query);
        // Fetch crash data from MongoDB

        const collection = db.collection("LACityData");
        const crashes = await collection.find(query).limit(650000).toArray();
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
