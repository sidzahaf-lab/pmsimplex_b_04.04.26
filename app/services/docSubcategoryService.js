import { DocSubcategory, DocCategory, DocType } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class DocSubcategoryService {
  // Get all subcategories with optional filtering and pagination
  async getAllSubcategories(filters = {}) {
    const {
      category_id,
      search,
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = {};
    if (category_id) whereClause.category_id = category_id;
    
    if (search) {
      whereClause[Op.or] = [
        { label: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const result = await DocSubcategory.findAndCountAll({
      where: whereClause,
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label', 'description']
      }],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      subcategories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get subcategory by ID
  async getSubcategoryById(id) {
    return await DocSubcategory.findByPk(id, {
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label', 'description']
      }]
    });
  }

  // Get subcategory with its document types
  async getSubcategoryWithDocTypes(id) {
    return await DocSubcategory.findByPk(id, {
      include: [
        {
          model: DocCategory,
          as: 'category',
          attributes: ['id', 'label', 'description']
        },
        {
          model: DocType,
          as: 'doc_types',
          attributes: ['id', 'label', 'is_periodic', 'entity_type', 'native_format', 'created_at']
        }
      ]
    });
  }

  // Get subcategories by category ID
  async getSubcategoriesByCategory(categoryId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    // Check if category exists
    const category = await DocCategory.findByPk(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const offset = (page - 1) * limit;

    const result = await DocSubcategory.findAndCountAll({
      where: { category_id: categoryId },
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label', 'description']
      }],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      category: {
        id: category.id,
        label: category.label
      },
      subcategories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get subcategories with statistics (doc type counts)
  async getSubcategoriesWithStats(filters = {}) {
    const {
      category_id,
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = {};
    if (category_id) whereClause.category_id = category_id;

    const offset = (page - 1) * limit;

    const result = await DocSubcategory.findAndCountAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM doc_types
              WHERE doc_types.subcategory_id = DocSubcategory.id
            )`),
            'doc_type_count'
          ]
        ]
      },
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label']
      }],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      subcategories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Check if subcategory label is available within its category
  async checkSubcategoryLabelAvailability(categoryId, label, excludeId = null) {
    if (!label || label.length < 1 || label.length > 250) {
      return false;
    }

    const whereClause = {
      category_id: categoryId,
      label: label.trim()
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingSubcategory = await DocSubcategory.findOne({
      where: whereClause
    });

    return !existingSubcategory;
  }

  // Create new subcategory
  async createSubcategory(subcategoryData) {
    const mappedData = {
      category_id: subcategoryData.category_id,
      label: subcategoryData.label.trim(),
      description: subcategoryData.description || null
    };

    // Check if category exists
    const category = await DocCategory.findByPk(mappedData.category_id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if label already exists in this category
    const existingSubcategory = await DocSubcategory.findOne({
      where: {
        category_id: mappedData.category_id,
        label: mappedData.label
      }
    });
    
    if (existingSubcategory) {
      throw new AppError('Subcategory label already exists in this category', 400);
    }

    return await DocSubcategory.create(mappedData);
  }

  // Update subcategory
  async updateSubcategory(id, updateData) {
    const subcategoryRecord = await DocSubcategory.findByPk(id);
    if (!subcategoryRecord) {
      return null;
    }

    const mappedData = {};
    
    if (updateData.category_id !== undefined) {
      mappedData.category_id = updateData.category_id;
    }
    if (updateData.label !== undefined) {
      mappedData.label = updateData.label.trim();
    }
    if (updateData.description !== undefined) {
      mappedData.description = updateData.description || null;
    }

    // If category is being changed, check if new category exists
    if (mappedData.category_id && mappedData.category_id !== subcategoryRecord.category_id) {
      const category = await DocCategory.findByPk(mappedData.category_id);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    // If label is being updated, check uniqueness within its category
    const categoryId = mappedData.category_id || subcategoryRecord.category_id;
    if (mappedData.label && 
        (mappedData.label !== subcategoryRecord.label || 
         (mappedData.category_id && mappedData.category_id !== subcategoryRecord.category_id))) {
      const existingSubcategory = await DocSubcategory.findOne({
        where: {
          category_id: categoryId,
          label: mappedData.label,
          id: { [Op.ne]: id }
        }
      });

      if (existingSubcategory) {
        throw new AppError('Subcategory label already exists in this category', 400);
      }
    }

    const updatableFields = Object.keys(mappedData).filter(field => 
      ['category_id', 'label', 'description'].includes(field)
    );

    await subcategoryRecord.update(mappedData, {
      fields: updatableFields
    });

    return await this.getSubcategoryById(id);
  }

  // Delete subcategory
  async deleteSubcategory(id) {
    const subcategoryRecord = await DocSubcategory.findByPk(id);
    if (!subcategoryRecord) {
      return null;
    }

    // Check if subcategory has any document types
    const docTypeCount = await DocType.count({
      where: { subcategory_id: id }
    });

    if (docTypeCount > 0) {
      throw new AppError('Cannot delete subcategory that has document types. Please delete or move document types first.', 400);
    }

    await subcategoryRecord.destroy();
    return true;
  }

  // Search subcategories
  async searchSubcategories(searchTerm, filters = {}) {
    const {
      category_id,
      page = 1,
      limit = 10
    } = filters;

    const whereClause = {
      [Op.or]: [
        { label: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    };

    if (category_id) {
      whereClause.category_id = category_id;
    }

    const offset = (page - 1) * limit;

    const result = await DocSubcategory.findAndCountAll({
      where: whereClause,
      include: [{
        model: DocCategory,
        as: 'category',
        attributes: ['id', 'label']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      subcategories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }
}

export default new DocSubcategoryService();