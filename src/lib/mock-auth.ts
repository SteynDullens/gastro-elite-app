import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Mock user storage (in memory - will reset on server restart)
let mockUsers: any[] = [];

// Initialize with admin user
async function initializeMockUsers() {
  if (mockUsers.length === 0) {
    const adminPassword = await bcrypt.hash('admin123!', 12);
    mockUsers = [
      {
        id: 1,
        email: 'admin@prohoreca.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export async function mockLoginUser(email: string, password: string) {
  await initializeMockUsers();
  
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: userWithoutPassword, token };
}

export async function mockRegisterUser(userData: any) {
  await initializeMockUsers();
  
  const existingUser = mockUsers.find(u => u.email === userData.email);
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const newUser = {
    id: mockUsers.length + 1,
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone || null,
    role: userData.role || 'user',
    companyId: null,
    isActive: true,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockUsers.push(newUser);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;
  
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: userWithoutPassword, token };
}

export function mockVerifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function mockGetUserById(id: number) {
  await initializeMockUsers();
  const user = mockUsers.find(u => u.id === id);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}
