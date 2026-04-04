// app/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import authConfig from '../config/auth.config.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'You are not logged in. Please log in to access this resource.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'is_super_admin', 'is_active']
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please refresh your token or log in again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please log in again.',
      code: 'AUTH_FAILED'
    });
  }
};

// Restrict to super admin only
export const restrictToSuperAdmin = async (req, res, next) => {
  if (!req.user || !req.user.is_super_admin) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to perform this action. Super admin access required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
};

// Optional: Check if user has specific permission (for future use)
export const hasPermission = (permission) => {
  return async (req, res, next) => {
    // This will be implemented when we add the permission system
    // For now, super admin has all permissions
    if (req.user && req.user.is_super_admin) {
      return next();
    }
    
    // TODO: Check user's role permissions from the teams table
    // This will be implemented in the permission system phase
    
    return res.status(403).json({
      status: 'error',
      message: `Permission denied: ${permission} required`,
      code: 'PERMISSION_DENIED'
    });
  };
};