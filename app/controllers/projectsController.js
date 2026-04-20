// backend/app/controllers/projectsController.js

import { Project, BusinessUnit, User, EmissionPolicy, PolicyDocType, ProjDoc, DocType, DocRevision, EmissionPeriod, DocSubcategory, DocCategory } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import { asyncHandler } from '../middleware/asyncHandler.js';

class ProjectsController {
  // @desc    Get all projects with filtering and pagination
  // @route   GET /api/projects
  // @access  Private
  getAllProjects = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC',
      is_active,
      health_status,
      current_phase,
      business_unit_id,
      search
    } = req.query;

    const whereClause = {};
    
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    if (health_status) whereClause.health_status = health_status;
    if (current_phase) whereClause.current_phase = current_phase;
    if (business_unit_id) whereClause.business_unit_id = business_unit_id;
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { client_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
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
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get project by ID
  // @route   GET /api/projects/:id
  // @access  Private
  getProject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ]
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  });

  // @desc    Get projects by business unit
  // @route   GET /api/projects/business-unit/:businessUnitId
  // @access  Private
  getProjectsByBusinessUnit = asyncHandler(async (req, res, next) => {
    const { businessUnitId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const businessUnit = await BusinessUnit.findByPk(businessUnitId);
    if (!businessUnit) {
      return next(new AppError('Business unit not found', 404));
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: { 
        business_unit_id: businessUnitId,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Create new project
  // @route   POST /api/projects
  // @access  Private
  createProject = asyncHandler(async (req, res, next) => {
    const projectData = {
      code: req.body.code,
      name: req.body.name,
      client_name: req.body.client_name,
      start_date: req.body.start_date,
      planned_end_date: req.body.planned_end_date,
      baseline_finish_date: req.body.baseline_finish_date,
      current_finish_date: req.body.current_finish_date,
      description: req.body.description,
      health_status: req.body.health_status,
      business_unit_id: req.body.business_unit_id,
      contract_type: req.body.contract_type,
      current_phase: req.body.current_phase,
      contract_value: req.body.contract_value,
      currency: req.body.currency,
      created_by: req.user?.id || null,
      is_active: true
    };

    if (projectData.business_unit_id) {
      const businessUnit = await BusinessUnit.findByPk(projectData.business_unit_id);
      if (!businessUnit) {
        return next(new AppError('Business unit not found', 404));
      }
    }

    const existingProject = await Project.findOne({
      where: { code: projectData.code }
    });

    if (existingProject) {
      return next(new AppError('Project code already exists', 400));
    }

    const project = await Project.create(projectData);

    res.status(201).json({
      status: 'success',
      data: {
        project
      }
    });
  });

  // @desc    Update project
  // @route   PUT /api/projects/:id
  // @access  Private
  updateProject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (req.body.business_unit_id && req.body.business_unit_id !== project.business_unit_id) {
      const businessUnit = await BusinessUnit.findByPk(req.body.business_unit_id);
      if (!businessUnit) {
        return next(new AppError('Business unit not found', 404));
      }
    }

    if (req.body.code && req.body.code !== project.code) {
      const existingProject = await Project.findOne({
        where: { 
          code: req.body.code,
          id: { [Op.ne]: id }
        }
      });

      if (existingProject) {
        return next(new AppError('Project code already exists', 400));
      }
    }

    const updatableFields = [
      'code', 'name', 'client_name', 'start_date', 'planned_end_date',
      'baseline_finish_date', 'current_finish_date', 'description',
      'health_status', 'business_unit_id', 'contract_type', 'current_phase',
      'contract_value', 'currency', 'is_active'
    ];

    const updateData = {};
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.last_modified_at = new Date();

    await project.update(updateData);

    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject
      }
    });
  });

  // @desc    Delete project (soft delete)
  // @route   DELETE /api/projects/:id
  // @access  Private
  deleteProject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    await project.update({ 
      is_active: false,
      last_modified_at: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Project deactivated successfully',
      data: null
    });
  });

  // @desc    Hard delete project (admin only)
  // @route   DELETE /api/projects/:id/hard
  // @access  Private/Admin
  hardDeleteProject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const documentsCount = await ProjDoc?.count({ where: { project_id: id } }) || 0;

    if (documentsCount > 0) {
      return next(new AppError(`Cannot delete project with ${documentsCount} associated documents`, 400));
    }

    await project.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  // @desc    Check project code availability
  // @route   GET /api/projects/check-code
  // @access  Public
  checkProjectCode = asyncHandler(async (req, res, next) => {
    const { code, excludeId } = req.query;

    if (!code) {
      return next(new AppError('Project code is required', 400));
    }

    const whereClause = { code: code.trim() };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingProject = await Project.findOne({ where: whereClause });

    res.status(200).json({
      status: 'success',
      data: {
        available: !existingProject,
        message: existingProject ? 'Project code already exists' : 'Project code is available'
      }
    });
  });

  // @desc    Validate project belongs to business unit
  // @route   GET /api/projects/:projectId/validate-business-unit/:businessUnitId
  // @access  Private
  validateProjectBusinessUnit = asyncHandler(async (req, res, next) => {
    const { projectId, businessUnitId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isValid = project.business_unit_id === businessUnitId;

    res.status(200).json({
      status: 'success',
      data: {
        isValid,
        message: isValid ? 'Project belongs to business unit' : 'Project does not belong to business unit'
      }
    });
  });

  // @desc    Get projects by health status
  // @route   GET /api/projects/health-status/:health_status
  // @access  Private
  getProjectsByHealthStatus = asyncHandler(async (req, res, next) => {
    const { health_status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: { 
        health_status,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get projects by phase
  // @route   GET /api/projects/phase/:current_phase
  // @access  Private
  getProjectsByPhase = asyncHandler(async (req, res, next) => {
    const { current_phase } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: { 
        current_phase,
        is_active: true 
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get project metrics summary
  // @route   GET /api/projects/metrics/summary
  // @access  Private
  getProjectMetrics = asyncHandler(async (req, res, next) => {
    const totalProjects = await Project.count({ where: { is_active: true } });
    
    const byHealthStatus = await Project.findAll({
      where: { is_active: true },
      attributes: [
        'health_status',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('health_status')), 'count']
      ],
      group: ['health_status']
    });

    const byPhase = await Project.findAll({
      where: { is_active: true },
      attributes: [
        'current_phase',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('current_phase')), 'count']
      ],
      group: ['current_phase']
    });

    const upcomingCount = await Project.count({
      where: {
        is_active: true,
        start_date: {
          [Op.lte]: Project.sequelize.literal("CURRENT_DATE + INTERVAL '30 days'"),
          [Op.gte]: Project.sequelize.literal('CURRENT_DATE')
        }
      }
    });

    const nearingCompletionCount = await Project.count({
      where: {
        is_active: true,
        planned_end_date: {
          [Op.lte]: Project.sequelize.literal("CURRENT_DATE + INTERVAL '30 days'"),
          [Op.gte]: Project.sequelize.literal('CURRENT_DATE')
        }
      }
    });

    const delayedCount = await Project.count({
      where: {
        is_active: true,
        current_finish_date: {
          [Op.gt]: Project.sequelize.col('planned_end_date')
        }
      }
    });

    const healthStatusMap = {
      good: 0,
      warning: 0,
      critical: 0
    };

    byHealthStatus.forEach(item => {
      if (item.health_status) {
        healthStatusMap[item.health_status] = parseInt(item.dataValues.count);
      }
    });

    const phaseMap = {};
    byPhase.forEach(item => {
      if (item.current_phase) {
        phaseMap[item.current_phase] = parseInt(item.dataValues.count);
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalProjects,
        byHealthStatus: healthStatusMap,
        byPhase: phaseMap,
        upcoming: upcomingCount,
        nearingCompletion: nearingCompletionCount,
        delayed: delayedCount
      }
    });
  });

  // @desc    Get projects with business unit details
  // @route   GET /api/projects/with-business-unit
  // @access  Private
  getProjectsWithBusinessUnit = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: { is_active: true },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          required: true,
          attributes: ['id', 'name', 'description', 'is_active']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get upcoming projects
  // @route   GET /api/projects/upcoming
  // @access  Private
  getUpcomingProjects = asyncHandler(async (req, res, next) => {
    const { days = 30, page = 1, limit = 10 } = req.query;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: {
        is_active: true,
        start_date: {
          [Op.lte]: targetDate,
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      order: [['start_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get projects nearing completion
  // @route   GET /api/projects/nearing-completion
  // @access  Private
  getProjectsNearingCompletion = asyncHandler(async (req, res, next) => {
    const { days = 30, page = 1, limit = 10 } = req.query;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: {
        is_active: true,
        planned_end_date: {
          [Op.lte]: targetDate,
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      order: [['planned_end_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get delayed projects
  // @route   GET /api/projects/delayed
  // @access  Private
  getDelayedProjects = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAndCountAll({
      where: {
        is_active: true,
        current_finish_date: {
          [Op.gt]: Project.sequelize.col('planned_end_date')
        }
      },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name']
        }
      ],
      order: [['current_finish_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        projects: projects.rows,
        pagination: {
          total: projects.count,
          page: parseInt(page),
          totalPages: Math.ceil(projects.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  });

  // @desc    Get default emission policy for a document type
  // @route   GET /api/projects/:projectId/doc-types/:docTypeId/default-policy
  // @access  Private
  getProjectDefaultPolicy = asyncHandler(async (req, res, next) => {
    const { projectId, docTypeId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return next(new AppError('Invalid project ID format', 400));
    }
    if (!uuidRegex.test(docTypeId)) {
      return next(new AppError('Invalid document type ID format', 400));
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

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

    res.status(200).json({
      status: 'success',
      data: {
        policy: policy || null
      }
    });
  });

  // @desc    Update project health status
  // @route   PATCH /api/projects/:id/health-status
  // @access  Private
  updateProjectHealthStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { health_status } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    await project.update({
      health_status,
      last_modified_at: new Date()
    });

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  });

  // @desc    Update project phase
  // @route   PATCH /api/projects/:id/phase
  // @access  Private
  updateProjectPhase = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { current_phase } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    await project.update({
      current_phase,
      last_modified_at: new Date()
    });

    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  });

  // ============================================
  // AGGREGATED DOCUMENTS ENDPOINT - CORRIGÉ
  // ============================================

  // @desc    Get aggregated document statistics for a project
  // @route   GET /api/projects/:projectId/documents/aggregated
  // @access  Private
  getProjectDocumentsAggregated = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { category, referencePeriod, documentType = 'all' } = req.query;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return next(new AppError('Invalid project ID format', 400));
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const whereClause = { project_id: projectId, status: 'active' };

    if (documentType === 'adhoc') {
      whereClause.emission_id = null;
    } else if (documentType === 'periodic') {
      whereClause.emission_id = { [Op.ne]: null };
    }

    // Récupérer les documents avec la hiérarchie complète des catégories
    const documents = await ProjDoc.findAll({
      where: whereClause,
      include: [
        {
          model: DocType,
          as: 'doc_type',
          include: [
            {
              model: DocSubcategory,
              as: 'subcategory',
              include: [
                {
                  model: DocCategory,
                  as: 'category',
                  attributes: ['id', 'label']
                }
              ],
              attributes: ['id', 'label']
            }
          ],
          attributes: ['id', 'label', 'entity_type', 'is_periodic']
        },
        {
          model: DocRevision,
          as: 'revisions',
          required: false,
          limit: 1,
          order: [['revision', 'DESC']],
          separate: false
        }
      ]
    });

    // Fonction pour obtenir le nom de la catégorie depuis la hiérarchie
    const getCategoryName = (doc) => {
      return doc.doc_type?.subcategory?.category?.label || null;
    };

    // Filtrer par catégorie si spécifiée
    let filteredDocs = documents;
    if (category) {
      filteredDocs = documents.filter(doc => getCategoryName(doc) === category);
    }

    const adhocDocs = filteredDocs.filter(doc => !doc.emission_id);
    const periodicDocs = filteredDocs.filter(doc => doc.emission_id);

    const adhocTotal = adhocDocs.length;
    const adhocReceived = adhocDocs.filter(doc => {
      const revisions = doc.revisions || [];
      return revisions.length > 0 && revisions.some(rev => rev.status === 'received');
    }).length;

    const periodicTotal = periodicDocs.length;
    const periodicReceived = periodicDocs.filter(doc => {
      const revisions = doc.revisions || [];
      return revisions.length > 0 && revisions.some(rev => rev.status === 'received');
    }).length;
    const periodicOverdue = periodicDocs.filter(doc => {
      const revisions = doc.revisions || [];
      return revisions.length === 0 || revisions.some(rev => rev.status === 'late');
    }).length;

    const total = adhocTotal + periodicTotal;
    const received = adhocReceived + periodicReceived;
    const hasDocuments = total > 0;

    res.status(200).json({
      status: 'success',
      data: {
        total,
        received,
        overdueCount: periodicOverdue,
        hasDocuments,
        details: {
          adhocTotal,
          adhocReceived,
          periodicTotal,
          periodicReceived,
          periodicOverdue
        }
      }
    });
  });

  // ============================================
  // CHECK DOCUMENT NUMBER AVAILABILITY
  // ============================================

  // @desc    Check if a document number is already used in the project
  // @route   GET /api/projects/:projectId/documents/check-number
  // @access  Private
  checkDocumentNumberAvailability = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { number, docTypeId } = req.query;

    if (!number) {
      return res.status(200).json({
        status: 'success',
        data: { available: true }
      });
    }

    const whereClause = {
      project_id: projectId,
      doc_number: number
    };

    if (docTypeId) {
      whereClause.doc_type_id = docTypeId;
    }

    const existingDoc = await ProjDoc.findOne({
      where: whereClause
    });

    res.status(200).json({
      status: 'success',
      data: {
        available: !existingDoc
      }
    });
  });

  // ============================================
  // GET PROJECT DOCUMENTS
  // ============================================

  // @desc    Get all documents for a project with optional filters
  // @route   GET /api/projects/:projectId/documents
  // @access  Private
  getProjectDocuments = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { 
      docTypeId, 
      limit = 100, 
      offset = 0,
      category,
      status
    } = req.query;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return next(new AppError('Invalid project ID format', 400));
    }

    const whereClause = { project_id: projectId };

    if (docTypeId) {
      whereClause.doc_type_id = docTypeId;
    }

    if (status) {
      whereClause.status = status;
    }

    try {
      const documents = await ProjDoc.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: DocType,
            as: 'doc_type',
            attributes: ['id', 'label', 'entity_type', 'is_periodic']
          },
          {
            model: DocRevision,
            as: 'revisions',
            required: false,
            limit: 1,
            order: [['revision', 'DESC']],
            separate: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        distinct: true
      });

      let filteredDocuments = documents.rows;
      if (category) {
        filteredDocuments = documents.rows.filter(doc => {
          const docLabel = doc.doc_type?.label || '';
          const docEntityType = doc.doc_type?.entity_type || '';
          return docLabel.toLowerCase().includes(category.toLowerCase()) || 
                 docEntityType.toLowerCase().includes(category.toLowerCase());
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          documents: filteredDocuments,
          pagination: {
            total: documents.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    } catch (error) {
      console.error('Error in getProjectDocuments:', error);
      // Return empty array on error
      res.status(200).json({
        status: 'success',
        data: {
          documents: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    }
  });
}

export default new ProjectsController();