import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Loại gói
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'family'],
    default: 'free',
    required: true
  },
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  // Ngày bắt đầu
  start_date: {
    type: Date,
    default: Date.now
  },
  // Ngày hết hạn
  end_date: {
    type: Date,
    required: true
  },
  // Tự động gia hạn
  auto_renew: {
    type: Boolean,
    default: true
  },
  // Giá (VND)
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Phương thức thanh toán
  payment_method: {
    type: String,
    enum: ['vnpay', 'momo', 'card', 'bank_transfer'],
    required: true
  },
  // Mã giao dịch
  transaction_id: {
    type: String,
    unique: true,
    sparse: true
  },
  // Lịch sử thanh toán
  payment_history: [{
    amount: Number,
    payment_date: {
      type: Date,
      default: Date.now
    },
    transaction_id: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending']
    }
  }],
  // Thiết bị được phép xem đồng thời
  max_concurrent_streams: {
    type: Number,
    default: 1
  },
  // Thiết bị đang xem (để giới hạn concurrent streams)
  active_streams: [{
    device_id: String,
    started_at: Date,
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie'
    }
  }]
}, {
  timestamps: true
});

// Index để check subscription expired
subscriptionSchema.index({ end_date: 1, status: 1 });

// Static method để lấy chi tiết các gói
subscriptionSchema.statics.getPlanDetails = function() {
  return {
    free: {
      name: 'Miễn phí',
      price: 0,
      duration: 365, // days
      features: [
        'Xem phim có quảng cáo',
        'Chất lượng SD (480p)',
        '1 thiết bị'
      ],
      max_concurrent_streams: 1
    },
    basic: {
      name: 'Cơ bản',
      price: 70000, // VND/tháng
      duration: 30,
      features: [
        'Xem phim không quảng cáo',
        'Chất lượng HD (720p)',
        '1 thiết bị',
        'Tải phim offline'
      ],
      max_concurrent_streams: 1
    },
    premium: {
      name: 'Cao cấp',
      price: 120000,
      duration: 30,
      features: [
        'Xem phim không quảng cáo',
        'Chất lượng Full HD & 4K',
        '2 thiết bị đồng thời',
        'Tải phim offline',
        'Âm thanh Dolby Atmos'
      ],
      max_concurrent_streams: 2
    },
    family: {
      name: 'Gia đình',
      price: 180000,
      duration: 30,
      features: [
        'Xem phim không quảng cáo',
        'Chất lượng Full HD & 4K',
        '4 thiết bị đồng thời',
        'Tải phim offline',
        'Âm thanh Dolby Atmos',
        '4 profile độc lập'
      ],
      max_concurrent_streams: 4
    }
  };
};

// Method để kiểm tra subscription còn hiệu lực không
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.end_date > new Date();
};

// Method để kiểm tra có thể stream không (dựa vào max concurrent)
subscriptionSchema.methods.canStream = function() {
  if (!this.isActive()) {
    return false;
  }
  
  // Xóa các stream cũ hơn 4 giờ
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  this.active_streams = this.active_streams.filter(
    stream => stream.started_at > fourHoursAgo
  );
  
  return this.active_streams.length < this.max_concurrent_streams;
};

// Method để bắt đầu stream
subscriptionSchema.methods.startStream = async function(deviceId, movieId) {
  if (!this.canStream()) {
    throw new Error('Đã đạt giới hạn số thiết bị xem đồng thời');
  }
  
  this.active_streams.push({
    device_id: deviceId,
    started_at: new Date(),
    movie: movieId
  });
  
  return await this.save();
};

// Method để kết thúc stream
subscriptionSchema.methods.endStream = async function(deviceId) {
  this.active_streams = this.active_streams.filter(
    stream => stream.device_id !== deviceId
  );
  return await this.save();
};

// Method để gia hạn subscription
subscriptionSchema.methods.renew = async function() {
  const planDetails = this.constructor.getPlanDetails()[this.plan];
  
  this.start_date = this.end_date;
  this.end_date = new Date(
    this.end_date.getTime() + planDetails.duration * 24 * 60 * 60 * 1000
  );
  this.status = 'active';
  
  // Thêm vào lịch sử thanh toán
  this.payment_history.push({
    amount: planDetails.price,
    payment_date: new Date(),
    status: 'success'
  });
  
  return await this.save();
};

// Method để hủy subscription
subscriptionSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.auto_renew = false;
  return await this.save();
};

// Pre-save middleware để set end_date và max_concurrent_streams khi tạo mới
subscriptionSchema.pre('save', function(next) {
  if (this.isNew) {
    const planDetails = this.constructor.getPlanDetails()[this.plan];
    
    if (!this.end_date) {
      this.end_date = new Date(
        this.start_date.getTime() + planDetails.duration * 24 * 60 * 60 * 1000
      );
    }
    
    if (!this.max_concurrent_streams) {
      this.max_concurrent_streams = planDetails.max_concurrent_streams;
    }
  }
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;