import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AgregarCategoria.css';

const AgregarCategoria = ({ currentUser }) => {
  const [nombre, setNombre] = useState('');
  const [imagenFile, setImagenFile] = useState(null);
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const handleAddCategoria = async (e) => {
    e.preventDefault();

    let imagenUrlFinal = 'https://placehold.co/200x200';

    try {
      if (imagenFile) {
        const imageRef = ref(storage, `categorias/${Date.now()}_${imagenFile.name}`);
        await uploadBytes(imageRef, imagenFile);
        imagenUrlFinal = await getDownloadURL(imageRef);
      }

      const categoriasCollection = collection(db, 'categorias');
      await addDoc(categoriasCollection, {
        nombre,
        imagenUrl: imagenUrlFinal,
      });

      setNombre('');
      setImagenFile(null);
      setVistaPrevia(null);
      setAlerta('Categoría agregada con éxito');
      setTimeout(() => {
        setAlerta('');
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error al agregar la categoría:", error);
      setAlerta('Hubo un error al agregar la categoría');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Validar roles permitidos con includes
  if (!currentUser?.role?.includes('jefe') && !currentUser?.role?.includes('encargado')) {
    return null;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImagenFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVistaPrevia(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setVistaPrevia(null);
    }
  };

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
                  onChange={handleFileChange}
                />
              </div>

              {vistaPrevia && (
                <div className="vista-previa">
                  <img src={vistaPrevia} alt="Vista previa" style={{ width: '200px', height: 'auto', marginTop: '10px' }} />
                </div>
              )}

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
/* FUNCIONA PERFECTO, FALTA SUBIR A STORAGE */