import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, } from '../middlewares/schemas.js';
const router = Router();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), AuthController.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email & password
 * @access  Public
 */
router.post('/login', validate(loginSchema), AuthController.login);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Get a new access token using refresh token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', protect, AuthController.me);
export default router;
//# sourceMappingURL=auth.routes.js.map