# Database Setup Guide

This guide will help you set up the database connection for the Gastro-Elite app.

## Quick Start

### Option 1: Development Mode (No Database Required)

If you just want to work on the layout and UI without database setup:

1. Create a `.env.local` file in the root directory:
```bash
DEV_MODE_NO_DB=true
NODE_ENV=development
```

2. Start the development server:
```bash
npm run dev
```

The app will run without database connections, allowing you to work on layouts freely.

### Option 2: Full Database Setup

#### For PostgreSQL (Production/Vercel)

1. Create a `.env.local` file with your database URL:
```bash
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-secret-key-here"
NODE_ENV=development
```

2. Run Prisma migrations:
```bash
npx prisma migrate dev
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Test the connection:
```bash
npm run dev
```

Visit `http://localhost:3000/api/test-db` to verify the connection.

#### For Local SQLite (Quick Testing)

1. Update `.env.local`:
```bash
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
NODE_ENV=development
```

2. Update `prisma/schema.prisma` to use SQLite:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Run migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `DEV_MODE_NO_DB` - Set to `true` to disable database (layout work only)
- `NODE_ENV` - Set to `development` or `production`

## Database Connection Status

The app includes a unified database connection handler that:
- Gracefully handles database errors
- Allows the app to run in development mode without DB
- Provides helpful error messages
- Automatically retries failed connections

## Troubleshooting

### "Database connection failed"
1. Check your `DATABASE_URL` is correct
2. Verify database server is running
3. Check network/firewall settings
4. For Vercel: Ensure env vars are set in Vercel dashboard

### "Prisma client not available"
- Run `npx prisma generate`
- Check that `DATABASE_URL` is set
- If working on layout only, set `DEV_MODE_NO_DB=true`

### Layout Changes Not Working
- Set `DEV_MODE_NO_DB=true` in `.env.local`
- Restart dev server: `npm run dev`
- This disables all database operations

## Next Steps

Once database is working:
1. Add Planning module
2. Add Hygiene module
3. Configure production database on Vercel

