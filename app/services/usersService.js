// app/services/usersService.js
import { User, BusinessUnit, Session, Role, Team, sequelize } from '../models/index.js';
import AppError from '../utils/appError.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class UserService {
  // Get all users with optional filtering and pagination
  async getAllUsers(filters = {}, businessUnitFilter = null, isSuperAdmin = false) {
    const {
      business_unit_id,
      is_active,
      department,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const whereClause = {};
    
    // Si l'utilisateur n'est pas super admin, filtrer par sa BU
    if (businessUnitFilter) {
      whereClause.business_unit_id = businessUnitFilter;
    } else if (business_unit_id) {
      whereClause.business_unit_id = business_unit_id;
    }
    
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    if (department) whereClause.department = department;

    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      users: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Check username availability
  async checkUsernameAvailability(username) {
    if (!username || username.length < 3 || username.length > 50) {
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return false;
    }

    const existingUser = await User.findOne({
      where: {
        username: username.trim()
      }
    });

    return !existingUser;
  }

  // Check email availability
  async checkEmailAvailability(email) {
    if (!email || email.length > 100) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    const existingUser = await User.findOne({
      where: {
        email: email.trim().toLowerCase()
      }
    });

    return !existingUser;
  }

  // Get user by ID (avec tous les includes)
  async getUserById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Session,
          as: 'sessions',
          attributes: ['id', 'expires_at', 'created_at', 'revoked'],
          where: { revoked: false },
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Team,
          as: 'team_assignments',
          where: { is_active: true, project_id: null },
          required: false,
          include: [{
            model: Role,
            as: 'role',
            attributes: ['name', 'scope']
          }]
        }
      ]
    });
  }

  // Get user by email (includes password hash for authentication)
  async getUserByEmailWithPassword(email) {
    return await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Team,
          as: 'team_assignments',
          where: { is_active: true },
          required: false,
          include: [{
            model: Role,
            as: 'role',
            attributes: ['name', 'scope']
          }]
        }
      ]
    });
  }

  // Get user by username (includes password hash for authentication)
  async getUserByUsernameWithPassword(username) {
    return await User.findOne({
      where: { username: username.trim() },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Team,
          as: 'team_assignments',
          where: { is_active: true },
          required: false,
          include: [{
            model: Role,
            as: 'role',
            attributes: ['name', 'scope']
          }]
        }
      ]
    });
  }

  // Get user by email (without password)
  async getUserByEmail(email) {
    return await User.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ]
    });
  }

  // Get user by username (without password)
  async getUserByUsername(username) {
    return await User.findOne({
      where: { username: username.trim() },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ]
    });
  }

  // Create new user - WITH AUTOMATIC TEAM CREATION FOR BU ROLES
  async createUser(userData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Map frontend field names to backend model fields
      const mappedData = {
        username: userData.username,
        email: userData.email.toLowerCase().trim(),
        password_hash: userData.password || userData.password_hash,
        name: userData.name,
        family_name: userData.family_name,
        job_title: userData.title || userData.job_title,
        department: userData.specialty || userData.department,
        phone_number: userData.phone_number || userData.phonenumber,
        business_unit_id: userData.business_unit_id,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        is_super_admin: userData.is_super_admin || false,
        is_guest: userData.is_guest || false,
        corporate_role_id: userData.corporate_role_id || null,
        default_role_id: userData.default_role_id || null
      };

      // Check if business unit exists
      if (mappedData.business_unit_id) {
        const businessUnit = await BusinessUnit.findByPk(mappedData.business_unit_id, { transaction });
        if (!businessUnit) {
          throw new AppError('Business unit not found', 404);
        }
      }

      // Check if corporate role exists (if provided)
      if (mappedData.corporate_role_id) {
        const corporateRole = await Role.findByPk(mappedData.corporate_role_id, { transaction });
        if (!corporateRole) {
          throw new AppError('Corporate role not found', 404);
        }
        if (corporateRole.scope !== 'corporate') {
          throw new AppError('Invalid corporate role. Role must have scope "corporate".', 400);
        }
      }

      // Check if default role exists (if provided) - store for later
      let defaultRole = null;
      if (mappedData.default_role_id) {
        defaultRole = await Role.findByPk(mappedData.default_role_id, { transaction });
        if (!defaultRole) {
          throw new AppError('Default role not found', 404);
        }
      }

      // Check if username already exists
      const existingUsername = await User.findOne({
        where: { username: mappedData.username.trim() },
        transaction
      });
      
      if (existingUsername) {
        throw new AppError('Username already exists', 400);
      }

      // Check if email already exists
      const existingEmail = await User.findOne({
        where: { email: mappedData.email },
        transaction
      });
      
      if (existingEmail) {
        throw new AppError('Email already exists', 400);
      }

      // Hash password
      if (mappedData.password_hash) {
        mappedData.password_hash = await bcrypt.hash(mappedData.password_hash, 12);
      }

      // Create user
      const newUser = await User.create(mappedData, {
        fields: [
          'username', 'password_hash', 'email', 'phone_number',
          'name', 'family_name', 'job_title', 'department',
          'business_unit_id', 'is_active', 
          'is_super_admin', 'is_guest', 'corporate_role_id', 'default_role_id'
        ],
        transaction
      });

      // 🔥 CRITICAL: Create team entry for BU roles
      // Si le rôle par défaut est de scope 'bu', créer une entrée teams
      if (defaultRole && defaultRole.scope === 'bu' && mappedData.business_unit_id) {
        await Team.create({
          id: uuidv4(),
          user_id: newUser.id,
          business_unit_id: mappedData.business_unit_id,
          project_id: null,
          role_id: defaultRole.id,
          assigned_by: null,
          is_active: true,
          created_at: new Date(),
          last_modified_at: new Date()
        }, { transaction });
        
        console.log(`✅ Created BU team assignment for user ${newUser.username} with role ${defaultRole.name}`);
      }

      // ✅ AJOUT : Log pour les rôles corporate
      if (mappedData.corporate_role_id) {
        const corporateRole = await Role.findByPk(mappedData.corporate_role_id, { transaction });
        console.log(`✅ Created corporate user ${newUser.username} with role ${corporateRole?.name}`);
      }

      await transaction.commit();
      return await this.getUserById(newUser.id);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Update user
  async updateUser(id, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const userRecord = await User.findByPk(id, { transaction });
      if (!userRecord) {
        return null;
      }

      const mappedData = {};
      
      // Basic fields
      if (updateData.username !== undefined) mappedData.username = updateData.username.trim();
      if (updateData.email !== undefined) mappedData.email = updateData.email.toLowerCase().trim();
      if (updateData.password !== undefined || updateData.password_hash !== undefined) {
        mappedData.password_hash = updateData.password || updateData.password_hash;
      }
      if (updateData.name !== undefined) mappedData.name = updateData.name;
      if (updateData.family_name !== undefined) mappedData.family_name = updateData.family_name;
      if (updateData.title !== undefined) mappedData.job_title = updateData.title;
      if (updateData.job_title !== undefined) mappedData.job_title = updateData.job_title;
      if (updateData.specialty !== undefined) mappedData.department = updateData.specialty;
      if (updateData.department !== undefined) mappedData.department = updateData.department;
      if (updateData.phone_number !== undefined) mappedData.phone_number = updateData.phone_number;
      if (updateData.phonenumber !== undefined) mappedData.phone_number = updateData.phonenumber;
      if (updateData.business_unit_id !== undefined) mappedData.business_unit_id = updateData.business_unit_id;
      if (updateData.is_active !== undefined) mappedData.is_active = updateData.is_active;
      if (updateData.is_super_admin !== undefined) mappedData.is_super_admin = updateData.is_super_admin;
      if (updateData.is_guest !== undefined) mappedData.is_guest = updateData.is_guest;
      if (updateData.corporate_role_id !== undefined) mappedData.corporate_role_id = updateData.corporate_role_id;
      if (updateData.default_role_id !== undefined) mappedData.default_role_id = updateData.default_role_id;

      // Check username uniqueness
      if (mappedData.username && mappedData.username !== userRecord.username) {
        const existingUsername = await User.findOne({
          where: {
            username: mappedData.username,
            id: { [Op.ne]: id }
          },
          transaction
        });
        if (existingUsername) {
          throw new AppError('Username already exists', 400);
        }
      }

      // Check email uniqueness
      if (mappedData.email && mappedData.email !== userRecord.email) {
        const existingEmail = await User.findOne({
          where: {
            email: mappedData.email,
            id: { [Op.ne]: id }
          },
          transaction
        });
        if (existingEmail) {
          throw new AppError('Email already exists', 400);
        }
      }

      // Check if business unit exists
      if (mappedData.business_unit_id && mappedData.business_unit_id !== userRecord.business_unit_id) {
        const businessUnit = await BusinessUnit.findByPk(mappedData.business_unit_id, { transaction });
        if (!businessUnit) {
          throw new AppError('Business unit not found', 404);
        }
      }

      // Check if corporate role exists
      if (mappedData.corporate_role_id && mappedData.corporate_role_id !== userRecord.corporate_role_id) {
        const corporateRole = await Role.findByPk(mappedData.corporate_role_id, { transaction });
        if (!corporateRole) {
          throw new AppError('Corporate role not found', 404);
        }
        if (corporateRole.scope !== 'corporate') {
          throw new AppError('Invalid corporate role. Role must have scope "corporate".', 400);
        }
      }

      // Check if default role exists and handle team updates
      let defaultRole = null;
      if (mappedData.default_role_id && mappedData.default_role_id !== userRecord.default_role_id) {
        defaultRole = await Role.findByPk(mappedData.default_role_id, { transaction });
        if (!defaultRole) {
          throw new AppError('Default role not found', 404);
        }
      }

      // Hash password if provided
      if (mappedData.password_hash) {
        mappedData.password_hash = await bcrypt.hash(mappedData.password_hash, 12);
      }

      mappedData.last_modified_at = new Date();

      const updatableFields = Object.keys(mappedData).filter(field => 
        ['username', 'password_hash', 'email', 'phone_number',
         'name', 'family_name', 'job_title', 'department',
         'business_unit_id', 'is_active', 
         'is_super_admin', 'is_guest', 'corporate_role_id', 'default_role_id', 
         'last_modified_at'].includes(field)
      );

      await userRecord.update(mappedData, {
        fields: updatableFields,
        transaction
      });

      // Handle BU team assignment update
      if (defaultRole) {
        // Si le nouveau rôle est BU, créer/mettre à jour l'entrée teams
        if (defaultRole.scope === 'bu' && mappedData.business_unit_id) {
          const existingTeam = await Team.findOne({
            where: {
              user_id: id,
              project_id: null,
              is_active: true
            },
            transaction
          });

          if (existingTeam) {
            await existingTeam.update({
              business_unit_id: mappedData.business_unit_id,
              role_id: defaultRole.id,
              last_modified_at: new Date()
            }, { transaction });
            console.log(`✅ Updated BU team assignment for user ${userRecord.username}`);
          } else {
            await Team.create({
              id: uuidv4(),
              user_id: id,
              business_unit_id: mappedData.business_unit_id,
              project_id: null,
              role_id: defaultRole.id,
              assigned_by: null,
              is_active: true,
              created_at: new Date(),
              last_modified_at: new Date()
            }, { transaction });
            console.log(`✅ Created BU team assignment for user ${userRecord.username}`);
          }
        }
        // Si l'ancien rôle était BU et le nouveau ne l'est pas, désactiver l'entrée teams
        else if (userRecord.default_role_id) {
          const oldRole = await Role.findByPk(userRecord.default_role_id, { transaction });
          if (oldRole && oldRole.scope === 'bu') {
            await Team.update(
              { is_active: false, last_modified_at: new Date() },
              {
                where: {
                  user_id: id,
                  project_id: null,
                  is_active: true
                },
                transaction
              }
            );
            console.log(`🔒 Deactivated BU team assignment for user ${userRecord.username}`);
          }
        }
      }

      // If user is being deactivated, revoke all sessions
      if (mappedData.is_active === false && userRecord.is_active === true) {
        await Session.update(
          { revoked: true },
          { 
            where: { user_id: id },
            transaction 
          }
        );
        console.log(`🔒 Revoked all sessions for deactivated user ${id}`);
      }

      // If super admin status is being removed, revoke sessions
      if (mappedData.is_super_admin === false && userRecord.is_super_admin === true) {
        await Session.update(
          { revoked: true },
          { 
            where: { user_id: id },
            transaction 
          }
        );
        console.log(`🔒 Revoked all sessions for user ${id} after super admin removal`);
      }

      await transaction.commit();
      return await this.getUserById(id);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Delete user (hard delete)
  async deleteUser(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const userRecord = await User.findByPk(id, { transaction });
      if (!userRecord) {
        return null;
      }

      // Check for active sessions
      const activeSessions = await Session.count({
        where: {
          user_id: id,
          revoked: false,
          expires_at: { [Op.gt]: new Date() }
        },
        transaction
      });
      
      if (activeSessions > 0) {
        await Session.update(
          { revoked: true },
          { 
            where: { user_id: id },
            transaction 
          }
        );
        console.log(`🔒 Revoked ${activeSessions} sessions for user ${id} before deletion`);
      }

      // Delete team assignments
      await Team.destroy({
        where: { user_id: id },
        transaction
      });

      await userRecord.destroy({ transaction });
      await transaction.commit();
      return true;
      
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new AppError('Cannot delete user. Please ensure all sessions are revoked first.', 400);
      }
      throw error;
    }
  }

  // Get users by business unit ID
  async getUsersByBusinessUnit(businessUnitId, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: { business_unit_id: businessUnitId },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      users: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Toggle user active status
  async toggleUserStatus(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const userRecord = await User.findByPk(id, { transaction });
      if (!userRecord) {
        return null;
      }

      const newStatus = !userRecord.is_active;
      
      await userRecord.update({
        is_active: newStatus,
        last_modified_at: new Date()
      }, {
        fields: ['is_active', 'last_modified_at'],
        transaction
      });

      if (!newStatus) {
        await Session.update(
          { revoked: true },
          { 
            where: { user_id: id },
            transaction 
          }
        );
        console.log(`🔒 Revoked all sessions for deactivated user ${id}`);
      }

      await transaction.commit();
      return await this.getUserById(id);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Deactivate user (with session cleanup)
  async deactivateUser(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const userRecord = await User.findByPk(id, { transaction });
      if (!userRecord) {
        return null;
      }

      await userRecord.update({
        is_active: false,
        last_modified_at: new Date()
      }, {
        fields: ['is_active', 'last_modified_at'],
        transaction
      });

      const revokedCount = await Session.update(
        { revoked: true },
        { 
          where: { 
            user_id: id,
            revoked: false 
          },
          transaction 
        }
      );
      
      console.log(`🔒 Deactivated user ${id} and revoked ${revokedCount[0]} sessions`);

      await transaction.commit();
      return await this.getUserById(id);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Activate user
  async activateUser(id) {
    const userRecord = await User.findByPk(id);
    if (!userRecord) {
      return null;
    }

    await userRecord.update({
      is_active: true,
      last_modified_at: new Date()
    }, {
      fields: ['is_active', 'last_modified_at']
    });

    return await this.getUserById(id);
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Validate user belongs to business unit
  async validateUserBusinessUnit(userId, businessUnitId) {
    const userRecord = await User.findOne({
      where: {
        id: userId,
        business_unit_id: businessUnitId
      }
    });
    return !!userRecord;
  }

  // ✅ NOUVEAU : Get users by corporate role
  async getUsersByCorporateRole(corporateRoleId, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: { corporate_role_id: corporateRoleId },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ],
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      users: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Search users by name, username, or email
  async searchUsers(searchTerm, filters = {}) {
    const {
      business_unit_id,
      corporate_role_id,
      page = 1,
      limit = 10
    } = filters;

    const whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { family_name: { [Op.like]: `%${searchTerm}%` } },
        { username: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { job_title: { [Op.like]: `%${searchTerm}%` } },
        { department: { [Op.like]: `%${searchTerm}%` } }
      ]
    };

    if (business_unit_id) {
      whereClause.business_unit_id = business_unit_id;
    }
    
    if (corporate_role_id) {
      whereClause.corporate_role_id = corporate_role_id;
    }

    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: BusinessUnit,
          as: 'business_unit',
          attributes: ['id', 'name', 'description', 'is_active']
        },
        {
          model: Role,
          as: 'corporate_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        },
        {
          model: Role,
          as: 'default_role',
          attributes: ['id', 'name', 'scope'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      users: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get user statistics
  async getUserStatistics() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const superAdmins = await User.count({ where: { is_super_admin: true } });
    const guests = await User.count({ where: { is_guest: true } });
    const usersWithCorporateRole = await User.count({ where: { corporate_role_id: { [Op.ne]: null } } });
    const usersWithBU = await User.count({ where: { business_unit_id: { [Op.ne]: null } } });
    
    // ✅ AJOUT : Statistiques par rôle corporate
    const usersByCorporateRole = await User.findAll({
      attributes: [
        'corporate_role_id',
        [sequelize.fn('COUNT', sequelize.col('corporate_role_id')), 'count']
      ],
      where: { corporate_role_id: { [Op.ne]: null } },
      group: ['corporate_role_id'],
      include: [{
        model: Role,
        as: 'corporate_role',
        attributes: ['name']
      }]
    });

    const usersByBusinessUnit = await User.findAll({
      attributes: [
        'business_unit_id',
        [sequelize.fn('COUNT', sequelize.col('business_unit_id')), 'count']
      ],
      where: { business_unit_id: { [Op.ne]: null } },
      group: ['business_unit_id'],
      include: [{
        model: BusinessUnit,
        as: 'business_unit',
        attributes: ['name']
      }]
    });

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: totalUsers - activeUsers,
      super_admins: superAdmins,
      guests: guests,
      users_with_corporate_role: usersWithCorporateRole,
      users_with_business_unit: usersWithBU,
      users_without_business_unit: totalUsers - usersWithBU,
      users_by_business_unit: usersByBusinessUnit,
      users_by_corporate_role: usersByCorporateRole
    };
  }
}

export default new UserService();