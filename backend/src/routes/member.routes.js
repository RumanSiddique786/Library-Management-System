const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const memberController = require('../controllers/member.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { createMemberValidation, updateMemberValidation } = require('../validations/member.validation')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/members/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
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

router.get('/types', memberController.getMemberTypes)
router.get('/search/:memberId', memberController.getMemberByMemberId)
router.get('/', authorize('SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'), memberController.getAllMembers)
router.get('/:id', authorize('SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'), memberController.getMemberById)
router.post('/', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('photo'), createMemberValidation, memberController.createMember)
router.put('/:id', authorize('SUPER_ADMIN', 'LIBRARIAN'), upload.single('photo'), updateMemberValidation, memberController.updateMember)
router.delete('/:id', authorize('SUPER_ADMIN'), memberController.deleteMember)
router.patch('/:id/status', authorize('SUPER_ADMIN', 'LIBRARIAN'), memberController.updateMemberStatus)
router.patch('/:id/renew', authorize('SUPER_ADMIN', 'LIBRARIAN'), memberController.renewMembership)
router.get('/:id/stats', authorize('SUPER_ADMIN', 'LIBRARIAN'), memberController.getMemberStats)
router.get('/:id/wishlist', authenticate, memberController.getWishlist)
router.post('/:id/wishlist', authenticate, memberController.addToWishlist)
router.delete('/:id/wishlist/:bookId', authenticate, memberController.removeFromWishlist)

module.exports = router