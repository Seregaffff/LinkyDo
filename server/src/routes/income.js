const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Income = require('../models/Income');
const auth = require('../middlewares/authenticate'); 

// Получить все доходы текущего пользователя
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.userID })
      .sort({ date: -1 })
      .lean();
    res.json(incomes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить ручной доход
router.post('/manual', auth, async (req, res) => {
  try {
    const { description, comment, amount, buyerType, date } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Некорректная сумма' });
    }

    const income = new Income({
      user: req.userID,
      description,
      comment,
      amount,
      buyerType,
      date: date || Date.now(),
      type: 'manual'
    });

    await income.save();
    res.status(201).json(income);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка добавления дохода' });
  }
});

// Удалить доход
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.userID
    });
    if (!income) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.json({ message: 'Удалено успешно' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// (существующий) Сгенерировать Excel-отчёт на основе переданных данных
router.post('/tax-report', async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const sorted = records.sort((a, b) => new Date(a.date) - new Date(b.date));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Справка о доходах');

    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'СПРАВКА О ДОХОДАХ ПО НАЛОГУ НА ПРОФЕССИОНАЛЬНЫЙ ДОХОД';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = '(на основе данных сервиса LinkyDo, не является официальным документом ФНС)';

    sheet.getCell('A4').value = 'Налогоплательщик:';
    sheet.getCell('B4').value = 'selleruser';
    sheet.getCell('A5').value = 'Период:';
    sheet.getCell('B5').value = 'по данным заказов';

    sheet.addRow([]);
    const headerRow = sheet.addRow(['Дата', 'Тип', 'Описание', 'Сумма', 'Налог (4%)']);
    headerRow.font = { bold: true };

    let total = 0;
    sorted.forEach(rec => {
      const amount = Number(rec.amount) || 0;
      total += amount;
      sheet.addRow([
        new Date(rec.date).toLocaleDateString('ru'),
        rec.type === 'manual' ? 'Вне площадки' : 'Площадка',
        rec.description || '',
        amount,
        amount * 0.04
      ]);
    });

    sheet.addRow([]);
    const totalRow = sheet.addRow(['', '', 'ИТОГО', total, total * 0.04]);
    totalRow.font = { bold: true };

    sheet.addRow([]);
    sheet.addRow(['Дата формирования:', new Date().toLocaleDateString('ru')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=spravka.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка генерации отчёта');
  }
});

module.exports = router;