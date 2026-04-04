import { DocType, DocSubcategory, DocCategory, sequelize } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import path from 'path';

class DocTypeService {
  // Helper method to build where clause
  _buildWhereClause(filters = {}) {
    const {
      subcategory_id,
      is_periodic,
      entity_type,
      search,
      only_one_per_project,
      created_after,
      created_before
    } = filters;

    const whereClause = {};
    
    if (subcategory_id) whereClause.subcategory_id = subcategory_id;
    if (is_periodic !== undefined) whereClause.is_periodic = is_periodic === 'true';
    if (entity_type) whereClause.entity_type = entity_type;
    if (only_one_per_project !== undefined) whereClause.only_one_per_project = only_one_per_project === 'true';
    
    // Date range filtering
    if (created_after || created_before) {
      whereClause.created_at = {};
      if (created_after) whereClause.created_at[Op.gte] = new Date(created_after);
      if (created_before) whereClause.created_at[Op.lte] = new Date(created_before);
    }
    
    if (search) {
      whereClause[Op.or] = [
        { label: { [Op.iLike]: `%${search}%` } },
        { entity_type: { [Op.iLike]: `%${search}%` } },
        { native_format: { [Op.iLike]: `%${search}%` } }
      ];
    }

    return whereClause;
  }

  // Helper method to build include options
  _buildIncludeOptions(includeSubcategory = true, includeCategory = true) {
    const include = [];
    
    if (includeSubcategory) {
      const subcategoryInclude = {
        model: DocSubcategory,
        as: 'subcategory',
        attributes: ['id', 'label', 'description']
      };
      
      if (includeCategory) {
        subcategoryInclude.include = [{
          model: DocCategory,
          as: 'category',
          attributes: ['id', 'label', 'description']
        }];
      }
      
      include.push(subcategoryInclude);
    }
    
    return include;
  }

  // Helper method to handle pagination
  _getPaginationOptions(page = 1, limit = 10, sort = 'label', order = 'ASC') {
    return {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order.toUpperCase()]]
    };
  }

  // Helper method to format pagination response
  _formatPaginationResponse(count, page, limit) {
    return {
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      limit: parseInt(limit)
    };
  }

  // Get all document types with optional filtering and pagination
  async getAllDocTypes(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC',
      ...otherFilters
    } = filters;

    const whereClause = this._buildWhereClause(otherFilters);
    const pagination = this._getPaginationOptions(page, limit, sort, order);
    const include = this._buildIncludeOptions(true, true);

    const result = await DocType.findAndCountAll({
      where: whereClause,
      include,
      ...pagination,
      distinct: true
    });

    return {
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Get document type by ID
  async getDocTypeById(id, includeDetails = true) {
    return await DocType.findByPk(id, {
      include: includeDetails ? this._buildIncludeOptions(true, true) : []
    });
  }

  // Get document types by subcategory ID
  async getDocTypesBySubcategory(subcategoryId, filters = {}) {
    const {
      is_periodic,
      entity_type,
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    // Check if subcategory exists with category details
    const subcategory = await DocSubcategory.findByPk(subcategoryId, {
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label', 'description']
      }]
    });
    
    if (!subcategory) {
      throw new AppError('Subcategory not found', 404);
    }

    const whereClause = { subcategory_id: subcategoryId };
    if (is_periodic !== undefined) whereClause.is_periodic = is_periodic === 'true';
    if (entity_type) whereClause.entity_type = entity_type;

    const pagination = this._getPaginationOptions(page, limit, sort, order);

    const result = await DocType.findAndCountAll({
      where: whereClause,
      ...pagination,
      distinct: true
    });

    return {
      subcategory: {
        id: subcategory.id,
        label: subcategory.label,
        description: subcategory.description,
        category: subcategory.category
      },
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Get periodic document types
  async getPeriodicDocTypes(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = { is_periodic: true };
    const pagination = this._getPaginationOptions(page, limit, sort, order);
    const include = this._buildIncludeOptions(true, true);

    const result = await DocType.findAndCountAll({
      where: whereClause,
      include,
      ...pagination,
      distinct: true
    });

    return {
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Get document types by entity type
  async getDocTypesByEntityType(entityType, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = { entity_type: entityType.toLowerCase() };
    const pagination = this._getPaginationOptions(page, limit, sort, order);
    const include = this._buildIncludeOptions(true, true);

    const result = await DocType.findAndCountAll({
      where: whereClause,
      include,
      ...pagination,
      distinct: true
    });

    return {
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Get document types with full details (including subcategory and category)
  async getDocTypesWithDetails(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const pagination = this._getPaginationOptions(page, limit, sort, order);
    const include = [{
      model: DocSubcategory,
      as: 'subcategory',
      required: true,
      attributes: ['id', 'label', 'description'],
      include: [{
        model: DocCategory,
        as: 'category',
        required: true,
        attributes: ['id', 'label', 'description']
      }]
    }];

    const result = await DocType.findAndCountAll({
      include,
      ...pagination,
      distinct: true
    });

    return {
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Check if document type label is available within its subcategory
  async checkDocTypeLabelAvailability(subcategoryId, label, excludeId = null) {
    if (!label || label.length < 1 || label.length > 250) {
      return {
        available: false,
        message: 'Label must be between 1 and 250 characters'
      };
    }

    const whereClause = {
      subcategory_id: subcategoryId,
      label: label.trim()
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingDocType = await DocType.findOne({
      where: whereClause
    });

    return {
      available: !existingDocType,
      message: existingDocType ? 'Document type label already exists in this subcategory' : 'Label is available'
    };
  }

  // Validate file format against allowed formats
  async validateFileFormat(docTypeId, filename) {
    const docType = await DocType.findByPk(docTypeId, {
      attributes: ['id', 'label', 'native_format']
    });
    
    if (!docType) {
      throw new AppError('Document type not found', 404);
    }

    const allowedFormats = docType.native_format.split(',').map(f => f.trim().toLowerCase());
    const uploadedExt = path.extname(filename).toLowerCase().replace('.', '');
    
    const isValid = allowedFormats.includes(uploadedExt);
    
    return {
      isValid,
      docType: {
        id: docType.id,
        label: docType.label
      },
      allowedFormats: allowedFormats.map(f => `.${f}`),
      uploadedFormat: `.${uploadedExt}`,
      message: isValid ? 'Format valid' : `Format non autorisé. Formats acceptés : ${allowedFormats.map(f => `.${f}`).join(', ')}`
    };
  }

  // Create new document type
  async createDocType(docTypeData) {
    const mappedData = {
      subcategory_id: docTypeData.subcategory_id,
      label: docTypeData.label.trim(),
      is_periodic: docTypeData.is_periodic !== undefined ? docTypeData.is_periodic : false,
      only_one_per_project: docTypeData.only_one_per_project !== undefined ? docTypeData.only_one_per_project : false,
      entity_type: docTypeData.entity_type.toLowerCase().trim(),
      native_format: docTypeData.native_format.split(',').map(f => f.trim().toLowerCase().replace(/^\./, '')).join(',')
    };

    // Check if subcategory exists
    const subcategory = await DocSubcategory.findByPk(mappedData.subcategory_id);
    if (!subcategory) {
      throw new AppError('Subcategory not found', 404);
    }

    // Check if label already exists in this subcategory
    const existingDocType = await DocType.findOne({
      where: {
        subcategory_id: mappedData.subcategory_id,
        label: mappedData.label
      }
    });
    
    if (existingDocType) {
      throw new AppError('Document type label already exists in this subcategory', 400);
    }

    return await DocType.create(mappedData);
  }

  // Bulk create document types
  async bulkCreateDocTypes(docTypesData) {
    const transaction = await sequelize.transaction();
    
    try {
      const createdDocTypes = [];
      const errors = [];

      for (const data of docTypesData) {
        try {
          const mappedData = {
            subcategory_id: data.subcategory_id,
            label: data.label.trim(),
            is_periodic: data.is_periodic || false,
            only_one_per_project: data.only_one_per_project || false,
            entity_type: data.entity_type.toLowerCase().trim(),
            native_format: data.native_format.split(',').map(f => f.trim().toLowerCase().replace(/^\./, '')).join(',')
          };

          // Check subcategory exists
          const subcategory = await DocSubcategory.findByPk(mappedData.subcategory_id, { transaction });
          if (!subcategory) {
            errors.push({ data, error: `Subcategory not found: ${mappedData.subcategory_id}` });
            continue;
          }

          // Check uniqueness
          const existing = await DocType.findOne({
            where: {
              subcategory_id: mappedData.subcategory_id,
              label: mappedData.label
            },
            transaction
          });

          if (existing) {
            errors.push({ data, error: `Duplicate label in subcategory: ${mappedData.label}` });
            continue;
          }

          const docType = await DocType.create(mappedData, { transaction });
          createdDocTypes.push(docType);
        } catch (error) {
          errors.push({ data, error: error.message });
        }
      }

      await transaction.commit();
      
      return {
        created: createdDocTypes,
        errors,
        successCount: createdDocTypes.length,
        errorCount: errors.length
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Update document type
  async updateDocType(id, updateData) {
    const docTypeRecord = await DocType.findByPk(id);
    if (!docTypeRecord) {
      return null;
    }

    const mappedData = {};
    
    if (updateData.subcategory_id !== undefined) {
      mappedData.subcategory_id = updateData.subcategory_id;
    }
    if (updateData.label !== undefined) {
      mappedData.label = updateData.label.trim();
    }
    if (updateData.is_periodic !== undefined) {
      mappedData.is_periodic = updateData.is_periodic;
    }
    if (updateData.only_one_per_project !== undefined) {
      mappedData.only_one_per_project = updateData.only_one_per_project;
    }
    if (updateData.entity_type !== undefined) {
      mappedData.entity_type = updateData.entity_type.toLowerCase().trim();
    }
    if (updateData.native_format !== undefined) {
      mappedData.native_format = updateData.native_format.split(',').map(f => f.trim().toLowerCase().replace(/^\./, '')).join(',');
    }

    // If subcategory is being changed, check if new subcategory exists
    if (mappedData.subcategory_id && mappedData.subcategory_id !== docTypeRecord.subcategory_id) {
      const subcategory = await DocSubcategory.findByPk(mappedData.subcategory_id);
      if (!subcategory) {
        throw new AppError('Subcategory not found', 404);
      }
    }

    // If label is being updated, check uniqueness within its subcategory
    const subcategoryId = mappedData.subcategory_id || docTypeRecord.subcategory_id;
    if (mappedData.label && 
        (mappedData.label !== docTypeRecord.label || 
         (mappedData.subcategory_id && mappedData.subcategory_id !== docTypeRecord.subcategory_id))) {
      const existingDocType = await DocType.findOne({
        where: {
          subcategory_id: subcategoryId,
          label: mappedData.label,
          id: { [Op.ne]: id }
        }
      });

      if (existingDocType) {
        throw new AppError('Document type label already exists in this subcategory', 400);
      }
    }

    await docTypeRecord.update(mappedData);

    return await this.getDocTypeById(id);
  }

  // Delete document type
  async deleteDocType(id) {
    const docTypeRecord = await DocType.findByPk(id);
    if (!docTypeRecord) {
      return null;
    }

    await docTypeRecord.destroy();
    return { id, deleted: true };
  }

  // Bulk delete document types
  async bulkDeleteDocTypes(ids) {
    const transaction = await sequelize.transaction();
    
    try {
      const result = await DocType.destroy({
        where: {
          id: { [Op.in]: ids }
        },
        transaction
      });

      await transaction.commit();
      return { deleted: result };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Search document types
  async searchDocTypes(searchTerm, filters = {}) {
    const {
      subcategory_id,
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = {
      [Op.or]: [
        { label: { [Op.iLike]: `%${searchTerm}%` } },
        { entity_type: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    };

    if (subcategory_id) {
      whereClause.subcategory_id = subcategory_id;
    }

    const pagination = this._getPaginationOptions(page, limit, sort, order);
    const include = this._buildIncludeOptions(true, true);

    const result = await DocType.findAndCountAll({
      where: whereClause,
      include,
      ...pagination,
      distinct: true
    });

    return {
      docTypes: result.rows,
      pagination: this._formatPaginationResponse(result.count, page, limit)
    };
  }

  // Get document type statistics
  async getDocTypeStats() {
    const stats = await DocType.findAll({
      attributes: [
        'entity_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_periodic THEN 1 ELSE 0 END')), 'periodic_count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN only_one_per_project THEN 1 ELSE 0 END')), 'unique_per_project_count']
      ],
      group: ['entity_type'],
      raw: true
    });

    const total = await DocType.count();

    return {
      total,
      byEntityType: stats,
      periodic: await DocType.count({ where: { is_periodic: true } }),
      uniquePerProject: await DocType.count({ where: { only_one_per_project: true } })
    };
  }
}

export default new DocTypeService();