const logger = require('../utils/logger')

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message, err.stack)

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'A record with this value already exists',
      field: err.meta?.target,
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  // Default error
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}

const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
}

module.exports = { errorMiddleware, notFoundMiddleware }