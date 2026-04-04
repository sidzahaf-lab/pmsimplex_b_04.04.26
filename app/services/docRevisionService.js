// src/services/docRevisionService.js
import { DocRevision, ProjDoc, EmissionPeriod, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import FileStorageService from './FileStorageService.js';

class DocRevisionService {
  // Get all revisions with optional filtering and pagination
  async getAllRevisions(filters = {}) {
    const {
      projdoc_id,
      period_id,
      uploaded_by,
      status,
      from_date,
      to_date,
      page = 1,
      limit = 10,
      sort = 'uploaded_at',
      order = 'DESC',
      include_document = 'true',
      include_period = 'true',
      include_uploader = 'true'
    } = filters;

    const whereClause = {};
    if (projdoc_id) whereClause.projdoc_id = projdoc_id;
    if (period_id) whereClause.period_id = period_id;
    if (uploaded_by) whereClause.uploaded_by = uploaded_by;
    if (status) whereClause.status = status;
    
    if (from_date || to_date) {
      whereClause.uploaded_at = {};
      if (from_date) whereClause.uploaded_at[Op.gte] = new Date(from_date);
      if (to_date) whereClause.uploaded_at[Op.lte] = new Date(to_date);
    }

    const offset = (page - 1) * limit;

    // Build include array dynamically
    const include = [];

    if (include_document === 'true') {
      include.push({
        model: ProjDoc,
        as: 'document',
        include: ['doc_type', 'project']
      });
    }

    if (include_period === 'true') {
      include.push({
        model: EmissionPeriod,
        as: 'period',
        required: false
      });
    }

    if (include_uploader === 'true') {
      include.push({
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'family_name', 'email']
      });
    }

    const result = await DocRevision.findAndCountAll({
      where: whereClause,
      include: include.length > 0 ? include : undefined,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      revisions: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get revisions by status
  async getRevisionsByStatus(status, filters = {}) {
    return await this.getAllRevisions({
      ...filters,
      status
    });
  }

  // Get revisions by uploader
  async getRevisionsByUploader(userId, filters = {}) {
    return await this.getAllRevisions({
      ...filters,
      uploaded_by: userId
    });
  }

  // Find duplicate revisions (same file hash)
  async getDuplicateRevisions(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Find hashes that appear more than once
    const duplicates = await DocRevision.findAll({
      attributes: [
        'source_file_hash',
        [sequelize.fn('COUNT', sequelize.col('source_file_hash')), 'count']
      ],
      where: {
        source_file_hash: { [Op.ne]: null }
      },
      group: ['source_file_hash'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('source_file_hash')), '>', 1),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get all revisions with those hashes
    const hashList = duplicates.map(d => d.source_file_hash);
    
    const revisions = await DocRevision.findAll({
      where: {
        source_file_hash: { [Op.in]: hashList }
      },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          attributes: ['id', 'doc_number', 'title']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name']
        }
      ],
      order: [['source_file_hash', 'ASC'], ['uploaded_at', 'DESC']]
    });

    // Group by hash
    const grouped = {};
    revisions.forEach(rev => {
      if (!grouped[rev.source_file_hash]) {
        grouped[rev.source_file_hash] = [];
      }
      grouped[rev.source_file_hash].push(rev);
    });

    return {
      total_groups: duplicates.length,
      duplicates: grouped
    };
  }

  // Get revisions by document
  async getRevisionsByDoc(projdocId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'revision',
      order = 'DESC'
    } = filters;

    // Check if document exists
    const doc = await ProjDoc.findByPk(projdocId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const offset = (page - 1) * limit;

    const result = await DocRevision.findAndCountAll({
      where: { projdoc_id: projdocId },
      include: [
        {
          model: EmissionPeriod,
          as: 'period',
          required: false
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name', 'email']
        },
        {
          model: DocRevision,
          as: 'superseding_revision',
          required: false,
          attributes: ['id', 'revision', 'revision_code']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      revisions: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get revisions by period
  async getRevisionsByPeriod(periodId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'uploaded_at',
      order = 'DESC'
    } = filters;

    // Check if period exists
    const period = await EmissionPeriod.findByPk(periodId);
    if (!period) {
      throw new AppError('Emission period not found', 404);
    }

    const offset = (page - 1) * limit;

    const result = await DocRevision.findAndCountAll({
      where: { period_id: periodId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['doc_type']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      revisions: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get revision by ID
  async getRevisionById(id, options = {}) {
    const include = [
      {
        model: ProjDoc,
        as: 'document',
        include: ['doc_type', 'project']
      },
      {
        model: EmissionPeriod,
        as: 'period'
      },
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'family_name', 'email']
      }
    ];

    if (options.includeSuperseded) {
      include.push({
        model: DocRevision,
        as: 'superseding_revision',
        attributes: ['id', 'revision', 'revision_code']
      });
      include.push({
        model: DocRevision,
        as: 'superseded_revisions',
        attributes: ['id', 'revision', 'revision_code', 'uploaded_at']
      });
    }

    return await DocRevision.findByPk(id, { include });
  }

  // Get latest revision by document
  async getLatestRevision(projdocId) {
    return await DocRevision.findOne({
      where: { projdoc_id: projdocId },
      order: [['revision', 'DESC']],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name', 'email']
        },
        {
          model: EmissionPeriod,
          as: 'period',
          required: false
        }
      ]
    });
  }

  // Find revision by file hash
  async findByFileHash(fileHash, hashAlgorithm = 'SHA256') {
    return await DocRevision.findOne({
      where: {
        source_file_hash: fileHash,
        hash_algorithm: hashAlgorithm
      },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          attributes: ['id', 'doc_number', 'title']
        }
      ]
    });
  }

  // Create revision with file upload
  async createRevision(revisionData, fileBuffer) {
    const transaction = await DocRevision.sequelize.transaction();

    try {
      // Check if document exists
      const doc = await ProjDoc.findByPk(revisionData.projdoc_id, { transaction });
      if (!doc) {
        throw new AppError('Document not found', 404);
      }

      // Check if period exists (if provided)
      if (revisionData.period_id) {
        const period = await EmissionPeriod.findByPk(revisionData.period_id, { transaction });
        if (!period) {
          throw new AppError('Emission period not found', 404);
        }

        // Verify period belongs to document's emission policy
        if (doc.emission_id && period.emission_id !== doc.emission_id) {
          throw new AppError('Period does not belong to this document\'s emission policy', 400);
        }
      }

      // Check for duplicate file hash
      const existingHash = await DocRevision.findOne({
        where: {
          source_file_hash: revisionData.source_file_hash,
          hash_algorithm: revisionData.hash_algorithm || 'SHA256'
        },
        transaction
      });

      if (existingHash) {
        throw new AppError('A file with the same hash already exists', 400);
      }

      // Upload file to Backblaze B2
      try {
        console.log('📤 Uploading file to Backblaze B2:', revisionData.source_file_path);
        
        // Determine MIME type based on extension
        const fileExt = revisionData.source_filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        
        const mimeMap = {
          'pdf': 'application/pdf',
          'xer': 'application/xer',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'txt': 'text/plain',
          'csv': 'text/csv',
          'xml': 'application/xml',
          'json': 'application/json'
        };
        
        if (fileExt && mimeMap[fileExt]) {
          mimeType = mimeMap[fileExt];
        }
        
        await FileStorageService.uploadFile(
          fileBuffer,
          revisionData.source_file_path,
          mimeType
        );
        
        console.log('✅ File uploaded to B2 successfully:', revisionData.source_file_path);
      } catch (uploadError) {
        console.error('❌ Failed to upload file to B2:', uploadError);
        throw new AppError('Failed to upload file to storage. Please try again.', 500);
      }

      // Get the next revision number
      const lastRevision = await DocRevision.findOne({
        where: { projdoc_id: revisionData.projdoc_id },
        order: [['revision', 'DESC']],
        transaction
      });

      const nextRevision = lastRevision ? lastRevision.revision + 1 : 1;

      // Set status based on expected date if period exists
      if (revisionData.period_id) {
        const period = await EmissionPeriod.findByPk(revisionData.period_id, { transaction });
        if (period && period.expected_at) {
          const today = new Date().toISOString().split('T')[0];
          revisionData.status = period.expected_at < today ? 'late' : 'received';
        } else {
          revisionData.status = 'received';
        }
      } else {
        revisionData.status = 'received';
      }

      // Create revision with auto-incremented revision number
      const revision = await DocRevision.create({
        ...revisionData,
        revision: nextRevision,
        uploaded_at: new Date()
      }, { transaction });

      // Update the previous revision's superseded_by if this is a new version
      if (lastRevision) {
        await lastRevision.update({
          superseded_by: revision.id
        }, { transaction });
      }

      await transaction.commit();

      // Update period status to 'received' if period_id exists (outside transaction)
      if (revisionData.period_id && revisionData.status === 'received') {
        await EmissionPeriod.update(
          { 
            status: 'received',
            received_at: revision.uploaded_at
          },
          { where: { id: revisionData.period_id } }
        );
      }

      return await this.getRevisionById(revision.id);
    } catch (error) {
      await transaction.rollback();
      
      // If file was uploaded but DB transaction failed, try to clean up
      if (revisionData.source_file_path) {
        try {
          await FileStorageService.deleteFile(revisionData.source_file_path);
          console.log('🧹 Cleaned up orphaned file:', revisionData.source_file_path);
        } catch (cleanupError) {
          console.error('❌ Failed to clean up orphaned file:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  // Update revision
  async updateRevision(id, updateData) {
    const revision = await DocRevision.findByPk(id);
    if (!revision) {
      return null;
    }

    // Validate self-reference
    if (updateData.superseded_by === id) {
      throw new AppError('A revision cannot supersede itself', 400);
    }

    // Check if superseding revision exists
    if (updateData.superseded_by) {
      const superseding = await DocRevision.findByPk(updateData.superseded_by);
      if (!superseding) {
        throw new AppError('Superseding revision not found', 404);
      }

      // Verify both revisions belong to the same document
      if (superseding.projdoc_id !== revision.projdoc_id) {
        throw new AppError('Superseding revision must belong to the same document', 400);
      }

      // Verify superseding revision has higher revision number
      if (superseding.revision <= revision.revision) {
        throw new AppError('Superseding revision must have a higher revision number', 400);
      }
    }

    const updatableFields = ['revision_code', 'revision_notes', 'superseded_by', 'status'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await revision.update(dataToUpdate);
    return await this.getRevisionById(id, { includeSuperseded: true });
  }

  // Delete revision
  async deleteRevision(id) {
    const revision = await DocRevision.findByPk(id);
    if (!revision) {
      return null;
    }

    // Check if this revision is superseded by another
    if (revision.superseded_by) {
      throw new AppError('Cannot delete a revision that has been superseded', 400);
    }

    // Check if this revision supersedes others
    const supersededCount = await DocRevision.count({
      where: { superseded_by: id }
    });

    if (supersededCount > 0) {
      throw new AppError('Cannot delete a revision that supersedes other revisions', 400);
    }

    // Delete file from B2 if it exists
    if (revision.source_file_path) {
      try {
        console.log('🗑️ Deleting file from B2:', revision.source_file_path);
        await FileStorageService.deleteFile(revision.source_file_path);
        console.log('✅ File deleted from B2');
      } catch (error) {
        console.error('❌ Failed to delete file from B2:', error);
        // Continue with deletion even if file removal fails
      }
    }

    await revision.destroy();
    return true;
  }

  // Get revision history for document
  async getRevisionHistory(projdocId) {
    const revisions = await DocRevision.findAll({
      where: { projdoc_id: projdocId },
      order: [['revision', 'ASC']],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name', 'email']
        },
        {
          model: EmissionPeriod,
          as: 'period',
          required: false,
          attributes: ['id', 'period_label', 'period_start', 'period_end']
        },
        {
          model: DocRevision,
          as: 'superseding_revision',
          attributes: ['id', 'revision', 'revision_code']
        }
      ]
    });

    // Build history tree
    const history = [];
    let current = revisions.find(r => !r.superseded_by);
    
    while (current) {
      history.push(current);
      current = revisions.find(r => r.superseded_by && r.superseded_by === current.id);
    }

    return {
      linear: revisions,
      chain: history
    };
  }

  // Get revision statistics
  async getRevisionStatistics(filters = {}) {
    const { period_id, projdoc_id, from_date, to_date } = filters;

    const whereClause = {};
    if (period_id) whereClause.period_id = period_id;
    if (projdoc_id) whereClause.projdoc_id = projdoc_id;
    if (from_date || to_date) {
      whereClause.uploaded_at = {};
      if (from_date) whereClause.uploaded_at[Op.gte] = new Date(from_date);
      if (to_date) whereClause.uploaded_at[Op.lte] = new Date(to_date);
    }

    // Total count
    const total = await DocRevision.count({ where: whereClause });

    // Count by status
    const byStatus = await DocRevision.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    // Uploads by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const byMonth = await DocRevision.findAll({
      where: {
        ...whereClause,
        uploaded_at: { [Op.gte]: twelveMonthsAgo }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('uploaded_at'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('uploaded_at'), '%Y-%m')],
      order: [[sequelize.literal('month'), 'DESC']]
    });

    // Top uploaders
    const topUploaders = await DocRevision.findAll({
      where: whereClause,
      attributes: [
        'uploaded_by',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['name', 'family_name']
      }],
      group: ['uploaded_by'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });

    return {
      total,
      by_status: Object.fromEntries(
        byStatus.map(s => [s.status, parseInt(s.dataValues.count)])
      ),
      monthly: byMonth.map(m => ({
        month: m.dataValues.month,
        count: parseInt(m.dataValues.count)
      })),
      top_uploaders: topUploaders.map(u => ({
        user_id: u.uploaded_by,
        name: u.uploader ? `${u.uploader.name} ${u.uploader.family_name || ''}`.trim() : 'Unknown',
        count: parseInt(u.dataValues.count)
      }))
    };
  }

  // Get revision count by document
  async getRevisionCount(projdocId) {
    return await DocRevision.count({
      where: { projdoc_id: projdocId }
    });
  }

  // Get latest revision for multiple documents
  async getLatestRevisions(projdocIds) {
    const revisions = await DocRevision.findAll({
      where: { projdoc_id: { [Op.in]: projdocIds } },
      order: [['revision', 'DESC']]
    });

    // Group by projdoc_id and take first (latest) for each
    const latestMap = new Map();
    revisions.forEach(rev => {
      if (!latestMap.has(rev.projdoc_id)) {
        latestMap.set(rev.projdoc_id, rev);
      }
    });

    return Array.from(latestMap.values());
  }

  // Download file
  async downloadFile(filePath) {
    try {
      console.log('📥 Downloading file from B2:', filePath);
      const fileData = await FileStorageService.downloadFile(filePath);
      return fileData;
    } catch (error) {
      console.error('❌ Failed to download file from B2:', error);
      throw new AppError('File not found or inaccessible', 404);
    }
  }
}

export default new DocRevisionService();