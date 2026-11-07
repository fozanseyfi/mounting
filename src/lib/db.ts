import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const isDbConfigured = Boolean(process.env.DATABASE_URL);

/**
 * Runs a DB query; if the DB is not configured or unreachable, logs the error
 * and returns the fallback so pages render instead of crashing.
 */
export async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<{ data: T; dbError: boolean }> {
  if (!isDbConfigured) return { data: fallback, dbError: true };
  try {
    return { data: await query(), dbError: false };
  } catch (err) {
    console.error('[db] query failed:', err);
    return { data: fallback, dbError: true };
  }
}
