/* Players: everyone in the league, and a page per archer with position, timing and pressure numbers. */
import { html, useState } from '../../vendor/preact-htm.js';
import { archers, label } from '../lib/season.js';
import { CATS, CAT_ORDER } from '../lib/rules.js';
import { app, f1, f2, pct, tc, Tiles, chipStyle, matchTitle, Team } from '../lib/ui.js';
import { Avatar } from '../lib/media.js';
import { Columns, Face, RingBar, RingKey } from '../lib/charts.js';
import { Panel, Table, Seg, CrestPick } from './common.js';
import { context, TBUCKETS, bucketOf, mean, CRUNCH, CLOSE9, radius, bowOf } from '../lib/insights.js';
import { summarize } from '../lib/season.js';
import { awards, awardDays, AwardMark, AwardRibbon, Star } from '../lib/aotd.js';

/* Filters without dropdowns: a bow switch, a division switch and a strip of team crests (tap to pick, tap again to drop).
   Recurve and compound stay in separate sections whatever is picked. */
const BOW_SEG = [['', 'All bows'], ['R', 'Recurve'], ['C', 'Compound']];
const DIV_SEG = [['', 'Everyone'], ['M', 'Men'], ['W', 'Women']];
export function Players() {
  const S = app.S; const [q, setQ] = useState(''); const [bow, setBow] = useState(''); const [div, setDiv] = useState(''); const [teams, setTeams] = useState([]);
  const stats = Object.fromEntries(archers(S).map(a => [a.id, a]));
  const all = S.roster.teams.flatMap(t => t.archers.map(a => S.A(a.id)));
  const ok = a => (!bow || (a.cat || '')[0] === bow) && (!div || (a.cat || '')[1] === div) && (!teams.length || teams.includes(a.team)) && (!q || a.name.toLowerCase().includes(q.toLowerCase()));
  const list = all.filter(ok);
  const aw = {}; awards(S).forEach(w => { aw[w.id] = (aw[w.id] || 0) + 1; });
  const any = q || bow || div || teams.length;
  return html`<div class="page"><h1 class="pt">Players</h1>
    <div class="pfilt">
      <div class="pf-row"><input class="search" type="search" placeholder="Search archers" value=${q} onInput=${e => setQ(e.target.value)} />
        <${Seg} label="Bow" opts=${BOW_SEG} value=${bow} onPick=${setBow} /><${Seg} label="Division" opts=${DIV_SEG} value=${div} onPick=${setDiv} /></div>
      <${CrestPick} value=${teams} onChange=${setTeams} counts=${Object.fromEntries(S.roster.teams.map(t => [t.short, all.filter(a => a.team === t.short).length]))} />
      <p class="pf-n"><b>${list.length}</b> of ${all.length} archers${any ? html` · <button type="button" class="pf-clear" onClick=${() => { setQ(''); setBow(''); setDiv(''); setTeams([]); }}>Clear filters</button>` : ''}</p>
    </div>
    ${list.length ? '' : html`<p class="empty">No archers match these filters.</p>`}
    ${CAT_ORDER.map(c => { const l = list.filter(a => a.cat === c); if (!l.length) return null;
      return html`<h2 class="hsec">${CATS[c]}</h2><div class="pgrid">${l.map(a => { const s = stats[a.id];
        return html`<a class="pcard" href=${'#/player/' + a.id} style=${`--tc:${tc(a.team)}`}><${Avatar} ar=${a} size=${52} /><span class="pc-t"><b class="pc-n" title=${a.name}>${a.name}<${AwardMark} n=${aw[a.id]} /></b>
          <span class="pc-m"><i></i><span class="pc-tm">${S.T(a.team).name || a.team}</span>${a.country ? html`<em>${a.country}</em>` : ''}</span>
          <span class="pc-s">${s ? html`<b>${f2(s.avg)}</b> avg · ${s.n} arrows` : 'No recorded arrows yet'}</span></span></a>`; })}</div>`; })}
    ${Object.keys(aw).length ? html`<p class="aw-key"><span class="aw-mark"><${Star} />2</span> means Archer of the Day, and the number is how many times. ${awardDays(S)} league days have been awarded so far. Open an archer to see which days.</p>` : ''}
  </div>`;
}

/* each match: points scored against the 10-a-arrow maximum */
function Dropped({ S, id, ms }) {
  const rows = ms.map(m => { const l = m.arrows.filter(a => a.ph === 'S' && a.a === id && (a.to || a.s != null));
    const got = l.reduce((x, a) => x + (a.to ? 0 : a.s), 0), poss = 10 * l.length; return { m, n: l.length, got, poss, drop: poss - got, to: l.filter(a => a.to).length }; }).filter(r => r.n);
  if (!rows.length) return html`<p class="empty">No recorded set arrows yet.</p>`;
  const T = rows.reduce((x, r) => ({ got: x.got + r.got, poss: x.poss + r.poss }), { got: 0, poss: 0 });
  const best = rows.slice().sort((a, b) => a.drop / a.poss - b.drop / b.poss)[0];
  return html`<div class="drops">${rows.map(r => html`<a class="drop" href=${'#/match/' + r.m.key}>
      <span class="dr-t muted small">${matchTitle(r.m)}</span>
      <span class="dr-bar" style=${`--k:${(100 * r.got / r.poss).toFixed(1)}%;--tc:${tc(S.A(id).team)}`}><i></i></span>
      <span class="dr-v"><b>−${r.drop}</b><small class="muted"> of ${r.poss}${r.to ? ` · ${r.to} not shot` : ''}</small></span></a>`)}</div>
    <p class="small">Season: <b>${T.got}</b> of a possible <b>${T.poss}</b>, so <b>${T.poss - T.got}</b> points dropped (${(10 * T.got / T.poss).toFixed(2)} an arrow). Cleanest match: ${matchTitle(best.m)}, dropping ${best.drop} of ${best.poss}.</p>`;
}

export function PlayerPage({ id }) {
  const S = app.S; const ar = S.A(id);
  const me = archers(S).find(a => a.id === id);
  const ctx = context(S).filter(o => o.a.a === id);
  const header = html`<p class="kicker"><a href="#/players">Players</a> · ${CATS[ar.cat] || ''} · ${bowOf(ar.cat)}</p>
    <section class="phero2" style=${`--tc:${tc(ar.team)}`}><${Avatar} ar=${ar} size=${96} /><div><h1>${ar.name}</h1><p class="lead"><${Team} code=${ar.team} full /> ${ar.country ? ' · ' + ar.country : ''}</p><${AwardRibbon} S=${S} id=${id} /></div></section>`;
  if (!me) return html`<div class="page">${header}<p class="empty">No recorded arrows for ${ar.name} yet. This page fills in once one of their matches is recorded in the scorebook.</p></div>`;
  const posRows = [1, 2, 3, 4, 5, 6, 7, 8].map(p => { const s = summarize(ctx.filter(o => o.pos === p)); return { x: p, y: s.n ? s.avg : null, n: s.n }; });
  const tRows = TBUCKETS.map(([, , l], i) => { const s = summarize(ctx.filter(o => bucketOf(o.a.dt) === i)); return { x: l, y: s.n ? s.avg : null, n: s.n }; });
  const best = tRows.filter(r => r.n >= 4).sort((a, b) => b.y - a.y)[0];
  const hi = summarize(ctx.filter(o => o.pi >= 55)), lo = summarize(ctx.filter(o => o.pi < 35));
  const cr = summarize(ctx.filter(o => o.clBefore != null && o.clBefore <= CRUNCH));
  const f4 = summarize(ctx.filter(o => o.pos <= 4)), l4 = summarize(ctx.filter(o => o.pos >= 5));
  const nines = ctx.filter(o => o.a.s === 9 && o.a.p); const close = nines.filter(o => radius(o.a.p) <= CLOSE9).length;
  const ms = [...new Set(ctx.map(o => o.m))];
  return html`<div class="page">${header}
    <${Tiles} items=${[[f2(me.avg), 'Arrow average', `${me.n} arrows · ${me.matches} matches${me.to ? ` · ${me.to} not shot in time (left out)` : ''}`], [pct(me.tenRate), '10s', `${me.x} X`], [me.agi != null ? me.agi.toFixed(1) : '–', 'Arrow Grouping Index (AGI)', 'higher means a tighter group'], [me.at ? f1(me.at) + ' s' : '–', 'Average time'], [me.soN ? `${me.soHits}/${me.soN}` : '–', 'Shoot-off hits']]} />
    <div class="grid2">
      <${Panel} title="Where the arrows landed" sub=${`${me.spotN || 0} spots. Dashed: the 90% group.`}>
        <div class="facewrap"><${Face} spots=${me.spots.map(p => ({ p, color: tc(ar.team) }))} ell=${me.g && me.g.ell ? me.g : null} size=${260} /></div>
        <${RingBar} dist=${me.dist} n=${me.n} /><${RingKey} />
        <p class="small">Close 9s (within a whisker of the 10): <b>${close}</b> of ${nines.length} nines.</p>
      </${Panel}>
      <${Panel} title="Best position (arrow 1–8)" sub="Average score by which arrow of the set it was.">
        <${Columns} data=${posRows} yMin=${7} yMax=${10} fmt=${f2} xLabel="Arrow of the set" color=${tc(ar.team)} tip=${d => html`<b>Arrow ${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
        <div class="kv"><span>First 4</span><b>${f2(f4.avg)}</b><span>Last 4</span><b>${f2(l4.avg)}</b></div>
      </${Panel}>
      <${Panel} title="Time taken vs score" sub=${best ? `Ideal time: ${best.x}, averaging ${f2(best.y)}.` : 'Seconds taken per arrow against the score.'}>
        <${Columns} data=${tRows} yMin=${7} yMax=${10} fmt=${f2} xLabel="Seconds taken" color=${tc(ar.team)} tip=${d => html`<b>${d.x}</b><span>${f2(d.y)} from ${d.n}</span>`} />
      </${Panel}>
      <${Panel} title="Under pressure" sub="Pressure index from time left, how close the set is and the match situation.">
        <div class="kv"><span>High pressure (55+)</span><b>${f2(hi.avg)} <small class="muted">${hi.n}</small></b><span>Low pressure (under 35)</span><b>${f2(lo.avg)} <small class="muted">${lo.n}</small></b>
          <span>Time crunch (≤${CRUNCH} s left)</span><b>${f2(cr.avg)} <small class="muted">${cr.n}</small></b><span>Average pressure faced</span><b>${f1(mean(ctx.map(o => o.pi)))}</b></div>
      </${Panel}>
    </div>
    <${Panel} title="Points dropped in each match" sub="Out of a possible 10 for every arrow the archer had to shoot in the sets. An arrow not shot in time counts as all 10 dropped here.">
      <${Dropped} S=${S} id=${id} ms=${ms} />
    </${Panel}>
    <${Panel} title="Matches">
      ${ms.map(m => { const l = ctx.filter(o => o.m === m); return html`<div class="plog"><a class="muted small" href=${'#/match/' + m.key}>${matchTitle(m)}</a><span>${l.map(o => html`<span class="schip" style=${chipStyle(o.a)} title=${`Set ${o.a.set}, arrow ${o.pos}${o.a.dt != null ? ', ' + o.a.dt + ' s' : ''}`}>${label(o.a)}</span>`)}</span><b>${f2(mean(l.map(o => o.a.s)))}</b></div>`; })}
    </${Panel}>
  </div>`;
}
