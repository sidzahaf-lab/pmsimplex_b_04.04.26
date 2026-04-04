'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each project.'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique project code.'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Project name/title.'
      },
      status: {
        type: Sequelize.ENUM('PLANNING', 'EXECUTION', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PLANNING',
        comment: 'Current status of project.'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Project start date.'
      },
      finish_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Project finish date.'
      },
      business_unit_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to business_unit table.'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Date and time when the project was created.'
      },
      last_modified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Date and time when the project was last modified.'
      }
    });

    // Add unique constraint for code
    await queryInterface.addConstraint('projects', {
      fields: ['code'],
      type: 'unique',
      name: 'unique_project_code',
    });

    // Add foreign key constraint for business_unit_id
    await queryInterface.addConstraint('projects', {
      fields: ['business_unit_id'],
      type: 'foreign key',
      name: 'fk_projects_business_unit',
      references: {
        table: 'business_unit',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add indexes for better performance
    await queryInterface.addIndex('projects', ['code'], {
      name: 'idx_projects_code',
    });

    await queryInterface.addIndex('projects', ['status'], {
      name: 'idx_projects_status',
    });

    await queryInterface.addIndex('projects', ['start_date'], {
      name: 'idx_projects_start_date',
    });

    await queryInterface.addIndex('projects', ['finish_date'], {
      name: 'idx_projects_finish_date',
    });

    await queryInterface.addIndex('projects', ['business_unit_id'], {
      name: 'idx_projects_business_unit_id',
    });

    await queryInterface.addIndex('projects', ['created_at'], {
      name: 'idx_projects_created_at',
    });

    // Add composite index for status and dates
    await queryInterface.addIndex('projects', ['status', 'start_date', 'finish_date'], {
      name: 'idx_projects_status_dates',
    });

    // Add trigger for last_modified_at (if using MySQL)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_projects_last_modified
      BEFORE UPDATE ON projects
      FOR EACH ROW
      SET NEW.last_modified_at = NOW();
    `).catch(() => {
      console.log('Trigger creation skipped (might not be supported in this MySQL version)');
    });

    // Add check constraint for date validation (if supported)
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE projects
        ADD CONSTRAINT chk_projects_dates 
        CHECK (start_date <= finish_date)
      `);
    } catch (error) {
      console.log('Check constraint skipped (MySQL version might not support check constraints)');
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop trigger first
    try {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_projects_last_modified
      `);
    } catch (error) {
      console.log('Trigger drop skipped');
    }

    // Drop check constraint
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_dates
      `);
    } catch (error) {
      console.log('Check constraint drop skipped');
    }

    // Drop indexes
    await queryInterface.removeIndex('projects', 'idx_projects_code');
    await queryInterface.removeIndex('projects', 'idx_projects_status');
    await queryInterface.removeIndex('projects', 'idx_projects_start_date');
    await queryInterface.removeIndex('projects', 'idx_projects_finish_date');
    await queryInterface.removeIndex('projects', 'idx_projects_business_unit_id');
    await queryInterface.removeIndex('projects', 'idx_projects_created_at');
    await queryInterface.removeIndex('projects', 'idx_projects_status_dates');

    // Drop constraints
    await queryInterface.removeConstraint('projects', 'unique_project_code');
    await queryInterface.removeConstraint('projects', 'fk_projects_business_unit');

    // Drop table
    await queryInterface.dropTable('projects');
  }
};