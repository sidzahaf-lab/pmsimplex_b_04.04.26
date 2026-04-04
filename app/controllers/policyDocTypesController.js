import policyDocTypeService from '../services/policyDocTypeService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';

// @desc    Get all policy-document type associations with filtering and pagination
// @route   GET /api/policy-doc-types
// @access  Private
export const getAllPolicyDocTypes = asyncHandler(async (req, res, next) => {
  const result = await policyDocTypeService.getAllPolicyDocTypes(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.associations.length,
    data: result
  });
});

// @desc    Get policy-document type association by ID
// @route   GET /api/policy-doc-types/:id
// @access  Private
export const getPolicyDocTypeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid policy-document type association ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const association = await policyDocTypeService.getPolicyDocTypeById(id);
  
  if (!association) {
    return next(new AppError('Policy-document type association not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      association
    }
  });
});

// @desc    Get all document types associated with a specific policy
// @route   GET /api/policy-doc-types/by-policy/:policyId
// @access  Private
export const getDocTypesByPolicyId = asyncHandler(async (req, res, next) => {
  const { policyId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await policyDocTypeService.getDocTypesByPolicyId(policyId, req.query);
  
  if (!result || result.associations.length === 0) {
    // Not returning 404 because a policy could have no document types
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        associations: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      }
    });
  }

  res.status(200).json({
    status: 'success',
    results: result.associations.length,
    data: result
  });
});

// @desc    Get all policies associated with a specific document type
// @route   GET /api/policy-doc-types/by-doctype/:docTypeId
// @access  Private
export const getPoliciesByDocTypeId = asyncHandler(async (req, res, next) => {
  const { docTypeId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(docTypeId)) {
    return next(new AppError('Invalid document type ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await policyDocTypeService.getPoliciesByDocTypeId(docTypeId, req.query);
  
  if (!result || result.associations.length === 0) {
    // Not returning 404 because a document type could have no policies
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        associations: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      }
    });
  }

  res.status(200).json({
    status: 'success',
    results: result.associations.length,
    data: result
  });
});

// @desc    Create a new policy-document type association
// @route   POST /api/policy-doc-types
// @access  Private
export const createPolicyDocType = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const associationData = req.body;
  
  console.log('📦 Received association data:', JSON.stringify(associationData, null, 2));
  
  // Map frontend field names to backend field names (if needed)
  const mappedAssociationData = {
    policy_id: associationData.policy_id || associationData.policyId,
    doc_type_id: associationData.doc_type_id || associationData.docTypeId || associationData.documentTypeId
  };

  console.log('🔄 Mapped association data:', JSON.stringify(mappedAssociationData, null, 2));

  // Check required fields
  const missingFields = [];
  
  if (!mappedAssociationData.policy_id) missingFields.push('policy_id');
  if (!mappedAssociationData.doc_type_id) missingFields.push('doc_type_id');
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  try {
    const newAssociation = await policyDocTypeService.createPolicyDocType(mappedAssociationData);

    res.status(201).json({
      status: 'success',
      data: {
        association: newAssociation
      }
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('This policy-document type association already exists', 409));
    }
    // Handle foreign key constraint violations
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      if (error.fields?.includes('policy_id')) {
        return next(new AppError('Referenced policy does not exist', 400));
      }
      if (error.fields?.includes('doc_type_id')) {
        return next(new AppError('Referenced document type does not exist', 400));
      }
    }
    throw error;
  }
});

// @desc    Create multiple policy-document type associations at once
// @route   POST /api/policy-doc-types/bulk
// @access  Private
export const bulkCreatePolicyDocTypes = asyncHandler(async (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
    console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { associations } = req.body;
  
  console.log('📦 Received bulk associations data:', JSON.stringify(associations, null, 2));
  
  if (!associations || !Array.isArray(associations) || associations.length === 0) {
    return next(new AppError('Associations array is required and must not be empty', 400));
  }

  // Map frontend field names to backend field names
  const mappedAssociations = associations.map(item => ({
    policy_id: item.policy_id || item.policyId,
    doc_type_id: item.doc_type_id || item.docTypeId || item.documentTypeId
  }));

  // Validate each association has required fields
  const invalidAssociations = mappedAssociations.filter(
    item => !item.policy_id || !item.doc_type_id
  );

  if (invalidAssociations.length > 0) {
    return next(new AppError(
      `Each association must have policy_id and doc_type_id. Found ${invalidAssociations.length} invalid entries.`, 
      400
    ));
  }

  try {
    const createdAssociations = await policyDocTypeService.bulkCreatePolicyDocTypes(mappedAssociations);

    res.status(201).json({
      status: 'success',
      results: createdAssociations.length,
      data: {
        associations: createdAssociations
      }
    });
  } catch (error) {
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('One or more policy-document type associations already exist', 409));
    }
    // Handle foreign key constraint violations
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      if (error.fields?.includes('policy_id')) {
        return next(new AppError('One or more referenced policies do not exist', 400));
      }
      if (error.fields?.includes('doc_type_id')) {
        return next(new AppError('One or more referenced document types do not exist', 400));
      }
    }
    throw error;
  }
});

// @desc    Delete a specific policy-document type association
// @route   DELETE /api/policy-doc-types/:id
// @access  Private
export const deletePolicyDocType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid policy-document type association ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await policyDocTypeService.deletePolicyDocType(id);
  
  if (!result) {
    return next(new AppError('Policy-document type association not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Delete all document type associations for a specific policy
// @route   DELETE /api/policy-doc-types/by-policy/:policyId
// @access  Private
export const deleteAllPolicyDocTypesByPolicy = asyncHandler(async (req, res, next) => {
  const { policyId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(policyId)) {
    return next(new AppError('Invalid policy ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const deletedCount = await policyDocTypeService.deleteAllPolicyDocTypesByPolicy(policyId);
  
  if (deletedCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No associations found for this policy',
      data: {
        deletedCount: 0
      }
    });
  }

  res.status(200).json({
    status: 'success',
    message: `Successfully deleted ${deletedCount} document type association(s) for the policy`,
    data: {
      deletedCount
    }
  });
});

// @desc    Delete all policy associations for a specific document type
// @route   DELETE /api/policy-doc-types/by-doctype/:docTypeId
// @access  Private
export const deleteAllPolicyDocTypesByDocType = asyncHandler(async (req, res, next) => {
  const { docTypeId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(docTypeId)) {
    return next(new AppError('Invalid document type ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const deletedCount = await policyDocTypeService.deleteAllPolicyDocTypesByDocType(docTypeId);
  
  if (deletedCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No associations found for this document type',
      data: {
        deletedCount: 0
      }
    });
  }

  res.status(200).json({
    status: 'success',
    message: `Successfully deleted ${deletedCount} policy association(s) for the document type`,
    data: {
      deletedCount
    }
  });
});

export default {
  getAllPolicyDocTypes,
  getPolicyDocTypeById,
  getDocTypesByPolicyId,
  getPoliciesByDocTypeId,
  createPolicyDocType,
  bulkCreatePolicyDocTypes,
  deletePolicyDocType,
  deleteAllPolicyDocTypesByPolicy,
  deleteAllPolicyDocTypesByDocType
};