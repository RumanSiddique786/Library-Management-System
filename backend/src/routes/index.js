const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth.routes'))
router.use('/users', require('./user.routes'))
router.use('/members', require('./member.routes'))
router.use('/books', require('./book.routes'))
router.use('/transactions', require('./transaction.routes'))
router.use('/fines', require('./fine.routes'))
router.use('/reservations', require('./reservation.routes'))
router.use('/dashboard', require('./dashboard.routes'))
router.use('/reports', require('./report.routes'))
router.use('/settings', require('./settings.routes'))
router.use('/notifications', require('./notification.routes'))

module.exports = router