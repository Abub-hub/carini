import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', whatsapp: '' });
  const [error, setError] = useState('');

  const set = field => e => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  }

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-container">
        <h1 className="auth-title">Créer un compte entreprise</h1>
        <div className="card">
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom de la société</label>
              <input className="form-control" placeholder="Auto Service SARL" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="contact@societe.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input className="form-control" type="password" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label>WhatsApp (pour la page publique)</label>
              <input className="form-control" placeholder="+212600000000" value={form.whatsapp} onChange={set('whatsapp')} />
            </div>
            <button className="btn btn-dark btn-full" type="submit">Créer le compte</button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Déjà inscrit ? <Link to="/login" style={{ color: '#2563eb' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
