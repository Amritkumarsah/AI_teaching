import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB connected successfully to ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error);
    console.warn('[Database] Running in fallback mode without active DB connection. Mock DB will be used.');
  }
}

export const connectDB = connectDatabase;

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB error:', err);
});
