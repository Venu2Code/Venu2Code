import test from 'node:test';
import assert from 'node:assert/strict';
import { runEstimate } from '../src/engine/agent.js';
import { defaultState } from '../src/data/defaults.js';

const run = (mut) => {
  const s = defaultState();
  mut?.(s);
  return runEstimate(s);
};

test('default estimate is in a sane range and interiors cost more', () => {
  const { result, trace } = run();
  assert.equal(result.totalArea, 1600);
  assert.ok(result.perSqftWithout > 1700 && result.perSqftWithout < 3200, `got ${result.perSqftWithout}`);
  assert.ok(result.withInteriors > result.withoutInteriors);
  assert.ok(trace.at(-1).final);
  assert.ok(trace.length > 10);
});

test('location changes the price', () => {
  const chennai = run().result.withoutInteriors;
  const mumbai = run((s) => (s.location.id = 'mumbai')).result.withoutInteriors;
  const town = run((s) => (s.location.id = 'town')).result.withoutInteriors;
  assert.ok(mumbai > chennai && chennai > town);
});

test('more storeys: more total area and more steel per sqft', () => {
  const g1 = run((s) => (s.plan.floors = 1)).result;
  const g3 = run((s) => (s.plan.floors = 3)).result;
  assert.equal(g3.totalArea, 3 * g1.totalArea);
  const steel = (r) => r.structureLines.find((l) => l.id === 'steel').qty / r.totalArea;
  assert.ok(steel(g3) > steel(g1));
  assert.ok(g3.withoutInteriors > g1.withoutInteriors);
});

test('weak soil with floors makes the agent choose pile foundation', () => {
  const { result, trace } = run((s) => (s.land.soil = 'black_cotton'));
  assert.equal(result.foundationType, 'pile');
  assert.ok(trace.some((t) => /pile/i.test(t.thought)));
});

test('over-dense plot triggers extra bylaw step and warning', () => {
  const { result, trace } = run((s) => { s.land.plotArea = 900; });
  assert.ok(trace.some((t) => t.action?.tool === 'suggest_footprint'));
  assert.ok(result.warnings.length > 0);
});

test('marble costs more than vitrified tile; teak doors cost more than plywood', () => {
  const tile = run().result.interior.total;
  const marble = run((s) => (s.interiors.flooring.living = 'marble_italian')).result.interior.total;
  assert.ok(marble > tile);
  const teak = run((s) => (s.interiors.wood.internal = 'burma_teak')).result.interior.doors.total;
  const ply = run().result.interior.doors.total;
  assert.ok(teak > ply);
});

test('user-entered material rate overrides the indexed rate', () => {
  const base = run().result.withoutInteriors;
  const dear = run((s) => (s.rateOverrides.steel = 120)).result.withoutInteriors;
  assert.ok(dear > base);
});

test('unticking all interior items lowers interior cost', () => {
  const all = run().result.interior.furniture.total;
  const none = run((s) => { for (const k of Object.keys(s.interiors.items)) s.interiors.items[k] = false; }).result.interior.furniture.total;
  assert.equal(none, 0);
  assert.ok(all > 0);
});
