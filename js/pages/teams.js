/* Teams: a card for each team, and a team page with its squad, who shot when, and its timing. */
import { html } from '../../vendor/preact-htm.js';
import { TEAMS, standings, finalStandings, teamSets, archers, sideOf, opp } from '../lib/season.js';
import { app, cls, f1, f2, pct, tc, Result, Tiles, matchTitle } from '../lib/ui.js';
import { Crest, Avatar } from '../lib/media.js';
import { Form } from '../lib/charts.js';
import { Arch, Table, Panel } from './common.js';
import { RotationCard, CatKey } from './rotation.js';
import { SubsPanel } from './subs.js';
import { context, halves, shootingOrder, mean, CRUNCH, BOWS, ofBow, bowOf } from '../lib/insights.js';
import { summarize } from '../lib/season.js';
import { awards, teamAwards, awardDays, AwardMark, DayChips, Star } from '../lib/aotd.js';

const mpos = g => g.reduce((x, v, i) => x + v * i, 0) / Math.max(1, g.reduce((x, v) => x + v, 0));

const ordn = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');

export function Teams() {
  const S = app.S; const st = finalStandings(S);
  const rec = code => { let w = 0, l = 0; S.matches.forEach(m => { if (!sideOf(m, code) || (m.win !== m.teams.A && m.win !== m.teams.B)) return; if (m.win === code) w++; else l++; }); return [w, l]; };
  return html`<div class="page"><h1 class="pt">Teams</h1>
    <p class="lead small">Final standings for the whole tournament: champions, runners-up, then by playoff exit, then league position.</p>
    <div class="tblocks">${st.map((o, i) => { const sets = teamSets(S, o.t); const t = S.T(o.t); const sd = o.SF - o.SA; const [w, l] = rec(o.t); const form = S.matches.filter(m => sideOf(m, o.t) && (m.win === m.teams.A || m.win === m.teams.B)).map(m => ({ m, won: m.win === o.t }));
      return html`<a class=${'tblock' + (o.tier === 0 ? ' champ' : '')} href=${'#/team/' + o.t} style=${`--tc:${tc(o.t)}`}>
        <span class="tb-glow"></span><span class="tb-rank">${String(i + 1).padStart(2, '0')}</span>
        <div class="tb-crest"><${Crest} code=${o.t} size=${132} /></div>
        <div class="tb-body">
          <small class="tb-pos"><span class="tb-stage">${o.tier === 0 ? '🏆 ' : ''}${o.stage}</span> · ${ordn(o.league)} in league</small>
          <b class="tb-name">${t.name}</b>
          <div class="tb-stats">
            <span><b>${w}–${l}</b><small>W–L, all</small></span>
            <span><b>${o.Pts}</b><small>Points</small></span>
            <span><b>${sd > 0 ? '+' : ''}${sd}</b><small>Sets ±</small></span>
            <span><b>${f1(mean(sets.map(x => x.tot)))}</b><small>Avg set</small></span>
          </div>
          <div class="tb-form"><small>Form</small><${Form} list=${form.slice(-5)} />${(n => n ? html`<span class="tb-aw" title="Archer of the Day awards"><${Star} />${n} Archer of the Day</span>` : '')(teamAwards(S, o.t).length)}</div>
        </div>
        <span class="tb-go">View team →</span></a>`; })}</div></div>`;
}

/* the team's strongest and weakest archer of one bow by arrow average. Needs 16 arrows, or 8 when fewer qualify. */
function extremes(squad, b) {
  const l = squad.filter(a => bowOf(a.ar.cat) === b);
  let q = l.filter(a => a.n >= 16); if (q.length < 2) q = l.filter(a => a.n >= 8);
  if (q.length < 2) return null;
  q.sort((x, y) => y.avg - x.avg);
  return { best: q[0], weak: q[q.length - 1], min: q.every(a => a.n >= 16) ? 16 : 8, of: q.length };
}
const ExCard = ({ r, kind, code }) => html`<a class=${'excard ' + kind} href=${'#/player/' + r.id} style=${`--tc:${tc(code)}`}>
  <${Avatar} ar=${r.ar} size=${52} /><span class="ex-b"><small>${kind === 'best' ? 'Strongest' : 'Weakest'}</small><b class="nm">${r.ar.name}</b><small class="muted">${r.ar.cat} · ${r.n} arrows · ${pct(r.tenRate)} 10s</small></span><b class="ex-v">${f2(r.avg)}</b></a>`;

export function TeamPage({ code }) {
  const S = app.S; const t = S.T(code);
  if (!TEAMS.includes(code)) return html`<div class="page"><p class="empty">No such team.</p></div>`;
  const st = standings(S); const me = st.find(o => o.t === code); const rank = st.indexOf(me) + 1; const fs = finalStandings(S); const fme = fs.find(o => o.t === code);
  const ctx = context(S).filter(o => o.code === code);
  const all = summarize(ctx); const sets = teamSets(S, code);
  const used = sets.map(x => x.used).filter(v => v != null);
  const squad = archers(S, it => it.code === code);
  const awN = {}; awards(S).forEach(w => { awN[w.id] = (awN[w.id] || 0) + 1; });
  const sq = t.archers.map(a => Object.assign({ ar: S.A(a.id), aw: awN[a.id] || 0 }, squad.find(x => x.id === a.id) || { n: 0 }));
  const ord = shootingOrder(S, code);
  // recurve and compound kept apart
  const bw = BOWS.map(([b]) => { const c = ofBow(ctx, b); const cr = c.filter(o => o.clBefore != null && o.clBefore <= CRUNCH); return { b, s: summarize(c), cr, hv: halves(c, () => code, 1)[0], ex: extremes(squad, b) }; });
  const ms = S.matches.filter(m => sideOf(m, code));
  const aw = teamAwards(S, code); const awBy = {}; aw.forEach(w => { (awBy[w.id] = awBy[w.id] || []).push(w); });
  const awRank = (() => { const c = {}; awards(S).forEach(w => { c[w.team] = (c[w.team] || 0) + 1; }); const v = TEAMS.map(t => c[t] || 0); return 1 + v.filter(x => x > (c[code] || 0)).length; })();
  return html`<div class="page">
    <p class="kicker"><a href="#/teams">Teams</a> · ${t.state || ''}</p>
    <section class="thero2" style=${`--tc:${tc(code)}`}><${Crest} code=${code} size=${96} /><div><h1>${t.name}</h1><p class="lead">${fme.tier === 0 ? '🏆 Champions' : fme.stage === 'League stage' ? ordn(fs.indexOf(fme) + 1) + ' overall' : fme.stage} · ${rank}${['st', 'nd', 'rd'][rank - 1] || 'th'} in the league · ${me.W} won, ${me.L} lost · ${me.Pts} points</p><${Form} list=${me.form} /></div></section>
    <${Tiles} items=${[[f1(mean(sets.map(x => x.tot))), 'Average set', `${sets.length} sets, both bows`]]} />
    ${bw.map(x => html`<h3 class="bowh">${x.b}</h3><${Tiles} items=${[[f2(x.s.avg), 'Arrow average', `${x.s.n} recorded arrows`], [pct(x.s.tenRate), '10s'], [x.s.at ? f1(x.s.at) + ' s' : '–', 'Average time per arrow', `${x.s.tn} timed`], [x.cr.length ? f2(mean(x.cr.map(o => o.a.s))) : '–', 'Average in a time crunch', `${x.cr.length} arrows with ≤${CRUNCH} s left`]]} />
      ${x.ex ? html`<div class="expair"><${ExCard} r=${x.ex.best} kind="best" code=${code} /><${ExCard} r=${x.ex.weak} kind="weak" code=${code} /></div><p class="muted small exnote">Strongest and weakest ${x.b.toLowerCase()} archer by arrow average, out of ${x.ex.of} with at least ${x.ex.min} recorded arrows.</p>` : ''}`)}

    <${Panel} title="Archer of the Day" sub=${`Picked after each league day, one archer per category (two when it was shared). ${awardDays(S)} days awarded so far.`}>
      ${aw.length ? html`<div class="aw-team"><div class="aw-tot"><b><${Star} />${aw.length}</b><span>award${aw.length > 1 ? 's' : ''}</span><small>${awRank === 1 ? "Most in the league" : ordn(awRank) + " most in the league"}</small></div>
        <div class="aw-list">${Object.entries(awBy).sort((a, b) => b[1].length - a[1].length || a[1][0].d - b[1][0].d).map(([id, l]) => { const ar = S.A(id);
          return html`<a class="aw-row" href=${'#/player/' + id} style=${`--tc:${tc(code)}`}><${Avatar} ar=${ar} size=${40} /><span class="aw-nm"><b>${ar.name}</b><small>${ar.cat} · ${l.length}×</small></span><${DayChips} list=${l} /></a>`; })}</div></div>`
        : html`<p class="empty">No ${t.name} archer has been Archer of the Day yet.</p>`}
    </${Panel}>

    <${Panel} title="Squad" sub="Recorded matches only. Average time is the seconds each archer took per arrow (average time by each teammate).">
      <${Table} sort="n" rows=${sq} cols=${[
        ['name', 'Archer', r => html`<span class="sqn"><${Avatar} ar=${r.ar} size=${28} /><a href=${'#/player/' + r.ar.id}><span class="nm-f">${r.ar.name}</span><span class="nm-s">${r.ar.name.split(' ')[0]}</span></a><${AwardMark} n=${r.aw} /></span>`, { sort: r => r.ar.name }],
        ['cat', 'Cat.', r => r.ar.cat, { sort: r => r.ar.cat }], ['matches', 'Matches', r => r.matches || 0, { num: 1, sm: 0 }], ['n', 'Arrows', r => r.n, { num: 1 }],
        ['avg', 'Average', r => f2(r.avg), { num: 1 }], ['tenRate', '10s', r => pct(r.tenRate), { num: 1, sm: 0 }], ['at', 'Avg time', r => (r.at ? f1(r.at) + ' s' : '–'), { num: 1 }], ['agi', html`<abbr title="Arrow Grouping Index">AGI</abbr>`, r => (r.agi != null ? r.agi.toFixed(1) : '–'), { num: 1 }]]} />
    </${Panel}>

    <${Panel} title="Rotation across the 8 arrows" sub="The order this team sends its four archers to the line in a set. Recorded matches only.">
      <${CatKey} /><${RotationCard} code=${code} wide />
    </${Panel}>

    <${Panel} title="Substitutions" sub="How often this team changes its playing 4: from one match to the next, and between sets of a match. Each category has two archers in the squad. Recorded matches only.">
      <${SubsPanel} code=${code} />
    </${Panel}>

    <div class="grid2">
      <${Panel} title="Who shot when" sub="How often each archer shot each arrow of the set (1st to 8th), across recorded matches. Darker is more often.">
        ${Object.keys(ord.grid).length ? html`<div class="tbl"><table class="heat"><thead><tr><th>Archer</th>${[1, 2, 3, 4, 5, 6, 7, 8].map(p => html`<th class="n">${p}</th>`)}</tr></thead><tbody>
          ${Object.entries(ord.grid).sort((a, b) => mpos(a[1]) - mpos(b[1])).map(([id, g]) => { const mx = Math.max(...g);
            return html`<tr><td><${Arch} id=${id} team=${false} /></td>${[1, 2, 3, 4, 5, 6, 7, 8].map(p => html`<td class="n hc" style=${`--h:${g[p] / Math.max(1, mx)};--tc:${tc(code)}`}>${g[p] || ''}</td>`)}</tr>`; })}</tbody></table></div>` : html`<p class="empty">No recorded matches for this team yet.</p>`}
      </${Panel}>
      <${Panel} title="First 4 vs last 4 arrows" sub="Average score of the first half of each set against the second half.">
        ${bw.map(({ b, hv }) => html`<h3 class="sub">${b}</h3>${hv ? html`<div class="kv"><span>Arrows 1–4</span><b>${f2(hv.first.avg)}</b><span>Arrows 5–8</span><b>${f2(hv.last.avg)}</b><span>Difference</span><b class=${hv.delta >= 0 ? 'pos' : 'neg'}>${hv.delta >= 0 ? '+' : ''}${f2(hv.delta)}</b></div>` : html`<p class="empty">Not enough data yet.</p>`}`)}
      </${Panel}>
    </div>

    <${Panel} title="Matches">${ms.map(m => html`<div class="rrow"><small class="muted">${matchTitle(m)}</small><${Result} m=${m} /></div>`)}</${Panel}>
  </div>`;
}
