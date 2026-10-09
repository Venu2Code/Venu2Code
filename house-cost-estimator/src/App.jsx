import React, { useMemo, useState, useEffect } from 'react';
import ProjectForm from './components/ProjectForm.jsx';
import InteriorsForm from './components/InteriorsForm.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import { defaultState } from './data/defaults.js';
import { runEstimate } from './engine/agent.js';
import { TOOLS } from './engine/tools.js';
import { PRICE_BASIS } from './data/catalog.js';

const KEY = 'house-cost-estimator:v1';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) {
      const d = defaultState();
      return {
        ...d, ...saved,
        location: { ...d.location, ...saved.location },
        land: { ...d.land, ...saved.land },
        plan: { ...d.plan, ...saved.plan },
        interiors: {
          ...d.interiors, ...saved.interiors,
          items: { ...d.interiors.items, ...saved.interiors?.items },
          flooring: { ...d.interiors.flooring, ...saved.interiors?.flooring },
          wood: { ...d.interiors.wood, ...saved.interiors?.wood },
        },
      };
    }
  } catch { /* storage unavailable or corrupt – use defaults */ }
  return defaultState();
}

// set('a.b.c', v) -> immutable deep update
function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(obj[head] ?? {}, rest.join('.'), value) };
}

export default function App() {
  const [state, setState] = useState(load);
  const set = (path, value) => setState((s) => setPath(s, path, value));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const out = useMemo(() => runEstimate(state), [state]);
  const loc = out.result.location;
  const defaultRates = useMemo(
    () => TOOLS.lookup_material_rates({ loc, overrides: {} }).data,
    [loc],
  );

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>🏠 House Cost Estimator</h1>
          <p>ReAct agent that prices your build from location, plot, plan and materials — with and without interiors.</p>
        </div>
        <button className="btn ghost no-print" onClick={() => setState(defaultState())}>Reset</button>
      </header>
      <main className="layout">
        <div className="forms no-print">
          <ProjectForm state={state} set={set} defaultRates={defaultRates} />
          <InteriorsForm state={state} set={set} loc={loc} />
        </div>
        <ResultPanel out={out} state={state} />
      </main>
      <footer className="foot">
        {PRICE_BASIS}. Indicative estimate in INR for planning only – get a detailed BOQ and quotes before committing.
      </footer>
    </div>
  );
}
