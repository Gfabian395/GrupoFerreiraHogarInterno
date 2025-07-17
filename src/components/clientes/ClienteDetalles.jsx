import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
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
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState(null);
  const ventaRefs = useRef({});
  const fechaRef = useRef(null);
  const montoRef = useRef(null);
  const [clienteNombre, setClienteNombre] = useState('');


  const [clienteBloqueado, setClienteBloqueado] = useState(false);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const ventasQuery = query(collection(db, 'ventas'), where('clienteId', '==', clienteId));
        const ventasSnapshot = await getDocs(ventasQuery);
        const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVentas(ventasList);

        const ventaIdDesdeHome = location.state?.ventaId;
        if (ventaIdDesdeHome) {
          setTimeout(() => {
            setVentaSeleccionadaId(ventaIdDesdeHome);
            const ref = ventaRefs.current[ventaIdDesdeHome];
            if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }, [clienteId, location.state]);

  useEffect(() => {
    const obtenerEstadoCliente = async () => {
      try {
        const clienteRef = doc(db, 'clientes', clienteId);
        const clienteSnap = await getDoc(clienteRef);
        if (clienteSnap.exists()) {
          const clienteData = clienteSnap.data();
          setClienteBloqueado(clienteData.bloqueado || false);
          setClienteNombre(clienteData.nombreCompleto || '');
        }
      } catch (error) {
        console.error("Error al obtener estado del cliente:", error);
      }
    };
    obtenerEstadoCliente();
  }, [clienteId]);

  // Modificado para pedir contraseña SOLO para desbloquear
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
      await updateDoc(clienteRef, {
        bloqueado: !clienteBloqueado
      });
      setClienteBloqueado(!clienteBloqueado);
    } catch (error) {
      console.error('Error al cambiar estado de bloqueo del cliente:', error);
      alert('No se pudo actualizar el estado del cliente');
    }
  };

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
      const montoBase = venta.productos.reduce((acc, p) => acc + p.precio * (p.cantidad || 1), 0);
      const { cuotaRedondeada, montoConInteres } = calcularCuotaConInteres(montoBase, nuevasCuotas);

      const totalConInteres = Math.round(montoConInteres / 1000) * 1000;

      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, { cuotas: nuevasCuotas, totalCredito: totalConInteres });

      setVentas(prev =>
        prev.map(v => (v.id === ventaId ? { ...v, cuotas: nuevasCuotas, totalCredito: totalConInteres } : v))
      );

      alert('Cantidad de cuotas actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando cuotas:', error);
      alert('No se pudo actualizar la cantidad de cuotas');
    }
  };

  const agregarPago = async (ventaId, e) => {
    e.preventDefault();
    /* const fecha = new Date(e.target.fecha.value + "T12:00:00"); // hora neutra para evitar desfase */
    const fecha = e.target.fecha.value; // ← Esto es un string tipo "2025-07-16"
    let monto = Number(e.target.monto.value);

    const venta = ventas.find(v => v.id === ventaId);
    const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;
    const totalPagos = venta.pagos ? venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0) : 0;
    const saldo = totalCredito - totalPagos;

    if (monto > saldo) monto = saldo;

    const nuevoPago = {
      fecha,
      monto: Math.round(monto / 1000) * 1000,
      usuario: currentUser?.username || 'Desconocido'
    };

    const nuevosPagos = [...(venta.pagos || []), nuevoPago];

    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, { pagos: nuevosPagos });
      setVentas(prev =>
        prev.map(v => (v.id === ventaId ? { ...v, pagos: nuevosPagos } : v))
      );
      fechaRef.current.value = '';
      montoRef.current.value = '';
      alert('Pago registrado con éxito');
    } catch (error) {
      console.error("Error actualizando pago: ", error);
    }
  };

  if (loading) return <Load />;

  return (
    <div className={`cliente-detalles container ${clienteBloqueado ? 'cliente-bloqueado' : ''}`}>
      {/* RESUMEN DE DEUDA TOTAL */}
      <div className="resumen-total mt-5 p-3 border rounded bg-light">
        <h3>Resumen de Deuda Total</h3>
        <p><strong>Total Créditos:</strong> ${ventas.reduce((acc, v) => acc + Math.round((v.totalCredito || 0) / 1000) * 1000, 0).toLocaleString('es-AR')}</p>
        <p><strong>Total Pagado:</strong> ${ventas.reduce((acc, v) => {
          const pagos = v.pagos || [];
          return acc + pagos.reduce((sum, p) => sum + Math.round(p.monto / 1000) * 1000, 0);
        }, 0).toLocaleString('es-AR')}</p>
        <p><strong>Deuda Total:</strong> ${(
          ventas.reduce((acc, v) => acc + Math.round((v.totalCredito || 0) / 1000) * 1000, 0) -
          ventas.reduce((acc, v) => {
            const pagos = v.pagos || [];
            return acc + pagos.reduce((sum, p) => sum + Math.round(p.monto / 1000) * 1000, 0);
          }, 0)
        ).toLocaleString('es-AR')}</p>
      </div>

      {/* Alerta roja si el cliente está bloqueado */}
      {clienteBloqueado && (
        <div className="alerta-bloqueado">
          ⚠️ Este cliente está <strong>BLOQUEADO</strong>. No otorgar crédito.
        </div>
      )}

      {/* Botón para bloquear/desbloquear si es jefe */}
      {currentUser?.role?.includes('jefe') && (
        <button
          className={`btn ${clienteBloqueado ? 'btn-success' : 'btn-danger'} mb-3`}
          onClick={handleToggleBloqueo}
        >
          {clienteBloqueado ? 'Desbloquear cliente' : 'Bloquear cliente'}
        </button>
      )}

      <h2 className="my-4">Detalles de Ventas</h2>
      {ventas.map(venta => {
        const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;
        const totalPagos = venta.pagos ? venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0) : 0;
        const cuotas = venta.cuotas || 1;
        const saldo = totalCredito - totalPagos;
        const isComplete = saldo <= 0;
        let saldoRestante = totalCredito;

        const montoBaseCuotas = venta.productos.reduce((acc, p) => {
          const precioRedondeado = Math.round(p.precio / 1000) * 1000;
          const cantidad = p.cantidad || 1;
          return acc + (precioRedondeado * cantidad);
        }, 0);

        const { cuotaRedondeada } = calcularCuotaConInteres(montoBaseCuotas, cuotas);

        const cuotasDisponibles = configuracionCuotas.map(({ cuotas }) => {
          const { cuotaRedondeada } = calcularCuotaConInteres(montoBaseCuotas, cuotas);
          return {
            cuotas,
            valorCuota: cuotaRedondeada
          };
        });

        return (
          <div
            key={venta.id}
            ref={el => ventaRefs.current[venta.id] = el}
            className={`venta-detalle ${isComplete ? 'completo' : ''} ${ventaSeleccionadaId === venta.id ? 'venta-seleccionada' : ''}`}
          >
            <h3>Venta {venta.id}</h3>
            <p>Cliente: <strong>{clienteNombre}</strong></p>
            <p><strong>D.N.I:</strong> {clienteId}</p>
            <p><strong>Total Crédito $:</strong> {totalCredito.toLocaleString('es-AR')}</p>
            <p><strong>Cuotas de:</strong> {(Math.round(totalCredito / cuotas / 1000) * 1000).toLocaleString('es-AR')}</p>
            <p><strong>Su Compra:</strong> {venta.productos.map(p =>
              `${p.nombre} (Cant: ${p.cantidad}, Precio unitario: $${(Math.round(p.precio / 1000) * 1000).toLocaleString('es-AR')})`
            ).join(", ")}</p>
            <p><strong>Total:</strong> ${totalCredito.toLocaleString('es-AR')}</p>
            <p><strong>Cuotas:</strong>{' '}
              <select
                value={cuotas}
                onChange={(e) => handleCuotasChange(venta.id, parseInt(e.target.value))}
                disabled={isComplete}
                className="form-select"
              >
                {cuotasDisponibles.map(op => (
                  <option key={op.cuotas} value={op.cuotas}>
                    {op.cuotas} cuota{op.cuotas > 1 ? 's' : ''} - ${op.valorCuota.toLocaleString('es-AR')}
                  </option>
                ))}
              </select>
            </p>
            <p><strong>Valor por cuota:</strong>{' '}
              ${cuotaRedondeada.toLocaleString('es-AR')}
            </p>
            <p><strong>Fecha de Venta:</strong> {new Date(venta.fecha.seconds * 1000).toLocaleDateString('es-AR')}</p>

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
                  {venta.pagos && venta.pagos.map((pago, i) => {
                    saldoRestante -= pago.monto;
                    const fecha = new Date(new Date(pago.fecha).getTime() + 12 * 60 * 60 * 1000);
                    return (
                      <tr key={i}>
                        <td>{fecha.getDate()}</td>
                        <td>{fecha.getMonth() + 1}</td>
                        <td>{fecha.getFullYear()}</td>
                        <td>${(Math.round(pago.monto / 1000) * 1000).toLocaleString('es-AR')}</td>
                        <td>${(Math.round(Math.max(0, saldoRestante) / 1000) * 1000).toLocaleString('es-AR')}</td>
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
                    <button type="submit" className="btn btn-primary mt-2">Agregar Pago</button>
                  </div>
                </form>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClienteDetalles;
