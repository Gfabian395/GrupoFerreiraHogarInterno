import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Home.css';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://i.etsystatic.com/44733518/r/il/9a3b61/5741845381/il_1080xN.5741845381_ljvq.jpg' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'path/to/VaneDavis.jpg' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor', imageUrl: 'path/to/RoFlrtin.jpg' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'path/to/FrancoGF.jpg' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor', imageUrl: 'path/to/CarmenGalarza.jpg' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'path/to/CarolB.jpg' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor', imageUrl: 'path/to/TamaraAbigail.jpg' },
  { username: 'Yuli182', password: '244962', role: 'vendedor', imageUrl: 'path/to/Yuli182.jpg' },
  { username: 'Gustavito02', password: '36520975', role: 'vendedor', imageUrl: 'path/to/Gustavito02.jpg' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor', imageUrl: 'path/to/EliasG.jpg' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor', imageUrl: 'path/to/MicaelaG.jpg' },
  { username: 'prueba', password: 'prueba', role: 'vendedor', imageUrl: 'path/to/prueba.jpg' },
];

const Home = () => {
  const [rankingVendedores, setRankingVendedores] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchRankingVendedores = async () => {
      const ventasCollection = collection(db, 'ventas');
      const ventasSnapshot = await getDocs(ventasCollection);
      const ventasList = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const vendedoresMap = {};

      ventasList.forEach(venta => {
        // Verificar si la venta es del mes actual
        const ventaDate = new Date(venta.fecha.seconds * 1000);
        if (ventaDate.getMonth() !== currentMonth) return;

        // Contabilizar ventas por vendedor
        if (!vendedoresMap[venta.vendedor]) {
          vendedoresMap[venta.vendedor] = { cantVentas: 0, totalRecaudado: 0 };
        }
        vendedoresMap[venta.vendedor].cantVentas += 1;
        vendedoresMap[venta.vendedor].totalRecaudado += venta.totalCredito;
      });

      // Generar el ranking de los mejores 3 vendedores
      const ranking = Object.entries(vendedoresMap)
        .map(([vendedor, data]) => ({ vendedor, ...data }))
        .sort((a, b) => b.totalRecaudado - a.totalRecaudado)
        .slice(0, 3);

      setRankingVendedores(ranking);
    };
    fetchRankingVendedores();
  }, [currentMonth]);

  return (
    <div className="home">
      <h2>Nuestro Mejor Vendedor del Mes</h2>
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
    </div>
  );
};

export default Home;
