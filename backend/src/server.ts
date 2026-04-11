import dotenv from 'dotenv';
import app from './app';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';
import 'reflect-metadata';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, HOST, () => {
      logger.info(`✅ Server running on http://${HOST}:${PORT}`);
      logger.info(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`❤️ Health: http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();