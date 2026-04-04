import { DataTypes } from 'sequelize';

const ProjDoc = (sequelize) => {
  const ProjDocModel = sequelize.define('ProjDoc', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each document.'
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
    doc_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doc_types',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Document type ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid document type ID format. Must be a valid UUID.'
        }
      },
      comment: 'Document classification reference.'
    },
    doc_number: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: 'Document number is required' },
        notEmpty: { msg: 'Document number cannot be empty' },
        len: {
          args: [1, 150],
          msg: 'Document number must be between 1 and 150 characters'
        }
      },
      comment: 'Official document number e.g., PRJ-SCH-001.'
    },
    title: {
      type: DataTypes.STRING(250),
      allowNull: true,
      validate: {
        len: {
          args: [0, 250],
          msg: 'Title must not exceed 250 characters'
        }
      },
      comment: 'Document title.'
    },
    emission_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'emission_policies',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid emission policy ID format. Must be a valid UUID.'
        }
      },
      comment: 'Emission policy reference (NULL for ad-hoc documents).'
    },
    status: {
      type: DataTypes.ENUM('active', 'superseded', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        notNull: { msg: 'Status is required' },
        isIn: {
          args: [['active', 'superseded', 'cancelled']],
          msg: 'Status must be active, superseded, or cancelled'
        }
      },
      comment: 'Official document status.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'projdocs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (doc) => {
        if (doc.doc_number) doc.doc_number = doc.doc_number.trim();
        if (doc.title) doc.title = doc.title.trim();
      },
      beforeSave: async (doc) => {
        // Check constraint: if doc_type.is_periodic = TRUE then emission_id <> NULL
        if (doc.doc_type_id && !doc.emission_id) {
          const docType = await sequelize.models.DocType.findByPk(doc.doc_type_id);
          if (docType && docType.is_periodic) {
            throw new Error('Emission ID is required for periodic documents');
          }
        }
      }
    },
    indexes: [
      {
        name: 'idx_projdoc_project_id',
        fields: ['project_id']
      },
      {
        name: 'idx_projdoc_doc_type_id',
        fields: ['doc_type_id']
      },
      {
        name: 'idx_projdoc_emission_id',
        fields: ['emission_id']
      },
      {
        name: 'idx_projdoc_status',
        fields: ['status']
      },
      {
        name: 'unique_projdoc_project_number',
        unique: true,
        fields: ['project_id', 'doc_number']
      }
    ],
    comment: 'Universal document registry table.'
  });

  ProjDocModel.associate = (models) => {
    ProjDocModel.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.belongsTo(models.DocType, {
      foreignKey: 'doc_type_id',
      as: 'doc_type',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.belongsTo(models.EmissionPolicy, {
      foreignKey: 'emission_id',
      as: 'emission_policy',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.hasMany(models.DocRevision, {
      foreignKey: 'projdoc_id',
      as: 'revisions',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.hasOne(models.SchdlBaseline, {
      foreignKey: 'projdoc_id',
      as: 'baseline_metadata',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.hasOne(models.SchdlCurrent, {
      foreignKey: 'projdoc_id',
      as: 'current_metadata',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    ProjDocModel.hasOne(models.PeriodicReport, {
      foreignKey: 'projdoc_id',
      as: 'report_metadata',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return ProjDocModel;
};

export default ProjDoc;