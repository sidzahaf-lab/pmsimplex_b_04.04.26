import { Model, DataTypes } from 'sequelize';

export default class Project extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each project.'
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          name: 'unique_project_code',
          msg: 'Project code must be unique.'
        },
        validate: {
          notNull: {
            msg: 'Project code is required.'
          },
          notEmpty: {
            msg: 'Project code cannot be empty.'
          },
          len: {
            args: [1, 50],
            msg: 'Project code must be between 1 and 50 characters.'
          }
        },
        comment: 'Unique project code.'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Project name is required.'
          },
          notEmpty: {
            msg: 'Project name cannot be empty.'
          },
          len: {
            args: [1, 255],
            msg: 'Project name must be between 1 and 255 characters.'
          }
        },
        comment: 'Project name/title.'
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'Client name cannot exceed 255 characters.'
          }
        },
        comment: 'Client name.'
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Start date is required.'
          },
          isDate: {
            msg: 'Start date must be a valid date.'
          },
          isBeforePlannedEndDate(value) {
            if (this.planned_end_date && value > this.planned_end_date) {
              throw new Error('Start date cannot be after planned end date.');
            }
          }
        },
        comment: 'Project start date.'
      },
      planned_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Planned end date is required.'
          },
          isDate: {
            msg: 'Planned end date must be a valid date.'
          },
          isAfterStartDate(value) {
            if (this.start_date && value < this.start_date) {
              throw new Error('Planned end date cannot be before start date.');
            }
          }
        },
        comment: 'Planned project end date.'
      },
      baseline_finish_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'Baseline finish date must be a valid date.'
          }
        },
        comment: 'Baseline finish date from original schedule.'
      },
      current_finish_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'Current finish date must be a valid date.'
          }
        },
        comment: 'Current forecast finish date.'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Project description and objectives.'
      },
      health_status: {
        type: DataTypes.ENUM('good', 'warning', 'critical'),
        allowNull: true,
        validate: {
          isIn: {
            args: [['good', 'warning', 'critical']],
            msg: 'Health status must be one of: good, warning, critical.'
          }
        },
        comment: 'Project health status.'
      },
      business_unit_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'business_unit',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        validate: {
          isUUID: {
            args: 4,
            msg: 'Invalid business unit ID format. Must be a valid UUID version 4.'
          }
        },
        comment: 'Reference to business_unit table.'
      },
      contract_type: {
        type: DataTypes.ENUM(
          'EPC (Engineering, Procurement, Construction)',
          'EPCM (Engineering, Procurement, Construction Management)',
          'Conception-Construction',
          'Régie',
          'Forfait',
          'BOT (Build, Operate, Transfer)'
        ),
        allowNull: true,
        validate: {
          isIn: {
            args: [[
              'EPC (Engineering, Procurement, Construction)',
              'EPCM (Engineering, Procurement, Construction Management)',
              'Conception-Construction',
              'Régie',
              'Forfait',
              'BOT (Build, Operate, Transfer)'
            ]],
            msg: 'Invalid contract type.'
          }
        },
        comment: 'Type of contract.'
      },
      current_phase: {
        type: DataTypes.ENUM(
          'FEED (Front-End Engineering Design)',
          'Detailed Engineering',
          'Procurement',
          'Construction',
          'Pre-Commissioning',
          'Commissioning',
          'Close-out'
        ),
        allowNull: true,
        validate: {
          isIn: {
            args: [[
              'FEED (Front-End Engineering Design)',
              'Detailed Engineering',
              'Procurement',
              'Construction',
              'Pre-Commissioning',
              'Commissioning',
              'Close-out'
            ]],
            msg: 'Invalid project phase.'
          }
        },
        comment: 'Current project phase.'
      },
      contract_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
          isDecimal: {
            msg: 'Contract value must be a valid decimal number.'
          },
          min: {
            args: [0],
            msg: 'Contract value cannot be negative.'
          }
        },
        comment: 'Total contract value.'
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        validate: {
          len: {
            args: [3, 3],
            msg: 'Currency code must be exactly 3 characters (ISO 4217).'
          },
          isUppercase: {
            msg: 'Currency code must be uppercase.'
          }
        },
        comment: 'Currency code (ISO 4217).'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Date and time when the project was created.'
      },
      last_modified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Date and time when the project was last modified.'
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        validate: {
          isUUID: {
            args: 4,
            msg: 'Invalid user ID format. Must be a valid UUID version 4.'
          }
        },
        comment: 'User ID who created the project.'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
          isIn: {
            args: [[true, false]],
            msg: 'is_active must be a boolean value.'
          }
        },
        comment: 'Whether the project is active.'
      }
    }, {
      sequelize,
      modelName: 'Project',
      tableName: 'projects',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: 'idx_project_business_unit_id',
          fields: ['business_unit_id']
        },
        {
          name: 'idx_project_created_by',
          fields: ['created_by']
        },
        {
          name: 'idx_project_health_status',
          fields: ['health_status']
        },
        {
          name: 'idx_project_current_phase',
          fields: ['current_phase']
        },
        {
          name: 'idx_project_dates',
          fields: ['start_date', 'planned_end_date']
        },
        {
          name: 'idx_project_is_active',
          fields: ['is_active']
        }
      ],
      hooks: {
        beforeUpdate: (project) => {
          project.last_modified_at = new Date();
        }
      }
    });
  }

  static associate(models) {
    // Define associations here
    this.belongsTo(models.BusinessUnit, {
      foreignKey: 'business_unit_id',
      as: 'business_unit',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }

  // Static methods - only for querying, no calculations
  static async findByCode(code) {
    return await this.findOne({ where: { code } });
  }

  static async getActiveProjects() {
    return await this.findAll({ 
      where: { is_active: true }
    });
  }

  static async getProjectsByBusinessUnit(businessUnitId) {
    return await this.findAll({
      where: {
        business_unit_id: businessUnitId,
        is_active: true
      }
    });
  }

  static async getProjectsByHealthStatus(status) {
    return await this.findAll({
      where: {
        health_status: status,
        is_active: true
      }
    });
  }

  static async getProjectsByPhase(phase) {
    return await this.findAll({
      where: {
        current_phase: phase,
        is_active: true
      }
    });
  }

  static async getUpcomingProjects(days = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return await this.findAll({
      where: {
        is_active: true,
        start_date: {
          [this.sequelize.Op.lte]: targetDate,
          [this.sequelize.Op.gte]: new Date()
        }
      }
    });
  }

  static async getProjectsNearingCompletion(days = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return await this.findAll({
      where: {
        is_active: true,
        planned_end_date: {
          [this.sequelize.Op.lte]: targetDate,
          [this.sequelize.Op.gte]: new Date()
        }
      }
    });
  }

  static async getProjectsWithBusinessUnit() {
    return await this.findAll({
      where: { is_active: true },
      include: [{
        model: this.sequelize.models.BusinessUnit,
        as: 'business_unit',
        attributes: ['id', 'name', 'description', 'is_active']
      }]
    });
  }

  static async getProjectWithDetails(projectId) {
    return await this.findByPk(projectId, {
      include: [{
        model: this.sequelize.models.BusinessUnit,
        as: 'business_unit'
      }]
    });
  }

  // Simple toJSON without any computed properties
  toJSON() {
    return { ...this.get() };
  }
}