import React from 'react';
import './Nav.css';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@mui/material'; // Importar el componente Icon de Material-UI

const Nav = ({ cartItemCount, onLogout, username, role }) => {
  const location = useLocation();

  const handleNavClick = () => {
    const navCollapse = document.getElementById('navbarCollapse');
    if (navCollapse.classList.contains('show')) {
      navCollapse.classList.remove('show');
    }
  };

  const handleLogoutClick = () => {
    const confirmed = window.confirm("¿Quieres cerrar sesión?");
    if (confirmed) {
      onLogout();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <Link to="/" className="navbar-brand"><b>Grupo Ferreira Hogar</b></Link>
      <div className="cart-container">
        <Link to="/carrito" className="nav-item nav-link cart-link">
          🛒
          <span className="cart-badge">{cartItemCount}</span>
        </Link>
      </div>
      <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div id="navbarCollapse" className="collapse navbar-collapse justify-content-start">
        <div className="navbar-nav">
          <Link to="/" className={`nav-item nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={handleNavClick}>Inicio</Link>
          <Link to="/clientes" className={`nav-item nav-link ${location.pathname === '/clientes' ? 'active' : ''}`} onClick={handleNavClick}>Clientes</Link>
          <Link to="/categorias" className={`nav-item nav-link ${location.pathname === '/categorias' ? 'active' : ''}`} onClick={handleNavClick}>Categorías</Link>
          {role === 'jefe' && (
            <Link to="/cierre-caja" className={`nav-item nav-link ${location.pathname === '/cierre-caja' ? 'active' : ''}`} onClick={handleNavClick}>Cierre de Caja</Link>
          )}
        </div>
        <div className="navbar-nav ml-auto">
          <span className="navbar-text">
            {username} <Icon className="material-icons" onClick={handleLogoutClick}>logout</Icon>
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
