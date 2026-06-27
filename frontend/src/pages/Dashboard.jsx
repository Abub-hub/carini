import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [cars, setCars]       = useState([]);
  const [rentals, setRentals] = useState([]);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState(null); // 'addCar' | 'addClient' | 'louer' | 'editCar'

  const [carForm, setCarForm]       = useState({ carName: '', plaque: '' });
  const [clientForm, setClientForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [rentalForm, setRentalForm] = useState({ car_id: '', client_id: '', dateDebut: '', dateFin: '' });
  const [editCar, setEditCar]       = useState(null);
  const [louerCar, setLouerCar]     = useState(null); // pre-selected car (null = show dropdown)

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data));
    api.get('/cars').then(r => setCars(r.data));
    api.get('/rentals').then(r => setRentals(r.data));
  }, []);

  const close = () => { setModal(null); setError(''); };

  function openLouer(car = null) {
    setLouerCar(car);
    setRentalForm({ car_id: '', client_id: '', dateDebut: '', dateFin: '' });
    setModal('louer');
  }

  // ── Cars ──
  async function addCar(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/cars', carForm);
      setCars([data, ...cars]);
      setCarForm({ carName: '', plaque: '' });
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function saveEditCar(e) {
    e.preventDefault();
    try {
      const { data } = await api.put(`/cars/${editCar.id}`, { carName: editCar.carName, plaque: editCar.plaque });
      setCars(cars.map(c => c.id === editCar.id ? data : c));
      close(); setEditCar(null);
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteCar(id) {
    if (!window.confirm('Supprimer cette voiture ?')) return;
    await api.delete(`/cars/${id}`);
    setCars(cars.filter(c => c.id !== id));
  }

  // ── Clients ──
  async function addClient(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/clients', clientForm);
      setClients([data, ...clients]);
      setClientForm({ nom: '', prenom: '', telephone: '' });
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteClient(id) {
    if (!window.confirm('Supprimer ce client ?')) return;
    await api.delete(`/clients/${id}`);
    setClients(clients.filter(c => c.id !== id));
  }

  // ── Rentals ──
  async function addRental(e) {
    e.preventDefault(); setError('');
    const car_id = louerCar ? louerCar.id : parseInt(rentalForm.car_id);
    try {
      const { data } = await api.post('/rentals', { car_id, client_id: rentalForm.client_id, dateDebut: rentalForm.dateDebut, dateFin: rentalForm.dateFin });
      const car    = cars.find(c => c.id === car_id);
      const client = clients.find(c => c.id === parseInt(rentalForm.client_id));
      setRentals([{ ...data, car_id, carName: car?.carName, plaque: car?.plaque, nom: client?.nom, prenom: client?.prenom }, ...rentals]);
      setRentalForm({ car_id: '', client_id: '', dateDebut: '', dateFin: '' });
      setLouerCar(null);
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteRental(id) {
    if (!window.confirm('Supprimer cette location ?')) return;
    await api.delete(`/rentals/${id}`);
    setRentals(rentals.filter(r => r.id !== id));
  }

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #f3f4f6' };

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── LEFT: 3 action buttons ── */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem' }}>
          <button className="action-btn" onClick={() => { setCarForm({ carName: '', plaque: '' }); setModal('addCar'); }}>
            🚗<br />Ajouter une voiture
          </button>
          <button className="action-btn" onClick={() => { setClientForm({ nom: '', prenom: '', telephone: '' }); setModal('addClient'); }}>
            👤<br />Ajouter un client
          </button>
          <button className="action-btn" onClick={() => openLouer()}>
            📅<br />Louer une voiture
          </button>
        </div>

        {/* ── RIGHT: Lists ── */}
        <div style={{ flex: 1 }}>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title">Voitures ({cars.length})</h2>
            {cars.length === 0 && <p className="empty">Aucune voiture</p>}
            {cars.map(c => (
              <div key={c.id} style={row}>
                <span style={{ fontWeight: 600 }}>{c.carName} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>— {c.plaque}</span></span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-blue" onClick={() => { setEditCar({ ...c }); setModal('editCar'); }}>Modifier</button>
                  <button className="btn btn-danger" onClick={() => deleteCar(c.id)}>Supprimer</button>
                  <button className="btn btn-green" onClick={() => openLouer(c)}>Louer</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title">Clients ({clients.length})</h2>
            {clients.length === 0 && <p className="empty">Aucun client</p>}
            {clients.map(c => (
              <div key={c.id} style={row}>
                <span>{c.nom} {c.prenom} <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>— {c.telephone}</span></span>
                <button className="btn btn-danger" onClick={() => deleteClient(c.id)}>Supprimer</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="section-title">Locations ({rentals.length})</h2>
            {rentals.length === 0 && <p className="empty">Aucune location</p>}
            {rentals.map(r => (
              <div key={r.id} style={row}>
                <span>
                  <strong>{r.carName}</strong> — {r.nom} {r.prenom}
                  <span style={{ display: 'block', color: '#6b7280', fontSize: '0.8rem' }}>{r.dateDebut} → {r.dateFin}</span>
                </span>
                <button className="btn btn-danger" onClick={() => deleteRental(r.id)}>Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Ajouter voiture ── */}
      {modal === 'addCar' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><span>Ajouter une voiture</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={addCar}>
              <div className="form-group"><label>Nom</label><input className="form-control" placeholder="Ex : Renault Clio" value={carForm.carName} onChange={e => setCarForm({ ...carForm, carName: e.target.value })} required /></div>
              <div className="form-group"><label>Plaque</label><input className="form-control" placeholder="AA-123-BB" value={carForm.plaque} onChange={e => setCarForm({ ...carForm, plaque: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-dark">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Modifier voiture ── */}
      {modal === 'editCar' && editCar && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><span>Modifier la voiture</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={saveEditCar}>
              <div className="form-group"><label>Nom</label><input className="form-control" value={editCar.carName} onChange={e => setEditCar({ ...editCar, carName: e.target.value })} required /></div>
              <div className="form-group"><label>Plaque</label><input className="form-control" value={editCar.plaque} onChange={e => setEditCar({ ...editCar, plaque: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-dark">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ajouter client ── */}
      {modal === 'addClient' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><span>Ajouter un client</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={addClient}>
              <div className="form-group"><label>Nom</label><input className="form-control" value={clientForm.nom} onChange={e => setClientForm({ ...clientForm, nom: e.target.value })} required /></div>
              <div className="form-group"><label>Prénom</label><input className="form-control" value={clientForm.prenom} onChange={e => setClientForm({ ...clientForm, prenom: e.target.value })} required /></div>
              <div className="form-group"><label>Téléphone</label><input className="form-control" value={clientForm.telephone} onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-dark">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Louer ── */}
      {modal === 'louer' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <span>{louerCar ? `Louer — ${louerCar.carName}` : 'Louer une voiture'}</span>
              <button className="modal-close" onClick={close}>×</button>
            </div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={addRental}>
              {!louerCar && (
                <div className="form-group">
                  <label>Voiture</label>
                  <select className="form-control" value={rentalForm.car_id} onChange={e => setRentalForm({ ...rentalForm, car_id: e.target.value })} required>
                    <option value="">Sélectionner une voiture</option>
                    {cars.map(c => <option key={c.id} value={c.id}>{c.carName} — {c.plaque}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Client</label>
                <select className="form-control" value={rentalForm.client_id} onChange={e => setRentalForm({ ...rentalForm, client_id: e.target.value })} required>
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom} — {c.telephone}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Date début</label><input className="form-control" type="date" value={rentalForm.dateDebut} onChange={e => setRentalForm({ ...rentalForm, dateDebut: e.target.value, dateFin: '' })} required /></div>
              <div className="form-group"><label>Date fin</label><input className="form-control" type="date" value={rentalForm.dateFin} min={rentalForm.dateDebut || undefined} onChange={e => setRentalForm({ ...rentalForm, dateFin: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-green">Confirmer la location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
