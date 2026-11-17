/* Bits shared by the analytics pages: archer links, a sortable table, filters. */
import { html, useState } from '../../vendor/preact-htm.js';
import { app, cls, tc } from '../lib/ui.js';
import { CATS } from '../lib/rules.js';

export const Arch = ({ id, team = true }) => {
  const a = app.S.A(id);
  return html`<a class="tm" href=${'#/player/' + id}><i style=${`background:${tc(a.team)}`}></i>${a.name}${team && a.team ? html`<small class="muted"> ${a.team}</small>` : ''}</a>`;
};

/* cols: [key, label, render?, {num, sort}] ; rows: objects */
export function Table({ cols, rows, sort: s0, dir: d0 = -1, limit, empty = 'Not enough data yet.' }) {
  const [sort, setSort] = useState(s0 || null); const [dir, setDir] = useState(d0); const [all, setAll] = useState(false);
  if (!rows.length) return html`<p class="empty">${empty}</p>`;
  const c = cols.find(x => x[0] === sort);
  const val = r => (c && c[3] && c[3].sort ? c[3].sort(r) : r[sort]);
  const cmp = (x, y) => (typeof x === 'string' ? x.localeCompare(y) : x - y);
  const list = sort ? rows.slice().sort((a, b) => { const x = val(a), y = val(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return dir === -1 ? cmp(y, x) : cmp(x, y); }) : rows;
  const shown = limit && !all ? list.slice(0, limit) : list;
  return html`<div class="tbl"><table><thead><tr>${cols.map(([k, l, , o]) => html`<th class=${cls(o && o.num && 'n', sort === k && 'on')}><button class="th" onClick=${() => { if (sort === k) setDir(-dir); else { setSort(k); setDir(-1); } }}>${l}${sort === k ? (dir === -1 ? ' ▾' : ' ▴') : ''}</button></th>`)}</tr></thead>
    <tbody>${shown.map((r, i) => html`<tr>${cols.map(([k, , f, o]) => html`<td class=${o && o.num ? 'n' : ''}>${f ? f(r, i) : r[k] == null ? '–' : r[k]}</td>`)}</tr>`)}</tbody></table>
    ${limit && list.length > limit ? html`<button class="lnk more" onClick=${() => setAll(!all)}>${all ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}</div>`;
}

export const Sel = ({ value, onChange, options, label }) => html`<label class="sel"><span>${label}</span><select value=${value} onChange=${e => onChange(e.target.value)}>${options.map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></label>`;
export const CAT_OPTS = [['', 'All categories'], ...Object.entries(CATS), ['R', 'All recurve'], ['C', 'All compound']];
export const catOk = (cat, f) => !f || cat === f || (f.length === 1 && cat && cat[0] === f);
export const Sample = ({ children }) => html`<p class="samp">${children}</p>`;
export const Panel = ({ title, sub, children, id }) => html`<section class="panel" id=${id}><h2>${title}</h2>${sub && html`<p class="muted">${sub}</p>`}${children}</section>`;
