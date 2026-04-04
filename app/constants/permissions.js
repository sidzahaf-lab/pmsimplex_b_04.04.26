// app/constants/permissions.js
export const PERMISSIONS = {
  // ============================================
  // USER PERMISSIONS
  // ============================================
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // ============================================
  // BUSINESS UNIT PERMISSIONS
  // ============================================
  BU_READ: 'bu:read',
  BU_CREATE: 'bu:create',
  BU_UPDATE: 'bu:update',
  BU_DELETE: 'bu:delete',
  BU_PROJECT_CREATE: 'bu:project:create',
  BU_USER_CREATE: 'bu:user:create',
  BU_ROLE_ASSIGN: 'bu:role:assign',
  
  // ============================================
  // PROJECT PERMISSIONS
  // ============================================
  PROJECT_VIEW: 'project:view',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MEMBERS_MANAGE: 'project:members:manage',
  PROJECT_CREATE: 'project:create',
  
  // ============================================
  // ROLE PERMISSIONS
  // ============================================
  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  
  // ============================================
  // TEAM PERMISSIONS
  // ============================================
  TEAM_READ: 'team:read',
  TEAM_CREATE: 'team:create',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  
  // ============================================
  // DOCUMENT PERMISSIONS
  // ============================================
  DOC_READ: 'doc:read',
  DOC_UPLOAD: 'doc:upload',
  DOC_APPROVE: 'doc:approve',
  DOC_REVISE: 'doc:revise',
  
  // ============================================
  // EVM (Earned Value Management) PERMISSIONS
  // ============================================
  EVM_READ: 'evm:read',
  EVM_INPUT: 'evm:input',
  EVM_KPIS: 'evm:kpis',
  
  // ============================================
  // SCHEDULE/PLANNING PERMISSIONS
  // ============================================
  SCHEDULE_READ: 'schedule:read',
  SCHEDULE_WRITE: 'schedule:write',
  WBS_WRITE: 'wbs:write',
  
  // ============================================
  // ALERT/VALIDATION PERMISSIONS
  // ============================================
  ALERT_VIEW: 'alert:view',
  ALERT_CRITICAL_VALIDATE: 'alert:critical:validate',
  
  // ============================================
  // CORPORATE/GOVERNANCE PERMISSIONS
  // ============================================
  CORPORATE_DASHBOARD_VIEW: 'corporate:dashboard:view',
  CORPORATE_REPORTS_VIEW: 'corporate:reports:view',
  CORPORATE_AUDIT_VIEW: 'corporate:audit:view',
  CORPORATE_POLICY_MANAGE: 'corporate:policy:manage',
  CORPORATE_CROSS_BU_VIEW: 'corporate:cross:bu:view',
  
  // ============================================
  // SUPER ADMIN
  // ============================================
  SUPER_ADMIN_ALL: '*'
};

// Role to Permissions Mapping (Hardcoded)
export const ROLE_PERMISSIONS = {
  // ============================================
  // GUEST ROLE (temporary read-only access)
  // ============================================
  'Guest': [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.DOC_READ,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.ALERT_VIEW
  ],
  
  // ============================================
  // PROJECT LEVEL ROLES
  // ============================================
  'Viewer': [
    PERMISSIONS.DOC_READ,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.ALERT_VIEW
  ],
  
  'Engineer': [
    PERMISSIONS.DOC_READ,
    PERMISSIONS.DOC_UPLOAD,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_INPUT,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.ALERT_VIEW
  ],
  
  'Document Controller': [
    PERMISSIONS.DOC_READ,
    PERMISSIONS.DOC_UPLOAD,
    PERMISSIONS.DOC_APPROVE,
    PERMISSIONS.DOC_REVISE,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.ALERT_VIEW
  ],
  
  'Planning Engineer': [
    PERMISSIONS.DOC_READ,
    PERMISSIONS.DOC_UPLOAD,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_INPUT,
    PERMISSIONS.EVM_KPIS,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.SCHEDULE_WRITE,
    PERMISSIONS.WBS_WRITE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.ALERT_VIEW
  ],
  
  'Project Manager': [
    PERMISSIONS.SUPER_ADMIN_ALL  // Full access at project level
  ],
  
  // ============================================
  // BUSINESS UNIT LEVEL ROLES
  // ============================================
  'BU Manager': [
    PERMISSIONS.BU_READ,
    PERMISSIONS.BU_CREATE,
    PERMISSIONS.BU_UPDATE,
    PERMISSIONS.BU_DELETE,
    PERMISSIONS.BU_PROJECT_CREATE,
    PERMISSIONS.BU_USER_CREATE,
    PERMISSIONS.BU_ROLE_ASSIGN,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_MEMBERS_MANAGE,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.TEAM_READ
  ],
  
  'BU Admin': [
    PERMISSIONS.BU_READ,
    PERMISSIONS.BU_UPDATE,
    PERMISSIONS.BU_PROJECT_CREATE,
    PERMISSIONS.BU_USER_CREATE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.TEAM_READ
  ],
  
  'Director': [
    PERMISSIONS.BU_READ,
    PERMISSIONS.BU_UPDATE,
    PERMISSIONS.BU_DELETE,
    PERMISSIONS.BU_PROJECT_CREATE,
    PERMISSIONS.BU_USER_CREATE,
    PERMISSIONS.BU_ROLE_ASSIGN,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_MEMBERS_MANAGE,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_DELETE
  ],
  
  // ============================================
  // CORPORATE/GOVERNANCE ROLES (Cross-BU)
  // ============================================
  'Executive': [
    PERMISSIONS.CORPORATE_DASHBOARD_VIEW,
    PERMISSIONS.CORPORATE_REPORTS_VIEW,
    PERMISSIONS.CORPORATE_AUDIT_VIEW,
    PERMISSIONS.CORPORATE_CROSS_BU_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.BU_READ,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_KPIS
  ],
  
  'Corporate PMO Officer': [
    PERMISSIONS.CORPORATE_DASHBOARD_VIEW,
    PERMISSIONS.CORPORATE_REPORTS_VIEW,
    PERMISSIONS.CORPORATE_AUDIT_VIEW,
    PERMISSIONS.CORPORATE_POLICY_MANAGE,
    PERMISSIONS.CORPORATE_CROSS_BU_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.BU_READ,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_KPIS,
    PERMISSIONS.SCHEDULE_READ
  ],
  
  'Corporate PMO Analyst': [
    PERMISSIONS.CORPORATE_DASHBOARD_VIEW,
    PERMISSIONS.CORPORATE_REPORTS_VIEW,
    PERMISSIONS.CORPORATE_AUDIT_VIEW,
    PERMISSIONS.CORPORATE_CROSS_BU_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.BU_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.ALERT_VIEW,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_KPIS,
    PERMISSIONS.SCHEDULE_READ
  ],
  
  'Corporate PMO Auditor': [
    PERMISSIONS.CORPORATE_DASHBOARD_VIEW,
    PERMISSIONS.CORPORATE_REPORTS_VIEW,
    PERMISSIONS.CORPORATE_AUDIT_VIEW,
    PERMISSIONS.CORPORATE_CROSS_BU_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.BU_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.ALERT_CRITICAL_VALIDATE,
    PERMISSIONS.EVM_READ,
    PERMISSIONS.EVM_KPIS,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.DOC_READ
  ],
  
  // ============================================
  // SUPER ADMIN
  // ============================================
  'Super Admin': [
    PERMISSIONS.SUPER_ADMIN_ALL
  ]
};

// Helper function to check if user has permission
export const hasPermission = (user, permission, context = null) => {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.is_super_admin) return true;
  
  // Check corporate role (cross-BU governance)
  if (user.corporate_role) {
    const rolePermissions = ROLE_PERMISSIONS[user.corporate_role.name];
    if (rolePermissions && (rolePermissions.includes(permission) || rolePermissions.includes(PERMISSIONS.SUPER_ADMIN_ALL))) {
      return true;
    }
  }
  
  // Check BU role (via team_assignments)
  if (user.bu_role) {
    const rolePermissions = ROLE_PERMISSIONS[user.bu_role];
    if (rolePermissions && (rolePermissions.includes(permission) || rolePermissions.includes(PERMISSIONS.SUPER_ADMIN_ALL))) {
      return true;
    }
  }
  
  // Check default role (suggestion, may not grant permissions)
  // Default role is just a suggestion, not actual permissions
  
  // TODO: Check project-level team assignments
  // This will be implemented when we have the Team model fully integrated
  
  return false;
};

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};