/* Weather at each match: venue, official start times, and historical hourly weather from Open-Meteo.
   - Venue and start times: archerypremierleague.co.in/matches (People's Plaza, Necklace Road, Hyderabad;
     matches at 19:45, 20:20 and 21:00 IST, plus 21:40 for Eliminator 1 on 17 Oct).
   - Weather: Open-Meteo historical weather API (reanalysis models, free, no key), for the venue's grid point.
     It is modelled weather at 10 m height, not a reading taken on the field.
   Fetched in the browser once and kept in localStorage: past weather does not change. */
import { app } from './ui.js';

export const VENUE = { name: "People's Plaza, Necklace Road, Hyderabad", lat: 17.4156, lon: 78.4671 };
export const TIMES_SRC = 'https://archerypremierleague.co.in/matches';
export const WX_SRC = 'https://open-meteo.com/en/docs/historical-weather-api';
const SLOT_TIME = ['19:45', '20:20', '21:00', '21:40'];
const FIRST = '2026-10-08', LAST = '2026-10-18';
const KEY = 'apl-wx-v1';
const VARS = ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m', 'weather_code', 'cloud_cover', 'precipitation'];
const MATCH_MIN = 35; // a match runs about 20–35 minutes

const pad = n => String(n).padStart(2, '0');
export const startOf = m => SLOT_TIME[m.s - 1] || null;
const dateStr = m => { const d = m.date; return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

let wx = null, status = 'idle';
try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.hourly && c.hourly.time) { wx = c; status = 'ready'; } } catch (e) { }

const usable = j => j && j.hourly && Array.isArray(j.hourly.time) && j.hourly.wind_speed_10m && j.hourly.wind_speed_10m.some(v => v != null);
async function get(base) {
  const u = `${base}?latitude=${VENUE.lat}&longitude=${VENUE.lon}&start_date=${FIRST}&end_date=${LAST}&hourly=${VARS.join(',')}&timezone=Asia%2FKolkata&wind_speed_unit=kmh`;
  const r = await fetch(u); if (!r.ok) throw new Error('weather ' + r.status); return r.json();
}
export function loadWeather() {
  if (status !== 'idle') return;
  status = 'loading';
  (async () => {
    let j = null;
    // the archive (ERA5 family) first; the high-resolution historical forecast as a fallback
    for (const [base, model] of [['https://archive-api.open-meteo.com/v1/archive', 'Open-Meteo historical archive (ERA5 reanalysis)'], ['https://historical-forecast-api.open-meteo.com/v1/forecast', 'Open-Meteo historical forecast (high-resolution models)']]) {
      try { const r = await get(base); if (usable(r)) { j = r; j.model = model; break; } } catch (e) { }
    }
    if (j) { wx = { hourly: j.hourly, model: j.model, at: Date.now() }; status = 'ready'; try { localStorage.setItem(KEY, JSON.stringify(wx)); } catch (e) { } }
    else status = 'failed';
    if (app.render) app.render();
  })();
}
export const wxStatus = () => status;
export const wxModel = () => (wx && wx.model) || 'Open-Meteo';

const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = d => (d == null ? '–' : DIRS[Math.round(((d % 360) + 360) % 360 / 22.5) % 16]);
const CODES = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail' };
export const sky = c => (c == null ? '–' : CODES[c] || 'Code ' + c);
/* plain words for a wind speed in km/h, roughly the Beaufort scale */
export const windWord = v => (v == null ? '' : v < 2 ? 'Calm' : v < 6 ? 'Light air' : v < 12 ? 'Light breeze' : v < 20 ? 'Gentle breeze' : v < 29 ? 'Moderate breeze' : v < 39 ? 'Fresh breeze' : 'Strong wind');
export const ms = v => (v == null ? null : v / 3.6);

/* conditions at the start of a match, interpolated between the two hours around it; the highest gust over the match */
const cache = new Map();
export function wxAt(m) {
  if (!wx) return null;
  const t = startOf(m); if (!t) return null;
  const id = m.key; if (cache.has(id)) return cache.get(id);
  const H = wx.hourly, ds = dateStr(m), [hh, mm] = t.split(':').map(Number);
  const i0 = H.time.indexOf(`${ds}T${pad(hh)}:00`); if (i0 < 0) return null;
  const i1 = Math.min(i0 + 1, H.time.length - 1), f = mm / 60;
  const lerp = k => { const a = H[k] && H[k][i0], b = H[k] && H[k][i1]; return a == null ? b ?? null : b == null ? a : a + (b - a) * f; };
  const near = k => (H[k] ? H[k][f < 0.5 ? i0 : i1] : null);
  const endH = hh + (mm + MATCH_MIN) / 60; const iEnd = Math.min(i0 + Math.ceil(endH - hh), H.time.length - 1);
  const gusts = H.wind_gusts_10m ? H.wind_gusts_10m.slice(i0, iEnd + 1).filter(v => v != null) : [];
  const o = { start: t, date: ds, temp: lerp('temperature_2m'), rh: lerp('relative_humidity_2m'), wind: lerp('wind_speed_10m'), gust: lerp('wind_gusts_10m'),
    gustMax: gusts.length ? Math.max(...gusts) : null, dir: near('wind_direction_10m'), code: near('weather_code'), cloud: lerp('cloud_cover'), rain: near('precipitation') };
  cache.set(id, o); return o;
}
