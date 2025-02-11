import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Load from '../load/Load';
import './ClienteDetalles.css';

const ClienteDetalles = ({ currentUser }) => {
  const { clienteId } = useParams();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState([]);
  const [alerta, setAlerta] = useState('');

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

  useEffect(() => {
    console.log("Ventas updated:", ventas);
  }, [ventas]);

  const handleCuotaPagada = async (ventaId, fecha, monto, usuario) => {
    const nuevaVenta = ventas.find((venta) => venta.id === ventaId);
    const newPagos = [...nuevaVenta.pagos, { fecha, monto: Math.round(monto / 1000) * 1000, usuario }];
    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, {
        pagos: newPagos
      });
      setPagos(newPagos);
      setAlerta('Pago registrado con éxito');
      setTimeout(() => setAlerta(''), 3000);
      const updatedVentas = ventas.map(venta =>
        venta.id === ventaId ? { ...venta, pagos: newPagos } : venta
      );
      setVentas(updatedVentas);
    } catch (error) {
      console.error("Error actualizando pago: ", error);
    }
  };

  const agregarPago = (ventaId, e) => {
    e.preventDefault();
    const fecha = e.target.fecha.value;
    let monto = e.target.monto.value;

    const venta = ventas.find(venta => venta.id === ventaId);
    const saldo = Math.round((venta.totalCredito || 0) / 1000) * 1000 - venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0);

    if (monto > saldo) {
      monto = saldo;
    }

    handleCuotaPagada(ventaId, fecha, monto, currentUser.username);
  };

  if (loading) {
    return <Load />;
  }

  return (
    <div className="cliente-detalles container">
      <h2 className="my-4">Detalles de Ventas</h2>
      {alerta && <div className="alert alert-success">{alerta}</div>}
      {ventas.map(venta => {
        const totalCredito = Math.round((venta.totalCredito || 0) / 1000) * 1000;
        const totalPagos = venta.pagos ? venta.pagos.reduce((acc, pago) => acc + Math.round(Number(pago.monto / 1000)) * 1000, 0) : 0;
        const cuotas = venta.cuotas || 1;
        const saldo = totalCredito - totalPagos;
        const isComplete = saldo <= 0;
        let saldoRestante = totalCredito;

        return (
          <div key={venta.id} className={`venta-detalle ${isComplete ? 'completo' : ''}`}>
            <h3>Venta {venta.id}</h3>
            <p><strong>Nombre:</strong> {clienteId}</p>
            <p><strong>Total Crédito $:</strong> {totalCredito.toLocaleString('es-AR')}</p>
            <p><strong>Cuotas de:</strong> ${(Math.round(totalCredito / cuotas / 1000) * 1000).toLocaleString('es-AR')}</p>
            <p><strong>Fecha de Venta:</strong> {new Date(venta.fecha.seconds * 1000).toLocaleString()}</p>
            <p><strong>Su Compra:</strong> {venta.productos.map(producto => `${producto.nombre} (Cant: ${producto.cantidad}, Precio: $${(Math.round(producto.precio / 1000) * 1000).toLocaleString('es-AR')})`).join(", ")}</p>
            <p><strong>Total:</strong> ${totalCredito.toLocaleString('es-AR')} - {cuotas} cuotas de ${(Math.round(totalCredito / cuotas / 1000) * 1000).toLocaleString('es-AR')}</p>

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
                  {venta.pagos && venta.pagos.map((pago, index) => {
                    saldoRestante -= pago.monto;
                    return (
                      <tr key={index}>
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
                    <input type="date" className="form-control" id="fecha" name="fecha" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="monto">Monto:</label>
                    <input type="number" className="form-control" id="monto" name="monto" required />
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
