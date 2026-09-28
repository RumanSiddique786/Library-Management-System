const express = require('express')
const router = express.Router()
const fineController = require('../controllers/fine.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const librarianRoles = ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']

router.get('/stats', authorize('SUPER_ADMIN', 'LIBRARIAN'), fineController.getFineStats)
router.get('/', authorize(...librarianRoles), fineController.getAllFines)
router.get('/member/:memberId', authorize(...librarianRoles), fineController.getMemberFines)
router.get('/:id', authorize(...librarianRoles), fineController.getFineById)
router.post('/:id/pay', authorize(...librarianRoles), fineController.payFine)
router.patch('/:id/waive', authorize('SUPER_ADMIN', 'LIBRARIAN'), fineController.waiveFine)

module.exports = router