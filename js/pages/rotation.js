/* Team rotation: how each team cycles its four shooters (RM, RW, CM, CW) through the 8 arrows of a set.
   A "rotation wheel" reads like the set clock: 8 slices clockwise from the top, one per arrow. The outer ring is the
   team's usual order; inner rings are the other orders it tried, thinner the rarer they are. Beside it, every
   recorded set as a little column of 8 cells, so a change of plan stands out. Recorded matches only (the broadcast
   read doesn't say who shot). */
import { html, useState } from '../../vendor/preact-htm.js';
import { TEAMS, opp } from '../lib/season.js';
import { CATS } from '../lib/rules.js';
import { app, cls, tc } from '../lib/ui.js';
import { Crest } from '../lib/media.js';

export const CAT_COL = { RM: '#2f6fe4', RW: '#5cc8ff', CM: '#f08c2e', CW: '#f5c518' };
const CAT_INK = { RM: '#fff', RW: '#04223a', CM: '#fff', CW: '#2b2000' };
const SHORT = { RM: 'Recurve men', RW: 'Recurve women', CM: 'Compound men', CW: 'Compound women' };

/* every recorded set of a team: the category and archer of each of its 8 arrows, in shooting order */
export function rotation(S, code, only) {
  const sets = [];
  S.matches.forEach(m => {
    if (m.src !== 'recorded' || (only && m !== only)) return; const k = m.teams.A === code ? 'A' : m.teams.B === code ? 'B' : null; if (!k) return;
    for (let n = 1; n <= 4; n++) {
      const l = m.arrows.filter(a => a.ph === 'S' && a.set === n && a.t === k).slice(0, 8);
      if (l.length < 8 || l.some(a => !a.a || !S.A(a.a).cat)) continue;
      sets.push({ m, n, cats: l.map(a => S.A(a.a).cat), ids: l.map(a => a.a) });
    }
  });
  const cnt = {}; sets.forEach(s => { const k = s.cats.join(' '); cnt[k] = (cnt[k] || 0) + 1; });
  const orders = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ cats: k.split(' '), n, share: n / sets.length }));
  const sig = orders[0] ? orders[0].cats : null;
  const loop = sig && sig.slice(0, 4).join() === sig.slice(4).join();
  const changes = new Set(sets.filter(s => sig && s.cats.join(' ') !== sig.join(' ')).map(s => s.m.key)).size;
  return { sets, orders, sig, loop, n: sets.length, same: orders[0] ? orders[0].n : 0, changes, cLead: sets.filter(s => s.cats[0][0] === 'C').length };
}

/* a plain-words name for an order */
function style(sig) {
  if (!sig) return '';
  const lead = sig[0][0] === 'C' ? 'Compound' : 'Recurve';
  if (sig.slice(0, 4).join() === sig.slice(4).join()) return `${lead} lead, four-arrow loop shot twice`;
  const firstHalf = new Set(sig.slice(0, 4).map(c => c[0]));
  if (firstHalf.size === 1) return `${lead} pair shoots both arrows first, then the other bow`;
  return `${lead} lead, mixed order`;
}

const polar = (r, a) => [32 + r * Math.sin(a), 32 - r * Math.cos(a)];
function slice(r0, r1, i, gap = 0.035) {
  const a0 = (i / 8) * 2 * Math.PI + gap, a1 = ((i + 1) / 8) * 2 * Math.PI - gap;
  const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
}

export function Wheel({ R, code, size = 200, label = 'same order' }) {
  const rings = R.orders.slice(0, 3); const pct = R.n ? Math.round((100 * R.same) / R.n) : 0;
  // outer ring thick; the others thinner, inside it
  const bands = [[19.5, 29], [15.2, 18.6], [11.8, 14.4]];
  return html`<svg class="rw-wheel" viewBox="0 0 64 64" width=${size} height=${size} role="img" aria-label=${`Usual order: ${R.sig ? R.sig.join(', ') : 'none'}. Same order in ${pct}% of sets.`}>
    <circle cx="32" cy="32" r="31.4" class="rw-face" style=${`--tc:${tc(code)}`} />
    ${rings.map((o, ri) => o.cats.map((c, i) => html`<path class="rw-seg" d=${slice(bands[ri][0], bands[ri][1], i, ri ? 0.05 : 0.035)} fill=${CAT_COL[c]}
      style=${`opacity:${ri ? (0.35 + 0.65 * o.share / rings[0].share).toFixed(2) : 1};animation-delay:${(ri * 0.25 + i * 0.06).toFixed(2)}s`}><title>${`Arrow ${i + 1}: ${CATS[c]}${ri ? ` (another order, ${o.n} set${o.n > 1 ? 's' : ''})` : ''}`}</title></path>`))}
    ${R.sig && R.sig.map((c, i) => { const [x, y] = polar(24.25, ((i + 0.5) / 8) * 2 * Math.PI); return html`<text class="rw-lab" x=${x.toFixed(2)} y=${(y + 1.1).toFixed(2)} fill=${CAT_INK[c]}>${c}</text>`; })}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const [x, y] = polar(30.6, ((i + 0.5) / 8) * 2 * Math.PI); return html`<text class="rw-no" x=${x.toFixed(2)} y=${(y + 0.8).toFixed(2)}>${i + 1}</text>`; })}
    <circle cx="32" cy="32" r="10.6" class="rw-hub" />
    <text class="rw-pct" x="32" y="33.2">${R.n ? pct + '%' : '–'}</text>
    <text class="rw-pcl" x="32" y="37.4">${label}</text>
  </svg>`;
}

/* every recorded set as a column of 8 cells (arrow 1 at the top); a set that broke from the usual order is lit */
function Strip({ R, code, S }) {
  const sig = R.sig ? R.sig.join(' ') : ''; let last = null;
  return html`<div class="rw-strip" role="img" aria-label=${`${R.n} recorded sets`}>${R.sets.map(s => {
    const gap = last && last !== s.m.key; last = s.m.key; const off = s.cats.join(' ') !== sig;
    return html`<a class=${cls('rw-set', gap && 'gap', off && 'off')} href=${'#/match/' + s.m.key} title=${`Day ${s.m.d} v ${S.T(opp(s.m, code)).name}, set ${s.n}: ${s.ids.map(id => S.A(id).name.split(' ')[0]).join(' → ')}`}>
      ${s.cats.map(c => html`<i style=${`background:${CAT_COL[c]}`}></i>`)}</a>`; })}</div>`;
}

export function RotationCard({ code, S = app.S, wide }) {
  const R = rotation(S, code); const T = S.T(code);
  return html`<article class=${cls('rw-card', wide && 'wide')} style=${`--tc:${tc(code)}`}>
    <header class="rw-h"><a href=${'#/team/' + code}><${Crest} code=${code} size=${40} /></a><div><b>${T.name}</b><small>${R.n ? `${R.n} recorded sets` : 'No recorded sets yet'}</small></div></header>
    ${R.n ? html`<div class="rw-body">
      <${Wheel} R=${R} code=${code} />
      <div class="rw-side">
        <p class="rw-k">Usual order</p>
        <ol class="rw-seq">${R.sig.map((c, i) => html`<li style=${`--c:${CAT_COL[c]};--ink:${CAT_INK[c]};animation-delay:${(0.3 + i * 0.05).toFixed(2)}s`}><span>${i + 1}</span><b>${c}</b></li>`)}</ol>
        <p class="rw-style">${style(R.sig)}</p>
        <div class="rw-facts">
          <span><b>${R.same}/${R.n}</b> sets in this order</span>
          <span><b>${R.orders.length}</b> order${R.orders.length > 1 ? 's' : ''} used</span>
          <span><b>${R.cLead}/${R.n}</b> sets opened by compound</span>
        </div>
      </div>
    </div>
    <p class="rw-k">Set by set <small>each column is one set, arrow 1 at the top; lit columns broke from the usual order</small></p>
    <${Strip} R=${R} code=${code} S=${S} />` : html`<p class="empty">The rotation shows once a match of this team is recorded arrow by arrow.</p>`}
  </article>`;
}

export const CatKey = () => html`<div class="rw-key">${Object.keys(CAT_COL).map(c => html`<span><i style=${`background:${CAT_COL[c]}`}></i><b>${c}</b> ${SHORT[c]}</span>`)}</div>`;

/* the league view: a headline, the key and one card per team; tap a team to bring it to the front */
export function Rotations({ S }) {
  const all = TEAMS.map(t => ({ t, R: rotation(S, t) })).filter(x => x.R.n);
  const sets = all.reduce((x, o) => x + o.R.n, 0), cl = all.reduce((x, o) => x + o.R.cLead, 0), loops = all.reduce((x, o) => x + o.R.sets.filter(s => s.cats.slice(0, 4).join() === s.cats.slice(4).join()).length, 0);
  const [pick, setPick] = useState('');
  const shown = pick ? all.filter(x => x.t === pick) : all;
  return html`<div class="rw-league">
    ${sets ? html`<div class="rw-head">
      <div><b>${Math.round((100 * cl) / sets)}%</b><span>of sets open with a compound arrow</span></div>
      <div><b>${Math.round((100 * loops) / sets)}%</b><span>of sets repeat the same four-arrow loop twice</span></div>
      <div><b>${sets}</b><span>recorded sets across ${all.length} teams</span></div>
    </div>` : ''}
    <${CatKey} />
    <div class="rw-pick" role="radiogroup" aria-label="Team">
      <button role="radio" aria-checked=${!pick} class=${cls(!pick && 'on')} onClick=${() => setPick('')}>All teams</button>
      ${all.map(x => html`<button role="radio" aria-checked=${pick === x.t} class=${cls(pick === x.t && 'on')} style=${`--tc:${tc(x.t)}`} onClick=${() => setPick(pick === x.t ? '' : x.t)}><${Crest} code=${x.t} size=${22} />${x.t}</button>`)}
    </div>
    <div class=${cls('rw-grid', pick && 'one')}>${shown.map(x => html`<${RotationCard} key=${x.t} code=${x.t} S=${S} wide=${!!pick} />`)}</div>
  </div>`;
}

/* match page: both teams' order in every set, side by side, against each team's usual season order */
export function MatchRotation({ m, S = app.S }) {
  const side = ['A', 'B'].map(k => { const code = m.teams[k]; return { k, code, R: rotation(S, code, m), season: rotation(S, code) }; });
  if (!side.some(x => x.R.n)) return '';
  const sets = [...new Set(side.flatMap(x => x.R.sets.map(s => s.n)))].sort((a, b) => a - b);
  const usual = x => (x.season.sig ? x.season.sig.join(' ') : '');
  return html`<section class="panel mrot"><h2>Rotation, set by set</h2>
    <p class="muted">The order each team sent its archers to the line across the 8 arrows. A glowing set broke from that team's usual season order.</p>
    <${CatKey} />
    <div class="mrot-top">${side.map(x => html`<div class="mrot-team" style=${`--tc:${tc(x.code)}`}>
      <a href=${'#/team/' + x.code}><${Crest} code=${x.code} size=${34} /></a>
      ${x.R.n ? html`<${Wheel} R=${x.R} code=${x.code} size=${120} label="this match" />` : ''}
      <div><b>${S.T(x.code).name}</b><small>${!x.R.n ? 'Not recorded' : x.R.orders.length === 1 ? 'Same order in every set' : `${x.R.orders.length} different orders`}${x.R.n && x.season.sig && x.R.sig.join(' ') !== usual(x) ? ' · not their usual' : ''}</small></div></div>`)}</div>
    <div class="mrot-sets">${sets.map(n => html`<div class="mrot-set"><span class="mrot-n">Set ${n}</span>
      ${side.map(x => { const st = x.R.sets.find(s => s.n === n); if (!st) return html`<div class="mrot-row empty-row" style=${`--tc:${tc(x.code)}`}><em>${x.code}</em><span class="muted small">not recorded</span></div>`;
        const off = usual(x) && st.cats.join(' ') !== usual(x);
        return html`<div class=${cls('mrot-row', off && 'off')} style=${`--tc:${tc(x.code)}`}><em>${x.code}</em>
          <ol>${st.cats.map((c, i) => html`<li style=${`--c:${CAT_COL[c]};--ink:${CAT_INK[c]};animation-delay:${(i * 0.04).toFixed(2)}s`} title=${`Arrow ${i + 1}: ${S.A(st.ids[i]).name} (${CATS[c]})`}><b>${c}</b><small>${S.A(st.ids[i]).name.split(' ')[0]}</small></li>`)}</ol>
          ${off ? html`<i class="mrot-tag">changed</i>` : ''}</div>`; })}</div>`)}</div>
  </section>`;
}
