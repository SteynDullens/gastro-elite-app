import { PrismaClient } from '@prisma/client';

// Database connection state
let prismaInstance: PrismaClient | null = null;
let isConnected = false;
let connectionError: Error | null = null;

// Development mode flag - allows app to run without DB
const DEV_MODE_NO_DB = process.env.DEV_MODE_NO_DB === 'true';

/**
 * Get Prisma client instance with graceful error handling
 */
export function getPrisma(): PrismaClient | null {
  if (DEV_MODE_NO_DB) {
    console.log('⚠️  Running in DEV_MODE_NO_DB - database operations disabled');
    return null;
  }

  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (error) {
      console.error('Failed to create Prisma client:', error);
      connectionError = error as Error;
      return null;
    }
  }

  return prismaInstance;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  if (DEV_MODE_NO_DB) {
    console.log('⚠️  DEV_MODE_NO_DB enabled - skipping database connection test');
    return true; // Return true so app can continue
  }

  const prisma = getPrisma();
  if (!prisma) {
    return false;
  }

  try {
    await prisma.$connect();
    isConnected = true;
    connectionError = null;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error as Error;
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Execute database operation with graceful error handling
 */
export async function safeDbOperation<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  fallback?: () => T
): Promise<T | null> {
  if (DEV_MODE_NO_DB) {
    console.log('⚠️  DEV_MODE_NO_DB - using fallback for database operation');
    return fallback ? fallback() : null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    console.warn('⚠️  Prisma client not available - using fallback');
    return fallback ? fallback() : null;
  }

  try {
    return await operation(prisma);
  } catch (error) {
    console.error('Database operation failed:', error);
    connectionError = error as Error;
    
    // Try to reconnect once
    if (!isConnected) {
      const reconnected = await testConnection();
      if (reconnected) {
        try {
          return await operation(prisma);
        } catch (retryError) {
          console.error('Database operation failed after retry:', retryError);
        }
      }
    }

    return fallback ? fallback() : null;
  }
}

/**
 * Get database connection status
 */
export function getDbStatus() {
  return {
    connected: isConnected,
    error: connectionError?.message || null,
    devMode: DEV_MODE_NO_DB
  };
}

/**
 * Disconnect from database (cleanup)
 */
export async function disconnect(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}

// Export prisma instance for direct use (when you're sure DB is available)
export const prisma = getPrisma();

