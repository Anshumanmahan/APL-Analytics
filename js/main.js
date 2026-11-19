/* APL Analytics: routes, loading the season and the page shell. */
import { html, render, useState } from './../vendor/preact-htm.js';
import { buildSeason, pool, summarize } from './lib/season.js';
import { load, loadOpen, hasPass, forget } from './lib/store.js';
import { app, cls } from './lib/ui.js';
import { Home } from './pages/home.js';
import { Teams, TeamPage } from './pages/teams.js';
import { Players, PlayerPage } from './pages/players.js';
import { Matches, MatchPage } from './pages/matches.js';
import { Analytics } from './pages/analytics.js';
import { Ideas } from './pages/ideas.js';
import { DreamTeam } from './pages/dream.js';
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
  if (p === 'dream' || p === 'dream-team') return { tab: 'dream', el: html`<${DreamTeam} />` };
  if (p === 'ideas') return { tab: 'ideas', el: html`<${Ideas} />` };
  return { tab: 'home', el: html`<${Home} />` };
}
window.addEventListener('hashchange', () => { rerender(); window.scrollTo(0, 0); });

function ready(rows) { app.S = buildSeason(rows); state.status = 'ready'; state.loadedAt = new Date(); state.msg = ''; }
const L = () => window.APL_LOADER || { start() { }, hide() { }, done() { } };
/* the loader (index.html) plays once the passcode is in, or straight away when no passcode is needed */
function finish(rows, first) {
  ready(rows); state.refreshing = false; rerender();
  if (first) { let arrows = 0; try { arrows = summarize(pool(app.S)).n; } catch (e) { } L().done({ arrows, matches: app.S.matches.length }); }
}
async function open(p) {
  const first = !app.S;
  state.refreshing = true; if (!first) rerender();
  // the site's own read-only proxy first (no passcode needed once APL_KEY is set on Vercel)
  if (!p) {
    // start the loader if the check takes more than a blink, so a visitor never stares at a blank page
    const t = first && setTimeout(() => L().start(), 250);
    const rows = await loadOpen(); clearTimeout(t);
    if (rows) { if (first) L().start(true); return finish(rows, first); }
    if (first && !hasPass()) L().hide();
  }
  if (!p && !hasPass()) { state.status = app.S ? 'ready' : 'gate'; state.refreshing = false; return rerender(); }
  if (first) L().start();
  const r = await load(p);
  if (r.status === 'ok') return finish(r.rows, first);
  if (first) L().hide();
  if (r.status === 'wrong') { forget(); state.status = 'gate'; state.msg = p ? 'That passcode didn’t work. Try again.' : ''; }
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
/* Theme switch: a tiny archery range. Tap it and the sun sets while the moon rises, the stars come out,
   an arrow lands dead centre in the target, and the new theme spreads across the page from the switch. */
function ThemeBtn() {
  const root = document.documentElement;
  const [t, setT] = useState(root.getAttribute('data-theme') || 'dark');
  const [shot, setShot] = useState(0);
  const dark = t === 'dark';
  const turn = (root.dataset.turn = root.dataset.turn || (dark ? '180' : '0'));   // the sky keeps turning one way
  const apply = n => { root.setAttribute('data-theme', n); try { localStorage.setItem('apl-theme', n); } catch (e) { } setT(n); };
  const flip = e => {
    const n = dark ? 'light' : 'dark';
    root.dataset.turn = String(+turn + 180);
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm || !document.startViewTransition) return apply(n);
    setShot(s => s + 1);
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => apply(n));
    vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
      { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { });
  };
  return html`<button class=${'rng ' + t + (shot ? ' shot' : '')} onClick=${flip} role="switch" aria-checked=${dark} aria-label="Dark theme" title=${dark ? 'Switch to light' : 'Switch to dark'}>
    <svg viewBox="0 0 132 40" aria-hidden="true">
      <defs>
        <linearGradient id="rg-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff" /><stop offset="1" stop-color="#fff1c9" /></linearGradient>
        <linearGradient id="rg-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060b1d" /><stop offset="1" stop-color="#25335e" /></linearGradient>
        <radialGradient id="rg-sun" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fff6c2" /><stop offset=".6" stop-color="#f5c518" /><stop offset="1" stop-color="#f59e0b" /></radialGradient>
        <clipPath id="rg-clip"><rect width="132" height="40" rx="20" /></clipPath>
      </defs>
      <g clip-path="url(#rg-clip)">
        <rect width="132" height="40" fill="url(#rg-day)" />
        <rect class="rg-night" width="132" height="40" fill="url(#rg-night)" />
        <g class="rg-stars"><circle cx="58" cy="8" r=".9" /><circle cx="74" cy="15" r=".7" /><circle cx="50" cy="22" r=".6" /><circle cx="88" cy="7" r=".8" /><circle cx="97" cy="16" r=".6" /></g>
        <g class="rg-arm" style=${`transform:rotate(${turn}deg)`}>
          <circle class="rg-glow" cx="66" cy="16" r="9" />
          <circle cx="66" cy="16" r="5.8" fill="url(#rg-sun)" />
          <g transform="rotate(180 66 46)"><circle cx="66" cy="16" r="5.6" fill="#e8ecf2" /><circle cx="68.6" cy="14.4" r="4.6" class="rg-bite" /></g>
        </g>
        <rect class="rg-ground" y="33" width="132" height="7" />
        <g class="rg-boss">
          <line x1="110" y1="27" x2="107" y2="36" class="rg-leg" /><line x1="118" y1="27" x2="121" y2="36" class="rg-leg" />
          <circle cx="114" cy="22" r="9" fill="#f4f4ef" /><circle cx="114" cy="22" r="7" fill="#3b8fd9" /><circle cx="114" cy="22" r="4.7" fill="#e5484d" /><circle cx="114" cy="22" r="2.4" fill="#f5c518" />
        </g>
        <g class="rg-arrow" key=${'a' + shot}><line x1="90" y1="22" x2="114" y2="22" class="rg-shaft" /><path d="M90 22l-2.6-2.6M93 22l-2.6-2.6M90 22l-2.6 2.6M93 22l-2.6 2.6" class="rg-fl" /></g>
      </g>
      <rect x=".5" y=".5" width="131" height="39" rx="19.5" fill="none" class="rg-edge" />
    </svg>
    <span class="rg-lbl"><span>Light</span><span>Dark</span></span>
  </button>`;
}

const TABS = [['home', 'Home', '#/'], ['teams', 'Teams', '#/teams'], ['players', 'Players', '#/players'], ['matches', 'Matches', '#/matches'], ['analytics', 'Analytics', '#/analytics'], ['dream', 'Dream team', '#/dream'], ['ideas', 'Ideas', '#/ideas']];
function App() {
  if (state.status === 'gate') return html`<${Gate} />`;
  if (!app.S) return null; // blank for the moment it takes to check for data; the loader covers the rest
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
