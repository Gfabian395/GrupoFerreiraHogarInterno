import React, { useState } from 'react';
import './Login.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe' },
  { username: 'VaneDavis', password: '554972', role: 'jefe' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor' },
  { username: 'Yuli182', password: '244962', role: 'vendedor' },
  { username: 'Gustavito02', password: '35520975', role: 'vendedor' },
  { username: 'Elias G', password: 'Elemento', role: 'vendedor' },
  { username: 'Micaela G', password: 'Galarza24', role: 'vendedor' },
  { username: 'prueba', password: 'prueba', role: 'vendedor' },
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
    <div className="login">
      <h2>Login</h2>
      {alerta && <div className="alert alert-danger">{alerta}</div>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
