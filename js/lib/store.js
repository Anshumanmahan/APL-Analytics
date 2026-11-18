/* Read-only access to the scorebook's data, through the site's own GET-only proxy (/api/data).
   The proxy holds the scorebook key on the server (Vercel env APL_KEY), so visitors need no passcode.
   Nothing here ever writes. */

/* { status: 'ok', rows } | { status: 'setup' } when the proxy has no key | { status: 'offline' } */
export async function load() {
  let r;
  try { r = await fetch('/api/data', { cache: 'no-store' }); } catch (e) { return { status: 'offline' }; }
  if (r.status === 503) return { status: 'setup' };
  if (!r.ok) return { status: 'offline' };
  try {
    const rows = await r.json();
    return Array.isArray(rows) && rows.some(x => x.col === 'imports' || x.col === 'matches') ? { status: 'ok', rows } : { status: 'setup' };
  } catch (e) { return { status: 'offline' }; }
}
