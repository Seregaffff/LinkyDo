const FreelancerMetrics = require('../models/FreelancerMetrics');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const Order = require('../models/order.model'); 
const ManualIncome = require('../models/ManualIncome'); 
const ExcelJS = require('exceljs');

// Ставки налога РФ на 2026 год
const NPD_RATES = {
  individual: 0.04,
  company: 0.06
};
const NPD_LIMIT = 2_400_000;

const NDFL_BRACKETS = [
  { limit: 2_400_000, rate: 0.13 },
  { limit: 5_000_000, rate: 0.15 },
  { limit: 20_000_000, rate: 0.18 },
  { limit: 50_000_000, rate: 0.20 },
  { limit: 100_000_000, rate: 0.22 },
  { limit: Infinity, rate: 0.25 }
];

// Расчет налога НПД
function calculateNPD(revenue, incomeFromCompanies = 0) {
  if (revenue > NPD_LIMIT) throw new Error('Доход превышает лимит для НПД');
  const fromIndividuals = revenue - incomeFromCompanies;
  return fromIndividuals * NPD_RATES.individual + incomeFromCompanies * NPD_RATES.company;
}

// Расчет НДФЛ (прогрессивная шкала)
function calculateNDFL(revenue) {
  let remaining = revenue;
  let tax = 0;
  let prevLimit = 0;
  for (const bracket of NDFL_BRACKETS) {
    const taxable = Math.min(remaining, bracket.limit - prevLimit);
    tax += taxable * bracket.rate;
    remaining -= taxable;
    if (remaining <= 0) break;
    prevLimit = bracket.limit;
  }
  return tax;
}

// Расчет чистой прибыли и рентабельности
function calculateProfitability(revenue, fixedExpenses, variablePercent) {
  const variable = revenue * (variablePercent / 100);
  const totalExpenses = fixedExpenses + variable;
  return revenue - totalExpenses;
}

// Прогноз продаж (+5% в месяц)
function forecastRevenue(currentRevenue, months = 6) {
  const forecast = [];
  for (let i = 0; i < months; i++) {
    forecast.push(currentRevenue * (1 + 0.05) ** (i + 1));
  }
  return forecast;
}

// Получить/создать метрики пользователя
const getMetrics = async (req, res) => {
  try {
    const userId = req.userID;
    let metrics = await FreelancerMetrics.findOne({ userId });
    if (!metrics) {
      metrics = await FreelancerMetrics.create({ userId });
    }
    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Обновить параметры и пересчитать все показатели
const updateMetrics = async (req, res) => {
  try {
    const userId = req.userID;
    const { averageOrderPrice, ordersPerMonth, fixedExpenses, variableExpensePercent, taxRegime, companyIncomePercent } = req.body;

    let metrics = await FreelancerMetrics.findOne({ userId });
    if (!metrics) metrics = new FreelancerMetrics({ userId });

    metrics.averageOrderPrice = averageOrderPrice ?? metrics.averageOrderPrice;
    metrics.ordersPerMonth = ordersPerMonth ?? metrics.ordersPerMonth;
    metrics.fixedExpenses = fixedExpenses ?? metrics.fixedExpenses;
    metrics.variableExpensePercent = variableExpensePercent ?? metrics.variableExpensePercent;
    metrics.taxRegime = taxRegime || metrics.taxRegime;

    const monthlyRevenue = metrics.averageOrderPrice * metrics.ordersPerMonth;
    metrics.monthlyRevenue = monthlyRevenue;

    let taxAmount = 0;
    switch (metrics.taxRegime) {
      case 'NPD':
        if (monthlyRevenue * 12 > NPD_LIMIT) {
          return res.status(400).json({ error: 'Годовой доход превышает лимит НПД (2.4 млн ₽). Выберите другой режим.' });
        }
        const companyIncome = monthlyRevenue * (companyIncomePercent || 0) / 100;
        taxAmount = calculateNPD(monthlyRevenue, companyIncome);
        break;
      case 'NDFL':
        taxAmount = calculateNDFL(monthlyRevenue * 12) / 12;
        break;
      default:
        taxAmount = 0;
    }
    metrics.taxAmount = taxAmount;

    const netProfit = calculateProfitability(monthlyRevenue, metrics.fixedExpenses, metrics.variableExpensePercent);
    metrics.netProfit = netProfit;
    metrics.profitability = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;

    const contributionMargin = metrics.averageOrderPrice - (metrics.averageOrderPrice * metrics.variableExpensePercent / 100);
    metrics.breakEvenPoint = contributionMargin > 0 ? Math.ceil(metrics.fixedExpenses / contributionMargin) : 0;

    metrics.forecastedIncome = forecastRevenue(netProfit, 6);

    await metrics.save();
    res.status(200).json(metrics);
  } catch (err) {
    console.error('updateMetrics error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Выгрузка общей статистики в Excel
const downloadReport = async (req, res) => {
  try {
    const metrics = await FreelancerMetrics.findOne({ userId: req.userID });
    if (!metrics) return res.status(404).json({ error: 'Нет данных' });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Юнит-экономика');

    sheet.columns = [
      { header: 'Показатель', key: 'label', width: 30 },
      { header: 'Значение', key: 'value', width: 20 }
    ];

    sheet.addRows([
      { label: 'Средний чек', value: metrics.averageOrderPrice },
      { label: 'Заказов в месяц', value: metrics.ordersPerMonth },
      { label: 'Месячная выручка', value: metrics.monthlyRevenue },
      { label: 'Постоянные расходы', value: metrics.fixedExpenses },
      { label: 'Переменные расходы (%)', value: metrics.variableExpensePercent },
      { label: 'Налог (мес.)', value: metrics.taxAmount },
      { label: 'Чистая прибыль', value: metrics.netProfit },
      { label: 'Рентабельность (%)', value: metrics.profitability?.toFixed(1) },
      { label: 'Точка безубыточности (заказов)', value: metrics.breakEvenPoint },
      { label: 'Налоговый режим', value: metrics.taxRegime },
    ]);

    if (metrics.forecastedIncome) {
      sheet.addRow({ label: 'Прогноз чистой прибыли (6 мес.)', value: '' });
      metrics.forecastedIncome.forEach((val, i) => {
        sheet.addRow({ label: `Месяц ${i+1}`, value: val });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=unit_economy.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Генерация информационной справки о доходах (КНД 1122036)
const taxReport = async (req, res) => {
  try {
    const metrics = await FreelancerMetrics.findOne({ userId: req.userID });
    if (!metrics) {
      return res.status(404).json({ message: 'Метрики не найдены. Сначала рассчитайте юнит-экономику.' });
    }

    const user = await User.findById(req.userID);
	const fullName = user ? (user.username || user.email) : 'Фрилансер LinkyDo';

    const forecast = metrics.forecastedIncome || [];
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const currentMonth = new Date().getMonth();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Справка о доходах');

    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'СПРАВКА О ДОХОДАХ ПО НАЛОГУ НА ПРОФЕССИОНАЛЬНЫЙ ДОХОД';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = '(на основе данных сервиса LinkyDo, не является официальным документом ФНС)';
    sheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF888888' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([]);
    sheet.addRow(['Налогоплательщик:', fullName]);
    sheet.addRow(['ИНН:', 'не указан']);
    sheet.addRow(['Период:', `${months[currentMonth]} ${new Date().getFullYear()} г.`]);
    sheet.addRow(['Налоговый режим:', metrics.taxRegime === 'NPD' ? 'НПД (самозанятость)' : metrics.taxRegime]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Месяц', 'Доход (руб.)', 'Ставка налога', 'Исчисленный налог (руб.)']);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      cell.border = { bottom: { style: 'thin' } };
      cell.alignment = { horizontal: 'center' };
    });

    let totalIncome = 0;
    let totalTax = 0;
    const effectiveRate = metrics.monthlyRevenue ? (metrics.taxAmount / metrics.monthlyRevenue) : 0;

    let taxRate = '4%';
    if (metrics.taxRegime === 'NPD') {
      const companyPercent = metrics.companyIncomePercent || 0;
      taxRate = companyPercent > 0 ? '4% / 6%' : '4%';
    } else if (metrics.taxRegime === 'NDFL') {
      taxRate = '13%';
    }

    for (let i = 0; i < forecast.length; i++) {
      const income = forecast[i];
      const monthName = months[(currentMonth + i) % 12];
      const calcTax = Math.round(income * effectiveRate);

      const row = sheet.addRow([monthName, income || 0, taxRate, calcTax]);
      row.getCell(2).numFormat = '#,##0';
      row.getCell(4).numFormat = '#,##0';
      row.eachCell(cell => (cell.alignment = { horizontal: 'center' }));

      totalIncome += income || 0;
      totalTax += calcTax;
    }

    sheet.addRow([]);
    const totalRow = sheet.addRow(['', 'ИТОГО', totalIncome, '', totalTax]);
    totalRow.font = { bold: true };
    totalRow.getCell(2).alignment = { horizontal: 'center' };
    totalRow.getCell(3).alignment = { horizontal: 'center' };
    totalRow.getCell(4).alignment = { horizontal: 'center' };

    sheet.addRow([]);
    sheet.addRow(['Дата формирования:', new Date().toLocaleDateString('ru-RU')]);
    sheet.addRow(['Сервис:', 'LinkyDo (https://github.com/Seregaffff/LinkyDo)']);
    sheet.addRow(['Дисклеймер:', 'Данный документ носит информационный характер. Для официальной справки используйте приложение «Мой налог».']);

    sheet.columns.forEach(col => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) maxLength = length;
      });
      col.width = maxLength + 5;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=spravka-o-dohodah-npd.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ошибка генерации справки:', error);
    res.status(500).json({ message: 'Ошибка при создании справки' });
  }
};

const getTaxReportData = async (req, res) => {
  try {
    const userId = req.userID;
    const start = req.query.start
      ? new Date(req.query.start)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = req.query.end ? new Date(req.query.end) : new Date();

    const [orders, manualIncomes] = await Promise.all([
      Order.find({
        sellerID: userId,
        isCompleted: true,
        createdAt: { $gte: start, $lt: end },
      }).select('price createdAt').lean(),
      ManualIncome.find({
        userId,
        date: { $gte: start, $lt: end },
      }).select('amount date description comment buyerType').lean(),
    ]);

    const records = [
      ...orders.map((o) => ({
        type: 'order',
        description: 'Покупка на площадке',
        amount: o.price,
        date: o.createdAt,
        buyerType: 'individual',
        taxRate: 0.04,
        tax: o.price * 0.04,
      })),
      ...manualIncomes.map((m) => {
        const taxRate = m.buyerType === 'company' ? 0.06 : 0.04;
        return {
          type: 'manual',
          description: m.description,
          comment: m.comment || '',
          amount: m.amount,
          date: m.date,
          buyerType: m.buyerType || 'individual',
          taxRate,
          tax: m.amount * taxRate,
        };
      }),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalIncome = records.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = records.reduce((sum, item) => sum + item.tax, 0);

    res.json({
      records,
      totalIncome,
      totalTax,
      period: { start, end },
    });
  } catch (error) {
    console.error('Ошибка получения данных для справки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};


const generateTaxReportCustom = async (req, res) => {
  try {
    const { records = [] } = req.body;

    if (!records.length) {
      return res.status(400).json({ message: 'Нет данных для формирования справки' });
    }

    const user = await User.findById(req.userID);
    const taxpayerName = user ? (user.username || user.email) : 'Фрилансер LinkyDo';

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Справка о доходах');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'СПРАВКА О ДОХОДАХ (на основе фактических записей)';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = taxpayerName;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow(['Дата', 'Тип', 'Описание', 'Комментарий', 'Сумма', 'Ставка', 'Налог']);

    records.forEach((r) => {
      sheet.addRow([
        new Date(r.date).toLocaleString('ru-RU'),
        r.type === 'manual' ? 'Вне площадки' : 'Площадка',
        r.description || '',
        r.comment || '',
        r.amount,
        `${Math.round((r.taxRate || 0) * 100)}%`,
        r.tax,
      ]);
    });

    const totalIncome = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalTax = records.reduce((sum, r) => sum + Number(r.tax || 0), 0);

    sheet.addRow([]);
    sheet.addRow(['ИТОГО', '', '', '', totalIncome, '', totalTax]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tax-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ошибка генерации справки:', error);
    res.status(500).json({ message: 'Ошибка генерации файла' });
  }
};



const getActuals = async (req, res) => {
  try {
    const userId = req.userID;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date();

    const [orderTotal, manualTotal] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            sellerID: new mongoose.Types.ObjectId(userId),
            isCompleted: true,
            createdAt: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$price' },
            count: { $sum: 1 },
          },
        },
      ]),
      ManualIncome.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lt: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const orderIncome = orderTotal[0]?.total || 0;
    const manualIncome = manualTotal[0]?.total || 0;
    const ordersCount = orderTotal[0]?.count || 0;
    const manualCount = manualTotal[0]?.count || 0;
    const actualIncome = orderIncome + manualIncome;

    res.json({
      actualIncome,
      totalIncome: actualIncome,
      orderIncome,
      manualIncome,
      ordersCount,
      manualCount,
    });
  } catch (err) {
    console.error('getActuals error:', err);
    res.status(500).json({ error: 'Ошибка получения фактических данных' });
  }
};




module.exports = {
  getMetrics,
  updateMetrics,
  downloadReport,
  taxReport,
  getTaxReportData,
  generateTaxReportCustom,
  getActuals,
};