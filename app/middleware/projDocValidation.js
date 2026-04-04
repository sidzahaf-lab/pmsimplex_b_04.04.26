// src/middleware/projDocValidation.js
import { body, param, query } from 'express-validator';

export const createProjDocValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),

  body('doc_type_id')
    .notEmpty()
    .withMessage('Document type ID is required')
    .isUUID()
    .withMessage('Document type ID must be a valid UUID'),

  body('doc_number')
    .notEmpty()
    .withMessage('Document number is required')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Document number must be between 1 and 150 characters')
    .matches(/^[A-Za-z0-9\-_./]+$/)
    .withMessage('Document number can only contain letters, numbers, hyphens, underscores, dots and slashes'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Title must not exceed 250 characters'),

  body('emission_id')
    .optional()
    .isUUID()
    .withMessage('Emission policy ID must be a valid UUID'),

  body('entity_meta')
    .optional()
    .isObject()
    .withMessage('Entity meta must be an object')
];

export const updateProjDocValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('doc_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Document number must be between 1 and 150 characters')
    .matches(/^[A-Za-z0-9\-_./]+$/)
    .withMessage('Document number can only contain letters, numbers, hyphens, underscores, dots and slashes'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Title must not exceed 250 characters'),

  body('emission_id')
    .optional()
    .isUUID()
    .withMessage('Emission policy ID must be a valid UUID'),

  body('status')
    .optional()
    .isIn(['active', 'superseded', 'cancelled'])
    .withMessage('Status must be active, superseded, or cancelled')
];

export const projDocIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const projectDocsValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),

  query('doc_type_id')
    .optional()
    .isUUID()
    .withMessage('Document type ID must be a valid UUID'),

  query('status')
    .optional()
    .isIn(['active', 'superseded', 'cancelled'])
    .withMessage('Status must be active, superseded, or cancelled'),

  query('is_periodic')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_periodic must be true or false'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
];

export const docNumberValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),

  param('docNumber')
    .notEmpty()
    .withMessage('Document number is required')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Document number must be between 1 and 150 characters')
];

export const toggleDocStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'superseded', 'cancelled'])
    .withMessage('Status must be active, superseded, or cancelled')
];