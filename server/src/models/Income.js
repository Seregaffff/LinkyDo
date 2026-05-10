const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Order',
  default: null,
  index: true,
  },
  description: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Сумма обязательна'],
    min: 0
  },
  buyerType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['manual', 'order'],
    default: 'manual'
  },
  taxRate: {
    type: Number,
    default: function() {
      return this.buyerType === 'company' ? 0.06 : 0.04;
    }
  },
  tax: {
    type: Number,
    default: function() {
      return +(this.amount * this.taxRate).toFixed(2);
    }
  }
}, {
  timestamps: true
});

// Пересчёт налога перед каждым сохранением
incomeSchema.pre('save', function(next) {
  if (this.isModified('buyerType') || this.isModified('amount')) {
    this.taxRate = this.buyerType === 'company' ? 0.06 : 0.04;
    this.tax = +(this.amount * this.taxRate).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('Income', incomeSchema);