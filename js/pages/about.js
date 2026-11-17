/* Meet the creator (a mini resume) and Contact. Everything personal lives in PROFILE, so it is one place to edit.
   Sections with nothing filled in are left out, so the page never shows empty boxes. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app } from '../lib/ui.js';

export const TAGLINE = 'The only stats platform for the Archery Premier League';

export const PROFILE = {
  name: 'Anshuman Dixit',
  title: 'Sports data scientist · Archery',
  place: 'From Lucknow · based in Ahmedabad',
  tags: ['Creator of APL Analytics', 'Vijayi Bharat Foundation', 'M.S. Sports Analytics, Indiana University', 'Dartfish'],
  badge: "India's first archery data scientist at a high-performance centre",  // understated first-of-its-kind line
  bio: 'A sports data scientist building data tools for Indian archery at Vijayi Bharat Foundation, and the person recording every APL arrow behind this site.',
  portrait: '/img/creator-dp.jpg',
  story: [
    'I fell for archery after joining VBF. I could see how much potential the sport has in India, and how much data science could add to it.',
    'India is still waiting for its first Olympic medal in archery. That one fact pushed my motivation through the roof.',
    "I've even shot recurve myself, from 20 to 30 metres. We all start somewhere."
  ],
  facts: [                   // rapid fire: [question, answer]
    ['Best archer of all time', 'Mete Gazoz. I love his shooting style and his personality.'],
    ['Favourite APL team', 'Rajputana Royals'],
    ['Favourite archer this season', 'Elia Canales'],
    ['Recurve or compound?', 'Recurve'],
    ["A moment I'll never forget", 'Last season\'s final: Mathias Grande hit an 8 when he needed a 9 to win, and Rajputana Royals took the league.'],
    ['The stat every archer should track', 'Hold time under pressure, and how hold time relates to score.']
  ],
  roles: [                   // [role, detail]
    ['Sports data scientist, Vijayi Bharat Foundation', 'Since June 2025. I build, and keep improving, apps for VBF\'s archers and coaches, and help the coaches with video analysis using Dartfish.'],
    ['On the road with the team', 'Multiple competitions with the VBF squad, recording data live on an app I built myself.'],
    ['Working with the best', 'National and international coaches, and national and international medal-winning archers.'],
    ['Korea training camp', 'Went with our archers to the Kim Hyung Tak Archery Training Center and learnt a lot from Coach Kim about video analysis and archers in general.']
  ],
  timeline: [                // [when, what happened]
    ['Study', 'B.Tech in Computer Science and Engineering'],
    ['Study', 'M.S. in Sports Analytics, Indiana University'],
    ['USA', 'Worked in football in the United States'],
    ['2 years', 'Inspire Institute of Sport (JSW)'],
    ['Jun 2025', 'Joined Vijayi Bharat Foundation as a sports data scientist'],
    ['Korea', 'Training camp at the Kim Hyung Tak Archery Training Center']
  ],
  why: 'I built APL Analytics for coaches, archers and Indian archery as a whole. Archers and coaches love numbers, and until now no platform showed the APL\'s stats. This one does, arrow by arrow.',
  gallery: [                 // [src, caption, wide?]
    ['/img/creator-recording.jpg', 'Recording data at a competition on an app I built myself'],
    ['/img/creator-kim-hyung-tak.jpg', 'With Coach Kim at the Kim Hyung Tak Archery Training Center', 'wide'],
    ['/img/creator-korea-camp.jpg', 'Korea training camp with the archers and Coach Kim', 'wide'],
    ['/img/creator-vbf-range.jpg', "Strolling around VBF's archery range"]
  ],
  // only what was given for the site, shown on Contact: [label, value, href]
  contacts: [
    ['Email', 'anshumandixit1996@gmail.com', 'mailto:anshumandixit1996@gmail.com'],
    ['Instagram', '@arrowlyticx', 'https://www.instagram.com/arrowlyticx/'],
    ['LinkedIn', 'in/anshumandixit26', 'https://www.linkedin.com/in/anshumandixit26/']
  ]
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
        ${(P.tags.length || P.badge) ? html`<div class="cr-tags">${P.badge && html`<span class="cr-first"><i></i>${P.badge}</span>`}${P.tags.map(t => html`<span>${t}</span>`)}</div>` : ''}
        <p class="lead">${P.bio || 'Number cruncher on the archery range, and the person recording every APL arrow behind this site.'}</p>
        <div class="cr-cta"><a class="btn pri" href="#/contact">Get in touch</a><a class="btn" href="#/ideas">See what's being built</a></div></div>
    </section>

    <div class="cr-stats">
      <div><b>${st.arrows.toLocaleString('en-IN')}</b><span>arrows recorded by hand</span></div>
      <div><b>${st.matches}</b><span>matches logged arrow by arrow</span></div>
      <div><b>${st.total}</b><span>matches tracked this season</span></div>
    </div>

    ${P.story && P.story.length ? html`<section class="panel cr-story"><h2>How archery found me</h2>${P.story.map(t => html`<p>${t}</p>`)}</section>` : ''}

    ${P.facts.length ? html`<section class="panel"><h2>Rapid fire</h2><div class="cr-facts">${P.facts.map(([q, a]) => html`<div class="cr-fact"><small>${q}</small><b>${a}</b></div>`)}</div></section>` : ''}

    ${(P.roles.length || P.timeline.length) ? html`<div class=${P.roles.length && P.timeline.length ? 'grid2' : ''}>
      ${P.roles.length ? html`<section class="panel"><h2>In the sport</h2><div class="cr-roles">${P.roles.map(([r, d]) => html`<div><b>${r}</b>${d && html`<span class="muted">${d}</span>`}</div>`)}</div></section>` : ''}
      ${P.timeline.length ? html`<section class="panel"><h2>Journey so far</h2><ol class="cr-tl">${P.timeline.map(([y, t]) => html`<li><time>${y}</time><span>${t}</span></li>`)}</ol></section>` : ''}
    </div>` : ''}

    ${P.gallery.length ? html`<section class="panel cr-galp"><h2>On the range</h2><div class="cr-gal">${P.gallery.map(([src, cap, wide]) => html`<figure class=${wide || ''}><img src=${src} alt=${cap}  /><figcaption>${cap}</figcaption></figure>`)}</div></section>` : ''}

    <div class="grid2">
      <section class="panel"><h2>Why APL Analytics</h2>
        <p class="cr-only"><i></i>${TAGLINE}</p>
        ${P.why ? html`<p>${P.why}</p>` : html`<p>APL Analytics looks at the Archery Premier League arrow by arrow. It covers who shoots best and at which position, how archers use the shot clock, who rises under pressure, and how teams plan their sets.</p>`}
        <p>Recurve and compound are always kept apart, because compound scores run higher by nature.</p></section>
      <section class="panel"><h2>Where the numbers come from</h2>
        <p>Every arrow is recorded by hand from the broadcast in a custom scorebook: the archer, the score, where it landed on the target, and the shot clock. Results follow the official reports, and matches not yet recorded use the TV scoreboard.</p></section>
    </div>
    <p class="muted small cr-note">APL Analytics is an independent fan project. It is not run by or connected to the Archery Premier League, its teams or World Archery. Team names and logos belong to their owners.</p>
  </div>`;
}

/* Contact form → Google Sheet. Paste the Apps Script web app URL here (ends in /exec); see docs/contact-form-google-sheet.md.
   Until it is set, the form opens the visitor's email app with the message filled in instead. */
export const FORM_URL = 'https://script.google.com/macros/s/AKfycbwXQMrDEspoWBU6NKdVQFU481jw2CX7r2DIKLeZfxPUKT4T4MszWEepb3RnbHaHy4uU_Q/exec';
const TOPICS = ['General question', 'Spotted a data error', 'Idea for a stat or feature', 'Collaboration or media', 'Other'];

function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', topic: TOPICS[0], match: '', message: '', website: '' });
  const [st, setSt] = useState('idle'); // idle | sending | sent | error
  const set = k => e => setF(Object.assign({}, f, { [k]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); if (f.website) return setSt('sent'); // honeypot: bots fill the hidden field
    const body = { name: f.name.trim(), email: f.email.trim(), topic: f.topic, match: f.match.trim(), message: f.message.trim(), page: location.href, sent: new Date().toISOString() };
    if (!FORM_URL) {
      const mail = PROFILE.contacts.find(c => c[0] === 'Email');
      location.href = (mail ? mail[2] : 'mailto:') + '?subject=' + encodeURIComponent('APL Analytics: ' + body.topic) + '&body=' + encodeURIComponent(`${body.message}\n\n${body.match ? 'Match: ' + body.match + '\n' : ''}From: ${body.name} <${body.email}>`);
      return;
    }
    setSt('sending');
    try { await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(body) }); setSt('sent'); }
    catch (err) { setSt('error'); }
  };
  if (st === 'sent') return html`<div class="cf-done"><b>Thanks, ${f.name.split(' ')[0] || 'friend'}!</b><p class="muted">Your message is in. ${PROFILE.name.split(' ')[0]} will get back to you at ${f.email || 'your email'}.</p><button class="btn" onClick=${() => { setF(Object.assign({}, f, { message: '', match: '' })); setSt('idle'); }}>Send another</button></div>`;
  return html`<form class="cf" onSubmit=${submit}>
    <label class="cf-f"><span>Name</span><input required maxlength="80" autocomplete="name" value=${f.name} onInput=${set('name')} placeholder="Your name" /></label>
    <label class="cf-f"><span>Email</span><input required type="email" maxlength="120" autocomplete="email" value=${f.email} onInput=${set('email')} placeholder="you@example.com" /></label>
    <label class="cf-f"><span>Topic</span><select value=${f.topic} onChange=${set('topic')}>${TOPICS.map(t => html`<option value=${t} selected=${t === f.topic}>${t}</option>`)}</select></label>
    <label class="cf-f"><span>Match, set or arrow <em>(optional)</em></span><input maxlength="120" value=${f.match} onInput=${set('match')} placeholder="e.g. Day 4, match 2, set 3, arrow 6" /></label>
    <label class="cf-f cf-wide"><span>Message</span><textarea required rows="5" maxlength="3000" value=${f.message} onInput=${set('message')} placeholder="What's on your mind?"></textarea></label>
    <label class="cf-hp" aria-hidden="true">Website<input tabindex="-1" autocomplete="off" value=${f.website} onInput=${set('website')} /></label>
    <div class="cf-go cf-wide"><button class="btn pri" disabled=${st === 'sending'}>${st === 'sending' ? 'Sending…' : 'Send message'}</button>
      ${st === 'error' ? html`<span class="err">That didn't go through. Check your connection, or email instead.</span>` : html`<small class="muted">Your details are only used to reply to you.</small>`}</div>
  </form>`;
}

export function Contact() {
  const c = PROFILE.contacts;
  return html`<div class="page about">
    <section class="me"><${Photo} size=${110} />
      <div><p class="kicker">Contact us</p><h1 class="pt">Get in touch</h1>
        <p class="lead">Questions, ideas for new stats, or spotted a number that looks wrong? Reach out to ${PROFILE.name.split(' ')[0]}.</p></div></section>
    <div class="ct-grid">
      <section class="panel"><h2>Send a message</h2><${ContactForm} /></section>
      <section class="panel"><h2>Or reach ${PROFILE.name.split(' ')[0]} directly</h2>
        ${c.length ? html`<div class="contacts ct-list">${c.map(([l, v, h]) => html`<a class="contact" href=${h} target=${h.startsWith('http') ? '_blank' : null} rel="noopener"><small>${l}</small><b>${v}</b></a>`)}</div>`
          : html`<p class="muted">Contact details coming soon.</p>`}
        <h3 class="sub">Reporting a data error?</h3><p class="small">Give the match (day and match number), the set and the arrow, and it will be checked against the video.</p>
        <a class="lnk" href="#/creator">Meet the creator →</a></section>
    </div>
  </div>`;
}
