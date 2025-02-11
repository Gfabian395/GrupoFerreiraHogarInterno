import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Ventas.css';

const configuracionCuotas = [
  { cuotas: 2, interes: 15 },
  { cuotas: 3, interes: 25 },
  { cuotas: 4, interes: 40 },
  { cuotas: 6, interes: 60 },
  { cuotas: 9, interes: 75 },
  { cuotas: 12, interes: 100 },
  { cuotas: 18, interes: 150 },
  { cuotas: 24, interes: 180 }
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
  const location = useLocation();
  const navigate = useNavigate();
  const sucursal = location.state?.sucursal || 'Andes 4034';
  const subtotal = location.state?.subtotal || 0;
  const productos = location.state?.productos || [];
  const [valorCuota, setValorCuota] = useState(0);

  useEffect(() => {
    const fetchClientes = async () => {
      const clienteCollection = collection(db, 'clientes');
      const clienteSnapshot = await getDocs(clienteCollection);
      const clienteList = clienteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(clienteList);
      setFilteredClientes(clienteList);
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
      setCuotas([{ mensaje: "Por favor, ingrese un monto válido." }]);
      return;
    }

    const cuotasFiltradas = configuracionCuotas.filter(opcion => {
      if (subtotal < 30000) return opcion.cuotas <= 2;
      if (subtotal >= 30000 && subtotal < 80000) return opcion.cuotas <= 3;
      if (subtotal >= 80000 && subtotal < 150000) return opcion.cuotas <= 6;
      if (subtotal >= 150000 && subtotal < 250000) return opcion.cuotas <= 9;
      if (subtotal >= 250000 && subtotal < 350000) return opcion.cuotas <= 12;
      if (subtotal >= 350000 && subtotal < 500000) return opcion.cuotas <= 18;
      return true;
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
    calcularCuotas();
  }, [subtotal, cuotasSeleccionadas]);

  const handleClienteChange = (e) => {
    setSelectedCliente(e.target.value);
  };

  const handleCuotasSeleccionadasChange = (e) => {
    setCuotasSeleccionadas(parseInt(e.target.value, 10));
  };

  const handleCheckboxChange = (e) => {
    setCargarPrimerCuota(e.target.value === "sí");
  };

  const generatePDF = (venta, clienteInfo, vendedor) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [53, 300]
    });

    doc.setFontSize(10);
    doc.text('Mini Factura', 26.5, 10, null, null, 'center');
    doc.text(`Cliente: ${clienteInfo.nombreCompleto}`, 5, 20);
    doc.text(`Sucursal: ${venta.sucursal}`, 5, 25);
    doc.text(`Cuotas: ${venta.cuotas}`, 5, 30);
    doc.text(`Vendedor: ${vendedor}`, 5, 35);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 40);

    const tableColumn = ["Producto", "Cant", "P.Unit", "Subtotal"];
    const tableRows = [];

    venta.productos.forEach(producto => {
      const productoData = [
        producto.nombre,
        producto.cantidad,
        `$${producto.precio.toLocaleString('es-AR')}`,
        `$${(producto.precio * producto.cantidad).toLocaleString('es-AR')}`
      ];
      tableRows.push(productoData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'plain',
      styles: { fontSize: 8 }
    });

    window.open(doc.output('bloburl'));
  };

  const handleRealizarVenta = async () => {
    if (!selectedCliente || !cuotasSeleccionadas) {
      alert('Por favor, selecciona un cliente y las cuotas.');
      return;
    }

    const cuotaSeleccionada = configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas);
    const interes = cuotaSeleccionada?.interes || 0;
    const totalCredito = subtotal * (1 + interes / 100);
    const valorCuotaCalculado = Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000;

    const ventasCollection = collection(db, 'ventas');
    const venta = {
      clienteId: selectedCliente,
      sucursal: sucursal,
      productos: carrito,
      cuotas: cuotasSeleccionadas,
      fecha: new Date(),
      totalCredito: totalCredito,
      valorCuota: valorCuotaCalculado,
      pagos: [],
      vendedor: currentUser.username
    };

    const ventaRef = await addDoc(ventasCollection, venta);

    for (const producto of carrito) {
      if (producto.categoriaId) {
        const productoRef = doc(db, `categorias/${producto.categoriaId}/productos`, producto.id);
        if (sucursal === 'Andes 4034') {
          await updateDoc(productoRef, {
            cantidadDisponibleAndes4034: producto.cantidadDisponibleAndes4034 - producto.cantidad,
          });
        } else if (sucursal === 'Andes 4320') {
          await updateDoc(productoRef, {
            cantidadDisponibleAndes4320: producto.cantidadDisponibleAndes4320 - producto.cantidad,
          });
        }
      } else {
        console.error(`Producto ${producto.id} no tiene categoriaId`);
      }
    }

    const clienteRef = doc(db, 'clientes', selectedCliente);
    const clienteDoc = await getDoc(clienteRef);
    const clienteInfo = clienteDoc.data();

    generatePDF(venta, clienteInfo, currentUser.username);

    if (cargarPrimerCuota) {
      const fechaPago = new Date().toISOString().split('T')[0];
      const montoPago = valorCuotaCalculado;
      const pagosIniciales = [{ fecha: fechaPago, monto: montoPago, usuario: currentUser.username }];
      await updateDoc(ventaRef, { pagos: pagosIniciales });
    }

    setVentaRealizada(true);
    onClearCart();
    alert('Venta realizada con éxito');
    navigate('/clientes');
  };

  return (
    <div className="ventas">
      <h2>Realizar Venta</h2>
      {ventaRealizada && <div className="alert alert-success">¡Venta realizada con éxito!</div>}
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
        <select id="cliente" className="form-control" value={selectedCliente} onChange={handleClienteChange}>
          <option value="">-- Selecciona un Cliente --</option>
          {filteredClientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>{cliente.nombreCompleto}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="cuotasSeleccionadas">Seleccionar Cantidad de Cuotas:</label>
        <select id="cuotasSeleccionadas" className="form-control" value={cuotasSeleccionadas} onChange={handleCuotasSeleccionadasChange}>
          {cuotas.map((opcion) => (
            <option key={opcion.cuotas} value={opcion.cuotas}>{opcion.cuotas} cuotas de ${opcion.montoCuota} por mes</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="cargarPrimerCuota">Cargar Primer Cuota:</label>
        <select id="cargarPrimerCuota" className="form-control" value={cargarPrimerCuota ? "sí" : "no"} onChange={handleCheckboxChange}>
          <option value="sí">Sí</option>
          <option value="no">No</option>
        </select>
      </div>
      <h3>Productos en Carrito</h3>
      <div className="card-container">
        {carrito.map(producto => (
          <div className="card" key={producto.id}>
            <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{producto.nombre}</h5>
              <p className="card-text">Precio: ${producto.precio.toLocaleString('es-AR')}</p>
              <p className="card-text">Cantidad: {producto.cantidad}</p>
              <p className="card-text">Subtotal: ${(producto.precio * producto.cantidad).toLocaleString('es-AR')}</p>
              <p className="card-text">Total Crédito: ${(subtotal * (1 + configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas).interes / 100)).toLocaleString('es-AR')}</p>
              <p className="card-text">Valor de Cada Cuota: ${valorCuota.toLocaleString('es-AR')}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={handleRealizarVenta}>Realizar Venta</button>
    </div>
  );
};

export default Ventas;
