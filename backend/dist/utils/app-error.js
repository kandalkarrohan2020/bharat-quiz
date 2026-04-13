export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
//# sourceMappingURL=app-error.js.map