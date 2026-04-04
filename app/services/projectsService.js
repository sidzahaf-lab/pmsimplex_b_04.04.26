// backend/app/services/projectsService.js
import { Project, BusinessUnit, User, EmissionPolicy, PolicyDocType } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class ProjectsService {
  // Get all projects with optional filtering and pagination
  async getAllProjects(filters = {}) {
    const {
      business_unit_id,
      health_status,
      current_phase,
      start_date_from,
      start_date_to,
      planned_end_date_from,
      planned_end_date_to,
      contract_type,
      is_active = true,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = { is_active };
    
    // Apply filters
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    if (health_status) whereClause.health_status = health_status;
    if (current_phase) whereClause.current_phase = current_phase;
    if (contract_type) whereClause.contract_type = contract_type;
    
    // Date range filters
    if (start_date_from || start_date_to) {
      whereClause.start_date = {};
      if (start_date_from) whereClause.start_date[Op.gte] = start_date_from;
      if (start_date_to) whereClause.start_date[Op.lte] = start_date_to;
    }
    
    if (planned_end_date_from || planned_end_date_to) {
      whereClause.planned_end_date = {};
      if (planned_end_date_from) whereClause.planned_end_date[Op.gte] = planned_end_date_from;
      if (planned_end_date_to) whereClause.planned_end_date[Op.lte] = planned_end_date_to;
    }

    const offset = (page - 1) * limit;

    const result = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      projects: result.rows,
      total: result.count,
      page: parseInt(page),
      totalPages: Math.ceil(result.count / limit)
    };
  }

  // Get default emission policy for a document type
  async getProjectDefaultPolicy(projectId, docTypeId) {
    const policy = await EmissionPolicy.findOne({
      where: { project_id: projectId },
      include: [
        {
          model: PolicyDocType,
          as: 'doc_type_associations',
          required: true,
          where: { doc_type_id: docTypeId }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return policy;
  }

  // Check project code availability
  async checkProjectCodeAvailability(code) {
    if (!code || code.length < 1) {
      return true;
    }

    const existingProject = await Project.findOne({
      where: {
        code: code.trim()
      }
    });

    // Return true if code is available (no existing record found)
    return !existingProject;
  }

  // Get project by ID
  async getProjectById(id) {
    return await Project.findByPk(id, {
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ]
    });
  }

  // Get project by code
  async getProjectByCode(code) {
    return await Project.findOne({
      where: { code },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ]
    });
  }

  // Create new project
  async createProject(projectData) {
    // Check if project code already exists
    const existingProject = await Project.findOne({
      where: { code: projectData.code }
    });
    
    if (existingProject) {
      throw new AppError('Project code already exists', 400);
    }

    // Check if business unit exists (if provided)
    if (projectData.business_unit_id) {
      const businessUnit = await BusinessUnit.findByPk(projectData.business_unit_id);
      if (!businessUnit) {
        throw new AppError('Business unit not found', 404);
      }
    }

    // Check if creator user exists (if provided)
    if (projectData.created_by) {
      const user = await User.findByPk(projectData.created_by);
      if (!user) {
        throw new AppError('User not found', 404);
      }
    }

    // Validate date logic
    if (projectData.start_date && projectData.planned_end_date) {
      const startDate = new Date(projectData.start_date);
      const plannedEndDate = new Date(projectData.planned_end_date);
      
      if (startDate > plannedEndDate) {
        throw new AppError('Start date cannot be after planned end date', 400);
      }
    }

    // Validate baseline_finish_date if provided
    if (projectData.baseline_finish_date && projectData.start_date) {
      const baselineDate = new Date(projectData.baseline_finish_date);
      const startDate = new Date(projectData.start_date);
      
      if (baselineDate < startDate) {
        throw new AppError('Baseline finish date cannot be before start date', 400);
      }
    }

    // Validate current_finish_date if provided
    if (projectData.current_finish_date && projectData.start_date) {
      const currentDate = new Date(projectData.current_finish_date);
      const startDate = new Date(projectData.start_date);
      
      if (currentDate < startDate) {
        throw new AppError('Current finish date cannot be before start date', 400);
      }
    }

    // Validate contract value if provided
    if (projectData.contract_value && projectData.contract_value < 0) {
      throw new AppError('Contract value cannot be negative', 400);
    }

    return await Project.create(projectData);
  }

  // Update project
  async updateProject(id, updateData) {
    const projectRecord = await Project.findByPk(id);
    if (!projectRecord) {
      return null;
    }

    // If project code is being updated, check uniqueness
    if (updateData.code && updateData.code !== projectRecord.code) {
      const existingProject = await Project.findOne({
        where: {
          code: updateData.code,
          id: { [Op.ne]: id }
        }
      });

      if (existingProject) {
        throw new AppError('Project code already exists', 400);
      }
    }

    // Check if business unit exists (if changing)
    if (updateData.business_unit_id && updateData.business_unit_id !== projectRecord.business_unit_id) {
      const businessUnit = await BusinessUnit.findByPk(updateData.business_unit_id);
      if (!businessUnit) {
        throw new AppError('Business unit not found', 404);
      }
    }

    // Check if creator user exists (if changing)
    if (updateData.created_by && updateData.created_by !== projectRecord.created_by) {
      const user = await User.findByPk(updateData.created_by);
      if (!user) {
        throw new AppError('User not found', 404);
      }
    }

    // Validate date logic
    const startDate = updateData.start_date ? new Date(updateData.start_date) : new Date(projectRecord.start_date);
    const plannedEndDate = updateData.planned_end_date ? new Date(updateData.planned_end_date) : new Date(projectRecord.planned_end_date);
    
    if (startDate > plannedEndDate) {
      throw new AppError('Start date cannot be after planned end date', 400);
    }

    // Validate baseline_finish_date if being updated
    if (updateData.baseline_finish_date) {
      const baselineDate = new Date(updateData.baseline_finish_date);
      if (baselineDate < startDate) {
        throw new AppError('Baseline finish date cannot be before start date', 400);
      }
    }

    // Validate current_finish_date if being updated
    if (updateData.current_finish_date) {
      const currentDate = new Date(updateData.current_finish_date);
      if (currentDate < startDate) {
        throw new AppError('Current finish date cannot be before start date', 400);
      }
    }

    // Validate contract value if being updated
    if (updateData.contract_value !== undefined && updateData.contract_value < 0) {
      throw new AppError('Contract value cannot be negative', 400);
    }

    // Update project
    await projectRecord.update(updateData);

    return await this.getProjectById(id);
  }

  // Delete project (soft delete by setting is_active = false)
  async deleteProject(id) {
    const projectRecord = await Project.findByPk(id);
    if (!projectRecord) {
      return null;
    }

    // Soft delete by setting is_active to false
    await projectRecord.update({ is_active: false });
    return true;
  }

  // Hard delete project (use with caution)
  async hardDeleteProject(id) {
    const projectRecord = await Project.findByPk(id);
    if (!projectRecord) {
      return null;
    }

    await projectRecord.destroy();
    return true;
  }

  // Get projects by business unit ID
  async getProjectsByBusinessUnit(businessUnitId) {
    return await Project.findAll({
      where: { 
        business_unit_id: businessUnitId,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  // Update project health status
  async updateProjectHealthStatus(id, health_status) {
    const projectRecord = await Project.findByPk(id);
    if (!projectRecord) {
      return null;
    }

    // Validate health status
    const validStatuses = ['good', 'warning', 'critical'];
    if (!validStatuses.includes(health_status)) {
      throw new AppError('Invalid health status. Must be one of: good, warning, critical', 400);
    }

    await projectRecord.update({ health_status });
    return await this.getProjectById(id);
  }

  // Update project phase
  async updateProjectPhase(id, current_phase) {
    const projectRecord = await Project.findByPk(id);
    if (!projectRecord) {
      return null;
    }

    // Validate phase
    const validPhases = [
      'FEED',
      'Detailed Engineering',
      'Procurement',
      'Construction',
      'Pre-Commissioning',
      'Commissioning',
      'Close-out'
    ];
    
    if (!validPhases.includes(current_phase)) {
      throw new AppError('Invalid project phase', 400);
    }

    await projectRecord.update({ current_phase });
    return await this.getProjectById(id);
  }

  // Get project metrics and summary
  async getProjectMetrics(business_unit_id = null) {
    const whereClause = { is_active: true };
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;

    const projects = await Project.findAll({
      where: whereClause,
      attributes: ['health_status', 'current_phase']
    });

    const totalProjects = projects.length;
    
    // Health status counts
    const healthCounts = {
      good: 0,
      warning: 0,
      critical: 0
    };

    // Phase counts
    const phaseCounts = {};

    projects.forEach(project => {
      // Count health status
      if (project.health_status) {
        healthCounts[project.health_status] = (healthCounts[project.health_status] || 0) + 1;
      }
      
      // Count phases
      if (project.current_phase) {
        phaseCounts[project.current_phase] = (phaseCounts[project.current_phase] || 0) + 1;
      }
    });

    const healthSummary = Object.keys(healthCounts).map(status => ({
      status,
      count: healthCounts[status],
      percentage: totalProjects > 0 ? Math.round((healthCounts[status] / totalProjects) * 100) : 0
    }));

    const phaseSummary = Object.keys(phaseCounts).map(phase => ({
      phase,
      count: phaseCounts[phase],
      percentage: totalProjects > 0 ? Math.round((phaseCounts[phase] / totalProjects) * 100) : 0
    }));

    // Get date-based metrics
    const now = new Date();
    const upcomingProjects = await Project.count({
      where: {
        ...whereClause,
        start_date: {
          [Op.gte]: now,
          [Op.lte]: new Date(now.setDate(now.getDate() + 30))
        }
      }
    });

    const nearingCompletion = await Project.count({
      where: {
        ...whereClause,
        planned_end_date: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(new Date().setDate(new Date().getDate() + 30))
        }
      }
    });

    const delayedProjects = await Project.count({
      where: {
        ...whereClause,
        current_finish_date: {
          [Op.gt]: Project.sequelize.col('planned_end_date')
        }
      }
    });

    return {
      total_projects: totalProjects,
      health_summary: healthSummary,
      phase_summary: phaseSummary,
      upcoming_projects: upcomingProjects,
      nearing_completion: nearingCompletion,
      delayed_projects: delayedProjects
    };
  }

  // Get upcoming projects (starting in next X days)
  async getUpcomingProjects(days = 7, business_unit_id = null) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    const whereClause = {
      is_active: true,
      start_date: {
        [Op.lte]: targetDate,
        [Op.gte]: new Date()
      }
    };
    
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;

    return await Project.findAll({
      where: whereClause,
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['start_date', 'ASC']]
    });
  }

  // Get projects nearing completion (ending in next X days)
  async getProjectsNearingCompletion(days = 30, business_unit_id = null) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    const whereClause = {
      is_active: true,
      planned_end_date: {
        [Op.lte]: targetDate,
        [Op.gte]: new Date()
      }
    };
    
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;

    return await Project.findAll({
      where: whereClause,
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['planned_end_date', 'ASC']]
    });
  }

  // Get projects by health status
  async getProjectsByHealthStatus(health_status) {
    // Validate health status
    const validStatuses = ['good', 'warning', 'critical'];
    if (!validStatuses.includes(health_status)) {
      throw new AppError('Invalid health status. Must be one of: good, warning, critical', 400);
    }

    return await Project.findAll({
      where: { 
        health_status,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  // Get projects by phase
  async getProjectsByPhase(current_phase) {
    // Validate phase
    const validPhases = [
      'FEED',
      'Detailed Engineering',
      'Procurement',
      'Construction',
      'Pre-Commissioning',
      'Commissioning',
      'Close-out'
    ];
    
    if (!validPhases.includes(current_phase)) {
      throw new AppError('Invalid project phase', 400);
    }

    return await Project.findAll({
      where: { 
        current_phase,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  // Get projects with business unit details
  async getProjectsWithBusinessUnit() {
    return await Project.findAll({
      where: { is_active: true },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  // Validate project belongs to business unit
  async validateProjectBusinessUnit(projectId, businessUnitId) {
    const projectRecord = await Project.findOne({
      where: {
        id: projectId,
        business_unit_id: businessUnitId,
        is_active: true
      }
    });
    return !!projectRecord;
  }

  // Get delayed projects (current_finish_date > planned_end_date)
  async getDelayedProjects(business_unit_id = null) {
    const whereClause = {
      is_active: true,
      current_finish_date: {
        [Op.gt]: Project.sequelize.col('planned_end_date')
      }
    };
    
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;

    return await Project.findAll({
      where: whereClause,
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }
      ],
      order: [['current_finish_date', 'DESC']]
    });
  }
}

export default new ProjectsService();