/* Read-only access to the scorebook's data (Supabase table public.docs).
   1) /api/data: a GET-only proxy on this site. It works once the APL_KEY environment variable is set
      on the Vercel project, and then the site needs no passcode.
   2) Otherwise the visitor types the scorebook passcode, remembered on that device for one day.
   Nothing here ever writes. */
const API = 'https://upbndoknwrzeohsdwkbi.supabase.co/rest/v1/docs';
const KEY = 'sb_publishable_3fFIIVzx3HmdGz2yuo_IgQ_VZdt3Rdb';
const PASS = 'apl-analytics-pass';
const DAY = 24 * 60 * 60 * 1000; // the passcode is remembered on this device for one day
function readPass() {
  try { const o = JSON.parse(localStorage.getItem(PASS) || 'null');
    if (o && o.k && o.exp > Date.now()) return o.k;
    localStorage.removeItem(PASS); } catch (e) { }
  try { return sessionStorage.getItem(PASS) || ''; } catch (e) { return ''; }
}
let pass = readPass();
export const hasPass = () => !!pass;
export function forget() { pass = ''; try { localStorage.removeItem(PASS); } catch (e) { } try { sessionStorage.removeItem(PASS); } catch (e) { } }

/* rows from the site's own proxy, or null when it isn't set up */
export async function loadOpen() {
  try {
    const r = await fetch('/api/data', { cache: 'no-store' });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.some(x => x.col === 'imports' || x.col === 'matches') ? rows : null;
  } catch (e) { return null; }
}

/* rows of { col, id, data } for matches, imports and config; 'wrong' when the passcode isn't accepted */
export async function load(p) {
  const key = p || pass; let res;
  try {
    res = await fetch(API + '?select=col,id,data&col=in.(matches,imports,config)&order=col,id&limit=2000', { headers: { apikey: KEY, 'x-apl-key': key } });
  } catch (e) { return { status: 'offline' }; }
  if (res.status === 401 || res.status === 403) return { status: 'wrong' };
  if (!res.ok) return { status: 'offline' };
  const rows = await res.json();
  // a wrong passcode doesn't fail; it just sees nothing
  if (!rows.some(r => r.col === 'imports' || r.col === 'matches')) return { status: 'wrong' };
  if (p) { pass = key; try { localStorage.setItem(PASS, JSON.stringify({ k: key, exp: Date.now() + DAY })); } catch (e) { } } // a typed passcode lasts one day from entry
  return { status: 'ok', rows };
}
