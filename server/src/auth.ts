import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dynamoDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

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

// Create user in DynamoDB
export const createUser = async (email: string, hashedPassword: string, role: string = 'agent') => {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const params = {
    TableName: 'ConnectlyUsers',
    Item: {
      userID: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(email)',
  };

  try {
    console.log('🔍 Attempting to save user to DynamoDB:');
    console.log('📋 Table Name:', params.TableName);
    console.log('👤 User ID:', params.Item.userID);
    console.log('📧 Email:', params.Item.email);
    console.log('🔑 Role:', params.Item.role);
    console.log('⏰ Created At:', params.Item.createdAt);
    console.log('📝 Full params:', JSON.stringify(params, null, 2));
    
    await dynamoDb.put(params).promise();
    console.log('✅ User saved successfully to DynamoDB!');
    return { userID: userId, email, role };
  } catch (error: any) {
    console.error('❌ DynamoDB error details:');
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Full error:', JSON.stringify(error, null, 2));
    
    if (error.code === 'ConditionalCheckFailedException') {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
};

// Find user by email
export const findUserByEmail = async (email: string) => {
  const params = {
    TableName: 'ConnectlyUsers',
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email.toLowerCase(),
    },
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

// Find user by ID
export const findUserById = async (userId: string) => {
  const params = {
    TableName: 'ConnectlyUsers',
    Key: {
      userID: userId,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}; 