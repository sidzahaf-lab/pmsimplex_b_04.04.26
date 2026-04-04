import express from 'express';
const router = express.Router();

// Import controllers
import business_unitController from '../controllers/business_unitController.js';

// Import validations
import business_unitValidation from '../middleware/business_unitValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Import auth middleware - COMMENTED OUT FOR NOW
// import { protect } from '../middleware/auth.js';

// Apply authentication middleware to all routes - COMMENTED OUT
// router.use(protect);

// ================================================
// GET ROUTES
// ================================================

/**
 * Get all business units with filtering and pagination
 * Query params: page, limit, sort, order
 */
router.get(
  '/',
  globalValidators.validatePagination,
  business_unitController.getAllBusinessUnits
);

/**
 * Check if a business unit name is available
 * Query params: name (required)
 */
router.get(
  '/check-name',
  business_unitController.checkBusinessUnitName
);

/**
 * Get business unit by ID
 * Path param: id (UUID)
 */
router.get(
  '/:id',
  business_unitValidation.validateBusinessUnitId,
  business_unitController.getBusinessUnit
);

// ================================================
// POST ROUTES
// ================================================

/**
 * Create a new business unit
 * Body: { name, description, is_active? }
 */
router.post(
  '/',
  business_unitValidation.validateBusinessUnit,
  business_unitController.createBusinessUnit
);

// ================================================
// PUT ROUTES
// ================================================

/**
 * Update a business unit
 * Path param: id (UUID)
 * Body: { name?, description?, is_active? }
 */
router.put(
  '/:id',
  business_unitValidation.validateBusinessUnitId,
  business_unitValidation.validateBusinessUnitUpdate,
  business_unitController.updateBusinessUnit
);

// ================================================
// DELETE ROUTES
// ================================================

/**
 * Delete a business unit
 * Path param: id (UUID)
 */
router.delete(
  '/:id',
  business_unitValidation.validateBusinessUnitId,
  business_unitController.deleteBusinessUnit
);

// ================================================
// CLIENT-SPECIFIC ROUTES
// ================================================

/**
 * NOTE: This endpoint is kept for backward compatibility
 * but client_id is no longer a field in the BusinessUnit model.
 * This route will now return a message indicating that 
 * business units are independent of clients.
 */
router.get(
  '/client/:clientId',
  business_unitValidation.validateClientId,
  business_unitController.getBusinessUnitsByClient
);

export default router;