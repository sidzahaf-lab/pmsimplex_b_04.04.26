// src/services/schdlBaselineService.js
import { SchdlBaseline, ProjDoc, User, SchdlCurrent } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

class SchdlBaselineService {
  // Get all baselines with optional filtering and pagination
  async getAllBaselines(filters = {}) {
    const {
      approved_by,
      from_date,
      to_date,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (approved_by) whereClause.approved_by = approved_by;
    if (from_date || to_date) {
      whereClause.frozen_at = {};
      if (from_date) whereClause.frozen_at[Op.gte] = from_date;
      if (to_date) whereClause.frozen_at[Op.lte] = to_date;
    }

    const offset = (page - 1) * limit;

    const result = await SchdlBaseline.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'family_name', 'email']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      baselines: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get baseline by projdoc ID
  async getBaselineByProjdocId(projdocId) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(projdocId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    return await SchdlBaseline.findOne({
      where: { projdoc_id: projdocId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'family_name', 'email']
        },
        {
          model: SchdlCurrent,
          as: 'current_schedules',
          include: ['document']
        }
      ]
    });
  }

  // Get baseline by ID
  async getBaselineById(id) {
    return await SchdlBaseline.findByPk(id, {
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'family_name', 'email']
        },
        {
          model: SchdlCurrent,
          as: 'current_schedules',
          include: ['document']
        }
      ]
    });
  }

  // Create baseline
  async createBaseline(baselineData) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(baselineData.projdoc_id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // Check if document type is schedule baseline
    const docType = await doc.getDoc_type();
    if (docType.entity_type !== 'schedule_baseline') {
      throw new AppError('Document is not a schedule baseline', 400);
    }

    // Check if baseline already exists for this document
    const existing = await SchdlBaseline.findOne({
      where: { projdoc_id: baselineData.projdoc_id }
    });

    if (existing) {
      throw new AppError('Baseline already exists for this document', 400);
    }

    // Check if approver exists (if provided)
    if (baselineData.approved_by) {
      const approver = await User.findByPk(baselineData.approved_by);
      if (!approver) {
        throw new AppError('Approver not found', 404);
      }
    }

    return await SchdlBaseline.create(baselineData);
  }

  // Update baseline
  async updateBaseline(id, updateData) {
    const baseline = await SchdlBaseline.findByPk(id);
    if (!baseline) {
      return null;
    }

    // Check if approver exists (if updating)
    if (updateData.approved_by) {
      const approver = await User.findByPk(updateData.approved_by);
      if (!approver) {
        throw new AppError('Approver not found', 404);
      }
    }

    const updatableFields = ['frozen_at', 'approved_by', 'contract_ref'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await baseline.update(dataToUpdate);
    return await this.getBaselineById(id);
  }

  // Delete baseline
  async deleteBaseline(id) {
    const baseline = await SchdlBaseline.findByPk(id);
    if (!baseline) {
      return null;
    }

    // Check if there are associated current schedules
    const schedulesCount = await SchdlCurrent.count({
      where: { baseline_projdoc_id: baseline.projdoc_id }
    });

    if (schedulesCount > 0) {
      throw new AppError('Cannot delete baseline with existing current schedules', 400);
    }

    await baseline.destroy();
    return true;
  }

  // Get current schedules using this baseline
  async getCurrentSchedules(id) {
    const baseline = await SchdlBaseline.findByPk(id);
    if (!baseline) {
      throw new AppError('Baseline not found', 404);
    }

    return await SchdlCurrent.findAll({
      where: { baseline_projdoc_id: baseline.projdoc_id },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        }
      ]
    });
  }

  // Get baselines by approver
  async getBaselinesByApprover(approverId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await SchdlBaseline.findAndCountAll({
      where: { approved_by: approverId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      baselines: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }
}

export default new SchdlBaselineService();