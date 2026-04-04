// backend/app/controllers/projDocController.js
import projDocService from '../services/projDocService.js';
import emissionPolicyService from '../services/emissionPolicyService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';
import { DocType, ProjDoc } from '../models/index.js'; // Ajout des imports manquants

// @desc    Check if a unique document already exists for a project and doc type
// @route   GET /api/projdocs/check-unique/:projectId/:docTypeId
// @access  Private
export const checkUniqueDocument = asyncHandler(async (req, res, next) => {
  const { projectId, docTypeId } = req.params;
  
  console.log('\n🔍 ===== CHECK UNIQUE DOCUMENT =====');
  console.log('Project ID:', projectId);
  console.log('Doc Type ID:', docTypeId);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId) || !uuidRegex.test(docTypeId)) {
    console.error('❌ Invalid ID format');
    return next(new AppError('Invalid ID format', 400));
  }

  // Vérifier si le type de document est unique
  const docType = await DocType.findByPk(docTypeId);
  if (!docType) {
    console.error('❌ Document type not found');
    return next(new AppError('Document type not found', 404));
  }

  console.log('📄 Document type:', {
    label: docType.label,
    only_one_per_project: docType.only_one_per_project
  });

  if (!docType.only_one_per_project) {
    // Si ce n'est pas un type unique, retourner false
    console.log('ℹ️ Document type is not unique');
    return res.status(200).json({
      status: 'success',
      data: {
        exists: false,
        is_unique_type: false,
        message: 'Document type is not unique'
      }
    });
  }

  // Chercher un document existant avec ce projet et ce type
  const existingDoc = await ProjDoc.findOne({
    where: {
      project_id: projectId,
      doc_type_id: docTypeId
    },
    attributes: ['id', 'doc_number', 'title', 'created_at']
  });

  if (existingDoc) {
    console.log('⚠️ Existing unique document found:', existingDoc.doc_number);
    return res.status(200).json({
      status: 'success',
      data: {
        exists: true,
        is_unique_type: true,
        doc_number: existingDoc.doc_number,
        doc_id: existingDoc.id,
        doc_title: existingDoc.title,
        created_at: existingDoc.created_at,
        message: `A unique document already exists for this project`
      }
    });
  }

  console.log('✅ No existing document found - available for creation');
  console.log('================================\n');
  
  return res.status(200).json({
    status: 'success',
    data: {
      exists: false,
      is_unique_type: true,
      message: 'Document type is unique and available'
    }
  });
});

// @desc    Get all project documents with filtering and pagination
// @route   GET /api/projdocs
// @access  Private
export const getAllProjDocs = asyncHandler(async (req, res, next) => {
  console.log('\n📋 ===== GET ALL PROJDOCS =====');
  console.log('Query params:', req.query);
  
  const result = await projDocService.getAllProjDocs(req.query);
  
  console.log(`✅ Found ${result.docs.length} documents`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    results: result.docs.length,
    data: result
  });
});

// @desc    Get documents by project
// @route   GET /api/projects/:projectId/docs
// @access  Private
export const getDocsByProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  
  console.log('\n📋 ===== GET DOCS BY PROJECT =====');
  console.log('Project ID:', projectId);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ Invalid project ID format:', projectId);
    return next(new AppError('Invalid project ID format', 400));
  }

  const result = await projDocService.getDocsByProject(projectId, req.query);
  
  console.log(`✅ Found ${result.docs.length} documents for project ${projectId}`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    results: result.docs.length,
    data: result
  });
});

// @desc    Get document by ID
// @route   GET /api/projdocs/:id
// @access  Private
export const getProjDocById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('\n📋 ===== GET PROJDOC BY ID =====');
  console.log('Document ID:', id);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const doc = await projDocService.getProjDocById(id);
  
  if (!doc) {
    console.log(`⚠️ Document not found: ${id}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document found: ${doc.doc_number}`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      doc
    }
  });
});

// @desc    Get document by doc number
// @route   GET /api/projects/:projectId/docs/number/:docNumber
// @access  Private
export const getDocByNumber = asyncHandler(async (req, res, next) => {
  const { projectId, docNumber } = req.params;
  
  console.log('\n📋 ===== GET DOC BY NUMBER =====');
  console.log('Project ID:', projectId);
  console.log('Doc Number:', docNumber);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ Invalid project ID format:', projectId);
    return next(new AppError('Invalid project ID format', 400));
  }

  if (!docNumber || docNumber.length > 150) {
    console.error('❌ Invalid document number:', docNumber);
    return next(new AppError('Invalid document number', 400));
  }

  const doc = await projDocService.getDocByNumber(projectId, docNumber);
  
  if (!doc) {
    console.log(`⚠️ Document not found: ${projectId}/${docNumber}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document found with ID: ${doc.id}`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      doc
    }
  });
});

// @desc    Check document number availability
// @route   GET /api/projects/:projectId/docs/check-number/:docNumber
// @access  Private
export const checkDocNumberAvailability = asyncHandler(async (req, res, next) => {
  const { projectId, docNumber } = req.params;
  
  console.log('\n📋 ===== CHECK DOC NUMBER AVAILABILITY =====');
  console.log('Project ID:', projectId);
  console.log('Doc Number:', docNumber);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ Invalid project ID format:', projectId);
    return next(new AppError('Invalid project ID format', 400));
  }

  if (!docNumber || docNumber.length < 1 || docNumber.length > 150) {
    console.error('❌ Invalid document number:', docNumber);
    return next(new AppError('Document number must be between 1 and 150 characters', 400));
  }

  // IMPORTANT: Check globally across ALL projects (ignore projectId)
  const isAvailable = await projDocService.checkDocNumberAvailabilityGlobally(docNumber.trim());
  
  console.log(`✅ Availability: ${isAvailable ? 'Available' : 'Already exists in another project'}`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      message: isAvailable 
        ? 'Document number is available' 
        : 'Document number already exists in another project'
    }
  });
});

// @desc    Create document (supports both ad-hoc and periodic)
// @route   POST /api/projects/:projectId/docs
// @access  Private
export const createProjDoc = asyncHandler(async (req, res, next) => {
  console.log('\n📥 ===== CREATE PROJDOC =====');
  console.log('Request params:', req.params);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projectId } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ Invalid project ID format:', projectId);
    return next(new AppError('Invalid project ID format', 400));
  }

  // 🔥 Vérifier si c'est un document unique et s'il existe déjà
  const docType = await DocType.findByPk(req.body.doc_type_id);
  if (docType && docType.only_one_per_project) {
    const existingDoc = await ProjDoc.findOne({
      where: {
        project_id: projectId,
        doc_type_id: req.body.doc_type_id
      }
    });
    
    if (existingDoc) {
      console.error('❌ Unique document already exists for this project');
      return next(new AppError(`A unique document of type "${docType.label}" already exists for this project (${existingDoc.doc_number})`, 400));
    }
  }

  // Check if this is a periodic document (has frequency field)
  const isPeriodic = req.body.frequency && ['daily', 'weekly', 'monthly'].includes(req.body.frequency);
  
  console.log(`📋 Document type: ${isPeriodic ? 'PERIODIC' : 'AD-HOC'}`);

  // Base document data
  const docData = {
    project_id: projectId,
    doc_type_id: req.body.doc_type_id,
    doc_number: req.body.doc_number,
    title: req.body.title,
    status: 'active'
  };

  // 🔥 AJOUTER emission_id SI FOURNI
  if (req.body.emission_id) {
    docData.emission_id = req.body.emission_id;
    console.log('📋 Using existing emission policy:', req.body.emission_id);
  }

  // Prepare periodic data if this is a periodic document
  let periodicData = null;
  if (isPeriodic) {
    periodicData = {
      frequency: req.body.frequency,
      anchor_date: req.body.anchor_date,
      anchor_day: req.body.anchor_day ? parseInt(req.body.anchor_day) : null,
      project_end_date: req.body.project_end_date,
      policy_description: req.body.policy_description || null
    };
  }

  console.log('📝 Document data to create:', JSON.stringify(docData, null, 2));
  if (periodicData) {
    console.log('📅 Periodic data:', JSON.stringify(periodicData, null, 2));
  }

  // Validate required fields
  const missingFields = [];
  if (!docData.doc_type_id) missingFields.push('doc_type_id');
  if (!docData.doc_number) missingFields.push('doc_number');
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  try {
    console.log('🚀 Calling service.createProjDoc...');
    
    const newDoc = await projDocService.createProjDoc(
      docData, 
      req.body.entity_meta || {},
      periodicData
    );
    
    console.log('\n✅ Document created successfully:', newDoc.id);
    console.log('================================\n');

    res.status(201).json({
      status: 'success',
      data: {
        doc: newDoc
      }
    });
  } catch (error) {
    console.error('❌ Error in createProjDoc:', error);
    throw error;
  }
});

// @desc    Update document
// @route   PUT /api/projdocs/:id
// @access  Private
export const updateProjDoc = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('\n📝 ===== UPDATE PROJDOC =====');
  console.log('Document ID:', id);
  console.log('Update data:', req.body);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to doc data
  const docData = {};
  if (req.body.doc_number !== undefined) docData.doc_number = req.body.doc_number;
  if (req.body.title !== undefined) docData.title = req.body.title;
  if (req.body.emission_id !== undefined) docData.emission_id = req.body.emission_id;
  if (req.body.status !== undefined) docData.status = req.body.status;

  const updatedDoc = await projDocService.updateProjDoc(id, docData);
  
  if (!updatedDoc) {
    console.log(`⚠️ Document not found: ${id}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document ${id} updated successfully`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      doc: updatedDoc
    }
  });
});

// @desc    Partially update document
// @route   PATCH /api/projdocs/:id
// @access  Private
export const patchProjDoc = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('\n📝 ===== PATCH PROJDOC =====');
  console.log('Document ID:', id);
  console.log('Patch data:', req.body);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to doc data
  const docData = {};
  if (req.body.doc_number !== undefined) docData.doc_number = req.body.doc_number;
  if (req.body.title !== undefined) docData.title = req.body.title;
  if (req.body.emission_id !== undefined) docData.emission_id = req.body.emission_id;
  if (req.body.status !== undefined) docData.status = req.body.status;

  const updatedDoc = await projDocService.updateProjDoc(id, docData);
  
  if (!updatedDoc) {
    console.log(`⚠️ Document not found: ${id}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document ${id} patched successfully`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      doc: updatedDoc
    }
  });
});

// @desc    Delete document
// @route   DELETE /api/projdocs/:id
// @access  Private
export const deleteProjDoc = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('\n🗑️ ===== DELETE PROJDOC =====');
  console.log('Document ID:', id);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await projDocService.deleteProjDoc(id);
  
  if (!result) {
    console.log(`⚠️ Document not found: ${id}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document ${id} deleted successfully`);
  console.log('================================\n');
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Toggle document status
// @route   PATCH /api/projdocs/:id/status
// @access  Private
export const toggleDocStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('\n🔄 ===== TOGGLE DOC STATUS =====');
  console.log('Document ID:', id);
  console.log('New status:', status);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  if (!status || !['active', 'superseded', 'cancelled'].includes(status)) {
    console.error('❌ Invalid status:', status);
    return next(new AppError('Status must be active, superseded, or cancelled', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const updatedDoc = await projDocService.updateProjDoc(id, { status });
  
  if (!updatedDoc) {
    console.log(`⚠️ Document not found: ${id}`);
    return next(new AppError('Document not found', 404));
  }

  console.log(`✅ Document ${id} status updated to ${status}`);
  console.log('================================\n');
  
  res.status(200).json({
    status: 'success',
    data: {
      doc: updatedDoc
    }
  });
});

// @desc    Generate periods for a periodic document (IN DOC_REVISIONS)
// @route   POST /api/projdocs/:id/generate-periods
// @access  Private
export const generatePeriods = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { end_date } = req.body;
  
  console.log('\n📅 ===== GENERATE PERIODS IN DOC_REVISIONS =====');
  console.log('Document ID:', id);
  console.log('End date:', end_date || 'Using policy end date');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid document ID format:', id);
    return next(new AppError('Invalid document ID format', 400));
  }

  // Get the document to check if it has an emission policy
  const doc = await projDocService.getProjDocById(id);
  
  if (!doc) {
    return next(new AppError('Document not found', 404));
  }

  if (!doc.emission_policy) {
    return next(new AppError('Document does not have an emission policy', 400));
  }

  // Generate periods directly in doc_revisions
  const periods = await projDocService.generatePeriodsInDocRevisions(
    id, 
    doc.emission_policy,
    end_date || doc.emission_policy.project_end_date
  );

  console.log(`✅ Generated ${periods.length} periods in doc_revisions`);
  console.log('================================\n');

  res.status(200).json({
    status: 'success',
    data: {
      periods,
      count: periods.length
    }
  });
});

// 🔥 NOUVELLE MÉTHODE: Get all periods for a periodic document with upload status
// @route   GET /api/projdocs/:id/periods-with-status
// @access  Private
export const getDocumentPeriodsWithStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`\n📅 ===== GET DOCUMENT PERIODS WITH STATUS =====`);
  console.log('Document ID:', id);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return next(new AppError('Invalid document ID format', 400));
  }

  const result = await projDocService.getDocumentPeriodsWithStatus(id);
  
  console.log(`✅ Found ${result.periods.length} periods`);
  console.log(`✅ Upload active: ${result.summary.upload_active}`);
  console.log('================================\n');

  res.status(200).json({
    status: 'success',
    data: result
  });
});

// @desc    Get document statistics
// @route   GET /api/projects/:projectId/docs/stats
// @access  Private
export const getDocStats = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  
  console.log('\n📊 ===== GET DOC STATS =====');
  console.log('Project ID:', projectId);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ Invalid project ID format:', projectId);
    return next(new AppError('Invalid project ID format', 400));
  }

  const statusCounts = await projDocService.getDocsCountByStatus(projectId);
  const typeCounts = await projDocService.getPeriodicVsAdhocCount(projectId);
  
  console.log('✅ Stats retrieved');
  console.log('================================\n');

  res.status(200).json({
    status: 'success',
    data: {
      by_status: statusCounts,
      by_type: typeCounts,
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0)
    }
  });
});

export default {
  getAllProjDocs,
  getDocsByProject,
  getProjDocById,
  getDocByNumber,
  checkDocNumberAvailability,
  checkUniqueDocument,
  createProjDoc,
  updateProjDoc,
  patchProjDoc,
  deleteProjDoc,
  toggleDocStatus,
  generatePeriods,
  getDocumentPeriodsWithStatus,
  getDocStats
};