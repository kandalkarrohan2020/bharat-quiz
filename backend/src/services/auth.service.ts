import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/app-error.js';
import { config } from '../config/app.config.js';
import {
  RegisterPayload,
  LoginPayload,
  JwtPayload,
  AuthTokens,
} from '../types/index.js';

// ============================================================
// Token Helpers
// ============================================================

const signAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

const signRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

const generateTokens = (payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

// ============================================================
// Auth Service
// ============================================================

export const AuthService = {
  // ── Register ────────────────────────────────────────────────

  async register(payload: RegisterPayload) {
    const existing = await User.findOne({ email: payload.email.toLowerCase() });
    if (existing) throw new ConflictError('Email already registered');

    const user = await User.create(payload);
    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      tokens: generateTokens(tokenPayload),
    };
  },

  // ── Login ───────────────────────────────────────────────────

  async login(payload: LoginPayload) {
    const user = await User.findOne({ email: payload.email.toLowerCase(), isActive: true })
      .select('+password');
    if (!user) throw new UnauthorizedError('Account Not Found on This Email !');

    const isMatch = await user.comparePassword(payload.password);
    if (!isMatch) throw new UnauthorizedError('Wrong Password');

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      tokens: generateTokens(tokenPayload),
    };
  },

  // ── Refresh token ───────────────────────────────────────────

  async refresh(refreshToken: string) {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) throw new NotFoundError('User');

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };

    return { accessToken: signAccessToken(tokenPayload) };
  },

  // ── Verify access token ─────────────────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  },
};