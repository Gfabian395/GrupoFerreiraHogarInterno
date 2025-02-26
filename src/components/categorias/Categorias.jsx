import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './Categorias.css';
import Load from '../load/Load';

const Categorias = ({ onSelectCategoria, currentUser }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const categoriasCollection = collection(db, 'categorias');
        const categoriasSnapshot = await getDocs(categoriasCollection);
        const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategorias(categoriasList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categorias: ", error);
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  const handleDeleteCategoria = async (e) => {
    e.preventDefault();
    if (password === '031285') {
      try {
        await deleteDoc(doc(db, 'categorias', deleteId));
        setAlerta('Categoría eliminada con éxito');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Error deleting categoria: ", error);
      }
    } else {
      setAlerta('Contraseña incorrecta');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const promptDeleteCategoria = (id) => {
    if (currentUser && currentUser.role === 'jefe') {
      setShowPasswordPrompt(true);
      setDeleteId(id);
    } else {
      setAlerta('No tiene permiso para eliminar esta categoría.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleEditCategoria = (categoria) => {
    if (currentUser && currentUser.role === 'jefe') {
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
      const categoriaRef = doc(db, 'categorias', editCategoria.id);
      await updateDoc(categoriaRef, {
        nombre: editNombre,
        imagenUrl: editImagenUrl
      });
      setAlerta('Categoría actualizada con éxito');
      setTimeout(() => {
        setShowEditPrompt(false);
        setEditCategoria(null);
        setEditNombre('');
        setEditImagenUrl('');
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating categoria: ", error);
    }
  };

  const handleSelectCategoria = (id) => {
    onSelectCategoria(id);
    navigate(`/categorias/${id}/productos`);
  };

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Load />;
  }

  return (
    <div className="categorias">
      {alerta && <div className="alert alert-danger">{alerta}</div>}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar categorías..."
        className="search-input"
      />

      <ul>
        {filteredCategorias.map(categoria => (
          <li key={categoria.id} onClick={() => handleSelectCategoria(categoria.id)}>
            <img src={categoria.imagenUrl} alt={categoria.nombre} />
            <div className='descripcioncita'>
              <h3>{categoria.nombre}</h3>
              {currentUser && currentUser.role === 'jefe' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); promptDeleteCategoria(categoria.id); }}>Eliminar</button>
                  <button onClick={(e) => { e.stopPropagation(); handleEditCategoria(categoria); }}>Editar</button>
                </>
              )}
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
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
              <button type="submit" className="btn btn-danger">Confirmar</button>
              <button onClick={() => { setShowPasswordPrompt(false); setPassword(''); }} className="btn btn-secondary">Cancelar</button>
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
                className="form-control"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre de la Categoría"
                required
              />
              <input
                type="text"
                className="form-control"
                value={editImagenUrl}
                onChange={(e) => setEditImagenUrl(e.target.value)}
                placeholder="URL de la Imagen"
                required
              />
              <button type="submit" className="btn btn-success">Guardar</button>
              <button onClick={() => { setShowEditPrompt(false); setEditCategoria(null); }} className="btn btn-secondary">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Categorias;
