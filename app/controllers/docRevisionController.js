// backend/app/controllers/docRevisionController.js
import docRevisionService from '../services/docRevisionService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { validationResult } from 'express-validator';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { User } from '../models/index.js';
import FileStorageService from '../services/FileStorageService.js';

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
    success: true,
    count: result.revisions.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.revisions
  });
});

// @desc    Get revisions by status
// @route   GET /api/doc-revisions/status/:status
// @access  Private
export const getRevisionsByStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.params;
  
  console.log(`📋 GET /api/doc-revisions/status/${status}`);
  
  // Validate status
  if (!['pending', 'received', 'late'].includes(status)) {
    return next(new AppError('Status must be pending, received, or late', 400));
  }

  const result = await docRevisionService.getRevisionsByStatus(status, req.query);
  
  res.status(200).json({
    success: true,
    count: result.revisions.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.revisions
  });
});

// @desc    Get revisions by uploader
// @route   GET /api/doc-revisions/uploader/:userId
// @access  Private
export const getRevisionsByUploader = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  console.log(`📋 GET /api/doc-revisions/uploader/${userId}`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const result = await docRevisionService.getRevisionsByUploader(userId, req.query);
  
  res.status(200).json({
    success: true,
    count: result.revisions.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.revisions
  });
});

// @desc    Get duplicate revisions
// @route   GET /api/doc-revisions/duplicates
// @access  Private (Admin only)
export const getDuplicateRevisions = asyncHandler(async (req, res, next) => {
  console.log('📋 GET /api/doc-revisions/duplicates');
  
  const result = await docRevisionService.getDuplicateRevisions(req.query);
  
  res.status(200).json({
    success: true,
    total_groups: result.total_groups,
    data: result.duplicates
  });
});

// @desc    Get revision statistics
// @route   GET /api/doc-revisions/statistics
// @access  Private
export const getRevisionStatistics = asyncHandler(async (req, res, next) => {
  console.log('📋 GET /api/doc-revisions/statistics', req.query);
  
  const stats = await docRevisionService.getRevisionStatistics(req.query);
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get revisions by document
// @route   GET /api/projdocs/:projdocId/revisions
// @access  Private
export const getRevisionsByDoc = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log(`📋 GET /api/projdocs/${projdocId}/revisions`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  const result = await docRevisionService.getRevisionsByDoc(projdocId, req.query);
  
  console.log(`✅ Found ${result.revisions.length} revisions for document ${projdocId}`);
  
  res.status(200).json({
    success: true,
    count: result.revisions.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.revisions
  });
});

// @desc    Get revisions by period
// @route   GET /api/emission-periods/:periodId/revisions
// @access  Private
export const getRevisionsByPeriod = asyncHandler(async (req, res, next) => {
  const { periodId } = req.params;
  
  console.log(`📋 GET /api/emission-periods/${periodId}/revisions`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(periodId)) {
    console.error('❌ Invalid period ID format:', periodId);
    return next(new AppError('Invalid period ID format', 400));
  }

  const result = await docRevisionService.getRevisionsByPeriod(periodId, req.query);
  
  console.log(`✅ Found ${result.revisions.length} revisions for period ${periodId}`);
  
  res.status(200).json({
    success: true,
    count: result.revisions.length,
    total: result.pagination.total,
    page: result.pagination.page,
    pages: result.pagination.pages,
    data: result.revisions
  });
});

// @desc    Get revision by ID
// @route   GET /api/doc-revisions/:id
// @access  Private
export const getRevisionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 GET /api/doc-revisions/${id}`);
  
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

  const revision = await docRevisionService.getRevisionById(id, { includeSuperseded: true });
  
  if (!revision) {
    console.log(`⚠️ Revision not found: ${id}`);
    return next(new AppError('Revision not found', 404));
  }

  console.log(`✅ Found revision: ${id}`);
  
  res.status(200).json({
    success: true,
    data: revision
  });
});

// @desc    Get latest revision by document
// @route   GET /api/projdocs/:projdocId/latest-revision
// @access  Private
export const getLatestRevision = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log(`📋 GET /api/projdocs/${projdocId}/latest-revision`);
  
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
    success: true,
    data: revision
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
    success: true,
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

  // Gestion de l'utilisateur uploader
  let uploadedBy = req.user?.id;

  // Si l'utilisateur est sélectionné dans le formulaire, l'utiliser
  if (req.body.uploaded_by) {
    uploadedBy = req.body.uploaded_by;
    console.log('👤 Using selected user from form:', uploadedBy);
  } 
  // Sinon, utiliser l'utilisateur connecté ou chercher un utilisateur par défaut
  else if (!uploadedBy) {
    console.log('👤 No user specified, looking for default user...');
    try {
      // Chercher le premier utilisateur actif dans la base
      const firstUser = await User.findOne({ 
        where: { is_active: true },
        order: [['created_at', 'ASC']],
        attributes: ['id'],
        limit: 1
      });
      
      if (firstUser) {
        uploadedBy = firstUser.id;
        console.log('👤 Using first available user:', uploadedBy);
      }
    } catch (error) {
      console.error('❌ Error finding default user:', error);
    }
  }

  // Vérifier qu'on a un utilisateur valide
  if (!uploadedBy) {
    console.error('❌ No valid user found for upload');
    return next(new AppError('No user specified and no default user found. Please select a user.', 400));
  }

  // Valider que l'UUID de l'utilisateur est valide
  if (!uuidRegex.test(uploadedBy)) {
    console.error('❌ Invalid user ID format:', uploadedBy);
    return next(new AppError('Invalid user ID format. Must be a valid UUID.', 400));
  }

  console.log('👤 Final uploaded_by:', uploadedBy);

  // Calculer le hash SHA256 du fichier
  console.log('🔐 Calculating file hash...');
  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  console.log('✅ File hash:', fileHash);

  // Construire le chemin de stockage
  const fileExt = path.extname(req.file.originalname);
  const fileName = `${projdocId}_${Date.now()}${fileExt}`;
  const filePath = `docs/${projdocId}/${fileName}`;
  console.log('📁 File path:', filePath);

  // Déterminer le statut initial en fonction de la période
  let initialStatus = 'received';
  if (req.body.period_id) {
    // Le statut sera déterminé par le service en fonction de la date prévue
    initialStatus = 'pending'; // Le service ajustera si nécessaire
  }

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
    uploaded_by: uploadedBy,
    status: req.body.status || initialStatus
  };

  console.log('\n📝 Revision data to create:', JSON.stringify(revisionData, null, 2));

  try {
    console.log('🚀 Calling service.createRevision...');
    const newRevision = await docRevisionService.createRevision(revisionData, req.file.buffer);
    
    console.log('✅ Revision created successfully with ID:', newRevision.id);
    console.log('📊 Revision status:', newRevision.status);
    console.log('===== CREATE REVISION SUCCESS =====\n');
    
    res.status(201).json({
      success: true,
      message: 'Revision created successfully',
      data: newRevision
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

// @desc    Download revision file
// @route   GET /api/doc-revisions/:id/download
// @access  Private
export const downloadRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📥 GET /api/doc-revisions/${id}/download`);
  
  // Validation UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('❌ Invalid revision ID format:', id);
    return next(new AppError('Invalid revision ID format', 400));
  }

  try {
    // Récupérer la révision
    const revision = await docRevisionService.getRevisionById(id);
    if (!revision) {
      console.log(`⚠️ Revision not found: ${id}`);
      return next(new AppError('Revision not found', 404));
    }

    console.log(`📥 Downloading file: ${revision.source_file_path}`);
    
    // Récupérer le flux du fichier depuis Backblaze
    const fileStream = await FileStorageService.getFileStream(revision.source_file_path);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${revision.source_filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', revision.source_file_size);
    
    // Envoyer le fichier
    fileStream.pipe(res);
    
    console.log('✅ File download initiated');
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    
    // Fallback: essayer de générer une URL signée
    try {
      console.log('🔄 Trying signed URL fallback...');
      const signedUrl = await FileStorageService.generatePresignedUrl(revision.source_file_path, 300);
      return res.redirect(signedUrl);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return next(new AppError('Failed to download file', 500));
    }
  }
});

// @desc    Update revision
// @route   PUT /api/doc-revisions/:id
// @access  Private
export const updateRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 PUT /api/doc-revisions/${id}`, req.body);
  
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
  if (req.body.status !== undefined) revisionData.status = req.body.status;

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
  if (revisionData.status) {
    console.log(`📊 Status updated to: ${revisionData.status}`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Revision updated successfully',
    data: updatedRevision
  });
});

// @desc    Partially update revision
// @route   PATCH /api/doc-revisions/:id
// @access  Private
export const patchRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 PATCH /api/doc-revisions/${id}`, req.body);
  
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
  if (req.body.status !== undefined) revisionData.status = req.body.status;

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
    success: true,
    message: 'Revision updated successfully',
    data: updatedRevision
  });
});

// @desc    Delete revision
// @route   DELETE /api/doc-revisions/:id
// @access  Private
export const deleteRevision = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`📋 DELETE /api/doc-revisions/${id}`);
  
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
  
  res.status(200).json({
    success: true,
    message: 'Revision deleted successfully',
    data: null
  });
});

// @desc    Get revision history for document
// @route   GET /api/projdocs/:projdocId/revision-history
// @access  Private
export const getRevisionHistory = asyncHandler(async (req, res, next) => {
  const { projdocId } = req.params;
  
  console.log(`📋 GET /api/projdocs/${projdocId}/revision-history`);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projdocId)) {
    console.error('❌ Invalid document ID format:', projdocId);
    return next(new AppError('Invalid document ID format', 400));
  }

  const history = await docRevisionService.getRevisionHistory(projdocId);
  
  console.log(`✅ Revision history for document ${projdocId}: ${history.linear.length} revisions`);

  res.status(200).json({
    success: true,
    data: history
  });
});

// @desc    Bulk update revision status
// @route   POST /api/doc-revisions/bulk-status-update
// @access  Private (Admin only)
export const bulkUpdateRevisionStatus = asyncHandler(async (req, res, next) => {
  const { revisionIds, status } = req.body;
  
  console.log(`📋 POST /api/doc-revisions/bulk-status-update`, { revisionIds, status });
  
  if (!Array.isArray(revisionIds) || revisionIds.length === 0) {
    return next(new AppError('Please provide an array of revision IDs', 400));
  }
  
  if (!status || !['pending', 'received', 'late'].includes(status)) {
    return next(new AppError('Status must be pending, received, or late', 400));
  }

  const results = {
    success: [],
    failed: []
  };

  for (const id of revisionIds) {
    try {
      const updated = await docRevisionService.updateRevision(id, { status });
      if (updated) {
        results.success.push(id);
      } else {
        results.failed.push({ id, reason: 'Revision not found' });
      }
    } catch (error) {
      results.failed.push({ id, reason: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: `Updated ${results.success.length} revisions, ${results.failed.length} failed`,
    data: results
  });
});

export default {
  getAllRevisions,
  getRevisionsByStatus,
  getRevisionsByUploader,
  getDuplicateRevisions,
  getRevisionStatistics,
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
  downloadRevision,
  bulkUpdateRevisionStatus,
  uploadFile
};