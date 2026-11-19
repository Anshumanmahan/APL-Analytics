/* What set score wins a set: one row per set total (80 at the top down to the lowest recorded), the bar is the
   chance a set with that total is won. The chance comes from every complete set this season: how many of the
   set totals teams scored it beats (and how many it ties). Every set has the same mix of two recurve and two
   compound archers, so set totals compare fairly across teams. */
import { html } from '../../vendor/preact-htm.js';

export function setTotals(S) {
  const out = [];
  S.matches.forEach(m => m.sets.forEach(st => { if (!st.full) return;
    out.push({ t: st.tot.A, r: st.tot.A > st.tot.B ? 'W' : st.tot.A < st.tot.B ? 'L' : 'T' }, { t: st.tot.B, r: st.tot.B > st.tot.A ? 'W' : st.tot.B < st.tot.A ? 'L' : 'T' }); }));
  return out;
}

export function SetScoreChance({ S }) {
  const all = setTotals(S); if (all.length < 10) return html`<p class="empty">Not enough complete sets yet.</p>`;
  const N = all.length; const lo = Math.min(...all.map(o => o.t)), hi = Math.max(80, ...all.map(o => o.t));
  const rows = []; for (let t = hi; t >= lo; t--) {
    const below = all.filter(o => o.t < t).length, same = all.filter(o => o.t === t).length;
    const win = below / N, tie = same / N; const here = all.filter(o => o.t === t);
    rows.push({ t, win, tie, n: here.length, w: here.filter(o => o.r === 'W').length });
  }
  const even = rows.slice().reverse().find(r => r.win + r.tie / 2 >= 0.5);
  return html`<div class="ssc">
    <div class="ssc-axis"><span>Set score</span><span>Chance of winning the set →</span></div>
    <div class="ssc-rows">${rows.map(r => html`<div class=${'ssc-row' + (even && r.t === even.t ? ' even' : '')} title=${`${r.t}: wins ${Math.round(100 * r.win)}%, ties ${Math.round(100 * r.tie)}%${r.n ? `. Scored ${r.n} time${r.n > 1 ? 's' : ''}, won ${r.w}` : ''}`}>
      <b class="ssc-t">${r.t}</b>
      <span class="ssc-bar"><i class="w" style=${`width:${(100 * r.win).toFixed(1)}%`}></i><i class="tie" style=${`width:${(100 * r.tie).toFixed(1)}%`}></i></span>
      <span class="ssc-p"><b>${Math.round(100 * r.win)}%</b>${r.n ? html`<small>won ${r.w} of ${r.n}</small>` : ''}</span></div>`)}
      <div class="ssc-grid">${[0, 25, 50, 75, 100].map(v => html`<i style=${`left:${v}%`}><span>${v}%</span></i>`)}</div>
    </div>
    <p class="samp">Gold bar: the chance that a set with this score is won, from all ${N} team set totals this season (the share of them it beats). Grey: the chance of a tie. "Won x of y" is what really happened when a team scored exactly that. ${even ? html`From <b>${even.t}</b> up, a set is more likely won than not.` : ''} Every set has the same two recurve and two compound archers per team, so totals compare fairly.</p>
  </div>`;
}
