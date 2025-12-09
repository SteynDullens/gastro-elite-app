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

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const isEmployee = !!user.companyId && !user.ownedCompany?.id;
    const isPersonalUser = !user.companyId && !user.ownedCompany?.id;

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    let { name, image, batchAmount, batchUnit, ingredients, steps, categories, saveTo } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[]; // names
      saveTo?: 'personal' | 'business' | 'both'; // Optional - will be enforced by role
    };
    
    // Enforce role-based saveTo rules
    if (isCompanyOwner) {
      // Company owners ALWAYS save to company - no choice
      saveTo = 'business';
      console.log('🔒 Company owner: Forcing saveTo to business');
    } else if (isPersonalUser) {
      // Personal users ALWAYS save to personal - no choice
      saveTo = 'personal';
      console.log('🔒 Personal user: Forcing saveTo to personal');
    } else if (isEmployee) {
      // Employees can choose, but validate the choice
      if (!saveTo || (saveTo !== 'personal' && saveTo !== 'business' && saveTo !== 'both')) {
        saveTo = 'personal'; // Default to personal for employees
      }
      console.log('✅ Employee: Using chosen saveTo:', saveTo);
    } else {
      return NextResponse.json({ error: 'Invalid user state' }, { status: 400 });
    }

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
    
    if (saveTo === 'both') {
      // Create TWO separate recipes: one personal, one company
      console.log('Creating both personal and company recipes for employee:', user.id);
      
      const companyId = user.companyId;
      if (!companyId) {
        return NextResponse.json({ error: 'Employee must be linked to a company to save to both' }, { status: 400 });
      }
      
      const [personalRecipe, companyRecipe] = await Promise.all([
        // Create personal recipe
        safeDbOperation(async (prisma) => {
          return await prisma.recipe.create({
            data: {
              ...recipeData,
              userId: user.id,
              companyId: null, // Explicitly null for personal
              originalOwnerId: user.id,
              isSharedWithBusiness: false, // Not shared, it's a separate copy
            },
            include: { categories: true, ingredients: true },
          });
        }),
        // Create company recipe
        safeDbOperation(async (prisma) => {
          return await prisma.recipe.create({
            data: {
              ...recipeData,
              userId: null, // No userId for company recipe
              companyId: companyId,
              originalOwnerId: user.id, // Track who created it, but company owns it
            },
            include: { categories: true, ingredients: true },
          });
        })
      ]);
      
      console.log('Both recipes created - Personal:', personalRecipe?.id, 'Company:', companyRecipe?.id);
      // Return the personal recipe (employee owns this one)
      return NextResponse.json({ recipe: personalRecipe });
      
    } else if (saveTo === 'personal') {
      // Create personal recipe only
      console.log('Creating personal recipe for user:', user.id);
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.recipe.create({
        data: {
          ...recipeData,
          userId: user.id,
          companyId: null, // Explicitly null
          originalOwnerId: user.id,
          isSharedWithBusiness: false,
        },
        include: { categories: true, ingredients: true },
      });
      });
      console.log('Personal recipe created:', recipe?.id);
    } else if (saveTo === 'business') {
      // Create business recipe only
      const companyId = user.ownedCompany?.id || user.company?.id;
      if (!companyId) {
        return NextResponse.json({ error: 'User must be associated with a company to create business recipes' }, { status: 400 });
      }
      
      console.log('Creating business recipe for company:', companyId);
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.recipe.create({
        data: {
          ...recipeData,
          userId: null, // No userId for company recipes
          companyId: companyId,
          originalOwnerId: user.id, // Track creator, but company owns it
        },
        include: { categories: true, ingredients: true },
        });
      });
      console.log('Business recipe created:', recipe?.id);
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