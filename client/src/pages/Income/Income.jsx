import React, { useState, useEffect } from 'react';
import './Income.scss';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    buyerType: 'individual',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/income', {
		headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
	  });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setIncomes(data);
    } catch (err) {
      setError('Ошибка загрузки доходов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newIncome.amount || Number(newIncome.amount) <= 0) {
      setError('Введите корректную сумму');
      return;
    }
    try {
      setError('');
      await fetch('/api/income/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          description: newIncome.description,
          comment: '', // если нужно
          amount: Number(newIncome.amount),
          buyerType: newIncome.buyerType,
          date: newIncome.date,
        }),
      });
      setShowForm(false);
      setNewIncome({
        description: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        buyerType: 'individual',
      });
      fetchIncomes();
    } catch (err) {
      setError('Ошибка добавления');
    }
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
  const totalTax = incomes.reduce((sum, inc) => sum + Number(inc.tax || 0), 0);

  if (loading) return <div className="income-page"><p>Загрузка...</p></div>;

  return (
    <div className="income-page">
      <h1>Мои доходы</h1>
      <div className="summary-cards">
        <div className="card">💰 Общий доход: {totalIncome.toFixed(2)} руб.</div>
        <div className="card tax">🧾 Налог к уплате: {totalTax.toFixed(2)} руб.</div>
      </div>
      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        + Добавить доход
      </button>
      {showForm && (
        <form onSubmit={handleAdd} className="manual-form">
          <input
            type="text"
            placeholder="Описание"
            value={newIncome.description}
            onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Сумма, руб"
            value={newIncome.amount}
            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
            required
            min="0"
            step="0.01"
          />
          <input
            type="date"
            value={newIncome.date}
            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
          />
          <select
            value={newIncome.buyerType}
            onChange={(e) => setNewIncome({ ...newIncome, buyerType: e.target.value })}
          >
            <option value="individual">Физическое лицо (4%)</option>
            <option value="company">Юридическое лицо / ИП (6%)</option>
          </select>
          <button type="submit">Сохранить</button>
          <button type="button" onClick={() => setShowForm(false)}>
            Отмена
          </button>
        </form>
      )}
      {error && <div className="error">{error}</div>}
      <table className="income-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Описание</th>
            <th>Сумма</th>
            <th>Тип плательщика</th>
            <th>Налог</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {incomes.length === 0 ? (
            <tr>
              <td colSpan="6">Нет доходов</td>
            </tr>
          ) : (
            incomes.map((inc) => (
              <tr key={inc._id || `${inc.date}-${inc.amount}`}>
                <td>{new Date(inc.date).toLocaleDateString('ru-RU')}</td>
                <td>{inc.description || '-'}</td>
                <td>{Number(inc.amount).toFixed(2)} руб.</td>
                <td>{inc.buyerType === 'company' ? 'Юрлицо/ИП' : 'Физлицо'}</td>
                <td>{Number(inc.tax).toFixed(2)} руб.</td>
                <td>
                  {/* Удаление временно отключено – нужен DELETE endpoint */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Income;