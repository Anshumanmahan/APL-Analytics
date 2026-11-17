/* APL Analytics — the numbers behind each idea on the "APL Analytics Ideas" list.
   Pure functions over the built season (season.js). Everything copes with partial data:
   archer-level numbers use only matches recorded in the scorebook, team-level numbers
   also use the TV scoreboard read. */
import { scored, positions, summarize, CLOCK } from './season.js';

export const mean = l => (l.length ? l.reduce((x, v) => x + v, 0) / l.length : null);
export const sd = l => { const m = mean(l); return l.length > 1 ? Math.sqrt(l.reduce((x, v) => x + (v - m) ** 2, 0) / (l.length - 1)) : null; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const bowOf = cat => (cat && cat[0] === 'C' ? 'Compound' : cat && cat[0] === 'R' ? 'Recurve' : '');
/* recurve and compound are never averaged or ranked together */
export const BOWS = [['Recurve', 'Recurve'], ['Compound', 'Compound']];
export const ofBow = (ctx, b) => ctx.filter(o => o.bow === b);
export const radius = p => (p ? Math.hypot(p[0], p[1]) : null);
/* a 9 that only just missed the 10 line (the 10 ring ends at 0.1 of the face radius) */
export const CLOSE9 = 0.115;

/* ---------- every set arrow with its situation ----------
   pos: 1st to 8th arrow of the team's set; clBefore: seconds left on the team's clock when it was shot;
   diff: team's running set total minus the opponent's at that moment; pf/pa: set points before the set;
   pi: pressure index 0–100 (time per arrow left, how close the set is late on, and what the match is worth). */
export function context(S, { recordedOnly = false } = {}) {
  const out = [];
  S.matches.forEach(m => {
    if (!m.arrows.length || (recordedOnly && m.src !== 'recorded')) return;
    const pos = positions(m);
    const pts = { A: 0, B: 0 }; const setPts = {};
    m.sets.forEach(st => { setPts[st.n] = { A: pts.A, B: pts.B }; if (st.full) { pts.A += st.pts.A; pts.B += st.pts.B; } });
    const run = {}; const lastCl = {};
    m.arrows.forEach(a => {
      if (a.ph !== 'S') return;
      const k = a.set + a.t, ko = a.set + (a.t === 'A' ? 'B' : 'A');
      run[k] = run[k] || 0; run[ko] = run[ko] || 0;
      const p = pos.get(a); const o = a.t === 'A' ? 'B' : 'A';
      const clBefore = a.cl != null && a.dt != null ? a.cl + a.dt : lastCl[k] != null ? lastCl[k] : p === 1 ? CLOCK : null;
      const diff = run[k] - run[ko];
      const sp = setPts[a.set] || { A: 0, B: 0 };
      const left = 9 - p;
      const tp = clBefore == null ? 0.3 : clamp((20 - clBefore / left) / 15, 0, 1);
      const cp = clamp(1 - Math.abs(diff) / 10, 0, 1) * (0.4 + 0.6 * (p - 1) / 7);
      const mp = clamp(Math.max(sp[a.t], sp[o]) / 4, 0.15, 1);
      const it = { a, m, bow: a.a ? bowOf(S.A(a.a).cat) : null, code: m.teams[a.t], opp: m.teams[o], side: a.t, pos: p, clBefore, diff, pf: sp[a.t], pa: sp[o], pi: Math.round(100 * (0.35 * tp + 0.4 * cp + 0.25 * mp)) };
      if (scored(a)) out.push(it);
      if (a.s != null && !a.to) run[k] += a.s;
      if (a.cl != null) lastCl[k] = a.cl;
    });
  });
  return out;
}

/* group items by a key and summarize, dropping small groups */
export function groupBy(list, keyFn, min = 1) {
  const g = {};
  list.forEach(o => { const k = keyFn(o); if (k == null) return; (g[k] = g[k] || []).push(o); });
  return Object.entries(g).map(([k, l]) => Object.assign({ k, list: l }, summarize(l))).filter(x => x.n >= min);
}

/* ---------- position 1–8: who is best at which arrow ---------- */
export function byPosition(ctx, min = 3) {
  const rows = [];
  for (let p = 1; p <= 8; p++) {
    const l = ctx.filter(o => o.pos === p && o.a.a);
    const arch = groupBy(l, o => o.a.a, min).sort((x, y) => y.avg - x.avg);
    rows.push({ pos: p, all: summarize(l), best: arch.slice(0, 3) });
  }
  return rows;
}

/* ---------- time taken vs score ---------- */
export const TBUCKETS = [[0, 8, 'under 8 s'], [8, 12, '8–12 s'], [12, 16, '12–16 s'], [16, 20, '16–20 s'], [20, 25, '20–25 s'], [25, 999, '25 s +']];
export const bucketOf = dt => (dt == null ? null : TBUCKETS.findIndex(([a, b]) => dt >= a && dt < b));
export function timeVsScore(ctx) {
  return TBUCKETS.map(([a, b, label], i) => { const l = ctx.filter(o => bucketOf(o.a.dt) === i); return Object.assign({ label, i }, summarize(l)); });
}
/* each archer's best time window (the "ideal time" to shoot) */
export function idealTime(ctx, min = 4) {
  const by = groupBy(ctx.filter(o => o.a.a && o.a.dt != null), o => o.a.a, 8);
  return by.map(g => {
    const w = TBUCKETS.map(([, , label], i) => Object.assign({ label, i }, summarize(g.list.filter(o => bucketOf(o.a.dt) === i)))).filter(x => x.n >= min);
    const best = w.slice().sort((x, y) => y.avg - x.avg)[0];
    return { id: g.k, n: g.n, avg: g.avg, at: g.at, best, windows: w };
  }).filter(x => x.best);
}
/* best archer in each time window */
export function bestInWindow(ctx, min = 4) {
  return TBUCKETS.map(([, , label], i) => {
    const l = ctx.filter(o => o.a.a && bucketOf(o.a.dt) === i);
    return { label, best: groupBy(l, o => o.a.a, min).sort((x, y) => y.avg - x.avg).slice(0, 3), n: l.length };
  });
}
/* time crunch: shot with 15 s or less left on the clock */
export const CRUNCH = 15;
export function crunch(ctx, key, min = 3) {
  const l = ctx.filter(o => o.clBefore != null && o.clBefore <= CRUNCH);
  return groupBy(l, key, min).map(g => Object.assign(g, { rest: summarize(ctx.filter(o => key(o) === g.k && !(o.clBefore != null && o.clBefore <= CRUNCH))) })).sort((x, y) => y.n - x.n);
}
/* efficiency: points per second of clock used */
export function efficiency(ctx, key, min = 8) {
  return groupBy(ctx.filter(o => o.a.dt != null), key, min).map(g => Object.assign(g, { pps: g.at ? g.avg / g.at : null })).sort((x, y) => y.pps - x.pps);
}

/* ---------- pressure ---------- */
export const PBANDS = [[0, 35, 'Low'], [35, 55, 'Medium'], [55, 101, 'High']];
export function pressure(ctx, key, min = 3) {
  return groupBy(ctx, key, 8).map(g => {
    const hi = summarize(g.list.filter(o => o.pi >= 55)), lo = summarize(g.list.filter(o => o.pi < 35));
    return Object.assign(g, { hi, lo, lift: hi.n >= min && lo.n >= min ? hi.avg - lo.avg : null });
  });
}
/* crucial arrows: the last two of a set while it is within 3 points */
export const isCrucial = o => o.pos >= 7 && Math.abs(o.diff) <= 3;

/* ---------- first 4 vs last 4 arrows of the set ---------- */
export function halves(ctx, key, min = 4) {
  return groupBy(ctx, key, min * 2).map(g => {
    const f = summarize(g.list.filter(o => o.pos <= 4)), l = summarize(g.list.filter(o => o.pos >= 5));
    return Object.assign(g, { first: f, last: l, delta: f.n && l.n ? l.avg - f.avg : null });
  });
}
/* last 2 arrows: how much time was left for them, and what they scored */
export function lastTwo(ctx) {
  const by = {};
  ctx.forEach(o => { if (o.pos < 7) return; const k = o.m.key + o.a.set + o.side; (by[k] = by[k] || []).push(o); });
  const rows = Object.values(by).filter(l => l.length === 2 && l[0].bow && l[0].bow === l[1].bow).map(l => { const first = l.find(o => o.pos === 7); return { left: first.clBefore, sum: l[0].a.s + l[1].a.s, code: first.code }; }).filter(r => r.left != null);
  const B = [[0, 15, 'under 15 s'], [15, 25, '15–25 s'], [25, 35, '25–35 s'], [35, 50, '35–50 s'], [50, 999, '50 s +']];
  return B.map(([a, b, label]) => { const l = rows.filter(r => r.left >= a && r.left < b); return { label, n: l.length, avg: mean(l.map(r => r.sum)) }; });
}

/* ---------- close 9s ---------- */
export function close9s(ctx, min = 1) {
  const l = ctx.filter(o => o.a.s === 9 && o.a.p && o.a.a);
  return groupBy(l, o => o.a.a, min).map(g => { const c = g.list.filter(o => radius(o.a.p) <= CLOSE9).length; return { id: g.k, nines: g.n, close: c, share: g.n ? c / g.n : null }; }).sort((x, y) => y.close - x.close || y.share - x.share);
}

/* ---------- comebacks: sets won from behind ---------- */
export function comebacks(S) {
  const rows = {}; const add = (t, k) => { rows[t] = rows[t] || { t, behind4: 0, won4: 0, behind6: 0, won6: 0, matchBehind: 0, matchWon: 0 }; rows[t][k]++; };
  S.matches.forEach(m => {
    if (!m.arrows.length) return;
    const pos = positions(m);
    m.sets.forEach(st => {
      if (!st.full) return;
      ['A', 'B'].forEach(k => {
        const o = k === 'A' ? 'B' : 'A';
        const after = n => { const sum = t => m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === t && pos.get(a) <= n).reduce((x, a) => x + (a.s || 0), 0); return sum(k) - sum(o); };
        const won = st.tot[k] > st.tot[o];
        if (after(4) < 0) { add(m.teams[k], 'behind4'); if (won) add(m.teams[k], 'won4'); }
        if (after(6) < 0) { add(m.teams[k], 'behind6'); if (won) add(m.teams[k], 'won6'); }
      });
    });
    // matches won after being behind on set points at some point
    if (m.sp) ['A', 'B'].forEach(k => {
      const o = k === 'A' ? 'B' : 'A'; let pk = 0, po = 0, behind = false;
      m.sets.forEach(st => { if (!st.full) return; pk += st.pts[k]; po += st.pts[o]; if (pk < po) behind = true; });
      if (behind) { add(m.teams[k], 'matchBehind'); if (m.win === m.teams[k]) add(m.teams[k], 'matchWon'); }
    });
  });
  return Object.values(rows);
}

/* ---------- shoot-offs ---------- */
export function shootOffs(S) {
  const team = {}, arch = {};
  const T = t => (team[t] = team[t] || { t, so: 0, won: 0, arrows: 0, hits: 0 });
  S.matches.filter(m => m.so).forEach(m => { ['A', 'B'].forEach(k => { const o = T(m.teams[k]); o.so++; if (m.win === m.teams[k]) o.won++; }); });
  S.matches.forEach(m => m.soArrows.forEach(a => {
    const o = T(m.teams[a.t]); o.arrows++; if (a.h) o.hits++;
    if (a.a) { const x = arch[a.a] = arch[a.a] || { id: a.a, n: 0, hits: 0 }; x.n++; if (a.h) x.hits++; }
  }));
  return { teams: Object.values(team).sort((a, b) => b.so - a.so), archers: Object.values(arch).sort((a, b) => b.hits - a.hits || b.n - a.n), total: S.matches.filter(m => m.so).length };
}

/* ---------- substitutes: archers who were not in the set-1 line-up ---------- */
export function substitutes(S, ctx) {
  const subOf = new Map();
  S.matches.forEach(m => {
    const L = m.lineups || {}; const first = L[1] || {};
    ['A', 'B'].forEach(k => { const start = new Set(first[k] || []); m.arrows.forEach(a => { if (a.a && a.t === k && start.size && !start.has(a.a)) subOf.set(m.key + '|' + a.a, true); }); });
  });
  const l = ctx.filter(o => o.a.a && subOf.has(o.m.key + '|' + o.a.a));
  return groupBy(l, o => o.a.a, 1).map(g => Object.assign(g, { apps: new Set(g.list.map(o => o.m.key)).size })).sort((x, y) => y.avg - x.avg);
}

/* ---------- strategy: who shot when ---------- */
export function shootingOrder(S, code) {
  const grid = {}; const sets = [];
  S.matches.forEach(m => {
    if (m.src !== 'recorded') return; const k = m.teams.A === code ? 'A' : m.teams.B === code ? 'B' : null; if (!k) return;
    const pos = positions(m);
    for (let n = 1; n <= 4; n++) {
      const l = m.arrows.filter(a => a.ph === 'S' && a.set === n && a.t === k);
      if (!l.length) continue;
      sets.push({ m, n, order: l.map(a => a.a) });
      l.forEach(a => { if (!a.a) return; const p = pos.get(a); grid[a.a] = grid[a.a] || Array(9).fill(0); grid[a.a][p]++; });
    }
  });
  return { grid, sets };
}

/* ---------- predictability: how steady a team's set totals are, and how well a line-up predicts them ---------- */
export function predictability(S, ctx) {
  const avgOf = {}; groupBy(ctx.filter(o => o.a.a), o => o.a.a, 4).forEach(g => { avgOf[g.k] = g.avg; });
  const by = {};
  S.matches.forEach(m => {
    if (!m.arrows.length) return;
    m.sets.forEach(st => ['A', 'B'].forEach(k => {
      if (st.cnt[k] < 8) return; const t = m.teams[k]; const o = by[t] = by[t] || { t, totals: [], err: [] };
      o.totals.push(st.tot[k]);
      if (m.src === 'recorded') {
        const l = m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === k);
        if (l.every(a => a.a && avgOf[a.a] != null)) o.err.push(Math.abs(l.reduce((x, a) => x + avgOf[a.a], 0) - st.tot[k]));
      }
    }));
  });
  return Object.values(by).map(o => ({ t: o.t, n: o.totals.length, avg: mean(o.totals), sd: sd(o.totals), mae: mean(o.err), en: o.err.length })).sort((a, b) => (a.sd ?? 99) - (b.sd ?? 99));
}

/* ---------- time management per team ---------- */
export function teamTime(S, ctx) {
  const by = {};
  ctx.forEach(o => { const x = by[o.code] = by[o.code] || { t: o.code, list: [] }; x.list.push(o); });
  return Object.values(by).map(x => {
    const s = summarize(x.list); const to = S.matches.reduce((n, m) => n + m.arrows.filter(a => a.to && m.teams[a.t] === x.t).length, 0);
    const cr = x.list.filter(o => o.clBefore != null && o.clBefore <= CRUNCH);
    return Object.assign({ t: x.t, to, crunchN: cr.length, crunchAvg: mean(cr.map(o => o.a.s)) }, s);
  }).sort((a, b) => (a.at ?? 99) - (b.at ?? 99));
}

/* ---------- event-wise: by day and stage ---------- */
export function byDay(S, ctx) {
  const out = [];
  for (let d = 1; d <= 11; d++) {
    const ms = S.matches.filter(m => m.d === d); const l = ctx.filter(o => o.m.d === d);
    out.push(Object.assign({ d, matches: ms, rec: ms.filter(m => m.src === 'recorded').length }, summarize(l)));
  }
  return out;
}
