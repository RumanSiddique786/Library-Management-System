const express = require('express')
const router = express.Router()
const transactionController = require('../controllers/transaction.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

const librarianRoles = ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']

router.get('/', authorize(...librarianRoles), transactionController.getAllTransactions)
router.get('/overdue', authorize(...librarianRoles), transactionController.getOverdueTransactions)
router.get('/:id', authorize(...librarianRoles), transactionController.getTransactionById)
router.post('/issue', authorize(...librarianRoles), transactionController.issueBook)
router.post('/:id/return', authorize(...librarianRoles), transactionController.returnBook)
router.post('/:id/renew', authorize(...librarianRoles), transactionController.renewBook)

module.exports = router