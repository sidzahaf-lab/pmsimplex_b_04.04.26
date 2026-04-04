// src/middleware/schdlBaselineValidation.js
import { body, param, query } from 'express-validator';

export const createBaselineValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('frozen_at')
    .optional()
    .isDate()
    .withMessage('Frozen date must be a valid date'),

  body('approved_by')
    .optional()
    .isUUID()
    .withMessage('Approver ID must be a valid UUID'),

  body('contract_ref')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contract reference must not exceed 100 characters')
];

export const updateBaselineValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid baseline ID'),

  body('frozen_at')
    .optional()
    .isDate()
    .withMessage('Frozen date must be a valid date'),

  body('approved_by')
    .optional()
    .isUUID()
    .withMessage('Approver ID must be a valid UUID'),

  body('contract_ref')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contract reference must not exceed 100 characters')
];

export const baselineIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid baseline ID')
];

export const baselineByProjdocValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const currentSchedulesValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid baseline ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];