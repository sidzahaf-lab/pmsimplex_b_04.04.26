import db from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

const { PolicyDocType, EmissionPolicy, DocType } = db;

class PolicyDocTypeService {
  // Get all policy-document type associations with optional filtering and pagination
  async getAllPolicyDocTypes(filters = {}) {
    const {
      policy_id,
      doc_type_id,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    if (policy_id) whereClause.policy_id = policy_id;
    if (doc_type_id) whereClause.doc_type_id = doc_type_id;

    const offset = (page - 1) * limit;

    const result = await PolicyDocType.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'title', 'status']
        },
        {
          model: DocType,
          as: 'doc_type',
          attributes: ['id', 'name', 'code', 'description', 'category']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      associations: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get policy-document type association by ID
  async getPolicyDocTypeById(id) {
    return await PolicyDocType.findByPk(id, {
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'title', 'status', 'description', 'effective_date', 'expiry_date']
        },
        {
          model: DocType,
          as: 'doc_type',
          attributes: ['id', 'name', 'code', 'description', 'category', 'entity_type', 'file_format']
        }
      ]
    });
  }

  // Get all document types associated with a specific policy
  async getDocTypesByPolicyId(policyId, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    const result = await PolicyDocType.findAndCountAll({
      where: { policy_id: policyId },
      include: [
        {
          model: DocType,
          as: 'doc_type',
          attributes: ['id', 'name', 'code', 'description', 'category', 'entity_type', 'file_format']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      associations: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get all policies associated with a specific document type
  async getPoliciesByDocTypeId(docTypeId, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    const result = await PolicyDocType.findAndCountAll({
      where: { doc_type_id: docTypeId },
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'title', 'status', 'effective_date', 'expiry_date']
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      associations: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Create new policy-document type association
  async createPolicyDocType(associationData) {
    // Map frontend field names to backend model fields
    const mappedData = {
      policy_id: associationData.policy_id,
      doc_type_id: associationData.doc_type_id
    };

    // Check if policy exists
    if (mappedData.policy_id) {
      const policy = await EmissionPolicy.findByPk(mappedData.policy_id);
      if (!policy) {
        throw new AppError('Emission policy not found', 404);
      }
    }

    // Check if document type exists
    if (mappedData.doc_type_id) {
      const docType = await DocType.findByPk(mappedData.doc_type_id);
      if (!docType) {
        throw new AppError('Document type not found', 404);
      }
    }

    // Check if association already exists
    const existingAssociation = await PolicyDocType.findOne({
      where: {
        policy_id: mappedData.policy_id,
        doc_type_id: mappedData.doc_type_id
      }
    });

    if (existingAssociation) {
      throw new AppError('This policy-document type association already exists', 400);
    }

    // Create association with mapped data
    return await PolicyDocType.create(mappedData, {
      fields: ['policy_id', 'doc_type_id'],
      returning: true
    });
  }

  // Create multiple policy-document type associations at once
  async bulkCreatePolicyDocTypes(associationsData) {
    if (!associationsData || !Array.isArray(associationsData) || associationsData.length === 0) {
      throw new AppError('Associations data must be a non-empty array', 400);
    }

    // Map frontend field names to backend model fields
    const mappedAssociations = associationsData.map(item => ({
      policy_id: item.policy_id,
      doc_type_id: item.doc_type_id
    }));

    // Get all policy IDs and document type IDs to verify they exist
    const policyIds = [...new Set(mappedAssociations.map(item => item.policy_id))];
    const docTypeIds = [...new Set(mappedAssociations.map(item => item.doc_type_id))];

    // Verify all policies exist
    const policies = await EmissionPolicy.findAll({
      where: { id: policyIds },
      attributes: ['id']
    });
    const existingPolicyIds = policies.map(p => p.id);
    const missingPolicyIds = policyIds.filter(id => !existingPolicyIds.includes(id));

    if (missingPolicyIds.length > 0) {
      throw new AppError(`Emission policies not found: ${missingPolicyIds.join(', ')}`, 404);
    }

    // Verify all document types exist
    const docTypes = await DocType.findAll({
      where: { id: docTypeIds },
      attributes: ['id']
    });
    const existingDocTypeIds = docTypes.map(d => d.id);
    const missingDocTypeIds = docTypeIds.filter(id => !existingDocTypeIds.includes(id));

    if (missingDocTypeIds.length > 0) {
      throw new AppError(`Document types not found: ${missingDocTypeIds.join(', ')}`, 404);
    }

    // Check for existing associations to avoid duplicates
    const existingAssociations = await PolicyDocType.findAll({
      where: {
        [Op.or]: mappedAssociations.map(item => ({
          policy_id: item.policy_id,
          doc_type_id: item.doc_type_id
        }))
      },
      attributes: ['policy_id', 'doc_type_id']
    });

    if (existingAssociations.length > 0) {
      const duplicatePairs = existingAssociations.map(
        a => `(policy: ${a.policy_id}, doc_type: ${a.doc_type_id})`
      ).join(', ');
      throw new AppError(`Duplicate associations found: ${duplicatePairs}`, 400);
    }

    // Create all associations
    const createdAssociations = await PolicyDocType.bulkCreate(mappedAssociations, {
      fields: ['policy_id', 'doc_type_id'],
      returning: true
    });

    // Fetch created associations with related data
    const associationIds = createdAssociations.map(a => a.id);
    return await PolicyDocType.findAll({
      where: { id: associationIds },
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'title', 'status']
        },
        {
          model: DocType,
          as: 'doc_type',
          attributes: ['id', 'name', 'code', 'description']
        }
      ]
    });
  }

  // Delete policy-document type association
  async deletePolicyDocType(id) {
    const association = await PolicyDocType.findByPk(id);
    if (!association) {
      return null;
    }

    await association.destroy();
    return true;
  }

  // Delete all document type associations for a specific policy
  async deleteAllPolicyDocTypesByPolicy(policyId) {
    // Verify policy exists
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) {
      throw new AppError('Emission policy not found', 404);
    }

    const deletedCount = await PolicyDocType.destroy({
      where: { policy_id: policyId }
    });

    return deletedCount;
  }

  // Delete all policy associations for a specific document type
  async deleteAllPolicyDocTypesByDocType(docTypeId) {
    // Verify document type exists
    const docType = await DocType.findByPk(docTypeId);
    if (!docType) {
      throw new AppError('Document type not found', 404);
    }

    const deletedCount = await PolicyDocType.destroy({
      where: { doc_type_id: docTypeId }
    });

    return deletedCount;
  }

  // Check if a specific policy-document type association exists
  async associationExists(policyId, docTypeId) {
    const association = await PolicyDocType.findOne({
      where: {
        policy_id: policyId,
        doc_type_id: docTypeId
      }
    });

    return !!association;
  }

  // Get document types for multiple policies in one query
  async getDocTypesForMultiplePolicies(policyIds) {
    const associations = await PolicyDocType.findAll({
      where: {
        policy_id: policyIds
      },
      include: [
        {
          model: DocType,
          as: 'doc_type',
          attributes: ['id', 'name', 'code', 'description', 'category']
        }
      ]
    });

    // Group by policy_id for easier consumption
    const groupedByPolicy = {};
    associations.forEach(assoc => {
      if (!groupedByPolicy[assoc.policy_id]) {
        groupedByPolicy[assoc.policy_id] = [];
      }
      groupedByPolicy[assoc.policy_id].push({
        id: assoc.id,
        doc_type: assoc.doc_type,
        created_at: assoc.created_at
      });
    });

    return groupedByPolicy;
  }

  // Get policies for multiple document types in one query
  async getPoliciesForMultipleDocTypes(docTypeIds) {
    const associations = await PolicyDocType.findAll({
      where: {
        doc_type_id: docTypeIds
      },
      include: [
        {
          model: EmissionPolicy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'title', 'status', 'effective_date', 'expiry_date']
        }
      ]
    });

    // Group by doc_type_id for easier consumption
    const groupedByDocType = {};
    associations.forEach(assoc => {
      if (!groupedByDocType[assoc.doc_type_id]) {
        groupedByDocType[assoc.doc_type_id] = [];
      }
      groupedByDocType[assoc.doc_type_id].push({
        id: assoc.id,
        policy: assoc.policy,
        created_at: assoc.created_at
      });
    });

    return groupedByDocType;
  }

  // Validate policy-document type association
  async validateAssociation(policyId, docTypeId) {
    const policy = await EmissionPolicy.findByPk(policyId);
    if (!policy) return { valid: false, message: 'Policy not found' };

    const docType = await DocType.findByPk(docTypeId);
    if (!docType) return { valid: false, message: 'Document type not found' };

    // Check if the document type is compatible with the policy
    // This could include additional business logic, e.g.:
    // - Check if document type is applicable to this policy's project type
    // - Check if document type's entity_type matches policy's entity type
    
    return { valid: true };
  }
}

export default new PolicyDocTypeService();