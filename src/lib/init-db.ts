import { testConnection, initializeDatabase } from './database';

async function initDatabase() {
  console.log('🚀 Initializing Gastro-Elite Database...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    // Initialize tables
    await initializeDatabase();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('📧 Admin credentials: admin@prohoreca.com / admin123!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

export default initDatabase;

