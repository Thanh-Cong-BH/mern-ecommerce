import mongoose from 'mongoose';

const viewHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  last_watched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
viewHistorySchema.index({ user: 1, movie: 1 }, { unique: true });
viewHistorySchema.index({ user: 1, last_watched: -1 });

export default mongoose.model('ViewHistory', viewHistorySchema);