import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const usuariosDB = [
  { username: 'Gfabian395', password: 'Gfabian395', role: ['jefe'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F9.png?alt=media&token=992ee040-ed59-4b53-9013-115ee7c9fce7' },
  { username: 'Vanesa F', password: '554972', role: ['jefe'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F8.png?alt=media&token=aff23347-93dc-4737-bf1f-25f0430f34fa' },
  { username: 'Franco A', password: 'Grupof2025', role: ['fotografo', 'vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F2.png?alt=media&token=38f9c73b-1442-4025-b729-615395077651' },
  { username: 'Carol F', password: 'Emilia2020', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F11.png?alt=media&token=b83cafcc-a9bb-4ae0-9609-2e8f65c95d10' },
  { username: 'Tamara G', password: 'Tamara07', role: ['vendedor', "encargado"], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F3.png?alt=media&token=6a2d2262-604a-41c3-baab-051b0cd2e32a' },
  { username: 'Yulisa G', password: '244962', role: ['vendedor', "encargado"], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F1.png?alt=media&token=53e5fde2-f246-47d4-b329-436d866ac66c' },
  { username: 'Gustavo F', password: '36520975', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F10.png?alt=media&token=44148120-0d0c-41ee-99aa-f4dfc4e50f7e' },
  { username: 'Ronaldo F', password: 'Jose1946', role: ['vendedor'], imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ferreirahogar-376dd.firebasestorage.app/o/vendedores%2F6.png?alt=media&token=4b570b8c-4926-4520-bb00-69e19db6560b' },
  { username: 'prueba', password: 'prueba', role: ['jefe'], imageUrl: 'https://placehold.co/50x50' },
  { username: 'catalogo', password: '', role: ['invitado'], imageUrl: 'https://placehold.co/100x100?text=Invitado' },
];

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alerta, setAlerta] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const usuario = usuariosDB.find(user => user.username === username && user.password === password);

    if (usuario) {
      const userWithRoleArray = {
        ...usuario,
        role: Array.isArray(usuario.role) ? usuario.role : [usuario.role]
      };

      localStorage.setItem('usuario', JSON.stringify(userWithRoleArray));
      alert(`Bienvenido, ${userWithRoleArray.username}!`);
      onLogin(userWithRoleArray);

      if (userWithRoleArray.role.includes('invitado')) {
        navigate('/categorias');
      }
    } else {
      setAlerta('Usuario o contraseña incorrectos');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const ingresarComoInvitado = () => {
    const invitado = usuariosDB.find(user => user.username === 'catalogo');

    const userWithRoleArray = {
      ...invitado,
      role: Array.isArray(invitado.role) ? invitado.role : [invitado.role]
    };

    localStorage.setItem('usuario', JSON.stringify(userWithRoleArray));
    alert('Ingresaste como invitado. Solo puedes ver el catálogo.');
    onLogin(userWithRoleArray);
    navigate('/categorias');
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

        <div style={{ marginTop: '15px' }}>
          <button onClick={ingresarComoInvitado} className="invitado-btn">
            Ver catálogo como invitado
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
