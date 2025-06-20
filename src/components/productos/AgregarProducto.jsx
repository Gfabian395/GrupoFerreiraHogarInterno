import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AgregarProducto.css';

const AgregarProducto = ({ currentUser, onProductoAgregado }) => {
  const { categoriaId } = useParams(); // Categoria tomada de la URL
  const [producto, setProducto] = useState({
    nombre: '',
    precio: '',
    cantidadDisponibleAndes4034: '',
    cantidadDisponibleAndes4320: '',
    descripcion: ''
  });
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState(null);

  const handleAddProducto = async (e) => {
    e.preventDefault();

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
      // Subir imagen a Storage
      const storageRef = ref(storage, `productos/${archivoImagen.name}`);
      await uploadBytes(storageRef, archivoImagen);
      const urlImagen = await getDownloadURL(storageRef);

      // Agregar documento a Firestore en la categoría correspondiente
      const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
      await addDoc(productosCollection, {
        ...producto,
        precio: Number(producto.precio),
        cantidadDisponibleAndes4034: Number(producto.cantidadDisponibleAndes4034),
        cantidadDisponibleAndes4320: Number(producto.cantidadDisponibleAndes4320),
        imagenUrl: urlImagen
      });

      // Limpiar formulario y estados
      setProducto({
        nombre: '',
        precio: '',
        cantidadDisponibleAndes4034: '',
        cantidadDisponibleAndes4320: '',
        descripcion: ''
      });
      setArchivoImagen(null);
      setAlerta('Producto agregado con éxito');
      setTimeout(() => setAlerta(''), 3000);
      setMostrarFormulario(false);

      if (onProductoAgregado) onProductoAgregado();
    } catch (error) {
      console.error("Error al agregar producto: ", error);
      setAlerta('Hubo un problema al agregar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  // Solo mostrar para roles autorizados
  if (!['jefe', 'encargado'].includes(currentUser.role)) return null;

  return (
    <div className="agregar-producto">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Agregar Producto</h2>
            {alerta && <div className="alert alert-success">{alerta}</div>}
            <form onSubmit={handleAddProducto}>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del Producto"
                value={producto.nombre}
                onChange={e => setProducto({ ...producto, nombre: e.target.value })}
                required
              />
              <input
                type="number"
                className="form-control"
                placeholder="Precio"
                value={producto.precio}
                onChange={e => setProducto({ ...producto, precio: e.target.value })}
                required
              />
              <input
                type="number"
                className="form-control"
                placeholder="Cantidad Disponible en Andes 4034"
                value={producto.cantidadDisponibleAndes4034}
                onChange={e => setProducto({ ...producto, cantidadDisponibleAndes4034: e.target.value })}
                required
              />
              <input
                type="number"
                className="form-control"
                placeholder="Cantidad Disponible en Andes 4320"
                value={producto.cantidadDisponibleAndes4320}
                onChange={e => setProducto({ ...producto, cantidadDisponibleAndes4320: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={e => setArchivoImagen(e.target.files[0])}
                required
              />
              <textarea
                className="form-control"
                placeholder="Descripción"
                value={producto.descripcion}
                onChange={e => setProducto({ ...producto, descripcion: e.target.value })}
              />
              <button type="submit" className="btn btn-primary">Agregar Producto</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
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
