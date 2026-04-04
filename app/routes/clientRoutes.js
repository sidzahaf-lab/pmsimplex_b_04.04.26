import express from 'express';
const router = express.Router();

// Import controllers
import clientController from '../controllers/clientController.js';

// Import validations
import clientValidation from '../middleware/clientValidation.js';
import globalValidators from '../middleware/globalValidators.js';

// Import auth middleware - COMMENTED OUT FOR NOW
// import { protect } from '../middleware/auth.js';

// Apply authentication middleware to all routes - COMMENTED OUT
// router.use(protect);

// =============================================
// CLIENT ROUTES
// =============================================

// Public/availability check routes
router.get('/check-slug', clientController.checkClientSlug);
router.get('/check-name', clientController.checkClientName);

// Slug route (specific before /:id)
router.get('/slug/:slug', clientValidation.validateClientSlug, clientController.getClientBySlug);

// Main CRUD routes
router.get('/', globalValidators.validatePagination, clientController.getAllClients);
router.post('/', clientValidation.validateClient, clientController.createClient);

// Client routes with ID parameter
router.get('/:id', clientValidation.validateClientId, clientController.getClient);
router.put('/:id', 
  clientValidation.validateClientId, 
  clientValidation.validateClientUpdate, 
  clientController.updateClient
);
router.delete('/:id', clientValidation.validateClientId, clientController.deleteClient);

export default router;