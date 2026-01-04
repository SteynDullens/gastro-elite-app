# Architecture Lock - Version 1.2

## Database Schema (LOCKED)

This document locks the database architecture for version 1.2. **DO NOT MODIFY** the core structure without creating a new version.

### Core Tables

#### `User`
- `id` (PK, String, cuid)
- `firstName`, `lastName`, `email` (unique), `password`, `phone`
- `ownedCompany` (relation to Company - one-to-one, optional)
- `companyId` (legacy field, String, nullable - for backward compatibility)
- `companyMemberships` (many-to-many relation via CompanyMembership)
- `personalRecipes` (one-to-many relation to PersonalRecipe)
- `companyRecipesCreated` (one-to-many relation to CompanyRecipe)
- `isBlocked`, `isAdmin`, `emailVerified`, etc.

#### `Company`
- `id` (PK, String, cuid)
- `name`, `address`, `kvkNumber`, `vatNumber`, etc.
- `owner` (relation to User - one-to-one, required)
- `ownerId` (unique, FK to User.id)
- `memberships` (many-to-many relation via CompanyMembership)
- `companyRecipes` (one-to-many relation to CompanyRecipe)

#### `CompanyMembership` (Many-to-Many)
- `id` (PK, String, cuid)
- `userId` (FK to User.id)
- `companyId` (FK to Company.id)
- `createdAt`, `updatedAt`
- Unique constraint: `[userId, companyId]`

#### `PersonalRecipe` (LOCKED - Separate Table)
- `id` (PK, String, cuid)
- `name`, `image`, `batchSize`, `servings`, `instructions`
- `userId` (FK to User.id, REQUIRED - always set)
- `companyId` (ALWAYS NULL - never set)
- `categories` (many-to-many via Category)
- `ingredients` (one-to-many via PersonalIngredient)
- Indexes: `[userId, name]`, `[userId]`

#### `CompanyRecipe` (LOCKED - Separate Table)
- `id` (PK, String, cuid)
- `name`, `image`, `batchSize`, `servings`, `instructions`
- `companyId` (FK to Company.id, REQUIRED - always set)
- `creatorId` (FK to User.id, nullable - tracks creator)
- `userId` (ALWAYS NULL - never set)
- `categories` (many-to-many via Category)
- `ingredients` (one-to-many via CompanyIngredient)
- Indexes: `[companyId, name]`, `[companyId]`, `[creatorId]`

### Critical Rules (LOCKED)

1. **NEVER mix PersonalRecipe and CompanyRecipe data**
   - Personal recipes MUST have `userId` set and `companyId` null
   - Company recipes MUST have `companyId` set and `userId` null
   - These are separate tables with NO shared IDs

2. **"Both databases" option creates TWO separate records**
   - When an employee selects "both", create:
     - One `PersonalRecipe` record (userId set, companyId null)
     - One `CompanyRecipe` record (companyId set, userId null, creatorId set)
   - These are COMPLETELY INDEPENDENT - no relation between them

3. **Employee removal logic (LOCKED)**
   - When an employee is removed from a company:
     - Find all `CompanyRecipe` where `companyId = <company>` AND `creatorId = <employee>`
     - Update `creatorId` to `company.ownerId` (reassign to company owner)
     - Delete `CompanyMembership` record
     - Set `user.companyId` to null (if legacy field exists)
   - Employee loses ALL access to company recipes immediately

4. **Permission Rules (LOCKED)**
   - Personal recipes: Only owner can view/edit/delete
   - Company recipes:
     - Company owner: Full access to all company recipes
     - Employee: Can view all company recipes, but can only edit/delete recipes they created

5. **Multi-tenant Isolation (LOCKED)**
   - Every query MUST include user ID and company ID filters
   - No cross-tenant data access allowed
   - Backend MUST enforce all permissions - never trust frontend

## API Endpoints (LOCKED)

### POST `/api/recipes`
- Creates recipe in correct table based on `saveTo` parameter
- Enforces role-based `saveTo` rules:
  - Company owners: forced to `'business'`
  - Personal users: forced to `'personal'`
  - Employees: can choose `'personal'`, `'business'`, or `'both'`
- Returns unified recipe format

### GET `/api/recipes/unified`
- Fetches recipes based on user role:
  - Company owners: Only company recipes
  - Employees: Personal recipes + Company recipes
  - Personal users: Only personal recipes
- STRICT backend filtering - never returns unauthorized data

### DELETE `/api/recipes/[id]`
- Checks permissions before deletion
- Deletes from correct table (PersonalRecipe or CompanyRecipe)
- Returns success/error response

### PUT `/api/recipes/[id]`
- Checks permissions before update
- Updates in correct table
- Handles "both" option during edit

## Data Safety Guarantees

1. **No data loss during operations**
   - All deletions are permanent (no soft-delete)
   - Employee removal reassigns recipes to company owner (no deletion)
   - Personal recipes are never deleted when employee is removed

2. **Transaction safety**
   - Recipe creation/deletion uses direct Prisma calls
   - Error handling ensures partial operations don't leave orphaned data

3. **Backup recommendations**
   - Regular database backups recommended
   - Recipe data is critical - ensure backup strategy is in place

## Migration Notes

- Version 1.2 uses separate `PersonalRecipe` and `CompanyRecipe` tables
- Legacy `Recipe` table should not exist in production
- `CompanyMembership` replaces direct `User.companyId` for many-to-many support
- Legacy `companyId` field kept for backward compatibility during transition

## Version History

- **v1.2** (Current): Separate PersonalRecipe/CompanyRecipe tables, CompanyMembership many-to-many
- **v1.1**: Single Recipe table with type field (deprecated)
- **v1.0**: Initial release

---

**IMPORTANT**: This architecture is locked for version 1.2. Any changes require creating version 1.3 and updating this document.


