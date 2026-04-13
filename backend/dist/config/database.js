import mongoose from 'mongoose';
import { config } from './app.config.js';
import { logger } from '../utils/logger.js';
export const connectDatabase = async () => {
    try {
        mongoose.set('strictQuery', true);
        const conn = await mongoose.connect(config.db.uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting reconnect...');
        });
        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB error: ${err.message}`);
        });
    }
    catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};
export const disconnectDatabase = async () => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully.');
};
//# sourceMappingURL=database.js.map