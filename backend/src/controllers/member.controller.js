const { validationResult } = require('express-validator')
const memberService = require('../services/member.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getAllMembers = async (req, res, next) => {
  try {
    const { members, total } = await memberService.getAllMembers(req.query)
    return sendPaginated(
      res, members, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) {
    next(error)
  }
}

const getMemberById = async (req, res, next) => {
  try {
    const member = await memberService.getMemberById(req.params.id)
    return sendSuccess(res, member, 'Member fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getMemberByMemberId = async (req, res, next) => {
  try {
    const member = await memberService.getMemberByMemberId(req.params.memberId)
    return sendSuccess(res, member, 'Member fetched successfully')
  } catch (error) {
    next(error)
  }
}

const createMember = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }
    const photo = req.file ? req.file.path : null
    const member = await memberService.createMember(req.body, photo, req.user.id)
    return sendSuccess(res, member, 'Member created successfully', 201)
  } catch (error) {
    next(error)
  }
}

const updateMember = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array())
    }
    const photo = req.file ? req.file.path : null
    const member = await memberService.updateMember(
      req.params.id, req.body, photo, req.user.id
    )
    return sendSuccess(res, member, 'Member updated successfully')
  } catch (error) {
    next(error)
  }
}

const deleteMember = async (req, res, next) => {
  try {
    const result = await memberService.deleteMember(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Member deleted successfully')
  } catch (error) {
    next(error)
  }
}

const updateMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['ACTIVE', 'EXPIRED', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return sendError(res, 'Invalid status', 400)
    }
    const member = await memberService.updateMemberStatus(
      req.params.id, status, req.user.id
    )
    return sendSuccess(res, member, 'Member status updated successfully')
  } catch (error) {
    next(error)
  }
}

const renewMembership = async (req, res, next) => {
  try {
    const member = await memberService.renewMembership(req.params.id, req.user.id)
    return sendSuccess(res, member, 'Membership renewed successfully')
  } catch (error) {
    next(error)
  }
}

const getMemberTypes = async (req, res, next) => {
  try {
    const types = await memberService.getMemberTypes()
    return sendSuccess(res, types, 'Member types fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getMemberStats = async (req, res, next) => {
  try {
    const stats = await memberService.getMemberStats(req.params.id)
    return sendSuccess(res, stats, 'Member stats fetched successfully')
  } catch (error) {
    next(error)
  }
}

const getWishlist = async (req, res, next) => {
  try {
    const prisma = require('../config/database')
    const wishlist = await prisma.wishlist.findMany({
      where: { memberId: parseInt(req.params.id) },
      include: {
        book: {
          include: {
            category: { select: { name: true } },
            authors: {
              include: { author: { select: { name: true } } }
            },
            copies: {
              where: { status: 'AVAILABLE' },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.json({ success: true, data: wishlist, message: 'Wishlist fetched' })
  } catch (error) {
    next(error)
  }
}

const addToWishlist = async (req, res, next) => {
  try {
    const prisma = require('../config/database')
    const { bookId } = req.body
    const memberId = parseInt(req.params.id)

    const existing = await prisma.wishlist.findFirst({
      where: {
        memberId: memberId,
        bookId: parseInt(bookId)
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Book already in wishlist'
      })
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        memberId: memberId,
        bookId: parseInt(bookId)
      },
      include: { book: true }
    })

    return res.status(201).json({
      success: true,
      data: wishlist,
      message: 'Added to wishlist'
    })
  } catch (error) {
    next(error)
  }
}

const removeFromWishlist = async (req, res, next) => {
  try {
    const prisma = require('../config/database')
    await prisma.wishlist.deleteMany({
      where: {
        memberId: parseInt(req.params.id),
        bookId: parseInt(req.params.bookId)
      }
    })
    return res.json({
      success: true,
      data: null,
      message: 'Removed from wishlist'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByMemberId,
  createMember,
  updateMember,
  deleteMember,
  updateMemberStatus,
  renewMembership,
  getMemberTypes,
  getMemberStats,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
}