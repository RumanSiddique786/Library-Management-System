const jwt = require('jsonwebtoken')
const prisma = require('../config/database')
const { sendError } = require('../utils/response')

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    })

    if (!user) {
      return sendError(res, 'User not found', 401)
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Account is suspended or inactive', 401)
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role.name)) {
      return sendError(res, 'Access denied. Insufficient permissions', 403)
    }
    next()
  }
}

module.exports = { authenticate, authorize }