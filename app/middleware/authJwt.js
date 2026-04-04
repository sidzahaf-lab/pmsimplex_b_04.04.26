// app/middleware/authJwt.js
import jwt from 'jsonwebtoken';
import { User, Role, Team, Project, BusinessUnit } from '../models/index.js';
import authConfig from '../config/auth.config.js';
import { ROLE_PERMISSIONS, hasPermission } from '../constants/permissions.js';
import AppError from '../utils/appError.js';

// Custom error for guest expiration
class GuestExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuestExpiredError';
    this.statusCode = 403;
  }
}

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'is_super_admin', 'is_guest', 'is_active', 'guest_first_access', 'guest_expires_at', 'corporate_role_id', 'default_role_id', 'business_unit_id'],
      include: [
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.is_active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Check guest expiration
    if (user.is_guest) {
      const now = new Date();
      
      // First access - start the 24h timer
      if (!user.guest_first_access) {
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await user.update({
          guest_first_access: now,
          guest_expires_at: expiresAt
        });
        user.guest_expires_at = expiresAt;
      }
      
      // Access expired
      if (now > new Date(user.guest_expires_at)) {
        await user.update({ is_active: false });
        return next(new AppError('Your temporary access has expired. Thank you for your visit.', 403));
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please refresh your token or log in again.', 401));
    }
    return next(new AppError('Authentication failed. Please log in again.', 401));
  }
};

// Restrict to super admin only
export const restrictToSuperAdmin = async (req, res, next) => {
  if (!req.user || !req.user.is_super_admin) {
    return next(new AppError('You do not have permission to perform this action. Super admin access required.', 403));
  }
  next();
};

// Check if user has any of the required roles at project level
export const requireAnyRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId || req.body.project_id;
      
      if (!projectId) {
        return next(new AppError('Project ID is required', 400));
      }
      
      // Level 1 - Super Admin
      if (req.user.is_super_admin) {
        return next();
      }
      
      // Get project to know its business unit
      const project = await Project.findByPk(projectId);
      if (!project) {
        return next(new AppError('Project not found', 404));
      }
      
      // Check BU level role
      const buTeam = await Team.findOne({
        where: {
          user_id: userId,
          business_unit_id: project.business_unit_id,
          project_id: null,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name']
        }]
      });
      
      if (buTeam && buTeam.role && allowedRoles.includes(buTeam.role.name)) {
        return next();
      }
      
      // Check project level role
      const projectTeam = await Team.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name']
        }]
      });
      
      if (projectTeam && projectTeam.role && allowedRoles.includes(projectTeam.role.name)) {
        return next();
      }
      
      return next(new AppError(`Requires one of these roles: ${allowedRoles.join(', ')}`, 403));
      
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  };
};