require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;

async function testConnection() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log("Connected successfully to MongoDB");
        await client.close();
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

testConnection();

