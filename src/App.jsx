import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import AddCompra from './components/compras/AddCompra';
import Login from './components/login/Login';
import CierreCaja from './components/caja/CierreCaja';
import Home from './components/home/Home';
import Resumen from './components/resumen/Resumen';
import DetalleProducto from './components/productos/DetalleProducto';

function App() {
  const [carrito, setCarrito] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('usuario');
    if (savedUser) {
      let parsedUser = JSON.parse(savedUser);

      if (typeof parsedUser.role === 'string') {
        parsedUser.role = [parsedUser.role];
      }

      setUsuario(parsedUser);
    }
  }, []);

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

  const handleLogin = (user) => {
    if (typeof user.role === 'string') {
      user.role = [user.role];
    }
    localStorage.setItem('usuario', JSON.stringify(user));
    setUsuario(user);
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <Router>
      <div className="App">
        {!usuario ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <Nav
              cartItemCount={cartItemCount}
              onLogout={handleLogout}
              username={usuario.username}
              role={usuario.role}
              profileImage={usuario.imageUrl}
            />

            <Routes>
              <Route
                path="/"
                element={
                  usuario.role && !usuario.role.includes('invitado')
                    ? <Home />
                    : <Navigate to="/categorias" />
                }
              />

              <Route path="/clientes" element={<Clientes currentUser={usuario} />} />
              <Route path="/clientes/:clienteId/detalles" element={<ClienteDetalles currentUser={usuario} />} />
              <Route path="/cliente/:clienteId" element={<ClienteDetalles currentUser={usuario} />} /> {/* ✅ Agregada */}

              <Route path="/cuotas" element={<Cuotas monto={100000} />} />

              <Route path="/categorias" element={
                <>
                  <AgregarCategoria currentUser={usuario} />
                  <Categorias onSelectCategoria={(id) => setSelectedCategoria(id)} currentUser={usuario} />
                </>
              } />

              <Route path="/categorias/:categoriaId/productos" element={
                <>
                  <AgregarProducto currentUser={usuario} />
                  <Productos onAddToCart={handleAddToCart} currentUser={usuario} />
                </>
              } />

              <Route path="/carrito" element={
                <Carrito
                  productos={carrito}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  currentUser={usuario} // <-- PASÁ EL OBJETO DEL USUARIO ACTUAL ACÁ
                />

              } />

              <Route path="/ventas" element={<Ventas carrito={carrito} onClearCart={handleClearCart} currentUser={usuario} />} />
              <Route path="/ventas/:ventaId/detalles" element={<ClienteDetalles currentUser={usuario} />} />
              <Route path="/add-compra" element={<AddCompra />} />

              <Route
                path="/cierre-caja"
                element={
                  usuario.role.includes('jefe')
                    ? <CierreCaja currentUser={usuario} />
                    : <Navigate to="/" />
                }
              />

              <Route
                path="/resumen"
                element={
                  usuario.role.includes('jefe')
                    ? <Resumen />
                    : <Navigate to="/" />
                }
              />

              <Route path="/producto/:categoriaId/:productoId" element={<DetalleProducto />} />

            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;




