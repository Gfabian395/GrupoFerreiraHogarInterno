import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './Categorias.css';
import Load from '../load/Load';
/* import BusquedaGlobal from '../busqueda global/BusquedaGlobal'; */

const Categorias = ({ onSelectCategoria, currentUser }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');

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
    if (currentUser?.role === 'jefe') {
      setShowPasswordPrompt(true);
      setDeleteId(id);
    } else {
      setAlerta('No tiene permiso para eliminar esta categoría.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleEditCategoria = (categoria) => {
    if (['jefe', 'encargado'].includes(currentUser?.role)) {
      setEditCategoria(categoria);
      setEditNombre(categoria.nombre);
      setEditImagenUrl(categoria.imagenUrl);
      setShowEditPrompt(true);
    } else {
      setAlerta('No tiene permiso para editar esta categoría.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const saveEditCategoria = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'categorias', editCategoria.id), {
        nombre: editNombre,
        imagenUrl: editImagenUrl
      });
      setAlerta('Categoría actualizada con éxito');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating categoria: ", error);
    }
  };

  const handleSelectCategoria = (id) => {
    onSelectCategoria(id);
    navigate(`/categorias/${id}/productos`);
  };

  const filteredCategorias = categorias.filter(cat =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || imagesLoading) return <Load />;

  return (
    <>
      {/* ESTE ES EL BUSCADOR */}
       <input
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Buscar categorías..."
        className="search-input"
      /> 
      {/* <BusquedaGlobal /> */}

      <div className="categorias">
        {alerta && <div className="alert alert-danger">{alerta}</div>}

        <ul>
          {filteredCategorias.map(categoria => (
            <li key={categoria.id} className="categoria-card">
              {['jefe', 'encargado'].includes(currentUser?.role) && (
                <button className="btn-esquina top-right" onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategoria(categoria);
                }}>✏️</button>
              )}

              {currentUser?.role === 'jefe' && (
                <button className="btn-esquina bottom-left" onClick={(e) => {
                  e.stopPropagation();
                  promptDeleteCategoria(categoria.id);
                }}>🗑️</button>
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
                <button type="button" onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                }} className="btn btn-secondary">Cancelar</button>
              </form>
            </div>
          </div>
        )}

        {showEditPrompt && (
          <div className="overlay">
            <div className="form-popup">
              <h3>Editar Categoría</h3>
              <form onSubmit={saveEditCategoria}>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Nombre de la Categoría"
                  required
                />
                <input
                  type="text"
                  value={editImagenUrl}
                  onChange={(e) => setEditImagenUrl(e.target.value)}
                  placeholder="URL de la Imagen"
                  required
                />
                <button type="submit" className="btn btn-success">Guardar</button>
                <button type="button" onClick={() => {
                  setShowEditPrompt(false);
                  setEditCategoria(null);
                }} className="btn btn-secondary">Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Categorias;
