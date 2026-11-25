/* Dream team: the best APL squad the recorded data can build, following the league's rules.
   Pure functions over the built season (season.js); nothing here touches the page.

   APL rules used (Season 2):
   - a squad of 8: 2 recurve men, 2 recurve women, 2 compound men, 2 compound women;
   - 2 foreign archers (1 man and 1 woman) and 6 Indian archers in the squad;
   - a playing 4 (one per category) with at least 1 foreign archer, each shooting 2 arrows a set;
   - each team has 120 seconds on its clock for its 8 arrows; 2 substitutions a match.

   How an archer is rated (recurve and compound never mixed, every number is per category):
   - score: points per arrow, pulled toward the category average when the sample is small
     (as if every archer had already shot K arrows at the category average), time-outs count 0;
   - pace: seconds per arrow, with the slot effect taken out (the 1st arrow of a set includes the walk-up,
     the last ones are hurried), pulled toward the category pace the same way;
   - rush cost: how many points an arrow loses per second it is shot faster than the archer's own pace,
     measured per bow from every recorded arrow;
   - late clock: how the archer scores with 30 s or less left, against their own average (shrunk to 0).

   The playing 4 and arrow order are judged as a whole set: every possible order the teams use
   (a four-arrow loop shot twice, or two pairs that alternate) is played out on the 120 s clock.
   If the archers' natural paces need more than the clock gives, the last arrows must hurry and lose
   points at the measured rush cost. The best squad is the one whose best playing 4 scores the most,
   with a small credit for strong reserves (two substitutions are allowed). */
import { CLOCK, positions, scored } from './season.js';
import { CAT_ORDER, CATS } from './rules.js';

export const RULES = { squad: 8, perCat: 2, foreign: 2, foreignMen: 1, foreignWomen: 1, indian: 6, play: 4, foreignInPlay: 1, arrows: 2, clock: CLOCK, subs: 2 };
export const K = 12;          // prior arrows for the score
const KT = 8;                  // prior arrows for the pace
const KL = 8;                  // prior arrows for the late-clock effect
export const MIN = 10;         // arrows an archer needs to be picked
export const LATE = 30;        // "late clock": this many seconds or fewer left before the arrow
export const BUFFER = 2;       // seconds a plan keeps in hand at the end of the set
const MAX_RUSH = 4;            // seconds one arrow can be hurried by
const RESERVE_W = 0.25;        // weight of the reserves' strength when choosing the squad
const foreign = ar => !!(ar && ar.country);
const bowOf = cat => (cat && cat[0] === 'C' ? 'C' : 'R');
const mean = l => (l.length ? l.reduce((x, v) => x + v, 0) / l.length : null);

/* ---------- per-archer numbers ---------- */
export function rate(S) {
  const rows = [];
  S.matches.forEach(m => {
    if (m.src !== 'recorded') return; const pos = positions(m); const last = {};
    m.arrows.forEach(a => {
      if (a.ph !== 'S') return; const k = a.set + a.t; const p = pos.get(a);
      const before = last[k] !== undefined ? last[k] : p === 1 ? CLOCK : null;
      last[k] = a.cl != null ? a.cl : null;
      if (!a.a) return; const ar = S.A(a.a); if (!ar.cat) return;
      if (a.to) { rows.push({ id: a.a, mk: m.key, cat: ar.cat, p, s: 0, dt: null, before, to: true }); return; }
      if (scored(a)) rows.push({ id: a.a, mk: m.key, cat: ar.cat, p, s: a.s, dt: a.dt, before, to: false });
    });
  });
  // slot effect on time: how much longer or shorter the n-th arrow of a set takes than the average arrow
  const timed = rows.filter(r => r.dt != null); const all = mean(timed.map(r => r.dt)) || CLOCK / 8;
  const slot = {}; for (let p = 1; p <= 8; p++) { const l = timed.filter(r => r.p === p).map(r => r.dt); slot[p] = l.length >= 8 ? mean(l) - all : 0; }
  rows.forEach(r => { r.adj = r.dt != null ? r.dt - slot[r.p] : null; });

  const by = {}; rows.forEach(r => { (by[r.id] = by[r.id] || []).push(r); });
  const cat = {}; CAT_ORDER.forEach(c => {
    const l = rows.filter(r => r.cat === c);
    cat[c] = { score: mean(l.map(r => r.s)), pace: mean(l.filter(r => r.adj != null).map(r => r.adj)), n: l.length };
  });

  // rush cost per bow: points lost per second shot faster than the archer's own pace
  const own = {}; Object.entries(by).forEach(([id, l]) => { own[id] = { s: mean(l.map(r => r.s)), t: mean(l.filter(r => r.adj != null).map(r => r.adj)) }; });
  const rush = {}; ['R', 'C'].forEach(b => {
    let lost = 0, secs = 0, n = 0;
    rows.forEach(r => { if (bowOf(r.cat) !== b || r.adj == null || r.to) return; const o = own[r.id]; const d = o.t - r.adj; if (d >= 1.5) { lost += o.s - r.s; secs += d; n++; } });
    rush[b] = { n, secs: n ? secs / n : 0, cost: secs ? Math.max(0, Math.min(0.6, lost / secs)) : 0 };
  });

  // the league-wide late-clock effect: an archer with few late arrows is assumed to be average at it
  const lateAll = rows.filter(r => r.before != null && r.before <= LATE).map(r => r.s - own[r.id].s);
  const latePrior = lateAll.length ? mean(lateAll) : 0;
  const A = Object.entries(by).map(([id, l]) => {
    const ar = S.A(id); const c = ar.cat; const C = cat[c];
    const n = l.length, sum = l.reduce((x, r) => x + r.s, 0), raw = sum / n;
    const t = l.filter(r => r.adj != null).map(r => r.adj);
    const pace = (t.reduce((x, v) => x + v, 0) + KT * C.pace) / (t.length + KT);
    const sd = t.length > 2 ? Math.sqrt(t.reduce((x, v) => x + (v - mean(t)) ** 2, 0) / (t.length - 1)) : null;
    const late = l.filter(r => r.before != null && r.before <= LATE);
    const lateDelta = (late.reduce((x, r) => x + (r.s - raw), 0) + KL * latePrior) / (late.length + KL);
    return {
      id, ar, cat: c, bow: bowOf(c), foreign: foreign(ar), n, raw, tens: l.filter(r => r.s === 10).length, to: l.filter(r => r.to).length,
      score: (sum + K * C.score) / (n + K), tn: t.length, rawPace: mean(t), pace, sd, lateN: late.length, lateRaw: mean(late.map(r => r.s)), lateDelta,
      matches: new Set(l.map(r => r.mk)).size
    };
  });
  return { archers: A, cat, slot, rush, all, latePrior, lateN: lateAll.length };
}

/* ---------- shooting orders: every pattern of 8 arrows the teams use ---------- */
function perms(l) { if (l.length <= 1) return [l]; const out = []; l.forEach((x, i) => perms(l.slice(0, i).concat(l.slice(i + 1))).forEach(p => out.push([x, ...p]))); return out; }
/* one archer never shoots two arrows in a row */
export const legal = cats => cats.length === 8 && cats.every((c, i) => i === 0 || c !== cats[i - 1]) && CAT_ORDER.every(c => cats.filter(x => x === c).length === 2);
export const ORDERS = (() => {
  const out = []; const seen = new Set(); const add = (o, kind) => { const k = o.join(' '); if (!seen.has(k)) { seen.add(k); out.push({ cats: o, kind }); } };
  perms(CAT_ORDER).forEach(p => add([...p, ...p], 'loop'));
  perms(CAT_ORDER).forEach(([a, b, c, d]) => add([a, b, a, b, c, d, c, d], 'mixed'));
  return out.filter(o => legal(o.cats));
})();

/* play one set out on the clock: who shoots when, the clock before each arrow, how much each arrow is hurried */
export function playSet(line, cats, R) {
  if (!legal(cats)) throw new Error('order has one archer shooting twice in a row: ' + cats.join(' '));
  const who = c => line[c];
  const nat = cats.map((c, i) => Math.max(4, who(c).pace + (R.slot[i + 1] || 0)));
  const T = nat.reduce((x, v) => x + v, 0);
  let over = Math.max(0, T - (CLOCK - BUFFER));
  const hurry = cats.map(() => 0);
  for (let i = 7; i >= 0 && over > 0; i--) { const h = Math.min(MAX_RUSH, over); hurry[i] = h; over -= h; }
  let clock = CLOCK; let total = 0;
  const slots = cats.map((c, i) => {
    const a = who(c); const before = clock; const used = nat[i] - hurry[i]; clock = Math.max(0, clock - used);
    const late = before <= LATE ? a.lateDelta : 0; const cost = hurry[i] * R.rush[a.bow].cost;
    const exp = a.score + late - cost; total += exp;
    return { i: i + 1, cat: c, a, before, after: clock, used, hurry: hurry[i], late, cost, exp };
  });
  // anything still over after every arrow was hurried as much as it can be is a time-out: the last arrow scores 0
  if (over > 0) { const s = slots[7]; total -= s.exp; s.exp = 0; s.timeout = true; }
  return { cats, slots, total, natural: T, left: Math.max(0, CLOCK - T), hurried: hurry.reduce((x, v) => x + v, 0) };
}
/* the order with the highest expected set total; on a tie, the steadier pair of hands on the last two arrows */
const kindOf = cats => (cats.slice(0, 4).join() === cats.slice(4).join() ? 'loop' : 'mixed');
/* the orders APL teams have actually shot in recorded sets (so every one is known to be allowed) */
export function usedOrders(S) {
  const cnt = {};
  S.matches.forEach(m => { if (m.src !== 'recorded') return; ['A', 'B'].forEach(t => { for (let n = 1; n <= 4; n++) {
    const l = m.arrows.filter(a => a.ph === 'S' && a.set === n && a.t === t);
    if (l.length !== 8 || l.some(a => !a.a || !S.A(a.a).cat)) continue; const k = l.map(a => S.A(a.a).cat).join(' '); cnt[k] = (cnt[k] || 0) + 1; } }); });
  return Object.entries(cnt).map(([k, n]) => ({ cats: k.split(' '), n, kind: kindOf(k.split(' ')) })).filter(o => legal(o.cats)).sort((a, b) => b.n - a.n);
}
export function bestOrder(line, R) {
  let best = null;
  ORDERS.forEach(o => {
    const r = playSet(line, o.cats, R); r.kind = o.kind;
    r.risk = r.slots.slice(6).reduce((x, s) => x + (s.a.sd || 3), 0);
    if (!best || r.total > best.total + 0.005 || (Math.abs(r.total - best.total) <= 0.005 && r.risk < best.risk)) best = r;
  });
  return best;
}

/* ---------- the dream team ---------- */
export function dreamTeam(S) {
  const R = rate(S); R.orders = ORDERS; R.used = usedOrders(S);
  const pool = {}; CAT_ORDER.forEach(c => {
    const l = R.archers.filter(a => a.cat === c).sort((x, y) => y.score - x.score);
    const ok = l.filter(a => a.n >= MIN); pool[c] = (ok.length >= 2 ? ok : l.filter(a => a.n >= 4)).slice(0, 6);
  });
  if (CAT_ORDER.some(c => pool[c].length < 2)) return { R, pool, empty: true };

  // every playing 4 (one per category) with its best order
  const memo = new Map();
  const lineVal = (l) => { const k = CAT_ORDER.map(c => l[c].id).join('|'); if (!memo.has(k)) memo.set(k, bestOrder(l, R)); return memo.get(k); };

  const pairs = c => { const l = pool[c], out = []; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) out.push([l[i], l[j]]); return out; };
  const P = CAT_ORDER.map(pairs);
  let best = null;
  P[0].forEach(p0 => P[1].forEach(p1 => P[2].forEach(p2 => P[3].forEach(p3 => {
    const ps = [p0, p1, p2, p3]; const nf = ps.reduce((x, p) => x + p.filter(a => a.foreign).length, 0);
    if (nf !== RULES.foreign) return;
    // one foreign man and one foreign woman (categories ending in M or W)
    const fm = ps.reduce((x, p) => x + p.filter(a => a.foreign && a.cat[1] === 'M').length, 0);
    if (fm !== RULES.foreignMen || nf - fm !== RULES.foreignWomen) return;
    let top = null;
    for (let m = 0; m < 16; m++) {
      const l = {}; CAT_ORDER.forEach((c, i) => { l[c] = ps[i][(m >> i) & 1]; });
      if (CAT_ORDER.filter(c => l[c].foreign).length < RULES.foreignInPlay) continue;
      const v = lineVal(l); if (!top || v.total > top.v.total) top = { l, v };
    }
    if (!top) return;
    const res = CAT_ORDER.map((c, i) => ps[i].find(a => a !== top.l[c]));
    const value = top.v.total + RESERVE_W * res.reduce((x, a) => x + 2 * a.score, 0);
    if (!best || value > best.value) best = { value, line: top.l, set: top.v, reserves: Object.fromEntries(CAT_ORDER.map((c, i) => [c, res[i]])) };
  }))));
  if (!best) return { R, pool, empty: true };

  // comparisons for the reasons: the most-used real order, the best line on score alone, every swap
  const real = commonOrder(S);
  const realSet = real && legal(real.cats) ? playSet(best.line, real.cats, R) : null;
  const scoreOnly = {}; CAT_ORDER.forEach(c => { scoreOnly[c] = pool[c][0]; });
  const nfS = CAT_ORDER.filter(c => scoreOnly[c].foreign).length;
  const paper = nfS >= 1 && nfS <= 2 ? lineVal(scoreOnly) : null;
  const swaps = CAT_ORDER.map(c => { const l = Object.assign({}, best.line, { [c]: best.reserves[c] });
    const ok = CAT_ORDER.filter(k => l[k].foreign).length >= 1; return { cat: c, ok, v: ok ? lineVal(l) : null }; });
  // the foreign slots: what each category's best foreign archer adds over its best Indian
  const gain = CAT_ORDER.map(c => { const f = pool[c].find(a => a.foreign), i = pool[c].find(a => !a.foreign); return { cat: c, f, i, d: f && i ? f.score - i.score : null }; });
  const avgSet = teamSetAverage(S);
  return { R, pool, ...best, real, realSet, paper, scoreOnly, swaps, gain, avgSet };
}

/* the order the league shoots most: a list of 8 categories */
export function commonOrder(S) {
  const cnt = {};
  S.matches.forEach(m => { if (m.src !== 'recorded') return; ['A', 'B'].forEach(t => { for (let n = 1; n <= 4; n++) {
    const l = m.arrows.filter(a => a.ph === 'S' && a.set === n && a.t === t);
    if (l.length !== 8 || l.some(a => !a.a || !S.A(a.a).cat)) continue; const k = l.map(a => S.A(a.a).cat).join(' '); cnt[k] = (cnt[k] || 0) + 1; } }); });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  return top ? { cats: top[0].split(' '), n: top[1], of: Object.values(cnt).reduce((x, v) => x + v, 0) } : null;
}
/* the average 8-arrow set total of a real team, from recorded matches */
function teamSetAverage(S) {
  const l = []; S.matches.forEach(m => { if (m.src !== 'recorded') return; m.sets.forEach(st => ['A', 'B'].forEach(t => { if (st.cnt[t] >= 8) l.push(st.tot[t]); })); });
  return l.length ? { avg: mean(l), best: Math.max(...l), n: l.length } : null;
}

/* ranking for one category: by score, or by score with slow pace charged at the bow's rush cost */
export function ranking(R, cat, withTime) {
  const fair = CLOCK / 8; const cost = R.rush[bowOf(cat)].cost;
  return R.archers.filter(a => a.cat === cat).map(a => Object.assign({}, a, { value: withTime ? a.score - cost * Math.max(0, a.pace - fair) : a.score }))
    .sort((x, y) => (y.n >= 4) - (x.n >= 4) || y.value - x.value);
}
export const catName = c => CATS[c];
