// app/controllers/rolesController.js
import roleService from '../services/rolesService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// Valid scopes constant - MATCH YOUR SERVICE
const VALID_SCOPES = ['bu', 'project', 'corporate', 'guest'];

// @desc    Get all roles with filtering and pagination
// @route   GET /api/roles
// @access  Private
export const getAllRoles = asyncHandler(async (req, res, next) => {
  const result = await roleService.getAllRoles(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.roles.length,
    data: result
  });
});

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private
export const getRoleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid role ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const role = await roleService.getRoleById(id);
  
  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      role
    }
  });
});

// @desc    Create role
// @route   POST /api/roles
// @access  Private
export const createRole = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const roleData = req.body;
  
  console.log('📦 Received role data:', JSON.stringify(roleData, null, 2));
  
  // Validate required fields
  const missingFields = [];
  
  if (!roleData.name) missingFields.push('name');
  if (!roleData.scope) missingFields.push('scope');
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // ✅ FIX: Accept all valid scopes
  if (roleData.scope && !VALID_SCOPES.includes(roleData.scope)) {
    return next(new AppError(`Scope must be one of: ${VALID_SCOPES.join(', ')}`, 400));
  }

  const newRole = await roleService.createRole(roleData);
  
  res.status(201).json({
    status: 'success',
    data: {
      role: newRole
    }
  });
});

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private
export const updateRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid role ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const roleData = {};
  
  if (req.body.name !== undefined) roleData.name = req.body.name;
  if (req.body.scope !== undefined) {
    // ✅ FIX: Accept all valid scopes
    if (!VALID_SCOPES.includes(req.body.scope)) {
      return next(new AppError(`Scope must be one of: ${VALID_SCOPES.join(', ')}`, 400));
    }
    roleData.scope = req.body.scope;
  }

  const updatedRole = await roleService.updateRole(id, roleData);
  
  if (!updatedRole) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      role: updatedRole
    }
  });
});

// @desc    Partially update role
// @route   PATCH /api/roles/:id
// @access  Private
export const patchRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid role ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const roleData = {};
  
  if (req.body.name !== undefined) roleData.name = req.body.name;
  if (req.body.scope !== undefined) {
    // ✅ FIX: Accept all valid scopes
    if (!VALID_SCOPES.includes(req.body.scope)) {
      return next(new AppError(`Scope must be one of: ${VALID_SCOPES.join(', ')}`, 400));
    }
    roleData.scope = req.body.scope;
  }

  const updatedRole = await roleService.updateRole(id, roleData);
  
  if (!updatedRole) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      role: updatedRole
    }
  });
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private
export const deleteRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid role ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await roleService.deleteRole(id);
  
  if (!result) {
    return next(new AppError('Role not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get roles by scope
// @route   GET /api/roles/scope/:scope
// @access  Private
export const getRolesByScope = asyncHandler(async (req, res, next) => {
  const { scope } = req.params;
  
  // ✅ FIX: Accept all valid scopes
  if (!VALID_SCOPES.includes(scope)) {
    return next(new AppError(`Scope must be one of: ${VALID_SCOPES.join(', ')}`, 400));
  }

  const result = await roleService.getRolesByScope(scope, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.roles.length,
    data: result
  });
});

// @desc    Check role name availability
// @route   GET /api/roles/check-name/:name
// @access  Private
export const checkRoleNameAvailability = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  // Validate role name format
  if (!name || name.length < 1 || name.length > 50) {
    return next(new AppError('Role name must be between 1 and 50 characters', 400));
  }

  const trimmedName = name.trim();
  
  const isAvailable = await roleService.checkRoleNameAvailability(trimmedName);
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      message: isAvailable ? 'Role name is available' : 'Role name already exists'
    }
  });
});

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  patchRole,
  deleteRole,
  getRolesByScope,
  checkRoleNameAvailability
};