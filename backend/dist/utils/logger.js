import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/app.config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { combine, timestamp, errors, json, colorize, printf } = winston.format;
const devFormat = combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack ?? message}`;
}));
const prodFormat = combine(timestamp(), errors({ stack: true }), json());
export const logger = winston.createLogger({
    level: config.isDev ? 'debug' : 'info',
    format: config.isDev ? devFormat : prodFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
        }),
    ],
});
//# sourceMappingURL=logger.js.map