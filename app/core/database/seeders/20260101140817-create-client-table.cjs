'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(25),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      url: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add constraints and indexes
    await queryInterface.addConstraint('client', {
      fields: ['slug'],
      type: 'unique',
      name: 'client_slug_unique',
    });

    await queryInterface.addConstraint('client', {
      fields: ['name'],
      type: 'unique',
      name: 'client_name_unique',
    });

    // Add index for slug
    await queryInterface.addIndex('client', ['slug'], {
      name: 'idx_client_slug',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client');
  }
};