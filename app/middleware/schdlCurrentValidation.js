// src/middleware/schdlCurrentValidation.js
import { body, param, query } from 'express-validator';

export const createCurrentValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID'),

  body('baseline_projdoc_id')
    .notEmpty()
    .withMessage('Baseline document ID is required')
    .isUUID()
    .withMessage('Baseline document ID must be a valid UUID')
];

export const updateCurrentValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid current schedule ID'),

  body('baseline_projdoc_id')
    .optional()
    .isUUID()
    .withMessage('Baseline document ID must be a valid UUID')
];

export const currentIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid current schedule ID')
];

export const currentByProjdocValidation = [
  param('projdocId')
    .isUUID()
    .withMessage('Invalid document ID')
];

export const baselineValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid current schedule ID')
];