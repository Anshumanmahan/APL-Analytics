/* Copied from APL Scorebook's season site (season/js/season.js) and extended (lineups, days).
   The season, built from two sources:
   - matches recorded in APL Scorebook (archer, spot, score and clock for every arrow), and
   - the scoreboard reader's auto-read of every match (score, order and clock, no archers).
   A recorded match always replaces its auto-read. Results come from the official reports,
   because the reader sometimes misses a final arrow or a shoot-off. */
import { expandImport, byAt, CATS, CAT_ORDER, defaultRoster, UI_COLOR, DEFAULT_VIDEOS, ytId, colDist } from './rules.js';

export const TEAMS = ['CA', 'CC', 'KK', 'MM', 'PY', 'RR'];
/* team colours on screen; Kakatiya purple is lifted a little so it reads on the dark background */
export const COLOR = Object.assign({}, UI_COLOR, { KK: '#8a5ce6' });
export const NDAYS = 11;
export const slotsOf = d => (d === 10 ? 4 : 3);
export const STAGE = (d, s) => (d < 10 ? 'League' : d === 10 ? (s === 4 ? 'Eliminator 1' : 'League') : ['Shortcut Decider', 'Eliminator 2', 'The Final'][s - 1]);
export const dateOf = d => new Date(2026, 9, 7 + d);
export const dayName = d => 'Day ' + d; // the user wants day numbers only, no calendar dates
export const CLOCK = 120;

export const SOURCES = {
  book: { t: 'Recorded arrow by arrow in APL Scorebook' },
  tv: { t: 'Read from the TV scoreboard' },
  table: { t: 'Worked out from the official final table', u: 'https://archerypremierleague.co.in/standings' },
  wa1: { t: 'World Archery: four teams level at halfway', u: 'https://www.worldarchery.sport/news/202671/four-teams-level-archery-premier-league-reaches-halfway-stage' },
  wa2: { t: 'World Archery: Knights top the standings', u: 'https://www.worldarchery.sport/news/202677/kakatiya-knights-tops-standings-second-round-robin-stage-concludes' },
  wa3: { t: 'World Archery: Marathas claim the Season 2 crown', u: 'https://www.worldarchery.sport/news/202678/mighty-marathas-bounce-back-claim-archery-premier-league-season-2-crown' },
  dd: { t: 'Devdiscourse: Chiefs end winless streak (day 8)', u: 'https://www.devdiscourse.com/article/sports-games/3993227-archery-premier-league-chola-chiefs-end-winless-streak-with-thrilling-shootoff-win-toppers-mighty-marathas-and-kakatiya-knights-stumble' },
  tt: { t: 'Telangana Today: Chiefs stun Royals (day 9)', u: 'https://telanganatoday.com/chola-chiefs-stun-rajputana-royals-in-archery-premier-league' },
  mk: { t: 'myKhel: Marathas and Knights seal top two (day 9)', u: 'https://www.mykhel.com/more-sports/archery-premier-league-mighty-marathas-kakatiya-knights-seal-top-two-finish-as-playoff-race-heats-456597.html' }
};
/* day-match → [left team, right team (as on the TV board), winner, set points left–right, shoot-off?, source] */
const OFFICIAL = {
  '1-1': ['RR', 'PY', 'RR', [5, 3], 0, 'book'], '1-2': ['KK', 'MM', 'KK', [4, 4], 1, 'book'], '1-3': ['CC', 'CA', 'CA', [3, 5], 0, 'book'],
  '2-1': ['KK', 'CC', 'CC', [2, 6], 0, 'tv'], '2-2': ['RR', 'CA', 'CA', [4, 4], 1, 'table'], '2-3': ['MM', 'PY', 'PY', [2, 6], 0, 'tv'],
  '3-1': ['MM', 'CC', 'MM', [6, 0], 0, 'tv'], '3-2': ['PY', 'CA', 'PY', [4, 4], 1, 'table'], '3-3': ['RR', 'KK', 'KK', [2, 6], 0, 'tv'],
  '4-1': ['CA', 'KK', 'CA', [6, 0], 0, 'wa1'], '4-2': ['CC', 'PY', 'PY', [2, 6], 0, 'tv'], '4-3': ['MM', 'RR', 'MM', [6, 2], 0, 'tv'],
  '5-1': ['CA', 'MM', 'MM', [4, 4], 1, 'wa1'], '5-2': ['CC', 'RR', 'RR', [1, 5], 0, 'wa1'], '5-3': ['PY', 'KK', 'KK', [2, 6], 0, 'wa1'],
  '6-1': ['CA', 'RR', 'RR', [0, 6], 0, 'tv'], '6-2': ['PY', 'MM', 'MM', [2, 6], 0, 'tv'], '6-3': ['CC', 'KK', 'KK', [0, 6], 0, 'tv'],
  '7-1': ['CA', 'PY', 'PY', [0, 6], 0, 'tv'], '7-2': ['KK', 'RR', 'KK', [4, 4], 1, 'table'], '7-3': ['CC', 'MM', 'MM', [0, 6], 0, 'book'],
  '8-1': ['PY', 'CC', 'CC', [4, 4], 1, 'dd'], '8-2': ['RR', 'MM', 'RR', [6, 2], 0, 'dd'], '8-3': ['KK', 'CA', 'CA', [0, 6], 0, 'dd'],
  '9-1': ['CC', 'RR', 'CC', [5, 3], 0, 'tt'], '9-2': ['KK', 'PY', 'KK', [6, 2], 0, 'mk'], '9-3': ['CA', 'MM', 'MM', [0, 6], 0, 'mk'],
  '10-1': ['KK', 'MM', 'KK', [6, 0], 0, 'wa2'], '10-2': ['CC', 'CA', 'CA', [4, 4], 1, 'wa2'], '10-3': ['RR', 'PY', 'PY', [0, 6], 0, 'wa2'], '10-4': ['PY', 'CA', 'PY', [5, 1], 0, 'wa2'],
  '11-1': ['MM', 'KK', 'KK', [4, 4], 1, 'wa3'], '11-2': ['MM', 'PY', 'MM', [5, 3], 0, 'wa3'], '11-3': ['MM', 'KK', 'MM', [6, 2], 0, 'wa3']
};
/* scoreboard panel colours seen on the broadcast (teams wore different panels on different days) */
const PANEL = {
  RR: ['#66aacc', '#77c4d7', '#d49b2e', '#d49b2d', '#c08525'], PY: ['#dcb114', '#ddb114', '#d39b12', '#dc3039', '#dc303a', '#dd3039', '#c52d35', '#c62e35'],
  CC: ['#d1b258', '#dccc66', '#dccc65'], CA: ['#23a1e2', '#2391cc', '#22a1e2', '#22a2e3'], KK: ['#96414c', '#96424c', '#5d93eb', '#5d93ea', '#5483e6', '#5484e6'], MM: ['#553d35', '#5f443b', '#60443b', '#60443a']
};
export function teamOfPanel(hex) {
  let best = null, bd = 1e9;
  Object.entries(PANEL).forEach(([t, l]) => l.forEach(c => { const d = colDist(c, hex); if (d < bd) { bd = d; best = t; } }));
  return bd < 40 ? best : null;
}

/* timing: each team has 120 s a set; an arrow's seconds = the clock before it minus the clock after it */
function times(arrows) {
  const groups = {};
  arrows.forEach(a => { if (a.ph === 'S') (groups[a.set + a.t] = groups[a.set + a.t] || []).push(a); });
  Object.values(groups).forEach(l => {
    let prev = CLOCK, prevOk = true;
    l.forEach(a => {
      const ok = a.cl != null && a.cl >= 0 && a.cl <= CLOCK && !a.bad;
      a.dt = ok && prev != null && prevOk ? +(prev - a.cl).toFixed(1) : null;
      if (a.dt != null && (a.dt < 2 || a.dt > 60)) a.dt = null;
      prev = ok ? a.cl : null; prevOk = ok;
    });
  });
}

function fromRecorded(r) {
  // a set arrow scored M (0) is an arrow the archer ran out of time to shoot: it counts as 0 in the set total, but as a time-out
  // (not shot) everywhere else, so it doesn't drag arrow averages down
  return (r.arrows || []).slice().sort(byAt).map(a => ({ ph: a.ph, set: a.set, t: a.t, a: a.a || null, s: a.ph === 'S' ? (a.to ? 0 : a.s) : null, x: !!a.x, h: a.h, to: !!a.to || (a.ph === 'S' && a.s === 0), p: a.p || null, cl: a.cl, star: !!a.star, vt: a.vt }));
}
function fromImport(imp) {
  const M = expandImport(imp.match); const out = [];
  M.sets.forEach((st, i) => {
    // a run of arrows sharing one video time is a recap board: scores are fine, clock readings are not
    const seen = {}; st.arrows.forEach(x => { seen[x.t] = (seen[x.t] || 0) + 1; });
    // a 0 the reader wasn't sure of is noise from a changing board, not a miss
    st.arrows.filter(x => !(x.s === 0 && x.unsure)).forEach(x => out.push({ ph: 'S', set: i + 1, t: x.team, a: null, s: x.s, x: !!x.x, h: null, to: x.s === 0, p: null, cl: x.cl, star: !!x.star, vt: x.t, bad: seen[x.t] >= 3 || !!x.clkOdd, unsure: !!x.unsure }));
  });
  const n = { A: 0, B: 0 };
  (M.soArrows || []).forEach(x => { const k = n[x.team]++; out.push({ ph: k < 4 ? 'SO' : 'SD', set: k < 4 ? 0 : k - 3, t: x.team, a: null, s: null, h: !!x.h, vt: x.t }); });
  return { arrows: out, boards: M.sets.map(st => st.tot || null), t0: M.t0, ka: M.ka, kb: M.kb };
}

export function buildSeason(rows) {
  const cfg = id => (rows.find(r => r.col === 'config' && r.id === id) || {}).data;
  const roster = (cfg('roster') && cfg('roster').teams) ? cfg('roster') : defaultRoster();
  const days = (cfg('days') && cfg('days').days) || {};
  const video = d => ytId((days[d] && days[d].video) || '') || DEFAULT_VIDEOS[d];
  const recs = rows.filter(r => r.col === 'matches' && r.data && !r.data.deleted).map(r => r.data);
  const imps = rows.filter(r => r.col === 'imports').map(r => r.data);
  const team = {}, archer = {};
  roster.teams.forEach(t => { team[t.short] = t; t.archers.forEach(a => { archer[a.id] = Object.assign({ team: t.short }, a); }); });
  const matches = [];
  for (let d = 1; d <= NDAYS; d++) for (let s = 1; s <= slotsOf(d); s++) {
    const key = d + '-' + s; const off = OFFICIAL[key];
    const rec = recs.find(m => +m.day === d && +m.slot === s && (m.arrows || []).length);
    const imp = imps.find(i => i.video && i.video.id === video(d) && +i.idx === s - 1);
    let teams = { A: off[0], B: off[1] }, sp = off[3] ? { A: off[3][0], B: off[3][1] } : null;
    let arrows = [], src = 'none', boards = [], t0 = null, lineups = {}; const notes = [];
    if (rec) {
      arrows = fromRecorded(rec); src = 'recorded'; t0 = rec.vt; lineups = rec.lineups || {};
      if (rec.teams && rec.teams.A === off[1]) { teams = { A: off[1], B: off[0] }; if (sp) sp = { A: sp.B, B: sp.A }; }
    } else if (imp) {
      const r = fromImport(imp); arrows = r.arrows; boards = r.boards; t0 = r.t0; src = 'broadcast';
      const pa = teamOfPanel(r.ka), pb = teamOfPanel(r.kb);
      if (pa === off[1] && pb === off[0]) { arrows.forEach(a => { a.t = a.t === 'A' ? 'B' : 'A'; }); }
    }
    times(arrows);
    // sets as read: totals per team, arrows seen, and who took the points
    const sets = [];
    for (let n = 1; n <= 4; n++) {
      const l = arrows.filter(a => a.ph === 'S' && a.set === n);
      if (!l.length) continue;
      const cnt = { A: 0, B: 0 }, tot = { A: 0, B: 0 };
      l.forEach(a => { cnt[a.t]++; tot[a.t] += a.s || 0; });
      const b = src === 'broadcast' && boards[n - 1];
      if (b && src === 'broadcast') { if (b.A >= tot.A) tot.A = b.A; if (b.B >= tot.B) tot.B = b.B; }
      const full = cnt.A >= 8 && cnt.B >= 8;
      sets.push({ n, cnt, tot, full, pts: tot.A > tot.B ? { A: 2, B: 0 } : tot.B > tot.A ? { A: 0, B: 2 } : { A: 1, B: 1 } });
    }
    const missing = sets.reduce((x, st) => x + Math.max(0, 8 - st.cnt.A) + Math.max(0, 8 - st.cnt.B), 0);
    if (src === 'broadcast' && missing) notes.push(`The scoreboard read missed ${missing} arrow${missing > 1 ? 's' : ''}, so some set totals here may be short.`);
    if (src === 'broadcast' && arrows.some(a => a.bad)) notes.push('One set was read from a recap board, so its clock times are left out.');
    // no official set score (e.g. a result taken from the final table): add up the set points of a fully recorded match
    if (!sp && src === 'recorded' && sets.length >= 3 && sets.every(st => st.full)) {
      sp = sets.reduce((x, st) => ({ A: x.A + st.pts.A, B: x.B + st.pts.B }), { A: 0, B: 0 });
      if (off[2] && sp[teams.A === off[2] ? 'A' : 'B'] <= sp[teams.A === off[2] ? 'B' : 'A']) sp = null;
    }
    if (off[5] === 'table' && src !== 'recorded') notes.push('This result comes from the official final table: the broadcast read could not tell who won.');
    const so = arrows.filter(a => a.ph === 'SO' || a.ph === 'SD');
    matches.push({
      key, d, s, no: d <= 10 ? 3 * (d - 1) + s : 31 + s, stage: STAGE(d, s), date: dateOf(d), teams, win: off[2], sp, so: !!off[4], resSrc: off[5],
      src, arrows, sets, soArrows: so, notes, video: video(d), t0, missing, lineups
    });
  }
  return { roster, team, archer, matches, days, T: c => team[c] || { short: c, name: c, archers: [] }, A: id => archer[id] || { id, name: id, cat: '', team: '' } };
}

/* ---------- helpers on the built season ---------- */
export const sideOf = (m, code) => (m.teams.A === code ? 'A' : m.teams.B === code ? 'B' : null);
export const opp = (m, code) => (m.teams.A === code ? m.teams.B : m.teams.A);
export const scored = a => a.ph === 'S' && !a.to && a.s != null;
export const label = a => (a.ph !== 'S' ? (a.h ? 'Hit' : 'Miss') : a.to ? 'TO' : a.s === 10 && a.x ? 'X' : a.s === 0 ? 'M' : String(a.s));
const mean = l => (l.length ? l.reduce((x, v) => x + v, 0) / l.length : null);

/* each arrow's place in its team's set: 1st to 8th */
export function positions(m) {
  const pos = new Map(); const c = {};
  m.arrows.forEach(a => { if (a.ph !== 'S') return; const k = a.set + a.t; c[k] = (c[k] || 0) + 1; pos.set(a, c[k]); });
  return pos;
}

export function pool(S, f) {
  // every scored set arrow with its match and team code, filtered
  const out = [];
  S.matches.forEach(m => { const pos = positions(m); m.arrows.forEach(a => { if (!scored(a)) return; const code = m.teams[a.t]; const o = { a, m, code, pos: pos.get(a) }; if (!f || f(o)) out.push(o); }); });
  return out;
}

export function summarize(list) {
  const sc = list.map(o => o.a.s); const tm = list.map(o => o.a.dt).filter(v => v != null);
  const dist = { X: 0, 10: 0, 9: 0, 8: 0, 7: 0, low: 0 };
  list.forEach(({ a }) => { if (a.s === 10 && a.x) dist.X++; else if (a.s === 10) dist[10]++; else if (a.s >= 7) dist[a.s]++; else dist.low++; });
  return {
    n: sc.length, sum: sc.reduce((x, v) => x + v, 0), avg: mean(sc), ten: sc.filter(v => v === 10).length, x: dist.X, miss: sc.filter(v => v === 0).length,
    tenRate: sc.length ? sc.filter(v => v === 10).length / sc.length : null, dist, tn: tm.length, at: mean(tm), fast: tm.length ? Math.min(...tm) : null, slow: tm.length ? Math.max(...tm) : null
  };
}

export function standings(S, upTo) {
  const st = {}; TEAMS.forEach(t => { st[t] = { t, P: 0, W: 0, L: 0, Pts: 0, SF: 0, SA: 0, form: [], h2h: {} }; });
  S.matches.filter(m => m.stage === 'League' && (!upTo || m.d <= upTo)).forEach(m => {
    ['A', 'B'].forEach(k => {
      const o = st[m.teams[k]], other = m.teams[k === 'A' ? 'B' : 'A'], won = m.win === m.teams[k];
      o.P++; if (won) { o.W++; o.Pts += 2; } else o.L++;
      if (m.sp) { o.SF += m.sp[k]; o.SA += m.sp[k === 'A' ? 'B' : 'A']; }
      o.form.push({ m, won }); o.h2h[other] = (o.h2h[other] || 0) + (won ? 1 : 0);
    });
  });
  return Object.values(st).sort((a, b) => b.Pts - a.Pts || (b.h2h[a.t] || 0) - (a.h2h[b.t] || 0) || (b.SF - b.SA) - (a.SF - a.SA));
}

export function teamSets(S, code) {
  const out = [];
  S.matches.forEach(m => { const k = sideOf(m, code); if (!k) return; const o = k === 'A' ? 'B' : 'A';
    m.sets.forEach(st => { if (st.cnt[k] >= 8) out.push({ m, n: st.n, tot: st.tot[k], vs: st.tot[o], full: st.full, won: st.full ? st.tot[k] > st.tot[o] : null, tie: st.full && st.tot[k] === st.tot[o], used: usedTime(m, st.n, k) }); }); });
  return out;
}
export function usedTime(m, n, k) {
  const l = m.arrows.filter(a => a.ph === 'S' && a.set === n && a.t === k);
  if (l.length < 8 || l.some(a => a.bad)) return null;
  // only trust it when the last arrow's own time checks out (a stuck clock repeats the previous reading)
  const last = l[l.length - 1]; return last.cl != null && last.dt != null ? CLOCK - last.cl : null;
}

export function archers(S, f) {
  const by = {};
  S.matches.forEach(m => { if (m.src !== 'recorded') return; const pos = positions(m);
    m.arrows.forEach(a => { if (!a.a) return; const o = by[a.a] || (by[a.a] = { id: a.a, list: [], so: [], to: 0, ms: new Set(), spots: [] });
      if (a.ph === 'S' && a.to) { o.to++; o.ms.add(m.key); return; }
      if (scored(a)) { const it = { a, m, code: m.teams[a.t], pos: pos.get(a) }; if (!f || f(it)) { o.list.push(it); o.ms.add(m.key); if (a.p) o.spots.push(a.p); } }
      else if (a.ph !== 'S') o.so.push(a); }); });
  return Object.values(by).filter(o => o.list.length).map(o => { const g = grouping(o.spots); return Object.assign({ ar: S.A(o.id), matches: o.ms.size, soHits: o.so.filter(a => a.h).length, soN: o.so.length, g, agi: g.agi, group: g.group, fromX: g.fromX, spotN: g.n }, summarize(o.list), o); });
}

export function records(S) {
  const sets = [];
  S.matches.forEach(m => m.sets.forEach(st => ['A', 'B'].forEach(k => { if (st.cnt[k] >= 8) { const o = k === 'A' ? 'B' : 'A'; const l = m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === k && scored(a));
    sets.push({ m, n: st.n, code: m.teams[k], tot: st.tot[k], vs: st.tot[o], oppCode: m.teams[o], tens: l.filter(a => a.s === 10).length, used: usedTime(m, st.n, k), full: st.full }); } })));
  sets.forEach(x => { x.margin = x.full ? x.tot - x.vs : null; });
  const top = (key, dir, f) => sets.filter(x => x[key] != null && (!f || f(x))).sort((a, b) => dir * (b[key] - a[key]))[0];
  return {
    bestSet: top('tot', 1), worstSet: top('tot', -1), mostTens: top('tens', 1), fastestSet: top('used', -1), slowestSet: top('used', 1), biggestWin: top('margin', 1),
    tiedSets: sets.filter(x => x.full && x.tot === x.vs).length / 2, sets, perfect: sets.filter(x => x.tot === 80)
  };
}

/* ---------- grouping ----------
   Spots are stored with the face radius as 1. The APL face is the 122 cm face, so 1 unit = 61 cm.
   AGI (Arrow Grouping Index, Archery Analytics / ianseo):
     covariance of the hits about their own centre (n − 1), eigenvalues λM, λm,
     pooled SD  psd = √((n − 1)/(2n) · (λM + λm)),  angular SD = psd / distance,
     AGI = 100 · (αmax − asd) / αmax  with αmax = 1.22 m / 70 m (the whole 122 cm face at 70 m), floored at 0.
   On a 122 cm face that reduces to AGI = 100 · (1 − psd / 1.22 m), whatever the distance. */
export const FACE_CM = 61;
export function grouping(spots) {
  const n = spots.length; if (n < 3) return { n };
  const cx = spots.reduce((s, p) => s + p[0], 0) / n, cy = spots.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0; spots.forEach(p => { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
  sxx /= n - 1; syy /= n - 1; sxy /= n - 1;
  const det = Math.sqrt(Math.max(0, (sxx + syy) ** 2 - 4 * (sxx * syy - sxy * sxy)));
  const lM = (sxx + syy + det) / 2, lm = Math.max(0, (sxx + syy - det) / 2);
  const psd = Math.sqrt(((n - 1) / (2 * n)) * (lM + lm)) * FACE_CM / 100;          // metres
  const agi = Math.max(0, 100 * (1 - psd / 1.22));
  const cm = v => v * FACE_CM;
  const mr = spots.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / n;  // mean radius about the group centre
  const dc = spots.reduce((s, p) => s + Math.hypot(p[0], p[1]), 0) / n;              // mean distance from the X
  return {
    n, agi, group: cm(mr), fromX: cm(dc), off: cm(Math.hypot(cx, cy)), cx, cy,
    // 90% scatter ellipse (semi-axes 1.645 SD), in face units for drawing
    ell: { rx: 1.645 * Math.sqrt(lM), ry: 1.645 * Math.sqrt(lm), ang: Math.atan2(lM - sxx, sxy) * 180 / Math.PI }, dir: dirOf(cx, cy)
  };
}
/* which way the group sits off the middle (y grows downwards on the face) */
function dirOf(x, y) {
  if (Math.hypot(x, y) < 0.012) return 'centred';
  const a = (Math.atan2(-y, x) * 180 / Math.PI + 360) % 360;
  return ['right', 'high right', 'high', 'high left', 'left', 'low left', 'low', 'low right'][Math.round(a / 45) % 8];
}

/* Final standings for the whole tournament: champion, runner-up, then by playoff exit (Eliminator 2 before Eliminator 1),
   then the teams that missed the playoffs in league order. Teams still alive in unfinished playoffs sit above anyone already out. */
export function finalStandings(S) {
  const lg = standings(S); const lpos = Object.fromEntries(lg.map((o, i) => [o.t, i + 1]));
  const po = S.matches.filter(m => m.stage !== 'League');
  const inPO = new Set(po.flatMap(m => [m.teams.A, m.teams.B]));
  const done = m => m.win === m.teams.A || m.win === m.teams.B;
  const fin = po.find(m => m.stage === 'The Final'), e2 = po.find(m => m.stage === 'Eliminator 2'), e1 = po.find(m => m.stage === 'Eliminator 1');
  const tier = {}, note = {};
  lg.forEach(o => { if (inPO.has(o.t)) { tier[o.t] = 1.5; note[o.t] = 'In the playoffs'; } else { tier[o.t] = 4; note[o.t] = 'League stage'; } });
  const lost = (m, tr, n) => { if (m && done(m)) { const l = opp(m, m.win); tier[l] = tr; note[l] = n; } };
  lost(e1, 3, 'Out in Eliminator 1'); lost(e2, 2, 'Out in Eliminator 2');
  if (fin && done(fin)) { tier[fin.win] = 0; note[fin.win] = 'Champions'; tier[opp(fin, fin.win)] = 1; note[opp(fin, fin.win)] = 'Runners-up'; }
  return lg.map(o => Object.assign({}, o, { league: lpos[o.t], stage: note[o.t], tier: tier[o.t] }))
    .sort((a, b) => a.tier - b.tier || a.league - b.league);
}
