const prisma = require('../config/database')

const generateCopyCode = async (bookId) => {
  const count = await prisma.bookCopy.count({ where: { bookId } })
  return `COPY-${bookId}-${String(count + 1).padStart(3, '0')}`
}

const getAllBooks = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    categoryId = '',
    authorId = '',
    publisherId = '',
    languageId = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    deletedAt: null,
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { isbn: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
              { keywords: { contains: search, mode: 'insensitive' } },
              {
                authors: {
                  some: {
                    author: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {},
      categoryId ? { categoryId: parseInt(categoryId) } : {},
      publisherId ? { publisherId: parseInt(publisherId) } : {},
      languageId ? { languageId: parseInt(languageId) } : {},
      status ? { status } : {},
    ],
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
        language: { select: { id: true, name: true } },
        authors: {
          include: {
            author: { select: { id: true, name: true } },
          },
        },
        _count: { select: { copies: true } },
      },
    }),
    prisma.book.count({ where }),
  ])

  return { books, total }
}

const getBookById = async (id) => {
  const book = await prisma.book.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: {
      category: true,
      publisher: true,
      language: true,
      subject: true,
      vendor: true,
      authors: { include: { author: true } },
      copies: {
        include: { shelf: { include: { rack: { include: { floor: true } } } } },
      },
    },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Book not found' }
  }

  return book
}

const createBook = async (data, coverImage, createdBy) => {
  if (data.isbn) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    })
    if (existing) {
      throw { statusCode: 400, message: 'ISBN already exists' }
    }
  }

  const book = await prisma.book.create({
    data: {
      isbn: data.isbn || null,
      barcode: data.barcode || null,
      title: data.title,
      subtitle: data.subtitle,
      edition: data.edition,
      volume: data.volume,
      pages: data.pages ? parseInt(data.pages) : null,
      price: data.price ? parseFloat(data.price) : null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      description: data.description,
      keywords: data.keywords,
      coverImage: coverImage || null,
      categoryId: parseInt(data.categoryId),
      publisherId: data.publisherId ? parseInt(data.publisherId) : null,
      languageId: data.languageId ? parseInt(data.languageId) : null,
      subjectId: data.subjectId ? parseInt(data.subjectId) : null,
      vendorId: data.vendorId ? parseInt(data.vendorId) : null,
      status: 'AVAILABLE',
      authors: data.authorIds
        ? {
            create: data.authorIds.map((authorId) => ({
              authorId: parseInt(authorId),
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      authors: { include: { author: true } },
    },
  })

// Auto create copies if count provided
if (data.copies && parseInt(data.copies) > 0) {
  const copiesCount = parseInt(data.copies)
  const existingCount = await prisma.bookCopy.count({ where: { bookId: book.id } })
  const copiesData = []
  for (let i = 0; i < copiesCount; i++) {
    const copyNumber = existingCount + i + 1
    copiesData.push({
      copyCode: `COPY-${book.id}-${String(copyNumber).padStart(3, '0')}`,
      bookId: book.id,
      condition: 'GOOD',
      status: 'AVAILABLE',
    })
  }
  await prisma.bookCopy.createMany({ data: copiesData })
}

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'BOOKS',
      description: `Created book "${book.title}"`,
    },
  })

  return book
}

const updateBook = async (id, data, coverImage, updatedBy) => {
  const book = await prisma.book.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Book not found' }
  }

  if (data.isbn && data.isbn !== book.isbn) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    })
    if (existing) {
      throw { statusCode: 400, message: 'ISBN already exists' }
    }
  }

  // Update authors if provided
  if (data.authorIds) {
    await prisma.bookAuthor.deleteMany({ where: { bookId: parseInt(id) } })
    await prisma.bookAuthor.createMany({
      data: data.authorIds.map((authorId) => ({
        bookId: parseInt(id),
        authorId: parseInt(authorId),
      })),
    })
  }

  const updated = await prisma.book.update({
    where: { id: parseInt(id) },
    data: {
      isbn: data.isbn,
      title: data.title,
      subtitle: data.subtitle,
      edition: data.edition,
      volume: data.volume,
      pages: data.pages ? parseInt(data.pages) : undefined,
      price: data.price ? parseFloat(data.price) : undefined,
      description: data.description,
      keywords: data.keywords,
      coverImage: coverImage || book.coverImage,
      categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
      publisherId: data.publisherId ? parseInt(data.publisherId) : undefined,
      languageId: data.languageId ? parseInt(data.languageId) : undefined,
    },
    include: {
      category: true,
      authors: { include: { author: true } },
      copies: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'BOOKS',
      description: `Updated book "${book.title}"`,
    },
  })

  return updated
}

const softDeleteBook = async (id, deletedBy) => {
  const book = await prisma.book.findFirst({
    where: { id: parseInt(id), deletedAt: null },
    include: {
      copies: { where: { status: 'ISSUED' } },
    },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Book not found' }
  }

  if (book.copies.length > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete book with issued copies',
    }
  }

  await prisma.book.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'BOOKS',
      description: `Soft deleted book "${book.title}"`,
    },
  })

  return { message: 'Book deleted successfully' }
}

const restoreBook = async (id, restoredBy) => {
  const book = await prisma.book.findFirst({
    where: { id: parseInt(id), deletedAt: { not: null } },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Deleted book not found' }
  }

  await prisma.book.update({
    where: { id: parseInt(id) },
    data: { deletedAt: null },
  })

  await prisma.auditLog.create({
    data: {
      userId: restoredBy,
      action: 'UPDATE',
      module: 'BOOKS',
      description: `Restored book "${book.title}"`,
    },
  })

  return { message: 'Book restored successfully' }
}

const addBookCopy = async (bookId, data, createdBy) => {
  const book = await prisma.book.findFirst({
    where: { id: parseInt(bookId), deletedAt: null },
  })

  if (!book) {
    throw { statusCode: 404, message: 'Book not found' }
  }

  const copyCode = await generateCopyCode(parseInt(bookId))

  const copy = await prisma.bookCopy.create({
    data: {
      copyCode,
      bookId: parseInt(bookId),
      shelfId: data.shelfId ? parseInt(data.shelfId) : null,
      condition: data.condition || 'GOOD',
      status: 'AVAILABLE',
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'BOOKS',
      description: `Added copy ${copyCode} for book "${book.title}"`,
    },
  })

  return copy
}

const searchBooks = async (query) => {
  const { q = '', filter = '', categoryId = '' } = query

  const where = {
    deletedAt: null,
    AND: [
      // Only apply text search if q is provided
      q.length > 0 ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { isbn: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
          { keywords: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          {
            authors: {
              some: {
                author: { name: { contains: q, mode: 'insensitive' } }
              }
            }
          },
          {
            publisher: { name: { contains: q, mode: 'insensitive' } }
          }
        ]
      } : {},
      filter === 'available'
        ? { copies: { some: { status: 'AVAILABLE' } } } : {},
      filter === 'issued'
        ? { copies: { some: { status: 'ISSUED' } } } : {},
      categoryId
        ? { categoryId: parseInt(categoryId) } : {},
    ]
  }

  return await prisma.book.findMany({
    where,
    take: 50,
    include: {
      category: { select: { id: true, name: true } },
      authors: {
        include: { author: { select: { id: true, name: true } } }
      },
      publisher: { select: { id: true, name: true } },
      _count: { select: { copies: true } },
      copies: {
        select: {
          id: true,
          copyCode: true,
          status: true,
          condition: true
        }
      }
    },
    orderBy: { title: 'asc' }
  })
}

const getDeletedBooks = async () => {
  return await prisma.book.findMany({
    where: { deletedAt: { not: null } },
    include: {
      category: { select: { id: true, name: true } },
      authors: { include: { author: { select: { id: true, name: true } } } },
    },
  })
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  softDeleteBook,
  restoreBook,
  addBookCopy,
  searchBooks,
  getDeletedBooks,
}