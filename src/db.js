import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let dbInstance = null;

export async function connectDB() {
  if (dbInstance) {
    return dbInstance; // 如果已经连接过，直接返回数据库实例
  }
  try {
    await client.connect();
    // 指定你的数据库名称（例如 flight_booking_db）
    dbInstance = client.db('Account');
    console.log('✅ Connected to MongoDB successfully (Native Driver)!');
    return dbInstance;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}