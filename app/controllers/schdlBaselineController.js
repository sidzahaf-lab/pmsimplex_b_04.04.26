// src/controllers/schdlBaselineController.js
import schdlBaselineService from '../services/schdlBaselineService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all schedule baselines with filtering and pagination
// @route   GET /api/schdl-baselines
// @access  Private
export const getAllBaselines = asyncHandler(async (req, res, next) => {
  const result = await schdlBaselineService.getAllBaselines(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.baselines.length,
    data: result
  });
});

// @desc    Get schedule baseline by projdoc ID
// @route   GET /api/projdocs/:projdocId/baseline
// @access  Private
export const getBaselineByProjdocId = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const baseline = await schdlBaselineService.getBaselineByProjdocId(projdocId);
  
  if (!baseline) {
    return next(new AppError('Schedule baseline not found for this document', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      baseline
    }
  });
});

// @desc    Get schedule baseline by ID
// @route   GET /api/schdl-baselines/:id
// @access  Private
export const getBaselineById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid baseline ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const baseline = await schdlBaselineService.getBaselineById(id);
  
  if (!baseline) {
    return next(new AppError('Schedule baseline not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      baseline
    }
  });
});

// @desc    Create schedule baseline
// @route   POST /api/projdocs/:projdocId/baseline
// @access  Private
export const createBaseline = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const baselineData = {
    projdoc_id: projdocId,
    frozen_at: req.body.frozen_at,
    approved_by: req.body.approved_by,
    contract_ref: req.body.contract_ref
  };

  const newBaseline = await schdlBaselineService.createBaseline(baselineData);

  res.status(201).json({
    status: 'success',
    data: {
      baseline: newBaseline
    }
  });
});

// @desc    Update schedule baseline
// @route   PUT /api/schdl-baselines/:id
// @access  Private
export const updateBaseline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid baseline ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to baseline data
  const baselineData = {};
  if (req.body.frozen_at !== undefined) baselineData.frozen_at = req.body.frozen_at;
  if (req.body.approved_by !== undefined) baselineData.approved_by = req.body.approved_by;
  if (req.body.contract_ref !== undefined) baselineData.contract_ref = req.body.contract_ref;

  const updatedBaseline = await schdlBaselineService.updateBaseline(id, baselineData);
  
  if (!updatedBaseline) {
    return next(new AppError('Schedule baseline not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      baseline: updatedBaseline
    }
  });
});

// @desc    Partially update schedule baseline
// @route   PATCH /api/schdl-baselines/:id
// @access  Private
export const patchBaseline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid baseline ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to baseline data
  const baselineData = {};
  if (req.body.frozen_at !== undefined) baselineData.frozen_at = req.body.frozen_at;
  if (req.body.approved_by !== undefined) baselineData.approved_by = req.body.approved_by;
  if (req.body.contract_ref !== undefined) baselineData.contract_ref = req.body.contract_ref;

  const updatedBaseline = await schdlBaselineService.updateBaseline(id, baselineData);
  
  if (!updatedBaseline) {
    return next(new AppError('Schedule baseline not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      baseline: updatedBaseline
    }
  });
});

// @desc    Delete schedule baseline
// @route   DELETE /api/schdl-baselines/:id
// @access  Private
export const deleteBaseline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid baseline ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await schdlBaselineService.deleteBaseline(id);
  
  if (!result) {
    return next(new AppError('Schedule baseline not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get current schedules using this baseline
// @route   GET /api/schdl-baselines/:id/current-schedules
// @access  Private
export const getCurrentSchedules = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid baseline ID format', 400));
  }

  const schedules = await schdlBaselineService.getCurrentSchedules(id);

  res.status(200).json({
    status: 'success',
    data: {
      schedules
    }
  });
});

export default {
  getAllBaselines,
  getBaselineByProjdocId,
  getBaselineById,
  createBaseline,
  updateBaseline,
  patchBaseline,
  deleteBaseline,
  getCurrentSchedules
};