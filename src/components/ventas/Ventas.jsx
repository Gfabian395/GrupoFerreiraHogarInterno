import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import './Ventas.css';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: ['jefe'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'Vanesa F', password: '554972', role: ['jefe'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'Franco A', password: 'Grupof2025', role: ['fotografo', 'vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carol F', password: 'Emilia2020', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F11.png?alt=media&token=b83cafcc-a9bb-4ae0-9609-2e8f65c95d10' },
  { username: 'Tamara G', password: 'Tamara07', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yulisa G', password: '244962', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Ronaldo F', password: 'Jose1946', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'Gustavo F', password: '36520975', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'prueba', password: 'prueba', role: ['jefe'], imageUrl: 'https://placehold.co/50x50' },
  { username: 'catalogo', password: '', role: ['invitado'], imageUrl: 'https://placehold.co/100x100?text=Invitado' },
];

// Configuración de cuotas
const configuracionCuotas = [
  { cuotas: 1, interes: 0 },
  { cuotas: 2, interes: 15 },
  { cuotas: 3, interes: 25 },
  { cuotas: 4, interes: 40 },
  { cuotas: 6, interes: 60 },
  { cuotas: 9, interes: 75 },
  { cuotas: 12, interes: 100 },
  { cuotas: 18, interes: 150 },
  { cuotas: 24, interes: 180 },
];

// Datos de choferes
const choferes = [
  { nombre: 'Vanesa Ferreira', patente: 'AD417CW', telefono: '11-3800-2078' },
  { nombre: 'Carolina Ferreira', patente: 'AD754DG', telefono: '11-6308-3159' },
  { nombre: 'Gustavo Ferreira', patente: 'AD614CN', telefono: '11-6592-2180' },
  { nombre: 'Higinio Ferreira', patente: 'AD812ST', telefono: '11-2894-5800' },
];

const Ventas = ({ carrito, onClearCart, currentUser }) => {

  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [cuotas, setCuotas] = useState([]);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(1);
  const [valorCuota, setValorCuota] = useState(0);
  const [ventaRealizada, setVentaRealizada] = useState(false);
  const [cargarPrimerCuota, setCargarPrimerCuota] = useState(false);
  const [entrega, setEntrega] = useState('sucursal');
  const [selectedChofer, setSelectedChofer] = useState(null);
  const [ventaDeOtro, setVentaDeOtro] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [usuarios] = useState(usuariosDB);

  const fechaActual = new Date().toLocaleDateString('es-AR');

  // Fecha Venta
  const [fechaVenta, setFechaVenta] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  });

  const location = useLocation();
  const navigate = useNavigate();

  const sucursal = location.state?.sucursal || 'Andes 4034';
  const subtotal = location.state?.subtotal || 0;

  //  ❌ SE QUITA ENVÍO AUTOMÁTICO EN RENDER (ROMPE TODO)
  //  👉 SE EJECUTA SOLO CUANDO LA VENTA SE CREA (más abajo)

  // Cargar Clientes
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

  // Filtrar clientes
  useEffect(() => {
    const filtered = clientes.filter(cliente =>
      cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.dni && cliente.dni.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  // Calcular cuotas
  useEffect(() => {
    if (subtotal <= 0 || isNaN(subtotal)) {
      setCuotas([{ mensaje: 'Por favor, ingrese un monto válido.' }]);
      setValorCuota(0);
      return;
    }

    const cuotasFiltradas = configuracionCuotas.filter(opcion => {
      if (opcion.cuotas === 1) return true;
      if (subtotal < 30000) return opcion.cuotas <= 2;
      if (subtotal < 80000) return opcion.cuotas <= 3;
      if (subtotal < 150000) return opcion.cuotas <= 6;
      if (subtotal < 250000) return opcion.cuotas <= 9;
      if (subtotal < 350000) return opcion.cuotas <= 12;
      if (subtotal < 500000) return opcion.cuotas <= 18;
      return true;
    });

    const resultados = cuotasFiltradas.map(({ cuotas, interes }) => {
      const montoConInteres = subtotal * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return {
        cuotas,
        montoCuota: montoCuota.toLocaleString('es-AR'),
        interes,
      };
    });

    setCuotas(resultados);

    const cuotaSeleccionadaObj = configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas) || { interes: 0 };
    const totalCredito = subtotal * (1 + cuotaSeleccionadaObj.interes / 100);
    const valorCuotaCalculado = Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000;
    setValorCuota(valorCuotaCalculado);

  }, [subtotal, cuotasSeleccionadas]);

  // -----------------------------------------------------------
  //               HANDLERS
  // -----------------------------------------------------------
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClienteChange = (e) => setSelectedCliente(e.target.value);
  const handleCuotasSeleccionadasChange = (e) => setCuotasSeleccionadas(Number(e.target.value));
  const handlePrimerCuotaChange = (e) => setCargarPrimerCuota(e.target.value === 'sí');
  const handleEntregaChange = (e) => {
    setEntrega(e.target.value);
    if (e.target.value === 'domicilio') setSelectedChofer(choferes[0]);
    else setSelectedChofer(null);
  };
  const handleChoferChange = (e) => {
    const chofer = choferes.find(c => c.nombre === e.target.value);
    setSelectedChofer(chofer);
  };
  const handleVentaDeOtroChange = (e) => setVentaDeOtro(e.target.checked);
  const handleSelectedVendedorChange = (e) => setSelectedVendedor(e.target.value);
  const handleFechaVentaChange = (e) => setFechaVenta(e.target.value);

  // -----------------------------------------------------------
  //             REALIZAR VENTA COMPLETA + COMPROBANTE
  // -----------------------------------------------------------
  const handleRealizarVenta = async () => {
    try {

      if (!selectedCliente) return alert('Por favor, selecciona un cliente.');
      if (!cuotasSeleccionadas) return alert('Por favor, selecciona cuotas.');
      if (entrega === 'domicilio' && !selectedChofer)
        return alert('Selecciona un chofer.');

      const vendedor = ventaDeOtro && selectedVendedor
        ? selectedVendedor
        : currentUser.username;

      const cuotaSeleccionadaObj =
        configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas) || { interes: 0 };

      const totalCredito = subtotal * (1 + cuotaSeleccionadaObj.interes / 100);
      const valorCuotaCalculado =
        Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000;

      const ventasCollection = collection(db, 'ventas');

      const ahora = new Date();
      const [year, month, day] = fechaVenta.split('-');
      const fechaConHora = new Date(
        year,
        month - 1,
        day,
        ahora.getHours(),
        ahora.getMinutes(),
        ahora.getSeconds()
      );

      const venta = {
        clienteId: selectedCliente,
        sucursal,
        productos: carrito,
        cuotas: cuotasSeleccionadas,
        fecha: fechaConHora,
        totalCredito,
        valorCuota: valorCuotaCalculado,
        pagos: [],
        vendedor,
        entrega,
        chofer: entrega === 'domicilio' ? selectedChofer : null
      };

      // Guardar venta
      const ventaRef = await addDoc(ventasCollection, venta);

      // ╔══════════════════════════════════════════╗
      // ║     ENVÍO AUTOMÁTICO - FORMATO B         ║
      // ╚══════════════════════════════════════════╝

      const clienteReal = clientes.find(c => c.id === selectedCliente);

      if (clienteReal) {
        const datosCliente = {
          nombre: clienteReal.nombreCompleto || "Cliente",
          dni: clienteReal.dni || "Sin DNI",
          direccion: clienteReal.direccion || "",
          entrecalles: clienteReal.entrecalles || "",
          localidad: clienteReal.localidad || "",
          telefono1: clienteReal.telefono1 || "",
          telefono2: clienteReal.telefono2 || ""
        };

        const ventaParaTicket = {
          ...venta,
          id: ventaRef.id
        };

        const comprobanteTexto = generarComprobanteVentaTipoB(
          datosCliente,
          ventaParaTicket
        );

        const telefonoCliente =
          clienteReal.telefono1 ||
          clienteReal.telefono2 ||
          null;

        if (telefonoCliente) {
          enviarComprobanteWhatsApp(telefonoCliente, comprobanteTexto);
        }
      }

      // FIN ENVÍO AUTOMÁTICO

      // Actualizar stock
      for (const producto of carrito) {
        try {
          if (!producto.categoriaId) continue;

          const productoRef = doc(
            db,
            `categorias/${producto.categoriaId}/productos`,
            producto.id
          );

          let fieldKey = null;
          if (producto.sucursal === 'Andes4034') fieldKey = 'cantidadDisponibleAndes4034';
          else if (producto.sucursal === 'Andes4320') fieldKey = 'cantidadDisponibleAndes4320';

          const stockActual = parseInt(producto[fieldKey]);
          const stockNuevo = stockActual - producto.cantidad;

          if (stockNuevo < 0) {
            alert(`Stock insuficiente para ${producto.nombre}.`);
            continue;
          }

          await updateDoc(productoRef, { [fieldKey]: stockNuevo });

        } catch (err) {
          console.error(err);
        }
      }

      // Primer pago automático
      if (cargarPrimerCuota) {
        const fechaPago = new Date().toISOString().split('T')[0];
        const pagoInicial = [
          {
            fecha: fechaPago,
            monto: valorCuotaCalculado,
            usuario: currentUser.username
          }
        ];
        await updateDoc(ventaRef, { pagos: pagoInicial });
      }

      setVentaRealizada(true);
      onClearCart();
      alert('Venta realizada con éxito.');
      navigate('/clientes');

    } catch (error) {
      console.error(error);
      alert('Error al realizar la venta.');
    }
  };

  // -----------------------------------------------------------
  // FUNCIÓN: ENVIAR MENSAJE WHATSAPP
  // -----------------------------------------------------------
  function enviarComprobanteWhatsApp(telefono, mensaje) {
    const numero = telefono.replace(/[^0-9]/g, "");
    const texto = encodeURIComponent(mensaje);
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  }

  // -----------------------------------------------------------
  // FUNCIÓN: GENERAR COMPROBANTE TIPO B
  // -----------------------------------------------------------
  function generarComprobanteVentaTipoB(datosCliente, venta) {

    const {
      nombre,
      dni,
      direccion,
      entrecalles,
      localidad,
      telefono1,
      telefono2
    } = datosCliente;

    const {
      sucursal,
      productos,
      cuotas,
      valorCuota,
      vendedor,
      entrega,
      chofer,
      fecha
    } = venta;

    const fechaFormateada = new Date(fecha).toLocaleDateString("es-AR");

    const cuotaRedondeada = Math.round(valorCuota / 1000) * 1000;

    const totalProductos = productos.reduce((acc, p) => {
      const precioUnit = Math.round(p.precio / 1000) * 1000;
      return acc + precioUnit * (p.cantidad || 1);
    }, 0);

    // Detectar si la primera cuota fue pagada
    const pagoPrimeraCuota =
      cargarPrimerCuota || (venta.pagos && venta.pagos.length > 0)
        ? " Sí, abonó la primera cuota"
        : " No, está pendiente el pago";

    const productosTexto = productos.map(p => {
      const precioUnit = Math.round(p.precio / 1000) * 1000;
      const subtotal = precioUnit * (p.cantidad || 1);

      return `
 Producto: ${p.nombre}
 Cantidad: ${p.cantidad}`;
    }).join("\n");

    return `
 *COMPROBANTE DE VENTA*

 *ID de Venta:* ${venta.id}

 *Sucursal:* ${sucursal}
 *Fecha:* ${fechaFormateada}

 *Cliente:* ${nombre}
 *DNI:* ${dni}

 *Dirección:* ${direccion || "No informado"}
 *Entre calles:* ${entrecalles || "No informado"}
 *Localidad:* ${localidad || "No informado"}

 *Teléfonos:*
${telefono1 ? `- ${telefono1}` : ""}
${telefono2 ? `- ${telefono2}` : ""}

---------------------------------------
 *Detalle de productos:*
---------------------------------------
${productosTexto}

 *Cuotas:* ${cuotas} cuotas de $${cuotaRedondeada.toLocaleString("es-AR")}

*Pago primera cuota:* ${pagoPrimeraCuota}

 *Vendedor:* ${vendedor}

 *Entrega:* ${entrega === 'domicilio' ? 'A domicilio ' : 'Retira en local '}
${entrega === 'domicilio' && chofer ? ` *Chofer:* ${chofer.nombre}` : ""}

 *¡Gracias por su compra!* 
`;
  }

  return (
    <div className="ventas">
      {ventaRealizada && <div className="alert alert-success">¡Venta realizada con éxito!</div>}
      <div className="1">
        <h2>Realizar Venta</h2>

        <div className="form-group">
          <label htmlFor="fechaVenta">Fecha de la Venta:</label>
          <input
            id="fechaVenta"
            type="date"
            className="form-control input-corto"
            value={fechaVenta}
            onChange={handleFechaVentaChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Buscador y selección de cliente */}
        <div className="form-group">
          <label htmlFor="cliente-buscador">Buscar Cliente por DNI o Nombre:</label>
          <input
            id="cliente-buscador"
            type="text"
            className="form-control input-corto"
            placeholder="Buscar por DNI o Nombre"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cliente">Seleccionar Cliente:</label>
          <select
            id="cliente"
            className="form-control input-corto"
            value={selectedCliente}
            onChange={handleClienteChange}
          >
            <option value="">-- Selecciona un Cliente --</option>
            {filteredClientes.map((cliente, index) => (
              <option key={`${cliente.id}-${index}`} value={cliente.id}>
                {cliente.nombreCompleto}
              </option>
            ))}
          </select>
        </div>

        {/* Venta de otro usuario (solo para roles jefe o encargado) */}
        {currentUser.role?.some(r => ['jefe', 'encargado'].includes(r)) && (
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={ventaDeOtro}
                onChange={handleVentaDeOtroChange}
                className="form-check-input"
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              Venta de otro
            </label>

            {ventaDeOtro && (
              <select
                className="form-control mt-2 input-corto"
                value={selectedVendedor}
                onChange={handleSelectedVendedorChange}
              >
                <option value="">-- Selecciona un Vendedor --</option>
                {usuarios.map((usuario, index) => (
                  <option key={`${usuario.username}-${index}`} value={usuario.username}>
                    {usuario.username}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Selección de cuotas */}
        <div className="form-group">
          <label htmlFor="cuotasSeleccionadas">Seleccionar Cantidad de Cuotas:</label>
          <select
            id="cuotasSeleccionadas"
            className="form-control input-corto"
            value={cuotasSeleccionadas}
            onChange={handleCuotasSeleccionadasChange}
          >
            <option value="">-- Selecciona las Cuotas --</option>
            {cuotas.map((opcion, index) => (
              <option key={`${opcion.cuotas}-${index}`} value={opcion.cuotas}>
                {opcion.cuotas} cuota{opcion.cuotas > 1 ? 's' : ''} de ${opcion.montoCuota} por mes
              </option>
            ))}
          </select>
        </div>

        {/* Cargar primer cuota */}
        <div className="form-group">
          <label htmlFor="cargarPrimerCuota">Cargar Primer Cuota:</label>
          <select
            id="cargarPrimerCuota"
            className="form-control input-corto"
            value={cargarPrimerCuota ? 'sí' : 'no'}
            onChange={handlePrimerCuotaChange}
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
            className="form-control input-corto"
            value={entrega}
            onChange={handleEntregaChange}
          >
            <option value="sucursal">Retira en Sucursal</option>
            <option value="domicilio">Envío a Domicilio</option>
          </select>
        </div>

        {/* Selección de chofer (solo si entrega a domicilio) */}
        {entrega === 'domicilio' && (
          <div className="form-group">
            <label htmlFor="chofer">Seleccionar Chofer:</label>
            <select
              id="chofer"
              className="form-control input-corto"
              value={selectedChofer ? selectedChofer.nombre : ''}
              onChange={handleChoferChange}
            >
              <option value="">-- Selecciona un Chofer --</option>
              {choferes.map((chofer, index) => (
                <option key={`${chofer.nombre}-${index}`} value={chofer.nombre}>
                  {chofer.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="2">
        {/* Productos en el carrito */}
        <h3>Productos en Carrito</h3>
        <div className="card-container">
          {carrito.map(producto => (
            <div className="card" key={producto.id}>
              <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{producto.nombre}</h5>
                <p className="card-text">Precio: ${producto.precio.toLocaleString('es-AR')}</p>
                <p className="card-text">Cantidad: {producto.cantidad}</p>
                <p className="card-text">
                  Subtotal: ${(producto.precio * producto.cantidad).toLocaleString('es-AR')}
                </p>
                <p className="card-text">
                  Total Crédito: $
                  {(
                    subtotal *
                    (1 +
                      (configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas)?.interes || 0) /
                      100)
                  ).toLocaleString('es-AR')}
                </p>
                <p className="card-text">Valor de Cada Cuota: ${valorCuota.toLocaleString('es-AR')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Botón realizar venta */}
        <button
          className="btn btn-primary mt-4"
          onClick={handleRealizarVenta}
          disabled={!selectedCliente || cuotasSeleccionadas === ''}
        >
          Realizar Venta
        </button>
      </div>
    </div>
  );
}

export default Ventas;
