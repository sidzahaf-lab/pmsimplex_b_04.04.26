// models/index.js - COMPLETE WITH ALL ASSOCIATIONS
import { Sequelize } from 'sequelize';
import dbConfig from '../config/database.js';

// Import all models
import clientModel from './client.js';
import businessUnitModel from './business_unit.js';
import userModel from './users.js';
import Project from './projects.js';
import docCategoryModel from './doc_category.js';
import docSubcategoryModel from './doc_subcategory.js';
import docTypeModel from './doc_type.js';

// Import access control models
import roleModel from './roles.js';
import teamModel from './teams.js';

// Import session model
import sessionModel from './session.js';

// Import document management models
import emissionPolicyModel from './emission_policy.js';
import emissionPeriodModel from './emission_period.js';
import projDocModel from './projdoc.js';
import docRevisionModel from './doc_revision.js';
import schdlBaselineModel from './schdl_baseline.js';
import schdlCurrentModel from './schdl_current.js';
import periodicReportModel from './periodic_report.js';
import policyDocTypeModel from './policy_doc_type.js';

// Database connection setup
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  port: dbConfig.PORT,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

// Initialize models
let Client, BusinessUnit, User, DocCategory, DocSubcategory, DocType;
let Role, Team, Session;
let EmissionPolicy, EmissionPeriod, ProjDoc, DocRevision, SchdlBaseline, SchdlCurrent, PeriodicReport;
let PolicyDocType;

try {
  console.log('🔧 Initializing models...');
  
  Client = clientModel(sequelize);
  console.log('✅ Client model initialized');
  
  BusinessUnit = businessUnitModel(sequelize);
  console.log('✅ BusinessUnit model initialized');
  
  User = userModel(sequelize);
  console.log('✅ User model initialized');
  
  // Initialize Project model with the sequelize instance
  Project.init(sequelize);
  console.log('✅ Project model initialized');
  
  // Initialize document classification models
  DocCategory = docCategoryModel(sequelize);
  console.log('✅ DocCategory model initialized');
  
  DocSubcategory = docSubcategoryModel(sequelize);
  console.log('✅ DocSubcategory model initialized');
  
  DocType = docTypeModel(sequelize);
  console.log('✅ DocType model initialized');
  
  // Initialize access control models
  Role = roleModel(sequelize);
  console.log('✅ Role model initialized');
  
  Team = teamModel(sequelize);
  console.log('✅ Team model initialized');
  
  // Initialize session model
  Session = sessionModel(sequelize);
  console.log('✅ Session model initialized');
  
  // Initialize document management models
  EmissionPolicy = emissionPolicyModel(sequelize);
  console.log('✅ EmissionPolicy model initialized');
  
  EmissionPeriod = emissionPeriodModel(sequelize);
  console.log('✅ EmissionPeriod model initialized');
  
  ProjDoc = projDocModel(sequelize);
  console.log('✅ ProjDoc model initialized');
  
  DocRevision = docRevisionModel(sequelize);
  console.log('✅ DocRevision model initialized');
  
  SchdlBaseline = schdlBaselineModel(sequelize);
  console.log('✅ SchdlBaseline model initialized');
  
  SchdlCurrent = schdlCurrentModel(sequelize);
  console.log('✅ SchdlCurrent model initialized');
  
  PeriodicReport = periodicReportModel(sequelize);
  console.log('✅ PeriodicReport model initialized');
  
  // Initialize junction table model
  PolicyDocType = policyDocTypeModel(sequelize);
  console.log('✅ PolicyDocType model initialized');
  
} catch (error) {
  console.error('❌ Error initializing models:', error);
  throw error;
}

// Setup associations
const setupAssociations = () => {
  console.log('🔗 Setting up associations...');
  
  try {
    // =============================================================================
    // 1. BUSINESS UNIT - USER ASSOCIATIONS
    // =============================================================================
    if (User.rawAttributes && User.rawAttributes.business_unit_id) {
      BusinessUnit.hasMany(User, {
        foreignKey: 'business_unit_id',
        as: 'users',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      User.belongsTo(BusinessUnit, {
        foreignKey: 'business_unit_id',
        as: 'business_unit',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ BusinessUnit-User associations created');
    }

    // =============================================================================
    // 2. USER - SESSION ASSOCIATIONS
    // =============================================================================
    if (User && Session) {
      User.hasMany(Session, {
        foreignKey: 'user_id',
        as: 'sessions',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Session.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-Session associations created');
    }

    // =============================================================================
    // 3. USER - ROLE HIERARCHY ASSOCIATIONS (NEW)
    // =============================================================================
    
    // User - Corporate Role association (Level 3: Cross-BU governance)
    if (User && Role) {
      User.belongsTo(Role, {
        foreignKey: 'corporate_role_id',
        as: 'corporate_role',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-CorporateRole associations created');
    }

    // User - Default Role association (Job position suggestion, no permissions)
    if (User && Role) {
      User.belongsTo(Role, {
        foreignKey: 'default_role_id',
        as: 'default_role',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-DefaultRole associations created');
    }

    // =============================================================================
    // 4. PROJECT ASSOCIATIONS
    // =============================================================================
    if (Project.rawAttributes && Project.rawAttributes.business_unit_id) {
      Project.belongsTo(BusinessUnit, {
        foreignKey: 'business_unit_id',
        as: 'business_unit',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

      BusinessUnit.hasMany(Project, {
        foreignKey: 'business_unit_id',
        as: 'projects',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('✅ BusinessUnit-Project associations created');
    }
    
    if (Project.rawAttributes && Project.rawAttributes.created_by) {
      Project.belongsTo(User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

      User.hasMany(Project, {
        foreignKey: 'created_by',
        as: 'created_projects',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-Project (creator) associations created');
    }
    
    // =============================================================================
    // 5. ACCESS CONTROL ASSOCIATIONS (ROLES & TEAMS)
    // =============================================================================
    
    // Role - Team associations
    if (Role && Team) {
      Role.hasMany(Team, {
        foreignKey: 'role_id',
        as: 'team_assignments',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      Team.belongsTo(Role, {
        foreignKey: 'role_id',
        as: 'role',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✅ Role-Team associations created');
    }
    
    // Team - Business Unit associations
    if (Team && BusinessUnit) {
      Team.belongsTo(BusinessUnit, {
        foreignKey: 'business_unit_id',
        as: 'business_unit',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      BusinessUnit.hasMany(Team, {
        foreignKey: 'business_unit_id',
        as: 'team_assignments',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✅ BusinessUnit-Team associations created');
    }
    
    // Team - Project associations
    if (Team && Project) {
      Team.belongsTo(Project, {
        foreignKey: 'project_id',
        as: 'project',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      Project.hasMany(Team, {
        foreignKey: 'project_id',
        as: 'team_assignments',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✅ Project-Team associations created');
    }
    
    // Team - User associations (assigned user)
    if (Team && User) {
      Team.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      User.hasMany(Team, {
        foreignKey: 'user_id',
        as: 'team_assignments',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-Team (assigned user) associations created');
    }
    
    // Team - User associations (assigned by)
    if (Team && User) {
      Team.belongsTo(User, {
        foreignKey: 'assigned_by',
        as: 'assigner',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      
      User.hasMany(Team, {
        foreignKey: 'assigned_by',
        as: 'assigned_teams',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-Team (assigner) associations created');
    }
    
    // =============================================================================
    // 6. DOCUMENT CLASSIFICATION ASSOCIATIONS
    // =============================================================================
    if (DocCategory && DocSubcategory) {
      DocCategory.hasMany(DocSubcategory, {
        foreignKey: 'category_id',
        as: 'subcategories',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      DocSubcategory.belongsTo(DocCategory, {
        foreignKey: 'category_id',
        as: 'category',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ DocCategory-DocSubcategory associations created');
    }

    if (DocSubcategory && DocType) {
      DocSubcategory.hasMany(DocType, {
        foreignKey: 'subcategory_id',
        as: 'doc_types',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      DocType.belongsTo(DocSubcategory, {
        foreignKey: 'subcategory_id',
        as: 'subcategory',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ DocSubcategory-DocType associations created');
    }
    
    // =============================================================================
    // 7. EMISSION POLICY ASSOCIATIONS
    // =============================================================================
    if (EmissionPolicy && Project) {
      EmissionPolicy.belongsTo(Project, {
        foreignKey: 'project_id',
        as: 'project',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Project.hasMany(EmissionPolicy, {
        foreignKey: 'project_id',
        as: 'emission_policies',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ Project-EmissionPolicy associations created');
    }
    
    // =============================================================================
    // 8. EMISSION PERIOD ASSOCIATIONS
    // =============================================================================
    if (EmissionPeriod && EmissionPolicy) {
      EmissionPeriod.belongsTo(EmissionPolicy, {
        foreignKey: 'emission_id',
        as: 'policy',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      EmissionPolicy.hasMany(EmissionPeriod, {
        foreignKey: 'emission_id',
        as: 'periods',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ EmissionPolicy-EmissionPeriod associations created');
    }
    
    // =============================================================================
    // 9. POLICY DOC TYPE JUNCTION TABLE ASSOCIATIONS
    // =============================================================================
    if (PolicyDocType && EmissionPolicy && DocType) {
      // PolicyDocType belongs to EmissionPolicy
      PolicyDocType.belongsTo(EmissionPolicy, {
        foreignKey: 'policy_id',
        as: 'policy',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // EmissionPolicy has many PolicyDocType associations
      EmissionPolicy.hasMany(PolicyDocType, {
        foreignKey: 'policy_id',
        as: 'doc_type_associations',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // PolicyDocType belongs to DocType
      PolicyDocType.belongsTo(DocType, {
        foreignKey: 'doc_type_id',
        as: 'doc_type',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // DocType has many PolicyDocType associations
      DocType.hasMany(PolicyDocType, {
        foreignKey: 'doc_type_id',
        as: 'policy_associations',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // Many-to-many relationship through the junction table
      EmissionPolicy.belongsToMany(DocType, {
        through: PolicyDocType,
        foreignKey: 'policy_id',
        otherKey: 'doc_type_id',
        as: 'doc_types',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      DocType.belongsToMany(EmissionPolicy, {
        through: PolicyDocType,
        foreignKey: 'doc_type_id',
        otherKey: 'policy_id',
        as: 'policies',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      console.log('✅ PolicyDocType junction table associations created');
    }
    
    // =============================================================================
    // 10. PROJDOC ASSOCIATIONS
    // =============================================================================
    if (ProjDoc && Project) {
      ProjDoc.belongsTo(Project, {
        foreignKey: 'project_id',
        as: 'project',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Project.hasMany(ProjDoc, {
        foreignKey: 'project_id',
        as: 'documents',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ Project-ProjDoc associations created');
    }
    
    if (ProjDoc && DocType) {
      ProjDoc.belongsTo(DocType, {
        foreignKey: 'doc_type_id',
        as: 'doc_type',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      DocType.hasMany(ProjDoc, {
        foreignKey: 'doc_type_id',
        as: 'documents',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ DocType-ProjDoc associations created');
    }
    
    if (ProjDoc && EmissionPolicy) {
      ProjDoc.belongsTo(EmissionPolicy, {
        foreignKey: 'emission_id',
        as: 'emission_policy',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      EmissionPolicy.hasMany(ProjDoc, {
        foreignKey: 'emission_id',
        as: 'documents',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ EmissionPolicy-ProjDoc associations created');
    }
    
    // =============================================================================
    // 11. DOC REVISION ASSOCIATIONS
    // =============================================================================
    if (DocRevision && ProjDoc) {
      DocRevision.belongsTo(ProjDoc, {
        foreignKey: 'projdoc_id',
        as: 'document',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      ProjDoc.hasMany(DocRevision, {
        foreignKey: 'projdoc_id',
        as: 'revisions',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ ProjDoc-DocRevision associations created');
    }
    
    if (DocRevision && EmissionPeriod) {
      DocRevision.belongsTo(EmissionPeriod, {
        foreignKey: 'period_id',
        as: 'period',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      EmissionPeriod.hasMany(DocRevision, {
        foreignKey: 'period_id',
        as: 'revisions',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ EmissionPeriod-DocRevision associations created');
    }
    
    if (DocRevision && User) {
      DocRevision.belongsTo(User, {
        foreignKey: 'uploaded_by',
        as: 'uploader',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      User.hasMany(DocRevision, {
        foreignKey: 'uploaded_by',
        as: 'uploaded_revisions',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-DocRevision associations created');
    }
    
    if (DocRevision) {
      // Self-reference for superseded_by
      DocRevision.belongsTo(DocRevision, {
        foreignKey: 'superseded_by',
        as: 'superseding_revision',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      DocRevision.hasMany(DocRevision, {
        foreignKey: 'superseded_by',
        as: 'superseded_revisions',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ DocRevision self-reference associations created');
    }
    
    // =============================================================================
    // 12. SCHDL BASELINE ASSOCIATIONS
    // =============================================================================
    if (SchdlBaseline && ProjDoc) {
      SchdlBaseline.belongsTo(ProjDoc, {
        foreignKey: 'projdoc_id',
        as: 'document',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      ProjDoc.hasOne(SchdlBaseline, {
        foreignKey: 'projdoc_id',
        as: 'baseline_metadata',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ ProjDoc-SchdlBaseline associations created');
    }
    
    if (SchdlBaseline && User) {
      SchdlBaseline.belongsTo(User, {
        foreignKey: 'approved_by',
        as: 'approver',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      User.hasMany(SchdlBaseline, {
        foreignKey: 'approved_by',
        as: 'approved_baselines',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-SchdlBaseline associations created');
    }
    
    // =============================================================================
    // 13. SCHDL CURRENT ASSOCIATIONS
    // =============================================================================
    if (SchdlCurrent && ProjDoc) {
      SchdlCurrent.belongsTo(ProjDoc, {
        foreignKey: 'projdoc_id',
        as: 'document',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      ProjDoc.hasOne(SchdlCurrent, {
        foreignKey: 'projdoc_id',
        as: 'current_metadata',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ ProjDoc-SchdlCurrent associations created');
    }
    
    if (SchdlCurrent && SchdlBaseline) {
      SchdlCurrent.belongsTo(SchdlBaseline, {
        foreignKey: 'baseline_projdoc_id',
        as: 'baseline',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      SchdlBaseline.hasMany(SchdlCurrent, {
        foreignKey: 'baseline_projdoc_id',
        as: 'current_schedules',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ SchdlBaseline-SchdlCurrent associations created');
    }
    
    // =============================================================================
    // 14. PERIODIC REPORT ASSOCIATIONS
    // =============================================================================
    if (PeriodicReport && ProjDoc) {
      PeriodicReport.belongsTo(ProjDoc, {
        foreignKey: 'projdoc_id',
        as: 'document',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      ProjDoc.hasOne(PeriodicReport, {
        foreignKey: 'projdoc_id',
        as: 'report_metadata',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ ProjDoc-PeriodicReport associations created');
    }
    
    if (PeriodicReport && User) {
      PeriodicReport.belongsTo(User, {
        foreignKey: 'signatory',
        as: 'signatory_user',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      User.hasMany(PeriodicReport, {
        foreignKey: 'signatory',
        as: 'signatory_reports',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      console.log('✅ User-PeriodicReport associations created');
    }
    
    console.log('✅ All associations setup successfully');
    
  } catch (error) {
    console.error('❌ Error setting up associations:', error);
    throw error;
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    setupAssociations();
    
    if (process.env.NODE_ENV === 'development') {
      // Optional: sync in development
      // await sequelize.sync({ alter: true });
      // console.log('✅ Database synced');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  try {
    await sequelize.close();
    console.log('✅ Database connections closed');
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Health check function
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      models: {
        client: !!Client,
        businessUnit: !!BusinessUnit,
        user: !!User,
        session: !!Session,
        project: !!Project,
        role: !!Role,
        team: !!Team,
        docCategory: !!DocCategory,
        docSubcategory: !!DocSubcategory,
        docType: !!DocType,
        emissionPolicy: !!EmissionPolicy,
        emissionPeriod: !!EmissionPeriod,
        projDoc: !!ProjDoc,
        docRevision: !!DocRevision,
        schdlBaseline: !!SchdlBaseline,
        schdlCurrent: !!SchdlCurrent,
        periodicReport: !!PeriodicReport,
        policyDocType: !!PolicyDocType
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ================================================
// EXPORTS
// ================================================

// Export sequelize instance and functions
export { 
  sequelize, 
  initializeDatabase,
  healthCheck,
  gracefulShutdown,
};

// Export all models
export {
  Client,
  BusinessUnit,
  User,
  Session,
  Project,
  Role,
  Team,
  DocCategory,
  DocSubcategory,
  DocType,
  EmissionPolicy,
  EmissionPeriod,
  ProjDoc,
  DocRevision,
  SchdlBaseline,
  SchdlCurrent,
  PeriodicReport,
  PolicyDocType
};

// Default export
export default {
  sequelize,
  initializeDatabase,
  healthCheck,
  gracefulShutdown,
  Client,
  BusinessUnit,
  User,
  Session,
  Project,
  Role,
  Team,
  DocCategory,
  DocSubcategory,
  DocType,
  EmissionPolicy,
  EmissionPeriod,
  ProjDoc,
  DocRevision,
  SchdlBaseline,
  SchdlCurrent,
  PeriodicReport,
  PolicyDocType
};