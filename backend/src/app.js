/**
 * PayFence Express Application Configuration
 * Integrates Helmet security headers, CORS, body parsers, and route definitions.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import gatewayRoutes from './routes/gatewayRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { getDatabaseStatus } from './config/database.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allows dashboard / API rendering flexibility
}));

// CORS Configuration
const allowedOrigins = [
  'https://app.payfence.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, CLI tools, and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow but let security guard handle strict domain policy in /inspect and /pay
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'x-access-token']
}));

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'PayFence Autonomous AI Payment Gateway',
    version: '1.0.0',
    datastore: getDatabaseStatus(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/audit', auditRoutes);

// Root information endpoint
app.get('/', (req, res) => {
  return res.status(200).json({
    name: 'PayFence Backend API',
    version: '1.0.0',
    description: 'Deterministic security gateway for autonomous AI agent payments',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        demoLogin: 'POST /api/auth/demo-login',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      gateway: {
        inspect: 'POST /api/gateway/inspect',
        pay: 'POST /api/gateway/pay',
        balance: 'GET /api/gateway/balance'
      },
      audit: {
        run: 'POST /api/audit/run',
        logs: 'GET /api/audit/logs',
        policy: 'GET /api/audit/policy',
        updatePolicy: 'PUT /api/audit/policy',
        resetPolicy: 'POST /api/audit/policy/reset'
      }
    }
  });
});

// 404 Handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[PayFence Error]', err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred'
  });
});

export default app;
