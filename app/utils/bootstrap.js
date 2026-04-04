// app/utils/bootstrap.js
import bcrypt from 'bcrypt';
import { User, Role, sequelize } from '../models/index.js';
import authConfig from '../config/auth.config.js';

// Seed all default roles
export const seedDefaultRoles = async () => {
  try {
    console.log('🌱 Seeding default roles...');
    
    const rolesData = [
      // ============================================
      // Level 2 - Guest Role
      // ============================================
      { name: 'Guest', scope: 'guest' },
      
      // ============================================
      // Level 3 - Corporate Roles (Cross-BU Governance)
      // ============================================
      { name: 'Corporate PMO Officer', scope: 'corporate' },
      { name: 'Corporate PMO Analyst', scope: 'corporate' },
      { name: 'Corporate PMO Auditor', scope: 'corporate' },
      { name: 'Executive', scope: 'corporate' },
      
      // ============================================
      // Level 4 - BU Roles (Business Unit Level)
      // ============================================
      { name: 'BU Manager', scope: 'bu' },
      { name: 'BU Admin', scope: 'bu' },
      { name: 'Director', scope: 'bu' },
      
      // ============================================
      // Level 5 - Project Roles (Project Level)
      // ============================================
      { name: 'Project Manager', scope: 'project' },
      { name: 'Deputy Project Manager', scope: 'project' },
      { name: 'Planning Engineer', scope: 'project' },
      { name: 'Cost Engineer', scope: 'project' },
      { name: 'Document Controller', scope: 'project' },
      { name: 'QA/QC Engineer', scope: 'project' },
      { name: 'HSE Officer', scope: 'project' },
      { name: 'Engineer', scope: 'project' },
      { name: 'Viewer', scope: 'project' }
    ];
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const roleData of rolesData) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      
      if (created) {
        console.log(`   ✅ Created role: ${roleData.name} (${roleData.scope})`);
        createdCount++;
      } else {
        existingCount++;
      }
    }
    
    console.log(`📊 Roles summary: ${createdCount} created, ${existingCount} existing`);
    
  } catch (error) {
    console.error('❌ Error seeding default roles:', error);
    throw error;
  }
};

// Bootstrap super admin user
export const bootstrapSuperAdmin = async () => {
  try {
    const superAdminCount = await User.count({
      where: { is_super_admin: true }
    });
    
    if (superAdminCount === 0) {
      console.log('🔧 No super admin found. Creating default super admin...');
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@pmsimplex.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
      const adminName = process.env.ADMIN_NAME || 'System';
      const adminFamilyName = process.env.ADMIN_FAMILY_NAME || 'Administrator';
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      
      const hashedPassword = await bcrypt.hash(adminPassword, authConfig.bcryptRounds);
      
      const admin = await User.create({
        username: adminUsername,
        email: adminEmail.toLowerCase(),
        password_hash: hashedPassword,
        name: adminName,
        family_name: adminFamilyName,
        job_title: 'System Administrator',
        department: 'IT',
        is_active: true,
        is_super_admin: true
      });
      
      console.log('✅ Super admin created successfully!');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}`);
      console.log('   ⚠️  Please change the default password after first login!');
      
      return admin;
    } else {
      console.log('✅ Super admin(s) already exist. Skipping bootstrap.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error bootstrapping super admin:', error);
    throw error;
  }
};

// Optional: Seed a test guest user (for development only)
export const seedTestGuest = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('🧪 Seeding test guest user (development only)...');
      
      const guestRole = await Role.findOne({ where: { name: 'Guest' } });
      
      if (!guestRole) {
        console.log('⚠️ Guest role not found, skipping test guest creation');
        return;
      }
      
      const existingGuest = await User.findOne({ where: { email: 'guest@example.com' } });
      
      if (!existingGuest) {
        const hashedPassword = await bcrypt.hash('Guest123!', authConfig.bcryptRounds);
        
        await User.create({
          username: 'guest_test',
          email: 'guest@example.com',
          password_hash: hashedPassword,
          name: 'Test',
          family_name: 'Guest',
          job_title: 'Guest User',
          department: 'External',
          is_active: true,
          is_guest: true,
          default_role_id: guestRole.id
        });
        
        console.log('   ✅ Test guest user created: guest@example.com / Guest123!');
        console.log('   ⏰ Guest access will expire 24 hours after first login');
      } else {
        console.log('   ℹ️ Test guest user already exists');
      }
      
    } catch (error) {
      console.error('❌ Error seeding test guest:', error);
    }
  }
};

// Optional: Seed a test corporate user (for development only)
export const seedTestCorporateUser = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('🧪 Seeding test corporate user (development only)...');
      
      const corporateRole = await Role.findOne({ where: { name: 'Corporate PMO Officer' } });
      
      if (!corporateRole) {
        console.log('⚠️ Corporate role not found, skipping test corporate user creation');
        return;
      }
      
      const existingUser = await User.findOne({ where: { email: 'corporate@example.com' } });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('Corporate123!', authConfig.bcryptRounds);
        
        await User.create({
          username: 'corporate_pmo',
          email: 'corporate@example.com',
          password_hash: hashedPassword,
          name: 'Corporate',
          family_name: 'PMO',
          job_title: 'Corporate PMO Officer',
          department: 'PMO',
          is_active: true,
          is_super_admin: false,
          is_guest: false,
          corporate_role_id: corporateRole.id
        });
        
        console.log('   ✅ Test corporate user created: corporate@example.com / Corporate123!');
      } else {
        console.log('   ℹ️ Test corporate user already exists');
      }
      
    } catch (error) {
      console.error('❌ Error seeding test corporate user:', error);
    }
  }
};

// Optional: Seed a test BU Manager (for development only)
export const seedTestBUManager = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('🧪 Seeding test BU Manager (development only)...');
      
      const buManagerRole = await Role.findOne({ where: { name: 'BU Manager' } });
      
      if (!buManagerRole) {
        console.log('⚠️ BU Manager role not found, skipping test BU Manager creation');
        return;
      }
      
      const existingUser = await User.findOne({ where: { email: 'bumanager@example.com' } });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('BUManager123!', authConfig.bcryptRounds);
        
        await User.create({
          username: 'bu_manager',
          email: 'bumanager@example.com',
          password_hash: hashedPassword,
          name: 'BU',
          family_name: 'Manager',
          job_title: 'Business Unit Manager',
          department: 'Management',
          is_active: true,
          is_super_admin: false,
          is_guest: false
        });
        
        console.log('   ✅ Test BU Manager user created: bumanager@example.com / BUManager123!');
      } else {
        console.log('   ℹ️ Test BU Manager user already exists');
      }
      
    } catch (error) {
      console.error('❌ Error seeding test BU Manager:', error);
    }
  }
};

// Optional: Seed a test Project Manager (for development only)
export const seedTestProjectManager = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('🧪 Seeding test Project Manager (development only)...');
      
      const pmRole = await Role.findOne({ where: { name: 'Project Manager' } });
      
      if (!pmRole) {
        console.log('⚠️ Project Manager role not found, skipping test PM creation');
        return;
      }
      
      const existingUser = await User.findOne({ where: { email: 'pm@example.com' } });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('ProjectManager123!', authConfig.bcryptRounds);
        
        await User.create({
          username: 'project_manager',
          email: 'pm@example.com',
          password_hash: hashedPassword,
          name: 'Project',
          family_name: 'Manager',
          job_title: 'Project Manager',
          department: 'Project Management',
          is_active: true,
          is_super_admin: false,
          is_guest: false
        });
        
        console.log('   ✅ Test Project Manager user created: pm@example.com / ProjectManager123!');
      } else {
        console.log('   ℹ️ Test Project Manager user already exists');
      }
      
    } catch (error) {
      console.error('❌ Error seeding test Project Manager:', error);
    }
  }
};

// Main bootstrap function
export const bootstrap = async () => {
  console.log('\n🚀 Running bootstrap process...\n');
  
  // 1. Seed default roles
  await seedDefaultRoles();
  
  // 2. Bootstrap super admin
  await bootstrapSuperAdmin();
  
  // 3. Seed test users (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n🧪 Seeding test users for development...\n');
    await seedTestGuest();
    await seedTestCorporateUser();
    await seedTestBUManager();
    await seedTestProjectManager();
  }
  
  console.log('\n✅ Bootstrap completed successfully!\n');
};

// For backward compatibility
export default {
  seedDefaultRoles,
  bootstrapSuperAdmin,
  seedTestGuest,
  seedTestCorporateUser,
  seedTestBUManager,
  seedTestProjectManager,
  bootstrap
};