# Gastro-Elite App

A professional recipe management system for the hospitality industry built with Next.js.

## Quick Start

### For Layout Development (No Database Required)

If you want to work on UI/layout changes without database setup:

1. Create `.env.local`:
```bash
DEV_MODE_NO_DB=true
NODE_ENV=development
JWT_SECRET=dev-secret-key
```

2. Run development server:
```bash
npm run dev
```

See [LAYOUT_DEVELOPMENT.md](./LAYOUT_DEVELOPMENT.md) for details.

### Full Setup (With Database)

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.example`):
```bash
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret-key"
```

3. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Start development server:
```bash
npm run dev
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete database setup guide.

## Features

- ✅ User authentication & authorization
- ✅ Recipe management (personal & business)
- ✅ Company/team management
- ✅ Category management
- ✅ Responsive design (mobile & desktop)
- ✅ Graceful database error handling
- ✅ Development mode for layout work

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/lib` - Utilities & database connection
- `/prisma` - Database schema & migrations
- `/public` - Static assets

## Documentation

- [LAYOUT_DEVELOPMENT.md](./LAYOUT_DEVELOPMENT.md) - Working on layouts without database
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration guide

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
