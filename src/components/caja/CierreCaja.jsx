import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
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

  const handleGeneratePDF = () => {
    setShowPDFPrompt(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString();
    doc.text(`Reporte de Cierre de Caja de ${today}`, 40, 30);
    const tableColumn = ["ID", "Cliente", "Vendedor", "Fecha", "Monto"];
    const tableRows = [];

    movimientos.forEach(movimiento => {
      const movimientoData = [
        movimiento.id,
        movimiento.clienteId,
        movimiento.vendedor,
        movimiento.fecha,
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

  const calcularRankingVendedores = (ventasList) => {
    const ranking = {};

    ventasList.forEach((venta) => {
      if (!ranking[venta.vendedor]) {
        ranking[venta.vendedor] = {
          vendedor: venta.vendedor,
          cantVentas: 0,
          totalIngresado: 0,
        };
      }

      ranking[venta.vendedor].cantVentas += 1;
      ranking[venta.vendedor].totalIngresado += venta.monto;
    });

    const rankingArray = Object.values(ranking).sort((a, b) => b.totalIngresado - a.totalIngresado);
    return rankingArray.slice(0, 3);
  };

  useEffect(() => {
    if (currentUser.role !== 'jefe') {
      alert('No tienes permiso para acceder a esta página.');
      navigate('/');
      return;
    }

    const checkAndResetData = async () => {
      const resetDateDoc = await getDoc(doc(db, 'config', 'resetDate'));
      const lastResetDate = resetDateDoc.exists() ? resetDateDoc.data().date.toDate() : new Date(0);
      const today = new Date();

      if (today.getDate() === 1 && lastResetDate.getMonth() !== today.getMonth()) {
        // Es el primer día del mes y no se ha reiniciado en este mes
        await resetData();
        await setDoc(doc(db, 'config', 'resetDate'), { date: today });
      } else {
        await fetchMovimientos();
      }
    };

    const resetData = async () => {
      // Aquí puedes implementar la lógica para reiniciar los datos
      setMovimientos([]);
      setTotalRecaudado(0);
      setRankingVendedores([]);
    };

    const fetchMovimientos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let total = 0;
      const today = new Date();

      const ventasHoy = ventasList.filter(venta => {
        if (venta.fecha && venta.fecha.seconds) {
          venta.fecha = new Date(venta.fecha.seconds * 1000);
        }
        return venta.fecha.getDate() === today.getDate() && venta.fecha.getMonth() === today.getMonth();
      });

      for (const venta of ventasHoy) {
        let montoRecibido = 0;
        if (venta.pagos && venta.pagos.length > 0) {
          montoRecibido = venta.pagos.reduce((total, pago) => total + parseFloat(pago.monto), 0);
        }
        venta.monto = montoRecibido;
        total += montoRecibido;
      }

      // Ordenar las ventas por fecha más reciente
      ventasHoy.sort((a, b) => b.fecha - a.fecha);

      // Convertir fechas a cadena después de ordenar
      ventasHoy.forEach(venta => {
        if (venta.fecha instanceof Date) {
          venta.fecha = venta.fecha.toLocaleDateString();
        }
      });

      setMovimientos(ventasHoy);
      setTotalRecaudado(total);
      setRankingVendedores(calcularRankingVendedores(ventasHoy));
      setLoading(false);
    };

    checkAndResetData();
  }, [currentUser, navigate]);



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
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento, index) => (
                  <tr key={index}>
                    <td>{movimiento.id || 'N/A'}</td>
                    <td>{movimiento.clienteId || 'N/A'}</td>
                    <td>{movimiento.vendedor || 'N/A'}</td>
                    <td>{movimiento.fecha || 'N/A'}</td>
                    <td>{`$${movimiento.monto.toLocaleString('es-AR')}` || 'N/A'}</td>
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
                      <td>{`$${vendedor.totalIngresado.toLocaleString('es-AR')}`}</td>
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
