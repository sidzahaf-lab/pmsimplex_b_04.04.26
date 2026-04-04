// app/routes/rolesRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  patchRole,
  deleteRole,
  getRolesByScope,
  checkRoleNameAvailability
} from '../controllers/rolesController.js';

// Import validations
import {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  scopeValidation,
  roleNameValidation
} from '../middleware/rolesValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Import authentication middleware
import { protect, restrictToSuperAdmin } from '../middleware/authJwt.js';

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   GET /api/roles/check-name/:name
 * @desc    Check if role name is available
 * @access  Public
 */
router.get('/check-name/:name', roleNameValidation, checkRoleNameAvailability);

/**
 * @route   GET /api/roles/scope/:scope
 * @desc    Get roles by scope (bu, project, corporate, guest)
 * @access  Public
 */
router.get(
  '/scope/:scope',
  scopeValidation,
  globalValidators.validatePagination,
  getRolesByScope
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below
router.use(protect);

/**
 * @route   GET /api/roles
 * @desc    Get all roles with filtering and pagination
 * @desc    Returns all roles across all scopes (bu, project, corporate, guest)
 * @access  Private (Authenticated users)
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllRoles
);

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @desc    Scope can be: bu, project, corporate, or guest
 * @access  Private (Super Admin only)
 */
router.post(
  '/',
  restrictToSuperAdmin,
  createRoleValidation,
  createRole
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private (Authenticated users)
 */
router.get(
  '/:id',
  roleIdValidation,
  getRoleById
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role (full update)
 * @desc    Can update name and scope
 * @access  Private (Super Admin only)
 */
router.put(
  '/:id',
  restrictToSuperAdmin,
  roleIdValidation,
  updateRoleValidation,
  updateRole
);

/**
 * @route   PATCH /api/roles/:id
 * @desc    Update role (partial update)
 * @desc    Can update name and/or scope
 * @access  Private (Super Admin only)
 */
router.patch(
  '/:id',
  restrictToSuperAdmin,
  roleIdValidation,
  updateRoleValidation,
  patchRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @desc    Will fail if role is in use by any users or teams
 * @access  Private (Super Admin only)
 */
router.delete(
  '/:id',
  restrictToSuperAdmin,
  roleIdValidation,
  deleteRole
);

export default router;