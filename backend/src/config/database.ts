import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import ServiceRequest from '../models/ServiceRequest';
import User from '../models/User';
import Category from '../models/Category';
import ServiceProvider from '../models/ServiceProvider';
import Service from '../models/Service';
import ProviderPreference from '../models/ProviderPreference';
import ProviderMedia from '../models/ProviderMedia';
import ProviderMediaLike from '../models/ProviderMediaLike';
import ProviderMediaComment from '../models/ProviderMediaComment';
import CustomerPreference from '../models/CustomerPreference';
import FavoriteProvider from '../models/FavoriteProvider';
import ProviderReview from '../models/ProviderReview';
import Conversation from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import AppNotification from '../models/AppNotification';
import ProviderModerationReview from '../models/ProviderModerationReview';
import AppSetting from '../models/AppSetting';
import Region from '../models/Region';
import Wilaya from '../models/Wilaya';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'professional_services',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    User,
    Category,
    ServiceProvider,
    Service,
    ProviderPreference,
    ProviderMedia,
    ProviderMediaLike,
    ProviderMediaComment,
    CustomerPreference,
    FavoriteProvider,
    ProviderReview,
    Conversation,
    AppNotification,
    ProviderModerationReview,
    Region,
    Wilaya,
    AppSetting,
      ConversationMessage,
     ServiceRequest,

  ],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('FULL DATABASE ERROR =>', error);
    logger.error('❌ Database connection error');
    throw error;
  }
};