import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';
import './ClienteDetalles.css';

// Configuración de intereses por cantidad de cuotas
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

// Función auxiliar para calcular valor de cuota
const calcularCuotaConInteres = (monto, cuotas) => {
  const config = configuracionCuotas.find(c => c.cuotas === cuotas);
  const interes = config ? config.interes : 0;
  const montoConInteres = monto * (1 + interes / 100);
  const cuotaFinal = Math.round(montoConInteres / cuotas / 1000) * 1000;
  return cuotaFinal;
};

const ClienteDetalles = ({ currentUser }) => {
  const { clienteId } = useParams();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const fechaRef = useRef(null);
  const montoRef = useRef(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const ventasQuery = query(collection(db, 'ventas'), where('clienteId', '==', clienteId));
        const ventasSnapshot = await getDocs(ventasQuery);
        const ventasList = ventasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVentas(ventasList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ventas:", error);
        setLoading(false);
      }
    };
    fetchVentas();
  }, [clienteId]);

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
      // Calcular monto base sin interés sumando productos
      const montoBase = venta.productos.reduce((acc, p) => acc + p.precio * (p.cantidad || 1), 0);

      // Calcular valor cuota con interés
      const valorCuota = calcularCuotaConInteres(montoBase, nuevasCuotas);

      // Calcular total con interés (cuota * cantidad)
      const totalConInteres = valorCuota * nuevasCuotas;

      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, {
        cuotas: nuevasCuotas,
        totalCredito: totalConInteres,
      });

      setVentas((prevVentas) =>
        prevVentas.map((v) =>
          v.id === ventaId ? { ...v, cuotas: nuevasCuotas, totalCredito: totalConInteres } : v
        )
      );

      alert('Cantidad de cuotas y total actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando cuotas:', error);
      alert('No se pudo actualizar la cantidad de cuotas');
    }
  };

  const handleCuotaPagada = async (ventaId, fecha, monto, usuario) => {
    const nuevaVenta = ventas.find((venta) => venta.id === ventaId);
    const newPagos = [...(nuevaVenta.pagos || []), { fecha, monto: Math.round(monto / 1000) * 1000, usuario }];
    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, {
        pagos: newPagos
      });
      const updatedVentas = ventas.map(venta =>
        venta.id === ventaId ? { ...venta, pagos: newPagos } : venta
      );
      setVentas(updatedVentas);
      alert('Pago registrado con éxito');
    } catch (error) {
      console.error("Error actualizando pago: ", error);
    }
  };

  const agregarPago = (ventaId, e) => {
    e.preventDefault();
    const fecha = e.target.fecha.value;
    let monto = Number(e.target.monto.value);

    const venta = ventas.find(venta => venta.id === ventaId);
    const saldo = Math.round((venta.totalCredito || 0) / 1000) * 1000 - (venta.pagos ? venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0) : 0);

    if (monto > saldo) {
      monto = saldo;
    }

    fechaRef.current.value = '';
    montoRef.current.value = '';

    handleCuotaPagada(ventaId, fecha, monto, currentUser.username);
  };

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

        return (
          <div key={venta.id} className={`venta-detalle ${isComplete ? 'completo' : ''}`}>
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

            <p>
              <strong>Valor por cuota:</strong>{' '}
              ${calcularCuotaConInteres(montoBaseCuotas, cuotas).toLocaleString('es-AR')}
            </p>

            <p><strong>Fecha de Venta:</strong> {new Date(venta.fecha.seconds * 1000).toLocaleString()}</p>

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
                    return (
                      <tr key={i}>
                        <td>{new Date(pago.fecha).getDate()}</td>
                        <td>{new Date(pago.fecha).getMonth() + 1}</td>
                        <td>{new Date(pago.fecha).getFullYear()}</td>
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
                    <button type="submit" className="btn btn-primary">Agregar Pago</button>
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
