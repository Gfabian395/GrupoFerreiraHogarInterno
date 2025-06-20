import React, { useState } from 'react';
<<<<<<< HEAD
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
=======
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
>>>>>>> 80de3ac (version mejorada de la original)
import './AgregarCategoria.css';

const AgregarCategoria = ({ currentUser }) => {
  const [nombre, setNombre] = useState('');
<<<<<<< HEAD
  const [imagenUrl, setImagenUrl] = useState('');
=======
  const [imagenArchivo, setImagenArchivo] = useState(null);
>>>>>>> 80de3ac (version mejorada de la original)
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAddCategoria = async (e) => {
    e.preventDefault();

<<<<<<< HEAD
    try {
      const categoriasCollection = collection(db, 'categorias');
      await addDoc(categoriasCollection, { nombre, imagenUrl });
      setNombre('');
      setImagenUrl('');
      setAlerta('Categoría agregada con éxito');
      setTimeout(() => {
        setAlerta('');
        window.location.reload(); // Refrescar la página
=======
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
        window.location.reload();
>>>>>>> 80de3ac (version mejorada de la original)
      }, 1000);
    } catch (error) {
      console.error("Error al agregar la categoría:", error);
      setAlerta('Hubo un error al agregar la categoría');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Validar roles permitidos (jefe o encargado)
  if (currentUser.role !== 'jefe' && currentUser.role !== 'encargado') {
<<<<<<< HEAD
    return null; // Si el usuario no es "jefe" ni "encargado", no se muestra nada
=======
    return null;
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
                  type="url"
                  className="form-control"
                  placeholder="URL de la Imagen"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
=======
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setImagenArchivo(e.target.files[0])}
>>>>>>> 80de3ac (version mejorada de la original)
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar Categoría</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
<<<<<<< HEAD
      {/* Botón flotante */}
=======
>>>>>>> 80de3ac (version mejorada de la original)
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
