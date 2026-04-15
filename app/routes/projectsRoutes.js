// backend/app/routes/projectsRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import projectsController from '../controllers/projectsController.js';

// Import validations
import projectsValidation from '../middleware/projectsValidation.js';
import globalValidators from '../middleware/globalValidators.js';

import { checkDocTypeAssignment } from '../controllers/projectDocTypeController.js';

// Import auth middleware - COMMENTED OUT FOR NOW
// import { protect } from '../middleware/auth.js';

// Apply authentication middleware to all routes - COMMENTED OUT
// router.use(protect);

/**
 * GET /api/projects
 * Get all projects with filtering and pagination
 */
router.get(
  '/',
  globalValidators.validatePagination,
  projectsController.getAllProjects
);

/**
 * GET /api/projects/check-code
 * Check if a project code is available
 */
router.get(
  '/check-code',
  projectsController.checkProjectCode
);

/**
 * GET /api/projects/upcoming
 * Get upcoming projects
 */
router.get(
  '/upcoming',
  projectsController.getUpcomingProjects
);

/**
 * GET /api/projects/nearing-completion
 * Get projects nearing completion
 */
router.get(
  '/nearing-completion',
  projectsController.getProjectsNearingCompletion
);

/**
 * GET /api/projects/delayed
 * Get delayed projects
 */
router.get(
  '/delayed',
  projectsController.getDelayedProjects
);

/**
 * GET /api/projects/with-business-unit
 * Get projects with business unit details
 */
router.get(
  '/with-business-unit',
  projectsController.getProjectsWithBusinessUnit
);

/**
 * GET /api/projects/health-status/:health_status
 * Get projects by health status
 */
router.get(
  '/health-status/:health_status',
  projectsController.getProjectsByHealthStatus
);

/**
 * GET /api/projects/phase/:current_phase
 * Get projects by phase
 */
router.get(
  '/phase/:current_phase',
  projectsController.getProjectsByPhase
);

/**
 * GET /api/projects/metrics/summary
 * Get project metrics and summary
 */
router.get(
  '/metrics/summary',
  projectsController.getProjectMetrics
);

/**
 * GET /api/projects/:projectId/doc-types/:docTypeId/default-policy
 * Get default emission policy for a document type
 */
router.get(
  '/:projectId/doc-types/:docTypeId/default-policy',
  projectsValidation.validateProjectId,
  projectsController.getProjectDefaultPolicy
);

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get(
  '/:id',
  projectsValidation.validateProjectId,
  projectsController.getProject
);

/**
 * GET /api/projects/business-unit/:businessUnitId
 * Get all projects for a specific business unit
 */
router.get(
  '/business-unit/:businessUnitId',
  projectsValidation.validateBusinessUnitId,
  projectsController.getProjectsByBusinessUnit
);

/**
 * GET /api/projects/:projectId/validate-business-unit/:businessUnitId
 * Validate project belongs to business unit
 */
router.get(
  '/:projectId/validate-business-unit/:businessUnitId',
  projectsValidation.validateProjectId,
  projectsValidation.validateBusinessUnitId,
  projectsController.validateProjectBusinessUnit
);

/**
 * GET /api/projects/:projectId/documents/aggregated
 * Get aggregated document statistics for a project by category
 * Query params:
 *   - category: string (optional) - filter by document category (HSE, Technical, Planning, etc.)
 *   - referencePeriod: string (optional) - reference period for periodic documents
 *   - documentType: 'all' | 'adhoc' | 'periodic' (optional)
 */
router.get(
  '/:projectId/documents/aggregated',
  projectsValidation.validateProjectId,
  projectsController.getProjectDocumentsAggregated
);

/**
 * POST /api/projects
 * Create a new project
 */
router.post(
  '/',
  projectsValidation.validateProject,
  projectsController.createProject
);

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put(
  '/:id',
  projectsValidation.validateProjectId,
  projectsValidation.validateProjectUpdate,
  projectsController.updateProject
);

/**
 * PATCH /api/projects/:id/health-status
 * Update project health status
 */
router.patch(
  '/:id/health-status',
  projectsValidation.validateProjectId,
  projectsValidation.validateProjectHealthStatus,
  projectsController.updateProjectHealthStatus
);

/**
 * PATCH /api/projects/:id/phase
 * Update project phase
 */
router.patch(
  '/:id/phase',
  projectsValidation.validateProjectId,
  projectsValidation.validateProjectPhase,
  projectsController.updateProjectPhase
);

/**
 * DELETE /api/projects/:id
 * Delete a project (soft delete - sets is_active = false)
 */
router.delete(
  '/:id',
  projectsValidation.validateProjectId,
  projectsController.deleteProject
);

/**
 * DELETE /api/projects/:id/hard
 * Hard delete a project (admin only)
 * Note: Add admin middleware when ready
 */
router.delete(
  '/:id/hard',
  projectsValidation.validateProjectId,
  projectsController.hardDeleteProject
);

/**
 * @route   GET /api/projects/:projectId/doc-types/:docTypeId/policy-check
 * @desc    Check if a document type is already assigned to a policy
 * @access  Private
 */
router.get(
  '/:projectId/doc-types/:docTypeId/policy-check',
  projectsValidation.validateProjectId,
  checkDocTypeAssignment
);

/**
 * GET /api/projects/:projectId/documents/check-number
 * Check if a document number is already used
 */
router.get(
  '/:projectId/documents/check-number',
  projectsValidation.validateProjectId,
  projectsController.checkDocumentNumberAvailability
);

/**
 * GET /api/projects/:projectId/documents
 * Get all documents for a project
 */
router.get(
  '/:projectId/documents',
  projectsValidation.validateProjectId,
  projectsController.getProjectDocuments
);

export default router;