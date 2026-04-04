// src/services/emissionPeriodService.js
import { EmissionPeriod, EmissionPolicy, DocRevision, ProjDoc, Project } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

class EmissionPeriodService {
  // Get all emission periods with optional filtering and pagination
  async getAllEmissionPeriods(filters = {}) {
    const {
      emission_id,
      from_date,
      to_date,
      year,
      quarter,
      page = 1,
      limit = 10,
      sort = 'period_start',
      order = 'DESC',
      include_policy = 'true',
      include_revisions = 'false'
    } = filters;

    const whereClause = {};
    if (emission_id) whereClause.emission_id = emission_id;
    
    // Date range filters
    if (from_date || to_date) {
      whereClause.period_start = {};
      if (from_date) whereClause.period_start[Op.gte] = from_date;
      if (to_date) whereClause.period_start[Op.lte] = to_date;
    }
    
    // Year filter
    if (year) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        sequelize.where(sequelize.fn('YEAR', sequelize.col('period_start')), year)
      );
    }
    
    // Quarter filter
    if (quarter) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        sequelize.where(sequelize.fn('QUARTER', sequelize.col('period_start')), quarter)
      );
    }

    const offset = (page - 1) * limit;
    
    // Build include array dynamically
    const include = [];
    
    if (include_policy === 'true') {
      include.push({
        model: EmissionPolicy,
        as: 'policy',
        include: [{
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_id']
        }]
      });
    }
    
    if (include_revisions === 'true') {
      include.push({
        model: DocRevision,
        as: 'revisions',
        limit: 5,
        order: [['uploaded_at', 'DESC']],
        required: false,
        separate: false,
        include: [{
          model: ProjDoc,
          as: 'document',
          attributes: ['id', 'doc_number', 'title']
        }]
      });
    }

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: include.length > 0 ? include : undefined,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      subQuery: false
    });

    // Add computed properties
    const periodsWithMeta = result.rows.map(period => {
      const periodJson = period.toJSON();
      periodJson.isOverdue = this.isPeriodOverdue(period);
      periodJson.hasRevisions = periodJson.revisions && periodJson.revisions.length > 0;
      return periodJson;
    });

    return {
      periods: periodsWithMeta,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Helper method to check if period is overdue
  isPeriodOverdue(period) {
    if (!period.expected_at) return false;
    const today = new Date().toISOString().split('T')[0];
    return period.expected_at < today;
  }

  // Get overdue periods (expected_at < today)
  async getOverduePeriods(filters = {}) {
    const today = new Date().toISOString().split('T')[0];
    
    return await this.getAllEmissionPeriods({
      ...filters,
      to_date: today,
      sort: 'expected_at',
      order: 'ASC'
    });
  }

  // Get upcoming periods (expected_at >= today)
  async getUpcomingPeriods(filters = {}) {
    const { days = 30, ...restFilters } = filters;
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const whereClause = {
      expected_at: {
        [Op.between]: [today, futureDateStr]
      }
    };

    if (restFilters.emission_id) {
      whereClause.emission_id = restFilters.emission_id;
    }

    const offset = ((restFilters.page || 1) - 1) * (restFilters.limit || 10);

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: [{
        model: EmissionPolicy,
        as: 'policy',
        include: ['project']
      }],
      order: [['expected_at', 'ASC']],
      limit: parseInt(restFilters.limit || 10),
      offset: parseInt(offset)
    });

    return {
      periods: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(restFilters.page || 1),
        pages: Math.ceil(result.count / (restFilters.limit || 10)),
        limit: parseInt(restFilters.limit || 10)
      }
    };
  }

  // Get periods with revisions
  async getPeriodsWithRevisions(filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const result = await EmissionPeriod.findAndCountAll({
      include: [{
        model: DocRevision,
        as: 'revisions',
        required: true,
        limit: 1
      }],
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['period_start', 'DESC']]
    });

    return {
      periods: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get periods by policy
  async getPeriodsByPolicy(policyId, filters = {}) {
    const {
      year,
      quarter,
      from_date,
      to_date,
      page = 1,
      limit = 10,
      sort = 'period_start',
      order = 'DESC'
    } = filters;

    // Check if policy exists
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const whereClause = { emission_id: policyId };
    
    // Date range filters
    if (from_date || to_date) {
      whereClause.period_start = {};
      if (from_date) whereClause.period_start[Op.gte] = from_date;
      if (to_date) whereClause.period_start[Op.lte] = to_date;
    }
    
    // Year filter
    if (year) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        sequelize.where(sequelize.fn('YEAR', sequelize.col('period_start')), year)
      );
    }
    
    // Quarter filter
    if (quarter) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        sequelize.where(sequelize.fn('QUARTER', sequelize.col('period_start')), quarter)
      );
    }

    const offset = (page - 1) * limit;

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'frequency', 'anchor_date', 'description', 'project_id']
        },
        {
          model: DocRevision,
          as: 'revisions',
          limit: 3,
          order: [['uploaded_at', 'DESC']],
          required: false,
          separate: false,
          include: [{
            model: ProjDoc,
            as: 'document',
            attributes: ['id', 'doc_number', 'title']
          }]
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Add computed properties
    const periodsWithMeta = result.rows.map(period => {
      const periodJson = period.toJSON();
      periodJson.isOverdue = this.isPeriodOverdue(period);
      periodJson.hasRevisions = periodJson.revisions && periodJson.revisions.length > 0;
      return periodJson;
    });

    return {
      periods: periodsWithMeta,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get policy periods summary
  async getPolicyPeriodsSummary(policyId) {
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const today = new Date().toISOString().split('T')[0];

    // Get all periods
    const periods = await EmissionPeriod.findAll({
      where: { emission_id: policyId },
      order: [['period_start', 'DESC']],
      include: [{
        model: DocRevision,
        as: 'revisions',
        required: false,
        attributes: ['id', 'status']
      }]
    });

    // Calculate statistics
    const totalPeriods = periods.length;
    const periodsWithRevisions = periods.filter(p => p.revisions && p.revisions.length > 0).length;
    const overduePeriods = periods.filter(p => p.expected_at && p.expected_at < today).length;
    const upcomingPeriods = periods.filter(p => p.expected_at && p.expected_at >= today).length;

    // Get revision status counts
    let revisionsReceived = 0;
    let revisionsPending = 0;
    let revisionsLate = 0;
    
    periods.forEach(period => {
      if (period.revisions) {
        period.revisions.forEach(rev => {
          if (rev.status === 'received') revisionsReceived++;
          else if (rev.status === 'pending') revisionsPending++;
          else if (rev.status === 'late') revisionsLate++;
        });
      }
    });

    // Get the latest period
    const latestPeriod = periods[0] || null;

    // Get next expected period
    const nextExpected = await EmissionPeriod.findOne({
      where: {
        emission_id: policyId,
        expected_at: { [Op.gte]: today }
      },
      order: [['expected_at', 'ASC']]
    });

    // Calculate compliance rate (periods with at least one received revision)
    const complianceRate = totalPeriods > 0 
      ? Math.round((periodsWithRevisions / totalPeriods) * 100) 
      : 0;

    return {
      policy_id: policyId,
      total_periods: totalPeriods,
      periods_with_revisions: periodsWithRevisions,
      overdue_periods: overduePeriods,
      upcoming_periods: upcomingPeriods,
      compliance_rate: complianceRate,
      revision_stats: {
        received: revisionsReceived,
        pending: revisionsPending,
        late: revisionsLate,
        total: revisionsReceived + revisionsPending + revisionsLate
      },
      latest_period: latestPeriod ? {
        id: latestPeriod.id,
        label: latestPeriod.period_label,
        start: latestPeriod.period_start,
        end: latestPeriod.period_end,
        expected_at: latestPeriod.expected_at,
        has_revisions: latestPeriod.revisions && latestPeriod.revisions.length > 0
      } : null,
      next_expected: nextExpected ? {
        id: nextExpected.id,
        label: nextExpected.period_label,
        expected_at: nextExpected.expected_at,
        days_remaining: Math.ceil((new Date(nextExpected.expected_at) - new Date()) / (1000 * 60 * 60 * 24))
      } : null
    };
  }

  // Get period revision status (using doc_revisions status)
  async getPeriodRevisionStatus(periodId) {
    const period = await EmissionPeriod.findByPk(periodId, {
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          include: ['project']
        },
        {
          model: DocRevision,
          as: 'revisions',
          include: [{
            model: ProjDoc,
            as: 'document',
            attributes: ['id', 'doc_number', 'title', 'doc_type_id']
          }],
          order: [['uploaded_at', 'DESC']]
        }
      ]
    });

    if (!period) {
      throw new AppError('Emission period not found', 404);
    }

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = period.expected_at ? period.expected_at < today : false;

    // Determine overall period status based on revisions
    let overallStatus = 'pending';
    if (period.revisions && period.revisions.length > 0) {
      const hasReceived = period.revisions.some(r => r.status === 'received');
      const hasLate = period.revisions.some(r => r.status === 'late');
      
      if (hasReceived) {
        overallStatus = 'received';
      } else if (hasLate) {
        overallStatus = 'late';
      }
    } else if (isOverdue) {
      overallStatus = 'late';
    }

    return {
      period: {
        id: period.id,
        label: period.period_label,
        start: period.period_start,
        end: period.period_end,
        expected_at: period.expected_at,
        is_overdue: isOverdue,
        overall_status: overallStatus
      },
      policy: period.policy,
      revisions: period.revisions || [],
      revision_count: period.revisions ? period.revisions.length : 0,
      documents_submitted: period.revisions ? new Set(period.revisions.map(r => r.projdoc_id)).size : 0
    };
  }

  // Get emission period by ID
  async getEmissionPeriodById(id, options = {}) {
    const include = [
      {
        model: EmissionPolicy,
        as: 'policy',
        include: [{
          model: Project,
          as: 'project'
        }]
      }
    ];

    if (options.includeRevisions) {
      include.push({
        model: DocRevision,
        as: 'revisions',
        include: [{
          model: ProjDoc,
          as: 'document'
        }, {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'family_name']
        }],
        order: [['uploaded_at', 'DESC']]
      });
    }

    const period = await EmissionPeriod.findByPk(id, {
      include,
      ...options
    });

    if (period && options.includeRevisions) {
      const periodJson = period.toJSON();
      periodJson.isOverdue = this.isPeriodOverdue(period);
      return periodJson;
    }

    return period;
  }

  // Create emission period
  async createEmissionPeriod(periodData) {
    // Check if policy exists
    const policy = await EmissionPolicy.findByPk(periodData.emission_id);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    // Check for duplicate period label
    const existing = await EmissionPeriod.findOne({
      where: {
        emission_id: periodData.emission_id,
        period_label: periodData.period_label
      }
    });

    if (existing) {
      throw new AppError(`Period with label ${periodData.period_label} already exists`, 400);
    }

    // Validate dates
    const startDate = new Date(periodData.period_start);
    const endDate = new Date(periodData.period_end);
    
    if (endDate <= startDate) {
      throw new AppError('Period end must be after period start', 400);
    }

    // Check period duration
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 366) {
      throw new AppError('Period duration cannot exceed 366 days', 400);
    }

    const period = await EmissionPeriod.create(periodData);
    return await this.getEmissionPeriodById(period.id);
  }

  // Bulk create emission periods
  async bulkCreateEmissionPeriods(periodsData) {
    const results = [];
    const errors = [];

    for (const periodData of periodsData) {
      try {
        // Check for duplicates within the batch
        const existing = await EmissionPeriod.findOne({
          where: {
            emission_id: periodData.emission_id,
            period_label: periodData.period_label
          }
        });

        if (existing) {
          throw new Error(`Period with label ${periodData.period_label} already exists`);
        }

        const period = await EmissionPeriod.create(periodData);
        results.push(period);
      } catch (error) {
        errors.push({
          data: periodData,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      throw new AppError(`Bulk create completed with errors: ${errors.length} failures`, 207, { results, errors });
    }

    return results;
  }

  // Update emission period
  async updateEmissionPeriod(id, updateData) {
    const period = await EmissionPeriod.findByPk(id);
    if (!period) {
      return null;
    }

    // Check for duplicate period label if updating
    if (updateData.period_label && updateData.period_label !== period.period_label) {
      const existing = await EmissionPeriod.findOne({
        where: {
          emission_id: period.emission_id,
          period_label: updateData.period_label,
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        throw new AppError(`Period with label ${updateData.period_label} already exists`, 400);
      }
    }

    // Validate dates if both are provided
    const periodStart = updateData.period_start || period.period_start;
    const periodEnd = updateData.period_end || period.period_end;
    
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    if (endDate <= startDate) {
      throw new AppError('Period end must be after period start', 400);
    }

    // Check period duration
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 366) {
      throw new AppError('Period duration cannot exceed 366 days', 400);
    }

    const updatableFields = ['period_label', 'period_start', 'period_end', 'expected_at'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await period.update(dataToUpdate);
    return await this.getEmissionPeriodById(id, { includeRevisions: true });
  }

  // Delete emission period
  async deleteEmissionPeriod(id) {
    const period = await EmissionPeriod.findByPk(id);
    if (!period) {
      return null;
    }

    // Check if there are associated revisions
    const revisionsCount = await DocRevision.count({
      where: { period_id: id }
    });

    if (revisionsCount > 0) {
      throw new AppError('Cannot delete period with existing revisions', 400);
    }

    await period.destroy();
    return true;
  }

  // Get periods by date range
  async getPeriodsByDateRange(startDate, endDate, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {
      period_start: { [Op.gte]: startDate },
      period_end: { [Op.lte]: endDate }
    };

    if (filters.emission_id) {
      whereClause.emission_id = filters.emission_id;
    }

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: [{
        model: EmissionPolicy,
        as: 'policy',
        include: ['project']
      }],
      order: [['period_start', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      periods: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get periods by year
  async getPeriodsByYear(year, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.and]: [
        sequelize.where(sequelize.fn('YEAR', sequelize.col('period_start')), year)
      ]
    };

    if (filters.emission_id) {
      whereClause.emission_id = filters.emission_id;
    }

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: [{
        model: EmissionPolicy,
        as: 'policy',
        include: ['project']
      }],
      order: [['period_start', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      periods: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get periods by year and quarter
  async getPeriodsByYearAndQuarter(year, quarter, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.and]: [
        sequelize.where(sequelize.fn('YEAR', sequelize.col('period_start')), year),
        sequelize.where(sequelize.fn('QUARTER', sequelize.col('period_start')), quarter)
      ]
    };

    if (filters.emission_id) {
      whereClause.emission_id = filters.emission_id;
    }

    const result = await EmissionPeriod.findAndCountAll({
      where: whereClause,
      include: [{
        model: EmissionPolicy,
        as: 'policy',
        include: ['project']
      }],
      order: [['period_start', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      periods: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get period statistics
  async getPeriodStatistics(filters = {}) {
    const { policy_id, from_date, to_date, year } = filters;

    const whereClause = {};
    
    if (policy_id) whereClause.emission_id = policy_id;
    
    if (from_date || to_date) {
      whereClause.period_start = {};
      if (from_date) whereClause.period_start[Op.gte] = from_date;
      if (to_date) whereClause.period_start[Op.lte] = to_date;
    }
    
    if (year) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        sequelize.where(sequelize.fn('YEAR', sequelize.col('period_start')), year)
      );
    }

    // Total periods
    const total = await EmissionPeriod.count({ where: whereClause });
    
    // Overdue periods (expected_at < today)
    const today = new Date().toISOString().split('T')[0];
    const overdue = await EmissionPeriod.count({
      where: {
        ...whereClause,
        expected_at: { [Op.lt]: today }
      }
    });

    // Upcoming periods (expected_at >= today)
    const upcoming = await EmissionPeriod.count({
      where: {
        ...whereClause,
        expected_at: { [Op.gte]: today }
      }
    });

    // Periods with no expected date
    const noExpectedDate = await EmissionPeriod.count({
      where: {
        ...whereClause,
        expected_at: null
      }
    });

    // Periods with revisions
    const periodsWithRevisions = await EmissionPeriod.count({
      where: whereClause,
      include: [{
        model: DocRevision,
        as: 'revisions',
        required: true,
        attributes: []
      }],
      distinct: true
    });

    // Statistics by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const byMonth = await EmissionPeriod.findAll({
      where: {
        ...whereClause,
        period_start: { [Op.gte]: twelveMonthsAgo }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('period_start'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal(`SUM(CASE WHEN expected_at < CURDATE() THEN 1 ELSE 0 END)`), 'overdue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('period_start'), '%Y-%m')],
      order: [[sequelize.literal('month'), 'DESC']]
    });

    return {
      total,
      overdue,
      upcoming,
      no_expected_date: noExpectedDate,
      periods_with_revisions: periodsWithRevisions,
      compliance_rate: total > 0 ? Math.round((periodsWithRevisions / total) * 100) : 0,
      monthly: byMonth.map(m => ({
        month: m.dataValues.month,
        total: parseInt(m.dataValues.total),
        overdue: parseInt(m.dataValues.overdue || 0)
      }))
    };
  }

  // Check and update compliance (cron job)
  async checkAndUpdateCompliance(dryRun = false) {
    const today = new Date().toISOString().split('T')[0];

    // Find all periods that are overdue (expected_at < today)
    const overduePeriods = await EmissionPeriod.findAll({
      where: {
        expected_at: { [Op.lt]: today }
      },
      include: [{
        model: DocRevision,
        as: 'revisions',
        required: false
      }]
    });

    const results = {
      checked: overduePeriods.length,
      overdue_without_revisions: 0,
      overdue_with_revisions: 0,
      periods: []
    };

    for (const period of overduePeriods) {
      const hasRevisions = period.revisions && period.revisions.length > 0;
      
      if (!hasRevisions) {
        results.overdue_without_revisions++;
      } else {
        results.overdue_with_revisions++;
      }

      results.periods.push({
        id: period.id,
        label: period.period_label,
        expected_at: period.expected_at,
        has_revisions: hasRevisions,
        revision_count: period.revisions ? period.revisions.length : 0
      });
    }

    // If not dry run, you could perform actions here (like sending notifications)
    if (!dryRun) {
      // Send notifications for overdue periods without revisions
      // This would integrate with your notification service
      console.log(`Found ${results.overdue_without_revisions} overdue periods without revisions`);
    }

    return results;
  }

  // Find period by label and policy
  async findPeriodByLabel(policyId, label) {
    return await EmissionPeriod.findOne({
      where: {
        emission_id: policyId,
        period_label: label
      }
    });
  }
}

export default new EmissionPeriodService();