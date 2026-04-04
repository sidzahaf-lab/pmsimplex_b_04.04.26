import { body, param, query } from 'express-validator';

// Constants for validation
const HEALTH_STATUSES = ['good', 'warning', 'critical'];
const PROJECT_PHASES = [
  'FEED (Front-End Engineering Design)',
  'Detailed Engineering',
  'Procurement',
  'Construction',
  'Pre-Commissioning',
  'Commissioning',
  'Close-out'
];
const CONTRACT_TYPES = [
  'EPC (Engineering, Procurement, Construction)',
  'EPCM (Engineering, Procurement, Construction Management)',
  'Conception-Construction',
  'Régie',
  'Forfait',
  'BOT (Build, Operate, Transfer)'
];
const CURRENCY_REGEX = /^[A-Z]{3}$/;

export const validateProject = [
  body('code')
    .notEmpty()
    .withMessage('Project code is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project code must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Project code can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  
  body('client_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Client name cannot exceed 255 characters'),
  
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date in YYYY-MM-DD format'),
  
  body('planned_end_date')
    .notEmpty()
    .withMessage('Planned end date is required')
    .isISO8601()
    .withMessage('Planned end date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('Planned end date must be after start date');
      }
      return true;
    }),
  
  body('baseline_finish_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Baseline finish date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('Baseline finish date cannot be before start date');
      }
      return true;
    }),
  
  body('current_finish_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Current finish date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('Current finish date cannot be before start date');
      }
      return true;
    }),
  
  body('description')
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage('Description must be text'),
  
  body('health_status')
    .optional({ nullable: true })
    .isIn(HEALTH_STATUSES)
    .withMessage(`Health status must be one of: ${HEALTH_STATUSES.join(', ')}`),
  
  body('business_unit_id')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Valid business unit ID is required (UUID v4)'),
  
  body('contract_type')
    .optional({ nullable: true })
    .isIn(CONTRACT_TYPES)
    .withMessage(`Contract type must be one of: ${CONTRACT_TYPES.join(', ')}`),
  
  body('current_phase')
    .optional({ nullable: true })
    .isIn(PROJECT_PHASES)
    .withMessage(`Current phase must be one of: ${PROJECT_PHASES.join(', ')}`),
  
  body('contract_value')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Contract value must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Contract value cannot be negative');
      }
      return true;
    }),
  
  body('currency')
    .optional({ nullable: true })
    .matches(CURRENCY_REGEX)
    .withMessage('Currency must be a valid 3-letter ISO 4217 code (e.g., USD, EUR)'),
  
  body('created_by')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Valid user ID is required (UUID v4)'),
];

export const validateProjectUpdate = [
  param('id')
    .isUUID(4)
    .withMessage('Valid project ID is required (UUID v4)'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project code must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Project code can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  
  body('client_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Client name cannot exceed 255 characters'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date in YYYY-MM-DD format'),
  
  body('planned_end_date')
    .optional()
    .isISO8601()
    .withMessage('Planned end date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const startDate = req.body.start_date;
      if (startDate && new Date(value) <= new Date(startDate)) {
        throw new Error('Planned end date must be after start date');
      }
      return true;
    }),
  
  body('baseline_finish_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Baseline finish date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const startDate = req.body.start_date;
      if (startDate && new Date(value) < new Date(startDate)) {
        throw new Error('Baseline finish date cannot be before start date');
      }
      return true;
    }),
  
  body('current_finish_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Current finish date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const startDate = req.body.start_date;
      if (startDate && new Date(value) < new Date(startDate)) {
        throw new Error('Current finish date cannot be before start date');
      }
      return true;
    }),
  
  body('description')
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage('Description must be text'),
  
  body('health_status')
    .optional({ nullable: true })
    .isIn(HEALTH_STATUSES)
    .withMessage(`Health status must be one of: ${HEALTH_STATUSES.join(', ')}`),
  
  body('business_unit_id')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Valid business unit ID is required (UUID v4)'),
  
  body('contract_type')
    .optional({ nullable: true })
    .isIn(CONTRACT_TYPES)
    .withMessage(`Contract type must be one of: ${CONTRACT_TYPES.join(', ')}`),
  
  body('current_phase')
    .optional({ nullable: true })
    .isIn(PROJECT_PHASES)
    .withMessage(`Current phase must be one of: ${PROJECT_PHASES.join(', ')}`),
  
  body('contract_value')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Contract value must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Contract value cannot be negative');
      }
      return true;
    }),
  
  body('currency')
    .optional({ nullable: true })
    .matches(CURRENCY_REGEX)
    .withMessage('Currency must be a valid 3-letter ISO 4217 code (e.g., USD, EUR)'),
];

export const validateProjectId = [
  param('id')
    .isUUID(4)
    .withMessage('Valid project ID is required (UUID v4)')
];

export const validateBusinessUnitId = [
  param('businessUnitId')
    .isUUID(4)
    .withMessage('Valid business unit ID is required (UUID v4)')
];

export const validateProjectHealthStatus = [
  param('id')
    .isUUID(4)
    .withMessage('Valid project ID is required (UUID v4)'),
  
  body('health_status')
    .notEmpty()
    .withMessage('Health status is required')
    .isIn(HEALTH_STATUSES)
    .withMessage(`Health status must be one of: ${HEALTH_STATUSES.join(', ')}`)
];

export const validateProjectPhase = [
  param('id')
    .isUUID(4)
    .withMessage('Valid project ID is required (UUID v4)'),
  
  body('current_phase')
    .notEmpty()
    .withMessage('Project phase is required')
    .isIn(PROJECT_PHASES)
    .withMessage(`Project phase must be one of: ${PROJECT_PHASES.join(', ')}`)
];

export const validateDateRange = [
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date in YYYY-MM-DD format'),
  
  body('planned_end_date')
    .optional()
    .isISO8601()
    .withMessage('Planned end date must be a valid date in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const startDate = req.body.start_date;
      if (startDate && value && new Date(value) <= new Date(startDate)) {
        throw new Error('Planned end date must be after start date');
      }
      return true;
    }),
];

export const validateProjectCode = [
  query('code')
    .notEmpty()
    .withMessage('Project code is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project code must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Project code can only contain letters, numbers, hyphens, and underscores'),
];

export const validateProjectQueryParams = [
  query('business_unit_id')
    .optional()
    .isUUID(4)
    .withMessage('Valid business unit ID is required (UUID v4)'),
  
  query('health_status')
    .optional()
    .isIn(HEALTH_STATUSES)
    .withMessage(`Health status must be one of: ${HEALTH_STATUSES.join(', ')}`),
  
  query('current_phase')
    .optional()
    .isIn(PROJECT_PHASES)
    .withMessage(`Current phase must be one of: ${PROJECT_PHASES.join(', ')}`),
  
  query('contract_type')
    .optional()
    .isIn(CONTRACT_TYPES)
    .withMessage(`Contract type must be one of: ${CONTRACT_TYPES.join(', ')}`),
  
  query('start_date_from')
    .optional()
    .isISO8601()
    .withMessage('Start date from must be a valid date in YYYY-MM-DD format'),
  
  query('start_date_to')
    .optional()
    .isISO8601()
    .withMessage('Start date to must be a valid date in YYYY-MM-DD format'),
  
  query('planned_end_date_from')
    .optional()
    .isISO8601()
    .withMessage('Planned end date from must be a valid date in YYYY-MM-DD format'),
  
  query('planned_end_date_to')
    .optional()
    .isISO8601()
    .withMessage('Planned end date to must be a valid date in YYYY-MM-DD format'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value (true/false)'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['code', 'name', 'start_date', 'planned_end_date', 'created_at', 'health_status', 'current_phase'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be either ASC or DESC'),
];

export const validateContractValue = [
  body('contract_value')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Contract value must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Contract value cannot be negative');
      }
      return true;
    }),
  
  body('currency')
    .optional({ nullable: true })
    .matches(CURRENCY_REGEX)
    .withMessage('Currency must be a valid 3-letter ISO 4217 code (e.g., USD, EUR)')
    .custom((value, { req }) => {
      if (req.body.contract_value && !value) {
        throw new Error('Currency is required when contract value is provided');
      }
      return true;
    }),
];

export default {
  validateProject,
  validateProjectUpdate,
  validateProjectId,
  validateBusinessUnitId,
  validateProjectHealthStatus,
  validateProjectPhase,
  validateDateRange,
  validateProjectCode,
  validateProjectQueryParams,
  validateContractValue
};