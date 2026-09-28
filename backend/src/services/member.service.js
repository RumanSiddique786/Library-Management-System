const prisma = require('../config/database')

// Generate unique member ID
const generateMemberId = async () => {
  const year = new Date().getFullYear()
  const count = await prisma.member.count()
  const padded = String(count + 1).padStart(4, '0')
  return `LIB-${year}-${padded}`
}

const getAllMembers = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    memberTypeId = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search, mode: 'insensitive' } },
              { memberId: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      status ? { status } : {},
      memberTypeId ? { memberTypeId: parseInt(memberTypeId) } : {},
    ],
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        memberType: {
          select: { id: true, name: true, maxBooks: true, maxDays: true },
        },
      },
    }),
    prisma.member.count({ where }),
  ])

  return { members, total }
}

const getMemberById = async (id) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
    include: {
      memberType: true,
      transactions: {
        where: { status: 'ACTIVE' },
        include: {
          items: {
            include: {
              bookCopy: {
                include: { book: true },
              },
            },
          },
        },
      },
      fines: {
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
      },
    },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  return member
}

const getMemberByMemberId = async (memberId) => {
  const member = await prisma.member.findUnique({
    where: { memberId },
    include: {
      memberType: true,
    },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  return member
}

const createMember = async (data, photo, createdBy) => {
  const existingEmail = await prisma.member.findUnique({
    where: { email: data.email },
  })

  if (existingEmail) {
    throw { statusCode: 400, message: 'Email already exists' }
  }

  const memberType = await prisma.memberType.findUnique({
    where: { id: parseInt(data.memberTypeId) },
  })

  if (!memberType) {
    throw { statusCode: 404, message: 'Member type not found' }
  }

  const memberId = await generateMemberId()

  // Calculate expiry date
  const joiningDate = new Date()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + (memberType.membershipDuration || 365))

  const member = await prisma.member.create({
    data: {
      memberId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      department: data.department,
      studentId: data.studentId,
      faculty: data.faculty,
      photo: photo || null,
      memberTypeId: parseInt(data.memberTypeId),
      joiningDate,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : expiryDate,
      status: 'ACTIVE',
    },
    include: {
      memberType: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'MEMBERS',
      description: `Created member ${member.memberId} - ${member.name}`,
    },
  })

  return member
}

const updateMember = async (id, data, photo, updatedBy) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  if (data.email && data.email !== member.email) {
    const existingEmail = await prisma.member.findUnique({
      where: { email: data.email },
    })
    if (existingEmail) {
      throw { statusCode: 400, message: 'Email already exists' }
    }
  }

  const updatedMember = await prisma.member.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      department: data.department,
      studentId: data.studentId,
      faculty: data.faculty,
      photo: photo || member.photo,
      memberTypeId: data.memberTypeId
        ? parseInt(data.memberTypeId)
        : member.memberTypeId,
    },
    include: { memberType: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MEMBERS',
      description: `Updated member ${member.memberId} - ${member.name}`,
    },
  })

  return updatedMember
}

const deleteMember = async (id, deletedBy) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
    include: {
      transactions: { where: { status: 'ACTIVE' } },
      fines: { where: { status: { in: ['PENDING', 'PARTIAL'] } } },
    },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  if (member.transactions.length > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete member with active transactions',
    }
  }

  if (member.fines.length > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete member with pending fines',
    }
  }

  await prisma.member.delete({ where: { id: parseInt(id) } })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'MEMBERS',
      description: `Deleted member ${member.memberId} - ${member.name}`,
    },
  })

  return { message: 'Member deleted successfully' }
}

const updateMemberStatus = async (id, status, updatedBy) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  const updatedMember = await prisma.member.update({
    where: { id: parseInt(id) },
    data: { status },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MEMBERS',
      description: `Updated member ${member.memberId} status to ${status}`,
    },
  })

  return updatedMember
 }

 const renewMembership = async (id, updatedBy) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
    include: { memberType: true },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  const newExpiryDate = new Date()
  newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1)

  console.log('New expiry date:', newExpiryDate)

  const updatedMember = await prisma.member.update({
    where: { id: parseInt(id) },
    data: {
      expiryDate: newExpiryDate,
      status: 'ACTIVE',
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MEMBERS',
      description: `Renewed membership for ${member.memberId}`,
    },
  })

  return updatedMember
}

const getMemberTypes = async () => {
  return await prisma.memberType.findMany()
}

const getMemberStats = async (id) => {
  const member = await prisma.member.findUnique({
    where: { id: parseInt(id) },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  const [
    totalBorrowed,
    currentlyBorrowed,
    totalFines,
    pendingFines,
    totalReservations,
  ] = await Promise.all([
    prisma.transaction.count({ where: { memberId: parseInt(id) } }),
    prisma.transaction.count({
      where: { memberId: parseInt(id), status: 'ACTIVE' },
    }),
    prisma.fine.aggregate({
      where: { memberId: parseInt(id) },
      _sum: { amount: true },
    }),
    prisma.fine.aggregate({
      where: {
        memberId: parseInt(id),
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      _sum: { amount: true },
    }),
    prisma.reservation.count({ where: { memberId: parseInt(id) } }),
  ])

  return {
    totalBorrowed,
    currentlyBorrowed,
    totalFines: totalFines._sum.amount || 0,
    pendingFines: pendingFines._sum.amount || 0,
    totalReservations,
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
}