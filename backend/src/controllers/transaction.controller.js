const transactionService = require('../services/transaction.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')

const issueBook = async (req, res, next) => {
  try {
    const { memberId, bookCopyId } = req.body

    if (!memberId || !bookCopyId) {
      return sendError(res, 'memberId and bookCopyId are required', 400)
    }

    const transaction = await transactionService.issueBook(req.body, req.user.id)
    return sendSuccess(res, transaction, 'Book issued successfully', 201)
  } catch (error) {
    next(error)
  }
}

const returnBook = async (req, res, next) => {
  try {
    const result = await transactionService.returnBook(
      req.params.id,
      req.body,
      req.user.id
    )
    return sendSuccess(res, result, result.message)
  } catch (error) {
    next(error)
  }
}

const renewBook = async (req, res, next) => {
  try {
    const transaction = await transactionService.renewBook(
      req.params.id,
      req.user.id
    )
    return sendSuccess(res, transaction, 'Book renewed successfully')
  } catch (error) {
    next(error)
  }
}

const getAllTransactions = async (req, res, next) => {
  try {
    const { transactions, total } = await transactionService.getAllTransactions(req.query)
    return sendPaginated(
      res, transactions, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) {
    next(error)
  }
}

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id)
    return sendSuccess(res, transaction, 'Transaction fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getOverdueTransactions = async (req, res, next) => {
  try {
    const transactions = await transactionService.getOverdueTransactions()
    return sendSuccess(res, transactions, 'Overdue transactions fetched')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  issueBook,
  returnBook,
  renewBook,
  getAllTransactions,
  getTransactionById,
  getOverdueTransactions,
}