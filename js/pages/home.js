/* Home: team logos, the points table, how much of the season is recorded, and a few headline numbers. */
import { html, useState } from '../../vendor/preact-htm.js';
import { TEAMS, standings, archers, pool, summarize } from '../lib/season.js';
import { app, cls, f2, pct, tc, Result, matchTitle } from '../lib/ui.js';
import { Crest, LEAGUE_LOGO } from '../lib/media.js';
import { Form } from '../lib/charts.js';
import { Arch } from './common.js';
import { context, isCrucial, groupBy, bowOf, ofBow, BOWS } from '../lib/insights.js';

const ord = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');

export function Home() {
  const S = app.S; const [logoOk, setLogoOk] = useState(true);
  const st = standings(S); const pos = Object.fromEntries(st.map((o, i) => [o.t, i + 1]));
  const rec = S.matches.filter(m => m.src === 'recorded'), tv = S.matches.filter(m => m.src === 'broadcast');
  const ctx = context(S);
  const ar = archers(S).filter(a => a.n >= 16);
  // recurve and compound are always shown apart
  const byBow = BOWS.map(([b]) => { const l = ar.filter(a => bowOf(a.ar.cat) === b); const c = ofBow(ctx, b);
    return { b, all: summarize(c), topAvg: l.slice().sort((x, y) => y.avg - x.avg).slice(0, 3), topAgi: l.filter(a => a.agi != null).sort((x, y) => y.agi - x.agi).slice(0, 3),
      clutch: groupBy(c.filter(isCrucial), o => o.code, 4).sort((x, y) => y.avg - x.avg)[0] }; });
  const allN = summarize(pool(S)).n;
  const playoffs = S.matches.filter(m => m.stage !== 'League');
  const latest = rec.slice().sort((a, b) => b.no - a.no).slice(0, 4);
  return html`<div class="page home">
    <section class="hhero">
      ${LEAGUE_LOGO && logoOk && html`<img class="hlogo" src=${LEAGUE_LOGO} alt="Archery Premier League" referrerpolicy="no-referrer" onError=${() => setLogoOk(false)} />`}
      <div><p class="kicker">Archery Premier League · Season 2</p><h1>APL Analytics</h1>
        <p class="lead">Every arrow of the season: who shoots best, when, under what pressure, and how teams plan their sets.</p></div>
    </section>

    <div class="crests">${TEAMS.slice().sort((a, b) => pos[a] - pos[b]).map(code => { const t = S.T(code);
      return html`<a class="crestbtn" href=${'#/team/' + code} style=${`--tc:${tc(code)}`}><span class="cb-glow"></span>
        <${Crest} code=${code} size=${88} /><b>${t.name}</b><small>${t.state || ''}</small><span class="cb-rec">${ord(pos[code])} in the league</span></a>`; })}</div>

    <div class="grid2 home-g">
      <section class="panel"><h2>Points table</h2><p class="muted">League stage. 2 points a win; ties split on head-to-head, then set-point difference.</p>
        <div class="tbl"><table class="standings"><thead><tr><th>#</th><th>Team</th><th class="n">P</th><th class="n">W</th><th class="n">L</th><th class="n">Sets ±</th><th class="n">Pts</th><th>Form</th></tr></thead>
        <tbody>${st.map((o, i) => html`<tr class=${i < 4 ? 'q' : ''}><td>${i + 1}</td><td><a class="tm" href=${'#/team/' + o.t}><i style=${`background:${tc(o.t)}`}></i>${S.T(o.t).name}</a></td>
          <td class="n">${o.P}</td><td class="n">${o.W}</td><td class="n">${o.L}</td><td class="n">${o.SF - o.SA > 0 ? '+' : ''}${o.SF - o.SA}</td><td class="n"><b>${o.Pts}</b></td><td><${Form} list=${o.form.slice(-5)} /></td></tr>`)}</tbody></table></div>
        ${playoffs.length ? html`<h3 class="sub">Playoffs</h3>${playoffs.map(m => html`<div class="po-row"><small class="muted">${m.stage}</small><${Result} m=${m} small /></div>`)}` : ''}
      </section>
      <div>
        <section class="panel"><h2>Data so far</h2>
          <div class="cov"><span class="cov-r" style=${`flex:${rec.length}`}>${rec.length} recorded</span><span class="cov-t" style=${`flex:${tv.length}`}>${tv.length} TV read</span>${S.matches.length - rec.length - tv.length ? html`<span class="cov-n" style=${`flex:${S.matches.length - rec.length - tv.length}`}>${S.matches.length - rec.length - tv.length}</span>` : ''}</div>
          <p class="muted small">Recorded matches have the archer, spot and clock for every arrow, so player numbers come only from them. Team numbers also use the TV scoreboard read. Everything here updates as you record more matches.</p>
          <div class="facts"><span><b>${allN.toLocaleString('en-IN')}</b> arrows</span>${byBow.map(x => html`<span><b>${f2(x.all.avg)}</b> ${x.b.toLowerCase()} average · <b>${pct(x.all.tenRate)}</b> 10s</span>`)}</div>
        </section>
        <section class="panel"><h2>Leaders so far</h2>
          ${byBow.map(x => html`<h3 class="bowh">${x.b}</h3><div class="leaders">
            <div><h3 class="sub">Arrow average</h3>${x.topAvg.map((a, i) => html`<div class="ldr"><span>${i + 1}</span><${Arch} id=${a.id} /><b>${f2(a.avg)}</b></div>`)}</div>
            <div><h3 class="sub">Tightest group (AGI)</h3>${x.topAgi.map((a, i) => html`<div class="ldr"><span>${i + 1}</span><${Arch} id=${a.id} /><b>${a.agi.toFixed(1)}</b></div>`)}</div>
          </div>
          ${x.clutch && html`<p class="small">Best team on crucial ${x.b.toLowerCase()} arrows (last two of a set within 3 points): <b><a href=${'#/team/' + x.clutch.k}>${S.T(x.clutch.k).name}</a></b>, ${f2(x.clutch.avg)} from ${x.clutch.n}.</p>`}`)}
          <a class="lnk" href="#/analytics">All analytics →</a>
        </section>
      </div>
    </div>

    ${latest.length ? html`<section class="panel"><h2>Latest recorded matches</h2><div class="rlist">${latest.map(m => html`<div class="rrow"><small class="muted">${matchTitle(m)}</small><${Result} m=${m} /></div>`)}</div><a class="lnk" href="#/matches">All matches →</a></section>` : ''}

    <div class="explore">
      <a href="#/teams"><b>Teams</b><span>Line-ups, who shot when, time per teammate</span></a>
      <a href="#/players"><b>Players</b><span>Profiles, best position, ideal shooting time</span></a>
      <a href="#/analytics/pressure"><b>Pressure</b><span>A pressure index on every arrow</span></a>
      <a href="#/ideas"><b>Ideas board</b><span>Every idea from the notes and where it lives</span></a>
    </div>
  </div>`;
}
