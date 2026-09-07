import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { aralandPrisma?: PrismaClient };
export const db = globalForPrisma.aralandPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.aralandPrisma = db;
export { Prisma, PrismaClient } from '@prisma/client';
