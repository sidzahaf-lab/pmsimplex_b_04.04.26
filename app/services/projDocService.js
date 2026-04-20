// backend/app/services/projDocService.js
import { ProjDoc, Project, DocType, EmissionPolicy, EmissionPeriod, DocRevision, User, DocSubcategory, DocCategory, sequelize } from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import { ENTITY_TABLE_MAP } from '../config/entityTableMap.js';
import emissionPolicyService from './emissionPolicyService.js';
import { generatePeriodsFromPolicy } from '../utils/periodGenerator.js';
import { v4 as uuidv4 } from 'uuid';

class projDocService {
  // Get all project documents with optional filtering and pagination
  async getAllProjDocs(filters = {}) {
    const {
      project_id,
      doc_type_id,
      status,
      is_periodic,
      search,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (project_id) whereClause.project_id = project_id;
    if (doc_type_id) whereClause.doc_type_id = doc_type_id;
    if (status) whereClause.status = status;
    if (is_periodic === 'true') {
      whereClause.emission_id = { [Op.ne]: null };
    } else if (is_periodic === 'false') {
      whereClause.emission_id = null;
    }
    if (search) {
      whereClause[Op.or] = [
        { doc_number: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const result = await ProjDoc.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'health_status']
        },
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
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: EmissionPolicy,
          as: 'emission_policy',
          required: false
        },
        {
          model: DocRevision,
          as: 'revisions',
          limit: 1,
          order: [['revision', 'DESC']],
          separate: false,
          include: ['uploader']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Transformer pour avoir latest_revision directement accessible
    const docs = result.rows.map(doc => {
      const docJson = doc.toJSON();
      // Extract category and subcategory from nested relations
      const category = docJson.doc_type?.subcategory?.category?.label || 'Autre';
      const subcategory = docJson.doc_type?.subcategory?.label || null;
      
      return {
        ...docJson,
        category,
        subcategory,
        latest_revision: docJson.revisions?.[0] || null
      };
    });

    return {
      docs: docs,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get documents by project
  async getDocsByProject(projectId, filters = {}) {
    const {
      doc_type_id,
      status,
      is_periodic,
      search,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const whereClause = { project_id: projectId };
    if (doc_type_id) whereClause.doc_type_id = doc_type_id;
    if (status) whereClause.status = status;
    if (is_periodic === 'true') {
      whereClause.emission_id = { [Op.ne]: null };
    } else if (is_periodic === 'false') {
      whereClause.emission_id = null;
    }
    if (search) {
      whereClause[Op.or] = [
        { doc_number: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const result = await ProjDoc.findAndCountAll({
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
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: EmissionPolicy,
          as: 'emission_policy',
          required: false
        },
        {
          model: DocRevision,
          as: 'revisions',
          limit: 1,
          order: [['revision', 'DESC']],
          separate: false,
          include: ['uploader']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Transformer pour avoir latest_revision directement accessible et ajouter category/subcategory
    const docs = result.rows.map(doc => {
      const docJson = doc.toJSON();
      // Extract category and subcategory from nested relations
      const category = docJson.doc_type?.subcategory?.category?.label || 'Autre';
      const subcategory = docJson.doc_type?.subcategory?.label || null;
      
      return {
        ...docJson,
        category,
        subcategory,
        latest_revision: docJson.revisions?.[0] || null
      };
    });

    return {
      docs: docs,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get document by ID
  async getProjDocById(id) {
    const doc = await ProjDoc.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code', 'health_status']
        },
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
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: EmissionPolicy,
          as: 'emission_policy',
          include: ['periods']
        },
        {
          model: DocRevision,
          as: 'revisions',
          order: [['revision', 'DESC']],
          include: ['uploader']
        }
      ]
    });

    if (doc) {
      const docJson = doc.toJSON();
      const category = docJson.doc_type?.subcategory?.category?.label || 'Autre';
      const subcategory = docJson.doc_type?.subcategory?.label || null;
      
      return {
        ...docJson,
        category,
        subcategory,
        latest_revision: docJson.revisions?.[0] || null
      };
    }
    
    return null;
  }

  // Get document by document number
  async getDocByNumber(projectId, docNumber) {
    const doc = await ProjDoc.findOne({
      where: {
        project_id: projectId,
        doc_number: docNumber
      },
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
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: EmissionPolicy,
          as: 'emission_policy'
        },
        {
          model: DocRevision,
          as: 'revisions',
          limit: 1,
          order: [['revision', 'DESC']]
        }
      ]
    });

    if (doc) {
      const docJson = doc.toJSON();
      const category = docJson.doc_type?.subcategory?.category?.label || 'Autre';
      const subcategory = docJson.doc_type?.subcategory?.label || null;
      
      return {
        ...docJson,
        category,
        subcategory,
        latest_revision: docJson.revisions?.[0] || null
      };
    }
    
    return null;
  }

  // Check document number availability (legacy - kept for backward compatibility)
  async checkDocNumberAvailability(projectId, docNumber) {
    console.log(`⚠️ Warning: Using project-specific check for ${docNumber}. Use checkDocNumberAvailabilityGlobally instead.`);
    return this.checkDocNumberAvailabilityGlobally(docNumber);
  }

  // NEW: Check document number globally across ALL projects
  async checkDocNumberAvailabilityGlobally(docNumber) {
    const existing = await ProjDoc.findOne({
      where: {
        doc_number: docNumber.trim() // No project_id filter - checks ALL projects
      }
    });

    return !existing;
  }

  // Create document (supports both ad-hoc and periodic)
  async createProjDoc(docData, entityMeta = null, periodicData = null) {
    console.log('\n📝 projDocService.createProjDoc called');
    console.log('  docData:', JSON.stringify(docData, null, 2));
    console.log('  entityMeta:', JSON.stringify(entityMeta, null, 2));
    console.log('  periodicData:', JSON.stringify(periodicData, null, 2));

    // Check if project exists
    const project = await Project.findByPk(docData.project_id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if document type exists with category and subcategory
    const docType = await DocType.findByPk(docData.doc_type_id, {
      include: [
        {
          model: DocSubcategory,
          as: 'subcategory',
          include: [
            {
              model: DocCategory,
              as: 'category'
            }
          ]
        }
      ]
    });
    
    if (!docType) {
      throw new AppError('Document type not found', 404);
    }

    // Extract category and subcategory from docType
    const category = docType.subcategory?.category?.label || 'Autre';
    const subcategory = docType.subcategory?.label || null;
    
    console.log(`📋 Category extracted: ${category}`);
    console.log(`📋 Subcategory extracted: ${subcategory}`);

    // Check uniqueness of doc_number GLOBALLY (across ALL projects)
    const existing = await ProjDoc.findOne({
      where: {
        doc_number: docData.doc_number // Remove project_id filter!
      }
    });

    if (existing) {
      throw new AppError(`Document number ${docData.doc_number} already exists in another project`, 400);
    }

    // Check only_one_per_project constraint
    if (docType.only_one_per_project) {
      const existingUnique = await ProjDoc.findOne({
        where: {
          project_id: docData.project_id,
          doc_type_id: docData.doc_type_id
        }
      });

      if (existingUnique) {
        throw new AppError('Only one document of this type is allowed per project', 400);
      }
    }

    // 🔥 CORRECTION: Déterminer si c'est un document périodique
    // Un document est périodique si:
    // 1. Le type de document est marqué comme périodique (docType.is_periodic = true)
    // 2. ET (soit periodicData est fourni, soit emission_id est déjà dans docData)
    const hasEmissionPolicy = !!(docData.emission_id || periodicData);
    const isPeriodic = docType.is_periodic && hasEmissionPolicy;

    console.log(`📋 Document type: ${isPeriodic ? 'PERIODIC' : 'AD-HOC'}`);
    console.log(`📋 hasEmissionPolicy: ${hasEmissionPolicy}, emission_id: ${docData.emission_id || 'not provided'}`);

    // 🔥 Validation: Si le type est périodique mais qu'aucune politique n'est fournie
    if (docType.is_periodic && !hasEmissionPolicy) {
      throw new AppError('Emission policy ID is required for periodic documents', 400);
    }

    // Use a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    let transactionCommitted = false;

    try {
      let emissionPolicy = null;
      let projDoc = null;

      // Si periodicData est fourni, créer une nouvelle politique (cas rare)
      if (isPeriodic && periodicData && !docData.emission_id) {
        console.log('📅 Creating new emission policy for periodic document...');
        
        // Validate periodic data
        if (!periodicData.frequency) {
          throw new AppError('Frequency is required for periodic documents', 400);
        }
        if (!periodicData.anchor_date) {
          throw new AppError('Start date (anchor_date) is required for periodic documents', 400);
        }
        if (!periodicData.project_end_date) {
          throw new AppError('Project end date is required for periodic documents', 400);
        }
        if (periodicData.frequency === 'weekly' && !periodicData.anchor_day) {
          throw new AppError('Day of week (anchor_day) is required for weekly documents', 400);
        }

        // Create emission policy
        emissionPolicy = await EmissionPolicy.create({
          project_id: docData.project_id,
          frequency: periodicData.frequency,
          anchor_date: periodicData.anchor_date,
          anchor_day: periodicData.anchor_day,
          description: periodicData.policy_description || null
        }, { transaction });

        console.log('✅ Emission policy created with ID:', emissionPolicy.id);
        
        // Set emission_id in document data
        docData.emission_id = emissionPolicy.id;
      } 
      // Sinon, vérifier que la politique existe (cas normal)
      else if (docData.emission_id) {
        console.log('📅 Using existing emission policy:', docData.emission_id);
        emissionPolicy = await EmissionPolicy.findByPk(docData.emission_id, { transaction });
        if (!emissionPolicy) {
          throw new AppError('Emission policy not found', 404);
        }
        
        // Vérifier que la politique appartient au bon projet
        if (emissionPolicy.project_id !== docData.project_id) {
          throw new AppError('Emission policy does not belong to this project', 400);
        }
      }

      // Create the document with category and subcategory
      const docCreateData = {
        ...docData,
        category,
        subcategory
      };
      
      projDoc = await ProjDoc.create(docCreateData, { transaction });

      console.log('✅ Document created with ID:', projDoc.id);

      // Create entity metadata if provided
      if (entityMeta && Object.keys(entityMeta).length > 0 && docType.entity_type) {
        const tableName = ENTITY_TABLE_MAP[docType.entity_type];
        if (!tableName) {
          throw new AppError(`Unknown entity type: ${docType.entity_type}`, 400);
        }

        console.log(`🔍 Creating entity metadata in table: ${tableName}`);
        console.log(`📦 Entity meta data:`, entityMeta);

        // Get the model for the metadata table
        const targetModel = sequelize.models[tableName];
        if (!targetModel) {
          throw new AppError(`Metadata table not found: ${tableName}`, 500);
        }

        await targetModel.create({
          projdoc_id: projDoc.id,
          ...entityMeta
        }, { transaction });

        console.log(`✅ Entity metadata created successfully`);
      }

      // Commit the transaction
      await transaction.commit();
      transactionCommitted = true;
      console.log('✅ Transaction committed successfully');

      // Si c'est un document périodique avec une nouvelle politique, générer les périodes
      if (emissionPolicy && periodicData) {
        try {
          console.log('📅 Generating periods in emission_periods...');
          const periods = await this.generatePeriodsInEmissionPeriods(
            emissionPolicy.id,
            periodicData.project_end_date
          );
          console.log(`✅ Generated ${periods.length} periods in emission_periods`);
        } catch (periodError) {
          console.error('⚠️ Warning: Failed to generate periods in emission_periods:', periodError.message);
          console.error(periodError);
        }
      } else {
        console.log('📅 Using existing periods from emission policy');
      }

      // Return the full document with associations
      const fullDoc = await this.getProjDocById(projDoc.id);
      return fullDoc;

    } catch (error) {
      // Rollback transaction only if it hasn't been committed
      if (!transactionCommitted) {
        try {
          await transaction.rollback();
          console.log('✅ Transaction rolled back');
        } catch (rollbackError) {
          console.log('⚠️ Transaction rollback failed:', rollbackError.message);
        }
      } else {
        console.log('⚠️ Transaction already committed, skipping rollback');
      }
      
      console.error('❌ Error in transaction:', error);
      throw error;
    }
  }

  // 🔥 NEW: Generate periods in emission_periods table - CORRIGÉ
  async generatePeriodsInEmissionPeriods(policyId, endDate) {
    console.log(`\n📅 ===== GENERATE PERIODS IN EMISSION_PERIODS =====`);
    console.log(`Policy ID: ${policyId}`);
    console.log(`End date: ${endDate}`);

    // Récupérer la politique
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    console.log('🔍 Policy found:', {
      id: policy.id,
      frequency: policy.frequency,
      anchor_date: policy.anchor_date
    });

    // Générer les périodes avec l'utilitaire
    const periods = generatePeriodsFromPolicy(policy, endDate);

    if (periods.length === 0) {
      console.log('⚠️ Aucune période générée');
      return [];
    }

    console.log(`📊 ${periods.length} périodes générées`);

    // Supprimer les anciennes périodes si elles existent
    await EmissionPeriod.destroy({
      where: { emission_id: policyId }
    });

    // Préparer les périodes à créer - SANS ID explicite
    const periodsToCreate = periods.map(period => ({
      emission_id: policyId,
      period_label: period.period_label,
      period_start: period.period_start,
      period_end: period.period_end,
      expected_at: period.due_date,
      status: 'pending'
    }));

    console.log('📝 Exemple de période à créer:', JSON.stringify(periodsToCreate[0], null, 2));

    try {
      // Créer les périodes dans emission_periods
      const createdPeriods = await EmissionPeriod.bulkCreate(periodsToCreate, {
        returning: true
      });

      console.log(`✅ ${createdPeriods.length} périodes créées dans emission_periods`);

      // Log du premier échantillon
      if (createdPeriods.length > 0) {
        console.log('📅 Première période créée:', {
          id: createdPeriods[0].id,
          period_label: createdPeriods[0].period_label,
          period_start: createdPeriods[0].period_start,
          period_end: createdPeriods[0].period_end,
          expected_at: createdPeriods[0].expected_at
        });
      }

      console.log('=====================================\n');
      return createdPeriods;
    } catch (error) {
      console.error('❌ Erreur lors de bulkCreate:', error);
      console.error('📦 Données qui ont causé l\'erreur:', JSON.stringify(periodsToCreate, null, 2));
      throw error;
    }
  }

  // Generate periods directly in doc_revisions table (kept for backward compatibility)
  async generatePeriodsInDocRevisions(projdocId, policy, endDate) {
    console.log(`\n📅 ===== GENERATE PERIODS IN DOC_REVISIONS =====`);
    console.log(`Document ID: ${projdocId}`);
    console.log(`Policy ID: ${policy.id}`);
    console.log(`Frequency: ${policy.frequency}`);
    console.log(`Anchor date: ${policy.anchor_date}`);
    console.log(`End date: ${endDate}`);

    // Vérifier que le document existe
    const projdoc = await ProjDoc.findByPk(projdocId);
    if (!projdoc) {
      throw new AppError('Document non trouvé', 404);
    }

    // Générer les périodes avec l'utilitaire
    const periods = generatePeriodsFromPolicy(policy, endDate);

    if (periods.length === 0) {
      console.log('⚠️ Aucune période générée');
      return [];
    }

    console.log(`📊 ${periods.length} périodes générées`);

    // Supprimer les anciennes périodes si elles existent
    await DocRevision.destroy({
      where: { 
        projdoc_id: projdocId,
        period_label: { [Op.not]: null }
      }
    });

    // Préparer les révisions à créer
    const revisionsToCreate = periods.map(period => ({
      id: uuidv4(),
      projdoc_id: projdocId,
      period_label: period.period_label,
      period_start: period.period_start,
      period_end: period.period_end,
      expected_at: period.due_date,
      status: 'pending',
      revision: null,
      revision_code: null,
      revision_notes: null,
      source_filename: null,
      source_file_size: null,
      source_file_path: null,
      uploaded_at: null,
      uploaded_by: null,
      hash_algorithm: 'SHA256',
      created_at: new Date()
    }));

    console.log(`📝 Création de ${revisionsToCreate.length} révisions dans doc_revisions...`);

    // Créer toutes les périodes en une seule opération
    const createdRevisions = await DocRevision.bulkCreate(revisionsToCreate, {
      returning: true
    });

    console.log(`✅ ${createdRevisions.length} périodes créées dans doc_revisions`);

    // Log du premier échantillon
    if (createdRevisions.length > 0) {
      console.log('📅 Première période créée:', {
        id: createdRevisions[0].id,
        period_label: createdRevisions[0].period_label,
        period_start: createdRevisions[0].period_start,
        period_end: createdRevisions[0].period_end,
        expected_at: createdRevisions[0].expected_at
      });
    }

    console.log('=====================================\n');

    return createdRevisions;
  }

  // 🔥 Get all periods for a periodic document with upload status
  async getDocumentPeriodsWithStatus(projdocId) {
    console.log(`\n📅 ===== SERVICE: GET DOCUMENT PERIODS WITH STATUS =====`);
    console.log(`Document ID: ${projdocId}`);
    
    // Vérifier que le document existe
    const projdoc = await ProjDoc.findByPk(projdocId, {
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
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: EmissionPolicy,
          as: 'emission_policy'
        }
      ]
    });
    
    if (!projdoc) {
      throw new AppError('Document not found', 404);
    }

    if (!projdoc.doc_type.is_periodic) {
      throw new AppError('Document is not periodic', 400);
    }

    if (!projdoc.emission_policy) {
      throw new AppError('Document has no emission policy', 400);
    }

    // Récupérer les périodes depuis emission_periods
    const EmissionPeriod = sequelize.models.EmissionPeriod;
    
    // Récupérer toutes les périodes de la politique d'émission
    const periods = await EmissionPeriod.findAll({
      where: {
        emission_id: projdoc.emission_policy.id
      },
      order: [
        ['period_start', 'ASC']
      ],
      include: [
        {
          model: DocRevision,
          as: 'revisions',
          required: false,
          where: { projdoc_id: projdocId },
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'name', 'family_name', 'email']
            }
          ]
        }
      ]
    });

    console.log(`📊 Found ${periods.length} periods in emission_periods`);

    // Date du jour pour calculer l'upload actif
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transformer les périodes avec le statut d'upload
    const periodsWithStatus = periods.map(period => {
      const periodJson = period.toJSON();
      const revision = periodJson.revisions?.[0] || null;
      
      // Convertir expected_at en Date pour comparaison
      const dueDate = period.expected_at ? new Date(period.expected_at) : null;
      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
      }
      
      // Déterminer si l'upload est actif
      let uploadActive = false;
      let uploadStatusMessage = '';
      
      if (revision) {
        uploadActive = false;
        uploadStatusMessage = 'Already uploaded';
      } else if (!dueDate) {
        uploadActive = false;
        uploadStatusMessage = 'No due date';
      } else if (dueDate < today) {
        uploadActive = true;
        uploadStatusMessage = 'Upload available - Period overdue';
      } else if (dueDate.getTime() === today.getTime()) {
        uploadActive = true;
        uploadStatusMessage = 'Upload available - Due today';
      } else {
        uploadActive = false;
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        uploadStatusMessage = `Upload available in ${daysDiff} days (${period.expected_at})`;
      }
      
      return {
        id: period.id,
        period_label: period.period_label,
        period_start: period.period_start,
        period_end: period.period_end,
        expected_at: period.expected_at,
        status: period.status,
        revision: revision ? {
          id: revision.id,
          revision: revision.revision,
          revision_code: revision.revision_code,
          revision_notes: revision.revision_notes,
          source_filename: revision.source_filename,
          source_file_size: revision.source_file_size,
          uploaded_at: revision.uploaded_at,
          uploader: revision.uploader
        } : null,
        upload_active: uploadActive,
        upload_status_message: uploadStatusMessage,
        days_until_due: dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    });

    console.log(`✅ Upload active for ${periodsWithStatus.filter(p => p.upload_active).length} periods`);
    console.log('=====================================\n');

    return {
      periods: periodsWithStatus,
      document: {
        id: projdoc.id,
        doc_number: projdoc.doc_number,
        title: projdoc.title,
        doc_type: projdoc.doc_type,
        emission_policy: projdoc.emission_policy
      },
      summary: {
        total: periodsWithStatus.length,
        uploaded: periodsWithStatus.filter(p => p.revision !== null).length,
        pending: periodsWithStatus.filter(p => p.status === 'pending' && !p.revision).length,
        late: periodsWithStatus.filter(p => p.status === 'late' && !p.revision).length,
        upload_active: periodsWithStatus.filter(p => p.upload_active).length
      }
    };
  }

  // Update document
  async updateProjDoc(id, updateData) {
    const doc = await ProjDoc.findByPk(id);
    if (!doc) {
      return null;
    }

    // Check doc_number uniqueness if updating - check GLOBALLY
    if (updateData.doc_number && updateData.doc_number !== doc.doc_number) {
      const existing = await ProjDoc.findOne({
        where: {
          doc_number: updateData.doc_number, // Global check
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        throw new AppError(`Document number ${updateData.doc_number} already exists in another project`, 400);
      }
    }

    // Check emission policy if updating
    if (updateData.emission_id && updateData.emission_id !== doc.emission_id) {
      const policy = await EmissionPolicy.findByPk(updateData.emission_id);
      if (!policy) {
        throw new AppError('Emission policy not found', 404);
      }
      
      if (policy.project_id !== doc.project_id) {
        throw new AppError('Emission policy does not belong to this project', 400);
      }
    }

    const updatableFields = ['doc_number', 'title', 'emission_id', 'status'];
    const dataToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (updatableFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    await doc.update(dataToUpdate);
    return await this.getProjDocById(id);
  }

  // Delete document
  async deleteProjDoc(id) {
    const doc = await ProjDoc.findByPk(id);
    if (!doc) {
      return null;
    }

    // Check if there are associated revisions
    const revisionsCount = await DocRevision.count({
      where: { projdoc_id: id }
    });

    if (revisionsCount > 0) {
      throw new AppError('Cannot delete document with existing revisions', 400);
    }

    await doc.destroy();
    return true;
  }

  // Get documents count by status
  async getDocsCountByStatus(projectId = null) {
    const whereClause = {};
    if (projectId) whereClause.project_id = projectId;

    const result = await ProjDoc.findAll({
      where: whereClause,
      attributes: [
        'status',
        [ProjDoc.sequelize.fn('COUNT', ProjDoc.sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    return result.reduce((acc, item) => {
      acc[item.status] = parseInt(item.dataValues.count);
      return acc;
    }, { active: 0, superseded: 0, cancelled: 0 });
  }

  // Get periodic vs adhoc count
  async getPeriodicVsAdhocCount(projectId = null) {
    const whereClause = {};
    if (projectId) whereClause.project_id = projectId;

    const periodic = await ProjDoc.count({
      where: {
        ...whereClause,
        emission_id: { [Op.ne]: null }
      }
    });

    const adhoc = await ProjDoc.count({
      where: {
        ...whereClause,
        emission_id: null
      }
    });

    return { periodic, adhoc };
  }
}

export default new projDocService();