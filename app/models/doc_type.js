import { DataTypes } from 'sequelize';
import path from 'path';

const DocType = (sequelize) => {
  const DocTypeModel = sequelize.define('DocType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for document type.'
    },
    subcategory_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doc_subcategories',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Subcategory ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid subcategory ID format. Must be a valid UUID.'
        }
      },
      comment: 'Foreign key to doc_subcategories.'
    },
    label: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notNull: { msg: 'Document type label is required' },
        notEmpty: { msg: 'Document type label cannot be empty' },
        len: {
          args: [1, 250],
          msg: 'Document type label must be between 1 and 250 characters'
        }
      },
      comment: 'Document type name (e.g., Schedule Baseline, Weekly HSE Report).'
    },
    is_periodic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notNull: { msg: 'is_periodic status is required' }
      },
      comment: 'Whether the document is periodic or ad hoc.'
    },
    only_one_per_project: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notNull: { msg: 'only_one_per_project status is required' }
      },
      comment: 'Whether only one document of this type is allowed per project. Enforced in service layer.'
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Entity type is required' },
        notEmpty: { msg: 'Entity type cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Entity type must be between 1 and 100 characters'
        }
      },
      comment: 'Entity type (e.g., schedule_baseline, report, drawing).'
    },
    native_format: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Native format is required' },
        notEmpty: { msg: 'Native format cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Native format must be between 1 and 100 characters'
        },
        isValidFormatList(value) {
          const formats = value.split(',');
          for (let format of formats) {
            format = format.trim();
            if (format.startsWith('.')) {
              throw new Error(`Formats should not include dots (e.g., use "pdf" not ".pdf"): ${format}`);
            }
            if (format.length < 1) {
              throw new Error(`Invalid format extension: ${format}`);
            }
          }
        }
      },
      comment: 'Accepted file formats (e.g., pdf,xer,xml,xlsx,dwg).'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'doc_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at in SQL schema
    hooks: {
      beforeValidate: (docType) => {
        // Trim string fields
        if (docType.label) docType.label = docType.label.trim();
        if (docType.entity_type) docType.entity_type = docType.entity_type.trim().toLowerCase();
        if (docType.native_format) {
          // Remove spaces and ensure consistent formatting (no dots)
          docType.native_format = docType.native_format
            .split(',')
            .map(f => f.trim().toLowerCase().replace(/^\./, '')) // Remove dots if present
            .join(',');
        }
      }
    },
    indexes: [
      {
        name: 'fk_type_subcategory',
        fields: ['subcategory_id']
      },
      {
        name: 'idx_doc_type_entity_type',
        fields: ['entity_type']
      },
      {
        name: 'idx_doc_type_is_periodic',
        fields: ['is_periodic']
      },
      {
        name: 'unique_type_per_subcategory',
        unique: true,
        fields: ['subcategory_id', 'label']
      }
    ],
    comment: 'Third level document classification - precise document type with metadata.'
  });

  // Define associations
  DocTypeModel.associate = (models) => {
    DocTypeModel.belongsTo(models.DocSubcategory, {
      foreignKey: 'subcategory_id',
      as: 'subcategory',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Add this if you have a documents table that references doc_types
    // DocTypeModel.hasMany(models.Document, {
    //   foreignKey: 'doc_type_id',
    //   as: 'documents'
    // });
  };

  // Add instance method to validate file format against native_format
  DocTypeModel.prototype.validateFileFormat = function(filename) {
    const allowedFormats = this.native_format.split(',').map(f => f.trim().toLowerCase());
    const uploadedExt = path.extname(filename).toLowerCase().replace('.', ''); // Remove dot for comparison
    
    if (!allowedFormats.includes(uploadedExt)) {
      throw new Error(`Format non autorisé. Formats acceptés : ${allowedFormats.map(f => '.' + f).join(', ')}`);
    }
    
    return true;
  };

  return DocTypeModel;
};

export default DocType;