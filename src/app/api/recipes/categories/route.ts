import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaults = [
      'Voorgerecht',
      'Tussengerecht',
      'Hoofdgerecht',
      'Dessert',
      'Groentegarnituur',
      'Vlees',
      'Vis',
      'Vegetarisch',
      'Zetmeelgarnituur',
    ];

    const existing = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const existingLower = new Set(existing.map((c) => c.name.toLowerCase()));
    const missing = defaults.filter((d) => !existingLower.has(d.toLowerCase()));

    if (missing.length > 0) {
      await prisma.category.createMany({
        data: missing.map((name) => ({ name })),
      });
    }

    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { oldName, newName } = await request.json();
    if (!oldName || !newName) {
      return NextResponse.json({ error: 'oldName and newName are required' }, { status: 400 });
    }
    const existing = await prisma.category.findFirst({ where: { name: oldName } });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    const dup = await prisma.category.findFirst({ where: { name: newName } });
    if (dup && dup.id !== existing.id) {
      return NextResponse.json({ error: 'Category with that name already exists' }, { status: 409 });
    }
    const updated = await prisma.category.update({ where: { id: existing.id }, data: { name: newName.trim() } });
    return NextResponse.json({ category: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rename category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const existing = await prisma.category.findFirst({ where: { name: name } });
    if (!existing) return NextResponse.json({ success: true });
    await prisma.category.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid category name' }, { status: 400 });
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }
    // Prevent duplicates (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: { name: trimmed },
    });
    if (existing) {
      return NextResponse.json({ category: existing, duplicate: true });
    }
    const category = await prisma.category.create({ data: { name: trimmed } });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}


