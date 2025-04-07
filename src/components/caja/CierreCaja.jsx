import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '../../firebaseConfig';
import './CierreCaja.css';
import Load from '../load/Load';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'Vanesa F', password: '554972', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'Ronaldo F', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'Franco A', password: 'Grupof2025', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carmen G', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F5.png?alt=media&token=9530608a-7cc2-4807-bd6f-d2ce55c29c0a' },
  { username: 'Carol F', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F11.png?alt=media&token=b83cafcc-a9bb-4ae0-9609-2e8f65c95d10' },
  { username: 'Tamara G', password: 'Tamara07', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yulisa G', password: '244962', role: 'encargado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Gustavo F', password: '36520975', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor', imageUrl: 'path/to/EliasG.jpg' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor', imageUrl: 'path/to/MicaelaG.jpg' },
  { username: 'prueba', password: 'prueba', role: 'vendedor', imageUrl: 'path/to/prueba.jpg' },
];

const CierreCaja = ({ currentUser }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [showPDFPrompt, setShowPDFPrompt] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoRazon, setGastoRazon] = useState('');
  const [otraRazon, setOtraRazon] = useState('');
  const totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser.role !== 'jefe') {
      alert('No tienes permiso para acceder a esta página.');
      navigate('/');
      return;
    }

    const checkAndResetData = async () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      let shouldReset = false;

      try {
        const resetDateDoc = await getDoc(doc(db, 'config', 'resetDate'));
        if (!resetDateDoc.exists()) {
          shouldReset = today.getDate() === 1;
        } else {
          const lastResetDate = resetDateDoc.data().date.toDate();
          shouldReset = today.getDate() === 1 &&
            (lastResetDate.getMonth() !== currentMonth || lastResetDate.getFullYear() !== currentYear);
        }

        if (shouldReset) {
          await resetData();
          await setDoc(doc(db, 'config', 'resetDate'), { date: today });
        }

        await fetchMovimientos();
        await fetchGastos();
      } catch (error) {
        console.error('Error al verificar o reiniciar datos:', error);
      }
    };

    const resetData = async () => {
      setMovimientos([]);
      setTotalRecaudado(0);
      setRankingVendedores([]);
      setGastos([]);
    };

    const fetchMovimientos = async () => {
      try {
        const ventasSnapshot = await getDocs(collection(db, 'ventas'));
        const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        let total = 0;

        const ventasDelMes = ventasList.filter(venta => {
          const fecha = venta.fecha?.seconds ? new Date(venta.fecha.seconds * 1000) : null;
          venta.fecha = fecha;
          return fecha && fecha >= firstDay && fecha <= lastDay;
        });

        for (const venta of ventasDelMes) {
          venta.monto = venta.pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;
          total += venta.monto;
        }

        ventasDelMes.sort((a, b) => b.fecha - a.fecha);
        ventasDelMes.forEach(v => {
          if (v.fecha instanceof Date) v.fecha = v.fecha.toLocaleDateString('es-AR');
        });

        setMovimientos(ventasDelMes);
        setTotalRecaudado(total);
        setRankingVendedores(calcularRankingVendedores(ventasDelMes));
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
      }
    };

    const fetchGastos = async () => {
      try {
        const gastosSnapshot = await getDocs(collection(db, 'gastos'));
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        const gastosFiltrados = gastosSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(gasto => {
            const fecha = gasto.fecha?.seconds ? new Date(gasto.fecha.seconds * 1000) : null;
            gasto.fecha = fecha;
            return fecha && fecha >= primerDia && fecha <= ultimoDia;
          })
          .map(gasto => ({
            ...gasto,
            fechaStr: gasto.fecha.toLocaleDateString('es-AR')
          }));

        setGastos(gastosFiltrados);
      } catch (error) {
        console.error('Error al obtener gastos:', error);
      }
    };

    checkAndResetData();
  }, [currentUser, navigate]);


  const calcularRankingVendedores = (ventas) => {
    const ranking = {};
    ventas.forEach(({ vendedor, monto }) => {
      if (!ranking[vendedor]) {
        ranking[vendedor] = { vendedor, cantVentas: 0, totalIngresado: 0 };
      }
      ranking[vendedor].cantVentas += 1;
      ranking[vendedor].totalIngresado += monto;
    });
    return Object.values(ranking).sort((a, b) => b.totalIngresado - a.totalIngresado);
  };

  const handleGeneratePDF = () => setShowPDFPrompt(true);

  const generatePDF = () => {
    const docPDF = new jsPDF('p', 'pt', 'a4');
    const today = new Date().toLocaleDateString();
    docPDF.setFontSize(10);
    docPDF.text(`Reporte de Cierre de Caja de ${today}`, 40, 30);

    const tableRows = movimientos.map(m => [
      m.id,
      m.clienteId,
      m.vendedor,
      m.fecha,
      `$${m.monto.toLocaleString('es-AR')}`
    ]);

    docPDF.autoTable({
      head: [["ID", "Cliente", "Vendedor", "Fecha", "Monto"]],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    docPDF.text(`Total Recaudado: $${totalRecaudado.toLocaleString('es-AR')}`, 40, docPDF.autoTable.previous.finalY + 20);
    docPDF.save('cierre_caja.pdf');

    setMovimientos([]);
    setTotalRecaudado(0);
    setShowPDFPrompt(false);
  };

  const handleAddGasto = async () => {
    const monto = parseFloat(gastoMonto);
    let razon = '';

    if (gastoRazon === 'Anticipos') {
      if (!otraRazon) {
        alert('Debe seleccionar un vendedor para el anticipo.');
        return;
      }
      razon = `Anticipo ${otraRazon}`;
    } else if (gastoRazon === 'Otros') {
      if (!otraRazon) {
        alert('Debe especificar la razón del gasto.');
        return;
      }
      razon = otraRazon;
    } else {
      razon = gastoRazon;
    }

    if (monto && razon && !isNaN(monto)) {
      const nuevoGasto = {
        monto: Math.round(monto / 1000) * 1000,
        fecha: new Date(),
        tipo: razon
      };
      await addDoc(collection(db, 'gastos'), nuevoGasto);

      alert('Gasto agregado correctamente.');
      setShowGastoForm(false);
      setGastoMonto('');
      setGastoRazon('');
      setOtraRazon('');
      await fetchGastos();
    } else {
      alert('Por favor ingrese un monto y una razón válidos.');
    }
  };

  return (
    <div className="cierre-caja">
      <h2>Cierre de Caja</h2>
      {loading ? <Load /> : (
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
                {movimientos.map((m, i) => (
                  <tr key={i}>
                    <td>{m.id || 'N/A'}</td>
                    <td>{m.clienteId || 'N/A'}</td>
                    <td>{m.vendedor || 'N/A'}</td>
                    <td>{m.fecha || 'N/A'}</td>
                    <td>{`$${m.monto.toLocaleString('es-AR')}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Total Recaudado: ${totalRecaudado.toLocaleString('es-AR')}</h3>
          <button onClick={handleGeneratePDF}>Generar PDF</button>
          <button onClick={() => navigate('/resumen')}>Ver Resumen</button>
          <button onClick={() => setShowGastoForm(true)}>Agregar Gasto</button>

          <h2>Gastos del Mes</h2>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.length > 0 ? (
                  gastos.map((g, i) => (
                    <tr key={i}>
                      <td>{g.fechaStr}</td>
                      <td>{g.tipo}</td>
                      <td>{`$${g.monto.toLocaleString('es-AR')}`}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3">No se registraron gastos este mes.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total afuera de la tabla, igual que el otro */}
          <h3>Total Gastado: ${gastos.reduce((acc, g) => acc + g.monto, 0).toLocaleString('es-AR')}</h3>

          <h2>Ranking de Vendedores del Mes</h2>
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
                {rankingVendedores.length > 0 ? rankingVendedores.map((v, i) => (
                  <tr key={i}>
                    <td>{v.vendedor}</td>
                    <td>{v.cantVentas}</td>
                    <td>{`$${v.totalIngresado.toLocaleString('es-AR')}`}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="3">Aún no hay datos para el ranking de este mes.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tabla de ranking de vendedores (ya existente arriba) */}

          <div className="resumen-final" style={{
            marginTop: '20px',
            padding: '20px',
            border: '2px solid #28a745',
            borderRadius: '10px',
            backgroundColor: '#e9fbe5',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: '#155724'
          }}>
            Dinero en Mano: ${(totalRecaudado - totalGastado).toLocaleString('es-AR')}
          </div>

          {showGastoForm && (
            <div className="overlay">
              <div className="form-popup">
                <h3>Agregar Gasto</h3>

                <label>Razón del Gasto:</label>
                <select value={gastoRazon} onChange={e => setGastoRazon(e.target.value)}>
                  <option value="">Seleccione una opción</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Anticipos">Anticipos</option>
                  <option value="Proveedores">Proveedores</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Otros">Otros</option>
                </select>

                {gastoRazon === 'Anticipos' && (
                  <>
                    <label>Seleccioná el Vendedor:</label>
                    <select value={otraRazon} onChange={e => setOtraRazon(e.target.value)}>
                      <option value="">Seleccionar vendedor</option>
                      {usuariosDB
                        .filter(user => user.role === 'vendedor' || user.role === 'encargado')
                        .map((user, index) => (
                          <option key={index} value={user.username}>
                            {user.username}
                          </option>
                        ))}
                    </select>
                  </>
                )}

                {/* Si se elige "Otros", pedir razón personalizada */}
                {gastoRazon === 'Otros' && (
                  <>
                    <label>Especifique otra razón:</label>
                    <input
                      type="text"
                      value={otraRazon}
                      onChange={e => setOtraRazon(e.target.value)}
                    />
                  </>
                )}

                <label>Monto:</label>
                <input
                  type="number"
                  value={gastoMonto}
                  onChange={e => setGastoMonto(e.target.value)}
                />

                <button onClick={handleAddGasto}>Guardar Gasto</button>
                <button onClick={() => setShowGastoForm(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CierreCaja;