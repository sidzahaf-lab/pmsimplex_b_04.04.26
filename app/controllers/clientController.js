import clientService from '../services/clientService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getAllClients = asyncHandler(async (req, res, next) => {
  const result = await clientService.getAllClients(req.query);
  res.status(200).json({
    status: 'success',
    results: result.clients.length,
    data: result
  });
});

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Private
export const getClient = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.getClientById(req.params.id);
  
  if (!client_record) {
    return next(new AppError('Client not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client: client_record
    }
  });
});

// @desc    Get client by slug
// @route   GET /api/clients/slug/:slug
// @access  Private
export const getClientBySlug = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.getClientBySlug(req.params.slug);
  
  if (!client_record) {
    return next(new AppError('Client not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client: client_record
    }
  });
});

// @desc    Get client by ID with business units
// @route   GET /api/clients/:id/with-business-units
// @access  Private
export const getClientWithBusinessUnits = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.getClientByIdWithBusinessUnits(req.params.id);
  
  if (!client_record) {
    return next(new AppError('Client not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client: client_record
    }
  });
});

// @desc    Create client
// @route   POST /api/clients
// @access  Private
export const createClient = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.createClient(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      client: client_record
    }
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.updateClient(req.params.id, req.body);
  
  if (!client_record) {
    return next(new AppError('Client not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client: client_record
    }
  });
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = asyncHandler(async (req, res, next) => {
  const result = await clientService.deleteClient(req.params.id);
  
  if (!result) {
    return next(new AppError('Client not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get business units count for a client
// @route   GET /api/clients/:id/business-units-count
// @access  Private
export const getBusinessUnitsCount = asyncHandler(async (req, res, next) => {
  const client_record = await clientService.getClientById(req.params.id);
  
  if (!client_record) {
    return next(new AppError('Client not found', 404));
  }

  const count = await clientService.getBusinessUnitsCountForClient(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      count,
      client_id: parseInt(req.params.id)
    }
  });
});

// @desc    Check if client slug is available
// @route   GET /api/clients/check-slug
// @access  Private
export const checkClientSlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.query;

  // Validate required parameter
  if (!slug) {
    return next(new AppError('Slug is required', 400));
  }

  // Check slug availability
  const isAvailable = await clientService.checkClientSlugAvailability(slug.trim());
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      slug: slug.trim()
    }
  });
});

// @desc    Check if client name is available
// @route   GET /api/clients/check-name
// @access  Private
export const checkClientName = asyncHandler(async (req, res, next) => {
  const { name } = req.query;

  // Validate required parameter
  if (!name) {
    return next(new AppError('Name is required', 400));
  }

  // Check name availability
  const isAvailable = await clientService.checkClientNameAvailability(name.trim());
  
  res.status(200).json({
    status: 'success',
    data: {
      available: isAvailable,
      name: name.trim()
    }
  });
});

export default {
  getAllClients,
  getClient,
  getClientBySlug,
  getClientWithBusinessUnits,
  createClient,
  updateClient,
  deleteClient,
  getBusinessUnitsCount,
  checkClientSlug,
  checkClientName
};