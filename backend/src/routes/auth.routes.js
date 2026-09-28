const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth.middleware')
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../validations/auth.validation')

router.post('/login', loginValidation, authController.login)
router.post('/refresh', authController.refresh)
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword)
router.post('/reset-password', resetPasswordValidation, authController.resetPassword)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getMe)
router.post('/change-password', authenticate, changePasswordValidation, authController.changePassword)

module.exports = router