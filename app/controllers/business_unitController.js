import business_unitService from '../services/business_unitService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Get all business units
// @route   GET /api/business-units
// @access  Private
export const getAllBusinessUnits = asyncHandler(async (req, res, next) => {
  const result = await business_unitService.getAllBusinessUnits(req.query);
  res.status(200).json({
    status: 'success',
    results: result.business_units.length,
    data: result
  });
});

// @desc    Get business unit by ID
// @route   GET /api/business-units/:id
// @access  Private
export const getBusinessUnit = asyncHandler(async (req, res, next) => {
  const business_unit_record = await business_unitService.getBusinessUnitById(req.params.id);
  
  if (!business_unit_record) {
    return next(new AppError('Business unit not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      business_unit: business_unit_record
    }
  });
});

// @desc    Create business unit
// @route   POST /api/business-units
// @access  Private
export const createBusinessUnit = asyncHandler(async (req, res, next) => {
  const business_unit_record = await business_unitService.createBusinessUnit(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      business_unit: business_unit_record
    }
  });
});

// @desc    Update business unit
// @route   PUT /api/business-units/:id
// @access  Private
export const updateBusinessUnit = asyncHandler(async (req, res, next) => {
  const business_unit_record = await business_unitService.updateBusinessUnit(req.params.id, req.body);
  
  if (!business_unit_record) {
    return next(new AppError('Business unit not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      business_unit: business_unit_record
    }
  });
});

// @desc    Delete business unit
// @route   DELETE /api/business-units/:id
// @access  Private
export const deleteBusinessUnit = asyncHandler(async (req, res, next) => {
  const result = await business_unitService.deleteBusinessUnit(req.params.id);
  
  if (!result) {
    return next(new AppError('Business unit not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get business units by client
// @route   GET /api/business-units/client/:clientId
// @access  Private
// @note    This endpoint is kept for backward compatibility but will return empty array
//          since BusinessUnit model no longer has client_id association
export const getBusinessUnitsByClient = asyncHandler(async (req, res, next) => {
  // Since there's no client_id in BusinessUnit model, return empty array with a notice
  console.warn(`getBusinessUnitsByClient called with clientId: ${req.params.clientId} - This endpoint is deprecated as BusinessUnit model no longer has client_id association`);
  
  res.status(200).json({
    status: 'success',
    results: 0,
    data: {
      business_units: [],
      message: 'Business units are now independent of clients. This endpoint is maintained for backward compatibility only.'
    }
  });
});

// @desc    Check if business unit name is available
// @route   GET /api/business-units/check-name
// @access  Private
// @note    Updated to remove client_id dependency since BusinessUnit model only has unique name constraint
export const checkBusinessUnitName = asyncHandler(async (req, res, next) => {
  const { name } = req.query;

  // Validate required parameters
  if (!name) {
    return next(new AppError('Name is required', 400));
  }

  // Check name availability (global uniqueness)
  const isAvailable = await business_unitService.checkBusinessUnitNameAvailability(name);
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      name: name.trim()
    }
  });
});

export default {
  getAllBusinessUnits,
  getBusinessUnit,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
  getBusinessUnitsByClient,
  checkBusinessUnitName
};