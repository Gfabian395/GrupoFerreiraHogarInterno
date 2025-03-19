import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Home.css';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F5.png?alt=media&token=9530608a-7cc2-4807-bd6f-d2ce55c29c0a' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F11.png?alt=media&token=b83cafcc-a9bb-4ae0-9609-2e8f65c95d10' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yuli182', password: '244962', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Gustavito02', password: '36520975', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor', imageUrl: 'path/to/EliasG.jpg' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor', imageUrl: 'path/to/MicaelaG.jpg' },
  { username: 'prueba', password: 'prueba', role: 'vendedor', imageUrl: 'path/to/prueba.jpg' },
];

const Home = () => {
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [clientesConPagosProximos, setClientesConPagosProximos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchRankingVendedores = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const vendedoresMap = {};

      ventasList.forEach(venta => {
        if (venta.fecha && venta.fecha.seconds) {
          const ventaDate = new Date(venta.fecha.seconds * 1000);
          if (ventaDate.getMonth() !== currentMonth) return;

          if (!vendedoresMap[venta.vendedor]) {
            vendedoresMap[venta.vendedor] = { cantVentas: 0, totalIngresado: 0 };
          }
          vendedoresMap[venta.vendedor].cantVentas += 1;

          if (venta.pagos) {
            venta.pagos.forEach(pago => {
              vendedoresMap[venta.vendedor].totalIngresado += pago.monto || 0;
            });
          }
        }
      });

      const ranking = Object.entries(vendedoresMap)
        .map(([vendedor, data]) => ({ vendedor, ...data }))
        .sort((a, b) => b.totalIngresado - a.totalIngresado)
        .slice(0, 3);

      setRankingVendedores(ranking);
    };

    fetchRankingVendedores();
  }, [currentMonth]);

  useEffect(() => {
    const fetchClientesConPagosProximos = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const hoy = new Date();
      const clientesProximos = [];

      ventasList.forEach(venta => {
        const { clienteId, valorCuota, pagos, vendedor, nombreCompleto } = venta;

        const ultimaFecha = pagos && pagos.length > 0
          ? new Date(pagos[pagos.length - 1].fecha)
          : (venta.fecha && venta.fecha.seconds
            ? new Date(venta.fecha.seconds * 1000)
            : null);

        if (!ultimaFecha) return;

        const proximaFecha = new Date(ultimaFecha);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);

        const diferenciaDias = Math.floor((proximaFecha - hoy) / (1000 * 60 * 60 * 24));

        if (diferenciaDias >= 0 && diferenciaDias <= 7) {
          clientesProximos.push({
            clienteId,
            nombreCompleto,
            valorCuota,
            vendedor,
            proximaFecha: proximaFecha.toLocaleDateString('es-AR'),
          });
        }
      });

      setClientesConPagosProximos(clientesProximos);
    };

    fetchClientesConPagosProximos();
  }, []);

  return (
    <div className="home">
      <h2 className="ranking-title">Nuestro Mejor Vendedor del Mes</h2>
      <div className="ranking-container">
        {rankingVendedores.map((vendedor, index) => {
          const user = usuariosDB.find(user => user.username === vendedor.vendedor);
          return (
            <div key={index} className={`ranking-item ranking-${index + 1}`}>
              <div className="confetti"></div>
              <div className="medal">{index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}</div>
              <img src={user?.imageUrl} alt={vendedor.vendedor} className="vendedor-image" />
              <div className="vendedor-name">{vendedor.vendedor}</div>
            </div>
          );
        })}
      </div>

      <h2 className="clientes-title">Clientes que deben pagar en los próximos 7 días</h2>
      <div className="clientes-pagos-container">
        {clientesConPagosProximos.length > 0 ? (
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
                <tr key={index} className="cliente-item-row">
                  <td className="cliente-dni">{cliente.clienteId}</td>
                  <td className="cliente-cuota">${cliente.valorCuota.toLocaleString('es-AR')}</td>
                  <td className="cliente-vendedor">{cliente.vendedor}</td>
                  <td className="cliente-fecha">{cliente.proximaFecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-clientes">No hay clientes con pagos en los próximos 7 días.</p>
        )}
      </div>

    </div>
  );
};

export default Home;
