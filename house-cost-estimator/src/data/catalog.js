// Reference price catalog. All money is INR. Rates are baseline values for
// Chennai (index 1.00) and are meant to be edited in the UI / refreshed by the
// user from local supplier quotes. They are NOT live market data.

export const PRICE_BASIS = 'Reference rates, Oct 2026 – verify with local suppliers';

// mat = material price index, lab = labour price index (Chennai = 1.00)
export const LOCATIONS = [
  { id: 'chennai', name: 'Chennai', mat: 1.0, lab: 1.0 },
  { id: 'bengaluru', name: 'Bengaluru', mat: 1.03, lab: 1.12 },
  { id: 'hyderabad', name: 'Hyderabad', mat: 1.0, lab: 1.05 },
  { id: 'mumbai', name: 'Mumbai / MMR', mat: 1.1, lab: 1.55 },
  { id: 'pune', name: 'Pune', mat: 1.04, lab: 1.18 },
  { id: 'delhi', name: 'Delhi NCR', mat: 1.06, lab: 1.25 },
  { id: 'kolkata', name: 'Kolkata', mat: 0.98, lab: 0.92 },
  { id: 'ahmedabad', name: 'Ahmedabad', mat: 0.98, lab: 1.02 },
  { id: 'kochi', name: 'Kochi', mat: 1.05, lab: 1.15 },
  { id: 'coimbatore', name: 'Coimbatore', mat: 0.98, lab: 0.9 },
  { id: 'madurai', name: 'Madurai / Trichy', mat: 0.97, lab: 0.85 },
  { id: 'town', name: 'Small town / rural', mat: 0.95, lab: 0.75 },
  { id: 'custom', name: 'Other (set indices)', mat: 1.0, lab: 1.0 },
];

export const SOILS = [
  { id: 'rock', name: 'Hard rock / murrum', factor: 0.9, risk: 'low' },
  { id: 'normal', name: 'Normal / gravelly soil', factor: 1.0, risk: 'low' },
  { id: 'sandy', name: 'Sandy soil', factor: 1.1, risk: 'medium' },
  { id: 'clay', name: 'Clay', factor: 1.1, risk: 'medium' },
  { id: 'high_water', name: 'High water table / coastal', factor: 1.2, risk: 'medium' },
  { id: 'black_cotton', name: 'Black cotton (expansive)', factor: 1.2, risk: 'high' },
  { id: 'filled', name: 'Filled-up / loose ground', factor: 1.25, risk: 'high' },
];

export const FOUNDATION_TYPES = {
  isolated: { name: 'Isolated footings', mult: 1.0 },
  raft: { name: 'Raft foundation', mult: 1.35 },
  pile: { name: 'Pile foundation', mult: 1.9 },
};

export const SLOPES = [
  { id: 'flat', name: 'Flat', factor: 0 },
  { id: 'mild', name: 'Mild slope', factor: 0.02 },
  { id: 'steep', name: 'Steep slope (retaining walls)', factor: 0.06 },
];

export const ACCESS = [
  { id: 'good', name: 'Wide road, truck access', factor: 0 },
  { id: 'narrow', name: 'Narrow lane / manual carry', factor: 0.03 },
];

export const FLOOR_OPTIONS = [
  { value: 1, label: 'Ground only (G)' },
  { value: 2, label: 'G + 1' },
  { value: 3, label: 'G + 2' },
  { value: 4, label: 'G + 3' },
];

// Structure quality grades.
export const GRADES = {
  economy: {
    name: 'Economy',
    cement: 0.42, steel: 0.95, finishing: 380, baseFloor: 65,
    doors: { main: 14000, internal: 6000, bath: 4500 },
    desc: 'Basic fittings, OPC/PPC cement, plain paint, flush doors',
  },
  standard: {
    name: 'Standard',
    cement: 0.45, steel: 1.0, finishing: 520, baseFloor: 90,
    doors: { main: 22000, internal: 8000, bath: 5000 },
    desc: 'Branded cement & TMT, good fittings, emulsion paint',
  },
  premium: {
    name: 'Premium',
    cement: 0.5, steel: 1.08, finishing: 760, baseFloor: 120,
    doors: { main: 35000, internal: 12000, bath: 6500 },
    desc: 'Top brands, UPVC windows, concealed wiring/plumbing upgrades',
  },
};

// Base material rates at Chennai index 1.0. `unit` is the purchase unit.
export const MATERIALS = [
  { id: 'cement', name: 'Cement (50 kg bag)', unit: '₹/bag', base: 400, perSqft: 0.45 },
  { id: 'steel', name: 'TMT steel (Fe500D)', unit: '₹/kg', base: 66, perSqft: 3.5 },
  { id: 'bricks', name: 'Bricks / blocks', unit: '₹/piece', base: 9, perSqft: 8 },
  { id: 'sand', name: 'M-sand / river sand', unit: '₹/cft', base: 55, perSqft: 1.3 },
  { id: 'aggregate', name: 'Aggregate (20 mm)', unit: '₹/cft', base: 42, perSqft: 1.5 },
];

export const BASE_LABOUR_PER_SQFT = 450;

export const SITE_WORKS = {
  compoundPerFt: 1800,
  sump: 85000,
  borewell: 90000,
  rwh: 45000,
  solar: 180000,
};

export const SOFT_COSTS = {
  contractorMargin: 0.06,
  contingency: 0.04,
  designApprovals: 0.025,
};

// ---------- Flooring (₹/sqft: mat = material, lay = laying & polishing) ----------
export const FLOORING = [
  { id: 'ceramic', cat: 'tile', name: 'Ceramic tile 2×2', mat: 38, lay: 30, note: 'Budget, good for utility areas' },
  { id: 'ceramic_as', cat: 'tile', name: 'Anti-skid ceramic (wet areas)', mat: 42, lay: 32, note: 'Bathrooms, balconies' },
  { id: 'vitrified', cat: 'tile', name: 'Vitrified tile 600×600', mat: 62, lay: 35, note: 'Most common choice' },
  { id: 'gvt', cat: 'tile', name: 'GVT / double-charge vitrified', mat: 95, lay: 38, note: 'Glossy, marble look' },
  { id: 'porcelain_slab', cat: 'tile', name: 'Large-format porcelain slab', mat: 210, lay: 70, note: '800×1600, premium look' },
  { id: 'kota', cat: 'stone', name: 'Kota stone', mat: 55, lay: 45, note: 'Cool, rugged, low cost' },
  { id: 'granite', cat: 'stone', name: 'Indian granite', mat: 120, lay: 55, note: 'Very durable' },
  { id: 'marble_indian', cat: 'marble', name: 'Indian marble (Ambaji / Morwad)', mat: 105, lay: 60, note: 'Budget marble' },
  { id: 'marble_makrana', cat: 'marble', name: 'Makrana white marble', mat: 280, lay: 70, note: 'Classic, premium' },
  { id: 'marble_italian', cat: 'marble', name: 'Italian marble (Botticino)', mat: 450, lay: 90, note: 'Imported, high-end' },
  { id: 'marble_statuario', cat: 'marble', name: 'Italian Statuario', mat: 1200, lay: 110, note: 'Luxury statement floors' },
  { id: 'wood_laminate', cat: 'wood', name: 'Engineered wood / laminate', mat: 120, lay: 30, note: 'Warm look, bedrooms' },
];

export const FLOORING_CATS = { tile: 'Tiles', marble: 'Marble', stone: 'Natural stone', wood: 'Wood' };

// Wall tile used in bathrooms (₹/sqft installed) per bathroom wall selection
export const BATH_FLOOR_SQFT = 45;
export const BATH_WALL_SQFT = 120;
export const KITCHEN_FLOOR_SQFT = 100;

// ---------- Woods ----------
// rate: ₹/cft for solid timber. doorFixed: all-in price for non-solid doors.
// furnMult: multiplier on the carpentry share of furniture vs. BWP plywood + laminate.
export const WOODS = [
  { id: 'burma_teak', name: 'Burma (Myanmar) teak', kind: 'solid', rate: 9000, furnMult: 3.4, note: 'Best grade, termite resistant' },
  { id: 'teak_local', name: 'Plantation / local teak', kind: 'solid', rate: 5000, furnMult: 2.6, note: 'Very popular for doors' },
  { id: 'sal', name: 'Sal wood', kind: 'solid', rate: 3200, furnMult: 2.0, note: 'Strong, heavy' },
  { id: 'mahogany', name: 'Mahogany / Honne', kind: 'solid', rate: 3800, furnMult: 2.2, note: 'Rich colour, carves well' },
  { id: 'sheesham', name: 'Sheesham (rosewood)', kind: 'solid', rate: 3000, furnMult: 1.9, note: 'Good for furniture' },
  { id: 'rubberwood', name: 'Rubber / pine wood', kind: 'solid', rate: 1400, furnMult: 1.35, note: 'Budget solid wood' },
  { id: 'plywood', name: 'BWP plywood + laminate', kind: 'engineered', doorFixed: { main: 16000, internal: 7500, bath: 6000 }, furnMult: 1.0, note: 'Standard for modern interiors' },
  { id: 'mdf', name: 'MDF / HDHMR board', kind: 'engineered', doorFixed: { main: 14000, internal: 6500, bath: 5500 }, furnMult: 0.85, note: 'Budget, avoid in wet areas' },
  { id: 'wpc', name: 'WPC / PVC (water-proof)', kind: 'engineered', doorFixed: { main: 15000, internal: 7000, bath: 4500 }, furnMult: 0.9, note: 'Best for bathrooms' },
];

export const DOOR_SPEC = {
  main: { label: 'Main door', cft: 6.5, fab: 18000 },
  internal: { label: 'Room doors', cft: 4.2, fab: 7000 },
  bath: { label: 'Bathroom doors', cft: 3.5, fab: 5000 },
};

// ---------- Interior items ----------
// unit: how quantity is derived from the plan. carp: share of price that is
// carpentry (scales with the furniture wood choice).
export const INTERIOR_ITEMS = [
  { id: 'kitchen', group: 'Kitchen', name: 'Modular kitchen (cabinets + counter)', unit: 'kitchen', price: 180000, carp: 0.7, on: true },
  { id: 'crockery', group: 'Kitchen', name: 'Crockery / dining unit', unit: 'fixed', price: 40000, carp: 0.8, on: false },
  { id: 'wardrobe', group: 'Bedrooms', name: 'Wardrobes', unit: 'bedroom', price: 60000, carp: 0.8, on: true },
  { id: 'bed', group: 'Bedrooms', name: 'Cots & bedside tables', unit: 'bedroom', price: 35000, carp: 0.9, on: true },
  { id: 'study', group: 'Bedrooms', name: 'Study / work desk', unit: 'extra', price: 30000, carp: 0.85, on: false },
  { id: 'tv', group: 'Living & dining', name: 'TV unit', unit: 'fixed', price: 45000, carp: 0.85, on: true },
  { id: 'sofa', group: 'Living & dining', name: 'Sofa & living furniture', unit: 'fixed', price: 85000, carp: 0.35, on: false },
  { id: 'dining', group: 'Living & dining', name: 'Dining table & chairs', unit: 'fixed', price: 60000, carp: 0.8, on: false },
  { id: 'pooja', group: 'Living & dining', name: 'Pooja unit', unit: 'fixed', price: 35000, carp: 0.9, on: false },
  { id: 'feature', group: 'Living & dining', name: 'Feature wall / wood panelling', unit: 'fixed', price: 70000, carp: 0.6, on: false },
  { id: 'bath', group: 'Bathrooms', name: 'Premium bath fittings & glass partition', unit: 'bathroom', price: 45000, carp: 0, on: false },
  { id: 'ceiling', group: 'Finishes & services', name: 'False ceiling (gypsum + cove)', unit: 'sqft70', price: 95, carp: 0, on: true },
  { id: 'lighting', group: 'Finishes & services', name: 'Decorative lighting & fixtures', unit: 'sqft', price: 85, carp: 0, on: true },
  { id: 'walls', group: 'Finishes & services', name: 'Premium wall finish (texture / luxury emulsion)', unit: 'sqft', price: 55, carp: 0, on: false },
  { id: 'curtains', group: 'Finishes & services', name: 'Curtains & blinds', unit: 'sqft', price: 35, carp: 0, on: false },
  { id: 'railing', group: 'Finishes & services', name: 'Staircase glass / SS railing', unit: 'flight', price: 40000, carp: 0, on: false },
  { id: 'automation', group: 'Finishes & services', name: 'Smart-home automation', unit: 'fixed', price: 120000, carp: 0, on: false },
];

export const INTERIOR_GRADES = {
  standard: { name: 'Standard hardware & finish', mult: 1.0 },
  premium: { name: 'Premium (branded hardware, soft-close)', mult: 1.35 },
  luxury: { name: 'Luxury (imported finishes)', mult: 1.8 },
};

export const BASE_INTERIOR_ADJ = { contingency: 0.05 };
