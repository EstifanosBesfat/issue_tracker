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
  const statuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const categories = ['MOBILE_NETWORK', 'FIBER_BROADBAND', 'TELEBIRR_BILLING', 'CORE_INFRASTRUCTURE', 'OTHER'] as const;
  const departments = ['Network', 'IT', 'Customer Service', 'Finance', 'HR'];
  const userIds = [admin.id, staff1.id, staff2.id];

  const issuesData = Array.from({ length: 50 }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const reporterId = userIds[Math.floor(Math.random() * userIds.length)];
    // Randomly assign or leave unassigned
    const assigneeId = Math.random() > 0.3 ? userIds[Math.floor(Math.random() * userIds.length)] : undefined;
    // Random due date between today and 30 days from now, sometimes null
    const dueDate = Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined;
    
    // Distribute creation date across the last 60 days
    const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);

    return {
      title: `Auto-generated Incident Ticket #${i + 1} - ${category.replace('_', ' ')}`,
      description: `This is an auto-generated issue for testing pagination and performance. It relates to ${department} department and is categorized as ${category}.`,
      status,
      priority,
      category,
      department,
      reporterId,
      assigneeId,
      dueDate,
      createdAt,
    };
  });

  await prisma.issue.createMany({
    data: issuesData,
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
