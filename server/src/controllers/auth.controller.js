/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

import User from '../models/users.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, full_name, phone } = req.body;

  // Validation
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide username, email, and password');
  }

  // Check if user exists
  const userExists = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email or username');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    full_name: full_name || username,
    phone,
    role: 'customer'
  });

  if (user) {
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Validation
  if (!password) {
    res.status(400);
    throw new Error('Please provide password');
  }

  if (!email && !username) {
    res.status(400);
    throw new Error('Please provide email or username');
  }

  // Find user by email or username
  // MUST select password field explicitly
  const user = await User.findOne({
    $or: [
      { email: email || '' },
      { username: username || '' }
    ]
  }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if password exists in user object
  if (!user.password) {
    console.error('Password not found in user object:', user._id);
    res.status(500);
    throw new Error('User password not properly stored');
  }

  // Check password
  let isPasswordMatch = false;
  try {
    isPasswordMatch = await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('Password compare error:', error);
    res.status(500);
    throw new Error('Error validating password');
  }

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Logout user (client-side - just remove token)
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In JWT, logout is handled on client side by removing token
  // But we can log it for tracking
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Public
export const verifyToken = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401);
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      valid: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid token');
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password (send reset email)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this email');
  }

  // TODO: Generate reset token and send email
  // For now, just return success
  res.json({
    success: true,
    message: 'Password reset instructions sent to email'
  });
});