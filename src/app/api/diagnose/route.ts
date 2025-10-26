import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Diagnosing Vercel database state...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total users: ${users.length}`);
    
    // Check for test users specifically
    const testUsers = users.filter(user => 
      user.email.includes('test') || 
      user.email.includes('gastro-elite.com')
    );
    
    console.log(`🧪 Test users: ${testUsers.length}`);
    
    // Check recipes
    const recipeCount = await prisma.recipe.count();
    console.log(`📝 Recipes: ${recipeCount}`);
    
    // Check environment variables
    console.log('🔧 Environment variables:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    return NextResponse.json({
      success: true,
      database: {
        totalUsers: users.length,
        testUsers: testUsers.length,
        recipes: recipeCount,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        }))
      },
      environment: {
        SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
        SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
        SMTP_USER: process.env.SMTP_USER || 'NOT SET',
        SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
      }
    });
    
  } catch (error) {
    console.error('❌ Vercel database diagnosis failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
