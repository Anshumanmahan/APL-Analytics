/* Our data-rings logo, animated in sequence: the arrow flies in and strikes the centre, the target takes the hit,
   then the rings ripple out from the impact (inner first) and slowly turn, with a soft pulse from the centre.
   Drawn for realism: shaded target face with scoring lines and rings with a light sheen; the arrow styles live in arrows.js. */
import { html } from '../../vendor/preact-htm.js';
import { ARROW_DEFS, ArrowArt } from './arrows.js';

// [radius, drawn length, circumference, colour, light, dark]
const RINGS = [
  [24, 120.6, 150.8, '#3b8fd9', '#7cc0ff', '#1f5f9e'],
  [16.5, 72.6, 103.7, '#e5484d', '#ff8a8d', '#a8262b'],
  [9, 45.2, 56.5, '#f5c518', '#ffe682', '#c08f00']];
const TICK = (2 * Math.PI * 29.4) / 60;

export const AnimatedLogo = ({ size = 260, arrow = 'A' }) => html`<svg class="alogo" viewBox="0 0 64 64" width=${size} height=${size} role="img" aria-label="APL Analytics logo">
  <defs>
    <radialGradient id="al-face" cx="40%" cy="34%" r="72%"><stop offset="0" stop-color="#26334a" /><stop offset=".62" stop-color="#141b28" /><stop offset="1" stop-color="#090c12" /></radialGradient>
    <linearGradient id="al-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28" /><stop offset=".5" stop-color="#fff" stop-opacity=".04" /><stop offset="1" stop-color="#000" stop-opacity=".5" /></linearGradient>
    ${RINGS.map(([, , , , lt, dk], i) => html`<linearGradient id=${'al-r' + i} gradientUnits="userSpaceOnUse" x1="10" y1="8" x2="54" y2="56"><stop offset="0" stop-color=${lt} /><stop offset=".45" stop-color=${RINGS[i][3]} /><stop offset="1" stop-color=${dk} /></linearGradient>`)}
    ${ARROW_DEFS}
    <radialGradient id="al-hole"><stop offset="0" stop-color="#000" /><stop offset=".6" stop-color="#05070a" /><stop offset="1" stop-color="#05070a" stop-opacity="0" /></radialGradient>
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

  <g class="al-arrow"><g class="al-quiver"><${ArrowArt} v=${arrow} /></g></g>
</svg>`;
