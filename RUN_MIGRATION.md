# How to Run the Migration - Step by Step

## Option 1: Automatic (Easiest)
**Just commit and push your code, then redeploy on Vercel.**
The migration will run automatically during the build process.

## Option 2: Run Locally (Immediate Fix)

### Step 1: Open Terminal/Command Prompt
Navigate to your project folder:
```
cd C:\Users\steyn\Documents\gastro-elite-app
```

### Step 2: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 3: Pull Environment Variables from Vercel
This gets your DATABASE_URL from Vercel:
```bash
vercel env pull .env.local
```

### Step 4: Run the Migration
```bash
npx prisma migrate deploy
```

This will:
- Connect to your production database (using DATABASE_URL from Vercel)
- Create the EmployeeInvitation table
- Set up indexes and foreign keys

### Step 5: Verify
After running, try adding an employee again. You should see:
- ✅ No more "EmployeeInvitation table does not exist" errors
- ✅ Emails sent with Accept/Decline buttons
- ✅ Employees can be deleted properly

## Option 3: Direct SQL (If you have database access)

If you have direct access to your PostgreSQL database (via a database client like pgAdmin, DBeaver, or Vercel's database dashboard):

1. Connect to your database
2. Run the SQL from `scripts/create-employee-invitation-table.sql`

---

**Which option should you use?**
- **Option 1**: If you can wait for the next deployment
- **Option 2**: If you want to fix it right now (recommended)
- **Option 3**: If you prefer using a database GUI tool

