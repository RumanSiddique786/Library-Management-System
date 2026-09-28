const { validationResult } = require('express-validator')
const bookService = require('../services/book.service')
const categoryService = require('../services/category.service')
const authorService = require('../services/author.service')
const publisherService = require('../services/publisher.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── Books ──
const getAllBooks = async (req, res, next) => {
  try {
    const { books, total } = await bookService.getAllBooks(req.query)
    return sendPaginated(res, books, total, req.query.page || 1, req.query.limit || 10)
  } catch (error) { next(error) }
}

const getBookById = async (req, res, next) => {
  try {
    const book = await bookService.getBookById(req.params.id)
    return sendSuccess(res, book, 'Book fetched successfully')
  } catch (error) { next(error) }
}

const createBook = async (req, res, next) => {
  try {
    const coverImage = req.file ? req.file.path : null
    if (req.body.authorIds && typeof req.body.authorIds === 'string') {
      req.body.authorIds = JSON.parse(req.body.authorIds)
    }
    const book = await bookService.createBook(req.body, coverImage, req.user.id)
    return sendSuccess(res, book, 'Book created successfully', 201)
  } catch (error) { next(error) }
}

const updateBook = async (req, res, next) => {
  try {
    const coverImage = req.file ? req.file.path : null
    if (req.body.authorIds && typeof req.body.authorIds === 'string') {
      req.body.authorIds = JSON.parse(req.body.authorIds)
    }
    const book = await bookService.updateBook(req.params.id, req.body, coverImage, req.user.id)
    return sendSuccess(res, book, 'Book updated successfully')
  } catch (error) { next(error) }
}

const deleteBook = async (req, res, next) => {
  try {
    const result = await bookService.softDeleteBook(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Book deleted successfully')
  } catch (error) { next(error) }
}

const restoreBook = async (req, res, next) => {
  try {
    const result = await bookService.restoreBook(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Book restored successfully')
  } catch (error) { next(error) }
}

const addBookCopy = async (req, res, next) => {
  try {
    const copy = await bookService.addBookCopy(req.params.id, req.body, req.user.id)
    return sendSuccess(res, copy, 'Book copy added successfully', 201)
  } catch (error) { next(error) }
}

const searchBooks = async (req, res, next) => {
  try {
    const books = await bookService.searchBooks(req.query)
    return sendSuccess(res, books, 'Books fetched successfully')
  } catch (error) { next(error) }
}

const getDeletedBooks = async (req, res, next) => {
  try {
    const books = await bookService.getDeletedBooks()
    return sendSuccess(res, books, 'Deleted books fetched successfully')
  } catch (error) { next(error) }
}

// ── Categories ──
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories(req.query)
    return sendSuccess(res, categories, 'Categories fetched successfully')
  } catch (error) { next(error) }
}

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body, req.user.id)
    return sendSuccess(res, category, 'Category created successfully', 201)
  } catch (error) { next(error) }
}

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body, req.user.id)
    return sendSuccess(res, category, 'Category updated successfully')
  } catch (error) { next(error) }
}

const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Category deleted successfully')
  } catch (error) { next(error) }
}

// ── Authors ──
const getAllAuthors = async (req, res, next) => {
  try {
    const { authors, total } = await authorService.getAllAuthors(req.query)
    return sendPaginated(res, authors, total, req.query.page || 1, req.query.limit || 10)
  } catch (error) { next(error) }
}

const createAuthor = async (req, res, next) => {
  try {
    const photo = req.file ? req.file.path : null
    const author = await authorService.createAuthor(req.body, photo, req.user.id)
    return sendSuccess(res, author, 'Author created successfully', 201)
  } catch (error) { next(error) }
}

const updateAuthor = async (req, res, next) => {
  try {
    const photo = req.file ? req.file.path : null
    const author = await authorService.updateAuthor(req.params.id, req.body, photo, req.user.id)
    return sendSuccess(res, author, 'Author updated successfully')
  } catch (error) { next(error) }
}

const deleteAuthor = async (req, res, next) => {
  try {
    const result = await authorService.deleteAuthor(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Author deleted successfully')
  } catch (error) { next(error) }
}

// ── Publishers ──
const getAllPublishers = async (req, res, next) => {
  try {
    const { publishers, total } = await publisherService.getAllPublishers(req.query)
    return sendPaginated(res, publishers, total, req.query.page || 1, req.query.limit || 10)
  } catch (error) { next(error) }
}

const createPublisher = async (req, res, next) => {
  try {
    const publisher = await publisherService.createPublisher(req.body, req.user.id)
    return sendSuccess(res, publisher, 'Publisher created successfully', 201)
  } catch (error) { next(error) }
}

const updatePublisher = async (req, res, next) => {
  try {
    const publisher = await publisherService.updatePublisher(req.params.id, req.body, req.user.id)
    return sendSuccess(res, publisher, 'Publisher updated successfully')
  } catch (error) { next(error) }
}

const deletePublisher = async (req, res, next) => {
  try {
    const result = await publisherService.deletePublisher(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Publisher deleted successfully')
  } catch (error) { next(error) }
}

const updateCopyStatus = async (req, res, next) => {
  try {
    const { status, condition } = req.body
    const copyId = parseInt(req.params.copyId)

    if (!copyId) {
      return res.status(400).json({ success: false, message: 'Copy ID required' })
    }

    const prismaClient = require('../config/database')

    const copy = await prismaClient.bookCopy.update({
      where: { id: copyId },
      data: {
        ...(status && { status }),
        ...(condition && { condition })
      }
    })

    await prismaClient.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        module: 'BOOKS',
        description: `Updated copy ${copy.copyCode}: status=${status}, condition=${condition}`
      }
    })

    return res.json({ success: true, data: copy, message: 'Copy updated successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllBooks, getBookById, createBook, updateBook,
  deleteBook, restoreBook, addBookCopy, searchBooks, getDeletedBooks,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllAuthors, createAuthor, updateAuthor, deleteAuthor,
  getAllPublishers, createPublisher, updatePublisher, deletePublisher,
  updateCopyStatus,
}