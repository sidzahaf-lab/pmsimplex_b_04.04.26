// src/routes/periodicReportRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllPeriodicReports,
  getReportByProjdocId,
  getReportById,
  createPeriodicReport,
  updatePeriodicReport,
  patchPeriodicReport,
  deletePeriodicReport,
  getReportsBySignatory,
  getReportsByTemplate
} from '../controllers/periodicReportController.js';

// Import validations
import {
  createReportValidation,
  updateReportValidation,
  reportIdValidation,
  reportByProjdocValidation,
  reportsBySignatoryValidation,
  reportsByTemplateValidation
} from '../middleware/periodicReportValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// None for periodic reports

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/periodic-reports
 * @desc    Get all periodic reports with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllPeriodicReports
);

/**
 * @route   GET /api/periodic-reports/signatory/:signatoryId
 * @desc    Get reports by signatory
 * @access  Private
 */
router.get(
  '/signatory/:signatoryId',
  reportsBySignatoryValidation,
  globalValidators.validatePagination,
  getReportsBySignatory
);

/**
 * @route   GET /api/periodic-reports/template/:templateRef
 * @desc    Get reports by template
 * @access  Private
 */
router.get(
  '/template/:templateRef',
  reportsByTemplateValidation,
  globalValidators.validatePagination,
  getReportsByTemplate
);

/**
 * @route   GET /api/projdocs/:projdocId/report
 * @desc    Get periodic report by projdoc ID
 * @access  Private
 */
router.get(
  '/document/:projdocId',
  reportByProjdocValidation,
  getReportByProjdocId
);

/**
 * @route   POST /api/projdocs/:projdocId/report
 * @desc    Create periodic report
 * @access  Private
 */
router.post(
  '/document/:projdocId',
  createReportValidation,
  createPeriodicReport
);

/**
 * @route   GET /api/periodic-reports/:id
 * @desc    Get periodic report by ID
 * @access  Private
 */
router.get(
  '/:id',
  reportIdValidation,
  getReportById
);

/**
 * @route   PUT /api/periodic-reports/:id
 * @desc    Update periodic report (full update)
 * @access  Private
 */
router.put(
  '/:id',
  updateReportValidation,
  updatePeriodicReport
);

/**
 * @route   PATCH /api/periodic-reports/:id
 * @desc    Update periodic report (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  updateReportValidation,
  patchPeriodicReport
);

/**
 * @route   DELETE /api/periodic-reports/:id
 * @desc    Delete periodic report
 * @access  Private
 */
router.delete(
  '/:id',
  reportIdValidation,
  deletePeriodicReport
);

export default router;