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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const handleAddCliente = async (e) => {
    e.preventDefault();
    const clienteDoc = doc(db, 'clientes', newCliente.dni); // Usa el DNI como ID del documento
    await setDoc(clienteDoc, {
      ...newCliente, // Mantén los otros campos como están
      dni: newCliente.dni.toString(), // Asegúrate de que el DNI se guarde como string
    });
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: '' });
    // Recargar la lista de clientes
    const clienteCollection = collection(db, 'clientes');
    const clienteSnapshot = await getDocs(clienteCollection);
    const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClientes(clienteList);
    setFilteredClientes(clienteList); // Actualiza la lista filtrada también
  };

  const handleDeleteCliente = async (id) => {
    const clienteDoc = doc(db, 'clientes', id);
    await deleteDoc(clienteDoc);
    // Recargar la lista de clientes
    const clienteCollection = collection(db, 'clientes');
    const clienteSnapshot = await getDocs(clienteCollection);
    const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClientes(clienteList);
    setFilteredClientes(clienteList); // Actualiza la lista filtrada también
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
  };

  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni); // Usa el DNI para editar el cliente
    setNewCliente(cliente);
  };

  const handleClienteClick = (dni) => {
    navigate(`/clientes/${dni}/detalles`);
  };

  if (loading) {
    return <Load />;
  }

  return (
    <div className="container">
      <h2 className="my-4">Gestión de Clientes</h2>
      <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="btn btn-secondary mb-3">
        {mostrarFormulario ? 'Ocultar Formulario' : 'Agregar Cliente'}
      </button>
      {mostrarFormulario && (
        <form onSubmit={editClienteId ? handleUpdateCliente : handleAddCliente}>
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
          <button type="submit" className="btn btn-primary">{editClienteId ? 'Actualizar Cliente' : 'Agregar Cliente'}</button>
        </form>
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
                  <button className="btn btn-danger ml-2" onClick={(e) => { e.stopPropagation(); handleDeleteCliente(cliente.dni); }}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Clientes;
