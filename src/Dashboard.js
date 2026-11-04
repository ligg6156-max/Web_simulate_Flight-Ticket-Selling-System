import 'dotenv/config';
import express from "express";
import { MongoClient } from 'mongodb'
const app = express();
const PORT = 8080;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
try {
await client.connect();
const db = client.db('sample_mflix');//change this to your database name
const collection = db.collection('movies');//change this to your collection name
// Find the first document in the collection
const first = await collection.findOne();
console.log(first);
} finally {
// Close the database connection when finished or an error occurs
await client.close();
}
}
run().catch(console.error);

// Serve static files from the "static" folder
app.use(express.static("static"));
// Redirect the root path to the existing Lab 3 home page
app.get("/", (req, res) => {
  res.redirect("/Dashboard.html");
});
app.listen(PORT, () => {
  console.log(`Server is listening on http://127.0.0.1:${PORT}`);
});
