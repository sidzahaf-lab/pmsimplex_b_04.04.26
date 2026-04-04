// app/models/session.js
import { DataTypes } from 'sequelize';

const Session = (sequelize) => {
  const SessionModel = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each session.'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'User ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid user ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reference to the user.'
    },
    refresh_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notNull: { msg: 'Refresh token is required' },
        notEmpty: { msg: 'Refresh token cannot be empty' }
      },
      comment: 'JWT refresh token.'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: { msg: 'Expiration date is required' },
        isDate: { msg: 'Invalid date format' }
      },
      comment: 'When the refresh token expires.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the session was created.'
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notNull: { msg: 'revoked status is required' },
        isIn: {
          args: [[true, false]],
          msg: 'revoked must be a boolean value'
        }
      },
      comment: 'Whether the refresh token has been revoked.'
    }
  }, {
    tableName: 'sessions',
    timestamps: false,
    indexes: [
      {
        name: 'idx_sessions_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_sessions_refresh_token',
        fields: ['refresh_token']
      },
      {
        name: 'idx_sessions_expires_at',
        fields: ['expires_at']
      },
      {
        name: 'idx_sessions_revoked',
        fields: ['revoked']
      }
    ],
    comment: 'Sessions table for refresh token management.'
  });

  // Define associations
  SessionModel.associate = (models) => {
    SessionModel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return SessionModel;
};

export default Session;