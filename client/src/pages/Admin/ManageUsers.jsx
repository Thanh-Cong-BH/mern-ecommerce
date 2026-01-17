import { useState, useEffect } from 'react';
import axios from 'axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userList = response.data.data || response.data || [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users. Make sure you have the /api/users endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Change user role to "${newRole}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      alert('Role updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(users.filter(u => u._id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Manage Users</h1>
          <p className="text-gray-400">Total: {users.length} users</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="input max-w-md"
          />
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-lighter">
                <tr>
                  <th className="text-left text-gray-400 py-4 px-6">Username</th>
                  <th className="text-left text-gray-400 py-4 px-6">Email</th>
                  <th className="text-left text-gray-400 py-4 px-6">Role</th>
                  <th className="text-left text-gray-400 py-4 px-6">Joined</th>
                  <th className="text-left text-gray-400 py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-800 hover:bg-dark-lighter">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-white font-semibold">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{user.email}</td>
                    <td className="py-4 px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-dark-light text-white border border-gray-700 rounded px-3 py-1"
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => alert(`View details for ${user.username} - Feature coming soon!`)}
                          className="text-blue-500 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          className="text-red-500 hover:underline"
                          disabled={user.role === 'admin'}
                        >
                          {user.role === 'admin' ? 'Protected' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No users found
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Users</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Admins</p>
            <p className="text-3xl font-bold text-white">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Customers</p>
            <p className="text-3xl font-bold text-white">
              {users.filter(u => u.role === 'customer').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;