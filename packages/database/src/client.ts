import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __ethioPrisma__: PrismaClient | undefined;
}

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__ethioPrisma__ ?? createPrismaClient(
  process.env.DATABASE_URL ??
    'postgresql://placeholder:placeholder@localhost:5432/placeholder',
);

if (process.env.NODE_ENV !== 'production') {
  globalThis.__ethioPrisma__ = prisma;
}

export default prisma;
