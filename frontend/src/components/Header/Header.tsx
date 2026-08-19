import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.scss';

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate('/login');
  }

  return (
    <header className="header">
      <div className="container header__container">
        <div className="header__logo">
          <NavLink to="/">
            <strong>Verzel</strong> Events
          </NavLink>
        </div>

        <nav className="header__nav" aria-label="Navegação principal">
          {/* Só não mostra Eventos para GATE_STAFF */}
          {user?.role !== 'GATE_STAFF' && (
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
            >
              Eventos
            </NavLink>
          )}

          {/* ORGANIZER: Vê o link do seu painel */}
          {user?.role === 'ORGANIZER' && (
            <NavLink 
              to="/organizer" 
              className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
            >
              Painel
            </NavLink>
          )}

          {/* GATE_STAFF: Vê o link da portaria */}
          {user?.role === 'GATE_STAFF' && (
            <NavLink 
              to="/gate" 
              className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
            >
              Portaria
            </NavLink>
          )}
          
          {isAuthenticated ? (
            <div className="header__user-menu">
              <span className="header__user-name">Olá, {user?.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="header__logout-btn">
                Sair
              </button>
            </div>
          ) : (
            <NavLink 
              to="/login" 
              className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
