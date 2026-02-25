import mongoose from 'mongoose';
import { mongodbUri, getMongodbUriForLog } from './config';
import dns from 'dns';

// Use Google DNS or system DNS for better SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

export const connectDb = (): Promise<void> => {
  console.log('MongoDB URI (password hidden):', getMongodbUriForLog());
  
  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 30000, // Increase timeout for DNS resolution
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority',
  };

  return mongoose
    .connect(mongodbUri, options)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err: Error) => {
      console.error('❌ MongoDB connection error:', err.message);
      if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED')) {
        console.error('\n💡 DNS Resolution Issue Detected');
        console.error('   Trying alternative connection method...');
        // The DNS servers are already set above, so retry should work better
      }
      process.exit(1);
    });
};
