// backend/app/controllers/docRevisionController.js
import docRevisionService from '../services/docRevisionService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

// Configuration de multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    console.log('📁 File filter - received file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname
    });
    cb(null, true);
  }
});

// Middleware pour l'upload de fichier
export const uploadFile = upload.single('file');

// @desc    Get all revisions with filtering and pagination
// @route   GET /api/doc-revisions
// @access  Private
export const getAllRevisions = asyncHandler(async (req, res, next) => {
  console.log('📋 GET /api/doc-revisions - Query:', req.query);
  
  const result = await docRevisionService.getAllRevisions(req.query);
  
  console.log(`✅ Found ${result.revisions.length} revisions`);
  
  res.status(200).json({
    status: 'success',
    results: result.revisions.length,
    data: result
  });
});

// @desc    Get revisions by document
// @route   GET /api/projdocs/:projdocId/revisions
// @access  Private
export const getRevisionsByDoc = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log('📋 GET /api/projdocs/${projdocId}/revisions');
  
  // Validation UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  const result = await docRevisionService.getRevisionsByDoc(projdocId, req.query);
  
  console.log(`✅ Found ${result.revisions.length} revisions for document ${projdocId}`);
  
  res.status(200).json({
    status: 'success',
    results: result.revisions.length,
    data: result
  });
});

// @desc    Get revisions by period
// @route   GET /api/emission-periods/:periodId/revisions
// @access  Private
export const getRevisionsByPeriod = asyncHandler(async (req, res, next) => {
  const { periodId } = req.params;
  
  console.log('📋 GET /api/emission-periods/${periodId}/revisions');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(periodId)) {
    console.error('❌ Invalid period ID format:', periodId);
    return next(new AppError('Invalid period ID format', 400));
  }

  const result = await docRevisionService.getRevisionsByPeriod(periodId, req.query);
  
  console.log(`✅ Found ${result.revisions.length} revisions for period ${periodId}`);
  
  res.status(200).json({
    status: 'success',
    results: result.revisions.length,
    data: result
  });
});

// @desc    Get revision by ID
// @route   GET /api/doc-revisions/:id
// @access  Private
export const getRevisionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('📋 GET /api/doc-revisions/${id}');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid revision ID format:', id);
    return next(new AppError('Invalid revision ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const revision = await docRevisionService.getRevisionById(id);
  
  if (!revision) {
    console.log(`⚠️ Revision not found: ${id}`);
    return next(new AppError('Revision not found', 404));
  }

  console.log(`✅ Found revision: ${id}`);
  
  res.status(200).json({
    status: 'success',
    data: {
      revision
    }
  });
});

// @desc    Get latest revision by document
// @route   GET /api/projdocs/:projdocId/latest-revision
// @access  Private
export const getLatestRevision = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log('📋 GET /api/projdocs/${projdocId}/latest-revision');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  const revision = await docRevisionService.getLatestRevision(projdocId);
  
  if (!revision) {
    console.log(`⚠️ No revisions found for document ${projdocId}`);
    return next(new AppError('No revisions found for this document', 404));
  }

  console.log(`✅ Latest revision for document ${projdocId}: revision ${revision.revision}`);
  
  res.status(200).json({
    status: 'success',
    data: {
      revision
    }
  });
});

// @desc    Check file hash for duplicates
// @route   POST /api/doc-revisions/check-hash
// @access  Private
export const checkFileHash = asyncHandler(async (req, res, next) => {
  const { file_hash, hash_algorithm } = req.body;
  
  console.log('📋 POST /api/doc-revisions/check-hash', { file_hash, hash_algorithm });
  
  if (!file_hash || !hash_algorithm) {
    console.error('❌ Missing required fields:', { file_hash, hash_algorithm });
    return next(new AppError('File hash and hash algorithm are required', 400));
  }

  if (file_hash.length !== 64) {
    console.error('❌ Invalid hash length:', file_hash.length);
    return next(new AppError('SHA256 hash must be exactly 64 characters', 400));
  }

  const existing = await docRevisionService.findByFileHash(file_hash, hash_algorithm);
  
  console.log(`✅ Hash check result: ${existing ? 'exists' : 'available'}`);
  
  res.status(200).json({
    status: 'success',
    data: {
      exists: !!existing,
      revision: existing
    }
  });
});

// @desc    Create revision with file upload
// @route   POST /api/projdocs/:projdocId/revisions
// @access  Private
export const createRevision = asyncHandler(async (req, res, next) => {
  console.log('\n📥 ===== CREATE REVISION REQUEST =====');
  console.log('📦 Request params:', req.params);
  console.log('📦 Request body:', req.body);
  console.log('📦 Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    fieldname: req.file.fieldname,
    encoding: req.file.encoding
  } : '⚠️ No file uploaded');
  console.log('📦 Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });

  // Vérifier la validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('\n❌ ===== VALIDATION FAILED =====');
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('Request body that failed:', req.body);
    console.log('Request file:', req.file ? req.file.originalname : 'No file');
    console.log('================================\n');
    
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { projdocId } = req.params;
  console.log('📋 Document ID:', projdocId);
  
  // Validation UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  // Vérifier qu'un fichier a été uploadé
  if (!req.file) {
    console.error('❌ No file uploaded');
    return next(new AppError('File is required', 400));
  }

  // Vérifier la taille du fichier (max 50MB)
  if (req.file.size > 50 * 1024 * 1024) {
    console.error('❌ File too large:', req.file.size, 'bytes');
    return next(new AppError('File size must not exceed 50MB', 400));
  }

  // Get current user ID from auth middleware
  const uploadedBy = req.user?.id || '00000000-0000-0000-0000-000000000000'; // Temporary for testing
  console.log('👤 Uploaded by:', uploadedBy);

  // Calculer le hash SHA256 du fichier
  console.log('🔐 Calculating file hash...');
  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  console.log('✅ File hash:', fileHash);

  // Construire le chemin de stockage
  const fileExt = path.extname(req.file.originalname);
  const fileName = `${projdocId}_${Date.now()}${fileExt}`;
  const filePath = `docs/${projdocId}/${fileName}`;
  console.log('📁 File path:', filePath);

  // Données de la révision
  const revisionData = {
    projdoc_id: projdocId,
    period_id: req.body.period_id || null,
    revision_code: req.body.revision_code || null,
    revision_notes: req.body.revision_notes || null,
    source_filename: req.file.originalname,
    source_file_hash: fileHash,
    hash_algorithm: 'SHA256',
    source_file_size: req.file.size,
    source_file_path: filePath,
    uploaded_by: uploadedBy
  };

  console.log('\n📝 Revision data to create:', JSON.stringify(revisionData, null, 2));

  try {
    console.log('🚀 Calling service.createRevision...');
    const newRevision = await docRevisionService.createRevision(revisionData, req.file.buffer);
    
    console.log('✅ Revision created successfully with ID:', newRevision.id);
    console.log('===== CREATE REVISION SUCCESS =====\n');
    
    res.status(201).json({
      status: 'success',
      data: {
        revision: newRevision
      }
    });
  } catch (serviceError) {
    console.error('\n❌ Service error:', serviceError);
    console.error('Error details:', {
      message: serviceError.message,
      stack: serviceError.stack,
      name: serviceError.name
    });
    console.log('===== CREATE REVISION FAILED =====\n');
    
    return next(new AppError(serviceError.message || 'Failed to create revision', 500));
  }
});

// @desc    Update revision
// @route   PUT /api/doc-revisions/:id
// @access  Private
export const updateRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('📋 PUT /api/doc-revisions/${id}', req.body);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid revision ID format:', id);
    return next(new AppError('Invalid revision ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to revision data
  const revisionData = {};
  if (req.body.revision_code !== undefined) revisionData.revision_code = req.body.revision_code;
  if (req.body.revision_notes !== undefined) revisionData.revision_notes = req.body.revision_notes;
  if (req.body.superseded_by !== undefined) revisionData.superseded_by = req.body.superseded_by;

  // Validate self-reference
  if (revisionData.superseded_by === id) {
    console.error('❌ Revision cannot supersede itself');
    return next(new AppError('A revision cannot supersede itself', 400));
  }

  const updatedRevision = await docRevisionService.updateRevision(id, revisionData);
  
  if (!updatedRevision) {
    console.log(`⚠️ Revision not found: ${id}`);
    return next(new AppError('Revision not found', 404));
  }

  console.log(`✅ Revision ${id} updated successfully`);
  
  res.status(200).json({
    status: 'success',
    data: {
      revision: updatedRevision
    }
  });
});

// @desc    Partially update revision
// @route   PATCH /api/doc-revisions/:id
// @access  Private
export const patchRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('📋 PATCH /api/doc-revisions/${id}', req.body);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid revision ID format:', id);
    return next(new AppError('Invalid revision ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Map request body to revision data
  const revisionData = {};
  if (req.body.revision_code !== undefined) revisionData.revision_code = req.body.revision_code;
  if (req.body.revision_notes !== undefined) revisionData.revision_notes = req.body.revision_notes;
  if (req.body.superseded_by !== undefined) revisionData.superseded_by = req.body.superseded_by;

  // Validate self-reference
  if (revisionData.superseded_by === id) {
    console.error('❌ Revision cannot supersede itself');
    return next(new AppError('A revision cannot supersede itself', 400));
  }

  const updatedRevision = await docRevisionService.updateRevision(id, revisionData);
  
  if (!updatedRevision) {
    console.log(`⚠️ Revision not found: ${id}`);
    return next(new AppError('Revision not found', 404));
  }

  console.log(`✅ Revision ${id} updated successfully`);
  
  res.status(200).json({
    status: 'success',
    data: {
      revision: updatedRevision
    }
  });
});

// @desc    Delete revision
// @route   DELETE /api/doc-revisions/:id
// @access  Private
export const deleteRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log('📋 DELETE /api/doc-revisions/${id}');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid revision ID format:', id);
    return next(new AppError('Invalid revision ID format', 400));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const result = await docRevisionService.deleteRevision(id);
  
  if (!result) {
    console.log(`⚠️ Revision not found: ${id}`);
    return next(new AppError('Revision not found', 404));
  }

  console.log(`✅ Revision ${id} deleted successfully`);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get revision history for document
// @route   GET /api/projdocs/:projdocId/revision-history
// @access  Private
export const getRevisionHistory = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log('📋 GET /api/projdocs/${projdocId}/revision-history');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  const history = await docRevisionService.getRevisionHistory(projdocId);
  
  console.log(`✅ Revision history for document ${projdocId}: ${history.linear.length} revisions`);

  res.status(200).json({
    status: 'success',
    data: {
      history
    }
  });
});

export default {
  getAllRevisions,
  getRevisionsByDoc,
  getRevisionsByPeriod,
  getRevisionById,
  getLatestRevision,
  checkFileHash,
  createRevision,
  updateRevision,
  patchRevision,
  deleteRevision,
  getRevisionHistory,
  uploadFile
};