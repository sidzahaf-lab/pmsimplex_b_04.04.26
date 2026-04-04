'use strict';
import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Client extends Model {
    static associate(models) {
      // No association with business_unit since there's no client_id in business_unit table
      // Business units are now independent entities
    }

    /**
     * Get the monorepo client (always ID 1)
     */
    static async getMonorepoClient() {
      const client = await this.findByPk(1);
      if (!client) {
        throw new Error('No client configuration found. Please configure the monorepo client.');
      }
      return client;
    }

    /**
     * Get or create monorepo client
     */
    static async getOrCreateMonorepoClient() {
      try {
        return await this.findByPk(1);
      } catch (error) {
        return null;
      }
    }

    /**
     * Create monorepo client with ID 1
     */
    static async createMonorepoClient(data) {
      // Check if client already exists
      const existingClient = await this.findByPk(1);
      if (existingClient) {
        throw new Error('Monorepo client already exists. Cannot create another one.');
      }
      
      // Force ID to be 1
      return await this.create({
        id: 1,
        ...data,
        created_at: new Date()
      });
    }

    /**
     * Update monorepo client
     */
    static async updateMonorepoClient(data) {
      const client = await this.findByPk(1);
      if (!client) {
        throw new Error('Monorepo client not found. Please create it first.');
      }
      return await client.update(data);
    }

    /**
     * Check if monorepo client exists
     */
    static async monorepoClientExists() {
      const count = await this.count({
        where: { id: 1 }
      });
      return count > 0;
    }

    /**
     * Get the client instance (for backward compatibility)
     */
    static async getClient() {
      return await this.getMonorepoClient();
    }

    /**
     * Get client by slug
     */
    static async getBySlug(slug) {
      return await this.findOne({ 
        where: { slug }
        // Removed include since there's no association
      });
    }

    /**
     * Get all clients
     */
    static async getAllClients() {
      return await this.findAll({ 
        order: [['created_at', 'DESC']]
        // Removed include since there's no association
      });
    }

    /**
     * Get client by ID
     */
    static async getById(id) {
      return await this.findByPk(id);
    }

    /**
     * Since there's no direct association, we need to manually query business units
     * if we want to get business units related to this client in some way.
     * This would require a separate field in business_unit to link to client,
     * which currently doesn't exist.
     */
    
    /**
     * Get business units (if they were related somehow - but they're not)
     * This method is kept as a placeholder but will return empty array
     * since there's no relationship in the schema
     */
    async getBusinessUnits() {
      console.warn('No association exists between client and business_unit tables');
      return [];
    }

    /**
     * Check if client has business units (always false with current schema)
     */
    async hasBusinessUnits() {
      console.warn('No association exists between client and business_unit tables');
      return false;
    }

    /**
     * Get business units count (always 0 with current schema)
     */
    async getBusinessUnitsCount() {
      console.warn('No association exists between client and business_unit tables');
      return 0;
    }

    toJSON() {
      const values = { ...this.get() };
      
      // Remove any business units related fields since there's no association
      delete values.business_units;
      delete values.business_units_count;
      
      return values;
    }
  }

  Client.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false, // Disable auto-increment for monorepo
      defaultValue: 1, // Always use ID 1
      validate: {
        isMonorepoId(value) {
          if (value !== 1) {
            throw new Error('Client ID must be 1 for monorepo setup');
          }
        }
      }
    },
    slug: {
      type: DataTypes.STRING(25),
      allowNull: false,
      unique: {
        name: 'client_slug_unique',
        msg: 'Slug must be unique'
      },
      validate: {
        notNull: {
          msg: 'Slug is required'
        },
        notEmpty: {
          msg: 'Slug cannot be empty'
        },
        len: {
          args: [1, 25],
          msg: 'Slug must be between 1 and 25 characters'
        }
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'client_name_unique',
        msg: 'Company name must be unique'
      },
      validate: {
        notNull: {
          msg: 'Company name is required'
        },
        notEmpty: {
          msg: 'Company name cannot be empty'
        },
        len: {
          args: [1, 50],
          msg: 'Company name must be between 1 and 50 characters'
        }
      }
    },
    url: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'URL must be a valid URL'
        },
        len: {
          args: [0, 50],
          msg: 'URL cannot exceed 50 characters'
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'client',
    underscored: true,
    timestamps: false,
    hooks: {
      beforeCreate: async (client, options) => {
        // Ensure ID is always 1 for new clients
        client.id = 1;
        
        // Check if client with ID 1 already exists
        const existingClient = await Client.findByPk(1);
        if (existingClient) {
          throw new Error('Monorepo client already exists. Only one client is allowed.');
        }
      },
      beforeBulkCreate: async (clients, options) => {
        // Prevent bulk creation
        throw new Error('Bulk creation not allowed for monorepo client');
      },
      beforeValidate: (client) => {
        // Ensure slug is lowercase and trimmed
        if (client.slug) {
          client.slug = client.slug.toLowerCase().trim();
        }
        
        // Ensure name is trimmed
        if (client.name) {
          client.name = client.name.trim();
        }
      }
    },
    indexes: [
      {
        unique: true,
        name: 'client_slug_unique',
        fields: ['slug']
      },
      {
        unique: true,
        name: 'client_name_unique',
        fields: ['name']
      }
    ]
  });

  return Client;
};