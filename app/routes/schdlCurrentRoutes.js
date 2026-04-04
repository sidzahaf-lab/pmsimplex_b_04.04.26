// src/routes/schdlCurrentRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllCurrentSchedules,
  getCurrentByProjdocId,
  getCurrentById,
  createCurrentSchedule,
  updateCurrentSchedule,
  patchCurrentSchedule,
  deleteCurrentSchedule,
  getBaseline
} from '../controllers/schdlCurrentController.js';

// Import validations
import {
  createCurrentValidation,
  updateCurrentValidation,
  currentIdValidation,
  currentByProjdocValidation,
  baselineValidation
} from '../middleware/schdlCurrentValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// None for current schedules

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

/**
 * @route   GET /api/schdl-currents
 * @desc    Get all current schedules with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  globalValidators.validatePagination,
  getAllCurrentSchedules
);

/**
 * @route   GET /api/projdocs/:projdocId/current
 * @desc    Get current schedule by projdoc ID
 * @access  Private
 */
router.get(
  '/document/:projdocId',
  currentByProjdocValidation,
  getCurrentByProjdocId
);

/**
 * @route   POST /api/projdocs/:projdocId/current
 * @desc    Create current schedule
 * @access  Private
 */
router.post(
  '/document/:projdocId',
  createCurrentValidation,
  createCurrentSchedule
);

/**
 * @route   GET /api/schdl-currents/:id/baseline
 * @desc    Get baseline for current schedule
 * @access  Private
 */
router.get(
  '/:id/baseline',
  baselineValidation,
  getBaseline
);

/**
 * @route   GET /api/schdl-currents/:id
 * @desc    Get current schedule by ID
 * @access  Private
 */
router.get(
  '/:id',
  currentIdValidation,
  getCurrentById
);

/**
 * @route   PUT /api/schdl-currents/:id
 * @desc    Update current schedule (full update)
 * @access  Private
 */
router.put(
  '/:id',
  updateCurrentValidation,
  updateCurrentSchedule
);

/**
 * @route   PATCH /api/schdl-currents/:id
 * @desc    Update current schedule (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  updateCurrentValidation,
  patchCurrentSchedule
);

/**
 * @route   DELETE /api/schdl-currents/:id
 * @desc    Delete current schedule
 * @access  Private
 */
router.delete(
  '/:id',
  currentIdValidation,
  deleteCurrentSchedule
);

export default router;