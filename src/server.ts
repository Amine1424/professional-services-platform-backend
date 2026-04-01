import app from './app';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // تهيئة قاعدة البيانات
    await initializeDatabase();

    // بدء الخادم
    app.listen(PORT, () => {
      logger.info(`✅ Server running on http://${HOST}:${PORT}`);
      logger.info(`🚀 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📊 API Docs: http://${HOST}:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();