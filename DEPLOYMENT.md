# 🚀 Gastro-Elite Deployment Guide

## Quick Deployment to Vercel

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `gastro-elite-app` (or any name you prefer)
3. Make it **public** (required for free Vercel deployment)

### Step 2: Push Code to GitHub
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/gastro-elite-app.git

# Push your code
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your `gastro-elite-app` repository
5. Vercel will automatically detect it's a Next.js app

### Step 4: Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables and add:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
ADMIN_EMAIL=admin@yourdomain.com
APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
```

### Step 5: Database Setup
**Option A: Vercel Postgres (Recommended)**
1. In Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string to `DATABASE_URL`

**Option B: External Database**
- Use your existing database: `web0168.zxcs.nl`
- Update connection string for production

### Step 6: Deploy
1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Your app will be live at `https://your-app.vercel.app`

## 🎯 Alternative Deployment Options

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables

### Railway
1. Connect GitHub repository
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy automatically

## 📋 Pre-Deployment Checklist

- ✅ Build successful (`npm run build`)
- ✅ Environment variables configured
- ✅ Database connection ready
- ✅ Email SMTP configured
- ✅ Admin credentials set

## 🔧 Post-Deployment

1. **Test the app**: Visit your live URL
2. **Check database**: Verify data is accessible
3. **Test email**: Try registration/forgot password
4. **Admin access**: Login with admin credentials

## 🚨 Important Notes

- **Database**: You'll need to migrate your existing data or set up a new database
- **File uploads**: Consider using Vercel Blob or AWS S3 for production file storage
- **Email**: Update SMTP settings for production domain
- **Domain**: You can add a custom domain in Vercel settings

## 🆘 Troubleshooting

- **Build fails**: Check environment variables
- **Database errors**: Verify DATABASE_URL format
- **Email not working**: Check SMTP credentials
- **Images not loading**: Check file upload configuration

Your app is ready for deployment! 🎉
