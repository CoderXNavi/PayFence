/**
 * PayFence Authentication Routes
 * Includes instant /demo-login, standard login, and user profile.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserById } from '../models/store.js';
import { generateToken, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/demo-login
 * Issues JWT for the pre-configured demo operator account.
 */
router.post('/demo-login', (req, res) => {
  const demoUser = getUserById('usr_demo_01');
  
  if (!demoUser) {
    return res.status(500).json({
      success: false,
      error: 'DEMO_USER_UNAVAILABLE',
      message: 'Demo user account is not initialized'
    });
  }

  const token = generateToken(demoUser);
  const { passwordHash, ...safeUser } = demoUser;

  return res.status(200).json({
    success: true,
    message: 'Demo login successful',
    token,
    user: safeUser
  });
});

/**
 * POST /api/auth/login
 * Standard authentication with email and password.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_CREDENTIALS',
      message: 'Email and password are required'
    });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    });
  }

  const token = generateToken(user);
  const { passwordHash, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: safeUser
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile.
 */
router.get('/me', requireAuth, (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  return res.status(200).json({
    success: true,
    user: safeUser
  });
});

export default router;
