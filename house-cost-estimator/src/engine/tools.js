// Tools the ReAct agent can call ("Act"). Each tool is a pure function
// (args, ctx) -> { summary, data }. `summary` is the human-readable
// "Observation"; `data` is what later steps / the final answer read.

import {
  LOCATIONS, SOILS, SLOPES, ACCESS, GRADES, MATERIALS, BASE_LABOUR_PER_SQFT,
  FOUNDATION_TYPES, SITE_WORKS, SOFT_COSTS, FLOORING, WOODS, DOOR_SPEC,
  INTERIOR_ITEMS, INTERIOR_GRADES, BASE_INTERIOR_ADJ, BATH_FLOOR_SQFT,
  BATH_WALL_SQFT, KITCHEN_FLOOR_SQFT,
} from '../data/catalog.js';
import { fmtShort } from './money.js';

const byId = (list, id) => list.find((x) => x.id === id);
const avgIdx = (loc) => 0.55 * loc.mat + 0.45 * loc.lab;
const r0 = (n) => Math.round(n);

export const TOOLS = {
  lookup_location({ location }) {
    const base = byId(LOCATIONS, location.id) ?? LOCATIONS[0];
    const custom = base.id === 'custom';
    const loc = {
      id: base.id,
      name: custom ? location.customName || 'Custom location' : base.name,
      mat: custom ? Number(location.customMat) || 1 : base.mat,
      lab: custom ? Number(location.customLab) || 1 : base.lab,
    };
    return {
      summary: `${loc.name}: material index ${loc.mat.toFixed(2)}, labour index ${loc.lab.toFixed(2)} (Chennai = 1.00).`,
      data: loc,
    };
  },

  lookup_material_rates({ loc, overrides }) {
    const rates = {};
    const lines = [];
    for (const m of MATERIALS) {
      const o = Number(overrides[m.id]);
      const fromUser = Number.isFinite(o) && o > 0;
      rates[m.id] = fromUser ? o : +(m.base * loc.mat).toFixed(1);
      lines.push(`${m.name.split(' (')[0]} ${rates[m.id]}${fromUser ? '*' : ''}`);
    }
    const n = Object.keys(overrides).filter((k) => Number(overrides[k]) > 0).length;
    return {
      summary: `Current rates (${m_unit()}): ${lines.join(', ')}.${n ? ` * = ${n} rate(s) you entered.` : ''}`,
      data: rates,
    };
  },

  assess_site({ land, floors }) {
    const soil = byId(SOILS, land.soil) ?? SOILS[1];
    const slope = byId(SLOPES, land.slope) ?? SLOPES[0];
    const access = byId(ACCESS, land.access) ?? ACCESS[0];
    const siteFactor = slope.factor + access.factor;
    return {
      summary: `Soil: ${soil.name} (risk ${soil.risk}, factor ${soil.factor}). Site surcharge ${(siteFactor * 100).toFixed(0)}% for slope/access. ${floors} floor(s) planned.`,
      data: { soil, siteFactor },
    };
  },

  analyze_plan({ plan, land }) {
    const floors = plan.floors;
    const footprint = plan.floorArea;
    const total = footprint * floors;
    const coverage = land.plotArea > 0 ? footprint / land.plotArea : 0;
    const far = land.plotArea > 0 ? total / land.plotArea : 0;
    const doors = {
      main: 1,
      internal: plan.bedrooms + plan.kitchens + plan.extraRooms,
      bath: plan.bathrooms,
    };
    const warnings = [];
    if (coverage > 1) warnings.push('Floor area per floor is larger than the plot.');
    else if (coverage > 0.75) warnings.push(`Ground coverage ${(coverage * 100).toFixed(0)}% is above the usual 60–75% limit; setbacks may not fit.`);
    if (far > 2.5) warnings.push(`FSI/FAR ${far.toFixed(2)} is high; check local bylaws.`);
    if (plan.bedrooms + plan.kitchens > 0 && footprint * floors / (plan.bedrooms || 1) < 250) {
      warnings.push('Very little built-up area per bedroom – confirm the area against your drawing.');
    }
    return {
      summary: `Built-up ${total} sqft (${floors} × ${footprint}). Coverage ${(coverage * 100).toFixed(0)}%, FAR ${far.toFixed(2)}. Doors: ${doors.main} main, ${doors.internal} room, ${doors.bath} bathroom.${warnings.length ? ' ⚠ ' + warnings.join(' ') : ''}`,
      data: { floors, footprint, total, coverage, far, doors, warnings },
    };
  },

  suggest_footprint({ land, plan, analysis }) {
    const maxFootprint = Math.floor(land.plotArea * 0.7);
    const needFloors = Math.ceil(analysis.total / Math.max(maxFootprint, 1));
    return {
      summary: `At 70% coverage the footprint is ${maxFootprint} sqft; the same ${analysis.total} sqft would need ${needFloors} floor(s). Estimate continues with your figures.`,
      data: { maxFootprint, needFloors },
    };
  },

  estimate_foundation({ type, analysis, soil, rates, loc, grade }) {
    const base = 350;
    const floorsF = 1 + 0.12 * (analysis.floors - 1);
    const mult = FOUNDATION_TYPES[type].mult;
    const cost = base * analysis.footprint * soil.factor * mult * floorsF * avgIdx(loc);
    return {
      summary: `${FOUNDATION_TYPES[type].name} on ${analysis.footprint} sqft footprint ≈ ${fmtShort(cost)}.`,
      data: { type, cost: r0(cost) },
    };
  },

  estimate_superstructure({ analysis, rates, loc, grade }) {
    const g = GRADES[grade];
    const floors = analysis.floors;
    const qty = {
      cement: g.cement,
      steel: (3.5 + 0.35 * (floors - 1)) * g.steel,
      bricks: 8,
      sand: 1.3,
      aggregate: 1.5,
    };
    const lines = MATERIALS.map((m) => ({
      id: m.id,
      name: m.name.split(' (')[0],
      qty: r0(qty[m.id] * analysis.total * 100) / 100,
      cost: r0(qty[m.id] * analysis.total * rates[m.id]),
    }));
    const materials = lines.reduce((s, l) => s + l.cost, 0);
    const labour = r0(BASE_LABOUR_PER_SQFT * loc.lab * (1 + 0.03 * (floors - 1)) * analysis.total);
    const perSqft = (materials + labour) / analysis.total;
    return {
      summary: `Frame, masonry & plaster: materials ${fmtShort(materials)} + labour ${fmtShort(labour)} = ${fmtShort(materials + labour)} (₹${r0(perSqft)}/sqft).`,
      data: { lines, materials, labour, cost: materials + labour },
    };
  },

  estimate_finishing({ analysis, loc, grade }) {
    const g = GRADES[grade];
    const finishing = r0(g.finishing * avgIdx(loc) * analysis.total);
    const flights = analysis.floors - 1;
    const stairs = r0(flights * 60000 * avgIdx(loc));
    const terrace = r0(120 * analysis.footprint * avgIdx(loc));
    return {
      summary: `Electrical, plumbing, plaster-paint, windows, waterproofing (${g.name}): ${fmtShort(finishing)}; staircase ${fmtShort(stairs)}; terrace/parapet/tank ${fmtShort(terrace)}.`,
      data: { finishing, stairs, terrace, cost: finishing + stairs + terrace },
    };
  },

  estimate_basic_fitout({ analysis, loc, grade }) {
    const g = GRADES[grade];
    const flooring = r0(g.baseFloor * avgIdx(loc) * analysis.total);
    const d = analysis.doors;
    const doors = r0(
      (d.main * g.doors.main + d.internal * g.doors.internal + d.bath * g.doors.bath) * avgIdx(loc),
    );
    return {
      summary: `Basic flooring ${fmtShort(flooring)} (₹${r0(g.baseFloor * avgIdx(loc))}/sqft) and standard doors ${fmtShort(doors)} are included in the "without interiors" price.`,
      data: { flooring, doors, cost: flooring + doors },
    };
  },

  estimate_site_works({ land }) {
    const items = [];
    if (land.compound) items.push({ name: `Compound wall & gate (${land.compoundFt} ft)`, cost: land.compoundFt * SITE_WORKS.compoundPerFt });
    if (land.sump) items.push({ name: 'Sump & septic tank', cost: SITE_WORKS.sump });
    if (land.borewell) items.push({ name: 'Borewell & pump', cost: SITE_WORKS.borewell });
    if (land.rwh) items.push({ name: 'Rainwater harvesting', cost: SITE_WORKS.rwh });
    if (land.solar) items.push({ name: 'Rooftop solar (3 kW)', cost: SITE_WORKS.solar });
    const cost = items.reduce((s, i) => s + i.cost, 0);
    return {
      summary: items.length ? `${items.length} site item(s) selected: ${fmtShort(cost)}.` : 'No site works selected.',
      data: { items, cost },
    };
  },

  compute_civil_total({ parts, siteFactor, analysis }) {
    const core = parts.foundation.cost + parts.structure.cost + parts.finishing.cost + parts.fitout.cost;
    const siteSurcharge = r0(core * siteFactor);
    const margin = r0((core + siteSurcharge) * SOFT_COSTS.contractorMargin);
    const design = r0((core + siteSurcharge) * SOFT_COSTS.designApprovals);
    const contingency = r0((core + siteSurcharge + margin) * SOFT_COSTS.contingency);
    const building = core + siteSurcharge + margin + design + contingency;
    return {
      summary: `Building (civil + services + basic finish) = ${fmtShort(building)} → ₹${r0(building / analysis.total)}/sqft, after ${+(SOFT_COSTS.contractorMargin * 100).toFixed(1)}% contractor margin, ${+(SOFT_COSTS.designApprovals * 100).toFixed(1)}% design & approvals, ${+(SOFT_COSTS.contingency * 100).toFixed(1)}% contingency.`,
      data: { core, siteSurcharge, margin, design, contingency, building },
    };
  },

  compare_flooring({ area, loc, selectedId }) {
    const rows = FLOORING.filter((f) => f.cat !== 'wood').map((f) => {
      const rate = f.mat * loc.mat + f.lay * loc.lab;
      return { id: f.id, name: f.name, cat: f.cat, rate: r0(rate), total: r0(rate * area) };
    }).sort((a, b) => a.rate - b.rate);
    const cheapTile = rows.find((x) => x.cat === 'tile');
    const cheapMarble = rows.find((x) => x.cat === 'marble');
    const sel = rows.find((x) => x.id === selectedId);
    return {
      summary: `For ${r0(area)} sqft of living area: cheapest tile ₹${cheapTile.rate}/sqft (${fmtShort(cheapTile.total)}), cheapest marble ₹${cheapMarble.rate}/sqft (${fmtShort(cheapMarble.total)})${sel ? `; your choice ${sel.name} ₹${sel.rate}/sqft` : ''}.`,
      data: { rows, cheapTile, cheapMarble },
    };
  },

  estimate_flooring({ analysis, plan, choice, loc }) {
    const price = (id) => {
      const f = byId(FLOORING, id);
      return f.mat * loc.mat + f.lay * loc.lab;
    };
    const bathFloor = plan.bathrooms * BATH_FLOOR_SQFT;
    const bathWall = plan.bathrooms * BATH_WALL_SQFT;
    const kitchen = plan.kitchens * KITCHEN_FLOOR_SQFT;
    const living = Math.max(analysis.total - bathFloor - kitchen, 0);
    const zones = [
      { zone: 'Living, dining, bedrooms & passages', id: choice.living, area: living },
      { zone: 'Kitchen floor', id: choice.kitchen, area: kitchen },
      { zone: 'Bathroom floors', id: choice.bath, area: bathFloor },
      { zone: 'Bathroom wall tiles', id: choice.bath, area: bathWall },
    ].map((z) => ({ ...z, name: byId(FLOORING, z.id).name, rate: r0(price(z.id)), cost: r0(price(z.id) * z.area) }));
    const total = zones.reduce((s, z) => s + z.cost, 0);
    return {
      summary: `Selected flooring ${fmtShort(total)} over ${r0(living + kitchen + bathFloor + bathWall)} sqft of floor + wall tile.`,
      data: { zones, total, livingArea: living },
    };
  },

  estimate_doors({ analysis, wood, grade, interiorGrade, loc }) {
    const hw = INTERIOR_GRADES[interiorGrade].mult;
    const out = [];
    for (const key of ['main', 'internal', 'bath']) {
      const w = byId(WOODS, wood[key]);
      const spec = DOOR_SPEC[key];
      const count = analysis.doors[key];
      let each;
      if (w.kind === 'solid') each = (spec.cft * w.rate * loc.mat + spec.fab * hw * loc.lab);
      else each = w.doorFixed[key] * avgIdx(loc);
      out.push({ key, label: spec.label, wood: w.name, count, each: r0(each), cost: r0(each * count) });
    }
    const total = out.reduce((s, d) => s + d.cost, 0);
    return {
      summary: `Doors: ${out.map((d) => `${d.count}× ${d.wood.split(' ')[0]} ${d.label.toLowerCase()} @ ${fmtShort(d.each)}`).join('; ')} = ${fmtShort(total)}.`,
      data: { doors: out, total },
    };
  },

  estimate_furniture({ analysis, plan, interiors, loc }) {
    const w = byId(WOODS, interiors.wood.furniture);
    const gm = INTERIOR_GRADES[interiors.grade].mult;
    const idx = avgIdx(loc);
    const flights = analysis.floors - 1;
    const rows = [];
    for (const it of INTERIOR_ITEMS) {
      if (!interiors.items[it.id]) continue;
      let qty;
      switch (it.unit) {
        case 'kitchen': qty = plan.kitchens; break;
        case 'bedroom': qty = plan.bedrooms; break;
        case 'bathroom': qty = plan.bathrooms; break;
        case 'extra': qty = Math.max(plan.extraRooms, 1); break;
        case 'flight': qty = flights; break;
        case 'sqft': qty = analysis.total; break;
        case 'sqft70': qty = analysis.total * 0.7; break;
        default: qty = 1;
      }
      if (!qty) continue;
      const wood = 1 + it.carp * (w.furnMult - 1);
      const unit = it.price * wood * gm * idx;
      rows.push({ id: it.id, group: it.group, name: it.name, qty: r0(qty), unit: r0(unit), cost: r0(unit * qty) });
    }
    const total = rows.reduce((s, x) => s + x.cost, 0);
    return {
      summary: `${rows.length} interior item(s) in ${w.name}/${INTERIOR_GRADES[interiors.grade].name.split(' ')[0].toLowerCase()} finish: ${fmtShort(total)}.`,
      data: { rows, total },
    };
  },

  compute_interior_total({ flooring, doors, furniture, fitout, analysis }) {
    const flooringDelta = flooring.total - fitout.flooring;
    const doorsDelta = doors.total - fitout.doors;
    const sub = flooringDelta + doorsDelta + furniture.total;
    const contingency = r0(Math.max(sub, 0) * BASE_INTERIOR_ADJ.contingency);
    const total = sub + contingency;
    return {
      summary: `Interiors add ${fmtShort(total)} on top of the basic build (flooring Δ ${fmtShort(flooringDelta)}, doors Δ ${fmtShort(doorsDelta)}, furniture & finishes ${fmtShort(furniture.total)}, contingency ${fmtShort(contingency)}).`,
      data: { flooringDelta, doorsDelta, furnitureTotal: furniture.total, contingency, total, perSqft: r0(total / analysis.total) },
    };
  },
};

function m_unit() {
  return '₹; cement/bag, steel/kg, brick/pc, sand & aggregate/cft';
}
