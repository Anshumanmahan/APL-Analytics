/* Bits shared by the analytics pages: archer links, a sortable table, filters. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app, cls, tc } from '../lib/ui.js';
import { CATS } from '../lib/rules.js';
import { Crest } from '../lib/media.js';

export const Arch = ({ id, team = true }) => {
  const a = app.S.A(id);
  return html`<a class="tm" href=${'#/player/' + id} style=${`--tc:${tc(a.team)}`}><i></i><span class="tm-n">${a.name}</span>${team && a.team ? html`<em class="tchip" title=${app.S.T(a.team).name}>${a.team}</em>` : ''}</a>`;
};
/* an archer in a ranking cell: name and team on one line, the number and sample size underneath */
export const Pick = ({ id, v, n, unit = 'avg' }) => html`<span class="pick"><${Arch} id=${id} /><span class="pk-s"><b>${v}</b> ${unit} · ${n} arrows</span></span>`;

/* cols: [key, label, render?, {num, sort}] ; rows: objects */
export function Table({ cols, rows, sort: s0, dir: d0 = -1, limit, empty = 'Not enough data yet.' }) {
  const [sort, setSort] = useState(s0 || null); const [dir, setDir] = useState(d0); const [all, setAll] = useState(false);
  if (!rows.length) return html`<p class="empty">${empty}</p>`;
  const c = cols.find(x => x[0] === sort);
  const val = r => (c && c[3] && c[3].sort ? c[3].sort(r) : r[sort]);
  const cmp = (x, y) => (typeof x === 'string' ? x.localeCompare(y) : x - y);
  const list = sort ? rows.slice().sort((a, b) => { const x = val(a), y = val(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return dir === -1 ? cmp(y, x) : cmp(x, y); }) : rows;
  const shown = limit && !all ? list.slice(0, limit) : list;
  return html`<div class="tbl"><table><thead><tr>${cols.map(([k, l, , o]) => html`<th class=${cls(o && o.num && 'n', sort === k && 'on', o && o.sm === 0 && 'hs')}><button class="th" onClick=${() => { if (sort === k) setDir(-dir); else { setSort(k); setDir(-1); } }}>${l}${sort === k ? (dir === -1 ? ' ▾' : ' ▴') : ''}</button></th>`)}</tr></thead>
    <tbody>${shown.map((r, i) => html`<tr>${cols.map(([k, , f, o]) => html`<td class=${cls(o && o.num && 'n', o && o.sm === 0 && 'hs')}>${f ? f(r, i) : r[k] == null ? '–' : r[k]}</td>`)}</tr>`)}</tbody></table>
    ${limit && list.length > limit ? html`<button class="lnk more" onClick=${() => setAll(!all)}>${all ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}</div>`;
}

export const Sel = ({ value, onChange, options, label }) => html`<label class="sel"><span>${label}</span><select value=${value} onChange=${e => onChange(e.target.value)}>${options.map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></label>`;
/* Tappable filter controls, used instead of dropdowns across the site. */
export const Seg = ({ label, opts, value, onPick, small }) => html`<div class=${'seg' + (small ? ' seg-s' : '')} role="radiogroup" aria-label=${label}>
  ${opts.map(([v, l]) => html`<button type="button" role="radio" aria-checked=${value === v} class=${value === v ? 'on' : ''} onClick=${() => onPick(v)}>${l}</button>`)}</div>`;
/* labelled group for a filter bar */
export const FGroup = ({ label, children }) => html`<div class="fg"><span class="fg-l">${label}</span>${children}</div>`;
/* team crests: tap to pick, tap again to drop; several can be picked */
export const CrestPick = ({ value, onChange, counts = {}, compact }) => { const S = app.S;
  const toggle = code => onChange(value.includes(code) ? value.filter(t => t !== code) : [...value, code]);
  return html`<div class=${'crests' + (compact ? ' crests-s' : '')} role="group" aria-label="Teams">
    ${S.roster.teams.map(t => { const code = t.short; const on = value.includes(code);
      return html`<button type="button" class=${'crest' + (on ? ' on' : '') + (value.length && !on ? ' dim' : '')} aria-pressed=${on} style=${`--tc:${tc(code)}`} onClick=${() => toggle(code)} title=${S.T(code).name}>
        <span class="cr-l"><${Crest} code=${code} size=${compact ? 26 : 34} /></span><span class="cr-t"><b>${code}</b>${counts[code] != null ? html`<small>${counts[code]}</small>` : ''}</span></button>`; })}
  </div>`; };
/* a stepped slider over a few fixed values, with the stops labelled underneath */
export const Steps = ({ label, values, value, onPick, unit = '' }) => { const i = Math.max(0, values.indexOf(value));
  return html`<div class="steps" style=${`--p:${(i / (values.length - 1)) * 100}%`}>
    <input type="range" min="0" max=${values.length - 1} step="1" value=${i} aria-label=${label} aria-valuetext=${values[i] + unit} onInput=${e => onPick(values[+e.target.value])} />
    <div class="st-k">${values.map((v, j) => html`<button type="button" class=${j === i ? 'on' : ''} onClick=${() => onPick(v)}>${v}</button>`)}</div></div>`; };
export const CAT_OPTS = [['', 'All categories'], ...Object.entries(CATS), ['R', 'All recurve'], ['C', 'All compound']];
export const catOk = (cat, f) => !f || cat === f || (f.length === 1 && cat && cat[0] === f);
export const Sample = ({ children }) => html`<p class="samp">${children}</p>`;
export const Panel = ({ title, sub, children, id }) => html`<section class="panel" id=${id}><h2>${title}</h2>${sub && html`<p class="muted">${sub}</p>`}${children}</section>`;
