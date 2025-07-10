import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';
import './ClienteDetalles.css';

const configuracionCuotas = [
  { cuotas: 1, interes: 0 }, { cuotas: 2, interes: 15 }, { cuotas: 3, interes: 25 },
  { cuotas: 4, interes: 40 }, { cuotas: 6, interes: 60 }, { cuotas: 9, interes: 75 },
  { cuotas: 12, interes: 100 }, { cuotas: 18, interes: 150 }, { cuotas: 24, interes: 180 }
];

const calcularCuotaConInteres = (monto, cuotas) => {
  const config = configuracionCuotas.find(c => c.cuotas === cuotas);
  const interes = config ? config.interes : 0;
  const montoConInteres = monto * (1 + interes / 100);
  return Math.round(montoConInteres / cuotas / 1000) * 1000;
};

const formatearFechaArg = (fechaStr) => {
  if (!fechaStr) return '';
  if (fechaStr.includes('T')) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR');
  } else {
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
  }
};

const ClienteDetalles = ({ currentUser }) => {
  const { clienteId } = useParams();
  const location = useLocation();
  const initialSelectedVentaId = location.state?.ventaId || null;

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState(null);

  const ventaRefs = useRef({});

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const ventasQuery = query(collection(db, 'ventas'), where('clienteId', '==', clienteId));
        const ventasSnapshot = await getDocs(ventasQuery);
        const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVentas(ventasList);
      } catch (error) {
        console.error("Error fetching ventas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVentas();
  }, [clienteId]);

  // Cuando se carga ventas, setea la venta seleccionada inicial si existe
  useEffect(() => {
    if (initialSelectedVentaId && ventaRefs.current[initialSelectedVentaId]) {
      setVentaSeleccionadaId(initialSelectedVentaId);
      ventaRefs.current[initialSelectedVentaId].scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remover el resaltado después de 5 segundos
      const timer = setTimeout(() => {
        setVentaSeleccionadaId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [ventas, initialSelectedVentaId]);

  // Función para seleccionar venta manualmente (si querés usar click)
  const seleccionarVenta = (id) => {
    setVentaSeleccionadaId(id);
    if (ventaRefs.current[id]) {
      ventaRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      setVentaSeleccionadaId(null);
    }, 5000);
  };

  // (Resto del código igual, solo muestro la parte donde se agrega la clase)

  if (loading) return <Load />;

  return (
    <div className="cliente-detalles container">
      <h2 className="my-4">Detalles de Ventas</h2>
      {ventas.map(venta => {
        const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;
        const totalPagos = venta.pagos ? venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0) : 0;
        const cuotas = venta.cuotas || 1;
        const saldo = totalCredito - totalPagos;
        const isComplete = saldo <= 0;
        let saldoRestante = totalCredito;

        const productoPrincipal = venta.productos[0];
        const precioUnitario = Math.round(productoPrincipal.precio / 1000) * 1000;
        const cantidadProducto = productoPrincipal.cantidad || 1;
        const montoBaseCuotas = precioUnitario * cantidadProducto;

        const cuotasDisponibles = configuracionCuotas.map(({ cuotas }) => ({
          cuotas,
          valorCuota: calcularCuotaConInteres(montoBaseCuotas, cuotas)
        }));

        const fechaVenta = new Date(venta.fecha.seconds * 1000);
        const fechaVentaStr = `${fechaVenta.getDate().toString().padStart(2, '0')}/${(fechaVenta.getMonth() + 1).toString().padStart(2, '0')}/${fechaVenta.getFullYear()}`;

        return (
          <div
            key={venta.id}
            ref={el => ventaRefs.current[venta.id] = el}
            className={`venta-detalle ${isComplete ? 'completo' : ''} ${venta.id === ventaSeleccionadaId ? 'venta-seleccionada' : ''}`}
            onClick={() => seleccionarVenta(venta.id)} // opcional para seleccionar con click
          >
            <h3>Venta {venta.id}</h3>
            <p><strong>Nombre:</strong> {clienteId}</p>
            <p><strong>Su Compra:</strong> {venta.productos.map(p =>
              `${p.nombre} (Cant: ${p.cantidad}, Precio unitario: $${(Math.round(p.precio / 1000) * 1000).toLocaleString('es-AR')})`
            ).join(", ")}</p>

            <p><strong>Total:</strong> ${totalCredito.toLocaleString('es-AR')}</p>

            <p>
              <strong>Cuotas:</strong>{' '}
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

            <p><strong>Valor por cuota:</strong> ${calcularCuotaConInteres(montoBaseCuotas, cuotas).toLocaleString('es-AR')}</p>
            <p><strong>Fecha de Venta:</strong> {fechaVentaStr}</p>

            <h4>Pagos</h4>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pago</th>
                    <th>Saldo</th>
                    <th>Control</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.pagos && venta.pagos.map((pago, i) => {
                    saldoRestante -= pago.monto;
                    return (
                      <tr key={i}>
                        <td>{formatearFechaArg(pago.fecha)}</td>
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
                    <input type="date" className="form-control" id="fecha" name="fecha" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="monto">Monto:</label>
                    <input type="number" className="form-control" id="monto" name="monto" required />
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
