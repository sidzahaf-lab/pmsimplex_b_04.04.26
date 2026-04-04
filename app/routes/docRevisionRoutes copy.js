// src/routes/docRevisionRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllRevisions,
  getRevisionsByDoc,
  getRevisionsByPeriod,
  getRevisionById,
  getLatestRevision,
  checkFileHash,
  createRevision,
  updateRevision,
  patchRevision,
  deleteRevision,
  getRevisionHistory
} from '../controllers/docRevisionController.js';

// Import validations
import {
  createRevisionValidation,
  updateRevisionValidation,
  docRevisionIdValidation,
  docRevisionsValidation,
  periodRevisionsValidation,
  checkFileHashValidation,
  latestRevisionValidation,
  revisionHistoryValidation
} from '../middleware/docRevisionValidation.js';

// Import global validators - CORRECTION IMPORTANTE
import globalValidators from '../middleware/globalValidators.js';

// =============================================
// PUBLIC ROUTES
// =============================================

/**
 * @route   POST /api/doc-revisions/check-hash
 * @desc    Check file hash for duplicates
 * @access  Public
 */
router.post(
  '/check-hash',
  checkFileHashValidation,
  checkFileHash
);

// =============================================
// PROTECTED ROUTES
// =============================================

/**
 * @route   GET /api/doc-revisions
 * @desc    Get all revisions with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllRevisions
);

/**
 * @route   GET /api/projdocs/:projdocId/revisions
 * @desc    Get revisions by document (RESTful style)
 * @access  Private
 */
router.get(
  '/projdocs/:projdocId/revisions',
  docRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByDoc
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId
 * @desc    Get revisions by document (compatibility)
 * @access  Private
 */
router.get(
  '/document/:projdocId',
  docRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByDoc
);

/**
 * @route   GET /api/emission-periods/:periodId/revisions
 * @desc    Get revisions by period
 * @access  Private
 */
router.get(
  '/period/:periodId',
  periodRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByPeriod
);

/**
 * @route   GET /api/projdocs/:projdocId/latest-revision
 * @desc    Get latest revision by document
 * @access  Private
 */
router.get(
  '/projdocs/:projdocId/latest-revision',
  latestRevisionValidation,
  getLatestRevision
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId/latest
 * @desc    Get latest revision by document (compatibility)
 * @access  Private
 */
router.get(
  '/document/:projdocId/latest',
  latestRevisionValidation,
  getLatestRevision
);

/**
 * @route   GET /api/projdocs/:projdocId/revision-history
 * @desc    Get revision history for document
 * @access  Private
 */
router.get(
  '/projdocs/:projdocId/revision-history',
  revisionHistoryValidation,
  getRevisionHistory
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId/history
 * @desc    Get revision history for document (compatibility)
 * @access  Private
 */
router.get(
  '/document/:projdocId/history',
  revisionHistoryValidation,
  getRevisionHistory
);

/**
 * @route   POST /api/projdocs/:projdocId/revisions
 * @desc    Create revision (RESTful style)
 * @access  Private
 */
router.post(
  '/projdocs/:projdocId/revisions',
  createRevisionValidation,
  createRevision
);

/**
 * @route   POST /api/doc-revisions/document/:projdocId
 * @desc    Create revision (compatibility)
 * @access  Private
 */
router.post(
  '/document/:projdocId',
  createRevisionValidation,
  createRevision
);

/**
 * @route   GET /api/doc-revisions/:id
 * @desc    Get revision by ID
 * @access  Private
 */
router.get(
  '/:id',
  docRevisionIdValidation,
  getRevisionById
);

/**
 * @route   PUT /api/doc-revisions/:id
 * @desc    Update revision
 * @access  Private
 */
router.put(
  '/:id',
  updateRevisionValidation,
  updateRevision
);

/**
 * @route   PATCH /api/doc-revisions/:id
 * @desc    Partially update revision
 * @access  Private
 */
router.patch(
  '/:id',
  updateRevisionValidation,
  patchRevision
);

/**
 * @route   DELETE /api/doc-revisions/:id
 * @desc    Delete revision
 * @access  Private
 */
router.delete(
  '/:id',
  docRevisionIdValidation,
  deleteRevision
);

export default router;