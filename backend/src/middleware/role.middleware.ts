// Role-based Access Control Middleware
// Authorization checks for different user roles

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const validateInstructor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (authReq.user.role !== 'instructor' && authReq.user.role !== 'admin') {
    res.status(403).json({ error: 'Instructor access required' });
    return;
  }

  next();
};

export const validateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (authReq.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const validateStudent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (authReq.user.role !== 'student' && authReq.user.role !== 'admin') {
    res.status(403).json({ error: 'Student access required' });
    return;
  }

  next();
};

export const validateAny = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  next();
};
