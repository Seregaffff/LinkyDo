import { Link } from 'react-router-dom';
import './CategoryCard.scss';

const Card = (props) => {
  const { data } = props;

  return (
    <Link to={`/gigs?category=${data.slug}`} className="categoryCardLink">
      <div className='categoryCard'>
        <div className='iconWrapper'>
          <img src={data.img} alt={data.title} />
        </div>
        <h3 className='title'>{data.title}</h3>
        <p className='desc'>{data.desc}</p>
      </div>
    </Link>
  )
}

export default Card