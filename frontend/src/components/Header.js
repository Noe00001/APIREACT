import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

const Header = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem('cafe_salome_user') || 'null');
    } catch {
      localStorage.removeItem('cafe_salome_user');
      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cafe_salome_token');
    localStorage.removeItem('cafe_salome_user');
    sessionStorage.removeItem('cafe_salome_token');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleGalleryClick = (e) => {
    if (location.pathname === '/') {
      const el = document.getElementById('galeria');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-left">
          <Link to="/" className="site-brand-link">
            <img src="/JavaCat.png" alt="Café Salome" className="site-logo" />
            <span className="site-brand-text">Café Salome</span>
          </Link>
          <nav className="site-nav" aria-label="Navegación principal">
            <Link to="/" className={location.pathname === '/' ? 'active-nav-link' : ''}>Inicio</Link>
            <a href="/#galeria" onClick={handleGalleryClick}>Galería</a>
            <Link to="/quienes-somos" className={location.pathname === '/quienes-somos' ? 'active-nav-link' : ''}>Quiénes Somos</Link>
            <Link to="/contacto" className={location.pathname === '/contacto' ? 'active-nav-link' : ''}>Contacto</Link>
          </nav>
        </div>

        <div className="site-actions">
          {user ? (
            <>
              <span className="site-user-badge">
                <span className="user-dot"></span>
                {user.nombre} ({user.rol})
              </span>
              <Link to="/panel" className="site-link">{user.rol === 'Administrador' ? 'Panel Admin' : 'Mi Panel'}</Link>
              <button type="button" onClick={handleLogout} className="site-cta logout-btn">Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/login" className="site-link">Iniciar sesión</Link>
              <Link to="/register" className="site-cta">Registrarse</Link>
            </>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="site-toggle"
            aria-label="Alternar modo de color"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {theme === 'light' ? <><Moon size={18} /> Oscuro</> : <><Sun size={18} /> Claro</>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

