const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const settingsController = require('../controllers/settings.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, 'logo-' + Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

router.use(authenticate)

const adminOnly = ['SUPER_ADMIN']
const adminLibrarian = ['SUPER_ADMIN', 'LIBRARIAN']

// Library Settings
router.get('/', settingsController.getSettings)
router.put(
  '/',
  authorize(...adminOnly),
  upload.single('logo'),
  settingsController.updateSettings
)

// Holidays
router.get('/holidays', settingsController.getHolidays)
router.post('/holidays', authorize(...adminOnly), settingsController.addHoliday)
router.delete('/holidays/:id', authorize(...adminOnly), settingsController.deleteHoliday)

// Audit Logs
router.get('/audit-logs', authorize(...adminOnly), settingsController.getAuditLogs)

// Member Types
router.get('/member-types', settingsController.getMemberTypes)
router.post('/member-types', authorize(...adminOnly), settingsController.createMemberType)
router.put('/member-types/:id', authorize(...adminOnly), settingsController.updateMemberType)

// Languages
router.get('/languages', settingsController.getLanguages)
router.post('/languages', authorize(...adminLibrarian), settingsController.createLanguage)

// Subjects
router.get('/subjects', settingsController.getSubjects)
router.post('/subjects', authorize(...adminLibrarian), settingsController.createSubject)

// Vendors
router.get('/vendors', settingsController.getVendors)
router.post('/vendors', authorize(...adminLibrarian), settingsController.createVendor)

// Add these routes
router.get('/floors', settingsController.getFloors)
router.post('/floors', authorize(...adminOnly), settingsController.createFloor)
router.get('/racks', settingsController.getRacks)
router.post('/racks', authorize(...adminOnly), settingsController.createRack)
router.get('/shelves', settingsController.getShelves)
router.post('/shelves', authorize(...adminOnly), settingsController.createShelf)

module.exports = router