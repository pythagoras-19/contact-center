import { Router, Request, Response } from 'express';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  createUser, 
  findUserByEmail, 
  findUserById,
  authenticateToken,
  AuthenticatedRequest 
} from './simpleAuth';

const router = Router();

// POST /auth/register - Register a new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role = 'agent' } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    if (!email.includes('@')) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await createUser(email, hashedPassword, role);

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
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
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

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
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
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
        id: user.id,
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