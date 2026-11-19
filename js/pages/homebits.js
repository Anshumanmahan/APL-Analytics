/* Home: a points table of team rows and a playoff bracket (Qualifier 1 and Eliminator 1, then Eliminator 2, then the Final). */
import { html } from '../../vendor/preact-htm.js';
import { dayName } from '../lib/season.js';
import { cls, tc } from '../lib/ui.js';
import { Crest } from '../lib/media.js';
import { Form } from '../lib/charts.js';

const opp = (m, t) => (m.teams.A === t ? m.teams.B : m.teams.A);
const done = m => m && (m.win === m.teams.A || m.win === m.teams.B);

/* ---------- points table ---------- */
export function PointsTable({ S, st, fs }) {
  const fin = Object.fromEntries(fs.map(o => [o.t, o]));
  const top = Math.max(1, ...st.map(o => o.Pts));
  const anyPO = S.matches.some(m => m.stage !== 'League');
  const row = (o, i) => { const f = fin[o.t]; const d = o.SF - o.SA; const tier = f && f.tier;
    return html`<a class=${cls('pt-row', i < 4 && 'q', tier === 0 && 'ch')} href=${'#/team/' + o.t} style=${`--tc:${tc(o.t)}`}>
      <span class="pt-rk">${i + 1}</span>
      <span class="pt-tm"><${Crest} code=${o.t} size=${34} /><span class="pt-nm"><b>${S.T(o.t).name}</b>
        <small>${anyPO && f ? html`${tier === 0 ? '🏆 ' : ''}${f.stage}` : i < 4 ? 'Playoff place' : 'Outside the top 4'}</small>
        <i class="pt-bar"><i style=${`width:${(o.Pts / top) * 100}%`}></i></i></span></span>
      <span class="pt-n pt-p">${o.P}</span>
      <span class="pt-n pt-wl"><b class="w">${o.W}</b><i>–</i><b class="l">${o.L}</b></span>
      <span class=${cls('pt-n pt-sd', d > 0 ? 'pos' : d < 0 ? 'neg' : '')}>${d > 0 ? '+' : ''}${d}</span>
      <span class="pt-pts"><b>${o.Pts}</b><small>pts</small></span>
      <span class="pt-fm"><${Form} list=${o.form.slice(-5)} /></span>
    </a>`; };
  return html`<div class="pt">
    <div class="pt-hd"><span>#</span><span>Team</span><span class="pt-n pt-p">P</span><span class="pt-n pt-wl">W–L</span><span class="pt-n pt-sd">Sets ±</span><span class="pt-pts">Pts</span><span class="pt-fm">Last 5</span></div>
    ${st.slice(0, 4).map(row)}
    <div class="pt-cut"><span>Top 4 reach the playoffs</span></div>
    ${st.slice(4).map((o, i) => row(o, i + 4))}
  </div>`;
}

/* ---------- playoff bracket ---------- */
function Tie({ S, m, label, route, big, k }) {
  if (!m) return html`<div class=${cls('br-m tbd', k)}><div class="br-h"><b>${label}</b><small>To be decided</small></div>
    <div class="br-t"><span class="br-nm">TBD</span></div><div class="br-t"><span class="br-nm">TBD</span></div><p class="br-r">${route}</p></div>`;
  const side = k => { const t = m.teams[k]; const won = m.win === t; const lost = done(m) && !won;
    return html`<div class=${cls('br-t', won && 'w', lost && 'l')} style=${`--tc:${tc(t)}`}>
      <${Crest} code=${t} size=${big ? 40 : 30} /><span class="br-nm"><b>${S.T(t).name}</b><small>${t}</small></span>
      <span class="br-s">${m.sp ? m.sp[k] : won ? 'W' : ''}</span></div>`; };
  return html`<a class=${cls('br-m', big && 'fin', k)} href=${'#/match/' + m.key}>
    <div class="br-h"><b>${label}</b><small>${dayName(m.d)}${m.so ? html` · <em>shoot-off</em>` : ''}</small></div>
    ${side('A')}${side('B')}<p class="br-r">${route}</p></a>`;
}

export function Bracket({ S }) {
  const po = S.matches.filter(m => m.stage !== 'League');
  const g = s => po.find(m => m.stage === s);
  const q1 = g('Qualifier 1'), e1 = g('Eliminator 1'), e2 = g('Eliminator 2'), fn = g('Final');
  const champ = done(fn) ? fn.win : null;
  // the lines between the rounds: gold for winners, dashed for Qualifier 1's loser getting a second chance
  const L1 = html`<svg class="br-ln" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 25H40" class="wn" /><path d="M0 25H14Q20 25 20 31V69Q20 75 26 75H40" class="ls" /><path d="M0 75H40" class="wn" /></svg>`;
  const L2 = html`<svg class="br-ln" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 25H14Q20 25 20 31V44Q20 50 26 50H40" class="wn" /><path d="M0 75H14Q20 75 20 69V56Q20 50 26 50H40" class="wn" /></svg>`;
  return html`<div class="br">
    <div class="br-col c1">
      <div class="br-step"><span>Round 1</span></div>
      <${Tie} S=${S} m=${q1} k="q1" label="Qualifier 1" route="1st v 2nd. Winner goes straight to the Final, loser gets a second chance." />
      <${Tie} S=${S} m=${e1} k="e1" label="Eliminator 1" route="3rd v 4th. Loser is out." />
    </div>
    <div class="br-gap">${L1}</div>
    <div class="br-col c2">
      <div class="br-step"><span>Round 2</span></div>
      <div class="br-pass"><span>${q1 && done(q1) ? html`<b style=${`color:${tc(q1.win)}`}>${q1.win}</b> through to the Final` : 'Qualifier 1 winner waits for the Final'}</span></div>
      <${Tie} S=${S} m=${e2} label="Eliminator 2" route="Qualifier 1 loser v Eliminator 1 winner." />
    </div>
    <div class="br-gap">${L2}</div>
    <div class="br-col c3">
      <div class="br-step"><span>Final</span></div>
      <div class="br-fwrap">
        <${Tie} S=${S} m=${fn} label="Final" route="Winner is the Season 2 champion." big />
        ${champ ? html`<a class="br-champ" href=${'#/team/' + champ} style=${`--tc:${tc(champ)}`}><em>🏆</em><span><small>Champions</small><b>${S.T(champ).name}</b></span></a>` : ''}
      </div>
    </div>
  </div>`;
}
