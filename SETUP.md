# Gastro-Elite Setup Guide

## Database Configuration

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=u196042p425108_prohoreca
DB_PASSWORD=!Janssenstraat1211
DB_NAME=u196042p425108_prohoreca
DB_PORT=3306

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Connection
The app is configured to connect to your Vimexx MySQL database. Make sure:

1. Your Vimexx hosting is active
2. MySQL service is running
3. Database credentials are correct
4. Your local IP is whitelisted (if required)

### 3. Initialize Database
Run the following command to create tables and set up the admin user:

```bash
npm run init-db
```

This will:
- Create all necessary tables (users, companies, recipes, categories, ingredients, error_logs, password_reset_tokens)
- Insert default categories
- Create admin user: `admin@prohoreca.com` / `admin123!`

## Authentication System

### User Roles
- **User**: Regular users who can create and manage their own recipes
- **Business**: Company accounts with additional features
- **Admin**: Full access to admin panel and user management

### Features Implemented
- ✅ User registration and login
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Password reset functionality
- ✅ Role-based access control
- ✅ Admin panel for user management
- ✅ Error logging system
- ✅ Dutch/English language support

## Admin Access

### Default Admin Account
- **Email**: admin@prohoreca.com
- **Password**: admin123!

### Admin Panel Features
- View all users
- Activate/deactivate users
- Reset user passwords
- Change user roles
- View error logs
- Monitor system activity

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Initialize database:
```bash
npm run init-db
```

3. Start development server:
```bash
npm run dev
```

4. Visit http://localhost:3000

## Production Deployment

### Security Considerations
1. Change the JWT_SECRET in production
2. Use HTTPS in production
3. Set secure cookie options
4. Implement rate limiting
5. Add input validation
6. Set up proper error monitoring

### Database Security
1. Use connection pooling
2. Implement proper error handling
3. Use parameterized queries (already implemented)
4. Regular database backups
5. Monitor database performance

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users` - Update user (activate/deactivate, reset password, change role)
- `GET /api/admin/error-logs` - Get error logs

## Troubleshooting

### Database Connection Issues
1. Check if Vimexx hosting is active
2. Verify database credentials
3. Check if MySQL service is running
4. Ensure your IP is whitelisted
5. Check firewall settings

### Authentication Issues
1. Verify JWT_SECRET is set
2. Check cookie settings
3. Ensure HTTPS in production
4. Check browser developer tools for errors

### Common Errors
- `ECONNREFUSED`: Database connection failed
- `Invalid credentials`: Wrong email/password
- `Access denied`: Insufficient permissions
- `Token expired`: JWT token needs refresh











