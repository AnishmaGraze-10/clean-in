import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (mongoUri) => {
  if (isConnected) {
    return;
  }

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  mongoose.set('strictQuery', true);

  try {
    // Temporary debug logging; safe to keep in dev
    // eslint-disable-next-line no-console
    console.log('Connecting to MongoDB...');

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10
    });

    isConnected = true;

    // eslint-disable-next-line no-console
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection failed:', error);
    throw error;
  }
};


