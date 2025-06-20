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
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false); // para refrescar

  const formRef = useRef(null);

  // Funciones para obtener datos
  const fetchProductos = async () => {
    setLoading(true);
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

  // useEffect para productos (depende de categoriaId y refreshFlag)
  useEffect(() => {
    if (categoriaId) fetchProductos();
  }, [categoriaId, refreshFlag]);

  // useEffect para categorias (solo al montar)
  useEffect(() => {
    fetchCategorias();
  }, []);
  // Actualiza los campos del producto en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  // Actualizar producto (solo roles jefe o encargado)
  const handleUpdateProduct = async (productoId) => {
    if (!['jefe', 'encargado'].includes(currentUser.role)) {
      setAlerta('No tienes permiso para editar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await updateDoc(productoRef, { ...currentProduct });

      setProductos(prev =>
        prev.map(prod =>
          prod.id === productoId ? { ...currentProduct, id: productoId, categoriaId } : prod
        )
      );

      setMostrarFormulario(false);
      setAlerta('Producto actualizado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      setAlerta('Error al actualizar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Mostrar formulario para editar producto
  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Eliminar producto con permiso solo a jefe y validación con contraseña
  const handleDeleteProduct = async (productoId) => {
    if (currentUser.role !== 'jefe') {
      setAlerta('No tienes permiso para eliminar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    const password = prompt('Ingrese la contraseña para eliminar este producto:');
    if (password !== '031285') {
      setAlerta('Contraseña incorrecta. No se eliminó el producto.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await deleteDoc(productoRef);
      setProductos(prev => prev.filter(p => p.id !== productoId));
      setAlerta('Producto eliminado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error('Error al eliminar el producto: ', error);
      setAlerta('Error al eliminar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Incrementar stock solo para roles jefe o encargado
  const handleIncrementStock = async (productoId, campo) => {
    if (!['jefe', 'encargado'].includes(currentUser.role)) {
      setAlerta('No tienes permiso para actualizar el stock.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find(p => p.id === productoId);

      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;
        await updateDoc(productoRef, { [campo]: newCantidad });
        setProductos(prev =>
          prev.map(p => (p.id === productoId ? { ...p, [campo]: newCantidad } : p))
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
  // Añadir producto al carrito si hay stock en sucursal
  const handleAddToCart = (producto, sucursal) => {
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);
    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart({ ...producto, sucursal });
      alert('Producto añadido al carrito con éxito');
    } else {
      alert('No hay suficiente stock para añadir este producto al carrito');
    }
  };

  // Cambiar precio temporalmente con cuenta regresiva
  const handleTemporalPriceChange = async (producto) => {
    const originalPrice = producto.precio;
    const nuevoPrecio = prompt("Introduce el nuevo precio temporal:", producto.precio);
    const temporalTime = 120; // 2 minutos
    const expirationTime = Date.now() + temporalTime * 1000;

    if (nuevoPrecio && !isNaN(nuevoPrecio)) {
      try {
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
        await updateDoc(productoRef, { precio: parseFloat(nuevoPrecio) });
        localStorage.setItem(
          `producto-${producto.id}`,
          JSON.stringify({ expirationTime, originalPrice })
        );
        setProductos(prev =>
          prev.map(p =>
            p.id === producto.id ? { ...p, precio: parseFloat(nuevoPrecio), isTemporal: true, countdown: temporalTime } : p
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

  // Mostrar cuotas según monto
  const mostrarCuotas = (monto) => {
    if (isNaN(monto) || monto <= 0) return <p>Por favor, ingrese un monto válido.</p>;

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
      if (monto < 80000) return opcion.cuotas <= 3;
      if (monto < 150000) return opcion.cuotas <= 6;
      if (monto < 250000) return opcion.cuotas <= 9;
      if (monto < 350000) return opcion.cuotas <= 12;
      if (monto < 500000) return opcion.cuotas <= 18;
      return true;
    });

    return cuotasFiltradas.map(({ cuotas, interes }, index) => {
      const montoConInteres = monto * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return <p key={index}>{cuotas} cuotas de ${montoCuota.toLocaleString('es-AR')}</p>;
    });
  };

  // Restaurar precios temporales tras recarga, con sincronización
  useEffect(() => {
    const syncCountdowns = () => {
      const now = Date.now();
      setProductos(prevProductos => {
        let changed = false;
        const nuevosProductos = prevProductos.map(producto => {
          const temporalData = localStorage.getItem(`producto-${producto.id}`);
          if (temporalData) {
            const { expirationTime, originalPrice } = JSON.parse(temporalData);
            const remainingTime = Math.floor((expirationTime - now) / 1000);
            if (remainingTime <= 0) {
              localStorage.removeItem(`producto-${producto.id}`);
              const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
              updateDoc(productoRef, { precio: originalPrice }).catch(console.error);
              changed = true;
              return { ...producto, precio: originalPrice, isTemporal: false, countdown: 0 };
            } else if (producto.countdown !== remainingTime || !producto.isTemporal) {
              changed = true;
              return { ...producto, countdown: remainingTime, isTemporal: true };
            }
          }
          return producto;
        });
        return changed ? nuevosProductos : prevProductos;
      });
    };

    const interval = setInterval(syncCountdowns, 1000);
    return () => clearInterval(interval);
  }, [categoriaId]);

  // Mostrar imagen ampliada (modal)
  const handleImagenClick = (url) => setImagenAmpliada(url);
  const cerrarImagenAmpliada = () => setImagenAmpliada(null);

  if (loading) return <Load />;

  return (
    <>
      {alerta && <div className="alert alert-success">{alerta}</div>}

      {imagenAmpliada && (
        <div className="modal-imagen" onClick={cerrarImagenAmpliada}>
          <img src={imagenAmpliada} alt="Producto ampliado" />
          <span className="cerrar-modal">&times;</span>
        </div>
      )}

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
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10);
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
            const outOfStockBoth = stock4034 === 0 && stock4320 === 0;
            const productoClass = (currentUser.role === 'invitado' || !outOfStockBoth) ? '' : 'producto-sin-stock';

            return (
              <li key={producto.id} className={productoClass}>
                <img
                  src={producto.imagenUrl || 'https://via.placeholder.com/150'}
                  alt={producto.nombre || 'Sin nombre'}
                  className="producto-imagen"
                  loading="lazy"
                  onClick={() => handleImagenClick(producto.imagenUrl)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>
                  <div className="precio-hover-container">
                    <span className="precio-texto">${(producto.precio || 0).toLocaleString('es-AR')}</span>
                    <div className="detalle-cuotas">{mostrarCuotas(producto.precio)}</div>
                  </div>

                  {producto.isTemporal && (
                    <p className="countdown">
                      Tiempo restante: {producto.countdown ? `${producto.countdown} segundos` : 'Restaurando...'}
                    </p>
                  )}

                  {currentUser.role !== 'invitado' && (
                    <>
                      <p>
                        Los Andes 4034: {stock4034}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4034')}
                            disabled={stock4034 === 0}
                            className={`boton-agregar ${stock4034 === 0 ? 'boton-sin-stock' : ''}`}
                          >
                            +🛒
                          </button>
                        )}
                        {['jefe', 'encargado'].includes(currentUser.role) && (
                          <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')} className="boton-incrementar">
                            +
                          </button>
                        )}
                      </p>

                      <p>
                        Los Andes 4320: {stock4320}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4320')}
                            disabled={stock4320 === 0}
                            className={`boton-agregar ${stock4320 === 0 ? 'boton-sin-stock' : ''}`}
                          >
                            +🛒
                          </button>
                        )}
                        {['jefe', 'encargado'].includes(currentUser.role) && (
                          <button onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')} className="boton-incrementar">
                            +
                          </button>
                        )}
                      </p>
                    </>
                  )}

                  {['jefe', 'encargado'].includes(currentUser.role) && (
                    <div className="action-buttons">
                      <button onClick={() => handleShowFormulario(producto)} className="boton-editar">✏️</button>
                      <button onClick={() => handleTemporalPriceChange(producto)} className="boton-precio-temporal" title="Cambiar precio temporalmente">⏱</button>
                      {currentUser.role === 'jefe' && (
                        <button onClick={() => handleDeleteProduct(producto.id)} className="boton-borrar">🗑️</button>
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
            <span className="close" onClick={handleCloseFormulario}>&times;</span>
            <h2>Editar Producto</h2>

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

            <div className="form-group">
              <select
                className="form-control"
                name="categoriaId"
                value={currentProduct.categoriaId || ''}
                onChange={handleInputChange}
                required
              >
                {categorias && categorias.length > 0 ? (
                  categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))
                ) : (
                  <option value="">No hay categorías</option>
                )}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar cambios
            </button>
          </form>
        </div>
      )}
    </>
  );
}
export default Productos;