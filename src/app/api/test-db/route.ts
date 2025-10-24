import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing database connection from Vercel...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count all users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // List all users
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
    
    console.log('👥 Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.createdAt.toISOString()}`);
    });
    
    return NextResponse.json({
      success: true,
      userCount,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
