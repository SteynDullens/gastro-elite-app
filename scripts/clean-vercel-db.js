const { PrismaClient } = require('@prisma/client');

// Use the Vercel database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://86092c421c99ec9e0a858de22b8581f3f90bd748743752c35824cbbe56ab8c3b:sk_KzMgKQTKAq83RIEkRARQZ@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function cleanVercelDatabase() {
  try {
    console.log('🔍 Force cleaning Vercel database directly...');
    await prisma.$connect();
    console.log('✅ Connected to Vercel database');

    // Get all users first
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('✅ Database is already clean');
      return;
    }
    
    // List users to be deleted
    console.log('👥 Users to be deleted:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    // Delete all data in the correct order
    console.log('🗑️  Force deleting all data...');
    
    // Delete recipes first
    const deletedRecipes = await prisma.recipe.deleteMany({});
    console.log(`✅ Deleted ${deletedRecipes.count} recipes`);
    
    // Delete users
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users`);
    
    console.log('🎉 Vercel database force cleaned successfully!');
    
    // Verify cleanup
    const remainingUsers = await prisma.user.count();
    console.log(`📊 Remaining users: ${remainingUsers}`);
    
  } catch (error) {
    console.error('❌ Error force cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanVercelDatabase();