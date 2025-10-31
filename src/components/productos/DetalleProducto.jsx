import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Load from "../load/Load";
import "./DetalleProducto.css";

export default function DetalleProducto() {
  const { categoriaId, productoId } = useParams();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cuotasDisponibles, setCuotasDisponibles] = useState([]);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
        const productoSnap = await getDoc(productoRef);
        if (productoSnap.exists()) {
          const data = productoSnap.data();
          setProducto({ id: productoSnap.id, ...data });

          // Calcular cuotas según el precio
          const precio = data.precio || 0;
          const cuotas = [
            { cuotas: 1, interes: 0 },
            { cuotas: 2, interes: 15 },
            { cuotas: 3, interes: 25 },
            { cuotas: 4, interes: 40 },
            { cuotas: 6, interes: 60 },
            { cuotas: 9, interes: 75 },
            { cuotas: 12, interes: 100 },
          ].filter((c) => {
            if (precio < 30000) return c.cuotas <= 2;
            if (precio >= 30000 && precio < 80000) return c.cuotas <= 3;
            if (precio >= 80000 && precio < 150000) return c.cuotas <= 6;
            if (precio >= 150000 && precio < 250000) return c.cuotas <= 9;
            if (precio >= 250000) return c.cuotas <= 12;
            return true;
          });

          setCuotasDisponibles(cuotas);
        }
      } catch (error) {
        console.error("Error al obtener producto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [categoriaId, productoId]);

  if (loading) return <Load />;
  if (!producto) return <p>Producto no encontrado</p>;

  // 🔹 Detectar modelos tipo Andes y formatear nombres
  const modelosAndes = Object.entries(producto)
    .filter(([key]) => key.toLowerCase().includes("andes") && producto[key] > 0)
    .map(([key, value]) => ({
      modelo: key.replace(/cantidaddisponibleandes/gi, "Los Andes "),
      cantidad: value,
    }));

  return (
    <div className="detalle-container">
      <div className="detalle-card">
        <img src={producto.imagenUrl} alt={producto.nombre} className="detalle-imagen" />
        <div className="detalle-info">
          <h2>{producto.nombre}</h2>
          <p className="descripcion">{producto.descripcion}</p>
          <p className="precio">${producto.precio?.toLocaleString("es-AR")}</p>

          {/* 🔹 Mostrar disponibilidad por modelo */}
          {modelosAndes.length > 0 && (
            <div className="stock-modelos">
              <h4>Disponibilidad por modelo:</h4>
              <ul>
                {modelosAndes.map((m) => (
                  <li key={m.modelo}>
                    {m.modelo}: <strong>{m.cantidad}</strong> unidades
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🔹 Mostrar cuotas */}
          <div className="cuotas">
            <h4>Opciones de cuotas</h4>
            <ul>
              {cuotasDisponibles.map((c) => {
                const montoConInteres = producto.precio * (1 + c.interes / 100);
                const montoCuota = Math.round(montoConInteres / c.cuotas / 100) * 100;
                return (
                  <li key={c.cuotas}>
                    {c.cuotas === 1
                      ? `1 pago sin interés de $${montoCuota.toLocaleString("es-AR")}`
                      : `${c.cuotas} cuotas de $${montoCuota.toLocaleString("es-AR")}`}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
