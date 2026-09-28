const prisma = require('../config/database')

const getAllFines = async (query) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    type = '',
    memberId = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    AND: [
      status ? { status } : {},
      type ? { type } : {},
      memberId ? { memberId: parseInt(memberId) } : {},
    ],
  }

  const [fines, total] = await Promise.all([
    prisma.fine.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        member: {
          select: { id: true, name: true, memberId: true, email: true },
        },
        transaction: {
          select: {
            id: true,
            issueDate: true,
            dueDate: true,
            returnDate: true,
          },
        },
        payments: true,
      },
    }),
    prisma.fine.count({ where }),
  ])

  return { fines, total }
}

const getFineById = async (id) => {
  const fine = await prisma.fine.findUnique({
    where: { id: parseInt(id) },
    include: {
      member: true,
      transaction: {
        include: {
          items: {
            include: {
              bookCopy: { include: { book: true } },
            },
          },
        },
      },
      payments: true,
    },
  })

  if (!fine) {
    throw { statusCode: 404, message: 'Fine not found' }
  }

  return fine
}

const getMemberFines = async (memberId, query) => {
  const { status = '', page = 1, limit = 10 } = query
  const skip = (page - 1) * limit

  const where = {
    memberId: parseInt(memberId),
    AND: [status ? { status } : {}],
  }

  const [fines, total] = await Promise.all([
    prisma.fine.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: { id: true, issueDate: true, dueDate: true },
        },
        payments: true,
      },
    }),
    prisma.fine.count({ where }),
  ])

  return { fines, total }
}

const payFine = async (fineId, data, receivedById) => {
  const fine = await prisma.fine.findUnique({
    where: { id: parseInt(fineId) },
    include: { payments: true },
  })

  if (!fine) {
    throw { statusCode: 404, message: 'Fine not found' }
  }

  if (fine.status === 'PAID') {
    throw { statusCode: 400, message: 'Fine is already paid' }
  }

  if (fine.status === 'WAIVED') {
    throw { statusCode: 400, message: 'Fine is already waived' }
  }

  const paymentAmount = parseFloat(data.amount)
  const totalPaid = parseFloat(fine.paidAmount) + paymentAmount
  const totalAmount = parseFloat(fine.amount)

  if (paymentAmount <= 0) {
    throw { statusCode: 400, message: 'Payment amount must be greater than 0' }
  }

  if (totalPaid > totalAmount) {
    throw {
      statusCode: 400,
      message: `Payment amount exceeds fine amount. Remaining: ₹${totalAmount - parseFloat(fine.paidAmount)}`,
    }
  }

  // Determine new status
  let newStatus = 'PARTIAL'
  if (totalPaid >= totalAmount) {
    newStatus = 'PAID'
  }

  // Create payment record
  const payment = await prisma.finePayment.create({
    data: {
      fineId: parseInt(fineId),
      amount: paymentAmount,
      paymentMode: data.paymentMode || 'CASH',
      receivedById,
    },
  })

  // Update fine
  const updatedFine = await prisma.fine.update({
    where: { id: parseInt(fineId) },
    data: {
      paidAmount: totalPaid,
      status: newStatus,
    },
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      payments: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: receivedById,
      action: 'PAYMENT',
      module: 'FINES',
      description: `Received fine payment of ₹${paymentAmount} for fine #${fineId}`,
    },
  })

  return {
    fine: updatedFine,
    payment,
    remainingAmount: totalAmount - totalPaid,
    message:
      newStatus === 'PAID'
        ? 'Fine paid successfully'
        : `Partial payment received. Remaining: ₹${totalAmount - totalPaid}`,
  }
}

const waiveFine = async (fineId, reason, waivedById) => {
  const fine = await prisma.fine.findUnique({
    where: { id: parseInt(fineId) },
  })

  if (!fine) {
    throw { statusCode: 404, message: 'Fine not found' }
  }

  if (fine.status === 'PAID') {
    throw { statusCode: 400, message: 'Cannot waive a paid fine' }
  }

  if (fine.status === 'WAIVED') {
    throw { statusCode: 400, message: 'Fine is already waived' }
  }

  const updatedFine = await prisma.fine.update({
    where: { id: parseInt(fineId) },
    data: {
      status: 'WAIVED',
      reason: reason || fine.reason,
    },
    include: {
      member: { select: { id: true, name: true, memberId: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: waivedById,
      action: 'WAIVE',
      module: 'FINES',
      description: `Waived fine #${fineId} for member ${updatedFine.member.name}`,
    },
  })

  return updatedFine
}

const getFineStats = async () => {
  const [
    totalFines,
    pendingFines,
    paidFines,
    waivedFines,
    totalAmount,
    collectedAmount,
  ] = await Promise.all([
    prisma.fine.count(),
    prisma.fine.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    prisma.fine.count({ where: { status: 'PAID' } }),
    prisma.fine.count({ where: { status: 'WAIVED' } }),
    prisma.fine.aggregate({ _sum: { amount: true } }),
    prisma.fine.aggregate({ _sum: { paidAmount: true } }),
  ])

  return {
    totalFines,
    pendingFines,
    paidFines,
    waivedFines,
    totalAmount: totalAmount._sum.amount || 0,
    collectedAmount: collectedAmount._sum.paidAmount || 0,
    pendingAmount:
      parseFloat(totalAmount._sum.amount || 0) -
      parseFloat(collectedAmount._sum.paidAmount || 0),
  }
}

module.exports = {
  getAllFines,
  getFineById,
  getMemberFines,
  payFine,
  waiveFine,
  getFineStats,
}