import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Categorias.css';
import Load from '../load/Load';

const Categorias = ({ onSelectCategoria }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleDeleteCategoria = async (id) => {
    try {
      await deleteDoc(doc(db, 'categorias', id));
      setCategorias(categorias.filter(categoria => categoria.id !== id));
    } catch (error) {
      console.error("Error deleting categoria: ", error);
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
      <h2>Categorías</h2>
      <ul>
        {categorias.map(categoria => (
          <li key={categoria.id} onClick={() => handleSelectCategoria(categoria.id)}>
            <img src={categoria.imagenUrl} alt={categoria.nombre} />
            <div>
              <h3>{categoria.nombre}</h3>
              <button onClick={() => handleDeleteCategoria(categoria.id)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categorias;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/