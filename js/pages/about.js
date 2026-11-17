/* Meet the creator (a mini resume) and Contact. Everything personal lives in PROFILE, so it is one place to edit.
   Sections with nothing filled in are left out, so the page never shows empty boxes. */
import { html } from '../../vendor/preact-htm.js';
import { app } from '../lib/ui.js';

export const PROFILE = {
  name: 'Anshuman',
  title: 'Creator of APL Analytics',
  place: '',                 // e.g. "From X · based in Y"
  tags: [],                  // short chips, e.g. ['Recurve', 'Analyst']
  bio: '',                   // a few lines about you
  portrait: '/img/creator.webp',
  facts: [],                 // rapid fire: [question, answer]
  roles: [                   // [role, detail]
    ['Competition data recording', 'I record scores live at competitions on an app I built myself.'],
    ['Korea training camp', 'Travelled with archers to the Kim Hyung Tak Archery Training Center and learnt a lot from Coach Kim about video analysis and archers in general.']
  ],
  timeline: [],              // [year, what happened]
  why: '',                   // why you built this site
  gallery: [                 // [src, caption, wide?]
    ['/img/creator-recording.webp', 'Recording data at a competition on an app I built myself'],
    ['/img/creator-kim-hyung-tak.webp', 'With Coach Kim at the Kim Hyung Tak Archery Training Center', 'wide'],
    ['/img/creator-korea-camp.webp', 'Korea training camp with the archers and Coach Kim', 'wide'],
    ['/img/creator-vbf-range.webp', "Strolling around VBF's archery range"]
  ],
  // only what you choose to show publicly: [label, value, href]
  contacts: []
};

const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const Photo = ({ size = 150 }) => (PROFILE.portrait
  ? html`<img class="me-photo" src=${PROFILE.portrait} alt=${PROFILE.name} width=${size} height=${size} />`
  : html`<span class="me-photo me-ini" style=${`width:${size}px;height:${size}px`}>${initials(PROFILE.name)}</span>`);

function siteStats(S) {
  const rec = S.matches.filter(m => m.src === 'recorded');
  return { matches: rec.length, arrows: rec.reduce((n, m) => n + m.arrows.length, 0), total: S.matches.length };
}

export function About() {
  const P = PROFILE; const st = siteStats(app.S);
  return html`<div class="page about creator">
    <section class="cr-hero">
      <div class="cr-ph"><${Photo} size=${168} /><span class="cr-ring"></span></div>
      <div class="cr-id"><p class="kicker">Meet the creator</p><h1 class="pt">${P.name}</h1>
        ${P.title && html`<p class="me-role">${P.title}</p>`}
        ${P.place && html`<p class="muted cr-place">${P.place}</p>`}
        ${P.tags.length ? html`<div class="cr-tags">${P.tags.map(t => html`<span>${t}</span>`)}</div>` : ''}
        <p class="lead">${P.bio || 'Archery fan, number cruncher and the person recording every APL arrow behind this site.'}</p>
        <div class="cr-cta"><a class="btn pri" href="#/contact">Get in touch</a><a class="btn" href="#/ideas">See what's being built</a></div></div>
    </section>

    <div class="cr-stats">
      <div><b>${st.arrows.toLocaleString('en-IN')}</b><span>arrows recorded by hand</span></div>
      <div><b>${st.matches}</b><span>matches logged arrow by arrow</span></div>
      <div><b>${st.total}</b><span>matches tracked this season</span></div>
    </div>

    ${P.facts.length ? html`<section class="panel"><h2>Rapid fire</h2><div class="cr-facts">${P.facts.map(([q, a]) => html`<div class="cr-fact"><small>${q}</small><b>${a}</b></div>`)}</div></section>` : ''}

    ${(P.roles.length || P.timeline.length) ? html`<div class=${P.roles.length && P.timeline.length ? 'grid2' : ''}>
      ${P.roles.length ? html`<section class="panel"><h2>In the sport</h2><div class="cr-roles">${P.roles.map(([r, d]) => html`<div><b>${r}</b>${d && html`<span class="muted">${d}</span>`}</div>`)}</div></section>` : ''}
      ${P.timeline.length ? html`<section class="panel"><h2>Archery journey</h2><ol class="cr-tl">${P.timeline.map(([y, t]) => html`<li><time>${y}</time><span>${t}</span></li>`)}</ol></section>` : ''}
    </div>` : ''}

    ${P.gallery.length ? html`<section class="panel"><h2>On the range</h2><div class="cr-gal">${P.gallery.map(([src, cap, wide]) => html`<figure class=${wide || ''}><img src=${src} alt=${cap} loading="lazy" /><figcaption>${cap}</figcaption></figure>`)}</div></section>` : ''}

    <div class="grid2">
      <section class="panel"><h2>Why APL Analytics</h2>
        ${P.why ? html`<p>${P.why}</p>` : html`<p>APL Analytics looks at the Archery Premier League arrow by arrow. It covers who shoots best and at which position, how archers use the shot clock, who rises under pressure, and how teams plan their sets.</p>`}
        <p>Recurve and compound are always kept apart, because compound scores run higher by nature.</p></section>
      <section class="panel"><h2>Where the numbers come from</h2>
        <p>Every arrow is recorded by hand from the broadcast in a custom scorebook: the archer, the score, where it landed on the target, and the shot clock. Results follow the official reports, and matches not yet recorded use the TV scoreboard.</p></section>
    </div>
    <p class="muted small cr-note">APL Analytics is an independent fan project. It is not run by or connected to the Archery Premier League, its teams or World Archery. Team names and logos belong to their owners.</p>
  </div>`;
}

export function Contact() {
  const c = PROFILE.contacts;
  return html`<div class="page about">
    <section class="me"><${Photo} size=${110} />
      <div><p class="kicker">Contact us</p><h1 class="pt">Get in touch</h1>
        <p class="lead">Questions, ideas for new stats, or spotted a number that looks wrong? Reach out to ${PROFILE.name}.</p></div></section>
    <figure class="ct-banner"><img src="/img/creator-kim-hyung-tak.webp" alt=${PROFILE.name + ' with Coach Kim at the Kim Hyung Tak Archery Training Center'} /><figcaption>${PROFILE.name} with Coach Kim at the Kim Hyung Tak Archery Training Center</figcaption></figure>
    <section class="panel"><h2>Reach ${PROFILE.name}</h2>
      ${c.length ? html`<div class="contacts">${c.map(([l, v, h]) => html`<a class="contact" href=${h} target=${h.startsWith('http') ? '_blank' : null} rel="noopener"><small>${l}</small><b>${v}</b></a>`)}</div>`
        : html`<p class="muted">Contact details coming soon.</p>`}</section>
    <div class="grid2">
      <section class="panel"><h2>Report a data error</h2><p>If an arrow, score or result looks wrong, give the match (day and match number), the set and the arrow, and it will be checked against the video.</p></section>
      <section class="panel"><h2>Meet the creator</h2><p>Who is behind the numbers, and why this site exists.</p><a class="lnk" href="#/creator">Read the story →</a></section>
    </div>
  </div>`;
}
