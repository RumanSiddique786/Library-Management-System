const { body } = require('express-validator')

const createUserValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('roleId')
    .notEmpty()
    .withMessage('Role is required')
    .isInt()
    .withMessage('Invalid role'),
  body('mobile')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
]

const updateUserValidation = [
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
  body('roleId')
    .optional()
    .isInt()
    .withMessage('Invalid role'),
]

module.exports = { createUserValidation, updateUserValidation }