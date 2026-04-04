// routes/teamsRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  patchTeam,
  deleteTeam,
  getTeamsByUser,
  getTeamsByBusinessUnit,
  getTeamsByProject,
  getTeamsByRole,
  deactivateTeam,
  activateTeam,
  getActiveTeamsByUser,
  getUserRoleSummary,
  getTeamStatistics,
  getUsersRoleConsistency,
  bulkCreateTeams
} from '../controllers/teamsController.js';

// Import validations
import {
  createTeamValidation,
  updateTeamValidation,
  teamIdValidation,
  userIdValidation,
  businessUnitIdValidation,
  projectIdValidation,
  roleIdValidation,
  deactivateTeamValidation,
  activateTeamValidation,
  activeTeamsByUserValidation
} from '../middleware/teamsValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   GET /api/teams/user/:userId/active
 * @desc    Get active team assignments for a user
 * @access  Public
 */
router.get(
  '/user/:userId/active',
  activeTeamsByUserValidation,
  getActiveTeamsByUser
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/teams
 * @desc    Get all team assignments with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllTeams
);

/**
 * @route   POST /api/teams
 * @desc    Create a new team assignment
 * @access  Private
 */
router.post(
  '/',
  createTeamValidation,
  createTeam
);

/**
 * @route   GET /api/teams/user/:userId
 * @desc    Get team assignments by user ID
 * @access  Private
 */
router.get(
  '/user/:userId',
  userIdValidation,
  globalValidators.validatePagination,
  getTeamsByUser
);

/**
 * @route   GET /api/teams/user/:userId/role-summary/:businessUnitId
 * @desc    Get user role summary across all projects (for consistency check)
 * @access  Private
 */
router.get(
  '/user/:userId/role-summary/:businessUnitId',
  userIdValidation,
  businessUnitIdValidation,
  getUserRoleSummary
);

/**
 * @route   GET /api/teams/business-unit/:businessUnitId
 * @desc    Get team assignments by business unit ID
 * @access  Private
 */
router.get(
  '/business-unit/:businessUnitId',
  businessUnitIdValidation,
  globalValidators.validatePagination,
  getTeamsByBusinessUnit
);

/**
 * @route   GET /api/teams/project/:projectId
 * @desc    Get team assignments by project ID
 * @access  Private
 */
router.get(
  '/project/:projectId',
  projectIdValidation,
  globalValidators.validatePagination,
  getTeamsByProject
);

/**
 * @route   GET /api/teams/role/:roleId
 * @desc    Get team assignments by role ID
 * @access  Private
 */
router.get(
  '/role/:roleId',
  roleIdValidation,
  globalValidators.validatePagination,
  getTeamsByRole
);

/**
 * @route   GET /api/teams/statistics
 * @desc    Get team statistics
 * @access  Private
 */
router.get(
  '/statistics',
  globalValidators.validatePagination,
  getTeamStatistics
);

/**
 * @route   GET /api/teams/users/consistency/:businessUnitId
 * @desc    Get users role consistency across a business unit
 * @access  Private
 */
router.get(
  '/users/consistency/:businessUnitId',
  businessUnitIdValidation,
  getUsersRoleConsistency
);

/**
 * @route   POST /api/teams/bulk
 * @desc    Bulk create team assignments
 * @access  Private
 */
router.post(
  '/bulk',
  bulkCreateTeams
);

/**
 * @route   PATCH /api/teams/:id/deactivate
 * @desc    Deactivate a team assignment
 * @access  Private
 */
router.patch(
  '/:id/deactivate',
  deactivateTeamValidation,
  deactivateTeam
);

/**
 * @route   PATCH /api/teams/:id/activate
 * @desc    Activate a team assignment
 * @access  Private
 */
router.patch(
  '/:id/activate',
  activateTeamValidation,
  activateTeam
);

/**
 * @route   GET /api/teams/:id
 * @desc    Get team assignment by ID
 * @access  Private
 */
router.get(
  '/:id',
  teamIdValidation,
  getTeamById
);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team assignment (full update)
 * @access  Private
 */
router.put(
  '/:id',
  teamIdValidation,
  updateTeamValidation,
  updateTeam
);

/**
 * @route   PATCH /api/teams/:id
 * @desc    Update team assignment (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  teamIdValidation,
  updateTeamValidation,
  patchTeam
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team assignment (hard delete)
 * @access  Private
 */
router.delete(
  '/:id',
  teamIdValidation,
  deleteTeam
);

export default router;