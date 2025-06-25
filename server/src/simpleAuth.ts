import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Simple in-memory user storage for testing
const users: any[] = [];

// Middleware to verify JWT token
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};

// Create user in memory
export const createUser = async (email: string, hashedPassword: string, role: string = 'agent') => {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const user = {
    id: userId,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(user);
  return { id: userId, email, role };
};

// Find user by email
export const findUserByEmail = async (email: string) => {
  return users.find(u => u.email === email.toLowerCase()) || null;
};

// Find user by ID
export const findUserById = async (userId: string) => {
  return users.find(u => u.id === userId) || null;
}; 