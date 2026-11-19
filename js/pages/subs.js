/* Substitutions on a team page: how often the team changes its playing 4, inside a match and from one match to the next.
   The grid has one row per squad archer (grouped by category) and one column per recorded match; each column is a
   little run of cells, one per set (and the shoot-off). A lit cell means that archer shot in that set. */
import { html, useState } from '../../vendor/preact-htm.js';
import { lineupStory, leagueSubs, CAT_SEQ } from '../lib/subs.js';
import { CATS } from '../lib/rules.js';
import { app, cls, tc, f1 } from '../lib/ui.js';
import { Crest, Avatar } from '../lib/media.js';
import { CAT_COL } from './rotation.js';
import { Seg } from './common.js';

const ordn = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');
const first = (S, id) => S.A(id).name.split(' ')[0];
const rankOf = (list, v) => 1 + list.filter(x => x > v + 1e-9).length;
const most = r => (r === 1 ? 'most in the league' : ordn(r) + ' most in the league');

function Swap({ S, s }) {
  return html`<span class="sb-swap"><i class="sb-cat" style=${`--c:${CAT_COL[s.cat]}`}>${s.cat}</i><a href=${'#/player/' + s.out} class="sb-out">${first(S, s.out)}</a><span class="sb-arr" aria-label="replaced by">→</span><a href=${'#/player/' + s.in} class="sb-in">${first(S, s.in)}</a></span>`;
}

export function SubsPanel({ code, S = app.S }) {
  const R = lineupStory(S, code); const [view, setView] = useState('between');
  if (!R.games.length) return html`<p class="empty">Substitutions show once a match of this team is recorded arrow by arrow.</p>`;
  const L = leagueSubs(S);
  const rIn = rankOf(L.map(o => o.rate), R.inMatch / R.games.length);
  const rB = R.pairs ? rankOf(L.filter(o => o.brate != null).map(o => o.brate), R.between / R.pairs) : null;
  const squad = CAT_SEQ.flatMap(c => S.T(code).archers.filter(a => a.cat === c).map(a => a.id));
  const maxCat = Math.max(1, ...CAT_SEQ.map(c => R.byCat[c].between + R.byCat[c].inMatch));
  return html`<div class="sb" style=${`--tc:${tc(code)}`}>
    <div class="rw-head sb-head">
      <div><b>${R.between}</b><span>changes between matches</span><small>${R.pairs ? `${f1(R.between / R.pairs)} a match · ${most(rB)}` : 'Needs two recorded matches'}</small></div>
      <div><b>${R.inMatch}</b><span>substitutions during a match</span><small>in ${R.withSub} of ${R.games.length} matches · ${most(rIn)}</small></div>
      <div><b>${R.same}/${R.pairs}</b><span>matches kept the same playing 4</span><small>as the match before</small></div>
    </div>

    <div class="sb-cats" aria-label="Changes by category">
      ${CAT_SEQ.map(c => { const o = R.byCat[c]; return html`<div class="sb-crow">
        <i class="sb-cat" style=${`--c:${CAT_COL[c]}`} title=${CATS[c]}>${c}</i>
        <span class="sb-bar"><span class="b" style=${`width:${(100 * o.between) / maxCat}%;--c:${CAT_COL[c]}`}></span><span class="m" style=${`width:${(100 * o.inMatch) / maxCat}%;--c:${CAT_COL[c]}`}></span></span>
        <small><b>${o.between}</b> between · <b>${o.inMatch}</b> during</small></div>`; })}
      <p class="sb-legend"><span><i class="b"></i>between matches</span><span><i class="m"></i>during a match</span></p>
    </div>

    <p class="rw-k">Who played when <small>one column per recorded match, one cell per set (SO = shoot-off). A lit cell means the archer shot in it; ⇄ marks a changed playing 4.</small></p>
    <div class="sb-grid" style=${`--g:${R.games.length}`}>
      <div class="sb-corner"></div>
      ${R.games.map(g => html`<a class=${cls('sb-mh', g.changes && g.changes.length && 'chg')} href=${'#/match/' + g.m.key} title=${`Day ${g.m.d} v ${S.T(g.vs).name}`}>
        <small>D${g.m.d}</small><${Crest} code=${g.vs} size=${20} />${g.changes && g.changes.length ? html`<em>⇄${g.changes.length}</em>` : g.changes ? html`<em class="eq">=</em>` : html`<em class="eq">·</em>`}</a>`)}
      ${squad.map((id, ri) => { const ar = S.A(id); const p = R.per[id] || { starts: 0, games: 0 }; const top = ri % 2 === 0;
        return html`<a class=${cls('sb-name', top && 'grp')} href=${'#/player/' + id} style=${`--c:${CAT_COL[ar.cat]}`}><i></i><${Avatar} ar=${ar} size=${22} /><span class="nm-f">${ar.name}</span><span class="nm-s">${ar.name.split(' ')[0]}</span><small>${p.games}</small></a>
          ${R.games.map(g => html`<div class=${cls('sb-cell', top && 'grp')}>${g.steps.map(st => { const l = st.by[ar.cat] || []; const on = l.includes(id) && !(st.guess && st.guess[ar.cat]);
            const came = g.subs.some(s => s.in === id && s.at === st.n); const so = st.n === 'SO';
            return html`<i class=${cls(on && 'on', came && 'came', so && 'so')} style=${`--c:${CAT_COL[ar.cat]}`} title=${`${ar.name}, ${st.label}, day ${g.m.d}${on ? '' : ': did not shoot'}${came ? ' (came on)' : ''}`}></i>`; })}</div>`)}`; })}
    </div>
    <p class="muted small sb-note">The number after each name is matches played. ${R.games.length} recorded matches; the others have no archer names yet.</p>

    <${Seg} label="Show" value=${view} onPick=${setView} opts=${[['between', 'Between matches'], ['during', 'During a match']]} />
    ${view === 'between'
      ? html`<ol class="sb-list">${R.games.filter(g => g.changes).map(g => html`<li>
          <a class="sb-when" href=${'#/match/' + g.m.key}><${Crest} code=${g.vs} size=${22} /><span><b>Day ${g.m.d}</b><small>v ${S.T(g.vs).name}${g.gap ? ` · after ${g.gap} unrecorded` : ''}</small></span></a>
          <span class="sb-what">${g.changes.length ? g.changes.map(s => html`<${Swap} S=${S} s=${s} />`) : html`<span class="muted">Same playing 4</span>`}</span></li>`)}</ol>`
      : R.inMatch ? html`<ol class="sb-list">${R.games.filter(g => g.subs.length).map(g => html`<li>
          <a class="sb-when" href=${'#/match/' + g.m.key}><${Crest} code=${g.vs} size=${22} /><span><b>Day ${g.m.d}</b><small>v ${S.T(g.vs).name}</small></span></a>
          <span class="sb-what">${g.subs.map(s => html`<span class="sb-at"><small>${s.mid ? 'During ' + s.label.toLowerCase() : 'From ' + s.label.toLowerCase()}</small><${Swap} S=${S} s=${s} /></span>`)}</span></li>`)}</ol>`
        : html`<p class="empty">${S.T(code).name} have not made a substitution during a recorded match.</p>`}
  </div>`;
}
