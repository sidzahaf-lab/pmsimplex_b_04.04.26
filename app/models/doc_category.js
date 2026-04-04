import { DataTypes } from 'sequelize';

const DocCategory = (sequelize) => {
  const DocCategoryModel = sequelize.define('DocCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each document category.'
    },
    label: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: {
        name: 'unique_category_label',
        msg: 'Category label already exists'
      },
      validate: {
        notNull: { msg: 'Category label is required' },
        notEmpty: { msg: 'Category label cannot be empty' },
        len: {
          args: [1, 250],
          msg: 'Category label must be between 1 and 250 characters'
        }
      },
      comment: 'Category name (e.g., Planning, Engineering, Procurement).'
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
      comment: 'Optional description of the category.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'doc_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at field as per specification
    hooks: {
      beforeValidate: (category) => {
        // Trim string fields
        if (category.label) category.label = category.label.trim();
        if (category.description) category.description = category.description.trim();
      }
    },
    indexes: [
      {
        name: 'idx_doc_category_label',
        fields: ['label']
      }
    ],
    comment: 'First level document classification. Configured at project start based on contractual requirements.'
  });

  // Define associations
  DocCategoryModel.associate = (models) => {
    DocCategoryModel.hasMany(models.DocSubcategory, {
      foreignKey: 'category_id',
      as: 'subcategories',
      onDelete: 'RESTRICT', // Prevent deletion if subcategories exist
      onUpdate: 'CASCADE'
    });
  };

  return DocCategoryModel;
};

export default DocCategory;