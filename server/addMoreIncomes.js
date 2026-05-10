const mongoose = require('mongoose');
const Income = require('./src/models/Income');

const MONGO_URI = 'mongodb://localhost:27017/linkydo'; // замените на ваш URI
const userId = '69f30a553b3a655c57fea0bb'; // ваш ID пользователя

const additionalData = [
  // Март 2026 (3 заказа)
  {
    description: 'Заказ с площадки #m01',
    amount: 12000,
    buyerType: 'individual',
    date: new Date('2026-03-15'),
    type: 'order',
  },
  {
    description: 'Заказ с площадки #m02',
    amount: 8000,
    buyerType: 'individual',
    date: new Date('2026-03-20'),
    type: 'order',
  },
  {
    description: 'Ручной заказ (март)',
    amount: 3500,
    buyerType: 'individual',
    date: new Date('2026-03-05'),
    type: 'manual',
  },
  // Апрель 2026 (3 заказа)
  {
    description: 'Проект на площадке #a01',
    amount: 15000,
    buyerType: 'company',
    date: new Date('2026-04-10'),
    type: 'order',
  },
  {
    description: 'Консультация вне площадки',
    amount: 6500,
    buyerType: 'individual',
    date: new Date('2026-04-18'),
    type: 'manual',
  },
  {
    description: 'Доработки по проекту',
    amount: 9500,
    buyerType: 'individual',
    date: new Date('2026-04-22'),
    type: 'order',
  },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Подключено к MongoDB');

    for (const rec of additionalData) {
      await Income.create({
        user: new mongoose.Types.ObjectId(userId),
        description: rec.description,
        amount: rec.amount,
        buyerType: rec.buyerType,
        date: rec.date,
        type: rec.type,
      });
      console.log(`Добавлено: ${rec.description}, ${rec.amount} руб.`);
    }

    console.log(`✅ Всего добавлено ${additionalData.length} записей`);
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Ошибка добавления:', err);
    process.exit(1);
  }
})();