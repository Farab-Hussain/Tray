// src/utils/logger.ts
import { Request, Response, NextFunction } from "express";

/**
 * Logger utility for consistent logging across all routes
 */
export class Logger {
  /**
   * Log warning
   */
  static warn(route: string, uid: string, message: string) {
    const uidInfo = uid ? `[${uid}]` : "";
    console.log(`⚠️  [${route}]${uidInfo} - ${message}`);
  }

  /**
   * Log when a route is hit
   */
  static routeHit(method: string, path: string, additionalInfo?: string) {
    const info = additionalInfo ? ` - ${additionalInfo}` : "";
    console.log(`🎯 [${method} ${path}] - Route hit${info}`);
  }

  /**
   * Log successful operation
   */
  static success(method: string, path: string, message: string) {
    console.log(`✅ [${method} ${path}] - ${message}`);
  }

  /**
   * Log error or failure
   */
  static error(method: string, path: string, message: string, error?: any) {
    const pathInfo = path ? `[${path}]` : "";
    if (error) {
      console.error(`❌ [${method}]${pathInfo} - ${message}`, error);
    } else {
      console.log(`❌ [${method}]${pathInfo} - ${message}`);
    }
  }

  /**
   * Log warning
   */
  static warning(method: string, path: string, message: string) {
    console.log(`⚠️  [${method} ${path}] - ${message}`);
  }

  /**
   * Log info
   */
  static info(method: string, path: string, message: string) {
    const pathInfo = path ? `[${path}]` : "";
    console.log(`ℹ️  [${method}]${pathInfo} - ${message}`);
  }
}

/**
 * Middleware to automatically log all incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const path = req.path;
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log(`\n🎯 [${method} ${path}] - Request received at ${timestamp}`);
  
  // Log request body if exists (except for sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Hide sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.idToken) sanitizedBody.idToken = "***";
    console.log(`   📦 Body:`, sanitizedBody);
  }

  // Log query parameters if exists
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   🔍 Query:`, req.query);
  }

  // Capture response
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Log response when finished
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                        statusCode >= 400 && statusCode < 500 ? '❌' : 
                        statusCode >= 500 ? '💥' : '➡️';
    
    console.log(`${statusEmoji} [${method} ${path}] - Response: ${statusCode}`);
  });

  next();
};
