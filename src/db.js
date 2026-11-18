import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is not configured.');
}

const client = new MongoClient(uri);
let ticketCollection;
let userCollection;
let seatCollection;
let orderCollection;

export async function connectToDatabase() {
  await client.connect();
  console.log('Connected successfully to MongoDB');

  const database = client.db('flight_system');
  ticketCollection = database.collection('ticket');
  userCollection = database.collection('account');
  seatCollection = database.collection('Seat');
  orderCollection = database.collection('order');
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

export async function getSeatState(flightsNo) {
  if (!seatCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  const normalizedFlightsNo = flightsNo.replace(/\s+/g, '').toUpperCase();
  const seatStates = await seatCollection.find({}).toArray();

  return seatStates.find(seatState =>
    String(seatState.flights_No || '').replace(/\s+/g, '').toUpperCase()
      === normalizedFlightsNo
  ) || null;
}

export async function addOccupiedSeat(flightsNo, seatId) {
  if (!seatCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  const seatState = await getSeatState(flightsNo);
  if (!seatState) {
    return null;
  }

  if (!Array.isArray(seatState.seat)) {
    throw new Error('The Seat document has an invalid seat array.');
  }

  if (seatState.seat.includes(seatId)) {
    return seatState;
  }

  await seatCollection.updateOne(
    { _id: seatState._id },
    { $addToSet: { seat: seatId } }
  );

  return {
    ...seatState,
    seat: [...seatState.seat, seatId]
  };
}

export async function createOrder(order) {
  if (!orderCollection) {
    throw new Error('Database connection has not been initialized.');
  }

  const result = await orderCollection.insertOne(order);
  return {
    ...order,
    _id: result.insertedId
  };
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