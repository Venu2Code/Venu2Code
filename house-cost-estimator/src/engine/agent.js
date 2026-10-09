// ReAct agent: Reason (Thought) -> Act (tool call) -> Observe, repeated until
// the planner decides it has enough to give the Final Answer.
//
// The policy here is rule-based (deterministic, offline, no API key). It reads
// the observations collected so far to choose the next action – e.g. a weak
// soil + several floors makes it switch the foundation type, and an over-dense
// plot triggers an extra bylaw check. `planner(ctx)` is the only thing an LLM
// would need to replace to drive the same tools.

import { TOOLS } from './tools.js';
import { GRADES, WOODS, BATH_FLOOR_SQFT, KITCHEN_FLOOR_SQFT } from '../data/catalog.js';

const MAX_STEPS = 24;

function pickFoundation(soil, floors) {
  if (soil.risk === 'high' && floors >= 2) return ['pile', `${soil.name} with ${floors} floors cannot rely on shallow footings`];
  if (soil.risk === 'high') return ['raft', `${soil.name} is weak, a raft spreads the load`];
  if (soil.risk === 'medium' && floors >= 3) return ['raft', `${soil.name} with ${floors} floors needs a raft`];
  return ['isolated', `${soil.name} is stable enough for isolated footings`];
}

const stepOf = (thought, tool, args) => ({ thought, action: { tool, args } });

function planner(ctx) {
  const { state: s, done: d, obs } = ctx;
  const grade = GRADES[s.grade];

  if (!d.has('lookup_location'))
    return stepOf('Prices depend heavily on where the house is built, so I first need the local material and labour indices.', 'lookup_location', { location: s.location });

  if (!d.has('lookup_material_rates'))
    return stepOf('With the location indices I can price cement, steel, bricks, sand and aggregate, using any rates the user typed in.', 'lookup_material_rates', { loc: obs.lookup_location, overrides: s.rateOverrides });

  if (!d.has('analyze_plan'))
    return stepOf('Next I read the house plan: total built-up area, door counts and whether the plan fits the plot.', 'analyze_plan', { plan: s.plan, land: s.land });

  const a = obs.analyze_plan;
  if (a.coverage > 0.75 && !d.has('suggest_footprint'))
    return stepOf(`Ground coverage is ${(a.coverage * 100).toFixed(0)}% – too dense. Before pricing I should see what a compliant footprint looks like.`, 'suggest_footprint', { land: s.land, plan: s.plan, analysis: a });

  if (!d.has('assess_site'))
    return stepOf('Soil, slope and road access change foundation and logistics cost, so I assess the site next.', 'assess_site', { land: s.land, floors: a.floors });

  if (!d.has('estimate_foundation')) {
    const [type, why] = pickFoundation(obs.assess_site.soil, a.floors);
    return stepOf(`${why}, so I price a ${type} foundation.`, 'estimate_foundation', { type, analysis: a, soil: obs.assess_site.soil, rates: obs.lookup_material_rates, loc: obs.lookup_location, grade: s.grade });
  }

  if (!d.has('estimate_superstructure'))
    return stepOf(`Now the structure: quantities per sqft for ${a.floors} floor(s) (steel rises with height) at ${grade.name} grade, priced with the current rates.`, 'estimate_superstructure', { analysis: a, rates: obs.lookup_material_rates, loc: obs.lookup_location, grade: s.grade });

  if (!d.has('estimate_finishing'))
    return stepOf('Structure done. Electrical, plumbing, plaster, paint, windows, staircase and terrace come next.', 'estimate_finishing', { analysis: a, loc: obs.lookup_location, grade: s.grade });

  if (!d.has('estimate_basic_fitout'))
    return stepOf('The "without interiors" price still needs basic floor tiles and standard doors; I price those as the baseline.', 'estimate_basic_fitout', { analysis: a, loc: obs.lookup_location, grade: s.grade });

  if (!d.has('estimate_site_works'))
    return stepOf('Add the external works the user ticked (compound wall, sump, borewell, etc.).', 'estimate_site_works', { land: s.land });

  if (!d.has('compute_civil_total'))
    return stepOf('I have all building parts. Combine them with site surcharge, contractor margin, design/approval fees and contingency.', 'compute_civil_total', {
      parts: { foundation: obs.estimate_foundation, structure: obs.estimate_superstructure, finishing: obs.estimate_finishing, fitout: obs.estimate_basic_fitout },
      siteFactor: obs.assess_site.siteFactor, analysis: a,
    });

  if (!d.has('compare_flooring'))
    return stepOf('For interiors the big decision is tiles vs. marble, so I compare every option on the living area before pricing the user’s choice.', 'compare_flooring', { area: Math.max(a.total - s.plan.bathrooms * BATH_FLOOR_SQFT - s.plan.kitchens * KITCHEN_FLOOR_SQFT, 0), loc: obs.lookup_location, selectedId: s.interiors.flooring.living });

  if (!d.has('estimate_flooring'))
    return stepOf('Price the chosen flooring zone by zone (living, kitchen, bathroom floors and walls).', 'estimate_flooring', { analysis: a, plan: s.plan, choice: s.interiors.flooring, loc: obs.lookup_location });

  if (!d.has('estimate_doors')) {
    const w = s.interiors.wood;
    const solid = ['main', 'internal', 'bath'].filter((k) => WOODS.find((x) => x.id === w[k]).kind === 'solid');
    const why = solid.length ? `Solid timber is chosen for ${solid.join(', ')} doors, so cost follows ₹/cft × door volume.` : 'All doors are engineered, so I use fixed all-in door prices.';
    return stepOf(`${why} Doors are compared against the standard doors already in the base price.`, 'estimate_doors', { analysis: a, wood: w, grade: s.grade, interiorGrade: s.interiors.grade, loc: obs.lookup_location });
  }

  if (!d.has('estimate_furniture'))
    return stepOf('Now the selected built-in furniture and finishes; wood type scales only the carpentry share of each item.', 'estimate_furniture', { analysis: a, plan: s.plan, interiors: s.interiors, loc: obs.lookup_location });

  if (!d.has('compute_interior_total'))
    return stepOf('Only the upgrade over the basic floor and doors counts as interior cost. Sum it up.', 'compute_interior_total', { flooring: obs.estimate_flooring, doors: obs.estimate_doors, furniture: obs.estimate_furniture, fitout: obs.estimate_basic_fitout, analysis: a });

  return null; // nothing left to do -> final answer
}

function buildFinal(ctx) {
  const o = ctx.obs;
  const a = o.analyze_plan;
  const civil = o.compute_civil_total;
  const site = o.estimate_site_works;
  const inter = o.compute_interior_total;
  const withoutInteriors = civil.building + site.cost;
  const withInteriors = withoutInteriors + inter.total;
  const warnings = [...a.warnings];
  if (o.assess_site.soil.risk === 'high') warnings.push(`${o.assess_site.soil.name}: get a soil test and structural design before finalising the foundation.`);

  const breakdown = [
    { id: 'foundation', label: 'Foundation', cost: o.estimate_foundation.cost },
    { id: 'structure', label: 'Structure, masonry & plaster', cost: o.estimate_superstructure.cost },
    { id: 'finishing', label: 'Electrical, plumbing, paint, windows, stairs', cost: o.estimate_finishing.cost },
    { id: 'fitout', label: 'Basic flooring & doors', cost: o.estimate_basic_fitout.cost },
    { id: 'markup', label: 'Margin, design, approvals, contingency', cost: civil.siteSurcharge + civil.margin + civil.design + civil.contingency },
    { id: 'site', label: 'Site works', cost: site.cost },
  ];

  return {
    location: o.lookup_location,
    analysis: a,
    rates: o.lookup_material_rates,
    foundationType: o.estimate_foundation.type,
    totalArea: a.total,
    building: civil.building,
    siteWorks: site.cost,
    withoutInteriors,
    withInteriors,
    perSqftWithout: Math.round(withoutInteriors / a.total),
    perSqftWith: Math.round(withInteriors / a.total),
    perSqftBuilding: Math.round(civil.building / a.total),
    interior: { ...inter, flooring: o.estimate_flooring, doors: o.estimate_doors, furniture: o.estimate_furniture },
    structureLines: o.estimate_superstructure.lines,
    siteItems: site.items,
    compare: o.compare_flooring,
    breakdown,
    warnings,
  };
}

export function runEstimate(state) {
  const ctx = { state, done: new Set(), obs: {} };
  const trace = [];
  for (let n = 1; n <= MAX_STEPS; n++) {
    const step = planner(ctx);
    if (!step) break;
    const { tool, args } = step.action;
    const out = TOOLS[tool](args);
    ctx.done.add(tool);
    ctx.obs[tool] = out.data;
    trace.push({ n, thought: step.thought, action: { tool, args: summariseArgs(args) }, observation: out.summary });
  }
  const result = buildFinal(ctx);
  trace.push({
    n: trace.length + 1,
    thought: 'Every part is priced and the baseline and interior upgrade are separated, so I can answer.',
    final: true,
    observation: `Without interiors: ${Math.round(result.withoutInteriors).toLocaleString('en-IN')} (₹${result.perSqftWithout}/sqft). With interiors: ${Math.round(result.withInteriors).toLocaleString('en-IN')} (₹${result.perSqftWith}/sqft).`,
  });
  return { trace, result };
}

// Keep the displayed action input short & readable.
function summariseArgs(args) {
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    if (v && typeof v === 'object') out[k] = Array.isArray(v) ? `[${v.length} items]` : '{…}';
    else out[k] = v;
  }
  return out;
}
