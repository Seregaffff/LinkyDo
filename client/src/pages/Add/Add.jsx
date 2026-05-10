import toast from 'react-hot-toast';
import { useEffect, useReducer, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gigReducer, initialState } from '../../reducers/gigReducer';
import { cards } from '../../data';
import { axiosFetch, generateImageURL } from '../../utils';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import './Add.scss';

const Add = () => {
  const user = useRecoilValue(userState);
  const [state, dispatch] = useReducer(gigReducer, initialState);
  const [coverImage, setCoverImage] = useState(null);
  const [gigImages, setGigImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  const mutation = useMutation({
    mutationFn: (gig) => axiosFetch.post('/gigs', gig),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-gigs']);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(error.response?.data?.message || 'Ошибка при создании услуги');
    }
  })

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    dispatch({
      type: 'CHANGE_INPUT',
      payload: { name, value }
    })
  }

  const handleFormFeature = (event) => {
    event.preventDefault();
    const featureValue = event.target[0].value;
    if (featureValue.trim()) {
      dispatch({
        type: 'ADD_FEATURE',
        payload: featureValue
      })
    }
    event.target.reset();
  }

  const handleImageUploads = async () => {
    if (!coverImage) {
      toast.error('Пожалуйста, выберите обложку!');
      return;
    }

    try {
      setUploading(true);
      toast.loading('Загрузка изображений...');
      
      // Загрузка обложки
      const cover = await generateImageURL(coverImage);
      
      // Загрузка дополнительных изображений
      let images = [];
      if (gigImages.length > 0) {
        images = await Promise.all(
          [...gigImages].map(async (img) => {
            const result = await generateImageURL(img);
            return result.url;
          })
        )
      }
      
      dispatch({
        type: 'ADD_IMAGES',
        payload: { 
          cover: cover.url, 
          images: images 
        }
      })
      
      toast.dismiss();
      toast.success('Изображения успешно загружены!');
      setUploading(false);
      setImagesUploaded(true);
    }
    catch (error) {
      toast.dismiss();
      console.error('Upload error:', error);
      toast.error('Ошибка при загрузке изображений: ' + (error.message || 'Неизвестная ошибка'));
      setUploading(false);
    }
  }

  const handleFormSubmit = (event) => {
    event.preventDefault();
    
    // Проверка обязательных текстовых полей
    const requiredFields = ['title', 'category', 'description', 'shortTitle', 'shortDesc', 'deliveryTime', 'revisionNumber', 'price'];
    const fieldNames = {
      title: 'Название услуги',
      category: 'Категория',
      description: 'Описание услуги',
      shortTitle: 'Краткое название',
      shortDesc: 'Краткое описание',
      deliveryTime: 'Время исполнения',
      revisionNumber: 'Количество правок',
      price: 'Цена'
    };
    
    for(let field of requiredFields) {
      if(!state[field] || state[field] === '') {
        toast.error(`Пожалуйста, заполните поле: ${fieldNames[field] || field}`);
        return;
      }
    }
    
    // Проверка числовых полей
    if(state.deliveryTime && parseInt(state.deliveryTime) < 1) {
      toast.error('Время исполнения должно быть больше 0');
      return;
    }
    
    if(state.revisionNumber && parseInt(state.revisionNumber) < 0) {
      toast.error('Количество правок не может быть отрицательным');
      return;
    }
    
    if(state.price && parseInt(state.price) < 1) {
      toast.error('Цена должна быть больше 0');
      return;
    }
    
    // Проверка загрузки обложки
    if(!state.cover) {
      toast.error('Пожалуйста, загрузите обложку услуги (выберите файл и нажмите "Upload")!');
      return;
    }
    
    // Отправка формы
    const formData = {
      ...state,
      userID: user._id,
      price: parseInt(state.price),
      deliveryTime: parseInt(state.deliveryTime),
      revisionNumber: parseInt(state.revisionNumber)
    };
    
    toast.success('Создаём вашу услугу...');
    mutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Поздравляем! Ваша услуга опубликована!');
        setTimeout(() => {
          navigate('/my-gigs');
        }, 1500);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при создании услуги');
      }
    });
  }

  const removeFeature = (featureToRemove) => {
    dispatch({ 
      type: 'REMOVE_FEATURE', 
      payload: featureToRemove 
    });
  }

  return (
    <div className='add'>
      <div className="container">
        <h1>Создать услугу</h1>
        <div className="sections">
          <div className="left">
            <label htmlFor="title">Название услуги</label>
            <input 
              id="title"
              name='title' 
              type="text" 
              placeholder="например, Я могу сделать что-то поистине крутое!" 
              onChange={handleFormChange}
              value={state.title || ''}
            />

            <label htmlFor="category">Категория</label>
            <select 
              id="category"
              name="category" 
              onChange={handleFormChange}
              value={state.category || ''}
            >
              <option value=''>Выбрать...</option>
              {
                cards.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.slug[0].toUpperCase() + item.slug.slice(1)}
                  </option>
                ))
              }
            </select>

            <div className="images">
              <div className="imagesInputs">
                <div>
                  <label htmlFor="cover">Обложка (обязательно)</label>
                  <input 
                    id="cover"
                    type="file" 
                    accept='image/*' 
                    onChange={(event) => {
                      setCoverImage(event.target.files[0]);
                      setImagesUploaded(false);
                    }} 
                  />
                </div>
                <div>
                  <label htmlFor="gallery">Дополнительные изображения (необязательно)</label>
                  <input 
                    id="gallery"
                    type="file" 
                    accept='image/*' 
                    multiple 
                    onChange={(event) => {
                      setGigImages(event.target.files);
                      setImagesUploaded(false);
                    }} 
                  />
                </div>
              </div>
              <button 
                type="button"
                onClick={handleImageUploads} 
                disabled={uploading || !coverImage}
                style={{ 
                  backgroundColor: uploading || !coverImage ? '#ccc' : '#1dbf73',
                  cursor: uploading || !coverImage ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Загрузка...' : imagesUploaded ? '✅ Загружено' : '📤 Загрузить изображения'}
              </button>
            </div>

            <label htmlFor="description">Описание услуги</label>
            <textarea 
              id="description"
              name='description' 
              cols="30" 
              rows="16" 
              placeholder='Опишите вашу услугу для клиентов' 
              onChange={handleFormChange}
              value={state.description || ''}
            />

            <button 
              onClick={handleFormSubmit}
              disabled={!imagesUploaded}
              style={{ 
                backgroundColor: !imagesUploaded ? '#ccc' : '#1dbf73',
                cursor: !imagesUploaded ? 'not-allowed' : 'pointer'
              }}
            >
              Создать услугу
            </button>
          </div>

          <div className="right">
            <label htmlFor="shortTitle">Краткое название услуги</label>
            <input 
              id="shortTitle"
              name='shortTitle' 
              type="text" 
              placeholder='например, Одностраничный Web-дизайн' 
              onChange={handleFormChange}
              value={state.shortTitle || ''}
            />

            <label htmlFor="shortDesc">Краткое описание</label>
            <textarea 
              id="shortDesc"
              name='shortDesc' 
              cols="30" 
              rows="6" 
              placeholder='Краткое описание услуги (показывается в карточке)' 
              onChange={handleFormChange}
              value={state.shortDesc || ''}
            />

            <label htmlFor="deliveryTime">Время исполнения (дни)</label>
            <input 
              id="deliveryTime"
              type="number" 
              name='deliveryTime' 
              min='1' 
              placeholder='например, 3'
              onChange={handleFormChange}
              value={state.deliveryTime || ''}
            />

            <label htmlFor="revisionNumber">Количество правок</label>
            <input 
              id="revisionNumber"
              type="number" 
              name='revisionNumber' 
              min='0' 
              placeholder='например, 2'
              onChange={handleFormChange}
              value={state.revisionNumber || ''}
            />

            <label htmlFor="feature">Уникальная черта услуги</label>
            <form className='add-feature' onSubmit={handleFormFeature}>
              <input 
                id="feature"
                type="text" 
                placeholder='например, дизайн страницы' 
              />
              <button type='submit'>Добавить</button>
            </form>
            
            <div className="addedFeatures">
              {state.features?.map((feature, index) => (
                <div key={index} className="item">
                  <button type="button" onClick={() => removeFeature(feature)}>
                    {feature} <span>✕</span>
                  </button>
                </div>
              ))}
            </div>

            <label htmlFor="price">Цена (₽)</label>
            <input 
              id="price"
              name='price' 
              type="number" 
              min='1' 
              placeholder='например, 5000'
              onChange={handleFormChange}
              value={state.price || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Add