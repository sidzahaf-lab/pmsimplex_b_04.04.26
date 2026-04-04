// app/middleware/permissionMiddleware.js
import { Team, Role, User, BusinessUnit } from '../models/index.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/appError.js';

// Helper function to get user's role for a specific business unit
const getRoleForUser = async (userId, businessUnitId) => {
  try {
    const teamAssignment = await Team.findOne({
      where: {
        user_id: userId,
        business_unit_id: businessUnitId,
        project_id: null,
        is_active: true
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });
    
    return teamAssignment?.role?.name;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Helper function to get user's corporate role
const getCorporateRoleForUser = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'corporate_role',
        attributes: ['name', 'scope']
      }]
    });
    
    return user?.corporate_role?.name;
  } catch (error) {
    console.error('Error getting corporate role:', error);
    return null;
  }
};

// ✅ NOUVEAU: Check if user has corporate permission (cross-BU governance)
export const requireCorporatePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(new AppError('Not authenticated', 401));
      }
      
      // Super admin bypass
      if (req.user?.is_super_admin) {
        return next();
      }
      
      // Vérifier si l'utilisateur a un rôle corporate
      const corporateRoleName = await getCorporateRoleForUser(userId);
      
      if (corporateRoleName) {
        const rolePermissions = ROLE_PERMISSIONS[corporateRoleName] || [];
        const hasPermission = rolePermissions.includes('*') || 
                             rolePermissions.includes(requiredPermission);
        
        if (hasPermission) {
          // Attacher le rôle corporate à la requête
          req.corporateRole = corporateRoleName;
          return next();
        }
      }
      
      return next(new AppError(`Permission denied: ${requiredPermission} required (corporate access)`, 403));
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };
};

// Check if user has BU level read permission (for listing users, etc.)
export const requireBUPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const businessUnitId = req.params.businessUnitId || req.body.business_unit_id;
      
      if (!businessUnitId) {
        return next(new AppError('Business Unit ID is required', 400));
      }
      
      // Check if user is super admin
      if (req.user && req.user.is_super_admin) {
        return next();
      }
      
      // ✅ Vérifier d'abord les permissions corporate (cross-BU)
      const corporateRoleName = await getCorporateRoleForUser(userId);
      if (corporateRoleName) {
        const rolePermissions = ROLE_PERMISSIONS[corporateRoleName] || [];
        const hasPermission = rolePermissions.includes('*') || 
                             rolePermissions.includes(requiredPermission) ||
                             rolePermissions.includes(PERMISSIONS.CORPORATE_CROSS_BU_VIEW);
        
        if (hasPermission) {
          return next();
        }
      }
      
      // Check if user belongs to this business unit
      if (req.user && req.user.business_unit_id === businessUnitId) {
        // Check if user has the required permission via their role
        const userRole = await getRoleForUser(userId, businessUnitId);
        if (userRole) {
          const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
          const hasPermission = rolePermissions.includes('*') || 
                               rolePermissions.includes(requiredPermission);
          if (hasPermission) {
            return next();
          }
        }
        
        // If no specific permission, allow basic read access for now
        if (requiredPermission === PERMISSIONS.BU_READ) {
          return next();
        }
      }
      
      return next(new AppError(`You do not have permission to access this business unit`, 403));
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };
};

// Check if user has permission at project level
export const requireProjectPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.projectId || req.body.project_id;
      
      if (!projectId) {
        return next(new AppError('Project ID is required', 400));
      }
      
      // Check if user is super admin (has all permissions)
      if (req.user && req.user.is_super_admin) {
        return next();
      }
      
      // ✅ Vérifier d'abord les permissions corporate (peuvent voir tous les projets)
      const corporateRoleName = await getCorporateRoleForUser(userId);
      if (corporateRoleName) {
        const rolePermissions = ROLE_PERMISSIONS[corporateRoleName] || [];
        const hasPermission = rolePermissions.includes('*') || 
                             rolePermissions.includes(requiredPermission) ||
                             rolePermissions.includes(PERMISSIONS.CORPORATE_CROSS_BU_VIEW);
        
        if (hasPermission) {
          return next();
        }
      }
      
      // Find user's active team assignment for this project
      const teamAssignment = await Team.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        }]
      });
      
      // User is not assigned to this project
      if (!teamAssignment) {
        return next(new AppError('You do not have access to this project', 403));
      }
      
      const roleName = teamAssignment.role?.name;
      
      if (!roleName) {
        return next(new AppError('Invalid role assignment', 403));
      }
      
      // Get permissions for this role
      const rolePermissions = ROLE_PERMISSIONS[roleName] || [];
      
      // Check if role has the required permission or has full access (*)
      const hasPermission = rolePermissions.includes('*') || 
                           rolePermissions.includes(requiredPermission);
      
      if (!hasPermission) {
        return next(new AppError(`Permission denied: ${requiredPermission} required`, 403));
      }
      
      // Attach role info to request for use in controllers
      req.userRole = {
        id: teamAssignment.role_id,
        name: roleName,
        permissions: rolePermissions
      };
      req.teamAssignment = teamAssignment;
      
      next();
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };
};

// Check if user has BU level admin permission
export const requireBUAdminPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const businessUnitId = req.params.businessUnitId || req.body.business_unit_id;
      
      if (!businessUnitId) {
        return next(new AppError('Business Unit ID is required', 400));
      }
      
      // Check if user is super admin
      if (req.user && req.user.is_super_admin) {
        return next();
      }
      
      // ✅ Vérifier les permissions corporate (ex: Executive, Corporate PMO)
      const corporateRoleName = await getCorporateRoleForUser(userId);
      if (corporateRoleName) {
        const rolePermissions = ROLE_PERMISSIONS[corporateRoleName] || [];
        const hasPermission = rolePermissions.includes('*') || 
                             rolePermissions.includes(requiredPermission);
        
        if (hasPermission) {
          return next();
        }
      }
      
      // Check if user has BU Manager role active for this BU
      const buManagerRole = await Role.findOne({
        where: { name: 'BU Manager' }
      });
      
      if (!buManagerRole) {
        return next(new AppError('BU Manager role not found', 500));
      }
      
      const teamAssignment = await Team.findOne({
        where: {
          user_id: userId,
          business_unit_id: businessUnitId,
          project_id: null,
          role_id: buManagerRole.id,
          is_active: true
        }
      });
      
      if (!teamAssignment) {
        return next(new AppError('You do not have BU Manager permissions for this Business Unit', 403));
      }
      
      // Check specific permission
      const buManagerPermissions = ROLE_PERMISSIONS['BU Manager'] || [];
      const hasPermission = buManagerPermissions.includes('*') || 
                           buManagerPermissions.includes(requiredPermission);
      
      if (!hasPermission) {
        return next(new AppError(`Permission denied: ${requiredPermission} required`, 403));
      }
      
      next();
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };
};

// Check if user has any of the required roles
export const requireAnyRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.projectId || req.body.project_id;
      
      if (!projectId) {
        return next(new AppError('Project ID is required', 400));
      }
      
      // Check if user is super admin
      if (req.user && req.user.is_super_admin) {
        return next();
      }
      
      // ✅ Vérifier les rôles corporate
      const corporateRoleName = await getCorporateRoleForUser(userId);
      if (corporateRoleName && allowedRoles.includes(corporateRoleName)) {
        return next();
      }
      
      const teamAssignment = await Team.findOne({
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
      
      if (!teamAssignment || !teamAssignment.role) {
        return next(new AppError('You do not have access to this project', 403));
      }
      
      if (allowedRoles.includes(teamAssignment.role.name)) {
        next();
      } else {
        next(new AppError(`Requires one of these roles: ${allowedRoles.join(', ')}`, 403));
      }
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  };
};

// ✅ NOUVEAU: Middleware pour les routes corporate spécifiques
export const requireCorporateDashboard = () => {
  return requireCorporatePermission(PERMISSIONS.CORPORATE_DASHBOARD_VIEW);
};

export const requireCorporateReports = () => {
  return requireCorporatePermission(PERMISSIONS.CORPORATE_REPORTS_VIEW);
};

export const requireCorporateAudit = () => {
  return requireCorporatePermission(PERMISSIONS.CORPORATE_AUDIT_VIEW);
};

export const requireCorporatePolicyManage = () => {
  return requireCorporatePermission(PERMISSIONS.CORPORATE_POLICY_MANAGE);
};

export const requireCorporateCrossBUView = () => {
  return requireCorporatePermission(PERMISSIONS.CORPORATE_CROSS_BU_VIEW);
};

// Export all middleware functions
export default {
  requireProjectPermission,
  requireBUAdminPermission,
  requireAnyRole,
  requireBUPermission,
  requireCorporatePermission,
  requireCorporateDashboard,
  requireCorporateReports,
  requireCorporateAudit,
  requireCorporatePolicyManage,
  requireCorporateCrossBUView
};