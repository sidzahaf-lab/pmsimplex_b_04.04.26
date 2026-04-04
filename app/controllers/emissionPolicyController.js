// src/controllers/emissionPolicyController.js
import emissionPolicyService from '../services/emissionPolicyService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all emission policies with filtering and pagination
// @route   GET /api/emission-policies
// @access  Private
export const getAllEmissionPolicies = asyncHandler(async (req, res, next) => {
  const result = await emissionPolicyService.getAllEmissionPolicies(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.policies.length,
    data: result
  });
});

// @desc    Get emission policies by project
// @route   GET /api/projects/:projectId/emission-policies
// @access  Private
export const getEmissionPoliciesByProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return next(new AppError('Invalid project ID format', 400));
  }

  const result = await emissionPolicyService.getEmissionPoliciesByProject(projectId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.policies.length,
    data: result
  });
});

// @desc    Get emission policy by ID
// @route   GET /api/emission-policies/:id
// @access  Private
export const getEmissionPolicyById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid emission policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const policy = await emissionPolicyService.getEmissionPolicyById(id);
  
  if (!policy) {
    return next(new AppError('Emission policy not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      policy
    }
  });
});

// @desc    Get periods for a policy
// @route   GET /api/emission-policies/:id/periods
// @access  Private
export const getPolicyPeriods = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 GET /api/emission-policies/${id}/periods`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const periods = await emissionPolicyService.getPolicyPeriods(id);
  
  res.status(200).json({
    status: 'success',
    results: periods.length,
    data: {
      periods
    }
  });
});

// @desc    Get periods for a policy with revision status
// @route   GET /api/emission-policies/:id/periods/revision-status
// @access  Private
export const getPolicyPeriodsWithStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 GET /api/emission-policies/${id}/periods/revision-status`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const periods = await emissionPolicyService.getPolicyPeriodsWithStatus(id);
  
  res.status(200).json({
    success: true,
    data: periods
  });
});

// @desc    Create emission policy
// @route   POST /api/projects/:projectId/emission-policies
// @access  Private
export const createEmissionPolicy = asyncHandler(async (req, res, next) => {
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projectId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return next(new AppError('Invalid project ID format', 400));
  }

  // CRITICAL FIX: Clean anchor_day to prevent NaN
  let anchorDay = req.body.anchor_day;
  
  // Log the raw value for debugging
  console.log('📥 Raw anchor_day:', anchorDay, 'type:', typeof anchorDay);
  
  // Handle different input types
  if (anchorDay === null || anchorDay === undefined) {
    // Keep as null
    anchorDay = null;
  } else if (anchorDay === 'null' || anchorDay === 'undefined') {
    // String representations of null/undefined
    anchorDay = null;
  } else if (anchorDay === '') {
    // Empty string
    anchorDay = null;
  } else {
    // Try to parse as number
    const parsed = parseInt(anchorDay);
    if (!isNaN(parsed)) {
      anchorDay = parsed;
    } else {
      // If parsing fails, set to null
      console.warn(`⚠️ Could not parse anchor_day value: ${anchorDay}, setting to null`);
      anchorDay = null;
    }
  }
  
  console.log('📥 Cleaned anchor_day:', anchorDay, 'type:', typeof anchorDay);

  // Include doc_type_ids and periods from request body
  const policyData = {
    project_id: projectId,
    frequency: req.body.frequency,
    anchor_date: req.body.anchor_date,
    anchor_day: anchorDay, // Use cleaned value
    description: req.body.description,
    doc_type_ids: req.body.doc_type_ids,
    periods: req.body.periods
  };

  console.log('📦 Policy data being sent to service:', JSON.stringify(policyData, null, 2));

  // Updated validation for frequency-specific requirements
  if (policyData.frequency === 'weekly') {
    // Weekly requires anchor_day between 1-7
    if (!policyData.anchor_day || policyData.anchor_day < 1 || policyData.anchor_day > 7) {
      return next(new AppError('Anchor day must be between 1 and 7 for weekly frequency', 400));
    }
  } else if (policyData.frequency === 'monthly') {
    // Monthly can accept 0 as a special value, or null
    if (policyData.anchor_day !== null && policyData.anchor_day !== 0) {
      return next(new AppError(`Anchor day must be null or 0 for monthly frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
    }
    // Ensure it's exactly 0 or null
    if (policyData.anchor_day === 0) {
      // Keep as 0
    } else {
      policyData.anchor_day = null;
    }
  } else if (policyData.frequency === 'daily') {
    // Daily must have null anchor_day
    if (policyData.anchor_day !== null) {
      return next(new AppError(`Anchor day must be null for daily frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
    }
    policyData.anchor_day = null;
  }

  const newPolicy = await emissionPolicyService.createEmissionPolicy(policyData);

  res.status(201).json({
    status: 'success',
    data: {
      policy: newPolicy
    }
  });
});

// @desc    Update emission policy
// @route   PUT /api/emission-policies/:id
// @access  Private
export const updateEmissionPolicy = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid emission policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // CRITICAL FIX: Clean anchor_day to prevent NaN
  let anchorDay = req.body.anchor_day;
  
  // Log the raw value for debugging
  console.log('📥 Raw anchor_day for update:', anchorDay, 'type:', typeof anchorDay);
  
  // Handle different input types
  if (anchorDay === null || anchorDay === undefined) {
    // Keep as null
    anchorDay = null;
  } else if (anchorDay === 'null' || anchorDay === 'undefined') {
    // String representations of null/undefined
    anchorDay = null;
  } else if (anchorDay === '') {
    // Empty string
    anchorDay = null;
  } else {
    // Try to parse as number
    const parsed = parseInt(anchorDay);
    if (!isNaN(parsed)) {
      anchorDay = parsed;
    } else {
      // If parsing fails, set to null
      console.warn(`⚠️ Could not parse anchor_day value: ${anchorDay}, setting to null`);
      anchorDay = null;
    }
  }
  
  console.log('📥 Cleaned anchor_day for update:', anchorDay, 'type:', typeof anchorDay);

  // Map request body to policy data - include doc_type_ids and periods
  const policyData = {};
  if (req.body.frequency !== undefined) policyData.frequency = req.body.frequency;
  if (req.body.anchor_date !== undefined) policyData.anchor_date = req.body.anchor_date;
  if (req.body.anchor_day !== undefined) policyData.anchor_day = anchorDay; // Use cleaned value
  if (req.body.description !== undefined) policyData.description = req.body.description;
  if (req.body.doc_type_ids !== undefined) policyData.doc_type_ids = req.body.doc_type_ids;
  if (req.body.periods !== undefined) policyData.periods = req.body.periods;

  // Updated validation for frequency-specific requirements
  if (policyData.frequency) {
    if (policyData.frequency === 'weekly') {
      // Weekly requires anchor_day between 1-7
      if (!policyData.anchor_day || policyData.anchor_day < 1 || policyData.anchor_day > 7) {
        return next(new AppError('Anchor day must be between 1 and 7 for weekly frequency', 400));
      }
    } else if (policyData.frequency === 'monthly') {
      // Monthly can accept 0 as a special value, or null
      if (policyData.anchor_day !== null && policyData.anchor_day !== 0) {
        return next(new AppError(`Anchor day must be null or 0 for monthly frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
      }
    } else if (policyData.frequency === 'daily') {
      // Daily must have null anchor_day
      if (policyData.anchor_day !== null) {
        return next(new AppError(`Anchor day must be null for daily frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
      }
    }
  }

  const updatedPolicy = await emissionPolicyService.updateEmissionPolicy(id, policyData);
  
  if (!updatedPolicy) {
    return next(new AppError('Emission policy not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      policy: updatedPolicy
    }
  });
});

// @desc    Partially update emission policy
// @route   PATCH /api/emission-policies/:id
// @access  Private
export const patchEmissionPolicy = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid emission policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // CRITICAL FIX: Clean anchor_day to prevent NaN
  let anchorDay = req.body.anchor_day;
  
  // Handle different input types
  if (anchorDay === null || anchorDay === undefined) {
    anchorDay = null;
  } else if (anchorDay === 'null' || anchorDay === 'undefined') {
    anchorDay = null;
  } else if (anchorDay === '') {
    anchorDay = null;
  } else {
    const parsed = parseInt(anchorDay);
    if (!isNaN(parsed)) {
      anchorDay = parsed;
    } else {
      anchorDay = null;
    }
  }

  // Map request body to policy data - include doc_type_ids and periods
  const policyData = {};
  if (req.body.frequency !== undefined) policyData.frequency = req.body.frequency;
  if (req.body.anchor_date !== undefined) policyData.anchor_date = req.body.anchor_date;
  if (req.body.anchor_day !== undefined) policyData.anchor_day = anchorDay;
  if (req.body.description !== undefined) policyData.description = req.body.description;
  if (req.body.doc_type_ids !== undefined) policyData.doc_type_ids = req.body.doc_type_ids;
  if (req.body.periods !== undefined) policyData.periods = req.body.periods;

  // Updated validation for frequency-specific requirements
  if (policyData.frequency) {
    if (policyData.frequency === 'weekly') {
      if (!policyData.anchor_day || policyData.anchor_day < 1 || policyData.anchor_day > 7) {
        return next(new AppError('Anchor day must be between 1 and 7 for weekly frequency', 400));
      }
    } else if (policyData.frequency === 'monthly') {
      if (policyData.anchor_day !== null && policyData.anchor_day !== 0) {
        return next(new AppError(`Anchor day must be null or 0 for monthly frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
      }
    } else if (policyData.frequency === 'daily') {
      if (policyData.anchor_day !== null) {
        return next(new AppError(`Anchor day must be null for daily frequency, got: ${policyData.anchor_day} (${typeof policyData.anchor_day})`, 400));
      }
    }
  }

  const updatedPolicy = await emissionPolicyService.updateEmissionPolicy(id, policyData);
  
  if (!updatedPolicy) {
    return next(new AppError('Emission policy not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      policy: updatedPolicy
    }
  });
});

// @desc    Delete emission policy
// @route   DELETE /api/emission-policies/:id
// @access  Private
export const deleteEmissionPolicy = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid emission policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await emissionPolicyService.deleteEmissionPolicy(id);
  
  if (!result) {
    return next(new AppError('Emission policy not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Generate periods for emission policy (déprécié - les périodes viennent du frontend)
// @route   POST /api/emission-policies/:id/generate-periods
// @access  Private
export const generatePeriods = asyncHandler(async (req, res, next) => {
  return next(new AppError('Period generation should be done on the frontend', 400));
});

// Export all controllers as default object only - NO separate named exports block
export default {
  getAllEmissionPolicies,
  getEmissionPoliciesByProject,
  getEmissionPolicyById,
  getPolicyPeriods,
  getPolicyPeriodsWithStatus,
  createEmissionPolicy,
  updateEmissionPolicy,
  patchEmissionPolicy,
  deleteEmissionPolicy,
  generatePeriods
};