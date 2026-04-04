// src/services/periodicReportService.js
import { PeriodicReport, ProjDoc, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class PeriodicReportService {
  // Get all periodic reports with optional filtering and pagination
  async getAllPeriodicReports(filters = {}) {
    const {
      signatory,
      template_ref,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (signatory) whereClause.signatory = signatory;
    if (template_ref) whereClause.template_ref = template_ref;

    const offset = (page - 1) * limit;

    const result = await PeriodicReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type', 'emission_policy']
        },
        {
          model: User,
          as: 'signatory_user',
          attributes: ['id', 'name', 'family_name', 'email', 'job_title']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      reports: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get periodic report by projdoc ID
  async getReportByProjdocId(projdocId) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(projdocId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    return await PeriodicReport.findOne({
      where: { projdoc_id: projdocId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type', 'emission_policy', 'revisions']
        },
        {
          model: User,
          as: 'signatory_user',
          attributes: ['id', 'name', 'family_name', 'email', 'job_title']
        }
      ]
    });
  }

  // Get periodic report by ID
  async getReportById(id) {
    return await PeriodicReport.findByPk(id, {
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type', 'emission_policy', 'revisions']
        },
        {
          model: User,
          as: 'signatory_user',
          attributes: ['id', 'name', 'family_name', 'email', 'job_title']
        }
      ]
    });
  }

  // Create periodic report
  async createPeriodicReport(reportData) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(reportData.projdoc_id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // Check if document type is periodic report
    const docType = await doc.getDoc_type();
    if (docType.entity_type !== 'report') {
      throw new AppError('Document is not a periodic report', 400);
    }

    // Check if report already exists for this document
    const existing = await PeriodicReport.findOne({
      where: { projdoc_id: reportData.projdoc_id }
    });

    if (existing) {
      throw new AppError('Periodic report already exists for this document', 400);
    }

    // Check if signatory exists (if provided)
    if (reportData.signatory) {
      const signatory = await User.findByPk(reportData.signatory);
      if (!signatory) {
        throw new AppError('Signatory not found', 404);
      }
    }

    return await PeriodicReport.create(reportData);
  }

  // Update periodic report
  async updatePeriodicReport(id, updateData) {
    const report = await PeriodicReport.findByPk(id);
    if (!report) {
      return null;
    }

    // Check if signatory exists (if updating)
    if (updateData.signatory) {
      const signatory = await User.findByPk(updateData.signatory);
      if (!signatory) {
        throw new AppError('Signatory not found', 404);
      }
    }

    const updatableFields = ['template_ref', 'signatory', 'distribution_list'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await report.update(dataToUpdate);
    return await this.getReportById(id);
  }

  // Delete periodic report
  async deletePeriodicReport(id) {
    const report = await PeriodicReport.findByPk(id);
    if (!report) {
      return null;
    }

    await report.destroy();
    return true;
  }

  // Get reports by signatory
  async getReportsBySignatory(signatoryId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    // Check if signatory exists
    const signatory = await User.findByPk(signatoryId);
    if (!signatory) {
      throw new AppError('Signatory not found', 404);
    }

    const offset = (page - 1) * limit;

    const result = await PeriodicReport.findAndCountAll({
      where: { signatory: signatoryId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      reports: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get reports by template
  async getReportsByTemplate(templateRef, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await PeriodicReport.findAndCountAll({
      where: { template_ref: templateRef },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: User,
          as: 'signatory_user',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      reports: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get reports by project
  async getReportsByProject(projectId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    // First get all projdocs for this project that are reports
    const projdocs = await ProjDoc.findAll({
      where: { project_id: projectId },
      include: [{
        model: PeriodicReport,
        as: 'report_metadata',
        required: true
      }]
    });

    const projdocIds = projdocs.map(doc => doc.id);

    const offset = (page - 1) * limit;

    const result = await PeriodicReport.findAndCountAll({
      where: { projdoc_id: { [Op.in]: projdocIds } },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['doc_type']
        },
        {
          model: User,
          as: 'signatory_user',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      reports: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }
}

export default new PeriodicReportService();