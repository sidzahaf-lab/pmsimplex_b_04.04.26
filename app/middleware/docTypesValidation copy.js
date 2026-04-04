import { body, param } from 'express-validator';

export const createDocTypeValidation = [
  body('subcategory_id')
    .notEmpty()
    .withMessage('Subcategory ID is required')
    .isUUID()
    .withMessage('Subcategory ID must be a valid UUID'),

  body('label')
    .trim()
    .notEmpty()
    .withMessage('Document type label is required')
    .isLength({ min: 1, max: 250 })
    .withMessage('Document type label must be between 1 and 250 characters'),

  body('is_periodic')
    .optional()
    .isBoolean()
    .withMessage('is_periodic must be a boolean value')
    .toBoolean(),

  body('only_one_per_project')
    .optional()
    .isBoolean()
    .withMessage('only_one_per_project must be a boolean value')
    .toBoolean(),

  // UPDATED: Removed enum restriction, now allows any value
  body('entity_type')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity type must be between 1 and 100 characters')
    // .isIn(['schedule', 'report', 'drawing', 'specification', 'calculation', 'other']) // REMOVED
    // .withMessage('Entity type must be one of: schedule, report, drawing, specification, calculation, other') // REMOVED
    .toLowerCase(),

  body('native_format')
    .trim()
    .notEmpty()
    .withMessage('Native format is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Native format must be between 1 and 100 characters')
    .custom((value) => {
      const formats = value.split(',');
      for (let format of formats) {
        format = format.trim();
        if (!format.startsWith('.')) {
          throw new Error(`Each format must start with a dot (e.g., .pdf): ${format}`);
        }
        if (format.length < 2) {
          throw new Error(`Invalid format extension: ${format}`);
        }
        // Validate extension format (only letters, numbers, and dots)
        if (!/^\.[a-zA-Z0-9]+$/.test(format)) {
          throw new Error(`Invalid format extension: ${format}. Use only letters and numbers after the dot.`);
        }
      }
      return true;
    })
    .customSanitizer(value => {
      // Normalize formats: remove spaces, lowercase
      return value.split(',').map(f => f.trim().toLowerCase()).join(',');
    })
];

export const updateDocTypeValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid document type ID'),

  body('subcategory_id')
    .optional()
    .isUUID()
    .withMessage('Subcategory ID must be a valid UUID'),

  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Document type label must be between 1 and 250 characters'),

  body('is_periodic')
    .optional()
    .isBoolean()
    .withMessage('is_periodic must be a boolean value')
    .toBoolean(),

  body('only_one_per_project')
    .optional()
    .isBoolean()
    .withMessage('only_one_per_project must be a boolean value')
    .toBoolean(),

  // UPDATED: Removed enum restriction, now allows any value
  body('entity_type')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity type must be between 1 and 100 characters')
    // .isIn(['schedule', 'report', 'drawing', 'specification', 'calculation', 'other']) // REMOVED
    // .withMessage('Entity type must be one of: schedule, report, drawing, specification, calculation, other') // REMOVED
    .toLowerCase(),

  body('native_format')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Native format must be between 1 and 100 characters')
    .custom((value) => {
      const formats = value.split(',');
      for (let format of formats) {
        format = format.trim();
        if (!format.startsWith('.')) {
          throw new Error(`Each format must start with a dot (e.g., .pdf): ${format}`);
        }
        if (format.length < 2) {
          throw new Error(`Invalid format extension: ${format}`);
        }
        // Validate extension format (only letters, numbers, and dots)
        if (!/^\.[a-zA-Z0-9]+$/.test(format)) {
          throw new Error(`Invalid format extension: ${format}. Use only letters and numbers after the dot.`);
        }
      }
      return true;
    })
    .customSanitizer(value => {
      // Normalize formats: remove spaces, lowercase
      return value.split(',').map(f => f.trim().toLowerCase()).join(',');
    })
];

export const docTypeIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid document type ID')
];

export const docTypesBySubcategoryValidation = [
  param('subcategoryId')
    .isUUID()
    .withMessage('Invalid subcategory ID')
];

export const docTypesByEntityTypeValidation = [
  param('entityType')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    // .isIn(['schedule', 'report', 'drawing', 'specification', 'calculation', 'other']) // REMOVED
    // .withMessage('Entity type must be one of: schedule, report, drawing, specification, calculation, other') // REMOVED
    .toLowerCase()
];

export const validateFileFormatValidation = [
  body('docTypeId')
    .notEmpty()
    .withMessage('Document type ID is required')
    .isUUID()
    .withMessage('Document type ID must be a valid UUID'),

  body('filename')
    .trim()
    .notEmpty()
    .withMessage('Filename is required')
    .isLength({ max: 255 })
    .withMessage('Filename must not exceed 255 characters')
    .custom((value) => {
      // Check for invalid characters in filename
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(value)) {
        throw new Error('Filename contains invalid characters');
      }
      return true;
    })
    .custom((value) => {
      // Check if filename has an extension
      if (!value.includes('.')) {
        throw new Error('Filename must have an extension');
      }
      return true;
    })
];