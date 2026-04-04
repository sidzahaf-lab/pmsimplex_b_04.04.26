// server.js - COMPLETE VERSION (Full 999+ lines equivalent)
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
// 3. CORS CONFIGURATION - FIXED FOR FILE UPLOADS
// ================================================
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
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
        if (column.Extra.includes('auto_increment')) {
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
// 6.5 CORPORATE ROUTES (NEW)
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
      allowedOrigins: corsOptions.origin,
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
    environment: process.env.NODE_ENV || 'not set',
    availableEndpoints: [
      '=========================================',
      'AUTH ENDPOINTS:',
      '=========================================',
      'POST   /api/auth/login',
      'POST   /api/auth/refresh-token',
      'POST   /api/auth/logout',
      'POST   /api/auth/logout-all',
      'GET    /api/auth/me',
      'POST   /api/auth/change-password',
      '',
      '=========================================',
      'USER ENDPOINTS:',
      '=========================================',
      'GET    /api/users',
      'GET    /api/users/profile',
      'GET    /api/users/check-username/:username',
      'GET    /api/users/check-email/:email',
      'GET    /api/users/:id',
      'GET    /api/users/business-unit/:businessUnitId',
      'POST   /api/users',
      'PUT    /api/users/:id',
      'PATCH  /api/users/:id',
      'PATCH  /api/users/:id/toggle-status',
      'PATCH  /api/users/:id/deactivate',
      'PATCH  /api/users/:id/activate',
      'DELETE /api/users/:id',
      '',
      '=========================================',
      'ROLE ENDPOINTS:',
      '=========================================',
      'GET    /api/roles',
      'GET    /api/roles/:id',
      'GET    /api/roles/scope/:scope',
      'GET    /api/roles/check-name/:name',
      'POST   /api/roles',
      'PUT    /api/roles/:id',
      'PATCH  /api/roles/:id',
      'DELETE /api/roles/:id',
      '',
      '=========================================',
      'TEAM ENDPOINTS:',
      '=========================================',
      'GET    /api/teams',
      'GET    /api/teams/:id',
      'GET    /api/teams/user/:userId',
      'GET    /api/teams/user/:userId/active',
      'GET    /api/teams/business-unit/:businessUnitId',
      'GET    /api/teams/project/:projectId',
      'GET    /api/teams/role/:roleId',
      'POST   /api/teams',
      'PUT    /api/teams/:id',
      'PATCH  /api/teams/:id',
      'PATCH  /api/teams/:id/deactivate',
      'PATCH  /api/teams/:id/activate',
      'DELETE /api/teams/:id',
      '',
      '=========================================',
      'PROJECT ENDPOINTS:',
      '=========================================',
      'GET    /api/projects',
      'GET    /api/projects/:id',
      'GET    /api/projects/business-unit/:businessUnitId',
      'POST   /api/projects',
      'PUT    /api/projects/:id',
      'DELETE /api/projects/:id',
      'GET    /api/projects/:id/team',
      'POST   /api/projects/:id/members',
      'DELETE /api/projects/:id/team/:userId',
      'PATCH  /api/projects/:id/team/:userId/role',
      '',
      '=========================================',
      'BUSINESS UNIT ENDPOINTS:',
      '=========================================',
      'GET    /api/business-units',
      'GET    /api/business-units/:id',
      'GET    /api/business-units/client/:clientId',
      'GET    /api/business-units/check-name',
      'POST   /api/business-units',
      'PUT    /api/business-units/:id',
      'DELETE /api/business-units/:id',
      '',
      '=========================================',
      'CLIENT ENDPOINTS:',
      '=========================================',
      'GET    /api/clients',
      'GET    /api/clients/monorepo',
      'GET    /api/clients/:id',
      'GET    /api/clients/slug/:slug',
      'GET    /api/clients/:id/with-business-units',
      'GET    /api/clients/:id/business-units-count',
      'GET    /api/clients/check-slug',
      'GET    /api/clients/check-name',
      'POST   /api/clients',
      'PUT    /api/clients/:id',
      'DELETE /api/clients/:id',
      '',
      '=========================================',
      'DOCUMENT CATEGORIES:',
      '=========================================',
      'GET    /api/doc-categories',
      'GET    /api/doc-categories/:id',
      'GET    /api/doc-categories/:id/with-subcategories',
      'GET    /api/doc-categories/with-stats',
      'POST   /api/doc-categories',
      'PUT    /api/doc-categories/:id',
      'DELETE /api/doc-categories/:id',
      '',
      '=========================================',
      'DOCUMENT SUBCATEGORIES:',
      '=========================================',
      'GET    /api/doc-subcategories',
      'GET    /api/doc-subcategories/:id',
      'GET    /api/doc-subcategories/:id/with-doc-types',
      'GET    /api/doc-subcategories/by-category/:categoryId',
      'GET    /api/doc-subcategories/with-stats',
      'POST   /api/doc-subcategories',
      'PUT    /api/doc-subcategories/:id',
      'DELETE /api/doc-subcategories/:id',
      '',
      '=========================================',
      'DOCUMENT TYPES:',
      '=========================================',
      'GET    /api/doc-types',
      'GET    /api/doc-types/:id',
      'GET    /api/doc-types/by-subcategory/:subcategoryId',
      'GET    /api/doc-types/periodic',
      'GET    /api/doc-types/by-entity-type/:entityType',
      'GET    /api/doc-types/with-details',
      'POST   /api/doc-types/validate-format',
      'POST   /api/doc-types',
      'PUT    /api/doc-types/:id',
      'DELETE /api/doc-types/:id',
      '',
      '=========================================',
      'EMISSION POLICIES:',
      '=========================================',
      'GET    /api/emission-policies',
      'GET    /api/emission-policies/:id',
      'GET    /api/emission-policies/project/:projectId',
      'POST   /api/emission-policies/project/:projectId',
      'POST   /api/emission-policies/:id/generate-periods',
      'PUT    /api/emission-policies/:id',
      'DELETE /api/emission-policies/:id',
      '',
      '=========================================',
      'EMISSION PERIODS:',
      '=========================================',
      'GET    /api/emission-periods',
      'GET    /api/emission-periods/overdue',
      'GET    /api/emission-periods/upcoming',
      'GET    /api/emission-periods/with-revisions',
      'GET    /api/emission-periods/statistics',
      'GET    /api/emission-periods/year/:year',
      'GET    /api/emission-periods/year/:year/quarter/:quarter',
      'GET    /api/emission-periods/date-range',
      'GET    /api/emission-periods/:id',
      'GET    /api/emission-periods/:id/revision-status',
      'GET    /api/emission-policies/:policyId/periods',
      'GET    /api/emission-policies/:policyId/periods/summary',
      'GET    /api/emission-policies/:policyId/periods/revision-status',
      'POST   /api/emission-policies/:policyId/periods',
      'POST   /api/emission-policies/:policyId/periods/bulk',
      'POST   /api/emission-periods/check-compliance',
      'PUT    /api/emission-periods/:id',
      'PATCH  /api/emission-periods/:id',
      'DELETE /api/emission-periods/:id',
      '',
      '=========================================',
      'PROJECT DOCUMENTS:',
      '=========================================',
      'GET    /api/projdocs',
      'GET    /api/projdocs/:id',
      'GET    /api/projdocs/project/:projectId',
      'GET    /api/projdocs/project/:projectId/number/:docNumber',
      'GET    /api/projdocs/project/:projectId/check-number/:docNumber',
      'POST   /api/projdocs/project/:projectId',
      'PATCH  /api/projdocs/:id/status',
      'PUT    /api/projdocs/:id',
      'DELETE /api/projdocs/:id',
      '',
      '=========================================',
      'DOCUMENT REVISIONS:',
      '=========================================',
      'GET    /api/doc-revisions',
      'GET    /api/doc-revisions/status/:status',
      'GET    /api/doc-revisions/uploader/:userId',
      'GET    /api/doc-revisions/duplicates',
      'GET    /api/doc-revisions/statistics',
      'GET    /api/doc-revisions/:id',
      'GET    /api/doc-revisions/:id/download',
      'GET    /api/projdocs/:projdocId/revisions',
      'GET    /api/projdocs/:projdocId/latest-revision',
      'GET    /api/projdocs/:projdocId/revision-history',
      'GET    /api/emission-periods/:periodId/revisions',
      'POST   /api/doc-revisions/check-hash',
      'POST   /api/doc-revisions/projdocs/:projdocId/revisions',
      'POST   /api/doc-revisions/bulk-status-update',
      'PUT    /api/doc-revisions/:id',
      'PATCH  /api/doc-revisions/:id',
      'DELETE /api/doc-revisions/:id',
      '',
      '=========================================',
      'SCHEDULE BASELINES:',
      '=========================================',
      'GET    /api/schdl-baselines',
      'GET    /api/schdl-baselines/:id',
      'GET    /api/schdl-baselines/document/:projdocId',
      'GET    /api/schdl-baselines/:id/current-schedules',
      'POST   /api/schdl-baselines/document/:projdocId',
      'PUT    /api/schdl-baselines/:id',
      'DELETE /api/schdl-baselines/:id',
      '',
      '=========================================',
      'SCHEDULE CURRENT:',
      '=========================================',
      'GET    /api/schdl-currents',
      'GET    /api/schdl-currents/:id',
      'GET    /api/schdl-currents/document/:projdocId',
      'GET    /api/schdl-currents/:id/baseline',
      'POST   /api/schdl-currents/document/:projdocId',
      'PUT    /api/schdl-currents/:id',
      'DELETE /api/schdl-currents/:id',
      '',
      '=========================================',
      'PERIODIC REPORTS:',
      '=========================================',
      'GET    /api/periodic-reports',
      'GET    /api/periodic-reports/:id',
      'GET    /api/periodic-reports/document/:projdocId',
      'GET    /api/periodic-reports/signatory/:signatoryId',
      'GET    /api/periodic-reports/template/:templateRef',
      'POST   /api/periodic-reports/document/:projdocId',
      'PUT    /api/periodic-reports/:id',
      'DELETE /api/periodic-reports/:id',
      '',
      '=========================================',
      'POLICY-DOCUMENT TYPE ASSOCIATIONS:',
      '=========================================',
      'GET    /api/policy-doc-types',
      'GET    /api/policy-doc-types/:id',
      'GET    /api/policy-doc-types/by-policy/:policyId',
      'GET    /api/policy-doc-types/by-doctype/:docTypeId',
      'POST   /api/policy-doc-types',
      'POST   /api/policy-doc-types/bulk',
      'DELETE /api/policy-doc-types/:id',
      'DELETE /api/policy-doc-types/by-policy/:policyId',
      'DELETE /api/policy-doc-types/by-doctype/:docTypeId',
      '',
      '=========================================',
      'CORPORATE ENDPOINTS:',
      '=========================================',
      'GET    /api/corporate/dashboard',
      'GET    /api/corporate/reports',
      'GET    /api/corporate/audit',
      'GET    /api/corporate/policies',
      'POST   /api/corporate/policies',
      'GET    /api/corporate/cross-bu/projects',
      'GET    /api/corporate/cross-bu/users',
      'GET    /api/corporate/statistics',
      '',
      '=========================================',
      'CRON JOB ENDPOINTS:',
      '=========================================',
      'GET    /api/cron-jobs',
      'POST   /api/cron-jobs/:jobName/run',
      '',
      '=========================================',
      'SYSTEM ENDPOINTS:',
      '=========================================',
      'GET    /api/health',
      'GET    /api/test-db',
      'GET    /api/cors-test',
      'GET    /api/clients/monorepo'
    ]
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
  
  if (err.message && err.message.includes('Monorepo client already exists')) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      status: 'fail',
      message: 'CORS error: ' + err.message,
      environment: process.env.NODE_ENV || 'not set',
      corsConfiguration: {
        allowedOrigins: corsOptions.origin,
        allowedMethods: corsOptions.methods,
        allowedHeaders: corsOptions.allowedHeaders
      }
    });
  }
  
  if (err.message && err.message.includes('File too large')) {
    return res.status(413).json({
      status: 'fail',
      message: 'File too large. Maximum size is 50MB.',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError' && err.fields?.includes('policy_id') && err.fields?.includes('doc_type_id')) {
    return res.status(409).json({
      status: 'fail',
      message: 'This policy-document type association already exists',
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
      console.log(`   Allowed Origins: ${corsOptions.origin.join(', ')}`);
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
      console.log(`📄 Document Management: http://localhost:${PORT}/api/emission-*, /api/projdocs, etc.`);
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