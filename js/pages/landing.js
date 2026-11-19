/* Where the arrows landed: one target face per team, like the scorebook's spot plot, with recurve and compound
   kept apart (a tap switches bow). Tap a set to see just that set, tap an archer to light only their arrows.
   Spots are in face units: radius 1 is the edge of the 1 ring, each ring is 0.1 wide, y grows downwards. */
import { html, useState } from '../../vendor/preact-htm.js';
import { FACE } from '../lib/rules.js';
import { app, cls, tc, f2 } from '../lib/ui.js';
import { Crest } from '../lib/media.js';
import { label } from '../lib/season.js';
import { Seg } from './common.js';

const BOW = { R: ['RM', 'RW'], C: ['CM', 'CW'] };
const ini = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
/* how much of the face to show: recurve rings 6 to 10, compound (tighter groups) rings 8 to 10 */
const VIEW = { R: [0.52, 6], C: [0.32, 8] };
const mean = l => l.reduce((x, v) => x + v, 0) / l.length;

/* plain words for where a group sits */
function drift(cx, cy) {
  const d = Math.hypot(cx, cy); if (d < 0.025) return 'Centred';
  const v = cy > 0.015 ? 'low' : cy < -0.015 ? 'high' : '', h = cx > 0.015 ? 'right' : cx < -0.015 ? 'left' : '';
  return 'Sits ' + [v, h].filter(Boolean).join(' and ');
}

function Face({ m, t, list, pick, setPick, S, bow }) {
  const [R, ring] = VIEW[bow]; const z = R / 0.52; // dot sizes follow the zoom
  const code = m.teams[t]; const ids = [...new Set(list.map(a => a.a).filter(Boolean))];
  const shown = pick ? list.filter(a => a.a === pick) : list;
  const sp = shown.filter(a => a.p); const off = sp.filter(a => Math.hypot(a.p[0], a.p[1]) > R - 0.01);
  const cx = sp.length ? mean(sp.map(a => a.p[0])) : 0, cy = sp.length ? mean(sp.map(a => a.p[1])) : 0;
  const spread = sp.length > 1 ? mean(sp.map(a => Math.hypot(a.p[0] - cx, a.p[1] - cy))) : 0;
  const sc = shown.filter(a => !a.to && a.s != null);
  return html`<figure class="lf" style=${`--tc:${tc(code)}`}>
    <figcaption><${Crest} code=${code} size=${26} /><b>${S.T(code).name}</b></figcaption>
    <svg viewBox=${`${-R} ${-R} ${2 * R} ${2 * R}`} role="img" aria-label=${`${S.T(code).name}: ${sp.length} arrow spots`}>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => html`<circle r=${(11 - k) / 10} fill=${FACE[k]} stroke="rgba(0,0,0,.35)" stroke-width="0.003" />`)}
      <circle r="0.05" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="0.003" />
      <path d="M-0.012 0H0.012M0 -0.012V0.012" stroke="rgba(0,0,0,.45)" stroke-width="0.003" />
      ${sp.length > 2 ? html`<circle class="lf-grp" cx=${cx} cy=${cy} r=${Math.max(0.01, spread)} />` : ''}
      ${sp.map((a, i) => { const ar = a.a ? S.A(a.a) : null; const [x, y] = Math.hypot(a.p[0], a.p[1]) > R - 0.02 ? (k => [a.p[0] * k, a.p[1] * k])((R - 0.025 * z) / Math.hypot(a.p[0], a.p[1])) : a.p;
        return html`<g class="lf-dot" style=${`animation-delay:${Math.min(1.2, i * 0.012).toFixed(3)}s`}><title>${ar ? ar.name : 'Archer not recorded'} · set ${a.set} · ${label(a)}</title>
          <circle cx=${x} cy=${y} r=${0.022 * z} fill=${tc(code)} stroke="#fff" stroke-width=${0.005 * z} />
          <text x=${x} y=${y + 0.0075 * z} font-size=${0.021 * z} letter-spacing="0" style="letter-spacing:0" text-anchor="middle" fill="#fff" font-weight="700">${ar ? ini(ar.name) : '?'}</text></g>`; })}
      ${sp.length > 2 ? html`<g class="lf-c"><path d=${`M${cx - 0.03 * z} ${cy}H${cx + 0.03 * z}M${cx} ${cy - 0.03 * z}V${cy + 0.03 * z}`} /></g>` : ''}
    </svg>
    <div class="lf-who" role="group" aria-label="Archers">
      <button type="button" class=${cls(!pick && 'on')} aria-pressed=${!pick} onClick=${() => setPick('')}>Both</button>
      ${ids.map(id => { const ar = S.A(id); return html`<button type="button" class=${cls(pick === id && 'on')} aria-pressed=${pick === id} onClick=${() => setPick(pick === id ? '' : id)}><i>${ini(ar.name)}</i>${ar.name.split(' ')[0]} <small>${ar.cat}</small></button>`; })}
    </div>
    <dl class="lf-k">
      <div><dt>Average</dt><dd>${sc.length ? f2(mean(sc.map(a => a.s))) : '–'}</dd></div>
      <div><dt>10s</dt><dd>${sc.filter(a => a.s === 10).length}<small>/${sc.length}</small></dd></div>
      <div><dt>Group</dt><dd class="lf-dr">${sp.length > 2 ? drift(cx, cy) : '–'}</dd></div>
    </dl>
    ${off.length ? html`<p class="lf-off">${off.length} arrow${off.length > 1 ? 's' : ''} outside the ${ring} ring, drawn on the edge.</p>` : ''}
  </figure>`;
}

export function Landing({ m, S = app.S }) {
  const [bow, setBow] = useState('R'); const [set, setSet] = useState(0); const [pick, setPick] = useState({ A: '', B: '' });
  const of = (t, b) => m.arrows.filter(a => a.ph === 'S' && a.t === t && a.a && BOW[b].includes(S.A(a.a).cat) && (!set || a.set === set));
  if (!m.arrows.some(a => a.ph === 'S' && a.p && a.a)) return '';
  const sets = [...new Set(m.arrows.filter(a => a.ph === 'S').map(a => a.set))].sort();
  const choose = v => { setBow(v); setPick({ A: '', B: '' }); };
  return html`<section class="panel lfp"><h2>Where the arrows landed</h2>
    <p class="muted">Every recorded arrow on the target, one face per team. Recurve and compound are shown apart. The ring marks how tight the group is and the cross is its centre.</p>
    <div class="lf-ctl">
      <${Seg} label="Bow" value=${bow} onPick=${choose} opts=${[['R', 'Recurve'], ['C', 'Compound']]} />
      <${Seg} small label="Set" value=${set} onPick=${v => { setSet(v); setPick({ A: '', B: '' }); }} opts=${[[0, 'All sets'], ...sets.map(n => [n, 'Set ' + n])]} />
    </div>
    <div class="lf-pair">${['A', 'B'].map(t => html`<${Face} m=${m} t=${t} S=${S} list=${of(t, bow)} bow=${bow} pick=${pick[t]} setPick=${id => setPick(Object.assign({}, pick, { [t]: id }))} />`)}</div>
    <p class="muted small">Rings ${VIEW[bow][1]} to 10 shown${bow === "C" ? " (zoomed in further than recurve, because compound groups are tighter)" : ""}; the small inner circle is the X. Dots carry each archer's initials. Tap a name to show only their arrows.</p>
  </section>`;
}
