/* Shared bits for every page. */
import { html } from '../../vendor/preact-htm.js';
import { COLOR, dayName } from './season.js';
import { FACE, FACE_TXT } from './rules.js';

export const app = { S: null, render: () => { } };
export const cls = (...a) => a.filter(Boolean).join(' ');
export const f1 = n => (n == null || isNaN(n) ? '–' : (+n).toFixed(1));
export const f2 = n => (n == null || isNaN(n) ? '–' : (+n).toFixed(2));
export const pct = (n, d = 0) => (n == null || isNaN(n) ? '–' : (n * 100).toFixed(d) + '%');
export const plural = (n, w, p) => `${n} ${n === 1 ? w : p || w + 's'}`;
export const tc = code => COLOR[code] || '#6c7a90';

export const Team = ({ code, full, link = true, adapt }) => {
  const S = app.S; const t = S.T(code);
  // adapt: full name on wide screens, the short code on phones
  const body = html`<i style=${`background:${tc(code)}`}></i>${adapt ? html`<span class="nm-f">${t.name}</span><span class="nm-s">${code}</span>` : full ? t.name : code}`;
  return link ? html`<a class="tm" href=${'#/team/' + code} title=${t.name}>${body}</a>` : html`<span class="tm" title=${t.name}>${body}</span>`;
};

export const chipStyle = a => {
  if (a.ph !== 'S') return a.h ? 'background:#f5c518;color:#1d1600' : 'background:#3a4352;color:#e8ecf2';
  if (a.to || !a.s) return 'background:#3a4352;color:#e8ecf2';
  return `background:${FACE[a.s]};color:${FACE_TXT[a.s]}`;
};

export const Src = ({ m }) => (m.src === 'recorded'
  ? html`<span class="src rec" title="Every arrow checked by hand, with the archer and where it landed">Recorded</span>`
  : m.src === 'broadcast' ? html`<span class="src tv" title="Scores, order and clock read from the TV scoreboard; no archers yet">Auto-read</span>`
    : html`<span class="src none">No arrows</span>`);

/* one result line: "PY 2 – 6 KK" with the winner in bold */
export function Result({ m, small }) {
  const a = m.teams.A, b = m.teams.B; const sp = m.sp;
  return html`<a class=${cls('res', small && 'sm')} href=${'#/match/' + m.key}>
    <span class=${cls('rt', m.win === a && 'w')}><${Team} code=${a} link=${false} /></span>
    <span class="rs">${sp ? html`<b class=${m.win === a ? 'w' : ''}>${sp.A}</b><i>–</i><b class=${m.win === b ? 'w' : ''}>${sp.B}</b>` : html`<i>${m.win === a ? '◀ won' : 'won ▶'}</i>`}${m.so ? html`<em title="Decided in a shoot-off">SO</em>` : ''}</span>
    <span class=${cls('rt r', m.win === b && 'w')}><${Team} code=${b} link=${false} /></span>
  </a>`;
}
export const matchTitle = m => `${m.stage === 'League' ? 'Day ' + m.d + ' · match ' + m.s : m.stage} · ${dayName(m.d)}`;

export function Tiles({ items }) {
  return html`<div class="tiles">${items.map(([v, l, sub]) => html`<div class="tile"><b>${v}</b><span>${l}</span>${sub && html`<small>${sub}</small>`}</div>`)}</div>`;
}
export function Seg({ value, options, onChange, label }) {
  return html`<div class="seg" role="group" aria-label=${label || ''}>${options.map(([k, l]) => html`<button class=${value === k ? 'on' : ''} aria-pressed=${value === k} onClick=${() => onChange(k)}>${l}</button>`)}</div>`;
}
export const Empty = ({ children }) => html`<p class="empty">${children}</p>`;
