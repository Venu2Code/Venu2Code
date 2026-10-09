import { INTERIOR_ITEMS } from './catalog.js';

export function defaultState() {
  return {
    location: { id: 'chennai', customName: '', customMat: 1, customLab: 1 },
    land: {
      plotArea: 1200,
      soil: 'normal',
      slope: 'flat',
      access: 'good',
      compound: true,
      compoundFt: 140,
      sump: true,
      borewell: false,
      rwh: false,
      solar: false,
    },
    plan: {
      floors: 2,
      floorArea: 800,
      bedrooms: 3,
      bathrooms: 3,
      kitchens: 1,
      extraRooms: 1,
    },
    grade: 'standard',
    rateOverrides: {}, // materialId -> user-entered local rate
    interiors: {
      grade: 'standard',
      items: Object.fromEntries(INTERIOR_ITEMS.map((i) => [i.id, i.on])),
      flooring: { living: 'vitrified', kitchen: 'vitrified', bath: 'ceramic_as' },
      wood: { main: 'teak_local', internal: 'plywood', bath: 'wpc', furniture: 'plywood' },
    },
  };
}
