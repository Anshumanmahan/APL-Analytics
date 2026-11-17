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
  return html`<button class=${'themebtn ' + t} onClick=${flip} role="switch" aria-checked=${dark} aria-label="Dark theme" title=${dark ? 'Switch to light' : 'Switch to dark'}>
    <svg viewBox="0 0 72 28" aria-hidden="true">
      <rect x="0.5" y="0.5" width="35.5" height="27" rx="13.5" fill="#f4f4ef" />
      <rect x="36" y="0.5" width="35.5" height="27" rx="13.5" fill="#161c27" />
      <rect x="22" y="0.5" width="28" height="27" fill="url(#tg)" />
      <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#f4f4ef" /><stop offset="1" stop-color="#161c27" /></linearGradient></defs>
      <rect x="0.5" y="0.5" width="71" height="27" rx="13.5" fill="none" stroke="var(--line)" />
      <g class="sun" opacity=${dark ? 0.45 : 1}><circle cx="11" cy="14" r="4" fill="#f5c518" />${[0, 45, 90, 135, 180, 225, 270, 315].map(a => html`<line x1="11" y1="7.2" x2="11" y2="8.6" stroke="#c99a00" stroke-width="1.4" stroke-linecap="round" transform=${`rotate(${a} 11 14)`} />`)}</g>
      <g class="moon" opacity=${dark ? 1 : 0.45}><path d="M63.5 9.2a5.2 5.2 0 1 0 0 9.6a4.2 4.2 0 0 1 0-9.6z" fill="#e8ecf2" /></g>
      <g class="arw2"><line x1="22" y1="14" x2="50" y2="14" stroke="#e5484d" stroke-width="2" stroke-linecap="round" />
        <path d="M50 14 l-5 -3.6 M50 14 l-5 3.6" stroke="#e5484d" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M22 14 l-3 -3 M25 14 l-3 -3 M22 14 l-3 3 M25 14 l-3 3" stroke="#3b8fd9" stroke-width="1.6" stroke-linecap="round" /></g>
    </svg></button>`;
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
