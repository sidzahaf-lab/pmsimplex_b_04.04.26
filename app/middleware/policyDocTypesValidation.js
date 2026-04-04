import { body, param, validationResult } from 'express-validator';

// Helper function to validate UUID format
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validation for policy_doc_type ID parameter
 */
export const policyDocTypeIdValidation = [
  param('id')
    .custom(isValidUUID)
    .withMessage('Invalid policy-document type association ID format. Must be a valid UUID.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * Validation for policy ID parameter
 */
export const policyIdValidation = [
  param('policyId')
    .custom(isValidUUID)
    .withMessage('Invalid policy ID format. Must be a valid UUID.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * Validation for document type ID parameter
 */
export const docTypeIdValidation = [
  param('docTypeId')
    .custom(isValidUUID)
    .withMessage('Invalid document type ID format. Must be a valid UUID.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * Validation for creating a single policy-document type association
 */
export const createPolicyDocTypeValidation = [
  body('policy_id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Policy ID must be a valid UUID if provided'),
  body('policyId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Policy ID must be a valid UUID if provided'),
  body('doc_type_id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Document type ID must be a valid UUID if provided'),
  body('docTypeId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Document type ID must be a valid UUID if provided'),
  body('documentTypeId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Document type ID must be a valid UUID if provided'),
  (req, res, next) => {
    // Check if at least one of the fields is provided
    const hasPolicyId = req.body.policy_id || req.body.policyId;
    const hasDocTypeId = req.body.doc_type_id || req.body.docTypeId || req.body.documentTypeId;
    
    if (!hasPolicyId) {
      return res.status(400).json({ 
        success: false, 
        errors: [{ msg: 'Policy ID is required', param: 'policy_id/policyId' }]
      });
    }
    
    if (!hasDocTypeId) {
      return res.status(400).json({ 
        success: false, 
        errors: [{ msg: 'Document type ID is required', param: 'doc_type_id/docTypeId/documentTypeId' }]
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * Validation for bulk creating policy-document type associations
 */
export const bulkCreatePolicyDocTypesValidation = [
  body('associations')
    .isArray({ min: 1 }).withMessage('Associations must be a non-empty array'),
  body('associations.*.policy_id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Each policy ID must be a valid UUID'),
  body('associations.*.policyId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Each policy ID must be a valid UUID'),
  body('associations.*.doc_type_id')
    .optional()
    .custom(isValidUUID)
    .withMessage('Each document type ID must be a valid UUID'),
  body('associations.*.docTypeId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Each document type ID must be a valid UUID'),
  body('associations.*.documentTypeId')
    .optional()
    .custom(isValidUUID)
    .withMessage('Each document type ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    // Validate each association has required fields
    const associations = req.body.associations;
    const invalidAssociations = [];
    
    associations.forEach((item, index) => {
      const hasPolicyId = item.policy_id || item.policyId;
      const hasDocTypeId = item.doc_type_id || item.docTypeId || item.documentTypeId;
      
      if (!hasPolicyId) {
        invalidAssociations.push(`Index ${index}: Missing policy ID`);
      }
      if (!hasDocTypeId) {
        invalidAssociations.push(`Index ${index}: Missing document type ID`);
      }
    });
    
    if (invalidAssociations.length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors: invalidAssociations.map(msg => ({ msg }))
      });
    }
    
    next();
  }
];