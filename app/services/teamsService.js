// services/teamsService.js
import { Team, Role, User, BusinessUnit, Project } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op, Sequelize } from 'sequelize';

class TeamService {
  // Get all team assignments with optional filtering and pagination
  async getAllTeams(filters = {}) {
    const {
      business_unit_id,
      project_id,
      user_id,
      role_id,
      is_active,
      assigned_by,
      from_date,
      to_date,
      page = 1,
      limit = 10,
      sort = 'assigned_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    if (project_id) whereClause.project_id = project_id;
    if (user_id) whereClause.user_id = user_id;
    if (role_id) whereClause.role_id = role_id;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    if (assigned_by) whereClause.assigned_by = assigned_by;
    if (from_date) whereClause.assigned_at = { [Op.gte]: new Date(from_date) };
    if (to_date) whereClause.assigned_at = { ...whereClause.assigned_at, [Op.lte]: new Date(to_date) };

    const offset = (page - 1) * limit;

    const result = await Team.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'family_name', 'email']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'username', 'name', 'family_name']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      teams: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get team assignment by ID
  async getTeamById(id) {
    return await Team.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'family_name', 'email', 'job_title']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'description']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'username', 'name', 'family_name']
        }
      ]
    });
  }

  // Helper: Check if user has consistent roles across ALL projects
  // RULE: User can only have ONE role type across all projects
  async checkUserRoleConsistency(userId, businessUnitId, newRoleId, excludeTeamId = null) {
    // Get ALL active project roles for this user in the business unit
    const userActiveRoles = await Team.findAll({
      where: {
        user_id: userId,
        business_unit_id: businessUnitId,
        is_active: true,
        project_id: { [Op.ne]: null }, // Only project-scoped roles
        ...(excludeTeamId && { id: { [Op.ne]: excludeTeamId } })
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'scope']
      }]
    });

    if (userActiveRoles.length === 0) {
      // First project role for this user - always allowed
      return { allowed: true };
    }

    // Get the role of existing assignments (should be the same across all)
    const existingRoleId = userActiveRoles[0].role_id;
    const existingRole = userActiveRoles[0].role;
    
    // Check if new role is different from existing role
    if (existingRoleId !== newRoleId) {
      return {
        allowed: false,
        reason: `User is already working as "${existingRole.name}" on other projects. 
                 User cannot have different roles across projects. 
                 Cannot assign as a different role. User must have the same role across all projects.`
      };
    }

    // Same role - allowed (can work on multiple projects with same role)
    return {
      allowed: true,
      existingProjects: userActiveRoles.map(t => t.project_id),
      existingRoleName: existingRole.name
    };
  }

  // Create team assignment with role consistency validation
  async createTeam(teamData) {
    // Validate required fields
    if (!teamData.business_unit_id || !teamData.user_id || !teamData.role_id) {
      throw new AppError('business_unit_id, user_id, and role_id are required', 400);
    }

    // Get role to determine scope
    const role = await Role.findByPk(teamData.role_id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Validate scope consistency
    if (role.scope === 'project') {
      if (!teamData.project_id) {
        throw new AppError('Project ID is required for project-scoped roles', 400);
      }
      // Validate project exists
      const project = await Project.findByPk(teamData.project_id);
      if (!project) {
        throw new AppError('Project not found', 404);
      }
      // Ensure project belongs to business unit
      if (project.business_unit_id !== teamData.business_unit_id) {
        throw new AppError('Project must belong to the specified business unit', 400);
      }
    } else if (role.scope === 'bu') {
      if (teamData.project_id) {
        throw new AppError('Project ID must be null for BU-scoped roles', 400);
      }
    }

    // Validate business unit exists
    const businessUnit = await BusinessUnit.findByPk(teamData.business_unit_id);
    if (!businessUnit) {
      throw new AppError('Business unit not found', 404);
    }

    // Validate user exists
    const user = await User.findByPk(teamData.user_id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // CRITICAL: Check role consistency for project-scoped roles
    // This prevents user from having different roles across different projects
    if (teamData.is_active !== false && role.scope === 'project') {
      const consistencyCheck = await this.checkUserRoleConsistency(
        teamData.user_id,
        teamData.business_unit_id,
        teamData.role_id
      );

      if (!consistencyCheck.allowed) {
        throw new AppError(consistencyCheck.reason, 400);
      }
    }

    // Check for duplicate active assignment in the SAME project
    const existingSameAssignment = await Team.findOne({
      where: {
        business_unit_id: teamData.business_unit_id,
        project_id: teamData.project_id || null,
        user_id: teamData.user_id,
        role_id: teamData.role_id,
        is_active: true
      }
    });

    if (existingSameAssignment) {
      throw new AppError(
        'User already has this role in this specific project. Cannot create duplicate assignment for the same project.',
        400
      );
    }

    // Prepare data for creation
    const mappedData = {
      business_unit_id: teamData.business_unit_id,
      project_id: teamData.project_id || null,
      user_id: teamData.user_id,
      role_id: teamData.role_id,
      assigned_by: teamData.assigned_by || null,
      is_active: teamData.is_active !== undefined ? teamData.is_active : true,
      assigned_at: teamData.assigned_at || new Date()
    };

    // If not active, set removed_at
    if (!mappedData.is_active) {
      mappedData.removed_at = teamData.removed_at || new Date();
    }

    const team = await Team.create(mappedData);
    return await this.getTeamById(team.id);
  }

  // Update team assignment
  async updateTeam(id, updateData) {
    const teamRecord = await Team.findByPk(id);
    if (!teamRecord) {
      return null;
    }

    const mappedData = {};
    
    if (updateData.business_unit_id !== undefined) mappedData.business_unit_id = updateData.business_unit_id;
    if (updateData.project_id !== undefined) mappedData.project_id = updateData.project_id;
    if (updateData.user_id !== undefined) mappedData.user_id = updateData.user_id;
    if (updateData.role_id !== undefined) mappedData.role_id = updateData.role_id;
    if (updateData.is_active !== undefined) mappedData.is_active = updateData.is_active;
    
    // Handle removal timestamp
    if (updateData.removed_at !== undefined) {
      mappedData.removed_at = updateData.removed_at;
    } else if (mappedData.is_active === false && teamRecord.is_active === true) {
      // If deactivating, set removed_at to now
      mappedData.removed_at = new Date();
    } else if (mappedData.is_active === true && teamRecord.is_active === false) {
      // If reactivating, clear removed_at
      mappedData.removed_at = null;
    }

    // If role is being updated, validate scope consistency
    if (mappedData.role_id && mappedData.role_id !== teamRecord.role_id) {
      const role = await Role.findByPk(mappedData.role_id);
      if (!role) {
        throw new AppError('Role not found', 404);
      }

      const projectId = mappedData.project_id !== undefined ? mappedData.project_id : teamRecord.project_id;
      const businessUnitId = mappedData.business_unit_id !== undefined ? mappedData.business_unit_id : teamRecord.business_unit_id;

      if (role.scope === 'project') {
        if (!projectId) {
          throw new AppError('Project ID is required for project-scoped roles', 400);
        }
        const project = await Project.findByPk(projectId);
        if (!project) {
          throw new AppError('Project not found', 404);
        }
        if (project.business_unit_id !== businessUnitId) {
          throw new AppError('Project must belong to the specified business unit', 400);
        }
      } else if (role.scope === 'bu') {
        if (projectId) {
          throw new AppError('Project ID must be null for BU-scoped roles', 400);
        }
      }

      // Check role consistency if activating or keeping active
      const willBeActive = mappedData.is_active !== undefined ? mappedData.is_active : teamRecord.is_active;
      if (willBeActive && role.scope === 'project') {
        const consistencyCheck = await this.checkUserRoleConsistency(
          mappedData.user_id || teamRecord.user_id,
          mappedData.business_unit_id || teamRecord.business_unit_id,
          mappedData.role_id,
          id
        );

        if (!consistencyCheck.allowed) {
          throw new AppError(consistencyCheck.reason, 400);
        }
      }
    }

    // If business unit is being updated, validate
    if (mappedData.business_unit_id && mappedData.business_unit_id !== teamRecord.business_unit_id) {
      const businessUnit = await BusinessUnit.findByPk(mappedData.business_unit_id);
      if (!businessUnit) {
        throw new AppError('Business unit not found', 404);
      }
    }

    // If user is being updated, validate
    if (mappedData.user_id && mappedData.user_id !== teamRecord.user_id) {
      const user = await User.findByPk(mappedData.user_id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check role consistency for new user
      const willBeActive = mappedData.is_active !== undefined ? mappedData.is_active : teamRecord.is_active;
      const roleId = mappedData.role_id || teamRecord.role_id;
      const businessUnitId = mappedData.business_unit_id !== undefined ? mappedData.business_unit_id : teamRecord.business_unit_id;
      
      if (willBeActive) {
        const role = await Role.findByPk(roleId);
        if (role && role.scope === 'project') {
          const consistencyCheck = await this.checkUserRoleConsistency(
            mappedData.user_id,
            businessUnitId,
            roleId,
            id
          );

          if (!consistencyCheck.allowed) {
            throw new AppError(consistencyCheck.reason, 400);
          }
        }
      }
    }

    // Get list of updatable fields
    const updatableFields = Object.keys(mappedData).filter(field => 
      ['business_unit_id', 'project_id', 'user_id', 'role_id', 'is_active', 'removed_at'].includes(field)
    );

    if (updatableFields.length === 0) {
      return await this.getTeamById(id);
    }

    await teamRecord.update(mappedData, {
      fields: updatableFields
    });

    return await this.getTeamById(id);
  }

  // Delete team assignment (hard delete)
  async deleteTeam(id) {
    const teamRecord = await Team.findByPk(id);
    if (!teamRecord) {
      return null;
    }

    await teamRecord.destroy();
    return true;
  }

  // Deactivate team assignment
  async deactivateTeam(id) {
    const teamRecord = await Team.findByPk(id);
    if (!teamRecord) {
      return null;
    }

    if (!teamRecord.is_active) {
      return teamRecord;
    }

    await teamRecord.update({
      is_active: false,
      removed_at: new Date()
    });

    return await this.getTeamById(id);
  }

  // Activate team assignment with role consistency check
  async activateTeam(id) {
    const teamRecord = await Team.findByPk(id);
    if (!teamRecord) {
      return null;
    }

    if (teamRecord.is_active) {
      return teamRecord;
    }

    // Check role consistency before activating
    const role = await Role.findByPk(teamRecord.role_id);
    if (role && role.scope === 'project') {
      const consistencyCheck = await this.checkUserRoleConsistency(
        teamRecord.user_id,
        teamRecord.business_unit_id,
        teamRecord.role_id,
        id
      );

      if (!consistencyCheck.allowed) {
        throw new AppError(consistencyCheck.reason, 400);
      }
    }

    // Check for duplicate active assignment in the SAME project
    const existingSameAssignment = await Team.findOne({
      where: {
        business_unit_id: teamRecord.business_unit_id,
        project_id: teamRecord.project_id,
        user_id: teamRecord.user_id,
        role_id: teamRecord.role_id,
        is_active: true,
        id: { [Op.ne]: id }
      }
    });

    if (existingSameAssignment) {
      throw new AppError(
        'Cannot activate: User already has this role in this specific project.',
        400
      );
    }

    await teamRecord.update({
      is_active: true,
      removed_at: null
    });

    return await this.getTeamById(id);
  }

  // Get teams by user
  async getTeamsByUser(userId, filters = {}) {
    const {
      business_unit_id,
      project_id,
      role_id,
      is_active,
      page = 1,
      limit = 10,
      sort = 'assigned_at',
      order = 'DESC'
    } = filters;

    const whereClause = { user_id: userId };
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    if (project_id) whereClause.project_id = project_id;
    if (role_id) whereClause.role_id = role_id;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const offset = (page - 1) * limit;

    const result = await Team.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'username', 'name', 'family_name']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      teams: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get active teams by user
  async getActiveTeamsByUser(userId) {
    const teams = await Team.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    // Group by role to show consistency
    const rolesMap = new Map();
    for (const team of teams) {
      if (team.role && team.project_id) {
        if (!rolesMap.has(team.role_id)) {
          rolesMap.set(team.role_id, {
            role: team.role,
            projects: [],
            assignments: []
          });
        }
        rolesMap.get(team.role_id).projects.push(team.project);
        rolesMap.get(team.role_id).assignments.push(team);
      }
    }

    return {
      teams,
      count: teams.length,
      groupedByRole: Array.from(rolesMap.values()),
      hasConsistentRoles: rolesMap.size <= 1,
      userRole: rolesMap.size === 1 ? Array.from(rolesMap.values())[0].role : null,
      isInconsistent: rolesMap.size > 1
    };
  }

  // Get teams by business unit
  async getTeamsByBusinessUnit(businessUnitId, filters = {}) {
    const {
      user_id,
      role_id,
      is_active,
      page = 1,
      limit = 10,
      sort = 'assigned_at',
      order = 'DESC'
    } = filters;

    const whereClause = { business_unit_id: businessUnitId };
    if (user_id) whereClause.user_id = user_id;
    if (role_id) whereClause.role_id = role_id;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const offset = (page - 1) * limit;

    const result = await Team.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'family_name', 'email']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      teams: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get teams by project
  async getTeamsByProject(projectId, filters = {}) {
    const {
      user_id,
      role_id,
      is_active,
      page = 1,
      limit = 10,
      sort = 'assigned_at',
      order = 'DESC'
    } = filters;

    const whereClause = { project_id: projectId };
    if (user_id) whereClause.user_id = user_id;
    if (role_id) whereClause.role_id = role_id;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const offset = (page - 1) * limit;

    const result = await Team.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'family_name', 'email']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      teams: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get teams by role
  async getTeamsByRole(roleId, filters = {}) {
    const {
      business_unit_id,
      project_id,
      user_id,
      is_active,
      page = 1,
      limit = 10,
      sort = 'assigned_at',
      order = 'DESC'
    } = filters;

    const whereClause = { role_id: roleId };
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    if (project_id) whereClause.project_id = project_id;
    if (user_id) whereClause.user_id = user_id;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const offset = (page - 1) * limit;

    const result = await Team.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'family_name', 'email', 'job_title']
        },
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      teams: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get team assignment statistics
  async getTeamStatistics(filters = {}) {
    const {
      business_unit_id,
      project_id,
      from_date,
      to_date
    } = filters;

    const whereClause = {};
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    if (project_id) whereClause.project_id = project_id;
    if (from_date) whereClause.assigned_at = { [Op.gte]: new Date(from_date) };
    if (to_date) whereClause.assigned_at = { ...whereClause.assigned_at, [Op.lte]: new Date(to_date) };

    const totalAssignments = await Team.count({ where: whereClause });
    const activeAssignments = await Team.count({ where: { ...whereClause, is_active: true } });
    const inactiveAssignments = await Team.count({ where: { ...whereClause, is_active: false } });

    const assignmentsByRole = await Team.findAll({
      where: whereClause,
      attributes: [
        'role_id',
        [Sequelize.fn('COUNT', Sequelize.col('role_id')), 'count']
      ],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name', 'scope']
      }],
      group: ['role_id', 'role.id', 'role.name', 'role.scope']
    });

    // Get users with multiple project assignments (same role across projects)
    const usersWithMultipleProjects = await Team.findAll({
      where: {
        ...whereClause,
        project_id: { [Op.ne]: null },
        is_active: true
      },
      attributes: [
        'user_id',
        'role_id',
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('project_id'))), 'project_count']
      ],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }],
      group: ['user_id', 'role_id', 'role.id', 'role.name'],
      having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('project_id'))), '>', 1)
    });

    // Get users with inconsistent roles (multiple different roles across projects)
    const usersWithInconsistentRoles = await Team.findAll({
      where: {
        ...whereClause,
        project_id: { [Op.ne]: null },
        is_active: true
      },
      attributes: [
        'user_id',
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('role_id'))), 'role_count']
      ],
      group: ['user_id'],
      having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('role_id'))), '>', 1)
    });

    return {
      total_assignments: totalAssignments,
      active_assignments: activeAssignments,
      inactive_assignments: inactiveAssignments,
      assignments_by_role: assignmentsByRole,
      users_with_multiple_projects: usersWithMultipleProjects.length,
      multi_project_users: usersWithMultipleProjects.map(u => ({
        user_id: u.user_id,
        role_name: u.role ? u.role.name : 'Unknown',
        project_count: parseInt(u.dataValues.project_count)
      })),
      users_with_inconsistent_roles: usersWithInconsistentRoles.length,
      inconsistent_role_users: usersWithInconsistentRoles.map(u => ({
        user_id: u.user_id,
        role_count: parseInt(u.dataValues.role_count)
      }))
    };
  }

  // Bulk create team assignments
  async bulkCreateTeams(teamsData) {
    const createdTeams = [];
    const errors = [];

    for (const teamData of teamsData) {
      try {
        const team = await this.createTeam(teamData);
        createdTeams.push(team);
      } catch (error) {
        errors.push({
          data: teamData,
          error: error.message
        });
      }
    }

    return {
      created: createdTeams,
      errors: errors,
      total_processed: teamsData.length,
      total_created: createdTeams.length,
      total_errors: errors.length
    };
  }

  // Get user's role summary across all projects
  async getUserRoleSummary(userId, businessUnitId) {
    const assignments = await Team.findAll({
      where: {
        user_id: userId,
        business_unit_id: businessUnitId,
        is_active: true,
        project_id: { [Op.ne]: null }
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'scope']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'status']
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    if (assignments.length === 0) {
      return {
        user_id: userId,
        has_assignments: false,
        message: 'No active project assignments found'
      };
    }

    const uniqueRoles = [...new Set(assignments.map(a => a.role_id))];
    const isConsistent = uniqueRoles.length === 1;

    return {
      user_id: userId,
      has_assignments: true,
      is_consistent: isConsistent,
      total_projects: assignments.length,
      role: isConsistent ? assignments[0].role : null,
      roles_count: uniqueRoles.length,
      roles_list: assignments.map(a => ({
        role_name: a.role.name,
        project_name: a.project.name,
        project_code: a.project.code,
        assigned_at: a.assigned_at
      })),
      warning: !isConsistent ? '⚠️ User has inconsistent roles across projects! User should have only one role type.' : null
    };
  }

  // Get all users with their role consistency status
  async getUsersRoleConsistency(businessUnitId) {
    // Get all active users with project assignments
    const usersWithAssignments = await Team.findAll({
      where: {
        business_unit_id: businessUnitId,
        is_active: true,
        project_id: { [Op.ne]: null }
      },
      attributes: ['user_id'],
      group: ['user_id'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ]
    });

    const results = [];
    for (const item of usersWithAssignments) {
      const summary = await this.getUserRoleSummary(item.user_id, businessUnitId);
      results.push(summary);
    }

    return {
      total_users: results.length,
      consistent_users: results.filter(r => r.is_consistent).length,
      inconsistent_users: results.filter(r => !r.is_consistent).length,
      users: results
    };
  }
}

export default new TeamService();