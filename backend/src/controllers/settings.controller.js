const settingsService = require('../services/settings.service')
const { sendSuccess, sendError, sendPaginated } = require('../utils/response')
const multer = require('multer')
const path = require('path')

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings()
    return sendSuccess(res, settings, 'Settings fetched successfully')
  } catch (error) { next(error) }
}

const updateSettings = async (req, res, next) => {
  try {
    const logo = req.file ? req.file.path : null
    const settings = await settingsService.updateSettings(
      req.body, logo, req.user.id
    )
    return sendSuccess(res, settings, 'Settings updated successfully')
  } catch (error) { next(error) }
}

const getHolidays = async (req, res, next) => {
  try {
    const holidays = await settingsService.getHolidays()
    return sendSuccess(res, holidays, 'Holidays fetched successfully')
  } catch (error) { next(error) }
}

const addHoliday = async (req, res, next) => {
  try {
    const { name, date } = req.body
    if (!name || !date) {
      return sendError(res, 'Name and date are required', 400)
    }
    const holiday = await settingsService.addHoliday(req.body, req.user.id)
    return sendSuccess(res, holiday, 'Holiday added successfully', 201)
  } catch (error) { next(error) }
}

const deleteHoliday = async (req, res, next) => {
  try {
    const result = await settingsService.deleteHoliday(req.params.id, req.user.id)
    return sendSuccess(res, result, 'Holiday deleted successfully')
  } catch (error) { next(error) }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { logs, total } = await settingsService.getAuditLogs(req.query)
    return sendPaginated(
      res, logs, total,
      req.query.page || 1,
      req.query.limit || 10
    )
  } catch (error) { next(error) }
}

const getMemberTypes = async (req, res, next) => {
  try {
    const types = await settingsService.getMemberTypes()
    return sendSuccess(res, types, 'Member types fetched successfully')
  } catch (error) { next(error) }
}

const createMemberType = async (req, res, next) => {
  try {
    const type = await settingsService.createMemberType(req.body, req.user.id)
    return sendSuccess(res, type, 'Member type created successfully', 201)
  } catch (error) { next(error) }
}

const updateMemberType = async (req, res, next) => {
  try {
    const type = await settingsService.updateMemberType(
      req.params.id, req.body, req.user.id
    )
    return sendSuccess(res, type, 'Member type updated successfully')
  } catch (error) { next(error) }
}

const getLanguages = async (req, res, next) => {
  try {
    const languages = await settingsService.getLanguages()
    return sendSuccess(res, languages, 'Languages fetched successfully')
  } catch (error) { next(error) }
}

const createLanguage = async (req, res, next) => {
  try {
    const { name, code } = req.body
    if (!name || !code) {
      return sendError(res, 'Name and code are required', 400)
    }
    const language = await settingsService.createLanguage(req.body, req.user.id)
    return sendSuccess(res, language, 'Language created successfully', 201)
  } catch (error) { next(error) }
}

const getSubjects = async (req, res, next) => {
  try {
    const subjects = await settingsService.getSubjects()
    return sendSuccess(res, subjects, 'Subjects fetched successfully')
  } catch (error) { next(error) }
}

const createSubject = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) {
      return sendError(res, 'Name is required', 400)
    }
    const subject = await settingsService.createSubject(req.body, req.user.id)
    return sendSuccess(res, subject, 'Subject created successfully', 201)
  } catch (error) { next(error) }
}

const getVendors = async (req, res, next) => {
  try {
    const vendors = await settingsService.getVendors()
    return sendSuccess(res, vendors, 'Vendors fetched successfully')
  } catch (error) { next(error) }
}

const createVendor = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) {
      return sendError(res, 'Vendor name is required', 400)
    }
    const vendor = await settingsService.createVendor(req.body, req.user.id)
    return sendSuccess(res, vendor, 'Vendor created successfully', 201)
  } catch (error) { next(error) }
}
 
 const getFloors = async (req, res, next) => {
  try {
    const floors = await settingsService.getFloors()
    return sendSuccess(res, floors, 'Floors fetched successfully')
  } catch (error) { next(error) }
}

const createFloor = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return sendError(res, 'Floor name is required', 400)
    const floor = await settingsService.createFloor(req.body, req.user.id)
    return sendSuccess(res, floor, 'Floor created successfully', 201)
  } catch (error) { next(error) }
}

const getRacks = async (req, res, next) => {
  try {
    const racks = await settingsService.getRacks()
    return sendSuccess(res, racks, 'Racks fetched successfully')
  } catch (error) { next(error) }
}

const createRack = async (req, res, next) => {
  try {
    const { name, floorId } = req.body
    if (!name || !floorId) return sendError(res, 'Rack name and floor are required', 400)
    const rack = await settingsService.createRack(req.body, req.user.id)
    return sendSuccess(res, rack, 'Rack created successfully', 201)
  } catch (error) { next(error) }
}

const getShelves = async (req, res, next) => {
  try {
    const shelves = await settingsService.getShelves()
    return sendSuccess(res, shelves, 'Shelves fetched successfully')
  } catch (error) { next(error) }
}

const createShelf = async (req, res, next) => {
  try {
    const { name, rackId } = req.body
    if (!name || !rackId) return sendError(res, 'Shelf name and rack are required', 400)
    const shelf = await settingsService.createShelf(req.body, req.user.id)
    return sendSuccess(res, shelf, 'Shelf created successfully', 201)
  } catch (error) { next(error) }
}

// module.exports = {
//   // existing exports...
//   getFloors, createFloor,
//   getRacks, createRack,
//   getShelves, createShelf,
// }

module.exports = {
  getSettings,
  updateSettings,
  getHolidays,
  addHoliday,
  deleteHoliday,
  getAuditLogs,
  getMemberTypes,
  createMemberType,
  updateMemberType,
  getLanguages,
  createLanguage,
  getSubjects,
  createSubject,
  getVendors,
  createVendor,
  getFloors,
  createFloor,
  getRacks, 
  createRack,
  getShelves, 
  createShelf,
}