// src/middleware/periodicReportValidation.js
import { body, param, query } from 'express-validator';

export const createReportValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('template_ref')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Template reference must not exceed 150 characters'),

  body('signatory')
    .optional()
    .isUUID()
    .withMessage('Signatory ID must be a valid UUID'),

  body('distribution_list')
    .optional()
    .trim()
];

export const updateReportValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid report ID'),

  body('template_ref')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Template reference must not exceed 150 characters'),

  body('signatory')
    .optional()
    .isUUID()
    .withMessage('Signatory ID must be a valid UUID'),

  body('distribution_list')
    .optional()
    .trim()
];

export const reportIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid report ID')
];

export const reportByProjdocValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const reportsBySignatoryValidation = [
  param('signatoryId')
    .isUUID()
    .withMessage('Invalid signatory ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const reportsByTemplateValidation = [
  param('templateRef')
    .notEmpty()
    .withMessage('Template reference is required')
    .trim()
    .isLength({ max: 150 })
    .withMessage('Template reference must not exceed 150 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];