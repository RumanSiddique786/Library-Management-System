const prisma = require('../config/database')

const getAllPublishers = async (query = {}) => {
  const { search = '', page = 1, limit = 10 } = query
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const [publishers, total] = await Promise.all([
    prisma.publisher.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.publisher.count({ where }),
  ])

  return { publishers, total }
}

const createPublisher = async (data, createdBy) => {
  const existing = await prisma.publisher.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    throw { statusCode: 400, message: 'Publisher already exists' }
  }

  const publisher = await prisma.publisher.create({
    data: {
      name: data.name,
      address: data.address,
      email: data.email,
      phone: data.phone,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'PUBLISHERS',
      description: `Created publisher ${publisher.name}`,
    },
  })

  return publisher
}

const updatePublisher = async (id, data, updatedBy) => {
  const publisher = await prisma.publisher.findUnique({
    where: { id: parseInt(id) },
  })

  if (!publisher) {
    throw { statusCode: 404, message: 'Publisher not found' }
  }

  const updated = await prisma.publisher.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      address: data.address,
      email: data.email,
      phone: data.phone,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'PUBLISHERS',
      description: `Updated publisher ${publisher.name}`,
    },
  })

  return updated
}

const deletePublisher = async (id, deletedBy) => {
  const publisher = await prisma.publisher.findUnique({
    where: { id: parseInt(id) },
    include: { _count: { select: { books: true } } },
  })

  if (!publisher) {
    throw { statusCode: 404, message: 'Publisher not found' }
  }

  if (publisher._count.books > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete publisher with books assigned',
    }
  }

  await prisma.publisher.delete({ where: { id: parseInt(id) } })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'PUBLISHERS',
      description: `Deleted publisher ${publisher.name}`,
    },
  })

  return { message: 'Publisher deleted successfully' }
}

module.exports = {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
}