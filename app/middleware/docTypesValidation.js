import { body, param } from 'express-validator';

// Strict list of safe, commonly used file extensions
const ALLOWED_FILE_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp',
  
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp',
  
  // Project Management
  '.mpp', '.xer', '.xml', '.csv',
  
  // CAD/Drawing
  '.dwg', '.dxf', '.skp', '.rvt', '.ifc',
  
  // Archives (read-only, not executable)
  '.zip', '.rar', '.7z',
  
  // Web/Data (safe viewing)
  '.html', '.htm', '.json', '.yaml', '.yml', '.md'
];

// Dangerous extensions that should NEVER be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.jse',
  '.wsf', '.wsh', '.msi', '.msp', '.mst', '.scr', '.cpl', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.cfm', '.py', '.rb', '.pl',
  '.com', '.pif', '.application', '.gadget', '.msc', '.vb', '.vbe',
  '.htaccess', '.htpasswd', '.sql', '.bak', '.swp', '.tmp'
];

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

  body('entity_type')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity type must be between 1 and 100 characters')
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
        format = format.trim().toLowerCase();
        
        // Check if format starts with a dot
        if (!format.startsWith('.')) {
          throw new Error(`Each format must start with a dot (e.g., .pdf): ${format}`);
        }
        
        // Check minimum length (dot + at least one character)
        if (format.length < 2) {
          throw new Error(`Invalid format extension: ${format}`);
        }
        
        // Validate extension format (only letters after the dot)
        if (!/^\.[a-z]+$/.test(format)) {
          throw new Error(`Invalid format extension: ${format}. Use only letters after the dot (e.g., .pdf, .docx). No numbers or special characters.`);
        }
        
        // Check if extension is in dangerous list (reject)
        if (DANGEROUS_EXTENSIONS.includes(format)) {
          throw new Error(`Extension ${format} is not allowed for security reasons.`);
        }
        
        // Check if extension is in allowed list
        if (!ALLOWED_FILE_EXTENSIONS.includes(format)) {
          throw new Error(`Extension ${format} is not in the allowed list. Allowed extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
        }
      }
      
      return true;
    })
    .customSanitizer(value => {
      // Normalize formats: remove spaces, lowercase, and ensure clean format
      return value.split(',')
        .map(f => f.trim().toLowerCase())
        .filter(f => f.startsWith('.') && f.length > 1)
        .join(',');
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

  body('entity_type')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity type must be between 1 and 100 characters')
    .toLowerCase(),

  body('native_format')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Native format must be between 1 and 100 characters')
    .custom((value) => {
      const formats = value.split(',');
      
      for (let format of formats) {
        format = format.trim().toLowerCase();
        
        // Check if format starts with a dot
        if (!format.startsWith('.')) {
          throw new Error(`Each format must start with a dot (e.g., .pdf): ${format}`);
        }
        
        // Check minimum length
        if (format.length < 2) {
          throw new Error(`Invalid format extension: ${format}`);
        }
        
        // Validate extension format (only letters after the dot)
        if (!/^\.[a-z]+$/.test(format)) {
          throw new Error(`Invalid format extension: ${format}. Use only letters after the dot (e.g., .pdf, .docx). No numbers or special characters.`);
        }
        
        // Check if extension is in dangerous list (reject)
        if (DANGEROUS_EXTENSIONS.includes(format)) {
          throw new Error(`Extension ${format} is not allowed for security reasons.`);
        }
        
        // Check if extension is in allowed list
        if (!ALLOWED_FILE_EXTENSIONS.includes(format)) {
          throw new Error(`Extension ${format} is not in the allowed list. Allowed extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
        }
      }
      
      return true;
    })
    .customSanitizer(value => {
      // Normalize formats: remove spaces, lowercase
      return value.split(',')
        .map(f => f.trim().toLowerCase())
        .filter(f => f.startsWith('.') && f.length > 1)
        .join(',');
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
    .custom((value) => {
      // Extract extension and validate
      const ext = '.' + value.split('.').pop()?.toLowerCase();
      
      // Check if extension is in dangerous list
      if (DANGEROUS_EXTENSIONS.includes(ext)) {
        throw new Error(`File extension ${ext} is not allowed for security reasons.`);
      }
      
      // Check if extension is in allowed list
      if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        throw new Error(`File extension ${ext} is not in the allowed list. Allowed extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      }
      
      return true;
    })
];