/* Ideas board: every idea from the "APL Analytics Ideas" notes, where it lives on the site, and how far along it is. */
import { html } from '../../vendor/preact-htm.js';

const D = 'done', R = 'rough', W = 'needs data';
export const IDEAS = [
  ['Home: team logos and points table', '#/', D],
  ['Wind for each day and match timings', '#/matches', R, 'Match timings come from the broadcast. Wind is not recorded anywhere yet.'],
  ['Team strategy: who shot when', '#/teams', R, 'Shooting-order grid and set orders on each team page.'],
  ['Leaderboard based on filters', '#/analytics/leaderboard', D],
  ['Best archer at each position 1–8', '#/analytics/positions', D],
  ['Best player in each time window', '#/analytics/time', R],
  ['Time crunch vs shot made', '#/analytics/time', R, `Crunch = 15 s or less left on the team clock.`],
  ['Crucial arrow: best team', '#/analytics/pressure', R, 'Crucial = last two arrows of a set within 3 points.'],
  ['Who manages time best', '#/analytics/time', R],
  ['Best compounder and best recurver', '#/analytics/leaderboard', D],
  ['Best substitute', '#/analytics/strategy', R, 'Uses the line-up changes recorded in the scorebook.'],
  ['Shoot-off stats', '#/analytics/comebacks', R],
  ['Sets won by a trailing team', '#/analytics/comebacks', R],
  ['Average time by each teammate', '#/teams', D, 'Squad table on each team page.'],
  ['AGI for every archer', '#/players', D],
  ['Pressure index at every arrow', '#/analytics/pressure', R, 'First formula; weights can be tuned.'],
  ['Time taken vs score', '#/analytics/time', D],
  ['Event-wise analytics', '#/analytics/events', R],
  ['Match-wise analytics', '#/matches', R],
  ['Archer-wise analytics', '#/players', R],
  ['Team-wise analytics', '#/teams', R],
  ['First 4 arrows vs last 4 arrows', '#/analytics/positions', D],
  ['Most efficient in time: less time, more score', '#/analytics/time', D],
  ['How predictable teams are; predict their score', '#/analytics/strategy', R, 'A simple line-up-average prediction for now.'],
  ['How many close 9s', '#/analytics/pressure', R, 'Needs the spot of each arrow, so recorded matches only.'],
  ['Last 2 arrows: time needed for the best result', '#/analytics/time', R],
  ['Ideal time to shoot for each archer', '#/analytics/time', D],
  ['Running news ticker with cool analytics', '#/', D, 'Under the header; pauses on hover; every item links to its source.'],
  ['Trends in team strategies', '#/teams', W, 'Set orders are shown; trend lines need more recorded matches.']
];
const LBL = { [D]: 'Built', [R]: 'Rough first pass', [W]: 'Waiting on data' };

export function Ideas() {
  return html`<div class="page"><h1 class="pt">Ideas board</h1>
    <p class="lead small">Every idea from the notes, grouped into the site's pages. Pick one and we'll refine it.</p>
    <section class="panel"><div class="ideas">${IDEAS.map(([t, h, s, n]) => html`<a class="idea" href=${h}><span class=${'st ' + s.replace(' ', '-')}>${LBL[s]}</span><b>${t}</b>${n ? html`<small class="muted">${n}</small>` : ''}</a>`)}</div></section>
  </div>`;
}
