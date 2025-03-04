import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, addDoc, doc } from 'firebase/firestore'; // Asegúrate de importar addDoc también
import Load from '../load/Load';
import './Productos.css';

const Productos = ({ onAddToCart, currentUser }) => {
  const { categoriaId } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categorias, setCategorias] = useState([]); // Definir categorias
  const formRef = useRef(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
        const productosSnapshot = await getDocs(productosCollection);
        const productosList = productosSnapshot.docs.map(doc => ({ id: doc.id, categoriaId: categoriaId, ...doc.data() }));

        // Ordenar los productos de la A a la Z
        productosList.sort((a, b) => a.nombre.localeCompare(b.nombre));

        setProductos(productosList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching productos: ", error);
        setLoading(false);
      }
    };

    const fetchCategorias = async () => {
      const categoriasCollection = collection(db, 'categorias');
      const categoriasSnapshot = await getDocs(categoriasCollection);
      const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategorias(categoriasList);
    };

    if (categoriaId) {
      fetchProductos();
    }
    fetchCategorias();
  }, [categoriaId]);

  const handleIncrementStock = async (productoId, campo) => {
    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find(p => p.id === productoId);

      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;

        await updateDoc(productoRef, {
          [campo]: newCantidad
        });

        setProductos(productos.map(p => p.id === productoId ? { ...p, [campo]: newCantidad } : p));

        setAlerta('Stock actualizado con éxito');
        setTimeout(() => {
          setAlerta('');
        }, 3000);
      } else {
        console.error("Error: El campo especificado no es un número válido o no existe.");
      }
    } catch (error) {
      console.error("Error updating stock: ", error);
    }
  };

  const handleAddToCart = (producto, sucursal) => {
    const productoEnCarrito = { ...producto, sucursal };
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);

    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart(productoEnCarrito);
      alert('Producto añadido al carrito con éxito');
    } else {
      alert('No hay suficiente stock para añadir este producto al carrito');
    }
  };

  const handleTerminarVenta = async (producto, sucursal) => {
    const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);
    const newCantidad = productoStock - 1;

    if (!isNaN(productoStock) && productoStock > 0) {
      try {
        await updateDoc(productoRef, {
          [`cantidadDisponible${sucursal}`]: newCantidad
        });
        setProductos(productos.map(p => p.id === producto.id ? { ...p, [`cantidadDisponible${sucursal}`]: newCantidad } : p));
        alert('Venta realizada con éxito. Stock actualizado.');
      } catch (error) {
        console.error("Error updating stock: ", error);
      }
    } else {
      alert('No hay suficiente stock para realizar la venta');
    }
  };

  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
  };

  const handleDeleteProduct = async (productoId) => {
    try {
      await deleteDoc(doc(db, `categorias/${categoriaId}/productos`, productoId));
      setProductos(productos.filter(p => p.id !== productoId));
      alert('Producto eliminado con éxito');
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const handleUpdateProduct = async (productoId) => {
    console.log("handleUpdateProduct - productoId:", productoId);
    try {
      const productoData = { ...currentProduct };
      console.log("Datos del producto actual:", currentProduct);
      console.log("Datos del producto a actualizar:", productoData);
  
      // Verificar si la categoría ha cambiado
      const nuevaCategoria = productoData.categoria || categoriaId; // Usa la categoría actual si la categoría del producto es undefined
      console.log("Categoría nueva o actual del producto:", nuevaCategoria);
      console.log("Categoría actual:", categoriaId);
  
      if (nuevaCategoria !== categoriaId) {
        console.log("La categoría ha cambiado, moviendo el producto a la nueva categoría.");
        // Mover el producto a la nueva categoría
        const nuevaCategoriaRef = collection(db, `categorias/${nuevaCategoria}/productos`);
        await addDoc(nuevaCategoriaRef, productoData);
        console.log("Producto agregado a la nueva categoría:", productoData);
  
        // Eliminar el producto de la categoría actual
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
        await deleteDoc(productoRef);
        console.log("Producto eliminado de la categoría actual:", productoId);
  
        // Actualizar el estado de los productos
        setProductos(productos.filter(p => p.id !== productoId));
        console.log("Estado de productos actualizado después de mover:", productos);
      } else {
        console.log("La categoría no ha cambiado, actualizando el producto en la misma categoría.");
        // Actualizar el producto en la misma categoría
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
        await updateDoc(productoRef, productoData);
        console.log("Producto actualizado en la misma categoría:", productoData);
  
        // Actualizar el estado de los productos
        setProductos(productos.map(p => p.id === productoId ? { ...p, ...productoData } : p));
        console.log("Estado de productos actualizado:", productos);
      }
  
      alert('Producto actualizado con éxito');
      handleCloseFormulario();
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };
  
  
  
  
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Load />;
  }

  return (
    <>
      {alerta && <div className="alert alert-success">{alerta}</div>}
      <div className="productos">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <ul>
          {filteredProductos.map(producto => {
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034);
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320);
            const outOfStock4034 = stock4034 === 0;
            const outOfStock4320 = stock4320 === 0;
            const outOfStockBoth = outOfStock4034 && outOfStock4320;

            return (
              <li key={producto.id} className={outOfStockBoth ? 'producto-sin-stock' : ''}>
                <img src={producto.imagenUrl} alt={producto.nombre} />
                <div className='detallitos'>
                  <h3>{producto.nombre}</h3>
                  <p>Precio: ${producto.precio}</p>

                  <p>
                    Stock Los Andes 4034: {stock4034}
                    {['jefe', 'vendedor'].includes(currentUser.role) && (
                      <>
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4034')}
                          disabled={outOfStock4034}
                          className={`boton-agregar ${outOfStock4034 ? 'boton-sin-stock' : ''}`}
                        >
                          +🛒
                        </button>
                      </>
                    )}
                    {currentUser.role === 'jefe' && (
                      <>
                        <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')} className='boton-incrementar'> + </button>
                      </>
                    )}
                  </p>
                  <p>
                    Stock Los Andes 4320: {stock4320}
                    {['jefe', 'vendedor'].includes(currentUser.role) && (
                      <>
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4320')}
                          disabled={outOfStock4320}
                          className={`boton-agregar ${outOfStock4320 ? 'boton-sin-stock' : ''}`}
                        >
                          +🛒
                        </button>
                      </>
                    )}
                    {currentUser.role === 'jefe' && (
                      <>
                        <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')} className='boton-incrementar'> + </button>
                      </>
                    )}
                  </p>

                  {currentUser.role === 'jefe' && (
                    <div className='action-buttons'>
                      <button onClick={() => handleShowFormulario(producto)} className='boton-editar'>Editar</button>
                      <button onClick={() => handleDeleteProduct(producto.id)} className='boton-borrar'>Borrar</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {mostrarFormulario && currentProduct && (
        <div className="blur-background">
          <form className="floating-form" ref={formRef}>
            <span className="close" onClick={handleCloseFormulario}>&times;</span>
            <h2>Editar Producto</h2>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre"
                name="nombre"
                value={currentProduct.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Precio"
                name="precio"
                value={currentProduct.precio}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Stock Andes 4034"
                name="cantidadDisponibleAndes4034"
                value={currentProduct.cantidadDisponibleAndes4034}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Stock Andes 4320"
                name="cantidadDisponibleAndes4320"
                value={currentProduct.cantidadDisponibleAndes4320}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="URL de la Imagen"
                name="imagenUrl"
                value={currentProduct.imagenUrl}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <select
                className="form-control"
                name="categoria"
                value={categoriaId} // Valor de la categoría actual
                onChange={handleInputChange}
                required
              >
                <option value="">-- Selecciona una Categoría --</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                ))}
              </select>
            </div>

            <button type="button" className="btn btn-primary" onClick={() => handleUpdateProduct(currentProduct.id)}>Guardar Cambios</button>
          </form>
        </div>
      )}

    </>
  );

}

export default Productos;
