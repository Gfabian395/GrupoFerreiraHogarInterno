import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Load from '../load/Load';
import './Productos.css';

const Productos = ({ onAddToCart }) => {
  const { categoriaId } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <Load />;
  }

  return (
    <>
      <h2>Productos</h2>
    <div className="productos">
      <ul>
        {productos.map(producto => (
          <li key={producto.id}>
            <img src={producto.imagenUrl} alt={producto.nombre} />
            <div>
              <h3>{producto.nombre}</h3>
              <p>Precio: ${producto.precio}</p>
              <p>Stock Andes 4034: {producto.cantidadDisponibleAndes4034}</p>
              <p>Stock Andes 4320: {producto.cantidadDisponibleAndes4320}</p>
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
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/