import React, { useState } from 'react';
import './Login.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://i.etsystatic.com/44733518/r/il/9a3b61/5741845381/il_1080xN.5741845381_ljvq.jpg' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'path/to/VaneDavis.jpg' },
  { username: 'RoFlrtin', password: 'jose1946', role: 'vendedor', imageUrl: 'path/to/RoFlrtin.jpg' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'path/to/FrancoGF.jpg' },
  { username: 'Carmen Galarza', password: 'Gordis2024', role: 'vendedor', imageUrl: 'path/to/CarmenGalarza.jpg' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'path/to/CarolB.jpg' },
  { username: 'TamaraAbigail', password: 'Tamara07', role: 'vendedor', imageUrl: 'path/to/TamaraAbigail.jpg' },
  { username: 'Yuli182', password: '244962', role: 'vendedor', imageUrl: 'path/to/Yuli182.jpg' },
  { username: 'Gustavito02', password: '36520975', role: 'vendedor', imageUrl: 'path/to/Gustavito02.jpg' },
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
