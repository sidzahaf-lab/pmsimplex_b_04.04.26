import { DataTypes } from 'sequelize';

const Team = (sequelize) => {
  const TeamModel = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each team assignment.'
    },
    business_unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'business_unit',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Business unit ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid business unit ID format. Must be a valid UUID.'
        }
      },
      comment: 'FK to business_units. Always required regardless of scope.'
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid project ID format. Must be a valid UUID.'
        }
      },
      comment: 'FK to projects. NULL for BU-scoped roles, NOT NULL for project-scoped roles.'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'User ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid user ID format. Must be a valid UUID.'
        }
      },
      comment: 'FK to users. The assigned user.'
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Role ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid role ID format. Must be a valid UUID.'
        }
      },
      comment: 'FK to roles. Determines scope and permissions.'
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the assignment was created.'
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid assigned_by ID format. Must be a valid UUID.'
        }
      },
      comment: 'FK to users. Who performed the assignment.'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        notNull: { msg: 'is_active status is required' },
        isIn: {
          args: [[true, false]],
          msg: 'is_active must be a boolean value'
        }
      },
      comment: 'Whether this assignment is currently active.'
    },
    removed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when the assignment was deactivated.'
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    createdAt: 'assigned_at',
    updatedAt: false, // No updated_at column in the table
    hooks: {
      beforeValidate: (team) => {
        // Validate scope consistency
        if (team.project_id && team.business_unit_id) {
          // Both are provided, ensure consistency with role scope
          // This validation might need to check the role's scope, but that requires fetching the role
          // Consider adding a custom validator or handling this in a beforeCreate/beforeUpdate hook
        }
      },
      beforeCreate: async (team, options) => {
        // Ensure project_id is set for project-scoped roles
        // This requires access to the Role model, which we can get from sequelize
        if (team.role_id && sequelize.models.Role) {
          const role = await sequelize.models.Role.findByPk(team.role_id);
          if (role) {
            if (role.scope === 'project' && !team.project_id) {
              throw new Error('Project ID is required for project-scoped roles');
            }
            if (role.scope === 'bu' && team.project_id) {
              throw new Error('Project ID must be null for BU-scoped roles');
            }
          }
        }
      },
      beforeUpdate: async (team, options) => {
        // Similar validation for updates
        if (team.role_id && sequelize.models.Role) {
          const role = await sequelize.models.Role.findByPk(team.role_id);
          if (role) {
            if (role.scope === 'project' && !team.project_id) {
              throw new Error('Project ID is required for project-scoped roles');
            }
            if (role.scope === 'bu' && team.project_id) {
              throw new Error('Project ID must be null for BU-scoped roles');
            }
          }
        }
      }
    },
    indexes: [
      {
        name: 'idx_teams_unique_active_project',
        unique: true,
        fields: ['project_id', 'user_id', 'is_active'],
        where: {
          is_active: true
        }
      },
      {
        name: 'idx_teams_unique_active_bu',
        unique: true,
        fields: ['business_unit_id', 'user_id', 'is_active'],
        where: {
          is_active: true
        }
      },
      {
        name: 'idx_teams_business_unit',
        fields: ['business_unit_id']
      },
      {
        name: 'idx_teams_project',
        fields: ['project_id']
      },
      {
        name: 'idx_teams_user',
        fields: ['user_id']
      },
      {
        name: 'idx_teams_role',
        fields: ['role_id']
      },
      {
        name: 'idx_teams_is_active',
        fields: ['is_active']
      }
    ],
    comment: 'Team assignments linking users to roles at BU or project level.'
  });

  // Define associations
  TeamModel.associate = (models) => {
    TeamModel.belongsTo(models.BusinessUnit, {
      foreignKey: 'business_unit_id',
      as: 'business_unit',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    TeamModel.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    TeamModel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    TeamModel.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    TeamModel.belongsTo(models.User, {
      foreignKey: 'assigned_by',
      as: 'assigner',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return TeamModel;
};

export default Team;