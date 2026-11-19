/* Dream team page: the best squad of 8 the recorded data can build under APL rules, its playing 4,
   who shoots which of the 8 arrows on the 120 s clock, the reasons for every pick, and the
   per-position rankings behind it. The numbers come from js/lib/dream.js. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app, cls, f1, f2, tc } from '../lib/ui.js';
import { Avatar } from '../lib/media.js';
import { CATS, CAT_ORDER } from '../lib/rules.js';
import { CLOCK } from '../lib/season.js';
import { dreamTeam, ranking, RULES, MIN, K, LATE, BUFFER } from '../lib/dream.js';
import { CAT_COL } from './rotation.js';
import { Panel, Seg } from './common.js';

const first = ar => ar.name.split(' ')[0];
const ONE = { RM: 'recurve man', RW: 'recurve woman', CM: 'compound man', CW: 'compound woman' };
const CAT_INK = { RM: '#fff', RW: '#04223a', CM: '#fff', CW: '#2b2000' };
const CatTag = ({ c }) => html`<span class="dt-cat" style=${`background:${CAT_COL[c]};color:${CAT_INK[c]}`}>${c}</span>`;
const signed = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

function Card({ a, role }) {
  const S = app.S; const ar = a.ar;
  return html`<a class=${cls('dt-card', role)} href=${'#/player/' + a.id} style=${`--tc:${tc(ar.team)};--cc:${CAT_COL[a.cat]}`}>
    <span class="dt-role">${role === 'play' ? 'Playing 4' : 'Reserve'}</span>
    <${Avatar} ar=${ar} size=${role === 'play' ? 64 : 42} />
    <span class="dt-nm"><b>${ar.name}</b><small>${S.T(ar.team).name}${a.foreign ? html` · <em class="dt-fx">Foreign · ${ar.country}</em>` : ' · India'}</small></span>
    <span class="dt-st"><span><em>${f2(a.score)}</em>rated</span><span><em>${f2(a.raw)}</em>avg</span><span><em>${f1(a.pace)}s</em>pace</span><span><em>${a.n}</em>arrows</span></span>
  </a>`;
}

/* the team's 120 s clock as one lane: a block per arrow, as wide as the seconds it takes */
function ClockLane({ set }) {
  return html`<div class="dt-lane" role="img" aria-label=${`Set plan: ${set.slots.map(s => `arrow ${s.i} ${first(s.a.ar)} ${f1(s.used)} s`).join(', ')}; ${f1(set.left)} s spare`}>
    ${set.slots.map(s => html`<div class="dt-blk" style=${`width:${(100 * s.used / CLOCK).toFixed(2)}%;background:${CAT_COL[s.cat]};color:${CAT_INK[s.cat]}`} title=${`Arrow ${s.i}: ${s.a.ar.name}, ${f1(s.used)} s, clock ${f1(s.before)} → ${f1(s.after)}`}>
      <b>${s.i}</b><small>${first(s.a.ar)}</small></div>`)}
    ${set.left > 0.2 && html`<div class="dt-spare" style=${`width:${(100 * set.left / CLOCK).toFixed(2)}%`} title=${`${f1(set.left)} s spare`}></div>`}
    <i class="dt-late" style=${`left:${(100 * (CLOCK - LATE) / CLOCK).toFixed(2)}%`}><span>last ${LATE} s</span></i>
  </div>
  <div class="dt-ticks"><span>120 s</span><span>90</span><span>60</span><span>30</span><span>0</span></div>`;
}

function Plan({ D }) {
  const set = D.set;
  return html`<div class="dt-plan">
    <${ClockLane} set=${set} />
    <ol class="dt-seq">${set.slots.map(s => html`<li style=${`--cc:${CAT_COL[s.cat]}`}>
      <span class="dt-no">${s.i}</span><${CatTag} c=${s.cat} /><a href=${'#/player/' + s.a.id}>${s.a.ar.name}</a>
      <span class="dt-clk">${f1(s.before)} → ${f1(s.after)} s</span><span class="dt-exp">${f2(s.exp)}</span></li>`)}</ol>
    <p class="muted small">Clock readings are the team's 120 s clock before and after each arrow, at each archer's own pace (with the slot effect: the first arrow of a set takes ${f1(D.R.slot[1])} s longer than average, the last ${f1(-D.R.slot[8])} s shorter). The right-hand number is the expected score of that arrow.</p>
  </div>`;
}

/* ---------- the reasons, written from the numbers ---------- */
function whySquad(D) {
  const out = [];
  CAT_ORDER.forEach(c => {
    const p = D.line[c], r = D.reserves[c]; const pool = D.pool[c];
    const sw = D.swaps.find(x => x.cat === c); const why = pool[0] === p ? `the top-rated ${ONE[c]} in the league` : r.score > p.score && sw && sw.v ? `picked ahead of ${r.ar.name}, who rates a little higher, because ${first(p.ar)}'s quicker pace (${f1(p.pace)} s against ${f1(r.pace)} s an arrow) keeps more of the set clear of the last 30 s, and the four expect ${f2(D.set.total - sw.v.total)} more a set; rated` : `the best ${ONE[c]} the squad rules allow`;
    out.push(html`<li><${CatTag} c=${c} /> <b>${p.ar.name}</b> starts: ${why} at <b>${f2(p.score)}</b> an arrow (${f2(p.raw)} raw over ${p.n} arrows${p.foreign ? `, and one of the two foreign slots` : ''}).</li>`);
    const above = pool.filter(a => a !== p && a !== r && a.score > r.score);
    out.push(html`<li class="dt-sub"><b>${r.ar.name}</b> is the reserve at <b>${f2(r.score)}</b> (${f2(r.raw)} over ${r.n} arrows, ${f1(r.pace)} s an arrow)${above.length ? html`. Rated higher but left out: ${above.map((a, i) => html`${i ? ', ' : ''}${a.ar.name} (${f2(a.score)}${a.foreign ? ', foreign, and both foreign slots are better used elsewhere' : ''})`)}` : ', the next best in the category'}.</li>`);
  });
  return out;
}
function whyForeign(D) {
  const g = D.gain.filter(x => x.d != null).sort((a, b) => b.d - a.d);
  const used = CAT_ORDER.filter(c => D.line[c].foreign || D.reserves[c].foreign);
  return html`<p>Only two foreign archers fit in the squad, so they go where they add the most over the best Indian in the same category:
    ${g.map((x, i) => html`${i ? ', ' : ''}<${CatTag} c=${x.cat} /> ${x.f.ar.name} ${signed(x.d)} over ${x.i.ar.name}`)}.
    The squad uses them in ${used.map((c, i) => html`${i ? ' and ' : ''}<${CatTag} c=${c} />`)}${used.length && g[0] && !used.includes(g[0].cat) ? ' (the bigger gain on paper loses to the full squad value once reserves and the clock count)' : ''}.</p>`;
}
function whyPlay(D) {
  const nf = CAT_ORDER.filter(c => D.line[c].foreign).length;
  const items = D.swaps.map(s => { const r = D.reserves[s.cat];
    return html`<li><${CatTag} c=${s.cat} /> <b>${D.line[s.cat].ar.name}</b> over ${r.ar.name}: ${s.v ? `swapping in ${first(r.ar)} lowers the expected set by ${f2(D.set.total - s.v.total)} points` : `${first(r.ar)} in would break the one-foreign-archer rule`}.</li>`; });
  const paper = D.paper && CAT_ORDER.some(c => D.scoreOnly[c] !== D.line[c]);
  const foreignTop = CAT_ORDER.filter(c => D.scoreOnly[c].foreign);
  return html`<ul class="dt-why">${items}
    <li>It has <b>${nf}</b> foreign archer${nf > 1 ? 's' : ''} in the four (the rule asks for at least ${RULES.foreignInPlay}).</li>
    <li>At their own paces the four need <b>${f1(D.set.natural)} s</b> of the ${CLOCK} s clock, ${D.set.hurried > 0.05 ? html`so the last arrows must hurry by <b>${f1(D.set.hurried)} s</b>, already charged in the expected score` : html`leaving <b>${f1(D.set.left)} s</b> spare, so nobody has to hurry`}.</li>
    ${!D.paper && foreignTop.length > 2 ? html`<li>The highest-rated archer in each category would be ${CAT_ORDER.map((c, i) => html`${i ? ', ' : ''}${D.scoreOnly[c].ar.name}`)}, but that is ${foreignTop.length} foreign archers, more than a squad may hold.</li>` : ''}
    ${paper ? html`<li>The four highest-rated archers (${CAT_ORDER.map((c, i) => html`${i ? ', ' : ''}${first(D.scoreOnly[c].ar)}`)}) would expect ${f2(D.paper.total)} a set${D.paper.hurried > 0.05 ? `, after hurrying ${f1(D.paper.hurried)} s` : ''}; the dream four expect ${f2(D.set.total)}.</li>` : ''}
  </ul>`;
}
function whyOrder(D) {
  const set = D.set; const last = set.slots[7].a; const lateSlots = set.slots.filter(s => s.before <= LATE);
  const four = CAT_ORDER.map(c => D.line[c]); const fastest = four.slice().sort((a, b) => a.pace - b.pace)[0];
  const R = D.R;
  return html`<ul class="dt-why">
    <li>${set.kind === 'loop' ? html`A four-arrow loop shot twice: ${set.cats.slice(0, 4).map((c, i) => html`${i ? ' → ' : ''}<${CatTag} c=${c} />`)}, then the same again, so each archer has three arrows of rest between shots.` : html`The order ${set.cats.map((c, i) => html`${i ? ' → ' : ''}<${CatTag} c=${c} />`)}.`}</li>
    <li>Only orders APL teams have actually shot are considered (${D.R.orders.length} orders shot in at least 3 recorded sets each), so the plan never asks for something the rules don't allow. No archer shoots two arrows in a row.</li>
    <li>The plan ends with <b>${f1(set.slots[7].after)} s</b> on the clock: ${f1(set.natural)} s of shooting for ${CLOCK} s, so the four use almost all of their time without anyone being rushed, and keep a few seconds in hand.</li>
    <li><b>${last.ar.name}</b> shoots the last arrow${last === fastest ? `: the fastest of the four (${f1(last.pace)} s an arrow)` : ` (${f1(last.pace)} s an arrow)`}${last.lateN ? `, and already proven with the clock low: ${last.lateN} arrows with ${LATE} s or less left, ${f2(last.lateRaw)} average against ${f2(last.raw)} overall` : ''}.</li>
    ${lateSlots.length ? html`<li>Only ${lateSlots.map((s, i) => html`${i ? ' and ' : ''}arrow ${s.i} (${first(s.a.ar)})`)} ${lateSlots.length > 1 ? 'are' : 'is'} shot in the last ${LATE} s, where the league drops ${f2(-R.latePrior)} an arrow on average.</li>` : ''}
    ${D.real && D.realSet ? html`<li>The league's most-used order (${D.real.cats.join(' ')}, ${D.real.n} of ${D.real.of} recorded sets) would expect ${f2(D.realSet.total)} with these four; this order expects <b>${f2(set.total)}</b> (${signed(set.total - D.realSet.total)}).</li>` : ''}
    <li>Hurrying costs recurve archers <b>${f2(R.rush.R.cost)}</b> points for every second faster than their own pace (${R.rush.R.n} hurried arrows), compound archers <b>${f2(R.rush.C.cost)}</b> (${R.rush.C.n}). That is why the plan keeps the recurve pace unhurried.</li>
  </ul>`;
}

/* ---------- best at each position ---------- */
function Rankings({ D }) {
  const [cat, setCat] = useState('RM'); const [by, setBy] = useState('time');
  const rows = ranking(D.R, cat, by === 'time');
  const pick = id => (D.line[cat].id === id ? 'play' : D.reserves[cat].id === id ? 'res' : '');
  return html`<div class="dt-rank">
    <div class="dt-filters">
      <div class="seg" role="radiogroup" aria-label="Category">${CAT_ORDER.map(c => html`<button type="button" role="radio" aria-checked=${cat === c} class=${cls(cat === c && 'on')} style=${`--cc:${CAT_COL[c]}`} onClick=${() => setCat(c)}><i class="dt-dot"></i>${CATS[c]}</button>`)}</div>
      <${Seg} label="Rank by" small opts=${[['time', 'Score + time'], ['score', 'Score only']]} value=${by} onPick=${setBy} />
    </div>
    <div class="tbl"><table><thead><tr><th class="n">#</th><th>Archer</th><th class="n">Arrows</th><th class="n">Avg</th><th class="n">Rated</th><th class="n">Pace</th><th class="n">Last ${LATE} s</th><th class="n">${by === 'time' ? 'Value' : 'Rated'}</th><th></th></tr></thead><tbody>
      ${rows.map((a, i) => { const p = pick(a.id); return html`<tr class=${cls(p && 'dt-on', a.n < MIN && 'dt-thin')}>
        <td class="n">${i + 1}</td>
        <td><a class="dt-who" href=${'#/player/' + a.id} style=${`--tc:${tc(a.ar.team)}`}><${Avatar} ar=${a.ar} size=${26} /><span>${a.ar.name}<small>${a.ar.team}${a.foreign ? ' · ' + a.ar.country : ''}</small></span></a></td>
        <td class="n">${a.n}</td><td class="n">${f2(a.raw)}</td><td class="n">${f2(a.score)}</td><td class="n">${f1(a.pace)} s</td>
        <td class="n">${a.lateN ? html`${f2(a.lateRaw)} <small class="muted">(${a.lateN})</small>` : html`<span class="muted">–</span>`}</td>
        <td class="n"><b>${f2(a.value)}</b></td>
        <td>${p === 'play' ? html`<span class="dt-badge">Playing</span>` : p === 'res' ? html`<span class="dt-badge res">Reserve</span>` : a.n < MIN ? html`<span class="muted small">under ${MIN} arrows</span>` : ''}</td></tr>`; })}
    </tbody></table></div>
    <p class="muted small">${by === 'time'
      ? `Value = rated score minus the time cost: every second of pace over the fair share of ${f1(CLOCK / 8)} s an arrow (120 s ÷ 8) has to be won back by teammates hurrying, at ${f2(D.R.rush[cat[0]].cost)} points a second for ${cat[0] === 'R' ? 'recurve' : 'compound'}.`
      : 'Rated score only. Pace is shown but not counted.'} Rated = points per arrow, pulled toward the ${CATS[cat].toLowerCase()} average as if each archer had already shot ${K} arrows at it, so a hot streak over a few arrows doesn't top the table. Pace is seconds per arrow with the slot effect taken out. Last ${LATE} s = average with ${LATE} s or less on the clock (arrows).</p>
  </div>`;
}

let memo = { S: null, D: null };
export function DreamTeam() {
  const S = app.S; if (memo.S !== S) memo = { S, D: dreamTeam(S) }; const D = memo.D;
  const rec = S.matches.filter(m => m.src === 'recorded').length;
  if (D.empty) return html`<div class="page"><h1 class="pt">Dream team</h1><p class="empty">Not enough recorded arrows yet to pick two archers in every category.</p></div>`;
  const nf = CAT_ORDER.reduce((x, c) => x + (D.line[c].foreign ? 1 : 0) + (D.reserves[c].foreign ? 1 : 0), 0);
  return html`<div class="page dt">
    <h1 class="pt">Dream team</h1>
    <p class="lead">The best APL squad the data can build: 8 archers under the league's squad rules, the playing 4, and who shoots each of the 8 arrows so the team uses its ${CLOCK} s clock fully. Purely from the ${rec} matches recorded arrow by arrow; it updates as more are recorded.</p>
    <div class="dt-rules">${[`Squad of ${RULES.squad}`, `${RULES.perCat} per category`, `${RULES.foreign} foreign · ${RULES.indian} Indian`, `Playing 4 with ≥ ${RULES.foreignInPlay} foreign`, `${RULES.arrows} arrows each a set`, `${CLOCK} s per team per set`, `${RULES.subs} substitutions`].map(t => html`<span>${t}</span>`)}</div>

    <${Panel} title="The squad" sub="Top row is the playing 4, bottom row the reserves. Tap an archer for their profile.">
      <div class="dt-grid">${CAT_ORDER.map(c => html`<div class="dt-col" style=${`--cc:${CAT_COL[c]}`}>
        <h3><${CatTag} c=${c} /> ${CATS[c]}</h3>
        <${Card} a=${D.line[c]} role="play" /><${Card} a=${D.reserves[c]} role="res" /></div>`)}</div>
      <div class="dt-tiles">
        <div><em>${f2(D.set.total)}</em><span>expected set total</span><small>${D.avgSet ? `real teams average ${f1(D.avgSet.avg)} (best ${D.avgSet.best})` : ''}</small></div>
        <div><em>${f1(D.set.natural)} s</em><span>of the ${CLOCK} s clock</span><small>${f1(D.set.left)} s spare, keeps ≥ ${BUFFER} s</small></div>
        <div><em>${nf} + ${RULES.squad - nf}</em><span>foreign + Indian</span><small>${CAT_ORDER.filter(c => D.line[c].foreign).length} foreign in the playing 4</small></div>
      </div>
    </${Panel}>

    <${Panel} title="Who shoots when" sub=${`The playing 4 on one set's ${CLOCK} s clock, arrow by arrow.`}><${Plan} D=${D} /></${Panel}>

    <${Panel} title="Why these 8 archers">
      <ul class="dt-why">${whySquad(D)}</ul>
      ${whyForeign(D)}
    </${Panel}>
    <${Panel} title="Why this playing 4">${whyPlay(D)}</${Panel}>
    <${Panel} title="Why this order">${whyOrder(D)}</${Panel}>

    <${Panel} title="Best at each position" sub="Every archer of one category, ranked. The dream team's picks are lit."><${Rankings} D=${D} /></${Panel}>

    <${Panel} title="How it's worked out">
      <ul class="dt-why small">
        <li>Recorded matches only (the TV scoreboard read doesn't say who shot). Recurve and compound, men and women, are rated only against their own category.</li>
        <li>Every squad that keeps the rules is tried (the top 6 in each category, two each, exactly ${RULES.foreign} foreign). For each, every playing 4 with a foreign archer is played out over every shooting order APL teams have actually used (${D.R.orders.length} orders, each shot in at least 3 recorded sets; no archer ever shoots twice in a row). The squad with the best expected set wins, with a small extra credit for strong reserves, since ${RULES.subs} substitutions are allowed.</li>
        <li>An archer needs ${MIN} arrows to be picked. Time-outs count as 0. A plan keeps ${BUFFER} s in hand; any extra time the four need is taken off the last arrows, which lose points at the measured hurry cost.</li>
      </ul>
    </${Panel}>
  </div>`;
}
