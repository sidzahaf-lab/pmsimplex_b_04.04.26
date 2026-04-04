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
  getRevisionHistory,
  downloadRevision,
  uploadFile,
  getRevisionsByStatus,
  getRevisionsByUploader,
  getDuplicateRevisions
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
  revisionHistoryValidation,
  statusQueryValidation,
  uploaderRevisionsValidation
} from '../middleware/docRevisionValidation.js';

// Import global validators
import globalValidators from '../middleware/globalValidators.js';

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

/**
 * @route   POST /api/doc-revisions/check-hash
 * @desc    Check file hash for duplicates before upload
 * @access  Public (or Private with API key)
 * @body    {string} hash - SHA256 hash of file to check
 * @returns {object} { exists: boolean, revision: object|null }
 */
router.post(
  '/check-hash',
  checkFileHashValidation,
  checkFileHash
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware here when ready
// router.use(protect);

/**
 * @route   GET /api/doc-revisions
 * @desc    Get all revisions with filtering and pagination
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} status - Filter by status (pending/received/late)
 * @query   {string} period_id - Filter by period ID
 * @query   {string} projdoc_id - Filter by document ID
 * @query   {string} from_date - Filter by upload date (>=)
 * @query   {string} to_date - Filter by upload date (<=)
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllRevisions
);

/**
 * @route   GET /api/doc-revisions/status/:status
 * @desc    Get revisions by status
 * @access  Private
 * @param   {string} status - pending|received|late
 */
router.get(
  '/status/:status',
  statusQueryValidation,
  globalValidators.validatePagination,
  getRevisionsByStatus
);

/**
 * @route   GET /api/doc-revisions/uploader/:userId
 * @desc    Get revisions by uploader
 * @access  Private
 * @param   {string} userId - Uploader UUID
 */
router.get(
  '/uploader/:userId',
  uploaderRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByUploader
);

/**
 * @route   GET /api/doc-revisions/duplicates
 * @desc    Find duplicate revisions (same hash)
 * @access  Private (Admin only)
 */
router.get(
  '/duplicates',
  globalValidators.validatePagination,
  getDuplicateRevisions
);

/**
 * @route   GET /api/projdocs/:projdocId/revisions
 * @desc    Get all revisions for a specific document (RESTful)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/projdocs/:projdocId/revisions',
  docRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByDoc
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId
 * @desc    Get revisions by document (legacy/compatibility)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/document/:projdocId',
  docRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByDoc
);

/**
 * @route   GET /api/emission-periods/:periodId/revisions
 * @desc    Get all revisions for a specific period
 * @access  Private
 * @param   {string} periodId - Period UUID
 */
router.get(
  '/period/:periodId',
  periodRevisionsValidation,
  globalValidators.validatePagination,
  getRevisionsByPeriod
);

/**
 * @route   GET /api/projdocs/:projdocId/latest-revision
 * @desc    Get the latest revision of a document (RESTful)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/projdocs/:projdocId/latest-revision',
  latestRevisionValidation,
  getLatestRevision
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId/latest
 * @desc    Get the latest revision of a document (legacy)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/document/:projdocId/latest',
  latestRevisionValidation,
  getLatestRevision
);

/**
 * @route   GET /api/projdocs/:projdocId/revision-history
 * @desc    Get complete revision history for a document (RESTful)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/projdocs/:projdocId/revision-history',
  revisionHistoryValidation,
  getRevisionHistory
);

/**
 * @route   GET /api/doc-revisions/document/:projdocId/history
 * @desc    Get revision history for document (legacy)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.get(
  '/document/:projdocId/history',
  revisionHistoryValidation,
  getRevisionHistory
);

/**
 * @route   POST /api/projdocs/:projdocId/revisions
 * @desc    Create a new revision with file upload (RESTful)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 * @body    {multipart/form-data} file - The file to upload
 * @body    {string} period_id - Associated period ID (optional)
 * @body    {string} revision_notes - Revision notes (optional)
 * @body    {string} revision_code - Internal code (optional)
 */
router.post(
  '/projdocs/:projdocId/revisions',
  uploadFile,
  createRevisionValidation,
  createRevision
);

/**
 * @route   POST /api/doc-revisions/document/:projdocId
 * @desc    Create a new revision (legacy)
 * @access  Private
 * @param   {string} projdocId - Document UUID
 */
router.post(
  '/document/:projdocId',
  uploadFile,
  createRevisionValidation,
  createRevision
);

/**
 * @route   GET /api/doc-revisions/:id/download
 * @desc    Download a specific revision file
 * @access  Private
 * @param   {string} id - Revision UUID
 * @returns {file} The file as a download
 */
router.get(
  '/:id/download',
  docRevisionIdValidation,
  downloadRevision
);

/**
 * @route   GET /api/doc-revisions/:id
 * @desc    Get a single revision by ID
 * @access  Private
 * @param   {string} id - Revision UUID
 */
router.get(
  '/:id',
  docRevisionIdValidation,
  getRevisionById
);

/**
 * @route   PUT /api/doc-revisions/:id
 * @desc    Fully update a revision (all fields required)
 * @access  Private
 * @param   {string} id - Revision UUID
 * @body    {object} revisionData - Complete revision data
 */
router.put(
  '/:id',
  updateRevisionValidation,
  updateRevision
);

/**
 * @route   PATCH /api/doc-revisions/:id
 * @desc    Partially update a revision
 * @access  Private
 * @param   {string} id - Revision UUID
 * @body    {object} revisionData - Fields to update
 */
router.patch(
  '/:id',
  updateRevisionValidation,
  patchRevision
);

/**
 * @route   DELETE /api/doc-revisions/:id
 * @desc    Delete a revision (soft delete or hard delete)
 * @access  Private (Admin only)
 * @param   {string} id - Revision UUID
 */
router.delete(
  '/:id',
  docRevisionIdValidation,
  deleteRevision
);

export default router;