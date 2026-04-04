import express from 'express';
const router = express.Router();

// Import controllers
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  patchCategory,
  deleteCategory,
  getCategoryWithSubcategories,
  getCategoriesWithStats
} from '../controllers/docCategoriesController.js';

// Import validations
import {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  getCategoryWithSubcategoriesValidation
} from '../middleware/docCategoriesValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Apply authentication middleware to all routes - COMMENTED OUT FOR NOW
// router.use(protect);

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

router.get(
  '/with-stats',
  globalValidators.validatePagination,
  getCategoriesWithStats
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply authentication middleware to all routes below - UNCOMMENT WHEN AUTH IS READY
// router.use(protect);

router.get(
  '/',
  globalValidators.validatePagination,
  getAllCategories
);

router.get(
  '/:id/with-subcategories',
  getCategoryWithSubcategoriesValidation,
  getCategoryWithSubcategories
);

router.post(
  '/',
  createCategoryValidation,
  createCategory
);

router.get(
  '/:id',
  categoryIdValidation,
  getCategoryById
);

router.put(
  '/:id',
  updateCategoryValidation,
  updateCategory
);

router.patch(
  '/:id',
  updateCategoryValidation,
  patchCategory
);

router.delete(
  '/:id',
  categoryIdValidation,
  deleteCategory
);

export default router;