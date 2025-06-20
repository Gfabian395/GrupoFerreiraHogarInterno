import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AgregarCategoria.css';

const AgregarCategoria = ({ currentUser }) => {
  const [nombre, setNombre] = useState('');
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAddCategoria = async (e) => {
    e.preventDefault();

    if (!imagenArchivo) {
      setAlerta('Seleccioná una imagen para subir');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const storageRef = ref(storage, `categorias/${imagenArchivo.name}`);
      const snapshot = await uploadBytes(storageRef, imagenArchivo);
      const urlDescarga = await getDownloadURL(snapshot.ref);

      const categoriasCollection = collection(db, 'categorias');
      await addDoc(categoriasCollection, {
        nombre,
        imagenUrl: urlDescarga
      });

      setNombre('');
      setImagenArchivo(null);
      setAlerta('Categoría agregada con éxito');

      setTimeout(() => {
        setAlerta('');
        window.location.reload(); // o actualizar estado en lugar de recargar
      }, 1000);
    } catch (error) {
      console.error("Error al agregar la categoría:", error);
      setAlerta('Hubo un error al agregar la categoría');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Validar roles permitidos (jefe o encargado)
  if (currentUser.role !== 'jefe' && currentUser.role !== 'encargado') {
    return null;
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
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setImagenArchivo(e.target.files[0])}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar Categoría</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
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
