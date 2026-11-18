/* Arrow styles for the animated logo. Each draws an arrow whose point is buried at the target centre (32, 32).
   Styles A–C are drawn side-on in a frame where the tip is at 0 and the shaft runs along −x (rotated −45° into place);
   D is a shooter's-eye view in perspective. All cast a soft shadow that falls only on the target face. */
import { html } from '../../vendor/preact-htm.js';

export const ARROW_DEFS = html`
  <linearGradient id="ar-carbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3e45" /><stop offset=".26" stop-color="#b9bfc7" /><stop offset=".42" stop-color="#2c3036" /><stop offset=".8" stop-color="#121417" /><stop offset="1" stop-color="#3a3f47" /></linearGradient>
  <linearGradient id="ar-alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c6670" /><stop offset=".25" stop-color="#f2f5f8" /><stop offset=".5" stop-color="#7e8a96" /><stop offset=".85" stop-color="#2d343b" /><stop offset="1" stop-color="#6b7580" /></linearGradient>
  <linearGradient id="ar-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2b" /><stop offset=".28" stop-color="#f1cf98" /><stop offset=".55" stop-color="#b9813f" /><stop offset="1" stop-color="#5b3714" /></linearGradient>
  <linearGradient id="ar-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e959e" /><stop offset=".3" stop-color="#ffffff" /><stop offset=".6" stop-color="#7d838b" /><stop offset="1" stop-color="#22262b" /></linearGradient>
  <linearGradient id="ar-wrap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8bcc2" /><stop offset=".28" stop-color="#ffffff" /><stop offset="1" stop-color="#7d838b" /></linearGradient>
  <linearGradient id="ar-vgold" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b78400" /><stop offset=".55" stop-color="#f5c518" /><stop offset="1" stop-color="#fff0b3" /></linearGradient>
  <linearGradient id="ar-vgoldD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6200" /><stop offset="1" stop-color="#e0ad0c" /></linearGradient>
  <linearGradient id="ar-vwhite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f969f" /><stop offset="1" stop-color="#eef0f2" /></linearGradient>
  <linearGradient id="ar-spin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9fbff" stop-opacity=".95" /><stop offset=".5" stop-color="#47c2e8" stop-opacity=".7" /><stop offset="1" stop-color="#0b6f93" stop-opacity=".85" /></linearGradient>
  <linearGradient id="ar-nock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc2c4" /><stop offset=".3" stop-color="#e5484d" /><stop offset="1" stop-color="#7d151a" /></linearGradient>
  <linearGradient id="ar-nockg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ffcf" /><stop offset=".3" stop-color="#5fd34a" /><stop offset="1" stop-color="#1d6b12" /></linearGradient>
  <pattern id="ar-weave" width=".7" height=".7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".3" height=".7" fill="#fff" fill-opacity=".09" /></pattern>
  <pattern id="ar-bars" width="1.1" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)"><rect width="1.1" height="4" fill="#d8d2c6" /><rect width=".45" height="4" fill="#4a4036" /></pattern>
  <filter id="ar-soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation=".5" /></filter>
  <clipPath id="ar-face"><circle cx="0" cy="0" r="30.6" /></clipPath>
  <clipPath id="ar-faceG"><circle cx="32" cy="32" r="30.6" /></clipPath>`;

/* shadow of a side-on arrow: it starts at the point and drifts away from the shaft as the arrow leaves the face */
const Shadow = ({ len = 38, w = 1 }) => html`<g clip-path="url(#ar-face)" filter="url(#ar-soft)" opacity=".5">
  <path d=${`M0 -.3 L${-len} ${2.9 * len / 38} L${-len} ${(2.9 + w * 1.3) * len / 38} L0 .5 Z`} fill="#000" />
  <path d=${`M${-len + 7} ${2.9 + .5} L${-len + 1.5} ${3.1 + .4} L${-len + 1.5} ${5.4} L${-len + 6} ${4.4} Z`} fill="#000" opacity=".6" /></g>`;

/* A — carbon target arrow, three gold plastic vanes */
const Carbon = () => html`
  <${Shadow} />
  <path d="M-29.6 .45 C-30.8 .9 -32.9 2.1 -34.6 2.3 Q-35.2 2.35 -35.2 1.8 L-35 .45 Z" fill="url(#ar-vgoldD)" />
  <path d="M-29.6 -.45 C-30.8 -.9 -32.9 -2.1 -34.6 -2.3 Q-35.2 -2.35 -35.2 -1.8 L-35 -.45 Z" fill="url(#ar-vgold)" />
  <path d="M-29.6 -.45 C-30.8 -.9 -32.9 -2.1 -34.6 -2.3" fill="none" stroke="#fff7d1" stroke-width=".12" />
  <rect x="-36.4" y="-.48" width="36.2" height=".96" rx=".2" fill="url(#ar-carbon)" />
  <rect x="-36.4" y="-.48" width="36.2" height=".96" fill="url(#ar-weave)" />
  <rect x="-35.9" y="-.52" width="7" height="1.04" rx=".15" fill="url(#ar-wrap)" opacity=".92" />
  <line x1="-28.4" y1="-.21" x2="-1" y2="-.21" stroke="#fff" stroke-opacity=".55" stroke-width=".1" />
  <path d="M-30 0 C-31.1 .2 -33 .75 -34.6 .85 Q-35.1 .85 -35.1 .5 L-35 0 Z" fill="#ffd84a" fill-opacity=".78" />
  <rect x="-36.9" y="-.5" width=".55" height="1" fill="url(#ar-steel)" />
  <path d="M-36.9 -.46 L-37.9 -.55 Q-38.5 -.55 -38.5 -.2 L-37.7 0 L-38.5 .2 Q-38.5 .55 -37.9 .55 L-36.9 .46 Z" fill="url(#ar-nock)" fill-opacity=".93" />
  <path d="M-37 -.3 L-38.2 -.38" stroke="#fff" stroke-opacity=".7" stroke-width=".1" stroke-linecap="round" />
  <path d="M-1.9 -.5 L-.8 -.5 L-.15 -.36 L-.15 .36 L-.8 .5 L-1.9 .5 Z" fill="url(#ar-steel)" />`;

/* B — slim shaft with curled, translucent spin wings */
const Spin = () => html`
  <${Shadow} w=${.8} />
  <path d="M-32.2 .3 C-33.3 1.3 -35.2 2.3 -36.6 2 C-35.6 1.5 -34.4 .9 -33.6 .3 Z" fill="url(#ar-spin)" opacity=".75" />
  <rect x="-37.4" y="-.38" width="37.2" height=".76" rx=".2" fill="url(#ar-alu)" />
  <line x1="-37" y1="-.17" x2="-1" y2="-.17" stroke="#fff" stroke-opacity=".7" stroke-width=".08" />
  <path d="M-32.2 -.3 C-33.3 -1.5 -35.2 -2.6 -36.7 -2.3 C-35.7 -1.7 -34.5 -1 -33.6 -.3 Z" fill="url(#ar-spin)" />
  <path d="M-32.2 -.3 C-33.3 -1.5 -35.2 -2.6 -36.7 -2.3" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width=".1" />
  <path d="M-32.6 .05 C-33.8 .5 -35.4 .9 -36.6 .75 C-35.7 .5 -34.6 .25 -33.9 .05 Z" fill="url(#ar-spin)" opacity=".9" />
  <path d="M-37.4 -.36 L-38.3 -.42 Q-38.8 -.42 -38.8 -.15 L-38.1 0 L-38.8 .15 Q-38.8 .42 -38.3 .42 L-37.4 .36 Z" fill="url(#ar-nockg)" fill-opacity=".92" />
  <path d="M-1.6 -.38 L-.7 -.38 L-.15 -.28 L-.15 .28 L-.7 .38 L-1.6 .38 Z" fill="url(#ar-steel)" />`;

/* C — traditional wooden arrow, barred feathers and crest bands */
const Feather = () => html`
  <${Shadow} w=${1.4} />
  <path d="M-27 .5 C-28.5 1.6 -31 2.8 -34.2 3.1 L-35 3 L-35.2 .5 Z" fill="#efe9dd" />
  <rect x="-37.6" y="-.52" width="37.4" height="1.04" rx=".25" fill="url(#ar-wood)" />
  ${[-30, -20, -12, -6].map(x => html`<line x1=${x} y1=".08" x2=${x + 7} y2=".12" stroke="#5b3714" stroke-opacity=".35" stroke-width=".06" />`)}
  <rect x="-26.6" y="-.53" width=".5" height="1.06" fill="#a8262b" /><rect x="-25.8" y="-.53" width=".25" height="1.06" fill="#111" /><rect x="-25.2" y="-.53" width=".5" height="1.06" fill="#d9a400" />
  <path d="M-27 -.5 C-28.5 -1.7 -31 -3 -34.2 -3.3 L-35 -3.2 L-35.2 -.5 Z" fill="url(#ar-bars)" />
  <path d="M-27 -.5 C-28.5 -1.7 -31 -3 -34.2 -3.3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".12" stroke-dasharray=".25 .2" />
  <path d="M-27.6 0 C-29 .35 -31.5 .9 -34.2 1 L-35.1 .95 L-35.2 0 Z" fill="#e0b13a" fill-opacity=".92" />
  <path d="M-37.6 -.5 L-38.6 -.56 Q-39.1 -.56 -39.1 -.2 L-38.3 0 L-39.1 .2 Q-39.1 .56 -38.6 .56 L-37.6 .5 Z" fill="#1c1c1c" />
  <path d="M-37.7 -.33 L-38.8 -.4" stroke="#fff" stroke-opacity=".45" stroke-width=".08" />
  <path d="M-2.4 -.55 L-1 -.55 L-.15 -.38 L-.15 .38 L-1 .55 L-2.4 .55 Z" fill="url(#ar-steel)" />`;

/* D — shooter's view: the arrow comes back toward you, foreshortened, vanes splayed around the nock */
const T = [32, 32], N = [19.5, 44.5];
const d = [N[0] - T[0], N[1] - T[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L], p = [-u[1], u[0]];
const at = (s, off = 0) => [T[0] + d[0] * s + p[0] * off, T[1] + d[1] * s + p[1] * off];
const wAt = s => 0.35 + s * 0.6; // half-width grows toward the viewer
const vaneDir = th => [Math.cos(th) * p[0] + Math.sin(th) * 0.5 * u[0], Math.cos(th) * p[1] + Math.sin(th) * 0.5 * u[1]];
const VANES = [[-Math.PI / 2 - 0.35, 'url(#ar-vgold)', 1], [Math.PI / 6 - 0.35, 'url(#ar-vwhite)', .95], [5 * Math.PI / 6 - 0.35, 'url(#ar-vwhite)', .8]];
const pt = a => a.map(v => v.toFixed(2)).join(' ');
const vanePath = (th) => { const v = vaneDir(th); const a = at(.66), b = at(.93), sA = 1.6, sB = 4.6;
  return `M${pt(a)} L${pt(b)} L${pt([b[0] + v[0] * sB, b[1] + v[1] * sB])} Q${pt([b[0] + v[0] * sB * .8 - u[0] * 1.2, b[1] + v[1] * sB * .8 - u[1] * 1.2])} ${pt([a[0] + v[0] * sA, a[1] + v[1] * sA])} Z`; };
const shaftPath = `M${pt(at(0, -wAt(0)))} L${pt(at(1, -wAt(1)))} L${pt(at(1, wAt(1)))} L${pt(at(0, wAt(0)))} Z`;
const Pov = () => { const back = VANES.filter(([th]) => Math.sin(th) < 0), front = VANES.filter(([th]) => Math.sin(th) >= 0);
  return html`
  <g clip-path="url(#ar-faceG)" filter="url(#ar-soft)" opacity=".5"><path d=${`M32 31.6 L${N[0] + 3.2} ${N[1] + 3.8} L${N[0] + 5} ${N[1] + 3} L32.4 32 Z`} fill="#000" /></g>
  ${back.map(([th, f, o]) => html`<path d=${vanePath(th)} fill=${f} fill-opacity=${o} />`)}
  <path d=${shaftPath} fill="url(#ar-carbonD)" />
  <path d=${`M${pt(at(.02, -wAt(.02) * .45))} L${pt(at(.98, -wAt(.98) * .45))}`} stroke="#fff" stroke-opacity=".5" stroke-width=".14" />
  ${front.map(([th, f, o]) => html`<path d=${vanePath(th)} fill=${f} fill-opacity=${o} />`)}
  <ellipse cx=${N[0] - u[0] * .4} cy=${N[1] - u[1] * .4} rx="1.05" ry=".75" transform=${`rotate(45 ${N[0] - u[0] * .4} ${N[1] - u[1] * .4})`} fill="url(#ar-nock)" />
  <line x1=${N[0] - u[0] * .4 - .55} y1=${N[1] - u[1] * .4 - .55} x2=${N[0] - u[0] * .4 + .55} y2=${N[1] - u[1] * .4 + .55} stroke="#4a0b0e" stroke-width=".22" stroke-linecap="round" />
  <circle cx=${N[0] - u[0] * .4 - .35} cy=${N[1] - u[1] * .4 - .1} r=".18" fill="#fff" fill-opacity=".8" />`; };

export const ARROWS = { A: Carbon, B: Spin, C: Feather, D: Pov };
export const ARROW_NAMES = { A: 'Carbon target arrow', B: 'Spin wings', C: 'Traditional wood and feather', D: "Shooter's view" };

export const ArrowArt = ({ v = 'A' }) => { const C = ARROWS[v] || Carbon;
  return v === 'D'
    ? html`<defs><linearGradient id="ar-carbonD" gradientUnits="userSpaceOnUse" x1=${at(.5, -1)[0]} y1=${at(.5, -1)[1]} x2=${at(.5, 1)[0]} y2=${at(.5, 1)[1]}><stop offset="0" stop-color="#3a3e45" /><stop offset=".3" stop-color="#c3c9d1" /><stop offset=".5" stop-color="#2c3036" /><stop offset="1" stop-color="#0e1013" /></linearGradient></defs><${C} />`
    : html`<g transform="translate(32 32) rotate(-45)"><${C} /></g>`; };
