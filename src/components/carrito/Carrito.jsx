import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Carrito.css';

const Carrito = ({ productos, onRemoveFromCart, onClearCart, currentUser }) => {
  const [hayProductosSinStock, setHayProductosSinStock] = useState(false);
  const [descuento, setDescuento] = useState(0);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState('');
  const [metodoEntrega, setMetodoEntrega] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [localidadEnvio, setLocalidadEnvio] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [formularioConfirmado, setFormularioConfirmado] = useState(false);
  const navigate = useNavigate();
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    dni: '',
    direccion: '',
    numero: '',
    entreCalles: '',
    telefono1: '',
    telefono2: ''
  });

  const configuracionCuotas = [
    { cuotas: 2, interes: 15 },
    { cuotas: 3, interes: 25 },
    { cuotas: 4, interes: 40 },
    { cuotas: 6, interes: 60 },
    { cuotas: 9, interes: 75 },
    { cuotas: 12, interes: 100 }/* ,
    { cuotas: 18, interes: 150 },
    { cuotas: 24, interes: 180 } */
  ];

  useEffect(() => {
    const verificarStock = () => {
      const haySinStock = productos.some(producto => {
        const stockField = `cantidadDisponible${producto.sucursal.replace(/\s/g, '')}`;
        return producto[stockField] === 0 || producto[stockField] === undefined;
      });
      setHayProductosSinStock(haySinStock);
    };
    verificarStock();
  }, [productos]);

  const subtotal = productos.reduce((acc, producto) => {
    const totalProducto = producto.precio * producto.cantidad || 0;
    return acc + totalProducto;
  }, 0);

  const subtotalConDescuento = subtotal - (subtotal * descuento) / 100;

  const cuotasDisponibles = [
    { cuotas: 1, interes: 0 }, // Siempre disponible
    ...configuracionCuotas.filter(({ cuotas }) => {
      if (subtotal < 30000) return cuotas <= 2;
      if (subtotal >= 30000 && subtotal < 80000) return cuotas <= 3;
      if (subtotal >= 80000 && subtotal < 150000) return cuotas <= 6;
      if (subtotal >= 150000 && subtotal < 250000) return cuotas <= 9;
      if (subtotal >= 250000 && subtotal < 350000) return cuotas <= 12;
      if (subtotal >= 350000 && subtotal < 500000) return cuotas <= 18;
      return true;
    })
  ];

  const handleConfirmarFormulario = () => {
    if (!cuotaSeleccionada) return alert('Seleccioná una cantidad de cuotas.');
    if (!metodoEntrega) return alert('Seleccioná un método de entrega.');

    if (metodoEntrega === 'retiro' && !sucursalSeleccionada) {
      return alert('Seleccioná una sucursal.');
    }

    if (metodoEntrega === 'envio') {
      if (!direccionEnvio || !localidadEnvio || !telefonoContacto) {
        return alert('Completá todos los datos de envío.');
      }
    }

    setMostrarModalDatos(true); // ← abrir modal
  };

  const handleConfirmarDatosCliente = () => {
    if (!datosCliente.nombre || !datosCliente.dni || !datosCliente.direccion || !datosCliente.numero || !datosCliente.telefono1) {
      return alert('Completá todos los datos obligatorios del cliente.');
    }

    setMostrarModalDatos(false);
    setFormularioConfirmado(true);
  };

  const handlePedirWhatsapp = () => {
    let cuotaObj;
    let montoCuota;

    if (parseInt(cuotaSeleccionada) === 1) {
      cuotaObj = { cuotas: 1, interes: 0 };
      montoCuota = subtotalConDescuento;
    } else {
      cuotaObj = cuotasDisponibles.find(c => c.cuotas === parseInt(cuotaSeleccionada));
      const montoConInteres = subtotalConDescuento * (1 + cuotaObj.interes / 100);
      montoCuota = Math.round(montoConInteres / cuotaObj.cuotas / 1000) * 1000;
    }

    const totalCompra = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    let mensaje = `Hola, quiero hacer un pedido:\n\n*PRODUCTOS*\n`;
    productos.forEach(p => {
      mensaje += `- ${p.nombre} x${p.cantidad} - $${(p.precio * p.cantidad).toLocaleString('es-AR')}\n`;
    });

    mensaje += `\n*TOTAL:* $${totalCompra.toLocaleString('es-AR')}\n`;
    mensaje += `*${cuotaObj.cuotas} cuotas de:* $${montoCuota.toLocaleString('es-AR')}\n`;

    if (metodoEntrega === 'retiro') {
      mensaje += `\n*Entrega:* Retiro por sucursal: ${sucursalSeleccionada}`;
    } else {
      mensaje += `\n*Entrega:* Envío a domicilio`;
      mensaje += `\nDirección: ${direccionEnvio}`;
      mensaje += `\nLocalidad: ${localidadEnvio}`;
      mensaje += `\nTeléfono: ${telefonoContacto}`;
    }

    mensaje += `\n\n*DATOS DEL CLIENTE:*\n`;
    mensaje += `Nombre: ${datosCliente.nombre}\n`;
    mensaje += `DNI: ${datosCliente.dni}\n`;
    mensaje += `Dirección: ${datosCliente.direccion} ${datosCliente.numero}\n`;
    mensaje += `Entre calles: ${datosCliente.entreCalles}\n`;
    mensaje += `Teléfono 1: ${datosCliente.telefono1}\n`;
    if (datosCliente.telefono2) {
      mensaje += `Teléfono 2: ${datosCliente.telefono2}\n`;
    }

    if (metodoEntrega === 'envio') {
      const direccionCompleta = `${direccionEnvio} ${datosCliente.numero}, ${localidadEnvio}`;
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;
      mensaje += `\n\n📍 Ubicación en Google Maps: ${mapsLink}`;
      mensaje += `\n\n📲 *POR FAVOR COMPARTIR UBICACIÓN PARA UNA ENTREGA MÁS PRECISA*`;
    }

    const numeroWhatsapp = '5491159781434';
    const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');

  };

  const handleFinalizarCompra = () => {
    if (hayProductosSinStock) {
      alert('No puedes finalizar la compra, hay productos sin stock.');
      return;
    }
    const sucursal = productos.length > 0 ? productos[0].sucursal : '';
    navigate('/ventas', { state: { subtotal: subtotalConDescuento, productos, sucursal } });
  };

  const esInvitado = currentUser?.role === 'invitado' || currentUser?.role?.includes('invitado');
  const puedeAplicarDescuento = ['jefe', 'encargado', 'vendedor'].some(r => currentUser?.role?.includes?.(r) || currentUser?.role === r);

  return (
    <div className="carrito">
      <h2>Carrito</h2>

      {/* PRODUCTOS */}
      <div className="card-container">
        {productos.map(producto => {
          const stockField = `cantidadDisponible${producto.sucursal.replace(/\s/g, '')}`;
          const stock = producto[stockField] || 0;
          const outOfStock = stock === 0;

          return (
            <div key={producto.id} className={`card ${outOfStock ? 'producto-sin-stock' : ''}`}>
              <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
              <div className="card-body">
                <h5>{producto.nombre}</h5>
                <p>Precio: ${producto.precio.toLocaleString('es-AR')}</p>
                <p>Cantidad: {producto.cantidad}</p>
                <p>Sucursal: {producto.sucursal}</p>
                <p>Subtotal: ${(producto.precio * producto.cantidad).toLocaleString('es-AR')}</p>
                <button
                  className="btn btn-danger mt-2"
                  onClick={() => onRemoveFromCart(producto.id)}
                  disabled={outOfStock}
                >
                  <i className='bx bxs-trash-alt'></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RESUMEN */}
      <h3>Resumen del Pedido</h3>
      <p><strong>Subtotal sin descuento:</strong> ${subtotal.toLocaleString('es-AR')}</p>
      <p><strong>Subtotal con descuento:</strong> ${subtotalConDescuento.toLocaleString('es-AR')}</p>

      {/* DESCUENTO (sólo para roles autorizados) */}
      {!esInvitado && puedeAplicarDescuento && (
        <>
          <label><strong>Descuento:</strong></label>
          <select className="form-select mt-2 mb-3" value={descuento} onChange={(e) => setDescuento(Number(e.target.value))}>
            <option value={0}>Sin descuento</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
          </select>
          <button
            className={`btn btn-primary mt-4 ${hayProductosSinStock ? 'boton-deshabilitado' : ''}`}
            onClick={handleFinalizarCompra}
            disabled={hayProductosSinStock}
          >
            Terminar Venta
          </button>
        </>
      )}

      {/* INVITADO: FORMULARIO COMPLETO */}
      {esInvitado && (
        <>
          <label><strong>Cuotas:</strong></label>
          <select
            className="form-select mt-2"
            value={cuotaSeleccionada}
            onChange={(e) => setCuotaSeleccionada(e.target.value)}
            disabled={formularioConfirmado}
          >
            <option value="">-- Seleccioná cuotas --</option>
            {cuotasDisponibles.map(c => {
              const montoConInteres = subtotalConDescuento * (1 + c.interes / 100);
              const montoCuota = Math.round(montoConInteres / c.cuotas / 1000) * 1000;
              return (
                <option key={c.cuotas} value={c.cuotas}>
                  {c.cuotas === 1
                    ? `1 pago sin interés de $${montoCuota.toLocaleString('es-AR')}`
                    : `${c.cuotas} cuotas de $${montoCuota.toLocaleString('es-AR')}`}
                </option>
              );
            })}
          </select>

          <label className="mt-3"><strong>¿Cómo querés recibir el pedido?</strong></label>
          <div className="form-check">
            <input
              type="radio"
              id="retiro"
              className="form-check-input"
              value="retiro"
              checked={metodoEntrega === 'retiro'}
              onChange={() => setMetodoEntrega('retiro')}
              disabled={formularioConfirmado}
            />
            <label className="form-check-label" htmlFor="retiro">Retiro por sucursal</label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              id="envio"
              className="form-check-input"
              value="envio"
              checked={metodoEntrega === 'envio'}
              onChange={() => {
                setMetodoEntrega('envio');
                setSucursalSeleccionada('');
              }}
              disabled={formularioConfirmado}
            />
            <label className="form-check-label" htmlFor="envio">Envío a domicilio</label>
          </div>

          {metodoEntrega === 'retiro' && (
            <div className="mt-2">
              <label><strong>Sucursal:</strong></label>
              <select
                className="form-select"
                value={sucursalSeleccionada}
                onChange={(e) => setSucursalSeleccionada(e.target.value)}
                disabled={formularioConfirmado}
              >
                <option value="">-- Seleccioná sucursal --</option>
                <option value="Los Andes 4320">Los Andes 4320</option>
                <option value="Los Andes 4034">Los Andes 4034</option>
              </select>
            </div>
          )}

          {metodoEntrega === 'envio' && (
            <div className="mt-2">
              <label>Dirección:</label>
              <input
                type="text"
                className="form-control"
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
                disabled={formularioConfirmado}
              />
              <label className="mt-2">Localidad:</label>
              <input
                type="text"
                className="form-control"
                value={localidadEnvio}
                onChange={(e) => setLocalidadEnvio(e.target.value)}
                disabled={formularioConfirmado}
              />
              <label className="mt-2">Teléfono:</label>
              <input
                type="text"
                className="form-control"
                value={telefonoContacto}
                onChange={(e) => setTelefonoContacto(e.target.value)}
                disabled={formularioConfirmado}
              />
            </div>
          )}

          {!formularioConfirmado && (
            <button
              className="btn btn-primary mt-3"
              onClick={handleConfirmarFormulario}
              disabled={hayProductosSinStock}
            >
              Confirmar Pedido
            </button>
          )}

          {formularioConfirmado && (
            <button
              className="btn btn-success mt-3"
              onClick={handlePedirWhatsapp}
            >
              Enviar por WhatsApp
            </button>
          )}

        </>
      )}

      {mostrarModalDatos && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h4>Datos del Cliente</h4>
            <input className="form-control my-1" placeholder="Nombre completo" value={datosCliente.nombre} onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })} />
            <input className="form-control my-1" placeholder="DNI" value={datosCliente.dni} onChange={(e) => setDatosCliente({ ...datosCliente, dni: e.target.value })} />
            <input className="form-control my-1" placeholder="Dirección" value={datosCliente.direccion} onChange={(e) => setDatosCliente({ ...datosCliente, direccion: e.target.value })} />
            <input className="form-control my-1" placeholder="Número de casa" value={datosCliente.numero} onChange={(e) => setDatosCliente({ ...datosCliente, numero: e.target.value })} />
            <input className="form-control my-1" placeholder="Entre calles" value={datosCliente.entreCalles} onChange={(e) => setDatosCliente({ ...datosCliente, entreCalles: e.target.value })} />
            <input className="form-control my-1" placeholder="Teléfono 1" value={datosCliente.telefono1} onChange={(e) => setDatosCliente({ ...datosCliente, telefono1: e.target.value })} />
            <input className="form-control my-1" placeholder="Teléfono 2 (opcional)" value={datosCliente.telefono2} onChange={(e) => setDatosCliente({ ...datosCliente, telefono2: e.target.value })} />

            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-secondary" onClick={() => setMostrarModalDatos(false)}>Cancelar</button>
              <button className="btn btn-success" onClick={handleConfirmarDatosCliente}>Confirmar Datos</button>
            </div>
          </div>
        </div>
      )}


      <button className="btn btn-danger mt-4" onClick={onClearCart}>
        Vaciar Carrito
      </button>
    </div>
  );
};

export default Carrito;
