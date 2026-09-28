const notificationService = require('../services/notification.service')
const { sendSuccess, sendPaginated } = require('../utils/response')

const getAllNotifications = async (req, res, next) => {
  try {
    const { notifications, total } = await notificationService.getAllNotifications(req.query)
    return sendPaginated(
      res, notifications, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) { next(error) }
}

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id)
    return sendSuccess(res, notification, 'Notification marked as read')
  } catch (error) { next(error) }
}

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.params.memberId)
    return sendSuccess(res, null, 'All notifications marked as read')
  } catch (error) { next(error) }
}

const sendDueReminders = async (req, res, next) => {
  try {
    const count = await notificationService.sendDueReminders()
    return sendSuccess(res, { count }, `Due reminders sent: ${count}`)
  } catch (error) { next(error) }
}

const sendOverdueNotifications = async (req, res, next) => {
  try {
    const count = await notificationService.sendOverdueNotifications()
    return sendSuccess(res, { count }, `Overdue notifications sent: ${count}`)
  } catch (error) { next(error) }
}

const sendMembershipExpiryNotifications = async (req, res, next) => {
  try {
    const count = await notificationService.sendMembershipExpiryNotifications()
    return sendSuccess(res, { count }, `Membership expiry notifications sent: ${count}`)
  } catch (error) { next(error) }
}

module.exports = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  sendDueReminders,
  sendOverdueNotifications,
  sendMembershipExpiryNotifications,
}