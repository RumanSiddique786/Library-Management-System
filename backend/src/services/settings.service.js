const prisma = require('../config/database')

const getSettings = async () => {
  let settings = await prisma.librarySetting.findFirst()

  if (!settings) {
    settings = await prisma.librarySetting.create({
      data: {
        libraryName: 'My Library',
        address: '123 Library Street',
        contact: '1234567890',
        email: 'library@example.com',
        maxBooksPerMember: 3,
        finePerDay: 1.00,
        membershipDuration: 365,
        workingDays: 'MON,TUE,WED,THU,FRI,SAT',
      },
    })
  }

  return settings
}

const updateSettings = async (data, logo, updatedBy) => {
  const settings = await prisma.librarySetting.findFirst()

  if (!settings) {
    throw { statusCode: 404, message: 'Settings not found' }
  }

  const updated = await prisma.librarySetting.update({
    where: { id: settings.id },
    data: {
      libraryName: data.libraryName || settings.libraryName,
      logo: logo || settings.logo,
      address: data.address || settings.address,
      gstNumber: data.gstNumber || settings.gstNumber,
      contact: data.contact || settings.contact,
      email: data.email || settings.email,
      maxBooksPerMember: data.maxBooksPerMember
        ? parseInt(data.maxBooksPerMember)
        : settings.maxBooksPerMember,
      finePerDay: data.finePerDay
        ? parseFloat(data.finePerDay)
        : settings.finePerDay,
      membershipDuration: data.membershipDuration
        ? parseInt(data.membershipDuration)
        : settings.membershipDuration,
      workingDays: data.workingDays || settings.workingDays,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'SETTINGS',
      description: 'Updated library settings',
    },
  })

  return updated
}

const getHolidays = async () => {
  return await prisma.holiday.findMany({
    orderBy: { date: 'asc' },
  })
}

const addHoliday = async (data, createdBy) => {
  const holiday = await prisma.holiday.create({
    data: {
      name: data.name,
      date: new Date(data.date),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Added holiday: ${holiday.name}`,
    },
  })

  return holiday
}

const deleteHoliday = async (id, deletedBy) => {
  const holiday = await prisma.holiday.findUnique({
    where: { id: parseInt(id) },
  })

  if (!holiday) {
    throw { statusCode: 404, message: 'Holiday not found' }
  }

  await prisma.holiday.delete({ where: { id: parseInt(id) } })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'SETTINGS',
      description: `Deleted holiday: ${holiday.name}`,
    },
  })

  return { message: 'Holiday deleted successfully' }
}

const getAuditLogs = async (query) => {
  const {
    page = 1,
    limit = 10,
    module = '',
    action = '',
    userId = '',
    from = '',
    to = '',
  } = query

  const skip = (page - 1) * limit

  const where = {
    AND: [
      module ? { module } : {},
      action ? { action } : {},
      userId ? { userId: parseInt(userId) } : {},
      from && to
        ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
        : {},
    ],
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}

const getMemberTypes = async () => {
  return await prisma.memberType.findMany({
    include: { _count: { select: { members: true } } },
  })
}

const createMemberType = async (data, createdBy) => {
  const existing = await prisma.memberType.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    throw { statusCode: 400, message: 'Member type already exists' }
  }

  const memberType = await prisma.memberType.create({
    data: {
      name: data.name,
      maxBooks: parseInt(data.maxBooks) || 3,
      maxDays: parseInt(data.maxDays) || 14,
      finePerDay: parseFloat(data.finePerDay) || 1.00,
      renewalLimit: parseInt(data.renewalLimit) || 2,
      membershipDuration: parseInt(data.membershipDuration) || 365,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Created member type: ${memberType.name}`,
    },
  })

  return memberType
}

const updateMemberType = async (id, data, updatedBy) => {
  const memberType = await prisma.memberType.findUnique({
    where: { id: parseInt(id) },
  })

  if (!memberType) {
    throw { statusCode: 404, message: 'Member type not found' }
  }

  const updated = await prisma.memberType.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name || memberType.name,
      maxBooks: data.maxBooks ? parseInt(data.maxBooks) : memberType.maxBooks,
      maxDays: data.maxDays ? parseInt(data.maxDays) : memberType.maxDays,
      finePerDay: data.finePerDay
        ? parseFloat(data.finePerDay)
        : memberType.finePerDay,
      renewalLimit: data.renewalLimit
        ? parseInt(data.renewalLimit)
        : memberType.renewalLimit,
      membershipDuration: data.membershipDuration
        ? parseInt(data.membershipDuration)
        : memberType.membershipDuration,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'SETTINGS',
      description: `Updated member type: ${memberType.name}`,
    },
  })

  return updated
}

const getLanguages = async () => {
  return await prisma.language.findMany({
    orderBy: { name: 'asc' },
  })
}

const createLanguage = async (data, createdBy) => {
  const language = await prisma.language.create({
    data: {
      name: data.name,
      code: data.code,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Created language: ${language.name}`,
    },
  })

  return language
}

const getSubjects = async () => {
  return await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  })
}

const createSubject = async (data, createdBy) => {
  const subject = await prisma.subject.create({
    data: { name: data.name },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Created subject: ${subject.name}`,
    },
  })

  return subject
}

const getVendors = async () => {
  return await prisma.vendor.findMany({
    orderBy: { name: 'asc' },
  })
}

const createVendor = async (data, createdBy) => {
  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      contact: data.contact,
      email: data.email,
      address: data.address,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Created vendor: ${vendor.name}`,
    },
  })

  return vendor
}



const getFloors = async () => {
  return await prisma.floor.findMany({
    include: { racks: { include: { shelves: true } } },
    orderBy: { name: 'asc' }
  })
}

const createFloor = async (data, createdBy) => {
  const floor = await prisma.floor.create({
    data: { name: data.name }
  })
  await prisma.auditLog.create({
    data: { userId: createdBy, action: 'CREATE', module: 'SETTINGS', description: `Created floor: ${floor.name}` }
  })
  return floor
}

const getRacks = async () => {
  return await prisma.rack.findMany({
    include: { floor: true, shelves: true },
    orderBy: { name: 'asc' }
  })
}

const createRack = async (data, createdBy) => {
  const rack = await prisma.rack.create({
    data: { name: data.name, floorId: parseInt(data.floorId) }
  })
  await prisma.auditLog.create({
    data: { userId: createdBy, action: 'CREATE', module: 'SETTINGS', description: `Created rack: ${rack.name}` }
  })
  return rack
}

const getShelves = async () => {
  return await prisma.shelf.findMany({
    include: { rack: { include: { floor: true } } },
    orderBy: { name: 'asc' }
  })
}

const createShelf = async (data, createdBy) => {
  const shelf = await prisma.shelf.create({
    data: { name: data.name, rackId: parseInt(data.rackId) }
  })
  await prisma.auditLog.create({
    data: { userId: createdBy, action: 'CREATE', module: 'SETTINGS', description: `Created shelf: ${shelf.name}` }
  })
  return shelf
}


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