// config/database.js - ENHANCED FOR RENDER + TiDB DEPLOYMENT

/**
 * DATABASE CONFIGURATION
 * Supports:
 * 1. Production on Render with TiDB Cloud
 * 2. Local development with MySQL
 * 3. Render environment variables
 */

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isTiDB = process.env.DB_HOST?.includes('tidbcloud.com') || 
               process.env.DATABASE_URL?.includes('tidbcloud.com') ||
               isProduction;

// Logging with emojis for clarity
console.log(`📊 Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`🗄️  Database: ${isTiDB ? 'TiDB Cloud' : 'Local MySQL'}`);

// Parse DATABASE_URL from Render if available
const parseDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    try {
      // mysql://username:password@host:port/database
      const url = new URL(process.env.DATABASE_URL);
      const [user, password] = url.username ? url.username.split(':') : ['', ''];
      
      return {
        host: url.hostname,
        port: parseInt(url.port) || (isTiDB ? 4000 : 3306),
        username: user,
        password: password,
        database: url.pathname.replace('/', ''),
        protocol: url.protocol.replace(':', '')
      };
    } catch (error) {
      console.warn('⚠️  Could not parse DATABASE_URL, using individual env vars');
    }
  }
  return null;
};

const dbUrlConfig = parseDatabaseUrl();

export default {
  // 1. DATABASE CONNECTION - Priority: DATABASE_URL > Individual env vars > defaults
  HOST: dbUrlConfig?.host || 
        process.env.DB_HOST || 
        (isTiDB ? "gateway01.eu-central-1.prod.aws.tidbcloud.com" : "localhost"),
  
  USER: dbUrlConfig?.username || 
        process.env.DB_USER || 
        (isTiDB ? "26B7PnJsxyEcX7C.root" : "root"),
  
  PASSWORD: dbUrlConfig?.password || 
            process.env.DB_PASSWORD || 
            (isTiDB ? "RV66sSgYxPMKzo6n" : "root"),
  
  DB: dbUrlConfig?.database || 
      process.env.DB_NAME || 
      (isTiDB ? "fortune500" : "db"),
  
  PORT: dbUrlConfig?.port || 
        parseInt(process.env.DB_PORT) || 
        (isTiDB ? 4000 : 3306),
  
  dialect: "mysql",

  // 2. SSL CONFIGURATION - Only for TiDB/Production, not for local MySQL
  dialectOptions: isTiDB ? {
    ssl: {
      require: true,
      rejectUnauthorized: true,
      ciphers: 'AES256-SHA256', // Updated to more secure cipher
      minVersion: 'TLSv1.2'
    },
    // Additional TiDB optimizations
    connectTimeout: 60000,
    typeCast: function (field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1';
      }
      return next();
    }
  } : { 
    ssl: false,  // Important: NO SSL for local MySQL
    // Local development optimizations
    connectTimeout: 10000,
    decimalNumbers: true
  },

  // 3. CONNECTION POOL (optimized for production vs development)
  pool: isProduction ? { 
    max: 15,     // Smaller pool for TiDB (they recommend 10-20)
    min: 2,      // Keep some connections ready
    acquire: 60000, 
    idle: 30000, // Shorter idle for production
    evict: 10000 // Remove idle connections faster
  } : { 
    max: 5,      // Small pool for development
    min: 0, 
    acquire: 30000, 
    idle: 10000 
  },
  
  // 4. LOGGING - Verbose in dev, minimal in production
  logging: process.env.DB_LOGGING === 'true' 
    ? console.log 
    : (isProduction ? false : (query, timing) => {
        if (timing && timing > 1000) {
          console.log(`🐌 Slow query (${timing}ms):`, query);
        }
      }),

  // 5. SEQUELIZE OPTIONS
  define: {
    timestamps: true,     // Adds createdAt, updatedAt
    underscored: true,    // snake_case column names
    freezeTableName: true, // Don't pluralize table names
    paranoid: false,      // No soft deletes by default
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },

  // 6. TIMEZONE & SYNC SETTINGS
  timezone: '+00:00', // UTC for production
  sync: {
    force: process.env.DB_SYNC_FORCE === 'true', // NEVER true in production!
    alter: process.env.DB_SYNC_ALTER === 'true'  // Use with caution
  },

  // 7. RETRY CONFIGURATION (for production resilience)
  retry: {
    max: isProduction ? 3 : 1,
    match: [
      /ETIMEDOUT/,
      /ECONNREFUSED/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/
    ],
    backoffBase: 100,
    backoffExponent: 1.1
  },

  // 8. BENCHMARKING (development only)
  benchmark: !isProduction,

  // 9. ADDITIONAL MYSQL2 OPTIONS
  ...(isTiDB ? {
    // TiDB-specific optimizations
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
    trace: false
  } : {})
};

// Export helper functions
export const getConnectionString = () => {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || "db",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root"
  };
  
  return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
};

export const isConnected = async (sequelize) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Auto-log the config (without passwords in production)
if (!isProduction) {
  console.log('📋 Database Configuration:');
  console.log(`   Host: ${dbUrlConfig?.host || process.env.DB_HOST || (isTiDB ? "gateway01.eu-central-1.prod.aws.tidbcloud.com" : "localhost")}`);
  console.log(`   Database: ${dbUrlConfig?.database || process.env.DB_NAME || (isTiDB ? "fortune500" : "db")}`);
  console.log(`   Port: ${dbUrlConfig?.port || process.env.DB_PORT || (isTiDB ? 4000 : 3306)}`);
  console.log(`   SSL: ${isTiDB ? 'Enabled' : 'Disabled'}`);
  console.log(`   Pool: max=${isProduction ? 15 : 5}, min=${isProduction ? 2 : 0}`);
}