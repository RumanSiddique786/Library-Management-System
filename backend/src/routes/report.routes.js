const express = require('express')
const router = express.Router()
const reportController = require('../controllers/report.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const adminRoles = ['SUPER_ADMIN', 'LIBRARIAN']

router.get('/books', authorize(...adminRoles), reportController.getBookReport)
router.get('/members', authorize(...adminRoles), reportController.getMemberReport)
router.get('/transactions', authorize(...adminRoles), reportController.getTransactionReport)
router.get('/fines', authorize(...adminRoles), reportController.getFineReport)
router.get('/inventory', authorize(...adminRoles), reportController.getInventoryReport)
router.get('/reservations', authorize(...adminRoles), reportController.getReservationReport)

module.exports = router