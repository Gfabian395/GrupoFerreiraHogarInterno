import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '../../firebaseConfig';
import './CierreCaja.css';
import Load from '../load/Load';

const CierreCaja = ({ currentUser }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecaudado, setTotalRecaudado] = useState(0);

  useEffect(() => {
    if (currentUser.role !== 'jefe') {
      alert('No tienes permiso para acceder a esta página.');
      return;
    }
    const fetchVentas = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVentas(ventasList);
      setLoading(false);

      const total = ventasList.reduce((acc, venta) => acc + venta.totalCredito, 0);
      setTotalRecaudado(total);
    };
    fetchVentas();
  }, [currentUser]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text('Reporte de Cierre de Caja', 14, 10);
    const tableColumn = ["ID Venta", "Cliente", "Vendedor", "Fecha", "Total Crédito", "Cuotas", "Pagos"];
    const tableRows = [];

    ventas.forEach(venta => {
      const pagos = venta.pagos.map(p => `Fecha: ${new Date(p.fecha).toLocaleDateString()} - Monto: $${p.monto.toLocaleString('es-AR')} - Usuario: ${p.usuario}`).join("\n");
      const ventaData = [
        venta.id,
        venta.clienteId,
        venta.vendedor,
        new Date(venta.fecha.seconds * 1000).toLocaleDateString(),
        `$${venta.totalCredito.toLocaleString('es-AR')}`,
        venta.cuotas,
        pagos
      ];
      tableRows.push(ventaData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.text(`Total Recaudado: $${totalRecaudado.toLocaleString('es-AR')}`, 14, doc.autoTable.previous.finalY + 10);
    doc.save('cierre_caja.pdf');
  };

  return (
    <div className="cierre-caja">
      <h2>Cierre de Caja</h2>
      {loading ? (
        <Load/>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Fecha</th>
                <th>Total Crédito</th>
                <th>Cuotas</th>
                <th>Pagos</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id}>
                  <td>{venta.id}</td>
                  <td>{venta.clienteId}</td>
                  <td>{venta.vendedor}</td>
                  <td>{new Date(venta.fecha.seconds * 1000).toLocaleDateString()}</td>
                  <td>${venta.totalCredito.toLocaleString('es-AR')}</td>
                  <td>{venta.cuotas}</td>
                  <td>
                    {venta.pagos.map((pago, index) => (
                      <div key={index}>
                        {`Fecha: ${new Date(pago.fecha).toLocaleDateString()} - Monto: $${pago.monto.toLocaleString('es-AR')} - Usuario: ${pago.usuario}`}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Total Recaudado: ${totalRecaudado.toLocaleString('es-AR')}</h3>
          <button onClick={generatePDF}>Generar PDF</button>
        </>
      )}
    </div>
  );
};

export default CierreCaja;
