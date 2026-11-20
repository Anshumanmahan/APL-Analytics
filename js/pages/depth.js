/* Squad depth: how close each team's archers are inside every category, for easy bench rotation.
   One lane per team and category (of the chosen bow), every archer a dot at their arrow average,
   the line between the best and the worst shows the spread. Recurve and compound are never on one axis. */
import { html, useState } from '../../vendor/preact-htm.js';
import { archers } from '../lib/season.js';
import { CATS } from '../lib/rules.js';
import { app, f2, tc, Team } from '../lib/ui.js';
import { CAT_COL } from './rotation.js';
import { Seg, Table, FGroup, Steps } from './common.js';

export function depthRows(S, cats, min) {
  const all = archers(S);
  const rows = [];
  S.roster.teams.forEach(t => cats.forEach(c => {
    const l = all.filter(a => a.ar.team === t.short && a.ar.cat === c && a.n >= min).sort((x, y) => y.avg - x.avg);
    rows.push({ t: t.short, c, l, top: l[0] ? l[0].avg : null, gap: l.length > 1 ? l[0].avg - l[1].avg : null, spread: l.length > 1 ? l[0].avg - l[l.length - 1].avg : null, used: l.length });
  }));
  return rows;
}

export function SquadDepth({ bow }) {
  const S = app.S; const b = bow[0];
  const [show, setShow] = useState(''); const [min, setMin] = useState('8'); const [hov, setHov] = useState(null);
  const cats = show ? [b + show] : [b + 'M', b + 'W'];
  const rows = depthRows(S, cats, +min);
  const pts = rows.flatMap(r => r.l.map(a => a.avg));
  if (!pts.length) return html`<p class="empty">Not enough recorded arrows yet.</p>`;
  const lo = Math.floor((Math.min(...pts) - 0.05) * 10) / 10, hi = Math.ceil((Math.max(...pts) + 0.05) * 10) / 10;
  const teams = S.roster.teams.map(t => t.short);
  const narrow = (() => { try { return window.innerWidth < 640; } catch (e) { return false; } })();
  // on phones the drawing is narrower so labels stay readable instead of being scaled down
  const W = narrow ? 400 : 720, H = narrow ? 330 : 300, L = narrow ? 34 : 44, R = 6, T = 14, B = 46;
  const gw = (W - L - R) / teams.length, lw = gw / (cats.length + 1);
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const ticks = []; const step = hi - lo > 1.2 ? 0.5 : hi - lo > 0.6 ? 0.2 : 0.1;
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(2));
  return html`
    <div class="fbar">
      <${FGroup} label="Category"><${Seg} small label="Category" value=${show} onPick=${setShow} opts=${[['', 'Men and women'], ['M', CATS[b + 'M']], ['W', CATS[b + 'W']]]} /></${FGroup}>
      <${FGroup} label="Archers with at least"><${Steps} label="Minimum arrows" values=${['4', '8', '16']} value=${min} onPick=${setMin} unit=" arrows" /></${FGroup}>
    </div>
    <div class="depth"><svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Squad depth, ${bow.toLowerCase()}`}>
      ${ticks.map(v => html`<g><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} class="dp-grid" /><text x=${L - 6} y=${y(v) + 4} class="dp-ax" text-anchor="end">${v.toFixed(step < 0.2 ? 1 : 1)}</text></g>`)}
      ${teams.map((t, ti) => html`<g>
        <rect x=${L + ti * gw + 2} y=${T} width=${gw - 4} height=${H - T - B} rx="8" class="dp-band" style=${`--tc:${tc(t)}`} />
        <text x=${L + ti * gw + gw / 2} y=${H - B + 18} text-anchor="middle" class="dp-team" style=${`fill:${tc(t)}`}>${t}</text>
        ${cats.map((c, ci) => { const r = rows.find(o => o.t === t && o.c === c); const x = L + ti * gw + lw * (ci + 1);
          return html`<g>
            ${r.l.length > 1 ? html`<line x1=${x} x2=${x} y1=${y(r.l[0].avg)} y2=${y(r.l[r.l.length - 1].avg)} class="dp-span" style=${`stroke:${CAT_COL[c]}`} />` : ''}
            ${r.l.map((a, i) => html`<circle cx=${x} cy=${y(a.avg)} r=${(i === 0 ? 6.5 : 5) * (narrow ? 0.85 : 1)} class=${'dp-dot' + (i === 0 ? ' top' : '')} style=${`fill:${CAT_COL[c]}`}
              onMouseEnter=${() => setHov({ a, x, yy: y(a.avg), c })} onMouseLeave=${() => setHov(null)} onClick=${() => setHov({ a, x, yy: y(a.avg), c })}><title>${a.ar.name}: ${f2(a.avg)} over ${a.n} arrows</title></circle>`)}
            ${r.gap != null ? html`<text x=${narrow ? L + ti * gw + gw / 2 : x} y=${H - B + 31 + (narrow ? ci * 12 : 0)} text-anchor="middle" class="dp-gap" style=${narrow ? `fill:${CAT_COL[c]}` : ''}>${r.gap.toFixed(2)}</text>` : ''}
          </g>`; })}
      </g>`)}
      ${hov ? html`<g class="dp-tip"><rect x=${Math.min(W - 190, Math.max(L, hov.x - 90))} y=${Math.max(2, hov.yy - 40)} width="180" height="28" rx="6" /><text x=${Math.min(W - 190, Math.max(L, hov.x - 90)) + 90} y=${Math.max(2, hov.yy - 40) + 18} text-anchor="middle">${hov.a.ar.name.split(' ')[0]} · ${f2(hov.a.avg)} · ${hov.a.n} arrows</text></g>` : ''}
    </svg></div>
    <div class="dp-key">${cats.map(c => html`<span><i style=${`background:${CAT_COL[c]}`}></i>${CATS[c]}</span>`)}<span class="muted">Big dot: the team's best. Number under each lane: the gap from the best to the next archer (smaller means an easy swap).</span></div>
    <${Table} sort="gap" dir=${1} rows=${rows.filter(r => r.gap != null)} cols=${[
      ['t', 'Team', r => html`<${Team} code=${r.t} />`], ['c', 'Category', r => CATS[r.c], { sort: r => r.c }], ['used', 'Archers', null, { num: 1 }],
      ['top', 'Best avg', r => f2(r.top), { num: 1 }], ['gap', 'Gap to next', r => f2(r.gap), { num: 1 }], ['spread', 'Best to worst', r => f2(r.spread), { num: 1, sm: 0 }]]} />`;
}
