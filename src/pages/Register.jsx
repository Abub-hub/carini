import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', director: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/register', form)
      navigate('/login')
    } catch {
      setError('Cet email existe déjà')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Carini</h1>
        <p className="sub">Créer un compte entreprise</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input placeholder="Raison sociale" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <input placeholder="Nom du directeur (optionnel)" value={form.director} onChange={e => setForm({...form, director: e.target.value})} />
          <button type="submit">Créer le compte</button>
        </form>
        <p className="link"><Link to="/login">Déjà un compte ? Se connecter</Link></p>
      </div>
    </div>
  )
}

export default Register
