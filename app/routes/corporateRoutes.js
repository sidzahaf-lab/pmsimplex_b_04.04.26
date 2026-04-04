// app/routes/corporateRoutes.js
import express from 'express';
import { protect } from '../middleware/authJwt.js';
import {
  requireCorporatePermission,
  requireCorporateDashboard,
  requireCorporateReports,
  requireCorporateAudit,
  requireCorporatePolicyManage,
  requireCorporateCrossBUView
} from '../middleware/permissionMiddleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';
import { User, Project, BusinessUnit, Role, Team, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// ============================================
// TOUTES LES ROUTES CORPORATE NÉCESSITENT AUTHENTIFICATION
// ============================================
router.use(protect);

// ============================================
// DASHBOARD CORPORATE
// ============================================

/**
 * @route   GET /api/corporate/dashboard
 * @desc    Vue d'ensemble pour les rôles corporate
 * @access  Private (Corporate roles only)
 */
router.get('/dashboard', 
  requireCorporateDashboard(),
  asyncHandler(async (req, res, next) => {
    try {
      // Statistiques globales
      const [
        totalProjects,
        totalBusinessUnits,
        totalUsers,
        totalRoles,
        activeProjects,
        completedProjects
      ] = await Promise.all([
        Project.count(),
        BusinessUnit.count(),
        User.count(),
        Role.count(),
        Project.count({ where: { status: 'EXECUTION' } }),
        Project.count({ where: { status: 'COMPLETED' } })
      ]);

      // Projets récents (toutes BUs)
      const recentProjects = await Project.findAll({
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: BusinessUnit,
            as: 'business_unit',
            attributes: ['id', 'name']
          }
        ],
        attributes: ['id', 'code', 'name', 'status', 'start_date', 'finish_date', 'created_at']
      });

      // Business units avec compteurs
      const businessUnitsWithCounts = await BusinessUnit.findAll({
        attributes: ['id', 'name', 'type'],
        include: [
          {
            model: Project,
            as: 'projects',
            attributes: ['id'],
            required: false
          },
          {
            model: User,
            as: 'users',
            attributes: ['id'],
            required: false
          }
        ]
      });

      // Formater les données
      const businessUnitsSummary = businessUnitsWithCounts.map(bu => ({
        id: bu.id,
        name: bu.name,
        type: bu.type,
        projectsCount: bu.projects?.length || 0,
        usersCount: bu.users?.length || 0
      }));

      // Statistiques des utilisateurs par rôle
      const userStats = {
        total: totalUsers,
        superAdmins: await User.count({ where: { is_super_admin: true } }),
        guests: await User.count({ where: { is_guest: true } }),
        active: await User.count({ where: { is_active: true } })
      };

      // Statistiques des rôles corporate
      const corporateRoles = await Role.findAll({
        where: { scope: 'corporate' },
        attributes: ['id', 'name'],
        include: [{
          model: User,
          as: 'corporate_users',
          attributes: ['id'],
          required: false
        }]
      });

      const corporateRolesSummary = corporateRoles.map(role => ({
        id: role.id,
        name: role.name,
        usersCount: role.corporate_users?.length || 0
      }));

      res.status(200).json({
        status: 'success',
        data: {
          overview: {
            totalProjects,
            totalBusinessUnits,
            totalUsers,
            totalRoles,
            activeProjects,
            completedProjects,
            completionRate: totalProjects > 0 
              ? Math.round((completedProjects / totalProjects) * 100) 
              : 0
          },
          userStats,
          recentProjects,
          businessUnits: businessUnitsSummary,
          corporateRoles: corporateRolesSummary,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching corporate dashboard:', error);
      return next(new AppError('Failed to fetch dashboard data', 500));
    }
  })
);

// ============================================
// RAPPORTS CORPORATE
// ============================================

/**
 * @route   GET /api/corporate/reports
 * @desc    Générer des rapports corporate
 * @access  Private (Corporate roles only)
 */
router.get('/reports',
  requireCorporateReports(),
  asyncHandler(async (req, res, next) => {
    try {
      const { type, startDate, endDate, businessUnitId } = req.query;
      
      // Construire la condition de date
      const dateCondition = {};
      if (startDate) dateCondition[Op.gte] = new Date(startDate);
      if (endDate) dateCondition[Op.lte] = new Date(endDate);
      
      const whereClause = {};
      if (Object.keys(dateCondition).length > 0) {
        whereClause.created_at = dateCondition;
      }
      if (businessUnitId) {
        whereClause.business_unit_id = businessUnitId;
      }
      
      let reportData = {};
      
      switch (type) {
        case 'projects':
          // Rapport des projets
          const projects = await Project.findAll({
            where: whereClause,
            include: [
              {
                model: BusinessUnit,
                as: 'business_unit',
                attributes: ['id', 'name']
              },
              {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'family_name']
              }
            ],
            order: [['created_at', 'DESC']]
          });
          
          reportData = {
            type: 'projects',
            count: projects.length,
            projects: projects.map(p => ({
              id: p.id,
              code: p.code,
              name: p.name,
              status: p.status,
              businessUnit: p.business_unit?.name,
              startDate: p.start_date,
              finishDate: p.finish_date,
              createdAt: p.created_at,
              createdBy: p.creator ? `${p.creator.name} ${p.creator.family_name}` : null
            }))
          };
          break;
          
        case 'users':
          // Rapport des utilisateurs
          const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password_hash'] },
            include: [
              {
                model: BusinessUnit,
                as: 'business_unit',
                attributes: ['id', 'name']
              },
              {
                model: Role,
                as: 'corporate_role',
                attributes: ['name']
              },
              {
                model: Role,
                as: 'default_role',
                attributes: ['name']
              }
            ],
            order: [['created_at', 'DESC']]
          });
          
          reportData = {
            type: 'users',
            count: users.length,
            users: users.map(u => ({
              id: u.id,
              username: u.username,
              email: u.email,
              name: `${u.name} ${u.family_name}`,
              jobTitle: u.job_title,
              businessUnit: u.business_unit?.name,
              corporateRole: u.corporate_role?.name,
              defaultRole: u.default_role?.name,
              isActive: u.is_active,
              createdAt: u.created_at
            }))
          };
          break;
          
        case 'business-units':
          // Rapport des business units
          const businessUnits = await BusinessUnit.findAll({
            where: whereClause,
            include: [
              {
                model: Project,
                as: 'projects',
                attributes: ['id']
              },
              {
                model: User,
                as: 'users',
                attributes: ['id']
              }
            ]
          });
          
          reportData = {
            type: 'business-units',
            count: businessUnits.length,
            businessUnits: businessUnits.map(bu => ({
              id: bu.id,
              name: bu.name,
              type: bu.type,
              projectsCount: bu.projects?.length || 0,
              usersCount: bu.users?.length || 0,
              createdAt: bu.created_at
            }))
          };
          break;
          
        default:
          // Rapport complet
          const [
            allProjects,
            allUsers,
            allBusinessUnits,
            allRoles
          ] = await Promise.all([
            Project.findAll({ where: whereClause }),
            User.findAll({ 
              where: whereClause,
              attributes: { exclude: ['password_hash'] }
            }),
            BusinessUnit.findAll({ where: whereClause }),
            Role.findAll()
          ]);
          
          reportData = {
            type: 'full',
            summary: {
              totalProjects: allProjects.length,
              totalUsers: allUsers.length,
              totalBusinessUnits: allBusinessUnits.length,
              totalRoles: allRoles.length
            },
            generatedAt: new Date().toISOString(),
            filters: { startDate, endDate, businessUnitId }
          };
      }
      
      res.status(200).json({
        status: 'success',
        data: reportData
      });
    } catch (error) {
      console.error('Error generating corporate report:', error);
      return next(new AppError('Failed to generate report', 500));
    }
  })
);

// ============================================
// AUDIT LOGS CORPORATE
// ============================================

/**
 * @route   GET /api/corporate/audit
 * @desc    Voir les logs d'audit (sessions, actions)
 * @access  Private (Corporate roles only)
 */
router.get('/audit',
  requireCorporateAudit(),
  asyncHandler(async (req, res, next) => {
    try {
      const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      
      // Construire la condition
      const whereClause = {};
      if (userId) whereClause.user_id = userId;
      if (startDate) whereClause.created_at = { [Op.gte]: new Date(startDate) };
      if (endDate) whereClause.created_at = { [Op.lte]: new Date(endDate) };
      
      // Récupérer les sessions récentes (logins)
      const sessions = await Session.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'name', 'family_name']
        }]
      });
      
      // Statistiques d'audit
      const activeSessionsCount = await Session.count({
        where: {
          revoked: false,
          expires_at: { [Op.gt]: new Date() }
        }
      });
      
      const revokedSessionsCount = await Session.count({
        where: { revoked: true }
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          sessions: sessions.rows,
          pagination: {
            total: sessions.count,
            page: parseInt(page),
            totalPages: Math.ceil(sessions.count / limit),
            limit: parseInt(limit)
          },
          statistics: {
            activeSessions: activeSessionsCount,
            revokedSessions: revokedSessionsCount,
            totalSessions: sessions.count
          }
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return next(new AppError('Failed to fetch audit logs', 500));
    }
  })
);

// ============================================
// GESTION DES POLITIQUES CORPORATE
// ============================================

/**
 * @route   GET /api/corporate/policies
 * @desc    Liste des politiques corporate
 * @access  Private (Corporate roles with policy management)
 */
router.get('/policies',
  requireCorporatePolicyManage(),
  asyncHandler(async (req, res, next) => {
    try {
      // Récupérer les politiques d'émission (exemple)
      const policies = await EmissionPolicy.findAll({
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'code', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          policies,
          count: policies.length
        }
      });
    } catch (error) {
      console.error('Error fetching corporate policies:', error);
      return next(new AppError('Failed to fetch policies', 500));
    }
  })
);

/**
 * @route   POST /api/corporate/policies
 * @desc    Créer une nouvelle politique corporate
 * @access  Private (Corporate roles with policy management)
 */
router.post('/policies',
  requireCorporatePolicyManage(),
  asyncHandler(async (req, res, next) => {
    try {
      const policyData = req.body;
      
      // Validation basique
      if (!policyData.name || !policyData.type) {
        return next(new AppError('Name and type are required', 400));
      }
      
      const newPolicy = await EmissionPolicy.create({
        ...policyData,
        created_by: req.user.id,
        created_at: new Date()
      });
      
      res.status(201).json({
        status: 'success',
        data: { policy: newPolicy }
      });
    } catch (error) {
      console.error('Error creating corporate policy:', error);
      return next(new AppError('Failed to create policy', 500));
    }
  })
);

// ============================================
// VUE CROSS-BU (tous les projets)
// ============================================

/**
 * @route   GET /api/corporate/cross-bu/projects
 * @desc    Voir tous les projets de toutes les BUs
 * @access  Private (Corporate roles with cross-BU view)
 */
router.get('/cross-bu/projects',
  requireCorporateCrossBUView(),
  asyncHandler(async (req, res, next) => {
    try {
      const { status, businessUnitId, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (businessUnitId) whereClause.business_unit_id = businessUnitId;
      
      const projects = await Project.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: BusinessUnit,
            as: 'business_unit',
            attributes: ['id', 'name', 'type']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'family_name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Statistiques par BU
      const projectsByBU = await Project.findAll({
        attributes: [
          'business_unit_id',
          [sequelize.fn('COUNT', sequelize.col('business_unit_id')), 'count']
        ],
        group: ['business_unit_id'],
        include: [{
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['name']
        }]
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          projects: projects.rows,
          pagination: {
            total: projects.count,
            page: parseInt(page),
            totalPages: Math.ceil(projects.count / limit),
            limit: parseInt(limit)
          },
          statistics: {
            total: projects.count,
            byBusinessUnit: projectsByBU
          }
        }
      });
    } catch (error) {
      console.error('Error fetching cross-BU projects:', error);
      return next(new AppError('Failed to fetch projects', 500));
    }
  })
);

/**
 * @route   GET /api/corporate/cross-bu/users
 * @desc    Voir tous les utilisateurs de toutes les BUs
 * @access  Private (Corporate roles with cross-BU view)
 */
router.get('/cross-bu/users',
  requireCorporateCrossBUView(),
  asyncHandler(async (req, res, next) => {
    try {
      const { businessUnitId, roleScope, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (businessUnitId) whereClause.business_unit_id = businessUnitId;
      
      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password_hash'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: BusinessUnit,
            as: 'business_unit',
            attributes: ['id', 'name']
          },
          {
            model: Role,
            as: 'corporate_role',
            attributes: ['id', 'name', 'scope']
          },
          {
            model: Role,
            as: 'default_role',
            attributes: ['id', 'name', 'scope']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          users: users.rows,
          pagination: {
            total: users.count,
            page: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching cross-BU users:', error);
      return next(new AppError('Failed to fetch users', 500));
    }
  })
);

// ============================================
// STATISTIQUES AVANCÉES
// ============================================

/**
 * @route   GET /api/corporate/statistics
 * @desc    Statistiques avancées pour les rôles corporate
 * @access  Private (Corporate roles only)
 */
router.get('/statistics',
  requireCorporatePermission(PERMISSIONS.CORPORATE_DASHBOARD_VIEW),
  asyncHandler(async (req, res, next) => {
    try {
      const [
        totalUsers,
        activeUsers,
        superAdmins,
        guests,
        totalProjects,
        activeProjects,
        completedProjects,
        totalBusinessUnits,
        totalRoles
      ] = await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_super_admin: true } }),
        User.count({ where: { is_guest: true } }),
        Project.count(),
        Project.count({ where: { status: 'EXECUTION' } }),
        Project.count({ where: { status: 'COMPLETED' } }),
        BusinessUnit.count(),
        Role.count()
      ]);
      
      // Évolution mensuelle des utilisateurs
      const monthlyUsers = await User.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
        limit: 12
      });
      
      // Évolution mensuelle des projets
      const monthlyProjects = await Project.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
        limit: 12
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          current: {
            users: { total: totalUsers, active: activeUsers, superAdmins, guests },
            projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
            businessUnits: totalBusinessUnits,
            roles: totalRoles
          },
          trends: {
            users: monthlyUsers,
            projects: monthlyProjects
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching corporate statistics:', error);
      return next(new AppError('Failed to fetch statistics', 500));
    }
  })
);

export default router;