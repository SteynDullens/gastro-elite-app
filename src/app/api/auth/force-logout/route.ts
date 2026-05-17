import { NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/app-url';

// Force logout by clearing the auth cookie
export async function GET() {
  const response = NextResponse.redirect(new URL('/', getAppUrl()));
  
  // Clear the auth token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
  
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the auth token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
  
  return response;
}



