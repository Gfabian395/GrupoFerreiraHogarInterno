import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './AgregarCategoria.css';

const AgregarCategoria = ({ currentUser }) => {
  const [nombre, setNombre] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAddCategoria = async (e) => {
    e.preventDefault();

    try {
      const categoriasCollection = collection(db, 'categorias');
      await addDoc(categoriasCollection, { nombre, imagenUrl });
      setNombre('');
      setImagenUrl('');
      setAlerta('Categoría agregada con éxito');
      setTimeout(() => {
        setAlerta('');
        window.location.reload(); // Refrescar la página
      }, 1000);
    } catch (error) {
      console.error("Error al agregar la categoría:", error);
      setAlerta('Hubo un error al agregar la categoría');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Validar roles permitidos (jefe o encargado)
  if (currentUser.role !== 'jefe' && currentUser.role !== 'encargado') {
    return null; // Si el usuario no es "jefe" ni "encargado", no se muestra nada
  }

  return (
    <div className="agregar-categoria">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
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
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
      {/* Botón flotante */}
      <button
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className="btn-float"
        title="Agregar Categoría"
      >
        +
      </button>
    </div>
  );
};

export default AgregarCategoria;
