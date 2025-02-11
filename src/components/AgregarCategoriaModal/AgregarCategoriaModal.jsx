import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './AgregarCategoriaModal.css';

const AgregarCategoriaModal = ({ isOpen, onClose }) => {
  const [categoria, setCategoria] = useState({
    nombre: '',
    imagenUrl: ''
  });

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    const categoriasCollection = collection(db, 'categorias');
    await addDoc(categoriasCollection, categoria);
    setCategoria({ nombre: '', imagenUrl: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Agregar Categoría</h2>
        <form onSubmit={handleAddCategoria}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre de la Categoría"
              value={categoria.nombre}
              onChange={(e) => setCategoria({ ...categoria, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="url"
              className="form-control"
              placeholder="URL de la Imagen"
              value={categoria.imagenUrl}
              onChange={(e) => setCategoria({ ...categoria, imagenUrl: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Agregar Categoría</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  );
};

export default AgregarCategoriaModal;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/