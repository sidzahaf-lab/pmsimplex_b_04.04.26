// app/controllers/usersController.js
import userService from '../services/usersService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private (Super Admin only for full list, regular users see limited)
export const getAllUsers = asyncHandler(async (req, res, next) => {
  // Regular users can only see users in their business unit
  const isSuperAdmin = req.user?.is_super_admin;
  const businessUnitId = !isSuperAdmin ? req.user?.business_unit_id : undefined;
  
  const result = await userService.getAllUsers(req.query, businessUnitId, isSuperAdmin);
  
  res.status(200).json({
    status: 'success',
    results: result.users.length,
    data: result
  });
});

// @desc    Check username availability
// @route   GET /api/users/check-username/:username
// @access  Public
export const checkUsernameAvailability = asyncHandler(async (req, res, next) => {
  const { username } = req.params;

  // Validate username format
  if (!username || username.length < 3 || username.length > 50) {
    return next(new AppError('Username must be between 3 and 50 characters', 400));
  }

  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!usernameRegex.test(username)) {
    return next(new AppError('Username can only contain letters, numbers, dots, hyphens and underscores', 400));
  }

  const trimmedUsername = username.trim();
  
  const isAvailable = await userService.checkUsernameAvailability(trimmedUsername);
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username already exists'
    }
  });
});

// @desc    Check email availability
// @route   GET /api/users/check-email/:email
// @access  Public
export const checkEmailAvailability = asyncHandler(async (req, res, next) => {
  const { email } = req.params;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  if (email.length > 100) {
    return next(new AppError('Email must not exceed 100 characters', 400));
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  const isAvailable = await userService.checkEmailAvailability(normalizedEmail);
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email already exists'
    }
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return next(new AppError('Authentication required', 401));
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const user = await userService.getUserById(userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Super Admin or self)
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if user is requesting their own data or is super admin
  const isSuperAdmin = req.user?.is_super_admin;
  const isSelf = req.user?.id === id;
  
  if (!isSuperAdmin && !isSelf) {
    return next(new AppError('You do not have permission to view this user', 403));
  }

  const user = await userService.getUserById(id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const { password_hash, ...userWithoutPassword } = user.toJSON ? user.toJSON() : user;

  res.status(200).json({
    status: 'success',
    data: {
      user: userWithoutPassword
    }
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Super Admin only)
export const createUser = asyncHandler(async (req, res, next) => {
  // Check if user is super admin
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can create users', 403));
  }

  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const userData = req.body;
  
  console.log('📦 Received user data:', JSON.stringify(userData, null, 2));
  
  // Prevent creating another super admin if not allowed
  if (userData.is_super_admin === true) {
    console.log('⚠️ Attempt to create super admin user by:', req.user.email);
  }
  
  // Map frontend field names to backend field names
  const mappedUserData = {
    username: userData.username,
    password: userData.password,
    email: userData.email,
    phone_number: userData.phone_number || userData.phonenumber,
    name: userData.name,
    family_name: userData.family_name,
    job_title: userData.job_title || userData.title,
    department: userData.department || userData.specialty,
    business_unit_id: userData.business_unit_id,
    is_active: true,
    // Role hierarchy fields
    is_super_admin: userData.is_super_admin || false,
    is_guest: userData.is_guest || false,
    corporate_role_id: userData.corporate_role_id || null,
    default_role_id: userData.default_role_id || null
  };

  console.log('🔄 Mapped user data:', JSON.stringify(mappedUserData, null, 2));

  // ✅ CORRECTION : Validation conditionnelle des champs requis
  const missingFields = [];
  
  if (!userData.username) missingFields.push('username');
  if (!userData.password) missingFields.push('password');
  if (!userData.email) missingFields.push('email');
  if (!userData.name) missingFields.push('name');
  if (!userData.family_name) missingFields.push('family_name');
  
  // Check for job title - accept either job_title or title
  if (!userData.job_title && !userData.title) {
    missingFields.push('job_title/title');
  }
  
  // Check for department - accept either department or specialty
  if (!userData.department && !userData.specialty) {
    missingFields.push('department/specialty');
  }
  
  // ✅ business_unit_id requis UNIQUEMENT pour les users 'regular'
  if (userData.user_type === 'regular' && !userData.business_unit_id) {
    missingFields.push('business_unit_id');
  }
  
  // ✅ corporate_role_id requis UNIQUEMENT pour les users 'corporate'
  if (userData.user_type === 'corporate' && !userData.corporate_role_id) {
    missingFields.push('corporate_role_id');
  }
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  const newUser = await userService.createUser(mappedUserData);
  
  const { password_hash, ...userWithoutPassword } = newUser.toJSON ? newUser.toJSON() : newUser;

  res.status(201).json({
    status: 'success',
    data: {
      user: userWithoutPassword
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Super Admin only)
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can update users
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can update users', 403));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Prevent demoting yourself from super admin
  if (id === req.user.id && req.body.is_super_admin === false) {
    return next(new AppError('You cannot remove your own super admin status', 403));
  }

  // Map frontend field names to backend expected field names
  const mappedUserData = {};
  
  // Basic fields
  if (req.body.username !== undefined) mappedUserData.username = req.body.username;
  if (req.body.email !== undefined) mappedUserData.email = req.body.email;
  if (req.body.password !== undefined) mappedUserData.password = req.body.password;
  if (req.body.phone_number !== undefined) mappedUserData.phone_number = req.body.phone_number;
  if (req.body.phonenumber !== undefined) mappedUserData.phone_number = req.body.phonenumber;
  if (req.body.name !== undefined) mappedUserData.name = req.body.name;
  if (req.body.family_name !== undefined) mappedUserData.family_name = req.body.family_name;
  if (req.body.title !== undefined) mappedUserData.job_title = req.body.title;
  if (req.body.job_title !== undefined) mappedUserData.job_title = req.body.job_title;
  if (req.body.specialty !== undefined) mappedUserData.department = req.body.specialty;
  if (req.body.department !== undefined) mappedUserData.department = req.body.department;
  if (req.body.business_unit_id !== undefined) mappedUserData.business_unit_id = req.body.business_unit_id;
  if (req.body.is_active !== undefined) mappedUserData.is_active = req.body.is_active;
  
  // Role hierarchy fields
  if (req.body.is_super_admin !== undefined) mappedUserData.is_super_admin = req.body.is_super_admin;
  if (req.body.is_guest !== undefined) mappedUserData.is_guest = req.body.is_guest;
  if (req.body.corporate_role_id !== undefined) mappedUserData.corporate_role_id = req.body.corporate_role_id;
  if (req.body.default_role_id !== undefined) mappedUserData.default_role_id = req.body.default_role_id;

  const updatedUser = await userService.updateUser(id, mappedUserData);
  
  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  const { password_hash, ...userWithoutPassword } = updatedUser.toJSON ? updatedUser.toJSON() : updatedUser;

  res.status(200).json({
    status: 'success',
    data: {
      user: userWithoutPassword
    }
  });
});

// @desc    Partially update user
// @route   PATCH /api/users/:id
// @access  Private (Super Admin only)
export const patchUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can patch users
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can update users', 403));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Prevent demoting yourself from super admin
  if (id === req.user.id && req.body.is_super_admin === false) {
    return next(new AppError('You cannot remove your own super admin status', 403));
  }

  // Map frontend field names to backend expected field names
  const mappedUserData = {};
  
  // Basic fields
  if (req.body.username !== undefined) mappedUserData.username = req.body.username;
  if (req.body.email !== undefined) mappedUserData.email = req.body.email;
  if (req.body.password !== undefined) mappedUserData.password = req.body.password;
  if (req.body.phone_number !== undefined) mappedUserData.phone_number = req.body.phone_number;
  if (req.body.phonenumber !== undefined) mappedUserData.phone_number = req.body.phonenumber;
  if (req.body.name !== undefined) mappedUserData.name = req.body.name;
  if (req.body.family_name !== undefined) mappedUserData.family_name = req.body.family_name;
  if (req.body.title !== undefined) mappedUserData.job_title = req.body.title;
  if (req.body.job_title !== undefined) mappedUserData.job_title = req.body.job_title;
  if (req.body.specialty !== undefined) mappedUserData.department = req.body.specialty;
  if (req.body.department !== undefined) mappedUserData.department = req.body.department;
  if (req.body.business_unit_id !== undefined) mappedUserData.business_unit_id = req.body.business_unit_id;
  if (req.body.is_active !== undefined) mappedUserData.is_active = req.body.is_active;
  
  // Role hierarchy fields
  if (req.body.is_super_admin !== undefined) mappedUserData.is_super_admin = req.body.is_super_admin;
  if (req.body.is_guest !== undefined) mappedUserData.is_guest = req.body.is_guest;
  if (req.body.corporate_role_id !== undefined) mappedUserData.corporate_role_id = req.body.corporate_role_id;
  if (req.body.default_role_id !== undefined) mappedUserData.default_role_id = req.body.default_role_id;

  const updatedUser = await userService.updateUser(id, mappedUserData);
  
  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  const { password_hash, ...userWithoutPassword } = updatedUser.toJSON ? updatedUser.toJSON() : updatedUser;

  res.status(200).json({
    status: 'success',
    data: {
      user: userWithoutPassword
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin only)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can delete users
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can delete users', 403));
  }

  // Prevent deleting yourself
  if (id === req.user.id) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await userService.deleteUser(id);
  
  if (!result) {
    return next(new AppError('User not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get users by business unit
// @route   GET /api/users/business-unit/:businessUnitId
// @access  Private (Super Admin or BU Manager)
export const getUsersByBusinessUnit = asyncHandler(async (req, res, next) => {
  const { businessUnitId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(businessUnitId)) {
    return next(new AppError('Invalid business unit ID format', 400));
  }

  // Check if user has access to this business unit
  const isSuperAdmin = req.user?.is_super_admin;
  const isInBusinessUnit = req.user?.business_unit_id === businessUnitId;
  
  if (!isSuperAdmin && !isInBusinessUnit) {
    return next(new AppError('You do not have access to this business unit', 403));
  }

  const result = await userService.getUsersByBusinessUnit(businessUnitId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.users.length,
    data: result
  });
});

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Super Admin only)
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can toggle user status
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can toggle user status', 403));
  }

  // Prevent toggling your own status
  if (id === req.user.id) {
    return next(new AppError('You cannot toggle your own account status', 400));
  }

  const user = await userService.toggleUserStatus(id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      message: `User has been ${user.is_active ? 'activated' : 'deactivated'}`
    }
  });
});

// @desc    Deactivate user (with session cleanup)
// @route   PATCH /api/users/:id/deactivate
// @access  Private (Super Admin only)
export const deactivateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can deactivate users
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can deactivate users', 403));
  }

  // Prevent deactivating yourself
  if (id === req.user.id) {
    return next(new AppError('You cannot deactivate your own account', 400));
  }

  const user = await userService.deactivateUser(id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      message: 'User has been deactivated and all sessions revoked'
    }
  });
});

// @desc    Activate user
// @route   PATCH /api/users/:id/activate
// @access  Private (Super Admin only)
export const activateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  // Only super admin can activate users
  if (!req.user?.is_super_admin) {
    return next(new AppError('Only super administrators can activate users', 403));
  }

  const user = await userService.activateUser(id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      message: 'User has been reactivated'
    }
  });
});

export default {
  getAllUsers,
  checkUsernameAvailability,
  checkEmailAvailability,
  getUserProfile,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUsersByBusinessUnit,
  toggleUserStatus,
  deactivateUser,
  activateUser
};