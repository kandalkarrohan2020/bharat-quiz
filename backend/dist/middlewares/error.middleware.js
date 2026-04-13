import mongoose from 'mongoose';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.helper.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/app.config.js';
// ============================================================
// Error Handler Middleware
// ============================================================
export const errorHandler = (err, _req, res, _next) => {
    logger.error({
        message: err.message,
        stack: config.isDev ? err.stack : undefined,
        name: err.name,
    });
    // Operational AppErrors
    if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
        return;
    }
    // Mongoose CastError (invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        sendError(res, `Invalid ${err.path}: ${err.value}`, 400);
        return;
    }
    // Mongoose ValidationError
    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map((e) => e.message).join(', ');
        sendError(res, messages, 400);
        return;
    }
    // MongoDB Duplicate Key
    if (err.code === '11000') {
        const field = Object.keys(err.keyValue ?? {})[0];
        sendError(res, `Duplicate value for field: ${field}`, 409);
        return;
    }
    // JWT errors handled by middleware, but catch stragglers
    if (err.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token', 401);
        return;
    }
    if (err.name === 'TokenExpiredError') {
        sendError(res, 'Token has expired', 401);
        return;
    }
    // Unhandled errors
    const message = config.isDev ? err.message : 'Internal server error';
    sendError(res, message, 500, config.isDev ? err.stack : undefined);
};
// ============================================================
// 404 Handler
// ============================================================
export const notFoundHandler = (req, res) => {
    sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};
//# sourceMappingURL=error.middleware.js.map