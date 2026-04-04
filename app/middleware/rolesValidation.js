// app/middleware/rolesValidation.js
import { body, param, query } from 'express-validator';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Valid scopes
const VALID_SCOPES = ['bu', 'project', 'corporate', 'guest'];

// Validation for creating a role
export const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Role name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('scope')
    .trim()
    .notEmpty().withMessage('Scope is required')
    .isIn(VALID_SCOPES).withMessage(`Scope must be one of: ${VALID_SCOPES.join(', ')}`)
];

// Validation for updating a role
export const updateRoleValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Role name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('scope')
    .optional()
    .trim()
    .isIn(VALID_SCOPES).withMessage(`Scope must be one of: ${VALID_SCOPES.join(', ')}`)
];

// Validation for role ID parameter
export const roleIdValidation = [
  param('id')
    .notEmpty().withMessage('Role ID is required')
    .matches(uuidRegex).withMessage('Invalid role ID format. Must be a valid UUID')
];

// Validation for scope parameter
export const scopeValidation = [
  param('scope')
    .notEmpty().withMessage('Scope is required')
    .isIn(VALID_SCOPES).withMessage(`Scope must be one of: ${VALID_SCOPES.join(', ')}`)
];

// Validation for role name parameter (check availability)
export const roleNameValidation = [
  param('name')
    .trim()
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Role name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Role name can only contain letters, numbers, spaces, hyphens, and underscores')
];