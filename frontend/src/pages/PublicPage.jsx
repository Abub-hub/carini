import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api';
import Navbar from '../components/Navbar';

// Format a Date object as DD/MM/YYYY for the WhatsApp message preview
function formatDate(date) {
  if (!date) return '_______';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Build a WhatsApp URL for direct contact (no dates)
function directWaUrl(whatsapp, carName) {
  const msg = `Bonjour, je suis intéressé par la voiture : ${carName}. Est-elle disponible ?`;
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
}

// Build a WhatsApp URL with rental dates
function datedWaUrl(whatsapp, carName, dateDebut, dateFin) {
  const msg =
    `Je suis intéressé par cette voiture :\n\n` +
    `📌 Voiture : ${carName}\n\n` +
    `📅 Date de début : ${formatDate(dateDebut)}\n` +
    `📅 Date de fin : ${formatDate(dateFin)}\n\n` +
    `❓ Est-elle toujours disponible ?\n\nMerci 😊`;
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
}

export default function PublicPage() {
  const [cars, setCars]           = useState([]);
  const [waModal, setWaModal]     = useState(null); // car selected for date modal
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin]     = useState(null);

  useEffect(() => {
    api.get('/public/cars').then(r => setCars(r.data));
  }, []);

  function openWaModal(car) {
    setWaModal(car);
    setDateDebut(null);
    setDateFin(null);
  }

  function sendWhatsApp() {
    window.open(datedWaUrl(waModal.whatsapp, waModal.carName, dateDebut, dateFin), '_blank');
    setWaModal(null);
  }

  return (
    <div>
      <Navbar />

      <div className="public-hero">
        <h1>woo</h1>
        <p>Trouvez la voiture idéale pour votre prochain trajet</p>
      </div>

      <div className="cars-grid">
        {cars.length === 0 && (
          <p style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center' }}>
            Aucune voiture disponible pour le moment.
          </p>
        )}
        {cars.map(car => (
          <div key={car.id} className="car-card">
            <div className="car-no-img">🚗</div>
            <div className="car-card-body">
              <div className="car-card-name">{car.carName}</div>
              <div className="car-card-type">{car.plaque} — {car.companyName}</div>

              {/* Direct WhatsApp contact */}
              <a
                className="wa-badge"
                href={car.whatsapp ? directWaUrl(car.whatsapp, car.carName) : '#'}
                target={car.whatsapp ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={!car.whatsapp ? e => { e.preventDefault(); alert('Numéro WhatsApp non renseigné.'); } : undefined}
              >
                📱 Nous contacter sur WhatsApp
              </a>

              {/* WhatsApp with dates modal */}
              <button className="wa-btn" onClick={() => openWaModal(car)}>
                📅 Envoyer avec mes dates
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Date selection modal */}
      {waModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setWaModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span>Choisir les dates — {waModal.carName}</span>
              <button className="modal-close" onClick={() => setWaModal(null)}>×</button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              Sélectionnez vos dates pour les inclure dans le message WhatsApp.
            </p>

            <div className="form-group">
              <label>Date de début</label>
              <DatePicker
                selected={dateDebut}
                onChange={date => { setDateDebut(date); setDateFin(null); }}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Sélectionner une date"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Date de fin</label>
              <DatePicker
                selected={dateFin}
                onChange={date => setDateFin(date)}
                minDate={dateDebut || new Date()}
                disabled={!dateDebut}
                dateFormat="dd/MM/yyyy"
                placeholderText="Sélectionner une date"
                className="form-control"
              />
            </div>

            {/* Message preview */}
            {dateDebut && dateFin && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.85rem', fontSize: '0.82rem', color: '#374151', whiteSpace: 'pre-line', marginTop: '0.75rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                {`Je suis intéressé par cette voiture :\n\n📌 Voiture : ${waModal.carName}\n\n📅 Date de début : ${formatDate(dateDebut)}\n📅 Date de fin : ${formatDate(dateFin)}\n\n❓ Est-elle toujours disponible ?\n\nMerci 😊`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={() => setWaModal(null)}>
                Annuler
              </button>
              <button className="wa-btn" style={{ width: 'auto', padding: '0.45rem 1.1rem' }} onClick={sendWhatsApp} disabled={!dateDebut || !dateFin}>
                📱 Envoyer sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
