import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // 👈 para extraer categoriaId de la URL
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AgregarProducto.css';

const AgregarProducto = ({ currentUser }) => {
  const { categoriaId } = useParams(); // 👈 obtenemos el ID desde la URL

  const [producto, setProducto] = useState({
    nombre: '',
    precio: '',
    cantidadDisponibleAndes4034: '',
    cantidadDisponibleAndes4320: '',
    descripcion: ''
  });

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [alerta, setAlerta] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Validar rol correctamente
  if (!Array.isArray(currentUser.role) || (!currentUser.role.includes('jefe') && !currentUser.role.includes('encargado'))) {
    return null;
  }

  const handleArchivoChange = (e) => {
    setArchivoImagen(e.target.files[0] || null);
  };

  const handleAddProducto = async (e) => {
    e.preventDefault();

    if (!categoriaId) {
      setAlerta('No se detectó la categoría.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    setLoading(true);

    try {
      let imagenUrl = 'https://placehold.co/200x200';

      if (archivoImagen) {
        const storageRef = ref(storage, `productos/${Date.now()}_${archivoImagen.name}`);
        await uploadBytes(storageRef, archivoImagen);
        imagenUrl = await getDownloadURL(storageRef);
      }

      const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
      await addDoc(productosCollection, {
        ...producto,
        imagenUrl,
      });

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

    } catch (error) {
      console.error("Error al agregar producto: ", error);
      setAlerta('Hubo un problema al agregar el producto.');
      setTimeout(() => setAlerta(''), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="agregar-producto">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Agregar Producto</h2>
            {alerta && <div className="alert alert-success">{alerta}</div>}
            <form onSubmit={handleAddProducto}>
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
                <label>Imagen (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleArchivoChange}
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

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Subiendo...' : 'Agregar Producto'}
              </button>
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
/* FUNCIONA PERFECTO, FALTA SUBIR A STORAGE */