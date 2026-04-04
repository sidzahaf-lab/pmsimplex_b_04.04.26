import { body, param, query } from 'express-validator';

export const validateClient = [
  body('slug')
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage('Slug must be between 1 and 25 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL must be a valid URL')
    .isLength({ max: 50 })
    .withMessage('URL must not exceed 50 characters')
];

export const validateClientUpdate = [
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage('Slug must be between 1 and 25 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL must be a valid URL')
    .isLength({ max: 50 })
    .withMessage('URL must not exceed 50 characters')
];

export const validateClientId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required')
];

export const validateClientSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage('Valid slug is required')
];

export const validateSlugQuery = [
  query('slug')
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage('Slug is required and must be between 1 and 25 characters')
];

export const validateNameQuery = [
  query('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name is required and must be between 1 and 50 characters')
];

export default {
  validateClient,
  validateClientUpdate,
  validateClientId,
  validateClientSlug,
  validateSlugQuery,
  validateNameQuery
};