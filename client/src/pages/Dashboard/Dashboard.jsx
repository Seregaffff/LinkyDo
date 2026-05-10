import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import axiosFetch from '../../utils/axiosFetch';
import './Dashboard.scss';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    averageOrderPrice: '',
    ordersPerMonth: '',
    fixedExpenses: '',
    variableExpensePercent: '',
    companyIncomePercent: '',
  });

  const [incomeSummary, setIncomeSummary] = useState({
    actualIncome: 0,
    manualIncome: 0,
    orderIncome: 0,
    totalIncome: 0,
    records: [],
    chartData: [],
  });

  const [manualForm, setManualForm] = useState({
    price: '',
    description: 'Заказ вне площадки',
    comment: '',
    buyerType: 'individual',
    date: new Date().toISOString().slice(0, 10),
  });

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatRub = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDateTime = (value) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(value))
      .replace(',', '');
  };

  const fetchMetrics = async () => {
    try {
      const { data } = await axiosFetch.get('/metrics');
      setMetrics({
        averageOrderPrice: data.averageOrderPrice || '',
        ordersPerMonth: data.ordersPerMonth || '',
        fixedExpenses: data.fixedExpenses || '',
        variableExpensePercent: data.variableExpensePercent || '',
        companyIncomePercent: data.companyIncomePercent || '',
      });
    } catch (err) {
      console.error('Ошибка загрузки метрик', err);
    }
  };

  // Вспомогательная функция для построения chartData по месяцам
  const buildChartData = (records) => {
    const months = {};
    records.forEach(rec => {
      const date = new Date(rec.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { month: key, actual: 0, manual: 0, total: 0 };
      if (rec.type === 'manual') {
        months[key].manual += Number(rec.amount || 0);
      } else {
        months[key].actual += Number(rec.amount || 0);
      }
      months[key].total += Number(rec.amount || 0);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  };

  const fetchIncomeSummary = async () => {
    try {
      setSummaryLoading(true);
      const { data } = await axiosFetch.get('/income');
      // Сервер возвращает массив (или объект с records, поддержим оба варианта)
      const records = Array.isArray(data) ? data : (data.records || []);

      let orderIncome = 0;
      let manualIncome = 0;
      records.forEach(item => {
        if (item.type === 'manual') {
          manualIncome += Number(item.amount || 0);
        } else {
          orderIncome += Number(item.amount || 0);
        }
      });
      const totalIncome = orderIncome + manualIncome;

      setIncomeSummary({
        actualIncome: orderIncome,
        manualIncome: manualIncome,
        orderIncome: orderIncome,
        totalIncome: totalIncome,
        records: records,
        chartData: buildChartData(records),
      });
    } catch (err) {
      console.error('Ошибка загрузки доходов', err);
      setError('Не удалось загрузить данные доходов');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchIncomeSummary();
  }, []);

  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setMetrics((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const payload = {
        averageOrderPrice: Number(metrics.averageOrderPrice || 0),
        ordersPerMonth: Number(metrics.ordersPerMonth || 0),
        fixedExpenses: Number(metrics.fixedExpenses || 0),
        variableExpensePercent: Number(metrics.variableExpensePercent || 0),
        companyIncomePercent: Number(metrics.companyIncomePercent || 0),
      };
      await axiosFetch.put('/metrics', payload);
      setSuccess('Метрики успешно обновлены');
    } catch (err) {
      console.error('Ошибка обновления метрик', err);
      setError('Ошибка сохранения метрик');
    } finally {
      setLoading(false);
    }
  };

  const addManualOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (!manualForm.price || Number(manualForm.price) <= 0) {
        setError('Введите корректную сумму');
        return;
      }
      await axiosFetch.post('/income/manual', {
        description: manualForm.description,
        comment: manualForm.comment,
        amount: Number(manualForm.price),
        buyerType: manualForm.buyerType,
        date: manualForm.date,
      });
      setManualForm({
        price: '',
        description: 'Заказ вне площадки',
        comment: '',
        buyerType: 'individual',
        date: new Date().toISOString().slice(0, 10),
      });
      await fetchIncomeSummary();
      setSuccess('Доход успешно добавлен');
    } catch (err) {
      console.error('Ошибка добавления дохода', err);
      setError('Не удалось добавить доход');
    } finally {
      setLoading(false);
    }
  };

  const calculatedData = useMemo(() => {
    const averageOrderPrice = Number(metrics.averageOrderPrice || 0);
    const ordersPerMonth = Number(metrics.ordersPerMonth || 0);
    const fixedExpenses = Number(metrics.fixedExpenses || 0);
    const variableExpensePercent = Number(metrics.variableExpensePercent || 0);

    const estimatedRevenue = averageOrderPrice * ordersPerMonth;
    const variableExpenses = estimatedRevenue * (variableExpensePercent / 100);
    const estimatedProfit = estimatedRevenue - fixedExpenses - variableExpenses;

    return {
      estimatedRevenue,
      variableExpenses,
      estimatedProfit,
    };
  }, [metrics]);

  // Данные для первого графика (прогноз экономики)
  const forecastChartData = useMemo(() => {
    return [
      {
        name: 'Прогноз',
        revenue: calculatedData.estimatedRevenue,
        variable: calculatedData.variableExpenses,
        profit: calculatedData.estimatedProfit,
      },
    ];
  }, [calculatedData]);

  // Данные для второго графика (текущая прибыль по заказам)
  const profitChartData = useMemo(() => {
    if (!incomeSummary.chartData.length) return [];
    const fixedMonthly = Number(metrics.fixedExpenses || 0) / 12;
    return incomeSummary.chartData.map((item) => ({
      month: item.month,
      revenue: item.total || 0,
      profit: (item.total || 0) * 0.9 - fixedMonthly,
    }));
  }, [incomeSummary.chartData, metrics.fixedExpenses]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Юнит-экономика</h1>
        <p>Анализ доходов, расходов и фактической прибыли</p>
      </div>

      {error && <div className="dashboard-alert error">{error}</div>}
      {success && <div className="dashboard-alert success">{success}</div>}

      <div className="dashboard-grid">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="metrics-form">
            <h2>Параметры юнит-экономики</h2>
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="dashboard-form-group">
                <label>Средний чек</label>
                <input
                  type="number"
                  name="averageOrderPrice"
                  value={metrics.averageOrderPrice}
                  onChange={handleMetricsChange}
                  placeholder="Введите сумму"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Заказов в месяц</label>
                <input
                  type="number"
                  name="ordersPerMonth"
                  value={metrics.ordersPerMonth}
                  onChange={handleMetricsChange}
                  placeholder="Количество заказов"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Постоянные расходы</label>
                <input
                  type="number"
                  name="fixedExpenses"
                  value={metrics.fixedExpenses}
                  onChange={handleMetricsChange}
                  placeholder="Аренда, сервисы и т.д."
                />
              </div>

              <div className="dashboard-form-group">
                <label>Переменные расходы (%)</label>
                <input
                  type="number"
                  name="variableExpensePercent"
                  value={metrics.variableExpensePercent}
                  onChange={handleMetricsChange}
                  placeholder="Например 10"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Доля дохода от компаний (%)</label>
                <input
                  type="number"
                  name="companyIncomePercent"
                  value={metrics.companyIncomePercent}
                  onChange={handleMetricsChange}
                  placeholder="Например 30"
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </div>

          <div className="manual-orders">
            <h2>Добавить заказ вне площадки</h2>
            <form onSubmit={addManualOrder} className="dashboard-form">
              <div className="dashboard-form-group">
                <label>Сумма</label>
                <input
                  type="number"
                  name="price"
                  value={manualForm.price}
                  onChange={handleManualChange}
                  placeholder="Введите сумму"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Описание</label>
                <input
                  type="text"
                  name="description"
                  value={manualForm.description}
                  onChange={handleManualChange}
                  placeholder="Описание заказа"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Комментарий</label>
                <textarea
                  name="comment"
                  value={manualForm.comment}
                  onChange={handleManualChange}
                  placeholder="Дополнительная информация"
                />
              </div>

              <div className="dashboard-form-group">
                <label>Тип покупателя</label>
                <select
                  name="buyerType"
                  value={manualForm.buyerType}
                  onChange={handleManualChange}
                >
                  <option value="individual">Физическое лицо</option>
                  <option value="company">Компания</option>
                </select>
              </div>

              <div className="dashboard-form-group">
                <label>Дата</label>
                <input
                  type="date"
                  name="date"
                  value={manualForm.date}
                  onChange={handleManualChange}
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить доход'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* KPI cards */}
          <div className="kpi-cards">
            <div className="kpi-card fact">
              <span>Фактический доход</span>
              <strong>{formatRub(incomeSummary.orderIncome)}</strong>
            </div>

            <div className="kpi-card">
              <span>Доход вне площадки</span>
              <strong>{formatRub(incomeSummary.manualIncome)}</strong>
            </div>

            <div className="kpi-card revenue">
              <span>Общий доход</span>
              <strong>{formatRub(incomeSummary.totalIncome)}</strong>
            </div>

            <div className="kpi-card tax">
              <span>Налог к уплате</span>
              <strong>{formatRub(incomeSummary.totalIncome * 0.04)}</strong>
            </div>
          </div>

          {/* График 1: Доходы */}
          <div className="chart-box">
            <div className="chart-header">
              <h2>График доходов</h2>
            </div>
            {summaryLoading ? (
              <div className="dashboard-loading">Загрузка графика...</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={incomeSummary.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatRub(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Доход с площадки"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="manual"
                    name="Доход вне площадки"
                    stroke="#16a34a"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Общий доход"
                    stroke="#dc2626"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* График 2: Текущая прибыль по заказам */}
          <div className="chart-box">
            <div className="chart-header">
              <h2>Текущая прибыль по заказам</h2>
            </div>
            {summaryLoading ? (
              <div className="dashboard-loading">Загрузка данных...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatRub(value)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Выручка" fill="#82ca9d" />
                  <Bar dataKey="profit" name="Чистая прибыль" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Таблица последних доходов */}
          <div className="chart-box">
            <h2>Последние доходы</h2>
            <div className="income-table-wrapper">
              <table className="income-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Описание</th>
                    <th>Комментарий</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeSummary.records.length === 0 ? (
                    <tr>
                      <td colSpan="5">Доходы отсутствуют</td>
                    </tr>
                  ) : (
                    incomeSummary.records.map((item, index) => (
                      <tr
                        key={item._id || index}
                      >
                        <td>{formatDateTime(item.date)}</td>
                        <td>
                          {item.type === 'manual'
                            ? 'Вне площадки'
                            : 'Площадка'}
                        </td>
                        <td>{item.description || '-'}</td>
                        <td>{item.comment || '-'}</td>
                        <td>{formatRub(item.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Карточки юнит-экономики */}
          <div className="chart-box">
            <h2>Расчет юнит-экономики</h2>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span>Прогнозируемая выручка</span>
                <strong>{formatRub(calculatedData.estimatedRevenue)}</strong>
              </div>

              <div className="analytics-item">
                <span>Переменные расходы</span>
                <strong>{formatRub(calculatedData.variableExpenses)}</strong>
              </div>

              <div className="analytics-item">
                <span>Прогнозируемая прибыль</span>
                <strong>{formatRub(calculatedData.estimatedProfit)}</strong>
              </div>
            </div>
          </div>

          {/* Кнопки экспорта */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <a
              href="http://localhost:8080/api/metrics/download"
              target="_blank"
              rel="noopener noreferrer"
              className="export-btn"
            >
              📥 Экспорт в Excel
            </a>
            <Link to="/dashboard/tax-report"
              state={{
                totalIncome: incomeSummary.totalIncome,
                orderIncome: incomeSummary.orderIncome,
                manualIncome: incomeSummary.manualIncome,
                taxAmount: incomeSummary.totalIncome * 0.04,
                records: incomeSummary.records,
                chartData: incomeSummary.chartData,
              }}
              className="export-btn"
            >
              🧾 Справка для ФНС
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;