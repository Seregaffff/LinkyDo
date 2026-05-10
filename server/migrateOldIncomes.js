const mongoose = require('mongoose');
const Income = require('./src/models/Income');
const axios = require('axios');

const MONGO_URI = 'mongodb://localhost:27017/your_db';
const OLD_API = 'http://localhost:8080/api/metrics/tax-report-data';
const TOKEN = 'твой_токен_из_localStorage'; 

(async () => {
  await mongoose.connect(MONGO_URI);
  const { data } = await axios.get(OLD_API, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const records = data.records || data; // массив старых записей
  for (const rec of records) {
    await Income.create({
      user: '69f30a553b3a655c57fea0bb',
      description: rec.description || '',
      amount: rec.amount,
      buyerType: rec.buyerType || 'individual',
      date: rec.date,
      type: rec.type || 'order',
      tax: rec.tax || rec.amount * 0.04,
      taxRate: rec.taxRate || 0.04
    });
  }
  console.log(`Перенесено ${records.length} записей`);
  mongoose.disconnect();
})();