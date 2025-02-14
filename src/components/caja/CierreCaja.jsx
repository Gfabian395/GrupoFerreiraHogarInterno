import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Importa el hook useNavigate
import { collection, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '../../firebaseConfig';
import './CierreCaja.css';
import Load from '../load/Load';

const CierreCaja = ({ currentUser }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [showPDFPrompt, setShowPDFPrompt] = useState(false);
  const navigate = useNavigate();  // Usa el hook useNavigate

  useEffect(() => {
    if (currentUser.role !== 'jefe') {
      alert('No tienes permiso para acceder a esta página.');
      return;
    }
    const fetchMovimientos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let total = 0;
      const movimientosList = [];
      const vendedoresMap = {};

      ventasList.forEach(venta => {
        // Registrar la venta
        movimientosList.push({
          idVenta: venta.id,
          clienteId: venta.clienteId,
          vendedor: venta.vendedor,
          fecha: new Date(venta.fecha.seconds * 1000).toLocaleDateString(),
          razon: 'Venta',
          monto: venta.totalCredito
        });
        total += venta.totalCredito;

        // Contabilizar ventas por vendedor
        if (!vendedoresMap[venta.vendedor]) {
          vendedoresMap[venta.vendedor] = { cantVentas: 0, totalRecaudado: 0 };
        }
        vendedoresMap[venta.vendedor].cantVentas += 1;
        vendedoresMap[venta.vendedor].totalRecaudado += venta.totalCredito;

        // Registrar cada cobro asociado a la venta
        venta.pagos.forEach(pago => {
          movimientosList.push({
            idVenta: venta.id,
            clienteId: venta.clienteId,
            vendedor: pago.usuario,
            fecha: new Date(pago.fecha).toLocaleDateString(),
            razon: 'Cobro',
            monto: pago.monto
          });
        });
      });

      // Generar el ranking de los mejores 3 vendedores
      const ranking = Object.entries(vendedoresMap)
        .map(([vendedor, data]) => ({ vendedor, ...data }))
        .sort((a, b) => b.totalRecaudado - a.totalRecaudado)
        .slice(0, 3);

      setMovimientos(movimientosList);
      setTotalRecaudado(total);
      setRankingVendedores(ranking);
      setLoading(false);
    };
    fetchMovimientos();
  }, [currentUser]);

  const handleGeneratePDF = () => {
    setShowPDFPrompt(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString();
    doc.text(`Reporte de Cierre de Caja de ${today}`, 40, 30);
    const tableColumn = ["ID Venta", "Cliente", "Vendedor", "Fecha", "Razón", "Monto"];
    const tableRows = [];

    movimientos.forEach(movimiento => {
      const movimientoData = [
        movimiento.idVenta,
        movimiento.clienteId,
        movimiento.vendedor,
        movimiento.fecha,
        movimiento.razon,
        `$${movimiento.monto.toLocaleString('es-AR')}`
      ];
      tableRows.push(movimientoData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.text(`Total Recaudado: $${totalRecaudado.toLocaleString('es-AR')}`, 40, doc.autoTable.previous.finalY + 20);
    doc.save('cierre_caja.pdf');

    // Limpiar la pantalla de cierre de caja
    setMovimientos([]);
    setTotalRecaudado(0);
    setRankingVendedores([]);
    setShowPDFPrompt(false); // Ocultar el prompt después de generar el PDF
  };

  const handleGenerateResumen = () => {
    navigate('/resumen');
  };

  return (
    <div className="cierre-caja">
      <h2>Cierre de Caja</h2>
      {loading ? (
        <Load />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID Venta</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Fecha</th>
                  <th>Razón</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento, index) => (
                  <tr key={index}>
                    <td>{movimiento.idVenta}</td>
                    <td>{movimiento.clienteId}</td>
                    <td>{movimiento.vendedor}</td>
                    <td>{movimiento.fecha}</td>
                    <td>{movimiento.razon}</td>
                    <td>${movimiento.monto.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Total Recaudado: ${totalRecaudado.toLocaleString('es-AR')}</h3>
          <button onClick={handleGeneratePDF}>Generar PDF</button>
          <button onClick={handleGenerateResumen}>Ver Resumen</button>

          <h2>Ranking de Mejores 3 Vendedores Mensuales</h2>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Cant. Ventas</th>
                  <th>Total Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {rankingVendedores.map((vendedor, index) => (
                  <tr key={index}>
                    <td>{vendedor.vendedor}</td>
                    <td>{vendedor.cantVentas}</td>
                    <td>${vendedor.totalRecaudado.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showPDFPrompt && (
            <div className="overlay">
              <div className="form-popup">
                <h3>¿Desea descargar PDF y limpiar pantalla?</h3>
                <button onClick={generatePDF} className="btn btn-primary">Sí</button>
                <button onClick={() => setShowPDFPrompt(false)} className="btn btn-secondary">No</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CierreCaja;
