import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { db, storage } from '../../firebaseConfig'; // storage debe estar exportado en firebaseConfig
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Load from '../load/Load';

const Clientes = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [newCliente, setNewCliente] = useState({
    dni: '',
    nombreCompleto: '',
    direccion: '',
    entrecalles: '',
    telefono1: '+549',
    telefono2: '+549',
    imagenUrl: 'https://placehold.co/200x200'
  });
  const [selectedFile, setSelectedFile] = useState(null);
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

  // Carga inicial de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clienteCollection = collection(db, 'clientes');
        const clienteSnapshot = await getDocs(clienteCollection);
        const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clienteList.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
        setClientes(clienteList);
        setFilteredClientes(clienteList);
      } catch (error) {
        console.error("Error fetching clientes: ", error);
        alert('Error al cargar clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Filtrado por búsqueda DNI o nombre
  useEffect(() => {
    const results = clientes.filter(cliente =>
      cliente.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(results);
  }, [searchTerm, clientes]);

  // Capitaliza nombres
  const formatNombre = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Manejo de selección de archivo imagen
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Subir imagen a Firebase Storage y obtener URL
  const uploadImageAndGetUrl = async (dni) => {
    if (!selectedFile) return newCliente.imagenUrl || 'https://placehold.co/200x200';
    const storageRef = ref(storage, `clientes/${dni}_${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  // Agregar cliente
  const handleAddButtonClick = () => {
    setNewCliente({
      dni: '',
      nombreCompleto: '',
      direccion: '',
      entrecalles: '',
      telefono1: '+549',
      telefono2: '+549',
      imagenUrl: 'https://placehold.co/200x200'
    });
    setSelectedFile(null);
    setMostrarFormulario(true);
  };

  const handleAddCliente = async (e) => {
    e.preventDefault();
    try {
      const imagenUrl = await uploadImageAndGetUrl(newCliente.dni);
      const clienteDoc = doc(db, 'clientes', newCliente.dni);
      await setDoc(clienteDoc, {
        ...newCliente,
        dni: newCliente.dni.toString(),
        nombreCompleto: formatNombre(newCliente.nombreCompleto),
        imagenUrl
      });
      alert('Cliente agregado exitosamente');
      setMostrarFormulario(false);
      setSelectedFile(null);
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '+549',
        telefono2: '+549',
        imagenUrl: 'https://placehold.co/200x200'
      });
      window.location.reload(); // opcional, podés actualizar lista sin reload
    } catch (error) {
      console.error("Error agregando cliente:", error);
      alert("Error al agregar cliente.");
    }
  };

  // Editar cliente
  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni);
    setNewCliente({
      dni: cliente.dni,
      nombreCompleto: cliente.nombreCompleto,
      direccion: cliente.direccion,
      entrecalles: cliente.entrecalles,
      telefono1: cliente.telefono1,
      telefono2: cliente.telefono2,
      imagenUrl: cliente.imagenUrl || 'https://placehold.co/200x200'
    });
    setSelectedFile(null);
    setMostrarEditar(true);
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
    try {
      let imagenUrl = newCliente.imagenUrl;
      if (selectedFile) {
        imagenUrl = await uploadImageAndGetUrl(newCliente.dni);
      }
      const clienteDoc = doc(db, 'clientes', editClienteId);
      await setDoc(clienteDoc, {
        ...newCliente,
        dni: newCliente.dni.toString(),
        nombreCompleto: formatNombre(newCliente.nombreCompleto),
        imagenUrl
      });
      alert('Cliente actualizado exitosamente');
      setMostrarEditar(false);
      setSelectedFile(null);
      setEditClienteId(null);
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '+549',
        telefono2: '+549',
        imagenUrl: 'https://placehold.co/200x200'
      });
      window.location.reload(); // opcional, podés actualizar lista sin reload
    } catch (error) {
      console.error("Error actualizando cliente:", error);
      alert("Error al actualizar cliente.");
    }
  };

  // Eliminar cliente
  const handleDeleteCliente = async (id) => {
    try {
      const clienteDoc = doc(db, 'clientes', id);
      await deleteDoc(clienteDoc);
      alert('Cliente eliminado exitosamente');
      setMostrarEliminar(false);
      window.location.reload();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      alert("Error al eliminar cliente.");
    }
  };

  // Navegar al detalle cliente
  const handleClienteClick = (dni) => {
    navigate(`/clientes/${dni}/detalles`);
  };

  // Cierra formularios si clickeas fuera
  const handleOutsideClick = (e) => {
    if (
      (formRef.current && !formRef.current.contains(e.target)) ||
      (editFormRef.current && !editFormRef.current.contains(e.target)) ||
      (deleteFormRef.current && !deleteFormRef.current.contains(e.target))
    ) {
      setMostrarFormulario(false);
      setMostrarEditar(false);
      setMostrarEliminar(false);
      setSelectedFile(null);
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

  return (
    <div className="container">
      <button onClick={handleAddButtonClick} className="floating-btn">+</button>

      {/* Formulario Agregar Cliente */}
      {mostrarFormulario && (
        <div className="blur-background">
          <form onSubmit={handleAddCliente} className="floating-form" ref={formRef}>
            <input
              type="text"
              placeholder="DNI"
              value={newCliente.dni}
              onChange={e => setNewCliente({ ...newCliente, dni: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Nombre Completo"
              value={newCliente.nombreCompleto}
              onChange={e => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Dirección"
              value={newCliente.direccion}
              onChange={e => setNewCliente({ ...newCliente, direccion: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Entrecalles"
              value={newCliente.entrecalles}
              onChange={e => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="tel"
              placeholder="Teléfono 1"
              value={newCliente.telefono1}
              onChange={e => setNewCliente({ ...newCliente, telefono1: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="tel"
              placeholder="Teléfono 2"
              value={newCliente.telefono2}
              onChange={e => setNewCliente({ ...newCliente, telefono2: e.target.value })}
              className="form-control"
            />
            <label>Foto del Cliente</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />
            <button type="submit" className="btn btn-primary mt-2">Agregar Cliente</button>
          </form>
        </div>
      )}

      {/* Formulario Editar Cliente */}
      {mostrarEditar && (
        <div className="blur-background">
          <form onSubmit={handleUpdateCliente} className="floating-form" ref={editFormRef}>
            <input
              type="text"
              placeholder="DNI"
              value={newCliente.dni}
              onChange={e => setNewCliente({ ...newCliente, dni: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Nombre Completo"
              value={newCliente.nombreCompleto}
              onChange={e => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Dirección"
              value={newCliente.direccion}
              onChange={e => setNewCliente({ ...newCliente, direccion: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="text"
              placeholder="Entrecalles"
              value={newCliente.entrecalles}
              onChange={e => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="tel"
              placeholder="Teléfono 1"
              value={newCliente.telefono1}
              onChange={e => setNewCliente({ ...newCliente, telefono1: e.target.value })}
              required
              className="form-control"
            />
            <input
              type="tel"
              placeholder="Teléfono 2"
              value={newCliente.telefono2}
              onChange={e => setNewCliente({ ...newCliente, telefono2: e.target.value })}
              className="form-control"
            />
            <label>Foto del Cliente (dejar vacío para no modificar)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />
            <button type="submit" className="btn btn-primary mt-2">Actualizar Cliente</button>
          </form>
        </div>
      )}

      {/* Confirmar Eliminar Cliente */}
      {mostrarEliminar && (
        <div className="blur-background">
          <div className="floating-form" ref={deleteFormRef}>
            <p>¿Estás seguro que deseas eliminar este cliente?</p>
            <button onClick={() => handleDeleteCliente(editClienteId)} className="btn btn-danger mr-2">Eliminar</button>
            <button onClick={() => setMostrarEliminar(false)} className="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="search-box mt-4">
        <input
          type="text"
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="card-container mt-4">
        {filteredClientes.map(cliente => (
          <div
            className="card"
            key={cliente.dni}
            onClick={() => handleClienteClick(cliente.dni)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={cliente.imagenUrl || 'https://placehold.co/200x200'}
              alt={cliente.nombreCompleto}
              className="card-img-top"
            />
            <div className="card-body">
              <h5 className="card-title">{cliente.nombreCompleto}</h5>
              <a
                href={`https://wa.me/${cliente.telefono1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success mr-2"
              >
                Chat en WhatsApp
              </a>

              {(currentUser?.role === 'jefe' || currentUser?.role === 'encargado') && (
                <button
                  className="btn btn-warning mr-2"
                  onClick={e => {
                    e.stopPropagation();
                    startEditCliente(cliente);
                  }}
                >
                  Editar
                </button>
              )}

              {currentUser?.role === 'jefe' && (
                <button
                  className="btn btn-danger"
                  onClick={e => {
                    e.stopPropagation();
                    setEditClienteId(cliente.dni);
                    setMostrarEliminar(true);
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clientes;
