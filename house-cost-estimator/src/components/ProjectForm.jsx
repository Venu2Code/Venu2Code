import React, { useState } from 'react';
import { Field, NumberInput, Select, Check, Section } from './fields.jsx';
import { LOCATIONS, SOILS, SLOPES, ACCESS, FLOOR_OPTIONS, GRADES, MATERIALS } from '../data/catalog.js';

const opts = (list, label = (x) => x.name) => list.map((x) => ({ value: x.id, label: label(x) }));

export default function ProjectForm({ state, set, defaultRates }) {
  const { location, land, plan } = state;
  const [planImg, setPlanImg] = useState(null);

  const onPlanFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPlanImg((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  return (
    <>
      <Section n="1" title="Land & location">
        <div className="grid">
          <Field label="Location">
            <Select value={location.id} onChange={(v) => set('location.id', v)} options={opts(LOCATIONS)} />
          </Field>
          <Field label="Plot area (sq ft)" hint="2400 sq ft = 1 ground">
            <NumberInput value={land.plotArea} onChange={(v) => set('land.plotArea', v)} min={100} />
          </Field>
          {location.id === 'custom' && (
            <>
              <Field label="Place name"><input value={location.customName} onChange={(e) => set('location.customName', e.target.value)} /></Field>
              <Field label="Material price index" hint="1.00 = Chennai">
                <NumberInput value={location.customMat} step={0.01} onChange={(v) => set('location.customMat', v)} />
              </Field>
              <Field label="Labour price index" hint="1.00 = Chennai">
                <NumberInput value={location.customLab} step={0.01} onChange={(v) => set('location.customLab', v)} />
              </Field>
            </>
          )}
          <Field label="Soil type">
            <Select value={land.soil} onChange={(v) => set('land.soil', v)} options={opts(SOILS)} />
          </Field>
          <Field label="Plot slope">
            <Select value={land.slope} onChange={(v) => set('land.slope', v)} options={opts(SLOPES)} />
          </Field>
          <Field label="Road access">
            <Select value={land.access} onChange={(v) => set('land.access', v)} options={opts(ACCESS)} />
          </Field>
        </div>
        <h4>Site works</h4>
        <div className="checks">
          <Check checked={land.compound} onChange={(v) => set('land.compound', v)}>Compound wall & gate</Check>
          {land.compound && (
            <Field label="Wall length (ft)"><NumberInput value={land.compoundFt} onChange={(v) => set('land.compoundFt', v)} /></Field>
          )}
          <Check checked={land.sump} onChange={(v) => set('land.sump', v)}>Sump & septic tank</Check>
          <Check checked={land.borewell} onChange={(v) => set('land.borewell', v)}>Borewell & pump</Check>
          <Check checked={land.rwh} onChange={(v) => set('land.rwh', v)}>Rainwater harvesting</Check>
          <Check checked={land.solar} onChange={(v) => set('land.solar', v)}>Rooftop solar (3 kW)</Check>
        </div>
      </Section>

      <Section n="2" title="House plan">
        <div className="grid">
          <Field label="Storeys">
            <Select value={plan.floors} onChange={(v) => set('plan.floors', Number(v))} options={FLOOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Field>
          <Field label="Built-up area per floor (sq ft)" hint="From your drawing, incl. walls, stairs & balconies">
            <NumberInput value={plan.floorArea} onChange={(v) => set('plan.floorArea', v)} min={100} />
          </Field>
          <Field label="Bedrooms"><NumberInput value={plan.bedrooms} min={0} max={12} onChange={(v) => set('plan.bedrooms', v)} /></Field>
          <Field label="Bathrooms"><NumberInput value={plan.bathrooms} min={0} max={12} onChange={(v) => set('plan.bathrooms', v)} /></Field>
          <Field label="Kitchens"><NumberInput value={plan.kitchens} min={0} max={4} onChange={(v) => set('plan.kitchens', v)} /></Field>
          <Field label="Other rooms" hint="Pooja, study, store…"><NumberInput value={plan.extraRooms} min={0} max={8} onChange={(v) => set('plan.extraRooms', v)} /></Field>
        </div>
        <div className="plan-upload">
          <label className="btn ghost">
            Attach plan image (optional)
            <input type="file" accept="image/*" hidden onChange={onPlanFile} />
          </label>
          <span className="hint">The image stays in your browser for reference only. Enter the areas and room counts from it above.</span>
          {planImg && <img className="plan-img" src={planImg} alt="Uploaded house plan" />}
        </div>
      </Section>

      <Section n="3" title="Build quality & material rates">
        <div className="grades">
          {Object.entries(GRADES).map(([id, g]) => (
            <button
              key={id}
              type="button"
              className={'grade' + (state.grade === id ? ' on' : '')}
              onClick={() => set('grade', id)}
            >
              <strong>{g.name}</strong>
              <small>{g.desc}</small>
            </button>
          ))}
        </div>
        <h4>Current material rates <small className="hint">Leave blank to use the reference rate for your location</small></h4>
        <div className="grid">
          {MATERIALS.map((m) => (
            <Field key={m.id} label={`${m.name} · ${m.unit}`}>
              <input
                type="number"
                inputMode="decimal"
                placeholder={String(defaultRates[m.id])}
                value={state.rateOverrides[m.id] ?? ''}
                onChange={(e) => set(`rateOverrides.${m.id}`, e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
      </Section>
    </>
  );
}
