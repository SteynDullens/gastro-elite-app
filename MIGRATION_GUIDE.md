# Migration Guide: Multi-Tenant Recipe Platform

## Overview
This migration implements strict multi-tenant isolation by separating personal and company recipes into completely separate tables.

## Schema Changes

### New Tables
1. **PersonalRecipe** - Stores only personal recipes (userId required)
2. **CompanyRecipe** - Stores only company recipes (companyId required)
3. **CompanyMembership** - Many-to-many relationship for users and companies
4. **PersonalIngredient** - Ingredients for personal recipes
5. **CompanyIngredient** - Ingredients for company recipes

### Legacy Support
- Old `Recipe` table kept temporarily for backward compatibility
- Old `companyId` field on User kept temporarily
- Migration script handles data transfer

## Migration Steps

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Create Migration
```bash
npx prisma migrate dev --name separate_personal_company_recipes
```

### 3. Run Data Migration
```bash
node scripts/migrate-to-separate-tables.js
```

### 4. Verify Migration
- Check that all personal recipes are in `PersonalRecipe` table
- Check that all company recipes are in `CompanyRecipe` table
- Verify `CompanyMembership` entries exist for all user-company relationships

### 5. Deploy
After verification, deploy the updated code.

## Security Features

### Backend Guards
Every API endpoint now enforces:
- **Authentication**: Valid token required
- **Authorization**: User role verification
- **Tenant Filtering**: Strict isolation by userId/companyId
- **Ownership Validation**: Users can only access their own data

### Multi-Tenant Isolation
- Personal recipes: Only visible to the owner (userId matches)
- Company recipes: Only visible to company members (companyId matches)
- No cross-tenant access possible

## API Changes

### Recipe Creation (`POST /api/recipes`)
- Uses `PersonalRecipe` or `CompanyRecipe` tables based on `saveTo`
- "Both" option creates two completely separate records

### Recipe Fetching (`GET /api/recipes/unified`)
- Checks both `PersonalRecipe` and `CompanyRecipe` tables
- Filters strictly by userId/companyId based on user role

### Recipe Editing (`PUT /api/recipes/[id]`)
- Checks which table the recipe is in
- Enforces permissions before allowing edits

### Recipe Deletion (`DELETE /api/recipes/[id]`)
- Checks which table the recipe is in
- Enforces permissions before allowing deletion

## Rollback Plan

If issues occur:
1. Revert code changes
2. Old `Recipe` table still contains all data
3. Can restore from backup if needed

## Testing Checklist

- [ ] Personal users can only see their personal recipes
- [ ] Company owners can only see company recipes
- [ ] Employees can see personal recipes + company recipes
- [ ] "Both" option creates two separate recipes
- [ ] Recipe editing respects permissions
- [ ] Recipe deletion respects permissions
- [ ] Employee removal revokes company recipe access
- [ ] No cross-tenant data leakage

