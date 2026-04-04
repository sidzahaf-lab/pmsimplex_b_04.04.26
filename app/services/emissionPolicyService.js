// backend/app/services/emissionPolicyService.js
import { EmissionPolicy, Project, EmissionPeriod, ProjDoc, PolicyDocType, DocType, DocRevision, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class EmissionPolicyService {
  // Get all emission policies with optional filtering and pagination
  async getAllEmissionPolicies(filters = {}) {
    const {
      project_id,
      frequency,
      from_date,
      to_date,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (project_id) whereClause.project_id = project_id;
    if (frequency) whereClause.frequency = frequency;
    if (from_date || to_date) {
      whereClause.anchor_date = {};
      if (from_date) whereClause.anchor_date[Op.gte] = from_date;
      if (to_date) whereClause.anchor_date[Op.lte] = to_date;
    }

    const offset = (page - 1) * limit;

    const result = await EmissionPolicy.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'planned_end_date']
        },
        {
          model: ProjDoc,
          as: 'documents',
          attributes: ['id', 'doc_number', 'title', 'status']
        },
        {
          model: DocType,
          as: 'doc_types',
          through: { attributes: [] },
          attributes: ['id', 'label', 'is_periodic', 'entity_type']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      policies: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get emission policies by project
  async getEmissionPoliciesByProject(projectId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const offset = (page - 1) * limit;

    const result = await EmissionPolicy.findAndCountAll({
      where: { project_id: projectId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'planned_end_date']
        },
        {
          model: ProjDoc,
          as: 'documents',
          attributes: ['id', 'doc_number', 'title', 'status']
        },
        {
          model: DocType,
          as: 'doc_types',
          through: { attributes: [] },
          attributes: ['id', 'label', 'is_periodic', 'entity_type']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      policies: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get emission policy by ID
  async getEmissionPolicyById(id) {
    return await EmissionPolicy.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'planned_end_date']
        },
        {
          model: ProjDoc,
          as: 'documents',
          attributes: ['id', 'doc_number', 'title', 'status']
        },
        {
          model: EmissionPeriod,
          as: 'periods',
          order: [['period_start', 'ASC']],
          separate: false
        },
        {
          model: DocType,
          as: 'doc_types',
          through: { attributes: [] },
          attributes: ['id', 'label', 'is_periodic', 'entity_type']
        }
      ]
    });
  }

  // 🔥 NEW: Get periods by policy ID (basic)
  async getPolicyPeriods(policyId) {
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const periods = await EmissionPeriod.findAll({
      where: { emission_id: policyId },
      order: [['period_start', 'ASC']]
    });

    return periods;
  }

  // 🔥 NEW: Get periods with revision status
  async getPolicyPeriodsWithStatus(policyId) {
    console.log(`📅 Getting periods with status for policy: ${policyId}`);
    
    // Check if policy exists
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    // Get all periods for this policy
    const periods = await EmissionPeriod.findAll({
      where: { emission_id: policyId },
      order: [['period_start', 'ASC']],
      raw: true
    });

    // For each period, find if there are any revisions in doc_revisions
    const periodsWithStatus = await Promise.all(
      periods.map(async (period) => {
        // Find revisions for this period
        const revisions = await DocRevision.findAll({
          where: { period_id: period.id },
          include: [
            {
              model: ProjDoc,
              as: 'document',
              attributes: ['id', 'doc_number', 'title']
            },
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'name', 'family_name', 'email']
            }
          ],
          order: [['uploaded_at', 'DESC']]
        });

        // Determine if upload is active (period is due and not received)
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = period.expected_at < today;
        const uploadActive = period.expected_at <= today && period.status !== 'received';

        // Calculate days remaining (negative if overdue)
        let daysRemaining = null;
        if (period.expected_at) {
          const dueDate = new Date(period.expected_at);
          const todayDate = new Date();
          const diffTime = dueDate.getTime() - todayDate.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          id: period.id,
          emission_id: period.emission_id,
          period_label: period.period_label,
          period_start: period.period_start,
          period_end: period.period_end,
          expected_at: period.expected_at,
          status: period.status,
          created_at: period.created_at,
          
          // Revision data
          revisions: revisions,
          has_revisions: revisions.length > 0,
          latest_revision: revisions.length > 0 ? revisions[0] : null,
          revision_count: revisions.length,
          
          // Status flags
          is_overdue: isOverdue,
          upload_active: uploadActive,
          days_remaining: daysRemaining,
          
          // Documents submitted for this period (unique projdocs)
          documents_submitted: revisions.length > 0 
            ? new Set(revisions.map(r => r.projdoc_id)).size 
            : 0
        };
      })
    );

    return periodsWithStatus;
  }

  // Get periods by policy ID (legacy method)
  async getPeriodsByPolicyId(id) {
    const policy = await EmissionPolicy.findByPk(id);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const periods = await EmissionPeriod.findAll({
      where: { emission_id: id },
      order: [['period_start', 'ASC']]
    });

    return periods;
  }

  // Create emission policy
  async createEmissionPolicy(policyData) {
    console.log('📅 EmissionPolicyService.createEmissionPolicy called with:', JSON.stringify(policyData, null, 2));
    
    // CRITICAL: Log the exact anchor_day value and type
    console.log('📦 anchor_day value:', policyData.anchor_day, 'type:', typeof policyData.anchor_day);
    
    const { doc_type_ids, periods, ...policyFields } = policyData;
    
    console.log('📦 Extracted doc_type_ids:', doc_type_ids);
    console.log('📦 Periods to create:', periods?.length || 0);

    if (policyFields.projdoc_id) {
      const document = await ProjDoc.findByPk(policyFields.projdoc_id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }
      if (!policyFields.project_id) {
        policyFields.project_id = document.project_id;
      }
    }

    if (policyFields.project_id) {
      const project = await Project.findByPk(policyFields.project_id);
      if (!project) {
        throw new AppError('Project not found', 404);
      }
    }

    // UPDATED: Validation for frequency-specific requirements with 0 for monthly
    if (policyFields.frequency === 'weekly') {
      // Weekly requires anchor_day between 1-7
      if (!policyFields.anchor_day || policyFields.anchor_day < 1 || policyFields.anchor_day > 7) {
        throw new AppError(`Anchor day must be between 1 and 7 for weekly frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
      }
    } else if (policyFields.frequency === 'monthly') {
      // Monthly can accept 0 as a special value, or null
      if (policyFields.anchor_day !== null && policyFields.anchor_day !== 0) {
        throw new AppError(`Anchor day must be null or 0 for monthly frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
      }
      // Ensure it's exactly 0 or null
      if (policyFields.anchor_day === 0) {
        // Keep as 0
        console.log('📦 Monthly policy with anchor_day = 0 (special value)');
      } else {
        policyFields.anchor_day = null;
      }
    } else if (policyFields.frequency === 'daily') {
      // Daily must have null anchor_day
      if (policyFields.anchor_day !== null) {
        throw new AppError(`Anchor day must be null for daily frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
      }
      policyFields.anchor_day = null;
    }

    const transaction = await EmissionPolicy.sequelize.transaction();
    
    try {
      // Create the policy
      const policy = await EmissionPolicy.create({
        project_id: policyFields.project_id,
        projdoc_id: policyFields.projdoc_id,
        frequency: policyFields.frequency,
        anchor_date: policyFields.anchor_date,
        anchor_day: policyFields.anchor_day,
        description: policyFields.description
      }, { transaction });

      console.log('✅ Emission policy created:', policy.id);
      console.log('✅ Anchor day saved as:', policy.anchor_day, 'type:', typeof policy.anchor_day);

      // 🔥 Créer les périodes envoyées par le frontend
      if (periods && Array.isArray(periods) && periods.length > 0) {
        console.log(`📝 Creating ${periods.length} periods from frontend data...`);
        
        const periodsToCreate = periods.map(period => ({
          id: uuidv4(),
          emission_id: policy.id,
          period_label: period.period_label,
          period_start: period.period_start,
          period_end: period.period_end,
          expected_at: period.expected_at,
          status: 'pending',
          created_at: new Date()
        }));

        const createdPeriods = await EmissionPeriod.bulkCreate(periodsToCreate, { transaction });
        console.log(`✅ Created ${createdPeriods.length} periods successfully`);
      }

      // Create policy-doc_type associations if doc_type_ids are provided
      if (doc_type_ids && Array.isArray(doc_type_ids) && doc_type_ids.length > 0) {
        console.log('📝 Creating policy-doc_type associations...');
        
        const associations = doc_type_ids.map(docTypeId => ({
          policy_id: policy.id,
          doc_type_id: docTypeId
        }));
        
        await PolicyDocType.bulkCreate(associations, { transaction });
        console.log(`✅ Created ${associations.length} policy-doc_type associations`);
      }

      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      return await this.getEmissionPolicyById(policy.id);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating emission policy:', error);
      throw error;
    }
  }

  // Update emission policy
  async updateEmissionPolicy(id, updateData) {
    console.log('📅 EmissionPolicyService.updateEmissionPolicy called with id:', id);
    console.log('📦 Update data:', JSON.stringify(updateData, null, 2));
    
    const policy = await EmissionPolicy.findByPk(id);
    if (!policy) {
      return null;
    }

    const { doc_type_ids, periods, ...policyFields } = updateData;

    // Log anchor_day for debugging
    console.log('📦 update anchor_day value:', policyFields.anchor_day, 'type:', typeof policyFields.anchor_day);

    // UPDATED: Validation for frequency-specific requirements with 0 for monthly
    if (policyFields.frequency) {
      if (policyFields.frequency === 'weekly') {
        // Weekly requires anchor_day between 1-7
        if (!policyFields.anchor_day || policyFields.anchor_day < 1 || policyFields.anchor_day > 7) {
          throw new AppError(`Anchor day must be between 1 and 7 for weekly frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
        }
      } else if (policyFields.frequency === 'monthly') {
        // Monthly can accept 0 as a special value, or null
        if (policyFields.anchor_day !== null && policyFields.anchor_day !== 0 && policyFields.anchor_day !== undefined) {
          throw new AppError(`Anchor day must be null or 0 for monthly frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
        }
        // If anchor_day is 0, keep it; if undefined, don't change; otherwise set to null
        if (policyFields.anchor_day === 0) {
          console.log('📦 Updating monthly policy with anchor_day = 0 (special value)');
        } else if (policyFields.anchor_day !== undefined) {
          policyFields.anchor_day = null;
        }
      } else if (policyFields.frequency === 'daily') {
        // Daily must have null anchor_day
        if (policyFields.anchor_day !== null && policyFields.anchor_day !== undefined) {
          throw new AppError(`Anchor day must be null for daily frequency, got: ${policyFields.anchor_day} (${typeof policyFields.anchor_day})`, 400);
        }
        if (policyFields.anchor_day !== undefined) {
          policyFields.anchor_day = null;
        }
      }
    }

    const transaction = await EmissionPolicy.sequelize.transaction();
    
    try {
      const updatableFields = ['frequency', 'anchor_date', 'anchor_day', 'description'];
      const dataToUpdate = {};
      
      Object.keys(policyFields).forEach(key => {
        if (updatableFields.includes(key) && policyFields[key] !== undefined) {
          dataToUpdate[key] = policyFields[key];
        }
      });

      console.log('📦 Data to update:', dataToUpdate);
      await policy.update(dataToUpdate, { transaction });

      // Update policy-doc_type associations if doc_type_ids are provided
      if (doc_type_ids && Array.isArray(doc_type_ids)) {
        console.log('📝 Updating policy-doc_type associations...');
        
        await PolicyDocType.destroy({
          where: { policy_id: id },
          transaction
        });
        
        if (doc_type_ids.length > 0) {
          const associations = doc_type_ids.map(docTypeId => ({
            policy_id: id,
            doc_type_id: docTypeId
          }));
          
          await PolicyDocType.bulkCreate(associations, { transaction });
          console.log(`✅ Created ${associations.length} new policy-doc_type associations`);
        }
      }

      // 🔥 Mettre à jour les périodes si fournies
      if (periods && Array.isArray(periods)) {
        console.log(`📝 Updating periods from frontend data...`);
        
        // Supprimer les anciennes périodes
        await EmissionPeriod.destroy({
          where: { emission_id: id },
          transaction
        });

        // Créer les nouvelles périodes
        if (periods.length > 0) {
          const periodsToCreate = periods.map(period => ({
            id: uuidv4(),
            emission_id: id,
            period_label: period.period_label,
            period_start: period.period_start,
            period_end: period.period_end,
            expected_at: period.expected_at,
            status: 'pending',
            created_at: new Date()
          }));

          const createdPeriods = await EmissionPeriod.bulkCreate(periodsToCreate, { transaction });
          console.log(`✅ Created ${createdPeriods.length} periods successfully`);
        }
      }

      await transaction.commit();
      console.log('✅ Update transaction committed successfully');
      
      return await this.getEmissionPolicyById(id);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating emission policy:', error);
      throw error;
    }
  }

  // Delete emission policy
  async deleteEmissionPolicy(id) {
    const policy = await EmissionPolicy.findByPk(id);
    if (!policy) {
      return null;
    }

    // Check if there are documents linked to this policy
    const documentsCount = await ProjDoc.count({
      where: { emission_id: id }
    });

    if (documentsCount > 0) {
      throw new AppError('Cannot delete policy with associated documents', 400);
    }

    const transaction = await EmissionPolicy.sequelize.transaction();
    
    try {
      await PolicyDocType.destroy({
        where: { policy_id: id },
        transaction
      });
      
      await EmissionPeriod.destroy({
        where: { emission_id: id },
        transaction
      });
      
      await policy.destroy({ transaction });
      await transaction.commit();
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 🔥 Méthode simplifiée pour recevoir les périodes du frontend
  async savePeriods(policyId, periods, transaction = null) {
    console.log(`📅 Saving ${periods.length} periods for policy ${policyId} from frontend`);

    // Supprimer les anciennes périodes
    await EmissionPeriod.destroy({
      where: { emission_id: policyId },
      transaction
    });

    if (periods.length === 0) {
      return [];
    }

    // Créer les nouvelles périodes
    const periodsToCreate = periods.map(period => ({
      id: uuidv4(),
      emission_id: policyId,
      period_label: period.period_label,
      period_start: period.period_start,
      period_end: period.period_end,
      expected_at: period.expected_at || period.due_date,
      status: 'pending',
      created_at: new Date()
    }));

    const createdPeriods = await EmissionPeriod.bulkCreate(periodsToCreate, { transaction });
    console.log(`✅ Saved ${createdPeriods.length} periods`);

    return createdPeriods;
  }

  // Generate periods for emission policy (by ID) - maintenant côté frontend
  async generatePeriods(id, customEndDate = null, transaction = null) {
    console.log('⚠️ generatePeriods should now be called from frontend');
    throw new AppError('Period generation should be done on the frontend', 400);
  }

  // Get policy statistics
  async getPolicyStats(id) {
    const policy = await EmissionPolicy.findByPk(id);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const totalPeriods = await EmissionPeriod.count({
      where: { emission_id: id }
    });

    const pendingPeriods = await EmissionPeriod.count({
      where: { 
        emission_id: id,
        status: 'pending'
      }
    });

    const receivedPeriods = await EmissionPeriod.count({
      where: { 
        emission_id: id,
        status: 'received'
      }
    });

    const latePeriods = await EmissionPeriod.count({
      where: { 
        emission_id: id,
        status: 'late'
      }
    });

    const nextPeriod = await EmissionPeriod.findOne({
      where: { 
        emission_id: id,
        status: 'pending'
      },
      order: [['expected_at', 'ASC']]
    });

    return {
      policy_id: id,
      frequency: policy.frequency,
      anchor_date: policy.anchor_date,
      anchor_day: policy.anchor_day,
      totals: {
        all: totalPeriods,
        pending: pendingPeriods,
        received: receivedPeriods,
        late: latePeriods
      },
      next_period: nextPeriod ? {
        id: nextPeriod.id,
        period_label: nextPeriod.period_label,
        expected_at: nextPeriod.expected_at,
        status: nextPeriod.status
      } : null,
      compliance_rate: totalPeriods > 0 
        ? Math.round(((receivedPeriods) / totalPeriods) * 100) 
        : 0
    };
  }

  // Get all policies with stats
  async getAllPoliciesWithStats(projectId = null) {
    const whereClause = {};
    if (projectId) whereClause.project_id = projectId;

    const policies = await EmissionPolicy.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'planned_end_date']
        },
        {
          model: ProjDoc,
          as: 'documents',
          attributes: ['id', 'doc_number', 'title', 'status']
        },
        {
          model: DocType,
          as: 'doc_types',
          through: { attributes: [] },
          attributes: ['id', 'label', 'is_periodic', 'entity_type']
        }
      ]
    });

    const policiesWithStats = await Promise.all(
      policies.map(async (policy) => {
        const stats = await this.getPolicyStats(policy.id);
        return {
          ...policy.toJSON(),
          stats
        };
      })
    );

    return policiesWithStats;
  }

  // Duplicate policy
  async duplicatePolicy(id, newProjectId = null, newDocId = null) {
    const policy = await EmissionPolicy.findByPk(id);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const docTypeAssociations = await PolicyDocType.findAll({
      where: { policy_id: id },
      attributes: ['doc_type_id']
    });
    
    const docTypeIds = docTypeAssociations.map(assoc => assoc.doc_type_id);

    const newPolicyData = {
      project_id: newProjectId || policy.project_id,
      projdoc_id: newDocId || policy.projdoc_id,
      frequency: policy.frequency,
      anchor_date: policy.anchor_date,
      anchor_day: policy.anchor_day,
      description: policy.description ? `Copy of ${policy.description}` : null
    };

    const transaction = await EmissionPolicy.sequelize.transaction();
    
    try {
      const newPolicy = await EmissionPolicy.create(newPolicyData, { transaction });
      
      if (docTypeIds.length > 0) {
        const associations = docTypeIds.map(docTypeId => ({
          policy_id: newPolicy.id,
          doc_type_id: docTypeId
        }));
        
        await PolicyDocType.bulkCreate(associations, { transaction });
      }
      
      // Note: Les périodes devront être générées côté frontend
      
      await transaction.commit();
      
      return await this.getEmissionPolicyById(newPolicy.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Validate policy configuration
  validatePolicyConfig(frequency, anchorDate, anchorDay, projectEndDate) {
    const errors = [];

    // UPDATED: Only validate against database ENUM values
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      errors.push('Frequency must be daily, weekly, or monthly');
    }

    const anchor = new Date(anchorDate);
    if (isNaN(anchor.getTime())) {
      errors.push('Anchor date must be a valid date');
    }

    const end = new Date(projectEndDate);
    if (isNaN(end.getTime())) {
      errors.push('Project end date must be a valid date');
    }

    if (!isNaN(anchor.getTime()) && !isNaN(end.getTime())) {
      if (end < anchor) {
        errors.push('Project end date must be after anchor date');
      }
    }

    // UPDATED: Validation for anchor_day with 0 for monthly
    if (frequency === 'weekly') {
      if (!anchorDay || anchorDay < 1 || anchorDay > 7) {
        errors.push('Anchor day must be between 1 (Monday) and 7 (Sunday) for weekly frequency');
      }
    } else if (frequency === 'monthly') {
      if (anchorDay !== null && anchorDay !== 0 && anchorDay !== undefined) {
        errors.push('Anchor day must be null or 0 for monthly frequency');
      }
    } else if (frequency === 'daily') {
      if (anchorDay !== null && anchorDay !== undefined) {
        errors.push('Anchor day must be null for daily frequency');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new EmissionPolicyService();