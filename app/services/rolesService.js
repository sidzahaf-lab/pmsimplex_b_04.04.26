// app/services/rolesService.js
import { Role, Team } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class RoleService {
  // Get all roles with optional filtering and pagination
  async getAllRoles(filters = {}) {
    const {
      scope,
      name,
      page = 1,
      limit = 100, // Changed from 10 to 100 to get all roles by default
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (scope) whereClause.scope = scope;
    if (name) whereClause.name = { [Op.like]: `%${name}%` }; // Changed from iLike to like for MySQL compatibility

    const offset = (page - 1) * limit;

    const result = await Role.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      roles: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Check role name availability
  async checkRoleNameAvailability(name) {
    if (!name || name.length < 1 || name.length > 50) {
      return false;
    }

    const existingRole = await Role.findOne({
      where: {
        name: name.trim()
      }
    });

    return !existingRole;
  }

  // Get role by ID
  async getRoleById(id) {
    return await Role.findByPk(id, {
      include: [{
        model: Team,
        as: 'team_assignments',
        attributes: ['id', 'user_id', 'business_unit_id', 'project_id', 'is_active']
      }]
    });
  }

  // Get role by name
  async getRoleByName(name) {
    return await Role.findOne({
      where: { name: name.trim() }
    });
  }

  // Get roles by scope
  async getRolesByScope(scope, filters = {}) {
    const {
      page = 1,
      limit = 100, // Increased limit
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await Role.findAndCountAll({
      where: { scope },
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      roles: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Create new role
  async createRole(roleData) {
    // Validate scope - NOW ACCEPTS ALL SCOPES
    const validScopes = ['bu', 'project', 'corporate', 'guest'];
    if (!validScopes.includes(roleData.scope)) {
      throw new AppError('Scope must be "bu", "project", "corporate", or "guest"', 400);
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({
      where: { name: roleData.name.trim() }
    });
    
    if (existingRole) {
      throw new AppError('Role name already exists', 400);
    }

    // Create role with mapped data
    const mappedData = {
      name: roleData.name.trim(),
      scope: roleData.scope
    };

    return await Role.create(mappedData);
  }

  // Update role
  async updateRole(id, updateData) {
    const roleRecord = await Role.findByPk(id);
    if (!roleRecord) {
      return null;
    }

    const mappedData = {};
    
    if (updateData.name !== undefined) mappedData.name = updateData.name.trim();
    if (updateData.scope !== undefined) {
      const validScopes = ['bu', 'project', 'corporate', 'guest'];
      if (!validScopes.includes(updateData.scope)) {
        throw new AppError('Scope must be "bu", "project", "corporate", or "guest"', 400);
      }
      mappedData.scope = updateData.scope;
    }

    // If name is being updated, check uniqueness
    if (mappedData.name && mappedData.name !== roleRecord.name) {
      const existingRole = await Role.findOne({
        where: {
          name: mappedData.name,
          id: { [Op.ne]: id }
        }
      });

      if (existingRole) {
        throw new AppError('Role name already exists', 400);
      }
    }

    // Get list of updatable fields
    const updatableFields = Object.keys(mappedData).filter(field => 
      ['name', 'scope'].includes(field)
    );

    if (updatableFields.length === 0) {
      return await this.getRoleById(id);
    }

    await roleRecord.update(mappedData, {
      fields: updatableFields
    });

    return await this.getRoleById(id);
  }

  // Delete role
  async deleteRole(id) {
    const roleRecord = await Role.findByPk(id);
    if (!roleRecord) {
      return null;
    }

    // Check if role has active team assignments
    const activeAssignments = await Team.findOne({
      where: {
        role_id: id,
        is_active: true
      }
    });

    if (activeAssignments) {
      throw new AppError('Cannot delete role with active team assignments. Deactivate or remove assignments first.', 400);
    }

    await roleRecord.destroy();
    return true;
  }

  // Get role statistics
  async getRoleStatistics(id) {
    const roleRecord = await Role.findByPk(id);
    if (!roleRecord) {
      return null;
    }

    const totalAssignments = await Team.count({
      where: { role_id: id }
    });

    const activeAssignments = await Team.count({
      where: { 
        role_id: id,
        is_active: true
      }
    });

    const buAssignments = await Team.count({
      where: { 
        role_id: id,
        business_unit_id: { [Op.ne]: null },
        project_id: null
      }
    });

    const projectAssignments = await Team.count({
      where: { 
        role_id: id,
        project_id: { [Op.ne]: null }
      }
    });

    return {
      role: roleRecord,
      statistics: {
        total_assignments: totalAssignments,
        active_assignments: activeAssignments,
        bu_assignments: buAssignments,
        project_assignments: projectAssignments
      }
    };
  }

  // Bulk create roles
  async bulkCreateRoles(rolesData) {
    const createdRoles = [];
    const errors = [];

    for (const roleData of rolesData) {
      try {
        // Check if role already exists
        const existingRole = await Role.findOne({
          where: { name: roleData.name.trim() }
        });

        if (existingRole) {
          errors.push({
            name: roleData.name,
            error: 'Role name already exists'
          });
          continue;
        }

        // Validate scope
        const validScopes = ['bu', 'project', 'corporate', 'guest'];
        if (!validScopes.includes(roleData.scope)) {
          errors.push({
            name: roleData.name,
            error: 'Scope must be "bu", "project", "corporate", or "guest"'
          });
          continue;
        }

        const role = await Role.create({
          name: roleData.name.trim(),
          scope: roleData.scope
        });

        createdRoles.push(role);
      } catch (error) {
        errors.push({
          name: roleData.name,
          error: error.message
        });
      }
    }

    return {
      created: createdRoles,
      errors: errors,
      total_processed: rolesData.length,
      total_created: createdRoles.length,
      total_errors: errors.length
    };
  }

  // Validate role scope
  async validateRoleScope(roleId, expectedScope) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    const validScopes = ['bu', 'project', 'corporate', 'guest'];
    if (expectedScope && !validScopes.includes(expectedScope)) {
      throw new AppError(`Expected scope must be one of: ${validScopes.join(', ')}`, 400);
    }

    if (expectedScope && role.scope !== expectedScope) {
      throw new AppError(`Role scope must be "${expectedScope}" for this operation. Current scope is "${role.scope}".`, 400);
    }

    return role;
  }

  // Check if role has assignments
  async hasAssignments(roleId) {
    const count = await Team.count({
      where: { role_id: roleId }
    });

    return count > 0;
  }

  // Search roles by name
  async searchRoles(searchTerm, filters = {}) {
    const {
      scope,
      page = 1,
      limit = 100 // Increased limit
    } = filters;

    const whereClause = {
      name: { [Op.like]: `%${searchTerm}%` } // Changed from iLike to like
    };

    if (scope) {
      whereClause.scope = scope;
    }

    const offset = (page - 1) * limit;

    const result = await Role.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      roles: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get all roles grouped by scope (useful for dropdowns)
  async getRolesGroupedByScope() {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'scope'],
      order: [['scope', 'ASC'], ['name', 'ASC']]
    });

    const grouped = {
      corporate: roles.filter(r => r.scope === 'corporate'),
      bu: roles.filter(r => r.scope === 'bu'),
      project: roles.filter(r => r.scope === 'project'),
      guest: roles.filter(r => r.scope === 'guest')
    };

    return grouped;
  }
}

export default new RoleService();