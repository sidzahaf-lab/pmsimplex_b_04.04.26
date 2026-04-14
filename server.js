// server.js - COMPLETE VERSION WITH CLASSIFICATION INITIALIZATION
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ================================================
// 1. ENVIRONMENT SETUP - MUST BE AT THE VERY TOP
// ================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment (default to development)
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

console.log(`🚀 Starting in ${env} mode`);

// Load the correct .env file
try {
  const envPath = path.join(__dirname, envFile);
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded environment from: ${envFile}`);
} catch (error) {
  console.log(`⚠️  No ${envFile} found, using process.env variables`);
}

// Log database info (without password for security)
console.log(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`📁 Database name: ${process.env.DB_NAME}`);

// ================================================
// 2. NOW IMPORT DATABASE AND OTHER MODULES
// ================================================
import { 
  sequelize, 
  initializeDatabase, 
  Client, 
  BusinessUnit, 
  User, 
  Project, 
  Role,
  Team,
  Session,
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
} from './app/models/index.js';

// Import cron service
import cronService from './app/services/cronService.js';

// Import bootstrap utilities
import { bootstrap, seedDefaultRoles, bootstrapSuperAdmin, seedTestGuest, seedTestCorporateUser, seedTestBUManager, seedTestProjectManager } from './app/utils/bootstrap.js';

const app = express();

// ================================================
// 3. CORS CONFIGURATION - FIXED: READS FROM ENV VARIABLE
// ================================================
// Read allowed origins from environment variable or use defaults
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://pmsimplex-b-04-04-26.onrender.com'];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // Temporarily allow all for debugging
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Application', 'X-Environment', 'x-api-key'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================================================
// 4. MONOREPO MIDDLEWARE
// ================================================
app.use('/api/clients', async (req, res, next) => {
  if (req.method === 'POST') {
    try {
      const clientCount = await Client.count();
      if (clientCount >= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'This is a monorepo application. Only one client can be configured.'
        });
      }
    } catch (error) {
      console.error('Error checking client count:', error);
    }
  }
  next();
});

// ================================================
// 5. DATABASE INITIALIZATION FOR MONOREPO CLIENT
// ================================================
const initializeMonorepoClientTable = async () => {
  try {
    console.log('🔧 Checking/creating monorepo client table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS client (
        id INT PRIMARY KEY DEFAULT 1,
        slug VARCHAR(25) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL UNIQUE,
        url VARCHAR(50),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Client table exists or created');
    
    try {
      const [columnInfo] = await sequelize.query(
        "SHOW COLUMNS FROM client WHERE Field = 'id'"
      );
      
      if (columnInfo.length > 0) {
        const column = columnInfo[0];
        if (column.Extra && column.Extra.includes('auto_increment')) {
          console.log('🔄 Modifying client table to remove auto-increment and set default to 1...');
          
          const [existingData] = await sequelize.query('SELECT id FROM client ORDER BY id LIMIT 1');
          
          if (existingData.length > 0) {
            const existingId = existingData[0].id;
            console.log(`📊 Found existing client with ID: ${existingId}`);
            
            if (existingId !== 1) {
              console.log(`⚠️  Existing client has ID ${existingId}, updating to ID 1...`);
              await sequelize.query('UPDATE client SET id = 1 WHERE id = ?', {
                replacements: [existingId]
              });
            }
          }
          
          await sequelize.query(`
            ALTER TABLE client MODIFY COLUMN id INT NOT NULL PRIMARY KEY DEFAULT 1
          `);
          
          console.log('✅ Client table modified: auto-increment removed, default set to 1');
        } else {
          console.log('✅ Client table already has ID configured correctly (no auto-increment)');
        }
      }
    } catch (error) {
      console.log('ℹ️  Could not check column info, table may be newly created:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error initializing monorepo client table:', error);
    throw error;
  }
};

// ================================================
// 6. ROUTE IMPORTS - ALL ROUTES
// ================================================

// AUTHENTICATION ROUTES
try {
  const authRoutes = (await import('./app/routes/authRoutes.js')).default;
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Auth routes:', error.message);
}

// BUSINESS UNITS ROUTES
try {
  const businessUnitRoutes = (await import('./app/routes/business_unitRoute.js')).default;
  app.use('/api/business-units', businessUnitRoutes);
  console.log('✅ Business Unit routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Business Unit routes:', error);
}

// CLIENT ROUTES
try {
  const clientRoutes = (await import('./app/routes/clientRoutes.js')).default;
  app.use('/api/clients', clientRoutes);
  console.log('✅ Client routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Client routes:', error.message);
}

// USERS ROUTES
try {
  const usersRoutes = (await import('./app/routes/usersRoutes.js')).default;
  app.use('/api/users', usersRoutes);
  console.log('✅ Users routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Users routes:', error);
}

// ROLES ROUTES
try {
  const rolesRoutes = (await import('./app/routes/rolesRoutes.js')).default;
  app.use('/api/roles', rolesRoutes);
  console.log('✅ Roles routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Roles routes:', error.message);
}

// TEAMS ROUTES
try {
  const teamsRoutes = (await import('./app/routes/teamsRoutes.js')).default;
  app.use('/api/teams', teamsRoutes);
  console.log('✅ Teams routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Teams routes:', error.message);
}

// PROJECTS ROUTES
try {
  const projectsRoutes = (await import('./app/routes/projectsRoutes.js')).default;
  app.use('/api/projects', projectsRoutes);
  console.log('✅ Projects routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Projects routes:', error);
}

// DOCUMENT CATEGORIES ROUTES
try {
  const docCategoryRoutes = (await import('./app/routes/docCategoriesRoutes.js')).default;
  app.use('/api/doc-categories', docCategoryRoutes);
  console.log('✅ Document Categories routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Document Categories routes:', error.message);
}

// DOCUMENT SUBCATEGORIES ROUTES
try {
  const docSubcategoryRoutes = (await import('./app/routes/docSubcategoriesRoutes.js')).default;
  app.use('/api/doc-subcategories', docSubcategoryRoutes);
  console.log('✅ Document Subcategories routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Document Subcategories routes:', error.message);
}

// DOCUMENT TYPES ROUTES
try {
  const docTypeRoutes = (await import('./app/routes/docTypesRoutes.js')).default;
  app.use('/api/doc-types', docTypeRoutes);
  console.log('✅ Document Types routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Document Types routes:', error.message);
}

// ================================================
// CLASSIFICATION INITIALIZATION ROUTE - ADD THIS
// ================================================
app.post('/api/doc-classification/initialize', async (req, res) => {
  try {
    console.log('🔥 INITIALIZATION ENDPOINT CALLED');
    
    const existingCategories = await DocCategory.count();
    console.log(`📊 Existing categories count: ${existingCategories}`);
    
    if (existingCategories > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Classification already initialized',
        data: { initialized: true, categoriesCount: existingCategories }
      });
    }

    console.log('🚀 Initializing document classification library...');
    
    // Create categories (add all 15)
    const categories = await DocCategory.bulkCreate([
      { categoryNumber: 1, label: 'Contractual Documents', description: 'Legal and contractual documentation' },
      { categoryNumber: 2, label: 'Project Management Documents', description: 'Project planning and control' },
      // ... add all 15 categories
    ]);
    
    // ... rest of initialization code
    
    res.status(201).json({ success: true, data: { categories: categories.length } });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================================================
// 6.1 CLASSIFICATION INITIALIZATION ROUTE
// ================================================
app.post('/api/doc-classification/initialize', async (req, res) => {
  try {
    console.log('🔥 INITIALIZATION ENDPOINT CALLED');
    
    // Check if already initialized
    const existingCategories = await DocCategory.count();
    console.log(`📊 Existing categories count: ${existingCategories}`);
    
    if (existingCategories > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Classification already initialized',
        data: { initialized: true, categoriesCount: existingCategories }
      });
    }

    console.log('🚀 Initializing document classification library...');
    
    // Create all 15 categories
    const categories = await DocCategory.bulkCreate([
      { categoryNumber: 1, label: 'Contractual Documents', description: 'Legal and contractual documentation for project execution' },
      { categoryNumber: 2, label: 'Project Management Documents', description: 'Documents for project planning, monitoring, and control' },
      { categoryNumber: 3, label: 'Technical Reference Documents', description: 'Technical specifications, studies, and reference materials' },
      { categoryNumber: 4, label: 'Engineering Documents', description: 'Engineering drawings, calculations, and design documents' },
      { categoryNumber: 5, label: 'Procurement Documents', description: 'Purchasing, vendor management, and logistics documents' },
      { categoryNumber: 6, label: 'Construction Documents', description: 'Site execution, method statements, and construction records' },
      { categoryNumber: 7, label: 'Quality Documents (QA/QC)', description: 'Quality management, inspections, and test records' },
      { categoryNumber: 8, label: 'HSE Documents', description: 'Health, Safety, and Environment management documents' },
      { categoryNumber: 9, label: 'Commissioning & Start-Up', description: 'Commissioning plans, procedures, and test reports' },
      { categoryNumber: 10, label: 'Regulatory Documents & Permits', description: 'Permits, licenses, and compliance documents' },
      { categoryNumber: 11, label: 'Financial & Commercial', description: 'Budget, cost, invoicing, and financial reports' },
      { categoryNumber: 12, label: 'Communication & Coordination', description: 'Meeting minutes, correspondence, and coordination documents' },
      { categoryNumber: 13, label: 'Legal & Insurance', description: 'Legal opinions, insurance policies, and dispute documents' },
      { categoryNumber: 14, label: 'Human Resources', description: 'Organization charts, job descriptions, and personnel records' },
      { categoryNumber: 15, label: 'IT & Systems', description: 'IT infrastructure, system architecture, and data management' }
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Get category references
    const catMap = {};
    for (const cat of categories) {
      catMap[cat.categoryNumber] = cat.id;
    }

    // Create subcategories
    const subcategories = await DocSubcategory.bulkCreate([
      // Category 1: Contractual Documents
      { categoryId: catMap[1], label: 'Main Contractual Documents', description: 'Core contract documents', orderIndex: 1 },
      { categoryId: catMap[1], label: 'Pre-Contractual Documents', description: 'Tender and proposal documents', orderIndex: 2 },
      { categoryId: catMap[1], label: 'Contract Modifications', description: 'Amendments and change orders', orderIndex: 3 },
      { categoryId: catMap[1], label: 'Contractual Financial Documents', description: 'Bonds, guarantees, and insurance', orderIndex: 4 },
      
      // Category 2: Project Management Documents
      { categoryId: catMap[2], label: 'Framing Documents', description: 'Project charter and business case', orderIndex: 1 },
      { categoryId: catMap[2], label: 'Management Plans', description: 'PMP, PEP, risk, quality plans', orderIndex: 2 },
      { categoryId: catMap[2], label: 'Planning Documents', description: 'Schedules and baselines', orderIndex: 3 },
      { categoryId: catMap[2], label: 'Monitoring and Control', description: 'Reports and dashboards', orderIndex: 4 },
      { categoryId: catMap[2], label: 'Closure Documents', description: 'Project closure and lessons learned', orderIndex: 5 },
      
      // Category 3: Technical Reference Documents
      { categoryId: catMap[3], label: 'Design Documents', description: 'Design criteria and specifications', orderIndex: 1 },
      { categoryId: catMap[3], label: 'Technical Studies', description: 'Feasibility and impact studies', orderIndex: 2 },
      
      // Category 4: Engineering Documents
      { categoryId: catMap[4], label: 'Civil & Structural', description: 'Structural drawings and calculations', orderIndex: 1 },
      { categoryId: catMap[4], label: 'Mechanical', description: 'P&IDs and equipment layouts', orderIndex: 2 },
      { categoryId: catMap[4], label: 'Electrical & Instrumentation', description: 'SLD and wiring diagrams', orderIndex: 3 },
      
      // Category 5: Procurement Documents
      { categoryId: catMap[5], label: 'Purchase Documents', description: 'PR, RFQ, PO', orderIndex: 1 },
      { categoryId: catMap[5], label: 'Vendor Management', description: 'AVL and vendor evaluations', orderIndex: 2 },
      
      // Category 6: Construction Documents
      { categoryId: catMap[6], label: 'Construction Planning', description: 'Site plans and method statements', orderIndex: 1 },
      { categoryId: catMap[6], label: 'Construction Execution', description: 'Daily reports and permits', orderIndex: 2 },
      { categoryId: catMap[6], label: 'As-Built', description: 'Record drawings and dossiers', orderIndex: 3 },
      
      // Category 7: Quality Documents
      { categoryId: catMap[7], label: 'Quality System', description: 'Quality manual and procedures', orderIndex: 1 },
      { categoryId: catMap[7], label: 'Inspection and Control', description: 'ITP and NCR', orderIndex: 2 },
      
      // Category 8: HSE Documents
      { categoryId: catMap[8], label: 'HSE Management', description: 'HSE plan and procedures', orderIndex: 1 },
      { categoryId: catMap[8], label: 'Safety', description: 'Permits and JSA', orderIndex: 2 },
      { categoryId: catMap[8], label: 'Environment', description: 'EIA and environmental plans', orderIndex: 3 },
      
      // Category 9: Commissioning
      { categoryId: catMap[9], label: 'Commissioning Planning', description: 'Commissioning plan and schedule', orderIndex: 1 },
      { categoryId: catMap[9], label: 'Commissioning Execution', description: 'Checklists and test reports', orderIndex: 2 },
      
      // Category 10: Regulatory
      { categoryId: catMap[10], label: 'Permits', description: 'Construction and operating permits', orderIndex: 1 },
      { categoryId: catMap[10], label: 'Compliance', description: 'Regulatory declarations', orderIndex: 2 },
      
      // Category 11: Financial
      { categoryId: catMap[11], label: 'Budget and Costs', description: 'Budget and cost breakdown', orderIndex: 1 },
      { categoryId: catMap[11], label: 'Invoicing', description: 'Invoices and payment certificates', orderIndex: 2 },
      
      // Category 12: Communication
      { categoryId: catMap[12], label: 'Meetings', description: 'Meeting minutes and agendas', orderIndex: 1 },
      { categoryId: catMap[12], label: 'Correspondence', description: 'Letters and RFIs', orderIndex: 2 },
      
      // Category 13: Legal
      { categoryId: catMap[13], label: 'Legal Documents', description: 'Legal opinions and NDAs', orderIndex: 1 },
      { categoryId: catMap[13], label: 'Insurance', description: 'Insurance policies and claims', orderIndex: 2 },
      
      // Category 14: HR
      { categoryId: catMap[14], label: 'Organization', description: 'Org charts and job descriptions', orderIndex: 1 },
      { categoryId: catMap[14], label: 'Mobilization', description: 'Employment contracts and visas', orderIndex: 2 },
      
      // Category 15: IT
      { categoryId: catMap[15], label: 'Infrastructure', description: 'IT infrastructure plans', orderIndex: 1 },
      { categoryId: catMap[15], label: 'Applications', description: 'Software requirements', orderIndex: 2 },
      { categoryId: catMap[15], label: 'Data Management', description: 'Data management plans', orderIndex: 3 },
    ]);

    console.log(`✅ Created ${subcategories.length} subcategories`);

    // Get subcategory references
    const subcatMap = {};
    for (const sub of subcategories) {
      subcatMap[sub.label] = sub.id;
    }

    // Create document types
    const docTypes = await DocType.bulkCreate([
      // Main Contractual Documents
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Main Contract / Agreement', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Letter of Award / Notice to Proceed', isPeriodic: false, entityType: 'correspondence', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'correspondence_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'General Conditions', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Special Conditions', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      
      // Pre-Contractual Documents
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Tender / RFP', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Commercial Proposal', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Technical Proposal', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      
      // Framing Documents
      { subcategoryId: subcatMap['Framing Documents'], label: 'Project Charter', isPeriodic: false, entityType: 'management', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Framing Documents'], label: 'Business Case', isPeriodic: false, entityType: 'management', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Framing Documents'], label: 'Feasibility Study', isPeriodic: false, entityType: 'study', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      
      // Management Plans
      { subcategoryId: subcatMap['Management Plans'], label: 'Project Management Plan', isPeriodic: false, entityType: 'plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Management Plans'], label: 'Risk Management Plan', isPeriodic: false, entityType: 'plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Management Plans'], label: 'Quality Management Plan', isPeriodic: false, entityType: 'plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Management Plans'], label: 'HSE Management Plan', isPeriodic: false, entityType: 'hse_plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      
      // Planning Documents
      { subcategoryId: subcatMap['Planning Documents'], label: 'Baseline Schedule', isPeriodic: false, entityType: 'schedule_baseline', nativeFormat: ['pdf', 'xer', 'xml', 'mpp', 'xlsx'], onlyOnePerProject: true, tableMetier: 'schdl_baselines' },
      { subcategoryId: subcatMap['Planning Documents'], label: 'Current Schedule', isPeriodic: true, entityType: 'schedule_current', nativeFormat: ['pdf', 'xer', 'xml', 'mpp', 'xlsx'], onlyOnePerProject: false, tableMetier: 'schdl_currents' },
      { subcategoryId: subcatMap['Planning Documents'], label: 'Milestone Schedule', isPeriodic: false, entityType: 'schedule_baseline', nativeFormat: ['pdf', 'xer', 'xml', 'mpp', 'xlsx'], onlyOnePerProject: false, tableMetier: 'schdl_baselines' },
      
      // Monitoring and Control
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Weekly Progress Report', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Monthly Progress Report', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Risk Register', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Issue Log', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      
      // Closure Documents
      { subcategoryId: subcatMap['Closure Documents'], label: 'Project Closure Report', isPeriodic: false, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Closure Documents'], label: 'Lessons Learned', isPeriodic: false, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Closure Documents'], label: 'Completion Certificate', isPeriodic: false, entityType: 'certificate', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'quality_docs_meta' },
      
      // Design Documents
      { subcategoryId: subcatMap['Design Documents'], label: 'Basis of Design', isPeriodic: false, entityType: 'technical', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Design Documents'], label: 'Technical Specifications', isPeriodic: false, entityType: 'specification', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      
      // Technical Studies
      { subcategoryId: subcatMap['Technical Studies'], label: 'Environmental Impact Study', isPeriodic: false, entityType: 'study', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Technical Studies'], label: 'Geotechnical Study', isPeriodic: false, entityType: 'study', nativeFormat: ['pdf', 'docx', 'dwg'], onlyOnePerProject: false, tableMetier: 'technical_docs_meta' },
      
      // Civil & Structural
      { subcategoryId: subcatMap['Civil & Structural'], label: 'Structural Drawings', isPeriodic: false, entityType: 'drawing', nativeFormat: ['pdf', 'dwg', 'dxf', 'rvt'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      { subcategoryId: subcatMap['Civil & Structural'], label: 'Foundation Drawings', isPeriodic: false, entityType: 'drawing', nativeFormat: ['pdf', 'dwg', 'dxf', 'rvt'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      
      // Mechanical
      { subcategoryId: subcatMap['Mechanical'], label: 'P&ID', isPeriodic: false, entityType: 'drawing', nativeFormat: ['pdf', 'dwg', 'dxf'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      { subcategoryId: subcatMap['Mechanical'], label: 'Equipment Datasheets', isPeriodic: false, entityType: 'datasheet', nativeFormat: ['pdf', 'xlsx', 'docx'], onlyOnePerProject: false, tableMetier: 'technical_docs_meta' },
      
      // Electrical & Instrumentation
      { subcategoryId: subcatMap['Electrical & Instrumentation'], label: 'Single Line Diagram', isPeriodic: false, entityType: 'drawing', nativeFormat: ['pdf', 'dwg', 'dxf'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      { subcategoryId: subcatMap['Electrical & Instrumentation'], label: 'Instrument Index', isPeriodic: false, entityType: 'index', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'technical_docs_meta' },
      
      // Purchase Documents
      { subcategoryId: subcatMap['Purchase Documents'], label: 'Purchase Requisition', isPeriodic: false, entityType: 'procurement', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'procurement_docs_meta' },
      { subcategoryId: subcatMap['Purchase Documents'], label: 'Purchase Order', isPeriodic: false, entityType: 'procurement', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'procurement_docs_meta' },
      
      // Vendor Management
      { subcategoryId: subcatMap['Vendor Management'], label: 'Approved Vendor List', isPeriodic: false, entityType: 'vendor', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: true, tableMetier: 'procurement_docs_meta' },
      
      // Construction Planning
      { subcategoryId: subcatMap['Construction Planning'], label: 'Method Statement', isPeriodic: false, entityType: 'method_statement', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'construction_docs_meta' },
      { subcategoryId: subcatMap['Construction Planning'], label: 'Site Layout Plan', isPeriodic: false, entityType: 'drawing', nativeFormat: ['pdf', 'dwg', 'dxf'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      
      // Construction Execution
      { subcategoryId: subcatMap['Construction Execution'], label: 'Daily Construction Report', isPeriodic: true, entityType: 'construction_report', nativeFormat: ['pdf', 'xlsx', 'docx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Construction Execution'], label: 'Permit to Work', isPeriodic: false, entityType: 'permit', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hse_docs_meta' },
      { subcategoryId: subcatMap['Construction Execution'], label: 'Non-Conformance Report', isPeriodic: false, entityType: 'ncr', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'quality_docs_meta' },
      { subcategoryId: subcatMap['Construction Execution'], label: 'Punch List', isPeriodic: false, entityType: 'punch_list', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'construction_docs_meta' },
      
      // As-Built
      { subcategoryId: subcatMap['As-Built'], label: 'As-Built Drawings', isPeriodic: false, entityType: 'asbuilt', nativeFormat: ['pdf', 'dwg', 'dxf', 'rvt'], onlyOnePerProject: false, tableMetier: 'drawings_meta' },
      
      // Quality System
      { subcategoryId: subcatMap['Quality System'], label: 'Project Quality Manual', isPeriodic: false, entityType: 'quality', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'quality_docs_meta' },
      { subcategoryId: subcatMap['Quality System'], label: 'Inspection and Test Plan', isPeriodic: false, entityType: 'quality', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'quality_docs_meta' },
      
      // HSE Management
      { subcategoryId: subcatMap['HSE Management'], label: 'HSE Policy', isPeriodic: false, entityType: 'hse_plan', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      { subcategoryId: subcatMap['HSE Management'], label: 'Emergency Response Plan', isPeriodic: false, entityType: 'hse_plan', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      
      // Safety
      { subcategoryId: subcatMap['Safety'], label: 'Job Safety Analysis', isPeriodic: false, entityType: 'jsa', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'hse_docs_meta' },
      { subcategoryId: subcatMap['Safety'], label: 'Incident Report', isPeriodic: false, entityType: 'incident', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hse_docs_meta' },
      
      // Environment
      { subcategoryId: subcatMap['Environment'], label: 'Environmental Management Plan', isPeriodic: false, entityType: 'hse_plan', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      { subcategoryId: subcatMap['Environment'], label: 'Waste Management Plan', isPeriodic: false, entityType: 'hse_plan', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      
      // Commissioning Planning
      { subcategoryId: subcatMap['Commissioning Planning'], label: 'Commissioning Plan', isPeriodic: false, entityType: 'commissioning', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Commissioning Planning'], label: 'Commissioning Schedule', isPeriodic: false, entityType: 'schedule_baseline', nativeFormat: ['pdf', 'xer', 'xml', 'mpp'], onlyOnePerProject: true, tableMetier: 'schdl_baselines' },
      
      // Commissioning Execution
      { subcategoryId: subcatMap['Commissioning Execution'], label: 'Commissioning Checklist', isPeriodic: false, entityType: 'checklist', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'construction_docs_meta' },
      { subcategoryId: subcatMap['Commissioning Execution'], label: 'Performance Test Report', isPeriodic: false, entityType: 'test', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'quality_docs_meta' },
      
      // Permits
      { subcategoryId: subcatMap['Permits'], label: 'Building Permit', isPeriodic: false, entityType: 'permit', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'hse_docs_meta' },
      { subcategoryId: subcatMap['Permits'], label: 'Environmental Permit', isPeriodic: false, entityType: 'permit', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hse_docs_meta' },
      
      // Budget and Costs
      { subcategoryId: subcatMap['Budget and Costs'], label: 'Project Budget', isPeriodic: false, entityType: 'financial', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: true, tableMetier: 'financial_docs_meta' },
      { subcategoryId: subcatMap['Budget and Costs'], label: 'Cost Breakdown Structure', isPeriodic: false, entityType: 'financial', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: true, tableMetier: 'financial_docs_meta' },
      { subcategoryId: subcatMap['Budget and Costs'], label: 'Cost Report', isPeriodic: true, entityType: 'financial_report', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      
      // Invoicing
      { subcategoryId: subcatMap['Invoicing'], label: 'Invoice', isPeriodic: true, entityType: 'invoice', nativeFormat: ['pdf', 'xlsx', 'xml'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Invoicing'], label: 'Payment Certificate', isPeriodic: false, entityType: 'certificate', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'quality_docs_meta' },
      
      // Meetings
      { subcategoryId: subcatMap['Meetings'], label: 'Meeting Minutes', isPeriodic: false, entityType: 'meeting', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'correspondence_meta' },
      { subcategoryId: subcatMap['Meetings'], label: 'Meeting Agenda', isPeriodic: false, entityType: 'meeting', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'correspondence_meta' },
      
      // Correspondence
      { subcategoryId: subcatMap['Correspondence'], label: 'Official Letter', isPeriodic: false, entityType: 'correspondence', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'correspondence_meta' },
      { subcategoryId: subcatMap['Correspondence'], label: 'Request for Information', isPeriodic: false, entityType: 'rfi', nativeFormat: ['pdf', 'xlsx'], onlyOnePerProject: false, tableMetier: 'correspondence_meta' },
      { subcategoryId: subcatMap['Correspondence'], label: 'Transmittal', isPeriodic: false, entityType: 'transmittal', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'correspondence_meta' },
      
      // Legal Documents
      { subcategoryId: subcatMap['Legal Documents'], label: 'Legal Opinion', isPeriodic: false, entityType: 'legal', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Legal Documents'], label: 'NDA', isPeriodic: false, entityType: 'legal', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'contracts_meta' },
      
      // Insurance
      { subcategoryId: subcatMap['Insurance'], label: 'Insurance Policy', isPeriodic: false, entityType: 'insurance', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hr_docs_meta' },
      { subcategoryId: subcatMap['Insurance'], label: 'Insurance Certificate', isPeriodic: false, entityType: 'insurance', nativeFormat: ['pdf'], onlyOnePerProject: false, tableMetier: 'hr_docs_meta' },
      
      // Organization
      { subcategoryId: subcatMap['Organization'], label: 'Project Organization Chart', isPeriodic: false, entityType: 'hr', nativeFormat: ['pdf', 'pptx', 'vsd'], onlyOnePerProject: true, tableMetier: 'hr_docs_meta' },
      { subcategoryId: subcatMap['Organization'], label: 'Job Description', isPeriodic: false, entityType: 'hr', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hr_docs_meta' },
      
      // Mobilization
      { subcategoryId: subcatMap['Mobilization'], label: 'Employment Contract', isPeriodic: false, entityType: 'hr', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hr_docs_meta' },
      { subcategoryId: subcatMap['Mobilization'], label: 'Work Visa', isPeriodic: false, entityType: 'hr', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'hr_docs_meta' },
      
      // Infrastructure
      { subcategoryId: subcatMap['Infrastructure'], label: 'IT Infrastructure Plan', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'docx', 'vsd'], onlyOnePerProject: true, tableMetier: 'it_docs_meta' },
      { subcategoryId: subcatMap['Infrastructure'], label: 'Network Diagram', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'vsd', 'dwg'], onlyOnePerProject: false, tableMetier: 'it_docs_meta' },
      
      // Applications
      { subcategoryId: subcatMap['Applications'], label: 'Software Requirements', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'it_docs_meta' },
      { subcategoryId: subcatMap['Applications'], label: 'User Manual', isPeriodic: false, entityType: 'manual', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: false, tableMetier: 'technical_docs_meta' },
      
      // Data Management
      { subcategoryId: subcatMap['Data Management'], label: 'Data Management Plan', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'it_docs_meta' },
      { subcategoryId: subcatMap['Data Management'], label: 'Backup Procedure', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'it_docs_meta' },
      { subcategoryId: subcatMap['Data Management'], label: 'Security Policy', isPeriodic: false, entityType: 'it', nativeFormat: ['pdf', 'docx'], onlyOnePerProject: true, tableMetier: 'it_docs_meta' },
    ]);

    console.log(`✅ Created ${docTypes.length} document types`);

    res.status(201).json({
      success: true,
      message: 'Classification initialized successfully',
      data: {
        categories: categories.length,
        subcategories: subcategories.length,
        docTypes: docTypes.length
      }
    });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize classification', 
      error: error.message 
    });
  }
});

// EMISSION POLICIES ROUTES
try {
  const emissionPolicyRoutes = (await import('./app/routes/emissionPolicyRoutes.js')).default;
  app.use('/api/emission-policies', emissionPolicyRoutes);
  console.log('✅ Emission Policies routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Emission Policies routes:', error.message);
}

// EMISSION PERIODS ROUTES
try {
  const emissionPeriodRoutes = (await import('./app/routes/emissionPeriodRoutes.js')).default;
  app.use('/api/emission-periods', emissionPeriodRoutes);
  console.log('✅ Emission Periods routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Emission Periods routes:', error.message);
}

// PROJECT DOCUMENTS ROUTES
try {
  const projDocRoutes = (await import('./app/routes/projDocRoutes.js')).default;
  app.use('/api/projdocs', projDocRoutes);
  console.log('✅ Project Documents routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Project Documents routes:', error.message);
}

// DOCUMENT REVISIONS ROUTES
try {
  const docRevisionRoutes = (await import('./app/routes/docRevisionRoutes.js')).default;
  app.use('/api/doc-revisions', docRevisionRoutes);
  console.log('✅ Document Revisions routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Document Revisions routes:', error.message);
}

// SCHEDULE BASELINES ROUTES
try {
  const schdlBaselineRoutes = (await import('./app/routes/schdlBaselineRoutes.js')).default;
  app.use('/api/schdl-baselines', schdlBaselineRoutes);
  console.log('✅ Schedule Baselines routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Schedule Baselines routes:', error.message);
}

// SCHEDULE CURRENT ROUTES
try {
  const schdlCurrentRoutes = (await import('./app/routes/schdlCurrentRoutes.js')).default;
  app.use('/api/schdl-currents', schdlCurrentRoutes);
  console.log('✅ Schedule Current routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Schedule Current routes:', error.message);
}

// PERIODIC REPORTS ROUTES
try {
  const periodicReportRoutes = (await import('./app/routes/periodicReportRoutes.js')).default;
  app.use('/api/periodic-reports', periodicReportRoutes);
  console.log('✅ Periodic Reports routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Periodic Reports routes:', error.message);
}

// POLICY-DOCUMENT TYPE ASSOCIATIONS ROUTES
try {
  const policyDocTypeRoutes = (await import('./app/routes/policyDocTypeRoutes.js')).default;
  app.use('/api/policy-doc-types', policyDocTypeRoutes);
  console.log('✅ Policy-Document Type associations routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Policy-Document Type associations routes:', error.message);
}

// ================================================
// 6.5 CORPORATE ROUTES
// ================================================

// CORPORATE ROUTES
try {
  const corporateRoutes = (await import('./app/routes/corporateRoutes.js')).default;
  app.use('/api/corporate', corporateRoutes);
  console.log('✅ Corporate routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Corporate routes:', error.message);
}

// ================================================
// 7. HEALTH CHECK AND SYSTEM ROUTES
// ================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'not set',
    cron: {
      enabled: process.env.ENABLE_CRON === 'true',
      jobs: cronService.listJobs()
    },
    cors: {
      allowedOrigins: allowedOrigins,
      allowedMethods: corsOptions.methods
    },
    database: {
      host: process.env.DB_HOST || 'not set',
      port: process.env.DB_PORT || 'not set',
      name: process.env.DB_NAME || 'not set'
    },
    models: {
      clients: '✅ Active',
      businessUnits: '✅ Active',
      users: '✅ Active',
      sessions: '✅ Active',
      projects: '✅ Active',
      roles: '✅ Active',
      teams: '✅ Active',
      docCategories: '✅ Active',
      docSubcategories: '✅ Active',
      docTypes: '✅ Active',
      emissionPolicies: '✅ Active',
      emissionPeriods: '✅ Active',
      projDocs: '✅ Active',
      docRevisions: '✅ Active',
      schdlBaselines: '✅ Active',
      schdlCurrents: '✅ Active',
      periodicReports: '✅ Active',
      policyDocTypes: '✅ Active'
    }
  });
});

app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    corsHeaders: {
      'Access-Control-Allow-Origin': req.headers.origin || 'Not set in request',
      'Access-Control-Allow-Methods': corsOptions.methods.join(', '),
      'Access-Control-Allow-Headers': corsOptions.allowedHeaders.join(', ')
    },
    requestHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cron-jobs', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.CRON_API_KEY;
    
    if (validApiKey && apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: {
        enabled: process.env.ENABLE_CRON === 'true',
        jobs: cronService.listJobs(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/cron-jobs/:jobName/run', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.CRON_API_KEY;
    
    if (validApiKey && apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { jobName } = req.params;
    
    if (!['compliance-check', 'weekly-report'].includes(jobName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job name. Must be "compliance-check" or "weekly-report"'
      });
    }
    
    await cronService.runJobManually(jobName);
    
    res.json({
      success: true,
      message: `Job ${jobName} executed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to run cron job:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    const clients = await Client.findAll({
      attributes: ['id', 'name', 'slug', 'url', 'created_at'],
      raw: true,
      order: [['created_at', 'DESC']]
    });
    
    const rolesCount = await Role?.count() || 0;
    const teamsCount = await Team?.count() || 0;
    const sessionsCount = await Session?.count() || 0;
    const superAdminCount = await User?.count({ where: { is_super_admin: true } }) || 0;
    const guestCount = await User?.count({ where: { is_guest: true } }) || 0;
    const activeUsersCount = await User?.count({ where: { is_active: true } }) || 0;
    
    const categoriesCount = await DocCategory?.count() || 0;
    const subcategoriesCount = await DocSubcategory?.count() || 0;
    const docTypesCount = await DocType?.count() || 0;
    
    const emissionPoliciesCount = await EmissionPolicy?.count() || 0;
    const emissionPeriodsCount = await EmissionPeriod?.count() || 0;
    const projDocsCount = await ProjDoc?.count() || 0;
    const docRevisionsCount = await DocRevision?.count() || 0;
    const schdlBaselinesCount = await SchdlBaseline?.count() || 0;
    const schdlCurrentsCount = await SchdlCurrent?.count() || 0;
    const periodicReportsCount = await PeriodicReport?.count() || 0;
    const policyDocTypesCount = await PolicyDocType?.count() || 0;
    
    const clientsWithCounts = await Promise.all(clients.map(async (client) => {
      const businessUnitsCount = await BusinessUnit?.count({
        where: { client_id: client.id }
      }).catch(() => 0);
      
      const projectsCount = await Project?.count({
        where: { business_unit_id: client.id }
      }).catch(() => 0);
      
      return {
        ...client,
        business_units_count: businessUnitsCount || 0,
        projects_count: projectsCount || 0
      };
    }));
    
    res.json({ 
      message: 'Database connection successful',
      environment: process.env.NODE_ENV || 'not set',
      database: {
        host: process.env.DB_HOST || 'not set',
        dialect: sequelize.getDialect(),
        connected: true
      },
      clientCount: clients.length,
      clients: clientsWithCounts,
      accessControl: {
        roles: rolesCount,
        teams: teamsCount,
        sessions: sessionsCount,
        total_users: await User?.count() || 0,
        active_users: activeUsersCount,
        super_admins: superAdminCount,
        guests: guestCount
      },
      documentClassification: {
        categories: categoriesCount,
        subcategories: subcategoriesCount,
        docTypes: docTypesCount
      },
      documentManagement: {
        emissionPolicies: emissionPoliciesCount,
        emissionPeriods: emissionPeriodsCount,
        projDocs: projDocsCount,
        docRevisions: docRevisionsCount,
        schdlBaselines: schdlBaselinesCount,
        schdlCurrents: schdlCurrentsCount,
        periodicReports: periodicReportsCount,
        policyDocTypes: policyDocTypesCount
      },
      hasClients: clients.length > 0,
      isMonorepo: true,
      maxClients: 1,
      clientIdAlwaysOne: clients.every(client => client.id === 1)
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed', 
      environment: process.env.NODE_ENV || 'not set',
      database: {
        host: process.env.DB_HOST || 'not set',
        error: error.message
      },
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/clients/monorepo', async (req, res) => {
  try {
    const client = await Client.findByPk(1);
    
    if (!client) {
      return res.status(404).json({
        status: 'success',
        data: null,
        message: 'No client configured yet',
        environment: process.env.NODE_ENV || 'not set'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        client: client
      },
      environment: process.env.NODE_ENV || 'not set'
    });
  } catch (error) {
    console.error('Error fetching monorepo client:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch client configuration',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
});

const initializeMonorepoClient = async () => {
  try {
    const clientCount = await Client.count();
    
    if (clientCount === 0) {
      console.log('📝 No client found. Monorepo client needs to be configured.');
      console.log('ℹ️  Use the ConfigClient component to set up your main client (will be ID: 1).');
    } else if (clientCount === 1) {
      const client = await Client.findByPk(1);
      if (client) {
        console.log(`✅ Monorepo client configured: ${client.name} (ID: ${client.id})`);
      } else {
        console.log('⚠️  Client exists but not with ID 1. This may indicate a database issue.');
      }
    } else {
      console.warn(`⚠️  Warning: ${clientCount} clients found. This is a monorepo - only one client should exist.`);
    }
  } catch (error) {
    console.error('Error checking monorepo client:', error);
  }
};

// ================================================
// 8. 404 HANDLER - COMPLETE ENDPOINT LIST
// ================================================

app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
    environment: process.env.NODE_ENV || 'not set'
  });
});

// ================================================
// 9. GLOBAL ERROR HANDLER
// ================================================

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your token has expired. Please refresh your token or log in again.',
      code: 'TOKEN_EXPIRED',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      environment: process.env.NODE_ENV || 'not set',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message,
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    environment: process.env.NODE_ENV || 'not set',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ================================================
// 10. SERVER STARTUP
// ================================================
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    
    await initializeMonorepoClientTable();
    await initializeDatabase();
    console.log('✅ Database initialized with associations');
    
    // RUN COMPLETE BOOTSTRAP (seeds all roles and creates super admin)
    await seedDefaultRoles();
    console.log('✅ Default roles seeded');
    
    await bootstrapSuperAdmin();
    console.log('✅ Super admin bootstrap completed');
    
    // ============================================
// ADD THIS LINE - Initialize classification data
// ============================================
const { initializeClassificationData } = await import('./app/utils/initializeClassification.js');
await initializeClassificationData();
// ============================================

    // Seed test users in development
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🧪 Seeding test users for development...\n');
      await seedTestGuest();
      await seedTestCorporateUser();
      await seedTestBUManager();
      await seedTestProjectManager();
    }
    
    await initializeMonorepoClient();
    
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      cronService.initializeJobs();
      console.log('⏰ Cron jobs initialized and scheduled');
    } else {
      console.log('⏰ Cron jobs disabled (enable with ENABLE_CRON=true or production mode)');
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 CORS Configuration:`);
      console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
      console.log(`   Allowed Methods: ${corsOptions.methods.join(', ')}`);
      console.log(`⏰ Cron Jobs: ${process.env.ENABLE_CRON === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 CORS test: http://localhost:${PORT}/api/cors-test`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
      console.log(`🎭 Roles API: http://localhost:${PORT}/api/roles`);
      console.log(`👥 Teams API: http://localhost:${PORT}/api/teams`);
      console.log(`📊 Projects API: http://localhost:${PORT}/api/projects`);
      console.log(`🏢 Corporate API: http://localhost:${PORT}/api/corporate`);
      console.log(`📁 Document Classification: http://localhost:${PORT}/api/doc-*`);
      console.log(`📚 Classification Init: POST http://localhost:${PORT}/api/doc-classification/initialize`);
      console.log(`⏰ Cron Jobs API: http://localhost:${PORT}/api/cron-jobs`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  cronService.stopAllJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  cronService.stopAllJobs();
  process.exit(0);
});

startServer();