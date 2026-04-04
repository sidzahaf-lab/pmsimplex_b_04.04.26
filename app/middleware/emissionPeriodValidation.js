// src/middleware/emissionPeriodValidation.js
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

// Reusable validators
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};

const isFutureDate = (value) => {
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// =============================================
// CREATE EMISSION PERIOD VALIDATION
// =============================================
export const createEmissionPeriodValidation = [
  param('policyId')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  body('period_label')
    .notEmpty()
    .withMessage('Period label is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Period label must be between 1 and 50 characters')
    .matches(/^[A-Za-z0-9\-\_\s]+$/)
    .withMessage('Period label can only contain letters, numbers, spaces, hyphens and underscores')
    .customSanitizer(value => value.trim()),

  body('period_start')
    .notEmpty()
    .withMessage('Period start date is required')
    .custom(isValidDate)
    .withMessage('Period start must be a valid date in YYYY-MM-DD format')
    .custom(value => {
      const date = new Date(value);
      const minDate = new Date('1900-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      
      if (date < minDate || date > maxDate) {
        throw new Error('Period start date must be between 1900 and 5 years from now');
      }
      return true;
    }),

  body('period_end')
    .notEmpty()
    .withMessage('Period end date is required')
    .custom(isValidDate)
    .withMessage('Period end must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.period_start);
      const endDate = new Date(value);
      
      if (endDate <= startDate) {
        throw new Error('Period end must be after period start');
      }
      
      // Check if period duration is reasonable (max 1 year)
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 366) {
        throw new Error('Period duration cannot exceed 366 days');
      }
      
      return true;
    }),

  body('expected_at')
    .optional({ nullable: true })
    .custom(isValidDate)
    .withMessage('Expected date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (value) {
        const expectedDate = new Date(value);
        const startDate = new Date(req.body.period_start);
        const endDate = new Date(req.body.period_end);
        
        if (expectedDate < startDate) {
          throw new Error('Expected date cannot be before period start');
        }
        
        // Warning if expected date is before period end (optional validation)
        if (expectedDate < endDate) {
          console.warn('⚠️ Warning: Expected date is before period end date');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// =============================================
// UPDATE EMISSION PERIOD VALIDATION (PUT/PATCH)
// =============================================
export const updateEmissionPeriodValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid emission period ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Period ID is required'),

  body('period_label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Period label must be between 1 and 50 characters')
    .matches(/^[A-Za-z0-9\-\_\s]+$/)
    .withMessage('Period label can only contain letters, numbers, spaces, hyphens and underscores')
    .customSanitizer(value => value.trim()),

  body('period_start')
    .optional()
    .custom(isValidDate)
    .withMessage('Period start must be a valid date in YYYY-MM-DD format')
    .custom(value => {
      const date = new Date(value);
      const minDate = new Date('1900-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      
      if (date < minDate || date > maxDate) {
        throw new Error('Period start date must be between 1900 and 5 years from now');
      }
      return true;
    }),

  body('period_end')
    .optional()
    .custom(isValidDate)
    .withMessage('Period end must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      // Only validate if both dates are provided
      if (req.body.period_start && value) {
        const startDate = new Date(req.body.period_start);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error('Period end must be after period start');
        }
        
        // Check duration if both dates are provided
        const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 366) {
          throw new Error('Period duration cannot exceed 366 days');
        }
      }
      return true;
    }),

  body('expected_at')
    .optional({ nullable: true })
    .custom(isValidDate)
    .withMessage('Expected date must be a valid date in YYYY-MM-DD format'),

  // Custom validation to ensure at least one field is being updated
  body().custom((value, { req }) => {
    const updateFields = ['period_label', 'period_start', 'period_end', 'expected_at'];
    const hasUpdateFields = updateFields.some(field => req.body[field] !== undefined);
    
    if (!hasUpdateFields) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  }),

  handleValidationErrors
];

// =============================================
// EMISSION PERIOD ID PARAM VALIDATION
// =============================================
export const emissionPeriodIdValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid emission period ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Period ID is required'),

  handleValidationErrors
];

// =============================================
// POLICY PERIODS QUERY VALIDATION
// =============================================
export const policyPeriodsValidation = [
  param('policyId')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100')
    .toInt(),

  query('quarter')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4')
    .toInt(),

  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
    .toInt(),

  query('from_date')
    .optional()
    .custom(isValidDate)
    .withMessage('From date must be a valid date in YYYY-MM-DD format'),

  query('to_date')
    .optional()
    .custom(isValidDate)
    .withMessage('To date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (req.query.from_date && value) {
        const fromDate = new Date(req.query.from_date);
        const toDate = new Date(value);
        
        if (toDate < fromDate) {
          throw new Error('To date must be after from date');
        }
        
        // Check if date range is within reasonable limits (max 2 years)
        const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 730) {
          throw new Error('Date range cannot exceed 2 years');
        }
      }
      return true;
    }),

  query('sort')
    .optional()
    .isIn(['period_start', 'period_end', 'expected_at', 'created_at', 'period_label'])
    .withMessage('Sort must be one of: period_start, period_end, expected_at, created_at, period_label'),

  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be either ASC or DESC')
    .toUpperCase(),

  handleValidationErrors
];

// =============================================
// DATE RANGE QUERY VALIDATION
// =============================================
export const dateRangeValidation = [
  query('start')
    .notEmpty()
    .withMessage('Start date is required')
    .custom(isValidDate)
    .withMessage('Start date must be a valid date in YYYY-MM-DD format'),

  query('end')
    .notEmpty()
    .withMessage('End date is required')
    .custom(isValidDate)
    .withMessage('End date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (req.query.start && value) {
        const start = new Date(req.query.start);
        const end = new Date(value);
        
        if (end < start) {
          throw new Error('End date must be after start date');
        }
        
        // Max range of 2 years
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        if (daysDiff > 730) {
          throw new Error('Date range cannot exceed 2 years');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// =============================================
// BULK PERIODS VALIDATION
// =============================================
export const bulkPeriodsValidation = [
  param('policyId')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.')
    .notEmpty()
    .withMessage('Policy ID is required'),

  body('periods')
    .isArray()
    .withMessage('Periods must be an array')
    .notEmpty()
    .withMessage('Periods array cannot be empty')
    .custom((periods) => {
      if (periods.length > 100) {
        throw new Error('Cannot create more than 100 periods at once');
      }
      return true;
    }),

  body('periods.*.period_label')
    .notEmpty()
    .withMessage('Period label is required for all periods')
    .isString()
    .withMessage('Period label must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Period label must be between 1 and 50 characters'),

  body('periods.*.period_start')
    .notEmpty()
    .withMessage('Period start date is required for all periods')
    .custom(isValidDate)
    .withMessage('Invalid period start date format'),

  body('periods.*.period_end')
    .notEmpty()
    .withMessage('Period end date is required for all periods')
    .custom(isValidDate)
    .withMessage('Invalid period end date format')
    .custom((value, { req, path }) => {
      const index = path.split('[')[1].split(']')[0];
      const period = req.body.periods[index];
      
      if (period && period.period_start) {
        const startDate = new Date(period.period_start);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error(`Period at index ${index}: end date must be after start date`);
        }
        
        // Check duration
        const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 366) {
          throw new Error(`Period at index ${index}: duration cannot exceed 366 days`);
        }
      }
      return true;
    }),

  body('periods.*.expected_at')
    .optional({ nullable: true })
    .custom(isValidDate)
    .withMessage('Invalid expected date format'),

  handleValidationErrors
];

// =============================================
// PERIOD STATISTICS VALIDATION
// =============================================
export const periodStatisticsValidation = [
  query('policy_id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format'),

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

  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100')
    .toInt(),

  handleValidationErrors
];

// =============================================
// YEAR PARAM VALIDATION
// =============================================
export const yearValidation = [
  param('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100')
    .toInt(),

  handleValidationErrors
];

// =============================================
// QUARTER PARAM VALIDATION
// =============================================
export const quarterValidation = [
  param('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100')
    .toInt(),

  param('quarter')
    .notEmpty()
    .withMessage('Quarter is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4')
    .toInt(),

  handleValidationErrors
];

// =============================================
// PERIOD REVISION STATUS VALIDATION
// =============================================
export const periodRevisionStatusValidation = [
  param('id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Invalid period ID format'),

  handleValidationErrors
];

// =============================================
// COMPLIANCE CHECK VALIDATION
// =============================================
export const complianceCheckValidation = [
  body('dry_run')
    .optional()
    .isBoolean()
    .withMessage('dry_run must be a boolean')
    .toBoolean(),

  handleValidationErrors
];

// Export all validations
export default {
  createEmissionPeriodValidation,
  updateEmissionPeriodValidation,
  emissionPeriodIdValidation,
  policyPeriodsValidation,
  dateRangeValidation,
  bulkPeriodsValidation,
  periodStatisticsValidation,
  yearValidation,
  quarterValidation,
  periodRevisionStatusValidation,
  complianceCheckValidation
};