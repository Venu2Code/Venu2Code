import React, { useEffect, useRef, useState } from 'react';

export default function AgentTrace({ trace }) {
  const [shown, setShown] = useState(trace.length);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(() => setShown(trace.length), [trace]);

  const replay = () => {
    clearInterval(timer.current);
    setShown(0);
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= trace.length) clearInterval(timer.current);
    }, 450);
  };

  return (
    <div className="trace">
      <div className="trace-top">
        <p className="hint">
          The estimator is a ReAct agent: it reasons (<b>Thought</b>), calls a pricing tool (<b>Action</b>) and reads the
          result (<b>Observation</b>), then decides what to do next.
        </p>
        <button className="btn ghost" onClick={replay}>▶ Replay</button>
      </div>
      <ol>
        {trace.slice(0, shown).map((t) => (
          <li key={t.n} className={t.final ? 'final' : ''}>
            <div className="row"><span className="tag th">Thought</span><span>{t.thought}</span></div>
            {t.action && (
              <div className="row">
                <span className="tag ac">Action</span>
                <code>{t.action.tool}({Object.entries(t.action.args).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join(', ')})</code>
              </div>
            )}
            <div className="row"><span className={'tag ' + (t.final ? 'fa' : 'ob')}>{t.final ? 'Final answer' : 'Observation'}</span><span>{t.observation}</span></div>
          </li>
        ))}
      </ol>
    </div>
  );
}
