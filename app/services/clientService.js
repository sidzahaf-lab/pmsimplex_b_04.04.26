import { Client } from '../models/index.js'; // Remove BusinessUnit import
import AppError from '../utils/appError.js';

class ClientService {
  // Get all clients with pagination
  async getAllClients(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    const result = await Client.findAndCountAll({
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
      // REMOVED: include for BusinessUnit since no association exists
    });

    return {
      clients: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      },
      isMonorepo: true,
      maxClients: 1
    };
  }

  // Get client by ID - only allow ID 1
  async getClientById(id) {
    // For monorepo, only ID 1 is allowed
    if (parseInt(id) !== 1) {
      throw new AppError('This is a monorepo application. Only client with ID 1 exists.', 400);
    }
    
    const client = await Client.findByPk(id);
    if (!client) {
      throw new AppError('Client not found. Please configure the monorepo client first.', 404);
    }
    return client;
  }

  // REMOVED: getClientByIdWithBusinessUnits - no association exists
  
  // Get client by slug
  async getClientBySlug(slug) {
    const client = await Client.findOne({
      where: { slug: slug.trim().toLowerCase() }
      // REMOVED: include for BusinessUnit
    });
    
    if (!client) {
      throw new AppError('Client not found', 404);
    }
    
    return client;
  }

  // Check client slug availability
  async checkClientSlugAvailability(slug) {
    if (!slug) {
      return true;
    }

    const normalizedSlug = slug.trim().toLowerCase();
    
    const existingClient = await Client.findOne({
      where: { slug: normalizedSlug }
    });

    return !existingClient;
  }

  // Check client name availability
  async checkClientNameAvailability(name) {
    if (!name) {
      return true;
    }

    const normalizedName = name.trim();
    
    const existingClient = await Client.findOne({
      where: { name: normalizedName }
    });

    return !existingClient;
  }

  // Create new client - monorepo version (ID always 1)
  async createClient(clientData) {
    // Check if monorepo client already exists
    const existingClient = await Client.findByPk(1);
    if (existingClient) {
      throw new AppError('Monorepo client already exists. Only one client is allowed for this application.', 400);
    }

    // Check if slug is unique
    const normalizedSlug = clientData.slug.trim().toLowerCase();
    const existingSlug = await Client.findOne({
      where: { slug: normalizedSlug }
    });

    if (existingSlug) {
      throw new AppError('Slug must be unique', 400);
    }

    // Check if name is unique
    const normalizedName = clientData.name.trim();
    const existingName = await Client.findOne({
      where: { name: normalizedName }
    });

    if (existingName) {
      throw new AppError('Client name must be unique', 400);
    }

    try {
      // Prepare data for creation
      const clientDataToCreate = {
        slug: normalizedSlug,
        name: normalizedName,
        url: clientData.url ? clientData.url.trim() : null,
        created_at: new Date()
      };

      // Use the monorepo create method (forces ID 1)
      return await Client.createMonorepoClient(clientDataToCreate);
    } catch (error) {
      if (error.message.includes('Monorepo client already exists')) {
        throw new AppError('Monorepo client already exists. Only one client is allowed for this application.', 400);
      }
      throw error;
    }
  }

  // Update client - only allow updating the monorepo client (ID 1)
  async updateClient(id, clientData) {
    // For monorepo, only ID 1 can be updated
    if (parseInt(id) !== 1) {
      throw new AppError('This is a monorepo application. Only client with ID 1 can be updated.', 400);
    }
    
    const clientRecord = await Client.findByPk(id);
    if (!clientRecord) {
      throw new AppError('Client not found. Please configure the monorepo client first.', 404);
    }

    // For monorepo client, slug and name cannot be changed once set
    if (clientData.slug && clientData.slug.trim().toLowerCase() !== clientRecord.slug) {
      throw new AppError('Client slug cannot be changed for monorepo client.', 400);
    }

    if (clientData.name && clientData.name.trim() !== clientRecord.name) {
      throw new AppError('Client name cannot be changed for monorepo client.', 400);
    }

    try {
      // Only allow updating URL
      const allowedUpdates = {
        url: clientData.url ? clientData.url.trim() : null
      };
      
      await clientRecord.update(allowedUpdates);
      return clientRecord;
    } catch (error) {
      throw new AppError('Failed to update client', 500);
    }
  }

  // Delete client - prevent deletion of monorepo client
  async deleteClient(id) {
    // For monorepo, deletion is not allowed
    throw new AppError('Cannot delete monorepo client. This is the only client for this application.', 400);
  }

  // REMOVED: getBusinessUnitsCountForClient - no association exists

  // Get the monorepo client (ID 1)
  async getMonorepoClient() {
    try {
      const client = await Client.getMonorepoClient();
      return client;
    } catch (error) {
      if (error.message.includes('No client configuration found')) {
        throw new AppError('No client configured yet. Please set up the monorepo client first.', 404);
      }
      throw new AppError('Failed to get client configuration', 500);
    }
  }

  // Get the main client instance (for backward compatibility)
  async getZineClient() {
    return await this.getMonorepoClient();
  }

  // Check if monorepo client exists
  async monorepoClientExists() {
    try {
      const client = await Client.findByPk(1);
      return !!client;
    } catch (error) {
      return false;
    }
  }

  // Create monorepo client with specific data
  async createMonorepoClient(clientData) {
    return await this.createClient(clientData);
  }

  // Update only the URL of the monorepo client
  async updateMonorepoClientUrl(url) {
    const clientRecord = await Client.findByPk(1);
    if (!clientRecord) {
      throw new AppError('Client not found. Please configure the monorepo client first.', 404);
    }

    await clientRecord.update({ url: url ? url.trim() : null });
    return clientRecord;
  }
}

export default new ClientService();