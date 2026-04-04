import docCategoryService from '../services/docCategoryService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all document categories with filtering and pagination
// @route   GET /api/doc-categories
// @access  Private
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const result = await docCategoryService.getAllCategories(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.categories.length,
    data: result
  });
});

// @desc    Get category by ID
// @route   GET /api/doc-categories/:id
// @access  Private
export const getCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const category = await docCategoryService.getCategoryById(id);
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category
    }
  });
});

// @desc    Get category with its subcategories
// @route   GET /api/doc-categories/:id/with-subcategories
// @access  Private
export const getCategoryWithSubcategories = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const category = await docCategoryService.getCategoryWithSubcategories(id);
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category
    }
  });
});

// @desc    Get categories with statistics
// @route   GET /api/doc-categories/with-stats
// @access  Public
export const getCategoriesWithStats = asyncHandler(async (req, res, next) => {
  const result = await docCategoryService.getCategoriesWithStats(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.categories.length,
    data: result
  });
});

// @desc    Create document category
// @route   POST /api/doc-categories
// @access  Private
export const createCategory = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const categoryData = req.body;
  
  console.log('📦 Received category data:', JSON.stringify(categoryData, null, 2));
  
  // Check required fields
  const missingFields = [];
  
  if (!categoryData.label) missingFields.push('label');
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  const newCategory = await docCategoryService.createCategory(categoryData);

  res.status(201).json({
    status: 'success',
    data: {
      category: newCategory
    }
  });
});

// @desc    Update document category (full update)
// @route   PUT /api/doc-categories/:id
// @access  Private
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if at least one field is provided for update
  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No update data provided', 400));
  }

  const updatedCategory = await docCategoryService.updateCategory(id, req.body);
  
  if (!updatedCategory) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category: updatedCategory
    }
  });
});

// @desc    Partially update document category
// @route   PATCH /api/doc-categories/:id
// @access  Private
export const patchCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if at least one field is provided for update
  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No update data provided', 400));
  }

  const updatedCategory = await docCategoryService.updateCategory(id, req.body);
  
  if (!updatedCategory) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category: updatedCategory
    }
  });
});

// @desc    Delete document category
// @route   DELETE /api/doc-categories/:id
// @access  Private
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await docCategoryService.deleteCategory(id);
  
  if (!result) {
    return next(new AppError('Category not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  patchCategory,
  deleteCategory,
  getCategoryWithSubcategories,
  getCategoriesWithStats
};