import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Carrito.css';

const configuracionCuotas = [
    { cuotas: 2, interes: 15 },
    { cuotas: 3, interes: 25 },
    { cuotas: 4, interes: 40 },
    { cuotas: 6, interes: 60 },
    { cuotas: 9, interes: 75 },
    { cuotas: 12, interes: 100 },
    { cuotas: 18, interes: 150 },
    { cuotas: 24, interes: 180 }
];

function formatearNumero(valor) {
    valor = valor.replace(/\./g, '');
    valor = parseInt(valor, 10);
    return !isNaN(valor) ? valor.toLocaleString('es-AR') : '';
}

const Carrito = ({ productos, onRemoveFromCart, onClearCart }) => {
  const [cuotas, setCuotas] = useState([]);
  const [sucursal, setSucursal] = useState('Andes 4034'); // Estado para la sucursal
  const [stockDisponible, setStockDisponible] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulación del stock disponible. Este dato debería obtenerse de la base de datos.
    const stock = {
      'Andes 4034': productos.map(producto => ({ id: producto.id, stock: producto.cantidadDisponibleAndes4034 })),
      'Andes 4320': productos.map(producto => ({ id: producto.id, stock: producto.cantidadDisponibleAndes4320 }))
    };
    setStockDisponible(stock[sucursal] || []);
  }, [sucursal, productos]);

  const handleSucursalChange = (e) => {
    setSucursal(e.target.value);
  };

  const subtotal = productos.reduce((acc, producto) => acc + producto.precio * producto.cantidad, 0);

  const calcularCuotas = () => {
    if (isNaN(subtotal) || subtotal <= 0) {
      setCuotas([{ mensaje: "Por favor, ingrese un monto válido." }]);
      return;
    }

    const cuotasFiltradas = configuracionCuotas.filter(opcion => {
      if (subtotal < 30000) return opcion.cuotas <= 2;
      if (subtotal >= 30000 && subtotal < 80000) return opcion.cuotas <= 3;
      if (subtotal >= 80000 && subtotal < 150000) return opcion.cuotas <= 6;
      if (subtotal >= 150000 && subtotal < 250000) return opcion.cuotas <= 9;
      if (subtotal >= 250000 && subtotal < 350000) return opcion.cuotas <= 12;
      if (subtotal >= 350000 && subtotal < 500000) return opcion.cuotas <= 18;
      return true;
    });

    const resultados = cuotasFiltradas.map(opcion => {
      const { cuotas, interes } = opcion;
      const montoConInteres = subtotal * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000; // Redondear al múltiplo de 1000 más cercano
      return {
        cuotas,
        montoCuota: montoCuota.toLocaleString('es-AR')
      };
    });

    setCuotas(resultados);
  };

  useEffect(() => {
    calcularCuotas();
  }, [productos, subtotal]);

  const handleFinalizarCompra = () => {
    calcularCuotas();

    // Usar el primer resultado de cuotas para finalizar la compra
    if (cuotas.length > 0 && !cuotas[0].mensaje) {
      const cuotasSeleccionadas = cuotas[0].cuotas;
      const interes = configuracionCuotas.find(c => c.cuotas === cuotasSeleccionadas)?.interes || 0;
      const totalCredito = subtotal * (1 + interes / 100);
      const valorCuota = Math.round(totalCredito / cuotasSeleccionadas / 1000) * 1000; // Redondear al múltiplo de 1000 más cercano

      // Navegar a la página de ventas con la información de cuotas, total de crédito, y productos
      navigate('/ventas', { state: { sucursal, subtotal, cuotas: cuotasSeleccionadas, valorCuota, totalCredito, productos } });
    }
  };

  return (
    <div className="carrito">
      <h2>Carrito</h2>
      <div className="card-container">
        {productos.map(producto => (
          <div className="card" key={producto.id}>
            <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{producto.nombre}</h5>
              <p className="card-text">Precio: ${producto.precio.toLocaleString('es-AR')}</p>
              <p className="card-text">Cantidad: {producto.cantidad}</p>
              <p className="card-text">Subtotal: ${(producto.precio * producto.cantidad).toLocaleString('es-AR')}</p>
              <p className="card-text">Stock Disponible en {sucursal}: {stockDisponible.find(stock => stock.id === producto.id)?.stock || 0}</p>
              <div className="form-group">
                <label htmlFor="sucursal">Seleccionar Sucursal:</label>
                <select id="sucursal" className="form-control" value={sucursal} onChange={handleSucursalChange}>
                  <option value="Andes 4034">Andes 4034</option>
                  <option value="Andes 4320">Andes 4320</option>
                </select>
              </div>
              <button className="btn btn-danger mt-2" onClick={() => onRemoveFromCart(producto.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      <h3>Resumen del Pedido</h3>
      <p><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-AR')}</p>

      <button className="btn btn-primary mt-4" onClick={handleFinalizarCompra}>Terminar Venta</button>

      <button className="btn btn-danger mt-4" onClick={onClearCart}>Vaciar Carrito</button>
    </div>
  );
};

export default Carrito;
