'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, ensure the parent table exists
    const tableExists = await queryInterface.showAllTables();
    
    if (!tableExists.includes('activities')) {
      throw new Error('Parent table "activities" does not exist. Run activity migration first.');
    }

    // Create activity_progress table with EXACTLY matching UUID type
    await queryInterface.createTable('activity_progress', {
      id: {
        type: Sequelize.UUID,  // Changed from CHAR(36) to UUID for consistency
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique progress record'
      },
      activity_id: {
        type: Sequelize.UUID,  // Changed to match parent table
        allowNull: false,
        references: {
          model: 'activities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Parent activity'
      },
      progress_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Reporting reference date (day or week-ending)'
      },
      period_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Start date of progress period'
      },
      period_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'End date of progress period'
      },
      actual_quantity_delta: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0.0000,
        comment: 'Quantity achieved during the period'
      },
      actual_quantity_cumulative: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0.0000,
        comment: 'Total quantity achieved up to progress_date'
      },
      progress_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Cumulative % complete at progress_date'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes / comments'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Record creation timestamp'
      }
    });

    // Add indexes (without foreign key yet if it failed)
    await queryInterface.addIndex('activity_progress', ['activity_id'], {
      name: 'idx_activity_progress_activity_id'
    });
    
    await queryInterface.addIndex('activity_progress', ['progress_date'], {
      name: 'idx_activity_progress_date'
    });
    
    await queryInterface.addIndex('activity_progress', ['period_start_date'], {
      name: 'idx_activity_progress_period_start'
    });
    
    await queryInterface.addIndex('activity_progress', ['period_end_date'], {
      name: 'idx_activity_progress_period_end'
    });
    
    await queryInterface.addIndex('activity_progress', ['progress_percent'], {
      name: 'idx_activity_progress_percent'
    });

    // Composite indexes for common query patterns
    await queryInterface.addIndex('activity_progress', 
      ['activity_id', 'progress_date'], {
      name: 'idx_activity_progress_activity_date',
      unique: true
    });
    
    await queryInterface.addIndex('activity_progress', 
      ['activity_id', 'period_end_date'], {
      name: 'idx_activity_progress_activity_period_end'
    });

    // Now add foreign key constraint separately to isolate any issues
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE activity_progress 
        ADD CONSTRAINT fk_activity_progress_activity
        FOREIGN KEY (activity_id) 
        REFERENCES activities(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
      `);
    } catch (error) {
      console.warn('Foreign key constraint warning:', error.message);
      console.log('Continuing with table creation without foreign key...');
    }

    // CHECK constraints for data integrity
    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress
      ADD CONSTRAINT check_progress_percent_range 
      CHECK (
        progress_percent IS NULL OR 
        (progress_percent >= 0 AND progress_percent <= 100)
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress
      ADD CONSTRAINT check_progress_period_dates 
      CHECK (period_start_date <= period_end_date);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress
      ADD CONSTRAINT check_progress_date_consistency 
      CHECK (progress_date >= period_end_date);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress
      ADD CONSTRAINT check_quantity_delta_non_negative 
      CHECK (actual_quantity_delta >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress
      ADD CONSTRAINT check_cumulative_quantity 
      CHECK (actual_quantity_cumulative >= actual_quantity_delta);
    `);
  },

  async down(queryInterface, Sequelize) {
    // First try to remove foreign key if it exists
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE activity_progress 
        DROP FOREIGN KEY fk_activity_progress_activity;
      `);
    } catch (error) {
      console.warn('Could not drop foreign key:', error.message);
    }

    // Drop CHECK constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE activity_progress 
      DROP CHECK check_progress_percent_range,
      DROP CHECK check_progress_period_dates,
      DROP CHECK check_progress_date_consistency,
      DROP CHECK check_quantity_delta_non_negative,
      DROP CHECK check_cumulative_quantity;
    `);

    // Drop composite indexes first
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_activity_date');
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_activity_period_end');

    // Drop single column indexes
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_activity_id');
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_date');
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_period_start');
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_period_end');
    await queryInterface.removeIndex('activity_progress', 'idx_activity_progress_percent');

    // Drop table
    await queryInterface.dropTable('activity_progress');
  }
};