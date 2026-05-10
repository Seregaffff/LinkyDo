import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TaxReport.scss';

const formatRub = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const TaxReport = () => {
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);

  // Данные, переданные из Dashboard
  const {
    totalIncome = 0,
    orderIncome = 0,
    manualIncome = 0,
    taxAmount = 0,
    records = [],          // массив реальных заказов { date, amount, type, description, comment }
    chartData = [],
  } = location.state || {};

  const downloadReport = async () => {
    if (!records.length) {
      alert('Нет данных для скачивания');
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch('/api/income/tax-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (!response.ok) throw new Error('Ошибка генерации отчёта');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Справка_о_доходах_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Не удалось скачать отчёт');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="tax-report-container">
      <h1>📄 Справка о доходах для ФНС</h1>

      <div className="info-card">
        <h2>⚠️ Важно!</h2>
        <p>
          Этот документ <strong>не является официальной справкой ФНС</strong> и не имеет
          юридической силы. Он создан на основе данных вашего дашборда в LinkyDo и
          предназначен только для информационных целей и самоконтроля.
        </p>
        <p>
          Официальную справку о доходах для самозанятых (форма КНД 1122036) можно
          получить только в приложении «Мой налог» или в личном кабинете
          налогоплательщика на сайте ФНС.
        </p>
      </div>

      {/* Фактические показатели */}
      <div className="fact-data-card">
        <h2>📊 Фактические доходы (с дашборда)</h2>
        <div className="fact-grid">
          <div className="fact-item">
            <span>Доход с площадки</span>
            <strong>{formatRub(orderIncome)}</strong>
          </div>
          <div className="fact-item">
            <span>Доход вне площадки</span>
            <strong>{formatRub(manualIncome)}</strong>
          </div>
          <div className="fact-item">
            <span>Общий доход</span>
            <strong>{formatRub(totalIncome)}</strong>
          </div>
          <div className="fact-item highlight">
            <span>Налог к уплате (4%)</span>
            <strong>{formatRub(taxAmount)}</strong>
          </div>
        </div>
        {records.length > 0 && (
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Данные основаны на <strong>{records.length}</strong> реальных заказах.
          </p>
        )}
      </div>

      <div className="steps-card">
        <h2>📝 Как получить официальную справку</h2>
        <ol>
          <li>Установите приложение <strong>«Мой налог»</strong> на смартфон или откройте веб-версию на npd.nalog.ru.</li>
          <li>Войдите с помощью учётной записи Госуслуг, ИНН и пароля или по паспорту.</li>
          <li>Перейдите в раздел <strong>«Настройки» → «Справки»</strong>.</li>
          <li>Выберите <strong>«Справка о доходах»</strong>, укажите год и нажмите «Сформировать».</li>
          <li>Документ будет подписан электронной подписью ФНС и готов к скачиванию.</li>
        </ol>
      </div>

      <div className="download-card">
        <h2>📥 Черновик справки (информационный)</h2>
        <p>
          Скачайте предварительный документ, заполненный на основе <strong>реальных
          доходов</strong> с вашего дашборда. Данные передаются напрямую из таблицы заказов.
        </p>
        <div className="download-actions">
          <button
            onClick={downloadReport}
            disabled={downloading || records.length === 0}
            className="download-btn"
          >
            {downloading ? '⏳ Формирование...' : '⬇️ Скачать черновик (.xlsx)'}
          </button>
          <Link
            to="/dashboard/tax-report/edit"
            className="edit-btn"
            state={{ records, totalIncome, orderIncome, manualIncome, taxAmount }}
          >
            ✏️ Редактировать данные
          </Link>
        </div>
      </div>

      <Link to="/dashboard" className="back-link">← Вернуться к юнит-экономике</Link>
    </div>
  );
};

export default TaxReport;