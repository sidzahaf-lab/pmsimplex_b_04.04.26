// app/middleware/auth.js - Simple version
import AppError from '../utils/appError.js';

/**
 * Basic protection - always allows access (for development)
 */
export const protect = (req, res, next) => {
  // For now, just pass through - add your auth logic later
  // You can add JWT verification, session check, etc. here
  
  // Example: Check for API key in headers
  // const apiKey = req.headers['x-api-key'];
  // if (!apiKey || apiKey !== process.env.API_KEY) {
  //   return next(new AppError('Invalid API key', 401));
  // }
  
  next();
};

/**
 * Role-based authorization
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // If you have user roles in your system
    // if (!req.user || !roles.includes(req.user.role)) {
    //   return next(new AppError('Not authorized', 403));
    // }
    
    next();
  };
};

/**
 * Demo user assignment (for testing)
 */
export const demoAuth = (req, res, next) => {
  // For testing purposes, assign a demo user
  req.user = {
    id: 1,
    email: 'demo@example.com',
    role: 'admin'
  };
  next();
};