import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'professional_services',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: ['src/models/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('✅ Database connected successfully');
    }
  } catch (error) {
    logger.error('❌ Database connection error:', error);
    throw error;
  }
};