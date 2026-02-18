// Role-based Access Control Middleware
// Authorization checks for different user roles

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const validateInstructor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Instructor access required' });
    return;
  }

  next();
};

export const validateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const validateStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Student access required' });
    return;
  }

  next();
};

export const validateAny = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  next();
};
