/* Our data-rings logo, animated in sequence: the arrow flies in and strikes the centre, the target takes the hit,
   then the rings ripple out from the impact (inner first) and slowly turn, with a soft pulse from the centre.
   Drawn for realism: shaded target face with scoring lines, rings with a light sheen, and a carbon arrow with a wrap,
   parabolic vanes (one gold cock vane, two white hen vanes), a nock, a buried point and a cast shadow. */
import { html } from '../../vendor/preact-htm.js';

// [radius, drawn length, circumference, colour, light, dark]
const RINGS = [
  [24, 120.6, 150.8, '#3b8fd9', '#7cc0ff', '#1f5f9e'],
  [16.5, 72.6, 103.7, '#e5484d', '#ff8a8d', '#a8262b'],
  [9, 45.2, 56.5, '#f5c518', '#ffe682', '#c08f00']];
const TICK = (2 * Math.PI * 29.4) / 60;

export const AnimatedLogo = ({ size = 260 }) => html`<svg class="alogo" viewBox="0 0 64 64" width=${size} height=${size} role="img" aria-label="APL Analytics logo">
  <defs>
    <radialGradient id="al-face" cx="40%" cy="34%" r="72%"><stop offset="0" stop-color="#26334a" /><stop offset=".62" stop-color="#141b28" /><stop offset="1" stop-color="#090c12" /></radialGradient>
    <linearGradient id="al-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28" /><stop offset=".5" stop-color="#fff" stop-opacity=".04" /><stop offset="1" stop-color="#000" stop-opacity=".5" /></linearGradient>
    ${RINGS.map(([, , , , lt, dk], i) => html`<linearGradient id=${'al-r' + i} gradientUnits="userSpaceOnUse" x1="10" y1="8" x2="54" y2="56"><stop offset="0" stop-color=${lt} /><stop offset=".45" stop-color=${RINGS[i][3]} /><stop offset="1" stop-color=${dk} /></linearGradient>`)}
    <linearGradient id="al-shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b616b" /><stop offset=".3" stop-color="#e9ecef" /><stop offset=".55" stop-color="#4a4f57" /><stop offset="1" stop-color="#14161a" /></linearGradient>
    <linearGradient id="al-wrap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ccd1" /><stop offset=".3" stop-color="#ffffff" /><stop offset="1" stop-color="#8d939b" /></linearGradient>
    <linearGradient id="al-vg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c08f00" /><stop offset=".5" stop-color="#f5c518" /><stop offset="1" stop-color="#ffe9a0" /></linearGradient>
    <linearGradient id="al-vw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa1aa" /><stop offset="1" stop-color="#e8ebee" /></linearGradient>
    <linearGradient id="al-nock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb4b6" /><stop offset=".35" stop-color="#e5484d" /><stop offset="1" stop-color="#8a1c20" /></linearGradient>
    <linearGradient id="al-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e959e" /><stop offset=".3" stop-color="#f6f7f8" /><stop offset=".6" stop-color="#7d838b" /><stop offset="1" stop-color="#2b2f35" /></linearGradient>
    <radialGradient id="al-hole"><stop offset="0" stop-color="#000" /><stop offset=".6" stop-color="#05070a" /><stop offset="1" stop-color="#05070a" stop-opacity="0" /></radialGradient>
    <filter id="al-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".7" dy="1.1" stdDeviation=".55" flood-color="#000" flood-opacity=".55" /></filter>
  </defs>

  <g class="al-target">
  <circle cx="32" cy="32" r="31" fill="url(#al-face)" />
  <circle cx="32" cy="32" r="30.6" fill="none" stroke="url(#al-rim)" stroke-width=".8" />
  <circle class="al-orbit" cx="32" cy="32" r="29.4" fill="none" stroke="#f4f4ef" stroke-opacity=".3" stroke-width=".9" style=${`stroke-dasharray:.22 ${(TICK - 0.22).toFixed(3)}`} />
  ${[27.5, 20.25, 12.75, 5.2].map(r => html`<circle cx="32" cy="32" r=${r} fill="none" stroke="#fff" stroke-opacity=".07" stroke-width=".18" />`)}
  ${RINGS.map(([r, , , c]) => html`<circle cx="32" cy="32" r=${r} fill="none" stroke=${c} stroke-opacity=".13" stroke-width="4.4" />`)}
  <g class="al-spin">${RINGS.map(([r, len, circ], i) => html`<circle class="al-arc" cx="32" cy="32" r=${r} fill="none" stroke=${`url(#al-r${i})`} stroke-width="4.4" stroke-linecap="round"
    style=${`stroke-dasharray:${len} ${circ};--len:${len};animation-delay:${0.9 + (2 - i) * 0.2}s`} transform="rotate(-90 32 32)" />`)}</g>
  </g>
  <circle class="al-ripple" cx="32" cy="32" r="2.4" fill="none" stroke="#f4f4ef" stroke-width=".5" />
  <circle cx="32" cy="32" r="1.9" fill="url(#al-hole)" />

  <g class="al-arrow"><g class="al-quiver"><g transform="translate(32 32) rotate(-45)" filter="url(#al-shadow)">
    <rect x="-34" y="-.7" width="33.2" height="1.4" rx=".3" fill="url(#al-shaft)" />
    <rect x="-33.2" y="-.78" width="10.4" height="1.56" rx=".25" fill="url(#al-wrap)" />
    <rect x="-23.4" y="-.78" width=".35" height="1.56" fill="#e5484d" /><rect x="-22.9" y="-.78" width=".2" height="1.56" fill="#3b8fd9" />
    <path d="M-24.6 -.7 C-26.2 -1.6 -29.4 -3.5 -31.7 -3.7 Q-32.5 -3.75 -32.5 -3 L-32.4 -.7 Z" fill="url(#al-vg)" />
    <path d="M-24.6 -.7 C-26.2 -1.6 -29.4 -3.5 -31.7 -3.7" fill="none" stroke="#fff6cf" stroke-width=".18" stroke-opacity=".8" />
    <path d="M-24.6 .7 C-26.2 1.6 -29.4 3.5 -31.7 3.7 Q-32.5 3.75 -32.5 3 L-32.4 .7 Z" fill="url(#al-vw)" />
    <path d="M-25.4 -.1 C-27 -.5 -29.6 -1.2 -31.6 -1.25 L-32.3 -1.1 L-32.3 .1 Z" fill="#f4f4ef" fill-opacity=".9" />
    <path d="M-34 -.62 L-35.6 -.9 Q-36.3 -.9 -36.3 -.35 L-35.2 0 L-36.3 .35 Q-36.3 .9 -35.6 .9 L-34 .62 Z" fill="url(#al-nock)" />
    <path d="M-2.2 -.7 L-.9 -.7 L-.15 -.45 L-.15 .45 L-.9 .7 L-2.2 .7 Z" fill="url(#al-steel)" />
  </g></g></g>
</svg>`;
