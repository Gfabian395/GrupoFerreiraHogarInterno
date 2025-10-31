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
    telefono1: '+549',
    telefono2: '+549',
    observacion: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editClienteId, setEditClienteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const navigate = useNavigate();
  const formRef = useRef(null);
  const editFormRef = useRef(null);
  const deleteFormRef = useRef(null);
  const esFotografo = currentUser?.role.includes('fotografo');

  // Funciones

  const formatNombre = (nombre) =>
    nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const fetchClientes = async () => {
    try {
      // 1️⃣ Obtener clientes
      const clienteSnapshot = await getDocs(collection(db, 'clientes'));
      const clientesList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2️⃣ Obtener ventas
      const ventasSnapshot = await getDocs(collection(db, 'ventas'));
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3️⃣ Unir clientes con sus ventas
      const clientesConVentas = clientesList.map(cliente => {
        const ventasCliente = ventasList.filter(venta => venta.clienteId === cliente.dni);
        return { ...cliente, ventas: ventasCliente };
      });

      // 4️⃣ Ordenar por nombre
      clientesConVentas.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

      // 5️⃣ Actualizar estados
      setClientes(clientesConVentas);
      setFilteredClientes(clientesConVentas);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener clientes y ventas:', error);
    }
  };


  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter(cliente =>
      cliente.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
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

    try {
      let imagenUrl = 'https://placehold.co/200x200';

      if (selectedFile) {
        const imageRef = ref(storage, `clientes/${newCliente.dni}.jpg`);
        await uploadBytes(imageRef, selectedFile);
        imagenUrl = await getDownloadURL(imageRef);
      }

      const clienteData = {
        ...newCliente,
        dni: newCliente.dni.toString(),
        nombreCompleto: formatNombre(newCliente.nombreCompleto),
        imagenUrl,
      };

      await setDoc(doc(db, 'clientes', newCliente.dni), clienteData);
      setClientes(prev => [...prev, clienteData]);
      setFilteredClientes(prev => [...prev, clienteData]);
      setMostrarFormulario(false);
      alert('Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      alert('Error al agregar cliente.');
    }
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
    try {
      const oldDocRef = doc(db, 'clientes', editClienteId);
      const newDocRef = doc(db, 'clientes', newCliente.dni.toString());

      let imagenUrl = newCliente.imagenUrl;

      if (selectedFile) {
        const imageRef = ref(storage, `clientes/${newCliente.dni}.jpg`);
        await uploadBytes(imageRef, selectedFile);
        imagenUrl = await getDownloadURL(imageRef);
      }

      const updatedData = {
        ...newCliente,
        dni: newCliente.dni.toString(),
        nombreCompleto: formatNombre(newCliente.nombreCompleto),
        imagenUrl,
      };

      if (editClienteId !== newCliente.dni) {
        // 🔹 DNI cambió → crear nuevo doc y borrar el viejo
        await setDoc(newDocRef, updatedData);
        await deleteDoc(oldDocRef);
      } else {
        // 🔹 DNI igual → actualizar doc
        await setDoc(oldDocRef, updatedData, { merge: true });
      }

      alert('Cliente actualizado exitosamente');
      setMostrarEditar(false);
      setSelectedFile(null);
      setEditClienteId(null);
      fetchClientes();
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar cliente.');
    }
  };

  const startEditCliente = (cliente) => {
    setEditClienteId(cliente.dni);
    setNewCliente(cliente);
    setSelectedFile(null);
    setMostrarEditar(true);
  };

  const handleDeleteCliente = async (id) => {
    try {
      await deleteDoc(doc(db, 'clientes', id));
      alert('Cliente eliminado exitosamente');
      setMostrarEliminar(false);
      fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
    }
  };

  const handleClienteClick = (dni) => navigate(`/clientes/${dni}/detalles`);

  const handleOutsideClick = (e) => {
    if (
      !formRef.current?.contains(e.target) &&
      !editFormRef.current?.contains(e.target) &&
      !deleteFormRef.current?.contains(e.target)
    ) {
      setMostrarFormulario(false);
      setMostrarEditar(false);
      setMostrarEliminar(false);
    }
  };

  useEffect(() => {
    if (mostrarFormulario || mostrarEditar || mostrarEliminar) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [mostrarFormulario, mostrarEditar, mostrarEliminar]);

  const calcularTipoCliente = (ventas = []) => {
    let comprasPagadas = 0;

    ventas.forEach(venta => {
      // Verificamos que pagos exista y tenga datos
      const pagosTotales = (venta.pagos || []).reduce(
        (total, pago) => total + (pago.monto || 0),
        0
      );

      if (pagosTotales >= (venta.totalCredito || 0)) {
        comprasPagadas++;
      }
    });

    // Clasificar según el número de compras pagadas
    if (comprasPagadas >= 15) return 'VIP';
    if (comprasPagadas >= 10) return 'Excelente';
    if (comprasPagadas >= 7) return 'Buen cliente';
    if (comprasPagadas >= 5) return 'Cliente responsable';
    if (comprasPagadas >= 3) return 'Nuevo';

    return 'Sin clasificación';
  };


  const calcularCalificacionPromedio = (ventas = []) => {
    const calificaciones = ventas.flatMap(venta =>
      (venta.pagos || []).map(pago => pago.calificacion || 0)
    );

    const sumaCalificaciones = calificaciones.reduce(
      (total, calificacion) => total + calificacion,
      0
    );

    return calificaciones.length > 0
      ? sumaCalificaciones / calificaciones.length
      : 0;
  };

  const obtenerColorCliente = (tipoCliente) => {
    switch (tipoCliente) {
      case 'VIP':
        return '#FFD700'; // Oro
      case 'Excelente':
        return '#FF00FF'; // Fucsia
      case 'Buen cliente':
        return '#0000FF'; // Azul
      case 'Cliente responsable':
        return '#50C878'; // Verde esmeralda
      default:
        return '#FFFFFF'; // Blanco (sin clasificación)
    }
  };

  if (loading) return <Load />;

  return (
    <div className="container">
      <button onClick={handleAddButtonClick} className="floating-btn">+</button>

      {/* Formularios Flotantes */}
      {mostrarFormulario && (
        <FormularioCliente
          formRef={formRef}
          cliente={newCliente}
          setCliente={setNewCliente}
          selectedFile={selectedFile}
          handleFileChange={handleFileChange}
          handleSubmit={handleAddCliente}
        />
      )}

      {mostrarEditar && (
        <FormularioCliente
          formRef={editFormRef}
          cliente={newCliente}
          setCliente={setNewCliente}
          selectedFile={selectedFile}
          handleFileChange={handleFileChange}
          handleSubmit={handleUpdateCliente}
          esFotografo={esFotografo}
        />
      )}

      {mostrarEliminar && (
        <div className="blur-background">
          <div className="floating-form" ref={deleteFormRef}>
            <p>¿Estás seguro que deseas eliminar este cliente?</p>

            <input
              type="password"
              className="form-control mb-3"
              placeholder="Ingresá la contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />

            <button
              className="btn btn-danger"
              onClick={() => {
                if (passwordInput === '031285') {
                  handleDeleteCliente(editClienteId);
                  setPasswordInput('');
                } else {
                  alert('Contraseña incorrecta');
                }
              }}
            >
              Eliminar
            </button>

            <button
              className="btn btn-secondary mt-2"
              onClick={() => {
                setMostrarEliminar(false);
                setPasswordInput('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="search-box mt-4">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tarjetas de Cliente */}
      <div className="card-container mt-4">
        {filteredClientes.map((cliente, index) => {
          // Calculamos tipo de cliente y calificación promedio
          const tipoCliente = calcularTipoCliente(cliente.ventas || []);

          return (
            <div
              className={`card ${cliente.bloqueado ? 'bloqueado' : ''}`}
              key={`${cliente.dni}-${index}`}
              onClick={() => handleClienteClick(cliente.dni)}
              style={{ backgroundColor: obtenerColorCliente(tipoCliente) }}
            >
              <img
                src={cliente.imagenUrl || 'https://placehold.co/200x200'}
                alt={cliente.nombreCompleto}
                className="card-img-top"
              />
              <div className="card-body">
                <h5 className="card-title">{cliente.nombreCompleto}</h5>

                {/* Tipo de cliente */}
                <p className="badge bg-info text-dark">
                  {tipoCliente || 'Sin clasificación'}
                </p>

                <a
                  href={`https://wa.me/${cliente.telefono1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className='bx bxl-whatsapp'></i>
                </a>

                {(currentUser?.role.includes('jefe') ||
                  currentUser?.role.includes('encargado') ||
                  esFotografo) && (
                    <button
                      className="btn btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditCliente(cliente);
                      }}
                      title="Editar cliente"
                    >
                      <i className='bx bxs-pencil'></i>
                    </button>
                  )}

                {currentUser?.role.includes('jefe') && (
                  <button
                    className="btn btn-danger ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditClienteId(cliente.dni);
                      setMostrarEliminar(true);
                    }}
                    title="Eliminar cliente"
                  >
                    <i className='bx bxs-trash-alt'></i>
                  </button>
                )}

                <div className="tooltip-container">
                  <button
                    type="button"
                    className="btn btn-info ml-2"
                    onClick={(e) => e.stopPropagation()}
                    title="Ver observaciones"
                  >
                    <i className='bx bx-info-circle'></i>
                  </button>
                  <span className="tooltip-text">{cliente.observacion || 'Sin observaciones'}</span>
                </div>
              </div>
            </div>
          );

        })}
      </div>
    </div>
  );
};

const FormularioCliente = ({
  formRef,
  cliente,
  setCliente,
  selectedFile,
  handleFileChange,
  handleSubmit,
  esFotografo = false
}) => (
  <div className="blur-background">
    <form onSubmit={handleSubmit} className="floating-form" ref={formRef}>
      {['dni', 'nombreCompleto', 'direccion', 'entrecalles', 'telefono1', 'telefono2'].map((campo, idx) => (
        <div className="form-group" key={idx}>
          <input
            type={campo.includes('telefono') ? 'tel' : 'text'}
            className="form-control"
            placeholder={campo.charAt(0).toUpperCase() + campo.slice(1).replace('Completo', ' Completo')}
            value={cliente[campo]}
            onChange={(e) => setCliente({ ...cliente, [campo]: e.target.value })}
            disabled={esFotografo && campo !== 'telefono2'}
            required={campo !== 'telefono2'}
          />
        </div>
      ))}

      {/* ✅ Nuevo campo Observaciones */}
      <div className="form-group">
        <textarea
          className="form-control"
          placeholder="Observaciones"
          value={cliente.observacion || ''}
          onChange={(e) => setCliente({ ...cliente, observacion: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>{esFotografo ? 'Subir nueva imagen:' : 'Subir imagen del cliente:'}</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {selectedFile && (
        <div className="preview-image-container">
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            className="preview-image"
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        {esFotografo ? 'Actualizar Imagen' : (cliente?.dni ? 'Actualizar Cliente' : 'Agregar Cliente')}
      </button>
    </form>
  </div>
);

export default Clientes;