'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create workpackages table
    await queryInterface.createTable('workpackages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each work package'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique work package code'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Work package name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the work package'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Reference to category'
      },
      deliverable_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'deliverables',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Reference to deliverable'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Planned start date of the work package'
      },
      finish_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Planned finish date of the work package'
      },
      actual_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actual start date of the work package'
      },
      actual_finish_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actual finish date of the work package'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Timestamp when work package was created'
      },
      last_modified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when work package was last modified'
      }
    });

    // Add indexes
    await queryInterface.addIndex('workpackages', ['code'], {
      name: 'idx_workpackages_code',
      unique: true
    });
    
    await queryInterface.addIndex('workpackages', ['category_id'], {
      name: 'idx_workpackages_category_id'
    });
    
    await queryInterface.addIndex('workpackages', ['deliverable_id'], {
      name: 'idx_workpackages_deliverable_id'
    });
    
    await queryInterface.addIndex('workpackages', ['start_date'], {
      name: 'idx_workpackages_start_date'
    });
    
    await queryInterface.addIndex('workpackages', ['finish_date'], {
      name: 'idx_workpackages_finish_date'
    });
    
    await queryInterface.addIndex('workpackages', ['actual_start_date'], {
      name: 'idx_workpackages_actual_start_date'
    });
    
    await queryInterface.addIndex('workpackages', ['actual_finish_date'], {
      name: 'idx_workpackages_actual_finish_date'
    });
    
    await queryInterface.addIndex('workpackages', 
      ['start_date', 'finish_date'], {
      name: 'idx_workpackages_date_range'
    });

    await queryInterface.addIndex('workpackages', 
      ['actual_start_date', 'actual_finish_date'], {
      name: 'idx_workpackages_actual_date_range'
    });

    await queryInterface.addIndex('workpackages', 
      ['created_at'], {
      name: 'idx_workpackages_created_at'
    });

    // Add CHECK constraints for minimal chronological constraints
    // 1. start_date < finish_date constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE workpackages
      ADD CONSTRAINT check_workpackage_planned_dates 
      CHECK (start_date < finish_date);
    `);

    // 2. actual_start_date < actual_finish_date constraint (only when both are set)
    await queryInterface.sequelize.query(`
      ALTER TABLE workpackages
      ADD CONSTRAINT check_workpackage_actual_dates 
      CHECK (
        (actual_start_date IS NULL AND actual_finish_date IS NULL) OR
        (actual_start_date IS NOT NULL AND actual_finish_date IS NOT NULL AND actual_start_date < actual_finish_date) OR
        (actual_start_date IS NOT NULL AND actual_finish_date IS NULL)
      );
    `);

    // 3. Prevent future actual dates
    await queryInterface.sequelize.query(`
      ALTER TABLE workpackages
      ADD CONSTRAINT check_workpackage_dates_not_in_future 
      CHECK (
        (actual_start_date IS NULL OR actual_start_date <= CURDATE()) AND
        (actual_finish_date IS NULL OR actual_finish_date <= CURDATE())
      );
    `);

    // Create triggers
    // 1. Trigger for auto-updating last_modified_at
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_workpackages_last_modified
      BEFORE UPDATE ON workpackages
      FOR EACH ROW
      BEGIN
        SET NEW.last_modified_at = NOW();
      END
    `);

    // 2. Trigger for INSERT validation - WITH WARNINGS (not constraints)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_workpackage_insert
      BEFORE INSERT ON workpackages
      FOR EACH ROW
      BEGIN
        DECLARE project_start_date DATE;
        DECLARE project_finish_date DATE;
        DECLARE deliverable_mc_date DATE;
        DECLARE deliverable_acceptance_date DATE;
        DECLARE warning_msg VARCHAR(255);
        
        -- ========== WARNINGS (not constraints) ==========
        -- Get project dates for warnings
        SELECT p.start_date, p.finish_date INTO project_start_date, project_finish_date
        FROM projects p
        INNER JOIN deliverables d ON p.id = d.project_id
        WHERE d.id = NEW.deliverable_id;
        
        -- Get deliverable dates for warnings
        SELECT mc_date, acceptance_date INTO deliverable_mc_date, deliverable_acceptance_date
        FROM deliverables
        WHERE id = NEW.deliverable_id;
        
        -- Warning 1: work package start date before project start date
        IF project_start_date IS NOT NULL AND NEW.start_date < project_start_date THEN
          -- This is just a warning, not an error - we'll log it
          SET @workpackage_warning_1 = CONCAT('WARNING: Work package start date (', NEW.start_date, ') is before project start date (', project_start_date, ')');
          -- In MySQL, we can't easily log warnings without raising errors, 
          -- so we'll set a session variable instead
          SET @workpackage_warnings = CONCAT_WS('; ', 
            IFNULL(@workpackage_warnings, ''),
            CONCAT('Start date warning: ', NEW.start_date, ' < project start ', project_start_date)
          );
        END IF;
        
        -- Warning 2: MC date before work package finish date
        IF deliverable_mc_date IS NOT NULL AND NEW.finish_date IS NOT NULL AND deliverable_mc_date < NEW.finish_date THEN
          SET @workpackage_warnings = CONCAT_WS('; ', 
            IFNULL(@workpackage_warnings, ''),
            CONCAT('MC date warning: deliverable MC ', deliverable_mc_date, ' < work package finish ', NEW.finish_date)
          );
        END IF;
        
        -- Warning 3: Acceptance date before work package finish date
        IF deliverable_acceptance_date IS NOT NULL AND NEW.finish_date IS NOT NULL AND deliverable_acceptance_date < NEW.finish_date THEN
          SET @workpackage_warnings = CONCAT_WS('; ', 
            IFNULL(@workpackage_warnings, ''),
            CONCAT('Acceptance date warning: deliverable acceptance ', deliverable_acceptance_date, ' < work package finish ', NEW.finish_date)
          );
        END IF;
        -- ================================================
        
        -- Actual validation constraints (will block insert)
        -- 1. Validate finish_date is after start_date (enforced by CHECK constraint, but double-check)
        IF NEW.finish_date <= NEW.start_date THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Finish date must be after start date';
        END IF;
        
        -- 2. Validate actual_finish_date is after actual_start_date when both are set
        IF NEW.actual_start_date IS NOT NULL AND NEW.actual_finish_date IS NOT NULL AND 
           NEW.actual_finish_date <= NEW.actual_start_date THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual finish date must be after actual start date';
        END IF;
        
        -- 3. Prevent future actual dates
        IF NEW.actual_start_date IS NOT NULL AND NEW.actual_start_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual start date cannot be in the future';
        END IF;
        
        IF NEW.actual_finish_date IS NOT NULL AND NEW.actual_finish_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual finish date cannot be in the future';
        END IF;
        
        -- Note: No validation between:
        -- - start_date and actual_start_date
        -- - finish_date and actual_finish_date  
        -- - work package dates and deliverable dates
        -- These are intentionally omitted as per requirements
      END
    `);

    // 3. Trigger for UPDATE validation - WITH WARNINGS (not constraints)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_workpackage_update
      BEFORE UPDATE ON workpackages
      FOR EACH ROW
      BEGIN
        DECLARE project_start_date DATE;
        DECLARE project_finish_date DATE;
        DECLARE deliverable_mc_date DATE;
        DECLARE deliverable_acceptance_date DATE;
        
        -- ========== WARNINGS (not constraints) ==========
        -- Only check warnings if dates or deliverable_id are being changed
        IF (NEW.start_date != OLD.start_date OR NEW.finish_date != OLD.finish_date OR 
            NEW.deliverable_id != OLD.deliverable_id) THEN
          
          -- Get project dates for warnings
          SELECT p.start_date, p.finish_date INTO project_start_date, project_finish_date
          FROM projects p
          INNER JOIN deliverables d ON p.id = d.project_id
          WHERE d.id = NEW.deliverable_id;
          
          -- Get deliverable dates for warnings
          SELECT mc_date, acceptance_date INTO deliverable_mc_date, deliverable_acceptance_date
          FROM deliverables
          WHERE id = NEW.deliverable_id;
          
          -- Clear previous warnings
          SET @workpackage_warnings = NULL;
          
          -- Warning 1: work package start date before project start date
          IF project_start_date IS NOT NULL AND NEW.start_date < project_start_date THEN
            SET @workpackage_warnings = CONCAT_WS('; ', 
              IFNULL(@workpackage_warnings, ''),
              CONCAT('Start date warning: ', NEW.start_date, ' < project start ', project_start_date)
            );
          END IF;
          
          -- Warning 2: MC date before work package finish date
          IF deliverable_mc_date IS NOT NULL AND NEW.finish_date IS NOT NULL AND deliverable_mc_date < NEW.finish_date THEN
            SET @workpackage_warnings = CONCAT_WS('; ', 
              IFNULL(@workpackage_warnings, ''),
              CONCAT('MC date warning: deliverable MC ', deliverable_mc_date, ' < work package finish ', NEW.finish_date)
            );
          END IF;
          
          -- Warning 3: Acceptance date before work package finish date
          IF deliverable_acceptance_date IS NOT NULL AND NEW.finish_date IS NOT NULL AND deliverable_acceptance_date < NEW.finish_date THEN
            SET @workpackage_warnings = CONCAT_WS('; ', 
              IFNULL(@workpackage_warnings, ''),
              CONCAT('Acceptance date warning: deliverable acceptance ', deliverable_acceptance_date, ' < work package finish ', NEW.finish_date)
            );
          END IF;
        END IF;
        -- ================================================
        
        -- Actual validation constraints (will block update)
        -- 1. Validate finish_date is after start_date
        IF NEW.finish_date <= NEW.start_date THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Finish date must be after start date';
        END IF;
        
        -- 2. Validate actual_finish_date is after actual_start_date when both are set
        IF NEW.actual_start_date IS NOT NULL AND NEW.actual_finish_date IS NOT NULL AND 
           NEW.actual_finish_date <= NEW.actual_start_date THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual finish date must be after actual start date';
        END IF;
        
        -- 3. Prevent future actual dates
        IF NEW.actual_start_date IS NOT NULL AND NEW.actual_start_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual start date cannot be in the future';
        END IF;
        
        IF NEW.actual_finish_date IS NOT NULL AND NEW.actual_finish_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Actual finish date cannot be in the future';
        END IF;
        
        -- 4. Validate that actual_start_date is not set without start_date
        IF NEW.actual_start_date IS NOT NULL AND NEW.start_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot have actual start date without planned start date';
        END IF;
        
        -- 5. Validate that actual_finish_date is not set without finish_date
        IF NEW.actual_finish_date IS NOT NULL AND NEW.finish_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot have actual finish date without planned finish date';
        END IF;
        
        -- 6. Validate that actual_finish_date is not set without actual_start_date
        IF NEW.actual_finish_date IS NOT NULL AND NEW.actual_start_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot have actual finish date without actual start date';
        END IF;
        
        -- Note: No validation between:
        -- - start_date and actual_start_date
        -- - finish_date and actual_finish_date  
        -- - work package dates and deliverable dates
        -- These are intentionally omitted as per requirements
      END
    `);

    // 4. Trigger to log warnings after INSERT (this is a workaround since MySQL doesn't easily support warnings)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_workpackage_insert_warnings
      AFTER INSERT ON workpackages
      FOR EACH ROW
      BEGIN
        -- Check if there are any warnings stored in session variable
        IF @workpackage_warnings IS NOT NULL THEN
          -- Log warnings to a temporary warnings table or application log
          -- In a real application, you would handle this in the application layer
          -- For now, we'll just note that warnings exist
          INSERT INTO system_logs (message, log_type, created_at)
          VALUES (
            CONCAT('Work package ', NEW.code, ' created with warnings: ', @workpackage_warnings),
            'WARNING',
            NOW()
          );
          
          -- Clear the warnings variable
          SET @workpackage_warnings = NULL;
        END IF;
      END
    `);

    // 5. Trigger to log warnings after UPDATE
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_workpackage_update_warnings
      AFTER UPDATE ON workpackages
      FOR EACH ROW
      BEGIN
        -- Check if there are any warnings stored in session variable
        IF @workpackage_warnings IS NOT NULL THEN
          -- Log warnings
          INSERT INTO system_logs (message, log_type, created_at)
          VALUES (
            CONCAT('Work package ', NEW.code, ' updated with warnings: ', @workpackage_warnings),
            'WARNING',
            NOW()
          );
          
          -- Clear the warnings variable
          SET @workpackage_warnings = NULL;
        END IF;
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop triggers in reverse order
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_workpackage_update_warnings;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_workpackage_insert_warnings;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_workpackage_update;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_workpackage_insert;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_workpackages_last_modified;
    `);

    // Drop CHECK constraints (MySQL syntax)
    await queryInterface.sequelize.query(`
      ALTER TABLE workpackages 
      DROP CHECK check_workpackage_planned_dates,
      DROP CHECK check_workpackage_actual_dates,
      DROP CHECK check_workpackage_dates_not_in_future;
    `);

    // Drop indexes
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_code');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_category_id');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_deliverable_id');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_start_date');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_finish_date');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_actual_start_date');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_actual_finish_date');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_date_range');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_actual_date_range');
    await queryInterface.removeIndex('workpackages', 'idx_workpackages_created_at');

    // Drop table
    await queryInterface.dropTable('workpackages');
  }
};