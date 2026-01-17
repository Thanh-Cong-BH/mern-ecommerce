/**
 * Create Admin User Script
 * Run: node create-admin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// User Schema (inline)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  full_name: String,
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Connect to DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieplay';

console.log('Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB\n');

// Admin credentials
const adminData = {
  username: 'admin',
  email: 'admin@movieplay.com',
  password: 'Admin123456',
  full_name: 'Admin User',
  role: 'admin'
};

console.log('Creating admin user with credentials:');
console.log('  Username:', adminData.username);
console.log('  Email:', adminData.email);
console.log('  Password:', adminData.password);
console.log('  Role:', adminData.role);
console.log('');

try {
  // Check if admin already exists
  const existingAdmin = await User.findOne({ 
    $or: [
      { email: adminData.email },
      { username: adminData.username }
    ]
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!');
    console.log('   ID:', existingAdmin._id);
    console.log('   Username:', existingAdmin.username);
    console.log('   Email:', existingAdmin.email);
    console.log('   Role:', existingAdmin.role);
    console.log('');
    
    // Ask if want to update role
    if (existingAdmin.role !== 'admin') {
      console.log('⚠️  User exists but is not admin. Updating role...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Role updated to admin');
    }
  } else {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = await User.create({
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      full_name: adminData.full_name,
      role: 'admin',
      is_active: true,
      is_verified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   ID:', admin._id);
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
  }

  console.log('');
  console.log('========================================');
  console.log('Login credentials:');
  console.log('========================================');
  console.log('Username:', adminData.username);
  console.log('Password:', adminData.password);
  console.log('========================================');
  console.log('');
  console.log('Test login:');
  console.log('curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"username":"admin","password":"Admin123456"}\'');
  console.log('');

} catch (error) {
  console.error('❌ Error creating admin:', error);
}

// Close connection
await mongoose.connection.close();
console.log('Database connection closed');