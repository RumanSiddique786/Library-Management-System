const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { createUserValidation, updateUserValidation } = require('../validations/user.validation')

router.use(authenticate)

router.get('/roles', userController.getAllRoles)
router.get('/', authorize('SUPER_ADMIN', 'LIBRARIAN'), userController.getAllUsers)
router.get('/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), userController.getUserById)
router.post('/', authorize('SUPER_ADMIN'), createUserValidation, userController.createUser)
router.put('/:id', authorize('SUPER_ADMIN'), updateUserValidation, userController.updateUser)
router.delete('/:id', authorize('SUPER_ADMIN'), userController.deleteUser)
router.patch('/:id/status', authorize('SUPER_ADMIN'), userController.updateUserStatus)
router.get('/:id/activity', authorize('SUPER_ADMIN'), userController.getActivityLogs)
router.patch('/:id/reset-password', authorize('SUPER_ADMIN'), userController.resetUserPassword)

module.exports = router