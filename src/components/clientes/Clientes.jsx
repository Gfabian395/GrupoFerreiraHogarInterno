import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { db, storage } from '../../firebaseConfig';
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
  const esFotografo = currentUser?.role.includes('fotografo');


  const formatNombre = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddButtonClick = () => {
    setNewCliente({
      dni: '',
      nombreCompleto: '',
      direccion: '',
      entrecalles: '',
      telefono1: '+549',
      telefono2: '+549',
    });
    setSelectedFile(null);
    setMostrarFormulario(true);
  };

  const handleAddCliente = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Por favor, subí una imagen del cliente.');
      return;
    }

    try {
      const imageRef = ref(storage, `clientes/${newCliente.dni}.jpg`);
      await uploadBytes(imageRef, selectedFile);
      const imagenUrl = await getDownloadURL(imageRef);

      const clienteDoc = doc(db, 'clientes', newCliente.dni);
      const clienteData = {
        ...newCliente,
        dni: newCliente.dni.toString(),
        nombreCompleto: formatNombre(newCliente.nombreCompleto),
        imagenUrl,
      };
      await setDoc(clienteDoc, clienteData);

      setClientes(prev => [...prev, clienteData]);
      setFilteredClientes(prev => [...prev, clienteData]);
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '',
        telefono2: '',
      });
      setSelectedFile(null);
      setMostrarFormulario(false);
      alert('Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error agregando cliente:', error);
      alert('Error al agregar cliente.');
    }
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();

    try {
      const clienteDoc = doc(db, 'clientes', editClienteId);
      let imagenUrl = null;

      if (selectedFile) {
        const imageRef = ref(storage, `clientes/${newCliente.dni}.jpg`);
        await uploadBytes(imageRef, selectedFile);
        imagenUrl = await getDownloadURL(imageRef);
      }

      if (esFotografo) {
        // Solo actualiza la imagen
        if (imagenUrl) {
          await setDoc(clienteDoc, { imagenUrl }, { merge: true });
          alert('Imagen actualizada exitosamente');
        } else {
          alert('Seleccioná una imagen para actualizar');
          return;
        }
      } else {
        // Actualiza todos los datos
        await setDoc(clienteDoc, {
          ...newCliente,
          dni: newCliente.dni.toString(),
          nombreCompleto: formatNombre(newCliente.nombreCompleto),
          imagenUrl: imagenUrl || newCliente.imagenUrl,
        });
        alert('Cliente actualizado exitosamente');
      }

      setEditClienteId(null);
      setNewCliente({
        dni: '',
        nombreCompleto: '',
        direccion: '',
        entrecalles: '',
        telefono1: '',
        telefono2: '',
      });
      setSelectedFile(null);
      setMostrarEditar(false);
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar cliente.');
    }
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
    });
    setSelectedFile(null);
    setMostrarEditar(true);
  };

  const handleDeleteCliente = async (id) => {
    const clienteDoc = doc(db, 'clientes', id);
    await deleteDoc(clienteDoc);
    alert('Cliente eliminado exitosamente');
    window.location.reload();
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

  if (loading) return <Load />;

  return (
    <div className="container">
      <button onClick={handleAddButtonClick} className="floating-btn">+</button>

      {mostrarEditar && (
        <div className="blur-background">
          <form onSubmit={handleUpdateCliente} className="floating-form" ref={editFormRef}>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="DNI"
                value={newCliente.dni}
                onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
                disabled={esFotografo}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Nombre Completo"
                value={newCliente.nombreCompleto}
                onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
                disabled={esFotografo}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Dirección"
                value={newCliente.direccion}
                onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
                disabled={esFotografo}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Entrecalles"
                value={newCliente.entrecalles}
                onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
                disabled={esFotografo}
                required />
            </div>
            <div className="form-group">
              <input type="tel" className="form-control" placeholder="Teléfono 1"
                value={newCliente.telefono1}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                disabled={esFotografo}
                required />
            </div>
            <div className="form-group">
              <input type="tel" className="form-control" placeholder="Teléfono 2"
                value={newCliente.telefono2}
                onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
                disabled={esFotografo}
              />
            </div>
            <div className="form-group">
              <label>Subir nueva imagen:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </div>
            {selectedFile && (
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary">
              {esFotografo ? 'Actualizar Imagen' : 'Actualizar Cliente'}
            </button>
          </form>
        </div>
      )}

      {mostrarFormulario && (
        <div className="blur-background">
          <form onSubmit={handleAddCliente} className="floating-form" ref={formRef}>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="DNI"
                value={newCliente.dni}
                onChange={(e) => setNewCliente({ ...newCliente, dni: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Nombre Completo"
                value={newCliente.nombreCompleto}
                onChange={(e) => setNewCliente({ ...newCliente, nombreCompleto: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Dirección"
                value={newCliente.direccion}
                onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Entrecalles"
                value={newCliente.entrecalles}
                onChange={(e) => setNewCliente({ ...newCliente, entrecalles: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <input type="tel" className="form-control" placeholder="Teléfono 1"
                value={newCliente.telefono1}
                onChange={(e) => setNewCliente({ ...newCliente, telefono1: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <input type="tel" className="form-control" placeholder="Teléfono 2"
                value={newCliente.telefono2}
                onChange={(e) => setNewCliente({ ...newCliente, telefono2: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subir imagen del cliente:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </div>
            {selectedFile && (
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary">Agregar Cliente</button>
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
        {filteredClientes.map((cliente, index) => (
          <div className="card" key={`${cliente.dni}-${index}`} onClick={() => handleClienteClick(cliente.dni)}>
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
              {(currentUser && (currentUser.role.includes('jefe') || currentUser.role.includes('encargado') || currentUser.role.includes('fotografo'))) && (
                <button
                  className="btn btn-warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditCliente(cliente);
                  }}
                >
                  Editar
                </button>
              )}
              {currentUser && currentUser.role.includes('jefe') && (
                <button
                  className="btn btn-danger ml-2"
                  onClick={(e) => {
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
