import { DataTypes } from 'sequelize';

const DocSubcategory = (sequelize) => {
  const DocSubcategoryModel = sequelize.define('DocSubcategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each document subcategory.'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doc_categories',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Category ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid category ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference to parent doc_category.'
    },
    label: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notNull: { msg: 'Subcategory label is required' },
        notEmpty: { msg: 'Subcategory label cannot be empty' },
        len: {
          args: [1, 250],
          msg: 'Subcategory label must be between 1 and 250 characters'
        }
      },
      comment: 'Subcategory name (e.g., Schedule, Drawing, Specification).'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 65535],
          msg: 'Description exceeds maximum length'
        }
      },
      comment: 'Optional description of the subcategory.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'doc_subcategories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (subcategory) => {
        // Trim string fields
        if (subcategory.label) subcategory.label = subcategory.label.trim();
        if (subcategory.description) subcategory.description = subcategory.description.trim();
      }
    },
    indexes: [
      {
        name: 'idx_doc_subcategory_category_id',
        fields: ['category_id']
      },
      {
        name: 'unique_category_subcategory',
        unique: true,
        fields: ['category_id', 'label'],
        msg: 'Subcategory label must be unique within its category'
      }
    ],
    comment: 'Second level document classification. Refines filtering without overloading projdoc.'
  });

  // Define associations
  DocSubcategoryModel.associate = (models) => {
    DocSubcategoryModel.belongsTo(models.DocCategory, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    DocSubcategoryModel.hasMany(models.DocType, {
      foreignKey: 'subcategory_id',
      as: 'doc_types',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return DocSubcategoryModel;
};

export default DocSubcategory;