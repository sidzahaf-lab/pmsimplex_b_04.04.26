import { DataTypes } from 'sequelize';

const PolicyDocType = (sequelize) => {
  const PolicyDocTypeModel = sequelize.define('PolicyDocType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each policy-document type association.'
    },
    policy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'emission_policies',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Policy ID is required' },
        notEmpty: { msg: 'Policy ID cannot be empty' },
        isUUID: {
          args: 4,
          msg: 'Invalid policy ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference to emission_policies table.'
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
        notEmpty: { msg: 'Document type ID cannot be empty' },
        isUUID: {
          args: 4,
          msg: 'Invalid document type ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference to doc_types table.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'policy_doc_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // This table doesn't have an updated_at field
    hooks: {
      beforeValidate: (policyDocType) => {
        // No string fields to trim, but we'll keep the hook structure
        // for consistency with the pattern
      }
    },
    indexes: [
      {
        name: 'unique_policy_doctype',
        unique: true,
        fields: ['policy_id', 'doc_type_id']
      },
      {
        name: 'idx_pdt_policy_id',
        fields: ['policy_id']
      },
      {
        name: 'idx_pdt_doc_type_id',
        fields: ['doc_type_id']
      }
    ],
    comment: 'Junction table for policy-document type associations'
  });

  // Define associations
  PolicyDocTypeModel.associate = (models) => {
    PolicyDocTypeModel.belongsTo(models.EmissionPolicy, {
      foreignKey: 'policy_id',
      as: 'policy',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    PolicyDocTypeModel.belongsTo(models.DocType, {
      foreignKey: 'doc_type_id',
      as: 'doc_type',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return PolicyDocTypeModel;
};

export default PolicyDocType;