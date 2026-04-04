// app/middleware/usersValidation.js
import { body, param, query } from 'express-validator';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createUserValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, hyphens and underscores'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),

  body('family_name')
    .trim()
    .notEmpty()
    .withMessage('Family name is required')
    .isLength({ max: 50 })
    .withMessage('Family name must not exceed 50 characters'),

  // Accept EITHER title OR job_title (both can't be empty)
  body('title')
    .optional()
    .custom((value, { req }) => {
      // Check if both title and job_title are empty/undefined
      if ((!value || value === '') && (!req.body.job_title || req.body.job_title === '')) {
        throw new Error('Job title is required');
      }
      return true;
    })
    .if((value) => value && value !== '') // Only validate if not empty
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),

  body('job_title')
    .optional()
    .if((value) => value && value !== '') // Only validate if not empty
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),

  // Accept EITHER specialty OR department (both can't be empty)
  body('specialty')
    .optional()
    .custom((value, { req }) => {
      // Check if both specialty and department are empty/undefined
      if ((!value || value === '') && (!req.body.department || req.body.department === '')) {
        throw new Error('Department is required');
      }
      return true;
    })
    .if((value) => value && value !== '') // Only validate if not empty
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must not exceed 50 characters'),

  body('department')
    .optional()
    .if((value) => value && value !== '') // Only validate if not empty
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must not exceed 50 characters'),

  // ============================================
  // BUSINESS UNIT & ROLE VALIDATION - CONDITIONNEL
  // ============================================

  // ✅ CORRECTION : business_unit_id n'est requis que pour les users 'regular'
  body('business_unit_id')
    .optional()
    .custom((value, { req }) => {
      // Pour les utilisateurs 'regular', business_unit_id est OBLIGATOIRE
      if (req.body.user_type === 'regular' && (!value || value === '' || value === 'no-unit')) {
        throw new Error('Business unit is required for regular users');
      }
      // Si business_unit_id est fourni, vérifier que c'est un UUID valide
      if (value && value !== '' && value !== 'no-unit') {
        if (!uuidRegex.test(value)) {
          throw new Error('Business unit ID must be a valid UUID');
        }
      }
      return true;
    }),

  // ✅ AJOUT : corporate_role_id n'est requis que pour les users 'corporate'
  body('corporate_role_id')
    .optional()
    .custom((value, { req }) => {
      // Pour les utilisateurs 'corporate', corporate_role_id est OBLIGATOIRE
      if (req.body.user_type === 'corporate' && (!value || value === '')) {
        throw new Error('Corporate role is required for corporate users');
      }
      // Si une valeur est fournie, vérifier que c'est un UUID valide
      if (value && value !== '') {
        if (!uuidRegex.test(value)) {
          throw new Error('Corporate role ID must be a valid UUID');
        }
      }
      return true;
    }),

  // default_role_id - optionnel pour tous
  body('default_role_id')
    .optional()
    .custom((value) => {
      if (value && value !== '') {
        if (!uuidRegex.test(value)) {
          throw new Error('Default role ID must be a valid UUID');
        }
      }
      return true;
    }),

  // is_super_admin - optional, defaults to false (only app creator)
  body('is_super_admin')
    .optional()
    .isBoolean()
    .withMessage('is_super_admin must be a boolean value'),

  // is_guest - optional, defaults to false (time-limited read-only access)
  body('is_guest')
    .optional()
    .isBoolean()
    .withMessage('is_guest must be a boolean value'),

  // user_type - validation
  body('user_type')
    .optional()
    .isIn(['regular', 'guest', 'corporate'])
    .withMessage('User type must be regular, guest, or corporate'),

  // Handle phone_number
  body('phone_number')
    .optional()
    .customSanitizer(value => {
      if (value === '') {
        return undefined;
      }
      return value;
    })
    .if((value) => value !== undefined)
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),

  body('phonenumber')
    .optional()
    .customSanitizer(value => {
      if (value === '') {
        return undefined;
      }
      return value;
    })
    .if((value) => value !== undefined)
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number')
];

export const updateUserValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, hyphens and underscores'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),

  body('family_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Family name must not exceed 50 characters'),

  body('title')
    .optional()
    .if((value) => value && value !== '')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),

  body('job_title')
    .optional()
    .if((value) => value && value !== '')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),

  body('specialty')
    .optional()
    .if((value) => value && value !== '')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must not exceed 50 characters'),

  body('department')
    .optional()
    .if((value) => value && value !== '')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must not exceed 50 characters'),

  body('business_unit_id')
    .optional()
    .isUUID()
    .withMessage('Business unit ID must be a valid UUID'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  // ============================================
  // ROLE HIERARCHY FIELDS
  // ============================================

  // is_super_admin - optional, only super admin can set this
  body('is_super_admin')
    .optional()
    .isBoolean()
    .withMessage('is_super_admin must be a boolean value'),

  // is_guest - optional, only super admin can set this
  body('is_guest')
    .optional()
    .isBoolean()
    .withMessage('is_guest must be a boolean value'),

  // corporate_role_id - optional, UUID reference to corporate role
  body('corporate_role_id')
    .optional()
    .isUUID()
    .withMessage('corporate_role_id must be a valid UUID'),

  // default_role_id - optional, UUID reference to default role (suggestion only)
  body('default_role_id')
    .optional()
    .isUUID()
    .withMessage('default_role_id must be a valid UUID'),

  body('phone_number')
    .optional()
    .customSanitizer(value => {
      if (value === '') {
        return undefined;
      }
      return value;
    })
    .if((value) => value !== undefined)
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),

  body('phonenumber')
    .optional()
    .customSanitizer(value => {
      if (value === '') {
        return undefined;
      }
      return value;
    })
    .if((value) => value !== undefined)
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number')
];

export const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID')
];

export const toggleUserStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID')
];

export const deactivateUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .matches(uuidRegex)
    .withMessage('Invalid user ID format. Must be a valid UUID')
];

export const activateUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .matches(uuidRegex)
    .withMessage('Invalid user ID format. Must be a valid UUID')
];

export const businessUnitUsersValidation = [
  param('businessUnitId')
    .isUUID()
    .withMessage('Invalid business unit ID')
];

// Validation for user statistics (admin only)
export const userStatisticsValidation = [
  // No params needed, but could add query filters in future
];

// Validation for user search
export const userSearchValidation = [
  query('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  query('business_unit_id')
    .optional()
    .isUUID()
    .withMessage('Invalid business unit ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for bulk user operations
export const bulkUserOperationValidation = [
  body('userIds')
    .isArray()
    .withMessage('userIds must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('At least one user ID is required');
      }
      return true;
    }),
  
  body('userIds.*')
    .isUUID()
    .withMessage('Each user ID must be a valid UUID'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Action must be activate, deactivate, or delete')
];