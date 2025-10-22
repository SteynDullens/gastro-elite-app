import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyId?: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: any;
  ownedCompany?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'business';
  companyName?: string;
  kvkNumber?: string;
  vatNumber?: string;
  companyPhone?: string;
  businessAddress?: {
    country: string;
    postalCode: string;
    street: string;
    city: string;
  };
  kvkDocumentPath?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: User): string {
  try {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        account_type: (user as any).account_type,
        isAdmin: user.isAdmin,
        companyId: user.companyId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Token generation failed');
  }
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Register new user
export async function registerUser(data: RegisterData): Promise<{ user: User; token: string }> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );
    
    if ((existingUsers as any[]).length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create user first
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, firstName, lastName, phone, account_type) VALUES (?, ?, ?, ?, ?, ?)',
      [data.email, hashedPassword, data.firstName, data.lastName, data.phone || null, data.role || 'user']
    );
    
    const userId = (userResult as any).insertId;
    let companyId = null;
    
    // Create company if business user
    if (data.role === 'business' && data.companyName) {
      const [companyResult] = await connection.execute(
        `INSERT INTO companies (
          company_name, kvk_number, vat_number, address, 
          contact_name, contact_phone, contact_email, 
          kvk_document_path, ownerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.companyName,
          data.kvkNumber || null,
          data.vatNumber || null,
          data.businessAddress ? 
            `${data.businessAddress.street}, ${data.businessAddress.postalCode} ${data.businessAddress.city}, ${data.businessAddress.country}` 
            : null,
          `${data.firstName} ${data.lastName}`,
          data.companyPhone || null,
          data.email,
          data.kvkDocumentPath || null,
          userId
        ]
      );
      companyId = (companyResult as any).insertId;
      
      // Update user with company ID
      await connection.execute(
        'UPDATE users SET companyId = ? WHERE id = ?',
        [companyId, userId]
      );
    }
    
    await connection.commit();
    
    // Get created user
    const [users] = await connection.execute(
      'SELECT id, email, firstName, lastName, phone, account_type, companyId, isActive, emailVerified, createdAt, updatedAt FROM users WHERE id = ?',
      [userId]
    );
    
    const user = (users as any[])[0];
    const token = generateToken(user);
    
    return { user, token };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Login user
export async function loginUser(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
  const connection = await pool.getConnection();
  
  try {
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.password, u.firstName, u.lastName, u.phone, u.account_type, u.companyId, 
              u.isActive, u.emailVerified, u.createdAt, u.updatedAt, c.status as companyStatus
       FROM users u 
       LEFT JOIN companies c ON u.companyId = c.id 
       WHERE u.email = ?`,
      [credentials.email]
    );
    
    if (!(users as any[]).length) {
      throw new Error('Invalid credentials');
    }
    
    const user = (users as any[])[0];
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    const isValidPassword = await verifyPassword(credentials.password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check business account approval status
    if (user.account_type === 'business') {
      if (user.companyStatus === 'pending') {
        throw new Error('BUSINESS_PENDING_APPROVAL');
      } else if (user.companyStatus === 'rejected') {
        throw new Error('BUSINESS_REJECTED');
      }
    }
    
    // Remove password from user object
    delete user.password;
    
    const token = generateToken(user);
    
    return { user, token };
    
  } finally {
    connection.release();
  }
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  const connection = await pool.getConnection();
  
  try {
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.firstName, u.lastName, u.phone, u.account_type, u.companyId, 
              u.isActive, u.emailVerified, u.createdAt, u.updatedAt, c.status as companyStatus
       FROM users u 
       LEFT JOIN companies c ON u.companyId = c.id 
       WHERE u.id = ?`,
      [id]
    );
    
    return (users as any[])[0] || null;
    
  } finally {
    connection.release();
  }
}

// Update user password
export async function updateUserPassword(userId: number, newPassword: string): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    await connection.execute(
      'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
  } finally {
    connection.release();
  }
}

// Log error
export async function logError(errorData: {
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
}): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(
      'INSERT INTO error_logs (level, message, stack, userId, ipAddress, userAgent, url, method, statusCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        errorData.level,
        errorData.message,
        errorData.stack || null,
        errorData.userId || null,
        errorData.ipAddress || null,
        errorData.userAgent || null,
        errorData.url || null,
        errorData.method || null,
        errorData.statusCode || null
      ]
    );
    
  } catch (error) {
    console.error('Failed to log error:', error);
  } finally {
    connection.release();
  }
}

// Get error logs (admin only)
export async function getErrorLogs(limit: number = 100, offset: number = 0): Promise<any[]> {
  const connection = await pool.getConnection();
  
  try {
    const [logs] = await connection.execute(
      'SELECT el.*, u.email as userEmail FROM error_logs el LEFT JOIN users u ON el.userId = u.id ORDER BY el.createdAt DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return logs as any[];
    
  } finally {
    connection.release();
  }
}

// Create password reset token
export async function createPasswordResetToken(userId: number): Promise<string> {
  const connection = await pool.getConnection();
  
  try {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await connection.execute(
      'INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    
    return token;
    
  } finally {
    connection.release();
  }
}

// Verify password reset token
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  const connection = await pool.getConnection();
  
  try {
    const [tokens] = await connection.execute(
      'SELECT userId FROM password_reset_tokens WHERE token = ? AND expiresAt > NOW() AND used = false',
      [token]
    );
    
    if ((tokens as any[]).length === 0) {
      return null;
    }
    
    return (tokens as any[])[0].userId;
    
  } finally {
    connection.release();
  }
}

// Mark password reset token as used
export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(
      'UPDATE password_reset_tokens SET used = true WHERE token = ?',
      [token]
    );
    
  } finally {
    connection.release();
  }
}

