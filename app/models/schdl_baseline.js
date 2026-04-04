import { DataTypes } from 'sequelize';

const SchdlBaseline = (sequelize) => {
  const SchdlBaselineModel = sequelize.define('SchdlBaseline', {
    projdoc_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'projdocs',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Project document ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid project document ID format. Must be a valid UUID.'
        }
      },
      comment: 'Link to document registry.'
    },
    frozen_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: { msg: 'Frozen date must be a valid date' }
      },
      comment: 'Official baseline freeze date.'
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid user ID format. Must be a valid UUID.'
        }
      },
      comment: 'Approving user.'
    },
    contract_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Contract reference must not exceed 100 characters'
        }
      },
      comment: 'Contractual reference.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'schdl_baselines',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (baseline) => {
        if (baseline.contract_ref) baseline.contract_ref = baseline.contract_ref.trim();
      }
    },
    indexes: [
      {
        name: 'idx_schdl_baseline_approved_by',
        fields: ['approved_by']
      },
      {
        name: 'idx_schdl_baseline_frozen_at',
        fields: ['frozen_at']
      }
    ],
    comment: 'Schedule baseline metadata table.'
  });

  SchdlBaselineModel.associate = (models) => {
    SchdlBaselineModel.belongsTo(models.ProjDoc, {
      foreignKey: 'projdoc_id',
      as: 'document',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    SchdlBaselineModel.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    SchdlBaselineModel.hasMany(models.SchdlCurrent, {
      foreignKey: 'baseline_projdoc_id',
      as: 'current_schedules',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return SchdlBaselineModel;
};

export default SchdlBaseline;