/**
 * Run: npx tsx prisma/make-admin.ts your@email.com
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // List all users if no argument given
  const email = process.argv[2];

  if (!email) {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    console.log('\nCurrent users:');
    console.table(users);
    console.log('\nUsage: npx tsx prisma/make-admin.ts <email>');
    return;
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`\n✅ ${user.name ?? user.email} is now ADMIN`);
  console.table(user);
}

main()
  .catch((e) => { console.error('Error:', e.message); })
  .finally(() => prisma.$disconnect());
