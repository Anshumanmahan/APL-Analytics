/* Archer of the Day: picked by hand in the scorebook after each league day, one archer per category
   (sometimes two when it was shared). Stored as days[d].aotd[cat] = id or [ids]; read only. */
import { html } from '../../vendor/preact-htm.js';
import { dayName } from './season.js';
import { CAT_ORDER } from './rules.js';

export function awards(S) {
  const out = [];
  Object.keys(S.days || {}).map(Number).sort((a, b) => a - b).forEach(d => {
    const a = (S.days[d] || {}).aotd || {};
    CAT_ORDER.forEach(cat => { const ids = [].concat(a[cat] || []).filter(Boolean); ids.forEach(id => out.push({ d, cat, id, team: S.A(id).team, shared: ids.length > 1 })); });
  });
  return out;
}
export const awardsOf = (S, id) => awards(S).filter(w => w.id === id);
export const teamAwards = (S, code) => awards(S).filter(w => w.team === code);
export const awardDays = S => new Set(awards(S).map(w => w.d)).size;

const Star = () => html`<svg class="aw-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" /></svg>`;
export { Star };

/* the small gold count used on cards */
export const AwardMark = ({ n, title }) => n ? html`<span class="aw-mark" title=${title || `Archer of the Day ${n}×`}><${Star} />${n}</span>` : '';

/* day chips: "Day 3 · Thu 6 Nov", marked when the award was shared */
export const DayChips = ({ list }) => html`<span class="aw-days">${list.map(w => html`<span class="aw-day" title=${`Archer of the Day, day ${w.d}${w.shared ? ' (shared)' : ''}`}><b>Day ${w.d}</b>${w.shared ? html`<small>shared</small>` : ''}</span>`)}</span>`;

/* the player page ribbon, under the name */
export function AwardRibbon({ S, id }) {
  const l = awardsOf(S, id); if (!l.length) return '';
  const days = awardDays(S);
  return html`<div class="aw-ribbon"><span class="aw-badge"><${Star} /><b>Archer of the Day</b><em>${l.length}×</em></span>
    <${DayChips} list=${l} /><small class="aw-of">${l.length} of ${days} league day${days > 1 ? 's' : ''} so far</small></div>`;
}
