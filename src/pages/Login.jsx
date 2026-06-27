import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('company', JSON.stringify(res.data.company))
      navigate('/dashboard')
    } catch {
      setError('Identifiants invalides')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Carini</h1>
        <p className="sub">Connexion entreprise</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Se connecter</button>
        </form>
        <p className="link">Pas de compte ? <Link to="/register">Créer un compte</Link></p>
      </div>
    </div>
  )
}

export default Login
