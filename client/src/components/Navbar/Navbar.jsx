import Slider from "react-slick";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { axiosFetch } from "../../utils";
import { useRecoilState } from "recoil";
import { userState } from "../../atoms";
import { Loader } from "..";
import "./Navbar.scss";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await axiosFetch.get('/auth/me');
        setUser(data.user);
      } catch ({ response }) {
        localStorage.removeItem('user');
        console.log(response.data.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isActive = () => {
    window.scrollY > 0 ? setShowMenu(true) : setShowMenu(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  const menuLinks = [
    { path: "/gigs?category=design", name: "Графика и Дизайн" },
    { path: "/gigs?category=video", name: "Видео и Анимация" },
    { path: "/gigs?category=books", name: "Копирайтинг и Перевод" },
    { path: "/gigs?category=ai", name: "AI" },
    { path: "/gigs?category=social", name: "Цифровой Маркетинг" },
    { path: "/gigs?category=voice", name: "Музыка и Аудио" },
    { path: "/gigs?category=wordpress", name: "Программирование" },
  ];

  const settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 2,
    prevArrow: <GrFormPrevious />,
    nextArrow: <GrFormNext />,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const handleLogout = async () => {
    try {
      await axiosFetch.post("/auth/logout");
      localStorage.removeItem('user');
      setUser(null);
      navigate("/");
    } catch ({ response }) {
      console.log(response.data);
    }
  };

  return (
    <>
      <nav className={showMenu || pathname !== "/" ? "navbar active" : "navbar"}>
        <div className="container">
          <div className="logo">
            <Link to="/" className="link">
              <span className="text">LinkyDo</span>
            </Link>
            <span className="dot">.</span>
          </div>

          <div className="links">
            <div className="menu-links">
              <Link to="/business" className="business-link">
                LinkyDo Business
              </Link>
              <span>Обзор</span>
              <span>Страна: Россия</span>
              {!user?.isSeller && <span>Стать продавцом</span>}
            </div>
            {isLoading ? (
              <Loader size={35} />
            ) : (
              <>
                {!user && (
                  <span>
                    <Link to="/login" className="link">
                      Войти
                    </Link>
                  </span>
                )}
                {!user && (
                  <button
                    className={showMenu || pathname !== "/" ? "join-active" : ""}
                  >
                    <Link to="/register" className="link">
                      Регистрация
                    </Link>
                  </button>
                )}
                {user && (
                  <div className="user" onClick={() => setShowPanel(!showPanel)}>
                    <img src={user.image || "/media/noavatar.png"} alt="" />
                    <span>{user?.username}</span>
                    {showPanel && (
                      <div className="options">
                        {user?.isSeller && (
                          <>
                            <Link className="link" to="/my-gigs">
                              Мои услуги
                            </Link>
                            <Link className="link" to="/organize">
                              Добавить услугу
                            </Link>
                            <Link className="link" to="/dashboard">
                              Юнит-экономика
                            </Link>
                            <Link className="link" to="/income">
                              Мои доходы
                            </Link>
                          </>
                        )}
                        <Link className="link" to="/orders">
                          Заказы
                        </Link>
                        <Link className="link" to="/messages">
                          Сообщения
                        </Link>
                        <Link className="link" to="/" onClick={handleLogout}>
                          Выйти
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Блок категорий – теперь НЕ внутри <nav>, поэтому не липнет */}
      {(showMenu || pathname !== "/") && (
        <div className="category-bar">
          <hr />
          <Slider className="menu" {...settings}>
            {menuLinks.map(({ path, name }) => (
              <div key={name} className="menu-item">
                <Link className="link" to={path}>
                  {name}
                </Link>
              </div>
            ))}
          </Slider>
        </div>
      )}
    </>
  );
};

export default Navbar;