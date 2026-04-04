// src/services/schdlCurrentService.js
import { SchdlCurrent, ProjDoc, SchdlBaseline } from '../models/index.js';
import AppError from '../utils/appError.js';

class SchdlCurrentService {
  // Get all current schedules with optional filtering and pagination
  async getAllCurrentSchedules(filters = {}) {
    const {
      baseline_projdoc_id,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (baseline_projdoc_id) whereClause.baseline_projdoc_id = baseline_projdoc_id;

    const offset = (page - 1) * limit;

    const result = await SchdlCurrent.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: SchdlBaseline,
          as: 'baseline',
          include: ['document', 'approver']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      schedules: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get current schedule by projdoc ID
  async getCurrentByProjdocId(projdocId) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(projdocId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    return await SchdlCurrent.findOne({
      where: { projdoc_id: projdocId },
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: SchdlBaseline,
          as: 'baseline',
          include: ['document', 'approver']
        }
      ]
    });
  }

  // Get current schedule by ID
  async getCurrentById(id) {
    return await SchdlCurrent.findByPk(id, {
      include: [
        {
          model: ProjDoc,
          as: 'document',
          include: ['project', 'doc_type']
        },
        {
          model: SchdlBaseline,
          as: 'baseline',
          include: ['document', 'approver']
        }
      ]
    });
  }

  // Create current schedule
  async createCurrentSchedule(currentData) {
    // Check if document exists
    const doc = await ProjDoc.findByPk(currentData.projdoc_id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // Check if document type is schedule current
    const docType = await doc.getDoc_type();
    if (docType.entity_type !== 'schedule_current') {
      throw new AppError('Document is not a current schedule', 400);
    }

    // Check if current schedule already exists for this document
    const existing = await SchdlCurrent.findOne({
      where: { projdoc_id: currentData.projdoc_id }
    });

    if (existing) {
      throw new AppError('Current schedule already exists for this document', 400);
    }

    // Check if baseline exists
    const baseline = await SchdlBaseline.findOne({
      where: { projdoc_id: currentData.baseline_projdoc_id }
    });

    if (!baseline) {
      throw new AppError('Baseline not found', 404);
    }

    return await SchdlCurrent.create(currentData);
  }

  // Update current schedule
  async updateCurrentSchedule(id, updateData) {
    const current = await SchdlCurrent.findByPk(id);
    if (!current) {
      return null;
    }

    // Check if new baseline exists (if updating)
    if (updateData.baseline_projdoc_id) {
      const baseline = await SchdlBaseline.findOne({
        where: { projdoc_id: updateData.baseline_projdoc_id }
      });

      if (!baseline) {
        throw new AppError('Baseline not found', 404);
      }
    }

    const updatableFields = ['baseline_projdoc_id'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await current.update(dataToUpdate);
    return await this.getCurrentById(id);
  }

  // Delete current schedule
  async deleteCurrentSchedule(id) {
    const current = await SchdlCurrent.findByPk(id);
    if (!current) {
      return null;
    }

    await current.destroy();
    return true;
  }

  // Get baseline for current schedule
  async getBaseline(id) {
    const current = await SchdlCurrent.findByPk(id);
    if (!current) {
      throw new AppError('Current schedule not found', 404);
    }

    return await SchdlBaseline.findOne({
      where: { projdoc_id: current.baseline_projdoc_id },
      include: ['document', 'approver']
    });
  }

  // Get current schedules by baseline
  async getByBaseline(baselineProjdocId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await SchdlCurrent.findAndCountAll({
      where: { baseline_projdoc_id: baselineProjdocId },
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
      schedules: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }
}

export default new SchdlCurrentService();