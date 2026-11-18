/* News ticker under the header: a loop of headline numbers worked out from the live data.
   Recurve and compound are always reported separately. Each item links to where the number comes from. */
import { html } from '../../vendor/preact-htm.js';
import { archers, records, standings } from '../lib/season.js';
import { f1, f2, tc } from '../lib/ui.js';
import * as I from '../lib/insights.js';

const first = n => String(n || '').split(' ')[0];

export function facts(S) {
  const out = []; const add = (tag, text, href, color) => out.push({ tag, text, href, color });
  const ar = archers(S); const ctx = I.context(S);
  const st = standings(S); if (st[0]) add('Table', `${S.T(st[0].t).name} top the league on ${st[0].Pts} points`, '#/', tc(st[0].t));
  I.BOWS.forEach(([b]) => {
    const l = ar.filter(a => I.bowOf(a.ar.cat) === b && a.n >= 16); const bk = b[0];
    const top = l.slice().sort((x, y) => y.avg - x.avg)[0];
    if (top) add(b, `${top.ar.name} leads the ${b.toLowerCase()} average at ${f2(top.avg)}`, '#/player/' + top.id, tc(top.ar.team));
    const agi = l.filter(a => a.agi != null).sort((x, y) => y.agi - x.agi)[0];
    if (agi) add(b, `Tightest ${b.toLowerCase()} group: ${agi.ar.name}, AGI ${agi.agi.toFixed(1)}`, '#/player/' + agi.id, tc(agi.ar.team));
    const xs = l.slice().sort((x, y) => y.x - x.x)[0];
    if (xs && xs.x) add(b, `Most Xs in ${b.toLowerCase()}: ${xs.ar.name} with ${xs.x}`, '#/player/' + xs.id, tc(xs.ar.team));
    const fast = l.filter(a => a.tn >= 16).sort((x, y) => x.at - y.at)[0];
    if (fast) add('Clock', `Quickest ${b.toLowerCase()} archer: ${fast.ar.name}, ${f1(fast.at)} s an arrow`, '#/analytics/time/' + bk, tc(fast.ar.team));
    const c = I.ofBow(ctx, b);
    const rise = I.pressure(c, o => o.a.a).filter(r => r.lift != null && r.hi.n >= 4).sort((x, y) => y.lift - x.lift)[0];
    if (rise && rise.lift > 0) add('Pressure', `${S.A(rise.k).name} scores ${f2(rise.lift)} more under high pressure`, '#/analytics/pressure/' + bk, tc(S.A(rise.k).team));
    const c9 = I.close9s(c)[0];
    if (c9 && c9.close >= 2) add('So close', `${S.A(c9.id).name} has ${c9.close} nines that just missed the 10`, '#/analytics/pressure/' + bk, tc(S.A(c9.id).team));
  });
  const r = records(S);
  if (r.bestSet) add('Record', `Best set so far: ${r.bestSet.tot} by ${S.T(r.bestSet.code).name} against ${r.bestSet.oppCode}`, '#/match/' + r.bestSet.m.key, tc(r.bestSet.code));
  if (r.perfect.length) add('Perfect', `${r.perfect.length} perfect 80 set${r.perfect.length > 1 ? 's' : ''} this season`, '#/match/' + r.perfect[0].m.key, '#f5c518');
  const hot = ctx.filter(o => o.a.a).sort((x, y) => y.pi - x.pi)[0];
  if (hot) add('Pressure', `Highest-pressure arrow: ${first(S.A(hot.a.a).name)} shot a ${hot.a.s} at pressure ${hot.pi}`, '#/match/' + hot.m.key, tc(hot.code));
  const so = I.shootOffs(S).teams.sort((x, y) => y.won - x.won || y.so - x.so)[0];
  if (so && so.won) add('Shoot-off', `${S.T(so.t).name} have won ${so.won} of ${so.so} shoot-offs`, '#/analytics/comebacks', tc(so.t));
  const cb = I.comebacks(S).sort((x, y) => y.won4 - x.won4)[0];
  if (cb && cb.won4) add('Comeback', `${S.T(cb.t).name} won ${cb.won4} sets from behind at halfway`, '#/analytics/comebacks', tc(cb.t));
  const rec = S.matches.filter(m => m.src === 'recorded').length;
  add('Data', `${rec} of ${S.matches.length} matches recorded arrow by arrow`, '#/ideas', '#95a2b6');
  // interleave so the same tag doesn't run back to back
  return [0, 1, 2].flatMap(k => out.filter((_, i) => i % 3 === k));
}

export function Ticker({ S }) {
  const list = facts(S); if (!list.length) return null;
  const run = list.map(f => html`<a class="tk-i" href=${f.href} onClick=${e => e.currentTarget.blur()}><b style=${`--c:${f.color}`}>${f.tag}</b>${f.text}</a>`);
  return html`<div class="ticker" aria-label="Season headlines"><div class="tk-track" style=${`--dur:${Math.max(40, list.length * 7)}s`}>${run}<span aria-hidden="true" class="tk-dup">${run}</span></div></div>`;
}
