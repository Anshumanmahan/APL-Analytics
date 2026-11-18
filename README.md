# APL Analytics

Analytics for Archery Premier League Season 2, live at https://apl-season.vercel.app/.

- Static site, no build step: `index.html`, `js/`, `app.css`, `analytics.css`, Preact + htm in `vendor/`.
- Pages: Home (logos, points table), Teams, Players, Matches, Analytics (leaderboard, positions, time, pressure, comebacks and shoot-offs, team strategy, event and day) and an Ideas board that tracks every idea from the notes.
- Data: read-only from the APL Scorebook's Supabase table `public.docs` (matches, imports, config). Nothing here writes.
  - `api/data.js` is a GET-only proxy. `APL_KEY` (the scorebook passcode) must be set on the Vercel project; visitors never need a passcode.
- `js/lib/season.js`, `rules.js`, `media.js`, `charts.js`, `ui.js` started as copies of the scorebook's season site. `js/lib/insights.js` holds the analytics.

Run locally: `python3 -m http.server` and open http://localhost:8000.
