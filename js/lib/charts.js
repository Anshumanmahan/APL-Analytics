/* Small SVG charts. Thin marks, recessive axes, a label on every series, and a hover readout on every mark. */
import { html, useState } from '../../vendor/preact-htm.js';
import { FACE } from './rules.js';

const cls = (...a) => a.filter(Boolean).join(' ');
/* charts are drawn at roughly the width they will show at, so text keeps its size on phones */
const fitW = () => { try { return Math.max(300, Math.min(560, window.innerWidth - 64)); } catch (e) { return 560; } };
const nice = (lo, hi, n = 4) => {
  const span = hi - lo || 1; const step0 = span / n; const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => k >= step0) || mag * 10;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step; const t = [];
  for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(6));
  return t;
};
function Tip({ x, y, w, children }) {
  if (x == null) return null;
  const left = x / w > 0.62;
  return html`<div class=${cls('tip', left && 'l')} style=${`left:${(x / w) * 100}%;top:${y}px`}>${children}</div>`;
}

/* horizontal bars, one per row, labelled at both ends */
export function Bars({ rows, fmt = v => v, max, min = 0, unit = '', note }) {
  const hi = max != null ? max : Math.max(...rows.map(r => r.value), 0) || 1;
  return html`<div class=${'bars' + (min > 0 ? ' dots' : '')}>${rows.map(r => {
    const w = Math.max(0, (r.value - min) / (hi - min)) * 100;
    const body = html`<span class="b-l">${r.swatch && html`<i style=${`background:${r.swatch}`}></i>`}${r.label}</span>
      <span class="b-t"><span class="b-f" style=${`width:${w}%;background:${r.color || 'var(--gold)'}`}></span></span>
      <span class="b-v">${fmt(r.value)}${unit}${r.sub ? html`<small>${r.sub}</small>` : ''}</span>`;
    return r.href ? html`<a class="b-r" href=${r.href} title=${r.title || ''}>${body}</a>` : html`<div class="b-r" title=${r.title || ''}>${body}</div>`;
  })}${note && html`<p class="cnote">${note}</p>`}</div>`;
}

/* vertical columns over a category axis */
export function Columns({ data, fmt = v => v, height = 180, color = 'var(--gold)', yMin, yMax, xLabel, yLabel, tip, width = fitW() }) {
  const [h, setH] = useState(null);
  const W = width, H = height, L = 40, B = 30, T = 14, R = 8;
  const vals = data.map(d => d.y).filter(v => v != null);
  const ticks = nice(yMin != null ? yMin : Math.min(0, ...vals), yMax != null ? yMax : Math.max(...vals));
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const sy = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const bw = (W - L - R) / data.length;
  return html`<div class="chart" onMouseLeave=${() => setH(null)}>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${yLabel || 'Column chart'}>
      ${ticks.map(t => html`<g><line x1=${L} x2=${W - R} y1=${sy(t)} y2=${sy(t)} class="grid" /><text x=${L - 6} y=${sy(t) + 4} class="ax r">${fmt(t)}</text></g>`)}
      ${data.map((d, i) => { const x = L + i * bw; if (d.y == null) return null; const y = sy(d.y), y0 = sy(Math.max(lo, 0));
        const top = Math.min(y, y0), hh = Math.max(1.5, Math.abs(y0 - y));
        // a scale that doesn't start at zero gets dots, not bars, so lengths never mislead
        if (lo > 0) return html`<g onMouseEnter=${() => setH(i)}><rect x=${x} y=${T} width=${bw} height=${H - T - B} fill="transparent" />
          <circle cx=${x + bw / 2} cy=${y} r=${h === i ? 7 : 6} fill=${d.color || color} stroke="var(--panel)" stroke-width="2" />
          <text x=${x + bw / 2} y=${y - 11} class="ax c v">${fmt(d.y)}</text>
          <text x=${x + bw / 2} y=${H - B + 16} class="ax c">${d.x}</text></g>`;
        return html`<g onMouseEnter=${() => setH(i)}>
          <rect x=${x} y=${T} width=${bw} height=${H - T - B} fill="transparent" />
          <path d=${`M${x + bw * 0.18},${top + hh} V${top + 3} Q${x + bw * 0.18},${top} ${x + bw * 0.18 + 3},${top} H${x + bw * 0.82 - 3} Q${x + bw * 0.82},${top} ${x + bw * 0.82},${top + 3} V${top + hh} Z`} fill=${d.color || color} opacity=${h == null || h === i ? 1 : 0.55} />
          <text x=${x + bw / 2} y=${H - B + 16} class="ax c">${d.x}</text>
        </g>`; })}
      ${xLabel && html`<text x=${(W + L) / 2} y=${H - 2} class="ax c t">${xLabel}</text>`}
    </svg>
    ${h != null && html`<${Tip} x=${L + h * bw + bw / 2} y=${8} w=${W}>${tip ? tip(data[h]) : html`<b>${data[h].x}</b><span>${fmt(data[h].y)}</span>`}</${Tip}>`}
  </div>`;
}

/* lines over an ordered axis; one series can be brought forward, the rest step back */
export function Lines({ series, xs, fmt = v => v, yMin, yMax, height = 220, xLabel, focus, xFmt = v => v, width = fitW() }) {
  const [h, setH] = useState(null);
  const W = width, H = height, L = 40, B = 30, T = 14, R = 44;
  const vals = series.flatMap(s => s.pts.map(p => p.y)).filter(v => v != null);
  const ticks = nice(yMin != null ? yMin : Math.min(...vals), yMax != null ? yMax : Math.max(...vals));
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const sx = i => L + (xs.length === 1 ? 0.5 : i / (xs.length - 1)) * (W - L - R);
  const sy = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const on = s => !focus || s.key === focus;
  const ordered = series.slice().sort((a, b) => (on(a) ? 1 : 0) - (on(b) ? 1 : 0));
  // end labels, nudged apart so they don't sit on top of each other
  const ends = series.map(s => { const p = [...s.pts].reverse().find(q => q.y != null); return p ? { s, y: sy(p.y) } : null; }).filter(Boolean).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  return html`<div class="chart" onMouseLeave=${() => setH(null)}>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Line chart">
      ${ticks.map(t => html`<g><line x1=${L} x2=${W - R} y1=${sy(t)} y2=${sy(t)} class="grid" /><text x=${L - 6} y=${sy(t) + 4} class="ax r">${fmt(t)}</text></g>`)}
      ${xs.map((x, i) => html`<text x=${sx(i)} y=${H - B + 16} class="ax c">${xFmt(x)}</text>`)}
      ${h != null && html`<line x1=${sx(h)} x2=${sx(h)} y1=${T} y2=${H - B} class="xh" />`}
      ${ordered.map(s => { const pts = s.pts.map((p, i) => (p.y == null ? null : [sx(i), sy(p.y)])); const d = pts.reduce((acc, p, i) => (p ? acc + (acc && pts[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1) : acc), '');
        return html`<g class=${cls('ser', !on(s) && 'dim')}><path d=${d} fill="none" stroke=${on(s) ? s.color : 'var(--dim)'} stroke-width=${on(s) && focus ? 2.6 : 2} stroke-linejoin="round" stroke-linecap="round" />
          ${pts.map(p => p && html`<circle cx=${p[0]} cy=${p[1]} r=${h != null ? 3.6 : 2.6} fill=${on(s) ? s.color : 'var(--dim)'} stroke="var(--panel)" stroke-width="1.5" />`)}</g>`; })}
      ${ends.map(e => html`<text x=${W - R + 6} y=${e.y + 4} class=${cls('endl', !on(e.s) && 'dim')} fill=${on(e.s) ? 'var(--tx)' : 'var(--dim)'}>${e.s.label}</text>`)}
      ${xs.map((x, i) => html`<rect x=${sx(i) - (W - L - R) / (2 * Math.max(1, xs.length - 1))} y=${T} width=${(W - L - R) / Math.max(1, xs.length - 1)} height=${H - T - B} fill="transparent" onMouseEnter=${() => setH(i)} />`)}
      ${xLabel && html`<text x=${(W + L - R) / 2} y=${H - 2} class="ax c t">${xLabel}</text>`}
    </svg>
    ${h != null && html`<${Tip} x=${sx(h)} y=${8} w=${W}><b>${xFmt(xs[h])}</b>${series.filter(s => s.pts[h] && s.pts[h].y != null).sort((a, b) => b.pts[h].y - a.pts[h].y).map(s => html`<span class=${cls('tr', !on(s) && 'dim')}><i style=${`background:${s.color}`}></i>${s.label}<em>${fmt(s.pts[h].y)}${s.pts[h].n != null ? html`<small> · ${s.pts[h].n}</small>` : ''}</em></span>`)}</${Tip}>`}
  </div>`;
}

/* points on two numeric axes, each labelled */
export function Scatter({ pts, xLabel, yLabel, xFmt = v => v, yFmt = v => v, height = 260 }) {
  const [h, setH] = useState(null);
  const W = fitW(), H = height, L = 46, B = 34, T = 14, R = 16;
  const xt = nice(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x))), yt = nice(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)));
  const sx = v => L + (W - L - R) * (v - xt[0]) / (xt[xt.length - 1] - xt[0] || 1), sy = v => T + (H - T - B) * (1 - (v - yt[0]) / (yt[yt.length - 1] - yt[0] || 1));
  return html`<div class="chart" onMouseLeave=${() => setH(null)}>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`${yLabel} against ${xLabel}`}>
      ${yt.map(t => html`<g><line x1=${L} x2=${W - R} y1=${sy(t)} y2=${sy(t)} class="grid" /><text x=${L - 6} y=${sy(t) + 4} class="ax r">${yFmt(t)}</text></g>`)}
      ${xt.map(t => html`<text x=${sx(t)} y=${H - B + 16} class="ax c">${xFmt(t)}</text>`)}
      ${pts.map((p, i) => html`<g onMouseEnter=${() => setH(i)}><circle cx=${sx(p.x)} cy=${sy(p.y)} r="16" fill="transparent" /><circle cx=${sx(p.x)} cy=${sy(p.y)} r=${h === i ? 8 : 6.5} fill=${p.color} stroke="var(--panel)" stroke-width="2" />
        <text x=${sx(p.x) + 10} y=${sy(p.y) + 4} class="ptl">${p.label}</text></g>`)}
      <text x=${(W + L) / 2} y=${H - 2} class="ax c t">${xLabel}</text>
      <text x=${12} y=${(H - B) / 2} class="ax c t" transform=${`rotate(-90 12 ${(H - B) / 2})`}>${yLabel}</text>
    </svg>
    ${h != null && html`<${Tip} x=${sx(pts[h].x)} y=${Math.max(4, sy(pts[h].y) - 70)} w=${W}><b>${pts[h].name || pts[h].label}</b><span>${xLabel}: ${xFmt(pts[h].x)}</span><span>${yLabel}: ${yFmt(pts[h].y)}</span></${Tip}>`}
  </div>`;
}

/* where the arrows scored: a single bar split by ring, 1px surface gaps between segments */
const RING = [['X', '#f5c518', '#1d1600'], ['10', '#e2b616', '#1d1600'], ['9', '#c99f12', '#1d1600'], ['8', '#e5484d', '#fff'], ['7', '#b83a3f', '#fff'], ['low', '#3b8fd9', '#fff']];
export function RingBar({ dist, n, compact }) {
  const tot = n || Object.values(dist).reduce((x, v) => x + v, 0) || 1;
  return html`<div class=${cls('ringbar', compact && 'compact')}>${RING.map(([k, bg, fg]) => { const v = dist[k] || 0; const p = (v / tot) * 100; if (!v) return null;
    return html`<span style=${`flex:${v};background:${bg};color:${fg}`} title=${`${k === 'low' ? '7 or lower' : k}: ${v} arrows (${p.toFixed(1)}%)`}>${p >= (compact ? 9 : 6) ? html`<b>${k === 'low' ? '≤6' : k}</b>${!compact && p >= 9 ? html`<small>${Math.round(p)}%</small>` : ''}` : ''}</span>`; })}</div>`;
}
export const RingKey = () => html`<div class="ringkey">${RING.map(([k, bg]) => html`<span><i style=${`background:${bg}`}></i>${k === 'low' ? '6 or lower' : k}</span>`)}</div>`;

/* a target face with spots */
export function Face({ spots, zoom = 0.45, size, ell }) {
  const z = zoom;
  return html`<svg class="face" viewBox=${`${-z} ${-z} ${2 * z} ${2 * z}`} style=${size ? `width:${size}px` : ''} role="img" aria-label=${`${spots.length} arrows on the target`}>
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => html`<circle r=${(11 - k) / 10} fill=${FACE[k]} stroke="rgba(0,0,0,.35)" stroke-width=${z * 0.006} />`)}
    <circle r="0.05" fill="none" stroke="rgba(0,0,0,.4)" stroke-width=${z * 0.006} />
    ${ell && html`<g><ellipse cx=${ell.cx} cy=${ell.cy} rx=${ell.ell.rx} ry=${ell.ell.ry} transform=${`rotate(${ell.ell.ang} ${ell.cx} ${ell.cy})`} fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width=${z * 0.008} stroke-dasharray=${`${z * 0.03} ${z * 0.02}`} />
      <path d=${`M${ell.cx - z * 0.05} ${ell.cy}H${ell.cx + z * 0.05}M${ell.cx} ${ell.cy - z * 0.05}V${ell.cy + z * 0.05}`} stroke="#fff" stroke-width=${z * 0.012} /></g>`}
    ${spots.map(s => html`<circle cx=${s.p[0]} cy=${s.p[1]} r=${z * 0.034} fill=${s.color || '#fff'} stroke="#fff" stroke-width=${z * 0.009}><title>${s.title || ''}</title></circle>`)}
  </svg>`;
}

/* a small "W L W" form guide */
export const Form = ({ list }) => html`<span class="form">${list.map(f => html`<a href=${'#/match/' + f.m.key} class=${f.won ? 'w' : 'l'} title=${f.title}>${f.won ? 'W' : 'L'}</a>`)}</span>`;
