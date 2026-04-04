import { body, param } from 'express-validator';

export const createCategoryValidation = [
  body('label')
    .trim()
    .notEmpty()
    .withMessage('Category label is required')
    .isLength({ min: 1, max: 250 })
    .withMessage('Category label must be between 1 and 250 characters'),

  body('description')
    .optional()
    .customSanitizer(value => {
      // Convert empty string to null
      if (value === '') {
        return null;
      }
      return value;
    })
    .if((value) => value !== null)
    .trim()
    .isLength({ max: 65535 })
    .withMessage('Description exceeds maximum length')
];

export const updateCategoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),

  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Category label must be between 1 and 250 characters'),

  body('description')
    .optional()
    .customSanitizer(value => {
      // Convert empty string to null
      if (value === '') {
        return null;
      }
      return value;
    })
    .if((value) => value !== null)
    .trim()
    .isLength({ max: 65535 })
    .withMessage('Description exceeds maximum length')
];

export const categoryIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID')
];

export const getCategoryWithSubcategoriesValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID')
];