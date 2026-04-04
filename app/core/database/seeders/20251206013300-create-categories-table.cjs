'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create categories table
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each category'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Category name (e.g., "Engineering", "Construction")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the category'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Timestamp when category was created'
      },
      last_modified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when category was last modified'
      }
    });

    // Add indexes
    await queryInterface.addIndex('categories', ['name'], {
      name: 'idx_categories_name',
      unique: true
    });
    
    await queryInterface.addIndex('categories', ['created_at'], {
      name: 'idx_categories_created_at'
    });
    
    await queryInterface.addIndex('categories', ['last_modified_at'], {
      name: 'idx_categories_last_modified_at'
    });

    // Add CHECK constraints
    // 1. Name validation - must not be empty or only whitespace
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      ADD CONSTRAINT check_category_name_not_empty 
      CHECK (TRIM(name) != '');
    `);

    // 2. Name length validation
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      ADD CONSTRAINT check_category_name_length 
      CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 255);
    `);

    // 3. Created at vs last modified validation
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      ADD CONSTRAINT check_categories_timestamps 
      CHECK (
        (last_modified_at IS NULL OR last_modified_at >= created_at) AND
        (created_at <= NOW())
      );
    `);

    // Create triggers
    // 1. Trigger for auto-updating last_modified_at
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_categories_last_modified
      BEFORE UPDATE ON categories
      FOR EACH ROW
      BEGIN
        SET NEW.last_modified_at = NOW();
      END
    `);

    // 2. Trigger for INSERT validation
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_category_insert
      BEFORE INSERT ON categories
      FOR EACH ROW
      BEGIN
        DECLARE error_msg VARCHAR(255);
        
        -- Validate name is not empty after trimming
        IF TRIM(NEW.name) = '' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name cannot be empty or only whitespace';
        END IF;
        
        -- Validate name length
        IF CHAR_LENGTH(TRIM(NEW.name)) > 255 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name cannot exceed 255 characters';
        END IF;
        
        -- Validate name doesn't contain only special characters
        IF TRIM(NEW.name) REGEXP '^[^a-zA-Z0-9]+$' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name must contain alphanumeric characters';
        END IF;
        
        -- Auto-trim name
        SET NEW.name = TRIM(NEW.name);
        
        -- Auto-trim description if not NULL
        IF NEW.description IS NOT NULL THEN
          SET NEW.description = TRIM(NEW.description);
        END IF;
        
        -- Set created_at if not provided
        IF NEW.created_at IS NULL THEN
          SET NEW.created_at = NOW();
        END IF;
        
        -- Validate created_at is not in the future
        IF NEW.created_at > NOW() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Created at timestamp cannot be in the future';
        END IF;
      END
    `);

    // 3. Trigger for UPDATE validation (FIXED - all DECLARE at beginning)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_category_update
      BEFORE UPDATE ON categories
      FOR EACH ROW
      BEGIN
        DECLARE error_msg VARCHAR(255);
        DECLARE existing_count INT;
        
        -- Prevent changing created_at
        IF NEW.created_at != OLD.created_at THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Cannot modify created_at timestamp';
        END IF;
        
        -- Validate name is not empty after trimming
        IF NEW.name IS NOT NULL AND TRIM(NEW.name) = '' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name cannot be empty or only whitespace';
        END IF;
        
        -- Validate name length
        IF NEW.name IS NOT NULL AND CHAR_LENGTH(TRIM(NEW.name)) > 255 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name cannot exceed 255 characters';
        END IF;
        
        -- Validate name doesn't contain only special characters
        IF NEW.name IS NOT NULL AND TRIM(NEW.name) REGEXP '^[^a-zA-Z0-9]+$' THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Category name must contain alphanumeric characters';
        END IF;
        
        -- Auto-trim name if changed
        IF NEW.name IS NOT NULL AND NEW.name != OLD.name THEN
          SET NEW.name = TRIM(NEW.name);
        END IF;
        
        -- Auto-trim description if changed
        IF NEW.description IS NOT NULL AND 
           (OLD.description IS NULL OR NEW.description != OLD.description) THEN
          SET NEW.description = TRIM(NEW.description);
        END IF;
        
        -- Validate last_modified_at is not before created_at
        IF NEW.last_modified_at IS NOT NULL AND NEW.last_modified_at < OLD.created_at THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Last modified at cannot be before created at';
        END IF;
        
        -- Validate last_modified_at is not in the future
        IF NEW.last_modified_at IS NOT NULL AND NEW.last_modified_at > NOW() THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Last modified at cannot be in the future';
        END IF;
        
        -- Prevent duplicate names (case-insensitive check)
        IF NEW.name IS NOT NULL AND LOWER(TRIM(NEW.name)) != LOWER(TRIM(OLD.name)) THEN
          SELECT COUNT(*) INTO existing_count 
          FROM categories 
          WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) 
            AND id != OLD.id;
          
          IF existing_count > 0 THEN
            SET error_msg = CONCAT('Category name "', TRIM(NEW.name), '" already exists');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_msg;
          END IF;
        END IF;
        
        -- Auto-set last_modified_at (this happens before the trigger_categories_last_modified trigger)
        SET NEW.last_modified_at = NOW();
      END
    `);

    // 4. Trigger to prevent deletion if category is in use (optional safety trigger)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_category_delete
      BEFORE DELETE ON categories
      FOR EACH ROW
      BEGIN
        -- Check if category is referenced in other tables
        -- This is a placeholder - modify based on your actual relationships
        -- Example: if categories are linked to projects, deliverables, etc.
        -- DECLARE usage_count INT;
        -- SELECT COUNT(*) INTO usage_count FROM projects WHERE category_id = OLD.id;
        -- IF usage_count > 0 THEN
        --   SIGNAL SQLSTATE '45000' 
        --   SET MESSAGE_TEXT = 'Cannot delete category that is in use by projects';
        -- END IF;
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop triggers in reverse order
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_category_delete;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_category_update;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_category_insert;
    `);
    
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_categories_last_modified;
    `);

    // Drop CHECK constraints (MySQL syntax)
    await queryInterface.sequelize.query(`
      ALTER TABLE categories 
      DROP CHECK check_category_name_not_empty,
      DROP CHECK check_category_name_length,
      DROP CHECK check_categories_timestamps;
    `);

    // Drop indexes
    await queryInterface.removeIndex('categories', 'idx_categories_name');
    await queryInterface.removeIndex('categories', 'idx_categories_created_at');
    await queryInterface.removeIndex('categories', 'idx_categories_last_modified_at');

    // Drop table
    await queryInterface.dropTable('categories');
  }
};