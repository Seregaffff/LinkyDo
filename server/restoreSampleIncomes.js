const mongoose = require('mongoose');
const Income = require('./src/models/Income');

const MONGO_URI = 'mongodb://localhost:27017/linkydo'; // замените на ваш
const userId = '69f30a553b3a655c57fea0bb';

// Данные из таблицы
const sampleData = [
  { description: 'Покупка на площадке', amount: 10000, buyerType: 'individual', date: new Date('2026-05-09'), type: 'order' },
  { description: 'Покупка на площадке', amount: 10000, buyerType: 'individual', date: new Date('2026-05-09'), type: 'order' },
  { description: 'Покупка на площадке', amount: 50000, buyerType: 'individual', date: new Date('2026-05-09'), type: 'order' },
  { description: 'Заказ #b3d56r', amount: 7000, buyerType: 'individual', date: new Date('2026-05-09'), type: 'order' },
  { description: 'Заказ вне площадки', amount: 5000, buyerType: 'individual', date: new Date('2026-05-09'), type: 'manual' },
  { description: 'Заказы', amount: 5000, buyerType: 'individual', date: new Date('2026-05-07'), type: 'order' },
  { description: 'Заказ вне площадки', amount: 4000, buyerType: 'individual', date: new Date('2026-05-06'), type: 'manual' },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Подключено к MongoDB');
    console.log('Коллекция:', Income.collection.name);

    // Удаляем старые записи, если нужно (начисто)
    await Income.deleteMany({ user: new mongoose.Types.ObjectId(userId) });

    for (const rec of sampleData) {
      const income = new Income({
        user: new mongoose.Types.ObjectId(userId),
        description: rec.description,
        amount: rec.amount,
        buyerType: rec.buyerType,
        date: rec.date,
        type: rec.type,
      });
      await income.save();
      console.log(`Добавлено: ${rec.description}, amount: ${rec.amount}, type: ${rec.type}`);
    }

    console.log(`✅ Всего добавлено ${sampleData.length} записей`);
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
    process.exit(1);
  }
})();