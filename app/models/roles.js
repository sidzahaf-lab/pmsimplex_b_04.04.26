// app/models/roles.js
import { DataTypes } from 'sequelize';

const Role = (sequelize) => {
  const RoleModel = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each role.'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_role_name',
        msg: 'Role name already exists'
      },
      validate: {
        notNull: { msg: 'Role name is required' },
        notEmpty: { msg: 'Role name cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'Role name must be between 1 and 50 characters'
        }
      },
      comment: 'Role name (e.g., Project Manager, Planning Engineer, Corporate PMO Officer, etc.)'
    },
    scope: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notNull: { msg: 'Scope is required' },
        notEmpty: { msg: 'Scope cannot be empty' },
        isIn: {
          args: [['bu', 'project', 'corporate', 'guest']],
          msg: 'Scope must be "bu", "project", "corporate", or "guest"'
        }
      },
      comment: 'Role scope: bu (Business Unit level), project (Project level), corporate (Cross-BU governance), or guest (temporary read-only access)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the role was created.'
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (role) => {
        if (role.name) role.name = role.name.trim();
      }
    },
    indexes: [
      {
        name: 'idx_roles_name',
        fields: ['name']
      },
      {
        name: 'idx_roles_scope',
        fields: ['scope']
      }
    ],
    comment: 'Roles table for PMSimplex access control.'
  });

  // Define associations
  RoleModel.associate = (models) => {
    // Team assignments (project and BU level)
    RoleModel.hasMany(models.Team, {
      foreignKey: 'role_id',
      as: 'team_assignments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Corporate role users (users with corporate_role_id)
    RoleModel.hasMany(models.User, {
      foreignKey: 'corporate_role_id',
      as: 'corporate_users',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Default role users (users with default_role_id - job position suggestion)
    RoleModel.hasMany(models.User, {
      foreignKey: 'default_role_id',
      as: 'default_role_users',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return RoleModel;
};

export default Role;