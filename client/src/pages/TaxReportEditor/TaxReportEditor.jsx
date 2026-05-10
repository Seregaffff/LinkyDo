import React, { useEffect, useState, useCallback } from 'react';
import './TaxReportEditor.scss';

const formatRub = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateForInput = (dateStr) => {
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const TaxReportEditor = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [localRecords, setLocalRecords] = useState([]);
  const [period, setPeriod] = useState(null);

  // Загрузка начальных данных с сервера
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/metrics/tax-report-data', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      const data = await response.json();
      const records = (data.records || []).map((rec) => ({
        ...rec,
        _editing: false, // флаг режима редактирования
      }));
      setLocalRecords(records);
      setPeriod(data.period);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Суммарные показатели (для отображения)
  const totalIncome = localRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalTax = localRecords.reduce((sum, r) => sum + Number(r.tax || 0), 0);
  const orderIncome = localRecords
    .filter((r) => r.type !== 'manual')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const manualIncome = localRecords
    .filter((r) => r.type === 'manual')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // Переключение режима редактирования для строки
  const toggleEdit = (index) => {
    setLocalRecords((prev) =>
      prev.map((rec, i) =>
        i === index ? { ...rec, _editing: !rec._editing } : rec
      )
    );
  };

  // Обработчик изменений полей в режиме редактирования
  const handleFieldChange = (index, field, value) => {
    setLocalRecords((prev) =>
      prev.map((rec, i) => {
        if (i !== index) return rec;
        const updated = { ...rec, [field]: value };
        // Автоматический пересчёт налога при изменении суммы или ставки
        if (field === 'amount' || field === 'taxRate') {
          const amount = Number(updated.amount) || 0;
          const taxRate = Number(updated.taxRate) || 0;
          updated.tax = amount * taxRate;
        }
        return updated;
      })
    );
  };

  // Сохранить изменения и выйти из редактирования
  const saveEdit = (index) => {
    setLocalRecords((prev) =>
      prev.map((rec, i) =>
        i === index ? { ...rec, _editing: false } : rec
      )
    );
  };

  // Отменить редактирование (вернуть исходные данные, если запись была изменена – лучше восстановить из резервной копии)
  const cancelEdit = (index) => {
    // Создадим резервную копию перед началом редактирования
    // Но для простоты просто выключим редактирование, не сохраняя изменения
    setLocalRecords((prev) =>
      prev.map((rec, i) =>
        i === index ? { ...rec, _editing: false } : rec
      )
    );
  };

  // Добавить новую пустую запись
  const addNewRecord = () => {
    const newRec = {
      date: new Date().toISOString().slice(0, 10),
      type: 'order', // по умолчанию площадка
      description: '',
      comment: '',
      buyerType: 'individual',
      taxRate: 0.04,
      amount: 0,
      tax: 0,
      _editing: true,
    };
    setLocalRecords((prev) => [...prev, newRec]);
  };

  // Удалить запись
  const deleteRecord = (index) => {
    setLocalRecords((prev) => prev.filter((_, i) => i !== index));
  };

  // Отправка данных на генерацию Excel
  const handleGenerate = async (e) => {
    e.preventDefault();
    // Очищаем служебное поле _editing перед отправкой
    const cleanRecords = localRecords.map(({ _editing, ...rest }) => rest);
    try {
      setSubmitting(true);
      setError('');
      const response = await fetch('/api/metrics/tax-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ records: cleanRecords }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Ошибка генерации справки');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-edited-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tax-report-editor-page">
        <div className="tax-report-loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="tax-report-editor-page">
      <div className="tax-report-editor-header">
        <h1>Редактирование справки для ФНС</h1>
        <p>Измените, добавьте или удалите доходы перед скачиванием. Все изменения только локальные.</p>
      </div>

      {error && <div className="tax-report-alert error">{error}</div>}

      {/* Сводка */}
      <div className="tax-summary-grid">
        <div className="tax-summary-card">
          <span>Доход с площадки</span>
          <strong>{formatRub(orderIncome)}</strong>
        </div>
        <div className="tax-summary-card">
          <span>Доход вне площадки</span>
          <strong>{formatRub(manualIncome)}</strong>
        </div>
        <div className="tax-summary-card total">
          <span>Общий доход</span>
          <strong>{formatRub(totalIncome)}</strong>
        </div>
        <div className="tax-summary-card tax">
          <span>Общий налог</span>
          <strong>{formatRub(totalTax)}</strong>
        </div>
      </div>

      {/* Таблица с доходами */}
      <div className="tax-report-card">
        <div className="tax-report-card-header">
          <h2>Доходы</h2>
          <button onClick={addNewRecord} className="add-record-btn">
            + Добавить доход
          </button>
        </div>

        <div className="tax-report-table-wrapper">
          <table className="tax-report-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Описание</th>
                <th>Комментарий</th>
                <th>Покупатель</th>
                <th>Ставка</th>
                <th>Сумма</th>
                <th>Налог</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {localRecords.length === 0 ? (
                <tr>
                  <td colSpan="9">Нет данных. Нажмите «Добавить доход».</td>
                </tr>
              ) : (
                localRecords.map((rec, idx) => (
                  <tr key={idx} className={rec._editing ? 'editing-row' : ''}>
                    {rec._editing ? (
                      // Режим редактирования
                      <>
                        <td>
                          <input
                            type="date"
                            value={formatDateForInput(rec.date)}
                            onChange={(e) => handleFieldChange(idx, 'date', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={rec.type}
                            onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                          >
                            <option value="order">Площадка</option>
                            <option value="manual">Вне площадки</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={rec.description || ''}
                            onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={rec.comment || ''}
                            onChange={(e) => handleFieldChange(idx, 'comment', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={rec.buyerType}
                            onChange={(e) => handleFieldChange(idx, 'buyerType', e.target.value)}
                          >
                            <option value="individual">Физ. лицо</option>
                            <option value="company">Компания</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={rec.taxRate || 0.04}
                            onChange={(e) => handleFieldChange(idx, 'taxRate', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rec.amount}
                            onChange={(e) => handleFieldChange(idx, 'amount', e.target.value)}
                          />
                        </td>
                        <td>{formatRub(rec.tax)}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => saveEdit(idx)} className="btn-save">
                              Сохранить
                            </button>
                            <button onClick={() => cancelEdit(idx)} className="btn-cancel">
                              Отмена
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Режим просмотра
                      <>
                        <td>{new Date(rec.date).toLocaleDateString('ru')}</td>
                        <td>{rec.type === 'manual' ? 'Вне площадки' : 'Площадка'}</td>
                        <td>{rec.description || '-'}</td>
                        <td>{rec.comment || '-'}</td>
                        <td>{rec.buyerType === 'company' ? 'Компания' : 'Физ. лицо'}</td>
                        <td>{Math.round((rec.taxRate || 0) * 100)}%</td>
                        <td>{formatRub(rec.amount)}</td>
                        <td>{formatRub(rec.tax)}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => toggleEdit(idx)} className="btn-edit">
                              ✏️
                            </button>
                            <button onClick={() => deleteRecord(idx)} className="btn-delete">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Итоговый блок (можно оставить) */}
      <div className="tax-report-card">
        <h2>Итоги</h2>
        <div className="tax-final-grid">
          <div className="tax-final-item">
            <span>Доход с платформы</span>
            <strong>{formatRub(orderIncome)}</strong>
          </div>
          <div className="tax-final-item">
            <span>Доход вне площадки</span>
            <strong>{formatRub(manualIncome)}</strong>
          </div>
          <div className="tax-final-item total">
            <span>Общий доход</span>
            <strong>{formatRub(totalIncome)}</strong>
          </div>
          <div className="tax-final-item total">
            <span>Общий налог</span>
            <strong>{formatRub(totalTax)}</strong>
          </div>
        </div>
      </div>

      {/* Кнопка скачивания */}
      <form onSubmit={handleGenerate} className="tax-report-generate-form">
        <button type="submit" disabled={submitting} className="btn-generate">
          {submitting ? 'Формирование...' : '📥 Скачать справку (Excel)'}
        </button>
      </form>
    </div>
  );
};

export default TaxReportEditor;