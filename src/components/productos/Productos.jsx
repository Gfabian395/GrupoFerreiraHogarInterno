import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig'; // storage agregado
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Load from '../load/Load';
import './Productos.css';

const Productos = ({ onAddToCart, currentUser }) => {
  const { categoriaId } = useParams();
  const location = useLocation();
  const { resaltadoId } = location.state || {};

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const formRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);

  // Estado para resaltar producto y refs para hacer scroll
  const [highlightId, setHighlightId] = useState(null);
  const refsProductos = useRef({});

  const handleOpenImage = (url) => {
    setImagenModal(url);
  };

  const handleCloseImage = () => {
    setImagenModal(null);
  };

  // Roles
  const roles = Array.isArray(currentUser.role)
    ? currentUser.role
    : [currentUser.role];

  // Config cuotas e intereses
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

  const calcularCuotasHover = (precio) => {
    if (isNaN(precio) || precio <= 0) return [];

    const cuotasFiltradas = configuracionCuotas.filter((opcion) => {
      if (precio < 30000) return opcion.cuotas <= 2;
      if (precio >= 30000 && precio < 80000) return opcion.cuotas <= 3;
      if (precio >= 80000 && precio < 150000) return opcion.cuotas <= 6;
      if (precio >= 150000 && precio < 250000) return opcion.cuotas <= 9;
      if (precio >= 250000 && precio < 350000) return opcion.cuotas <= 12;
      if (precio >= 350000 && precio < 500000) return opcion.cuotas <= 18;
      return true;
    });

    return cuotasFiltradas.map(({ cuotas, interes }) => {
      const montoConInteres = precio * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return { cuotas, montoCuota: montoCuota.toLocaleString('es-AR') };
    });
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productosCollection = collection(
          db,
          `categorias/${categoriaId}/productos`
        );
        const productosSnapshot = await getDocs(productosCollection);
        const productosList = productosSnapshot.docs.map((doc) => ({
          id: doc.id,
          categoriaId,
          ...doc.data(),
        }));
        productosList.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setProductos(productosList);
      } catch (error) {
        console.error('Error fetching productos: ', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategorias = async () => {
      try {
        const categoriasCollection = collection(db, 'categorias');
        const categoriasSnapshot = await getDocs(categoriasCollection);
        const categoriasList = categoriasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategorias(categoriasList);
      } catch (error) {
        console.error('Error fetching categorias: ', error);
      }
    };

    if (categoriaId) fetchProductos();
    fetchCategorias();
  }, [categoriaId]);

  // EFECTO PARA SCROLL Y RESALTAR PRODUCTO SI VIENE resaltadoId
  useEffect(() => {
    if (resaltadoId && refsProductos.current[resaltadoId]) {
      refsProductos.current[resaltadoId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(resaltadoId);

      // Quitar el highlight luego de 3 segundos
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [resaltadoId, productos]); // productos para asegurar que se haya cargado el listado

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  // Actualizar producto
  const handleUpdateProduct = async (productoId, updatedFields = null) => {
    if (
      !roles.includes('jefe') &&
      !roles.includes('encargado') &&
      !roles.includes('fotografo')
    ) {
      setAlerta('No tienes permiso para editar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const dataToUpdate = updatedFields ? updatedFields : currentProduct;
      await updateDoc(productoRef, { ...dataToUpdate });

      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id === productoId ? { ...prod, ...dataToUpdate } : prod
        )
      );

      setMostrarFormulario(false);
      setAlerta('Producto actualizado con éxito');
      setTimeout(() => setAlerta(''), 3000);

      setUploadedImageUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      setAlerta('Error al actualizar el producto');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
    setUploadedImageUrl(null);
    setSelectedFile(null);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
    setUploadedImageUrl(null);
    setSelectedFile(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmarYEliminar = async (productoId) => {
    if (!roles.includes('jefe')) {
      setAlerta('No tienes permiso para eliminar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    const clave = prompt('Para eliminar este producto, ingresá la contraseña de seguridad:');
    if (clave !== '031285') {
      if (clave !== null) {
        setAlerta('Contraseña incorrecta. Operación cancelada.');
        setTimeout(() => setAlerta(''), 3000);
      }
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
      setAlerta('Error al eliminar el producto');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleIncrementStock = async (productoId, campo) => {
    if (!roles.includes('jefe') && !roles.includes('encargado')) {
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
        console.error(
          'Error: El campo especificado no es un número válido o no existe.'
        );
      }
    } catch (error) {
      console.error('Error al actualizar el stock: ', error);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
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
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10);
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
            const outOfStock4034 = stock4034 === 0;
            const outOfStock4320 = stock4320 === 0;
            const outOfStockBoth = outOfStock4034 && outOfStock4320;

            const productoClass =
              (roles.includes('invitado') || !outOfStockBoth) ? '' : 'producto-sin-stock';

            return (
              <li
                key={producto.id}
                ref={(el) => (refsProductos.current[producto.id] = el)}
                className={`card-producto ${productoClass} categoria-${producto.categoriaId}`}
                style={{
                  border: highlightId === producto.id ? '3px solid #f39c12' : undefined,
                  boxShadow: highlightId === producto.id ? '0 0 15px #f39c12' : undefined,
                  backgroundColor: highlightId === producto.id ? '#fff8e1' : undefined,
                  transition: 'box-shadow 0.5s ease, border 0.5s ease, background-color 0.5s ease'
                }}
              >
                {outOfStockBoth && <span className="badge-stock">SIN STOCK</span>}

                <img
                  src={producto.imagenUrl || 'https://via.placeholder.com/150'}
                  alt={producto.nombre || 'Sin nombre'}
                  className="producto-imagen"
                  loading="lazy"
                  onClick={() => handleOpenImage(producto.imagenUrl)}
                  style={{ cursor: 'zoom-in' }}
                />

                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>

                  <span className="precio-texto">
                    ${((producto.precio || 0) * 1).toLocaleString('es-AR')}
                  </span>

                  <div className="detalle-cuotas">
                    {calcularCuotasHover(producto.precio || 0).map((c, idx) => (
                      <p key={idx}>En {c.cuotas} cuotas de ${c.montoCuota}</p>
                    ))}
                  </div>

                  {['jefe', 'vendedor', 'encargado', 'fotografo'].some((r) => roles.includes(r)) && (
                    <>
                      <p>
                        Andes 4034: {stock4034}
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4034')}
                          disabled={outOfStock4034}
                          className="boton-agregar"
                        >
                          +🛒
                        </button>
                        {roles.includes('jefe') || roles.includes('encargado') ? (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        ) : null}
                      </p>

                      <p>
                        Andes 4320: {stock4320}
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4320')}
                          disabled={outOfStock4320}
                          className="boton-agregar"
                        >
                          +🛒
                        </button>
                        {roles.includes('jefe') || roles.includes('encargado') ? (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        ) : null}
                      </p>
                    </>
                  )}
                </div>

                {(roles.includes('jefe') || roles.includes('encargado') || roles.includes('fotografo')) && (
                  <>
                    <button className="boton-editar" onClick={() => handleShowFormulario(producto)}>✏️</button>
                    {roles.includes('jefe') && (
                      <button
                        className="boton-borrar"
                        onClick={() => confirmarYEliminar(producto.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </>
                )}
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
            onSubmit={async (e) => {
              e.preventDefault();

              let imagenUrlFinal = currentProduct.imagenUrl;

              if (selectedFile) {
                try {
                  setAlerta('Subiendo imagen...');
                  const imageRef = ref(storage, `productos/${Date.now()}_${selectedFile.name}`);
                  await uploadBytes(imageRef, selectedFile);
                  imagenUrlFinal = await getDownloadURL(imageRef);
                } catch (error) {
                  console.error('Error subiendo imagen:', error);
                  setAlerta('Error al subir la imagen');
                  return;
                }
              }

              const dataToUpdate = {
                ...currentProduct,
                imagenUrl: imagenUrlFinal,
              };

              await handleUpdateProduct(currentProduct.id, dataToUpdate);
            }}
          >
            <span className="close" onClick={handleCloseFormulario}>
              ❌
            </span>
            <h2>Editar Producto</h2>

            <div className="form-group">
              <label htmlFor="imagenFile">Subir imagen</label>
              <input
                type="file"
                id="imagenFile"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="preview-imagen-wrapper">
                {uploadedImageUrl ? (
                  <img src={uploadedImageUrl} alt="Preview" className="preview-imagen" />
                ) : currentProduct.imagenUrl ? (
                  <img src={currentProduct.imagenUrl} alt="Imagen actual" className="preview-imagen" />
                ) : null}
              </div>
            </div>

            {!(roles.includes('fotografo') && !roles.includes('jefe') && !roles.includes('encargado')) && (
              <>
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
              </>
            )}

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

      {imagenModal && (
        <div className="modal-imagen" onClick={handleCloseImage}>
          <span className="cerrar-modal" onClick={handleCloseImage}>❌</span>
          <img src={imagenModal} alt="Imagen ampliada" className="imagen-modal-grande" />
        </div>
      )}
    </>
  );
};

export default Productos;
