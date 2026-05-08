// JWT Utilities
// Secure JWT token management utilities

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly ALGORITHM = 'HS256';

  /**
   * Validate JWT secret is properly configured
   */
  static validateSecret(): void {
    if (!this.JWT_SECRET) {
      console.error('❌ [JWTUtils] JWT_SECRET environment variable is missing!');
      return;
    }

    if (this.JWT_SECRET.length < 32) {
      console.warn('⚠️ [JWTUtils] JWT_SECRET is too short (less than 32 chars).');
    }

    if (this.JWT_SECRET === 'your-super-secret-jwt-key' || this.JWT_SECRET === 'secret') {
      console.warn('⚠️ [JWTUtils] JWT_SECRET is using a weak default value!');
    }

    console.log('✅ [JWTUtils] JWT secret validated successfully');
  }

  /**
   * Generate a secure JWT token
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    this.validateSecret();

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.parseExpirationTime(this.JWT_EXPIRES_IN),
    };

    const options: jwt.SignOptions = {
      algorithm: this.ALGORITHM as jwt.Algorithm,
      expiresIn: this.JWT_EXPIRES_IN as any,
    };

    return jwt.sign(tokenPayload, this.JWT_SECRET as string, options);
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    this.validateSecret();

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET as string, {
        algorithms: [this.ALGORITHM as jwt.Algorithm],
      }) as unknown as JWTPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Refresh JWT token (extend expiration)
   */
  static refreshToken(oldToken: string): string {
    this.validateSecret();

    try {
      const decoded = jwt.verify(oldToken, this.JWT_SECRET as string, {
        algorithms: [this.ALGORITHM as jwt.Algorithm],
        ignoreExpiration: true,
      }) as any;

      // Remove old iat and exp
      const { iat, exp, ...payload } = decoded;

      return this.generateToken(payload);
    } catch (error) {
      throw new Error('Cannot refresh token: invalid original token');
    }
  }

  /**
   * Parse expiration time string to seconds
   */
  private static parseExpirationTime(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800; // Default to 7 days
    }
  }

  /**
   * Generate a secure random secret
   */
  static generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration.getTime() <= fiveMinutesFromNow.getTime();
  }
}
