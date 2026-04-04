import { BusinessUnit } from '../models/index.js';
import AppError from '../utils/appError.js';

class BusinessUnitService {
  // Get all business units with optional filtering and pagination
  async getAllBusinessUnits(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};

    // Add is_active filter if provided
    if (filters.is_active !== undefined) {
      whereClause.is_active = filters.is_active === 'true' || filters.is_active === true;
    }

    // Add search by name if provided
    if (filters.search) {
      whereClause.name = {
        [BusinessUnit.sequelize.Op.like]: `%${filters.search}%`
      };
    }

    const offset = (page - 1) * limit;

    const result = await BusinessUnit.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    return {
      business_units: result.rows,
      total: result.count,
      page: parseInt(page),
      totalPages: Math.ceil(result.count / limit)
    };
  }

  // Get business unit by ID
  async getBusinessUnitById(id) {
    return await BusinessUnit.findOne({
      where: { id }
    });
  }

  // Check business unit name availability (global uniqueness)
  async checkBusinessUnitNameAvailability(name) {
    if (!name) {
      return true;
    }

    // Check if business unit name already exists (global uniqueness)
    const existingBusinessUnit = await BusinessUnit.findOne({
      where: {
        name: name.trim()
      }
    });

    // Return true if name is available (no existing record found)
    return !existingBusinessUnit;
  }

  // Create new business unit
  async createBusinessUnit(businessUnitData) {
    // Check if business unit name is globally unique
    const existingBusinessUnit = await BusinessUnit.findOne({
      where: {
        name: businessUnitData.name
      }
    });

    if (existingBusinessUnit) {
      throw new AppError('Business unit name must be unique', 400);
    }

    // Ensure is_active is set (defaults to true in model)
    const dataToCreate = {
      name: businessUnitData.name,
      description: businessUnitData.description || null,
      is_active: businessUnitData.is_active !== undefined ? businessUnitData.is_active : true
    };

    return await BusinessUnit.create(dataToCreate);
  }

  // Update business unit
  async updateBusinessUnit(id, businessUnitData) {
    const businessUnitRecord = await BusinessUnit.findByPk(id);
    if (!businessUnitRecord) {
      return null;
    }

    // If name is being updated, check global uniqueness
    if (businessUnitData.name && businessUnitData.name !== businessUnitRecord.name) {
      const existingBusinessUnit = await BusinessUnit.findOne({
        where: {
          name: businessUnitData.name,
          id: { [BusinessUnit.sequelize.Op.ne]: id }
        }
      });

      if (existingBusinessUnit) {
        throw new AppError('Business unit name must be unique', 400);
      }
    }

    // Prepare update data (only include fields that exist in model)
    const updateData = {};
    if (businessUnitData.name !== undefined) updateData.name = businessUnitData.name;
    if (businessUnitData.description !== undefined) updateData.description = businessUnitData.description || null;
    if (businessUnitData.is_active !== undefined) updateData.is_active = businessUnitData.is_active;

    await businessUnitRecord.update(updateData);
    return businessUnitRecord;
  }

  // Delete business unit
  async deleteBusinessUnit(id) {
    const businessUnitRecord = await BusinessUnit.findByPk(id);
    if (!businessUnitRecord) {
      return null;
    }

    await businessUnitRecord.destroy();
    return true;
  }

  // Get business units by client ID - DEPRECATED
  // This method is kept for backward compatibility but will return empty array
  async getBusinessUnitsByClientId(clientId) {
    console.warn(`getBusinessUnitsByClientId called with clientId: ${clientId} - This method is deprecated as BusinessUnit model no longer has client_id association`);
    
    // Return empty array with a warning
    return [];
  }

  // Get active business units
  async getActiveBusinessUnits() {
    return await BusinessUnit.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
  }

  // Get business unit by name
  async getBusinessUnitByName(name) {
    return await BusinessUnit.findOne({
      where: { name: name.trim() }
    });
  }

  // Search business units by name
  async searchBusinessUnits(searchTerm) {
    return await BusinessUnit.findAll({
      where: {
        name: {
          [BusinessUnit.sequelize.Op.like]: `%${searchTerm}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  // Get business units with status
  async getAllWithStatus() {
    const businessUnits = await BusinessUnit.findAll({
      order: [['name', 'ASC']]
    });
    
    return businessUnits.map(bu => ({
      ...bu.toJSON(),
      status: bu.getStatus()
    }));
  }

  // Get active count
  async getActiveCount() {
    return await BusinessUnit.count({
      where: { is_active: true }
    });
  }
}

export default new BusinessUnitService();