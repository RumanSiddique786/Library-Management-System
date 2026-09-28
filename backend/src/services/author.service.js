const prisma = require('../config/database')

const getAllAuthors = async (query = {}) => {
  const { search = '', page = 1, limit = 10 } = query
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nationality: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.author.count({ where }),
  ])

  return { authors, total }
}

const getAuthorById = async (id) => {
  const author = await prisma.author.findUnique({
    where: { id: parseInt(id) },
    include: {
      books: {
        include: {
          book: {
            select: { id: true, title: true, coverImage: true },
          },
        },
      },
    },
  })

  if (!author) {
    throw { statusCode: 404, message: 'Author not found' }
  }

  return author
}

const createAuthor = async (data, photo, createdBy) => {
  const author = await prisma.author.create({
    data: {
      name: data.name,
      biography: data.biography,
      nationality: data.nationality,
      photo: photo || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'AUTHORS',
      description: `Created author ${author.name}`,
    },
  })

  return author
}

const updateAuthor = async (id, data, photo, updatedBy) => {
  const author = await prisma.author.findUnique({
    where: { id: parseInt(id) },
  })

  if (!author) {
    throw { statusCode: 404, message: 'Author not found' }
  }

  const updated = await prisma.author.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      biography: data.biography,
      nationality: data.nationality,
      photo: photo || author.photo,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'AUTHORS',
      description: `Updated author ${author.name}`,
    },
  })

  return updated
}

const deleteAuthor = async (id, deletedBy) => {
  const author = await prisma.author.findUnique({
    where: { id: parseInt(id) },
    include: { _count: { select: { books: true } } },
  })

  if (!author) {
    throw { statusCode: 404, message: 'Author not found' }
  }

  if (author._count.books > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete author with books assigned',
    }
  }

  await prisma.author.delete({ where: { id: parseInt(id) } })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'AUTHORS',
      description: `Deleted author ${author.name}`,
    },
  })

  return { message: 'Author deleted successfully' }
}

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
}