const prisma = require('../config/database')

const getBookReport = async (query) => {
  const { status = '', categoryId = '', from = '', to = '' } = query

  const where = {
    deletedAt: null,
    AND: [
      status ? { status } : {},
      categoryId ? { categoryId: parseInt(categoryId) } : {},
      from && to
        ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
        : {},
    ],
  }

  const books = await prisma.book.findMany({
    where,
    include: {
      category: { select: { name: true } },
      authors: { include: { author: { select: { name: true } } } },
      _count: { select: { copies: true } },
      copies: {
        select: { status: true },
      },
    },
    orderBy: { title: 'asc' },
  })

  const summary = {
    total: books.length,
    available: books.filter((b) =>
      b.copies.some((c) => c.status === 'AVAILABLE')
    ).length,
    fullyIssued: books.filter((b) =>
      b.copies.every((c) => c.status === 'ISSUED')
    ).length,
  }

  return { books, summary }
}

const getMemberReport = async (query) => {
  const { status = '', memberTypeId = '', from = '', to = '' } = query

  const where = {
    AND: [
      status ? { status } : {},
      memberTypeId ? { memberTypeId: parseInt(memberTypeId) } : {},
      from && to
        ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
        : {},
    ],
  }

  const members = await prisma.member.findMany({
    where,
    include: {
      memberType: { select: { name: true } },
      _count: {
        select: {
          transactions: true,
          fines: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const summary = {
    total: members.length,
    active: members.filter((m) => m.status === 'ACTIVE').length,
    expired: members.filter((m) => m.status === 'EXPIRED').length,
    suspended: members.filter((m) => m.status === 'SUSPENDED').length,
  }

  return { members, summary }
}

const getTransactionReport = async (query) => {
  const { status = '', from = '', to = '', period = 'monthly' } = query

  let dateFilter = {}
  const now = new Date()

  if (period === 'daily') {
    dateFilter = {
      gte: new Date(now.setHours(0, 0, 0, 0)),
      lte: new Date(now.setHours(23, 59, 59, 999)),
    }
  } else if (period === 'weekly') {
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    dateFilter = { gte: weekStart, lte: new Date() }
  } else if (period === 'monthly') {
    dateFilter = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  } else if (period === 'yearly') {
    dateFilter = {
      gte: new Date(now.getFullYear(), 0, 1),
      lte: new Date(now.getFullYear(), 11, 31),
    }
  }

  if (from && to) {
    dateFilter = { gte: new Date(from), lte: new Date(to) }
  }

  const where = {
    AND: [
      status ? { status } : {},
      Object.keys(dateFilter).length > 0
        ? { createdAt: dateFilter }
        : {},
    ],
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      issuedBy: { select: { id: true, name: true } },
      items: {
        include: {
          bookCopy: {
            include: { book: { select: { id: true, title: true } } },
          },
        },
      },
      fines: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const summary = {
    total: transactions.length,
    active: transactions.filter((t) => t.status === 'ACTIVE').length,
    returned: transactions.filter((t) => t.status === 'RETURNED').length,
    overdue: transactions.filter((t) => t.status === 'OVERDUE').length,
  }

  return { transactions, summary }
}

const getFineReport = async (query) => {
  const { status = '', type = '', from = '', to = '' } = query

  const where = {
    AND: [
      status ? { status } : {},
      type ? { type } : {},
      from && to
        ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
        : {},
    ],
  }

  const fines = await prisma.fine.findMany({
    where,
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      transaction: { select: { id: true, issueDate: true, dueDate: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAmount = fines.reduce((sum, f) => sum + parseFloat(f.amount), 0)
  const collectedAmount = fines.reduce(
    (sum, f) => sum + parseFloat(f.paidAmount),
    0
  )

  const summary = {
    total: fines.length,
    pending: fines.filter((f) => f.status === 'PENDING').length,
    paid: fines.filter((f) => f.status === 'PAID').length,
    waived: fines.filter((f) => f.status === 'WAIVED').length,
    totalAmount,
    collectedAmount,
    pendingAmount: totalAmount - collectedAmount,
  }

  return { fines, summary }
}

const getInventoryReport = async () => {
  const copies = await prisma.bookCopy.findMany({
    include: {
      book: {
        select: {
          id: true,
          title: true,
          isbn: true,
          category: { select: { name: true } },
        },
      },
      shelf: {
        include: {
          rack: { include: { floor: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const summary = {
    total: copies.length,
    available: copies.filter((c) => c.status === 'AVAILABLE').length,
    issued: copies.filter((c) => c.status === 'ISSUED').length,
    reserved: copies.filter((c) => c.status === 'RESERVED').length,
    lost: copies.filter((c) => c.status === 'LOST').length,
    damaged: copies.filter((c) => c.status === 'DAMAGED').length,
    maintenance: copies.filter((c) => c.status === 'MAINTENANCE').length,
  }

  return { copies, summary }
}

const getReservationReport = async (query) => {
  const { status = '', from = '', to = '' } = query

  const where = {
    AND: [
      status ? { status } : {},
      from && to
        ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
        : {},
    ],
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      book: { select: { id: true, title: true, isbn: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const summary = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    available: reservations.filter((r) => r.status === 'AVAILABLE').length,
    collected: reservations.filter((r) => r.status === 'COLLECTED').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
    expired: reservations.filter((r) => r.status === 'EXPIRED').length,
  }

  return { reservations, summary }
}

module.exports = {
  getBookReport,
  getMemberReport,
  getTransactionReport,
  getFineReport,
  getInventoryReport,
  getReservationReport,
}