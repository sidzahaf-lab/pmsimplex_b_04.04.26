// src/routes/emissionPolicyRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers - using default import since controller exports default object
import emissionPolicyController from '../controllers/emissionPolicyController.js';

// Import validations
import {
  createEmissionPolicyValidation,
  updateEmissionPolicyValidation,
  emissionPolicyIdValidation,
  projectEmissionPoliciesValidation,
  policyPeriodsValidation,
  policyPeriodsWithStatusValidation,
  generatePeriodsValidation
} from '../middleware/emissionPolicyValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// None for emission policies

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/emission-policies
 * @desc    Get all emission policies with filtering and pagination
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} project_id - Filter by project ID
 * @query   {string} frequency - Filter by frequency
 */
router.get(
  '/',
  globalValidators.validatePagination,
  emissionPolicyController.getAllEmissionPolicies
);

/**
 * @route   GET /api/projects/:projectId/emission-policies
 * @desc    Get emission policies by project
 * @access  Private
 * @param   {string} projectId - Project UUID
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {string} frequency - Filter by frequency
 */
router.get(
  '/project/:projectId',
  projectEmissionPoliciesValidation,
  globalValidators.validatePagination,
  emissionPolicyController.getEmissionPoliciesByProject
);

/**
 * @route   GET /api/emission-policies/:id/periods
 * @desc    Get all periods for a specific emission policy
 * @access  Private
 * @param   {string} id - Policy UUID
 * @query   {boolean} include_revisions - Include revision data (optional)
 */
router.get(
  '/:id/periods',
  policyPeriodsValidation,
  emissionPolicyController.getPolicyPeriods
);

/**
 * @route   GET /api/emission-policies/:id/periods/revision-status
 * @desc    Get periods for a policy with their revision status
 * @access  Private
 * @param   {string} id - Policy UUID
 * @returns {array} Periods with revision status, uploader info, and document details
 */
router.get(
  '/:id/periods/revision-status',
  policyPeriodsWithStatusValidation,
  emissionPolicyController.getPolicyPeriodsWithStatus
);

/**
 * @route   POST /api/projects/:projectId/emission-policies
 * @desc    Create emission policy
 * @access  Private
 * @param   {string} projectId - Project UUID
 * @body    {string} frequency - daily, weekly, monthly
 * @body    {string} anchor_date - Start date (YYYY-MM-DD)
 * @body    {number} anchor_day - For weekly: 1-7, for monthly: 0 or null, for daily: null
 * @body    {string} description - Policy description (optional)
 * @body    {array} doc_type_ids - Array of document type UUIDs
 * @body    {array} periods - Array of pre-generated periods (optional)
 */
router.post(
  '/project/:projectId',
  createEmissionPolicyValidation,
  emissionPolicyController.createEmissionPolicy
);

/**
 * @route   POST /api/emission-policies/:id/generate-periods
 * @desc    Generate periods for emission policy (deprecated - use frontend generation)
 * @access  Private
 */
router.post(
  '/:id/generate-periods',
  generatePeriodsValidation,
  (req, res, next) => {
    // This middleware runs before the controller
    next();
  },
  emissionPolicyController.generatePeriods
);

/**
 * @route   GET /api/emission-policies/:id
 * @desc    Get emission policy by ID
 * @access  Private
 * @param   {string} id - Policy UUID
 */
router.get(
  '/:id',
  emissionPolicyIdValidation,
  emissionPolicyController.getEmissionPolicyById
);

/**
 * @route   PUT /api/emission-policies/:id
 * @desc    Fully update an emission policy
 * @access  Private
 * @param   {string} id - Policy UUID
 * @body    {string} frequency - daily, weekly, monthly
 * @body    {string} anchor_date - Start date (YYYY-MM-DD)
 * @body    {number} anchor_day - For weekly: 1-7, for monthly: 0 or null, for daily: null
 * @body    {string} description - Policy description
 * @body    {array} doc_type_ids - Array of document type UUIDs
 */
router.put(
  '/:id',
  updateEmissionPolicyValidation,
  emissionPolicyController.updateEmissionPolicy
);

/**
 * @route   PATCH /api/emission-policies/:id
 * @desc    Partially update an emission policy
 * @access  Private
 * @param   {string} id - Policy UUID
 * @body    {object} fields - Any fields to update
 */
router.patch(
  '/:id',
  updateEmissionPolicyValidation,
  emissionPolicyController.patchEmissionPolicy
);

/**
 * @route   DELETE /api/emission-policies/:id
 * @desc    Delete an emission policy
 * @access  Private (Admin only)
 * @param   {string} id - Policy UUID
 */
router.delete(
  '/:id',
  emissionPolicyIdValidation,
  emissionPolicyController.deleteEmissionPolicy
);

export default router;