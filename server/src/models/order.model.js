const mongoose = require('mongoose');
const Income = require('./Income'); 

const orderSchema = new mongoose.Schema({
  gigID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  sellerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  payment_intent: {
    type: String,
    required: true,
  },
}, {
  versionKey: false,
  timestamps: true
});

orderSchema.post('save', async function(doc, next) {
  try {
    if (doc.isModified('isCompleted') && doc.isCompleted === true) {
      const existingIncome = await Income.findOne({ orderId: doc._id });
      if (!existingIncome) {
        await Income.create({
          user: doc.sellerID,
          description: `Заказ #${doc._id.toString().slice(-6)}`,
          comment: 'Доход с площадки',
          amount: doc.price,
          buyerType: 'individual', 
          date: new Date(),
          type: 'order',
          orderId: doc._id,
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Order', orderSchema);