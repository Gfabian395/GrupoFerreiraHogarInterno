import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import './AgregarProducto.css';

const AgregarProducto = ({ currentUser }) => {
  const [producto, setProducto] = useState({
    nombre: '',
    precio: '',
    cantidadDisponibleAndes4034: '',
    cantidadDisponibleAndes4320: '',
    imagenUrl: '',
    descripcion: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      const categoriasCollection = collection(db, 'categorias');
      const categoriasSnapshot = await getDocs(categoriasCollection);
      const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategorias(categoriasList);
    };

    fetchCategorias();
  }, []);

  const handleAddProducto = async (e) => {
    e.preventDefault();
    if (!selectedCategoria) {
      alert('Por favor, selecciona una categoría.');
      return;
    }
    const productosCollection = collection(db, `categorias/${selectedCategoria}/productos`);
    await addDoc(productosCollection, producto);
    setProducto({
      nombre: '',
      precio: '',
      cantidadDisponibleAndes4034: '',
      cantidadDisponibleAndes4320: '',
      imagenUrl: '',
      descripcion: ''
    });
    setAlerta('Producto agregado con éxito');
    setTimeout(() => {
      setAlerta('');
      window.location.reload(); // Refrescar la página
    }, 1000);
  };

  if (currentUser.role !== 'jefe') {
    return null; // Si el usuario no es "jefe", no se muestra nada
  }

  return (
    <div className="agregar-producto">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Agregar Producto</h2>
            {alerta && <div className="alert alert-success">{alerta}</div>}
            <form onSubmit={handleAddProducto}>
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
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del Producto"
                  value={producto.nombre}
                  onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Precio"
                  value={producto.precio}
                  onChange={(e) => setProducto({ ...producto, precio: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad Disponible en Andes 4034"
                  value={producto.cantidadDisponibleAndes4034}
                  onChange={(e) => setProducto({ ...producto, cantidadDisponibleAndes4034: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad Disponible en Andes 4320"
                  value={producto.cantidadDisponibleAndes4320}
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
              <div className="form-group">
                <textarea
                  className="form-control"
                  placeholder="Descripción"
                  value={producto.descripcion}
                  onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar Producto</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
      {/* Botón flotante */}
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
