import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const BusquedaGlobal = () => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const buscarProductos = async (busqueda) => {
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }

    setCargando(true);
    const resultadosTemp = [];

    try {
      const categoriasSnapshot = await getDocs(collection(db, 'categorias'));

      for (const categoriaDoc of categoriasSnapshot.docs) {
        const categoriaId = categoriaDoc.id;
        const categoriaNombre = categoriaDoc.data().nombre;

        const productosSnapshot = await getDocs(
          collection(db, `categorias/${categoriaId}/productos`)
        );

        productosSnapshot.forEach(productoDoc => {
          const productoData = productoDoc.data();
          const nombre = productoData.nombre?.toLowerCase() || '';

          if (nombre.includes(busqueda.toLowerCase())) {
            resultadosTemp.push({
              ...productoData,
              id: productoDoc.id,
              categoria: categoriaNombre,
              categoriaId: categoriaId
            });
          }
        });
      }

      setResultados(resultadosTemp);
    } catch (error) {
      console.error('Error al buscar productos:', error);
    }

    setCargando(false);
  };

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      buscarProductos(query);
    }, 500); // Espera 500ms después de dejar de escribir

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-bar"
        style={{ padding: '0.5rem', width: '100%' }}
      />

      {cargando && <p>Buscando productos...</p>}

      {!cargando && resultados.length > 0 && (
        <ul style={{ marginTop: '1rem' }}>
          {resultados.map((prod, i) => (
            <li key={i}>
              <strong>{prod.nombre}</strong> — Categoría: {prod.categoria}
              {/* Puedes agregar aquí un botón para ir a ese producto */}
            </li>
          ))}
        </ul>
      )}

      {!cargando && resultados.length === 0 && query && (
        <p>No se encontraron productos con ese nombre.</p>
      )}
    </div>
  );
};

export default BusquedaGlobal;
