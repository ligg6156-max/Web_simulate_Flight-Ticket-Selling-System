import 'dotenv/config';
import express from "express";
import { MongoClient } from 'mongodb'
const app = express();
const PORT = 8080;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function startServer() {
  try {
    // 1. Connect to MongoDB first
    await client.connect();
    console.log("Connected successfully to MongoDB");

    const db = client.db('flight_system'); // change to your database name
    const collection = db.collection('ticket'); // change to your collection name

    // Middleware
    app.use(express.json());
    app.use(express.static("static"));

    // Redirect root path to Dashboard.html
    app.get("/", (req, res) => {
      res.redirect("/Dashboard.html");
    });

    // 2. API route to fetch data from ticket
    app.get('/api/ticket', async (req, res) => {
      try {
        // Use .toArray() to convert the cursor into an array of documents
        const users = await collection.find({}).toArray();
        res.status(200).json(users);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
      }
    });

    // 3. Start the server only after the DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server is listening on http://127.0.0.1:${PORT}`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();