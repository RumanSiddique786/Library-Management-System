const cron = require('node-cron')
const notificationService = require('../services/notification.service')
const logger = require('../utils/logger')

const initCronJobs = () => {
  // Run every day at 8:00 AM — Send due reminders
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running due reminder cron job...')
    const count = await notificationService.sendDueReminders()
    logger.info(`Due reminders sent: ${count}`)
  })

  // Run every day at 9:00 AM — Send overdue notifications
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running overdue notification cron job...')
    const count = await notificationService.sendOverdueNotifications()
    logger.info(`Overdue notifications sent: ${count}`)
  })

  // Run every day at 10:00 AM — Send membership expiry notifications
  cron.schedule('0 10 * * *', async () => {
    logger.info('Running membership expiry cron job...')
    const count = await notificationService.sendMembershipExpiryNotifications()
    logger.info(`Membership expiry notifications sent: ${count}`)
  })

  logger.info('✅ Cron jobs initialized')
}

module.exports = { initCronJobs }