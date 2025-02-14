import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { db } from '../../firebaseConfig';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';

const Clientes = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [newCliente, setNewCliente] = useState({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: '' });
  const [editClienteId, setEditClienteId] = useState(null);
  const [deleteClienteId, setDeleteClienteId] = useState(null);
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioEditar, setMostrarFormularioEditar] = useState(false);
  const [mostrarFormularioEliminar, setMostrarFormularioEliminar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clienteCollection = collection(db, 'clientes');
        const clienteSnapshot = await getDocs(clienteCollection);
        const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClientes(clienteList);
        setFilteredClientes(clienteList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching clientes: ", error);
      }
    };

    fetchClientes();
  }, []);

  useEffect(() => {
    const results = clientes.filter(cliente =>
      cliente.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(results);
  }, [searchTerm, clientes]);

  const handleAddCliente = () => {
    setNewCliente({
      dni: '',
      nombreCompleto: '',
      direccion: '',
      entrecalles: '',
      telefono1: '',
      telefono2: '',
      imagenUrl: ''
    });
    setMostrarFormulario(true);
    setMostrarFormularioEditar(false);
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
    const clienteDoc = doc(db, 'clientes', editClienteId);
    await setDoc(clienteDoc, {
      ...newCliente, // Mantén los otros campos como están
      dni: newCliente.dni.toString(), // Asegúrate de que el DNI se guarde como string
    });
    setEditClienteId(null);
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: '' });
    // Recargar la lista de clientes
    const clienteCollection = collection(db, 'clientes');
    const clienteSnapshot = await getDocs(clienteCollection);
    const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClientes(clienteList);
    setFilteredClientes(clienteList); // Actualiza la lista filtrada también
    setMostrarFormularioEditar(false); // Ocultar formulario después de editar
  };

  const handleDeleteCliente = async (e) => {
    e.preventDefault();
    if (password === '031285') {
      const clienteDoc = doc(db, 'clientes', deleteClienteId);
      await deleteDoc(clienteDoc);
      // Recargar la lista de clientes
      const clienteCollection = collection(db, 'clientes');
      const clienteSnapshot = await getDocs(clienteCollection);
      const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(clienteList);
      setFilteredClientes(clienteList); // Actualiza la lista filtrada también
      setMostrarFormularioEliminar(false); // Ocultar formulario después de eliminar
      setPassword(''); // Reiniciar el campo de contraseña
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni); // Usa el DNI para editar el cliente
    setNewCliente(cliente);
    setMostrarFormularioEditar(true); // Mostrar formulario de edición
  };

  const startDeleteCliente = (dni) => {
    setDeleteClienteId(dni); // Usa el DNI para eliminar el cliente
    setMostrarFormularioEliminar(true); // Mostrar formulario de eliminación
  };

  const handleClienteClick = (dni) => {
    navigate(`/clientes/${dni}/detalles`);
  };

  if (loading) {
    return <Load />;
  }

  return (
    <div className="container">
      {mostrarFormulario && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Agregar Cliente</h2>
            <form onSubmit={handleAddCliente}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="DNI"
                  value={newCliente.dni}
                  onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre Completo"
                  value={newCliente.nombreCompleto}
                  onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Dirección"
                  value={newCliente.direccion}
                  onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Entrecalles"
                  value={newCliente.entrecalles}
                  onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Teléfono 1"
                  value={newCliente.telefono1}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Teléfono 2"
                  value={newCliente.telefono2}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="url"
                  className="form-control"
                  placeholder="URL de Imagen"
                  value={newCliente.imagenUrl}
                  onChange={(e) => setNewCliente({ ...newCliente, imagenUrl: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar Cliente</button>
            </form>
            <button onClick={() => setMostrarFormulario(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}

      {mostrarFormularioEditar && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Editar Cliente</h2>
            <form onSubmit={handleUpdateCliente}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="DNI"
                  value={newCliente.dni}
                  onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre Completo"
                  value={newCliente.nombreCompleto}
                  onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Dirección"
                  value={newCliente.direccion}
                  onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Entrecalles"
                  value={newCliente.entrecalles}
                  onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Teléfono 1"
                  value={newCliente.telefono1}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Teléfono 2"
                  value={newCliente.telefono2}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="url"
                  className="form-control"
                  placeholder="URL de Imagen"
                  value={newCliente.imagenUrl}
                  onChange={(e) => setNewCliente({ ...newCliente, imagenUrl: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">Actualizar Cliente</button>
            </form>
            <button onClick={() => setMostrarFormularioEditar(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}

      {mostrarFormularioEliminar && (
        <div className="overlay">
          <div className="form-popup">
            <h2>Eliminar Cliente</h2>
            <form onSubmit={handleDeleteCliente}>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Introduce la contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger">Eliminar Cliente</button>
            </form>
            <button onClick={() => setMostrarFormularioEliminar(false)} className="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      )}

      <div className="search-box mt-4">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="card-container mt-4">
        {filteredClientes.map(cliente => (
          <div className="card" key={cliente.dni} onClick={() => handleClienteClick(cliente.dni)}>
            <img src={cliente.imagenUrl} alt={cliente.nombreCompleto} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{cliente.nombreCompleto}</h5>
              {currentUser && currentUser.role === 'jefe' && (
                <>
                  <button className="btn btn-warning" onClick={(e) => { e.stopPropagation(); startEditCliente(cliente); }}>Editar</button>
                  <button className="btn btn-danger ml-2" onClick={(e) => { e.stopPropagation(); startDeleteCliente(cliente.dni); }}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Botón flotante */}
      <button
        onClick={handleAddCliente}
        className="btn-float btn-add"
        title="Agregar Cliente"
      >
        +
      </button>
    </div>
  );
}

export default Clientes;

