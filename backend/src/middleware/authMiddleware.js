/**
 * PayFence Authentication Middleware
 * Handles JWT token generation and verification.
 */

import jwt from 'jsonwebtoken';
import { getUserById } from '../models/store.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'payfence-autonomous-guard-secret-2026';
export const JWT_EXPIRES_IN = '24h';

/**
 * Generates a signed JWT token for a given user object.
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'operator'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware that requires a valid JWT Bearer token.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication token is required in Authorization header'
    });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'The authenticated user identity was not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: `Token verification failed: ${err.message}`
    });
  }
}

/**
 * Optional authentication: loads user if token is present, otherwise falls back to demo user.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = getUserById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Fall through to demo user
    }
  }

  // Fallback to default demo user for frictionless agent operations
  req.user = getUserById('usr_demo_01') || {
    id: 'usr_demo_01',
    email: 'demo@payfence.io',
    role: 'operator',
    balanceUSD: 500.00
  };
  next();
}
