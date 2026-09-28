const reportService = require('../services/report.service')
const { sendSuccess } = require('../utils/response')

const getBookReport = async (req, res, next) => {
  try {
    const result = await reportService.getBookReport(req.query)
    return sendSuccess(res, result, 'Book report fetched successfully')
  } catch (error) { next(error) }
}

const getMemberReport = async (req, res, next) => {
  try {
    const result = await reportService.getMemberReport(req.query)
    return sendSuccess(res, result, 'Member report fetched successfully')
  } catch (error) { next(error) }
}

const getTransactionReport = async (req, res, next) => {
  try {
    const result = await reportService.getTransactionReport(req.query)
    return sendSuccess(res, result, 'Transaction report fetched successfully')
  } catch (error) { next(error) }
}

const getFineReport = async (req, res, next) => {
  try {
    const result = await reportService.getFineReport(req.query)
    return sendSuccess(res, result, 'Fine report fetched successfully')
  } catch (error) { next(error) }
}

const getInventoryReport = async (req, res, next) => {
  try {
    const result = await reportService.getInventoryReport()
    return sendSuccess(res, result, 'Inventory report fetched successfully')
  } catch (error) { next(error) }
}

const getReservationReport = async (req, res, next) => {
  try {
    const result = await reportService.getReservationReport(req.query)
    return sendSuccess(res, result, 'Reservation report fetched successfully')
  } catch (error) { next(error) }
}

module.exports = {
  getBookReport,
  getMemberReport,
  getTransactionReport,
  getFineReport,
  getInventoryReport,
  getReservationReport,
}