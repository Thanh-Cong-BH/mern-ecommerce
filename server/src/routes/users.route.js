import express from 'express';
import { protect, admin } from '../middlewares/jwt-auth.js';
import * as userController from '../controllers/users.controller.js';

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

// Get current user info
router.get('/me', protect, userController.getInfo);

// Update current user info
router.put('/me', protect, userController.updateInfo);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (Admin only)
router.get('/', protect, admin, userController.getAllUsers);

// Get user stats (Admin only)
router.get('/stats', protect, admin, userController.getUserStats);

// Get user by ID (Admin only)
router.get('/:id', protect, admin, userController.getUserById);

// Update user role (Admin only)
router.put('/:id/role', protect, admin, userController.updateUserRole);

// Delete user (Admin only)
router.delete('/:id', protect, admin, userController.deleteUser);

export default router;