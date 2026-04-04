'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if referenced tables exist
    console.log('Checking for required tables...');
    
    const [schedulesTables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'schedules'"
    );
    
    if (schedulesTables.length === 0) {
      throw new Error('schedules table does not exist. Please create it first.');
    }
    
    const [usersTables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (usersTables.length === 0) {
      throw new Error('users table does not exist. Please create it first.');
    }

    // Create the schedule_revisions table with all constraints
    await queryInterface.createTable('schedule_revisions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier'
      },
      schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Parent schedule'
      },
      revision_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Sequential revision number: 0, 1, 2…'
      },
      schedule_type: {
        type: Sequelize.ENUM('baseline', 'forecast', 'actual'),
        allowNull: false,
        comment: 'Snapshot of schedule type: baseline, forecast, actual'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason / summary of this revision'
      },
      source_tool: {
        type: Sequelize.ENUM('p6', 'msproject', 'excel'),
        allowNull: false,
        comment: 'Source system: p6, msproject, excel'
      },
      source_format: {
        type: Sequelize.ENUM('xer', 'xml', 'mpp', 'xlsx'),
        allowNull: false,
        comment: 'File format: xer, xml, mpp, xlsx'
      },
      source_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original uploaded filename'
      },
      source_file_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SHA256 hash for duplicate detection'
      },
      hash_algorithm: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'SHA256',
        comment: 'Hash algorithm used'
      },
      source_file_size: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'File size in bytes'
      },
      source_file_path: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Server storage path to original file'
      },
      excel_template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Excel template used (Excel only)'
      },
      template_version: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Template version at upload time'
      },
      import_status: {
        type: Sequelize.ENUM('pending', 'parsed', 'validated', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending, parsed, validated, failed'
      },
      import_error_summary: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Parsing / validation error summary'
      },
      revision_status: {
        type: Sequelize.ENUM('draft', 'under_review', 'approved', 'superseded', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'draft, under_review, approved, superseded, rejected'
      },
      is_current: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'TRUE = current approved revision'
      },
      data_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Status date of the schedule (baseline cut-off, forecast status date)'
      },
      planned_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Earliest planned start across all activities'
      },
      planned_finish: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Latest planned finish across all activities'
      },
      actual_data_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Actuals cut-off (only for actual / progressed schedules)'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Uploader user ID'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Upload timestamp'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Approver user ID'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Approval timestamp'
      },
      superseded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Next revision that replaced this one'
      }
    });

    // Add unique constraint for (schedule_id, revision_number)
    await queryInterface.addConstraint('schedule_revisions', {
      fields: ['schedule_id', 'revision_number'],
      type: 'unique',
      name: 'uq_schedule_revisions_schedule_id_revision_number'
    });

    // Now add foreign key constraints using raw SQL to ensure they work
    console.log('Adding foreign key constraints...');
    
    // 1. Foreign key to schedules
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE schedule_revisions
        ADD CONSTRAINT fk_schedule_revisions_schedule_id
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✓ Added foreign key: schedule_id -> schedules.id');
    } catch (error) {
      console.error('Failed to add schedule_id foreign key:', error.message);
      throw error;
    }

    // 2. Foreign key to users (created_by)
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE schedule_revisions
        ADD CONSTRAINT fk_schedule_revisions_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added foreign key: created_by -> users.id');
    } catch (error) {
      console.error('Failed to add created_by foreign key:', error.message);
      throw error;
    }

    // 3. Foreign key to users (approved_by)
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE schedule_revisions
        ADD CONSTRAINT fk_schedule_revisions_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added foreign key: approved_by -> users.id');
    } catch (error) {
      console.error('Failed to add approved_by foreign key:', error.message);
      throw error;
    }

    // 4. Self-referential foreign key (superseded_by)
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE schedule_revisions
        ADD CONSTRAINT fk_schedule_revisions_superseded_by
        FOREIGN KEY (superseded_by) REFERENCES schedule_revisions(id)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added self-referential foreign key: superseded_by -> schedule_revisions.id');
    } catch (error) {
      console.error('Failed to add superseded_by foreign key:', error.message);
      throw error;
    }

    // 5. Foreign key to excel_templates (optional)
    try {
      const [excelTemplates] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'excel_templates'"
      );
      
      if (excelTemplates.length > 0) {
        await queryInterface.sequelize.query(`
          ALTER TABLE schedule_revisions
          ADD CONSTRAINT fk_schedule_revisions_excel_template_id
          FOREIGN KEY (excel_template_id) REFERENCES excel_templates(id)
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('✓ Added foreign key: excel_template_id -> excel_templates.id');
      } else {
        console.log('ℹ excel_templates table not found. Skipping excel_template_id foreign key.');
      }
    } catch (error) {
      console.error('Failed to add excel_template_id foreign key:', error.message);
      // Don't throw error for this optional constraint
    }

    // Add indexes for performance
    console.log('Adding indexes...');
    
    const indexes = [
      { name: 'idx_schedule_revisions_schedule_id', fields: ['schedule_id'] },
      { name: 'idx_schedule_revisions_revision_number', fields: ['revision_number'] },
      { name: 'idx_schedule_revisions_schedule_type', fields: ['schedule_type'] },
      { name: 'idx_schedule_revisions_source_file_hash', fields: ['source_file_hash'] },
      { name: 'idx_schedule_revisions_import_status', fields: ['import_status'] },
      { name: 'idx_schedule_revisions_revision_status', fields: ['revision_status'] },
      { name: 'idx_schedule_revisions_is_current', fields: ['is_current'] },
      { name: 'idx_schedule_revisions_data_date', fields: ['data_date'] },
      { name: 'idx_schedule_revisions_created_by', fields: ['created_by'] },
      { name: 'idx_schedule_revisions_created_at', fields: ['created_at'] },
      { name: 'idx_schedule_revisions_approved_by', fields: ['approved_by'] },
      { name: 'idx_schedule_revisions_approved_at', fields: ['approved_at'] },
      { name: 'idx_schedule_revisions_superseded_by', fields: ['superseded_by'] },
      { name: 'idx_schedule_revisions_excel_template_id', fields: ['excel_template_id'] },
      { name: 'idx_schedule_revisions_schedule_id_type', fields: ['schedule_id', 'schedule_type'] },
      { name: 'idx_schedule_revisions_schedule_id_data_date', fields: ['schedule_id', 'data_date'] },
      { name: 'idx_schedule_revisions_schedule_id_created_at', fields: ['schedule_id', 'created_at'] }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('schedule_revisions', index.fields, {
          name: index.name
        });
        console.log(`✓ Added index: ${index.name}`);
      } catch (error) {
        console.error(`Failed to add index ${index.name}:`, error.message);
      }
    }

    // Create triggers for one current revision per schedule
    console.log('Creating triggers...');
    try {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER trg_one_current_per_schedule_before_insert
        BEFORE INSERT ON schedule_revisions
        FOR EACH ROW
        BEGIN
          IF NEW.is_current = TRUE THEN
            IF EXISTS (
              SELECT 1 FROM schedule_revisions 
              WHERE schedule_id = NEW.schedule_id 
              AND is_current = TRUE
            ) THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Only one current revision allowed per schedule';
            END IF;
          END IF;
        END
      `);

      await queryInterface.sequelize.query(`
        CREATE TRIGGER trg_one_current_per_schedule_before_update
        BEFORE UPDATE ON schedule_revisions
        FOR EACH ROW
        BEGIN
          IF NEW.is_current = TRUE AND OLD.is_current = FALSE THEN
            IF EXISTS (
              SELECT 1 FROM schedule_revisions 
              WHERE schedule_id = NEW.schedule_id 
              AND is_current = TRUE
              AND id != NEW.id
            ) THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Only one current revision allowed per schedule';
            END IF;
          END IF;
        END
      `);
      
      console.log('✓ Created triggers for one current revision per schedule');
    } catch (error) {
      console.error('Failed to create triggers:', error.message);
      console.log('Note: Some databases may not support triggers or have different syntax');
    }

    console.log('✅ schedule_revisions table created successfully with all constraints!');
  },

  async down(queryInterface, Sequelize) {
    console.log('Dropping schedule_revisions table...');
    
    // Drop triggers first
    try {
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_one_current_per_schedule_before_insert');
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_one_current_per_schedule_before_update');
      console.log('✓ Dropped triggers');
    } catch (error) {
      console.log('Note: Triggers may not exist or have different names');
    }
    
    // Drop foreign key constraints
    const constraints = [
      'fk_schedule_revisions_schedule_id',
      'fk_schedule_revisions_created_by',
      'fk_schedule_revisions_approved_by',
      'fk_schedule_revisions_excel_template_id',
      'fk_schedule_revisions_superseded_by'
    ];
    
    for (const constraintName of constraints) {
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE schedule_revisions
          DROP FOREIGN KEY ${constraintName}
        `);
        console.log(`✓ Dropped foreign key: ${constraintName}`);
      } catch (error) {
        console.log(`Note: Foreign key ${constraintName} may not exist:`, error.message);
      }
    }
    
    // Drop unique constraint
    try {
      await queryInterface.removeConstraint('schedule_revisions', 'uq_schedule_revisions_schedule_id_revision_number');
      console.log('✓ Dropped unique constraint');
    } catch (error) {
      console.log('Note: Unique constraint may not exist:', error.message);
    }
    
    // Drop table
    await queryInterface.dropTable('schedule_revisions');
    console.log('✅ Dropped schedule_revisions table');
  }
};