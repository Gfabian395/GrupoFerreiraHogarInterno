import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
  const [categorias, setCategorias] = useState([]);
  const formRef = useRef(null);

  // Función para cargar productos y categorías
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
        const productosSnapshot = await getDocs(productosCollection);
        const productosList = productosSnapshot.docs.map(doc => ({
          id: doc.id,
          categoriaId,
          ...doc.data(),
        }));
        productosList.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setProductos(productosList);
      } catch (error) {
        console.error("Error fetching productos: ", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategorias = async () => {
      try {
        const categoriasCollection = collection(db, 'categorias');
        const categoriasSnapshot = await getDocs(categoriasCollection);
        const categoriasList = categoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategorias(categoriasList);
      } catch (error) {
        console.error("Error fetching categorias: ", error);
      }
    };

    if (categoriaId) fetchProductos();
    fetchCategorias();
  }, [categoriaId]);

  // Actualización del formulario dinámico
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value, // Esto asegurará que "categoriaId" se actualice correctamente
    }));
  };

  // Actualización del producto en Firebase
  const handleUpdateProduct = async (productoId) => {
    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await updateDoc(productoRef, { ...currentProduct });
      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id === productoId ? currentProduct : prod
        )
      );
      setMostrarFormulario(false);
      setAlerta('Producto actualizado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
    }
  };

  // Manejo del formulario de edición
  const handleShowFormulario = (producto) => {
    console.log("Datos actuales del producto:", producto); // Aquí verificamos los datos del producto
    setCurrentProduct(producto);
    setMostrarFormulario(true);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
  };

  // Manejo de búsqueda
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProduct = async (productoId) => {
    try {
      // Referencia al documento del producto en Firebase
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
  
      // Elimina el producto de Firebase
      await deleteDoc(productoRef);
  
      // Actualiza el estado local
      setProductos((prevProductos) =>
        prevProductos.filter((p) => p.id !== productoId)
      );
  
      // Alerta de éxito
      setAlerta('Producto eliminado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error('Error al eliminar el producto: ', error);
    }
  };

  const handleIncrementStock = async (productoId, campo) => {
    try {
      // Referencia al documento del producto en Firebase
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
  
      // Encuentra el producto en el estado actual
      const producto = productos.find((p) => p.id === productoId);
  
      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;
  
        // Actualiza Firebase
        await updateDoc(productoRef, { [campo]: newCantidad });
  
        // Actualiza el estado local
        setProductos(
          productos.map((p) =>
            p.id === productoId ? { ...p, [campo]: newCantidad } : p
          )
        );
  
        // Muestra alerta de éxito
        setAlerta('Stock actualizado con éxito');
        setTimeout(() => setAlerta(''), 3000);
      } else {
        console.error('Error: El campo especificado no es un número válido o no existe.');
      }
    } catch (error) {
      console.error('Error al actualizar el stock: ', error);
    }
  };

  const handleAddToCart = (producto, sucursal) => {
    console.log(`Añadiendo al carrito desde sucursal: ${sucursal}`);
    
    const productoEnCarrito = { ...producto, sucursal };
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);
  
    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart(productoEnCarrito);
      alert('Producto añadido al carrito con éxito');
    } else {
      alert('No hay suficiente stock para añadir este producto al carrito');
    }
  };
  
  
  if (loading) return <Load />;

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
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10); // Evitar valores undefined
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
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
                      <button
                        onClick={() => handleAddToCart(producto, 'Andes4034')}
                        disabled={outOfStock4034}
                        className={`boton-agregar ${outOfStock4034 ? 'boton-sin-stock' : ''}`}
                      >
                        +🛒
                      </button>
                    )}
                    {currentUser.role === 'jefe' && (
                      <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')} className='boton-incrementar'>+</button>
                    )}
                  </p>

                  <p>
                    Stock Los Andes 4320: {stock4320}
                    {['jefe', 'vendedor'].includes(currentUser.role) && (
                      <button
                        onClick={() => handleAddToCart(producto, 'Andes4320')}
                        disabled={outOfStock4320}
                        className={`boton-agregar ${outOfStock4320 ? 'boton-sin-stock' : ''}`}
                      >
                        +🛒
                      </button>
                    )}
                    {currentUser.role === 'jefe' && (
                      <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')} className='boton-incrementar'>+</button>
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
          <form
            className="floating-form"
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateProduct(currentProduct.id);
            }}
          >
            <span className="close" onClick={handleCloseFormulario}>&times;</span>
            <h2>Editar Producto</h2>

            {/* Nombre */}
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre"
                name="nombre"
                value={currentProduct.nombre || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Precio */}
            <div className="form-group">
              <input
                type="number"
                className="form-control"
                placeholder="Precio"
                name="precio"
                value={currentProduct.precio || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Stock Andes 4034 */}
            <div className="form-group">
              <input
                type="number"
                className="form-control"
                placeholder="Stock Andes 4034"
                name="cantidadDisponibleAndes4034"
                value={currentProduct.cantidadDisponibleAndes4034 || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Stock Andes 4320 */}
            <div className="form-group">
              <input
                type="number"
                className="form-control"
                placeholder="Stock Andes 4320"
                name="cantidadDisponibleAndes4320"
                value={currentProduct.cantidadDisponibleAndes4320 || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* URL de la Imagen */}
            <div className="form-group">
              <input
                type="url"
                className="form-control"
                placeholder="URL de la Imagen"
                name="imagenUrl"
                value={currentProduct.imagenUrl || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Categoría */}
            <div className="form-group">
              <select
                className="form-control"
                name="categoriaId" // Cambia a "categoriaId" para usar el valor correcto
                value={currentProduct.categoriaId || ''} // Usa "categoriaId" en lugar de "categoria"
                onChange={handleInputChange}
                required
              >
                <option value="">-- Selecciona una Categoría --</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones */}
            <div className="form-group-buttons">
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCloseFormulario}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

    </>
  );


}

export default Productos;
