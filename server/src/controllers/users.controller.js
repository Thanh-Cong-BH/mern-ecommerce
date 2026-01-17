import ResponseUtils from '../utils/ResponseUtils.js';
import userService from '../services/users.service.js';

// Format user data - remove sensitive info
const formatUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  if (userObj.password) { delete userObj.password; }
  return userObj;
}

// Get current user info (for /api/auth/me)
export const getInfo = async (req, res, next) => {
  try {
    const user = await userService.getOneById(req.user._id, '-password');
    if (user) {
      ResponseUtils.status200(res, 'Get info successfully!', formatUser(user));
    } else {
      ResponseUtils.status404(res, 'User not found!');
    }
  } catch (err) { next(err); }
}

// Update current user info
export const updateInfo = async (req, res, next) => {
  try {
    const updateUser = await userService.updateBasicInfo(req.user._id, req.body);
    if (updateUser) {
      ResponseUtils.status200(
        res,
        'Update info successfully!',
        formatUser(updateUser)
      );
    } else {
      ResponseUtils.status404(res, 'User not found!');
    }
  } catch (err) { next(err); }
}

// ============================================
// ADMIN FUNCTIONS - For Admin Dashboard
// ============================================

// Get all users (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    
    // Build query
    let query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await userService.getAllUsers(query);
    const formattedUsers = users.map(user => formatUser(user));
    
    ResponseUtils.status200(
      res, 
      'Get all users successfully', 
      formattedUsers
    );
  } catch (err) { next(err); }
}

// Get user by ID (Admin only)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getOneById(id, '-password');
    
    if (user) {
      ResponseUtils.status200(
        res, 
        'Get user successfully', 
        formatUser(user)
      );
    } else {
      ResponseUtils.status404(res, 'User not found!');
    }
  } catch (err) { next(err); }
}

// Update user role (Admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['customer', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      return ResponseUtils.status400(res, 'Invalid role. Must be: customer, staff, or admin');
    }

    const updatedUser = await userService.updateRole(id, role);
    
    if (updatedUser) {
      ResponseUtils.status200(
        res,
        `User role updated to '${role}' successfully!`,
        formatUser(updatedUser)
      );
    } else {
      ResponseUtils.status404(res, 'User not found!');
    }
  } catch (err) { next(err); }
}

// Delete user (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const user = await userService.getOneById(id, 'role');
    if (!user) {
      return ResponseUtils.status404(res, 'User not found!');
    }

    if (user.role === 'admin') {
      return ResponseUtils.status403(res, 'Cannot delete admin users!');
    }

    // Prevent self-deletion
    if (id === req.user._id.toString()) {
      return ResponseUtils.status403(res, 'Cannot delete your own account!');
    }

    await userService.deleteUser(id);
    ResponseUtils.status200(res, 'User deleted successfully!');
  } catch (err) { next(err); }
}

// Get user statistics (Admin only)
export const getUserStats = async (req, res, next) => {
  try {
    const stats = await userService.getStats();
    ResponseUtils.status200(res, 'Get user stats successfully', stats);
  } catch (err) { next(err); }
}