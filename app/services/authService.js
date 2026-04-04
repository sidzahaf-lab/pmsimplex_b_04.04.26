// app/services/authService.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Session, sequelize } from '../models/index.js';
import authConfig from '../config/auth.config.js';
import { Op } from 'sequelize';

class AuthService {
  // Generate JWT tokens
  generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        username: user.username,
        is_super_admin: user.is_super_admin,
        is_guest: user.is_guest
      },
      authConfig.secret,
      { expiresIn: authConfig.jwtExpiration }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      authConfig.refreshSecret,
      { expiresIn: authConfig.jwtRefreshExpiration }
    );

    return { accessToken, refreshToken };
  }

  // Store refresh token in database
  async storeRefreshToken(userId, refreshToken) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + authConfig.jwtRefreshExpiration);

    await Session.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      revoked: false
    });
  }

  // Verify refresh token
  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.refreshSecret);
      
      if (!decoded || !decoded.id) {
        throw new Error('Invalid refresh token structure');
      }

      const session = await Session.findOne({
        where: {
          refresh_token: refreshToken,
          user_id: decoded.id,
          revoked: false,
          expires_at: { [Op.gt]: new Date() }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'is_super_admin', 'is_active', 'is_guest']
        }]
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      if (!session.user || !session.user.is_active) {
        throw new Error('User account is deactivated');
      }

      return session;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired. Please log in again.');
      }
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    const session = await this.verifyRefreshToken(refreshToken);
    
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(session.user);
    
    await this.revokeRefreshToken(refreshToken);
    await this.storeRefreshToken(session.user.id, newRefreshToken);
    
    return { 
      accessToken, 
      refreshToken: newRefreshToken,
      expiresIn: authConfig.jwtExpiration
    };
  }

  // Revoke refresh token (logout)
  async revokeRefreshToken(refreshToken) {
    await Session.update(
      { revoked: true },
      { where: { refresh_token: refreshToken } }
    );
  }

  // Revoke all refresh tokens for a user
  async revokeAllUserTokens(userId) {
    await Session.update(
      { revoked: true },
      { where: { user_id: userId } }
    );
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    const result = await Session.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() }
      }
    });
    console.log(`🧹 Cleaned up ${result} expired sessions`);
    return result;
  }

  // Login user
  async login(email, password) {
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.storeRefreshToken(user.id, refreshToken);

    const { password_hash, ...userWithoutPassword } = user.toJSON();

    // ✅ UNIQUEMENT CETTE PARTIE AJOUTÉE : récupérer le nom du rôle corporate
    let corporateRoleName = null;
    try {
      const { Role } = await import('../models/index.js');
      if (userWithoutPassword.corporate_role_id) {
        const corporateRole = await Role.findByPk(userWithoutPassword.corporate_role_id);
        if (corporateRole) {
          corporateRoleName = corporateRole.name;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch corporate role:', error.message);
    }

    return {
      user: {
        ...userWithoutPassword,
        corporate_role: corporateRoleName
      },
      accessToken,
      refreshToken,
      expiresIn: authConfig.jwtExpiration
    };
  }

  // Get current user
  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);
    
    await user.update({
      password_hash: hashedPassword,
      last_modified_at: new Date()
    });

    await this.revokeAllUserTokens(userId);

    return true;
  }
}

export default new AuthService();