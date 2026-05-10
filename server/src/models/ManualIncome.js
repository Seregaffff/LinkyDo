const mongoose = require('mongoose');

const manualIncomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    comment: { type: String, default: '' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    buyerType: { type: String, enum: ['individual', 'company'], default: 'individual' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ManualIncome', manualIncomeSchema);