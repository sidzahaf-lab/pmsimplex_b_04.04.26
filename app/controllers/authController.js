// app/controllers/authController.js
import authService from '../services/authService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const result = await authService.login(email, password);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
};

// Refresh token endpoint
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters'
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Logout from all devices
export const logoutAll = async (req, res) => {
  try {
    await authService.revokeAllUserTokens(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};