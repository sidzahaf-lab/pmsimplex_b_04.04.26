import userService from '../services/usersService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.users.length,
    data: result
  });
});

// @desc    Check username availability
// @route   GET /api/users/check-username/:username
// @access  Private
export const checkUsernameAvailability = asyncHandler(async (req, res, next) => {
  const { username } = req.params;

  // Validate username format according to model
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
// @access  Private
export const checkEmailAvailability = asyncHandler(async (req, res, next) => {
  const { email } = req.params;

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
// @access  Private
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
// @access  Private
export const createUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const userData = req.body;
  
  // Check for required fields - note: frontend sends 'password', not 'password_hash'
  const requiredFields = ['username', 'password', 'email', 'name', 'family_name', 'title', 'specialty', 'business_unit_id'];
  const missingFields = requiredFields.filter(field => !userData[field]);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  // Map frontend field names to backend field names
  const mappedUserData = {
    username: userData.username,
    password: userData.password, // Will be hashed in service
    email: userData.email,
    phone_number: userData.phone_number || userData.phonenumber,
    name: userData.name,
    family_name: userData.family_name,
    job_title: userData.title,
    department: userData.specialty,
    business_unit_id: userData.business_unit_id,
    is_active: true
  };

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
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // For PUT requests, ensure all required fields are present
  const requiredFields = ['username', 'email', 'name', 'family_name', 'title', 'specialty', 'business_unit_id'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields for PUT operation: ${missingFields.join(', ')}`, 400));
  }

  // Map frontend field names to backend field names
  const mappedUserData = {
    username: req.body.username,
    email: req.body.email,
    phone_number: req.body.phone_number || req.body.phonenumber,
    name: req.body.name,
    family_name: req.body.family_name,
    job_title: req.body.title,
    department: req.body.specialty,
    business_unit_id: req.body.business_unit_id,
    is_active: req.body.is_active
  };

  if (req.body.password) {
    mappedUserData.password = req.body.password;
  }

  Object.keys(mappedUserData).forEach(key => 
    mappedUserData[key] === undefined && delete mappedUserData[key]
  );

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
// @access  Private
export const patchUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const mappedUserData = {};
  
  if (req.body.username !== undefined) mappedUserData.username = req.body.username;
  if (req.body.email !== undefined) mappedUserData.email = req.body.email;
  if (req.body.password !== undefined) mappedUserData.password = req.body.password;
  if (req.body.phone_number !== undefined) mappedUserData.phone_number = req.body.phone_number;
  if (req.body.phonenumber !== undefined) mappedUserData.phone_number = req.body.phonenumber;
  if (req.body.name !== undefined) mappedUserData.name = req.body.name;
  if (req.body.family_name !== undefined) mappedUserData.family_name = req.body.family_name;
  if (req.body.title !== undefined) mappedUserData.job_title = req.body.title;
  if (req.body.specialty !== undefined) mappedUserData.department = req.body.specialty;
  if (req.body.business_unit_id !== undefined) mappedUserData.business_unit_id = req.body.business_unit_id;
  if (req.body.is_active !== undefined) mappedUserData.is_active = req.body.is_active;

  // Validate only the fields that are present
  validateUserData(mappedUserData, next, true);

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
// @access  Private
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
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
// @access  Private
export const getUsersByBusinessUnit = asyncHandler(async (req, res, next) => {
  const { businessUnitId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(businessUnitId)) {
    return next(new AppError('Invalid business unit ID format', 400));
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
// @access  Private
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid user ID format', 400));
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

// Helper function to validate user data
const validateUserData = (data, next, isPatch = false) => {
  if (!isPatch || data.username !== undefined) {
    if (data.username && (data.username.length < 3 || data.username.length > 50)) {
      return next(new AppError('Username must be between 3 and 50 characters', 400));
    }
    if (data.username) {
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
      if (!usernameRegex.test(data.username)) {
        return next(new AppError('Username can only contain letters, numbers, dots, hyphens and underscores', 400));
      }
    }
  }

  if (!isPatch || data.email !== undefined) {
    if (data.email) {
      if (data.email.length > 100) {
        return next(new AppError('Email must not exceed 100 characters', 400));
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return next(new AppError('Please provide a valid email address', 400));
      }
    }
  }

  if (!isPatch || data.password !== undefined) {
    if (data.password && data.password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }
    if (data.password && data.password.length > 128) {
      return next(new AppError('Password must not exceed 128 characters', 400));
    }
  }

  if (!isPatch || data.phone_number !== undefined) {
    if (data.phone_number && data.phone_number.length > 20) {
      return next(new AppError('Phone number must not exceed 20 characters', 400));
    }
  }

  if (!isPatch || data.name !== undefined) {
    if (data.name && (data.name.length < 1 || data.name.length > 50)) {
      return next(new AppError('Name must be between 1 and 50 characters', 400));
    }
  }

  if (!isPatch || data.family_name !== undefined) {
    if (data.family_name && (data.family_name.length < 1 || data.family_name.length > 50)) {
      return next(new AppError('Family name must be between 1 and 50 characters', 400));
    }
  }

  if (!isPatch || data.job_title !== undefined) {
    if (data.job_title && (data.job_title.length < 1 || data.job_title.length > 100)) {
      return next(new AppError('Job title must be between 1 and 100 characters', 400));
    }
  }

  if (!isPatch || data.department !== undefined) {
    if (data.department && data.department.length > 50) {
      return next(new AppError('Department must not exceed 50 characters', 400));
    }
  }

  if (!isPatch || data.business_unit_id !== undefined) {
    if (data.business_unit_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.business_unit_id)) {
        return next(new AppError('Invalid business unit ID format. Must be a valid UUID.', 400));
      }
    }
  }

  if (!isPatch || data.is_active !== undefined) {
    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value', 400));
    }
  }
};

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
  toggleUserStatus
};