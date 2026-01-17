import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Review phải thuộc về một phim'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review phải có người dùng'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Vui lòng đánh giá phim'],
    min: [1, 'Rating tối thiểu là 1'],
    max: [10, 'Rating tối đa là 10']
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề đánh giá'],
    trim: true,
    maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
  },
  comment: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung đánh giá'],
    maxlength: [1000, 'Nội dung không được vượt quá 1000 ký tự']
  },
  // Số người thấy review hữu ích
  helpful_count: {
    type: Number,
    default: 0
  },
  // Người dùng nào đã vote helpful
  helpful_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Trạng thái (admin có thể ẩn review vi phạm)
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  },
  // Review có bị báo cáo không
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Composite index - mỗi user chỉ review 1 phim 1 lần
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// Index để sort theo helpful
reviewSchema.index({ helpful_count: -1 });

// Static method để tính rating trung bình của phim
reviewSchema.statics.calcAverageRating = async function(movieId) {
  const stats = await this.aggregate([
    {
      $match: { movie: movieId, status: 'active' }
    },
    {
      $group: {
        _id: '$movie',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Movie').findByIdAndUpdate(movieId, {
      vote_average: stats[0].avgRating.toFixed(1),
      vote_count: stats[0].numReviews
    });
  } else {
    await mongoose.model('Movie').findByIdAndUpdate(movieId, {
      vote_average: 0,
      vote_count: 0
    });
  }
};

// Sau khi save review, tính lại rating của phim
reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.movie);
});

// Sau khi xóa review, tính lại rating của phim
reviewSchema.post('remove', function() {
  this.constructor.calcAverageRating(this.movie);
});

// Method để toggle helpful
reviewSchema.methods.toggleHelpful = async function(userId) {
  const index = this.helpful_by.indexOf(userId);
  
  if (index > -1) {
    // User đã vote, bỏ vote
    this.helpful_by.splice(index, 1);
    this.helpful_count -= 1;
  } else {
    // User chưa vote, thêm vote
    this.helpful_by.push(userId);
    this.helpful_count += 1;
  }
  
  return await this.save();
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;