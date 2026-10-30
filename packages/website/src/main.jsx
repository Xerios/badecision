import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { createDecider, LABELS } from '@badecision/core';
import './style.css';

const COLORS = { yes: 'var(--yes)', no: 'var(--no)', maybe: 'var(--maybe)', unsure: 'var(--unsure)' };
const NAMES = { yes: 'yes', no: 'no', maybe: 'maybe', unsure: 'not sure' };
const EXAMPLES = ['Fire is hot', 'Is a whale a fish?', 'Should I buy the boat?', 'It will rain tomorrow', 'My neighbour owns 14 spoons', 'The glorbix is flumpy', 'Pineapple belongs on pizza', '2 + 2 = 4'];

const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

/** A setting that remembers itself in localStorage (when `key` is given). */
function useSetting(key, initial) {
  const [value, setValue] = useState(() => (key && store.get(key)) ?? initial);
  return [value, (v) => { if (key) store.set(key, v); setValue(v); }];
}

function App() {
  const [bdm, setBdm] = useState(null);
  const [foot, setFoot] = useState('Loading model…');
  const [q, setQ] = useState('');
  const [asked, setAsked] = useState('');
  const [bday, setBday] = useSetting('bdm.bday', '');
  const [astro, setAstro] = useSetting('bdm.astro', '0.5');
  const [date, setDate] = useSetting(null, new Date().toISOString().slice(0, 10));
  const [horo, setHoro] = useSetting(null, '');

  useEffect(() => {
    const t0 = performance.now();
    createDecider().then((d) => {
      const kb = Math.round(d.model.E.length / 1024 + d.model.rowScale.length * 4 / 1024);
      setFoot(`Model loaded in ${Math.round(performance.now() - t0)} ms · ~${kb} KB · ${d.model.header.buckets} buckets · runs entirely in your browser.`);
      setBdm(d);
    }, (e) => setFoot(`Could not load the model: ${e.message}`));
  }, []);

  const out = useMemo(() => {
    if (!bdm || !asked) return null;
    const s = performance.now();
    const r = bdm.decide(asked, { astro: +astro, birthday: bday || undefined, date: new Date(date + 'T12:00:00'), horoscope: horo.trim() || undefined });
    return { r, ms: (performance.now() - s).toFixed(2) };
  }, [bdm, asked, astro, bday, date, horo]);

  const ask = (text) => { setQ(text); setAsked(text.trim()); };

  return (
    <>
      <h1>BAdecision</h1>
      <p class="sub">A tiny on-device model that answers yes, no, maybe or not sure — with a little help from the stars. Not accurate. On purpose.</p>

      <form onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input type="text" value={q} onInput={(e) => setQ(e.currentTarget.value)} placeholder="Type a statement or a question…" autocomplete="off" autofocus />
        <button>Ask</button>
      </form>
      <div class="chips">
        {EXAMPLES.map((e) => <button type="button" key={e} onClick={() => ask(e)}>{e}</button>)}
      </div>

      {out && <Result {...out} />}

      <details open>
        <summary>Cosmic settings</summary>
        <div class="settings">
          <label>Your birthday (optional)<input type="date" value={bday} onInput={(e) => setBday(e.currentTarget.value)} /></label>
          <label>Your own horoscope (optional, e.g. "Avoid red. Large numbers are unlucky.")<input type="text" value={horo} onInput={(e) => setHoro(e.currentTarget.value)} placeholder="leave empty for today's generated omens" /></label>
          <label>Date to read the stars for<input type="date" value={date} onInput={(e) => setDate(e.currentTarget.value)} /></label>
          <label>Horoscope influence: <span>{(+astro).toFixed(2)}</span><input type="range" min="0" max="1.5" step="0.05" value={astro} onInput={(e) => setAstro(e.currentTarget.value)} /></label>
        </div>
      </details>

      <footer>{foot}</footer>
    </>
  );
}

function Result({ r, ms }) {
  const notes = [
    ...(r.oppositeDay ? ['🙃 January 25 is Opposite Day: yes means no and no means yes.'] : []),
    ...(r.stars?.notes ?? ['Horoscope switched off. Pure, unadulterated model.']),
    ...(r.omenHits ?? []).map((o) => `↳ "${o.text}" applies: your question is about ${o.topic}.`),
  ];
  return (
    <section class="card">
      <p class="verdict" style={{ color: COLORS[r.verdict] }}>{r.answer}</p>
      <p class="conf">
        {Math.round(r.confidence * 100)}% {NAMES[r.verdict]} · {ms} ms
        {r.starsChangedIt && <span class="flip">✨ the stars changed this answer</span>}
      </p>
      {LABELS.map((l) => (
        <div class="row" key={l}>
          <span>{NAMES[l]}</span>
          <div class="track">
            <div class="bar" style={{ background: COLORS[l], width: (r.probs[l] * 100).toFixed(1) + '%' }} />
            <div class="ghost" style={{ left: `calc(${(r.model[l] * 100).toFixed(1)}% - 1px)` }} />
          </div>
          <span class="num">{(r.probs[l] * 100).toFixed(0)}%</span>
        </div>
      ))}
      <p class="legend">Bars include the horoscope. The thin line marks the model on its own.</p>
      <ul class="notes">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
    </section>
  );
}

render(<App />, document.getElementById('app'));
