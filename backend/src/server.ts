import { createServer } from 'http';
import createApp from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config } from './config/app.config.js';
import { logger } from './utils/logger.js';

const bootstrap = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(config.server.port, () => {
    logger.info(`
       India Quiz API Started
       ENV  : ${config.env.padEnd(36)}
       PORT : ${String(config.server.port).padEnd(36)}
       API  : /api/${config.server.apiVersion.padEnd(31)}
    `);
  });

  // ── Graceful Shutdown ─────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.warn(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed. Goodbye! 🙏');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    shutdown('uncaughtException');
  });
};

bootstrap();