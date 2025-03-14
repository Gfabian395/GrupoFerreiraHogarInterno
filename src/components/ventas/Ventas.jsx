import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Ventas.css';

// Configuración de cuotas
const configuracionCuotas = [
  { cuotas: 1, interes: 0 }, // Nueva opción de 1 pago sin interés
  { cuotas: 2, interes: 15 },
  { cuotas: 3, interes: 25 },
  { cuotas: 4, interes: 40 },
  { cuotas: 6, interes: 60 },
  { cuotas: 9, interes: 75 },
  { cuotas: 12, interes: 100 },
  { cuotas: 18, interes: 150 },
  { cuotas: 24, interes: 180 }
];

// Datos de choferes
const choferes = [
  { nombre: 'Vanesa Ferreira', patente: 'AD417CW', telefono: '11-3800-2078' },
  { nombre: 'Carolina Ferreira', patente: 'AD754DG', telefono: '11-6308-3159' },
  { nombre: 'Gustavo Ferreira', patente: 'AD614CN', telefono: '11-6592-2180' }
];

const Ventas = ({ carrito, onClearCart, currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [cuotas, setCuotas] = useState([]);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(3);
  const [ventaRealizada, setVentaRealizada] = useState(false);
  const [cargarPrimerCuota, setCargarPrimerCuota] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [entrega, setEntrega] = useState('sucursal');
  const [selectedChofer, setSelectedChofer] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const sucursal = location.state?.sucursal || 'Andes 4034';
  const subtotal = location.state?.subtotal || 0;
  const [productos, setProductos] = useState(location.state?.productos || []);
  const [valorCuota, setValorCuota] = useState(0);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clienteCollection = collection(db, 'clientes');
        const clienteSnapshot = await getDocs(clienteCollection);
        const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClientes(clienteList);
        setFilteredClientes(clienteList);
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      }
    };

    fetchClientes();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    const filtered = clientes.filter(cliente =>
      cliente.nombreCompleto.toLowerCase().includes(e.target.value.toLowerCase()) ||
      cliente.dni.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredClientes(filtered);
  };

  const calcularCuotas = () => {
    if (isNaN(subtotal) || subtotal <= 0) {
      setCuotas([{ mensaje: 'Por favor, ingrese un monto válido.' }]);
      return;
    }

    const cuotasFiltradas = configuracionCuotas.filter(opcion => {
      switch (true) {
        case opcion.cuotas === 1:
          return true; // Siempre incluye la opción de 1 cuota
        case subtotal < 30000:
          return opcion.cuotas <= 2;
        case subtotal < 80000:
          return opcion.cuotas <= 3;
        case subtotal < 150000:
          return opcion.cuotas <= 6;
        case subtotal < 250000:
          return opcion.cuotas <= 9;
        case subtotal < 350000:
          return opcion.cuotas <= 12;
        case subtotal < 500000:
          return opcion.cuotas <= 18;
        default:
          return true;
      }
    });

    const resultados = cuotasFiltradas.map(opcion => {
      const { cuotas, interes } = opcion;
      const montoConInteres = subtotal * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return {
        cuotas,
        montoCuota: montoCuota.toLocaleString('es-AR')
      };
    });

    setCuotas(resultados);

    const cuotaSeleccionada = configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas);
    const interes = cuotaSeleccionada?.interes || 0;
    const totalCredito = subtotal * (1 + interes / 100);
    const valorCuotaCalculado = Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000;
    setValorCuota(valorCuotaCalculado);
  };

  useEffect(() => {
    if (subtotal > 0) {
      calcularCuotas();
    }
  }, [subtotal, cuotasSeleccionadas]);

  const handleClienteChange = (e) => {
    setSelectedCliente(e.target.value);
  };

  const handleCuotasSeleccionadasChange = (e) => {
    setCuotasSeleccionadas(parseInt(e.target.value, 10));
  };

  const handleCheckboxChange = (e) => {
    setCargarPrimerCuota(e.target.value === 'sí');
  };

  const handleEntregaChange = (e) => {
    setEntrega(e.target.value);
    if (e.target.value === 'domicilio') {
      setSelectedChofer(choferes[0]); // Selecciona el primer chofer por defecto
    } else {
      setSelectedChofer(null);
    }
  };

  const handleChoferChange = (e) => {
    const chofer = choferes.find(chofer => chofer.nombre === e.target.value);
    setSelectedChofer(chofer);
  };

  const handleRealizarVenta = async () => {
    try {
      // Validaciones iniciales
      if (!selectedCliente || !cuotasSeleccionadas || (entrega === 'domicilio' && !selectedChofer)) {
        alert('Por favor, selecciona un cliente, las cuotas y el chofer para entrega a domicilio.');
        return;
      }

      console.log('Datos iniciales en Ventas.jsx:', {
        carrito,
        subtotal,
        productos,
        sucursal: location.state?.sucursal,
      });

      // Inicialización de la sucursal
      const sucursal = location.state?.sucursal || 'Sin definir';
      if (!sucursal || sucursal === 'Sin definir') {
        console.error('Error: Sucursal no definida.');
        alert('Ocurrió un error. La sucursal no está definida.');
        return;
      }
      console.log('Sucursal inicializada:', sucursal);

      // Cálculo de crédito y cuota
      const cuotaSeleccionada = configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas);
      const interes = cuotaSeleccionada?.interes || 0;
      const totalCredito = subtotal * (1 + interes / 100);
      const valorCuotaCalculado = Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000;

      // Crear objeto de venta
      const ventasCollection = collection(db, 'ventas');
      const venta = {
        clienteId: selectedCliente,
        sucursal: sucursal,
        productos: carrito,
        cuotas: cuotasSeleccionadas,
        fecha: new Date(),
        totalCredito,
        valorCuota: valorCuotaCalculado,
        pagos: [],
        vendedor: currentUser.username,
        entrega: entrega,
        chofer: entrega === 'domicilio' ? selectedChofer : null,
      };

      console.log('Venta a guardar en Firebase:', venta);

      // Guardar la venta en Firebase
      const ventaRef = await addDoc(ventasCollection, venta);

      // Actualización del inventario
      for (const producto of carrito) {
        try {
          if (!producto.categoriaId) {
            console.error(`El producto ${producto.id} no tiene categoriaId asignado.`);
            continue;
          }

          const productoRef = doc(db, `categorias/${producto.categoriaId}/productos`, producto.id);

          const fieldKey =
            producto.sucursal === 'Andes4034'
              ? 'cantidadDisponibleAndes4034'
              : producto.sucursal === 'Andes4320'
                ? 'cantidadDisponibleAndes4320'
                : null;

          if (!fieldKey) {
            console.error('Sucursal no válida:', producto.sucursal);
            continue;
          }

          const stockActual = parseInt(producto[fieldKey]);
          const stockNuevo = stockActual - producto.cantidad;

          if (isNaN(stockActual) || stockActual <= 0 || stockNuevo < 0) {
            console.error(
              `Stock insuficiente para el producto ${producto.id}. Stock actual: ${stockActual}, Intento de stock nuevo: ${stockNuevo}`
            );
            alert(`El producto "${producto.nombre}" no tiene suficiente stock en la sucursal ${producto.sucursal}.`);
            continue;
          }

          console.log(`Stock actualizado para el producto ${producto.id}:`, {
            fieldKey,
            stockActual,
            cantidadVendida: producto.cantidad,
            stockNuevo,
          });

          await updateDoc(productoRef, { [fieldKey]: stockNuevo });
        } catch (error) {
          console.error(`Error procesando el producto ${producto.id}:`, error);
        }
      }

      // Registrar el primer pago si corresponde
      if (cargarPrimerCuota) {
        const ahora = new Date();
        // Formatear la fecha a YYYY-MM-DD
        const fechaPago = ahora.toISOString().split('T')[0]; // Extrae solo la parte de la fecha
        const montoPago = valorCuotaCalculado;
        const pagosIniciales = [
          { fecha: fechaPago, monto: montoPago, usuario: currentUser.username },
        ];
        await updateDoc(ventaRef, { pagos: pagosIniciales });

        console.log('Pago inicial registrado:', pagosIniciales);
      }


      // Finalizar la venta
      setVentaRealizada(true);
      onClearCart();
      alert('Venta realizada con éxito');

      // Redirigir a la lista de clientes
      navigate('/clientes');
    } catch (error) {
      console.error('Error al realizar la venta:', error);
      alert('Ocurrió un error al realizar la venta. Por favor, inténtalo nuevamente.');
    }
  };



  return (
    <div className="ventas">
      <h2>Realizar Venta</h2>
      {ventaRealizada && <div className="alert alert-success">¡Venta realizada con éxito!</div>}

      {/* Selección de cliente */}
      <div className="form-group">
        <label htmlFor="cliente">Seleccionar Cliente:</label>
        <input
          type="text"
          id="cliente-buscador"
          placeholder="Buscar por DNI o Nombre"
          value={searchTerm}
          onChange={handleSearchChange}
          className="form-control"
        />
        <select
          id="cliente"
          className="form-control"
          value={selectedCliente}
          onChange={handleClienteChange}
        >
          <option value="">-- Selecciona un Cliente --</option>
          {filteredClientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombreCompleto}
            </option>
          ))}
        </select>
      </div>

      {/* Selección de cuotas */}
      <div className="form-group">
        <label htmlFor="cuotasSeleccionadas">Seleccionar Cantidad de Cuotas:</label>
        <select
          id="cuotasSeleccionadas"
          className="form-control"
          value={cuotasSeleccionadas}
          onChange={handleCuotasSeleccionadasChange}
        >
          <option value="">-- Selecciona las Cuotas --</option>
          {cuotas.map((opcion) => (
            <option key={opcion.cuotas} value={opcion.cuotas}>
              {opcion.cuotas} cuotas de ${opcion.montoCuota} por mes
            </option>
          ))}
        </select>
      </div>

      {/* Cargar primera cuota */}
      <div className="form-group">
        <label htmlFor="cargarPrimerCuota">Cargar Primer Cuota:</label>
        <select
          id="cargarPrimerCuota"
          className="form-control"
          value={cargarPrimerCuota ? "sí" : "no"}
          onChange={handleCheckboxChange}
        >
          <option value="sí">Sí</option>
          <option value="no">No</option>
        </select>
      </div>

      {/* Tipo de entrega */}
      <div className="form-group">
        <label htmlFor="entrega">Seleccionar Tipo de Entrega:</label>
        <select
          id="entrega"
          className="form-control"
          value={entrega}
          onChange={handleEntregaChange}
        >
          <option value="sucursal">Retira en Sucursal</option>
          <option value="domicilio">Envío a Domicilio</option>
        </select>
      </div>

      {/* Selección de chofer (visible solo para envío a domicilio) */}
      {entrega === "domicilio" && (
        <div className="form-group">
          <label htmlFor="chofer">Seleccionar Chofer:</label>
          <select
            id="chofer"
            className="form-control"
            value={selectedChofer ? selectedChofer.nombre : ""}
            onChange={handleChoferChange}
          >
            <option value="">-- Selecciona un Chofer --</option>
            {choferes.map((chofer) => (
              <option key={chofer.nombre} value={chofer.nombre}>
                {chofer.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Productos en el carrito */}
      <h3>Productos en Carrito</h3>
      <div className="card-container">
        {carrito.map((producto) => (
          <div className="card" key={producto.id}>
            <img
              src={producto.imagenUrl}
              alt={producto.nombre}
              className="card-img-top"
            />
            <div className="card-body">
              <h5 className="card-title">{producto.nombre}</h5>
              <p className="card-text">
                Precio: ${producto.precio.toLocaleString("es-AR")}
              </p>
              <p className="card-text">Cantidad: {producto.cantidad}</p>
              <p className="card-text">
                Subtotal: $
                {(producto.precio * producto.cantidad).toLocaleString("es-AR")}
              </p>
              <p className="card-text">
                Total Crédito: $
                {(
                  subtotal *
                  (1 +
                    configuracionCuotas.find(
                      (c) => c.cuotas === cuotasSeleccionadas
                    ).interes /
                    100)
                ).toLocaleString("es-AR")}
              </p>
              <p className="card-text">
                Valor de Cada Cuota: ${valorCuota.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Botón de realizar venta */}
      <button
        className="btn btn-primary mt-4"
        onClick={handleRealizarVenta}
        disabled={!selectedCliente || cuotasSeleccionadas === ""}
      >
        Realizar Venta
      </button>
    </div>
  );
};

export default Ventas;
