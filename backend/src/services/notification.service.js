const prisma = require('../config/database')
const { sendEmail } = require('../config/email')
const {
  welcomeEmail,
  dueReminderEmail,
  overdueEmail,
  membershipExpiryEmail,
  fineReceiptEmail,
} = require('../utils/emailTemplates')

// Create notification record
const createNotification = async (data) => {
  return await prisma.notification.create({
    data: {
      memberId: data.memberId || null,
      type: data.type,
      title: data.title,
      message: data.message,
    },
  })
}

// Send welcome email to new member
const sendWelcomeEmail = async (member) => {
  try {
    await sendEmail({
      to: member.email,
      subject: 'Welcome to the Library!',
      html: welcomeEmail(member.name, member.memberId, member.expiryDate),
    })

    await createNotification({
      memberId: member.id,
      type: 'GENERAL',
      title: 'Welcome to the Library',
      message: `Welcome ${member.name}! Your membership ID is ${member.memberId}`,
    })

    console.log(`Welcome email sent to ${member.email}`)
  } catch (error) {
    console.error('Failed to send welcome email:', error.message)
  }
}

// Send due reminder emails (books due in 2 days)
const sendDueReminders = async () => {
  try {
    const twoDaysLater = new Date()
    twoDaysLater.setDate(twoDaysLater.getDate() + 2)
    twoDaysLater.setHours(23, 59, 59, 999)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: tomorrow,
          lte: twoDaysLater,
        },
      },
      include: {
        member: true,
        items: {
          include: {
            bookCopy: { include: { book: true } },
          },
        },
      },
    })

    for (const transaction of transactions) {
      const books = transaction.items.map((item) => ({
        title: item.bookCopy.book.title,
        copyCode: item.bookCopy.copyCode,
      }))

      await sendEmail({
        to: transaction.member.email,
        subject: 'Book Due Reminder',
        html: dueReminderEmail(
          transaction.member.name,
          books,
          transaction.dueDate
        ),
      })

      await createNotification({
        memberId: transaction.memberId,
        type: 'DUE_REMINDER',
        title: 'Book Due Reminder',
        message: `Your book(s) are due on ${new Date(transaction.dueDate).toLocaleDateString()}`,
      })
    }

    console.log(`Due reminders sent: ${transactions.length}`)
    return transactions.length
  } catch (error) {
    console.error('Due reminder error:', error.message)
  }
}

// Send overdue notifications
const sendOverdueNotifications = async () => {
  try {
    const overdueTransactions = await prisma.transaction.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      include: {
        member: { include: { memberType: true } },
        items: {
          include: {
            bookCopy: { include: { book: true } },
          },
        },
        fines: true, // ← include existing fines
      },
    })

    for (const transaction of overdueTransactions) {
      const books = transaction.items.map((item) => ({
        title: item.bookCopy.book.title,
        dueDate: transaction.dueDate,
      }))

      const daysOverdue = Math.ceil(
        (new Date() - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24)
      )

      const fineAmount =
        daysOverdue * parseFloat(transaction.member.memberType.finePerDay)

      // ← CREATE Fine record in database if not already exists
      const existingFine = transaction.fines.find(
        f => f.type === 'LATE_RETURN' && f.status !== 'PAID' && f.status !== 'WAIVED'
      )

      if (!existingFine && fineAmount > 0) {
        await prisma.fine.create({
          data: {
            memberId: transaction.memberId,
            transactionId: transaction.id,
            type: 'LATE_RETURN',
            amount: fineAmount,
            paidAmount: 0,
            status: 'PENDING',
            reason: `Late return fine - ${daysOverdue} days overdue`,
          },
        })
      } else if (existingFine && fineAmount > parseFloat(existingFine.amount)) {
        // Update fine amount if it has grown
        await prisma.fine.update({
          where: { id: existingFine.id },
          data: {
            amount: fineAmount,
            reason: `Late return fine - ${daysOverdue} days overdue`,
          },
        })
      }

      // Send email
      try {
        await sendEmail({
          to: transaction.member.email,
          subject: 'Overdue Books Notice',
          html: overdueEmail(transaction.member.name, books, fineAmount),
        })
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message)
      }

      // Create notification record
      await prisma.notification.create({
        data: {
          memberId: transaction.memberId,
          type: 'OVERDUE',
          title: 'Overdue Books',
          message: `You have overdue books. Current fine: ₹${fineAmount}`,
        },
      })

      // Update status to OVERDUE
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'OVERDUE' },
      })
    }

    console.log(`Overdue notifications sent: ${overdueTransactions.length}`)
    return overdueTransactions.length
  } catch (error) {
    console.error('Overdue notification error:', error.message)
    return 0
  }
}

// Send membership expiry notifications (expires in 7 days)
const sendMembershipExpiryNotifications = async () => {
  try {
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    sevenDaysLater.setHours(23, 59, 59, 999)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiringMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          gte: today,
          lte: sevenDaysLater,
        },
      },
    })

    for (const member of expiringMembers) {
      await sendEmail({
        to: member.email,
        subject: 'Membership Expiry Notice',
        html: membershipExpiryEmail(member.name, member.expiryDate),
      })

      await createNotification({
        memberId: member.id,
        type: 'MEMBERSHIP_EXPIRY',
        title: 'Membership Expiring Soon',
        message: `Your membership expires on ${new Date(member.expiryDate).toLocaleDateString()}`,
      })
    }

    console.log(`Membership expiry notifications sent: ${expiringMembers.length}`)
    return expiringMembers.length
  } catch (error) {
    console.error('Membership expiry notification error:', error.message)
  }
}

// Get all notifications
const getAllNotifications = async (query) => {
  const { page = 1, limit = 10, memberId = '', type = '', isRead = '' } = query
  const skip = (page - 1) * limit

  const where = {
    AND: [
      memberId ? { memberId: parseInt(memberId) } : {},
      type ? { type } : {},
      isRead !== '' ? { isRead: isRead === 'true' } : {},
    ],
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ])

  return { notifications, total }
}

// Mark notification as read
const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id: parseInt(id) },
    data: { isRead: true, sentAt: new Date() },
  })
}

// Mark all as read for a member
const markAllAsRead = async (memberId) => {
  return await prisma.notification.updateMany({
    where: { memberId: parseInt(memberId), isRead: false },
    data: { isRead: true },
  })
}

module.exports = {
  sendWelcomeEmail,
  sendDueReminders,
  sendOverdueNotifications,
  sendMembershipExpiryNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
}