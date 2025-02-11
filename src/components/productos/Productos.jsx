import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';
import './Productos.css';

const Productos = ({ onAddToCart }) => {
  const { categoriaId } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState('');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
        const productosSnapshot = await getDocs(productosCollection);
        const productosList = productosSnapshot.docs.map(doc => ({ id: doc.id, categoriaId: categoriaId, ...doc.data() }));
        setProductos(productosList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching productos: ", error);
        setLoading(false);
      }
    };

    if (categoriaId) {
      fetchProductos();
    }
  }, [categoriaId]);

  const handleIncrementStock = async (productoId, campo) => {
    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find(p => p.id === productoId);
      const newCantidad = parseInt(producto[campo]) + 1;

      await updateDoc(productoRef, {
        [campo]: newCantidad
      });

      setProductos(productos.map(p => p.id === productoId ? { ...p, [campo]: newCantidad } : p));

      setAlerta('Stock actualizado con éxito');
      setTimeout(() => {
        setAlerta('');
      }, 3000);
    } catch (error) {
      console.error("Error updating stock: ", error);
    }
  };

  const handleShowModal = (productoId, campo) => {
    handleIncrementStock(productoId, campo);
  };

  if (loading) {
    return <Load />;
  }

  return (
    <>
      <h2>Productos</h2>
      {alerta && <div className="alert alert-success">{alerta}</div>}
      <div className="productos">
        <ul>
          {productos.map(producto => (
            <li key={producto.id}>
              <img src={producto.imagenUrl} alt={producto.nombre} />
              <div className='detallitos'>
                <h3>{producto.nombre}</h3>
                <p>Precio: ${producto.precio}</p>
                <p>
                  Stock Andes 4034: {producto.cantidadDisponibleAndes4034}
                  <button onDoubleClick={() => handleShowModal(producto.id, 'cantidadDisponibleAndes4034')} style={{ marginLeft: '10px' }}> + </button>
                </p>
                <p>
                  Stock Andes 4320: {producto.cantidadDisponibleAndes4320} 
                  <button onDoubleClick={() => handleShowModal(producto.id, 'cantidadDisponibleAndes4320')} style={{ marginLeft: '10px' }}> + </button>
                </p>
                <button onClick={() => onAddToCart(producto)}>Agregar al Carrito</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </>
  );
};

export default Productos;
