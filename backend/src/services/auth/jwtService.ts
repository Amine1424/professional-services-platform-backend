import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { logger } from '../../utils/logger';
import { ITokenPayload } from '../../types/auth.types';

export class JwtService {
  private static accessTokenSecret = process.env.JWT_SECRET || 'secret-key';
  private static refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  private static accessTokenExpiry = process.env.JWT_EXPIRY || '7d';
  private static refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '30d';

  /**
   * Generate Access Token
   */
  static generateAccessToken(payload: ITokenPayload): string {
    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
      } as SignOptions);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate Refresh Token
   */
  static generateRefreshToken(payload: ITokenPayload): string {
    try {
      return jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
      } as SignOptions);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate Both Tokens
   */
  static generateTokens(payload: ITokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify Access Token
   */
  static verifyAccessToken(token: string): ITokenPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as ITokenPayload;
    } catch (error) {
      logger.error('Error verifying access token:', error);
      return null;
    }
  }

  /**
   * Verify Refresh Token
   */
  static verifyRefreshToken(token: string): ITokenPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as ITokenPayload;
    } catch (error) {
      logger.error('Error verifying refresh token:', error);
      return null;
    }
  }

  /**
   * Decode Token (without verification)
   */
  static decodeToken(token: string): ITokenPayload | null {
    try {
      return jwt.decode(token) as ITokenPayload;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }
}