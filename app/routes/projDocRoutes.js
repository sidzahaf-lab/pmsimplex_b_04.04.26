// backend/app/routes/projdocRoutes.js

import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllProjDocs,
  getDocsByProject,
  getProjDocById,
  getDocByNumber,
  checkDocNumberAvailability,
  createProjDoc,
  updateProjDoc,
  patchProjDoc,
  deleteProjDoc,
  toggleDocStatus,
  generatePeriods,
  getDocumentPeriodsWithStatus,
  getDocStats,
  checkUniqueDocument
} from '../controllers/projDocController.js';

// Import validations
import {
  createProjDocValidation,
  updateProjDocValidation,
  projDocIdValidation,
  projectDocsValidation,
  docNumberValidation,
  toggleDocStatusValidation
} from '../middleware/projDocValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   GET /api/projdocs/project/:projectId/check-number/:docNumber
 * @desc    Check document number availability
 * @access  Public
 */
router.get(
  '/project/:projectId/check-number/:docNumber',
  docNumberValidation,
  checkDocNumberAvailability
);

/**
 * @route   GET /api/projdocs/project/:projectId/number/:docNumber
 * @desc    Get document by doc number
 * @access  Public
 */
router.get(
  '/project/:projectId/number/:docNumber',
  docNumberValidation,
  getDocByNumber
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/projdocs
 * @desc    Get all project documents with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllProjDocs
);

/**
 * @route   GET /api/projdocs/project/:projectId/docs
 * @desc    Get documents by project
 * @access  Private
 */
router.get(
  '/project/:projectId/docs',
  projectDocsValidation,
  globalValidators.validatePagination,
  getDocsByProject
);

/**
 * @route   GET /api/projdocs/project/:projectId/docs/stats
 * @desc    Get document statistics
 * @access  Private
 */
router.get(
  '/project/:projectId/docs/stats',
  projectDocsValidation,
  getDocStats
);

/**
 * @route   POST /api/projdocs/project/:projectId/docs
 * @desc    Create document
 * @access  Private
 */
router.post(
  '/project/:projectId/docs',
  createProjDocValidation,
  createProjDoc
);

/**
 * @route   POST /api/projdocs/:id/generate-periods
 * @desc    Generate periods for a periodic document (in doc_revisions)
 * @access  Private
 */
router.post(
  '/:id/generate-periods',
  projDocIdValidation,
  generatePeriods
);

/**
 * @route   GET /api/projdocs/:id/periods-with-status
 * @desc    Get all periods for a periodic document with upload status
 * @access  Private
 */
router.get(
  '/:id/periods-with-status',
  projDocIdValidation,
  getDocumentPeriodsWithStatus
);

/**
 * @route   PATCH /api/projdocs/:id/status
 * @desc    Toggle document status
 * @access  Private
 */
router.patch(
  '/:id/status',
  toggleDocStatusValidation,
  toggleDocStatus
);

/**
 * @route   GET /api/projdocs/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get(
  '/:id',
  projDocIdValidation,
  getProjDocById
);

/**
 * @route   PUT /api/projdocs/:id
 * @desc    Update document (full update)
 * @access  Private
 */
router.put(
  '/:id',
  updateProjDocValidation,
  updateProjDoc
);

/**
 * @route   PATCH /api/projdocs/:id
 * @desc    Update document (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  updateProjDocValidation,
  patchProjDoc
);

/**
 * @route   DELETE /api/projdocs/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete(
  '/:id',
  projDocIdValidation,
  deleteProjDoc
);

/**
 * @route   GET /api/projdocs/check-unique/:projectId/:docTypeId
 * @desc    Check if a unique document already exists for a project and doc type
 * @access  Private
 */
router.get(
  '/check-unique/:projectId/:docTypeId',
  checkUniqueDocument
);

export default router;