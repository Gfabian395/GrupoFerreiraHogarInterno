import React from 'react';
import './Nav.css';
import { Link } from 'react-router-dom';

const Nav = ({ cartItemCount }) => {
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
          <Link to="/" className="nav-item nav-link">Inicio</Link>
          <Link to="/clientes" className="nav-item nav-link">Clientes</Link>
          <Link to="/categorias" className="nav-item nav-link">Categorías</Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/