/* APL Analytics: routes, the data gate and the page shell. */
import { html, render, useState } from './../vendor/preact-htm.js';
import { buildSeason } from './lib/season.js';
import { load, loadOpen, hasPass, forget } from './lib/store.js';
import { app, cls } from './lib/ui.js';
import { Home } from './pages/home.js';
import { Teams, TeamPage } from './pages/teams.js';
import { Players, PlayerPage } from './pages/players.js';
import { Matches, MatchPage } from './pages/matches.js';
import { Analytics } from './pages/analytics.js';
import { Ideas } from './pages/ideas.js';
import { Ticker } from './pages/ticker.js';
import { About, Contact } from './pages/about.js';

const state = { status: 'loading', msg: '', loadedAt: null, open: false };
const rerender = () => render(html`<${App} />`, document.getElementById('root'));
app.render = rerender;

function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  const p = h[0] || '';
  if (p === 'team' && h[1]) return { tab: 'teams', el: html`<${TeamPage} code=${h[1].toUpperCase()} key=${h[1]} />` };
  if (p === 'player' && h[1]) return { tab: 'players', el: html`<${PlayerPage} id=${h[1]} key=${h[1]} />` };
  if (p === 'match' && h[1]) return { tab: 'matches', el: html`<${MatchPage} k=${h[1]} key=${h[1]} />` };
  if (p === 'teams') return { tab: 'teams', el: html`<${Teams} />` };
  if (p === 'players') return { tab: 'players', el: html`<${Players} />` };
  if (p === 'matches') return { tab: 'matches', el: html`<${Matches} />` };
  if (p === 'analytics') return { tab: 'analytics', el: html`<${Analytics} sec=${h[1] || 'leaderboard'} bow=${h[2] || 'R'} key=${'a' + (h[1] || '') + (h[2] || '')} />` };
  if (p === 'about' || p === 'creator') return { tab: 'about', el: html`<${About} />` };
  if (p === 'contact') return { tab: 'contact', el: html`<${Contact} />` };
  if (p === 'ideas') return { tab: 'ideas', el: html`<${Ideas} />` };
  return { tab: 'home', el: html`<${Home} />` };
}
window.addEventListener('hashchange', () => { rerender(); window.scrollTo(0, 0); });

function ready(rows) { app.S = buildSeason(rows); state.status = 'ready'; state.loadedAt = new Date(); state.msg = ''; }
async function open(p) {
  state.status = app.S ? 'ready' : 'loading'; state.refreshing = true; rerender();
  // the site's own read-only proxy first (no passcode needed once it is set up)
  if (!p) { const rows = await loadOpen(); if (rows) { state.open = true; ready(rows); state.refreshing = false; return rerender(); } }
  if (!p && !hasPass()) { state.status = app.S ? 'ready' : 'gate'; state.refreshing = false; return rerender(); }
  const r = await load(p);
  if (r.status === 'ok') ready(r.rows);
  else if (r.status === 'wrong') { forget(); state.status = 'gate'; state.msg = p ? 'That passcode didn’t work. Try again.' : ''; }
  else { state.status = app.S ? 'ready' : 'gate'; state.msg = 'The season data can’t be reached right now. Check your connection and try again.'; }
  state.refreshing = false; rerender();
}

function Gate() {
  const [v, setV] = useState('');
  return html`<div class="gate"><form onSubmit=${e => { e.preventDefault(); if (v) open(v); }}>
    <img class="gate-t" src="/logo.svg" alt="" />
    <h1>APL Analytics</h1><p class="cr-only gate-only"><i></i>The only stats platform for the Archery Premier League</p><p>Enter the scorebook passcode to see the season.</p>
    <input type="password" autocomplete="off" maxlength="24" value=${v} placeholder="••••" aria-label="Passcode" autofocus onInput=${e => setV(e.target.value.trim())} />
    ${state.msg && html`<p class="err" role="alert">${state.msg}</p>`}
    <button class="btn pri" disabled=${!v}>Open</button></form></div>`;
}

/* light / dark switch: light half on the left, dark half on the right, an arrow in the middle pointing at the theme in use */
function ThemeBtn() {
  const [t, setT] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const flip = () => { const n = t === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('apl-theme', n); } catch (e) { } setT(n); };
  const dark = t === 'dark';
  const sun = html`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" />${[0, 45, 90, 135, 180, 225, 270, 315].map(a => html`<line x1="12" y1="2.6" x2="12" y2="5" transform=${`rotate(${a} 12 12)`} />`)}</svg>`;
  const moon = html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" /></svg>`;
  return html`<button class=${'tsw ' + t} onClick=${flip} role="switch" aria-checked=${dark} aria-label="Dark theme" title=${dark ? 'Switch to light' : 'Switch to dark'}>
    <span class="tsw-sun">${sun}</span><span class="tsw-moon">${moon}</span>
    <svg class="tsw-arw" viewBox="0 0 20 10" aria-hidden="true"><path d="M2 5h14" /><path d="M12.5 2l3.5 3-3.5 3" /><path d="M2 5 0.5 2.6M4 5 2.5 2.6M2 5 0.5 7.4M4 5 2.5 7.4" class="fl" /></svg>
    <span class="tsw-knob">${dark ? moon : sun}</span></button>`;
}

const TABS = [['home', 'Home', '#/'], ['teams', 'Teams', '#/teams'], ['players', 'Players', '#/players'], ['matches', 'Matches', '#/matches'], ['analytics', 'Analytics', '#/analytics'], ['ideas', 'Ideas', '#/ideas']];
function App() {
  if (state.status === 'gate') return html`<${Gate} />`;
  if (!app.S) return html`<div class="loading"><span class="spin"></span>Loading the season…</div>`;
  const r = route(); const S = app.S; const rec = S.matches.filter(m => m.src === 'recorded').length;
  return html`<div class="shell">
    <header class="top"><a class="brand" href="#/" aria-label="APL Analytics home"><img src="/logo.svg" alt="" width="32" height="32" /><span class="wm"><b>APL</b><small>ANALYTICS</small></span></a>
      <nav class="tabs">${TABS.map(([k, l, h]) => html`<a class=${cls(r.tab === k && 'on')} href=${h} aria-current=${r.tab === k ? 'page' : null}>${l}</a>`)}</nav>
      <div class="topr"><a class=${cls('toplink', r.tab === 'about' && 'on')} href="#/creator" aria-label="Meet the creator" aria-current=${r.tab === 'about' ? 'page' : null}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span>Meet the creator</span></a><a class=${cls('toplink', r.tab === 'contact' && 'on')} href="#/contact" aria-label="Contact us" aria-current=${r.tab === 'contact' ? 'page' : null}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg><span>Contact us</span></a><${ThemeBtn} /></div></header>
    <${Ticker} S=${S} />
    <main>${r.el}</main>
    <footer class="foot"><p class="foot-tag">APL Analytics · The only stats platform for the Archery Premier League</p><p><b>${rec} of ${S.matches.length}</b> matches recorded arrow by arrow so far; the rest come from the TV scoreboard read and the official results, and fill in as more are recorded.
      ${state.loadedAt ? ` Data loaded ${state.loadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` : ''}
      <button class="lnk" onClick=${() => open()}>${state.refreshing ? 'Refreshing…' : 'Refresh'}</button></p>
      <p class="footnav"><a href="#/creator">Meet the creator</a><a href="#/contact">Contact us</a><a href="#/ideas">Ideas board</a></p>
      ${state.msg && html`<p class="err">${state.msg}</p>`}</footer>
  </div>`;
}

rerender();
open();
