const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const bookController = require('../controllers/book.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/books/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG and PNG images allowed'))
    }
  },
})

router.use(authenticate)

// ── Categories (before /:id to avoid conflict) ──
router.get('/categories/all', bookController.getAllCategories)
router.post('/categories/create', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.createCategory)
router.put('/categories/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.updateCategory)
router.delete('/categories/:id', authorize('SUPER_ADMIN'), bookController.deleteCategory)

// ── Authors (before /:id to avoid conflict) ──
router.get('/authors/all', bookController.getAllAuthors)
router.post('/authors/create', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('photo'), bookController.createAuthor)
router.put('/authors/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('photo'), bookController.updateAuthor)
router.delete('/authors/:id', authorize('SUPER_ADMIN'), bookController.deleteAuthor)

// ── Publishers (before /:id to avoid conflict) ──
router.get('/publishers/all', bookController.getAllPublishers)
router.post('/publishers/create', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.createPublisher)
router.put('/publishers/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.updatePublisher)
router.delete('/publishers/:id', authorize('SUPER_ADMIN'), bookController.deletePublisher)

// ── Special routes (before /:id) ──
router.get('/search', bookController.searchBooks)
router.get('/deleted', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.getDeletedBooks)

// ── Books CRUD ──
router.get('/', bookController.getAllBooks)
router.post('/', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('coverImage'), bookController.createBook)
router.get('/:id', bookController.getBookById)
router.put('/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('coverImage'), bookController.updateBook)
router.delete('/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.deleteBook)
router.patch('/:id/restore', authorize('SUPER_ADMIN'), bookController.restoreBook)

// ── Book Copies (after /:id) ──
router.post('/:id/copies', authorize('SUPER_ADMIN', 'LIBRARIAN'), bookController.addBookCopy)

// Add this route for inventory copy update
router.patch(
  '/copies/:copyId/status',
  authorize('SUPER_ADMIN', 'LIBRARIAN'),
  bookController.updateCopyStatus
)

module.exports = router