// Use Prisma client instead of direct MySQL connection
import { prisma } from './prisma';

// Create a simple pool-like interface for compatibility
const pool = {
  getConnection: async () => {
    return {
      execute: async (query: string, params: any[] = []) => {
        // This is a simplified implementation for compatibility
        // In practice, you should use Prisma methods directly
        console.warn('Direct SQL queries are not recommended. Use Prisma methods instead.');
        return [[], []];
      },
      release: () => {},
      rollback: () => {},
      beginTransaction: () => {},
      commit: () => {}
    };
  }
};

// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Use Prisma to initialize the database
    await prisma.$connect();
    
    // Prisma handles schema management through migrations
    // Just ensure the database is connected
    console.log('✅ Database connected and schema is managed by Prisma');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export default pool;
