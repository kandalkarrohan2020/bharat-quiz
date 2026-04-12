import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { config } from "./config/app.config.js";
import { logger } from "./utils/logger.js";
import rootRouter from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const createApp = (): Application => {
  const app = express();

  // 1. Body Parser (FIRST)
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // 2. Security
  app.use(helmet());

  // 3. CORS (ONLY ONCE)
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // 4. Cookies
  app.use(cookieParser());

  // 5. Data Sanitization
  app.use(mongoSanitize());

  // 6. Compression
  app.use(compression());

  // 7. Logging
  if (config.isDev) {
    app.use(morgan("dev"));
  } else {
    app.use(
      morgan("combined", {
        stream: { write: (msg) => logger.info(msg.trim()) },
      })
    );
  }

  // 8. Rate Limiter
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  });

  app.use(`/api/${config.server.apiVersion}`, (req, res, next) => {
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/refresh"];

    const isPublic = publicRoutes.some((route) =>
      req.path.startsWith(route)
    );

    if (isPublic) return next();

    return limiter(req, res, next);
  });

  // 9. Routes
  app.use(`/api/${config.server.apiVersion}`, rootRouter);

  // 10. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;