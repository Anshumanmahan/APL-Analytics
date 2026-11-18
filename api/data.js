// GET-only, read-only proxy to the scorebook's data. Needs the APL_KEY environment variable
// (the scorebook passcode) on this Vercel project; visitors never see it.
const API = 'https://upbndoknwrzeohsdwkbi.supabase.co/rest/v1/docs?select=col,id,data&col=in.(matches,imports,config)&order=col,id&limit=2000';
const KEY = 'sb_publishable_3fFIIVzx3HmdGz2yuo_IgQ_VZdt3Rdb';
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'read only' });
  const pass = process.env.APL_KEY;
  if (!pass) return res.status(503).json({ error: 'not configured' });
  try {
    const r = await fetch(API, { headers: { apikey: KEY, 'x-apl-key': pass } });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(await r.json());
  } catch (e) { return res.status(502).json({ error: 'unreachable' }); }
}
