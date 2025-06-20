import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import './AgregarProducto.css';

const AgregarProducto = ({ currentUser }) => {
=======
import { useParams } from 'react-router-dom';  // Importa useParams si quieres leer categoría de la URL
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AgregarProducto.css';

const AgregarProducto = ({ currentUser, onProductoAgregado }) => {
  const { categoriaId } = useParams();  // Obtener categoría desde URL, si usas rutas con categoría
>>>>>>> 80de3ac (version mejorada de la original)
  const [producto, setProducto] = useState({
    nombre: '',
    precio: '',
    cantidadDisponibleAndes4034: '',
    cantidadDisponibleAndes4320: '',
    imagenUrl: '',
    descripcion: ''
  });
<<<<<<< HEAD
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const categoriasCollection = collection(db, 'categorias');
        const categoriasSnapshot = await getDocs(categoriasCollection);
        const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategorias(categoriasList);
      } catch (error) {
        console.error("Error al cargar categorías: ", error);
      }
    };

    fetchCategorias();
  }, []);
=======
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState(null);
>>>>>>> 80de3ac (version mejorada de la original)

  const handleAddProducto = async (e) => {
    e.preventDefault();

<<<<<<< HEAD
    if (!selectedCategoria) {
      setAlerta('Por favor, selecciona una categoría.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productosCollection = collection(db, `categorias/${selectedCategoria}/productos`);
      await addDoc(productosCollection, producto);
=======
    if (!categoriaId) {
      setAlerta('Categoría no especificada.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }
    if (!archivoImagen) {
      setAlerta('Por favor, selecciona una imagen.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }
    try {
      const storageRef = ref(storage, `productos/${archivoImagen.name}`);
      await uploadBytes(storageRef, archivoImagen);
      const urlImagen = await getDownloadURL(storageRef);

      const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
      await addDoc(productosCollection, {
        ...producto,
        precio: Number(producto.precio),
        cantidadDisponibleAndes4034: Number(producto.cantidadDisponibleAndes4034),
        cantidadDisponibleAndes4320: Number(producto.cantidadDisponibleAndes4320),
        imagenUrl: urlImagen
      });

>>>>>>> 80de3ac (version mejorada de la original)
      setProducto({
        nombre: '',
        precio: '',
        cantidadDisponibleAndes4034: '',
        cantidadDisponibleAndes4320: '',
        imagenUrl: '',
        descripcion: ''
      });
<<<<<<< HEAD
      setAlerta('Producto agregado con éxito');
      setTimeout(() => setAlerta(''), 3000);
      setMostrarFormulario(false); // Cerrar el formulario al terminar
=======
      setArchivoImagen(null);
      setAlerta('Producto agregado con éxito');
      setTimeout(() => setAlerta(''), 3000);
      setMostrarFormulario(false);

      if (onProductoAgregado) onProductoAgregado();
>>>>>>> 80de3ac (version mejorada de la original)
    } catch (error) {
      console.error("Error al agregar producto: ", error);
      setAlerta('Hubo un problema al agregar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

<<<<<<< HEAD
  // Validar roles para mostrar el formulario
  if (!['jefe', 'encargado'].includes(currentUser.role)) {
    return null; // Oculta el componente para roles no autorizados
  }
=======
  if (!['jefe', 'encargado'].includes(currentUser.role)) return null;
>>>>>>> 80de3ac (version mejorada de la original)

  return (
    <div className="agregar-producto">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Agregar Producto</h2>
            {alerta && <div className="alert alert-success">{alerta}</div>}
            <form onSubmit={handleAddProducto}>
<<<<<<< HEAD
              {/* Selección de Categoría */}
              <div className="form-group">
                <label htmlFor="categoriaSelect">Seleccionar Categoría</label>
                <select
                  id="categoriaSelect"
                  className="form-control"
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona una Categoría --</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Datos del Producto */}
=======
              {/* Ya no hay selector de categoría */}

>>>>>>> 80de3ac (version mejorada de la original)
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del Producto"
                  value={producto.nombre}
<<<<<<< HEAD
                  onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
=======
                  onChange={e => setProducto({ ...producto, nombre: e.target.value })}
>>>>>>> 80de3ac (version mejorada de la original)
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Precio"
                  value={producto.precio}
<<<<<<< HEAD
                  onChange={(e) => setProducto({ ...producto, precio: e.target.value })}
=======
                  onChange={e => setProducto({ ...producto, precio: e.target.value })}
>>>>>>> 80de3ac (version mejorada de la original)
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad Disponible en Andes 4034"
                  value={producto.cantidadDisponibleAndes4034}
<<<<<<< HEAD
                  onChange={(e) => setProducto({ ...producto, cantidadDisponibleAndes4034: e.target.value })}
=======
                  onChange={e => setProducto({ ...producto, cantidadDisponibleAndes4034: e.target.value })}
>>>>>>> 80de3ac (version mejorada de la original)
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad Disponible en Andes 4320"
                  value={producto.cantidadDisponibleAndes4320}
<<<<<<< HEAD
                  onChange={(e) => setProducto({ ...producto, cantidadDisponibleAndes4320: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="url"
                  className="form-control"
                  placeholder="URL de la Imagen"
                  value={producto.imagenUrl}
                  onChange={(e) => setProducto({ ...producto, imagenUrl: e.target.value })}
                  required
                />
              </div>
=======
                  onChange={e => setProducto({ ...producto, cantidadDisponibleAndes4320: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={e => setArchivoImagen(e.target.files[0])}
                  required
                />
              </div>

>>>>>>> 80de3ac (version mejorada de la original)
              <div className="form-group">
                <textarea
                  className="form-control"
                  placeholder="Descripción"
                  value={producto.descripcion}
<<<<<<< HEAD
                  onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                />
              </div>

              {/* Botones del Formulario */}
=======
                  onChange={e => setProducto({ ...producto, descripcion: e.target.value })}
                />
              </div>

>>>>>>> 80de3ac (version mejorada de la original)
              <button type="submit" className="btn btn-primary">Agregar Producto</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Botón flotante */}
=======
>>>>>>> 80de3ac (version mejorada de la original)
      <button
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className="btn-float"
        title="Agregar Producto"
      >
        +
      </button>
    </div>
  );
};

export default AgregarProducto;
