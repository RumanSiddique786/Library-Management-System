const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notification.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const adminRoles = ['SUPER_ADMIN', 'LIBRARIAN']

router.get('/', notificationController.getAllNotifications)
router.patch('/:id/read', notificationController.markAsRead)
router.patch('/member/:memberId/read-all', notificationController.markAllAsRead)

// Manual trigger endpoints (for testing)
router.post('/send/due-reminders', authorize(...adminRoles), notificationController.sendDueReminders)
router.post('/send/overdue', authorize(...adminRoles), notificationController.sendOverdueNotifications)
router.post('/send/membership-expiry', authorize(...adminRoles), notificationController.sendMembershipExpiryNotifications)


// // Temporary test route
// router.post('/test-email', authorize(...adminRoles), async (req, res) => {
//   try {
//     const { sendEmail } = require('../config/email')
//     await sendEmail({
//       to: 'test@example.com',
//       subject: 'Test Email from Library System',
//       html: '<h1>Test Email Working!</h1><p>Your email config is correct.</p>',
//     })
//     res.json({ success: true, message: 'Check terminal for preview URL' })
//   } catch (error) {
//     res.json({ success: false, message: error.message })
//   }
// })







// router.post('/test-real-email', authorize(...adminRoles), async (req, res) => {
//   try {
//     const { sendEmail } = require('../config/email')
//     const { welcomeEmail } = require('../utils/emailTemplates')
    
//     await sendEmail({
//       to: req.body.email,
//       subject: 'Test Email - Library System',
//       html: welcomeEmail('Test User', 'LIB-2026-0001', new Date('2027-01-01')),
//     })
    
//     res.json({ success: true, message: 'Email sent! Check your inbox.' })
//   } catch (error) {
//     res.json({ success: false, message: error.message })
//   }
// })

module.exports = router