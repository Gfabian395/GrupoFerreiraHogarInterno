import React, { useState } from 'react';
import './Login.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F5.png?alt=media&token=9530608a-7cc2-4807-bd6f-d2ce55c29c0a' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'path/to/CarolB.jpg' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yuli182', password: '244962', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Gustavito02', password: '36520975', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor', imageUrl: 'path/to/EliasG.jpg' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor', imageUrl: 'path/to/MicaelaG.jpg' },
  { username: 'prueba', password: 'prueba', role: 'vendedor', imageUrl: 'path/to/prueba.jpg' },
];

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');

  const handleLogin = () => {
    const usuario = usuariosDB.find(user => user.username === username && user.password === password);

    if (usuario) {
      // Guardar la información del usuario en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuario));
      if (usuario.role === 'jefe') {
        alert('Bienvenido, jefe!');
      }
      onLogin(usuario);
    } else {
      setAlerta('Usuario o contraseña incorrectos');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Ingresar</h2>
        {alerta && <div className="alert alert-danger">{alerta}</div>}
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Ingresar</button>
      </div>
    </div>
  );
};

export default Login;
