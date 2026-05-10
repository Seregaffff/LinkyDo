const mongoose = require('mongoose');
const Order = require('./src/models/order.model');
const Income = require('./src/models/Income');

const MONGO_URI = 'mongodb://localhost:27017/linkydo'; // замените на ваш

(async () => {
  await mongoose.connect(MONGO_URI);
  const orders = await Order.find({ isCompleted: true });
  let created = 0;
  for (const order of orders) {
    const exists = await Income.findOne({ orderId: order._id });
    if (!exists) {
      await Income.create({
        user: order.sellerID,
        description: `Заказ #${order._id.toString().slice(-6)}`,
        comment: 'Доход с площадки',
        amount: order.price,
        buyerType: 'individual',
        date: order.updatedAt || new Date(),
        type: 'order',
        orderId: order._id,
      });
      created++;
    }
  }
  console.log(`Создано ${created} записей о доходах из ${orders.length} завершённых заказов`);
  mongoose.disconnect();
})();