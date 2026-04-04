import { DataTypes } from 'sequelize';

const PeriodicReport = (sequelize) => {
  const PeriodicReportModel = sequelize.define('PeriodicReport', {
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
    template_ref: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        len: {
          args: [0, 150],
          msg: 'Template reference must not exceed 150 characters'
        }
      },
      comment: 'Template used.'
    },
    signatory: {
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
      comment: 'Official signatory.'
    },
    distribution_list: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Distribution list.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'periodic_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (report) => {
        if (report.template_ref) report.template_ref = report.template_ref.trim();
        if (report.distribution_list) report.distribution_list = report.distribution_list.trim();
      }
    },
    indexes: [
      {
        name: 'idx_periodic_report_signatory',
        fields: ['signatory']
      },
      {
        name: 'idx_periodic_report_template_ref',
        fields: ['template_ref']
      }
    ],
    comment: 'Periodic reports metadata table.'
  });

  PeriodicReportModel.associate = (models) => {
    PeriodicReportModel.belongsTo(models.ProjDoc, {
      foreignKey: 'projdoc_id',
      as: 'document',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    PeriodicReportModel.belongsTo(models.User, {
      foreignKey: 'signatory',
      as: 'signatory_user',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return PeriodicReportModel;
};

export default PeriodicReport;