/* APL Season 2 — match rules, schedule, imports and season numbers.
   Pure functions only: no DOM, no storage. */

export const CATS = { RM: 'Recurve men', RW: 'Recurve women', CM: 'Compound men', CW: 'Compound women' };
export const CAT_ORDER = ['RM', 'RW', 'CM', 'CW'];
export const STAGES = ['League', 'Semi-final 1', 'Semi-final 2', 'Final'];
export const FACE = { 1: '#f4f4ef', 2: '#f4f4ef', 3: '#2a2a2a', 4: '#2a2a2a', 5: '#3b8fd9', 6: '#3b8fd9', 7: '#e5484d', 8: '#e5484d', 9: '#f5c518', 10: '#f5c518' };
export const FACE_TXT = { 0: '#e8ecf2', 1: '#1a1a1a', 2: '#1a1a1a', 3: '#fff', 4: '#fff', 5: '#fff', 6: '#fff', 7: '#fff', 8: '#fff', 9: '#1d1600', 10: '#1d1600' };
export const KEYS = { A: ['q', 'w', 'e', 'r'], B: ['u', 'i', 'o', 'p'] };
export const CLOCK_START = 120;

const SRC = [
  ['CA', 'Chero Archers', 'Jharkhand', '#0f8a63', [['Atanu Das', 'RM'], ['Yashdeep Bhoge', 'RM'], ['Casey Kaufhold', 'RW', 'USA'], ['Kumkum Anil Mohod', 'RW'], ['Mathias Fullerton', 'CM', 'DEN'], ['Sahil Rajesh Jadhav', 'CM'], ['Prithika Pradeep', 'CW'], ['Jasveer Kaur', 'CW']]],
  ['CC', 'Chola Chiefs', 'Tamil Nadu', '#b7791f', [["Marcus D'Almeida", 'RM', 'BRA'], ['Pawan', 'RM'], ['Deepika Kumari', 'RW'], ['Yuktha Sri Kondapavuluri', 'RW'], ['Rajat Chauhan', 'CM'], ['Rishabh Yadav', 'CM'], ['Chikitha Taniparthi', 'CW'], ['Alejandra Usquiano', 'CW', 'COL']]],
  ['KK', 'Kakatiya Knights', 'Telangana', '#7c4ddb', [['Neeraj Chauhan', 'RM'], ['Rohit Kumar', 'RM'], ['Elia Canales', 'RW', 'ESP'], ['Ridhi', 'RW'], ['Nico Wiener', 'CM', 'AUT'], ['Shivshankar Sakharam Landkar', 'CM'], ['Jyothi Surekha Vennam', 'CW'], ['Avneet Kaur', 'CW']]],
  ['MM', 'Mighty Marathas', 'Maharashtra', '#d4571c', [['Dhiraj Bommadevara', 'RM'], ['Mrinal Chauhan', 'RM'], ['Alejandra Valencia', 'RW', 'MEX'], ['Simranjeet Kaur', 'RW'], ['Mike Schloesser', 'CM', 'NED'], ['Aman Saini', 'CM'], ['Parneet Kaur', 'CW'], ['Madhura Dhamangaonkar', 'CW']]],
  ['PY', 'Prithviraaj Yodhas', 'Delhi', '#2f6fe4', [['Juyel Sarkar', 'RM'], ['Thirumuru Ganesh Mani Ratnam', 'RM'], ['Gatha Anandrao Khadake', 'RW'], ['Kirti Sharma', 'RW'], ['Matias Grande', 'CM', 'MEX'], ['Abhishek Verma', 'CM'], ['Andrea Becerra', 'CW', 'MEX'], ['Raj Kaur', 'CW']]],
  ['RR', 'Rajputana Royals', 'Rajasthan', '#d6264f', [['Mete Gazoz', 'RM', 'TUR'], ['Abhyuday Amol Pakhale', 'RM'], ['Ankita Bhakat', 'RW'], ['Sangeeta', 'RW'], ['Ojas Pravin Deotale', 'CM'], ['Kushal Dalal', 'CM'], ['Ella Gibson', 'CW', 'GBR'], ['Swati Dudhwal', 'CW']]]
];
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function defaultRoster() {
  return { season: 'APL Season 2 (2026)', teams: SRC.map(([short, name, state, color, arr]) => ({ short, name, state, color, archers: arr.map(([n, cat, c]) => ({ id: short.toLowerCase() + '-' + slug(n), name: n, cat, country: c || '' })) })) };
}
/* team colours used on screen (the roster colours are tuned for a dark background) */
export const UI_COLOR = Object.fromEntries(SRC.map(r => [r[0], r[3]]));

/* ---------- schedule: one YouTube video per day ---------- */
export const NDAYS = 11;
export const dayCap = d => (d === 10 ? 4 : 3);
export const matchNo = (d, s) => (d <= 10 ? 3 * (d - 1) + s : 31 + s);
export const dayDate = d => '2026-10-' + String(7 + d).padStart(2, '0');
export const dayLabel = d => { try { return new Date(2026, 9, 7 + d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return dayDate(d); } };
export const defStage = (d, s) => (d < NDAYS ? 'League' : (['Semi-final 1', 'Semi-final 2', 'Final'][s - 1] || 'Final'));
/* a match's stage; a blank or unknown one falls back to the schedule (league days 1–10, then the finals) */
export const stageOf = m => (STAGES.includes(m.stage) ? m.stage : defStage(+m.day, +m.slot));
export const DEFAULT_VIDEOS = { 1: 'JPvBVHCA2jQ', 2: 'GwVYLy18Sko', 3: '0D0LUyYT_Co', 4: 'Q7IA7jdXVDY', 5: 'EbgFZXm5Pv8', 6: 'sQRs1SqlgTY', 7: 'RMxPg5kagMo', 8: 'PEjUb85Df-E', 9: '3RgthaKIRcA', 10: 'lPIz-DFAxMk', 11: 'CiAEfUJ_ohU' };
export function ytId(v) {
  if (!v) return '';
  v = String(v).trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1, 12);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(embed|live|shorts)\/([\w-]{11})/); if (m) return m[2];
  } catch (e) { }
  return '';
}
export function allSlots() { const out = []; for (let d = 1; d <= NDAYS; d++) for (let s = 1; s <= dayCap(d); s++) out.push({ day: d, slot: s, no: matchNo(d, s) }); return out; }

/* ---------- time formatting ---------- */
export const fmtTs = s => { if (s == null || isNaN(s)) return ''; s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
export function parseTs(v) {
  v = String(v == null ? '' : v).trim(); if (!v) return null;
  if (/^\d+(\.\d+)?s?$/i.test(v)) return Math.round(parseFloat(v));
  const p = v.split(':'); if (p.length >= 2 && p.length <= 3 && p.every(x => /^\d+$/.test(x))) return p.map(Number).reduce((a, b) => a * 60 + b, 0);
  return NaN;
}

/* ---------- match logic ---------- */
export const phOf = k => (k === 'SO' ? 'SO' : k === 'SD' ? 'SD' : 'S');
export const byAt = (p, q) => p.at - q.at;
export function lineupFor(m, key) {
  const L = m.lineups || {};
  if (key === 'SO' || key === 'SD') { if (L.SO) return L.SO; key = 4; }
  for (let k = key; k >= 1; k--) if (L[k]) return L[k];
  return null;
}
export function compute(m) {
  const r = { sets: [], pts: { A: 0, B: 0 }, phase: 'sets', cur: 1, winner: null, method: null, endSet: null, so: null, sd: [], sdCur: null, tot: { A: 0, B: 0 }, n: { A: 0, B: 0 } };
  const closed = m.closed || {}; let decided = false, open = null;
  for (let n = 1; n <= 4; n++) {
    const ar = m.arrows.filter(a => a.ph === 'S' && a.set === n).sort(byAt);
    const s = { n, arrows: ar, tot: { A: 0, B: 0 }, cnt: { A: 0, B: 0 }, pts: { A: 0, B: 0 }, complete: false, counted: false, played: false };
    ar.forEach(a => { s.tot[a.t] += a.s || 0; s.cnt[a.t]++; r.tot[a.t] += a.s || 0; r.n[a.t]++; });
    s.complete = (s.cnt.A >= 8 && s.cnt.B >= 8) || !!closed[n];
    r.sets.push(s);
    if (decided || open) continue;
    s.played = true;
    if (!s.complete) { open = n; continue; }
    if (s.tot.A > s.tot.B) s.pts.A = 2; else if (s.tot.B > s.tot.A) s.pts.B = 2; else { s.pts.A = 1; s.pts.B = 1; }
    s.counted = true; r.pts.A += s.pts.A; r.pts.B += s.pts.B;
    if (r.pts.A >= 5 || r.pts.B >= 5) { decided = true; r.winner = r.pts.A >= 5 ? 'A' : 'B'; r.phase = 'done'; r.method = 'sets'; r.endSet = n; }
  }
  if (decided) return r;
  if (open) { r.phase = 'sets'; r.cur = open; return r; }
  const so = m.arrows.filter(a => a.ph === 'SO').sort(byAt);
  const o = { arrows: so, hits: { A: 0, B: 0 }, cnt: { A: 0, B: 0 }, complete: false };
  so.forEach(a => { o.cnt[a.t]++; if (a.h) o.hits[a.t]++; });
  o.complete = (o.cnt.A >= 4 && o.cnt.B >= 4) || !!closed.SO; r.so = o;
  if (!o.complete) { r.phase = 'so'; return r; }
  if (o.hits.A !== o.hits.B) { r.phase = 'done'; r.winner = o.hits.A > o.hits.B ? 'A' : 'B'; r.method = 'SO'; return r; }
  const sd = m.arrows.filter(a => a.ph === 'SD').sort(byAt);
  const max = sd.reduce((x, a) => Math.max(x, a.set || 1), 0);
  for (let k = 1; k <= Math.max(1, max); k++) {
    const ra = sd.filter(a => a.set === k); const A = ra.find(a => a.t === 'A'), B = ra.find(a => a.t === 'B');
    const rd = { k, A, B, complete: !!(A && B) }; r.sd.push(rd);
    if (!rd.complete) { r.phase = 'sd'; r.sdCur = k; return r; }
    if (!!A.h !== !!B.h) { r.phase = 'done'; r.winner = A.h ? 'A' : 'B'; r.method = 'SD'; return r; }
  }
  r.phase = 'sd'; r.sdCur = Math.max(1, max) + 1; return r;
}
export function autoKey(r) { if (r.phase === 'sets') return r.cur; if (r.phase === 'so') return 'SO'; if (r.phase === 'sd') return 'SD'; return r.method === 'SD' ? 'SD' : r.method === 'SO' ? 'SO' : r.endSet; }
/* which set keys exist for tabs */
export function setKeys(m, r) {
  const keys = [1];
  for (let n = 2; n <= 4; n++) { if (r.sets[n - 2].complete && !(r.phase === 'done' && r.method === 'sets' && r.endSet < n)) keys.push(n); else if (m.arrows.some(a => a.ph === 'S' && a.set === n)) keys.push(n); }
  const soOn = r.so || m.arrows.some(a => a.ph === 'SO');
  if (soOn) keys.push('SO');
  if (r.sd.length || m.arrows.some(a => a.ph === 'SD') || (r.so && r.so.complete && r.so.hits.A === r.so.hits.B)) keys.push('SD');
  return [...new Set(keys)];
}
export function scoreFromPos(p, cat, compoundInner) {
  const rr = Math.hypot(p[0], p[1]);
  if (rr > 1) return { s: 0, x: false };
  if (compoundInner && cat && cat[0] === 'C') { if (rr <= 0.05) return { s: 10, x: true }; if (rr <= 0.2) return { s: 9, x: false }; }
  return { s: Math.min(10, 10 - Math.floor(rr * 10)), x: rr <= 0.05 };
}
/* the X ring is the inner circle of the 10 (radius 0.05 of the face). A 10 whose spot sits inside it is an X.
   'xa' marks an X that came from the spot, so moving that spot back out of the ring turns it into a plain 10 again;
   an X typed by hand or read off the board is never taken away. */
export const X_RING = 0.05;
export const inX = p => !!p && Math.hypot(p[0], p[1]) <= X_RING;
export function autoX(a) {
  if (a.ph !== 'S' || a.to) return false;
  if (a.s === 10 && !a.x && inX(a.p)) { a.x = true; a.xa = true; return true; }
  if (a.xa && (a.s !== 10 || !inX(a.p))) { if (a.s !== 10 || a.x) a.x = false; delete a.xa; return true; }
  return false;
}
export const autoXAll = m => m.arrows.reduce((n, a) => n + (autoX(a) ? 1 : 0), 0);
export const scoreLabel = a => (a.to ? 'TO' : a.ph !== 'S' ? (a.h == null ? '·' : a.h ? 'Hit' : 'Miss') : a.s == null ? '·' : a.s === 10 && a.x ? 'X' : a.s === 0 ? 'M' : String(a.s));

/* each team has its own 120 s clock per set; seconds taken = previous reading − this reading */
export function deriveTimes(m) {
  const g = {};
  m.arrows.slice().sort(byAt).forEach(a => { const k = a.ph + '|' + a.set + '|' + a.t; (g[k] = g[k] || []).push(a); });
  Object.values(g).forEach(list => {
    let prev = list[0].ph === 'S' ? CLOCK_START : null;
    list.forEach(a => { a.dt = a.cl != null && prev != null ? +(prev - a.cl).toFixed(1) : null; prev = a.cl != null ? a.cl : null; });
  });
}
export function prevReading(m, ph, set, t, beforeAt) {
  const list = m.arrows.filter(a => a.ph === ph && a.set === set && a.t === t && (beforeAt == null || a.at < beforeAt)).sort(byAt);
  if (!list.length) return ph === 'S' ? CLOCK_START : null;
  const l = list[list.length - 1]; return l.cl != null ? l.cl : null;
}
/* what a logged arrow still needs */
export function needs(a) {
  const n = [];
  if (!a.a) n.push('archer');
  if (a.ph === 'S' && !a.to) {
    if (a.s == null) n.push('score');
    if (a.cl == null) n.push('clock');
    if (!a.p && a.s > 0) n.push('spot');
  } else if (a.ph !== 'S' && a.h == null) n.push('result');
  return n;
}
export function progress(m) {
  const tot = m.arrows.length; const done = m.arrows.filter(a => !needs(a).length).length;
  return { tot, done, pct: tot ? done / tot : 0 };
}
export function quota(key) { const ph = phOf(key); return { ph, quota: ph === 'S' ? 8 : ph === 'SO' ? 4 : 1, per: ph === 'S' ? 2 : 1 }; }
export function arrowsIn(m, key, sdRound) {
  const ph = phOf(key);
  return m.arrows.filter(a => a.ph === ph && (ph === 'S' ? a.set === key : ph === 'SD' ? (sdRound == null || a.set === sdRound) : true)).sort(byAt);
}
export function resultText(m, r, T) {
  const a = T(m.teams.A).short, b = T(m.teams.B).short;
  if (r.phase === 'done') {
    const w = r.winner === 'A' ? a : b;
    if (r.method === 'sets') return `${w} won ${Math.max(r.pts.A, r.pts.B)}–${Math.min(r.pts.A, r.pts.B)}`;
    return `${w} won 5–4 in the ${r.method === 'SO' ? 'shoot-off' : 'sudden death'}`;
  }
  if (!m.arrows.length) return 'Not started';
  if (r.phase === 'so') return 'Shoot-off at 4–4';
  if (r.phase === 'sd') return 'Sudden death';
  return `Set ${r.cur} · ${r.pts.A}–${r.pts.B}`;
}

/* ---------- auto-read imports from the scoreboard reader ---------- */
export const KNOWN_PANEL = { RR: ['#66aacc', '#77c4d7'], PY: ['#dcb114', '#ddb114', '#d39b12'], CC: ['#d1b258', '#dccc66'], MM: ['#553d35', '#5f443b'], KK: ['#5d93eb'], CA: ['#2391cc', '#23a1e2'] };
export function colDist(a, b) { if (!a || !b) return 999; const p = h => [1, 3, 5].map(i => parseInt(String(h).substr(i, 2), 16)); const x = p(a), y = p(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }
export function guessTeam(hex, learned) {
  let best = '', bd = 1e9;
  const tbl = {}; Object.entries(KNOWN_PANEL).forEach(([k, v]) => tbl[k] = v.slice());
  Object.entries(learned || {}).forEach(([k, v]) => { (tbl[k] = tbl[k] || []).push(...[].concat(v)); });
  for (const [k, list] of Object.entries(tbl)) for (const v of list) { const d = colDist(hex, v); if (d < bd) { bd = d; best = k; } }
  return bd < 40 ? best : '';
}
export function expandImport(M) {
  M = JSON.parse(JSON.stringify(M));
  (M.sets || []).forEach(s => {
    if (typeof s.a === 'string') {
      s.arrows = s.a.split(';').filter(Boolean).map(tok => {
        const m = tok.match(/^([AB])([\d.]+):(\d+):(-?\d*)(.*)$/); if (!m) return null; const f = m[5] || '';
        const o = { team: m[1], t: +m[2], s: +m[3], cl: m[4] === '' ? null : +m[4] };
        if (f.includes('*')) o.star = 1; if (f.includes('x')) o.x = 1; if (f.includes('?')) o.unsure = 1; if (f.includes('!')) o.clkOdd = 1;
        const c = f.match(/\^(\d+)/); if (c) { o.changed = 1; o.first = +c[1]; } return o;
      }).filter(Boolean);
      delete s.a;
    }
    s.count = { A: s.arrows.filter(x => x.team === 'A').length, B: s.arrows.filter(x => x.team === 'B').length };
    s.ok = { A: s.tot && s.sum ? s.tot.A === s.sum.A : false, B: s.tot && s.sum ? s.tot.B === s.sum.B : false };
  });
  M.soArrows = typeof M.so === 'string' ? M.so.split(';').filter(Boolean).map(tok => { const m = tok.match(/^([AB])([\d.]+):(\d)$/); return m ? { team: m[1], t: +m[2], h: m[3] === '1' } : null; }).filter(Boolean) : (M.soArrows || []);
  return M;
}
const uidBase = () => Date.now().toString(36);
let uidN = 0;
export const uid = () => uidBase() + (uidN++).toString(36) + Math.random().toString(36).slice(2, 6);
/* build a match from an auto-read import; missing arrows at a clock of 0 become time-outs */
export function matchFromImport(imp, f) {
  const M = expandImport(imp.match); const d = +f.day, s = +f.slot;
  const arrows = []; const closed = {}; const checks = {};
  M.sets.forEach((st, i) => {
    const n = i + 1;
    st.arrows.forEach((x, j) => arrows.push({ id: uid(), ph: 'S', set: n, t: x.team, a: null, s: x.s, x: !!x.x, h: null, to: false, p: null, cl: x.cl, at: Math.round(x.t * 1000) + j, vt: x.t, src: 'v', star: !!x.star, chg: x.changed ? x.first : null, unsure: !!(x.unsure || x.clkOdd) }));
    ['A', 'B'].forEach(t => {
      const list = st.arrows.filter(x => x.team === t); const last = list[list.length - 1];
      if (list.length < 8 && st.ok[t] && last && last.cl === 0) {
        for (let k = list.length; k < 8; k++) arrows.push({ id: uid(), ph: 'S', set: n, t, a: null, s: 0, x: false, h: null, to: true, p: null, cl: 0, at: Math.round(last.t * 1000) + 500 + k, vt: last.t, src: 'v' });
      } else if (list.length < 8 || !st.ok[t]) checks[n] = true;
    });
  });
  // the first four arrows per team are the shoot-off; any after that are sudden-death rounds
  const seen = { A: 0, B: 0 };
  (M.soArrows || []).forEach((x, j) => {
    const k = seen[x.team]++; const sd = k >= 4;
    arrows.push({ id: uid(), ph: sd ? 'SD' : 'SO', set: sd ? k - 3 : 0, t: x.team, a: null, s: null, x: false, h: !!x.h, to: false, p: null, cl: null, at: Math.round(x.t * 1000) + j, vt: x.t, src: 'v' });
  });
  const boards = {}; M.sets.forEach((st, i) => { boards[i + 1] = { tot: st.tot, n: st.n }; });
  const notes = [];
  let pa = 0, pb = 0; M.sets.forEach(st => { if (st.tot.A > st.tot.B) pa += 2; else if (st.tot.B > st.tot.A) pb += 2; else { pa++; pb++; } });
  const hasSO = (M.soArrows || []).length > 0;
  if (pa === 4 && pb === 4 && !hasSO) notes.push('This match went to a shoot-off that the TV board didn’t show. Record it by hand from the video.');
  if (hasSO && !(pa === 4 && pb === 4)) notes.push(`The TV went to a shoot-off, but these set totals give ${pa}–${pb}. One set total is probably a point off — check the sets with a judge’s call.`);
  M.sets.forEach((st, i) => { if (st.arrows.some(x => x.star)) notes.push(`Set ${i + 1} has a judge’s call (★). The score may have changed after the board showed it.`); });
  return {
    id: 'm-' + uid(), no: matchNo(d, s), day: d, slot: s, vt: Math.max(0, Math.round((M.t0 || 0) - 30)), date: dayDate(d), stage: defStage(d, s),
    teams: { A: f.A, B: f.B }, lineups: {}, closed, arrows, created: Date.now(), updated: Date.now(), src: 'video', imp: imp.key, boards, checks, notes, panel: { A: M.ka, B: M.kb }
  };
}

/* ---------- season numbers ---------- */
export function aggArchers(ms, AR) {
  const A = {};
  ms.forEach(m => {
    deriveTimes(m); m.arrows.forEach(a => {
      if (!a.a) return;
      const o = A[a.a] || (A[a.a] = { id: a.a, n: 0, sum: 0, ten: 0, x: 0, miss: 0, to: 0, tn: 0, tsum: 0, so: 0, soh: 0, pos: [], mset: new Set() });
      if (a.to) { o.to++; o.mset.add(m.id); return; }
      if (a.ph === 'S') { o.n++; o.sum += a.s || 0; if (a.s === 10) o.ten++; if (a.x) o.x++; if (a.s === 0) o.miss++; if (a.dt != null && a.dt > 0) { o.tn++; o.tsum += a.dt; } if (a.p) o.pos.push(a.p); o.mset.add(m.id); }
      else { o.so++; if (a.h) o.soh++; }
    });
  });
  return Object.values(A).map(o => Object.assign(o, { avg: o.n ? o.sum / o.n : null, tenr: o.n ? o.ten / o.n : null, at: o.tn ? o.tsum / o.tn : null, mp: o.mset.size, team: AR(o.id).team, cat: AR(o.id).cat, name: AR(o.id).name }));
}
export function standings(teams, matches) {
  const st = {}; teams.forEach(t => st[t.short] = { t: t.short, P: 0, W: 0, L: 0, Pts: 0, SF: 0, SA: 0, sum: 0, n: 0, sets: 0, setSum: 0, best: 0 });
  matches.forEach(m => {
    const r = compute(m);
    ['A', 'B'].forEach(t => { const o = st[m.teams[t]]; if (!o) return; r.sets.forEach(s => { if (s.counted) { o.sets++; o.setSum += s.tot[t]; o.best = Math.max(o.best, s.tot[t]); } }); o.sum += r.tot[t]; o.n += r.n[t]; });
    if (stageOf(m) !== 'League' || r.phase !== 'done') return;
    const a = st[m.teams.A], b = st[m.teams.B]; if (!a || !b) return;
    a.P++; b.P++; a.SF += r.pts.A; a.SA += r.pts.B; b.SF += r.pts.B; b.SA += r.pts.A;
    const w = r.winner === 'A' ? a : b, l = r.winner === 'A' ? b : a; w.W++; w.Pts += 2; l.L++;
  });
  return Object.values(st).sort((x, y) => y.Pts - x.Pts || (y.SF - y.SA) - (x.SF - x.SA) || (y.n ? y.sum / y.n : 0) - (x.n ? x.sum / x.n : 0));
}
export function csvAll(matches, AR, videoOf) {
  matches.forEach(deriveTimes);
  const H = ['match_id', 'match_no', 'day', 'match_in_day', 'video_id', 'video_start_s', 'date', 'stage', 'team_a', 'team_b', 'phase', 'set_or_round', 'seq_in_set', 'team', 'archer_id', 'archer', 'category', 'country', 'score', 'is_x', 'hit', 'time_out', 'x', 'y', 'radius', 'clock_remaining', 'secs_taken', 'judge_call', 'board_showed_first', 'source', 'video_time_s'];
  const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const out = [H.join(',')];
  matches.slice().sort((a, b) => (+a.no || 0) - (+b.no || 0)).forEach(m => {
    const seq = {};
    m.arrows.slice().sort(byAt).forEach(a => {
      const k = a.ph + a.set + a.t; seq[k] = (seq[k] || 0) + 1; const ar = AR(a.a);
      out.push([m.id, m.no, m.day || '', m.slot || '', videoOf(m), m.vt == null ? '' : m.vt, m.date, stageOf(m), m.teams.A, m.teams.B, a.ph === 'S' ? 'set' : a.ph === 'SO' ? 'shoot-off' : 'sudden-death', a.set || '', seq[k], m.teams[a.t], a.a || '', a.a ? ar.name : '', a.a ? ar.cat : '', a.a ? ar.country : '', a.ph === 'S' ? a.s : '', a.ph === 'S' ? (a.x ? 1 : 0) : '', a.ph === 'S' ? '' : (a.h ? 1 : 0), a.to ? 1 : 0, a.p ? a.p[0] : '', a.p ? +(-a.p[1]).toFixed(4) : '', a.p ? Math.hypot(a.p[0], a.p[1]).toFixed(4) : '', a.cl, a.dt, a.star ? 1 : 0, a.chg == null ? '' : a.chg, a.src === 'v' ? 'video-read' : 'manual', a.vt == null ? '' : Math.round(a.vt)].map(q).join(','));
    });
  });
  return out.join('\n');
}
