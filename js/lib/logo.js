/* Our data-rings logo, animated: the rings draw in, the arrow flies in and lands, then a soft ripple pulses from the centre. */
import { html } from '../../vendor/preact-htm.js';

const RINGS = [[24, 120.6, 150.8, '#3b8fd9'], [16.5, 72.6, 103.7, '#e5484d'], [9, 45.2, 56.5, '#f5c518']];

export const AnimatedLogo = ({ size = 260 }) => html`<svg class="alogo" viewBox="0 0 64 64" width=${size} height=${size} role="img" aria-label="APL Analytics logo">
  <defs><linearGradient id="albg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f2a3d" /><stop offset="1" stop-color="#0e131c" /></linearGradient></defs>
  <circle cx="32" cy="32" r="31" fill="url(#albg)" />
  <circle class="al-orbit" cx="32" cy="32" r="29.2" fill="none" stroke="#f5c518" stroke-opacity=".35" stroke-width=".35" stroke-dasharray="1 3.2" />
  ${RINGS.map(([r, , , c]) => html`<circle cx="32" cy="32" r=${r} fill="none" stroke=${c} stroke-opacity=".18" stroke-width="5" />`)}
  <g class="al-spin">${RINGS.map(([r, len, circ, c], i) => html`<circle class="al-arc" cx="32" cy="32" r=${r} fill="none" stroke=${c} stroke-width="5" stroke-linecap="round"
    style=${`stroke-dasharray:${len} ${circ};--len:${len};animation-delay:${0.15 + i * 0.22}s`} transform="rotate(-90 32 32)" />`)}</g>
  <circle class="al-ripple" cx="32" cy="32" r="3" fill="none" stroke="#f4f4ef" stroke-width=".8" />
  <circle cx="32" cy="32" r="2.6" fill="#f4f4ef" />
  <g class="al-arrow" stroke-linecap="round">
    <line x1="6" y1="58" x2="30.4" y2="33.6" stroke="#f4f4ef" stroke-width="2.6" />
    <path d="M10 54 L9.3 58.9 M10 54 L5.1 54.7 M13.2 50.8 L12.5 55.7 M13.2 50.8 L8.3 51.5" stroke="#f5c518" stroke-width="2.2" />
  </g>
</svg>`;
