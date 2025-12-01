import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import Load from '../load/Load';
import './ClienteDetalles.css';

const configuracionCuotas = [
  { cuotas: 1, interes: 0 },
  { cuotas: 2, interes: 15 },
  { cuotas: 3, interes: 25 },
  { cuotas: 4, interes: 40 },
  { cuotas: 6, interes: 60 },
  { cuotas: 9, interes: 75 },
  { cuotas: 12, interes: 100 },
  { cuotas: 18, interes: 150 },
  { cuotas: 24, interes: 180 }
];

const calcularCuotaConInteres = (monto, cuotas) => {
  const config = configuracionCuotas.find(c => c.cuotas === cuotas);
  const interes = config ? config.interes : 0;
  const montoConInteres = monto * (1 + interes / 100);
  const cuotaSinRedondeo = montoConInteres / cuotas;
  const cuotaRedondeada = Math.round(cuotaSinRedondeo / 1000) * 1000;
  return { cuotaRedondeada, montoConInteres };
};

const ClienteDetalles = ({ currentUser }) => {
  const { clienteId } = useParams();
  const location = useLocation();
  const [clienteDireccion, setClienteDireccion] = useState('');

  const [expandedVentas, setExpandedVentas] = useState({});
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState(null);

  const ventaRefs = useRef({});
  const fechaRef = useRef(null);
  const montoRef = useRef(null);

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteBloqueado, setClienteBloqueado] = useState(false);

  const [expandir, setExpandir] = useState({});

  // ===========================
  //   CARGAR VENTAS DEL CLIENTE
  // ===========================
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const ventasQuery = query(
          collection(db, 'ventas'),
          where('clienteId', '==', clienteId)
        );

        const ventasSnapshot = await getDocs(ventasQuery);
        const ventasList = ventasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setVentas(ventasList);

        // ID de venta enviada desde Home o URL
        const queryParams = new URLSearchParams(location.search);
        const ventaIdDesdeURL = queryParams.get("venta");
        const ventaIdDesdeState = location.state?.ventaId;

        const ventaIdSeleccionada = ventaIdDesdeURL || ventaIdDesdeState;

        if (ventaIdSeleccionada) {
          setTimeout(() => {
            setVentaSeleccionadaId(ventaIdSeleccionada);

            const ref = ventaRefs.current[ventaIdSeleccionada];
            if (ref) {
              ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            setTimeout(() => setVentaSeleccionadaId(null), 3000);
          }, 500);
        }
      } catch (error) {
        console.error("Error fetching ventas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, [clienteId, location.search, location.state]);

  // ===========================
  //   CARGAR DATOS DEL CLIENTE
  // ===========================
  useEffect(() => {
    const obtenerEstadoCliente = async () => {
      try {
        const clienteRef = doc(db, 'clientes', clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
          const clienteData = clienteSnap.data();

          setClienteBloqueado(clienteData.bloqueado || false);
          setClienteNombre(clienteData.nombreCompleto || '');
          setClienteTelefono(
            clienteData.telefono1 ||
            clienteData.telefono2 ||
            ''
          );
          setClienteDireccion(
            clienteData.direccion ||
            clienteData.domicilio ||
            clienteData.barrio ||
            clienteData.calle ||
            ''
          );

        }
      } catch (error) {
        console.error("Error al obtener estado del cliente:", error);
      }
    };

    obtenerEstadoCliente();
  }, [clienteId]);

  // ===========================
  //   BLOQUEAR / DESBLOQUEAR
  // ===========================
  const handleToggleBloqueo = async () => {
    if (clienteBloqueado) {
      const password = prompt('Ingrese la contraseña para desbloquear al cliente:');
      if (password !== '031285') {
        alert('Contraseña incorrecta. No se desbloqueó el cliente.');
        return;
      }
    }

    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      await updateDoc(clienteRef, { bloqueado: !clienteBloqueado });
      setClienteBloqueado(!clienteBloqueado);
    } catch (error) {
      console.error('Error al cambiar estado de bloqueo:', error);
      alert('No se pudo actualizar el estado del cliente');
    }
  };

  // ===========================
  //     CAMBIAR CANTIDAD DE CUOTAS
  // ===========================
  const handleCuotasChange = async (ventaId, nuevasCuotas) => {
    if (nuevasCuotas < 1) {
      alert("La cantidad de cuotas debe ser al menos 1");
      return;
    }

    const password = prompt('Ingrese la contraseña para modificar las cuotas:');
    if (password !== '031285') {
      alert('Contraseña incorrecta. No se actualizó la cantidad de cuotas.');
      return;
    }

    try {
      const venta = ventas.find(v => v.id === ventaId);

      const montoBase = venta.productos.reduce(
        (acc, p) => acc + p.precio * (p.cantidad || 1),
        0
      );

      const { montoConInteres } = calcularCuotaConInteres(montoBase, nuevasCuotas);
      const totalConInteres = Math.round(montoConInteres / 1000) * 1000;

      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, {
        cuotas: nuevasCuotas,
        totalCredito: totalConInteres
      });

      setVentas(prev =>
        prev.map(v =>
          v.id === ventaId
            ? { ...v, cuotas: nuevasCuotas, totalCredito: totalConInteres }
            : v
        )
      );

      alert('Cantidad de cuotas actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando cuotas:', error);
      alert('No se pudo actualizar la cantidad de cuotas');
    }
  };

  // ===========================
  //        AGREGAR PAGO
  // ===========================
  const agregarPago = async (ventaId, e) => {
    e.preventDefault();

    const fecha = e.target.fecha.value;
    let monto = Number(e.target.monto.value);

    const venta = ventas.find(v => v.id === ventaId);

    // Total crédito redondeado
    const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;

    // Total pagos ya realizados
    const totalPagos = venta.pagos
      ? venta.pagos.reduce(
        (acc, pago) => acc + Math.round(Number(pago.monto) / 1000) * 1000,
        0
      )
      : 0;

    // Saldo disponible
    const saldo = totalCredito - totalPagos;

    if (monto > saldo) monto = saldo;

    const nuevoPago = {
      fecha,
      monto: Math.round(monto / 1000) * 1000,
      usuario: currentUser?.username || "Desconocido"
    };

    const nuevosPagos = [...(venta.pagos || []), nuevoPago];

    try {
      const ventaRef = doc(db, "ventas", ventaId);
      await updateDoc(ventaRef, { pagos: nuevosPagos });

      setVentas(prev =>
        prev.map(v =>
          v.id === ventaId ? { ...v, pagos: nuevosPagos } : v
        )
      );

      // Obtener cliente
      const clienteRef = doc(db, "clientes", clienteId);
      const clienteSnap = await getDoc(clienteRef);
      const cliente = clienteSnap.exists() ? clienteSnap.data() : null;

      const datosCliente = {
        nombre: cliente?.nombreCompleto || "Cliente",
        dni: cliente?.dni || clienteId,
      };

      // Crear comprobante
      const pagoGenerado = {
        fecha,
        monto: Math.round(monto / 1000) * 1000,
        usuario: currentUser?.username || "Desconocido",
      };

      const ticket = generarComprobantePago(
        datosCliente,
        { ...venta, pagos: nuevosPagos },
        pagoGenerado
      );

      const telefonoCliente = cliente?.telefono1 || cliente?.telefono2 || null;

      if (telefonoCliente) {
        enviarComprobanteWhatsApp(telefonoCliente, ticket);
      }

      e.target.reset();
      alert("Pago registrado con éxito");

    } catch (error) {
      console.error("Error actualizando pago: ", error);
      alert("Ocurrió un error guardando el pago");
    }
  };

  // ===========================
  //  WHATSAPP
  // ===========================
  const enviarComprobanteWhatsApp = (telefono, texto) => {
    const mensaje = encodeURIComponent(texto);
    const url = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(url, "_blank");
  };

  // ===========================
  //  GENERAR COMPROBANTE
  // ===========================
  const generarComprobantePago = (cliente, venta, pago) => {
    const totalPagado = venta.pagos.reduce((a, p) => a + p.monto, 0);
    const saldoRestante = venta.totalCredito - totalPagado;
    const saldoMostrado = Math.max(0, saldoRestante);

    return `
*COMPROBANTE DE PAGO*

*Venta:* ${venta.id}

*Cliente:* ${cliente.nombre}
*DNI:* ${cliente.dni}

*Producto(s):* ${venta.productos.map(p =>
      `${p.nombre} x${p.cantidad}`
    ).join(", ")}

*Pago realizado:*
*Fecha:* ${new Date(pago.fecha).toLocaleDateString('es-AR')}
*Monto:* $${pago.monto.toLocaleString('es-AR')}

*Total Pagado:* $${totalPagado.toLocaleString('es-AR')}
*Saldo Restante:* $${saldoMostrado.toLocaleString("es-AR")}
*Atendido por:* ${pago.usuario}

*Muchas gracias por su pago. :)*
  `;
  };

  // ===========================
  //   RECORDATORIO DE CUOTA
  // ===========================
  const generarRecordatorioCuota = (venta) => {
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];

    const mesActual = meses[new Date().getMonth()];
    const producto = venta.productos?.[0]?.nombre || "su compra";

    const montoCuota = Math.round(
      venta.totalCredito / venta.cuotas / 1000
    ) * 1000;

    return `
Este es un mensaje automático.

Le recordamos que su cuota del mes de *${mesActual}* del producto *${producto}*
está próxima a vencer.

El monto es *$${montoCuota.toLocaleString("es-AR")}*.

Si ya pagó, ignore este mensaje.

Att
*GRUPO FERREIRA HOGAR*
`;
  };

  // ===========================
  //   EXPANDIR / COLAPSAR
  // ===========================
  const toggleExpandir = (id) => {
    setExpandir(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <Load />;


  return (
    <div className={`cliente-detalles ${clienteBloqueado ? 'cliente-bloqueado' : ''}`}>

      {/* RESUMEN DE DEUDA TOTAL */}
      <div className="resumen-total mt-5 p-3 border rounded bg-light">
        <h3 className='Deuda-Title'>Resumen de Deuda Total</h3>

        <p><strong>Total Créditos:</strong> $
          {ventas
            .reduce((acc, v) => acc + Math.round((v.totalCredito || 0) / 1000) * 1000, 0)
            .toLocaleString('es-AR')}
        </p>

        <p><strong>Total Pagado:</strong> $
          {ventas.reduce((acc, v) => {
            const pagos = v.pagos || [];
            return acc + pagos.reduce((sum, p) =>
              sum + Math.round(p.monto / 1000) * 1000, 0
            );
          }, 0).toLocaleString('es-AR')}
        </p>

        <p><strong>Deuda Total:</strong> $
          {(ventas.reduce((acc, v) =>
            acc + Math.round((v.totalCredito || 0) / 1000) * 1000, 0
          ) -
            ventas.reduce((acc, v) => {
              const pagos = v.pagos || [];
              return acc + pagos.reduce((sum, p) =>
                sum + Math.round(p.monto / 1000) * 1000, 0
              );
            }, 0))
            .toLocaleString('es-AR')}
        </p>
      </div>

      {/* Aviso si el cliente está bloqueado */}
      {clienteBloqueado && (
        <div className="alerta-bloqueado">
          ⚠️ Este cliente está <strong>BLOQUEADO</strong>. No otorgar crédito.
        </div>
      )}

      {/* Botón de bloqueo solo para jefe */}
      {currentUser?.role?.includes('jefe') && (
        <button
          className={`btn ${clienteBloqueado ? 'btn-success' : 'btn-danger'} mb-3`}
          onClick={handleToggleBloqueo}
        >
          {clienteBloqueado ? 'Desbloquear cliente' : 'Bloquear cliente'}
        </button>
      )}

      <h2 className="CD-Title">Detalles de Ventas</h2>

      {ventas
        // ORDENAR: arriba las incompletas, abajo las completas
        .sort((a, b) => {
          const totalA = Math.round((a.totalCredito || 0) / 1000) * 1000;
          const pagosA = a.pagos ? a.pagos.reduce((acc, p) => acc + Math.round(p.monto / 1000) * 1000, 0) : 0;
          const compA = totalA - pagosA <= 0;

          const totalB = Math.round((b.totalCredito || 0) / 1000) * 1000;
          const pagosB = b.pagos ? b.pagos.reduce((acc, p) => acc + Math.round(p.monto / 1000) * 1000, 0) : 0;
          const compB = totalB - pagosB <= 0;

          return compA === compB ? 0 : compA ? 1 : -1;
        })
        .map(venta => {

          const isExpanded = expandedVentas[venta.id] || false;

          const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;
          const totalPagos = venta.pagos
            ? venta.pagos.reduce((acc, pago) =>
              acc + Math.round(pago.monto / 1000) * 1000, 0)
            : 0;

          const cuotas = venta.cuotas || 1;
          const saldo = totalCredito - totalPagos;
          const isComplete = saldo <= 0;
          let saldoRestante = totalCredito;

          const montoBaseCuotas = venta.productos.reduce((acc, p) => {
            const precio = Math.round(p.precio / 1000) * 1000;
            return acc + precio * (p.cantidad || 1);
          }, 0);

          const { cuotaRedondeada } = calcularCuotaConInteres(montoBaseCuotas, cuotas);

          const cuotasDisponibles = configuracionCuotas.map(({ cuotas }) => {
            const { cuotaRedondeada } = calcularCuotaConInteres(montoBaseCuotas, cuotas);
            return { cuotas, valorCuota: cuotaRedondeada };
          });

          const generarComprobanteCompra = () => {
            const fechaVenta = new Date(venta.fecha.seconds * 1000).toLocaleDateString("es-AR");

            const productosTexto = venta.productos
              .map(
                p =>
                  `• ${p.nombre} (Cant: ${p.cantidad}, Precio: $${(
                    Math.round(p.precio / 1000) * 1000
                  ).toLocaleString("es-AR")})`
              )
              .join("\n");

            return `
COMPROBANTE DE COMPRA

Cliente: ${clienteNombre}
DNI: ${clienteId}

Fecha de Venta: ${fechaVenta}

Productos:
${productosTexto}

Total Crédito: $${totalCredito.toLocaleString("es-AR")}
Cuotas: ${cuotas}
Valor por Cuota: $${cuotaRedondeada.toLocaleString("es-AR")}

Atendido por: ${currentUser?.username || "Vendedor"}

Gracias por su compra.
      `;
          };

          const enviarCompraWhatsApp = () => {
            if (!clienteTelefono) {
              alert("El cliente no tiene número registrado");
              return;
            }
            const ticket = generarComprobanteCompra();
            enviarComprobanteWhatsApp(clienteTelefono, ticket);
          };

          return (
            <div
              key={venta.id}
              ref={el => (ventaRefs.current[venta.id] = el)}
              className={`venta-detalle 
              ${isComplete ? "completo" : ""} 
              ${isComplete && !isExpanded ? "venta-mini" : ""} 
              ${ventaSeleccionadaId === venta.id ? "venta-seleccionada" : ""}`}
            >

              {/* BOTÓN PARA EXPANDIR/ACHICAR SI ESTÁ COMPLETA */}
              {isComplete && (
                <button
                  className="btn btn-secondary btn-expandir mb-2"
                  onClick={() =>
                    setExpandedVentas(prev => ({ ...prev, [venta.id]: !isExpanded }))
                  }
                >
                  {isExpanded ? "Contraer" : "Expandir"}
                </button>
              )}

              {/* CONTENIDO SOLO SI NO ESTÁ MINI O ESTÁ EXPANDIDO */}
              {(!isComplete || isExpanded) && (
                <>

                  <h3>Venta {venta.id}</h3>

                  <p>Cliente: <strong>{clienteNombre}</strong></p>
                  <p><strong>D.N.I:</strong> {clienteId}</p>
                  <p><strong>Dirección:</strong> {clienteDireccion || "No registrada"}</p>
                  <p><strong>Vendedor:</strong> {venta.vendedor}</p>
                  {venta.sucursal && (
                    <p><strong>Sucursal:</strong> {venta.sucursal}</p>
                  )}
                  {venta.entrega && (
                    <p><strong>Entrega:</strong> {venta.entrega}</p>
                  )}
                  {venta.chofer && typeof venta.chofer === "object" && (
                    <p>
                      <strong>Chofer:</strong> {venta.chofer.nombre}
                      {" - Patente: " + (venta.chofer.patente || "No registrada")}
                      {" - Tel: " + (venta.chofer.telefono || "No registrado")}
                    </p>
                  )}
                  <p><strong>Total Crédito $:</strong> {totalCredito.toLocaleString("es-AR")}</p>

                  <p><strong>Cuotas de:</strong> {(Math.round(totalCredito / cuotas / 1000) * 1000).toLocaleString("es-AR")}</p>

                  <p><strong>Su Compra:</strong>{" "}
                    {venta.productos
                      .map(
                        p =>
                          `${p.nombre} (Cant: ${p.cantidad}, Precio unitario: $${(
                            Math.round(p.precio / 1000) * 1000
                          ).toLocaleString("es-AR")})`
                      )
                      .join(", ")}
                  </p>

                  <p><strong>Total:</strong> ${totalCredito.toLocaleString("es-AR")}</p>

                  <p><strong>Cuotas:</strong>{" "}
                    <select
                      value={cuotas}
                      onChange={(e) => handleCuotasChange(venta.id, parseInt(e.target.value))}
                      disabled={isComplete}
                      className="form-select"
                    >
                      {cuotasDisponibles.map(op => (
                        <option key={op.cuotas} value={op.cuotas}>
                          {op.cuotas} cuota{op.cuotas > 1 ? "s" : ""} - $
                          {op.valorCuota.toLocaleString("es-AR")}
                        </option>
                      ))}
                    </select>
                  </p>

                  <p><strong>Valor por cuota:</strong> ${cuotaRedondeada.toLocaleString("es-AR")}</p>

                  <p><strong>Fecha de Venta:</strong>
                    {new Date(venta.fecha.seconds * 1000).toLocaleDateString("es-AR")}
                  </p>

                  <button
                    className="btn btn-success mb-3"
                    onClick={enviarCompraWhatsApp}
                  >
                    Enviar Comprobante de Compra
                  </button>

                  <button
                    className="btn btn-warning mb-3"
                    onClick={async () => {
                      try {
                        if (!clienteTelefono) {
                          alert("El cliente no tiene teléfono registrado");
                          return;
                        }

                        const mensaje = generarRecordatorioCuota(venta);

                        enviarComprobanteWhatsApp(clienteTelefono, mensaje);
                      } catch (error) {
                        console.error("Error enviando recordatorio:", error);
                        alert("No se pudo enviar el recordatorio.");
                      }
                    }}
                  >
                    Recordar cuota
                  </button>

                  {/* TABLA DE PAGOS */}
                  <h4>Pagos</h4>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Día</th>
                          <th>Mes</th>
                          <th>Año</th>
                          <th>Pago</th>
                          <th>Saldo</th>
                          <th>Control</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venta.pagos &&
                          [...venta.pagos]
                            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                            .map((pago, i) => {
                              saldoRestante -= pago.monto;

                              const [y, m, d] = pago.fecha.split("-").map(Number);
                              const fecha = new Date(y, m - 1, d);

                              return (
                                <tr key={i}>
                                  <td>{fecha.getDate()}</td>
                                  <td>{fecha.getMonth() + 1}</td>
                                  <td>{fecha.getFullYear()}</td>

                                  <td>
                                    $
                                    {(Math.round(pago.monto / 1000) * 1000).toLocaleString("es-AR")}
                                  </td>

                                  <td>
                                    $
                                    {(
                                      Math.round(Math.max(0, saldoRestante) / 1000) * 1000
                                    ).toLocaleString("es-AR")}
                                  </td>

                                  <td>{pago.usuario}</td>
                                </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </div>

                  {!isComplete && (
                    <>
                      <h4>Agregar Pago</h4>
                      <form onSubmit={(e) => agregarPago(venta.id, e)}>
                        <div className="form-group">
                          <label htmlFor="fecha">Fecha:</label>
                          <input type="date" className="form-control" id="fecha" name="fecha" required ref={fechaRef} />
                        </div>

                        <div className="form-group">
                          <label htmlFor="monto">Monto:</label>
                          <input type="number" className="form-control" id="monto" name="monto" required ref={montoRef} />
                        </div>

                        <button type="submit" className="btn btn-primary mt-2">
                          Agregar Pago
                        </button>
                      </form>
                    </>
                  )}

                </>
              )}
            </div>
          );
        })}


    </div>
  );

};

export default ClienteDetalles;
