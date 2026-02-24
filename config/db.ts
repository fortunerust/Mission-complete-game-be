import mongoose from 'mongoose';
import { mongodbUri, getMongodbUriForLog } from './config';

export const connectDb = (): Promise<void> => {
  console.log('MongoDB URI (password hidden):', getMongodbUriForLog());
  return mongoose
    .connect(mongodbUri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err: Error) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
};
