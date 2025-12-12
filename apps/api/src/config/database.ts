import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async (): Promise<typeof mongoose> => {
    try {
        const connection = await mongoose.connect(env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ MongoDB disconnection error:', error);
    }
};
