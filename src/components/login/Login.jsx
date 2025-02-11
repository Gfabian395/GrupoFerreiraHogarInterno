import React, { useState } from 'react';
import './Login.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'vendedor1', password: 'password1' },
  { username: 'vendedor2', password: 'password2' },
  { username: 'vendedor3', password: 'password3' },
  { username: 'vendedor4', password: 'password4' },
  { username: 'vendedor5', password: 'password5' },
  { username: 'vendedor6', password: 'password6' },
  { username: 'vendedor7', password: 'password7' },
  { username: 'vendedor8', password: 'password8' },
  { username: 'vendedor9', password: 'password9' },
  { username: 'vendedor10', password: 'password10' },
  { username: 'jefe', password: 'passwordJefe' },
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
