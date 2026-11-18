/* Team logos and player photos, hot-linked from where they are published.
   Anything missing falls back to a drawn crest (team colour + code) or the archer's initials. */
import { html, useState } from '../../vendor/preact-htm.js';
import { COLOR } from './season.js';

const BASE = 'https://archerypremierleague.co.in';
/* the official logos as used on archerypremierleague.co.in (team pages, standings) */
export const LOGO = {
  CA: BASE + '/api/public/media/logos/5a917006-1509-4b6c-a68e-92b9622000a9.png',
  CC: BASE + '/api/public/media/logos/9ff474ba-05f4-44ad-bb0d-4a0a620ed1e8.png',
  KK: BASE + '/api/public/media/logos/40950e7c-17eb-40f7-8db3-09e7ef2e208c.png',
  MM: BASE + '/api/public/media/logos/04f07603-fce1-4243-bbc7-8e6ee9dffb5e.png',
  PY: BASE + '/api/public/media/logos/fd1ffd3d-3f2b-4d88-bdd0-e49d92946845.png',
  RR: BASE + '/api/public/media/logos/4df74ec4-cf97-4b9a-be32-56556de7a777.png'
};
export const LEAGUE_LOGO = BASE + '/__l5e/assets-v1/0adcdd55-d188-40a7-8b5d-875d78af6d64/apl-logo.svg';
/* player photos from the team squad pages on archerypremierleague.co.in (32 of 48 have one there) */
const P = BASE + '/api/public/media/players/';
const WAP = 'https://extranet.worldarchery.sport/ProfilePictures/?Id=';
export const PHOTO = {
  'ca-atanu-das': P + '4ba4842f-778e-4845-9df7-e12f405889c1.png',
  'ca-yashdeep-bhoge': P + 'e877c9fb-6440-49d0-b269-2cf11686814f.jpeg',
  'ca-kumkum-anil-mohod': P + 'feba0cce-9f12-4f53-89fd-a813348192ed.png',
  'ca-mathias-fullerton': P + '31617dec-b9e7-4c86-9356-b995ddacdae3.png',
  'ca-sahil-rajesh-jadhav': P + 'a215367e-58fa-4e92-abe8-4192faee84fb.png',
  'ca-prithika-pradeep': P + 'e3c4571e-de65-4b7c-90a8-1a022fd0e4a8.png',
  'cc-deepika-kumari': P + '50842696-a4a3-42aa-b44f-6a196bdeb743.png',
  'cc-rishabh-yadav': P + '68581566-5061-4caf-97b9-999194d31e5f.png',
  'cc-chikitha-taniparthi': P + '774c92d9-f3e2-4fbc-9a49-64e1da14146b.png',
  'kk-neeraj-chauhan': P + '787792ae-35fd-4397-b873-47b462836ee5.png',
  'kk-rohit-kumar': P + 'cfd35852-dfc5-42b2-bdeb-52ccf2fa186e.png',
  'kk-elia-canales': P + 'b1476714-05f1-42f9-bbc0-f7647d551fc0.png',
  'kk-nico-wiener': P + '0f77ceb5-ad20-45e9-816d-7be34dd2e96a.png',
  'kk-jyothi-surekha-vennam': P + '5c7d72d7-84f5-4e23-9de6-fb5944084d88.png',
  'kk-avneet-kaur': P + '4ae427ce-4677-40e8-8fd4-907001c701c4.png',
  'mm-dhiraj-bommadevara': P + 'a0193f3f-3c74-43fd-9319-0213514b06fa.png',
  'mm-mrinal-chauhan': P + '1a640fab-df1b-43f0-8034-88436941b24e.png',
  'mm-alejandra-valencia': P + 'dca9e7d2-0df9-449a-981f-3d3e445aaed0.png',
  'mm-mike-schloesser': P + '633d60e9-d6aa-4322-9823-86cf06b16158.png',
  'mm-aman-saini': P + '08ac55e2-a27b-4cd3-8c18-5e18c6d620fb.png',
  'mm-parneet-kaur': P + '6533603a-ca43-404a-bb7f-4e1acd616f4f.png',
  'mm-madhura-dhamangaonkar': P + '8bb0e996-1f71-4a37-a7fe-486b5557364a.png',
  'py-matias-grande': P + '213cb7e1-644c-4faf-8020-c28275842308.png',
  'py-gatha-anandrao-khadake': P + 'bb377ffb-275d-4868-8c30-42bdc3503910.png',
  'py-abhishek-verma': P + 'c06fddae-7c73-4e5e-8231-f3baf11f296e.png',
  'py-andrea-becerra': P + 'cc876cf1-7e28-446a-918b-ce28356eedfc.jpeg',
  'rr-mete-gazoz': P + '7d53a170-3a54-42ac-b81a-3326e9287a93.png',
  'rr-ankita-bhakat': P + 'd643e68c-56c3-40f4-a24e-3210d896991a.jpeg',
  'rr-ojas-pravin-deotale': P + '8821b3e3-da34-46e9-b84e-0c053530a879.png',
  'rr-kushal-dalal': P + 'f66b7316-fa8b-4ed5-ac65-dfb4ad0141b6.jpeg',
  'rr-ella-gibson': P + 'cbdaf8d2-268a-48a7-982e-8f9fcbc08e04.png',
  'rr-swati-dudhwal': P + 'cca5d94d-abf4-4bcc-9cb6-abe5e77decf3.png',
  // not on the APL squad pages: profile pictures from World Archery
  'ca-casey-kaufhold': WAP + '20955',
  'cc-marcus-d-almeida': WAP + '13787',
  'cc-alejandra-usquiano': WAP + '6788',
  'py-juyel-sarkar': WAP + '45029',
  'cc-rajat-chauhan': WAP + '12262',
  'mm-simranjeet-kaur': WAP + '17287',
  'py-thirumuru-ganesh-mani-ratnam': WAP + '48824',
  'kk-ridhi': WAP + '23185',
  'py-kirti-sharma': WAP + '53250',
  'rr-sangeeta': WAP + '21148',
  'py-raj-kaur': WAP + '30248',
  /* photos supplied by the organiser, cropped to head and shoulders */
  'ca-jasveer-kaur': '/img/players/ca-jasveer-kaur.jpg',
  'cc-yuktha-sri-kondapavuluri': '/img/players/cc-yuktha-sri-kondapavuluri.jpg',
  'kk-shivshankar-sakharam-landkar': '/img/players/kk-shivshankar-sakharam-landkar.jpg',
  'rr-abhyuday-amol-pakhale': '/img/players/rr-abhyuday-amol-pakhale.jpg',
};
/* World Archery athlete pages, where confirmed */
export const WA = {
  'cc-marcus-d-almeida': 'https://www.worldarchery.sport/athlete/13787/marcus-dalmeida',
  'ca-casey-kaufhold': 'https://worldarchery.org/athlete/20955',
  'cc-alejandra-usquiano': 'https://worldarchery.org/athlete/6788',
  'py-juyel-sarkar': 'https://worldarchery.org/athlete/45029',
  'cc-rajat-chauhan': 'https://worldarchery.org/athlete/12262',
  'mm-simranjeet-kaur': 'https://worldarchery.org/athlete/17287',
  'py-thirumuru-ganesh-mani-ratnam': 'https://worldarchery.org/athlete/48824',
  'kk-ridhi': 'https://worldarchery.org/athlete/23185',
  'py-kirti-sharma': 'https://worldarchery.org/athlete/53250',
  'rr-sangeeta': 'https://worldarchery.org/athlete/21148',
  'py-raj-kaur': 'https://worldarchery.org/athlete/30248'
};

const initials = n => String(n || '').split(/[\s'-]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/* a plain shield in the team colour with the team code; used when there is no logo */
export function Shield({ code, size = 96 }) {
  const c = COLOR[code] || '#55627a', id = 'sg' + code;
  return html`<svg class="shield" viewBox="0 0 100 116" width=${size} height=${size * 1.16} role="img" aria-label=${code}>
    <defs><linearGradient id=${id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${shade(c, 1.15)} /><stop offset="1" stop-color=${shade(c, 0.62)} /></linearGradient></defs>
    <path d="M50 3 L94 16 V54 C94 82 74 101 50 113 C26 101 6 82 6 54 V16 Z" fill=${`url(#${id})`} stroke="rgba(255,255,255,.85)" stroke-width="3" />
    <path d="M50 12 L86 22 V54 C86 77 70 93 50 103 C30 93 14 77 14 54 V22 Z" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5" />
    <path d="M14 40 H86" stroke="rgba(255,255,255,.22)" stroke-width="1.5" />
    <text x="50" y="74" text-anchor="middle" font-size="31" font-weight="800" fill="#fff" style="font-stretch:75%;letter-spacing:.02em">${code}</text>
  </svg>`;
}
export function Crest({ code, size = 96 }) {
  const [bad, setBad] = useState(false);
  const url = LOGO[code];
  if (url && !bad) return html`<img class="logo" src=${url} alt=${code} width=${size} height=${size} loading="lazy" referrerpolicy="no-referrer" onError=${() => setBad(true)} />`;
  return html`<${Shield} code=${code} size=${size} />`;
}
export function Avatar({ ar, size = 64 }) {
  const [bad, setBad] = useState(false);
  const url = PHOTO[ar.id];
  const c = COLOR[ar.team] || '#55627a';
  return html`<span class="avatar" style=${`width:${size}px;height:${size}px;--tc:${c}`}>
    ${url && !bad ? html`<img src=${url} alt=${ar.name} loading="lazy" referrerpolicy="no-referrer" onError=${() => setBad(true)} />` : html`<b style=${`font-size:${Math.round(size * 0.36)}px`}>${initials(ar.name)}</b>`}</span>`;
}
