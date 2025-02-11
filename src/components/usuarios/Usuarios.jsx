import React, { useState } from 'react';
import './Usuarios.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'vendedor1', password: 'password1', role: 'vendedor' },
  { username: 'vendedor2', password: 'password2', role: 'vendedor' },
  { username: 'vendedor3', password: 'password3', role: 'vendedor' },
  { username: 'vendedor4', password: 'password4', role: 'vendedor' },
  { username: 'vendedor5', password: 'password5', role: 'vendedor' },
  { username: 'vendedor6', password: 'password6', role: 'vendedor' },
  { username: 'vendedor7', password: 'password7', role: 'vendedor' },
  { username: 'vendedor8', password: 'password8', role: 'vendedor' },
  { username: 'vendedor9', password: 'password9', role: 'vendedor' },
  { username: 'vendedor10', password: 'password10', role: 'vendedor' },
  { username: 'jefe', password: 'passwordJefe', role: 'jefe' },
];

const Usuarios = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');

  const handleLogin = () => {
    const usuario = usuariosDB.find(user => user.username === username && user.password === password);

    if (usuario) {
      onLogin(usuario);
    } else {
      setAlerta('Usuario o contraseña incorrectos');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  return (
    <div className="usuarios">
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

export default Usuarios;
