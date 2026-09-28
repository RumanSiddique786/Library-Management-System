const dashboardService = require('../services/dashboard.service')
const { sendSuccess } = require('../utils/response')

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats()
    return sendSuccess(res, stats, 'Dashboard stats fetched successfully')
  } catch (error) { next(error) }
}

const getMonthlyTransactionChart = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyTransactionChart()
    return sendSuccess(res, data, 'Monthly transaction chart fetched')
  } catch (error) { next(error) }
}

const getMonthlyFineChart = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyFineChart()
    return sendSuccess(res, data, 'Monthly fine chart fetched')
  } catch (error) { next(error) }
}

const getCategoryDistribution = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryDistribution()
    return sendSuccess(res, data, 'Category distribution fetched')
  } catch (error) { next(error) }
}

const getPopularBooks = async (req, res, next) => {
  try {
    const data = await dashboardService.getPopularBooks()
    return sendSuccess(res, data, 'Popular books fetched')
  } catch (error) { next(error) }
}

const getRecentActivities = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivities()
    return sendSuccess(res, data, 'Recent activities fetched')
  } catch (error) { next(error) }
}

const getBookAvailabilityChart = async (req, res, next) => {
  try {
    const data = await dashboardService.getBookAvailabilityChart()
    return sendSuccess(res, data, 'Book availability chart fetched')
  } catch (error) { next(error) }
}

module.exports = {
  getDashboardStats,
  getMonthlyTransactionChart,
  getMonthlyFineChart,
  getCategoryDistribution,
  getPopularBooks,
  getRecentActivities,
  getBookAvailabilityChart,
}