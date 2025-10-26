import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔍 Force cleaning Vercel database...');
    
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
      return NextResponse.json({
        success: true,
        message: 'Database is already clean',
        userCount: 0
      });
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
    
    return NextResponse.json({
      success: true,
      message: 'Database force cleaned successfully',
      deletedUsers: deletedUsers.count,
      deletedRecipes: deletedRecipes.count,
      remainingUsers
    });
    
  } catch (error) {
    console.error('❌ Error force cleaning database:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}
