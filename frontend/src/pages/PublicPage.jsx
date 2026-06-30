import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api';
import Navbar from '../components/Navbar';

// Format a Date object as DD/MM/YYYY for the WhatsApp message
function formatDate(date) {
  if (!date) return '_______';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function cleanPhone(whatsapp) {
  return whatsapp.replace(/[^0-9]/g, '').replace(/^00/, '');
}

function directWaUrl(whatsapp, carName) {
  const msg = `Bonjour, je suis intéressé par la voiture : ${carName}. Est-elle disponible ?`;
  return `https://wa.me/${cleanPhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
}

function datedWaUrl(whatsapp, carName, dateDebut, dateFin) {
  const msg =
    `Bonjour, je suis intéressé par cette voiture :\n\n` +
    `Voiture : ${carName}\n` +
    `Date de début : ${formatDate(dateDebut)}\n` +
    `Date de fin : ${formatDate(dateFin)}\n\n` +
    `Est-elle disponible pour cette période ?\n\nMerci`;
  return `https://wa.me/${cleanPhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
}

const emptyFilters = { search: '', minPrice: '', maxPrice: '', transmission: '', fuelType: '', seats: '' };

function CarCarousel({ images, height = 170 }) {
  const [index, setIndex] = useState(0);
  if (!images || images.length === 0) {
    return <div className="car-no-img" style={{ height }}>🚗</div>;
  }
  const prev = e => { e.stopPropagation(); setIndex(i => (i - 1 + images.length) % images.length); };
  const next = e => { e.stopPropagation(); setIndex(i => (i + 1) % images.length); };
  return (
    <div className="carousel" style={{ height }}>
      <img src={images[index].url} alt="" className="carousel-img" />
      {images.length > 1 && (
        <>
          <button type="button" className="carousel-arrow carousel-arrow-left" onClick={prev}>‹</button>
          <button type="button" className="carousel-arrow carousel-arrow-right" onClick={next}>›</button>
          <div className="carousel-dots">
            {images.map((_, i) => <span key={i} className={`carousel-dot ${i === index ? 'active' : ''}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function PublicPage() {
  const [cars, setCars]       = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [detailCar, setDetailCar] = useState(null);
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin]     = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      api.get('/public/cars', { params }).then(r => setCars(r.data));
    }, 350);
    return () => clearTimeout(timeout);
  }, [filters]);

  function openDetail(car) {
    setDetailCar(car);
    setDateDebut(null);
    setDateFin(null);
  }

  function sendWhatsApp() {
    window.location.href = datedWaUrl(detailCar.whatsapp, detailCar.carName, dateDebut, dateFin);
    setDetailCar(null);
  }

  const setFilter = (field) => e => setFilters({ ...filters, [field]: e.target.value });

  return (
    <div>
      <Navbar />

      <div className="public-hero">
        <h1>Carini</h1>
        <p>Trouvez la voiture idéale pour votre prochain trajet</p>
      </div>

      <div className="filters-bar">
        <input className="form-control" placeholder="Rechercher (nom, marque, modèle)" value={filters.search} onChange={setFilter('search')} />
        <input className="form-control" type="number" min="0" placeholder="Prix min" value={filters.minPrice} onChange={setFilter('minPrice')} />
        <input className="form-control" type="number" min="0" placeholder="Prix max" value={filters.maxPrice} onChange={setFilter('maxPrice')} />
        <select className="form-control" value={filters.transmission} onChange={setFilter('transmission')}>
          <option value="">Transmission</option>
          <option value="Manuelle">Manuelle</option>
          <option value="Automatique">Automatique</option>
        </select>
        <select className="form-control" value={filters.fuelType} onChange={setFilter('fuelType')}>
          <option value="">Carburant</option>
          <option value="Essence">Essence</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybride">Hybride</option>
          <option value="Électrique">Électrique</option>
        </select>
        <select className="form-control" value={filters.seats} onChange={setFilter('seats')}>
          <option value="">Places min.</option>
          {[2, 4, 5, 7, 9].map(n => <option key={n} value={n}>{n}+</option>)}
        </select>
        {Object.values(filters).some(Boolean) && (
          <button type="button" className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={() => setFilters(emptyFilters)}>Réinitialiser</button>
        )}
      </div>

      <div className="cars-grid">
        {cars.length === 0 && (
          <p style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center' }}>
            Aucune voiture disponible pour le moment.
          </p>
        )}
        {cars.map(car => (
          <div key={car.id} className="car-card" onClick={() => openDetail(car)}>
            <CarCarousel images={car.images} />
            <div className="car-card-body">
              <div className="car-card-name">{car.carName}</div>
              <div className="car-card-type">
                {[car.brand, car.model, car.year].filter(Boolean).join(' ') || `${car.plaque} — ${car.companyName}`}
              </div>
              <div className="car-card-specs">
                {car.transmission && <span className="spec-pill">{car.transmission}</span>}
                {car.fuelType && <span className="spec-pill">{car.fuelType}</span>}
                {car.seats && <span className="spec-pill">{car.seats} places</span>}
              </div>
              {car.dailyPrice > 0 && <div className="car-card-price">{Number(car.dailyPrice).toFixed(0)} DH<span>/jour</span></div>}

              <a
                className="wa-badge"
                href={car.whatsapp ? directWaUrl(car.whatsapp, car.carName) : '#'}
                rel="noopener noreferrer"
                onClick={e => {
                  e.stopPropagation();
                  if (!car.whatsapp) { e.preventDefault(); alert('Numéro WhatsApp non renseigné.'); }
                }}
              >
                📱 Nous contacter sur WhatsApp
              </a>

              <button className="wa-btn" onClick={e => { e.stopPropagation(); openDetail(car); }}>
                📅 Voir détails &amp; envoyer mes dates
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail / WhatsApp modal */}
      {detailCar && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDetailCar(null)}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <span>{detailCar.carName}</span>
              <button className="modal-close" onClick={() => setDetailCar(null)}>×</button>
            </div>

            <CarCarousel images={detailCar.images} height={260} />

            <div className="car-card-specs" style={{ margin: '0.85rem 0' }}>
              {detailCar.brand && <span className="spec-pill">{[detailCar.brand, detailCar.model].filter(Boolean).join(' ')}</span>}
              {detailCar.year && <span className="spec-pill">{detailCar.year}</span>}
              {detailCar.color && <span className="spec-pill">{detailCar.color}</span>}
              {detailCar.transmission && <span className="spec-pill">{detailCar.transmission}</span>}
              {detailCar.fuelType && <span className="spec-pill">{detailCar.fuelType}</span>}
              {detailCar.seats && <span className="spec-pill">{detailCar.seats} places</span>}
              {detailCar.mileage != null && <span className="spec-pill">{Number(detailCar.mileage).toLocaleString()} km</span>}
            </div>

            {detailCar.description && <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.85rem' }}>{detailCar.description}</p>}
            {detailCar.dailyPrice > 0 && <div className="car-card-price" style={{ marginBottom: '0.85rem' }}>{Number(detailCar.dailyPrice).toFixed(0)} DH<span>/jour</span></div>}

            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
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

            {dateDebut && dateFin && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.85rem', fontSize: '0.82rem', color: '#374151', whiteSpace: 'pre-line', marginTop: '0.75rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                {`Je suis intéressé par cette voiture :\n\n📌 Voiture : ${detailCar.carName}\n\n📅 Date de début : ${formatDate(dateDebut)}\n📅 Date de fin : ${formatDate(dateFin)}\n\n❓ Est-elle toujours disponible ?\n\nMerci 😊`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: '#f3f4f6', color: '#374151' }} onClick={() => setDetailCar(null)}>
                Fermer
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
