import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  createUser, 
  findUserByEmail, 
  findUserById,
  authenticateToken,
  AuthenticatedRequest 
} from './auth';
import { dynamoDb } from './db';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
    return;
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['agent', 'admin'])
    .withMessage('Role must be either "agent" or "admin"'),
  handleValidationErrors
];

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// GET /auth/users - List all users (admin only)
router.get('/users', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const params = {
      TableName: 'ConnectlyUsers',
      ProjectionExpression: 'userID, email, #r, createdAt',
      ExpressionAttributeNames: {
        '#r': 'role',
      },
    };

    const result = await dynamoDb.scan(params).promise();
    
    // Remove sensitive information and sort by creation date
    const users = (result.Items || [])
      .map((user: any) => ({
        id: user.userID,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      count: users.length,
      users: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /auth/register - Register a new user
router.post('/register', registerValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role = 'agent' } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await createUser(email, hashedPassword, role);

    // Generate token
    const token = generateToken({
      id: user.userID,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.userID,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

// POST /auth/login - Login user
router.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.userID,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.userID,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /auth/profile - Get current user profile (protected route)
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.userID,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /auth/verify - Verify token validity
router.post('/verify', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router; 