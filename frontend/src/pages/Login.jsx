import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

export default function Login() { /a/
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('company', JSON.stringify(data.company));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    }
  }

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">Se connecter</h1>
        <div className="card">
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input className="form-control" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-dark btn-full" type="submit">Se connecter</button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Pas de compte ? <Link to="/register" style={{ color: '#2563eb' }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
