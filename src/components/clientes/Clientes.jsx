import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { db } from '../../firebaseConfig';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';

const Clientes = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [newCliente, setNewCliente] = useState({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
  const [editClienteId, setEditClienteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const editFormRef = useRef(null);
  const deleteFormRef = useRef(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clienteCollection = collection(db, 'clientes');
        const clienteSnapshot = await getDocs(clienteCollection);
        const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clienteList.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
        setClientes(clienteList);
        setFilteredClientes(clienteList);
        setLoading(false);

        // Llama a la función para actualizar los clientes
        actualizarClientes(clienteList);
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

  const handleAddButtonClick = () => {
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' }); // Limpia los datos del formulario
    setMostrarFormulario(true);
  }

  const handleAddCliente = async (e) => {
    e.preventDefault();
    const clienteDoc = doc(db, 'clientes', newCliente.dni); // Usa el DNI como ID del documento
    await setDoc(clienteDoc, {
      ...newCliente, // Mantén los otros campos como están
      dni: newCliente.dni.toString(), // Asegúrate de que el DNI se guarde como string
      nombreCompleto: formatNombre(newCliente.nombreCompleto), // Formatea el nombre
    });
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
    alert('Cliente agregado exitosamente');
    window.location.reload(); // Refresca la página
  };

  const handleDeleteCliente = async (id) => {
    const clienteDoc = doc(db, 'clientes', id);
    await deleteDoc(clienteDoc);
    alert('Cliente eliminado exitosamente');
    window.location.reload(); // Refresca la página
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
    const clienteDoc = doc(db, 'clientes', editClienteId);
    await setDoc(clienteDoc, {
      ...newCliente, // Mantén los otros campos como están
      dni: newCliente.dni.toString(), // Asegúrate de que el DNI se guarde como string
      nombreCompleto: formatNombre(newCliente.nombreCompleto), // Formatea el nombre
    });
    setEditClienteId(null);
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
    alert('Cliente actualizado exitosamente');
    window.location.reload(); // Refresca la página
  };

  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni); // Usa el DNI para editar el cliente
    setNewCliente({
      dni: cliente.dni,
      nombreCompleto: cliente.nombreCompleto,
      direccion: cliente.direccion,
      entrecalles: cliente.entrecalles,
      telefono1: cliente.telefono1,
      telefono2: cliente.telefono2,
      imagenUrl: cliente.imagenUrl
    });
    setMostrarEditar(true);
  };

  const handleClienteClick = (dni) => {
    navigate(`/clientes/${dni}/detalles`);
  };

  const handleOutsideClick = (e) => {
    if (
      (formRef.current && !formRef.current.contains(e.target)) ||
      (editFormRef.current && !editFormRef.current.contains(e.target)) ||
      (deleteFormRef.current && !deleteFormRef.current.contains(e.target))
    ) {
      setMostrarFormulario(false);
      setMostrarEditar(false);
      setMostrarEliminar(false);
    }
  };

  useEffect(() => {
    if (mostrarFormulario || mostrarEditar || mostrarEliminar) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [mostrarFormulario, mostrarEditar, mostrarEliminar]);

  if (loading) {
    return <Load />;
  }

  const formatNombre = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  const actualizarClientes = async (clienteList) => {
    try {
      clienteList.forEach(async (cliente) => {
        const clienteDoc = doc(db, 'clientes', cliente.dni);
        await setDoc(clienteDoc, {
          ...cliente,
          nombreCompleto: formatNombre(cliente.nombreCompleto),
        });
      });

      console.log('Clientes actualizados exitosamente');
    } catch (error) {
      console.error('Error actualizando clientes: ', error);
    }
  };
  
  return (
    <div className="container">
      <button onClick={handleAddButtonClick} className="floating-btn">
        +
      </button>
      {mostrarFormulario && (
        <div className="blur-background">
          <form onSubmit={handleAddCliente} className="floating-form" ref={formRef}>
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
                value={`+54${newCliente.telefono1}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value.replace('+54', '') })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                className="form-control"
                placeholder="Teléfono 2"
                value={`+54${newCliente.telefono2}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value.replace('+54', '') })}
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
        </div>
      )}

      {mostrarEditar && (
        <div className="blur-background">
          <form onSubmit={handleUpdateCliente} className="floating-form" ref={editFormRef}>
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
                value={newCliente.telefono1.startsWith('+54') ? newCliente.telefono1 : `+54${newCliente.telefono1}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                className="form-control"
                placeholder="Teléfono 2"
                value={newCliente.telefono2.startsWith('+54') ? newCliente.telefono2 : `+54${newCliente.telefono2}`}
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
        </div>
      )}

      {mostrarEliminar && (
        <div className="blur-background">
          <div className="floating-form" ref={deleteFormRef}>
            <p>¿Estás seguro que deseas eliminar este cliente?</p>
            <button onClick={() => handleDeleteCliente(editClienteId)} className="btn btn-danger">Eliminar</button>
            <button onClick={() => setMostrarEliminar(false)} className="btn btn-secondary">Cancelar</button>
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
              <a
                href={`https://wa.me/${cliente.telefono1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
              >
                Chat en WhatsApp
              </a>
              {currentUser && currentUser.role === 'jefe' && (
                <>
                  <button className="btn btn-warning" onClick={(e) => { e.stopPropagation(); startEditCliente(cliente); }}>Editar</button>
                  <button className="btn btn-danger ml-2" onClick={(e) => { e.stopPropagation(); setEditClienteId(cliente.dni); setMostrarEliminar(true); }}>Eliminar</button>
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
