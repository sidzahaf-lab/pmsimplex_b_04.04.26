// backend/app/middleware/docRevisionValidation.js
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

export const createRevisionValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('period_id')
    .optional()
    .isUUID()
    .withMessage('Period ID must be a valid UUID'),

  body('revision_code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Revision code must not exceed 50 characters')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Revision code can only contain letters, numbers, hyphens and underscores'),

  body('revision_notes')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['pending', 'received', 'late'])
    .withMessage('Status must be one of: pending, received, late'),

  // ✅ Ces champs ne doivent PAS être validés ici
  // Ils sont générés par le contrôleur après traitement du fichier
  // body('source_filename').notEmpty().withMessage('Source filename is required'),
  // body('source_file_hash').notEmpty().withMessage('Source file hash is required'),
];

export const updateRevisionValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid revision ID'),

  body('revision_code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Revision code must not exceed 50 characters')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Revision code can only contain letters, numbers, hyphens and underscores'),

  body('revision_notes')
    .optional()
    .trim(),

  body('superseded_by')
    .optional()
    .isUUID()
    .withMessage('Superseding revision ID must be a valid UUID'),

  body('status')
    .optional()
    .isIn(['pending', 'received', 'late'])
    .withMessage('Status must be one of: pending, received, late'),

  // Custom validation to ensure at least one field is being updated
  body().custom((value, { req }) => {
    const updateFields = ['revision_code', 'revision_notes', 'superseded_by', 'status'];
    const hasUpdateFields = updateFields.some(field => req.body[field] !== undefined);
    
    if (!hasUpdateFields) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  })
];

export const docRevisionIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid revision ID')
];

export const docRevisionsValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const periodRevisionsValidation = [
  param('periodId')
    .isUUID()
    .withMessage('Invalid period ID')
];

export const checkFileHashValidation = [
  body('file_hash')
    .notEmpty()
    .withMessage('File hash is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('SHA256 hash must be exactly 64 characters')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Hash must be hexadecimal'),

  body('hash_algorithm')
    .notEmpty()
    .withMessage('Hash algorithm is required')
    .isIn(['SHA256', 'SHA512', 'MD5'])
    .withMessage('Hash algorithm must be SHA256, SHA512, or MD5')
];

export const latestRevisionValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const revisionHistoryValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

// =============================================
// NEW VALIDATIONS FOR STATUS-BASED ENDPOINTS
// =============================================

export const statusQueryValidation = [
  param('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'received', 'late'])
    .withMessage('Status must be one of: pending, received, late'),

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

export const uploaderRevisionsValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),

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

  query('status')
    .optional()
    .isIn(['pending', 'received', 'late'])
    .withMessage('Status must be one of: pending, received, late'),

  handleValidationErrors
];

export const bulkStatusUpdateValidation = [
  body('revisionIds')
    .isArray()
    .withMessage('revisionIds must be an array')
    .notEmpty()
    .withMessage('revisionIds array cannot be empty')
    .custom((ids) => {
      if (ids.length > 100) {
        throw new Error('Cannot update more than 100 revisions at once');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const invalidIds = ids.filter(id => !uuidRegex.test(id));
      
      if (invalidIds.length > 0) {
        throw new Error(`Invalid UUID format in revisionIds: ${invalidIds.join(', ')}`);
      }
      
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'received', 'late'])
    .withMessage('Status must be one of: pending, received, late'),

  handleValidationErrors
];

export const revisionStatisticsValidation = [
  query('period_id')
    .optional()
    .isUUID()
    .withMessage('Invalid period ID format'),

  query('projdoc_id')
    .optional()
    .isUUID()
    .withMessage('Invalid document ID format'),

  query('from_date')
    .optional()
    .isDate()
    .withMessage('From date must be a valid date'),

  query('to_date')
    .optional()
    .isDate()
    .withMessage('To date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.from_date && value && value < req.query.from_date) {
        throw new Error('To date must be after from date');
      }
      return true;
    }),

  handleValidationErrors
];

export const duplicateRevisionsValidation = [
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

// Export all validations
export default {
  createRevisionValidation,
  updateRevisionValidation,
  docRevisionIdValidation,
  docRevisionsValidation,
  periodRevisionsValidation,
  checkFileHashValidation,
  latestRevisionValidation,
  revisionHistoryValidation,
  statusQueryValidation,
  uploaderRevisionsValidation,
  bulkStatusUpdateValidation,
  revisionStatisticsValidation,
  duplicateRevisionsValidation
};