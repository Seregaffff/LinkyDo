// Получить все доходы (заказы + ручные)
const Order = require('../models/order.model');
const ManualIncome = require('../models/ManualIncome');

const normalizeOrder = (order) => ({
  _id: order._id,
  type: 'order',
  description: `Заказ #${String(order._id).slice(-6)}`,
  comment: '',
  amount: order.price,
  date: order.createdAt || new Date(),
  buyerType: 'individual',
  taxRate: 0.04,
  tax: order.price * 0.04,
});

const normalizeManual = (inc) => ({
  _id: inc._id,
  type: 'manual',
  description: inc.description,
  comment: inc.comment || '',
  amount: inc.amount,
  date: inc.date || new Date(),
  buyerType: inc.buyerType || 'individual',
  taxRate: inc.buyerType === 'company' ? 0.06 : 0.04,
  tax: inc.amount * (inc.buyerType === 'company' ? 0.06 : 0.04),
});

const getIncomes = async (req, res) => {
  try {
    const userId = req.userID;

    const [orders, manualIncomes] = await Promise.all([
      Order.find({ sellerID: userId, isCompleted: true }).select('price createdAt').lean(),
      ManualIncome.find({ userId }).sort({ date: -1 }).lean(),
    ]);

    const incomes = [
      ...orders.map(normalizeOrder),
      ...manualIncomes.map(normalizeManual),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(incomes);
  } catch (err) {
    console.error('getIncomes error:', err);
    res.status(500).json({ error: 'Ошибка получения доходов' });
  }
};

// Добавить ручной доход
const addManualIncome = async (req, res) => {
  try {
    const { description, comment, amount, date, buyerType } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Некорректная сумма дохода' });
    }

    const income = await ManualIncome.create({
      userId: req.userID,
      description: description || 'Ручной доход',
      comment: comment || '',
      amount,
      date: date ? new Date(date) : new Date(),
      buyerType: buyerType || 'individual',
    });

    res.status(201).json(income);
  } catch (err) {
    console.error('addManualIncome error:', err);
    res.status(500).json({ error: 'Ошибка добавления дохода' });
  }
};


const updateManualIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, comment, amount, date, buyerType } = req.body;

    const updated = await ManualIncome.findOneAndUpdate(
      { _id: id, userId: req.userID },
      {
        $set: {
          ...(description !== undefined ? { description } : {}),
          ...(comment !== undefined ? { comment } : {}),
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(date !== undefined ? { date: new Date(date) } : {}),
          ...(buyerType !== undefined ? { buyerType } : {}),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Доход не найден' });
    }

    res.json(updated);
  } catch (err) {
    console.error('updateManualIncome error:', err);
    res.status(500).json({ error: 'Ошибка обновления дохода' });
  }
};

const getIncomeSummary = async (req, res) => {
  try {
    const userId = req.userID;

    const [orders, manualIncomes] = await Promise.all([
      Order.find({ sellerID: userId, isCompleted: true }).select('price createdAt').lean(),
      ManualIncome.find({ userId }).select('amount date buyerType description comment').lean(),
    ]);

    const records = [
      ...orders.map((o) => ({
        type: 'order',
        amount: o.price,
        date: o.createdAt,
      })),
      ...manualIncomes.map((m) => ({
        type: 'manual',
        amount: m.amount,
        date: m.date,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const actualIncome = records.reduce((sum, item) => sum + item.amount, 0);
    const manualIncome = manualIncomes.reduce((sum, item) => sum + item.amount, 0);
    const orderIncome = orders.reduce((sum, item) => sum + item.price, 0);

	const byMonth = records.reduce((acc, item) => {
	  const itemDate = new Date(item.date);

	  if (isNaN(itemDate.getTime())) {
		return acc;
	  }

	  const key = new Intl.DateTimeFormat('ru-RU', {
		month: 'short',
		year: 'numeric',
	  }).format(itemDate);

	  if (!acc[key]) {
		acc[key] = {
		  month: key,
		  actual: 0,
		  manual: 0,
		  total: 0,
		};
	  }

	  acc[key].total += Number(item.amount || 0);

	  if (item.type === 'manual') {
		acc[key].manual += Number(item.amount || 0);
	  } else {
		acc[key].actual += Number(item.amount || 0);
	  }

	  return acc;
	}, {});

    res.json({
      actualIncome,
      manualIncome,
      orderIncome,
      totalIncome: actualIncome,
      records,
      chartData: Object.values(byMonth),
    });
  } catch (err) {
    console.error('getIncomeSummary error:', err);
    res.status(500).json({ error: 'Ошибка получения сводки доходов' });
  }
};


// Удалить ручной доход
const deleteIncome = async (req, res) => {
  try {
    const deleted = await ManualIncome.findOneAndDelete({
      _id: req.params.id,
      userId: req.userID,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Доход не найден' });
    }

    res.json({ message: 'Доход удален' });
  } catch (err) {
    console.error('deleteIncome error:', err);
    res.status(500).json({ error: 'Ошибка удаления дохода' });
  }
};

// Сводка по налогам за период
const getTaxSummary = async (req, res) => {
  try {
    const userId = req.userID;

    const start = req.query.start
      ? new Date(req.query.start)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const end = req.query.end ? new Date(req.query.end) : new Date();

    const orders = await Order.find({
      sellerID: userId,
      isCompleted: true,
      createdAt: { $gte: start, $lt: end },
    })
      .select('price')
      .lean();

    const manualIncomes = await ManualIncome.find({
      userId,
      date: { $gte: start, $lt: end },
    }).lean();

    let totalIncome = 0;
    let totalTax = 0;

    // Заказы (пока считаем как 4%)
    orders.forEach((o) => {
      totalIncome += o.price;
      totalTax += o.price * 0.04;
    });

    // Ручные доходы
    manualIncomes.forEach((inc) => {
      totalIncome += inc.amount;
      const rate = inc.buyerType === 'company' ? 0.06 : 0.04;
      totalTax += inc.amount * rate;
    });

    res.json({
      totalIncome,
      totalTax,
      period: { start, end },
    });
  } catch (err) {
    console.error('getTaxSummary error:', err);
    res.status(500).json({ error: 'Ошибка расчета налогов' });
  }
};

module.exports = {
  getIncomes,
  addManualIncome,
  deleteIncome,
  getTaxSummary,
  updateManualIncome,
  getIncomeSummary,
};