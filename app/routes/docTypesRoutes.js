import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllDocTypes,
  getDocTypeById,
  createDocType,
  updateDocType,
  patchDocType,
  deleteDocType,
  getDocTypesBySubcategory,
  getPeriodicDocTypes,
  getDocTypesByEntityType,
  validateFileFormat,
  getDocTypesWithDetails,
  getDocTypeStats
} from '../controllers/docTypesController.js';

// Import validations
import {
  createDocTypeValidation,
  updateDocTypeValidation,
  docTypeIdValidation,
  docTypesBySubcategoryValidation,
  docTypesByEntityTypeValidation,
  validateFileFormatValidation
} from '../middleware/docTypesValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Import auth middleware (commented until ready)
// import { protect, authorize } from '../middleware/auth.js';

// =============================================
// HEALTH CHECK - Simple endpoint to verify routing
// =============================================
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Document types router is working',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// Get periodic document types
router.get(
  '/periodic',
  globalValidators.validatePagination,
  getPeriodicDocTypes
);

// Get document types by subcategory
router.get(
  '/by-subcategory/:subcategoryId',
  docTypesBySubcategoryValidation,
  globalValidators.validatePagination,
  getDocTypesBySubcategory
);

// Get document types by entity type
router.get(
  '/by-entity-type/:entityType',
  docTypesByEntityTypeValidation,
  globalValidators.validatePagination,
  getDocTypesByEntityType
);

// Get document types with full details (includes subcategory and category)
router.get(
  '/with-details',
  globalValidators.validatePagination,
  getDocTypesWithDetails
);

// Validate file format against document type
router.post(
  '/validate-format',
  validateFileFormatValidation,
  validateFileFormat
);

// Get document type statistics (public or protected? depends on requirements)
router.get(
  '/stats',
  getDocTypeStats
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below
// Uncomment when auth is ready and add role-based access if needed
// router.use(protect);

// Get all document types with filtering and pagination
router.get(
  '/',
  globalValidators.validatePagination,
  getAllDocTypes
);

// Create new document type
// Add admin-only restriction if needed: authorize('admin', 'project_manager')
router.post(
  '/',
  createDocTypeValidation,
  createDocType
);

// Get document type by ID
router.get(
  '/:id',
  docTypeIdValidation,
  getDocTypeById
);

// Full update document type
router.put(
  '/:id',
  updateDocTypeValidation,
  updateDocType
);

// Partial update document type
router.patch(
  '/:id',
  updateDocTypeValidation,
  patchDocType
);

// Delete document type
router.delete(
  '/:id',
  docTypeIdValidation,
  // authorize('admin'), // Uncomment for admin-only deletion
  deleteDocType
);

// =============================================
// BULK OPERATIONS (Optional - uncomment if needed)
// =============================================

// Bulk create document types
// router.post(
//   '/bulk',
//   protect,
//   authorize('admin'),
//   bulkCreateDocTypesValidation,
//   bulkCreateDocTypes
// );

// Bulk delete document types
// router.delete(
//   '/bulk',
//   protect,
//   authorize('admin'),
//   bulkDeleteDocTypesValidation,
//   bulkDeleteDocTypes
// );

// =============================================
// EXPORT ROUTER
// =============================================
export default router;