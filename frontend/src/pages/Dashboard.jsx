import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import ImageManager from '../components/ImageManager';
import { CAR_BRANDS, MODELS_BY_BRAND, COMMON_COLORS, colorHex } from '../carData';

const emptyCarForm = {
  brand: '', model: '', year: '', transmission: '', plaque: '',
  fuelType: '', seats: '', dailyPrice: '', mileage: '', color: ''
};
const emptyClientForm = { nom: '', prenom: '', telephone: '', email: '', cin: '', permis: '', address: '' };
const emptyRentalForm = { car_id: '', client_id: '', dateDebut: '', dateFin: '', deposit: '' };

function nights(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return 0;
  const ms = new Date(dateFin) - new Date(dateDebut);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

const statusLabels = { en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée' };

// Controlled inputs can't bind to null — swap nulls for '' when loading a record into a form.
function nullsToEmpty(obj) {
  const out = { ...obj };
  for (const k in out) if (out[k] === null) out[k] = '';
  return out;
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [cars, setCars]       = useState([]);
  const [rentals, setRentals] = useState([]);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState(null); // addCar | editCar | addClient | editClient | louer

  const [carForm, setCarForm]             = useState(emptyCarForm);
  const [pendingCarImages, setPendingCarImages] = useState([]);
  const [editCar, setEditCar]             = useState(null);

  const [clientForm, setClientForm]       = useState(emptyClientForm);
  const [editClient, setEditClient]       = useState(null);

  const [rentalForm, setRentalForm]       = useState(emptyRentalForm);
  const [louerCar, setLouerCar]           = useState(null);

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data));
    api.get('/cars').then(r => setCars(r.data));
    api.get('/rentals').then(r => setRentals(r.data));
  }, []);

  const close = () => { setModal(null); setError(''); };

  function openLouer(car = null) {
    setLouerCar(car);
    setRentalForm(emptyRentalForm);
    setModal('louer');
  }

  // ── Cars ──
  async function addCar(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/cars', { ...carForm, carName: `${carForm.brand} ${carForm.model}`.trim() });
      let car = data;
      if (pendingCarImages.length) {
        const formData = new FormData();
        pendingCarImages.forEach(f => formData.append('images', f));
        const { data: images } = await api.post(`/cars/${car.id}/images`, formData);
        car = { ...car, images };
      }
      setCars([car, ...cars]);
      setCarForm(emptyCarForm);
      setPendingCarImages([]);
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function saveEditCar(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.put(`/cars/${editCar.id}`, { ...editCar, carName: `${editCar.brand} ${editCar.model}`.trim() });
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
      setClientForm(emptyClientForm);
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function saveEditClient(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.put(`/clients/${editClient.id}`, editClient);
      setClients(clients.map(c => c.id === editClient.id ? data : c));
      close(); setEditClient(null);
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
      const { data } = await api.post('/rentals', { car_id, client_id: rentalForm.client_id, dateDebut: rentalForm.dateDebut, dateFin: rentalForm.dateFin, deposit: rentalForm.deposit || null });
      const car    = cars.find(c => c.id === car_id);
      const client = clients.find(c => c.id === parseInt(rentalForm.client_id));
      setRentals([{ ...data, car_id, carName: car?.carName, plaque: car?.plaque, nom: client?.nom, prenom: client?.prenom }, ...rentals]);
      setRentalForm(emptyRentalForm);
      setLouerCar(null);
      close();
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  }

  async function setRentalStatus(id, status) {
    const { data } = await api.put(`/rentals/${id}/status`, { status });
    setRentals(rentals.map(r => r.id === id ? { ...r, status: data.status } : r));
  }

  async function deleteRental(id) {
    if (!window.confirm('Supprimer cette location ?')) return;
    await api.delete(`/rentals/${id}`);
    setRentals(rentals.filter(r => r.id !== id));
  }

  // ── Stats ──
  const availableCount = cars.filter(c => c.status === 'disponible' && !c.currentlyRented).length;
  const rentedCount    = cars.filter(c => c.currentlyRented).length;
  const now = new Date();
  const monthlyRevenue = rentals
    .filter(r => r.status !== 'annulee' && r.totalPrice && new Date(r.dateDebut).getMonth() === now.getMonth() && new Date(r.dateDebut).getFullYear() === now.getFullYear())
    .reduce((sum, r) => sum + Number(r.totalPrice), 0);

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #f3f4f6' };
  const rentalCarForm = louerCar || cars.find(c => c.id === parseInt(rentalForm.car_id));
  const previewTotal = rentalCarForm ? Number(rentalCarForm.dailyPrice || 0) * nights(rentalForm.dateDebut, rentalForm.dateFin) : 0;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{cars.length}</div><div className="stat-label">Voitures</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{availableCount}</div><div className="stat-label">Disponibles</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#dc2626' }}>{rentedCount}</div><div className="stat-label">Louées actuellement</div></div>
          <div className="stat-card"><div className="stat-value">{clients.length}</div><div className="stat-label">Clients</div></div>
          <div className="stat-card"><div className="stat-value">{monthlyRevenue.toFixed(0)} DH</div><div className="stat-label">Revenu (ce mois)</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── LEFT: 3 action buttons ── */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem' }}>
          <button className="action-btn" onClick={() => { setCarForm(emptyCarForm); setPendingCarImages([]); setModal('addCar'); }}>
            🚗<br />Ajouter une voiture
          </button>
          <button className="action-btn" onClick={() => { setClientForm(emptyClientForm); setModal('addClient'); }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="car-row-thumb">
                    {c.images?.[0] ? <img src={c.images[0].url} alt="" /> : '🚗'}
                  </div>
                  <span>
                    <div style={{ fontWeight: 600 }}>
                      {c.carName} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>— {c.plaque}</span>
                      {c.status === 'maintenance' && <span className="badge badge-gray">Maintenance</span>}
                      {c.currentlyRented && <span className="badge badge-red">Louée</span>}
                      {c.status === 'disponible' && !c.currentlyRented && <span className="badge badge-green">Disponible</span>}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {c.year}
                      {c.color && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block', background: colorHex(c.color) || '#d1d5db', border: '1px solid #d1d5db' }} />
                          {c.color}
                        </span>
                      )}
                      {c.dailyPrice ? `— ${Number(c.dailyPrice).toFixed(0)} DH/jour` : ''}
                    </div>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-blue" onClick={() => { setEditCar(nullsToEmpty(c)); setModal('editCar'); }}>Modifier</button>
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
                <span>
                  {c.nom} {c.prenom} <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>— {c.telephone}</span>
                  {(c.email || c.cin) && <div style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{[c.email, c.cin && `CIN ${c.cin}`].filter(Boolean).join(' · ')}</div>}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-blue" onClick={() => { setEditClient(nullsToEmpty(c)); setModal('editClient'); }}>Modifier</button>
                  <button className="btn btn-danger" onClick={() => deleteClient(c.id)}>Supprimer</button>
                </div>
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
                  <span className={`badge ${r.status === 'en_cours' ? 'badge-blue' : r.status === 'terminee' ? 'badge-green' : 'badge-gray'}`}>{statusLabels[r.status] || r.status}</span>
                  <span style={{ display: 'block', color: '#6b7280', fontSize: '0.8rem' }}>
                    {r.dateDebut} → {r.dateFin}
                    {r.totalPrice ? ` — ${Number(r.totalPrice).toFixed(0)} DH` : ''}
                    {r.deposit ? ` (caution ${Number(r.deposit).toFixed(0)} DH)` : ''}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {r.status === 'en_cours' && <button className="btn btn-blue" onClick={() => setRentalStatus(r.id, 'terminee')}>Terminer</button>}
                  {r.status === 'en_cours' && <button className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={() => setRentalStatus(r.id, 'annulee')}>Annuler</button>}
                  <button className="btn btn-danger" onClick={() => deleteRental(r.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Ajouter voiture ── */}
      {modal === 'addCar' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal modal-wide">
            <div className="modal-header"><span>Ajouter une voiture</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={addCar}>
              <CarFields form={carForm} setForm={setCarForm} />
              <ImageManager carId={null} pendingFiles={pendingCarImages} onPendingFilesChange={setPendingCarImages} />
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
          <div className="modal modal-wide">
            <div className="modal-header"><span>Modifier la voiture</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={saveEditCar}>
              <CarFields form={editCar} setForm={setEditCar} />
              <ImageManager
                carId={editCar.id}
                existingImages={editCar.images || []}
                onExistingImagesChange={imgs => setEditCar({ ...editCar, images: imgs })}
              />
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
              <ClientFields form={clientForm} setForm={setClientForm} />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-dark">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Modifier client ── */}
      {modal === 'editClient' && editClient && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><span>Modifier le client</span><button className="modal-close" onClick={close}>×</button></div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={saveEditClient}>
              <ClientFields form={editClient} setForm={setEditClient} />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={close}>Annuler</button>
                <button type="submit" className="btn btn-dark">Enregistrer</button>
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
                    {cars.map(c => <option key={c.id} value={c.id}>{c.carName} — {c.plaque} ({Number(c.dailyPrice || 0).toFixed(0)} DH/j)</option>)}
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
              <div className="form-group"><label>Caution (optionnel)</label><input className="form-control" type="number" min="0" value={rentalForm.deposit} onChange={e => setRentalForm({ ...rentalForm, deposit: e.target.value })} /></div>
              {previewTotal > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Total estimé : <strong>{previewTotal.toFixed(0)} DH</strong> ({nights(rentalForm.dateDebut, rentalForm.dateFin)} nuit{nights(rentalForm.dateDebut, rentalForm.dateFin) > 1 ? 's' : ''})
                </div>
              )}
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

function CarFields({ form, setForm }) {
  const set = (field) => e => setForm({ ...form, [field]: e.target.value });
  const models = MODELS_BY_BRAND[form.brand] || [];

  return (
    <div className="field-grid">
      <div className="form-group">
        <label>Marque</label>
        <input className="form-control" list="brand-options" placeholder="Ex : Renault" value={form.brand}
          onChange={e => setForm({ ...form, brand: e.target.value, model: '' })} required />
        <datalist id="brand-options">
          {CAR_BRANDS.map(b => <option value={b} key={b} />)}
        </datalist>
      </div>
      <div className="form-group">
        <label>Modèle</label>
        <input className="form-control" list="model-options" placeholder="Ex : Clio" value={form.model} onChange={set('model')} required />
        <datalist id="model-options">
          {models.map(m => <option value={m} key={m} />)}
        </datalist>
      </div>
      <div className="form-group"><label>Année</label><input className="form-control" type="number" min="1980" max="2100" value={form.year} onChange={set('year')} /></div>
      <div className="form-group">
        <label>Transmission</label>
        <select className="form-control" value={form.transmission} onChange={set('transmission')}>
          <option value="">—</option>
          <option value="Manuelle">Manuelle</option>
          <option value="Automatique">Automatique</option>
        </select>
      </div>
      <div className="form-group"><label>Plaque d'immatriculation</label><input className="form-control" placeholder="AA-123-BB" value={form.plaque} onChange={set('plaque')} required /></div>
      <div className="form-group">
        <label>Carburant</label>
        <select className="form-control" value={form.fuelType} onChange={set('fuelType')}>
          <option value="">—</option>
          <option value="Essence">Essence</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybride">Hybride</option>
          <option value="Électrique">Électrique</option>
        </select>
      </div>
      <div className="form-group"><label>Places</label><input className="form-control" type="number" min="1" max="20" value={form.seats} onChange={set('seats')} /></div>
      <div className="form-group"><label>Prix / jour (DH)</label><input className="form-control" type="number" min="0" step="0.01" value={form.dailyPrice} onChange={set('dailyPrice')} required /></div>
      <div className="form-group"><label>Kilométrage</label><input className="form-control" type="number" min="0" value={form.mileage} onChange={set('mileage')} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label>Couleur</label>
        <ColorPicker value={form.color} onChange={color => setForm({ ...form, color })} />
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  const hex = colorHex(value);
  return (
    <div>
      <div className="color-swatches">
        {COMMON_COLORS.map(c => (
          <button
            type="button"
            key={c.name}
            title={c.name}
            className={`color-swatch ${value === c.name ? 'selected' : ''}`}
            style={{ background: c.hex, border: c.border ? '1px solid #d1d5db' : 'none' }}
            onClick={() => onChange(c.name)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: hex || '#f3f4f6', border: '1px solid #d1d5db' }} />
        <input className="form-control" placeholder="Ou écrire une couleur" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function ClientFields({ form, setForm }) {
  const set = (field) => e => setForm({ ...form, [field]: e.target.value });
  return (
    <div className="field-grid">
      <div className="form-group"><label>Nom</label><input className="form-control" value={form.nom} onChange={set('nom')} required /></div>
      <div className="form-group"><label>Prénom</label><input className="form-control" value={form.prenom} onChange={set('prenom')} required /></div>
      <div className="form-group"><label>Téléphone</label><input className="form-control" value={form.telephone} onChange={set('telephone')} required /></div>
      <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={set('email')} /></div>
      <div className="form-group"><label>CIN</label><input className="form-control" value={form.cin} onChange={set('cin')} /></div>
      <div className="form-group"><label>N° Permis</label><input className="form-control" value={form.permis} onChange={set('permis')} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Adresse</label><input className="form-control" value={form.address} onChange={set('address')} /></div>
    </div>
  );
}
