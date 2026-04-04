'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('business_unit', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'client',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('PMO', 'PMT', 'Department', 'Management_Board'),
        allowNull: false,
        defaultValue: 'PMT',
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    // Add foreign key constraint
    await queryInterface.addConstraint('business_unit', {
      fields: ['client_id'],
      type: 'foreign key',
      name: 'fk_business_unit_client',
      references: {
        table: 'client',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add unique constraint for client_id + name
    await queryInterface.addConstraint('business_unit', {
      fields: ['client_id', 'name'],
      type: 'unique',
      name: 'unique_business_unit_client_name',
    });

    // Add indexes
    await queryInterface.addIndex('business_unit', ['client_id'], {
      name: 'idx_business_unit_client_id',
    });

    await queryInterface.addIndex('business_unit', ['type'], {
      name: 'idx_business_unit_type',
    });

    await queryInterface.addIndex('business_unit', ['name'], {
      name: 'idx_business_unit_name',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('business_unit', 'idx_business_unit_client_id');
    await queryInterface.removeIndex('business_unit', 'idx_business_unit_type');
    await queryInterface.removeIndex('business_unit', 'idx_business_unit_name');
    
    // Remove constraints
    await queryInterface.removeConstraint('business_unit', 'unique_business_unit_client_name');
    await queryInterface.removeConstraint('business_unit', 'fk_business_unit_client');
    
    await queryInterface.dropTable('business_unit');
  }
};