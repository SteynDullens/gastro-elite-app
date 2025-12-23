import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch all recipes for the user with STRICT multi-tenant isolation
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ recipes: [] });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ recipes: [] });
    }

    // Get user with company memberships (many-to-many) - try multiple strategies
    console.log('🔍 Looking up user in unified endpoint:', decoded.id);
    let user: any = null;
    let lookupError: any = null;
    
    // Strategy 1: Try with companyMemberships (direct Prisma call)
    try {
      const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
      if (prisma) {
        try {
          user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
              id: true,
              companyId: true, // Include legacy field
              ownedCompany: {
                select: { id: true }
              },
              companyMemberships: {
                select: {
                  companyId: true,
                  company: {
                    select: { id: true }
                  }
                }
              }
            }
          });
          console.log('✅ Strategy 1 succeeded - user found with memberships:', {
            userId: user?.id,
            membershipsCount: user?.companyMemberships?.length || 0,
            legacyCompanyId: user?.companyId
          });
        } catch (error: any) {
          lookupError = error;
          console.log('⚠️  Strategy 1 failed:', error.message, error.code);
        }
      }
    } catch (error: any) {
      lookupError = error;
      console.log('⚠️  Prisma import failed:', error.message);
    }
    
    // Strategy 2: Fallback to legacy company relation
    if (!user) {
      try {
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true,
                companyId: true, // Legacy field
                ownedCompany: {
                  select: { id: true }
                }
              }
            });
            if (user) {
              user.companyMemberships = [];
              // Try to fetch memberships separately
              try {
                const memberships = await prisma.companyMembership.findMany({
                  where: { userId: decoded.id },
                  select: {
                    companyId: true,
                    company: {
                      select: { id: true }
                    }
                  }
                });
                user.companyMemberships = memberships;
                console.log('✅ Strategy 2 succeeded - fetched memberships separately:', memberships.length);
              } catch (e: any) {
                console.log('⚠️  Could not fetch memberships separately:', e.message);
              }
            }
          } catch (error: any) {
            lookupError = error;
            console.log('⚠️  Strategy 2 failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.log('⚠️  Prisma import failed in strategy 2:', error.message);
      }
    }
    
    // Strategy 3: Minimal query
    if (!user) {
      try {
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true,
                companyId: true
              }
            });
            if (user) {
              user.companyMemberships = [];
              user.ownedCompany = null;
              console.log('✅ Strategy 3 succeeded - minimal query');
            }
          } catch (error: any) {
            lookupError = error;
            console.error('❌ Strategy 3 failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.error('❌ Prisma import failed in strategy 3:', error.message);
      }
    }

    if (!user) {
      console.log('⚠️  User not found, returning empty recipes');
      return NextResponse.json({ recipes: [] });
    }

    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = (user.companyMemberships || []).map((m: any) => m.companyId);
    const hasLegacyCompanyId = !!user.companyId;
    
    // Employee = has active memberships OR legacy companyId (for backward compatibility)
    // Employees see BOTH personal AND business recipes
    // Personal users (no company connection) see ONLY personal recipes
    const isEmployee = employeeCompanyIds.length > 0 || hasLegacyCompanyId;
    
    console.log('🔍 User role determination:', {
      userId: decoded.id,
      isCompanyOwner,
      ownedCompanyId,
      employeeCompanyIds,
      hasLegacyCompanyId,
      isEmployee,
      membershipsCount: user.companyMemberships?.length || 0,
      willSeeBothDatabases: isEmployee && !isCompanyOwner
    });

    // STRICT BACKEND FILTERING - Multi-tenant isolation
    const result = await safeDbOperation(async (prisma) => {
      const personalRecipes: any[] = [];
      const companyRecipes: any[] = [];
      
      console.log('🔍 Fetching recipes for user:', {
        userId: decoded.id,
        isCompanyOwner,
        ownedCompanyId,
        isEmployee,
        employeeCompanyIds,
        hasLegacyCompanyId: user.companyId
      });

      if (isCompanyOwner) {
        // Company owners: ONLY company recipes from their owned company
        // NO personal recipes access
        const recipes = await prisma.companyRecipe.findMany({
          where: {
            companyId: ownedCompanyId
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            companyId: true,
            creatorId: true,
            createdAt: true,
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            ingredients: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Map to unified format
        companyRecipes.push(...recipes.map(r => ({
          ...r,
          userId: null, // Company recipes never have userId
          originalOwnerId: r.creatorId,
          isSharedWithBusiness: false,
          type: 'company' as const
        })));

      } else if (isEmployee) {
        // Employees: Personal recipes (their own) + Company recipes (from companies they belong to)
        
        // Fetch personal recipes - STRICT: only recipes owned by this user
        const personal = await prisma.personalRecipe.findMany({
          where: {
            userId: decoded.id // STRICT: Only this user's recipes
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            userId: true,
            createdAt: true,
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            ingredients: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        console.log(`✅ Found ${personal.length} personal recipes`);
        personalRecipes.push(...personal.map(r => ({
          ...r,
          companyId: null, // Personal recipes never have companyId
          originalOwnerId: r.userId,
          isSharedWithBusiness: false,
          type: 'personal' as const
        })));

        // Fetch company recipes - STRICT: only from companies user belongs to
        // Use active memberships OR legacy companyId (for backward compatibility)
        const companyIdsToQuery = employeeCompanyIds.length > 0 
          ? employeeCompanyIds 
          : (user.companyId ? [user.companyId] : []);
        
        console.log('🔍 Fetching company recipes for employee, companyIds:', companyIdsToQuery, {
          fromMemberships: employeeCompanyIds.length,
          fromLegacy: user.companyId ? 1 : 0
        });
        const company = companyIdsToQuery.length > 0 ? await prisma.companyRecipe.findMany({
          where: {
            companyId: { in: companyIdsToQuery } // STRICT: Only companies user belongs to
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            companyId: true,
            creatorId: true,
            createdAt: true,
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            ingredients: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }) : [];

        console.log(`✅ Found ${company.length} company recipes`);
        companyRecipes.push(...company.map(r => ({
          ...r,
          userId: null, // Company recipes never have userId
          originalOwnerId: r.creatorId,
          isSharedWithBusiness: false,
          type: 'company' as const
        })));

      } else {
        // Personal users: ONLY personal recipes
        // This includes users with legacy companyId but NO active memberships
        console.log('🔍 Fetching personal recipes for personal user:', decoded.id, {
          hasLegacyCompanyId: user.companyId,
          hasActiveMemberships: employeeCompanyIds.length > 0,
          isCompanyOwner: isCompanyOwner
        });
        const personal = await prisma.personalRecipe.findMany({
          where: {
            userId: decoded.id // STRICT: Only this user's recipes
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            userId: true,
            createdAt: true,
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            ingredients: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        console.log(`✅ Found ${personal.length} personal recipes for personal user`);
        console.log('📋 Personal recipe IDs:', personal.map((r: any) => ({ id: r.id, name: r.name, userId: r.userId })));
        
        // Debug: Check total recipes in database
        try {
          const totalPersonalRecipes = await prisma.personalRecipe.count();
          const recipesForThisUser = await prisma.personalRecipe.count({
            where: { userId: decoded.id }
          });
          console.log(`📊 Debug: Total personal recipes in DB: ${totalPersonalRecipes}, For user ${decoded.id}: ${recipesForThisUser}`);
        } catch (e: any) {
          console.log('⚠️  Could not get recipe counts:', e.message);
        }
        
        personalRecipes.push(...personal.map(r => ({
          ...r,
          companyId: null,
          originalOwnerId: r.userId,
          isSharedWithBusiness: false,
          type: 'personal' as const
        })));
      }
      
      console.log(`📊 Final recipe counts - Personal: ${personalRecipes.length}, Company: ${companyRecipes.length}`);
      console.log('📋 All personal recipe IDs:', personalRecipes.map((r: any) => ({ id: r.id, name: r.name, userId: r.userId, companyId: r.companyId })));

      // Combine and deduplicate if "both" was selected
      console.log(`📊 Combined recipes: ${personalRecipes.length} personal + ${companyRecipes.length} company = ${personalRecipes.length + companyRecipes.length} total`);
      const allRecipes = [...personalRecipes, ...companyRecipes];
      
      // Deduplicate: if employee selected "both", they have two separate recipes
      // Show only one (prefer company version for employees/owners)
      // BUT: Only deduplicate for employees/owners, NOT for pure personal users
      let deduplicated = allRecipes;
      
      if (isEmployee || isCompanyOwner) {
        // Only deduplicate for employees/owners who might have "both" recipes
        console.log('🔄 Deduplicating recipes for employee/owner...');
        deduplicated = allRecipes.reduce((acc: any[], recipe: any) => {
          if (recipe.originalOwnerId === decoded.id) {
            const existing = acc.find(r => 
              r.name === recipe.name && 
              r.originalOwnerId === recipe.originalOwnerId
            );
            
            if (existing) {
              // Prefer company version if available
              if (recipe.type === 'company' && existing.type === 'personal') {
                const index = acc.indexOf(existing);
                acc[index] = recipe;
                return acc;
              }
              if (recipe.type === 'personal' && existing.type === 'company') {
                return acc; // Keep company version
              }
              return acc; // Same type, keep existing
            }
          }
          
          acc.push(recipe);
          return acc;
        }, []);
        
        console.log(`📊 After deduplication: ${deduplicated.length} recipes (from ${allRecipes.length} total)`);
      } else {
        // Personal users: No deduplication needed, show ALL personal recipes
        console.log('📊 Personal user: No deduplication needed, showing all recipes');
        deduplicated = allRecipes;
      }

      return deduplicated;
    });

    const userType = isCompanyOwner ? 'owner' : isEmployee ? 'employee' : 'personal';
    console.log(`✅ Fetched ${result?.length || 0} recipes for user ${decoded.id} (${userType})`);
    console.log('📊 Recipe breakdown:', {
      total: result?.length || 0,
      personal: result?.filter((r: any) => r.userId && !r.companyId).length || 0,
      business: result?.filter((r: any) => r.companyId && !r.userId).length || 0,
      both: result?.filter((r: any) => r.userId && r.companyId).length || 0,
      userType,
      userId: decoded.id
    });
    
    // Log first few recipe IDs for debugging
    if (result && result.length > 0) {
      console.log('📋 Sample recipe IDs:', result.slice(0, 3).map((r: any) => ({ 
        id: r.id, 
        name: r.name, 
        userId: r.userId, 
        companyId: r.companyId,
        type: r.type 
      })));
    } else {
      console.log('⚠️  No recipes returned - checking if recipes exist in database...');
      // Try a direct query to see if recipes exist
      try {
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          const directCheck = await prisma.personalRecipe.findFirst({
            where: { userId: decoded.id },
            select: { id: true, name: true, userId: true }
          });
          console.log('🔍 Direct check for personal recipes:', directCheck);
        }
      } catch (e: any) {
        console.error('❌ Direct check failed:', e.message);
      }
    }

    return NextResponse.json({ recipes: result || [] });
  } catch (error: any) {
    console.error('❌ Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
