import { NavLink } from 'react-router-dom';
import './Header.scss';

export function Header() {
  return (
    <header className="header">
      <div className="container header__container">
        <div className="header__logo">
          <NavLink to="/">
            <strong>Verzel</strong> Events
          </NavLink>
        </div>

        <nav className="header__nav" aria-label="Navegação principal">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
          >
            Eventos
          </NavLink>
          <NavLink 
            to="/login" 
            className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
          >
            Login
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
