import 'dotenv/config';
import prisma from './client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database with demo data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ethiotelecom.et',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Abebe Kebede',
      email: 'staff1@ethiotelecom.et',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe',
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Aster Bekele',
      email: 'staff2@ethiotelecom.et',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aster',
    },
  });

  console.log('Created demo users.');

  // 2. Create Issues
  const issue1 = await prisma.issue.create({
    data: {
      title: 'Fiber cut near Bole area',
      description: 'Main fiber line seems to be damaged due to construction work near Bole road.',
      status: 'OPEN',
      priority: 'CRITICAL',
      category: 'FIBER_BROADBAND',
      department: 'Network',
      reporterId: admin.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      title: 'Telebirr payment gateway timeout',
      description: 'Users are reporting timeouts when trying to complete transactions via the mobile app.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'TELEBIRR_BILLING',
      department: 'IT',
      reporterId: staff1.id,
      assigneeId: staff2.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      title: 'Mobile network degraded in CMC',
      description: '4G speeds are significantly lower than usual in the CMC residential area.',
      status: 'CLOSED',
      priority: 'MEDIUM',
      category: 'MOBILE_NETWORK',
      department: 'Network',
      reporterId: staff2.id,
      assigneeId: staff1.id,
    },
  });

  console.log('Created demo issues.');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
