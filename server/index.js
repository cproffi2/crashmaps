require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

console.log('this is index.js')
// Enable debugging
MongoClient.prototype._debug = true;

const path = require('path');
const cors = require('cors');
const { type } = require('os');
const { start } = require('repl');

const app = express();
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());  // This is crucial for parsing JSON bodies

const mocodes = require('./library')

// Endpoint to get the mocodes object
app.get('/api/mocodes', (req, res) => {
    console.log("Received request for /api/mocodes");
    console.log("Sending mocodes:", mocodes);
    res.json(mocodes);  // Sends the mocodes object as a JSON response
});

// Route for Posting Form Submission


app.post('/submit-crash', async (req, res) => {
    try {
        // Log the received form data for debugging
        console.log('Received form data:', req.body);

        const { latitude, longitude, title, date, datetimerpt, sex, age, incidentType } = req.body;

        // Validate that all required fields are present
        if (!latitude || !longitude || !title || !date || !datetimerpt) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Convert date to ISODate format
        const formattedDate = new Date(date).toISOString();
        const formattedDatetimerpt = new Date(datetimerpt).toISOString();

        // Create the document to insert into MongoDB
        const crashData = {
          coords: {
            latitude: parseFloat(latitude), // Ensure latitude is a number
            longitude: parseFloat(longitude), // Ensure longitude is a number
          },
            title,
            date: formattedDate,
            datetimerpt: formattedDatetimerpt,
            sex,
            age,
            incidentType
        };

        // Insert the document into the "CrashReports" collection
        const collection = db.collection('CrashReports'); // Specify the collection
        const result = await collection.insertOne(crashData); // Insert data

        // Log the result for debugging
        console.log('Inserted crash data with ID:', result.insertedId);

        // Send a response back to the client
        res.status(201).json({ message: 'Crash data added successfully', id: result.insertedId });

    } catch (error) {
        console.error('❌ Error inserting crash data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



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


        // Log incoming request params for debugging
        console.log("Request query params:", req.query);


        // Use current year as default if no year is specified
        const { year, dr_no, area_name, vict_sex, vict_descent, vict_age, mocodes } = req.query;
        const currentYear = new Date().getFullYear(); // Get current year if no year is provided
        const selectedYear = year || 2025;  // Default to current year if no year specified
        let query = {};

        if(year){
            const startDate = new Date(selectedYear, 0, 1); // January 1st of the year
            const endDate = new Date(selectedYear, 11, 31); // December 31st of the year

            console.log(typeof startDate)
            console.log(typeof endDate)
            console.log(`the start date is ${startDate}`)
            console.log(`the end date is ${endDate}`)

            query.date_occ = {
                $gte: startDate,
                $lte: endDate
            };
        }
        if(dr_no){
            query.dr_no = dr_no
        }

        if(area_name){
            query.area_name = area_name
        }

        if(vict_descent){
            query.vict_descent = vict_descent
        }

        if(vict_sex){
            query.vict_sex = vict_sex
        }
 
        if(vict_age){
            query.vict_age = vict_age
        }

        if(mocodes){
            query.mocodes = { $in: [mocodes]}
        }

 
        // Log the query to ensure it's being built correctly
        console.log("Constructed MongoDB query:", JSON.stringify(query));

        // Check if the query is empty after all the filters
        if (Object.keys(query).length === 0) {
            console.log("Query is empty, applying default filter for 2025.");
        }



        const collection = db.collection("LACityData");


           // Explain how the query will be executed
           const explain = await collection.find(query).explain("executionStats");
           console.log(`MongoDB explain: ${JSON.stringify(explain, null, 2)}`);
        const crashes = await collection.find(query).limit(650000).toArray();

        // Log the response data
        console.log(`MongoDB query response: ${JSON.stringify(crashes, null, 2)}`);
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
