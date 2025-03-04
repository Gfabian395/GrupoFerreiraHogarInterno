import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Home.css';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://i.etsystatic.com/44733518/r/il/9a3b61/5741845381/il_1080xN.5741845381_ljvq.jpg' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'path/to/VaneDavis.jpg' },
  { username: 'Ronaldo F', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2FRONY.jpg?alt=media&token=0d4972fd-aaad-4bdf-8aa3-8cec741a6c22' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'path/to/FrancoGF.jpg' },
  { username: 'Carmen G', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2FGORDIS.jpg?alt=media&token=daf50c13-9c88-49ba-85d2-6f61e01bd322' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'path/to/CarolB.jpg' },
  { username: 'Tamara G', password: 'Tamara07', role: 'vendedor', imageUrl: 'path/to/TamaraAbigail.jpg' },
  { username: 'Yuli G', password: '244962', role: 'vendedor', imageUrl: 'path/to/Yuli182.jpg' },
  { username: 'Gustavo F', password: '36520975', role: 'vendedor', imageUrl: 'path/to/Gustavito02.jpg' },
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
        // Verificar si la venta tiene una fecha válida
        if (venta.fecha && venta.fecha.seconds) {
          const ventaDate = new Date(venta.fecha.seconds * 1000);
          if (ventaDate.getMonth() !== currentMonth) return;

          // Contabilizar ventas por vendedor
          if (!vendedoresMap[venta.vendedor]) {
            vendedoresMap[venta.vendedor] = { cantVentas: 0, totalIngresado: 0 };
          }
          vendedoresMap[venta.vendedor].cantVentas += 1;

          venta.pagos.forEach(pago => {
            vendedoresMap[venta.vendedor].totalIngresado += pago.monto; // Sumar el monto del anticipo o venta al contado
          });
        }
      });

      // Generar el ranking de los mejores 3 vendedores
      const ranking = Object.entries(vendedoresMap)
        .map(([vendedor, data]) => ({ vendedor, ...data }))
        .sort((a, b) => b.totalIngresado - a.totalIngresado)
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
