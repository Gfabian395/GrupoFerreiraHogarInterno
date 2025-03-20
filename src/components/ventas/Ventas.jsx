import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Ventas.css';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F5.png?alt=media&token=9530608a-7cc2-4807-bd6f-d2ce55c29c0a' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F11.png?alt=media&token=b83cafcc-a9bb-4ae0-9609-2e8f65c95d10' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yuli182', password: '244962', role: 'encargado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Gustavito02', password: '36520975', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor', imageUrl: 'path/to/EliasG.jpg' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor', imageUrl: 'path/to/MicaelaG.jpg' },
  { username: 'prueba', password: 'prueba', role: 'vendedor', imageUrl: 'path/to/prueba.jpg' },
];

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
  // Estado para habilitar la opción de "Venta de otro usuario"
  const [ventaDeOtro, setVentaDeOtro] = useState(false);

  // Estado para guardar el vendedor seleccionado
  const [selectedVendedor, setSelectedVendedor] = useState('');

  // Estado para cargar la lista de usuarios (solo si el rol es jefe o encargado)
  const [usuarios, setUsuarios] = useState(usuariosDB);

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

      // Determinar el vendedor dinámicamente
      const vendedor = ventaDeOtro && selectedVendedor ? selectedVendedor : currentUser.username;
      console.log('Venta realizada por:', vendedor);

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
        vendedor, // Usar el vendedor determinado dinámicamente
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
        const fechaPago = ahora.toISOString().split('T')[0];
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

  // Cargar la lista de usuarios si el rol es jefe o encargado
  /*  useEffect(() => {
     if (['jefe', 'encargado'].includes(currentUser.role)) {
       const fetchUsuarios = async () => {
         try {
           console.log('[DEBUG] Intentando obtener la colección usuarios desde Firebase...');
           const usuariosCollection = collection(db, 'usuarios'); // Verifica la referencia
           const usuariosSnapshot = await getDocs(usuariosCollection);
   
           console.log('[DEBUG] Snapshot de usuarios obtenido:', usuariosSnapshot);
   
           if (!usuariosSnapshot.empty) {
             const usuariosList = usuariosSnapshot.docs.map((doc) => {
               console.log('[DEBUG] Documento de usuario:', doc.data()); // Log de cada documento
               return { id: doc.id, ...doc.data() };
             });
   
             setUsuarios(usuariosList);
             console.log('[DEBUG] Lista de usuarios procesada:', usuariosList);
           } else {
             console.warn('[DEBUG] La colección usuarios está vacía.');
             setUsuarios([]); // Previene errores con arrays vacíos
           }
         } catch (error) {
           console.error('[ERROR] Ocurrió un problema al obtener los usuarios desde Firebase:', error);
         }
       };
   
       fetchUsuarios();
     }
   }, [currentUser]); */

  {
    ['jefe', 'encargado'].includes(currentUser.role) && (
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={ventaDeOtro}
            onChange={(e) => setVentaDeOtro(e.target.checked)}
            className="form-check-input"
          />
          Venta de otro
        </label>

        {ventaDeOtro && (
          <select
            value={selectedVendedor}
            onChange={(e) => setSelectedVendedor(e.target.value)}
            className="form-control mt-2"
          >
            <option value="">-- Selecciona un Vendedor --</option>
            {usuarios.map((usuario) => (
              <option key={usuario.username} value={usuario.username}>
                {usuario.nombreCompleto || usuario.username}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }


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

      {/* Venta de otro usuario (solo para jefe o encargado) */}
      {['jefe', 'encargado'].includes(currentUser.role) && (
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={ventaDeOtro}
              onChange={(e) => setVentaDeOtro(e.target.checked)}
              className="form-check-input small-checkbox"
              style={{ width: '20px', height: '20px', padding: '0' }}
            />
            Venta de otro
          </label>

          {ventaDeOtro && (
            <select
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="form-control mt-2"
            >
              <option value="">-- Selecciona un Vendedor --</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id || usuario.username} value={usuario.username}>
                  {usuario.nombreCompleto || usuario.username}
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
