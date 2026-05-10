import React from 'react';
import { Link } from 'react-router-dom';
import './BusinessSubscription.scss';

const BusinessSubscription = () => {
  const monthlyPrice = 499;
  // Годовая цена = месячная * 12 - скидка 20%
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 4790

  return (
    <div className="business-page">
      <div className="business-header">
        <h1>LinkyDo Business</h1>
        <p>
          Получите доступ к расширенной аналитике, юнит-экономике и скачиванию
          отчётов
        </p>
      </div>

      <div className="pricing-cards">
        {/* Месячный тариф */}
        <div className="pricing-card">
          <div className="plan-name">Ежемесячный</div>
          <div className="price">
            <span className="currency">₽</span>
            {monthlyPrice}
            <span className="period">/мес</span>
          </div>
          <ul className="features">
            <li>✅ Юнит-экономика</li>
            <li>✅ Скачивание справки ФНС</li>
            <li>✅ Редактирование доходов</li>
            <li>✅ Приоритетная поддержка</li>
          </ul>
          <a
            href="https://buy.stripe.com/your_monthly_link"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pay"
          >
            Оформить за {monthlyPrice} ₽/мес
          </a>
        </div>

        {/* Годовой тариф */}
        <div className="pricing-card popular">
          <div className="badge">Выгодно</div>
          <div className="plan-name">Годовой</div>
          <div className="price">
            <span className="currency">₽</span>
            {yearlyPrice}
            <span className="period">/год</span>
          </div>
          <div className="monthly-equivalent">
            Всего {yearlyPrice} ₽ (≈{Math.round(yearlyPrice / 12)} ₽/мес)
          </div>
          <ul className="features">
            <li>✅ Всё из месячного плана</li>
            <li>✅ Экономия 20%</li>
            <li>✅ Приоритетная поддержка</li>
          </ul>
          <a
            href="https://buy.stripe.com/your_yearly_link"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pay primary"
          >
            Оформить за {yearlyPrice} ₽/год
          </a>
        </div>
      </div>

      <div className="back-link">
        <Link to="/">← Вернуться на главную</Link>
      </div>
    </div>
  );
};

export default BusinessSubscription;