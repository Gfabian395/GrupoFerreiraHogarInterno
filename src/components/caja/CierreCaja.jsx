import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
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
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoRazon, setGastoRazon] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser.role !== 'jefe') {
      alert('No tienes permiso para acceder a esta página.');
      return;
    }

    const fetchMovimientos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const gastosCollection = collection(db, 'gastos');
      const ventasSnapshot = await getDocs(ventasCollection);
      const gastosSnapshot = await getDocs(gastosCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gastosList = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let total = 0;
      const movimientosList = [];
      const vendedoresMap = {};

      ventasList.forEach(venta => {
        if (!vendedoresMap[venta.vendedor]) {
          vendedoresMap[venta.vendedor] = { cantVentas: 0, totalIngresado: 0, articulosVendidos: 0 };
        }
        vendedoresMap[venta.vendedor].cantVentas += 1;
        if (venta.articulos && Array.isArray(venta.articulos)) {
          vendedoresMap[venta.vendedor].articulosVendidos += venta.articulos.length;
        }

        venta.pagos.forEach(pago => {
          movimientosList.push({
            idVenta: venta.id,
            clienteId: venta.clienteId,
            vendedor: pago.usuario,
            fecha: new Date(pago.fecha).toLocaleDateString(),
            razon: 'Cobro',
            monto: pago.monto
          });
          vendedoresMap[venta.vendedor].totalIngresado += pago.monto;
          total += pago.monto;
        });
      });

      gastosList.forEach(gasto => {
        movimientosList.push({
          idVenta: gasto.id,
          clienteId: '',
          vendedor: '',
          fecha: new Date(gasto.fecha.seconds * 1000).toLocaleDateString(),
          razon: gasto.tipo,
          monto: gasto.monto
        });
        total -= gasto.monto;
      });

      const ranking = Object.entries(vendedoresMap)
        .map(([vendedor, data]) => ({ vendedor, ...data }))
        .sort((a, b) => b.totalIngresado - a.totalIngresado)
        .slice(0, 3);

      setMovimientos(movimientosList);
      setTotalRecaudado(total);
      setRankingVendedores(ranking);
      setLoading(false);
    };

    const saveMonthlyRanking = async () => {
      const currentMonth = new Date().getMonth();
      const rankingCollection = collection(db, 'ranking');

      const q = query(rankingCollection, where('month', '==', currentMonth));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(rankingCollection, {
          month: currentMonth,
          ranking: rankingVendedores,
          date: new Date()
        });
      }
    };

    const loadRanking = async () => {
      const currentMonth = new Date().getMonth();
      const rankingCollection = collection(db, 'ranking');
      const q = query(rankingCollection, where('month', '==', currentMonth));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const savedRanking = querySnapshot.docs[0].data().ranking;
        setRankingVendedores(savedRanking);
      }

      await fetchMovimientos();
      await saveMonthlyRanking();
    };

    loadRanking();
  }, [currentUser]);

  const handleGeneratePDF = () => {
    setShowPDFPrompt(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString();
    doc.text(`Reporte de Cierre de Caja de ${today}`, 40, 30);
    const tableColumn = ["ID", "Cliente", "Vendedor", "Fecha", "Razón", "Monto"];
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

    setMovimientos([]);
    setTotalRecaudado(0);
    setShowPDFPrompt(false);
  };

  const handleGenerateResumen = () => {
    navigate('/resumen');
  };

  const handleAddGasto = async () => {
    const monto = parseFloat(gastoMonto);
    const razon = gastoRazon;
    if (monto && !isNaN(monto) && razon) {
      await addDoc(collection(db, 'gastos'), {
        monto: Math.round(monto / 1000) * 1000,
        fecha: new Date(),
        tipo: razon
      });
      alert('Gasto agregado correctamente.');
      setShowGastoForm(false);
      setGastoMonto('');
      setGastoRazon('');
    } else {
      alert('Por favor ingrese un monto y una razón válidos.');
    }
  };

  const handleShowGastoForm = () => {
    setShowGastoForm(true);
  };

  const handleCloseGastoForm = () => {
    setShowGastoForm(false);
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
                  <th>ID</th>
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
          <button onClick={handleShowGastoForm}>Agregar Gasto</button>

          <h2>Ranking de Mejores 3 Vendedores Mensuales</h2>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Cant. Ventas</th>
                  <th>Total Ingresado</th>
                </tr>
              </thead>
              <tbody>
                {rankingVendedores.length > 0 ? (
                  rankingVendedores.map((vendedor, index) => (
                    <tr key={index}>
                      <td>{vendedor.vendedor}</td>
                      <td>{vendedor.cantVentas}</td>
                      <td>${vendedor.totalIngresado.toLocaleString('es-AR')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">Aún no hay datos para el ranking de este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showGastoForm && (
            <div className="overlay">
              <div className="form-popup">
                <h3>Agregar Gasto</h3>
                <label htmlFor="gastoRazon">Razón del Gasto:</label>
                <input
                  type="text"
                  id="gastoRazon"
                  value={gastoRazon}
                  onChange={(e) => setGastoRazon(e.target.value)}
                />
                <label htmlFor="gastoMonto">Monto del Gasto:</label>
                <input
                  type="number"
                  id="gastoMonto"
                  value={gastoMonto}
                  onChange={(e) => setGastoMonto(e.target.value)}
                />
                <button onClick={handleAddGasto} className="btn btn-primary">Agregar</button>
                <button onClick={handleCloseGastoForm} className="btn btn-secondary">Cerrar</button>
              </div>
            </div>
          )}

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
