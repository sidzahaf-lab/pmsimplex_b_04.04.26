'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create activities table
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each activity'
      },
      workpackage_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workpackages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Reference to work package'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Activity code'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Activity name/title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the activity'
      },
      planned_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Planned start date of the activity'
      },
      planned_finish: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Planned finish date of the activity'
      },
      planned_quantity: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: true,
        comment: 'Planned quantity for the activity'
      },
      uom: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Unit of measurement'
      },
      status: {
        type: Sequelize.ENUM('not_started', 'active', 'on_hold', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'not_started',
        comment: 'Current status of the activity'
      },
      is_variation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Flag indicating if this is a variation activity'
      },
      variation_parent_activity_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'activities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Reference to parent activity for variations'
      },
      variation_ref: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Variation reference number/code'
      },
      variation_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for the variation'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Timestamp when activity was created'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when activity was last updated'
      }
    });

    // Add essential indexes for query performance
    await queryInterface.addIndex('activities', ['workpackage_id'], {
      name: 'idx_activities_workpackage_id'
    });
    
    await queryInterface.addIndex('activities', ['code'], {
      name: 'idx_activities_code'
    });
    
    await queryInterface.addIndex('activities', ['status'], {
      name: 'idx_activities_status'
    });
    
    await queryInterface.addIndex('activities', ['planned_start'], {
      name: 'idx_activities_planned_start'
    });
    
    await queryInterface.addIndex('activities', ['planned_finish'], {
      name: 'idx_activities_planned_finish'
    });
    
    await queryInterface.addIndex('activities', ['is_variation'], {
      name: 'idx_activities_is_variation'
    });
    
    await queryInterface.addIndex('activities', ['variation_parent_activity_id'], {
      name: 'idx_activities_variation_parent_id'
    });

    // Composite indexes for common query patterns
    await queryInterface.addIndex('activities', 
      ['workpackage_id', 'code'], {
      name: 'idx_activities_workpackage_code',
      unique: true  // Ensure unique activity codes per work package
    });
    
    await queryInterface.addIndex('activities', 
      ['workpackage_id', 'status'], {
      name: 'idx_activities_workpackage_status'
    });

    // Add basic CHECK constraints only (parser will handle complex logic)
    // 1. Ensure finish date is after start date when both are set
    await queryInterface.sequelize.query(`
      ALTER TABLE activities
      ADD CONSTRAINT check_activity_planned_dates 
      CHECK (
        (planned_start IS NULL AND planned_finish IS NULL) OR
        (planned_start IS NOT NULL AND planned_finish IS NOT NULL AND planned_start < planned_finish)
      );
    `);

    // 2. Prevent self-referencing variations
    await queryInterface.sequelize.query(`
      ALTER TABLE activities
      ADD CONSTRAINT check_activity_no_self_reference 
      CHECK (variation_parent_activity_id != id OR variation_parent_activity_id IS NULL);
    `);

    // Create trigger for auto-updating updated_at only
    // Since parser handles validation, no complex triggers needed
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_activities_updated_at
      BEFORE UPDATE ON activities
      FOR EACH ROW
      BEGIN
        SET NEW.updated_at = NOW();
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_activities_updated_at;
    `);

    // Drop CHECK constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE activities 
      DROP CHECK check_activity_planned_dates,
      DROP CHECK check_activity_no_self_reference;
    `);

    // Drop composite indexes first
    await queryInterface.removeIndex('activities', 'idx_activities_workpackage_code');
    await queryInterface.removeIndex('activities', 'idx_activities_workpackage_status');

    // Drop single column indexes
    await queryInterface.removeIndex('activities', 'idx_activities_workpackage_id');
    await queryInterface.removeIndex('activities', 'idx_activities_code');
    await queryInterface.removeIndex('activities', 'idx_activities_status');
    await queryInterface.removeIndex('activities', 'idx_activities_planned_start');
    await queryInterface.removeIndex('activities', 'idx_activities_planned_finish');
    await queryInterface.removeIndex('activities', 'idx_activities_is_variation');
    await queryInterface.removeIndex('activities', 'idx_activities_variation_parent_id');

    // Drop table
    await queryInterface.dropTable('activities');
  }
};