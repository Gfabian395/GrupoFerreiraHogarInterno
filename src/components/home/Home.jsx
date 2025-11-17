import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [clientesConPagosProximos, setClientesConPagosProximos] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false); // 👈 OCULTA POR DEFECTO
  const navigate = useNavigate();

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
        const { clienteId, valorCuota, pagos = [], totalCredito, vendedor, nombreCompleto } = venta;

        // ❌ excluir si está bloqueado
        const clienteInfo = clientesList.find(c => c.dni === clienteId);
        if (clienteInfo?.bloqueado) return;

        const totalPagado = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
        if (totalPagado >= totalCredito) return;

        const ultimaFecha = pagos.length > 0
          ? new Date(pagos[pagos.length - 1].fecha)
          : venta.fecha?.seconds
            ? new Date(venta.fecha.seconds * 1000)
            : null;

        if (!ultimaFecha) return;

        const proximaFecha = new Date(ultimaFecha);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);

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

      setClientesConPagosProximos(clientesProximos);
    };

    fetchClientesConPagosProximos();
  }, []);

  const handleDniDobleClick = (clienteId, ventaId) => {
    navigate(`/cliente/${clienteId}`, {
      state: { ventaId }
    });
  };

  return (
    <div className="home">
      <h2 className="clientes-title">Clientes que deben pagar en los próximos 7 días</h2>

      {/* 🔘 BOTÓN MOSTRAR / OCULTAR */}
      <button
        className="btn-toggle"
        onClick={() => setMostrarTabla(!mostrarTabla)}
      >
        {mostrarTabla ? "Ocultar tabla" : "Mostrar tabla"}
      </button>

      <div className="clientes-pagos-container">

        {mostrarTabla && (  // 👈 SOLO SE MUESTRA SI mostrarTabla = true
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
                {clientesConPagosProximos.map((cliente, index) => (
                  <tr
                    key={`${cliente.clienteId}-${index}`}
                    className={`cliente-item-row ${cliente.atrasado ? 'cliente-atrasado' : ''}`}
                  >
                    <td
                      className="cliente-dni"
                      onDoubleClick={() => handleDniDobleClick(cliente.clienteId, cliente.ventaId)}
                      title="Doble clic para ver las compras"
                      style={{ cursor: 'pointer', fontWeight: 'bold', color: '#007bff' }}
                    >
                      {cliente.clienteId}
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
