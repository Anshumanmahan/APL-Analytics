/* Set win chance views: the per-set chart on match pages (after every arrow), and the league map of
   "lead after k arrows each → chance of taking the set" on the Analytics page. Numbers from js/lib/winprob.js. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app, cls, tc } from '../lib/ui.js';
import { setChance, leadTable, realLeads, calibration, K } from '../lib/winprob.js';

const pc = v => Math.round(100 * v) + '%';
const first = (S, id) => (id ? S.A(id).name.split(' ')[0] : '');

/* one set: stacked bands after each arrow. Team A's chance from the bottom up (so its line rises as A gets likelier,
   like the race chart), a level set in the middle, team B's chance at the top. */
export function SetChance({ m, n }) {
  const S = app.S; const C = setChance(S, m, n);
  const [pick, setPick] = useState(null);
  if (!C) return '';
  const { steps, swing } = C; const N = steps.length - 1;
  const W = 600, H = 150, L = 34, R = 12, T = 14, B = 26;
  const x = i => L + ((W - L - R) * i) / N, y = v => T + (H - T - B) * (1 - v);
  const cA = tc(m.teams.A), cB = tc(m.teams.B);
  const top = steps.map(s => s.p.A), mid = steps.map(s => s.p.A + s.p.T);
  const band = (u, d) => 'M' + steps.map((_, i) => `${x(i).toFixed(1)} ${y(u[i]).toFixed(1)}`).join('L') + 'L' + steps.map((_, i) => `${x(N - i).toFixed(1)} ${y(d[N - i]).toFixed(1)}`).join('L') + 'Z';
  const zero = steps.map(() => 0), one = steps.map(() => 1);
  const sel = steps[pick == null ? (swing ? swing.step.i : N) : pick];
  const who = s => (s.a ? `${m.teams[s.a.t]}${s.a.a ? ' · ' + first(S, s.a.a) : ''} shot ${s.a.s == null ? '–' : s.a.s}` : 'Before the first arrow');
  const sw = swing && swing.step;
  return html`<div class="wc">
    <div class="wc-read" aria-live="polite">
      <span class="wc-at">${sel.i ? `After arrow ${sel.i} of ${N}` : 'Start of the set'}<small>${who(sel)}${sel.i ? ` · ${sel.tot.A}–${sel.tot.B}` : ''}</small></span>
      <span class="wc-p" style=${`--tc:${cA}`}><b>${pc(sel.p.A)}</b>${m.teams.A}</span>
      <span class="wc-p tie"><b>${pc(sel.p.T)}</b>level</span>
      <span class="wc-p" style=${`--tc:${cB}`}><b>${pc(sel.p.B)}</b>${m.teams.B}</span>
    </div>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Set ${n} win chance after each arrow: ${m.teams.A} started at ${pc(steps[0].p.A)}, ended ${pc(steps[N].p.A)}`}>
      <path d=${band(zero, top)} style=${`fill:${cA}`} class="wc-band" />
      <path d=${band(top, mid)} class="wc-band tie" />
      <path d=${band(mid, one)} style=${`fill:${cB}`} class="wc-band" />
      <line x1=${L} x2=${W - R} y1=${y(0.5)} y2=${y(0.5)} class="wc-half" />
      <path d=${'M' + steps.map((_, i) => `${x(i).toFixed(1)} ${y(top[i]).toFixed(1)}`).join('L')} class="wc-edge" style=${`stroke:${cA}`} />
      <path d=${'M' + steps.map((_, i) => `${x(i).toFixed(1)} ${y(mid[i]).toFixed(1)}`).join('L')} class="wc-edge" style=${`stroke:${cB}`} />
      <text x=${L - 6} y=${y(1) + 4} class="wc-y">100</text><text x=${L - 6} y=${y(0.5) + 3.5} class="wc-y">50</text><text x=${L - 6} y=${y(0)} class="wc-y">0</text>
      <text x=${L + 6} y=${y(0) - 6} class="wc-lab" style=${`fill:${cA}`}>▲ ${m.teams.A} takes it</text>
      <text x=${L + 6} y=${y(1) + 12} class="wc-lab" style=${`fill:${cB}`}>▼ ${m.teams.B} takes it</text>
      ${sw && html`<circle cx=${x(sw.i)} cy=${y(sw.a.t === 'A' ? top[sw.i] : mid[sw.i])} r="5.5" class="wc-swing" />`}
      <line x1=${x(sel.i)} x2=${x(sel.i)} y1=${T} y2=${H - B} class="wc-cur" />
      ${steps.slice(1).map(s => html`<text x=${x(s.i)} y=${H - 9} class=${cls('wc-s', s.a.s === 10 && 'ten')} style=${`fill:${s.a.t === 'A' ? cA : cB}`}>${s.a.s == null ? '·' : s.a.s}</text>`)}
      ${steps.map(s => html`<rect x=${x(s.i) - (W - L - R) / N / 2} y="0" width=${(W - L - R) / N} height=${H} class="wc-hit" onClick=${() => setPick(s.i)} onMouseEnter=${() => setPick(s.i)}><title>${`${s.i ? 'After arrow ' + s.i : 'Start'}: ${m.teams.A} ${pc(s.p.A)}, level ${pc(s.p.T)}, ${m.teams.B} ${pc(s.p.B)}`}</title></rect>`)}
    </svg>
    <p class="wc-cap">${sw ? html`Biggest swing: arrow ${sw.i}, <b>${sw.a.a ? S.A(sw.a.a).name : m.teams[sw.a.t]}</b>'s ${sw.a.s} moved ${m.teams[sw.a.t]} from ${pc(swing.from)} to ${pc(swing.to)} (a level set counted as half). ` : ''}<span class="muted">Tap the chart to read any arrow. The numbers along the bottom are each arrow's score, in shooting order.</span></p>
  </div>`;
}

/* league map: rows are the lead, columns how many arrows each team has shot */
const LEADS = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6], KS = [1, 2, 3, 4, 5, 6, 7];
export function LeadMap({ S }) {
  const T = leadTable(S, LEADS, KS); const [sel, setSel] = useState([3, 2]);
  if (!T) return html`<p class="empty">Needs recorded sets to learn the usual shooting order.</p>`;
  const real = realLeads(S); const cal = calibration(S);
  const obs = (k, g) => { const l = real.filter(o => o.k === k && o.lead === g); return { n: l.length, w: l.filter(o => o.r === 1).length, t: l.filter(o => o.r === 0.5).length }; };
  const [ki, li] = sel; const k = KS[ki], g = LEADS[li]; const o = obs(k, g); const v = T[ki][li];
  return html`<div class="lm">
    <p class="lm-read" aria-live="polite">${g === 0 ? 'Level' : g > 0 ? `Ahead by ${g}` : `Behind by ${-g}`} after ${k} arrow${k > 1 ? 's' : ''} each: the model gives <b>${pc(v)}</b> to take the set${o.n ? html`. In real sets it happened ${o.n} time${o.n > 1 ? 's' : ''}: <b>${o.w} won</b>${o.t ? `, ${o.t} tied` : ''}, ${o.n - o.w - o.t} lost` : '. No real set has been in exactly this spot yet'}.</p>
    <div class="lm-wrap"><div class="lm-grid" style=${`--k:${KS.length}`} role="grid" aria-label="Chance of taking the set by lead and arrows shot">
      <span class="lm-corner">lead</span>${KS.map(k => html`<span class="lm-k">${k}</span>`)}
      ${LEADS.map((g, li2) => html`<span class=${cls('lm-g', g === 0 && 'zero')}>${g > 0 ? '+' + g : g}</span>${KS.map((k, ki2) => { const v = T[ki2][li2]; const ob = obs(k, g);
        return html`<button type="button" role="gridcell" class=${cls('lm-c', ki2 === ki && li2 === li && 'on', ob.n && 'seen')} style=${`--v:${v.toFixed(3)}`} onClick=${() => setSel([ki2, li2])}
          aria-label=${`Lead ${g} after ${k} arrows each: ${pc(v)}${ob.n ? `, real ${ob.n} sets` : ''}`}>${Math.round(100 * v)}</button>`; })}`)}
    </div><span class="lm-x">arrows shot by each team →</span></div>
    <div class="lm-cal"><b>How often it's right</b>${cal.bins.filter(b => b.n).map(b => html`<span><small>said ${Math.round(100 * b.lo)}–${Math.round(100 * b.hi)}%</small><em>${pc(b.r)}</em><small>${b.n} moments</small></span>`)}</div>
    <p class="samp">Each cell: chance of taking the set (a level set counts as half) for a team that leads by that many points after that many arrows each, against an even opponent, with the remaining arrows shot by the categories teams usually send at those positions. Every arrow is modelled from its own category, so recurve and compound are never mixed. A dot marks spots seen in real sets (tap for the real count). The bottom row checks the per-set chances on match pages against what happened, over ${cal.n} moments in real sets.</p>
  </div>`;
}
