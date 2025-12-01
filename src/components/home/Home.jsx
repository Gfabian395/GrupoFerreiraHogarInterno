import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [clientesConPagosProximos, setClientesConPagosProximos] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [vendedoresUnicos, setVendedoresUnicos] = useState([]);
  const navigate = useNavigate();

  // 🔹 Función para parsear fechas YYYY-MM-DD como local
  const parseFechaLocal = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    const fetchClientesConPagosProximos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const clientesCollection = collection(db, 'clientes');

      const [ventasSnapshot, clientesSnapshot] = await Promise.all([
        getDocs(ventasCollection),
        getDocs(clientesCollection)
      ]);

      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const clientesList = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const hoy = new Date();
      const clientesProximos = [];

      ventasList.forEach(venta => {
        const { clienteId, valorCuota, pagos = [], totalCredito, vendedor, nombreCompleto, proximaFechaPago } = venta;

        const clienteInfo = clientesList.find(c => c.dni === clienteId);
        if (clienteInfo?.bloqueado) return;

        const totalPagado = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
        if (totalPagado >= totalCredito) return;

        // 🔹 Calcular próxima fecha correctamente
        let proximaFecha;
        if (proximaFechaPago) {
          proximaFecha = parseFechaLocal(proximaFechaPago);
        } else {
          const ultimaFecha = pagos.length > 0
            ? parseFechaLocal(pagos[pagos.length - 1].fecha)
            : venta.fecha?.seconds
              ? new Date(venta.fecha.seconds * 1000)
              : null;
          if (!ultimaFecha) return;

          proximaFecha = new Date(ultimaFecha);
          proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        }

        const diferenciaDias = Math.floor((proximaFecha - hoy) / (1000 * 60 * 60 * 24));

        if (diferenciaDias < 0 || (diferenciaDias <= 7 && diferenciaDias >= 0)) {
          clientesProximos.push({
            clienteId,
            ventaId: venta.id,
            nombreCompleto,
            valorCuota,
            vendedor,
            proximaFecha: proximaFecha.toLocaleDateString('es-AR'),
            atrasado: diferenciaDias < 0,
          });
        }
      });

      // Ordenar por fecha
      clientesProximos.sort((a, b) => {
        const dateA = a.proximaFecha.split('/').reverse().join('-');
        const dateB = b.proximaFecha.split('/').reverse().join('-');
        return new Date(dateA) - new Date(dateB);
      });

      // FILTRAR SOLO VENDEDORES CON CLIENTES A COBRAR
      const vendedoresConClientes = [
        ...new Set(clientesProximos.map(c => c.vendedor))
      ];
      setVendedoresUnicos(vendedoresConClientes);

      setClientesConPagosProximos(clientesProximos);
    };

    fetchClientesConPagosProximos();
  }, []);

  const handleDniDobleClick = (clienteId, ventaId) => {
    marcarRevisado(clienteId);
    setClientesConPagosProximos(prev => [...prev]);

    const url = `/clientes/${clienteId}/detalles?venta=${ventaId}`;
    const win = window.open(url, "_blank");
    if (win) win.focus();
  };

  const marcarRevisado = (dni) => {
    const reset = new Date();
    reset.setHours(23, 59, 59, 999);

    const data = {
      revisado: true,
      expira: reset.getTime(),
    };

    localStorage.setItem(`rev_${dni}`, JSON.stringify(data));
  };

  const estaRevisado = (dni) => {
    const item = localStorage.getItem(`rev_${dni}`);
    if (!item) return false;

    const data = JSON.parse(item);

    if (Date.now() > data.expira) {
      localStorage.removeItem(`rev_${dni}`);
      return false;
    }

    return true;
  };

  return (
    <div className="home">
      <h2 className="clientes-title">Clientes que deben pagar en los próximos 7 días</h2>

      <button className="btn-toggle" onClick={() => setMostrarTabla(!mostrarTabla)}>
        {mostrarTabla ? "Ocultar tabla" : "Mostrar tabla"}
      </button>

      {/* FILTRO POR VENDEDOR */}
      {mostrarTabla && (
        <div className="filtro-container">
          <label className="filtro-label">Filtrar por vendedor:</label>
          <select
            value={vendedorFiltro}
            onChange={(e) => setVendedorFiltro(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos</option>
            {vendedoresUnicos.map((v, index) => (
              <option key={index} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      <div className="clientes-pagos-container">
        {mostrarTabla && (
          clientesConPagosProximos.length > 0 ? (
            <table className="clientes-table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Monto de Cuota</th>
                  <th>Vendedor</th>
                  <th>Próxima Fecha de Pago</th>
                </tr>
              </thead>
              <tbody>
                {clientesConPagosProximos
                  .filter(c => vendedorFiltro === "" || c.vendedor === vendedorFiltro)
                  .map((cliente, index) => (
                    <tr
                      key={`${cliente.clienteId}-${index}`}
                      className={`cliente-item-row ${cliente.atrasado ? 'cliente-atrasado' : ''}`}
                    >
                      <td
                        className="cliente-dni"
                        onDoubleClick={() => handleDniDobleClick(cliente.clienteId, cliente.ventaId)}
                        title="Doble clic para ver y marcar revisado"
                      >
                        <span>{cliente.clienteId}</span>
                        {estaRevisado(cliente.clienteId) && <span className="revisado-check">✔</span>}
                      </td>
                      <td className="cliente-cuota">
                        ${typeof cliente.valorCuota === 'number'
                          ? cliente.valorCuota.toLocaleString('es-AR')
                          : cliente.valorCuota}
                      </td>
                      <td className="cliente-vendedor">{cliente.vendedor}</td>
                      <td className="cliente-fecha">{cliente.proximaFecha}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="no-clientes">No hay clientes con pagos en los próximos 7 días.</p>
          )
        )}
      </div>
    </div>
  );
};

export default Home;
