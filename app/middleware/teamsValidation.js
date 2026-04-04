import { body, param, query } from 'express-validator';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Validation for creating a team assignment
export const createTeamValidation = [
  body('business_unit_id')
    .notEmpty().withMessage('Business unit ID is required')
    .matches(uuidRegex).withMessage('Invalid business unit ID format. Must be a valid UUID'),
  
  body('project_id')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !uuidRegex.test(value)) {
        throw new Error('Invalid project ID format. Must be a valid UUID');
      }
      return true;
    }),
  
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .matches(uuidRegex).withMessage('Invalid user ID format. Must be a valid UUID'),
  
  body('role_id')
    .notEmpty().withMessage('Role ID is required')
    .matches(uuidRegex).withMessage('Invalid role ID format. Must be a valid UUID'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value'),
  
  body('assigned_at')
    .optional()
    .isISO8601().withMessage('assigned_at must be a valid date')
];

// Validation for updating a team assignment
export const updateTeamValidation = [
  body('business_unit_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid business unit ID format. Must be a valid UUID'),
  
  body('project_id')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !uuidRegex.test(value)) {
        throw new Error('Invalid project ID format. Must be a valid UUID');
      }
      return true;
    }),
  
  body('user_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid user ID format. Must be a valid UUID'),
  
  body('role_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid role ID format. Must be a valid UUID'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value'),
  
  body('removed_at')
    .optional({ nullable: true })
    .isISO8601().withMessage('removed_at must be a valid date')
];

// Validation for team ID parameter
export const teamIdValidation = [
  param('id')
    .notEmpty().withMessage('Team assignment ID is required')
    .matches(uuidRegex).withMessage('Invalid team assignment ID format. Must be a valid UUID')
];

// Validation for user ID parameter
export const userIdValidation = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .matches(uuidRegex).withMessage('Invalid user ID format. Must be a valid UUID')
];

// Validation for business unit ID parameter
export const businessUnitIdValidation = [
  param('businessUnitId')
    .notEmpty().withMessage('Business unit ID is required')
    .matches(uuidRegex).withMessage('Invalid business unit ID format. Must be a valid UUID')
];

// Validation for project ID parameter
export const projectIdValidation = [
  param('projectId')
    .notEmpty().withMessage('Project ID is required')
    .matches(uuidRegex).withMessage('Invalid project ID format. Must be a valid UUID')
];

// Validation for role ID parameter
export const roleIdValidation = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .matches(uuidRegex).withMessage('Invalid role ID format. Must be a valid UUID')
];

// Validation for deactivate team
export const deactivateTeamValidation = [
  param('id')
    .notEmpty().withMessage('Team assignment ID is required')
    .matches(uuidRegex).withMessage('Invalid team assignment ID format. Must be a valid UUID')
];

// Validation for activate team
export const activateTeamValidation = [
  param('id')
    .notEmpty().withMessage('Team assignment ID is required')
    .matches(uuidRegex).withMessage('Invalid team assignment ID format. Must be a valid UUID')
];

// Validation for active teams by user
export const activeTeamsByUserValidation = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .matches(uuidRegex).withMessage('Invalid user ID format. Must be a valid UUID')
];

// Optional: Query parameter validations for filtering
export const teamFiltersValidation = [
  query('business_unit_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid business unit ID format'),
  
  query('project_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid project ID format'),
  
  query('user_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid user ID format'),
  
  query('role_id')
    .optional()
    .matches(uuidRegex).withMessage('Invalid role ID format'),
  
  query('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value'),
  
  query('from_date')
    .optional()
    .isISO8601().withMessage('from_date must be a valid date'),
  
  query('to_date')
    .optional()
    .isISO8601().withMessage('to_date must be a valid date')
];
// Ajouter à la fin du fichier teamsValidation.js

// Validation for user role summary
export const userRoleSummaryValidation = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .matches(uuidRegex).withMessage('Invalid user ID format. Must be a valid UUID'),
  param('businessUnitId')
    .notEmpty().withMessage('Business unit ID is required')
    .matches(uuidRegex).withMessage('Invalid business unit ID format. Must be a valid UUID')
];

// Validation for bulk create
export const bulkCreateTeamsValidation = [
  body('teams')
    .isArray().withMessage('teams must be an array')
    .notEmpty().withMessage('teams array cannot be empty'),
  body('teams.*.business_unit_id')
    .notEmpty().withMessage('business_unit_id is required for each team')
    .matches(uuidRegex).withMessage('Invalid business_unit_id format'),
  body('teams.*.user_id')
    .notEmpty().withMessage('user_id is required for each team')
    .matches(uuidRegex).withMessage('Invalid user_id format'),
  body('teams.*.role_id')
    .notEmpty().withMessage('role_id is required for each team')
    .matches(uuidRegex).withMessage('Invalid role_id format'),
  body('teams.*.project_id')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !uuidRegex.test(value)) {
        throw new Error('Invalid project_id format');
      }
      return true;
    }),
  body('teams.*.is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean')
];