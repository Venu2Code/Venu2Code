import React from 'react';
import { Field, Select, Check, Section } from './fields.jsx';
import {
  INTERIOR_ITEMS, INTERIOR_GRADES, FLOORING, FLOORING_CATS, WOODS,
} from '../data/catalog.js';
import { fmt } from '../engine/money.js';

const groups = [...new Set(INTERIOR_ITEMS.map((i) => i.group))];

function FloorSelect({ value, onChange, loc, allowed }) {
  const list = FLOORING.filter((f) => allowed.includes(f.cat));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(FLOORING_CATS).filter(([c]) => allowed.includes(c)).map(([cat, label]) => (
        <optgroup key={cat} label={label}>
          {list.filter((f) => f.cat === cat).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {fmt(f.mat * loc.mat + f.lay * loc.lab)}/sqft
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function WoodSelect({ value, onChange, loc, door }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {WOODS.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
          {w.kind === 'solid' ? ` — ${fmt(w.rate * loc.mat)}/cft` : door ? ' — fixed price door' : ''}
        </option>
      ))}
    </select>
  );
}

export default function InteriorsForm({ state, set, loc }) {
  const { interiors } = state;
  const woodNote = (id) => WOODS.find((w) => w.id === id)?.note;
  return (
    <Section n="4" title="Interiors design">
      <h4>What should be included?</h4>
      {groups.map((g) => (
        <fieldset key={g} className="group">
          <legend>{g}</legend>
          <div className="checks">
            {INTERIOR_ITEMS.filter((i) => i.group === g).map((i) => (
              <Check
                key={i.id}
                checked={!!interiors.items[i.id]}
                onChange={(v) => set(`interiors.items.${i.id}`, v)}
              >
                {i.name}
              </Check>
            ))}
          </div>
        </fieldset>
      ))}

      <h4>Flooring: tiles or marble?</h4>
      <div className="grid">
        <Field label="Living, dining & bedrooms" hint="Largest area – biggest price impact">
          <FloorSelect value={interiors.flooring.living} onChange={(v) => set('interiors.flooring.living', v)} loc={loc} allowed={['tile', 'marble', 'stone', 'wood']} />
        </Field>
        <Field label="Kitchen floor">
          <FloorSelect value={interiors.flooring.kitchen} onChange={(v) => set('interiors.flooring.kitchen', v)} loc={loc} allowed={['tile', 'stone']} />
        </Field>
        <Field label="Bathroom floor & walls">
          <FloorSelect value={interiors.flooring.bath} onChange={(v) => set('interiors.flooring.bath', v)} loc={loc} allowed={['tile']} />
        </Field>
      </div>

      <h4>Wood for doors & furniture</h4>
      <div className="grid">
        <Field label="Main door" hint={woodNote(interiors.wood.main)}>
          <WoodSelect door value={interiors.wood.main} onChange={(v) => set('interiors.wood.main', v)} loc={loc} />
        </Field>
        <Field label="Room doors" hint={woodNote(interiors.wood.internal)}>
          <WoodSelect door value={interiors.wood.internal} onChange={(v) => set('interiors.wood.internal', v)} loc={loc} />
        </Field>
        <Field label="Bathroom doors" hint={woodNote(interiors.wood.bath)}>
          <WoodSelect door value={interiors.wood.bath} onChange={(v) => set('interiors.wood.bath', v)} loc={loc} />
        </Field>
        <Field label="Furniture & cabinets" hint={woodNote(interiors.wood.furniture)}>
          <WoodSelect value={interiors.wood.furniture} onChange={(v) => set('interiors.wood.furniture', v)} loc={loc} />
        </Field>
        <Field label="Hardware & finish level">
          <Select
            value={interiors.grade}
            onChange={(v) => set('interiors.grade', v)}
            options={Object.entries(INTERIOR_GRADES).map(([value, g]) => ({ value, label: g.name }))}
          />
        </Field>
      </div>
    </Section>
  );
}
