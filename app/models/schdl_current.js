import { DataTypes } from 'sequelize';

const SchdlCurrent = (sequelize) => {
  const SchdlCurrentModel = sequelize.define('SchdlCurrent', {
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
    baseline_projdoc_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schdl_baselines',
        key: 'projdoc_id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Baseline document ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid baseline document ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference baseline.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'schdl_currents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_schdl_current_baseline_projdoc_id',
        fields: ['baseline_projdoc_id']
      }
    ],
    comment: 'Schedule current metadata table.'
  });

  SchdlCurrentModel.associate = (models) => {
    SchdlCurrentModel.belongsTo(models.ProjDoc, {
      foreignKey: 'projdoc_id',
      as: 'document',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    SchdlCurrentModel.belongsTo(models.SchdlBaseline, {
      foreignKey: 'baseline_projdoc_id',
      as: 'baseline',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return SchdlCurrentModel;
};

export default SchdlCurrent;