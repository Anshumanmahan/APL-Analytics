/* Substitutions: how often a team changes its playing 4.
   - In a match: a category's archer changes from one set to the next (shoot-off counts as a step after set 4).
   - Between matches: the archers who started a match against the ones who started the team's previous recorded match.
   Who shot is read from the arrows themselves (the line-up typed in the scorebook is only a fallback), so it is
   recorded matches only: the broadcast read doesn't say who shot. */
import { TEAMS, sideOf, opp } from './season.js';

export const CAT_SEQ = ['RM', 'RW', 'CM', 'CW'];

/* the archers who shot in one step of a match, by category: { RM: [id], ... } (two ids if a swap happened mid-set) */
function shooters(S, list) {
  const by = {}; const n = {};
  list.forEach(a => { if (!a.a) return; const c = S.A(a.a).cat; if (!c) return; by[c] = by[c] || []; if (!by[c].includes(a.a)) by[c].push(a.a); n[a.a] = (n[a.a] || 0) + 1; });
  return { by, n };
}

/* one team's recorded matches in order, with every step and every change */
export function lineupStory(S, code) {
  const all = S.matches.filter(m => sideOf(m, code)).sort((a, b) => a.no - b.no);
  const games = []; let prev = null;
  all.forEach((m, i) => {
    if (m.src !== 'recorded') return;
    const k = sideOf(m, code); const mine = m.arrows.filter(a => a.t === k);
    const steps = [];
    for (let n = 1; n <= 4; n++) { const l = mine.filter(a => a.ph === 'S' && a.set === n); if (l.length) steps.push(Object.assign({ n, label: 'Set ' + n }, shooters(S, l))); }
    const so = mine.filter(a => a.ph === 'SO' || a.ph === 'SD');
    if (so.length) steps.push(Object.assign({ n: 'SO', label: 'Shoot-off' }, shooters(S, so)));
    if (!steps.length) return;
    // fill a category nobody was seen in from the typed line-up, so a short set doesn't look like a change
    const L = m.lineups || {};
    steps.forEach((st, j) => { const typed = (L[st.n] || (j === 0 ? L[1] : null) || {})[k] || [];
      CAT_SEQ.forEach(c => { if (!st.by[c]) { const t = typed.find(id => S.A(id).cat === c); const back = j ? steps[j - 1].by[c] : null; if (t) st.by[c] = [t]; else if (back) st.by[c] = [back[back.length - 1]]; st.guess = st.guess || {}; st.guess[c] = 1; } }); });
    // in-match changes
    const subs = [];
    steps.forEach((st, j) => {
      CAT_SEQ.forEach(c => {
        const cur = st.by[c] || [];
        if (cur.length > 1) subs.push({ at: st.n, label: st.label, mid: true, cat: c, out: cur[0], in: cur[cur.length - 1] });
        if (!j) return; const was = steps[j - 1].by[c] || []; const w = was[was.length - 1], now = cur[0];
        if (w && now && w !== now) subs.push({ at: st.n, label: st.label, cat: c, out: w, in: now });
      });
    });
    const start = {}; CAT_SEQ.forEach(c => { const l = steps[0].by[c]; if (l) start[c] = l[0]; });
    // between matches: against the team's previous recorded match; note any unrecorded matches in between
    let changes = null, gap = 0;
    if (prev) {
      changes = CAT_SEQ.filter(c => start[c] && prev.start[c] && start[c] !== prev.start[c]).map(c => ({ cat: c, out: prev.start[c], in: start[c] }));
      gap = all.slice(all.indexOf(prev.m) + 1, i).length;
    }
    const g = { m, k, vs: opp(m, code), steps, subs, start, changes, gap };
    games.push(g); prev = g;
  });
  // per archer
  const per = {};
  const P = id => (per[id] = per[id] || { id, starts: 0, steps: 0, on: 0, off: 0, games: 0 });
  games.forEach(g => {
    const seen = new Set();
    CAT_SEQ.forEach(c => { if (g.start[c]) P(g.start[c]).starts++; });
    g.steps.forEach(st => CAT_SEQ.forEach(c => (st.by[c] || []).forEach(id => { if (st.guess && st.guess[c]) return; P(id).steps++; seen.add(id); })));
    seen.forEach(id => P(id).games++);
    g.subs.forEach(s => { P(s.in).on++; P(s.out).off++; });
  });
  const inMatch = games.reduce((x, g) => x + g.subs.length, 0);
  const withSub = games.filter(g => g.subs.length).length;
  const pairs = games.filter(g => g.changes);
  const between = pairs.reduce((x, g) => x + g.changes.length, 0);
  const same = pairs.filter(g => !g.changes.length).length;
  const byCat = {}; CAT_SEQ.forEach(c => { byCat[c] = { inMatch: 0, between: 0 }; });
  games.forEach(g => { g.subs.forEach(s => byCat[s.cat].inMatch++); (g.changes || []).forEach(s => byCat[s.cat].between++); });
  return { games, per, inMatch, withSub, pairs: pairs.length, between, same, byCat };
}

/* every team side by side, for a league rank */
export function leagueSubs(S) {
  return TEAMS.map(t => { const r = lineupStory(S, t); return { t, n: r.games.length, rate: r.games.length ? r.inMatch / r.games.length : null, brate: r.pairs ? r.between / r.pairs : null, r }; }).filter(o => o.n);
}
