import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Load from '../load/Load';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Resumen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [totales, setTotales] = useState({
    mensualVentas: 0,
    anualVentas: 0,
    mensualGastos: 0,
    anualGastos: 0
  });
  const [balance, setBalance] = useState({ mensual: {}, anual: {} });

  useEffect(() => {
    const fetchMovimientos = async () => {
      const now = new Date();

      const [ventasSnapshot, gastosSnapshot] = await Promise.all([
        getDocs(collection(db, 'ventas')),
        getDocs(collection(db, 'gastos'))
      ]);

      const ventas = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gastos = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Función para obtener key YYYY-MM
      const formatYearMonth = (date) => {
        const d = new Date(date);
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${d.getFullYear()}-${month}`;
      };

      // Crear mapa para ventas y gastos por mes
      const ventasPorMes = {};
      const gastosPorMes = {};

      // Fechas de corte
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      let mensualVentas = 0, anualVentas = 0;
      let mensualGastos = 0, anualGastos = 0;

      // Procesar ventas
      for (const venta of ventas) {
        if (!venta.pagos) continue;
        for (const pago of venta.pagos) {
          const fechaPago = new Date(pago.fecha);
          const key = formatYearMonth(fechaPago);
          ventasPorMes[key] = (ventasPorMes[key] || 0) + pago.monto;

          if (fechaPago >= oneMonthAgo) mensualVentas += pago.monto;
          if (fechaPago >= oneYearAgo) anualVentas += pago.monto;
        }
      }

      // Procesar gastos
      for (const gasto of gastos) {
        const fechaGasto = gasto.fecha?.seconds
          ? new Date(gasto.fecha.seconds * 1000)
          : new Date(gasto.fecha);

        const key = formatYearMonth(fechaGasto);
        gastosPorMes[key] = (gastosPorMes[key] || 0) + gasto.monto;

        if (fechaGasto >= oneMonthAgo) mensualGastos += gasto.monto;
        if (fechaGasto >= oneYearAgo) anualGastos += gasto.monto;
      }

      // Generar array con los últimos 12 meses en orden ascendente
      const meses = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = formatYearMonth(d);
        meses.push({
          name: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
          Ventas: ventasPorMes[key] || 0,
          Gastos: gastosPorMes[key] || 0
        });
      }

      setData(meses);
      setTotales({ mensualVentas, anualVentas, mensualGastos, anualGastos });
      setBalance({
        mensual: {
          status: mensualVentas - mensualGastos >= 0 ? 'Vas ganando' : 'Vas perdiendo',
          monto: mensualVentas - mensualGastos
        },
        anual: {
          status: anualVentas - anualGastos >= 0 ? 'Vas ganando' : 'Vas perdiendo',
          monto: anualVentas - anualGastos
        }
      });

      setLoading(false);
    };

    fetchMovimientos();
  }, []);

  if (loading) return <Load />;

  return (
    <div className="resumen">
      <h2>Resumen de Ventas y Gastos - Últimos 12 Meses</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={v => `$${v.toLocaleString('es-AR')}`} />
          <Tooltip formatter={v => `$${v.toLocaleString('es-AR')}`} />
          <Legend />
          <Bar dataKey="Ventas" fill="#4CAF50" />
          <Bar dataKey="Gastos" fill="#F44336" />
        </BarChart>
      </ResponsiveContainer>

      <div className="totales" style={{ display: 'flex', justifyContent: 'space-around', marginTop: 30 }}>
        <div>
          <h3>Gastos Totales</h3>
          <p>Mensual: <strong>${totales.mensualGastos.toLocaleString('es-AR')}</strong></p>
          <p>Anual: <strong>${totales.anualGastos.toLocaleString('es-AR')}</strong></p>
        </div>
        <div>
          <h3>Ventas Totales</h3>
          <p>Mensual: <strong>${totales.mensualVentas.toLocaleString('es-AR')}</strong></p>
          <p>Anual: <strong>${totales.anualVentas.toLocaleString('es-AR')}</strong></p>
        </div>
      </div>

      <div className="balance" style={{ marginTop: 40, textAlign: 'center' }}>
        <h3>Balance Total</h3>
        <p>Mensual: {balance.mensual.status} — <strong>${balance.mensual.monto.toLocaleString('es-AR')}</strong></p>
        <p>Anual: {balance.anual.status} — <strong>${balance.anual.monto.toLocaleString('es-AR')}</strong></p>
      </div>
    </div>
  );
};

export default Resumen;
