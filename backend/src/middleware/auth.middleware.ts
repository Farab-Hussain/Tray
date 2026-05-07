// Authentication Middleware
// Enhanced JWT token verification for API endpoints

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../config/firebase';
import { JWTUtils } from '../utils/jwtUtils';

// Validate JWT secret on startup
JWTUtils.validateSecret();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticateToken: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify JWT token using enhanced utilities
    const decoded = JWTUtils.verifyToken(token);
    
    // Get user from database
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    if (!userData) {
      res.status(401).json({ error: 'User data not found' });
      return;
    }
    
    req.user = {
      id: userDoc.id,
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    
    // Enhanced error handling
    if (error.message.includes('expired')) {
      res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true
      });
    } else if (error.message.includes('Invalid token')) {
      res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else {
      res.status(401).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default authenticateToken;
