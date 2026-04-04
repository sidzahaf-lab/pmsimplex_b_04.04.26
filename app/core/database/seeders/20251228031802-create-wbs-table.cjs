'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if referenced tables exist
    console.log('Checking for required tables...');
    
    const [scheduleRevisionsTables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'schedule_revisions'"
    );
    
    if (scheduleRevisionsTables.length === 0) {
      throw new Error('schedule_revisions table does not exist. Please create it first.');
    }

    // Create the wbs table with all constraints
    await queryInterface.createTable('wbs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique WBS identifier'
      },
      schedule_revision_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Schedule revision this WBS belongs to'
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Parent WBS element (hierarchy)'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'WBS code (e.g. 1, 1.1, 1.1.1)'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'WBS title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'WBS depth level (root = 1)'
      },
      sequence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order among siblings'
      },
      is_leaf: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'TRUE if no child WBS nodes'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Creation timestamp'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
        onUpdate: Sequelize.fn('NOW'),
        comment: 'Last update timestamp'
      }
    });

    // Add composite unique constraint for (schedule_revision_id, code)
    await queryInterface.addConstraint('wbs', {
      fields: ['schedule_revision_id', 'code'],
      type: 'unique',
      name: 'uq_wbs_schedule_revision_id_code'
    });

    // Add foreign key constraints using raw SQL
    console.log('Adding foreign key constraints...');
    
    // 1. Foreign key to schedule_revisions
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE wbs
        ADD CONSTRAINT fk_wbs_schedule_revision_id
        FOREIGN KEY (schedule_revision_id) REFERENCES schedule_revisions(id)
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✓ Added foreign key: schedule_revision_id -> schedule_revisions.id');
    } catch (error) {
      console.error('Failed to add schedule_revision_id foreign key:', error.message);
      throw error;
    }

    // 2. Self-referential foreign key for parent_id
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE wbs
        ADD CONSTRAINT fk_wbs_parent_id
        FOREIGN KEY (parent_id) REFERENCES wbs(id)
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✓ Added self-referential foreign key: parent_id -> wbs.id');
    } catch (error) {
      console.error('Failed to add parent_id foreign key:', error.message);
      throw error;
    }

    // Add indexes for performance
    console.log('Adding indexes...');
    
    const indexes = [
      { name: 'idx_wbs_schedule_revision_id', fields: ['schedule_revision_id'] },
      { name: 'idx_wbs_parent_id', fields: ['parent_id'] },
      { name: 'idx_wbs_code', fields: ['code'] },
      { name: 'idx_wbs_level', fields: ['level'] },
      { name: 'idx_wbs_is_leaf', fields: ['is_leaf'] },
      { name: 'idx_wbs_sequence', fields: ['sequence'] },
      { name: 'idx_wbs_created_at', fields: ['created_at'] },
      { name: 'idx_wbs_updated_at', fields: ['updated_at'] },
      { name: 'idx_wbs_parent_id_sequence', fields: ['parent_id', 'sequence'] },
      { name: 'idx_wbs_schedule_revision_id_parent_id', fields: ['schedule_revision_id', 'parent_id'] },
      { name: 'idx_wbs_schedule_revision_id_level', fields: ['schedule_revision_id', 'level'] },
      { name: 'idx_wbs_schedule_revision_id_code', fields: ['schedule_revision_id', 'code'] },
      { name: 'idx_wbs_schedule_revision_id_is_leaf', fields: ['schedule_revision_id', 'is_leaf'] }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('wbs', index.fields, {
          name: index.name
        });
        console.log(`✓ Added index: ${index.name}`);
      } catch (error) {
        console.error(`Failed to add index ${index.name}:`, error.message);
      }
    }

    // Create simple trigger to prevent self-parenting (basic circular reference check)
    console.log('Creating basic trigger for self-parenting check...');
    try {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER trg_wbs_prevent_self_parent
        BEFORE INSERT ON wbs
        FOR EACH ROW
        BEGIN
          IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'WBS cannot be its own parent';
          END IF;
        END
      `);
      console.log('✓ Created trigger to prevent self-parenting');
      
      // Also create trigger for UPDATE operations
      await queryInterface.sequelize.query(`
        CREATE TRIGGER trg_wbs_prevent_self_parent_update
        BEFORE UPDATE ON wbs
        FOR EACH ROW
        BEGIN
          IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'WBS cannot be its own parent';
          END IF;
        END
      `);
      console.log('✓ Created update trigger to prevent self-parenting');
      
    } catch (error) {
      console.error('Failed to create triggers:', error.message);
      console.log('Note: Triggers are optional. You can handle circular references in application logic.');
    }

    // Create non-recursive view for WBS hierarchy (MySQL-compatible)
    console.log('Creating simplified wbs_hierarchy view...');
    try {
      // Drop view if exists
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS wbs_hierarchy');
      
      // Create a simplified view (non-recursive for MySQL < 8.0)
      await queryInterface.sequelize.query(`
        CREATE VIEW wbs_hierarchy AS
        SELECT 
          w1.id,
          w1.schedule_revision_id,
          w1.parent_id,
          w1.code,
          w1.name,
          w1.description,
          w1.level,
          w1.sequence,
          w1.is_leaf,
          w1.created_at,
          w1.updated_at,
          -- Level 1 (root)
          w1.code AS level1_code,
          w1.name AS level1_name,
          -- Level 2
          w2.code AS level2_code,
          w2.name AS level2_name,
          -- Level 3
          w3.code AS level3_code,
          w3.name AS level3_name,
          -- Level 4
          w4.code AS level4_code,
          w4.name AS level4_name,
          -- Level 5
          w5.code AS level5_code,
          w5.name AS level5_name,
          -- Full path (limited to 5 levels)
          TRIM(BOTH '.' FROM CONCAT_WS('.', 
            w1.code,
            w2.code,
            w3.code,
            w4.code,
            w5.code
          )) AS full_code,
          TRIM(BOTH ' > ' FROM CONCAT_WS(' > ',
            w1.name,
            w2.name,
            w3.name,
            w4.name,
            w5.name
          )) AS full_name
        FROM wbs w1
        LEFT JOIN wbs w2 ON w2.parent_id = w1.id
        LEFT JOIN wbs w3 ON w3.parent_id = w2.id
        LEFT JOIN wbs w4 ON w4.parent_id = w3.id
        LEFT JOIN wbs w5 ON w5.parent_id = w4.id
        WHERE w1.level = 1
        ORDER BY w1.schedule_revision_id, w1.code, w2.code, w3.code, w4.code, w5.code
      `);
      console.log('✓ Created simplified wbs_hierarchy view (supports up to 5 levels)');
    } catch (error) {
      console.error('Failed to create simplified view:', error.message);
      console.log('Note: Views are optional');
    }

    console.log('✅ wbs table created successfully with all constraints!');
  },

  async down(queryInterface, Sequelize) {
    console.log('Dropping wbs table...');
    
    // Drop view first
    try {
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS wbs_hierarchy');
      console.log('✓ Dropped wbs_hierarchy view');
    } catch (error) {
      console.log('Note: View may not exist');
    }
    
    // Drop triggers
    try {
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_wbs_prevent_self_parent');
      console.log('✓ Dropped self-parent insert trigger');
    } catch (error) {
      console.log('Note: Trigger may not exist');
    }
    
    try {
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_wbs_prevent_self_parent_update');
      console.log('✓ Dropped self-parent update trigger');
    } catch (error) {
      console.log('Note: Trigger may not exist');
    }
    
    // Drop foreign key constraints
    const constraints = [
      'fk_wbs_schedule_revision_id',
      'fk_wbs_parent_id'
    ];
    
    for (const constraintName of constraints) {
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE wbs
          DROP FOREIGN KEY ${constraintName}
        `);
        console.log(`✓ Dropped foreign key: ${constraintName}`);
      } catch (error) {
        console.log(`Note: Foreign key ${constraintName} may not exist:`, error.message);
      }
    }
    
    // Drop unique constraint
    try {
      await queryInterface.removeConstraint('wbs', 'uq_wbs_schedule_revision_id_code');
      console.log('✓ Dropped unique constraint');
    } catch (error) {
      console.log('Note: Unique constraint may not exist:', error.message);
    }
    
    // Drop table
    await queryInterface.dropTable('wbs');
    console.log('✅ Dropped wbs table');
  }
};