// app/models/users.js
import { DataTypes } from 'sequelize';

const User = (sequelize) => {
  const UserModel = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each user.'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_username',
        msg: 'Username already exists'
      },
      validate: {
        notNull: { msg: 'Username is required' },
        notEmpty: { msg: 'Username cannot be empty' },
        len: {
          args: [3, 50],
          msg: 'Username must be between 3 and 50 characters'
        }
      },
      comment: 'Username for login.'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Password hash is required' },
        notEmpty: { msg: 'Password hash cannot be empty' }
      },
      comment: 'Hashed password.'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Email already exists'
      },
      validate: {
        notNull: { msg: 'Email is required' },
        notEmpty: { msg: 'Email cannot be empty' },
        isEmail: { msg: 'Please provide a valid email address' },
        len: {
          args: [1, 100],
          msg: 'Email must not exceed 100 characters'
        }
      },
      comment: 'User email address.'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: {
          args: [0, 20],
          msg: 'Phone number must not exceed 20 characters'
        }
      },
      comment: 'Contact phone number.'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Name is required' },
        notEmpty: { msg: 'Name cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'Name must be between 1 and 50 characters'
        }
      },
      comment: 'First name.'
    },
    family_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Family name is required' },
        notEmpty: { msg: 'Family name cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'Family name must be between 1 and 50 characters'
        }
      },
      comment: 'Last name.'
    },
    job_title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Job title is required' },
        notEmpty: { msg: 'Job title cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Job title must be between 1 and 100 characters'
        }
      },
      comment: 'Job title.'
    },
    business_unit_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'business_unit',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid business unit ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference to business_unit table.'
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Department must not exceed 50 characters'
        }
      },
      comment: 'Department name.'
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
      comment: 'Whether the user is active.'
    },
    // ============================================
    // ROLE HIERARCHY FIELDS
    // ============================================
    
    // Level 1 - Super Admin (full system access)
    is_super_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notNull: { msg: 'is_super_admin status is required' },
        isIn: {
          args: [[true, false]],
          msg: 'is_super_admin must be a boolean value'
        }
      },
      comment: 'Full system access. Reserved for app creator.'
    },
    
    // Level 2 - Guest (time-limited read-only access)
    is_guest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notNull: { msg: 'is_guest status is required' },
        isIn: {
          args: [[true, false]],
          msg: 'is_guest must be a boolean value'
        }
      },
      comment: 'Guest user — read-only, time-limited access.'
    },
    
    // Guest first access timestamp (24h window starts here)
    guest_first_access: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of first login. 24h window starts here.'
    },
    
    // Guest expiration timestamp (first_access + 24h)
    guest_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Computed: guest_first_access + 24h. Checked on every request.'
    },
    
    // Level 3 - Corporate Role (cross-BU governance)
    corporate_role_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid corporate role ID format. Must be a valid UUID.'
        }
      },
      comment: 'Corporate-level role. Grants cross-BU access. NULL for regular users.'
    },
    
    // Level 4 & 5 - Default Role (job position suggestion, no permissions)
    default_role_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid default role ID format. Must be a valid UUID.'
        }
      },
      comment: 'Default job position. Suggestion only, no permissions granted.'
    },
    
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    },
    last_modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Last modification timestamp.'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_modified_at',
    hooks: {
      beforeUpdate: (user) => {
        user.last_modified_at = new Date();
      },
      beforeValidate: (user) => {
        // Trim string fields
        if (user.username) user.username = user.username.trim();
        if (user.email) user.email = user.email.trim().toLowerCase();
        if (user.phone_number) user.phone_number = user.phone_number.trim();
        if (user.name) user.name = user.name.trim();
        if (user.family_name) user.family_name = user.family_name.trim();
        if (user.job_title) user.job_title = user.job_title.trim();
        if (user.department) user.department = user.department.trim();
      }
    },
    indexes: [
      {
        name: 'idx_user_business_unit_id',
        fields: ['business_unit_id']
      },
      {
        name: 'idx_user_email',
        fields: ['email']
      },
      {
        name: 'idx_user_username',
        fields: ['username']
      },
      {
        name: 'idx_user_is_active',
        fields: ['is_active']
      },
      {
        name: 'idx_user_department',
        fields: ['department']
      },
      {
        name: 'idx_user_is_super_admin',
        fields: ['is_super_admin']
      },
      {
        name: 'idx_users_is_guest',
        fields: ['is_guest']
      },
      {
        name: 'idx_users_guest_expires_at',
        fields: ['guest_expires_at']
      },
      {
        name: 'idx_users_corporate_role_id',
        fields: ['corporate_role_id']
      },
      {
        name: 'idx_users_default_role_id',
        fields: ['default_role_id']
      }
    ],
    comment: 'Users table'
  });

  // Define associations
  UserModel.associate = (models) => {
    // Business Unit association
    UserModel.belongsTo(models.BusinessUnit, {
      foreignKey: 'business_unit_id',
      as: 'business_unit',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Session associations
    UserModel.hasMany(models.Session, {
      foreignKey: 'user_id',
      as: 'sessions',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Corporate Role association (Level 3)
    UserModel.belongsTo(models.Role, {
      foreignKey: 'corporate_role_id',
      as: 'corporate_role',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Default Role association (suggestion only)
    UserModel.belongsTo(models.Role, {
      foreignKey: 'default_role_id',
      as: 'default_role',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Team associations (project and BU roles)
    UserModel.hasMany(models.Team, {
      foreignKey: 'user_id',
      as: 'team_assignments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Created projects
    UserModel.hasMany(models.Project, {
      foreignKey: 'created_by',
      as: 'created_projects',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return UserModel;
};

export default User;