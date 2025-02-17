import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, increment, setDoc } from 'firebase/firestore'; // Importa updateDoc, setDoc e increment
import { db } from '../../firebaseConfig';
import './Resumen.css';
import Load from '../load/Load';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Resumen = () => {
  const [resumenMensual, setResumenMensual] = useState(0);
  const [resumenAnual, setResumenAnual] = useState(0);
  const [gastosMensual, setGastosMensual] = useState(0);
  const [gastosAnual, setGastosAnual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [annualData, setAnnualData] = useState([]);
  const [monthlyBalances, setMonthlyBalances] = useState([]);
  const [balance, setBalance] = useState({
    mensual: { status: '', monto: 0 },
    anual: { status: '', monto: 0 }
  });

  useEffect(() => {
    const fetchMovimientos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const gastosCollection = collection(db, 'gastos');
      const annualCollection = collection(db, 'balancesAnuales');
      const ventasSnapshot = await getDocs(ventasCollection);
      const gastosSnapshot = await getDocs(gastosCollection);
      const annualSnapshot = await getDocs(annualCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gastosList = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const annualList = annualSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const now = new Date();
      let totalCobrosMensual = 0;
      let totalCobrosAnual = 0;
      let totalGastosMensual = 0;
      let totalGastosAnual = 0;

      for (const venta of ventasList) {
        for (const pago of venta.pagos) {
          const pagoDate = new Date(pago.fecha);

          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(now.getMonth() - 1);
          if (pagoDate >= oneMonthAgo) {
            totalCobrosMensual += pago.monto;
          }

          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          if (pagoDate >= oneYearAgo) {
            totalCobrosAnual += pago.monto;
          }

          // Actualiza los balances anuales
          const mes = pagoDate.toLocaleString('es-AR', { month: 'long' });
          const yearMonth = `${pagoDate.getFullYear()}-${pagoDate.getMonth() + 1}`;
          const docRef = doc(db, 'balancesAnuales', yearMonth);
          await setDoc(docRef, {
            mes,
            ventasTotales: increment(pago.monto), // Solo incluye el monto de la cuota pagada
            gastosTotales: increment(0)
          }, { merge: true });
        }
      }

      for (const gasto of gastosList) {
        const gastoDate = new Date(gasto.fecha.seconds * 1000);

        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        if (gastoDate >= oneMonthAgo) {
          totalGastosMensual += gasto.monto;
        }

        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        if (gastoDate >= oneYearAgo) {
          totalGastosAnual += gasto.monto;
        }

        // Actualiza los balances anuales
        const mes = gastoDate.toLocaleString('es-AR', { month: 'long' });
        const yearMonth = `${gastoDate.getFullYear()}-${gastoDate.getMonth() + 1}`;
        const docRef = doc(db, 'balancesAnuales', yearMonth);
        await setDoc(docRef, {
          mes,
          ventasTotales: increment(0),
          gastosTotales: increment(gasto.monto)
        }, { merge: true });
      }

      setResumenMensual(totalCobrosMensual);
      setResumenAnual(totalCobrosAnual);
      setGastosMensual(totalGastosMensual);
      setGastosAnual(totalGastosAnual);

      const resumenData = [
        { name: 'Mensual', Ventas: totalCobrosMensual, Gastos: totalGastosMensual },
        { name: 'Anual', Ventas: totalCobrosAnual, Gastos: totalGastosAnual }
      ];
      setData(resumenData);

      const balanceMensual = totalCobrosMensual - totalGastosMensual;
      const balanceAnual = totalCobrosAnual - totalGastosAnual;

      setBalance({
        mensual: { status: balanceMensual >= 0 ? 'Vas ganando' : 'Vas perdiendo', monto: balanceMensual },
        anual: { status: balanceAnual >= 0 ? 'Vas ganando' : 'Vas perdiendo', monto: balanceAnual }
      });

      setAnnualData(annualList.map(item => ({
        name: item.mes,
        Ventas: item.ventasTotales,
        Gastos: item.gastosTotales
      })));

      // Calcular balances mensuales
      const balancesMensuales = annualList.map(item => ({
        mes: item.mes,
        ventas: item.ventasTotales,
        gastos: item.gastosTotales,
        balance: item.ventasTotales - item.gastosTotales
      }));

      setMonthlyBalances(balancesMensuales);

      // Guardar el balance del mes anterior y restablecer valores a cero cada 1 del mes
      if (now.getDate() === 1) {
        const previousMonth = new Date(now);
        previousMonth.setMonth(now.getMonth() - 1);
        const prevYearMonth = `${previousMonth.getFullYear()}-${previousMonth.getMonth() + 1}`;
        const prevBalanceRef = doc(db, 'balancesAnuales', prevYearMonth);
        await setDoc(prevBalanceRef, {
          mes: previousMonth.toLocaleString('es-AR', { month: 'long' }),
          ventasTotales: totalCobrosMensual,
          gastosTotales: totalGastosMensual
        }, { merge: true });

        setResumenMensual(0);
        setGastosMensual(0);
      }

      setLoading(false);
    };

    fetchMovimientos();
  }, []);

  if (loading) {
    return <Load />;
  }
  return (
    <div className="resumen">
      <h2>Resumen de Ventas y Gastos</h2>
      <p>A continuación se muestra un resumen de las ventas y gastos realizados en diferentes períodos de tiempo. Los montos están expresados en pesos argentinos ($ ARS).</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`} />
          <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
          <Legend />
          <Bar dataKey="Ventas" fill="#4CAF50" /> {/* Color verde */}
          <Bar dataKey="Gastos" fill="#F44336" /> {/* Color rojo */}
        </BarChart>
      </ResponsiveContainer>
      <div className="totales">
        <div className="gastos">
          <h3>Gastos Totales</h3>
          <p>Gastos Mensual: <span>${gastosMensual.toLocaleString('es-AR')}</span></p>
          <p>Gastos Anual: <span>${gastosAnual.toLocaleString('es-AR')}</span></p>
        </div>
        <div className="ventas">
          <h3>Ventas Totales</h3>
          <p>Ventas Mensual: <span>${resumenMensual.toLocaleString('es-AR')}</span></p>
          <p>Ventas Anual: <span>${resumenAnual.toLocaleString('es-AR')}</span></p>
        </div>
      </div>
      <div className="balance">
        <h3>Balance Total</h3>
        <p>Balance Mensual: {balance.mensual.status}: <span>${balance.mensual.monto.toLocaleString('es-AR')}</span></p>
        <p>Balance Anual: {balance.anual.status}: <span>${balance.anual.monto.toLocaleString('es-AR')}</span></p>
      </div>
    </div>
  );
};

export default Resumen;
