const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboard.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const adminRoles = ['SUPER_ADMIN', 'LIBRARIAN']

router.get('/stats', authorize(...adminRoles), dashboardController.getDashboardStats)
router.get('/charts/transactions', authorize(...adminRoles), dashboardController.getMonthlyTransactionChart)
router.get('/charts/fines', authorize(...adminRoles), dashboardController.getMonthlyFineChart)
router.get('/charts/categories', authorize(...adminRoles), dashboardController.getCategoryDistribution)
router.get('/charts/availability', authorize(...adminRoles), dashboardController.getBookAvailabilityChart)
router.get('/popular-books', authorize(...adminRoles), dashboardController.getPopularBooks)
router.get('/recent-activities', authorize(...adminRoles), dashboardController.getRecentActivities)

module.exports = router