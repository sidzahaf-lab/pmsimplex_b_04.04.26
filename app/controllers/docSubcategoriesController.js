import docSubcategoryService from '../services/docSubcategoryService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all document subcategories with filtering and pagination
// @route   GET /api/doc-subcategories
// @access  Private
export const getAllSubcategories = asyncHandler(async (req, res, next) => {
  const result = await docSubcategoryService.getAllSubcategories(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.subcategories.length,
    data: result
  });
});

// @desc    Get subcategory by ID
// @route   GET /api/doc-subcategories/:id
// @access  Private
export const getSubcategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid subcategory ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const subcategory = await docSubcategoryService.getSubcategoryById(id);
  
  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subcategory
    }
  });
});

// @desc    Get subcategory with its document types
// @route   GET /api/doc-subcategories/:id/with-doc-types
// @access  Private
export const getSubcategoryWithDocTypes = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid subcategory ID format', 400));
  }

  const subcategory = await docSubcategoryService.getSubcategoryWithDocTypes(id);
  
  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subcategory
    }
  });
});

// @desc    Get subcategories by category ID
// @route   GET /api/doc-subcategories/by-category/:categoryId
// @access  Public
export const getSubcategoriesByCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(categoryId)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const result = await docSubcategoryService.getSubcategoriesByCategory(categoryId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.subcategories.length,
    data: result
  });
});

// @desc    Get subcategories with statistics
// @route   GET /api/doc-subcategories/with-stats
// @access  Public
export const getSubcategoriesWithStats = asyncHandler(async (req, res, next) => {
  const result = await docSubcategoryService.getSubcategoriesWithStats(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.subcategories.length,
    data: result
  });
});

// @desc    Create document subcategory
// @route   POST /api/doc-subcategories
// @access  Private
export const createSubcategory = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const subcategoryData = req.body;
  
  console.log('📦 Received subcategory data:', JSON.stringify(subcategoryData, null, 2));
  
  // Check required fields
  const missingFields = [];
  
  if (!subcategoryData.category_id) missingFields.push('category_id');
  if (!subcategoryData.label) missingFields.push('label');
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  const newSubcategory = await docSubcategoryService.createSubcategory(subcategoryData);

  res.status(201).json({
    status: 'success',
    data: {
      subcategory: newSubcategory
    }
  });
});

// @desc    Update document subcategory (full update)
// @route   PUT /api/doc-subcategories/:id
// @access  Private
export const updateSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid subcategory ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if at least one field is provided for update
  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No update data provided', 400));
  }

  const updatedSubcategory = await docSubcategoryService.updateSubcategory(id, req.body);
  
  if (!updatedSubcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subcategory: updatedSubcategory
    }
  });
});

// @desc    Partially update document subcategory
// @route   PATCH /api/doc-subcategories/:id
// @access  Private
export const patchSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid subcategory ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if at least one field is provided for update
  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No update data provided', 400));
  }

  const updatedSubcategory = await docSubcategoryService.updateSubcategory(id, req.body);
  
  if (!updatedSubcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subcategory: updatedSubcategory
    }
  });
});

// @desc    Delete document subcategory
// @route   DELETE /api/doc-subcategories/:id
// @access  Private
export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid subcategory ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await docSubcategoryService.deleteSubcategory(id);
  
  if (!result) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export default {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  patchSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
  getSubcategoryWithDocTypes,
  getSubcategoriesWithStats
};