import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Recipe creation API called');
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('No authentication token found');
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { ownedCompany: true, company: true }
      });
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { name, image, batchAmount, batchUnit, ingredients, steps, categories, saveTo } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[]; // names
      saveTo: 'personal' | 'business' | 'both'; // New field for recipe destination
    };

    if (!name || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure categories exist (create if missing) and collect IDs
    const categoryRecords = await safeDbOperation(async (prisma) => {
      return await Promise.all(
      (categories || []).map(async (catName) => {
        const trimmed = (catName || '').trim();
        if (!trimmed) return null;
        const existing = await prisma.category.findFirst({ where: { name: { equals: trimmed } } });
        if (existing) return existing;
        return prisma.category.create({ data: { name: trimmed } });
      })
    );
    }) || [];

    // Create recipe(s) based on saveTo option
    const recipeData = {
      name,
      image,
      batchSize: batchAmount || null,
      servings: batchUnit === 'personen' ? (batchAmount || null) : null,
      instructions: steps
        .map((s: string, i: number) => (s && s.trim() ? `${i + 1}. ${s.trim()}` : ''))
        .filter(Boolean)
        .join('\n'),
      ingredients: {
        create: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit as any,
        })),
      },
      categories: {
        connect: categoryRecords
          .filter((c) => Boolean(c && (c as any).id))
          .map((c) => ({ id: (c as any).id })),
      },
    };

    let recipe;
    
    console.log('Creating recipe with saveTo:', saveTo);
    console.log('Recipe data:', JSON.stringify(recipeData, null, 2));
    
    if (saveTo === 'personal' || saveTo === 'both') {
      // Create personal recipe
      console.log('Creating personal recipe for user:', user.id);
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.recipe.create({
        data: {
          ...recipeData,
          userId: user.id,
          originalOwnerId: user.id,
          isSharedWithBusiness: saveTo === 'both',
        },
        include: { categories: true, ingredients: true },
      });
      });
      console.log('Personal recipe created:', recipe?.id);
    } else if (saveTo === 'business') {
      // Create business recipe
      if (!user.ownedCompany && !user.company) {
        return NextResponse.json({ error: 'User must be associated with a company to create business recipes' }, { status: 400 });
      }
      
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.recipe.create({
        data: {
          ...recipeData,
          companyId: user.ownedCompany?.id || user.company?.id,
          originalOwnerId: user.id,
        },
        include: { categories: true, ingredients: true },
        });
      });
    } else {
      return NextResponse.json({ error: 'Invalid saveTo option' }, { status: 400 });
    }

    console.log('Recipe creation successful, returning recipe:', recipe?.id);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Create recipe error:', error);
    console.error('Error details:', (error as any).message);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
