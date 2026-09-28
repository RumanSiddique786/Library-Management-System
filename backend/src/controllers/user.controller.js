const { validationResult } = require('express-validator')
const userService = require('../services/user.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')

const getAllUsers = async (req, res, next) => {
  try {
    const { users, total } = await userService.getAllUsers(req.query)
    return sendPaginated(res, users, total, req.query.page || 1, req.query.limit || 10)
  } catch (error) {
    next(error)
  }
}

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id)
    return sendSuccess(res, user, 'User fetched successfully')
  } catch (error) {
    next(error)
  }
}

const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }
    const user = await userService.createUser(req.body, req.user.id)
    return sendSuccess(res, user, 'User created successfully', 201)
  } catch (error) {
    next(error)
  }
}

const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }
    const user = await userService.updateUser(req.params.id, req.body, req.user.id)
    return sendSuccess(res, user, 'User updated successfully')
  } catch (error) {
    next(error)
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user.id)
    return sendSuccess(res, result, 'User deleted successfully')
  } catch (error) {
    next(error)
  }
}

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return sendError(res, 'Invalid status', 400)
    }
    const user = await userService.updateUserStatus(req.params.id, status, req.user.id)
    return sendSuccess(res, user, 'User status updated successfully')
  } catch (error) {
    next(error)
  }
}

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await userService.getAllRoles()
    return sendSuccess(res, roles, 'Roles fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getActivityLogs = async (req, res, next) => {
  try {
    const { logs, total } = await userService.getActivityLogs(req.params.id, req.query)
    return sendPaginated(res, logs, total, req.query.page || 1, req.query.limit || 10)
  } catch (error) {
    next(error)
  }
}

const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400)
    }
    const result = await userService.resetUserPassword(
      req.params.id, newPassword, req.user.id
    )
    return sendSuccess(res, result, 'Password reset successfully')
  } catch (error) { next(error) }
}


module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getAllRoles,
  getActivityLogs,
  resetUserPassword,
}