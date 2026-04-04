import docTypeService from '../services/docTypeService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// Constants for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper function to validate UUID
const validateUUID = (id, fieldName = 'ID') => {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
};

// Helper function to check validation errors - FIXED to properly return and stop execution
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    // Return the error response directly
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return null;
};

// @desc    Get all document types with filtering and pagination
// @route   GET /api/doc-types
// @access  Private
export const getAllDocTypes = asyncHandler(async (req, res, next) => {
  const result = await docTypeService.getAllDocTypes(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.docTypes.length,
    pagination: result.pagination,
    data: {
      docTypes: result.docTypes
    }
  });
});

// @desc    Get document type by ID
// @route   GET /api/doc-types/:id
// @access  Private
export const getDocTypeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
   
  // Validate UUID format
  validateUUID(id, 'document type ID');

  // Check validation errors from express-validator - FIXED
  const validationError = checkValidationErrors(req, res, next);
  if (validationError) return validationError;

  const docType = await docTypeService.getDocTypeById(id);
  
  if (!docType) {
    return next(new AppError('Document type not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      docType
    }
  });
});

// @desc    Get document types by subcategory ID
// @route   GET /api/doc-types/by-subcategory/:subcategoryId
// @access  Public
export const getDocTypesBySubcategory = asyncHandler(async (req, res, next) => {
  const { subcategoryId } = req.params;
  
  // Validate UUID format
  validateUUID(subcategoryId, 'subcategory ID');

  const result = await docTypeService.getDocTypesBySubcategory(subcategoryId, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.docTypes.length,
    pagination: result.pagination,
    data: {
      docTypes: result.docTypes,
      subcategoryId
    }
  });
});

// @desc    Get periodic document types
// @route   GET /api/doc-types/periodic
// @access  Public
export const getPeriodicDocTypes = asyncHandler(async (req, res, next) => {
  const result = await docTypeService.getPeriodicDocTypes(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.docTypes.length,
    pagination: result.pagination,
    data: {
      docTypes: result.docTypes,
      type: 'periodic'
    }
  });
});

// @desc    Get document types by entity type
// @route   GET /api/doc-types/by-entity-type/:entityType
// @access  Public
export const getDocTypesByEntityType = asyncHandler(async (req, res, next) => {
  const { entityType } = req.params;
  const normalizedEntityType = entityType.toLowerCase();

  const result = await docTypeService.getDocTypesByEntityType(normalizedEntityType, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.docTypes.length,
    pagination: result.pagination,
    data: {
      docTypes: result.docTypes,
      entityType: normalizedEntityType
    }
  });
});

// @desc    Get document types with full details (including subcategory and category)
// @route   GET /api/doc-types/with-details
// @access  Public
export const getDocTypesWithDetails = asyncHandler(async (req, res, next) => {
  const result = await docTypeService.getDocTypesWithDetails(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.docTypes.length,
    pagination: result.pagination,
    data: {
      docTypes: result.docTypes
    }
  });
});

// @desc    Validate file format against document type
// @route   POST /api/doc-types/validate-format
// @access  Public
export const validateFileFormat = asyncHandler(async (req, res, next) => {
  const { docTypeId, filename } = req.body;
  
  // Check required fields
  if (!docTypeId || !filename) {
    return next(new AppError('docTypeId and filename are required', 400));
  }
  
  // Validate UUID format
  validateUUID(docTypeId, 'document type ID');

  const result = await docTypeService.validateFileFormat(docTypeId, filename);
  
  res.status(200).json({
    status: 'success',
    data: {
      isValid: result.isValid,
      message: result.message,
      allowedFormats: result.allowedFormats,
      uploadedFormat: result.uploadedFormat
    }
  });
});

// @desc    Create document type - FIXED to properly handle validation
// @route   POST /api/doc-types
// @access  Private
export const createDocType = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    // Return error response and STOP execution
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const docTypeData = req.body;
  
  console.log('📦 Received document type data:', JSON.stringify(docTypeData, null, 2));
  
  // Check required fields
  const requiredFields = ['subcategory_id', 'label', 'entity_type', 'native_format'];
  const missingFields = requiredFields.filter(field => !docTypeData[field]);
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  const newDocType = await docTypeService.createDocType(docTypeData);

  res.status(201).json({
    status: 'success',
    data: {
      docType: newDocType
    }
  });
});

// @desc    Update document type (full update) - FIXED
// @route   PUT /api/doc-types/:id
// @access  Private
export const updateDocType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate UUID format
  validateUUID(id, 'document type ID');

  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Check if at least one field is provided for update
  if (Object.keys(req.body).length === 0) {
    return next(new AppError('No update data provided', 400));
  }

  const updatedDocType = await docTypeService.updateDocType(id, req.body);
  
  if (!updatedDocType) {
    return next(new AppError('Document type not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      docType: updatedDocType
    }
  });
});

// @desc    Partially update document type
// @route   PATCH /api/doc-types/:id
// @access  Private
export const patchDocType = asyncHandler(async (req, res, next) => {
  return updateDocType(req, res, next);
});

// @desc    Delete document type
// @route   DELETE /api/doc-types/:id
// @access  Private
export const deleteDocType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate UUID format
  validateUUID(id, 'document type ID');

  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const result = await docTypeService.deleteDocType(id);
  
  if (!result) {
    return next(new AppError('Document type not found', 404));
  }

  res.status(204).send();
});

// @desc    Get document type statistics
// @route   GET /api/doc-types/stats
// @access  Private
export const getDocTypeStats = asyncHandler(async (req, res, next) => {
  const stats = await docTypeService.getDocTypeStats();
  
  res.status(200).json({
    status: 'success',
    data: stats
  });
});

export default {
  getAllDocTypes,
  getDocTypeById,
  createDocType,
  updateDocType,
  patchDocType,
  deleteDocType,
  getDocTypesBySubcategory,
  getPeriodicDocTypes,
  getDocTypesByEntityType,
  validateFileFormat,
  getDocTypesWithDetails,
  getDocTypeStats
};