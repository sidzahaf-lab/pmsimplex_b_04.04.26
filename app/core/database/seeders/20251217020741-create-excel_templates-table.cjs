'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if users table exists
    const [tables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length === 0) {
      console.error('ERROR: Users table does not exist. Please run the users migration first.');
      throw new Error('Users table does not exist. Please create users table before excel_templates.');
    }

    // Create excel_templates table
    await queryInterface.createTable('excel_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Functional code (e.g. TPL-BL-SCH, TPL-DPR)'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Template display name'
      },
      template_category: {
        type: Sequelize.ENUM('schedule', 'progress', 'cost', 'quality', 'governance', 'reporting'),
        allowNull: false,
        comment: 'Template category'
      },
      schedule_type: {
        type: Sequelize.ENUM('baseline', 'forecast', 'actual'),
        allowNull: true,
        comment: 'Schedule type (ONLY for schedule templates)'
      },
      version: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Template version (e.g. 1.0, 1.1)'
      },
      template_uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        comment: 'UUID embedded inside Excel (template fingerprint)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Purpose and usage notes'
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Server path to XLSX template'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'TRUE = available for use'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Template creator'
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
        comment: 'Timestamp when template was last updated'
      },
      deprecated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When template was deprecated'
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('excel_templates', ['code'], {
      name: 'idx_excel_templates_code',
      unique: true
    });
    
    await queryInterface.addIndex('excel_templates', ['template_uuid'], {
      name: 'idx_excel_templates_template_uuid',
      unique: true
    });
    
    await queryInterface.addIndex('excel_templates', ['template_category'], {
      name: 'idx_excel_templates_category'
    });
    
    await queryInterface.addIndex('excel_templates', ['schedule_type'], {
      name: 'idx_excel_templates_schedule_type'
    });
    
    await queryInterface.addIndex('excel_templates', ['version'], {
      name: 'idx_excel_templates_version'
    });
    
    await queryInterface.addIndex('excel_templates', ['is_active'], {
      name: 'idx_excel_templates_is_active'
    });
    
    await queryInterface.addIndex('excel_templates', ['created_by'], {
      name: 'idx_excel_templates_created_by'
    });
    
    await queryInterface.addIndex('excel_templates', ['created_at'], {
      name: 'idx_excel_templates_created_at'
    });
    
    await queryInterface.addIndex('excel_templates', ['updated_at'], {
      name: 'idx_excel_templates_updated_at'
    });
    
    await queryInterface.addIndex('excel_templates', ['deprecated_at'], {
      name: 'idx_excel_templates_deprecated_at'
    });
    
    // Composite index for unique constraint: template_category, schedule_type, version
    await queryInterface.addIndex('excel_templates', 
      ['template_category', 'schedule_type', 'version'], 
      {
        name: 'idx_excel_templates_category_type_version',
        unique: true
      }
    );
    
    // Composite index for common queries
    await queryInterface.addIndex('excel_templates', 
      ['template_category', 'schedule_type', 'is_active'], 
      {
        name: 'idx_excel_templates_category_type_active'
      }
    );
    
    await queryInterface.addIndex('excel_templates', 
      ['template_category', 'is_active'], 
      {
        name: 'idx_excel_templates_category_active'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    const indexes = [
      'idx_excel_templates_code',
      'idx_excel_templates_template_uuid',
      'idx_excel_templates_category',
      'idx_excel_templates_schedule_type',
      'idx_excel_templates_version',
      'idx_excel_templates_is_active',
      'idx_excel_templates_created_by',
      'idx_excel_templates_created_at',
      'idx_excel_templates_updated_at',
      'idx_excel_templates_deprecated_at',
      'idx_excel_templates_category_type_version',
      'idx_excel_templates_category_type_active',
      'idx_excel_templates_category_active'
    ];
    
    for (const indexName of indexes) {
      try {
        await queryInterface.removeIndex('excel_templates', indexName);
      } catch (error) {
        console.log(`Index ${indexName} may not exist:`, error.message);
      }
    }
    
    // Drop the excel_templates table
    await queryInterface.dropTable('excel_templates');
    
    // Drop the ENUM types (PostgreSQL specific - remove if using other DB)
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_excel_templates_template_category;');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_excel_templates_schedule_type;');
    } catch (error) {
      console.log('Note: ENUM type cleanup may vary by database');
    }
  }
};