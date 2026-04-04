// src/routes/emissionPeriodRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllEmissionPeriods,
  getPeriodsByPolicy,
  getEmissionPeriodById,
  createEmissionPeriod,
  updateEmissionPeriod,
  patchEmissionPeriod,
  deleteEmissionPeriod,
  getOverduePeriods,
  getUpcomingPeriods,
  getPeriodsByDateRange,
  getPolicyPeriodsSummary,
  bulkCreateEmissionPeriods,
  getPeriodStatistics,
  getPeriodsWithRevisions,
  getPeriodsByYear,
  getPeriodsByQuarter,
  getPeriodRevisionStatus,
  checkPeriodCompliance  // ✅ ADD THIS MISSING IMPORT
} from '../controllers/emissionPeriodController.js';

// Import validations
import {
  createEmissionPeriodValidation,
  updateEmissionPeriodValidation,
  emissionPeriodIdValidation,
  policyPeriodsValidation,
  dateRangeValidation,
  bulkPeriodsValidation,
  periodStatisticsValidation,
  yearValidation,
  quarterValidation,
  periodRevisionStatusValidation,
  complianceCheckValidation  // ✅ ADD THIS IMPORT
} from '../middleware/emissionPeriodValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   POST /api/emission-periods/check-compliance
 * @desc    Check period compliance based on revisions (cron job endpoint)
 * @access  Public (should be restricted with API key in production)
 * @body    {boolean} dry_run - If true, only report without updating
 * @returns {object} Compliance check results
 */
router.post(
  '/check-compliance',
  complianceCheckValidation,  // ✅ Use the correct validation
  checkPeriodCompliance
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware here when ready
// router.use(protect);

/**
 * @route   GET /api/emission-periods
 * @desc    Get all emission periods with filtering and pagination
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} policyId - Filter by policy ID
 * @query   {string} from_date - Filter by period start date (>=) (YYYY-MM-DD)
 * @query   {string} to_date - Filter by period end date (<=) (YYYY-MM-DD)
 * @query   {string} year - Filter by year
 * @query   {number} quarter - Filter by quarter (1-4)
 * @query   {boolean} withRevisions - Include revision data
 * @query   {string} sort - Sort field (period_start, period_end, expected_at, created_at)
 * @query   {string} order - Sort order (ASC, DESC)
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllEmissionPeriods
);

/**
 * @route   GET /api/emission-periods/overdue
 * @desc    Get all overdue periods (expected_at < today)
 * @access  Private
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {string} policyId - Filter by policy ID
 */
router.get(
  '/overdue',
  globalValidators.validatePagination,
  getOverduePeriods
);

/**
 * @route   GET /api/emission-periods/upcoming
 * @desc    Get upcoming periods (expected_at >= today)
 * @access  Private
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {number} days - Days ahead to look (default: 30, max: 365)
 * @query   {string} policyId - Filter by policy ID
 */
router.get(
  '/upcoming',
  globalValidators.validatePagination,
  getUpcomingPeriods
);

/**
 * @route   GET /api/emission-periods/with-revisions
 * @desc    Get periods that have associated revisions/documents
 * @access  Private
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 */
router.get(
  '/with-revisions',
  globalValidators.validatePagination,
  getPeriodsWithRevisions
);

/**
 * @route   GET /api/emission-periods/statistics
 * @desc    Get period statistics for dashboard
 * @access  Private
 * @query   {string} policyId - Filter by policy (optional)
 * @query   {string} from_date - Start date for statistics (YYYY-MM-DD)
 * @query   {string} to_date - End date for statistics (YYYY-MM-DD)
 * @query   {number} year - Filter by year
 * @returns {object} Statistics including counts, overdue rates, trends
 */
router.get(
  '/statistics',
  periodStatisticsValidation,
  getPeriodStatistics
);

/**
 * @route   GET /api/emission-periods/year/:year
 * @desc    Get periods by year
 * @access  Private
 * @param   {number} year - Year (e.g., 2024)
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 */
router.get(
  '/year/:year',
  yearValidation,
  globalValidators.validatePagination,
  getPeriodsByYear
);

/**
 * @route   GET /api/emission-periods/year/:year/quarter/:quarter
 * @desc    Get periods by year and quarter
 * @access  Private
 * @param   {number} year - Year (e.g., 2024)
 * @param   {number} quarter - Quarter (1-4)
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 */
router.get(
  '/year/:year/quarter/:quarter',
  quarterValidation,
  globalValidators.validatePagination,
  getPeriodsByQuarter
);

/**
 * @route   GET /api/emission-policies/:policyId/periods
 * @desc    Get all emission periods for a specific policy
 * @access  Private
 * @param   {string} policyId - Policy UUID
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {string} year - Filter by year
 * @query   {number} quarter - Filter by quarter
 * @query   {string} from_date - Start date
 * @query   {string} to_date - End date
 */
router.get(
  '/policy/:policyId',
  policyPeriodsValidation,
  globalValidators.validatePagination,
  getPeriodsByPolicy
);

/**
 * @route   GET /api/emission-policies/:policyId/periods/summary
 * @desc    Get summary statistics of periods for a policy
 * @access  Private
 * @param   {string} policyId - Policy UUID
 * @returns {object} Summary with counts, latest period, next expected
 */
router.get(
  '/policy/:policyId/summary',
  policyPeriodsValidation,
  getPolicyPeriodsSummary
);

/**
 * @route   GET /api/emission-policies/:policyId/periods/revision-status
 * @desc    Get revision status for all periods of a policy
 * @access  Private
 * @param   {string} policyId - Policy UUID
 * @returns {array} Periods with their revision status (from doc_revisions)
 */
router.get(
  '/policy/:policyId/revision-status',
  policyPeriodsValidation,
  getPeriodRevisionStatus
);

/**
 * @route   GET /api/emission-periods/date-range
 * @desc    Get periods within a specific date range
 * @access  Private
 * @query   {string} start - Start date (required, YYYY-MM-DD)
 * @query   {string} end - End date (required, YYYY-MM-DD)
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 */
router.get(
  '/date-range',
  dateRangeValidation,
  globalValidators.validatePagination,
  getPeriodsByDateRange
);

/**
 * @route   GET /api/emission-periods/:id
 * @desc    Get a single emission period by ID
 * @access  Private
 * @param   {string} id - Period UUID
 * @query   {boolean} includeRevisions - Include associated revisions
 * @query   {boolean} includePolicy - Include policy details
 */
router.get(
  '/:id',
  emissionPeriodIdValidation,
  getEmissionPeriodById
);

/**
 * @route   GET /api/emission-periods/:id/revision-status
 * @desc    Get revision status for a specific period (from doc_revisions)
 * @access  Private
 * @param   {string} id - Period UUID
 * @returns {object} Period with revision status and document list
 */
router.get(
  '/:id/revision-status',
  emissionPeriodIdValidation,
  getPeriodRevisionStatus
);

/**
 * @route   POST /api/emission-policies/:policyId/periods
 * @desc    Create a new emission period for a policy
 * @access  Private
 * @param   {string} policyId - Policy UUID
 * @body    {string} period_label - Period label (e.g., "W12-2025")
 * @body    {string} period_start - Start date (YYYY-MM-DD)
 * @body    {string} period_end - End date (YYYY-MM-DD)
 * @body    {string} expected_at - Expected submission date (optional)
 */
router.post(
  '/policy/:policyId',
  createEmissionPeriodValidation,
  createEmissionPeriod
);

/**
 * @route   POST /api/emission-policies/:policyId/periods/bulk
 * @desc    Create multiple emission periods at once
 * @access  Private (Admin only)
 * @param   {string} policyId - Policy UUID
 * @body    {array} periods - Array of period objects
 * @body    {string} periods[].period_label - Period label
 * @body    {string} periods[].period_start - Start date
 * @body    {string} periods[].period_end - End date
 * @body    {string} periods[].expected_at - Expected date (optional)
 */
router.post(
  '/policy/:policyId/bulk',
  bulkPeriodsValidation,
  bulkCreateEmissionPeriods
);

/**
 * @route   PUT /api/emission-periods/:id
 * @desc    Fully update an emission period (all fields required)
 * @access  Private
 * @param   {string} id - Period UUID
 * @body    {string} period_label - Period label
 * @body    {string} period_start - Start date
 * @body    {string} period_end - End date
 * @body    {string} expected_at - Expected date (optional)
 */
router.put(
  '/:id',
  updateEmissionPeriodValidation,
  updateEmissionPeriod
);

/**
 * @route   PATCH /api/emission-periods/:id
 * @desc    Partially update an emission period
 * @access  Private
 * @param   {string} id - Period UUID
 * @body    {object} fields - Any fields to update (period_label, period_start, period_end, expected_at)
 */
router.patch(
  '/:id',
  updateEmissionPeriodValidation,
  patchEmissionPeriod
);

/**
 * @route   DELETE /api/emission-periods/:id
 * @desc    Delete an emission period
 * @access  Private (Admin only)
 * @param   {string} id - Period UUID
 * @note    Will fail if period has associated revisions
 */
router.delete(
  '/:id',
  emissionPeriodIdValidation,
  deleteEmissionPeriod
);

export default router;