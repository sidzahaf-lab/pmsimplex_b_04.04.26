// src/controllers/periodicReportController.js
import periodicReportService from '../services/periodicReportService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all periodic reports with filtering and pagination
// @route   GET /api/periodic-reports
// @access  Private
export const getAllPeriodicReports = asyncHandler(async (req, res, next) => {
  const result = await periodicReportService.getAllPeriodicReports(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.reports.length,
    data: result
  });
});

// @desc    Get periodic report by projdoc ID
// @route   GET /api/projdocs/:projdocId/report
// @access  Private
export const getReportByProjdocId = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const report = await periodicReportService.getReportByProjdocId(projdocId);
  
  if (!report) {
    return next(new AppError('Periodic report not found for this document', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
});

// @desc    Get periodic report by ID
// @route   GET /api/periodic-reports/:id
// @access  Private
export const getReportById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid report ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const report = await periodicReportService.getReportById(id);
  
  if (!report) {
    return next(new AppError('Periodic report not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
});

// @desc    Create periodic report
// @route   POST /api/projdocs/:projdocId/report
// @access  Private
export const createPeriodicReport = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projdocId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const reportData = {
    projdoc_id: projdocId,
    template_ref: req.body.template_ref,
    signatory: req.body.signatory,
    distribution_list: req.body.distribution_list
  };

  const newReport = await periodicReportService.createPeriodicReport(reportData);

  res.status(201).json({
    status: 'success',
    data: {
      report: newReport
    }
  });
});

// @desc    Update periodic report
// @route   PUT /api/periodic-reports/:id
// @access  Private
export const updatePeriodicReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid report ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to report data
  const reportData = {};
  if (req.body.template_ref !== undefined) reportData.template_ref = req.body.template_ref;
  if (req.body.signatory !== undefined) reportData.signatory = req.body.signatory;
  if (req.body.distribution_list !== undefined) reportData.distribution_list = req.body.distribution_list;

  const updatedReport = await periodicReportService.updatePeriodicReport(id, reportData);
  
  if (!updatedReport) {
    return next(new AppError('Periodic report not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report: updatedReport
    }
  });
});

// @desc    Partially update periodic report
// @route   PATCH /api/periodic-reports/:id
// @access  Private
export const patchPeriodicReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid report ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to report data
  const reportData = {};
  if (req.body.template_ref !== undefined) reportData.template_ref = req.body.template_ref;
  if (req.body.signatory !== undefined) reportData.signatory = req.body.signatory;
  if (req.body.distribution_list !== undefined) reportData.distribution_list = req.body.distribution_list;

  const updatedReport = await periodicReportService.updatePeriodicReport(id, reportData);
  
  if (!updatedReport) {
    return next(new AppError('Periodic report not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report: updatedReport
    }
  });
});

// @desc    Delete periodic report
// @route   DELETE /api/periodic-reports/:id
// @access  Private
export const deletePeriodicReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid report ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await periodicReportService.deletePeriodicReport(id);
  
  if (!result) {
    return next(new AppError('Periodic report not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get reports by signatory
// @route   GET /api/periodic-reports/signatory/:signatoryId
// @access  Private
export const getReportsBySignatory = asyncHandler(async (req, res, next) => {
  const { signatoryId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(signatoryId)) {
    return next(new AppError('Invalid signatory ID format', 400));
  }

  const result = await periodicReportService.getReportsBySignatory(signatoryId, req.query);

  res.status(200).json({
    status: 'success',
    results: result.reports.length,
    data: result
  });
});

// @desc    Get reports by template
// @route   GET /api/periodic-reports/template/:templateRef
// @access  Private
export const getReportsByTemplate = asyncHandler(async (req, res, next) => {
  const { templateRef } = req.params;

  if (!templateRef || templateRef.length > 150) {
    return next(new AppError('Invalid template reference', 400));
  }

  const result = await periodicReportService.getReportsByTemplate(templateRef, req.query);

  res.status(200).json({
    status: 'success',
    results: result.reports.length,
    data: result
  });
});

export default {
  getAllPeriodicReports,
  getReportByProjdocId,
  getReportById,
  createPeriodicReport,
  updatePeriodicReport,
  patchPeriodicReport,
  deletePeriodicReport,
  getReportsBySignatory,
  getReportsByTemplate
};