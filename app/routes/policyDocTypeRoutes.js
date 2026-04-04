import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllPolicyDocTypes,
  getPolicyDocTypeById,
  getDocTypesByPolicyId,
  getPoliciesByDocTypeId,
  createPolicyDocType,
  bulkCreatePolicyDocTypes,
  deletePolicyDocType,
  deleteAllPolicyDocTypesByPolicy,
  deleteAllPolicyDocTypesByDocType
} from '../controllers/policyDocTypesController.js';

// Import validations
import {
  policyDocTypeIdValidation,
  createPolicyDocTypeValidation,
  bulkCreatePolicyDocTypesValidation,
  policyIdValidation,
  docTypeIdValidation
} from '../middleware/policyDocTypesValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/policy-doc-types
 * @desc    Get all policy-document type associations with pagination and filtering
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllPolicyDocTypes
);

/**
 * @route   GET /api/policy-doc-types/by-policy/:policyId
 * @desc    Get all document types associated with a specific policy
 * @access  Private
 */
router.get(
  '/by-policy/:policyId',
  policyIdValidation,
  globalValidators.validatePagination,
  getDocTypesByPolicyId
);

/**
 * @route   GET /api/policy-doc-types/by-doctype/:docTypeId
 * @desc    Get all policies associated with a specific document type
 * @access  Private
 */
router.get(
  '/by-doctype/:docTypeId',
  docTypeIdValidation,
  globalValidators.validatePagination,
  getPoliciesByDocTypeId
);

/**
 * @route   POST /api/policy-doc-types
 * @desc    Create a new policy-document type association
 * @access  Private
 */
router.post(
  '/',
  createPolicyDocTypeValidation,
  createPolicyDocType
);

/**
 * @route   POST /api/policy-doc-types/bulk
 * @desc    Create multiple policy-document type associations at once
 * @access  Private
 */
router.post(
  '/bulk',
  bulkCreatePolicyDocTypesValidation,
  bulkCreatePolicyDocTypes
);

/**
 * @route   GET /api/policy-doc-types/:id
 * @desc    Get policy-document type association by ID
 * @access  Private
 */
router.get(
  '/:id',
  policyDocTypeIdValidation,
  getPolicyDocTypeById
);

/**
 * @route   DELETE /api/policy-doc-types/:id
 * @desc    Delete a specific policy-document type association
 * @access  Private
 */
router.delete(
  '/:id',
  policyDocTypeIdValidation,
  deletePolicyDocType
);

/**
 * @route   DELETE /api/policy-doc-types/by-policy/:policyId
 * @desc    Delete all document type associations for a specific policy
 * @access  Private
 */
router.delete(
  '/by-policy/:policyId',
  policyIdValidation,
  deleteAllPolicyDocTypesByPolicy
);

/**
 * @route   DELETE /api/policy-doc-types/by-doctype/:docTypeId
 * @desc    Delete all policy associations for a specific document type
 * @access  Private
 */
router.delete(
  '/by-doctype/:docTypeId',
  docTypeIdValidation,
  deleteAllPolicyDocTypesByDocType
);

export default router;