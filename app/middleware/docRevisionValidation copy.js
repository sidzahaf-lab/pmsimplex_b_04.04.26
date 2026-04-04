// src/middleware/docRevisionValidation.js
import { body, param, query } from 'express-validator';

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

  body('source_filename')
    .notEmpty()
    .withMessage('Source filename is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Source filename must not exceed 255 characters')
    .matches(/^[^\\\/:*?"<>|]+$/)
    .withMessage('Source filename contains invalid characters'),

  body('source_file_hash')
    .notEmpty()
    .withMessage('Source file hash is required')
    .trim()
    .isLength({ min: 64, max: 64 })
    .withMessage('SHA256 hash must be exactly 64 characters')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Hash must be hexadecimal'),

  body('hash_algorithm')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Hash algorithm must not exceed 20 characters')
    .isIn(['SHA256', 'SHA512', 'MD5'])
    .withMessage('Hash algorithm must be SHA256, SHA512, or MD5'),

  body('source_file_size')
    .optional()
    .isInt({ min: 0 })
    .withMessage('File size must be a positive integer'),

  body('source_file_path')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('File path must not exceed 500 characters')
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
    .withMessage('Superseding revision ID must be a valid UUID')
    .custom((value, { req }) => {
      if (value === req.params.id) {
        throw new Error('A revision cannot supersede itself');
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
    .withMessage('Invalid document ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const periodRevisionsValidation = [
  param('periodId')
    .isUUID()
    .withMessage('Invalid period ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const checkFileHashValidation = [
  body('file_hash')
    .notEmpty()
    .withMessage('File hash is required')
    .trim()
    .isLength({ min: 64, max: 64 })
    .withMessage('SHA256 hash must be exactly 64 characters')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Hash must be hexadecimal'),

  body('hash_algorithm')
    .notEmpty()
    .withMessage('Hash algorithm is required')
    .trim()
    .isLength({ max: 20 })
    .withMessage('Hash algorithm must not exceed 20 characters')
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