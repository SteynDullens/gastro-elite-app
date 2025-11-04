# Layout Development Guide

## Quick Start for Layout Changes

**Want to change the layout without database setup?** Follow these steps:

### 1. Enable Development Mode (No Database)

Create or edit `.env.local` in the project root:

```bash
DEV_MODE_NO_DB=true
NODE_ENV=development
JWT_SECRET=dev-secret-key
```

### 2. Start Development Server

```bash
npm run dev
```

The app will now run without requiring a database connection. You can:
- ✅ Work on all UI/layout changes
- ✅ Test component styling
- ✅ Modify navigation and routes
- ✅ Update page layouts
- ⚠️ Login/authentication won't work (expected in this mode)

### 3. When You Need Database Features

Simply remove or set `DEV_MODE_NO_DB=false` in `.env.local` and configure your `DATABASE_URL`.

## What Changed

### Unified Database Connection

- **New file**: `src/lib/db-connection.ts` - Centralized database handling
- **Graceful fallback**: App continues working even if DB is unavailable
- **Development mode**: `DEV_MODE_NO_DB` flag allows layout work without DB

### Updated API Routes

- `/api/auth/login` - Handles DB errors gracefully
- `/api/auth/me` - Returns null user in dev mode instead of crashing

### Benefits

1. **No more crashes** - App won't stop if database is down
2. **Easy layout work** - Set one environment variable and work freely
3. **Better errors** - Clear messages when DB is unavailable
4. **Production ready** - Same code works with or without DB

## Next Steps

After layout is complete:
1. Set up database connection (see `DATABASE_SETUP.md`)
2. Add Planning module
3. Add Hygiene module

## Troubleshooting

**"Database is not available" message?**
- This is expected in `DEV_MODE_NO_DB=true` mode
- For layout work, this is fine - just ignore it
- To enable DB, set `DEV_MODE_NO_DB=false` and configure `DATABASE_URL`

**App still crashing?**
- Make sure `.env.local` exists with `DEV_MODE_NO_DB=true`
- Restart dev server: `npm run dev`
- Check console for specific error messages

