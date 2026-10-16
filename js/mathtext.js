/*
 * Math written in plain text: e^{2x}, x^2, a_ij, y_{p1}, [a b; c d], |1 0; −3 2|.
 *
 * One small parser feeds three outputs:
 *   mathHTML(text)  real superscripts, subscripts and matrices for Cards and Practice
 *   mathPlain(text) Unicode ² ₁ ⁿ where every letter has one, for the map
 *   mathHand(text)  private-use letters the handwriting draws small and raised or lowered
 *
 * Shared by browser and Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function esc(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Unicode has raised and lowered forms for only some characters.
  const SUP = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', ' ': ' ',
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
    n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
    A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ', N: 'ᴺ',
    O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', 'α': 'ᵅ', 'β': 'ᵝ', 'γ': 'ᵞ', 'δ': 'ᵟ', 'θ': 'ᶿ',
  };
  const SUB = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
    a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ',
    s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ', 'β': 'ᵦ', 'ρ': 'ᵨ', 'φ': 'ᵩ', 'χ': 'ᵪ',
  };
  const UNSUP = Object.fromEntries(Object.entries(SUP).filter(([k]) => k !== '-' && k !== ' ').map(([k, v]) => [v, k]));
  const UNSUB = Object.fromEntries(Object.entries(SUB).filter(([k]) => k !== '-').map(([k, v]) => [v, k]));

  // ---------- Reading ----------

  // The group after ^ or _ : {…}, (…) for ^, or a short run like 2, -1, ij, 0.75.
  function readGroup(text, i, mark) {
    const open = text[i];
    if (open === '{' || (open === '(' && mark === '^')) {
      const close = open === '{' ? '}' : ')';
      let depth = 0;
      for (let j = i; j < text.length; j++) {
        if (text[j] === open) depth++;
        else if (text[j] === close && --depth === 0) return j > i + 1 ? { inner: text.slice(i + 1, j), end: j + 1 } : null;
      }
      return null;
    }
    const run = (mark === '^' ? /^[-−+]?(?:\d+(?:\.\d+)?|[A-Za-z0-9]+|[α-ωΑ-Ω∞*′'])/ : /^[A-Za-z0-9]+/).exec(text.slice(i));
    return run ? { inner: run[0], end: i + run[0].length } : null;
  }

  // text -> [{ text } | { sup: [...] } | { sub: [...] }]. Links are left alone.
  function parse(text) {
    const out = [];
    let plain = '';
    const flush = () => { if (plain) out.push({ text: plain }); plain = ''; };
    const s = String(text);
    for (let i = 0; i < s.length;) {
      const url = /^https?:\/\/\S+/.exec(s.slice(i));
      if (url) { plain += url[0]; i += url[0].length; continue; }
      const ch = s[i];
      const prev = s[i - 1];
      if ((ch === '^' || ch === '_') && prev && !/\s/.test(prev) && !(ch === '_' && prev === '_')) {
        const group = readGroup(s, i + 1, ch);
        if (group && !(ch === '_' && s[group.end] === '_')) {
          flush();
          out.push({ [ch === '^' ? 'sup' : 'sub']: parse(group.inner) });
          i = group.end;
          continue;
        }
      }
      plain += ch;
      i++;
    }
    flush();
    return out;
  }

  // ---------- Plain Unicode (map) ----------

  // On the map, only index-like subscripts are lowered (a₁, aᵢⱼ, xₙ): Unicode has ₓ but no
  // lowered y, so f_x and f_y stay written the same way rather than as fₓ next to f_y.
  const MAP_SUB = /^[0-9+\-−=()ijkmn]$/;
  function plainOf(parts) {
    return parts.map((p) => {
      if (p.text !== undefined) return p.text;
      const inner = plainOf(p.sup || p.sub);
      const table = p.sup ? SUP : SUB;
      if ([...inner].every((c) => table[c] !== undefined && (p.sup || MAP_SUB.test(c)))) return [...inner].map((c) => table[c]).join('');
      const simple = /^[A-Za-z0-9]+$/.test(inner);
      return (p.sup ? '^' : '_') + (simple ? inner : `(${inner})`);
    }).join('');
  }
  function mathPlain(text) {
    return /[\^_]/.test(text) ? plainOf(parse(text)) : String(text);
  }

  // ---------- HTML (cards and practice) ----------

  // [a b; c d], |a b; c d| and [[1,x,y],[1,x1,y1]] become small grids.
  const MATRIX = /\[\[([^[\]]+)\](?:\s*,\s*\[([^[\]]+)\])+\]|\[([^[\];|]+(?:;[^[\];|]+)+)\]|\|([^|;]+(?:;[^|;]+)+)\|/g;
  // Entries are split by commas when a row has them ("cos x, sin x"), otherwise by spaces.
  // Words like "area" or "note" mean it is prose in brackets, not a matrix.
  function matrixRows(match) {
    let rows;
    if (match.startsWith('[[')) rows = match.slice(2, -2).split(/\]\s*,\s*\[/).map((r) => r.split(',').map((c) => c.trim()));
    else rows = match.slice(1, -1).split(';').map((r) => r.trim()).map((r) => (r.includes(',') ? r.split(',') : r.split(/\s+/)).map((c) => c.trim()).filter(Boolean));
    const commas = match.includes(',');
    const cols = rows[0].length;
    const ok = rows.length >= 2 && rows.length <= 8 && cols >= 1 && cols <= 8 &&
      rows.every((r) => r.length === cols && r.every((c) => c.length <= 14 && (commas || !/[A-Za-z]{3}/.test(c))));
    return ok ? rows : null;
  }
  function scriptsHTML(parts) {
    return parts.map((p) => p.text !== undefined ? esc(p.text) : p.sup ? `<sup>${scriptsHTML(p.sup)}</sup>` : `<sub>${scriptsHTML(p.sub)}</sub>`).join('');
  }
  function mathHTML(text) {
    const s = String(text == null ? '' : text);
    let html = '';
    let last = 0;
    for (const m of s.matchAll(MATRIX)) {
      // |…| only opens a determinant where a new term starts, not right after |det A| or x.
      if (m[0][0] === '|' && /[\w)\]′'²³¹⁰-⁹]/.test(s[m.index - 1] || '')) continue;
      const rows = matrixRows(m[0]);
      if (!rows) continue;
      html += scriptsHTML(parse(s.slice(last, m.index)));
      const kind = m[0][0] === '|' ? 'det' : 'brackets';
      html += `<span class="matrix ${kind}" role="math" aria-label="${esc(m[0])}" style="--cols:${rows[0].length}">` +
        rows.map((r) => r.map((c) => `<span>${scriptsHTML(parse(c))}</span>`).join('')).join('') + '</span>';
      last = m.index + m[0].length;
    }
    return html + scriptsHTML(parse(s.slice(last)));
  }

  // ---------- Handwriting ----------

  // Each character the handwriting can shrink gets a raised and a lowered private-use twin.
  const HAND_BASE = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') +
    'αβγδεζηθικλμνξοπρστυφχψωΓΔΘΛΞΠΣΦΨΩ∞∫∑√±×·−∂∇∈′…';
  const HAND_INDEX = new Map([...HAND_BASE].map((c, i) => [c, i]));
  const RAISED = 0xe000;
  const LOWERED = 0xe400;
  function handChar(c, pos) {
    const i = HAND_INDEX.get(c);
    return i === undefined ? c : String.fromCharCode((pos > 0 ? RAISED : LOWERED) + i);
  }
  function handOf(parts, pos) {
    return parts.map((p) => {
      if (p.text !== undefined) return pos ? [...p.text].map((c) => handChar(c, pos)).join('') : p.text;
      return handOf(p.sup || p.sub, p.sup ? 1 : -1);
    }).join('');
  }
  function mathHand(text) {
    const s = /[\^_]/.test(text) ? handOf(parse(text), 0) : String(text);
    return s.replace(/[²³¹⁰-ₜᵃ-ᶿⱼⱽʰ-ˡ]/g, (c) => {
      if (UNSUP[c] !== undefined) return handChar(UNSUP[c], 1);
      if (UNSUB[c] !== undefined) return handChar(UNSUB[c], -1);
      return c;
    });
  }
  // For the handwriting: which letter a private-use character stands for, and where it sits.
  function handScript(ch) {
    const code = ch.charCodeAt(0);
    if (code >= RAISED && code < RAISED + HAND_BASE.length) return { base: HAND_BASE[code - RAISED], pos: 1 };
    if (code >= LOWERED && code < LOWERED + HAND_BASE.length) return { base: HAND_BASE[code - LOWERED], pos: -1 };
    return null;
  }

  return { mathHTML, mathPlain, mathHand, handScript, parseScripts: parse };
});
