/* Analytics page header: two bow cards (recurve or compound, never mixed) and a strip of section tiles with icons.
   The chosen bow sets the page accent (--bc) that the panels below pick up. */
import { html, useEffect, useRef } from '../../vendor/preact-htm.js';
import { cls, f2 } from '../lib/ui.js';
import * as I from '../lib/insights.js';
import { summarize } from '../lib/season.js';

export const BOWC = { Recurve: { c: '#3d7ff0', c2: '#5cc8ff', k: 'R' }, Compound: { c: '#f08c2e', c2: '#f5c518', k: 'C' } };

const ICON = {
  leaderboard: html`<path d="M3 20h18M5 20v-6h4v6M10 20V8h4v12M15 20v-9h4v9" /><path d="M12 3.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 5.3l2-.3z" class="fill" />`,
  positions: html`${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`<circle cx=${4 + (i % 4) * 5.3} cy=${i < 4 ? 8 : 16} r="1.9" class=${i === 2 ? 'fill' : ''} />`)}`,
  time: html`<circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.2M12 13.5l3 2M10 3h4M12 3v3M18.5 6.5l1.4-1.4" />`,
  pressure: html`<path d="M4 17a8 8 0 1 1 16 0" /><path d="M12 17l4.5-5" /><circle cx="12" cy="17" r="1.6" class="fill" /><path d="M6.3 12.3l1 .7M12 9v1.2M17.7 12.3l-1 .7" />`,
  comebacks: html`<path d="M4 18c3 0 4-9 8-9s3.5 5 8-6" /><path d="M16.5 3H20v3.5" />`,
  strategy: html`<circle cx="12" cy="12" r="8" /><path d="M12 4v8l5.7 5.7M12 12H4" /><circle cx="12" cy="12" r="2.4" class="fill" />`,
  events: html`<rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.6" class="fill" />`
};
export const SECS = [
  ['leaderboard', 'Leaderboard', 'Who scores most'], ['positions', 'Positions', 'Arrow 1 to 8'], ['time', 'Time', 'Clock and pace'],
  ['pressure', 'Pressure', 'Clutch arrows'], ['comebacks', 'Comebacks', 'Sets and shoot-offs'], ['strategy', 'Strategy', 'Rotations and subs'], ['events', 'Event & day', 'Day by day']
];
const Icon = ({ k }) => html`<svg class="an-ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

/* a recurve bow (curved limbs, tips flicking back) and a compound bow (short limbs, cams) */
const BowArt = ({ k }) => k === 'R'
  ? html`<svg class="an-bow" viewBox="0 0 40 64" aria-hidden="true"><path d="M27 4c-6 2-3 8-9 14-4 4-5 9-5 14s1 10 5 14c6 6 3 12 9 14" class="limb" /><path d="M27 4L27 60" class="str" /><path d="M12 32h22M30 29l4 3-4 3" class="arr" /><rect x="10.5" y="27" width="5" height="10" rx="2" class="grip" /></svg>`
  : html`<svg class="an-bow" viewBox="0 0 40 64" aria-hidden="true"><path d="M23 9c-5 4-9 10-9 23s4 19 9 23" class="limb" /><circle cx="23" cy="8" r="3.4" class="cam" /><circle cx="23" cy="56" r="3.4" class="cam" /><path d="M26 8L26 56M20 9L26 32 20 55" class="str" /><path d="M12 32h22M30 29l4 3-4 3" class="arr" /><rect x="11" y="26" width="5" height="12" rx="2" class="grip" /></svg>`;

let memo = { full: null, v: null };
function bowStats(full) {
  if (memo.full === full) return memo.v;
  const v = {}; I.BOWS.forEach(([b]) => { const l = I.ofBow(full, b); const s = summarize(l); v[b] = { avg: s.avg, n: s.n, ar: new Set(l.map(o => o.a.a).filter(Boolean)).size }; });
  memo = { full, v }; return v;
}

export function AnHead({ sec, bow, full }) {
  const st = bowStats(full); const cur = SECS.find(s => s[0] === sec) || SECS[0];
  // on phones the topics scroll sideways: keep the chosen one in view
  const nav = useRef(null);
  useEffect(() => { const n = nav.current, a = n && n.querySelector('.on'); if (a && n.scrollWidth > n.clientWidth) n.scrollLeft = a.offsetLeft - (n.clientWidth - a.offsetWidth) / 2; }, [sec]);
  return html`<header class="an-head">
    <div class="an-top">
      <div class="an-title"><p class="an-kick">Season 2 · analytics</p><h1 class="pt">Analytics</h1>
        <p class="an-sub">Pick a bow, then a topic. Recurve and compound are never mixed: compound scores run higher.</p></div>
      <div class="an-bows" role="radiogroup" aria-label="Bow">${I.BOWS.map(([b]) => { const C = BOWC[b]; const on = bow === b; const s = st[b];
        return html`<a role="radio" aria-checked=${on} class=${cls('an-bowc', on && 'on')} href=${'#/analytics/' + sec + '/' + C.k} style=${`--c:${C.c};--c2:${C.c2}`}>
          <${BowArt} k=${C.k} /><span class="an-bt"><b>${b}</b><small title=${`${s.n} recorded arrows`}>${s.ar} archers</small></span>
          <span class="an-bv"><em>${s.avg != null ? f2(s.avg) : '–'}</em><small>league avg</small></span>${on ? html`<i class="an-tick">✓</i>` : ''}</a>`; })}</div>
    </div>
    <nav class="an-secs" ref=${nav} aria-label="Topics">${SECS.map(([k, l, d]) => html`<a class=${cls('an-sec', sec === k && 'on')} href=${'#/analytics/' + k + '/' + BOWC[bow].k} aria-current=${sec === k ? 'page' : null}>
      <${Icon} k=${k} /><span><b>${l}</b><small>${d}</small></span></a>`)}</nav>
    <div class="an-now"><${Icon} k=${cur[0]} /><b>${cur[1]}</b><span>${cur[2]}</span><i class="an-chip" style=${`--c:${BOWC[bow].c}`}>${bow}</i></div>
  </header>`;
}
