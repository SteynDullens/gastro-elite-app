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
      const [companies] = await connection.execute(
        'SELECT * FROM companies WHERE id = ?',
        [companyId]
      );
      
      if (!(companies as any[]).length) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json((companies as any[])[0]);
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}








