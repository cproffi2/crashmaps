const { MongoClient } = require('mongodb');

async function checkConnection() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is missing");
        return;
    }
    const client = new MongoClient(uri, { useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB!");
        await client.close();
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}

checkConnection();
