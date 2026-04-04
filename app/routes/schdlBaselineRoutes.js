// src/routes/schdlBaselineRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllBaselines,
  getBaselineByProjdocId,
  getBaselineById,
  createBaseline,
  updateBaseline,
  patchBaseline,
  deleteBaseline,
  getCurrentSchedules
} from '../controllers/schdlBaselineController.js';

// Import validations
import {
  createBaselineValidation,
  updateBaselineValidation,
  baselineIdValidation,
  baselineByProjdocValidation,
  currentSchedulesValidation
} from '../middleware/schdlBaselineValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// None for schedule baselines

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/schdl-baselines
 * @desc    Get all schedule baselines with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllBaselines
);

/**
 * @route   GET /api/projdocs/:projdocId/baseline
 * @desc    Get schedule baseline by projdoc ID
 * @access  Private
 */
router.get(
  '/document/:projdocId',
  baselineByProjdocValidation,
  getBaselineByProjdocId
);

/**
 * @route   POST /api/projdocs/:projdocId/baseline
 * @desc    Create schedule baseline
 * @access  Private
 */
router.post(
  '/document/:projdocId',
  createBaselineValidation,
  createBaseline
);

/**
 * @route   GET /api/schdl-baselines/:id/current-schedules
 * @desc    Get current schedules using this baseline
 * @access  Private
 */
router.get(
  '/:id/current-schedules',
  currentSchedulesValidation,
  getCurrentSchedules
);

/**
 * @route   GET /api/schdl-baselines/:id
 * @desc    Get schedule baseline by ID
 * @access  Private
 */
router.get(
  '/:id',
  baselineIdValidation,
  getBaselineById
);

/**
 * @route   PUT /api/schdl-baselines/:id
 * @desc    Update schedule baseline (full update)
 * @access  Private
 */
router.put(
  '/:id',
  updateBaselineValidation,
  updateBaseline
);

/**
 * @route   PATCH /api/schdl-baselines/:id
 * @desc    Update schedule baseline (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  updateBaselineValidation,
  patchBaseline
);

/**
 * @route   DELETE /api/schdl-baselines/:id
 * @desc    Delete schedule baseline
 * @access  Private
 */
router.delete(
  '/:id',
  baselineIdValidation,
  deleteBaseline
);

export default router;