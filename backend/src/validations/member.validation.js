const { body } = require('express-validator')

const createMemberValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required'),
  body('memberTypeId')
    .notEmpty()
    .withMessage('Member type is required')
    .isInt()
    .withMessage('Invalid member type'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('studentId')
    .optional()
    .notEmpty()
    .withMessage('Student ID cannot be empty'),
]

const updateMemberValidation = [
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
    .notEmpty()
    .withMessage('Mobile cannot be empty'),
  body('memberTypeId')
    .optional()
    .isInt()
    .withMessage('Invalid member type'),
]

module.exports = { createMemberValidation, updateMemberValidation }