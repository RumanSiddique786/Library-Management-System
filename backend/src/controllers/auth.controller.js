const { validationResult } = require('express-validator')
const authService = require('../services/auth.service')
const { sendSuccess, sendError } = require('../utils/response')

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }

    const { email, password } = req.body
    const result = await authService.login(email, password)
    return sendSuccess(res, result, 'Login successful')
  } catch (error) {
    next(error)
  }
}

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    const result = await authService.refreshToken(refreshToken)
    return sendSuccess(res, result, 'Token refreshed successfully')
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id)
    return sendSuccess(res, null, 'Logged out successfully')
  } catch (error) {
    next(error)
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }

    const { email } = req.body
    const result = await authService.forgotPassword(email)
    return sendSuccess(res, result, result.message)
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }

    const { token, password } = req.body
    const result = await authService.resetPassword(token, password)
    return sendSuccess(res, result, result.message)
  } catch (error) {
    next(error)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }

    const { currentPassword, newPassword } = req.body
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    )
    return sendSuccess(res, result, result.message)
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role.name,
      status: req.user.status,
      lastLogin: req.user.lastLogin,
    }, 'User profile fetched')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
}