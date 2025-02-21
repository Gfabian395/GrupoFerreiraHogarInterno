import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Carrito.css';

const Carrito = ({ productos, onRemoveFromCart, onClearCart }) => {
  const [hayProductosSinStock, setHayProductosSinStock] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarStock = () => {
      const haySinStock = productos.some(producto => producto.stock === 0);
      setHayProductosSinStock(haySinStock);
    };

    verificarStock();
  }, [productos]);

  const subtotal = productos.reduce((acc, producto) => acc + producto.precio * producto.cantidad, 0);

  const handleFinalizarCompra = () => {
    if (hayProductosSinStock) {
      alert('No puedes finalizar la compra, hay productos sin stock');
      return;
    }

    navigate('/ventas', { state: { subtotal, productos } });
  };

  return (
    <div className="carrito">
      <h2>Carrito</h2>
      <div className="card-container">
        {productos.map(producto => {
          const outOfStock = producto.stock === 0;
          return (
            <div className={`card ${outOfStock ? 'producto-sin-stock' : ''}`} key={producto.id}>
              <img src={producto.imagenUrl} alt={producto.nombre} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{producto.nombre}</h5>
                <p className="card-text">Precio: ${producto.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</p>
                <p className="card-text">Cantidad: {producto.cantidad}</p>
                <p className="card-text">Sucursal: {producto.sucursal}</p>
                <p className="card-text">Subtotal: ${(producto.precio * producto.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
                <button className="btn btn-danger mt-2" onClick={() => onRemoveFromCart(producto.id)} disabled={outOfStock}>Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
      <h3>Resumen del Pedido</h3>
      <p><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>

      <button className={`btn btn-primary mt-4 ${hayProductosSinStock ? 'boton-deshabilitado' : ''}`} onClick={handleFinalizarCompra} disabled={hayProductosSinStock}>Terminar Venta</button>

      <button className="btn btn-danger mt-4" onClick={onClearCart}>Vaciar Carrito</button>
    </div>
  );
};

export default Carrito;
