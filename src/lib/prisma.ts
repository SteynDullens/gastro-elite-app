// Re-export from unified database connection handler
export { getPrisma, safeDbOperation, testConnection, getDbStatus, disconnect } from './db-connection';

// Get Prisma instance - this will be null if DEV_MODE_NO_DB is enabled
import { getPrisma } from './db-connection';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof getPrisma> | undefined;
};

// Use the unified connection handler
const prismaInstance = getPrisma();
export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

