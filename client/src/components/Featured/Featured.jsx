import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Featured.scss';

const Featured = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const handleSearch = () => {
    if(search) {
      navigate(`/gigs?search=${search}`);
    }
  }

  return (
    <div className='featured'>
      <div className="container">

        <div className="left">
          <h1>Найдите идеального <span>фрилансера</span> для ваших задач</h1>
          <div className="search">
            <div className="searchInput">
              <img src="./media/search.png" alt="search" />
              <input type="search" placeholder='Введите название услуги...' onChange={(({ target: { value } }) => setSearch(value))} />
            </div>
            <button onClick={handleSearch}>Поиск</button>
          </div>
          <div className="popular">
            <span>Популярные услуги:</span>
            <button>Дизайн Web-сайтов</button>
            <button>WordPress</button>
            <button>Дизайн логотипов</button>
            <button>AI сервисы</button>
			<button>Машинное обучение (ML)</button>
			<button>Авторские курсы <span>NEW</span></button>
          </div>
        </div>

        <div className="right">
          <img src="./media/hero.png" alt="hero" />
        </div>
        
      </div>
    </div>
  )
}

export default Featured