import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: companyId, employeeId } = await params;
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'DELETE FROM employee_links WHERE company_id = ? AND user_id = ?',
        [companyId, employeeId]
      );
      
      return NextResponse.json({ success: true });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error removing employee:', error);
    return NextResponse.json(
      { error: 'Failed to remove employee' },
      { status: 500 }
    );
  }
}








