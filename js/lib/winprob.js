/* Set win chance: after every arrow of a set, the chance that each team takes the set (or that it ends level).
   Each arrow still to come is modelled by who shoots it: that archer's own score spread, pulled toward their
   category (recurve men, recurve women, compound men, compound women) as if they had already shot K arrows at the
   category average. Recurve and compound arrows are never drawn from the same spread. When the archer isn't known
   (broadcast reads), the category comes from the team's usual shooting order. Scores 0 (miss or time-out) to 10. */
import { rotation } from '../pages/rotation.js';

export const K = 30;
const SC = 11; // score values 0..10

let memo = { S: null, M: null };
export function model(S) {
  if (memo.S === S) return memo.M;
  const cat = {}, arc = {}, all = new Array(SC).fill(0);
  S.matches.forEach(m => m.arrows.forEach(a => {
    if (a.ph !== 'S' || a.s == null) return; const s = Math.max(0, Math.min(10, a.s)); all[s]++;
    if (!a.a) return; const c = S.A(a.a).cat; if (!c) return;
    (cat[c] = cat[c] || new Array(SC).fill(0))[s]++; (arc[a.a] = arc[a.a] || new Array(SC).fill(0))[s]++;
  }));
  const norm = l => { const n = l.reduce((x, v) => x + v, 0); return n ? l.map(v => v / n) : null; };
  const catP = {}; Object.keys(cat).forEach(c => { catP[c] = norm(cat[c]); });
  const allP = norm(all) || new Array(SC).fill(1 / SC);
  const arcP = {}; Object.entries(arc).forEach(([id, l]) => {
    const n = l.reduce((x, v) => x + v, 0); const base = catP[S.A(id).cat] || allP;
    arcP[id] = l.map((v, s) => (v + K * base[s]) / (n + K));
  });
  // the usual order per team (for arrows without an archer), and the league's most used order as a fallback
  const sig = {}; const cnt = {};
  S.roster.teams.forEach(t => { const R = rotation(S, t.short); if (R.sig) { sig[t.short] = R.sig; const k = R.sig.join(' '); cnt[k] = (cnt[k] || 0) + R.same; } });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; const league = top ? top[0].split(' ') : null;
  const M = { catP, arcP, allP, sig, league };
  memo = { S, M };
  return M;
}

/* the score spread of one arrow: by archer, else by the category the team usually sends at that position */
export function spread(S, M, id, code, pos) {
  if (id && M.arcP[id]) return M.arcP[id];
  if (id && M.catP[S.A(id).cat]) return M.catP[S.A(id).cat];
  const order = M.sig[code] || M.league; const c = order && order[(pos - 1) % 8];
  return (c && M.catP[c]) || M.allP;
}

/* sum of several arrows as one distribution */
export function convolve(list) {
  let d = [1];
  list.forEach(p => { const out = new Array(d.length + SC - 1).fill(0); d.forEach((x, i) => { if (x) p.forEach((y, s) => { out[i + s] += x * y; }); }); d = out; });
  return d;
}
/* P(A ends ahead), P(level), P(B ends ahead) given the gap now and the arrows each side has left */
export function outcome(gap, dA, dB) {
  let w = 0, t = 0, l = 0;
  dA.forEach((x, a) => { if (x < 1e-12) return; dB.forEach((y, b) => { const v = gap + a - b; if (v > 0) w += x * y; else if (v === 0) t += x * y; else l += x * y; }); });
  const s = w + t + l || 1; return { A: w / s, T: t / s, B: l / s };
}

/* one set, arrow by arrow in shooting order. steps[0] is before the first arrow. */
export function setChance(S, m, n) {
  const M = model(S);
  const l = m.arrows.filter(a => a.ph === 'S' && a.set === n);
  const side = { A: l.filter(a => a.t === 'A').slice(0, 8), B: l.filter(a => a.t === 'B').slice(0, 8) };
  if (side.A.length < 8 || side.B.length < 8) return null;
  const sp = { A: side.A.map((a, i) => spread(S, M, a.a, m.teams.A, i + 1)), B: side.B.map((a, i) => spread(S, M, a.a, m.teams.B, i + 1)) };
  const order = l.filter(a => side[a.t].includes(a));
  const shot = { A: 0, B: 0 }, tot = { A: 0, B: 0 };
  const at = () => outcome(tot.A - tot.B, convolve(sp.A.slice(shot.A)), convolve(sp.B.slice(shot.B)));
  const steps = [{ i: 0, p: at(), a: null, tot: { A: 0, B: 0 } }];
  order.forEach((a, i) => { shot[a.t]++; tot[a.t] += a.s || 0; steps.push({ i: i + 1, p: at(), a, pos: shot[a.t], tot: { A: tot.A, B: tot.B } }); });
  // the arrow that moved the chance most (as the shooting team's own chance of taking the set, a tie counted as half)
  let swing = null;
  steps.slice(1).forEach((s, i) => { const prev = steps[i].p; const own = p => (s.a.t === 'A' ? p.A : p.B) + p.T / 2; const d = own(s.p) - own(prev); if (!swing || Math.abs(d) > Math.abs(swing.d)) swing = { step: s, d, from: own(prev), to: own(s.p) }; });
  return { steps, swing };
}

/* league view: chance of taking a set (tie as half) for a team that leads by `lead` after `k` arrows each,
   with an average line-up on both sides (each remaining arrow from the category usually shot at that position) */
export function leadTable(S, leads, ks) {
  const M = model(S); const order = M.league; if (!order) return null;
  const p = pos => M.catP[order[(pos - 1) % 8]] || M.allP;
  return ks.map(k => { const d = convolve([...Array(8 - k)].map((_, i) => p(k + i + 1)));
    return leads.map(g => { const o = outcome(g, d, d); return o.A + o.T / 2; }); });
}

/* what really happened: every real set, the lead after k arrows each and whether that team took the set */
export function realLeads(S) {
  const out = [];
  S.matches.forEach(m => m.sets.forEach(st => {
    if (!st.full) return; const l = t => m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === t).slice(0, 8);
    const A = l('A'), B = l('B'); if (A.length < 8 || B.length < 8) return;
    let ra = 0, rb = 0; const res = st.tot.A > st.tot.B ? 1 : st.tot.A < st.tot.B ? 0 : 0.5;
    for (let k = 0; k < 8; k++) { out.push({ k, lead: ra - rb, r: res }, { k, lead: rb - ra, r: 1 - res }); ra += A[k].s || 0; rb += B[k].s || 0; }
  }));
  return out;
}

/* how well the per-set chance matched reality: steps grouped by forecast, and how often that team took the set */
export function calibration(S) {
  const bins = [...Array(5)].map((_, i) => ({ lo: i * 0.2, hi: (i + 1) * 0.2, n: 0, f: 0, r: 0 }));
  let brier = 0, nb = 0;
  S.matches.forEach(m => m.sets.forEach(st => {
    if (!st.full) return; const C = setChance(S, m, st.n); if (!C) return;
    const res = st.tot.A > st.tot.B ? 1 : st.tot.A < st.tot.B ? 0 : 0.5;
    C.steps.slice(0, -1).forEach(s => { const f = s.p.A + s.p.T / 2; const b = bins[Math.min(4, Math.floor(f * 5))]; b.n++; b.f += f; b.r += res; brier += (f - res) ** 2; nb++; });
  }));
  return { bins: bins.map(b => ({ ...b, f: b.n ? b.f / b.n : null, r: b.n ? b.r / b.n : null })), brier: nb ? brier / nb : null, n: nb };
}
