import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ENV
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Helpers
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

// ENV flags
const NODE_ENV = optional("NODE_ENV", "development");
const isProd = NODE_ENV === "production";

export const config = {
  env: NODE_ENV,
  isDev: NODE_ENV === "development",
  isProd,

  server: {
    port: parseInt(optional("PORT", "8000"), 10),
    apiVersion: optional("API_VERSION", "v1"),
  },

  db: {
    uri: isProd ? required("MONGODB_URI_PROD") : required("MONGODB_URI"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    expiresIn: optional("JWT_EXPIRES_IN", "15m"),
    refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  rateLimit: {
    windowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    max: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),
  },

  cors: {
    origin: optional("CORS_ORIGIN", "http://localhost:8081").split(","),
  },
} as const;
