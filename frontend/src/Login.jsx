import { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // Petición HTTP normal para autenticación
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, clave: password }),
    });
    
    const data = await response.json();
    if (data.success) {
      onLogin(data.user);
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <div className="login-box">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Usuario" onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}
export default Login;