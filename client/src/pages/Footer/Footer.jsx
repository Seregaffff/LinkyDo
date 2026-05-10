import './Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Верхняя часть с колонками */}
        <div className="footer-top">
          <div className="footer-col">
            <h3>Категории</h3>
            <ul>
              <li><a href="#">Дизайн и графика</a></li>
              <li><a href="#">Цифровой маркетинг</a></li>
              <li><a href="#">Тексты и переводы</a></li>
              <li><a href="#">Видео и анимация</a></li>
              <li><a href="#">Музыка и аудио</a></li>
              <li><a href="#">Программирование</a></li>
              <li><a href="#">Бизнес</a></li>
              <li><a href="#">Образ жизни</a></li>
              <li><a href="#">Фотография</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>О нас</h3>
            <ul>
              <li><a href="#">Карьера</a></li>
              <li><a href="#">Пресса и новости</a></li>
              <li><a href="#">Партнёрство</a></li>
              <li><a href="#">Политика конфиденциальности</a></li>
              <li><a href="#">Условия использования</a></li>
              <li><a href="#">Интеллектуальная собственность</a></li>
              <li><a href="#">Инвесторам</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Поддержка</h3>
            <ul>
              <li><a href="#">Помощь и поддержка</a></li>
              <li><a href="#">Доверие и безопасность</a></li>
              <li><a href="#">Продажа на LinkyDo</a></li>
              <li><a href="#">Покупка на LinkyDo</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Сообщество</h3>
            <ul>
              <li><a href="#">Мероприятия</a></li>
              <li><a href="#">Блог</a></li>
              <li><a href="#">Форум</a></li>
              <li><a href="#">Стандарты сообщества</a></li>
              <li><a href="#">Подкаст</a></li>
              <li><a href="#">Партнёрская программа</a></li>
              <li><a href="#">Пригласить друга</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Ещё от LinkyDo</h3>
            <ul>
              <li><a href="#">LinkyDo Business</a></li>
              <li><a href="#">LinkyDo Pro</a></li>
              <li><a href="#">LinkyDo Studios</a></li>
              <li><a href="#">Конструктор логотипов</a></li>
              <li><a href="#">LinkyDo Guild</a></li>
              <li><a href="#">Вдохновение</a></li>
              <li><a href="#">LinkyDo Select</a></li>
              <li><a href="#">Clear Voice</a></li>
              <li><a href="#">Рабочее пространство</a></li>
              <li><a href="#">Обучение</a></li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Нижняя часть */}
        <div className="footer-bottom">
          <div className="footer-brand">
            <span className="footer-logo">LinkyDo</span>
            <span className="footer-copy">
              © {new Date().getFullYear()} LinkyDo International Ltd.
            </span>
          </div>

          <div className="footer-meta">
            <div className="social-icons">
              <span title="Twitter">🐦</span>
              <span title="Facebook">📘</span>
              <span title="LinkedIn">💼</span>
              <span title="Pinterest">📌</span>
              <span title="Instagram">📷</span>
            </div>

            <div className="lang-currency">
              <span className="meta-item">
                <span className="meta-icon">🌐</span> Русский
              </span>
              <span className="meta-item">
                <span className="meta-icon">💎</span> RUB
              </span>
              <span className="meta-item">
                <span className="meta-icon">♿</span> Специальные возможности
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;