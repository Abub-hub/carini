import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
    navigate('/');
  }

  // ── Logged in ──
  if (token) {
    return (
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">Carini</Link>
        <div className="navbar-right">
          <span className="navbar-company-badge">
            <span className="navbar-company-dot" /> {company.name}
          </span>
          <Link to="/" className="navbar-link">Page publique</Link>
          <Link to="/dashboard" className="navbar-link">Tableau de bord</Link>
          <button className="navbar-btn-logout" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </nav>
    );
  }

  // ── Not logged in ──
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Carini</Link>
      <div className="navbar-right">
        <Link to="/" className="navbar-link">Nos voitures</Link>
        <Link to="/login" className="navbar-link">Se connecter</Link>
        <Link to="/register" className="navbar-btn">S'inscrire</Link>
      </div>
    </nav>
  );
}
