import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './Categorias.css';
import Load from '../load/Load';
import BusquedaGlobal from '../busqueda global/BusquedaGlobal';

const Categorias = ({ onSelectCategoria, currentUser }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');

  // Estado para el buscador global
  const [query, setQuery] = useState('');

  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');
  const [editImagenFile, setEditImagenFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categorias'));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setCategorias(list);
      } catch (error) {
        console.error("Error fetching categorias: ", error);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  const handleImageLoad = () => {
    const allImagesLoaded = Array.from(document.querySelectorAll("img")).every(img => img.complete);
    if (allImagesLoaded) setImagesLoading(false);
  };

  const handleDeleteCategoria = async (e) => {
    e.preventDefault();
    if (password === '031285') {
      try {
        await deleteDoc(doc(db, 'categorias', deleteId));
        setAlerta('Categoría eliminada con éxito');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error("Error deleting categoria: ", error);
      }
    } else {
      setAlerta('Contraseña incorrecta');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const promptDeleteCategoria = (id) => {
    if (currentUser?.role?.includes('jefe')) {
      setShowPasswordPrompt(true);
      setDeleteId(id);
    } else {
      setAlerta('No tiene permiso para eliminar esta categoría.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleEditCategoria = (categoria) => {
    if (['jefe', 'encargado', 'fotografo'].some(r => currentUser?.role?.includes(r))) {
      setEditCategoria(categoria);
      setEditNombre(categoria.nombre);
      setEditImagenUrl(categoria.imagenUrl);
      setEditImagenFile(null);
      setShowEditPrompt(true);
    } else {
      setAlerta('No tiene permiso para editar esta categoría.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    setEditImagenFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagenUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEditCategoria = async (e) => {
    e.preventDefault();
    try {
      let nuevaImagenUrl = editImagenUrl;

      if (editImagenFile) {
        setUploading(true);

        // 1. Subir nueva imagen
        const imageRef = ref(storage, `categorias/${Date.now()}_${editImagenFile.name}`);
        await uploadBytes(imageRef, editImagenFile);
        nuevaImagenUrl = await getDownloadURL(imageRef);

        // 2. Borrar imagen anterior (si existe)
        if (editCategoria.imagenUrl) {
          try {
            const oldPath = decodeURIComponent(editCategoria.imagenUrl.split('/o/')[1].split('?')[0]);
            const oldRef = ref(storage, oldPath);
            await deleteObject(oldRef);
          } catch (err) {
            console.warn("No se pudo borrar la imagen anterior:", err.message);
          }
        }

        setUploading(false);
      }

      // 3. Actualizar Firestore
      await updateDoc(doc(db, 'categorias', editCategoria.id), {
        ...(currentUser?.role?.includes('fotografo') ? {} : { nombre: editNombre }),
        imagenUrl: nuevaImagenUrl,
      });

      setAlerta('Categoría actualizada con éxito');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating categoria: ", error);
      setAlerta('Error al actualizar categoría');
      setTimeout(() => setAlerta(''), 3000);
      setUploading(false);
    }
  };

  const handleSelectCategoria = (id) => {
    onSelectCategoria(id);
    navigate(`/categorias/${id}/productos`);
  };

  if (loading || imagesLoading) return <Load />;

  return (
    <>
      {/* Input del buscador global */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar productos..."
        className="search-input"
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />

      {/* Renderizamos solo el buscador global */}
      <BusquedaGlobal query={query} />

      {/* Seguimos mostrando las categorías sin filtro */}
      <div className="categorias" style={{ marginTop: '2rem' }}>
        {alerta && <div className="alert alert-danger">{alerta}</div>}

        <ul>
          {categorias.map(categoria => (
            <li key={categoria.id} className="categoria-card">
              {(['jefe', 'encargado', 'fotografo'].some(r => currentUser?.role?.includes(r))) && (
                <button
                  className="btn-esquina top-right"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategoria(categoria);
                  }}
                >
                  <i className='bx bxs-pencil'></i>
                </button>
              )}

              {currentUser?.role?.includes('jefe') && (
                <button
                  className="btn-esquina bottom-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    promptDeleteCategoria(categoria.id);
                  }}
                >
                  <i className='bx bxs-trash-alt'></i>
                </button>
              )}

              <div onClick={() => handleSelectCategoria(categoria.id)}>
                <img
                  src={categoria.imagenUrl}
                  alt={categoria.nombre}
                  loading="lazy"
                  onLoad={handleImageLoad}
                />
                <div className="descripcioncita">
                  <h6>{categoria.nombre}</h6>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {showPasswordPrompt && (
          <div className="overlay">
            <div className="form-popup">
              <h3>Ingrese la Contraseña</h3>
              <form onSubmit={handleDeleteCategoria}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                />
                <button type="submit" className="btn btn-danger">Confirmar</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPassword('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}

        {showEditPrompt && (
          <div className="overlay">
            <div className="form-popup">
              <h3>Editar Categoría</h3>
              <form onSubmit={saveEditCategoria}>
                {!currentUser?.role?.includes('fotografo') && (
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Nombre de la Categoría"
                    required
                  />
                )}
                {currentUser?.role?.includes('fotografo') && (
                  <p style={{ marginBottom: '1rem', color: '#777' }}>
                    Solo puede editar la imagen.
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                />
                {editImagenUrl && (
                  <img
                    src={editImagenUrl}
                    alt="Vista previa"
                    style={{ width: '200px', marginTop: '10px' }}
                  />
                )}
                <button type="submit" className="btn btn-success" disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPrompt(false);
                    setEditCategoria(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Categorias;
