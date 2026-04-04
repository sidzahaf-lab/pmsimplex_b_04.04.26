// controllers/teamsController.js
import teamService from '../services/teamsService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all team assignments with filtering and pagination
// @route   GET /api/teams
// @access  Private
export const getAllTeams = asyncHandler(async (req, res, next) => {
  const result = await teamService.getAllTeams(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// @desc    Get team assignment by ID
// @route   GET /api/teams/:id
// @access  Private
export const getTeamById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const team = await teamService.getTeamById(id);
  
  if (!team) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team
    }
  });
});

// @desc    Create team assignment
// @route   POST /api/teams
// @access  Private
export const createTeam = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const teamData = req.body;
  
  console.log('📦 Received team data:', JSON.stringify(teamData, null, 2));
  
  // Validate required fields
  const missingFields = [];
  
  if (!teamData.business_unit_id) missingFields.push('business_unit_id');
  if (!teamData.user_id) missingFields.push('user_id');
  if (!teamData.role_id) missingFields.push('role_id');
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Add assigned_by from authenticated user
  teamData.assigned_by = req.user?.id;
  
  const newTeam = await teamService.createTeam(teamData);
  
  res.status(201).json({
    status: 'success',
    data: {
      team: newTeam
    }
  });
});

// @desc    Update team assignment
// @route   PUT /api/teams/:id
// @access  Private
export const updateTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const teamData = {};
  
  if (req.body.business_unit_id !== undefined) teamData.business_unit_id = req.body.business_unit_id;
  if (req.body.project_id !== undefined) teamData.project_id = req.body.project_id;
  if (req.body.user_id !== undefined) teamData.user_id = req.body.user_id;
  if (req.body.role_id !== undefined) teamData.role_id = req.body.role_id;
  if (req.body.is_active !== undefined) teamData.is_active = req.body.is_active;
  if (req.body.removed_at !== undefined) teamData.removed_at = req.body.removed_at;

  const updatedTeam = await teamService.updateTeam(id, teamData);
  
  if (!updatedTeam) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team: updatedTeam
    }
  });
});

// @desc    Partially update team assignment
// @route   PATCH /api/teams/:id
// @access  Private
export const patchTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const teamData = {};
  
  if (req.body.business_unit_id !== undefined) teamData.business_unit_id = req.body.business_unit_id;
  if (req.body.project_id !== undefined) teamData.project_id = req.body.project_id;
  if (req.body.user_id !== undefined) teamData.user_id = req.body.user_id;
  if (req.body.role_id !== undefined) teamData.role_id = req.body.role_id;
  if (req.body.is_active !== undefined) teamData.is_active = req.body.is_active;
  if (req.body.removed_at !== undefined) teamData.removed_at = req.body.removed_at;

  const updatedTeam = await teamService.updateTeam(id, teamData);
  
  if (!updatedTeam) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team: updatedTeam
    }
  });
});

// @desc    Delete team assignment (soft delete)
// @route   DELETE /api/teams/:id
// @access  Private
export const deleteTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await teamService.deleteTeam(id);
  
  if (!result) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get teams by user
// @route   GET /api/teams/user/:userId
// @access  Private
export const getTeamsByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const result = await teamService.getTeamsByUser(userId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// @desc    Get teams by business unit
// @route   GET /api/teams/business-unit/:businessUnitId
// @access  Private
export const getTeamsByBusinessUnit = asyncHandler(async (req, res, next) => {
  const { businessUnitId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(businessUnitId)) {
    return next(new AppError('Invalid business unit ID format', 400));
  }

  const result = await teamService.getTeamsByBusinessUnit(businessUnitId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// @desc    Get teams by project
// @route   GET /api/teams/project/:projectId
// @access  Private
export const getTeamsByProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return next(new AppError('Invalid project ID format', 400));
  }

  const result = await teamService.getTeamsByProject(projectId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// @desc    Get teams by role
// @route   GET /api/teams/role/:roleId
// @access  Private
export const getTeamsByRole = asyncHandler(async (req, res, next) => {
  const { roleId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(roleId)) {
    return next(new AppError('Invalid role ID format', 400));
  }

  const result = await teamService.getTeamsByRole(roleId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// @desc    Deactivate team assignment
// @route   PATCH /api/teams/:id/deactivate
// @access  Private
export const deactivateTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const team = await teamService.deactivateTeam(id);
  
  if (!team) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team,
      message: 'Team assignment has been deactivated'
    }
  });
});

// @desc    Activate team assignment
// @route   PATCH /api/teams/:id/activate
// @access  Private
export const activateTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid team assignment ID format', 400));
  }

  const team = await teamService.activateTeam(id);
  
  if (!team) {
    return next(new AppError('Team assignment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team,
      message: 'Team assignment has been activated'
    }
  });
});

// @desc    Get active team assignments for a user
// @route   GET /api/teams/user/:userId/active
// @access  Private
export const getActiveTeamsByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const result = await teamService.getActiveTeamsByUser(userId);
  
  res.status(200).json({
    status: 'success',
    results: result.teams.length,
    data: result
  });
});

// =============================================
// NEW ROUTES FOR ROLE CONSISTENCY
// =============================================

// @desc    Get user role summary across all projects
// @route   GET /api/teams/user/:userId/role-summary/:businessUnitId
// @access  Private
export const getUserRoleSummary = asyncHandler(async (req, res, next) => {
  const { userId, businessUnitId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }
  if (!uuidRegex.test(businessUnitId)) {
    return next(new AppError('Invalid business unit ID format', 400));
  }

  const result = await teamService.getUserRoleSummary(userId, businessUnitId);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    Get team statistics
// @route   GET /api/teams/statistics
// @access  Private
export const getTeamStatistics = asyncHandler(async (req, res, next) => {
  const result = await teamService.getTeamStatistics(req.query);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    Get users role consistency across a business unit
// @route   GET /api/teams/users/consistency/:businessUnitId
// @access  Private
export const getUsersRoleConsistency = asyncHandler(async (req, res, next) => {
  const { businessUnitId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(businessUnitId)) {
    return next(new AppError('Invalid business unit ID format', 400));
  }

  const result = await teamService.getUsersRoleConsistency(businessUnitId);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    Bulk create team assignments
// @route   POST /api/teams/bulk
// @access  Private
export const bulkCreateTeams = asyncHandler(async (req, res, next) => {
  const { teams } = req.body;
  
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return next(new AppError('Please provide an array of team assignments', 400));
  }
  
  // Add assigned_by from authenticated user to all teams
  const teamsWithAssigner = teams.map(team => ({
    ...team,
    assigned_by: req.user?.id
  }));
  
  const result = await teamService.bulkCreateTeams(teamsWithAssigner);
  
  res.status(201).json({
    status: 'success',
    data: result
  });
});

export default {
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
};