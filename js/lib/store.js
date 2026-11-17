/* Read-only access to the scorebook's data (Supabase table public.docs).
   1) /api/data: a GET-only proxy on this site. It works once the APL_KEY environment variable is set
      on the Vercel project, and then the site needs no passcode.
   2) Otherwise the visitor types the scorebook passcode, kept only for this tab.
   Nothing here ever writes. */
const API = 'https://upbndoknwrzeohsdwkbi.supabase.co/rest/v1/docs';
const KEY = 'sb_publishable_3fFIIVzx3HmdGz2yuo_IgQ_VZdt3Rdb';
const PASS = 'apl-analytics-pass';
let pass = (() => { try { return sessionStorage.getItem(PASS) || ''; } catch (e) { return ''; } })();
export const hasPass = () => !!pass;
export function forget() { pass = ''; try { sessionStorage.removeItem(PASS); } catch (e) { } }

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
  pass = key; try { sessionStorage.setItem(PASS, key); } catch (e) { }
  return { status: 'ok', rows };
}
