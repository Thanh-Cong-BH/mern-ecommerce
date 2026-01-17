/**
 * Authentication Routes - Movie Streaming Platform
 * Simple version with only essential auth
 */

import express from 'express';
const router = express.Router();

import {
  register,
  login
} from '../controllers/auth.controller.js';

// Public routes
router.post('/register', register);
router.post('/login', login);

export default router;