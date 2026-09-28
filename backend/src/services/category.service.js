const prisma = require('../config/database')

const getAllCategories = async (query = {}) => {
  const { search = '', parentId = '' } = query

  const where = {
    AND: [
      search ? { name: { contains: search, mode: 'insensitive' } } : {},
      parentId === 'null'
        ? { parentId: null }
        : parentId
        ? { parentId: parseInt(parentId) }
        : {},
    ],
  }

  return await prisma.category.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { books: true } },
    },
    orderBy: { name: 'asc' },
  })
}

const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { books: true } },
    },
  })

  if (!category) {
    throw { statusCode: 404, message: 'Category not found' }
  }

  return category
}

const createCategory = async (data, createdBy) => {
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    throw { statusCode: 400, message: 'Category already exists' }
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      parentId: data.parentId ? parseInt(data.parentId) : null,
      image: data.image || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'CREATE',
      module: 'CATEGORIES',
      description: `Created category ${category.name}`,
    },
  })

  return category
}

const updateCategory = async (id, data, updatedBy) => {
  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
  })

  if (!category) {
    throw { statusCode: 404, message: 'Category not found' }
  }

  const updated = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      parentId: data.parentId ? parseInt(data.parentId) : null,
      image: data.image,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      module: 'CATEGORIES',
      description: `Updated category ${category.name}`,
    },
  })

  return updated
}

const deleteCategory = async (id, deletedBy) => {
  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: { _count: { select: { books: true } } },
  })

  if (!category) {
    throw { statusCode: 404, message: 'Category not found' }
  }

  if (category._count.books > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete category with books assigned to it',
    }
  }

  await prisma.category.delete({ where: { id: parseInt(id) } })

  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'DELETE',
      module: 'CATEGORIES',
      description: `Deleted category ${category.name}`,
    },
  })

  return { message: 'Category deleted successfully' }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}