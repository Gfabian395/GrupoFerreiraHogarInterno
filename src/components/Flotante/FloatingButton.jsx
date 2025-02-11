import React, { useState } from 'react';
import './FloatingButton.css';

const FloatingButton = ({ onAddCategoria, onEditCategoria, onDeleteCategoria }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="floating-button-container">
      <button className="floating-button" onClick={toggleMenu}>+</button>
      {isOpen && (
        <div className="floating-menu">
          <button onClick={onAddCategoria}>Agregar Categoría</button>
          <button onClick={onEditCategoria}>Editar Categoría</button>
          <button onClick={onDeleteCategoria}>Eliminar Categoría</button>
        </div>
      )}
    </div>
  );
};

export default FloatingButton;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/