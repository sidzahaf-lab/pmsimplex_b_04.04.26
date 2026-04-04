import { Project, EmissionPolicy, PolicyDocType } from '../models/index.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Op } from 'sequelize';

// @desc    Check if a document type is already assigned to a policy in a project
// @route   GET /api/projects/:projectId/doc-types/:docTypeId/policy-check
// @access  Private
export const checkDocTypeAssignment = asyncHandler(async (req, res, next) => {
  const { projectId, docTypeId } = req.params;
  const { exclude_policy_id } = req.query;

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  if (!uuidRegex.test(docTypeId)) {
    return next(new AppError('Invalid document type ID format', 400));
  }

  // Find any policy in this project that has this doc_type_id
  const whereClause = {
    project_id: projectId
  };
  
  if (exclude_policy_id) {
    whereClause.id = { [Op.ne]: exclude_policy_id };
  }

  const policy = await EmissionPolicy.findOne({
    where: whereClause,
    include: [
      {
        model: PolicyDocType,
        as: 'doc_type_associations',
        required: true,
        where: { doc_type_id: docTypeId }
      }
    ]
  });

  if (policy) {
    return res.status(200).json({
      status: 'success',
      data: {
        assigned: true,
        policyName: `${policy.frequency} policy (${policy.anchor_date})`,
        policyId: policy.id
      }
    });
  }

  return res.status(200).json({
    status: 'success',
    data: {
      assigned: false,
      policyName: null,
      policyId: null
    }
  });
});