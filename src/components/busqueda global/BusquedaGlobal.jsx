import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Load from '../load/Load';

const BusquedaGlobal = ({ query }) => {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const [imagenCargando, setImagenCargando] = useState(true);


  useEffect(() => {
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

    buscarProductos(query);
  }, [query]);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
      {cargando && <Load />}

      {!cargando && resultados.length > 0 && (
        <div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '1rem',
    justifyContent: 'center',
    background: 'radial-gradient(circle, rgba(128,128,128,0.4) 0%, rgba(128,128,128,0.2) 50%, rgba(128,128,128,0) 100%)',
    padding: '10px',
    margin: '10px',
    borderRadius: '20px'
  }}
>

          {resultados.map((prod) => (
            <div
              key={prod.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                width: '220px',
                padding: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white'
              }}
              onClick={() =>
                navigate(`/categorias/${prod.categoriaId}/productos`, { state: { resaltadoId: prod.id } })
              }
            >
              {prod.imagenUrl ? (
                <img
                  src={prod.imagenUrl}
                  alt={prod.nombre}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'contain',
                    borderRadius: '6px'
                  }}
                />

              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    backgroundColor: '#eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    color: '#999',
                    fontSize: '14px',
                  }}
                >
                  Sin imagen
                </div>
              )}
              <h4 style={{ margin: '10px 0 5px' }}>{prod.nombre}</h4>
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                Categoría: {prod.categoria}
              </p>
            </div>
          ))}
        </div>
      )
      }
      {
        !cargando && resultados.length === 0 && query && (
          <p>No se encontraron productos con ese nombre.</p>
        )
      }
    </div >
  );
};

export default BusquedaGlobal;
