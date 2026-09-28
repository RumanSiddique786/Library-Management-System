const bcrypt = require('bcryptjs')
const prisma = require('../config/database')

const getAllUsers = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      role ? { role: { name: role } } : {},
      status ? { status } : {},
    ],
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        role: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total }
}

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      address: true,
      status: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: { id: true, name: true },
      },
    },
  })

  if (!user) {
    throw { statusCode: 404, message: 'User not found' }
  }

  return user
}

const createUser = async (data, createdBy) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw { statusCode: 400, message: 'Email already exists' }
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      mobile: data.mobile,
      address: data.address,
      roleId: parseInt(data.roleId),
      status: data.status || 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      status: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'USERS',
      description: `Created user ${user.email}`,
    },
  })

  return user
}

const updateUser = async (id, data, updatedBy) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  })

  if (!user) {
    throw { statusCode: 404, message: 'User not found' }
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already exists' }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      roleId: data.roleId ? parseInt(data.roleId) : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      status: true,
      updatedAt: true,
      role: { select: { id: true, name: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'USERS',
      description: `Updated user ${updatedUser.email}`,
    },
  })

  return updatedUser
}

const deleteUser = async (id, deletedBy) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  })

  if (!user) {
    throw { statusCode: 404, message: 'User not found' }
  }

  if (user.id === deletedBy) {
    throw { statusCode: 400, message: 'You cannot delete your own account' }
  }

  await prisma.user.delete({
    where: { id: parseInt(id) },
  })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'USERS',
      description: `Deleted user ${user.email}`,
    },
  })

  return { message: 'User deleted successfully' }
}

const updateUserStatus = async (id, status, updatedBy) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  })

  if (!user) {
    throw { statusCode: 404, message: 'User not found' }
  }

  if (user.id === updatedBy) {
    throw { statusCode: 400, message: 'You cannot change your own status' }
  }

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'USERS',
      description: `Updated user ${user.email} status to ${status}`,
    },
  })

  return updatedUser
}

const getAllRoles = async () => {
  return await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  })
}

const getActivityLogs = async (id, query) => {
  const { page = 1, limit = 10 } = query
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId: parseInt(id) },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({
      where: { userId: parseInt(id) },
    }),
  ])

  return { logs, total }
}

const resetUserPassword = async (id, newPassword, resetBy) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) }
  })

  if (!user) {
    throw { statusCode: 404, message: 'User not found' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword }
  })

  await prisma.auditLog.create({
    data: {
      userId: resetBy,
      action: 'UPDATE',
      module: 'USERS',
      description: `Admin reset password for user: ${user.email}`
    }
  })

  return { message: 'Password reset successfully' }
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