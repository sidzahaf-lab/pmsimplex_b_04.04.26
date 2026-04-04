// src/controllers/emissionPeriodController.js
import emissionPeriodService from '../services/emissionPeriodService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';
import { isValidUUID } from '../utils/validationHelpers.js';

// @desc    Get all emission periods with filtering and pagination
// @route   GET /api/emission-periods
// @access  Private
export const getAllEmissionPeriods = asyncHandler(async (req, res, next) => {
  const result = await emissionPeriodService.getAllEmissionPeriods(req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get overdue emission periods (expected_at < today)
// @route   GET /api/emission-periods/overdue
// @access  Private
export const getOverduePeriods = asyncHandler(async (req, res, next) => {
  const result = await emissionPeriodService.getOverduePeriods(req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get upcoming emission periods (expected_at >= today)
// @route   GET /api/emission-periods/upcoming
// @access  Private
export const getUpcomingPeriods = asyncHandler(async (req, res, next) => {
  const result = await emissionPeriodService.getUpcomingPeriods(req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get periods with revisions
// @route   GET /api/emission-periods/with-revisions
// @access  Private
export const getPeriodsWithRevisions = asyncHandler(async (req, res, next) => {
  const result = await emissionPeriodService.getPeriodsWithRevisions(req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get periods by year
// @route   GET /api/emission-periods/year/:year
// @access  Private
export const getPeriodsByYear = asyncHandler(async (req, res, next) => {
  const { year } = req.params;
  
  const result = await emissionPeriodService.getPeriodsByYear(year, req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get periods by year and quarter
// @route   GET /api/emission-periods/year/:year/quarter/:quarter
// @access  Private
export const getPeriodsByQuarter = asyncHandler(async (req, res, next) => {
  const { year, quarter } = req.params;
  
  const result = await emissionPeriodService.getPeriodsByYearAndQuarter(year, quarter, req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get periods by date range
// @route   GET /api/emission-periods/date-range
// @access  Private
export const getPeriodsByDateRange = asyncHandler(async (req, res, next) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return next(new AppError('Please provide start and end dates', 400));
  }
  
  const result = await emissionPeriodService.getPeriodsByDateRange(start, end, req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get emission periods by policy
// @route   GET /api/emission-policies/:policyId/periods
// @access  Private
export const getPeriodsByPolicy = asyncHandler(async (req, res, next) => {
  const { policyId } = req.params;
  
  if (!isValidUUID(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const result = await emissionPeriodService.getPeriodsByPolicy(policyId, req.query);
  
  res.status(200).json({
    success: true,
    count: result.periods.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.periods
  });
});

// @desc    Get policy periods summary
// @route   GET /api/emission-policies/:policyId/periods/summary
// @access  Private
export const getPolicyPeriodsSummary = asyncHandler(async (req, res, next) => {
  const { policyId } = req.params;
  
  if (!isValidUUID(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const summary = await emissionPeriodService.getPolicyPeriodsSummary(policyId);
  
  res.status(200).json({
    success: true,
    data: summary
  });
});

// @desc    Get revision status for a period
// @route   GET /api/emission-periods/:id/revision-status
// @access  Private
export const getPeriodRevisionStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return next(new AppError('Invalid emission period ID format', 400));
  }

  const result = await emissionPeriodService.getPeriodRevisionStatus(id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get emission period by ID
// @route   GET /api/emission-periods/:id
// @access  Private
export const getEmissionPeriodById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return next(new AppError('Invalid emission period ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const includeRevisions = req.query.includeRevisions === 'true';
  const period = await emissionPeriodService.getEmissionPeriodById(id, { includeRevisions });
  
  if (!period) {
    return next(new AppError('Emission period not found', 404));
  }

  res.status(200).json({
    success: true,
    data: period
  });
});

// @desc    Create emission period
// @route   POST /api/emission-policies/:policyId/periods
// @access  Private
export const createEmissionPeriod = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { policyId } = req.params;
  
  if (!isValidUUID(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const { period_label, period_start, period_end, expected_at } = req.body;
  
  if (!period_label || !period_start || !period_end) {
    return next(new AppError('Please provide period_label, period_start, and period_end', 400));
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  if (endDate <= startDate) {
    return next(new AppError('Period end must be after period start', 400));
  }

  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (daysDiff > 366) {
    return next(new AppError('Period duration cannot exceed 366 days', 400));
  }

  if (expected_at) {
    const expectedDate = new Date(expected_at);
    if (expectedDate < endDate) {
      return next(new AppError('Expected date should typically be after period end date', 400));
    }
  }

  const periodData = {
    emission_id: policyId,
    period_label: period_label.trim(),
    period_start,
    period_end,
    expected_at: expected_at || null
  };

  const newPeriod = await emissionPeriodService.createEmissionPeriod(periodData);

  res.status(201).json({
    success: true,
    message: 'Emission period created successfully',
    data: newPeriod
  });
});

// @desc    Update emission period (full update)
// @route   PUT /api/emission-periods/:id
// @access  Private
export const updateEmissionPeriod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return next(new AppError('Invalid emission period ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { period_label, period_start, period_end, expected_at } = req.body;
  
  if (!period_label || !period_start || !period_end) {
    return next(new AppError('For PUT operation, period_label, period_start, and period_end are required', 400));
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  if (endDate <= startDate) {
    return next(new AppError('Period end must be after period start', 400));
  }

  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (daysDiff > 366) {
    return next(new AppError('Period duration cannot exceed 366 days', 400));
  }

  const periodData = {
    period_label: period_label.trim(),
    period_start,
    period_end,
    expected_at: expected_at || null
  };

  const updatedPeriod = await emissionPeriodService.updateEmissionPeriod(id, periodData);
  
  if (!updatedPeriod) {
    return next(new AppError('Emission period not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Emission period updated successfully',
    data: updatedPeriod
  });
});

// @desc    Partially update emission period
// @route   PATCH /api/emission-periods/:id
// @access  Private
export const patchEmissionPeriod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return next(new AppError('Invalid emission period ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No fields provided for update', 400));
  }

  const periodData = {};
  const allowedFields = ['period_label', 'period_start', 'period_end', 'expected_at'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      periodData[field] = field === 'period_label' ? req.body[field].trim() : req.body[field];
    }
  });

  if (periodData.period_start && periodData.period_end) {
    const startDate = new Date(periodData.period_start);
    const endDate = new Date(periodData.period_end);
    
    if (endDate <= startDate) {
      return next(new AppError('Period end must be after period start', 400));
    }

    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 366) {
      return next(new AppError('Period duration cannot exceed 366 days', 400));
    }
  }

  if (periodData.expected_at && (periodData.period_end || req.body.period_end)) {
    const endDate = new Date(periodData.period_end || req.body.period_end);
    const expectedDate = new Date(periodData.expected_at);
    
    if (expectedDate < endDate) {
      return next(new AppError('Expected date should typically be after period end date', 400));
    }
  }

  const updatedPeriod = await emissionPeriodService.updateEmissionPeriod(id, periodData);
  
  if (!updatedPeriod) {
    return next(new AppError('Emission period not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Emission period updated successfully',
    data: updatedPeriod
  });
});

// @desc    Delete emission period
// @route   DELETE /api/emission-periods/:id
// @access  Private (Admin only)
export const deleteEmissionPeriod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return next(new AppError('Invalid emission period ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const period = await emissionPeriodService.getEmissionPeriodById(id, { includeRevisions: true });
  
  if (period && period.revisions && period.revisions.length > 0) {
    return next(new AppError('Cannot delete period with associated revisions', 400));
  }

  const result = await emissionPeriodService.deleteEmissionPeriod(id);
  
  if (!result) {
    return next(new AppError('Emission period not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Emission period deleted successfully',
    data: null
  });
});

// @desc    Check period compliance (cron job endpoint)
// @route   POST /api/emission-periods/check-compliance
// @access  Public/Admin
export const checkPeriodCompliance = asyncHandler(async (req, res, next) => {
  // Optional: Add API key validation for cron jobs
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.CRON_API_KEY;
  
  if (validApiKey && apiKey !== validApiKey) {
    return next(new AppError('Unauthorized', 401));
  }

  const dryRun = req.body.dry_run === true;
  const result = await emissionPeriodService.checkAndUpdateCompliance(dryRun);
  
  res.status(200).json({
    success: true,
    message: `Checked ${result.checked} periods, ${result.overdue_without_revisions} overdue without revisions`,
    data: result
  });
});

// @desc    Bulk create emission periods
// @route   POST /api/emission-policies/:policyId/periods/bulk
// @access  Private
export const bulkCreateEmissionPeriods = asyncHandler(async (req, res, next) => {
  const { policyId } = req.params;
  
  if (!isValidUUID(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const { periods } = req.body;
  
  if (!Array.isArray(periods) || periods.length === 0) {
    return next(new AppError('Please provide an array of periods', 400));
  }

  if (periods.length > 100) {
    return next(new AppError('Cannot create more than 100 periods at once', 400));
  }

  const validatedPeriods = [];
  const errors = [];

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    
    try {
      if (!period.period_label || !period.period_start || !period.period_end) {
        throw new Error(`Period at index ${i} missing required fields`);
      }

      const startDate = new Date(period.period_start);
      const endDate = new Date(period.period_end);
      
      if (endDate <= startDate) {
        throw new Error(`Period at index ${i} has invalid date range`);
      }

      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 366) {
        throw new Error(`Period at index ${i} duration cannot exceed 366 days`);
      }

      validatedPeriods.push({
        emission_id: policyId,
        period_label: period.period_label.trim(),
        period_start: period.period_start,
        period_end: period.period_end,
        expected_at: period.expected_at || null
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation failed: ${errors.join(', ')}`, 400));
  }

  const createdPeriods = await emissionPeriodService.bulkCreateEmissionPeriods(validatedPeriods);

  res.status(201).json({
    success: true,
    message: `Successfully created ${createdPeriods.length} periods`,
    count: createdPeriods.length,
    data: createdPeriods
  });
});

// @desc    Get period statistics
// @route   GET /api/emission-periods/statistics
// @access  Private
export const getPeriodStatistics = asyncHandler(async (req, res, next) => {
  const stats = await emissionPeriodService.getPeriodStatistics(req.query);
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Export all controllers
export default {
  getAllEmissionPeriods,
  getOverduePeriods,
  getUpcomingPeriods,
  getPeriodsWithRevisions,
  getPeriodsByYear,
  getPeriodsByQuarter,
  getPeriodsByDateRange,
  getPeriodsByPolicy,
  getPolicyPeriodsSummary,
  getPeriodRevisionStatus,
  getEmissionPeriodById,
  createEmissionPeriod,
  bulkCreateEmissionPeriods,
  updateEmissionPeriod,
  patchEmissionPeriod,
  deleteEmissionPeriod,
  checkPeriodCompliance,  // ✅ This was missing
  getPeriodStatistics
};