import { PrismaClient } from '@prisma/client';

// Database connection state
let prismaInstance: PrismaClient | null = null;
let isConnected = false;
let connectionError: Error | null = null;
let lastConnectionTime = 0;

// Development mode flag - allows app to run without DB
const DEV_MODE_NO_DB = process.env.DEV_MODE_NO_DB === 'true';

// Connection refresh interval (4 minutes - before typical 5min timeout)
const CONNECTION_REFRESH_INTERVAL = 4 * 60 * 1000;

/**
 * Get Prisma client instance with graceful error handling
 * Creates a new instance if the connection might be stale
 */
export function getPrisma(): PrismaClient | null {
  if (DEV_MODE_NO_DB) {
    console.log('⚠️  Running in DEV_MODE_NO_DB - database operations disabled');
    return null;
  }

  const now = Date.now();
  const connectionAge = now - lastConnectionTime;
  
  // If connection is potentially stale, create a new client
  if (prismaInstance && connectionAge > CONNECTION_REFRESH_INTERVAL) {
    console.log('🔄 Refreshing Prisma connection (age: ' + Math.round(connectionAge / 1000) + 's)');
    prismaInstance.$disconnect().catch(() => {});
    prismaInstance = null;
    isConnected = false;
  }

  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      lastConnectionTime = now;
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

  let prisma = getPrisma();
  if (!prisma) {
    console.warn('⚠️  Prisma client not available - using fallback');
    return fallback ? fallback() : null;
  }

  try {
    const result = await operation(prisma);
    isConnected = true;
    lastConnectionTime = Date.now();
    return result;
  } catch (error: any) {
    console.error('Database operation failed:', error.message);
    
    // Check if it's a connection error that we should retry
    const isConnectionError = 
      error.message?.includes('connect') ||
      error.message?.includes('timed out') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('closed') ||
      error.code === 'P1001' ||
      error.code === 'P1002' ||
      error.code === 'P2024';
    
    // Only treat as connection error if it's actually a connection issue
    // Business logic errors (like "Company not found") should not be treated as connection errors
    const isBusinessLogicError = 
      error.message?.includes('Company not found') ||
      error.message?.includes('uitnodiging') ||
      error.message?.includes('gebruiker') ||
      error.message?.includes('team') ||
      error.message?.includes('bedrijfsaccount') ||
      error.message?.includes('permission') ||
      error.message?.includes('Permission');
    
    if (isConnectionError && !isBusinessLogicError) {
      connectionError = error as Error;
      isConnected = false;
      console.log('🔄 Connection error detected, attempting reconnect...');
      
      // Force create a new client
      if (prismaInstance) {
        prismaInstance.$disconnect().catch(() => {});
        prismaInstance = null;
      }
      
      prisma = getPrisma();
      if (prisma) {
        try {
          const result = await operation(prisma);
          console.log('✅ Reconnection successful');
          isConnected = true;
          lastConnectionTime = Date.now();
          return result;
        } catch (retryError: any) {
          console.error('Database operation failed after retry:', retryError.message);
          connectionError = retryError as Error;
          isConnected = false;
        }
      }
    } else if (!isBusinessLogicError) {
      // For other errors, still mark as connection error but don't retry
      connectionError = error as Error;
      isConnected = false;
    } else {
      // Business logic errors - store them but don't mark as connection failure
      connectionError = error as Error;
      // Don't set isConnected = false for business logic errors
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

