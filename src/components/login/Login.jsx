import React, { useState } from 'react';
import './Login.css';

// Simulamos una base de datos de usuarios
const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: 'jefe', imageUrl: 'https://i.etsystatic.com/44733518/r/il/9a3b61/5741845381/il_1080xN.5741845381_ljvq.jpg' },
  { username: 'VaneDavis', password: '554972', role: 'jefe', imageUrl: 'path/to/VaneDavis.jpg' },
  { username: 'Ronaldo F', password: 'jose1946', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2FRONY.jpg?alt=media&token=0d4972fd-aaad-4bdf-8aa3-8cec741a6c22' },
  { username: 'FrancoGF', password: 'Grupof2025', role: 'vendedor', imageUrl: 'path/to/FrancoGF.jpg' },
  { username: 'Carmen G', password: 'Gordis2024', role: 'vendedor', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2FGORDIS.jpg?alt=media&token=daf50c13-9c88-49ba-85d2-6f61e01bd322' },
  { username: 'Carol B', password: 'Tokyoghoul', role: 'vendedor', imageUrl: 'path/to/CarolB.jpg' },
  { username: 'Tamara G', password: 'Tamara07', role: 'vendedor', imageUrl: 'path/to/TamaraAbigail.jpg' },
  { username: 'Yuli G', password: '244962', role: 'vendedor', imageUrl: 'path/to/Yuli182.jpg' },
  { username: 'GUstavo F', password: '36520975', role: 'vendedor', imageUrl: 'path/to/Gustavito02.jpg' },
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
