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
    <svg class="gate-t" viewBox="-1 -1 2 2" aria-hidden="true"><circle r="1" fill="#f4f4ef"/><circle r=".8" fill="#2a2a2a"/><circle r=".6" fill="#3b8fd9"/><circle r=".4" fill="#e5484d"/><circle r=".2" fill="#f5c518"/></svg>
    <h1>APL Analytics</h1><p>Enter the scorebook passcode to see the season.</p>
    <input type="password" autocomplete="off" maxlength="24" value=${v} placeholder="••••" aria-label="Passcode" autofocus onInput=${e => setV(e.target.value.trim())} />
    ${state.msg && html`<p class="err" role="alert">${state.msg}</p>`}
    <button class="btn pri" disabled=${!v}>Open</button></form></div>`;
}

/* light / dark switch, styled as a target with an arrow in it */
function ThemeBtn() {
  const [t, setT] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const flip = () => { const n = t === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('apl-theme', n); } catch (e) { } setT(n); };
  const dark = t === 'dark';
  return html`<button class="themebtn" onClick=${flip} aria-label=${dark ? 'Switch to light theme' : 'Switch to dark theme'} title=${dark ? 'Light theme' : 'Dark theme'}>
    <svg viewBox="-12 -12 24 24" aria-hidden="true">
      <circle r="11" fill=${dark ? '#2a2a2a' : '#f4f4ef'} stroke=${dark ? '#55627a' : '#c9cfd9'} stroke-width="1" />
      <circle r="8" fill="#3b8fd9" /><circle r="5.5" fill="#e5484d" /><circle r="3" fill="#f5c518" />
      <g class="arw" key=${t}><line x1="0" y1="0" x2="10" y2="-10" stroke=${dark ? '#e8ecf2' : '#162033'} stroke-width="1.6" stroke-linecap="round" />
        <path d="M8 -12 L12 -12 L12 -8 M6.5 -10.5 L10.5 -6.5" stroke=${dark ? '#e8ecf2' : '#162033'} stroke-width="1.3" fill="none" stroke-linecap="round" /></g>
    </svg><span>${dark ? 'Dark' : 'Light'}</span></button>`;
}

const TABS = [['home', 'Home', '#/'], ['teams', 'Teams', '#/teams'], ['players', 'Players', '#/players'], ['matches', 'Matches', '#/matches'], ['analytics', 'Analytics', '#/analytics'], ['ideas', 'Ideas', '#/ideas']];
function App() {
  if (state.status === 'gate') return html`<${Gate} />`;
  if (!app.S) return html`<div class="loading"><span class="spin"></span>Loading the season…</div>`;
  const r = route(); const S = app.S; const rec = S.matches.filter(m => m.src === 'recorded').length;
  return html`<div class="shell">
    <header class="top"><a class="brand" href="#/"><svg viewBox="-1 -1 2 2" aria-hidden="true"><circle r="1" fill="#3b8fd9"/><circle r=".8" fill="#e5484d"/><circle r=".6" fill="#f5c518"/><circle r=".3" fill="#161c27"/><circle r=".12" fill="#f5c518"/></svg><span>APL <b>Analytics</b></span></a>
      <nav class="tabs">${TABS.map(([k, l, h]) => html`<a class=${cls(r.tab === k && 'on')} href=${h} aria-current=${r.tab === k ? 'page' : null}>${l}</a>`)}</nav><${ThemeBtn} /></header>
    <${Ticker} S=${S} />
    <main>${r.el}</main>
    <footer class="foot"><p><b>${rec} of ${S.matches.length}</b> matches recorded arrow by arrow so far; the rest come from the TV scoreboard read and the official results, and fill in as more are recorded.
      ${state.loadedAt ? ` Data loaded ${state.loadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` : ''}
      <button class="lnk" onClick=${() => open()}>${state.refreshing ? 'Refreshing…' : 'Refresh'}</button></p>
      ${state.msg && html`<p class="err">${state.msg}</p>`}</footer>
  </div>`;
}

rerender();
open();
