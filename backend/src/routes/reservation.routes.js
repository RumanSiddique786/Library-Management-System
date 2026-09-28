const express = require('express')
const router = express.Router()
const reservationController = require('../controllers/reservation.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const librarianRoles = ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']

router.get('/stats', authorize('SUPER_ADMIN', 'LIBRARIAN'), reservationController.getReservationStats)
router.get('/', authorize(...librarianRoles), reservationController.getAllReservations)
router.get('/:id', authorize(...librarianRoles), reservationController.getReservationById)
router.post('/', reservationController.createReservation)
router.delete('/:id', reservationController.cancelReservation)
router.post('/:id/collect', authorize(...librarianRoles), reservationController.collectReservation)

module.exports = router