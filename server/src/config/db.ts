import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aproxy';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${MONGODB_URI}: ${error?.message}`);
    console.warn(`[Database Warning] Ensure MongoDB is running. The server will stay online and retry connections.`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected');
});
