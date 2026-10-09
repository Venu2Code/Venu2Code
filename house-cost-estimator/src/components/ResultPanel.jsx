import React, { useState } from 'react';
import { fmt, fmtShort } from '../engine/money.js';
import AgentTrace from './AgentTrace.jsx';

const COLORS = ['#2f6f5e', '#4c8bb5', '#d9a441', '#9a6fb0', '#c9694f', '#7a8a99', '#3d9a8b'];

function Totals({ r }) {
  return (
    <div className="totals">
      <div className="total">
        <span className="t-label">Without interiors</span>
        <strong>{fmtShort(r.withoutInteriors)}</strong>
        <span className="t-sub">₹{r.perSqftWithout.toLocaleString('en-IN')} / sq ft all-in</span>
      </div>
      <div className="total accent">
        <span className="t-label">With interiors</span>
        <strong>{fmtShort(r.withInteriors)}</strong>
        <span className="t-sub">₹{r.perSqftWith.toLocaleString('en-IN')} / sq ft all-in</span>
      </div>
    </div>
  );
}

function Breakdown({ r }) {
  const rows = [...r.breakdown, { id: 'interiors', label: 'Interiors upgrade', cost: r.interior.total }];
  const sum = rows.reduce((s, x) => s + x.cost, 0);
  return (
    <>
      <div className="stack" role="img" aria-label="Cost split">
        {rows.map((x, i) => (
          <span key={x.id} style={{ width: `${(x.cost / sum) * 100}%`, background: COLORS[i % COLORS.length] }} title={`${x.label}: ${fmt(x.cost)}`} />
        ))}
      </div>
      <table className="tbl">
        <tbody>
          {rows.map((x, i) => (
            <tr key={x.id}>
              <td><i className="dot" style={{ background: COLORS[i % COLORS.length] }} />{x.label}</td>
              <td className="num">{fmt(x.cost)}</td>
              <td className="num muted">{((x.cost / sum) * 100).toFixed(0)}%</td>
            </tr>
          ))}
          <tr className="sum"><td>Total with interiors</td><td className="num">{fmt(sum)}</td><td /></tr>
        </tbody>
      </table>
      <p className="hint">
        Building only (excluding site works & interiors): {fmt(r.building)} = <b>₹{r.perSqftBuilding.toLocaleString('en-IN')}/sq ft</b> on {r.totalArea} sq ft.
        Excludes land, registration, GST differences, appliances and loose furnishings.
      </p>
    </>
  );
}

function InteriorDetail({ r }) {
  const i = r.interior;
  return (
    <>
      <h4>Flooring ({fmt(i.flooring.total)})</h4>
      <table className="tbl">
        <thead><tr><th>Area</th><th className="num">sq ft</th><th className="num">₹/sq ft</th><th className="num">Cost</th></tr></thead>
        <tbody>
          {i.flooring.zones.map((z) => (
            <tr key={z.zone}>
              <td>{z.zone}<br /><small className="muted">{z.name}</small></td>
              <td className="num">{Math.round(z.area)}</td><td className="num">{z.rate}</td><td className="num">{fmt(z.cost)}</td>
            </tr>
          ))}
          <tr className="muted"><td colSpan="3">Less: basic flooring already in base price</td><td className="num">−{fmt(i.flooring.total - i.flooringDelta)}</td></tr>
        </tbody>
      </table>

      <h4>Doors ({fmt(i.doors.total)})</h4>
      <table className="tbl">
        <tbody>
          {i.doors.doors.map((d) => (
            <tr key={d.key}>
              <td>{d.count} × {d.label}<br /><small className="muted">{d.wood}</small></td>
              <td className="num muted">{fmt(d.each)} each</td>
              <td className="num">{fmt(d.cost)}</td>
            </tr>
          ))}
          <tr className="muted"><td colSpan="2">Less: standard doors in base price</td><td className="num">−{fmt(i.doors.total - i.doorsDelta)}</td></tr>
        </tbody>
      </table>

      <h4>Furniture & finishes ({fmt(i.furniture.total)})</h4>
      {i.furniture.rows.length === 0 ? <p className="hint">Nothing selected.</p> : (
        <table className="tbl">
          <tbody>
            {i.furniture.rows.map((x) => (
              <tr key={x.id}>
                <td>{x.name}<br /><small className="muted">{x.group}</small></td>
                <td className="num muted">{x.qty} × {fmt(x.unit)}</td>
                <td className="num">{fmt(x.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <table className="tbl">
        <tbody>
          <tr className="muted"><td>Contingency (5%)</td><td className="num">{fmt(i.contingency)}</td></tr>
          <tr className="sum"><td>Interiors upgrade total</td><td className="num">{fmt(i.total)}</td></tr>
        </tbody>
      </table>
    </>
  );
}

function FlooringCompare({ r, selected }) {
  const max = Math.max(...r.compare.rows.map((x) => x.rate));
  const living = r.compare.rows[0] ? r.compare.rows : [];
  return (
    <>
      <p className="hint">Installed cost for the living/bedroom area, cheapest first. Bars show ₹/sq ft.</p>
      <div className="cmp">
        {living.map((x) => (
          <div key={x.id} className={'cmp-row' + (x.id === selected ? ' sel' : '')}>
            <div className="cmp-name">
              <span className={'pill ' + x.cat}>{x.cat === 'tile' ? 'Tile' : x.cat === 'marble' ? 'Marble' : 'Stone'}</span> {x.name}
            </div>
            <div className="cmp-bar"><span className={x.cat} style={{ width: `${(x.rate / max) * 100}%` }} /></div>
            <div className="cmp-val">₹{x.rate}<small>{fmtShort(x.total)}</small></div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ResultPanel({ out, state }) {
  const [tab, setTab] = useState('summary');
  const { result: r, trace } = out;
  const tabs = [['summary', 'Summary'], ['interiors', 'Interiors'], ['floor', 'Tiles vs marble'], ['agent', 'Agent steps']];
  return (
    <aside className="result">
      <header className="res-head">
        <h2>Estimated cost</h2>
        <p className="hint">{r.location.name} · {r.analysis.floors === 1 ? 'Ground floor' : `G+${r.analysis.floors - 1}`} · {r.totalArea} sq ft built-up</p>
      </header>
      <Totals r={r} />
      {r.warnings.length > 0 && (
        <ul className="warn">{r.warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>
      )}
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'summary' && <Breakdown r={r} />}
        {tab === 'interiors' && <InteriorDetail r={r} />}
        {tab === 'floor' && <FlooringCompare r={r} selected={state.interiors.flooring.living} />}
        {tab === 'agent' && <AgentTrace trace={trace} />}
      </div>
      <div className="actions no-print">
        <button className="btn" onClick={() => window.print()}>Print / save PDF</button>
      </div>
    </aside>
  );
}
