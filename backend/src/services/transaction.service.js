const prisma = require('../config/database')

// Calculate fine amount
const calculateFine = async (dueDate, returnDate, memberTypeId) => {
  const memberType = await prisma.memberType.findUnique({
    where: { id: memberTypeId },
  })

  const due = new Date(dueDate)
  const returned = returnDate ? new Date(returnDate) : new Date()

  if (returned <= due) return 0

  const diffTime = returned.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const finePerDay = parseFloat(memberType.finePerDay)

  return diffDays * finePerDay
}

// Issue Book
const issueBook = async (data, issuedById) => {
  const { memberId, bookCopyId } = data

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

  // Check pending fines
  const pendingFines = await prisma.fine.count({
    where: {
      memberId: parseInt(memberId),
      status: { in: ['PENDING', 'PARTIAL'] },
    },
  })

  if (pendingFines > 0) {
    throw { statusCode: 400, message: 'Member has pending fines' }
  }

  // Check max books limit
  const activeTransactions = await prisma.transaction.count({
    where: {
      memberId: parseInt(memberId),
      status: 'ACTIVE',
    },
  })

  if (activeTransactions >= member.memberType.maxBooks) {
    throw {
      statusCode: 400,
      message: `Member has reached maximum book limit of ${member.memberType.maxBooks}`,
    }
  }

  // Check book copy
  const bookCopy = await prisma.bookCopy.findUnique({
    where: { id: parseInt(bookCopyId) },
    include: { book: true },
  })

  if (!bookCopy) {
    throw { statusCode: 404, message: 'Book copy not found' }
  }

  if (bookCopy.status !== 'AVAILABLE') {
    throw {
      statusCode: 400,
      message: `Book copy is not available. Current status: ${bookCopy.status}`,
    }
  }

  // Calculate due date
  const issueDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + member.memberType.maxDays)

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      memberId: parseInt(memberId),
      issuedById,
      issueDate,
      dueDate,
      status: 'ACTIVE',
      items: {
        create: {
          bookCopyId: parseInt(bookCopyId),
        },
      },
    },
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      issuedBy: { select: { id: true, name: true } },
      items: {
        include: {
          bookCopy: {
            include: { book: { select: { id: true, title: true, isbn: true } } },
          },
        },
      },
    },
  })

  // Update book copy status
  await prisma.bookCopy.update({
    where: { id: parseInt(bookCopyId) },
    data: { status: 'ISSUED' },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: issuedById,
      action: 'ISSUE',
      module: 'TRANSACTIONS',
      description: `Issued book "${bookCopy.book.title}" to member ${member.name}`,
    },
  })

  return transaction
}

// Return Book
const returnBook = async (transactionId, data, returnedById) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(transactionId) },
    include: {
      member: { include: { memberType: true } },
      items: {
        include: {
          bookCopy: { include: { book: true } },
        },
      },
    },
  })

  if (!transaction) {
    throw { statusCode: 404, message: 'Transaction not found' }
  }

  if (transaction.status !== 'ACTIVE' && transaction.status !== 'OVERDUE') {
    throw { statusCode: 400, message: 'Transaction is already closed' }
  }

  const returnDate = new Date()

  // Calculate fine
  const fineAmount = await calculateFine(
    transaction.dueDate,
    returnDate,
    transaction.member.memberTypeId
  )

  // Update transaction items
  for (const item of transaction.items) {
    await prisma.transactionItem.update({
      where: { id: item.id },
      data: {
        returnDate,
        condition: data.condition || 'GOOD',
      },
    })

    // Update book copy status
    let copyStatus = 'AVAILABLE'
    if (data.condition === 'LOST') copyStatus = 'LOST'
    else if (data.condition === 'DAMAGED') copyStatus = 'DAMAGED'

    await prisma.bookCopy.update({
      where: { id: item.bookCopyId },
      data: {
        status: copyStatus,
        condition: data.condition || 'GOOD',
      },
    })
  }

  // Update transaction
  await prisma.transaction.update({
    where: { id: parseInt(transactionId) },
    data: {
      returnDate,
      status: 'RETURNED',
    },
  })

  // Create fine if applicable
  let fine = null
  if (fineAmount > 0) {
    fine = await prisma.fine.create({
      data: {
        memberId: transaction.memberId,
        transactionId: parseInt(transactionId),
        type: 'LATE_RETURN',
        amount: fineAmount,
        status: 'PENDING',
        reason: `Late return fine - ${Math.ceil(
          (returnDate - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24)
        )} days overdue`,
      },
    })
  }

  // Handle lost book fine
  if (data.condition === 'LOST') {
    const lostFineAmount = transaction.items.reduce((sum, item) => {
      return sum + parseFloat(item.bookCopy.book.price || 0)
    }, 0)

    if (lostFineAmount > 0) {
      await prisma.fine.create({
        data: {
          memberId: transaction.memberId,
          transactionId: parseInt(transactionId),
          type: 'LOST_BOOK',
          amount: lostFineAmount,
          status: 'PENDING',
          reason: 'Lost book replacement cost',
        },
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: returnedById,
      action: 'RETURN',
      module: 'TRANSACTIONS',
      description: `Returned book for transaction #${transactionId}`,
    },
  })

  return {
    transaction,
    fineAmount,
    fine,
    message: fineAmount > 0
      ? `Book returned with fine of ₹${fineAmount}`
      : 'Book returned successfully',
  }
}

// Renew Book
const renewBook = async (transactionId, renewedById) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(transactionId) },
    include: {
      member: { include: { memberType: true } },
      renewals: true,
    },
  })

  if (!transaction) {
    throw { statusCode: 404, message: 'Transaction not found' }
  }

  if (transaction.status !== 'ACTIVE' && transaction.status !== 'OVERDUE') {
   throw { statusCode: 400, message: 'Transaction is already closed' }
  }

  // Check renewal limit
  const renewalCount = transaction.renewals.length
  const renewalLimit = transaction.member.memberType.renewalLimit

  if (renewalCount >= renewalLimit) {
    throw {
      statusCode: 400,
      message: `Renewal limit of ${renewalLimit} reached`,
    }
  }

  // Check for existing fine
  const fineAmount = await calculateFine(
    transaction.dueDate,
    new Date(),
    transaction.member.memberTypeId
  )

  if (fineAmount > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot renew book with overdue fine. Please pay fine first.',
    }
  }

  // Calculate new due date
  const newDueDate = new Date()
  newDueDate.setDate(
    newDueDate.getDate() + transaction.member.memberType.maxDays
  )

  // Create renewal record
  await prisma.renewal.create({
    data: {
      transactionId: parseInt(transactionId),
      newDueDate,
      renewedById,
    },
  })

  // Update transaction due date
  const updatedTransaction = await prisma.transaction.update({
    where: { id: parseInt(transactionId) },
    data: { dueDate: newDueDate },
    include: {
      member: { select: { id: true, name: true, memberId: true } },
      items: {
        include: {
          bookCopy: {
            include: { book: { select: { id: true, title: true } } },
          },
        },
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: renewedById,
      action: 'RENEW',
      module: 'TRANSACTIONS',
      description: `Renewed transaction #${transactionId}. New due date: ${newDueDate.toDateString()}`,
    },
  })

  return updatedTransaction
}

// Get All Transactions
const getAllTransactions = async (query) => {
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

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
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
        fines: true,
        renewals: true,
      },
    }),
    prisma.transaction.count({ where }),
  ])

  return { transactions, total }
}

// Get Transaction By ID
const getTransactionById = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      member: true,
      issuedBy: { select: { id: true, name: true } },
      items: {
        include: {
          bookCopy: { include: { book: true } },
        },
      },
      fines: true,
      renewals: true,
    },
  })

  if (!transaction) {
    throw { statusCode: 404, message: 'Transaction not found' }
  }

  return transaction
}

// Get Overdue Transactions
const getOverdueTransactions = async () => {
  const now = new Date()

  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'ACTIVE',
      dueDate: { lt: now },
    },
    include: {
      member: { select: { id: true, name: true, memberId: true, email: true } },
      items: {
        include: {
          bookCopy: {
            include: { book: { select: { id: true, title: true } } },
          },
        },
      },
    },
  })

  // Update status to OVERDUE
  await prisma.transaction.updateMany({
    where: {
      status: 'ACTIVE',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  })

  return transactions
}

module.exports = {
  issueBook,
  returnBook,
  renewBook,
  getAllTransactions,
  getTransactionById,
  getOverdueTransactions,
  calculateFine,
}