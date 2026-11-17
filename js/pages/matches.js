/* Matches: every match by day with its timings, and a page for each match. */
import { html } from '../../vendor/preact-htm.js';
import { NDAYS, dayName, label, positions } from '../lib/season.js';
import { app, cls, f1, f2, tc, Result, Src, chipStyle, matchTitle, Team } from '../lib/ui.js';
import { Crest } from '../lib/media.js';
import { Lines } from '../lib/charts.js';
import { fmtTs } from '../lib/rules.js';
import { Arch, Table } from './common.js';
import { context } from '../lib/insights.js';
import { loadWeather, wxAt, wxStatus, wxModel, startOf, compass, sky, windWord, ms, VENUE, TIMES_SRC, WX_SRC } from '../lib/weather.js';

/* the arrow points the way the wind blows (it comes FROM the given direction) */
export const WindArrow = ({ dir, size = 18 }) => dir == null ? '' : html`<svg class="wx-arw" viewBox="0 0 24 24" width=${size} height=${size} style=${`transform:rotate(${dir + 180}deg)`} aria-hidden="true"><path d="M12 3v15" /><path d="M7 13l5 6 5-6" /><path d="M12 3 9 1M12 3l3-2" class="fl" /></svg>`;
export const WxChip = ({ m }) => { const w = wxAt(m); return w ? html`<span class="wx-chip" title=${`Wind at ${w.start} IST: ${Math.round(w.wind)} km/h from ${compass(w.dir)}, gusts ${Math.round(w.gust)} km/h · ${Math.round(w.temp)}°C · ${sky(w.code)}`}><${WindArrow} dir=${w.dir} size=${14} />${Math.round(w.wind)} km/h ${compass(w.dir)}<i>·</i>${Math.round(w.temp)}°</span>` : ''; };
function WxPanel({ m }) {
  const w = wxAt(m), t = startOf(m);
  return html`<section class="panel wxp"><div class="wx-head"><h2>Conditions at the start</h2><span class="wx-when">${t ? t + ' IST' : 'time not confirmed'} · ${VENUE.name}</span></div>
    ${w ? html`<div class="wx-grid">
      <div class="wx-wind"><span class="wx-dial"><${WindArrow} dir=${w.dir} size=${40} /><small>N</small></span><div><b>${Math.round(w.wind)}<small> km/h</small></b><span>${windWord(w.wind)} from the ${compass(w.dir)} (${Math.round(w.dir)}°) · ${ms(w.wind).toFixed(1)} m/s</span></div></div>
      <div><span>Gusts</span><b>${Math.round(w.gust)}<small> km/h</small></b>${w.gustMax != null && Math.round(w.gustMax) > Math.round(w.gust) ? html`<small class="muted">up to ${Math.round(w.gustMax)} during the match</small>` : ''}</div>
      <div><span>Temperature</span><b>${f1(w.temp)}<small>°C</small></b></div>
      <div><span>Humidity</span><b>${Math.round(w.rh)}<small>%</small></b></div>
      <div><span>Sky</span><b class="wx-sky">${sky(w.code)}</b><small class="muted">${Math.round(w.cloud)}% cloud${w.rain ? ` · ${w.rain} mm rain` : ''}</small></div>
    </div>` : html`<p class="muted">${wxStatus() === 'failed' ? 'Weather could not be loaded right now. Try Refresh later.' : 'Loading the weather…'}</p>`}
    <p class="wx-src">Modelled weather for the venue at 10 m height from <a href=${WX_SRC} target="_blank" rel="noopener">${wxModel()}</a>, not a reading taken on the field. Start time from the <a href=${TIMES_SRC} target="_blank" rel="noopener">official APL schedule</a>.</p></section>`;
}


const yt = (m, t) => `https://www.youtube.com/watch?v=${m.video}${t != null ? '&t=' + Math.max(0, Math.round(t)) + 's' : ''}`;
const span = m => { const v = m.arrows.map(a => a.vt).filter(x => x != null); return v.length ? { from: Math.min(...v), to: Math.max(...v) } : null; };

export function Matches() {
  const S = app.S; loadWeather();
  return html`<div class="page">
    <h1 class="pt">Matches</h1>
    <p class="lead small">Every match of the season by day. Each match shows its official start time (IST) and the wind and temperature at that moment at People's Plaza, Hyderabad. Broadcast timings let you watch from the first arrow.</p>
    ${Array.from({ length: NDAYS }, (_, i) => i + 1).map(d => { const ms = S.matches.filter(m => m.d === d);
      return html`<section class="panel"><h2>Day ${d} <small class="muted">${dayName(d)}</small></h2>
        <div class="rlist">${ms.map(m => { const sp = span(m);
          return html`<div class="mrow2"><small class="muted">${m.stage === 'League' ? 'Match ' + m.s : m.stage}${startOf(m) ? html` · <b class="mt">${startOf(m)}</b>` : ''}</small><${Result} m=${m} /><${Src} m=${m} /><${WxChip} m=${m} />
            <span class="muted small">${sp ? html`<a href=${yt(m, sp.from - 20)} target="_blank" rel="noopener">${fmtTs(sp.from)}–${fmtTs(sp.to)} ↗</a> · ${Math.round((sp.to - sp.from) / 60)} min` : 'no timings'}</span></div>`; })}</div></section>`; })}
  </div>`;
}

export function MatchPage({ k }) {
  const S = app.S; const m = S.matches.find(x => x.key === k); loadWeather();
  if (!m) return html`<div class="page"><p class="empty">No such match. <a href="#/matches">All matches</a></p></div>`;
  const ctx = context(S).filter(o => o.m === m); const piOf = new Map(ctx.map(o => [o.a, o]));
  const pos = positions(m); const sp = span(m);
  const side = t => html`<a class="mside" href=${'#/team/' + m.teams[t]} style=${`--tc:${tc(m.teams[t])}`}><${Crest} code=${m.teams[t]} size=${56} /><b>${S.T(m.teams[t]).name}</b></a>`;
  return html`<div class="page">
    <p class="kicker"><a href="#/matches">Matches</a> · ${matchTitle(m)}${startOf(m) ? ' · ' + startOf(m) + ' IST' : ''} <${Src} m=${m} /></p>
    <section class="mhero2">${side('A')}<div class="mh-score">${m.sp ? html`<b class=${m.win === m.teams.A ? 'w' : ''}>${m.sp.A}</b><i>–</i><b class=${m.win === m.teams.B ? 'w' : ''}>${m.sp.B}</b>` : html`<span>${S.T(m.win).short} won</span>`}${m.so ? html`<small>after a shoot-off</small>` : ''}</div>${side('B')}</section>
    ${m.notes.map(n => html`<p class="note">${n}</p>`)}
    <${WxPanel} m=${m} />
    ${sp && html`<p class="small"><a href=${yt(m, sp.from - 20)} target="_blank" rel="noopener">Watch on YouTube ↗</a> <span class="muted">· ${fmtTs(sp.from)}–${fmtTs(sp.to)} in the day's broadcast</span></p>`}
    ${!m.arrows.length ? html`<p class="empty">No arrows for this match yet. It will fill in when it is recorded in the scorebook.</p>` : html`
    <section class="panel"><h2>Sets</h2>
      <div class="tbl"><table><thead><tr><th>Set</th><th class="n">${m.teams.A}</th><th class="n">${m.teams.B}</th><th class="n">Points</th><th class="n">10s ${m.teams.A}</th><th class="n">10s ${m.teams.B}</th></tr></thead>
      <tbody>${m.sets.map(st => { const tens = t => m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === t && a.s === 10).length;
        return html`<tr><td>${st.n}${!st.full ? html` <small class="warn">incomplete</small>` : ''}</td><td class=${cls('n', st.tot.A > st.tot.B && 'w')}>${st.tot.A}</td><td class=${cls('n', st.tot.B > st.tot.A && 'w')}>${st.tot.B}</td><td class="n">${st.pts.A}–${st.pts.B}</td><td class="n">${tens('A')}</td><td class="n">${tens('B')}</td></tr>`; })}</tbody></table></div></section>

    ${m.sets.map(st => { const l = t => m.arrows.filter(a => a.ph === 'S' && a.set === st.n && a.t === t);
      // set race: running difference after each pair of arrows
      const race = []; let ra = 0, rb = 0; const A = l('A'), B = l('B');
      for (let i = 0; i < Math.max(A.length, B.length); i++) { ra += (A[i] && A[i].s) || 0; rb += (B[i] && B[i].s) || 0; race.push({ y: ra - rb }); }
      return html`<section class="panel"><h2>Set ${st.n} <small class="muted">${st.tot.A}–${st.tot.B}</small></h2>
        <div class="arrowgrid">${['A', 'B'].map(t => html`<div class="ag-row"><span class="ag-t"><${Team} code=${m.teams[t]} /></span>${l(t).map(a => { const o = piOf.get(a);
          return html`<span class="ag-c" title=${`${a.a ? S.A(a.a).name : 'Archer not recorded'} · arrow ${pos.get(a)} · ${a.dt != null ? a.dt + ' s' : 'time n/a'}${o ? ' · pressure ' + o.pi : ''}`}>
            <span class="schip" style=${chipStyle(a)}>${label(a)}</span><small>${a.a ? S.A(a.a).name.split(' ')[0] : '·'}</small><small class="muted">${a.dt != null ? Math.round(a.dt) + 's' : ''}</small>${o ? html`<i class="pi" style=${`--p:${o.pi}`} title=${'Pressure ' + o.pi}></i>` : ''}</span>`; })}</div>`)}</div>
        ${race.length > 1 && html`<div class="race"><${Lines} xs=${race.map((_, i) => i + 1)} series=${[{ key: 'd', label: m.teams.A + ' lead', color: tc(m.teams.A), pts: race }]} height=${150} xLabel="Arrow pair" xFmt=${v => v} fmt=${v => (v > 0 ? '+' : '') + v} /></div>`}
      </section>`; })}

    ${m.soArrows.length ? html`<section class="panel"><h2>Shoot-off</h2><div class="arrowgrid">${['A', 'B'].map(t => html`<div class="ag-row"><span class="ag-t"><${Team} code=${m.teams[t]} /></span>${m.soArrows.filter(a => a.t === t).map(a => html`<span class="ag-c"><span class="schip" style=${chipStyle(a)}>${label(a)}</span><small>${a.a ? S.A(a.a).name.split(' ')[0] : '·'}</small></span>`)}</div>`)}</div></section>` : ''}

    ${ctx.length ? html`<section class="panel"><h2>Highest-pressure arrows</h2><p class="muted">Pressure index 0–100: time left per arrow, how close the set was late on, and what the match was worth.</p>
      <${Table} rows=${ctx.slice().sort((a, b) => b.pi - a.pi).slice(0, 8)} cols=${[
        ['pi', 'Pressure', r => html`<b>${r.pi}</b>`, { num: 1 }], ['set', 'Set', r => r.a.set], ['pos', 'Arrow', r => r.pos, { num: 1 }],
        ['who', 'Archer', r => (r.a.a ? html`<${Arch} id=${r.a.a} />` : html`<${Team} code=${r.code} />`)], ['diff', 'Set score before', r => (r.diff > 0 ? '+' : '') + r.diff, { num: 1 }],
        ['cl', 'Clock left', r => (r.clBefore != null ? Math.round(r.clBefore) + ' s' : '–'), { num: 1 }], ['s', 'Scored', r => html`<span class="schip" style=${chipStyle(r.a)}>${label(r.a)}</span>`]]} /></section>` : ''}
    `}
  </div>`;
}
