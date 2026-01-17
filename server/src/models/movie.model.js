import mongoose from 'mongoose';

const castMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  character: {
    type: String,
    trim: true
  },
  profile_path: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  // IDs từ các nguồn khác nhau
  movielens_id: {
    type: Number,
    unique: true,
    sparse: true
  },
  tmdb_id: {
    type: Number,
    unique: true,
    sparse: true
  },

  // Thông tin cơ bản
  title: {
    type: String,
    required: [true, 'Tên phim là bắt buộc'],
    trim: true,
    index: true
  },
  original_title: {
    type: String,
    trim: true
  },
  overview: {
    type: String,
    required: [true, 'Mô tả phim là bắt buộc'],
    maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
  },

  // Hình ảnh
  poster_path: {
    type: String,
    required: [true, 'Poster là bắt buộc']
  },
  backdrop_path: {
    type: String
  },

  // Thông tin phát hành
  release_year: {
    type: String,
    required: true
  },
  release_date: {
    type: Date,
    required: true
  },

  // Thời lượng (phút)
  runtime: {
    type: Number,
    required: [true, 'Thời lượng phim là bắt buộc'],
    min: [1, 'Thời lượng phải lớn hơn 0']
  },

  // Đánh giá
  vote_average: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  vote_count: {
    type: Number,
    default: 0,
    min: 0
  },
  popularity: {
    type: Number,
    default: 0
  },

  // Thể loại (2 nguồn)
  movielens_genres: [{
    type: String,
    trim: true
  }],
  tmdb_genres: [{
    type: String,
    trim: true
  }],

  // Cast & Crew
  cast: [castMemberSchema],
  director: {
    type: String,
    required: [true, 'Đạo diễn là bắt buộc'],
    trim: true
  },

  // Thông tin sản xuất
  production_countries: [{
    type: String,
    trim: true
  }],
  original_language: {
    type: String,
    required: true,
    default: 'en'
  },
  spoken_languages: [{
    type: String,
    trim: true
  }],

  // Video URLs
  trailer_url: {
    type: String
  },
  video_url: {
    type: String,
    required: [true, 'URL video là bắt buộc']
  },

  // Thông tin bổ sung cho streaming
  video_quality: [{
    quality: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '4K']
    },
    url: String
  }],

  // Phụ đề
  subtitles: [{
    language: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],

  // Độ tuổi
  age_rating: {
    type: String,
    enum: ['P', 'K', 'T13', 'T16', 'T18', 'C'],
    default: 'P'
  },

  // Trạng thái
  status: {
    type: String,
    enum: ['coming_soon', 'now_showing', 'archived'],
    default: 'now_showing'
  },

  // Đã được enriched từ TMDB hay chưa
  enriched: {
    type: Boolean,
    default: false
  },

  // Lượt xem
  view_count: {
    type: Number,
    default: 0
  },

  // Featured (phim nổi bật)
  is_featured: {
    type: Boolean,
    default: false
  },

  // SEO
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes để tối ưu tìm kiếm
movieSchema.index({ title: 'text', overview: 'text', director: 'text' });
movieSchema.index({ release_year: -1 });
movieSchema.index({ vote_average: -1 });
movieSchema.index({ popularity: -1 });
movieSchema.index({ view_count: -1 });
movieSchema.index({ tmdb_genres: 1 });
movieSchema.index({ movielens_genres: 1 });

// Virtual cho rating trung bình từ reviews
movieSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'movie'
});

// Tạo slug tự động từ title
movieSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Method để tăng view count
movieSchema.methods.incrementViewCount = async function() {
  this.view_count += 1;
  return await this.save();
};

// Static method để lấy phim trending
movieSchema.statics.getTrendingMovies = function(limit = 10) {
  return this.find({ status: 'now_showing' })
    .sort({ popularity: -1, view_count: -1 })
    .limit(limit);
};

// Static method để lấy phim theo thể loại
movieSchema.statics.getByGenre = function(genre, limit = 20) {
  return this.find({
    $or: [
      { tmdb_genres: genre },
      { movielens_genres: genre }
    ],
    status: 'now_showing'
  })
  .sort({ popularity: -1 })
  .limit(limit);
};

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;