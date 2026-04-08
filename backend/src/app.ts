import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import { config } from './config/app.config.ts';
import { logger } from './utils/logger.ts';
import rootRouter from './routes/index.ts';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const createApp = (): Application => {
  const app = express();

  // ── Security Headers ────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Rate Limiting ───────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
  });
  app.use(`/api/${config.server.apiVersion}`, limiter);

  // ── Body Parsers ────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // ── Data Sanitization ───────────────────────────────────────
  app.use(mongoSanitize());

  // ── Compression ─────────────────────────────────────────────
  app.use(compression());

  // ── Request Logging ─────────────────────────────────────────
  if (config.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
      })
    );
  }

  // ── API Routes ──────────────────────────────────────────────
  app.use(`/api/${config.server.apiVersion}`, rootRouter);

  // ── 404 Handler ─────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global Error Handler ────────────────────────────────────
  app.use(errorHandler);

  return app;
};

export default createApp;