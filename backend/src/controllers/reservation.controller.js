const reservationService = require('../services/reservation.service')
const { sendSuccess, sendPaginated } = require('../utils/response')

const getAllReservations = async (req, res, next) => {
  try {
    const { reservations, total } = await reservationService.getAllReservations(req.query)
    return sendPaginated(
      res, reservations, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) { next(error) }
}

const getReservationById = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id)
    return sendSuccess(res, reservation, 'Reservation fetched successfully')
  } catch (error) { next(error) }
}

const createReservation = async (req, res, next) => {
  try {
    const { bookId } = req.body
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'bookId is required' })
    }
    const reservation = await reservationService.createReservation(
      req.body,
      req.user.id
    )
    return sendSuccess(res, reservation, 'Book reserved successfully', 201)
  } catch (error) { next(error) }
}

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.cancelReservation(
      req.params.id,
      req.user.id,
      req.user.role.name
    )
    return sendSuccess(res, reservation, 'Reservation cancelled successfully')
  } catch (error) { next(error) }
}

const collectReservation = async (req, res, next) => {
  try {
    const result = await reservationService.collectReservation(
      req.params.id,
      req.user.id
    )
    return sendSuccess(res, result, 'Book collected successfully')
  } catch (error) { next(error) }
}

const getReservationStats = async (req, res, next) => {
  try {
    const stats = await reservationService.getReservationStats()
    return sendSuccess(res, stats, 'Reservation stats fetched successfully')
  } catch (error) { next(error) }
}

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  cancelReservation,
  collectReservation,
  getReservationStats,
}