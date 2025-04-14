import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Carrito.css';

const Carrito = ({ productos, onRemoveFromCart, onClearCart }) => {
  const [hayProductosSinStock, setHayProductosSinStock] = useState(false);
  const [descuento, setDescuento] = useState(0); // Estado para el % de descuento
  const navigate = useNavigate();

  useEffect(() => {
    const verificarStock = () => {
      const haySinStock = productos.some(producto => {
        const stockField = `cantidadDisponible${producto.sucursal.replace(/\s/g, '')}`;
        return producto[stockField] === 0 || producto[stockField] === undefined;
      });
      setHayProductosSinStock(haySinStock);
    };

    verificarStock();
  }, [productos]);

  const subtotal = productos.reduce((acc, producto) => {
    const totalProducto = producto.precio * producto.cantidad || 0;
    return acc + totalProducto;
  }, 0);

  const subtotalConDescuento = subtotal - (subtotal * descuento) / 100;

  const handleFinalizarCompra = () => {
    console.log('Datos enviados al finalizar:', { subtotal, descuento, subtotalConDescuento, productos });

    if (hayProductosSinStock) {
      alert('No puedes finalizar la compra, hay productos sin stock.');
      return;
    }

    const sucursal = productos.length > 0 ? productos[0].sucursal : '';
    navigate('/ventas', { state: { subtotal: subtotalConDescuento, productos, sucursal } });
  };

  return (
    <div className="carrito">
      <h2>Carrito</h2>
      <div className="card-container">
        {productos.map(producto => {
          const stockField = `cantidadDisponible${producto.sucursal.replace(/\s/g, '')}`;
          const stock = producto[stockField] || 0;
          const outOfStock = stock === 0;

          return (
            <div
              key={producto.id}
              className={`card ${outOfStock ? 'producto-sin-stock' : ''}`}
            >
              <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{producto.nombre}</h5>
                <p className="card-text">Precio: ${producto.precio.toLocaleString('es-AR')}</p>
                <p className="card-text">Cantidad: {producto.cantidad}</p>
                <p className="card-text">Sucursal: {producto.sucursal}</p>
                <p className="card-text">
                  Subtotal: $
                  {(producto.precio * producto.cantidad).toLocaleString('es-AR')}
                </p>
                <button
                  className="btn btn-danger mt-2"
                  onClick={() => onRemoveFromCart(producto.id)}
                  disabled={outOfStock}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h3>Resumen del Pedido</h3>
      
      <label htmlFor="descuentoSelect"><strong>Descuento:</strong></label>
      <select
        id="descuentoSelect"
        className="form-select mt-2 mb-3"
        value={descuento}
        onChange={(e) => setDescuento(Number(e.target.value))}
      >
        <option value={0}>Sin descuento</option>
        <option value={5}>5%</option>
        <option value={10}>10%</option>
        <option value={15}>15%</option>
        <option value={20}>20%</option>
      </select>

      <p><strong>Subtotal sin descuento:</strong> ${subtotal.toLocaleString('es-AR')}</p>
      <p><strong>Subtotal con descuento:</strong> ${subtotalConDescuento.toLocaleString('es-AR')}</p>

      <button
        className={`btn btn-primary mt-4 ${hayProductosSinStock ? 'boton-deshabilitado' : ''}`}
        onClick={handleFinalizarCompra}
        disabled={hayProductosSinStock}
      >
        Terminar Venta
      </button>

      <button className="btn btn-danger mt-4" onClick={onClearCart}>
        Vaciar Carrito
      </button>
    </div>
  );
};

export default Carrito;
