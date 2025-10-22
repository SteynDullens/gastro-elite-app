import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const connection = await pool.getConnection();
    
    try {
      const [employees] = await connection.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, el.status, el.createdAt
         FROM employee_links el
         JOIN users u ON el.user_id = u.id
         WHERE el.company_id = ?
         ORDER BY el.createdAt DESC`,
        [companyId]
      );
      
      return NextResponse.json({ employees });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (!(users as any[]).length) {
        return NextResponse.json(
          { error: 'User with this email does not exist' },
          { status: 404 }
        );
      }
      
      const userId = (users as any[])[0].id;
      
      // Check if employee link already exists
      const [existingLinks] = await connection.execute(
        'SELECT id FROM employee_links WHERE company_id = ? AND user_id = ?',
        [companyId, userId]
      );
      
      if ((existingLinks as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Employee already linked to this company' },
          { status: 400 }
        );
      }
      
      // Create employee link
      await connection.execute(
        'INSERT INTO employee_links (company_id, user_id, status) VALUES (?, ?, "pending")',
        [companyId, userId]
      );
      
      return NextResponse.json({ success: true });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error adding employee:', error);
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
}








