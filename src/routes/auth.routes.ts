import { Router } from 'express';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', (req, res) => {
  res.json({
    status: 'success',
    message: 'Register endpoint - coming soon',
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', (req, res) => {
  res.json({
    status: 'success',
    message: 'Login endpoint - coming soon',
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout endpoint - coming soon',
  });
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token', (req, res) => {
  res.json({
    status: 'success',
    message: 'Refresh token endpoint - coming soon',
  });
});

export default router;