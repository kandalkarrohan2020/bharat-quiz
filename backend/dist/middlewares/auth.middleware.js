import { AuthService } from '../services/auth.service.js';
import { sendError } from '../utils/response.helper.js';
import { AppError, ForbiddenError } from '../utils/app-error.js';
// ============================================================
// Protect Route Middleware
// ============================================================
export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            sendError(res, 'Authentication required. Provide Bearer token.', 401);
            return;
        }
        const token = authHeader.split(' ')[1];
        req.user = AuthService.verifyAccessToken(token);
        next();
    }
    catch (err) {
        if (err instanceof AppError) {
            sendError(res, err.message, err.statusCode);
        }
        else {
            sendError(res, 'Authentication failed', 401);
        }
    }
};
// ============================================================
// Role-based Access Middleware
// ============================================================
export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
    }
    if (!roles.includes(req.user.role)) {
        const err = new ForbiddenError(`Access denied. Required role(s): ${roles.join(', ')}`);
        sendError(res, err.message, err.statusCode);
        return;
    }
    next();
};
//# sourceMappingURL=auth.middleware.js.map