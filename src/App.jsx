import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Nav from './components/nav/Nav';
import Clientes from './components/clientes/Clientes';
import ClienteDetalles from './components/clientes/ClienteDetalles';
import Cuotas from './components/cuotas/Cuotas';
import Categorias from './components/categorias/Categorias';
import Productos from './components/productos/Productos';
import AgregarCategoria from './components/categorias/AgregarCategoria';
import AgregarProducto from './components/productos/AgregarProducto';
import Carrito from './components/carrito/Carrito';
import Ventas from './components/ventas/Ventas';
import FloatingButton from './components/Flotante/FloatingButton';
import AddCompra from './components/compras/AddCompra'; // Importa el nuevo componente

function App() {
  const [carrito, setCarrito] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  const handleAddToCart = (producto) => {
    setCarrito((prevCarrito) => {
      const existingProduct = prevCarrito.find(item => item.id === producto.id);
      if (existingProduct) {
        return prevCarrito.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad: 1 }];
    });
  };

  const handleRemoveFromCart = (productoId) => {
    setCarrito((prevCarrito) => prevCarrito.filter(item => item.id !== productoId));
  };

  const handleClearCart = () => {
    setCarrito([]);
  };

  const cartItemCount = carrito.reduce((total, product) => total + product.cantidad, 0);

  const handleAddCategoria = () => {
    console.log("Agregar nueva categoría");
  };

  const handleEditCategoria = () => {
    console.log("Editar categoría");
  };

  const handleDeleteCategoria = () => {
    console.log("Eliminar categoría");
  };

  return (
    <Router>
      <div className="App">
        <Nav cartItemCount={cartItemCount} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:clienteId/detalles" element={<ClienteDetalles />} />
          <Route path="/cuotas" element={<Cuotas monto={100000} />} />
          <Route path="/categorias" element={
            <>
              <AgregarCategoria />
              <Categorias onSelectCategoria={(id) => setSelectedCategoria(id)} />
            </>
          } />
          <Route path="/categorias/:categoriaId/productos" element={
            <>
              <AgregarProducto />
              <Productos onAddToCart={handleAddToCart} />
            </>
          } />
          <Route path="/carrito" element={<Carrito productos={carrito} onRemoveFromCart={handleRemoveFromCart} onClearCart={handleClearCart} />} />
          <Route path="/ventas" element={<Ventas carrito={carrito} onClearCart={handleClearCart} />} />
          <Route path="/add-compra" element={<AddCompra />} /> {/* Nueva ruta para agregar compras */}
        </Routes>
      </div>
    </Router>
  );
}

const Home = () => (
  <div>
    <h2>Welcome to the Video Game Store</h2>
  </div>
);

export default App;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/