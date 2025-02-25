import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collectionGroup, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Categorias.css';
import Load from '../load/Load';

const Categorias = ({ onSelectCategoria, currentUser }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductosGlobal = async () => {
      try {
        const productosQuery = collectionGroup(db, 'productos');
        const productosSnapshot = await getDocs(productosQuery);
        const productosList = productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductos(productosList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching productos: ", error);
        setLoading(false);
      }
    };

    fetchProductosGlobal();
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Load />;
  }

  return (
    <div className="categorias">
      {alerta && <div className="alert alert-danger">{alerta}</div>}
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar"
      />
      <ul>
        {filteredProductos.map(producto => (
          <li key={producto.id} onClick={() => handleSelectCategoria(producto.id)}>
            <img src={producto.imagenUrl} alt={producto.nombre} />
            <div className='descripcioncita'>
              <h3>{producto.nombre}</h3>
              {currentUser && currentUser.role === 'jefe' && (
                <button onClick={(e) => { e.stopPropagation(); promptDeleteCategoria(producto.id); }}>Eliminar</button>
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
