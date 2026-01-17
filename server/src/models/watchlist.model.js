import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  // Ghi chú cá nhân của user
  note: {
    type: String,
    maxlength: 500
  },
  // Ưu tiên xem (1-5)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // Trạng thái
  status: {
    type: String,
    enum: ['want_to_watch', 'watching', 'watched'],
    default: 'want_to_watch'
  }
}, {
  timestamps: true
});

// Composite index - mỗi user không thể thêm 1 phim 2 lần
watchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

// Index để sort theo priority
watchlistSchema.index({ priority: -1, createdAt: -1 });

// Static method để lấy watchlist của user
watchlistSchema.statics.getUserWatchlist = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('movie')
    .sort({ priority: -1, createdAt: -1 });
};

// Method để đổi status
watchlistSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  return await this.save();
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

export default Watchlist;