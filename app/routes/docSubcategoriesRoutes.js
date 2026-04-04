import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  patchSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
  getSubcategoryWithDocTypes,
  getSubcategoriesWithStats
} from '../controllers/docSubcategoriesController.js';

// Import validations
import {
  createSubcategoryValidation,
  updateSubcategoryValidation,
  subcategoryIdValidation,
  subcategoriesByCategoryValidation,
  getSubcategoryWithDocTypesValidation
} from '../middleware/docSubcategoriesValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

router.get(
  '/by-category/:categoryId',
  subcategoriesByCategoryValidation,
  globalValidators.validatePagination,
  getSubcategoriesByCategory
);

router.get(
  '/with-stats',
  globalValidators.validatePagination,
  getSubcategoriesWithStats
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

router.get(
  '/',
  globalValidators.validatePagination,
  getAllSubcategories
);

router.get(
  '/:id/with-doc-types',
  getSubcategoryWithDocTypesValidation,
  getSubcategoryWithDocTypes
);

router.post(
  '/',
  createSubcategoryValidation,
  createSubcategory
);

router.get(
  '/:id',
  subcategoryIdValidation,
  getSubcategoryById
);

router.put(
  '/:id',
  updateSubcategoryValidation,
  updateSubcategory
);

router.patch(
  '/:id',
  updateSubcategoryValidation,
  patchSubcategory
);

router.delete(
  '/:id',
  subcategoryIdValidation,
  deleteSubcategory
);

export default router;