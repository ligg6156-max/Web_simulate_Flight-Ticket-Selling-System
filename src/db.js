import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is not configured.');
}

const client = new MongoClient(uri);
let ticketCollection;
let userCollection;

export async function connectToDatabase() {
  await client.connect();
  console.log('Connected successfully to MongoDB');

  const database = client.db('flight_system');
  ticketCollection = database.collection('ticket');
  userCollection = database.collection('account');
}

export async function getTickets() {
  if (!ticketCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  return ticketCollection.find({}).toArray();
}

export async function getUsers() {
  if (!userCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  return userCollection.find({}).toArray();
}

export async function verifyUser(username, password) {
  if (!userCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  return userCollection.findOne({ username, password });
}

export async function createUser(username, password, role) {
  if (!userCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  const existingUser = await userCollection.findOne({ username });
  if (existingUser) {
    return false;
  }

  await userCollection.insertOne({
    username,
    password,
    role,
    enabled: true
  });

  return true;
}