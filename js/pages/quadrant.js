/* Score vs time, quadrant style: every archer of one bow as a photo dot, average seconds per arrow across,
   arrow average up. The cross sits at the median of both, so each quadrant holds a kind of archer.
   Recurve and compound are never mixed (the page's bow switch picks one). Tap a dot for the numbers,
   tap team crests to light up a team. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app, cls, f1, f2, tc } from '../lib/ui.js';
import { Avatar } from '../lib/media.js';
import { CrestPick } from './common.js';

const MIN = 12; // timed arrows an archer needs to appear
const median = l => { const s = l.slice().sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const ticks = (lo, hi, step) => { const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(2)); return out; };

export function points(ctx) {
  const by = {};
  ctx.forEach(o => { if (!o.a.a || o.a.dt == null || o.a.s == null) return; const x = by[o.a.a] = by[o.a.a] || { id: o.a.a, n: 0, s: 0, t: 0 }; x.n++; x.s += o.a.s; x.t += o.a.dt; });
  return Object.values(by).filter(p => p.n >= MIN).map(p => ({ id: p.id, n: p.n, avg: p.s / p.n, at: p.t / p.n }));
}

const QUADS = [
  ['tl', 'Sharpshooters', 'quick and accurate'],
  ['tr', 'Patient precision', 'take their time, still score'],
  ['bl', 'Quick triggers', 'fast, but lose points'],
  ['br', 'Searching for rhythm', 'slower and scoring less']];

export function Quadrant({ ctx, bow }) {
  const S = app.S; const pts = points(ctx);
  const [pick, setPick] = useState(null); const [teams, setTeams] = useState([]);
  if (pts.length < 4) return html`<p class="empty">Not enough timed ${bow.toLowerCase()} arrows yet (each archer needs ${MIN}).</p>`;
  const mx = median(pts.map(p => p.at)), my = median(pts.map(p => p.avg));
  const x0 = Math.floor(Math.min(...pts.map(p => p.at)) - 1), x1 = Math.ceil(Math.max(...pts.map(p => p.at)) + 1);
  const yPad = 0.14, y0 = Math.min(...pts.map(p => p.avg)) - yPad, y1 = Math.max(...pts.map(p => p.avg)) + yPad;
  const X = v => ((v - x0) / (x1 - x0)) * 100, Y = v => (1 - (v - y0) / (y1 - y0)) * 100;
  const xt = ticks(x0, x1, x1 - x0 > 8 ? 2 : 1), yt = ticks(y0, y1, y1 - y0 > 0.8 ? 0.2 : 0.1);
  const quadOf = p => (p.avg >= my ? 't' : 'b') + (p.at <= mx ? 'l' : 'r');
  const count = Object.fromEntries(QUADS.map(([k]) => [k, pts.filter(p => quadOf(p) === k).length]));
  const sel = pick && pts.find(p => p.id === pick);
  const counts = {}; pts.forEach(p => { const t = S.A(p.id).team; counts[t] = (counts[t] || 0) + 1; });
  return html`<div class="qd-wrap">
    <${CrestPick} value=${teams} onChange=${setTeams} counts=${counts} compact />
    <div class="qd-frame">
      <span class="qd-ylab">↑ arrow average</span>
      <div class="qd" onClick=${e => { if (e.target === e.currentTarget) setPick(null); }}>
        <div class="qd-q tl" style=${`width:${X(mx)}%;height:${Y(my)}%`}></div>
        <div class="qd-q tr" style=${`left:${X(mx)}%;height:${Y(my)}%`}></div>
        <div class="qd-q bl" style=${`width:${X(mx)}%;top:${Y(my)}%`}></div>
        <div class="qd-q br" style=${`left:${X(mx)}%;top:${Y(my)}%`}></div>
        ${yt.map(v => html`<i class="qd-gy" style=${`top:${Y(v)}%`}><b>${v.toFixed(1)}</b></i>`)}
        ${xt.map((v, i) => html`<i class=${cls("qd-gx", i % 2 && "odd")} style=${`left:${X(v)}%`}><b>${v} s</b></i>`)}
        <i class="qd-mx" style=${`left:${X(mx)}%`}><b>median ${f1(mx)} s</b></i>
        <i class="qd-my" style=${`top:${Y(my)}%`}><b>median ${f2(my)}</b></i>
        ${QUADS.map(([k, t, s]) => html`<div class=${'qd-lab ' + k}><b>${t}</b><small>${s} · ${count[k]}</small></div>`)}
        ${pts.map(p => { const ar = S.A(p.id); const dim = teams.length && !teams.includes(ar.team);
          return html`<button type="button" class=${cls('qd-dot', dim && 'dim', pick === p.id && 'on')} style=${`left:${X(p.at)}%;top:${Y(p.avg)}%;--tc:${tc(ar.team)}`}
            onClick=${() => setPick(pick === p.id ? null : p.id)} aria-label=${`${ar.name}: ${f2(p.avg)} average, ${f1(p.at)} seconds per arrow`}><${Avatar} ar=${ar} size=${30} /></button>`; })}
        ${sel && (() => { const ar = S.A(sel.id); const right = X(sel.at) > 60;
          return html`<a class="qd-tip" href=${'#/player/' + sel.id} style=${`${right ? 'right' : 'left'}:${right ? 100 - X(sel.at) + 3 : X(sel.at) + 3}%;top:${Math.min(80, Math.max(20, Y(sel.avg)))}%;--tc:${tc(ar.team)}`}>
            <b>${ar.name}</b><small>${S.T(ar.team).name} · ${ar.cat}</small>
            <span><em>${f2(sel.avg)}</em> average</span><span><em>${f1(sel.at)} s</em> per arrow</span><span><em>${sel.n}</em> timed arrows</span><u>Open profile →</u></a>`; })()}
      </div>
      <span class="qd-xlab">← quicker · average seconds per arrow · slower →</span>
    </div>
    <p class="samp">${pts.length} ${bow.toLowerCase()} archers with at least ${MIN} timed arrows. The cross is drawn at the median time and median average, so about half the archers sit on each side of each line.</p>
  </div>`;
}
