import { useState, useRef, useEffect } from 'react';
import { GigCard, Loader } from '../../components';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from 'react-router-dom';
import { axiosFetch } from '../../utils';
import './Gigs.scss';

const Gigs = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [sortBy, setSortBy] = useState('sales');
  const [category, setCategory] = useState('.');
  const minRef = useRef();
  const maxRef = useRef();
  const { search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ['gigs'],
    queryFn: () =>
      axiosFetch.get(`/gigs${search}&min=${minRef.current.value}&max=${maxRef.current.value}&sort=${sortBy}`)
        .then(({ data }) => {
          setCategory(data[0].category);
          return data;
        })
        .catch((error) => {
          console.log(error);
        })
  });
  
  useEffect(() => {
    refetch();
  }, [sortBy, search]);

  const handleSortBy = (type) => {
    setSortBy(type);
    setOpenMenu(false);
    refetch();
  }

  const handlePriceFilter = () => {
    refetch();
  }

  return (
    <div className='gigs'>
      <div className="container">
        <span className="breadcrumbs">LinkyDo {category[0]?.toUpperCase() + category.slice(1)}</span>
        <h1>{category[0]?.toUpperCase() + category.slice(1)}</h1>
        <p>Исследуйте границы искусства и технологий с помощью LinkyDo {category}</p>
        <div className="menu">
          <div className="left">
            <span>Бюджет</span>
            <input ref={minRef} type="number" placeholder='от' />
            <input ref={maxRef} type="number" placeholder='до' />
            <button onClick={handlePriceFilter}>Применить</button>
          </div>
          <div className="right">
            <span className='sortBy'>Сортировка</span>
            <span className='sortType'>{sortBy === 'sales' ? 'Количество продаж' : 'Новые'}</span>
            <img src="./media/down.png" alt="" onClick={() => setOpenMenu(!openMenu)} />
            {
              openMenu && (<div className="rightMenu">
                {
                  sortBy === 'sales' ? <span onClick={() => handleSortBy('createdAt')}>Newest</span>
                    : <span onClick={() => handleSortBy('sales')}>Best Selling </span>
                }
              </div>)
            }
          </div>
        </div>
        <div className="cards">
          {
            isLoading
              ? <div className='loader'> <Loader size={45} /> </div>
              : error
                ? 'Что-то пошло не так...'
                : data.map((gig) => <GigCard key={gig._id} data={gig} />)
          }
        </div>
      </div>
    </div>
  )
}

export default Gigs