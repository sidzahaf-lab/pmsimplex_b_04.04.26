import { DocCategory, DocSubcategory, DocType } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class DocCategoryService {
  // Get all categories with optional filtering and pagination
  async getAllCategories(filters = {}) {
    const {
      search,
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { label: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const result = await DocCategory.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      categories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get category by ID
  async getCategoryById(id) {
    return await DocCategory.findByPk(id);
  }

  // Get category with its subcategories
  async getCategoryWithSubcategories(id) {
    return await DocCategory.findByPk(id, {
      include: [{
        model: DocSubcategory,
        as: 'subcategories',
        attributes: ['id', 'label', 'description', 'created_at'],
        include: [{
          model: DocType,
          as: 'doc_types',
          attributes: ['id', 'label', 'is_periodic', 'entity_type', 'native_format'],
          required: false
        }]
      }]
    });
  }

  // Get categories with statistics (subcategory and doc type counts)
  async getCategoriesWithStats(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'label',
      order = 'ASC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await DocCategory.findAndCountAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM doc_subcategories
              WHERE doc_subcategories.category_id = DocCategory.id
            )`),
            'subcategory_count'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM doc_types dt
              INNER JOIN doc_subcategories ds ON ds.id = dt.subcategory_id
              WHERE ds.category_id = DocCategory.id
            )`),
            'doc_type_count'
          ]
        ]
      },
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      categories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Check if category label is available
  async checkCategoryLabelAvailability(label, excludeId = null) {
    if (!label || label.length < 1 || label.length > 250) {
      return false;
    }

    const whereClause = {
      label: label.trim()
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingCategory = await DocCategory.findOne({
      where: whereClause
    });

    return !existingCategory;
  }

  // Create new category
  async createCategory(categoryData) {
    const mappedData = {
      label: categoryData.label.trim(),
      description: categoryData.description || null
    };

    // Check if label already exists
    const existingCategory = await DocCategory.findOne({
      where: { label: mappedData.label }
    });
    
    if (existingCategory) {
      throw new AppError('Category label already exists', 400);
    }

    return await DocCategory.create(mappedData);
  }

  // Update category
  async updateCategory(id, updateData) {
    const categoryRecord = await DocCategory.findByPk(id);
    if (!categoryRecord) {
      return null;
    }

    const mappedData = {};
    
    if (updateData.label !== undefined) {
      mappedData.label = updateData.label.trim();
    }
    if (updateData.description !== undefined) {
      mappedData.description = updateData.description || null;
    }

    // If label is being updated, check uniqueness
    if (mappedData.label && mappedData.label !== categoryRecord.label) {
      const existingCategory = await DocCategory.findOne({
        where: {
          label: mappedData.label,
          id: { [Op.ne]: id }
        }
      });

      if (existingCategory) {
        throw new AppError('Category label already exists', 400);
      }
    }

    const updatableFields = Object.keys(mappedData).filter(field => 
      ['label', 'description'].includes(field)
    );

    await categoryRecord.update(mappedData, {
      fields: updatableFields
    });

    return await this.getCategoryById(id);
  }

  // Delete category
  async deleteCategory(id) {
    const categoryRecord = await DocCategory.findByPk(id);
    if (!categoryRecord) {
      return null;
    }

    // Check if category has any subcategories
    const subcategoryCount = await DocSubcategory.count({
      where: { category_id: id }
    });

    if (subcategoryCount > 0) {
      throw new AppError('Cannot delete category that has subcategories. Please delete or move subcategories first.', 400);
    }

    await categoryRecord.destroy();
    return true;
  }

  // Search categories by label or description
  async searchCategories(searchTerm, filters = {}) {
    const {
      page = 1,
      limit = 10
    } = filters;

    const whereClause = {
      [Op.or]: [
        { label: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    };

    const offset = (page - 1) * limit;

    const result = await DocCategory.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      categories: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }
}

export default new DocCategoryService();