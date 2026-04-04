// server.js - FIXED WITH PROPER CORS CONFIGURATION, ALL DOCUMENT ROUTES, AND CRON JOBS
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
  maxAge: 86400 // 24 hours for preflight cache
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware with increased limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================================================
// 4. MONOREPO MIDDLEWARE
// ================================================
app.use('/api/clients', async (req, res, next) => {
  // Only check for POST requests (creating new clients)
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
    
    // First, make sure the table exists
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
    
    // Check if we need to modify existing table to enforce ID 1
    try {
      const [columnInfo] = await sequelize.query(
        "SHOW COLUMNS FROM client WHERE Field = 'id'"
      );
      
      if (columnInfo.length > 0) {
        const column = columnInfo[0];
        if (column.Extra.includes('auto_increment')) {
          console.log('🔄 Modifying client table to remove auto-increment and set default to 1...');
          
          // First, check if there's already data
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
          
          // Remove auto-increment and set default to 1
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

// ================================================
// 7. DOCUMENT CLASSIFICATION ROUTES
// ================================================

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
// 8. DOCUMENT MANAGEMENT ROUTES
// ================================================

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

// PROJECT DOCUMENTS ROUTES (PROJDOCS)
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

// POLICY-DOCUMENT TYPE ASSOCIATIONS ROUTES (NEW)
try {
  const policyDocTypeRoutes = (await import('./app/routes/policyDocTypeRoutes.js')).default;
  app.use('/api/policy-doc-types', policyDocTypeRoutes);
  console.log('✅ Policy-Document Type associations routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Policy-Document Type associations routes:', error.message);
}

// ================================================
// 9. HEALTH CHECK AND SYSTEM ROUTES
// ================================================

// Health check
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
    },
    endpoints: {
      clients: '/api/clients',
      businessUnits: '/api/business-units',
      users: '/api/users',
      roles: '/api/roles',
      teams: '/api/teams',
      projects: '/api/projects',
      docCategories: '/api/doc-categories',
      docSubcategories: '/api/doc-subcategories',
      docTypes: '/api/doc-types',
      emissionPolicies: '/api/emission-policies',
      emissionPeriods: '/api/emission-periods',
      projDocs: '/api/projdocs',
      docRevisions: '/api/doc-revisions',
      schdlBaselines: '/api/schdl-baselines',
      schdlCurrents: '/api/schdl-currents',
      periodicReports: '/api/periodic-reports',
      policyDocTypes: '/api/policy-doc-types',
      health: '/api/health',
      testDb: '/api/test-db',
      monorepoClient: '/api/clients/monorepo',
      cronJobs: '/api/cron-jobs'
    }
  });
});

// CORS test endpoint
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

// Cron jobs status endpoint
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

// Manual cron job trigger (admin only - protected by API key)
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

// Database test route with all models
app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    const clients = await Client.findAll({
      attributes: ['id', 'name', 'slug', 'url', 'created_at'],
      raw: true,
      order: [['created_at', 'DESC']]
    });
    
    // Get counts for roles and teams
    const rolesCount = await Role?.count() || 0;
    const teamsCount = await Team?.count() || 0;
    
    // Get counts for document classification
    const categoriesCount = await DocCategory?.count() || 0;
    const subcategoriesCount = await DocSubcategory?.count() || 0;
    const docTypesCount = await DocType?.count() || 0;
    
    // Get counts for document management
    const emissionPoliciesCount = await EmissionPolicy?.count() || 0;
    const emissionPeriodsCount = await EmissionPeriod?.count() || 0;
    const projDocsCount = await ProjDoc?.count() || 0;
    const docRevisionsCount = await DocRevision?.count() || 0;
    const schdlBaselinesCount = await SchdlBaseline?.count() || 0;
    const schdlCurrentsCount = await SchdlCurrent?.count() || 0;
    const periodicReportsCount = await PeriodicReport?.count() || 0;
    const policyDocTypesCount = await PolicyDocType?.count() || 0;
    
    // Test business units count for each client
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
        teams: teamsCount
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

// Special endpoint for monorepo client
app.get('/api/clients/monorepo', async (req, res) => {
  try {
    // Always get client with ID 1
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

// Initialize first client on startup (if none exists)
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
// 10. ERROR HANDLING MIDDLEWARE
// ================================================

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
    environment: process.env.NODE_ENV || 'not set',
    availableEndpoints: [
      // CLIENT ENDPOINTS
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
      
      // BUSINESS UNIT ENDPOINTS
      'GET    /api/business-units',
      'GET    /api/business-units/:id',
      'GET    /api/business-units/client/:clientId',
      'GET    /api/business-units/check-name',
      'POST   /api/business-units',
      'PUT    /api/business-units/:id',
      'DELETE /api/business-units/:id',
      
      // USER ENDPOINTS
      'GET    /api/users',
      'GET    /api/users/:id',
      'GET    /api/users/business-unit/:businessUnitId',
      'POST   /api/users',
      'PUT    /api/users/:id',
      'DELETE /api/users/:id',
      
      // ROLE ENDPOINTS
      'GET    /api/roles',
      'GET    /api/roles/:id',
      'GET    /api/roles/scope/:scope',
      'GET    /api/roles/check-name/:name',
      'POST   /api/roles',
      'PUT    /api/roles/:id',
      'PATCH  /api/roles/:id',
      'DELETE /api/roles/:id',
      
      // TEAM ENDPOINTS
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
      
      // PROJECT ENDPOINTS
      'GET    /api/projects',
      'GET    /api/projects/:id',
      'GET    /api/projects/business-unit/:businessUnitId',
      'POST   /api/projects',
      'PUT    /api/projects/:id',
      'DELETE /api/projects/:id',
      
      // DOCUMENT CLASSIFICATION ENDPOINTS
      'GET    /api/doc-categories',
      'GET    /api/doc-categories/:id',
      'GET    /api/doc-categories/:id/with-subcategories',
      'GET    /api/doc-categories/with-stats',
      'POST   /api/doc-categories',
      'PUT    /api/doc-categories/:id',
      'DELETE /api/doc-categories/:id',
      
      'GET    /api/doc-subcategories',
      'GET    /api/doc-subcategories/:id',
      'GET    /api/doc-subcategories/:id/with-doc-types',
      'GET    /api/doc-subcategories/by-category/:categoryId',
      'GET    /api/doc-subcategories/with-stats',
      'POST   /api/doc-subcategories',
      'PUT    /api/doc-subcategories/:id',
      'DELETE /api/doc-subcategories/:id',
      
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
      
      // DOCUMENT MANAGEMENT ENDPOINTS
      'GET    /api/emission-policies',
      'GET    /api/emission-policies/:id',
      'GET    /api/emission-policies/project/:projectId',
      'POST   /api/emission-policies/project/:projectId',
      'POST   /api/emission-policies/:id/generate-periods',
      'PUT    /api/emission-policies/:id',
      'DELETE /api/emission-policies/:id',
      
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
      
      'GET    /api/projdocs',
      'GET    /api/projdocs/:id',
      'GET    /api/projdocs/project/:projectId',
      'GET    /api/projdocs/project/:projectId/number/:docNumber',
      'GET    /api/projdocs/project/:projectId/check-number/:docNumber',
      'POST   /api/projdocs/project/:projectId',
      'PATCH  /api/projdocs/:id/status',
      'PUT    /api/projdocs/:id',
      'DELETE /api/projdocs/:id',
      
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
      
      'GET    /api/schdl-baselines',
      'GET    /api/schdl-baselines/:id',
      'GET    /api/schdl-baselines/document/:projdocId',
      'GET    /api/schdl-baselines/:id/current-schedules',
      'POST   /api/schdl-baselines/document/:projdocId',
      'PUT    /api/schdl-baselines/:id',
      'DELETE /api/schdl-baselines/:id',
      
      'GET    /api/schdl-currents',
      'GET    /api/schdl-currents/:id',
      'GET    /api/schdl-currents/document/:projdocId',
      'GET    /api/schdl-currents/:id/baseline',
      'POST   /api/schdl-currents/document/:projdocId',
      'PUT    /api/schdl-currents/:id',
      'DELETE /api/schdl-currents/:id',
      
      'GET    /api/periodic-reports',
      'GET    /api/periodic-reports/:id',
      'GET    /api/periodic-reports/document/:projdocId',
      'GET    /api/periodic-reports/signatory/:signatoryId',
      'GET    /api/periodic-reports/template/:templateRef',
      'POST   /api/periodic-reports/document/:projdocId',
      'PUT    /api/periodic-reports/:id',
      'DELETE /api/periodic-reports/:id',
      
      // POLICY-DOCUMENT TYPE ASSOCIATIONS ENDPOINTS
      'GET    /api/policy-doc-types',
      'GET    /api/policy-doc-types/:id',
      'GET    /api/policy-doc-types/by-policy/:policyId',
      'GET    /api/policy-doc-types/by-doctype/:docTypeId',
      'POST   /api/policy-doc-types',
      'POST   /api/policy-doc-types/bulk',
      'DELETE /api/policy-doc-types/:id',
      'DELETE /api/policy-doc-types/by-policy/:policyId',
      'DELETE /api/policy-doc-types/by-doctype/:docTypeId',
      
      // CRON JOB ENDPOINTS
      'GET    /api/cron-jobs',
      'POST   /api/cron-jobs/:jobName/run',
      
      // SYSTEM ENDPOINTS
      'GET    /api/health',
      'GET    /api/test-db',
      'GET    /api/cors-test',
      'GET    /api/clients/monorepo'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle Sequelize validation errors
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
  
  // Handle AppError instances
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message,
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  // Handle monorepo client errors
  if (err.message && err.message.includes('Monorepo client already exists')) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  // Handle CORS errors
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
  
  // Handle file upload errors
  if (err.message && err.message.includes('File too large')) {
    return res.status(413).json({
      status: 'fail',
      message: 'File too large. Maximum size is 50MB.',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  // Handle Sequelize unique constraint errors for policy-doc-types
  if (err.name === 'SequelizeUniqueConstraintError' && err.fields?.includes('policy_id') && err.fields?.includes('doc_type_id')) {
    return res.status(409).json({
      status: 'fail',
      message: 'This policy-document type association already exists',
      environment: process.env.NODE_ENV || 'not set'
    });
  }
  
  // Generic server error
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    environment: process.env.NODE_ENV || 'not set',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ================================================
// 11. SERVER STARTUP
// ================================================
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    
    // Initialize monorepo client table first
    await initializeMonorepoClientTable();
    
    // Initialize database with associations
    await initializeDatabase();
    console.log('✅ Database initialized with associations');
    
    // Check and initialize monorepo client
    await initializeMonorepoClient();
    
    // Initialize cron jobs (only in production or if explicitly enabled)
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
      console.log(`👥 Clients API: http://localhost:${PORT}/api/clients`);
      console.log(`📱 Monorepo Client (ID: 1): http://localhost:${PORT}/api/clients/monorepo`);
      console.log(`🏢 Business Units: http://localhost:${PORT}/api/business-units`);
      console.log(`👤 Users: http://localhost:${PORT}/api/users`);
      console.log(`🎭 Roles: http://localhost:${PORT}/api/roles`);
      console.log(`👥 Teams: http://localhost:${PORT}/api/teams`);
      console.log(`📊 Projects: http://localhost:${PORT}/api/projects`);
      console.log(`📁 Document Categories: http://localhost:${PORT}/api/doc-categories`);
      console.log(`📂 Document Subcategories: http://localhost:${PORT}/api/doc-subcategories`);
      console.log(`📄 Document Types: http://localhost:${PORT}/api/doc-types`);
      console.log(`📅 Emission Policies: http://localhost:${PORT}/api/emission-policies`);
      console.log(`📆 Emission Periods: http://localhost:${PORT}/api/emission-periods`);
      console.log(`📋 Project Documents: http://localhost:${PORT}/api/projdocs`);
      console.log(`📎 Document Revisions: http://localhost:${PORT}/api/doc-revisions`);
      console.log(`📈 Schedule Baselines: http://localhost:${PORT}/api/schdl-baselines`);
      console.log(`📉 Schedule Current: http://localhost:${PORT}/api/schdl-currents`);
      console.log(`📑 Periodic Reports: http://localhost:${PORT}/api/periodic-reports`);
      console.log(`🔗 Policy-Document Types: http://localhost:${PORT}/api/policy-doc-types`);
      console.log(`⏰ Cron Jobs API: http://localhost:${PORT}/api/cron-jobs`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
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