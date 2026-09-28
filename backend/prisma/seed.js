const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Super Administrator' },
  })

  const librarianRole = await prisma.role.upsert({
    where: { name: 'LIBRARIAN' },
    update: {},
    create: { name: 'LIBRARIAN', description: 'Librarian' },
  })

  const assistantRole = await prisma.role.upsert({
    where: { name: 'ASSISTANT_LIBRARIAN' },
    update: {},
    create: { name: 'ASSISTANT_LIBRARIAN', description: 'Assistant Librarian' },
  })

  const memberRole = await prisma.role.upsert({
    where: { name: 'MEMBER' },
    update: {},
    create: { name: 'MEMBER', description: 'Library Member' },
  })

  console.log('✅ Roles created')

  // Create Super Admin User
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@library.com',
      password: hashedPassword,
      mobile: '1234567890',
      roleId: superAdminRole.id,
      status: 'ACTIVE',
    },
  })

  console.log('✅ Super Admin created')

  // Create Member Types
  await prisma.memberType.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: {
      name: 'STUDENT',
      maxBooks: 3,
      maxDays: 14,
      finePerDay: 1.00,
      renewalLimit: 2,
    },
  })

  await prisma.memberType.upsert({
    where: { name: 'FACULTY' },
    update: {},
    create: {
      name: 'FACULTY',
      maxBooks: 10,
      maxDays: 30,
      finePerDay: 0.50,
      renewalLimit: 3,
    },
  })

  await prisma.memberType.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      maxBooks: 5,
      maxDays: 21,
      finePerDay: 1.00,
      renewalLimit: 2,
    },
  })

  console.log('✅ Member types created')

  // Create Library Settings
  await prisma.librarySetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      libraryName: 'My Library',
      address: '123 Library Street',
      contact: '1234567890',
      email: 'library@example.com',
      maxBooksPerMember: 3,
      finePerDay: 1.00,
      membershipDuration: 365,
      workingDays: 'MON,TUE,WED,THU,FRI,SAT',
    },
  })

  console.log('✅ Library settings created')
  console.log('🎉 Seeding complete!')
  console.log('📧 Admin Email: admin@library.com')
  console.log('🔑 Admin Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })