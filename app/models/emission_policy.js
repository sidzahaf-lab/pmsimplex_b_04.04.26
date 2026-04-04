import { DataTypes } from 'sequelize';

const EmissionPolicy = (sequelize) => {
  const EmissionPolicyModel = sequelize.define('EmissionPolicy', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each emission policy.'
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Project ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid project ID format. Must be a valid UUID.'
        }
      },
      comment: 'Parent project reference.'
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
      validate: {
        notNull: { msg: 'Frequency is required' },
        isIn: {
          args: [['daily', 'weekly', 'monthly']],
          msg: 'Frequency must be daily, weekly, or monthly'
        }
      },
      comment: 'Emission cadence.'
    },
    anchor_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: 'Anchor date is required' },
        isDate: { msg: 'Anchor date must be a valid date' }
      },
      comment: 'Starting date of the cycle.'
    },
    anchor_day: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      validate: {
        isValidAnchorDay(value) {
          if (this.frequency === 'weekly') {
            // For weekly, must be between 1-7
            if (!value || value < 1 || value > 7) {
              throw new Error('Anchor day must be between 1 and 7 for weekly frequency');
            }
          } else if (this.frequency === 'monthly') {
            // For monthly, can be null or 0 (special value)
            if (value !== null && value !== 0) {
              throw new Error('Anchor day must be null or 0 for monthly frequency');
            }
          } else if (this.frequency === 'daily') {
            // For daily, must be null
            if (value !== null) {
              throw new Error('Anchor day must be null for daily frequency');
            }
          }
        }
      },
      comment: 'Reference day (1=Monday ... 7=Sunday) for weekly frequency, 0 for monthly (special value), null for others.'
    },
    description: {
      type: DataTypes.STRING(250),
      allowNull: true,
      validate: {
        len: {
          args: [0, 250],
          msg: 'Description must not exceed 250 characters'
        }
      },
      comment: 'Procedure label.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'emission_policies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (policy) => {
        if (policy.description) policy.description = policy.description.trim();
      },
      beforeSave: (policy) => {
        // This hook is now redundant as validation is handled in the validator
        // But we keep it for backward compatibility
        console.log('📅 beforeSave hook - anchor_day:', policy.anchor_day, 'frequency:', policy.frequency);
      }
    },
    indexes: [
      {
        name: 'idx_emission_policy_project_id',
        fields: ['project_id']
      },
      {
        name: 'idx_emission_policy_frequency',
        fields: ['frequency']
      },
      {
        name: 'idx_emission_policy_anchor_date',
        fields: ['anchor_date']
      }
    ],
    comment: 'Document emission policies table.'
  });

  EmissionPolicyModel.associate = (models) => {
    EmissionPolicyModel.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    EmissionPolicyModel.hasMany(models.EmissionPeriod, {
      foreignKey: 'emission_id',
      as: 'periods',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    EmissionPolicyModel.hasMany(models.ProjDoc, {
      foreignKey: 'emission_id',
      as: 'documents',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // Add many-to-many relationship with DocType through PolicyDocType
    EmissionPolicyModel.belongsToMany(models.DocType, {
      through: models.PolicyDocType,
      foreignKey: 'policy_id',
      otherKey: 'doc_type_id',
      as: 'doc_types',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // Add direct hasMany to PolicyDocType for more control
    EmissionPolicyModel.hasMany(models.PolicyDocType, {
      foreignKey: 'policy_id',
      as: 'doc_type_associations',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return EmissionPolicyModel;
};

export default EmissionPolicy;