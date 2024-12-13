// models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planName: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'pending'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  price: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    default: '',
  },
  transactionId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
