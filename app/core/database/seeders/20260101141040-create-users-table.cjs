'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      phonenumber: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      family_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      specialty: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      business_unit_id: {
        type: Sequelize.CHAR(36), // Changed to CHAR(36) for UUID
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_modified_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add foreign key constraint for business_unit_id
    await queryInterface.addConstraint('users', {
      fields: ['business_unit_id'],
      type: 'foreign key',
      name: 'fk_users_business_unit',
      references: {
        table: 'business_unit',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Add unique constraints
    await queryInterface.addConstraint('users', {
      fields: ['username'],
      type: 'unique',
      name: 'users_username_unique',
    });

    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'unique',
      name: 'users_email_unique',
    });

    // Add indexes
    await queryInterface.addIndex('users', ['business_unit_id'], {
      name: 'idx_users_business_unit_id',
    });

    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
    });

    await queryInterface.addIndex('users', ['username'], {
      name: 'idx_users_username',
    });

    await queryInterface.addIndex('users', ['is_active'], {
      name: 'idx_users_is_active',
    });

    await queryInterface.addIndex('users', ['name', 'family_name'], {
      name: 'idx_users_name_family',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('users', 'idx_users_business_unit_id');
    await queryInterface.removeIndex('users', 'idx_users_email');
    await queryInterface.removeIndex('users', 'idx_users_username');
    await queryInterface.removeIndex('users', 'idx_users_is_active');
    await queryInterface.removeIndex('users', 'idx_users_name_family');
    
    // Remove constraints
    await queryInterface.removeConstraint('users', 'users_username_unique');
    await queryInterface.removeConstraint('users', 'users_email_unique');
    await queryInterface.removeConstraint('users', 'fk_users_business_unit');
    
    await queryInterface.dropTable('users');
  }
};