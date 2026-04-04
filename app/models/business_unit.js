'use strict';
import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class BusinessUnit extends Model {
    static associate(models) {
      // Add associations here if needed in the future
      // For example, if BusinessUnit has many Employees, etc.
    }
    
    // Instance methods
    getStatus() {
      return this.is_active ? 'Active' : 'Inactive';
    }
    
    isActive() {
      return this.is_active === true;
    }
    
    // Static methods
    static async findActive() {
      return await this.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
    }
    
    static async findByName(name) {
      return await this.findOne({
        where: { name }
      });
    }
    
    static async findByNameLike(searchTerm) {
      return await this.findAll({
        where: {
          name: {
            [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
          }
        },
        order: [['name', 'ASC']]
      });
    }
    
    static async getActiveCount() {
      return await this.count({
        where: { is_active: true }
      });
    }
    
    static async getAllWithStatus() {
      const businessUnits = await this.findAll({
        order: [['name', 'ASC']]
      });
      
      return businessUnits.map(bu => ({
        ...bu.toJSON(),
        status: bu.getStatus()
      }));
    }
    
    // Override default toJSON
    toJSON() {
      const values = Object.assign({}, this.get());
      
      // Add computed properties
      values.status = this.getStatus();
      
      return values;
    }
  }
  
  BusinessUnit.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      comment: 'Unique identifier for each business unit.'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: 'Name is required'
        },
        notEmpty: {
          msg: 'Name cannot be empty'
        },
        len: {
          args: [1, 100],
          msg: 'Name must be between 1 and 100 characters'
        }
      },
      comment: 'Business unit name.'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Description cannot exceed 255 characters'
        }
      },
      comment: 'Business unit description.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        isIn: {
          args: [[true, false]],
          msg: 'is_active must be a boolean value'
        }
      },
      comment: 'Whether the business unit is active.'
    }
  }, {
    sequelize,
    modelName: 'BusinessUnit',
    tableName: 'business_unit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at column in the table
    hooks: {
      beforeValidate: (businessUnit) => {
        // Ensure name is trimmed
        if (businessUnit.name) {
          businessUnit.name = businessUnit.name.trim();
        }
        
        // Ensure description is trimmed or set to null
        if (businessUnit.description) {
          businessUnit.description = businessUnit.description.trim();
        } else {
          businessUnit.description = null;
        }
      }
    },
    indexes: [
      {
        unique: true,
        name: 'unique_bu_name',
        fields: ['name']
      },
      {
        name: 'idx_business_unit_is_active',
        fields: ['is_active']
      },
      {
        name: 'idx_business_unit_created_at',
        fields: ['created_at']
      }
    ]
  });

  return BusinessUnit;
};