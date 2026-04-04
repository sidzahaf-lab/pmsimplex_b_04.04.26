// src/controllers/schdlCurrentController.js
import schdlCurrentService from '../services/schdlCurrentService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all current schedules with filtering and pagination
// @route   GET /api/schdl-currents
// @access  Private
export const getAllCurrentSchedules = asyncHandler(async (req, res, next) => {
  const result = await schdlCurrentService.getAllCurrentSchedules(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.schedules.length,
    data: result
  });
});

// @desc    Get current schedule by projdoc ID
// @route   GET /api/projdocs/:projdocId/current
// @access  Private
export const getCurrentByProjdocId = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const current = await schdlCurrentService.getCurrentByProjdocId(projdocId);
  
  if (!current) {
    return next(new AppError('Current schedule not found for this document', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      current
    }
  });
});

// @desc    Get current schedule by ID
// @route   GET /api/schdl-currents/:id
// @access  Private
export const getCurrentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid current schedule ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const current = await schdlCurrentService.getCurrentById(id);
  
  if (!current) {
    return next(new AppError('Current schedule not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      current
    }
  });
});

// @desc    Create current schedule
// @route   POST /api/projdocs/:projdocId/current
// @access  Private
export const createCurrentSchedule = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  if (!req.body.baseline_projdoc_id) {
    return next(new AppError('Baseline document ID is required', 400));
  }

  const currentData = {
    projdoc_id: projdocId,
    baseline_projdoc_id: req.body.baseline_projdoc_id
  };

  const newCurrent = await schdlCurrentService.createCurrentSchedule(currentData);

  res.status(201).json({
    status: 'success',
    data: {
      current: newCurrent
    }
  });
});

// @desc    Update current schedule
// @route   PUT /api/schdl-currents/:id
// @access  Private
export const updateCurrentSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid current schedule ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Only baseline_projdoc_id can be updated
  const currentData = {};
  if (req.body.baseline_projdoc_id !== undefined) {
    currentData.baseline_projdoc_id = req.body.baseline_projdoc_id;
  }

  const updatedCurrent = await schdlCurrentService.updateCurrentSchedule(id, currentData);
  
  if (!updatedCurrent) {
    return next(new AppError('Current schedule not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      current: updatedCurrent
    }
  });
});

// @desc    Partially update current schedule
// @route   PATCH /api/schdl-currents/:id
// @access  Private
export const patchCurrentSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid current schedule ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Only baseline_projdoc_id can be updated
  const currentData = {};
  if (req.body.baseline_projdoc_id !== undefined) {
    currentData.baseline_projdoc_id = req.body.baseline_projdoc_id;
  }

  const updatedCurrent = await schdlCurrentService.updateCurrentSchedule(id, currentData);
  
  if (!updatedCurrent) {
    return next(new AppError('Current schedule not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      current: updatedCurrent
    }
  });
});

// @desc    Delete current schedule
// @route   DELETE /api/schdl-currents/:id
// @access  Private
export const deleteCurrentSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid current schedule ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await schdlCurrentService.deleteCurrentSchedule(id);
  
  if (!result) {
    return next(new AppError('Current schedule not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get baseline for current schedule
// @route   GET /api/schdl-currents/:id/baseline
// @access  Private
export const getBaseline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid current schedule ID format', 400));
  }

  const baseline = await schdlCurrentService.getBaseline(id);

  res.status(200).json({
    status: 'success',
    data: {
      baseline
    }
  });
});

export default {
  getAllCurrentSchedules,
  getCurrentByProjdocId,
  getCurrentById,
  createCurrentSchedule,
  updateCurrentSchedule,
  patchCurrentSchedule,
  deleteCurrentSchedule,
  getBaseline
};