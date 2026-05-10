const mongoose = require('mongoose');

const FreelancerMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  taxRegime: {
    type: String,
    enum: ['NPD', 'NDFL', 'none'],
    default: 'NPD'
  },
  // Данные для расчета юнит-экономики
  averageOrderPrice: { type: Number, default: 0 },   // средний чек
  ordersPerMonth: { type: Number, default: 0 },      // заказов в месяц
  fixedExpenses: { type: Number, default: 0 },       // постоянные расходы
  variableExpensePercent: { type: Number, default: 0 }, // переменные расходы в % от выручки
  companyIncomePercent: { type: Number, default: 0, min: 0, max: 100 },

  // Рассчитанные показатели (обновляются при запросе)
  monthlyRevenue: Number,
  netProfit: Number,
  taxAmount: Number,
  profitability: Number,
  breakEvenPoint: Number,
  forecastedIncome: [Number], // прогноз на следующие 6 месяцев

}, { timestamps: true });

module.exports = mongoose.model('FreelancerMetrics', FreelancerMetricsSchema);