// src/middleware/emissionPolicyValidation.js
import { body, param, query, validationResult } from 'express-validator';

// Helper to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        location: err.location,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Reusable UUID validator
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Reusable date validator
const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};

export const createEmissionPolicyValidation = [
  param('projectId')
    .custom(isValidUUID)
    .withMessage('Invalid project ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Project ID is required'),

  body('frequency')
    .notEmpty()
    .withMessage('Frequency is required')
    .isIn(['daily', 'weekly', 'monthly']) // Updated to match database ENUM
    .withMessage('Frequency must be daily, weekly, or monthly'),

  body('anchor_date')
    .notEmpty()
    .withMessage('Anchor date is required')
    .custom(isValidDate)
    .withMessage('Anchor date must be a valid date in YYYY-MM-DD format'),

  body('anchor_day')
    .optional()
    .custom((value, { req }) => {
      const frequency = req.body.frequency;
      
      if (frequency === 'weekly') {
        // Weekly requires anchor_day between 1-7
        if (value === undefined || value === null) {
          throw new Error('Anchor day is required for weekly frequency');
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 7) {
          throw new Error('Anchor day must be between 1 (Monday) and 7 (Sunday) for weekly frequency');
        }
      } else if (frequency === 'monthly') {
        // Monthly can accept 0 as a special value, or null
        if (value !== undefined && value !== null && value !== 0 && value !== '0') {
          throw new Error('Anchor day must be null or 0 for monthly frequency');
        }
        // Convert "0" to 0 if needed
        if (value === '0') {
          req.body.anchor_day = 0;
        }
      } else if (frequency === 'daily') {
        // Daily must have null anchor_day
        if (value !== undefined && value !== null) {
          throw new Error('Anchor day must be null for daily frequency');
        }
      }
      
      return true;
    })
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Description must not exceed 250 characters'),

  // Validate doc_type_ids array
  body('doc_type_ids')
    .optional()
    .isArray()
    .withMessage('doc_type_ids must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const invalidIds = value.filter(id => !isValidUUID(id));
        if (invalidIds.length > 0) {
          throw new Error(`Invalid UUID format in doc_type_ids: ${invalidIds.join(', ')}`);
        }
      }
      return true;
    }),

  // Validate periods array from frontend
  body('periods')
    .optional()
    .isArray()
    .withMessage('periods must be an array')
    .custom((value) => {
      if (!value) return true;
      
      if (value.length > 1000) {
        throw new Error('Too many periods. Maximum is 1000.');
      }
      
      const periodErrors = [];
      
      value.forEach((period, index) => {
        // Check required fields
        if (!period.period_label) {
          periodErrors.push(`Period at index ${index}: period_label is required`);
        }
        if (!period.period_start) {
          periodErrors.push(`Period at index ${index}: period_start is required`);
        }
        if (!period.period_end) {
          periodErrors.push(`Period at index ${index}: period_end is required`);
        }
        if (!period.expected_at) {
          periodErrors.push(`Period at index ${index}: expected_at is required`);
        }
        
        // Validate date formats
        if (period.period_start && !isValidDate(period.period_start)) {
          periodErrors.push(`Period at index ${index}: period_start must be a valid date`);
        }
        if (period.period_end && !isValidDate(period.period_end)) {
          periodErrors.push(`Period at index ${index}: period_end must be a valid date`);
        }
        if (period.expected_at && !isValidDate(period.expected_at)) {
          periodErrors.push(`Period at index ${index}: expected_at must be a valid date`);
        }
        
        // Validate date order
        if (period.period_start && period.period_end) {
          const start = new Date(period.period_start);
          const end = new Date(period.period_end);
          if (end <= start) {
            periodErrors.push(`Period at index ${index}: period_end must be after period_start`);
          }
        }
        
        if (period.expected_at && period.period_end) {
          const expected = new Date(period.expected_at);
          const end = new Date(period.period_end);
          if (expected <= end) {
            periodErrors.push(`Period at index ${index}: expected_at must be after period_end`);
          }
        }
      });
      
      if (periodErrors.length > 0) {
        throw new Error(periodErrors.join('; '));
      }
      
      return true;
    }),

  // Validate at least one of doc_type_ids or periods is provided
  body().custom((value, { req }) => {
    if (!req.body.doc_type_ids && !req.body.periods) {
      throw new Error('Either doc_type_ids or periods must be provided');
    }
    return true;
  }),

  handleValidationErrors
];

export const updateEmissionPolicyValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid emission policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly']) // Updated to match database ENUM
    .withMessage('Frequency must be daily, weekly, or monthly'),

  body('anchor_date')
    .optional()
    .custom(isValidDate)
    .withMessage('Anchor date must be a valid date in YYYY-MM-DD format'),

  body('anchor_day')
    .optional()
    .custom((value, { req }) => {
      const frequency = req.body.frequency;
      
      // Only validate if frequency is being updated
      if (frequency) {
        if (frequency === 'weekly') {
          // Weekly requires anchor_day between 1-7
          if (value === undefined || value === null) {
            throw new Error('Anchor day is required for weekly frequency');
          }
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 1 || numValue > 7) {
            throw new Error('Anchor day must be between 1 (Monday) and 7 (Sunday) for weekly frequency');
          }
        } else if (frequency === 'monthly') {
          // Monthly can accept 0 as a special value, or null
          if (value !== undefined && value !== null && value !== 0 && value !== '0') {
            throw new Error('Anchor day must be null or 0 for monthly frequency');
          }
          // Convert "0" to 0 if needed
          if (value === '0') {
            req.body.anchor_day = 0;
          }
        } else if (frequency === 'daily') {
          // Daily must have null anchor_day
          if (value !== undefined && value !== null) {
            throw new Error('Anchor day must be null for daily frequency');
          }
        }
      } else {
        // If frequency is not being updated, we can't validate based on it
        // So we accept any value and let the model validation handle it
        return true;
      }
      
      return true;
    })
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Description must not exceed 250 characters'),

  // Validate doc_type_ids if provided
  body('doc_type_ids')
    .optional()
    .isArray()
    .withMessage('doc_type_ids must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const invalidIds = value.filter(id => !isValidUUID(id));
        if (invalidIds.length > 0) {
          throw new Error(`Invalid UUID format in doc_type_ids: ${invalidIds.join(', ')}`);
        }
      }
      return true;
    }),

  // Validate periods array if provided
  body('periods')
    .optional()
    .isArray()
    .withMessage('periods must be an array')
    .custom((value) => {
      if (!value) return true;
      
      if (value.length > 1000) {
        throw new Error('Too many periods. Maximum is 1000.');
      }
      
      const periodErrors = [];
      
      value.forEach((period, index) => {
        // Check required fields
        if (!period.period_label) {
          periodErrors.push(`Period at index ${index}: period_label is required`);
        }
        if (!period.period_start) {
          periodErrors.push(`Period at index ${index}: period_start is required`);
        }
        if (!period.period_end) {
          periodErrors.push(`Period at index ${index}: period_end is required`);
        }
        if (!period.expected_at) {
          periodErrors.push(`Period at index ${index}: expected_at is required`);
        }
        
        // Validate date formats
        if (period.period_start && !isValidDate(period.period_start)) {
          periodErrors.push(`Period at index ${index}: period_start must be a valid date`);
        }
        if (period.period_end && !isValidDate(period.period_end)) {
          periodErrors.push(`Period at index ${index}: period_end must be a valid date`);
        }
        if (period.expected_at && !isValidDate(period.expected_at)) {
          periodErrors.push(`Period at index ${index}: expected_at must be a valid date`);
        }
        
        // Validate date order
        if (period.period_start && period.period_end) {
          const start = new Date(period.period_start);
          const end = new Date(period.period_end);
          if (end <= start) {
            periodErrors.push(`Period at index ${index}: period_end must be after period_start`);
          }
        }
        
        if (period.expected_at && period.period_end) {
          const expected = new Date(period.expected_at);
          const end = new Date(period.period_end);
          if (expected <= end) {
            periodErrors.push(`Period at index ${index}: expected_at must be after period_end`);
          }
        }
      });
      
      if (periodErrors.length > 0) {
        throw new Error(periodErrors.join('; '));
      }
      
      return true;
    }),

  // Custom validation to ensure at least one field is being updated
  body().custom((value, { req }) => {
    const updateFields = ['frequency', 'anchor_date', 'anchor_day', 'description', 'doc_type_ids', 'periods'];
    const hasUpdateFields = updateFields.some(field => req.body[field] !== undefined);
    
    if (!hasUpdateFields) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  }),

  handleValidationErrors
];

export const emissionPolicyIdValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid emission policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  handleValidationErrors
];

// Validation for getting policy periods
export const policyPeriodsValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  query('include_revisions')
    .optional()
    .isBoolean()
    .withMessage('include_revisions must be a boolean')
    .toBoolean(),

  handleValidationErrors
];

// Validation for getting periods with revision status
export const policyPeriodsWithStatusValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  handleValidationErrors
];

export const projectEmissionPoliciesValidation = [
  param('projectId')
    .custom(isValidUUID)
    .withMessage('Invalid project ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Project ID is required'),

  query('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly']) // Updated to match database ENUM
    .withMessage('Frequency must be daily, weekly, or monthly'),

  query('from_date')
    .optional()
    .custom(isValidDate)
    .withMessage('From date must be a valid date'),

  query('to_date')
    .optional()
    .custom(isValidDate)
    .withMessage('To date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.from_date && value && value < req.query.from_date) {
        throw new Error('To date must be after from date');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  handleValidationErrors
];

export const generatePeriodsValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid emission policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  body('project_end_date')
    .notEmpty()
    .withMessage('Project end date is required')
    .custom(isValidDate)
    .withMessage('Project end date must be a valid date')
    .custom((value, { req }) => {
      // This will be checked in service after fetching the policy
      return true;
    }),

  handleValidationErrors
];

export default {
  createEmissionPolicyValidation,
  updateEmissionPolicyValidation,
  emissionPolicyIdValidation,
  policyPeriodsValidation,
  policyPeriodsWithStatusValidation,
  projectEmissionPoliciesValidation,
  generatePeriodsValidation
};