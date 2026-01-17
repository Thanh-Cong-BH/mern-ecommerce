import User from '../models/users.model.js';

class UserService {
  // Get user by ID
  async getOneById(id, select = '') {
    return await User.findById(id).select(select);
  }

  // Update basic info
  async updateBasicInfo(id, data) {
    const { username, email, full_name, avatar } = data;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (full_name) updateData.full_name = full_name;
    if (avatar) updateData.avatar = avatar;

    return await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  // Get all users with query
  async getAllUsers(query = {}) {
    return await User.find(query)
      .select('-password')
      .sort('-createdAt');
  }

  // Update user role
  async updateRole(id, role) {
    return await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
  }

  // Delete user
  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  // Get user statistics
  async getStats() {
    const total = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const staff = await User.countDocuments({ role: 'staff' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return {
      total,
      customers,
      staff,
      admins,
      recentUsers
    };
  }

  // Get list by role (for backwards compatibility if needed)
  async getListByRole(role) {
    if (!role) {
      return await this.getAllUsers();
    }
    return await this.getAllUsers({ role });
  }

  // Create user (for auth service)
  async create(data) {
    const user = new User(data);
    return await user.save();
  }
}

export default new UserService();