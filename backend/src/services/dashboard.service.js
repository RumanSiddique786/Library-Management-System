const prisma = require('../config/database')

const getDashboardStats = async () => {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0))
  const todayEnd = new Date(now.setHours(23, 59, 59, 999))

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    totalBooks,
    availableBooks,
    issuedBooks,
    overdueBooks,
    reservedBooks,
    lostBooks,
    totalMembers,
    activeMembers,
    expiredMembers,
    todayTransactions,
    monthlyTransactions,
    totalFineCollection,
    pendingFines,
    totalReservations,
  ] = await Promise.all([
    // Books
    prisma.book.count({ where: { deletedAt: null } }),
    prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
    prisma.bookCopy.count({ where: { status: 'ISSUED' } }),
    prisma.transaction.count({ where: { status: 'OVERDUE' } }),
    prisma.bookCopy.count({ where: { status: 'RESERVED' } }),
    prisma.bookCopy.count({ where: { status: 'LOST' } }),

    // Members
    prisma.member.count(),
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.member.count({ where: { status: 'EXPIRED' } }),

    // Transactions
    prisma.transaction.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.transaction.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Fines
    prisma.fine.aggregate({
      where: { status: 'PAID' },
      _sum: { paidAmount: true },
    }),
    prisma.fine.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { amount: true },
    }),

    // Reservations
    prisma.reservation.count({
      where: { status: { in: ['PENDING', 'AVAILABLE'] } },
    }),
  ])

  return {
    books: {
      total: totalBooks,
      available: availableBooks,
      issued: issuedBooks,
      overdue: overdueBooks,
      reserved: reservedBooks,
      lost: lostBooks,
    },
    members: {
      total: totalMembers,
      active: activeMembers,
      expired: expiredMembers,
    },
    transactions: {
      today: todayTransactions,
      monthly: monthlyTransactions,
    },
    fines: {
      collected: totalFineCollection._sum.paidAmount || 0,
      pending: pendingFines._sum.amount || 0,
    },
    reservations: {
      active: totalReservations,
    },
  }
}

const getMonthlyTransactionChart = async () => {
  const months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const [issued, returned] = await Promise.all([
      prisma.transaction.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.transaction.count({
        where: {
          returnDate: { gte: start, lte: end },
          status: 'RETURNED',
        },
      }),
    ])

    months.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      issued,
      returned,
    })
  }

  return months
}

const getMonthlyFineChart = async () => {
  const months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const collected = await prisma.finePayment.aggregate({
      where: { paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    })

    months.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      collected: collected._sum.amount || 0,
    })
  }

  return months
}

const getCategoryDistribution = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { books: true } },
    },
    orderBy: { books: { _count: 'desc' } },
    take: 10,
  })

  return categories.map((cat) => ({
    name: cat.name,
    count: cat._count.books,
  }))
}

const getPopularBooks = async () => {
  const books = await prisma.book.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { copies: true } },
      authors: { include: { author: { select: { name: true } } } },
      category: { select: { name: true } },
    },
    orderBy: { copies: { _count: 'desc' } },
    take: 5,
  })

  return books
}

const getRecentActivities = async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return logs
}

const getBookAvailabilityChart = async () => {
  const [available, issued, reserved, lost, damaged] = await Promise.all([
    prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
    prisma.bookCopy.count({ where: { status: 'ISSUED' } }),
    prisma.bookCopy.count({ where: { status: 'RESERVED' } }),
    prisma.bookCopy.count({ where: { status: 'LOST' } }),
    prisma.bookCopy.count({ where: { status: 'DAMAGED' } }),
  ])

  return { available, issued, reserved, lost, damaged }
}

module.exports = {
  getDashboardStats,
  getMonthlyTransactionChart,
  getMonthlyFineChart,
  getCategoryDistribution,
  getPopularBooks,
  getRecentActivities,
  getBookAvailabilityChart,
}