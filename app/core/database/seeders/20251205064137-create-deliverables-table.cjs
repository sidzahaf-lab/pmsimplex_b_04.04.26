'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create deliverables table
    await queryInterface.createTable('deliverables', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each deliverable'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique deliverable code'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Deliverable name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the deliverable'
      },
      construction_status: {
        type: Sequelize.ENUM('NOT STARTED', 'IN PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'),
        allowNull: true,
        defaultValue: null,
        comment: 'Construction phase status'
      },
      mc_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Planned Mechanical Completion date'
      },
      testing_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Planned Testing date'
      },
      acceptance_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Planned Client Acceptance date'
      },
      mc_actual_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actual Mechanical Completion date'
      },
      testing_actual_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actual Testing date'
      },
      acceptance_actual_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actual Client Acceptance date'
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Reference to parent project'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Timestamp when deliverable was created'
      },
      last_modified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when deliverable was last modified'
      }
    });

    // Add indexes
    await queryInterface.addIndex('deliverables', ['project_id'], {
      name: 'idx_deliverables_project_id'
    });
    
    await queryInterface.addIndex('deliverables', ['construction_status'], {
      name: 'idx_deliverables_construction_status'
    });
    
    await queryInterface.addIndex('deliverables', ['code'], {
      name: 'idx_deliverables_code'
    });
    
    await queryInterface.addIndex('deliverables', ['created_at'], {
      name: 'idx_deliverables_created_at'
    });
    
    await queryInterface.addIndex('deliverables', ['mc_date'], {
      name: 'idx_deliverables_mc_date'
    });
    
    await queryInterface.addIndex('deliverables', ['testing_date'], {
      name: 'idx_deliverables_testing_date'
    });
    
    await queryInterface.addIndex('deliverables', ['acceptance_date'], {
      name: 'idx_deliverables_acceptance_date'
    });
    
    await queryInterface.addIndex('deliverables', 
      ['construction_status', 'acceptance_date', 'acceptance_actual_date'], {
      name: 'idx_deliverables_status_dates'
    });

    await queryInterface.addIndex('deliverables', 
      ['mc_actual_date', 'testing_actual_date', 'acceptance_actual_date'], {
      name: 'idx_deliverables_actual_dates'
    });

    // Add CHECK constraints
    // 1. Planned dates chronology constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_planned_dates_chronology 
      CHECK (
        (mc_date IS NULL OR testing_date IS NULL OR mc_date <= testing_date) AND
        (testing_date IS NULL OR acceptance_date IS NULL OR testing_date <= acceptance_date)
      );
    `);

    // 2. Actual dates chronology constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_actual_dates_chronology 
      CHECK (
        (mc_actual_date IS NULL OR testing_actual_date IS NULL OR mc_actual_date <= testing_actual_date) AND
        (testing_actual_date IS NULL OR acceptance_actual_date IS NULL OR testing_actual_date <= acceptance_actual_date)
      );
    `);

    // 3. Sequential completion constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_sequential_completion 
      CHECK (
        (testing_actual_date IS NULL OR mc_actual_date IS NOT NULL) AND
        (acceptance_actual_date IS NULL OR testing_actual_date IS NOT NULL)
      );
    `);

    // 4. Construction status ↔ MC actual date validation
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_construction_status_mc_actual 
      CHECK (
        -- Rule 1: If status is COMPLETED, mc_actual_date must be set
        (construction_status != 'COMPLETED' OR mc_actual_date IS NOT NULL) AND
        
        -- Rule 2: If mc_actual_date is set, status must be COMPLETED
        (mc_actual_date IS NULL OR construction_status = 'COMPLETED') AND
        
        -- Rule 3: If status is NOT STARTED, mc_actual_date must be NULL
        (construction_status != 'NOT STARTED' OR mc_actual_date IS NULL) AND
        
        -- Rule 4: If mc_actual_date is NULL, status cannot be COMPLETED
        (mc_actual_date IS NOT NULL OR construction_status != 'COMPLETED') AND
        
        -- Rule 5: If status is CANCELLED or ON HOLD before MC, mc_actual_date must be NULL
        (construction_status NOT IN ('CANCELLED', 'ON_HOLD') OR mc_actual_date IS NULL)
      );
    `);

    // 5. Construction status ↔ Testing actual date validation
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_construction_status_testing_actual 
      CHECK (
        -- If testing_actual_date is set, status must be COMPLETED
        (testing_actual_date IS NULL OR construction_status = 'COMPLETED') AND
        
        -- If status is COMPLETED and testing_date exists, testing_actual_date should be set
        (construction_status != 'COMPLETED' OR testing_date IS NULL OR testing_actual_date IS NOT NULL)
      );
    `);

    // 6. Construction status ↔ Acceptance actual date validation
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_construction_status_acceptance_actual 
      CHECK (
        -- If acceptance_actual_date is set, status must be COMPLETED
        (acceptance_actual_date IS NULL OR construction_status = 'COMPLETED') AND
        
        -- If status is COMPLETED and acceptance_date exists, acceptance_actual_date should be set
        (construction_status != 'COMPLETED' OR acceptance_date IS NULL OR acceptance_actual_date IS NOT NULL)
      );
    `);

    // 7. Construction status ↔ Planned dates validation
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_construction_status_planned_dates 
      CHECK (
        -- If construction status is beyond NOT STARTED, require mc_date
        (construction_status = 'NOT STARTED' OR mc_date IS NOT NULL) AND
        
        -- If status is COMPLETED, require all planned dates
        (construction_status != 'COMPLETED' OR 
         (mc_date IS NOT NULL AND testing_date IS NOT NULL AND acceptance_date IS NOT NULL))
      );
    `);

    // 8. Future dates constraint (actual dates cannot be in future)
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables
      ADD CONSTRAINT check_dates_not_in_future 
      CHECK (
        (mc_actual_date IS NULL OR mc_actual_date <= CURDATE()) AND
        (testing_actual_date IS NULL OR testing_actual_date <= CURDATE()) AND
        (acceptance_actual_date IS NULL OR acceptance_actual_date <= CURDATE())
      );
    `);

    // Create triggers
    // 1. Trigger for auto-updating last_modified_at
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_deliverables_last_modified
      BEFORE UPDATE ON deliverables
      FOR EACH ROW
      BEGIN
        SET NEW.last_modified_at = NOW();
      END
    `);

    // 2. Trigger for INSERT validation - INCLUDES PROJECT FINISH DATE CONSTRAINT
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_deliverable_insert
      BEFORE INSERT ON deliverables
      FOR EACH ROW
      BEGIN
        DECLARE project_finish_date DATE;
        DECLARE error_msg VARCHAR(255);
        
        -- Get project finish_date for validation
        SELECT finish_date INTO project_finish_date 
        FROM projects 
        WHERE id = NEW.project_id;
        
        -- ========== PROJECT FINISH DATE CONSTRAINT ==========
        -- Validate deliverable planned dates are not after project finish date
        IF NEW.mc_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.mc_date > project_finish_date THEN
          SET error_msg = CONCAT('MC date (', NEW.mc_date, ') cannot be after project finish date (', project_finish_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.testing_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.testing_date > project_finish_date THEN
          SET error_msg = CONCAT('Testing date (', NEW.testing_date, ') cannot be after project finish date (', project_finish_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.acceptance_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.acceptance_date > project_finish_date THEN
          SET error_msg = CONCAT('Acceptance date (', NEW.acceptance_date, ') cannot be after project finish date (', project_finish_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        -- ====================================================
        
        -- Auto-set construction_status based on actual dates
        -- This handles the logic that was in the removed AFTER INSERT trigger
        IF NEW.acceptance_actual_date IS NOT NULL OR NEW.testing_actual_date IS NOT NULL THEN
          SET NEW.construction_status = 'COMPLETED';
        ELSEIF NEW.mc_actual_date IS NOT NULL THEN
          SET NEW.construction_status = 'COMPLETED';
        ELSE
          -- Default to NOT STARTED if no actual dates and construction_status is NULL
          IF NEW.construction_status IS NULL THEN
            SET NEW.construction_status = 'NOT STARTED';
          END IF;
        END IF;
        
        -- Auto-set acceptance_actual_date when status is COMPLETED and acceptance_date exists
        IF NEW.construction_status = 'COMPLETED' THEN
          IF NEW.acceptance_date IS NOT NULL AND NEW.acceptance_actual_date IS NULL THEN
            SET NEW.acceptance_actual_date = CURDATE();
          END IF;
          IF NEW.testing_date IS NOT NULL AND NEW.testing_actual_date IS NULL THEN
            SET NEW.testing_actual_date = CURDATE();
          END IF;
        END IF;
        
        -- Validate planned dates chronology
        IF NEW.mc_date IS NOT NULL AND NEW.testing_date IS NOT NULL AND NEW.mc_date > NEW.testing_date THEN
          SET error_msg = CONCAT('MC date (', NEW.mc_date, ') cannot be after Testing date (', NEW.testing_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.testing_date IS NOT NULL AND NEW.acceptance_date IS NOT NULL AND NEW.testing_date > NEW.acceptance_date THEN
          SET error_msg = CONCAT('Testing date (', NEW.testing_date, ') cannot be after Acceptance date (', NEW.acceptance_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        -- Validate actual dates chronology
        IF NEW.mc_actual_date IS NOT NULL AND NEW.testing_actual_date IS NOT NULL AND NEW.mc_actual_date > NEW.testing_actual_date THEN
          SET error_msg = CONCAT('MC actual date (', NEW.mc_actual_date, ') cannot be after Testing actual date (', NEW.testing_actual_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.testing_actual_date IS NOT NULL AND NEW.acceptance_actual_date IS NOT NULL AND NEW.testing_actual_date > NEW.acceptance_actual_date THEN
          SET error_msg = CONCAT('Testing actual date (', NEW.testing_actual_date, ') cannot be after Acceptance actual date (', NEW.acceptance_actual_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        -- Validate sequential completion
        IF NEW.testing_actual_date IS NOT NULL AND NEW.mc_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot have Testing actual date without MC actual date';
        END IF;
        
        IF NEW.acceptance_actual_date IS NOT NULL AND NEW.testing_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot have Acceptance actual date without Testing actual date';
        END IF;
        
        -- Validate construction status consistency
        IF NEW.construction_status = 'COMPLETED' AND NEW.mc_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status COMPLETED requires MC actual date';
        END IF;
        
        IF NEW.mc_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'MC actual date requires construction status to be COMPLETED';
        END IF;
        
        IF NEW.testing_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Testing actual date requires construction status to be COMPLETED';
        END IF;
        
        IF NEW.acceptance_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Acceptance actual date requires construction status to be COMPLETED';
        END IF;
        
        -- Validate NOT STARTED cannot have any actual dates
        IF NEW.construction_status = 'NOT STARTED' AND 
           (NEW.mc_actual_date IS NOT NULL OR NEW.testing_actual_date IS NOT NULL OR NEW.acceptance_actual_date IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status NOT STARTED cannot have any actual dates';
        END IF;
        
        -- Validate planned dates for construction status
        IF NEW.construction_status NOT IN ('CANCELLED', 'ON_HOLD', 'NOT STARTED') AND 
           (NEW.mc_date IS NULL OR NEW.testing_date IS NULL OR NEW.acceptance_date IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Active construction status requires all planned dates (MC, Testing, Acceptance)';
        END IF;
        
        IF NEW.construction_status != 'NOT STARTED' AND NEW.mc_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status beyond NOT STARTED requires MC planned date';
        END IF;
      END
    `);

    // 3. Trigger for UPDATE validation - INCLUDES PROJECT FINISH DATE CONSTRAINT
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_deliverable_update
      BEFORE UPDATE ON deliverables
      FOR EACH ROW
      BEGIN
        DECLARE project_finish_date DATE;
        DECLARE error_msg VARCHAR(255);
        
        -- Get project finish_date for validation
        SELECT finish_date INTO project_finish_date 
        FROM projects 
        WHERE id = NEW.project_id;
        
        -- ========== PROJECT FINISH DATE CONSTRAINT ==========
        -- Validate deliverable planned dates are not after project finish date
        -- Only check if dates are being changed or project is changed
        IF (NEW.mc_date IS NOT NULL AND (NEW.mc_date != OLD.mc_date OR OLD.mc_date IS NULL)) OR
           (NEW.testing_date IS NOT NULL AND (NEW.testing_date != OLD.testing_date OR OLD.testing_date IS NULL)) OR
           (NEW.acceptance_date IS NOT NULL AND (NEW.acceptance_date != OLD.acceptance_date OR OLD.acceptance_date IS NULL)) OR
           (NEW.project_id != OLD.project_id) THEN
          
          IF NEW.mc_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.mc_date > project_finish_date THEN
            SET error_msg = CONCAT('MC date (', NEW.mc_date, ') cannot be after project finish date (', project_finish_date, ')');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
          END IF;
          
          IF NEW.testing_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.testing_date > project_finish_date THEN
            SET error_msg = CONCAT('Testing date (', NEW.testing_date, ') cannot be after project finish date (', project_finish_date, ')');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
          END IF;
          
          IF NEW.acceptance_date IS NOT NULL AND project_finish_date IS NOT NULL AND NEW.acceptance_date > project_finish_date THEN
            SET error_msg = CONCAT('Acceptance date (', NEW.acceptance_date, ') cannot be after project finish date (', project_finish_date, ')');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
          END IF;
        END IF;
        -- ====================================================
        
        -- Auto-update construction_status based on actual dates
        IF (NEW.acceptance_actual_date IS NOT NULL OR NEW.testing_actual_date IS NOT NULL) 
           AND NEW.construction_status != 'COMPLETED' THEN
          SET NEW.construction_status = 'COMPLETED';
        ELSEIF NEW.mc_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SET NEW.construction_status = 'COMPLETED';
        END IF;
        
        -- Auto-set dates when construction_status changes to COMPLETED
        IF NEW.construction_status = 'COMPLETED' AND OLD.construction_status != 'COMPLETED' THEN
          IF NEW.mc_actual_date IS NULL THEN
            SET NEW.mc_actual_date = CURDATE();
          END IF;
          IF NEW.testing_date IS NOT NULL AND NEW.testing_actual_date IS NULL THEN
            SET NEW.testing_actual_date = CURDATE();
          END IF;
          IF NEW.acceptance_date IS NOT NULL AND NEW.acceptance_actual_date IS NULL THEN
            SET NEW.acceptance_actual_date = CURDATE();
          END IF;
        END IF;
        
        -- Validate construction status transitions
        IF OLD.construction_status = 'CANCELLED' AND NEW.construction_status != 'CANCELLED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot change construction status from CANCELLED';
        END IF;
        
        IF OLD.construction_status = 'COMPLETED' AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot change construction status from COMPLETED';
        END IF;
        
        -- Validate planned dates chronology
        IF NEW.mc_date IS NOT NULL AND NEW.testing_date IS NOT NULL AND NEW.mc_date > NEW.testing_date THEN
          SET error_msg = CONCAT('MC date (', NEW.mc_date, ') cannot be after Testing date (', NEW.testing_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.testing_date IS NOT NULL AND NEW.acceptance_date IS NOT NULL AND NEW.testing_date > NEW.acceptance_date THEN
          SET error_msg = CONCAT('Testing date (', NEW.testing_date, ') cannot be after Acceptance date (', NEW.acceptance_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        -- Validate actual dates chronology
        IF NEW.mc_actual_date IS NOT NULL AND NEW.testing_actual_date IS NOT NULL AND NEW.mc_actual_date > NEW.testing_actual_date THEN
          SET error_msg = CONCAT('MC actual date (', NEW.mc_actual_date, ') cannot be after Testing actual date (', NEW.testing_actual_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        IF NEW.testing_actual_date IS NOT NULL AND NEW.acceptance_actual_date IS NOT NULL AND NEW.testing_actual_date > NEW.acceptance_actual_date THEN
          SET error_msg = CONCAT('Testing actual date (', NEW.testing_actual_date, ') cannot be after Acceptance actual date (', NEW.acceptance_actual_date, ')');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
        END IF;
        
        -- Validate sequential completion
        IF NEW.testing_actual_date IS NOT NULL AND NEW.mc_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot set Testing actual date without MC actual date';
        END IF;
        
        IF NEW.acceptance_actual_date IS NOT NULL AND NEW.testing_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot set Acceptance actual date without Testing actual date';
        END IF;
        
        -- Validate construction status consistency
        IF NEW.construction_status = 'COMPLETED' AND NEW.mc_actual_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status COMPLETED requires MC actual date';
        END IF;
        
        IF NEW.mc_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'MC actual date requires construction status to be COMPLETED';
        END IF;
        
        IF NEW.testing_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Testing actual date requires construction status to be COMPLETED';
        END IF;
        
        IF NEW.acceptance_actual_date IS NOT NULL AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Acceptance actual date requires construction status to be COMPLETED';
        END IF;
        
        -- Validate NOT STARTED cannot have any actual dates
        IF NEW.construction_status = 'NOT STARTED' AND 
           (NEW.mc_actual_date IS NOT NULL OR NEW.testing_actual_date IS NOT NULL OR NEW.acceptance_actual_date IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status NOT STARTED cannot have any actual dates';
        END IF;
        
        -- Validate planned dates for construction status
        IF NEW.construction_status NOT IN ('CANCELLED', 'ON_HOLD', 'NOT STARTED') AND 
           (NEW.mc_date IS NULL OR NEW.testing_date IS NULL OR NEW.acceptance_date IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Active construction status requires all planned dates (MC, Testing, Acceptance)';
        END IF;
        
        IF NEW.construction_status != 'NOT STARTED' AND NEW.mc_date IS NULL THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Construction status beyond NOT STARTED requires MC planned date';
        END IF;
        
        -- Prevent setting future actual dates
        IF NEW.mc_actual_date IS NOT NULL AND NEW.mc_actual_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'MC actual date cannot be in the future';
        END IF;
        
        IF NEW.testing_actual_date IS NOT NULL AND NEW.testing_actual_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Testing actual date cannot be in the future';
        END IF;
        
        IF NEW.acceptance_actual_date IS NOT NULL AND NEW.acceptance_actual_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Acceptance actual date cannot be in the future';
        END IF;
        
        -- Prevent removing required dates when status is active
        IF OLD.construction_status NOT IN ('CANCELLED', 'ON_HOLD', 'NOT STARTED') AND 
           NEW.construction_status NOT IN ('CANCELLED', 'ON_HOLD', 'NOT STARTED') AND 
           (NEW.mc_date IS NULL OR NEW.testing_date IS NULL OR NEW.acceptance_date IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot remove planned dates for active construction status';
        END IF;
        
        -- Prevent invalid construction status for existing dates
        IF (OLD.testing_actual_date IS NOT NULL OR OLD.acceptance_actual_date IS NOT NULL) 
           AND NEW.construction_status != 'COMPLETED' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot change construction status from COMPLETED when testing or acceptance dates exist';
        END IF;
      END
    `);

    // Note: The problematic AFTER INSERT trigger has been removed
    // All construction_status logic is now handled in the BEFORE INSERT trigger above
  },

  async down(queryInterface, Sequelize) {
    // Drop triggers in reverse order
    // Note: No need to drop the after_deliverable_insert_set_status trigger since it was removed
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_deliverable_update;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_deliverable_insert;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_deliverables_last_modified;
    `);

    // Drop CHECK constraints (MySQL syntax)
    await queryInterface.sequelize.query(`
      ALTER TABLE deliverables 
      DROP CHECK check_planned_dates_chronology,
      DROP CHECK check_actual_dates_chronology,
      DROP CHECK check_sequential_completion,
      DROP CHECK check_construction_status_mc_actual,
      DROP CHECK check_construction_status_testing_actual,
      DROP CHECK check_construction_status_acceptance_actual,
      DROP CHECK check_construction_status_planned_dates,
      DROP CHECK check_dates_not_in_future;
    `);

    // Drop indexes
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_project_id');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_construction_status');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_code');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_created_at');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_mc_date');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_testing_date');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_acceptance_date');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_status_dates');
    await queryInterface.removeIndex('deliverables', 'idx_deliverables_actual_dates');

    // Drop table
    await queryInterface.dropTable('deliverables');
  }
};