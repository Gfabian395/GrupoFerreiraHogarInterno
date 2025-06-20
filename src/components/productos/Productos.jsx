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
<<<<<<< HEAD

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
=======
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // Nuevo estado para forzar refresh
  const [refreshFlag, setRefreshFlag] = useState(false);

  const handleImagenClick = (url) => {
    setImagenAmpliada(url);
  };

  const cerrarImagenAmpliada = () => {
    setImagenAmpliada(null);
  };


  // Función reutilizable para traer productos
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

  // useEffect que escucha categoriaId y refreshFlag para recargar productos
  useEffect(() => {
    if (categoriaId) fetchProductos();
  }, [categoriaId, refreshFlag]);

  // Trae categorias solo al montar
  useEffect(() => {
    fetchCategorias();
  }, []);

  // Función para forzar refrescar la lista desde fuera (la podés pasar como prop)
  const triggerRefresh = () => {
    setRefreshFlag(flag => !flag);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProduct = async (productoId) => {
    if (!['jefe', 'encargado'].includes(currentUser.role)) {
>>>>>>> 80de3ac (version mejorada de la original)
      setAlerta('No tienes permiso para editar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }
<<<<<<< HEAD

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await updateDoc(productoRef, { ...currentProduct });
      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id === productoId ? currentProduct : prod
=======
    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await updateDoc(productoRef, { ...currentProduct });

      // Actualizo localmente el producto modificado para mini refresh
      setProductos(prev =>
        prev.map(prod =>
          prod.id === productoId ? { ...currentProduct, id: productoId, categoriaId } : prod
>>>>>>> 80de3ac (version mejorada de la original)
        )
      );
      setMostrarFormulario(false);
      setAlerta('Producto actualizado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
<<<<<<< HEAD
    }
  };

  // Mostrar formulario de edición
=======
      setAlerta('Error al actualizar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

>>>>>>> 80de3ac (version mejorada de la original)
  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
  };

<<<<<<< HEAD
  // Filtrar productos por búsqueda
=======
>>>>>>> 80de3ac (version mejorada de la original)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

<<<<<<< HEAD
  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Eliminar producto
=======
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

>>>>>>> 80de3ac (version mejorada de la original)
  const handleDeleteProduct = async (productoId) => {
    if (currentUser.role !== 'jefe') {
      setAlerta('No tienes permiso para eliminar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

<<<<<<< HEAD
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
=======
    const password = prompt('Ingrese la contraseña para eliminar este producto:');
    if (password !== '031285') {
      setAlerta('Contraseña incorrecta. No se eliminó el producto.');
>>>>>>> 80de3ac (version mejorada de la original)
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
<<<<<<< HEAD
      const producto = productos.find((p) => p.id === productoId);
=======
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


  const handleIncrementStock = async (productoId, campo) => {
    if (!['jefe', 'encargado'].includes(currentUser.role)) {
      setAlerta('No tienes permiso para actualizar el stock.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }
    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find(p => p.id === productoId);
>>>>>>> 80de3ac (version mejorada de la original)

      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;
        await updateDoc(productoRef, { [campo]: newCantidad });
<<<<<<< HEAD
        setProductos(
          productos.map((p) =>
=======
        setProductos(prev =>
          prev.map(p =>
>>>>>>> 80de3ac (version mejorada de la original)
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

<<<<<<< HEAD
  // Añadir al carrito
  const handleAddToCart = (producto, sucursal) => {
    const productoEnCarrito = { ...producto, sucursal };
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);

    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart(productoEnCarrito);
=======
  const handleAddToCart = (producto, sucursal) => {
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);
    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart({ ...producto, sucursal });
>>>>>>> 80de3ac (version mejorada de la original)
      alert('Producto añadido al carrito con éxito');
    } else {
      alert('No hay suficiente stock para añadir este producto al carrito');
    }
  };

  const handleTemporalPriceChange = async (producto) => {
<<<<<<< HEAD
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
=======
    const originalPrice = producto.precio;
    const nuevoPrecio = prompt("Introduce el nuevo precio temporal:", producto.precio);
    const temporalTime = 120; // 2 minutos
    const expirationTime = Date.now() + temporalTime * 1000;

    if (nuevoPrecio && !isNaN(nuevoPrecio)) {
      try {
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, producto.id);
        await updateDoc(productoRef, { precio: parseFloat(nuevoPrecio) });

>>>>>>> 80de3ac (version mejorada de la original)
        localStorage.setItem(
          `producto-${producto.id}`,
          JSON.stringify({ expirationTime, originalPrice })
        );

<<<<<<< HEAD
        // Actualizar el estado local
        setProductos((prevProductos) =>
          prevProductos.map((p) =>
=======
        setProductos(prev =>
          prev.map(p =>
>>>>>>> 80de3ac (version mejorada de la original)
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

<<<<<<< HEAD
  // Restaurar precios y sincronizar la cuenta regresiva tras recargar
  useEffect(() => {
    const syncCountdowns = () => {
      const now = Date.now();
      setProductos((prevProductos) =>
        prevProductos.map((producto) => {
=======
  useEffect(() => {
    const syncCountdowns = () => {
      const now = Date.now();
      setProductos(prevProductos => {
        let changed = false;
        const nuevosProductos = prevProductos.map(producto => {
>>>>>>> 80de3ac (version mejorada de la original)
          const temporalData = localStorage.getItem(`producto-${producto.id}`);
          if (temporalData) {
            const { expirationTime, originalPrice } = JSON.parse(temporalData);
            const remainingTime = Math.floor((expirationTime - now) / 1000);
<<<<<<< HEAD

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
=======
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
>>>>>>> 80de3ac (version mejorada de la original)

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

<<<<<<< HEAD
    return cuotasFiltradas.map((opcion, index) => {
      const { cuotas, interes } = opcion;
=======
    return cuotasFiltradas.map(({ cuotas, interes }, index) => {
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
=======

      {/* Modal de imagen ampliada */}
      {imagenAmpliada && (
        <div className="modal-imagen" onClick={cerrarImagenAmpliada}>
          <img src={imagenAmpliada} alt="Producto ampliado" />
          <span className="cerrar-modal">&times;</span>
        </div>
      )}

>>>>>>> 80de3ac (version mejorada de la original)
      <div className="productos">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
<<<<<<< HEAD
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
=======
        />
        <ul>
          {filteredProductos.map(producto => {
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10);
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
            const outOfStockBoth = stock4034 === 0 && stock4320 === 0;
            const productoClass = (currentUser.role === 'invitado' || !outOfStockBoth) ? '' : 'producto-sin-stock';

            return (
              <li key={producto.id} className={productoClass}>
>>>>>>> 80de3ac (version mejorada de la original)
                <img
                  src={producto.imagenUrl || 'https://via.placeholder.com/150'}
                  alt={producto.nombre || 'Sin nombre'}
                  className="producto-imagen"
                  loading="lazy"
<<<<<<< HEAD
                />
                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>
                  
                  {/* Precio Ficticio: Precio real + 40% */}
                  {/* <p className="fictitious-price">
                    <del> ${((producto.precio || 0) * 1.4).toLocaleString('es-AR')}</del>
                  </p> */}
                  
                  {/* Precio con tooltip de cuotas */}
=======
                  onClick={() => handleImagenClick(producto.imagenUrl)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>
>>>>>>> 80de3ac (version mejorada de la original)
                  <div className="precio-hover-container">
                    <span className="precio-texto">
                      ${((producto.precio || 0) * 1).toLocaleString('es-AR')}
                    </span>
<<<<<<< HEAD
                    <div className="detalle-cuotas">
                      {mostrarCuotas(producto.precio)}
                    </div>
                  </div>
                  
                  {/* Mostrar cuenta regresiva si el precio es temporal */}
=======
                    <div className="detalle-cuotas">{mostrarCuotas(producto.precio)}</div>
                  </div>
>>>>>>> 80de3ac (version mejorada de la original)
                  {producto.isTemporal && (
                    <p className="countdown">
                      Tiempo restante: {producto.countdown ? `${producto.countdown} segundos` : 'Restaurando...'}
                    </p>
                  )}
<<<<<<< HEAD
                  
                  {/* Mostrar stock solo si el usuario no es 'invitado' */}
                  {currentUser.role !== 'invitado' && (
                    <>
                      {/* Stock para Andes 4034 */}
=======
                  {currentUser.role !== 'invitado' && (
                    <>
>>>>>>> 80de3ac (version mejorada de la original)
                      <p>
                        Los Andes 4034: {stock4034}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4034')}
<<<<<<< HEAD
                            disabled={outOfStock4034}
                            className={`boton-agregar ${outOfStock4034 ? 'boton-sin-stock' : ''}`}
=======
                            disabled={stock4034 === 0}
                            className={`boton-agregar ${stock4034 === 0 ? 'boton-sin-stock' : ''}`}
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
                  
                      {/* Stock para Andes 4320 */}
=======
>>>>>>> 80de3ac (version mejorada de la original)
                      <p>
                        Los Andes 4320: {stock4320}
                        {['jefe', 'vendedor', 'encargado'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleAddToCart(producto, 'Andes4320')}
<<<<<<< HEAD
                            disabled={outOfStock4320}
                            className={`boton-agregar ${outOfStock4320 ? 'boton-sin-stock' : ''}`}
=======
                            disabled={stock4320 === 0}
                            className={`boton-agregar ${stock4320 === 0 ? 'boton-sin-stock' : ''}`}
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
                  
                  {/* Acciones permitidas solo al jefe o encargado */}
                  {['jefe', 'encargado'].includes(currentUser.role) && (
                    <div className="action-buttons">
                      {/* Botón para editar */}
                      <button
                        onClick={() => handleShowFormulario(producto)}
                        className="boton-editar"
                      >
                        ✏️
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
                          🗑️
                        </button>
=======
                  {['jefe', 'encargado'].includes(currentUser.role) && (
                    <div className="action-buttons">
                      <button onClick={() => handleShowFormulario(producto)} className="boton-editar">✏️</button>
                      <button onClick={() => handleTemporalPriceChange(producto)} className="boton-precio-temporal" title="Cambiar precio temporalmente">⏱</button>
                      {currentUser.role === 'jefe' && (
                        <button onClick={() => handleDeleteProduct(producto.id)} className="boton-borrar">🗑️</button>
>>>>>>> 80de3ac (version mejorada de la original)
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
<<<<<<< HEAD
  
=======

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
            <span className="close" onClick={handleCloseFormulario}>
              &times;
            </span>
            <h2>Editar Producto</h2>
  
            {/* Nombre */}
=======
            <span className="close" onClick={handleCloseFormulario}>&times;</span>
            <h2>Editar Producto</h2>

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
  
            {/* Precio */}
=======

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
  
            {/* Stock Andes 4034 */}
=======

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
  
            {/* Stock Andes 4320 */}
=======

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
  
            {/* URL de la Imagen */}
=======

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
  
            {/* Categoría */}
=======

>>>>>>> 80de3ac (version mejorada de la original)
            <div className="form-group">
              <select
                className="form-control"
                name="categoriaId"
                value={currentProduct.categoriaId || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Selecciona una Categoría --</option>
<<<<<<< HEAD
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
=======
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group-buttons">
              <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              <button type="button" className="btn btn-secondary" onClick={handleCloseFormulario}>Cancelar</button>
>>>>>>> 80de3ac (version mejorada de la original)
            </div>
          </form>
        </div>
      )}
    </>
  );
<<<<<<< HEAD
}
=======
};
>>>>>>> 80de3ac (version mejorada de la original)

export default Productos;
