import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Categorias.css';
import Load from '../load/Load';

const Categorias = ({ onSelectCategoria, currentUser }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');
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
          window.location.reload(); // Refrescar la página
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

  const handleSelectCategoria = (id) => {
    onSelectCategoria(id);
    navigate(`/categorias/${id}/productos`);
  };

  if (loading) {
    return <Load />;
  }

  return (
    <div className="categorias">
      {alerta && <div className="alert alert-danger">{alerta}</div>}
      <ul>
        {categorias.map(categoria => (
          <li key={categoria.id} onClick={() => handleSelectCategoria(categoria.id)}>
            <img src={categoria.imagenUrl} alt={categoria.nombre} />
            <div className='descripcioncita'>
              <h3>{categoria.nombre}</h3>
              {currentUser && currentUser.role === 'jefe' && (
                <button onClick={(e) => { e.stopPropagation(); promptDeleteCategoria(categoria.id); }}>Eliminar</button>
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
    </div>
  );
};

export default Categorias;
