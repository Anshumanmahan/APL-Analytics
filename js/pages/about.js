/* About and Contact. Everything personal lives in PROFILE, so it is one place to edit. */
import { html } from '../../vendor/preact-htm.js';
import { app } from '../lib/ui.js';

export const PROFILE = {
  name: 'Anshuman',
  role: '',              // e.g. "Creator of APL Analytics"
  bio: '',               // a few lines about you
  photo: '',             // e.g. '/img/anshuman.jpg'
  // only what you choose to show publicly: [label, value, href]
  contacts: []
};

const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const Photo = ({ size = 140 }) => (PROFILE.photo
  ? html`<img class="me-photo" src=${PROFILE.photo} alt=${PROFILE.name} width=${size} height=${size} />`
  : html`<span class="me-photo me-ini" style=${`width:${size}px;height:${size}px`}>${initials(PROFILE.name)}</span>`);

export function About() {
  const S = app.S; const rec = S.matches.filter(m => m.src === 'recorded').length;
  const arrows = S.matches.filter(m => m.src === 'recorded').reduce((n, m) => n + m.arrows.length, 0);
  return html`<div class="page about">
    <section class="me"><${Photo} />
      <div><p class="kicker">About us</p><h1 class="pt">${PROFILE.name}</h1>
        ${PROFILE.role && html`<p class="me-role">${PROFILE.role}</p>`}
        ${PROFILE.bio ? html`<p class="lead">${PROFILE.bio}</p>` : html`<p class="lead">The person behind APL Analytics.</p>`}
        <a class="btn pri" href="#/contact">Get in touch</a></div></section>

    <div class="grid2">
      <section class="panel"><h2>What this is</h2>
        <p>APL Analytics looks at the Archery Premier League arrow by arrow. It covers who shoots best and at which position, how archers use the shot clock, who rises under pressure, and how teams plan their sets.</p>
        <p>Recurve and compound are always kept apart, because compound scores run higher by nature.</p></section>
      <section class="panel"><h2>Where the numbers come from</h2>
        <p>Every arrow is recorded by hand from the broadcast in our own scorebook: the archer, the score, where it landed on the target, and the shot clock. So far that's <b>${rec}</b> matches and <b>${arrows.toLocaleString('en-IN')}</b> arrows, and the site updates as more are recorded.</p>
        <p>Results follow the official reports. Matches not yet recorded use the TV scoreboard.</p></section>
    </div>
    <section class="panel"><h2>Not official</h2><p class="muted">APL Analytics is an independent fan project. It is not run by or connected to the Archery Premier League, its teams or World Archery. Team names and logos belong to their owners.</p></section>
  </div>`;
}

export function Contact() {
  const c = PROFILE.contacts;
  return html`<div class="page about">
    <section class="me"><${Photo} size=${110} />
      <div><p class="kicker">Contact us</p><h1 class="pt">Get in touch</h1>
        <p class="lead">Questions, ideas for new stats, or spotted a number that looks wrong? Reach out.</p></div></section>
    <section class="panel"><h2>${PROFILE.name}</h2>
      ${c.length ? html`<div class="contacts">${c.map(([l, v, h]) => html`<a class="contact" href=${h} target=${h.startsWith('http') ? '_blank' : null} rel="noopener"><small>${l}</small><b>${v}</b></a>`)}</div>`
        : html`<p class="muted">Contact details coming soon.</p>`}</section>
    <section class="panel"><h2>Report a data error</h2><p>If an arrow, score or result looks wrong, tell us the match (day and match number), the set and the arrow, and we'll check it against the video.</p></section>
  </div>`;
}
