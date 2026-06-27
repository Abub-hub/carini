import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [computers, setComputers] = useState([])
  const [empForm, setEmpForm] = useState({ firstName: '', lastName: '', email: '', password: '', age: '', gender: '', companyId: '' })
  const [compForm, setCompForm] = useState({ mac: '', companyId: '' })

  const fetchData = () => {
    axios.get('/api/employees').then(r => setEmployees(r.data))
    axios.get('/api/computers').then(r => setComputers(r.data))
  }

  useEffect(fetchData, [])

  const addEmployee = async (e) => {
    e.preventDefault()
    await axios.post('/api/employees', empForm)
    setEmpForm({ firstName: '', lastName: '', email: '', password: '', age: '', gender: '', companyId: '' })
    fetchData()
  }

  const addComputer = async (e) => {
    e.preventDefault()
    await axios.post('/api/computers', compForm)
    setCompForm({ mac: '', companyId: '' })
    fetchData()
  }

  const deleteEmployee = (id) => { if (confirm('Supprimer ?')) axios.delete(`/api/employees/${id}`).then(fetchData) }
  const deleteComputer = (id) => { if (confirm('Supprimer ?')) axios.delete(`/api/computers/${id}`).then(fetchData) }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const company = JSON.parse(localStorage.getItem('company') || '{}')

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Big Boss</h1>
        <div>
          <span style={{ color: '#5a8a7a', marginRight: '20px' }}>{company.name}</span>
          <button onClick={logout}>Déconnexion</button>
        </div>
      </nav>

      <div className="stats">
        <div className="stat"><span>{employees.length}</span><label>Employés</label></div>
        <div className="stat"><span>{computers.length}</span><label>Ordinateurs</label></div>
      </div>

      <div className="card">
        <h2>Ajouter un employé</h2>
        <form onSubmit={addEmployee}>
          <input placeholder="Prénom" value={empForm.firstName} onChange={e => setEmpForm({...empForm, firstName: e.target.value})} required />
          <input placeholder="Nom" value={empForm.lastName} onChange={e => setEmpForm({...empForm, lastName: e.target.value})} required />
          <input placeholder="Email" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} required />
          <input type="password" placeholder="Mot de passe" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} required />
          <input placeholder="Âge" value={empForm.age} onChange={e => setEmpForm({...empForm, age: e.target.value})} />
          <select value={empForm.gender} onChange={e => setEmpForm({...empForm, gender: e.target.value})}>
            <option value="">Genre</option>
            <option value="Male">Homme</option>
            <option value="Female">Femme</option>
          </select>
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="card">
        <h2>Ajouter un ordinateur</h2>
        <form onSubmit={addComputer}>
          <input placeholder="Adresse MAC" value={compForm.mac} onChange={e => setCompForm({...compForm, mac: e.target.value})} required />
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="card">
        <h2>Liste des employés</h2>
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Âge</th><th>Genre</th><th>Actions</th></tr></thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id}>
                <td>{e.firstName} {e.lastName}</td>
                <td>{e.email}</td>
                <td>{e.age || '-'}</td>
                <td>{e.gender || '-'}</td>
                <td><button className="delete-btn" onClick={() => deleteEmployee(e.id)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Liste des ordinateurs</h2>
        <table>
          <thead><tr><th>MAC</th><th>Assigné à</th><th>Actions</th></tr></thead>
          <tbody>
            {computers.map(c => (
              <tr key={c.id}>
                <td>{c.mac}</td>
                <td>{c.employeeId || 'Non assigné'}</td>
                <td><button className="delete-btn" onClick={() => deleteComputer(c.id)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
