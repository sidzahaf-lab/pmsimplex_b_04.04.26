import { body, param } from 'express-validator';

export const validateBusinessUnit = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters')
    .default(null),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
    .default(true)
];

export const validateBusinessUnitUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters')
    .default(null),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

export const validateBusinessUnitId = [
  param('id')
    .isUUID(4)
    .withMessage('Valid business unit ID (UUID v4) is required')
];

export const validateClientId = [
  param('clientId')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required')
];

export default {
  validateBusinessUnit,
  validateBusinessUnitUpdate,
  validateBusinessUnitId,
  validateClientId
};