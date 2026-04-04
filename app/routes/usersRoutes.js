// app/routes/usersRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUserProfile,
  checkUsernameAvailability,
  checkEmailAvailability,
  getUsersByBusinessUnit,
  toggleUserStatus,
  deactivateUser,
  activateUser
} from '../controllers/usersController.js';

// Import validations
import {
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  toggleUserStatusValidation,
  businessUnitUsersValidation,
  deactivateUserValidation,
  activateUserValidation
} from '../middleware/usersValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Import authentication middleware - FIXED IMPORT PATH
import { protect, restrictToSuperAdmin } from '../middleware/authJwt.js';
import { requireBUPermission } from '../middleware/permissionMiddleware.js';
import { PERMISSIONS } from '../constants/permissions.js';

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   GET /api/users/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username/:username', checkUsernameAvailability);

/**
 * @route   GET /api/users/check-email/:email
 * @desc    Check if email is available
 * @access  Public
 */
router.get('/check-email/:email', checkEmailAvailability);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below
router.use(protect);

// =============================================
// USER PROFILE ROUTES
// =============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (Authenticated users)
 */
router.get('/profile', getUserProfile);

// =============================================
// BUSINESS UNIT USERS ROUTES
// =============================================

/**
 * @route   GET /api/users/business-unit/:businessUnitId
 * @desc    Get users by business unit ID with pagination
 * @access  Private (Super Admin or users with BU read permission)
 */
router.get(
  '/business-unit/:businessUnitId',
  businessUnitUsersValidation,
  requireBUPermission(PERMISSIONS.BU_READ),
  globalValidators.validatePagination,
  getUsersByBusinessUnit
);

// =============================================
// USER LIST ROUTES
// =============================================

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Super Admin sees all, regular users see only their BU)
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllUsers
);

// =============================================
// USER MANAGEMENT ROUTES (Super Admin only)
// =============================================

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @desc    Role hierarchy fields can be set:
 *          - is_super_admin: false (only app creator)
 *          - is_guest: false (guest users have time-limited access)
 *          - corporate_role_id: UUID (for cross-BU governance roles)
 *          - default_role_id: UUID (job position suggestion, no permissions)
 * @access  Private (Super Admin only)
 */
router.post(
  '/',
  restrictToSuperAdmin,
  createUserValidation,
  createUser
);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @desc    When deactivating, all sessions are revoked
 * @access  Private (Super Admin only)
 */
router.patch(
  '/:id/toggle-status',
  restrictToSuperAdmin,
  toggleUserStatusValidation,
  toggleUserStatus
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user and revoke all sessions
 * @desc    For guest users, this also prevents future access
 * @access  Private (Super Admin only)
 */
router.patch(
  '/:id/deactivate',
  restrictToSuperAdmin,
  deactivateUserValidation,
  deactivateUser
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user
 * @desc    Reactivates a previously deactivated user
 * @access  Private (Super Admin only)
 */
router.patch(
  '/:id/activate',
  restrictToSuperAdmin,
  activateUserValidation,
  activateUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (full update)
 * @desc    Can update role hierarchy fields:
 *          - is_super_admin (only super admin can set)
 *          - is_guest (only super admin can set)
 *          - corporate_role_id (only super admin can set)
 *          - default_role_id (only super admin can set)
 * @access  Private (Super Admin only)
 */
router.put(
  '/:id',
  restrictToSuperAdmin,
  updateUserValidation,
  updateUser
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user (partial update)
 * @desc    Can update role hierarchy fields:
 *          - is_super_admin (only super admin can set)
 *          - is_guest (only super admin can set)
 *          - corporate_role_id (only super admin can set)
 *          - default_role_id (only super admin can set)
 * @access  Private (Super Admin only)
 */
router.patch(
  '/:id',
  restrictToSuperAdmin,
  updateUserValidation,
  patchUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (hard delete)
 * @desc    Will fail if user has active sessions (sessions must be revoked first)
 * @access  Private (Super Admin only)
 */
router.delete(
  '/:id',
  restrictToSuperAdmin,
  userIdValidation,
  deleteUser
);

// =============================================
// USER DETAIL ROUTES (With permission checks)
// =============================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @desc    Returns full user profile including role hierarchy fields:
 *          - is_super_admin, is_guest, corporate_role_id, default_role_id
 * @access  Private (Super Admin or the user themselves)
 */
router.get(
  '/:id',
  userIdValidation,
  getUserById
);

export default router;