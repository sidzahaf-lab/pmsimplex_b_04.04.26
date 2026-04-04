// src/middleware/globalValidators.js
import { query, param, body } from 'express-validator';

/**
 * Pagination validation
 * Validates page, limit, sort, and order parameters
 */
export const validatePagination = [
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

  query('sort')
    .optional()
    .isString()
    .withMessage('Sort field must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be between 1 and 50 characters'),

  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be either ASC or DESC')
    .customSanitizer(value => value?.toUpperCase())
];

/**
 * Date range validation for query parameters
 * @param {string} startField - Name of the start date field
 * @param {string} endField - Name of the end date field
 * @returns {Array} Express-validator chain
 */
export const validateDateRange = (startField, endField) => [
  query(startField)
    .optional()
    .isISO8601()
    .withMessage(`${startField} must be a valid date (YYYY-MM-DD)`)
    .toDate(),

  query(endField)
    .optional()
    .isISO8601()
    .withMessage(`${endField} must be a valid date (YYYY-MM-DD)`)
    .toDate()
    .custom((value, { req }) => {
      if (req.query[startField] && value && new Date(value) < new Date(req.query[startField])) {
        throw new Error(`${endField} must be after ${startField}`);
      }
      return true;
    })
];

/**
 * UUID validation for params
 * @param {string} paramName - Name of the UUID parameter
 * @param {boolean} required - Whether the parameter is required
 * @returns {Array} Express-validator chain
 */
export const validateUUIDParam = (paramName, required = true) => {
  const validators = [
    param(paramName)
      .if(required ? () => true : (value) => value !== undefined)
      .isUUID(4)
      .withMessage(`Invalid ${paramName} format. Must be a valid UUID`)
  ];
  
  if (required) {
    validators.unshift(
      param(paramName)
        .notEmpty()
        .withMessage(`${paramName} is required`)
    );
  }
  
  return validators;
};

/**
 * UUID validation for body fields
 * @param {string} fieldName - Name of the UUID field
 * @param {boolean} required - Whether the field is required
 * @returns {Array} Express-validator chain
 */
export const validateUUIDBody = (fieldName, required = true) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .isUUID(4)
      .withMessage(`Invalid ${fieldName} format. Must be a valid UUID`)
  ];
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * Date validation for body fields
 * @param {string} fieldName - Name of the date field
 * @param {boolean} required - Whether the field is required
 * @returns {Array} Express-validator chain
 */
export const validateDateBody = (fieldName, required = true) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .isISO8601()
      .withMessage(`${fieldName} must be a valid date (YYYY-MM-DD)`)
      .toDate()
  ];
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * Enum validation for body fields
 * @param {string} fieldName - Name of the enum field
 * @param {Array} allowedValues - Array of allowed values
 * @param {boolean} required - Whether the field is required
 * @returns {Array} Express-validator chain
 */
export const validateEnumBody = (fieldName, allowedValues, required = true) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .isIn(allowedValues)
      .withMessage(`${fieldName} must be one of: ${allowedValues.join(', ')}`)
  ];
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * String length validation for body fields
 * @param {string} fieldName - Name of the string field
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum length
 * @param {number} options.max - Maximum length
 * @param {boolean} required - Whether the field is required
 * @param {RegExp} pattern - Optional regex pattern
 * @returns {Array} Express-validator chain
 */
export const validateStringBody = (fieldName, { min = 1, max = 255 } = {}, required = true, pattern = null) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .trim()
      .isLength({ min, max })
      .withMessage(`${fieldName} must be between ${min} and ${max} characters`)
  ];
  
  if (pattern) {
    validators.push(
      body(fieldName)
        .if(required ? () => true : (value) => value !== undefined)
        .matches(pattern)
        .withMessage(`${fieldName} contains invalid characters`)
    );
  }
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * Integer validation for body fields
 * @param {string} fieldName - Name of the integer field
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} required - Whether the field is required
 * @returns {Array} Express-validator chain
 */
export const validateIntBody = (fieldName, { min, max } = {}, required = true) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .isInt({ min, max })
      .withMessage(() => {
        if (min !== undefined && max !== undefined) {
          return `${fieldName} must be an integer between ${min} and ${max}`;
        } else if (min !== undefined) {
          return `${fieldName} must be an integer greater than or equal to ${min}`;
        } else if (max !== undefined) {
          return `${fieldName} must be an integer less than or equal to ${max}`;
        }
        return `${fieldName} must be an integer`;
      })
      .toInt()
  ];
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * Boolean validation for body fields
 * @param {string} fieldName - Name of the boolean field
 * @param {boolean} required - Whether the field is required
 * @returns {Array} Express-validator chain
 */
export const validateBooleanBody = (fieldName, required = true) => {
  const validators = [
    body(fieldName)
      .if(required ? () => true : (value) => value !== undefined)
      .isBoolean()
      .withMessage(`${fieldName} must be a boolean value (true/false)`)
      .toBoolean()
  ];
  
  if (required) {
    validators.unshift(
      body(fieldName)
        .notEmpty()
        .withMessage(`${fieldName} is required`)
    );
  }
  
  return validators;
};

/**
 * File validation for uploads
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {Array} options.allowedTypes - Allowed MIME types
 * @returns {Array} Express-validator chain
 */
export const validateFile = (fieldName = 'file', { maxSize = 50 * 1024 * 1024, allowedTypes = [] } = {}) => {
  const validators = [
    body(fieldName)
      .notEmpty()
      .withMessage('File is required')
  ];

  if (maxSize) {
    validators.push(
      body(fieldName)
        .custom((value, { req }) => {
          if (req.file && req.file.size > maxSize) {
            throw new Error(`File size must not exceed ${maxSize / (1024 * 1024)}MB`);
          }
          return true;
        })
    );
  }

  if (allowedTypes.length > 0) {
    validators.push(
      body(fieldName)
        .custom((value, { req }) => {
          if (req.file && !allowedTypes.includes(req.file.mimetype)) {
            throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
          }
          return true;
        })
    );
  }

  return validators;
};

/**
 * Search query validation
 * Validates search term for filtering
 */
export const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .escape()
];

/**
 * ID array validation for bulk operations
 * @param {string} fieldName - Name of the IDs field
 * @returns {Array} Express-validator chain
 */
export const validateIdsArray = (fieldName = 'ids') => [
  body(fieldName)
    .notEmpty()
    .withMessage('IDs array is required')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),
  
  body(fieldName + '.*')
    .isUUID(4)
    .withMessage('Each ID must be a valid UUID')
];

// Export all validators
export default {
  validatePagination,
  validateDateRange,
  validateUUIDParam,
  validateUUIDBody,
  validateDateBody,
  validateEnumBody,
  validateStringBody,
  validateIntBody,
  validateBooleanBody,
  validateFile,
  validateSearchQuery,
  validateIdsArray
};