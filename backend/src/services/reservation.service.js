const prisma = require('../config/database')

const getAllReservations = async (query) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    memberId = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    AND: [
      status ? { status } : {},
      memberId ? { memberId: parseInt(memberId) } : {},
    ],
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        member: {
          select: { id: true, name: true, memberId: true, email: true },
        },
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImage: true,
            copies: {
              where: { status: 'AVAILABLE' },
              select: { id: true, copyCode: true },
            },
          },
        },
      },
    }),
    prisma.reservation.count({ where }),
  ])

  return { reservations, total }
}

const getReservationById = async (id) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: parseInt(id) },
    include: {
      member: true,
      book: {
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
          },
        },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found' }
  }

  return reservation
}

const createReservation = async (data, memberId) => {
  const { bookId } = data

  // Check member
  const member = await prisma.member.findUnique({
    where: { id: parseInt(memberId) },
    include: { memberType: true },
  })

  if (!member) {
    throw { statusCode: 404, message: 'Member not found' }
  }

  if (member.status !== 'ACTIVE') {
    throw { statusCode: 400, message: 'Member is not active' }
  }

  if (new Date(member.expiryDate) < new Date()) {
    throw { statusCode: 400, message: 'Member membership has expired' }
  }

  // Check book exists
  const book = await prisma.book.findFirst({
    where: { id: parseInt(bookId), deletedAt: null },
    include: {
      copies: { where: { status: 'AVAILABLE' } },
    },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Book not found' }
  }

  // Check if already reserved by this member
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      memberId: parseInt(memberId),
      bookId: parseInt(bookId),
      status: { in: ['PENDING', 'AVAILABLE'] },
    },
  })

  if (existingReservation) {
    throw {
      statusCode: 400,
      message: 'You already have an active reservation for this book',
    }
  }

  // Check if member already has this book issued
  const alreadyIssued = await prisma.transaction.findFirst({
    where: {
      memberId: parseInt(memberId),
      status: 'ACTIVE',
      items: {
        some: {
          bookCopy: { bookId: parseInt(bookId) },
        },
      },
    },
  })

  if (alreadyIssued) {
    throw {
      statusCode: 400,
      message: 'You already have this book issued',
    }
  }

  // Set expiry date (3 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 3)

  // Determine initial status
  const status = book.copies.length > 0 ? 'AVAILABLE' : 'PENDING'

  const reservation = await prisma.reservation.create({
    data: {
      memberId: parseInt(memberId),
      bookId: parseInt(bookId),
      status,
      expiresAt: status === 'AVAILABLE' ? expiresAt : null,
    },
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      book: { select: { id: true, title: true, isbn: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: memberId,
      action: 'CREATE',
      module: 'RESERVATIONS',
      description: `Reserved book "${book.title}" by member ${member.name}`,
    },
  })

  return reservation
}

const cancelReservation = async (id, cancelledBy, userRole) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: parseInt(id) },
    include: {
      member: true,
      book: true,
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found' }
  }

  // Members can only cancel their own reservations
  if (
    userRole === 'MEMBER' &&
    reservation.memberId !== parseInt(cancelledBy)
  ) {
    throw {
      statusCode: 403,
      message: 'You can only cancel your own reservations',
    }
  }

  if (['COLLECTED', 'CANCELLED', 'EXPIRED'].includes(reservation.status)) {
    throw {
      statusCode: 400,
      message: `Reservation is already ${reservation.status.toLowerCase()}`,
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: parseInt(id) },
    data: { status: 'CANCELLED' },
    include: {
      member: { select: { id: true, name: true } },
      book: { select: { id: true, title: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: parseInt(cancelledBy),
      action: 'CANCEL',
      module: 'RESERVATIONS',
      description: `Cancelled reservation for book "${reservation.book.title}"`,
    },
  })

  return updated
}

const collectReservation = async (id, collectedBy) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: parseInt(id) },
    include: {
      member: { include: { memberType: true } },
      book: {
        include: {
          copies: { where: { status: 'AVAILABLE' } },
        },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Reservation not found' }
  }

  if (reservation.status !== 'AVAILABLE') {
    throw {
      statusCode: 400,
      message: 'Reservation is not available for collection',
    }
  }

  if (reservation.book.copies.length === 0) {
    throw { statusCode: 400, message: 'No available copies to collect' }
  }

  // Check expiry
  if (reservation.expiresAt && new Date() > new Date(reservation.expiresAt)) {
    await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status: 'EXPIRED' },
    })
    throw { statusCode: 400, message: 'Reservation has expired' }
  }

  // Issue the book automatically
  const availableCopy = reservation.book.copies[0]
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + reservation.member.memberType.maxDays)

  const transaction = await prisma.transaction.create({
    data: {
      memberId: reservation.memberId,
      issuedById: collectedBy,
      issueDate: new Date(),
      dueDate,
      status: 'ACTIVE',
      items: {
        create: { bookCopyId: availableCopy.id },
      },
    },
    include: {
      items: {
        include: {
          bookCopy: { include: { book: true } },
        },
      },
    },
  })

  // Update copy status
  await prisma.bookCopy.update({
    where: { id: availableCopy.id },
    data: { status: 'ISSUED' },
  })

  // Update reservation status
  await prisma.reservation.update({
    where: { id: parseInt(id) },
    data: { status: 'COLLECTED' },
  })

  await prisma.auditLog.create({
    data: {
      userId: collectedBy,
      action: 'COLLECT',
      module: 'RESERVATIONS',
      description: `Collected reservation for book "${reservation.book.title}"`,
    },
  })

  return { reservation, transaction }
}

const checkAndExpireReservations = async () => {
  const expired = await prisma.reservation.updateMany({
    where: {
      status: 'AVAILABLE',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  })

  return expired.count
}

const getReservationStats = async () => {
  const [pending, available, collected, cancelled, expired] = await Promise.all([
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { status: 'AVAILABLE' } }),
    prisma.reservation.count({ where: { status: 'COLLECTED' } }),
    prisma.reservation.count({ where: { status: 'CANCELLED' } }),
    prisma.reservation.count({ where: { status: 'EXPIRED' } }),
  ])

  return { pending, available, collected, cancelled, expired }
}

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  cancelReservation,
  collectReservation,
  checkAndExpireReservations,
  getReservationStats,
}