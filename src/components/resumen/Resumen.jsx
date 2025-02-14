import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Resumen.css';
import Load from '../load/Load';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Resumen = () => {
  const [resumenSemanal, setResumenSemanal] = useState(0);
  const [resumenMensual, setResumenMensual] = useState(0);
  const [resumenAnual, setResumenAnual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchMovimientos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const now = new Date();
      let totalSemanal = 0;
      let totalMensual = 0;
      let totalAnual = 0;

      ventasList.forEach(venta => {
        const ventaDate = new Date(venta.fecha.seconds * 1000);

        // Calcular el resumen semanal
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        if (ventaDate >= oneWeekAgo) {
          totalSemanal += venta.totalCredito;
        }

        // Calcular el resumen mensual
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        if (ventaDate >= oneMonthAgo) {
          totalMensual += venta.totalCredito;
        }

        // Calcular el resumen anual
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        if (ventaDate >= oneYearAgo) {
          totalAnual += venta.totalCredito;
        }
      });

      setResumenSemanal(totalSemanal);
      setResumenMensual(totalMensual);
      setResumenAnual(totalAnual);

      const resumenData = [
        { name: 'Semanal', Ventas: totalSemanal },
        { name: 'Mensual', Ventas: totalMensual },
        { name: 'Anual', Ventas: totalAnual }
      ];
      setData(resumenData);

      setLoading(false);
    };

    fetchMovimientos();
  }, []);

  if (loading) {
    return <Load />;
  }

  return (
    <div className="resumen">
      <h2>Resumen de Ventas</h2>
      <p>A continuación se muestra un resumen de las ventas realizadas en diferentes períodos de tiempo. Los montos están expresados en pesos argentinos ($ ARS).</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`} />
          <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
          <Legend />
          <Bar dataKey="Ventas" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      <div className="totales">
        <h3>Ventas Totales</h3>
        <p>Semanal: <span>${resumenSemanal.toLocaleString('es-AR')}</span></p>
        <p>Mensual: <span>${resumenMensual.toLocaleString('es-AR')}</span></p>
        <p>Anual: <span>${resumenAnual.toLocaleString('es-AR')}</span></p>
      </div>
    </div>
  );
};

export default Resumen;
