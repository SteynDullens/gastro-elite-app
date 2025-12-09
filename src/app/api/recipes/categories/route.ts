import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await safeDbOperation(async (prisma) => {
      return await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
    });

    return NextResponse.json({ categories: categories || [] });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await safeDbOperation(async (prisma) => {
      return await prisma.category.create({
        data: { name }
      });
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}