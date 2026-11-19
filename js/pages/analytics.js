/* Analytics: the ideas list grouped into sections. Each section says how much data it stands on. */
import { html, useState } from '../../vendor/preact-htm.js';
import { archers, TEAMS, dayName } from '../lib/season.js';
import { CATS } from '../lib/rules.js';
import { app, cls, f1, f2, pct, tc, Team } from '../lib/ui.js';
import { Columns, Bars, Scatter } from '../lib/charts.js';
import { Arch, Pick, Table, catOk, Panel, Seg, Steps, CrestPick, FGroup } from './common.js';
import * as I from '../lib/insights.js';
import { summarize } from '../lib/season.js';
import { loadWeather, wxAt, compass, wxStatus } from '../lib/weather.js';
import { WindArrow } from './matches.js';

/* average wind over a day's match start times */
function dayWind(ms) {
  loadWeather();
  const w = ms.map(wxAt).filter(Boolean); if (!w.length) return html`<span class="muted">${wxStatus() === 'failed' ? 'unavailable' : '…'}</span>`;
  const sp = w.reduce((x, o) => x + o.wind, 0) / w.length;
  // average direction as a vector, so 350° and 10° average to north
  const vx = w.reduce((x, o) => x + Math.sin(o.dir * Math.PI / 180), 0), vy = w.reduce((x, o) => x + Math.cos(o.dir * Math.PI / 180), 0);
  const dir = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
  return html`<span class="wx-chip"><${WindArrow} dir=${dir} size=${13} />${Math.round(sp)} km/h ${compass(dir)}</span>`;
}

/* arrow average in calmer and windier matches, recurve and compound apart */
function WindScores({ ctx, S }) {
  loadWeather();
  const ms = S.matches.filter(m => m.arrows.length && wxAt(m)); if (ms.length < 6) return '';
  const ws = ms.map(m => wxAt(m).wind).sort((a, b) => a - b);
  const q1 = ws[Math.floor(ws.length / 3)], q2 = ws[Math.floor(2 * ws.length / 3)];
  const band = m => { const v = wxAt(m).wind; return v < q1 ? 0 : v < q2 ? 1 : 2; };
  const names = [`Calmer (under ${Math.round(q1)} km/h)`, `Middle (${Math.round(q1)}–${Math.round(q2)} km/h)`, `Windier (${Math.round(q2)}+ km/h)`];
  return html`<${Panel} title="Wind and scores" sub="Matches split into three equal groups by the modelled wind at their start time. Recurve and compound are kept apart. A few matches per group, so treat it as a first look, not proof.">
    ${I.BOWS.map(([b]) => { const c = I.ofBow(ctx, b).filter(o => wxAt(o.m));
      return html`<h3 class="bowh">${b}</h3><div class="tbl"><table><thead><tr><th>Wind at start</th><th class="n">Matches</th><th class="n">Arrows</th><th class="n">Avg</th><th class="n">10s</th></tr></thead><tbody>
      ${[0, 1, 2].map(i => { const l = c.filter(o => band(o.m) === i), z = summarize(l), nm = new Set(l.map(o => o.m.key)).size;
        return html`<tr><td>${names[i]}</td><td class="n">${nm}</td><td class="n">${z.n}</td><td class="n"><b>${z.n ? f2(z.avg) : '–'}</b></td><td class="n">${z.n ? pct(z.tenRate) : '–'}</td></tr>`; })}</tbody></table></div>`; })}
  </${Panel}>`;
}

export const SECTIONS = [
  ['leaderboard', 'Leaderboard'], ['positions', 'Positions 1–8'], ['time', 'Time'], ['pressure', 'Pressure & clutch'],
  ['comebacks', 'Comebacks & shoot-offs'], ['strategy', 'Team strategy'], ['events', 'Event & day']
];

export function Analytics({ sec, bow: b0 }) {
  const S = app.S; const bow = b0 === 'C' ? 'Compound' : 'Recurve'; const bk = bow[0];
  const full = I.context(S);
  // recurve and compound are kept apart everywhere: arrow-level numbers only use arrows of the chosen bow
  const ctx = I.ofBow(full, bow); const rctx = ctx;
  const Sec = { leaderboard: Leaderboard, positions: Positions, time: Time, pressure: Pressure, comebacks: Comebacks, strategy: Strategy, events: Events }[sec] || Leaderboard;
  return html`<div class="page"><h1 class="pt">Analytics</h1>
    <div class="bowbar"><span class="muted small">Bow</span><div class="seg">${I.BOWS.map(([k, l]) => html`<a class=${cls(bow === k && 'on')} href=${'#/analytics/' + sec + '/' + k[0]}>${l}</a>`)}</div><span class="muted small">Recurve and compound are never mixed: compound scores run higher.</span></div>
    <nav class="subnav">${SECTIONS.map(([k, l]) => html`<a class=${cls(sec === k && 'on')} href=${'#/analytics/' + k + '/' + bk}>${l}</a>`)}</nav>
    <${Sec} S=${S} ctx=${ctx} rctx=${rctx} full=${full} bow=${bow} key=${sec + bk} /></div>`;
}

/* ---------- leaderboard with filters ---------- */
function Leaderboard({ S, rctx, bow }) {
  const [cat, setCat] = useState(''); const [teams, setTeams] = useState([]); const [stage, setStage] = useState(''); const [set, setSet] = useState(''); const [half, setHalf] = useState(''); const [min, setMin] = useState('16');
  const f = it => (!stage || (stage === 'League' ? it.m.stage === 'League' : it.m.stage !== 'League')) && (!set || String(it.a.set) === set) && (!half || (half === 'f' ? it.pos <= 4 : it.pos >= 5));
  const rows = archers(S, f).filter(a => I.bowOf(a.ar.cat) === bow && catOk(a.ar.cat, cat) && (!teams.length || teams.includes(a.ar.team)) && a.n >= +min);
  const bestOf = b => { const l = archers(S, f).filter(a => I.bowOf(a.ar.cat) === b && a.n >= 16).sort((x, y) => y.avg - x.avg); return l[0]; };
  const bc = bestOf('Compound'), br = bestOf('Recurve');
  return html`
    <div class="grid2">
      <${Panel} title="Best compounder">${bc ? html`<div class="big"><${Arch} id=${bc.id} /><b>${f2(bc.avg)}</b><small class="muted">${bc.n} arrows · AGI ${bc.agi != null ? bc.agi.toFixed(1) : '–'}</small></div>` : html`<p class="empty">Not enough data yet.</p>`}</${Panel}>
      <${Panel} title="Best recurver">${br ? html`<div class="big"><${Arch} id=${br.id} /><b>${f2(br.avg)}</b><small class="muted">${br.n} arrows · AGI ${br.agi != null ? br.agi.toFixed(1) : '–'}</small></div>` : html`<p class="empty">Not enough data yet.</p>`}</${Panel}>
    </div>
    <${Panel} title=${bow + ' leaderboard'} sub="Recorded matches only. Pick filters, then sort by any column. Switch bow at the top.">
      <div class="fbar">
        <${FGroup} label="Division"><${Seg} small label="Division" value=${cat} onPick=${setCat} opts=${[['', 'All'], [bow[0] + 'M', 'Men'], [bow[0] + 'W', 'Women']]} /></${FGroup}>
        <${FGroup} label="Stage"><${Seg} small label="Stage" value=${stage} onPick=${setStage} opts=${[['', 'All'], ['League', 'League'], ['PO', 'Playoffs']]} /></${FGroup}>
        <${FGroup} label="Set"><${Seg} small label="Set" value=${set} onPick=${setSet} opts=${[['', 'All'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} /></${FGroup}>
        <${FGroup} label="Arrows of the set"><${Seg} small label="Arrows of the set" value=${half} onPick=${setHalf} opts=${[['', '1–8'], ['f', '1–4'], ['l', '5–8']]} /></${FGroup}>
        <${FGroup} label="At least this many arrows"><${Steps} label="Minimum arrows" values=${['1', '8', '16', '32']} value=${min} onPick=${setMin} unit=" arrows" /></${FGroup}>
        <div class="fg fg-wide"><span class="fg-l">Teams</span><${CrestPick} compact value=${teams} onChange=${setTeams} /></div>
      </div>
      <${Table} sort="avg" rows=${rows} cols=${[
        ['rank', '#', (r, i) => i + 1], ['name', 'Archer', r => html`<${Arch} id=${r.id} />`, { sort: r => r.ar.name }], ['cat', 'Cat.', r => r.ar.cat, { sort: r => r.ar.cat, sm: 0 }],
        ['n', 'Arrows', null, { num: 1, sm: 0 }], ['avg', 'Average', r => f2(r.avg), { num: 1 }], ['tenRate', '10s', r => pct(r.tenRate), { num: 1, sm: 0 }], ['x', 'X', null, { num: 1, sm: 0 }],
        ['at', 'Avg time', r => (r.at ? f1(r.at) + ' s' : '–'), { num: 1, sm: 0 }], ['agi', html`<abbr title="Arrow Grouping Index">AGI</abbr>`, r => (r.agi != null ? r.agi.toFixed(1) : '–'), { num: 1 }], ['group', 'Group cm', r => (r.group != null ? r.group.toFixed(1) : '–'), { num: 1, sm: 0 }]]} />
    </${Panel}>`;
}

/* ---------- positions ---------- */
function Positions({ S, rctx, bow }) {
  const rows = I.byPosition(rctx, 3);
  return html`<${Panel} title=${'Best ' + bow.toLowerCase() + ' archer at each position'} sub="Arrow 1 to 8 of a team's set. Top three by average, at least 3 arrows at that position.">
      <${Columns} data=${rows.map(r => ({ x: r.pos, y: r.all.avg, n: r.all.n }))} yMin=${8} yMax=${10} fmt=${f2} xLabel="Arrow of the set (everyone)" tip=${d => html`<b>Arrow ${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
      <div class="tbl"><table><thead><tr><th>Arrow</th><th class="n">League avg</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead><tbody>
      ${rows.map(r => html`<tr><td>${r.pos}</td><td class="n">${f2(r.all.avg)}</td>${[0, 1, 2].map(i => html`<td>${r.best[i] ? html`<${Pick} id=${r.best[i].k} v=${f2(r.best[i].avg)} n=${r.best[i].n} />` : '–'}</td>`)}</tr>`)}</tbody></table></div>
    </${Panel}>
    <${Panel} title="First 4 vs last 4 arrows" sub="Who finishes a set stronger than they start it.">
      <${Table} sort="delta" rows=${I.halves(rctx.filter(o => o.a.a), o => o.a.a, 4)} limit=${15} cols=${[
        ['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['f', 'Arrows 1–4', r => f2(r.first.avg), { num: 1, sort: r => r.first.avg }], ['l', 'Arrows 5–8', r => f2(r.last.avg), { num: 1, sort: r => r.last.avg }],
        ['delta', 'Change', r => html`<b class=${r.delta >= 0 ? 'pos' : 'neg'}>${r.delta >= 0 ? '+' : ''}${f2(r.delta)}</b>`, { num: 1 }], ['n', 'Arrows', null, { num: 1 }]]} />
      <h3 class="sub">By team</h3>
      <${TeamHalves} S=${S} ctx=${rctx} />
    </${Panel}>`;
}
function TeamHalves({ S, ctx }) {
  const rows = I.halves(ctx, o => o.code, 4);
  return html`<${Bars} rows=${rows.sort((a, b) => b.delta - a.delta).map(r => ({ label: S.T(r.k).name, swatch: tc(r.k), color: tc(r.k), value: Math.abs(r.delta), sub: ` ${f2(r.first.avg)} → ${f2(r.last.avg)}` }))} fmt=${v => f2(v)} note="Bar length: size of the change between the halves." />`;
}

/* ---------- time ---------- */
function Time({ S, ctx, rctx, full, bow }) {
  const tv = I.timeVsScore(ctx);
  const ideal = I.idealTime(rctx);
  const eff = I.efficiency(rctx.filter(o => o.a.a), o => o.a.a, 16);
  const win = I.bestInWindow(rctx);
  const tt = I.teamTime(S, ctx);
  const l2 = I.lastTwo(ctx);
  return html`
    <div class="grid2">
      <${Panel} title="Time taken vs score" sub="Every recorded arrow with a clean clock reading, by seconds taken.">
        <${Columns} data=${tv.map(r => ({ x: r.label, y: r.avg, n: r.n }))} yMin=${8} yMax=${10} fmt=${f2} xLabel="Seconds taken" tip=${d => html`<b>${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
      </${Panel}>
      <${Panel} title="Last 2 arrows: time left vs result" sub="Clock left when the 7th arrow was shot, against the total of the last two (only sets where both were shot with this bow).">
        <${Columns} data=${l2.map(r => ({ x: r.label, y: r.avg, n: r.n }))} yMin=${16} yMax=${20} fmt=${f1} xLabel="Seconds left for the last two" tip=${d => html`<b>${d.x}</b><span>${f1(d.y)} from ${d.n} pairs</span>`} />
      </${Panel}>
    </div>
    <${Panel} title="Who manages time best" sub=${`Per team, ${bow.toLowerCase()} arrows only: average seconds per arrow, time-outs, and scoring with ${I.CRUNCH} s or less left on the clock.`}>
      <${Table} sort="at" dir=${1} rows=${tt} cols=${[
        ['t', 'Team', r => html`<${Team} code=${r.t} full />`], ['at', 'Avg time', r => f1(r.at) + ' s', { num: 1 }], ['avg', 'Average', r => f2(r.avg), { num: 1 }],
        ['crunchN', 'Crunch arrows', null, { num: 1, sm: 0 }], ['crunchAvg', 'Crunch avg', r => f2(r.crunchAvg), { num: 1 }], ['to', 'Time-outs', null, { num: 1, sm: 0 }]]} />
    </${Panel}>
    <div class="grid2">
      <${Panel} title="Most efficient: less time, more score" sub="Points per second of clock used. At least 16 timed arrows.">
        <${Table} sort="pps" rows=${eff} limit=${10} cols=${[['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['pps', 'Pts / s', r => f2(r.pps), { num: 1 }], ['avg', 'Avg', r => f2(r.avg), { num: 1 }], ['at', 'Time', r => f1(r.at) + ' s', { num: 1 }]]} />
      </${Panel}>
      <${Panel} title="Ideal time for each archer" sub="The time window where each archer has scored best (at least 4 arrows in it).">
        <${Table} sort="bavg" rows=${ideal.map(r => Object.assign(r, { bavg: r.best.avg }))} limit=${10} cols=${[['id', 'Archer', r => html`<${Arch} id=${r.id} />`], ['w', 'Best window', r => r.best.label, { sort: r => r.best.i }], ['bavg', 'Avg there', r => f2(r.best.avg), { num: 1 }], ['avg', 'Overall', r => f2(r.avg), { num: 1 }]]} />
      </${Panel}>
    </div>
    <${CatTime} S=${S} full=${full} bow=${bow} />
    <${Panel} title="Best player in each time window">
      <div class="tbl"><table><thead><tr><th>Seconds taken</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead><tbody>${win.map(w => html`<tr><td>${w.label}</td>${[0, 1, 2].map(i => html`<td>${w.best[i] ? html`<${Pick} id=${w.best[i].k} v=${f2(w.best[i].avg)} n=${w.best[i].n} />` : '–'}</td>`)}</tr>`)}</tbody></table></div>
    </${Panel}>
    <${Panel} title="Time crunch vs shot made" sub=${`Archers with ${I.CRUNCH} s or less left when they shot, against their other arrows.`}>
      <${Table} sort="n" rows=${I.crunch(rctx.filter(o => o.a.a), o => o.a.a, 2)} limit=${12} cols=${[['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['n', 'Crunch arrows', null, { num: 1 }], ['avg', 'Crunch avg', r => f2(r.avg), { num: 1 }], ['r', 'Other arrows', r => f2(r.rest.avg), { num: 1, sort: r => r.rest.avg }]]} />
    </${Panel}>`;
}

/* best archer in each of the four categories, in 2-second bands of time taken */
function CatTime({ S, full, bow }) {
  const [cat, setCat] = useState('');
  const rows = I.bestByCatTime(S, full);
  // the bow picked at the top goes first; each category is ranked only within itself
  const order = bow === 'Compound' ? ['CM', 'CW', 'RM', 'RW'] : ['RM', 'RW', 'CM', 'CW'];
  const cell = (r, c, i) => { const p = r.cats[c].best[i]; return p ? html`<${Pick} id=${p.k} v=${f2(p.avg)} n=${p.n} />` : html`<span class="muted">–</span>`; };
  return html`<${Panel} title="Best archer in each category, by time taken" sub="Seconds an archer took for the arrow, in 2-second bands. Each category is ranked only against itself (at least 3 arrows in the band). Tap a category for its top three.">
    <div class="fbar"><${FGroup} label="Category"><${Seg} small label="Category" value=${cat} onPick=${setCat} opts=${[['', 'All four'], ...order.map(c => [c, CATS[c]])]} /></${FGroup}></div>
    ${rows.length ? html`<div class="tbl cattime"><table><thead><tr><th>Seconds taken</th>${cat ? ['1st', '2nd', '3rd'].map(l => html`<th>${l}</th>`) : order.map(c => html`<th>${CATS[c]}</th>`)}</tr></thead><tbody>
      ${rows.map(r => html`<tr><td>${r.label}</td>${cat ? [0, 1, 2].map(i => html`<td>${cell(r, cat, i)}</td>`) : order.map(c => html`<td>${cell(r, c, 0)}</td>`)}</tr>`)}</tbody></table></div>` : html`<p class="empty">No timed arrows yet.</p>`}
  </${Panel}>`;
}

/* ---------- pressure ---------- */
function Pressure({ S, ctx, rctx }) {
  const bands = I.PBANDS.map(([a, b, l]) => Object.assign({ l }, summarize(ctx.filter(o => o.pi >= a && o.pi < b))));
  const arch = I.pressure(rctx.filter(o => o.a.a), o => o.a.a).filter(r => r.lift != null);
  const crucialT = I.groupBy(ctx.filter(I.isCrucial), o => o.code, 1).sort((a, b) => b.avg - a.avg);
  const crucialA = I.groupBy(rctx.filter(o => o.a.a && I.isCrucial(o)), o => o.a.a, 3).sort((a, b) => b.avg - a.avg);
  return html`
    <${Panel} title="Pressure index" sub="Every set arrow gets a score from 0 to 100: 35% time left per remaining arrow, 40% how close the set is (weighted to later arrows), 25% what the match is worth (set points already on the board). A first rough formula, easy to tune.">
      <${Columns} data=${bands.map(b => ({ x: b.l, y: b.avg, n: b.n }))} yMin=${8} yMax=${10} fmt=${f2} xLabel="Pressure band" tip=${d => html`<b>${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
    </${Panel}>
    <div class="grid2">
      <${Panel} title="Crucial arrow: best team" sub="Last two arrows of a set while it is within 3 points.">
        <${Bars} rows=${crucialT.map(r => ({ label: S.T(r.k).name, swatch: tc(r.k), color: tc(r.k), value: r.avg, sub: ` · ${r.n}` }))} min=${7} max=${10} fmt=${f2} />
      </${Panel}>
      <${Panel} title="Crucial arrow: best archers">
        <${Table} sort="avg" rows=${crucialA} limit=${10} cols=${[['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['avg', 'Avg', r => f2(r.avg), { num: 1 }], ['n', 'Arrows', null, { num: 1 }]]} />
      </${Panel}>
    </div>
    <${Panel} title="Who rises under pressure" sub="Average on high-pressure arrows (55+) minus low-pressure arrows (under 35).">
      <${Table} sort="lift" rows=${arch} limit=${15} cols=${[['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['hi', 'High', r => html`${f2(r.hi.avg)} <small class="muted">${r.hi.n}</small>`, { num: 1, sort: r => r.hi.avg }], ['lo', 'Low', r => html`${f2(r.lo.avg)} <small class="muted">${r.lo.n}</small>`, { num: 1, sort: r => r.lo.avg }], ['lift', 'Lift', r => html`<b class=${r.lift >= 0 ? 'pos' : 'neg'}>${r.lift >= 0 ? '+' : ''}${f2(r.lift)}</b>`, { num: 1 }]]} />
    </${Panel}>
    <${Panel} title="Close 9s" sub="Nines that landed within a whisker of the 10 line.">
      <${Table} sort="close" rows=${I.close9s(rctx)} limit=${10} cols=${[['id', 'Archer', r => html`<${Arch} id=${r.id} />`], ['close', 'Close 9s', null, { num: 1 }], ['nines', 'All 9s', null, { num: 1 }], ['share', 'Share', r => pct(r.share), { num: 1 }]]} />
    </${Panel}>`;
}

/* ---------- comebacks & shoot-offs ---------- */
function Comebacks({ S }) {
  const cb = I.comebacks(S); const so = I.shootOffs(S);
  return html`
    <${Panel} title="Sets won from behind" sub="Set-level, so both bows together by format. Sets a team won after trailing at the halfway point (4 arrows each) or after 6 arrows, and matches won after being behind on set points.">
      <${Table} sort="won4" rows=${cb} cols=${[['t', 'Team', r => html`<${Team} code=${r.t} full />`], ['won4', 'Won from behind at 4', r => `${r.won4} of ${r.behind4}`, { num: 1 }], ['won6', 'Won from behind at 6', r => `${r.won6} of ${r.behind6}`, { num: 1 }], ['matchWon', 'Matches won from behind', r => `${r.matchWon} of ${r.matchBehind}`, { num: 1 }]]} />
    </${Panel}>
    <div class="grid2">
      <${Panel} title="Shoot-offs by team" sub=${`${so.total} matches went to a shoot-off.`}>
        <${Table} sort="so" rows=${so.teams} cols=${[['t', 'Team', r => html`<${Team} code=${r.t} full />`], ['so', 'Shoot-offs', null, { num: 1 }], ['won', 'Won', null, { num: 1 }], ['hr', 'Hit rate', r => (r.arrows ? pct(r.hits / r.arrows) : '–'), { num: 1, sort: r => (r.arrows ? r.hits / r.arrows : null) }]]} />
      </${Panel}>
      <${Panel} title="Shoot-off archers" sub="Recorded shoot-off arrows only.">
        <${Table} sort="hits" rows=${so.archers} cols=${[['id', 'Archer', r => html`<${Arch} id=${r.id} />`], ['hits', 'Hits', null, { num: 1 }], ['n', 'Arrows', null, { num: 1 }]]} />
      </${Panel}>
    </div>`;
}

/* ---------- team strategy ---------- */
function Strategy({ S, ctx, rctx, full, bow }) {
  const pr = I.predictability(S, full); const subs = I.substitutes(S, rctx);
  return html`
    <${Panel} title="How predictable is each team?" sub="Set totals always combine both bows (every set has two recurve and two compound archers). Spread of set totals (lower is steadier), and how close a set total lands to what the four archers' season averages predict.">
      <${Table} sort="sd" dir=${1} rows=${pr} cols=${[['t', 'Team', r => html`<${Team} code=${r.t} full />`], ['n', 'Sets', null, { num: 1 }], ['avg', 'Avg set', r => f1(r.avg), { num: 1 }], ['sd', 'Spread (±)', r => f1(r.sd), { num: 1 }], ['mae', 'Prediction miss', r => (r.mae != null ? '±' + f1(r.mae) : '–'), { num: 1 }], ['en', 'Sets predicted', null, { num: 1 }]]} />
    </${Panel}>
    <${Panel} title=${'Best ' + bow.toLowerCase() + ' substitute'} sub="Archers who were not in the first-set line-up but came in later in the match.">
      <${Table} sort="avg" rows=${subs} cols=${[['k', 'Archer', r => html`<${Arch} id=${r.k} />`], ['apps', 'Times subbed in', null, { num: 1 }], ['n', 'Arrows', null, { num: 1 }], ['avg', 'Average', r => f2(r.avg), { num: 1 }]]} empty="No substitutions in the recorded matches yet." />
    </${Panel}>
    <${Panel} title="Who shot when" sub="Each team's shooting order is on its team page.">
      <div class="explore">${TEAMS.map(t => html`<a href=${'#/team/' + t} style=${`--tc:${tc(t)}`}><b>${S.T(t).name}</b><span>Shooting order and set strategy</span></a>`)}</div>
    </${Panel}>`;
}

/* ---------- events and days ---------- */
function Events({ S, ctx }) {
  const days = I.byDay(S, ctx);
  const stage = I.groupBy(ctx, o => (o.m.stage === 'League' ? 'League' : 'Playoffs'), 1);
  return html`
    <${Panel} title="Day by day" sub="Arrow average per match day, how much of each day is recorded, and the average wind at match start times (modelled for the venue).">
      <${Columns} data=${days.map(d => ({ x: 'D' + d.d, y: d.n ? d.avg : null, n: d.n }))} yMin=${8} yMax=${10} fmt=${f2} xLabel="Match day" tip=${d => html`<b>${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
      <div class="tbl"><table><thead><tr><th>Day</th><th>Date</th><th class="n">Matches</th><th class="n">Recorded</th><th class="n">Arrows</th><th class="n">Avg</th><th class="n">Avg time</th><th>Wind</th></tr></thead><tbody>
      ${days.map(d => html`<tr><td>${d.d}</td><td>${dayName(d.d)}</td><td class="n">${d.matches.length}</td><td class="n">${d.rec}</td><td class="n">${d.n}</td><td class="n">${f2(d.avg)}</td><td class="n">${d.at ? f1(d.at) + ' s' : '–'}</td><td>${dayWind(d.matches)}</td></tr>`)}</tbody></table></div>
    </${Panel}>
    <${WindScores} ctx=${ctx} S=${S} />
    <${Panel} title="League vs playoffs">
      <div class="kv">${stage.map(s => html`<span>${s.k}</span><b>${f2(s.avg)} <small class="muted">${s.n} arrows · ${pct(s.tenRate)} 10s</small></b>`)}</div>
    </${Panel}>`;
}
