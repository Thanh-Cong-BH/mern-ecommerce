import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // ⭐ IMPORTANT: Don't return password by default
  },
  full_name: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  role: {
    type: String,
    enum: ['customer', 'staff', 'admin'],
    default: 'customer'
  },
  
  // User preferences
  preferences: {
    language: {
      type: String,
      default: 'vi'
    },
    subtitle_language: {
      type: String,
      default: 'vi'
    },
    video_quality: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '4K', 'auto'],
      default: 'auto'
    },
    autoplay: {
      type: Boolean,
      default: true
    }
  },
  
  // User statistics
  stats: {
    total_watched: {
      type: Number,
      default: 0
    },
    total_reviews: {
      type: Number,
      default: 0
    },
    watch_time_minutes: {
      type: Number,
      default: 0
    }
  },
  
  // Account status
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: String,
  reset_password_token: String,
  reset_password_expire: Date,
  
  last_login: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Virtual for watchlist
userSchema.virtual('watchlist', {
  ref: 'Watchlist',
  localField: '_id',
  foreignField: 'user'
});

// Virtual for view history
userSchema.virtual('viewHistory', {
  ref: 'ViewHistory',
  localField: '_id',
  foreignField: 'user'
});

// Virtual for subscription
userSchema.virtual('subscription', {
  ref: 'Subscription',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  // Import bcrypt here to avoid circular dependency
  const bcrypt = await import('bcryptjs');
  return await bcrypt.default.compare(enteredPassword, this.password);
};

// Method to update stats
userSchema.methods.incrementWatched = async function() {
  this.stats.total_watched += 1;
  await this.save();
};

userSchema.methods.incrementReviews = async function() {
  this.stats.total_reviews += 1;
  await this.save();
};

userSchema.methods.addWatchTime = async function(minutes) {
  this.stats.watch_time_minutes += minutes;
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;