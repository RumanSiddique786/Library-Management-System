const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../config/database')

// Generate Access Token
const generateAccessToken = (userId, roleId) => {
  return jwt.sign(
    { userId, roleId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

// Login
const login = async (email, password) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' }
  }

  if (user.status !== 'ACTIVE') {
    throw { statusCode: 401, message: 'Account is suspended or inactive' }
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' }
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.roleId)
  const refreshToken = generateRefreshToken(user.id)

  // Save refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLogin: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      description: `User ${user.email} logged in`,
    },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      status: user.status,
    },
  }
}

// Refresh Token
const refreshToken = async (token) => {
  if (!token) {
    throw { statusCode: 401, message: 'Refresh token is required' }
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  })

  if (!user || user.refreshToken !== token) {
    throw { statusCode: 401, message: 'Invalid refresh token' }
  }

  const accessToken = generateAccessToken(user.id, user.roleId)
  const newRefreshToken = generateRefreshToken(user.id)

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  })

  return { accessToken, refreshToken: newRefreshToken }
}

// Logout
const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LOGOUT',
      module: 'AUTH',
      description: `User logged out`,
    },
  })
}

// Forgot Password
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    // Don't reveal if email exists
    return { message: 'If this email exists, a reset link has been sent' }
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: `reset_${resetToken}_${resetTokenExpiry.getTime()}`,
    },
  })

  // TODO: Send email with reset link
  const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`
  console.log('Reset Link:', resetLink) // Remove in production

  return {
    message: 'If this email exists, a reset link has been sent',
    resetToken, // Remove in production
  }
}

// Reset Password
const resetPassword = async (token, newPassword) => {
  const users = await prisma.user.findMany({
    where: {
      refreshToken: {
        startsWith: `reset_${token}_`,
      },
    },
  })

  if (!users.length) {
    throw { statusCode: 400, message: 'Invalid or expired reset token' }
  }

  const user = users[0]
  const parts = user.refreshToken.split('_')
  const expiry = parseInt(parts[parts.length - 1])

  if (Date.now() > expiry) {
    throw { statusCode: 400, message: 'Reset token has expired' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      refreshToken: null,
    },
  })

  return { message: 'Password reset successfully' }
}

// Change Password
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isPasswordValid) {
    throw { statusCode: 400, message: 'Current password is incorrect' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      description: 'User changed password',
    },
  })

  return { message: 'Password changed successfully' }
}

module.exports = {
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
}