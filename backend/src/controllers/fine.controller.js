const fineService = require('../services/fine.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')

const getAllFines = async (req, res, next) => {
  try {
    const { fines, total } = await fineService.getAllFines(req.query)
    return sendPaginated(
      res, fines, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) {
    next(error)
  }
}

const getFineById = async (req, res, next) => {
  try {
    const fine = await fineService.getFineById(req.params.id)
    return sendSuccess(res, fine, 'Fine fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getMemberFines = async (req, res, next) => {
  try {
    const { fines, total } = await fineService.getMemberFines(
      req.params.memberId,
      req.query
    )
    return sendPaginated(
      res, fines, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) {
    next(error)
  }
}

const payFine = async (req, res, next) => {
  try {
    const { amount, paymentMode } = req.body

    if (!amount) {
      return sendError(res, 'Payment amount is required', 400)
    }

    if (!['CASH', 'CARD', 'UPI', 'ONLINE'].includes(paymentMode)) {
      return sendError(res, 'Invalid payment mode', 400)
    }

    const result = await fineService.payFine(
      req.params.id,
      req.body,
      req.user.id
    )
    return sendSuccess(res, result, result.message)
  } catch (error) {
    next(error)
  }
}

const waiveFine = async (req, res, next) => {
  try {
    const fine = await fineService.waiveFine(
      req.params.id,
      req.body.reason,
      req.user.id
    )
    return sendSuccess(res, fine, 'Fine waived successfully')
  } catch (error) {
    next(error)
  }
}

const getFineStats = async (req, res, next) => {
  try {
    const stats = await fineService.getFineStats()
    return sendSuccess(res, stats, 'Fine stats fetched successfully')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllFines,
  getFineById,
  getMemberFines,
  payFine,
  waiveFine,
  getFineStats,
}