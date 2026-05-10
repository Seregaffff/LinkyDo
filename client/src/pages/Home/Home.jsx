import { useEffect } from 'react';
import { Featured, Slide, TrustedBy } from '../../components';
import { CategoryCard, ProjectCard } from '../../components';
import { cards, projects } from '../../data';

import './Home.scss';

const Home = () => {

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []);
  return (
    <div className='home'>
      <Featured />
      <TrustedBy />
      <Slide slidesToShow={5}>
        {
          cards.map((card) => (
            <CategoryCard key={card.id} data={card} />
          ))
        }
      </Slide>
      <div className="features">
        <div className="container">
          <div className="item">
            <h1>Множество талантливых фрилансеров у вас под рукой</h1>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Выбирайте лучшего для любого бюджета</h6>
            </div>
            <p>Найдите высококачественные услуги по любой цене. Никаких почасовых ставок, только ценообразование на основе проекта.</p>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Качественная работа, выполненная быстро</h6>
            </div>
            <p>Найдите подходящего фрилансера, который приступит к работе над вашим проектом в течение нескольких минут.</p>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Protected payments, every time</h6>
            </div>
            <p>Защищенные платежи. Ваш платеж не будет разблокирован до тех пор, пока вы не одобрите работу.</p>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>24/7 support</h6>
            </div>
            <p>Вопросы? Наша команда круглосуточной поддержки готова помочь в любое время и в любом месте.</p>
          </div>
          <div className="item">
            <video poster='https://fiverr-res.cloudinary.com/q_auto,f_auto,w_700,dpr_1.0/v1/attachments/generic_asset/asset/089e3bb9352f90802ad07ad9f6a4a450-1599517407052/selling-proposition-still-1400-x1.png' src="./media/video.mp4" controls></video>
          </div>
        </div>
      </div>

      {/* LinkyDo Business Component */}
      <div className="features dark">
        <div className="container">
          <div className="item">
            <h2>LinkyDo business</h2>
            <h1>Бизнес-решение, разработанное для <span>команд</span></h1>
            <p>Переходите к специализированному сервису, оснащенному инструментами и преимуществами, предназначенными для бизнеса</p>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Обратитесь к фрилансерам с проверенным опытом ведения бизнеса.</h6>
            </div>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Менеджер по работе с клиентами подберет вам идеального специалиста.</h6>
            </div>
            <div className="title">
              <img src="./media/check.png" alt="check" />
              <h6>Управляйте командной работой и повышайте производительность с помощью одного мощного рабочего пространства.</h6>
            </div>
            <button>Перейти в LinkyDo Business</button>
          </div>
          <div className="item">
            <img src="https://fiverr-res.cloudinary.com/q_auto,f_auto,w_870,dpr_1.0/v1/attachments/generic_asset/asset/d9c17ceebda44764b591a8074a898e63-1599597624757/business-desktop-870-x1.png" alt="" />
          </div>
        </div>
      </div>

      <Slide slidesToShow={4}>
        {
          projects.map((card) => (
            <ProjectCard key={card.id} data={card} />
          ))
        }
      </Slide>
    </div>
  )
}

export default Home