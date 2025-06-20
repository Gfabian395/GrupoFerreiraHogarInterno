import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
<<<<<<< HEAD
import { db } from '../../firebaseConfig';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';

/* HASTA ACA FUNCIONA PERFECTO */

const Clientes = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [newCliente, setNewCliente] = useState({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
=======
import { db, storage } from '../../firebaseConfig'; // Asegurate que exportás storage desde firebaseConfig
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
    telefono1: '',
    telefono2: '',
    imagenUrl: 'https://placehold.co/200x200'
  });
  const [selectedFile, setSelectedFile] = useState(null);
>>>>>>> 80de3ac (version mejorada de la original)
  const [editClienteId, setEditClienteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
<<<<<<< HEAD
=======

>>>>>>> 80de3ac (version mejorada de la original)
  const navigate = useNavigate();
  const formRef = useRef(null);
  const editFormRef = useRef(null);
  const deleteFormRef = useRef(null);

<<<<<<< HEAD
  // Mover actualizarClientes antes de su uso
  const actualizarClientes = async (clienteList) => {
    try {
      for (const cliente of clienteList) {
        const clienteDoc = doc(db, 'clientes', cliente.dni);
        await setDoc(clienteDoc, {
          ...cliente,
          nombreCompleto: formatNombre(cliente.nombreCompleto),
        });
      }
    } catch (error) {
      console.error('Error actualizando clientes: ', error);
    }
  };

=======
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD

        // Llama a actualizarClientes después de haberla declarado
        actualizarClientes(clienteList);
=======
>>>>>>> 80de3ac (version mejorada de la original)
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

<<<<<<< HEAD
  const handleAddButtonClick = () => {
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '+549', telefono2: '+549', imagenUrl: 'https://placehold.co/200x200' });
    setMostrarFormulario(true);
  };

  const handleAddCliente = async (e) => {
    e.preventDefault();
    const clienteDoc = doc(db, 'clientes', newCliente.dni);
    await setDoc(clienteDoc, {
      ...newCliente,
      dni: newCliente.dni.toString(),
      nombreCompleto: formatNombre(newCliente.nombreCompleto),
    });
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
    alert('Cliente agregado exitosamente');
    window.location.reload();
  };

  const handleDeleteCliente = async (id) => {
    const clienteDoc = doc(db, 'clientes', id);
    await deleteDoc(clienteDoc);
    alert('Cliente eliminado exitosamente');
    window.location.reload();
=======
  const formatNombre = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImageAndGetUrl = async (dni) => {
    if (!selectedFile) return 'https://placehold.co/200x200';
    const storageRef = ref(storage, `clientes/${dni}_${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const url = await getDownloadURL(storageRef);
    return url;
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
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '',
        telefono2: '',
        imagenUrl: 'https://placehold.co/200x200'
      });
      setSelectedFile(null);
      setMostrarFormulario(false);
      window.location.reload();
    } catch (error) {
      console.error("Error agregando cliente:", error);
      alert("Error al agregar cliente.");
    }
>>>>>>> 80de3ac (version mejorada de la original)
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    const clienteDoc = doc(db, 'clientes', editClienteId);
    await setDoc(clienteDoc, {
      ...newCliente,
      dni: newCliente.dni.toString(),
      nombreCompleto: formatNombre(newCliente.nombreCompleto),
    });
    setEditClienteId(null);
    setNewCliente({ dni: '', nombreCompleto: '', direccion: '', entrecalles: '', telefono1: '', telefono2: '', imagenUrl: 'https://placehold.co/200x200' });
    alert('Cliente actualizado exitosamente');
    window.location.reload();
=======
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
      setEditClienteId(null);
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '',
        telefono2: '',
        imagenUrl: 'https://placehold.co/200x200'
      });
      setSelectedFile(null);
      setMostrarEditar(false);
      window.location.reload();
    } catch (error) {
      console.error("Error actualizando cliente:", error);
      alert("Error al actualizar cliente.");
    }
>>>>>>> 80de3ac (version mejorada de la original)
  };

  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni);
    setNewCliente({
      dni: cliente.dni,
      nombreCompleto: cliente.nombreCompleto,
      direccion: cliente.direccion,
      entrecalles: cliente.entrecalles,
      telefono1: cliente.telefono1,
      telefono2: cliente.telefono2,
<<<<<<< HEAD
      imagenUrl: cliente.imagenUrl,
    });
    setMostrarEditar(true);
  };

=======
      imagenUrl: cliente.imagenUrl || 'https://placehold.co/200x200'
    });
    setSelectedFile(null);
    setMostrarEditar(true);
  };

  const handleDeleteCliente = async (id) => {
    try {
      const clienteDoc = doc(db, 'clientes', id);
      await deleteDoc(clienteDoc);
      alert('Cliente eliminado exitosamente');
      window.location.reload();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      alert("Error al eliminar cliente.");
    }
  };

>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
=======
      setSelectedFile(null);
>>>>>>> 80de3ac (version mejorada de la original)
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

<<<<<<< HEAD
  const formatNombre = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
                value={`${newCliente.telefono1}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value.replace('', '') })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                className="form-control"
                placeholder="Teléfono 2"
                value={`${newCliente.telefono2}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value.replace('', '') })}
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
=======
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
              onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Nombre Completo"
              value={newCliente.nombreCompleto}
              onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Dirección"
              value={newCliente.direccion}
              onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Entrecalles"
              value={newCliente.entrecalles}
              onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="tel"
              placeholder="Teléfono 1"
              value={newCliente.telefono1}
              onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="tel"
              placeholder="Teléfono 2"
              value={newCliente.telefono2}
              onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
              className="form-control"
            />

            <label>Foto del Cliente</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />

>>>>>>> 80de3ac (version mejorada de la original)
            <button type="submit" className="btn btn-primary">Agregar Cliente</button>
          </form>
        </div>
      )}

<<<<<<< HEAD
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
                value={newCliente.telefono1.startsWith('') ? newCliente.telefono1 : `${newCliente.telefono1}`}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                className="form-control"
                placeholder="Teléfono 2"
                value={newCliente.telefono2.startsWith('') ? newCliente.telefono2 : `${newCliente.telefono2}`}
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
=======
      {/* Formulario Editar Cliente */}
      {mostrarEditar && (
        <div className="blur-background">
          <form onSubmit={handleUpdateCliente} className="floating-form" ref={editFormRef}>

            <input
              type="text"
              placeholder="DNI"
              value={newCliente.dni}
              onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Nombre Completo"
              value={newCliente.nombreCompleto}
              onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Dirección"
              value={newCliente.direccion}
              onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="text"
              placeholder="Entrecalles"
              value={newCliente.entrecalles}
              onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="tel"
              placeholder="Teléfono 1"
              value={newCliente.telefono1}
              onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
              required
              className="form-control"
            />

            <input
              type="tel"
              placeholder="Teléfono 2"
              value={newCliente.telefono2}
              onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
              className="form-control"
            />

            <label>Foto del Cliente (dejar vacío para no modificar)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />

>>>>>>> 80de3ac (version mejorada de la original)
            <button type="submit" className="btn btn-primary">Actualizar Cliente</button>
          </form>
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Confirmar Eliminar Cliente */}
>>>>>>> 80de3ac (version mejorada de la original)
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
<<<<<<< HEAD
          className="form-control"
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
=======
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
>>>>>>> 80de3ac (version mejorada de la original)
        />
      </div>

      <div className="card-container mt-4">
        {filteredClientes.map(cliente => (
<<<<<<< HEAD
          <div className="card" key={cliente.dni} onClick={() => handleClienteClick(cliente.dni)}>
=======
          <div
            className="card"
            key={cliente.dni}
            onClick={() => handleClienteClick(cliente.dni)}
          >
>>>>>>> 80de3ac (version mejorada de la original)
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
                className="btn btn-success"
              >
                Chat en WhatsApp
              </a>
<<<<<<< HEAD
              {currentUser && (currentUser.role === 'jefe' || currentUser.role === 'encargado') && (
                <button
                  className="btn btn-warning"
                  onClick={(e) => {
=======

              {currentUser && (currentUser.role === 'jefe' || currentUser.role === 'encargado') && (
                <button
                  className="btn btn-warning"
                  onClick={e => {
>>>>>>> 80de3ac (version mejorada de la original)
                    e.stopPropagation();
                    startEditCliente(cliente);
                  }}
                >
                  Editar
                </button>
              )}
<<<<<<< HEAD
              {currentUser && currentUser.role === 'jefe' && (
                <button
                  className="btn btn-danger ml-2"
                  onClick={(e) => {
=======

              {currentUser && currentUser.role === 'jefe' && (
                <button
                  className="btn btn-danger ml-2"
                  onClick={e => {
>>>>>>> 80de3ac (version mejorada de la original)
                    e.stopPropagation();
                    setEditClienteId(cliente.dni);
                    setMostrarEliminar(true);
                  }}
                >
                  Eliminar
                </button>
              )}
<<<<<<< HEAD
=======

>>>>>>> 80de3ac (version mejorada de la original)
            </div>
          </div>
        ))}
      </div>
<<<<<<< HEAD

=======
>>>>>>> 80de3ac (version mejorada de la original)
    </div>
  );
};

export default Clientes;
