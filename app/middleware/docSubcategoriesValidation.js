import { body, param } from 'express-validator';

export const createSubcategoryValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('label')
    .trim()
    .notEmpty()
    .withMessage('Subcategory label is required')
    .isLength({ min: 1, max: 250 })
    .withMessage('Subcategory label must be between 1 and 250 characters'),

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

export const updateSubcategoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid subcategory ID'),

  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Subcategory label must be between 1 and 250 characters'),

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

export const subcategoryIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid subcategory ID')
];

export const subcategoriesByCategoryValidation = [
  param('categoryId')
    .isUUID()
    .withMessage('Invalid category ID')
];

export const getSubcategoryWithDocTypesValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid subcategory ID')
];