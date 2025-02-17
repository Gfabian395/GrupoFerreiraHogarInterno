import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Ventas.css';


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

const choferes = [
  { nombre: 'Vanesa Ferreira', patente: 'AD417CW', telefono: '11-3800-2078' },
  { nombre: 'Carolina Ferreira', patente: 'AD754DG', telefono: '11-2222-2222' },
  { nombre: 'Gustavo Ferreira', patente: 'AD614CN', telefono: '11-3333-3333' }
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
  const [entrega, setEntrega] = useState('sucursal'); // Nueva opción para la entrega
  const [selectedChofer, setSelectedChofer] = useState(choferes[0]); // Chofer seleccionado por defecto
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
      if (opcion.cuotas === 1) return true; // Siempre incluye la opción de 1 cuota
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





  const generatePDF = (venta, clienteInfo, vendedor) => {
    const doc = new jsPDF('p', 'pt', 'a4'); // A4 size

    // Agregar el logo en la parte superior
    const logoUrl = 'https://scontent.faep37-1.fna.fbcdn.net/v/t39.30808-6/480109992_122105885180760410_4771551403182724247_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=f727a1&_nc_ohc=lpMIF9WmQ8EQ7kNvgHym_hb&_nc_oc=AdiOkP0N0qKoBfD1l1nA_QA7xBv3L6_ALCuvesldnW-g8USqa_GuSoWmcPZeWce5Ro4&_nc_zt=23&_nc_ht=scontent.faep37-1.fna&_nc_gid=AJDzdIg7r0Bch0dt6UGKHjd&oh=00_AYC4z6kUNLjANB8PSJjst-5-pp527-9jvmgAj0gNz1INMg&oe=67B44E99'; // URL del logo
    // Asegúrate de usar las dimensiones correctas para que el logo no se deforme.
    doc.addImage(logoUrl, 'JPEG', 250, 20, 80, 80); // Coordenadas X e Y, Ancho y Alto

    // Agregar el logo como marca de agua en el centro
    doc.setGState(new doc.GState({ opacity: 0.05 })); // Ajustar opacidad al 5%
    const imgWidth = 400;
    const imgHeight = 400;
    const centerX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
    const centerY = (doc.internal.pageSize.getHeight() - imgHeight) / 2;
    doc.addImage(logoUrl, 'JPEG', centerX, centerY, imgWidth, imgHeight, '', 'FAST'); // Ajusta la posición y tamaño según sea necesario
    doc.setGState(new doc.GState({ opacity: 1 })); // Restaurar opacidad al 100%

    // Título y detalles en el centro
    doc.setFontSize(12);
    doc.text('Factura', 40, 140);
    doc.text(`Cliente: ${clienteInfo.nombreCompleto}`, 40, 160);
    doc.text(`Sucursal: ${venta.sucursal}`, 40, 180);
    doc.text(`Vendedor: ${vendedor}`, 40, 200);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 40, 220);

    // Información del local
    doc.text('Los Andes 4320:', 400, 140);
    doc.text('Teléfono: 11-2846-6001', 400, 160);
    doc.text('Los Andes 4034:', 400, 180);
    doc.text('Teléfono: 11-3800-2078', 400, 200);

    if (venta.entrega === 'domicilio') {
      // Parte superior para el chofer
      doc.setFontSize(10);
      doc.text('DATOS DEL CLIENTE:', 40, 400);
      doc.text(`Nombre: ${clienteInfo.nombreCompleto}`, 40, 420);
      doc.text(`Dirección: ${clienteInfo.direccion}`, 40, 440);
      doc.text(`Teléfono: ${clienteInfo.telefono1}`, 40, 460);
      doc.text(`Teléfono 2: ${clienteInfo.telefono2}`, 40, 480);
      doc.text(`Fecha y Hora: ${new Date().toLocaleString()}`, 40, 500);

      // Parte inferior para el cliente
      doc.text('DATOS DEL CHOFER:', 400, 400);
      doc.text(`Nombre: ${venta.chofer.nombre}`, 400, 420);
      doc.text(`Teléfono: ${venta.chofer.telefono}`, 400, 440);
    }

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
      startY: 240,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] }
    });


    // Guardar el PDF como archivo y descargar automáticamente
    doc.save('Factura.pdf');

    // Redirigir a la página de clientes después de descargar el PDF
    setTimeout(() => {
      navigate('/clientes'); // Redirigir a la página de clientes
    }, 1000); // Ajusta el tiempo si es necesario
  };






  const handleRealizarVenta = async () => {
    if (!selectedCliente || !cuotasSeleccionadas || (entrega === 'domicilio' && !selectedChofer)) {
      alert('Por favor, selecciona un cliente, las cuotas y el chofer para entrega a domicilio.');
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
      vendedor: currentUser.username,
      entrega: entrega, // Añadir información de entrega
      chofer: entrega === 'domicilio' ? selectedChofer : null // Añadir información del chofer si aplica
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
      <div className="form-group">
        <label htmlFor="entrega">Seleccionar Tipo de Entrega:</label>
        <select id="entrega" className="form-control" value={entrega} onChange={handleEntregaChange}>
          <option value="sucursal">Retira en Sucursal</option>
          <option value="domicilio">Envío a Domicilio</option>
        </select>
      </div>
      {entrega === 'domicilio' && (
        <div className="form-group">
          <label htmlFor="chofer">Seleccionar Chofer:</label>
          <select id="chofer" className="form-control" value={selectedChofer.nombre} onChange={handleChoferChange}>
            {choferes.map((chofer) => (
              <option key={chofer.nombre} value={chofer.nombre}>{chofer.nombre}</option>
            ))}
          </select>
        </div>
      )}
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
