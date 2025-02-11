import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './AgregarCategoria.css';

const AgregarCategoria = () => {
  const [nombre, setNombre] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    const categoriasCollection = collection(db, 'categorias');
    await addDoc(categoriasCollection, { nombre, imagenUrl });
    setNombre('');
    setImagenUrl('');
  };

  return (
    <div className="agregar-categoria">
      <h2>Agregar Categoría</h2>
      <form onSubmit={handleAddCategoria}>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Nombre de la Categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="url"
            className="form-control"
            placeholder="URL de la Imagen"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Agregar Categoría</button>
      </form>
    </div>
  );
};

export default AgregarCategoria;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/