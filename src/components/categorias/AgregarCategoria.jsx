import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './AgregarCategoria.css';

const AgregarCategoria = () => {
  const [nombre, setNombre] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    const categoriasCollection = collection(db, 'categorias');
    await addDoc(categoriasCollection, { nombre, imagenUrl });
    setNombre('');
    setImagenUrl('');
    setAlerta('Categoría agregada con éxito');
    setTimeout(() => {
      setAlerta('');
      window.location.reload(); // Refrescar la página
    }, 1000);
  };

  return (
    <div className="agregar-categoria">
      <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="btn btn-secondary">
        {mostrarFormulario ? 'Ocultar Formulario' : 'Agregar Categoría'}
      </button>
      {mostrarFormulario && (
        <>
          <h2>Agregar Categoría</h2>
          {alerta && <div className="alert alert-success">{alerta}</div>}
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
        </>
      )}
    </div>
  );
};

export default AgregarCategoria;
