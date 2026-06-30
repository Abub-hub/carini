// Curated reference data for the "Ajouter une voiture" form: brand/model
// autocomplete suggestions and a palette of common paint colors.
// Not exhaustive — inputs stay free-text, this just powers the <datalist> suggestions.

export const CAR_BRANDS = [
  'Acura', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'BYD',
  'Cadillac', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra', 'Dacia', 'Daihatsu',
  'Dodge', 'DS Automobiles', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda',
  'Hyundai', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lada', 'Lamborghini',
  'Lancia', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Polestar',
  'Porsche', 'RAM', 'Renault', 'Rolls-Royce', 'Saab', 'Seat', 'Škoda', 'Smart',
  'SsangYong', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// Current-generation / recently produced nameplates only — older discontinued
// generations (e.g. Clio 2/3) are intentionally left out.
export const MODELS_BY_BRAND = {
  'Audi':          ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', 'Q8', 'e-tron'],
  'BMW':           ['Série 1', 'Série 2', 'Série 3', 'Série 5', 'X1', 'X2', 'X3', 'X5', 'i4'],
  'BYD':           ['Atto 3', 'Dolphin', 'Seal', 'Han'],
  'Chevrolet':     ['Spark', 'Aveo', 'Cruze', 'Captiva', 'Trailblazer'],
  'Citroën':       ['C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'Berlingo'],
  'Dacia':         ['Sandero', 'Logan', 'Duster', 'Jogger', 'Spring'],
  'Fiat':          ['500', '500X', 'Panda', 'Tipo', 'Doblo'],
  'Ford':          ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Ranger', 'EcoSport'],
  'Honda':         ['Civic', 'CR-V', 'HR-V', 'Jazz', 'Accord'],
  'Hyundai':       ['i10', 'i20', 'Accent', 'Elantra', 'Tucson', 'Santa Fe', 'Kona'],
  'Jeep':          ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler'],
  'Kia':           ['Picanto', 'Rio', 'Cerato', 'Sportage', 'Sorento', 'Seltos'],
  'Land Rover':    ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover Evoque', 'Range Rover Sport'],
  'Mazda':         ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-30'],
  'Mercedes-Benz':  ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLB', 'GLC', 'EQA'],
  'MG':            ['MG3', 'MG5', 'ZS', 'HS'],
  'Mini':          ['Cooper', 'Countryman', 'Clubman'],
  'Mitsubishi':    ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'L200'],
  'Nissan':        ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Navara'],
  'Opel':          ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland'],
  'Peugeot':       ['208', '2008', '308', '3008', '408', '5008', 'Partner'],
  'Renault':       ['Clio', 'Captur', 'Megane', 'Megane E-Tech', 'Austral', 'Arkana', 'Kadjar', 'Kangoo'],
  'Seat':          ['Ibiza', 'Leon', 'Arona', 'Ateca'],
  'Škoda':         ['Fabia', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq'],
  'Suzuki':        ['Swift', 'Vitara', 'S-Cross', 'Jimny'],
  'Tesla':         ['Model 3', 'Model Y', 'Model S', 'Model X'],
  'Toyota':        ['Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Land Cruiser', 'Hilux'],
  'Volkswagen':    ['Polo', 'Golf', 'T-Roc', 'Tiguan', 'Passat', 'Taos'],
  'Volvo':         ['XC40', 'XC60', 'XC90', 'S60', 'V60']
};

export const COMMON_COLORS = [
  { name: 'Blanc',  hex: '#FFFFFF', border: true },
  { name: 'Noir',   hex: '#111827' },
  { name: 'Gris',   hex: '#9CA3AF' },
  { name: 'Argent', hex: '#D1D5DB', border: true },
  { name: 'Bleu',   hex: '#2563EB' },
  { name: 'Rouge',  hex: '#DC2626' },
  { name: 'Vert',   hex: '#16A34A' },
  { name: 'Jaune',  hex: '#FACC15' },
  { name: 'Beige',  hex: '#D6C7A1' },
  { name: 'Marron', hex: '#7C4A2D' },
  { name: 'Orange', hex: '#F97316' }
];

export function colorHex(name) {
  if (!name) return null;
  const match = COMMON_COLORS.find(c => c.name.toLowerCase() === String(name).trim().toLowerCase());
  return match ? match.hex : null;
}
