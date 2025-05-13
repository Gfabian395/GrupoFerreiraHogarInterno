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

  // Cargar productos y categorías
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

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  // Actualizar producto en Firebase
  const handleUpdateProduct = async (productoId) => {
    if (currentUser.role !== 'jefe' && currentUser.role !== 'encargado') {
      setAlerta('No tienes permiso para editar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

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

  // Mostrar formulario de edición
  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
  };

  // Filtrar productos por búsqueda
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Eliminar producto
  const handleDeleteProduct = async (productoId) => {
    if (currentUser.role !== 'jefe') {
      setAlerta('No tienes permiso para eliminar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await deleteDoc(productoRef);
      setProductos((prevProductos) => prevProductos.filter((p) => p.id !== productoId));
      setAlerta('Producto eliminado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error('Error al eliminar el producto: ', error);
    }
  };

  // Incrementar stock
  const handleIncrementStock = async (productoId, campo) => {
    if (currentUser.role !== 'jefe' && currentUser.role !== 'encargado') {
      setAlerta('No tienes permiso para actualizar el stock.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find((p) => p.id === productoId);

      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;
        await updateDoc(productoRef, { [campo]: newCantidad });
        setProductos(
          productos.map((p) =>
            p.id === productoId ? { ...p, [campo]: newCantidad } : p
          )
        );
        setAlerta('Stock actualizado con éxito');
        setTimeout(() => setAlerta(''), 3000);
      } else {
        console.error('Error: El campo especificado no es un número válido o no existe.');
      }
    } catch (error) {
      console.error('Error al actualizar el stock: ', error);
    }
  };

  // Añadir al carrito
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

  const handleTemporalPriceChange = async (producto) => {
    const originalPrice = producto.precio; // Guardamos el precio original
    const nuevoPrecio = prompt("Introduce el nuevo precio temporal:", producto.precio);
    const temporalTime = 120; // 2 minutos en segundos
    const expirationTime = Date.now() + temporalTime * 1000; // Tiempo de expiración en milisegundos


    if (nuevoPrecio && !isNaN(nuevoPrecio)) {
      try {
        // Actualizar el precio temporal en Firebase
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
        await updateDoc(productoRef, { precio: parseFloat(nuevoPrecio) });

        // Almacenar datos en localStorage
        localStorage.setItem(
          `producto-${producto.id}`,
          JSON.stringify({ expirationTime, originalPrice })
        );

        // Actualizar el estado local
        setProductos((prevProductos) =>
          prevProductos.map((p) =>
            p.id === producto.id
              ? { ...p, precio: parseFloat(nuevoPrecio), isTemporal: true, countdown: temporalTime }
              : p
          )
        );

        alert("Precio cambiado temporalmente.");
      } catch (error) {
        console.error("Error al cambiar el precio temporalmente:", error);
        alert("Hubo un error al actualizar el precio.");
      }
    } else {
      alert("Por favor, introduce un precio válido.");
    }
  };

  // Restaurar precios y sincronizar la cuenta regresiva tras recargar
  useEffect(() => {
    const syncCountdowns = () => {
      const now = Date.now();
      setProductos((prevProductos) =>
        prevProductos.map((producto) => {
          const temporalData = localStorage.getItem(`producto-${producto.id}`);
          if (temporalData) {
            const { expirationTime, originalPrice } = JSON.parse(temporalData);
            const remainingTime = Math.floor((expirationTime - now) / 1000);

            if (remainingTime <= 0) {
              // Restaurar el precio si el tiempo ha expirado
              localStorage.removeItem(`producto-${producto.id}`); // Limpia el almacenamiento
              const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
              updateDoc(productoRef, { precio: originalPrice }) // Restaurar en Firebase
                .then(() => {
                  alert(`El precio del producto "${producto.nombre}" ha sido restablecido a su valor original: $${originalPrice}.`);
                  // Actualizar el estado local al aceptar el alert
                  setProductos((prevProductos) =>
                    prevProductos.map((p) =>
                      p.id === producto.id
                        ? { ...p, precio: originalPrice, isTemporal: false, countdown: 0 }
                        : p
                    )
                  );
                })
                .catch((error) => console.error("Error restaurando el precio en Firebase:", error));
              return { ...producto, precio: originalPrice, isTemporal: false, countdown: 0 };
            } else {
              // Actualizar el countdown restante
              return { ...producto, countdown: remainingTime, isTemporal: true };
            }
          }
          return producto; // Sin cambios si no tiene precio temporal
        })
      );
    };

    // Establecer un único intervalo para gestionar las restauraciones
    const interval = setInterval(syncCountdowns, 1000);

    return () => {
      clearInterval(interval); // Limpia el intervalo al desmontar
    };
  }, []); // Evita reinicios infinitos eliminando dependencias

  const mostrarCuotas = (monto) => {
    if (isNaN(monto) || monto <= 0) {
      return <p>Por favor, ingrese un monto válido.</p>;
    }

    const configuracionCuotas = [
      { cuotas: 2, interes: 15 },
      { cuotas: 3, interes: 25 },
      { cuotas: 4, interes: 40 },
      { cuotas: 6, interes: 60 },
      { cuotas: 9, interes: 75 },
      { cuotas: 12, interes: 100 },
      { cuotas: 18, interes: 150 },
      { cuotas: 24, interes: 180 }
    ];

    const cuotasFiltradas = configuracionCuotas.filter(opcion => {
      if (monto < 30000) return opcion.cuotas <= 2;
      if (monto >= 30000 && monto < 80000) return opcion.cuotas <= 3;
      if (monto >= 80000 && monto < 150000) return opcion.cuotas <= 6;
      if (monto >= 150000 && monto < 250000) return opcion.cuotas <= 9;
      if (monto >= 250000 && monto < 350000) return opcion.cuotas <= 12;
      if (monto >= 350000 && monto < 500000) return opcion.cuotas <= 18;
      return true;
    });

    return cuotasFiltradas.map((opcion, index) => {
      const { cuotas, interes } = opcion;
      const montoConInteres = monto * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return (
        <p key={index}>
          {cuotas} cuotas de ${montoCuota.toLocaleString('es-AR')}
        </p>
      );
    });
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
          {filteredProductos.map((producto) => {
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10); // Evitar valores undefined
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
            const outOfStock4034 = stock4034 === 0;
            const outOfStock4320 = stock4320 === 0;
            const outOfStockBoth = outOfStock4034 && outOfStock4320;
  
            // Si el usuario es 'invitado', no cambiaremos los estilos de los productos sin stock
            const productoClass = (currentUser.role === 'invitado' || !outOfStockBoth)
              ? ''
              : 'producto-sin-stock'; // No se cambia si es invitado
  
            return (
              <li
                key={producto.id}
                className={(currentUser.role === 'invitado' || !outOfStockBoth) ? '' : 'producto-sin-stock'}
              >
                <img
                  src={producto.imagenUrl || 'https://via.placeholder.com/150'}
                  alt={producto.nombre || 'Sin nombre'}
                  className="producto-imagen"
                  loading="lazy"
                />
                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>
                  
                  {/* Precio Ficticio: Precio real + 40% */}
                  {/* <p className="fictitious-price">
                    <del> ${((producto.precio || 0) * 1.4).toLocaleString('es-AR')}</del>
                  </p> */}
                  
                  {/* Precio con tooltip de cuotas */}
                  <div className="precio-hover-container">
                    <span className="precio-texto">
                      ${((producto.precio || 0) * 1).toLocaleString('es-AR')}
                    </span>
                    <div className="detalle-cuotas">
                      {mostrarCuotas(producto.precio)}
                    </div>
                  </div>
                  
                  {/* Mostrar cuenta regresiva si el precio es temporal */}
                  {producto.isTemporal && (
                    <p className="countdown">
                      Tiempo restante: {producto.countdown ? `${producto.countdown} segundos` : 'Restaurando...'}
                    </p>
                  )}
                  
                  {/* Mostrar stock solo si el usuario no es 'invitado' */}
                  {currentUser.role !== 'invitado' && (
                    <>
                      {/* Stock para Andes 4034 */}
                      <p>
                        Los Andes 4034: {stock4034}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4034')}
                            disabled={outOfStock4034}
                            className={`boton-agregar ${outOfStock4034 ? 'boton-sin-stock' : ''}`}
                          >
                            +🛒
                          </button>
                        )}
                        {['jefe', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        )}
                      </p>
                  
                      {/* Stock para Andes 4320 */}
                      <p>
                        Los Andes 4320: {stock4320}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4320')}
                            disabled={outOfStock4320}
                            className={`boton-agregar ${outOfStock4320 ? 'boton-sin-stock' : ''}`}
                          >
                            +🛒
                          </button>
                        )}
                        {['jefe', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        )}
                      </p>
                    </>
                  )}
                  
                  {/* Acciones permitidas solo al jefe o encargado */}
                  {['jefe', 'encargado'].includes(currentUser.role) && (
                    <div className="action-buttons">
                      {/* Botón para editar */}
                      <button
                        onClick={() => handleShowFormulario(producto)}
                        className="boton-editar"
                      >
                        ✏
                      </button>
                  
                      {/* Botón para cambiar precio temporalmente */}
                      <button
                        onClick={() => handleTemporalPriceChange(producto)}
                        className="boton-precio-temporal"
                        title="Cambiar precio temporalmente"
                      >
                        ⏱
                      </button>
                  
                      {/* Botón para eliminar, permitido solo al jefe */}
                      {currentUser.role === 'jefe' && (
                        <button
                          onClick={() => handleDeleteProduct(producto.id)}
                          className="boton-borrar"
                        >
                          🗑
                        </button>
                      )}
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
            <span className="close" onClick={handleCloseFormulario}>
              &times;
            </span>
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
                name="categoriaId"
                value={currentProduct.categoriaId || ''}
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseFormulario}
              >
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
