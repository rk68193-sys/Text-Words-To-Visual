/*
 * Drawings and math graphs for notes, drawn as SVG.
 *
 * A figure is { w, h, bg, photo?, graph?, items: [...] }:
 *   items   pen strokes, lines and arrows, boxes, ellipses and text, in pixels
 *   graph   a few lines of plain text describing a math graph (see GRAPH_HELP)
 *   photo   a picture underneath, as a data: URL
 * A note points at a figure with a line like  ![Caption](fig:abc123).
 *
 * Expressions are read by a small parser (no eval), so a graph can only compute numbers.
 * Shared by browser and Node.
 */
(function (root, factory) {
  const math = typeof module === 'object' && module.exports ? require('./mathtext.js') : root.VisualNotes;
  const api = factory(math);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function (math) {
  'use strict';

  const FIGURE_LINE = /^!\[([^\]]*)\]\(fig:([\w-]{1,64})\)\s*$/;
  const COLORS = {
    black: '#222222', gray: '#7a7a7a', blue: '#2b5fab', red: '#c0392b', green: '#2e7d4f', orange: '#d9731a',
    purple: '#7b4fa3', teal: '#1f7a7a', pink: '#c2266f', brown: '#7a5230', navy: '#1b2f66', gold: '#b8860b',
  };
  const PALETTE = ['#222222', '#2b5fab', '#c0392b', '#2e7d4f', '#d9731a', '#7b4fa3', '#1f7a7a', '#c2266f'];
  const HEX = /^#[0-9a-f]{6}$/i;
  const FONT = 'Segoe UI, system-ui, -apple-system, sans-serif';

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = (v) => Math.round(v * 10) / 10;
  const colorOf = (c, fallback = '#222222') => (HEX.test(c || '') ? c : COLORS[String(c || '').toLowerCase()] || fallback);
  const label = (t) => esc(math.mathPlain ? math.mathPlain(t) : t);

  function newFigure() {
    return { w: 640, h: 400, bg: 'grid', graph: '', items: [] };
  }

  // ---------- Expressions: 2x^2 + sin(4x), e^(−x²), cosh(2(1 − x)), x y ----------

  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log10,
    sqrt: Math.sqrt, abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil,
    sec: (v) => 1 / Math.cos(v), csc: (v) => 1 / Math.sin(v), cot: (v) => 1 / Math.tan(v),
  };
  const CONSTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };
  const SUPERS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

  function tokenize(src) {
    const s = String(src).replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + [...m].map((c) => SUPERS[c]).join('')).replace(/\*\*/g, '^');
    const tokens = [];
    const re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z_][A-Za-z_0-9]*)|(\S))/y;
    const text = s.trim();
    let m;
    while (re.lastIndex < text.length && (m = re.exec(text))) {
      if (m[1]) tokens.push({ num: Number(m[1]) });
      else if (m[2]) {
        // "xy" is x times y, "sinx" is sin(x): split runs of letters into known words and variables.
        let word = m[2];
        while (word) {
          const known = Object.keys(FUNCS).concat(Object.keys(CONSTS)).sort((a, b) => b.length - a.length).find((k) => word.startsWith(k));
          const piece = known || word[0];
          tokens.push({ id: piece });
          word = word.slice(piece.length);
        }
      } else if (m[3]) tokens.push({ op: m[3] });
    }
    if (!text) throw new Error('An expression is empty');
    return tokens;
  }

  /**
   * compileExpr("2x^2 + sin(4x)", ['x']) -> (x) => number
   * Throws an Error with a readable message for anything it does not understand.
   */
  function compileExpr(src, vars = ['x']) {
    const tokens = tokenize(src);
    let i = 0;
    const peek = () => tokens[i];
    const isOp = (t, op) => t && t.op === op;
    const startsAtom = (t) => t && (t.num !== undefined || t.id || t.op === '(');
    function expr() {
      let left = term();
      while (isOp(peek(), '+') || isOp(peek(), '-')) {
        const op = tokens[i++].op;
        const a = left, b = term();
        left = op === '+' ? (env) => a(env) + b(env) : (env) => a(env) - b(env);
      }
      return left;
    }
    function term() {
      let left = unary();
      for (;;) {
        const t = peek();
        if (isOp(t, '*') || isOp(t, '/')) {
          i++;
          const a = left, b = unary();
          left = t.op === '*' ? (env) => a(env) * b(env) : (env) => a(env) / b(env);
        } else if (startsAtom(t)) {
          const a = left, b = power();
          left = (env) => a(env) * b(env);
        } else return left;
      }
    }
    function unary() {
      if (isOp(peek(), '-')) { i++; const a = unary(); return (env) => -a(env); }
      if (isOp(peek(), '+')) { i++; return unary(); }
      return power();
    }
    function power() {
      const base = call();
      if (isOp(peek(), '^')) { i++; const ex = unary(); return (env) => Math.pow(base(env), ex(env)); }
      return base;
    }
    function call() {
      const t = peek();
      if (t && t.id && FUNCS[t.id]) {
        i++;
        const fn = FUNCS[t.id];
        // sin(x) or sin x; sin^2 x means (sin x)^2.
        let exponent = null;
        if (isOp(peek(), '^')) { i++; exponent = atom(); }
        const arg = isOp(peek(), '(') ? atom() : power();
        return exponent ? (env) => Math.pow(fn(arg(env)), exponent(env)) : (env) => fn(arg(env));
      }
      return atom();
    }
    function atom() {
      const t = tokens[i++];
      if (!t) throw new Error('The expression ends too soon');
      if (t.num !== undefined) return () => t.num;
      if (t.op === '(') {
        const inner = expr();
        if (!isOp(tokens[i++], ')')) throw new Error('A ")" is missing');
        return inner;
      }
      if (t.id) {
        const k = vars.indexOf(t.id);
        if (k >= 0) return (env) => env[k];
        if (CONSTS[t.id] !== undefined) return () => CONSTS[t.id];
        throw new Error(`Unknown name "${t.id}" (use ${vars.join(', ')})`);
      }
      throw new Error(`Unexpected "${t.op}"`);
    }
    const f = expr();
    if (i < tokens.length) throw new Error(`Unexpected "${tokens[i].op || tokens[i].id || tokens[i].num}"`);
    return (...values) => { const v = f(values); return Number.isFinite(v) ? v : NaN; };
  }
  const value = (src) => compileExpr(src, [])();

  // ---------- The graph language ----------

  const GRAPH_HELP = [
    'x: -3 .. 3            y: -2 .. 2            (ranges; numbers like pi/2 work)',
    'y = sin(4x) | red dashed | label c₂ sin 4t',
    'x = 1                  a vertical line',
    'param cos(t), sin(t) | t: 0 .. 2pi',
    'level x^2 + y^2 = 1, 2, 3, 4 | green       level curves f(x,y) = k (quiet: no k labels)',
    'slope x - y            a slope field for dy/dx = f(x, y)',
    'field -y, x            arrows of the vector field ⟨P, Q⟩',
    'vector 0,0 -> 2,1 | label a₁',
    'segment 0,0 -> 1,1     point 1,1 | label P     text 1.5,1 : words',
    'polygon 0,0; 3,1; 4,3; 1,2 | fill blue',
    'axes t, x              names for the axes      grid off      ticks off',
    'equal                  same scale on x and y, so circles stay round',
    '3d                     3D view (add z: 0 .. 4); then:',
    'surface z = x^2 + y^2 | levels 1, 2, 3 | floor',
    'curve3 cos(t), sin(t), 1 | t: 0 .. 2pi      point3 1,1,3      vector3 0,0,0 -> 1,1,1',
    'polygon3 1,0,0; 0,1,0; 0,0,1 | fill orange',
  ].join('\n');

  // Splits at top-level commas or semicolons, leaving f(a, b) whole.
  function splitTop(s, sep) {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map((p) => p.trim()).filter((p) => p !== '');
  }
  const point = (s, dims) => {
    const parts = splitTop(s, ',').map(value);
    if (parts.length !== dims || parts.some((v) => !Number.isFinite(v))) throw new Error(`"${s}" needs ${dims} numbers`);
    return parts;
  };
  const range = (s) => {
    const m = /^(.+?)\s*(?:\.\.|to)\s*(.+)$/.exec(s);
    if (!m) throw new Error(`"${s}" should look like -3 .. 3`);
    const r = [value(m[1]), value(m[2])];
    if (!(r[1] > r[0])) throw new Error(`"${s}": the second number must be bigger`);
    return r;
  };

  // Options after "|": colors, dashed, dotted, thick, thin, fill [color], label words, t: a .. b, mesh N, levels a, b
  function options(parts) {
    const o = { color: null, dash: null, width: 2.2, fill: null, label: '', t: null, mesh: 14, levels: null, floor: false, n: null, quiet: false };
    for (const raw of parts) {
      for (const piece of raw.split(/\s+(?=(?:dashed|dotted|thick|thin|fill|label|floor|mesh|levels|quiet|n)\b)/)) {
        const p = piece.trim();
        let m;
        if (!p) continue;
        if ((m = /^label\s+(.*)$/i.exec(p))) o.label = m[1];
        else if ((m = /^t\s*:\s*(.*)$/i.exec(p))) o.t = range(m[1]);
        else if ((m = /^mesh\s+(\d+)$/i.exec(p))) o.mesh = Math.min(40, Math.max(2, Number(m[1])));
        else if ((m = /^n\s+(\d+)$/i.exec(p))) o.n = Math.min(40, Math.max(2, Number(m[1])));
        else if ((m = /^levels?\s+(.*)$/i.exec(p))) o.levels = splitTop(m[1], ',').map(value);
        else if (/^floor$/i.test(p)) o.floor = true;
        else if (/^quiet$/i.test(p)) o.quiet = true;
        else if ((m = /^fill(?:\s+(\S+))?$/i.exec(p))) o.fill = m[1] || 'same';
        else if (/^dashed$/i.test(p)) o.dash = '7 5';
        else if (/^dotted$/i.test(p)) o.dash = '2 4';
        else if (/^thick$/i.test(p)) o.width = 3.6;
        else if (/^thin$/i.test(p)) o.width = 1.3;
        else if (HEX.test(p) || COLORS[p.toLowerCase()]) o.color = colorOf(p);
        else throw new Error(`Unknown option "${p}"`);
      }
    }
    return o;
  }

  /**
   * parseGraph(spec) -> { x, y, z, three, grid, ticks, axes, items, errors }
   * Each line that cannot be read is reported in errors (with its line number) and skipped.
   */
  function parseGraph(spec) {
    const g = { x: [-5, 5], y: [-5, 5], z: [-5, 5], three: false, equal: false, grid: true, ticks: true, axes: ['x', 'y', 'z'], items: [], errors: [] };
    let colorIndex = 0;
    const nextColor = () => PALETTE[1 + (colorIndex++ % (PALETTE.length - 1))];
    String(spec || '').split('\n').forEach((rawLine, li) => {
      let line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line) return;
      try {
        // "label …" takes the rest of the line, so a label can hold | like |det A|.
        let labelText = '';
        const at = line.search(/\|[^|]*?\blabel\s/);
        if (at >= 0) {
          const start = line.indexOf('label', at);
          labelText = line.slice(start + 5).trim();
          line = line.slice(0, start).replace(/\|\s*$/, '').trim();
        }
        // Options written after the label ("label a₁ | red") still count as options.
        const trailing = [];
        let tail;
        while ((tail = /^(.*\S)\s*\|\s*([^|]+)$/.exec(labelText))) {
          try { options([tail[2]]); } catch (e) { break; }
          trailing.unshift(tail[2]);
          labelText = tail[1];
        }
        const [head, ...rest] = splitTop(line, '|');
        const o = options(rest.concat(trailing));
        if (labelText) o.label = labelText;
        let m;
        // Each drawn line gets the next color unless it names one (a filled shape uses its fill).
        const add = (item) => {
          const color = o.color || (o.fill && o.fill !== 'same' ? colorOf(o.fill) : nextColor());
          if (item.fill === 'same') item.fill = color;
          g.items.push(Object.assign({ color, dash: o.dash, width: o.width, label: o.label }, item));
        };
        if ((m = /^([xyz])\s*:\s*(.+)$/i.exec(head)) && /\.\.|to/.test(m[2])) g[m[1].toLowerCase()] = range(m[2]);
        else if (/^3d$/i.test(head)) { g.three = true; g.x = [-2, 2]; g.y = [-2, 2]; g.z = [0, 4]; }
        else if (/^grid\s+off$/i.test(head)) g.grid = false;
        else if (/^equal$/i.test(head)) g.equal = true;
        else if (/^ticks\s+off$/i.test(head)) g.ticks = false;
        else if ((m = /^axes\s+(.+)$/i.exec(head))) g.axes = splitTop(m[1], ',').concat(['x', 'y', 'z']).slice(0, 3);
        else if ((m = /^y\s*=\s*(.+)$/i.exec(head))) add({ kind: 'fn', f: compileExpr(m[1], ['x']) });
        else if ((m = /^x\s*=\s*(.+)$/i.exec(head))) add({ kind: 'vline', at: value(m[1]) });
        else if ((m = /^param\s+(.+)$/i.exec(head))) {
          const [fx, fy] = splitTop(m[1], ',');
          add({ kind: 'param', fx: compileExpr(fx, ['t']), fy: compileExpr(fy, ['t']), t: o.t || [0, 2 * Math.PI] });
        } else if ((m = /^level\s+(.+?)\s*=\s*(.+)$/i.exec(head))) add({ kind: 'level', f: compileExpr(m[1], ['x', 'y']), ks: splitTop(m[2], ',').map(value), quiet: o.quiet });
        else if ((m = /^slope\s+(?:dy\/dx\s*=\s*)?(.+)$/i.exec(head))) add({ kind: 'slope', f: compileExpr(m[1], ['x', 'y']), n: o.n || 15, width: o.dash ? o.width : Math.min(o.width, 1.6) });
        else if ((m = /^field\s+(.+)$/i.exec(head))) {
          const [p, q] = splitTop(m[1], ',');
          add({ kind: 'field', p: compileExpr(p, ['x', 'y']), q: compileExpr(q, ['x', 'y']), n: o.n || 11, width: Math.min(o.width, 1.6) });
        } else if ((m = /^(vector|segment)(3?)\s+(.+?)\s*->\s*(.+)$/i.exec(head))) {
          const dims = m[2] ? 3 : 2;
          add({ kind: m[1].toLowerCase(), three: !!m[2], from: point(m[3], dims), to: point(m[4], dims) });
        } else if ((m = /^point(3?)\s+(.+)$/i.exec(head))) add({ kind: 'point', three: !!m[1], at: point(m[2], m[1] ? 3 : 2) });
        else if ((m = /^text(3?)\s+(.+?)\s*:\s*(.+)$/i.exec(head))) add({ kind: 'text', three: !!m[1], at: point(m[2], m[1] ? 3 : 2), label: m[3] });
        else if ((m = /^polygon(3?)\s+(.+)$/i.exec(head))) {
          const dims = m[1] ? 3 : 2;
          add({ kind: 'polygon', three: !!m[1], pts: splitTop(m[2], ';').map((p) => point(p, dims)), fill: o.fill ? (o.fill === 'same' ? 'same' : colorOf(o.fill)) : null });
        } else if ((m = /^surface\s+(?:z\s*=\s*)?(.+)$/i.exec(head))) add({ kind: 'surface', f: compileExpr(m[1], ['x', 'y']), mesh: o.mesh, levels: o.levels, floor: o.floor, width: Math.min(o.width, 1.4) });
        else if ((m = /^curve3\s+(.+)$/i.exec(head))) {
          const [fx, fy, fz] = splitTop(m[1], ',');
          if (!fz) throw new Error('curve3 needs x, y and z');
          add({ kind: 'curve3', fx: compileExpr(fx, ['t']), fy: compileExpr(fy, ['t']), fz: compileExpr(fz, ['t']), t: o.t || [0, 2 * Math.PI] });
        } else throw new Error(`Not a graph line: "${head}"`);
      } catch (err) {
        g.errors.push(`Line ${li + 1}: ${err.message}`);
      }
    });
    return g;
  }

  // ---------- Level curves by marching squares ----------

  function contour(f, xr, yr, k, cols = 90, rows = 90) {
    const segs = [];
    const dx = (xr[1] - xr[0]) / cols;
    const dy = (yr[1] - yr[0]) / rows;
    const grid = [];
    for (let j = 0; j <= rows; j++) {
      grid.push([]);
      for (let i = 0; i <= cols; i++) grid[j].push(f(xr[0] + i * dx, yr[0] + j * dy) - k);
    }
    const lerp = (a, b, va, vb) => a + (b - a) * (va / (va - vb));
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x0 = xr[0] + i * dx, y0 = yr[0] + j * dy, x1 = x0 + dx, y1 = y0 + dy;
        const v = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
        if (v.some((q) => !Number.isFinite(q))) continue;
        const cross = [];
        const edges = [[[x0, y0], [x1, y0], v[0], v[1]], [[x1, y0], [x1, y1], v[1], v[2]], [[x1, y1], [x0, y1], v[2], v[3]], [[x0, y1], [x0, y0], v[3], v[0]]];
        for (const [a, b, va, vb] of edges) {
          if ((va < 0) !== (vb < 0)) cross.push([lerp(a[0], b[0], va, vb), lerp(a[1], b[1], va, vb)]);
        }
        if (cross.length === 2) segs.push(cross);
        else if (cross.length === 4) segs.push([cross[0], cross[1]], [cross[2], cross[3]]);
      }
    }
    return segs;
  }

  // ---------- Drawing the graph ----------

  function niceStep(span) {
    const raw = span / 8;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || p * 10;
  }
  const fmt = (v) => (Math.abs(v) < 1e-9 ? '0' : Math.abs(v - Math.PI) < 1e-9 ? 'π' : String(Math.round(v * 1000) / 1000));

  function arrowHead(x1, y1, x2, y2, color, size = 9) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const p = (da) => `${n(x2 - size * Math.cos(a - da))} ${n(y2 - size * Math.sin(a - da))}`;
    return `<path d="M${p(0.42)} L${n(x2)} ${n(y2)} L${p(-0.42)} Z" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  const strokeAttrs = (it) => `stroke="${it.color}" stroke-width="${it.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"${it.dash ? ` stroke-dasharray="${it.dash}"` : ''}`;
  const textAt = (x, y, s, color, size = 14, anchor = 'start') => `<text x="${n(x)}" y="${n(y)}" font-family="${FONT}" font-size="${size}" fill="${color}" text-anchor="${anchor}" paint-order="stroke" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round">${label(s)}</text>`;

  // Polyline pieces from sampled points; breaks where the curve leaves the frame or jumps.
  function pathFrom(points, box) {
    let d = '';
    let pen = false;
    let last = null;
    const margin = Math.max(box.w, box.h);
    for (const p of points) {
      const ok = p && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] > box.y - margin && p[1] < box.y + box.h + margin;
      if (!ok || (last && Math.abs(p[1] - last[1]) > box.h * 1.5)) { pen = false; last = ok ? p : null; if (!ok) continue; }
      d += (pen ? 'L' : 'M') + n(p[0]) + ' ' + n(p[1]);
      pen = true;
      last = p;
    }
    return d;
  }

  function graph2D(g, frame) {
    const out = [];
    // "equal": one unit is as long across as it is up, so the frame shrinks to fit.
    let box = frame;
    if (g.equal) {
      const unit = Math.min(frame.w / (g.x[1] - g.x[0]), frame.h / (g.y[1] - g.y[0]));
      const w = unit * (g.x[1] - g.x[0]), h = unit * (g.y[1] - g.y[0]);
      box = { x: frame.x + (frame.w - w) / 2, y: frame.y + (frame.h - h) / 2, w, h };
    }
    const X = (x) => box.x + ((x - g.x[0]) / (g.x[1] - g.x[0])) * box.w;
    const Y = (y) => box.y + box.h - ((y - g.y[0]) / (g.y[1] - g.y[0])) * box.h;
    const sx = niceStep(g.x[1] - g.x[0]);
    const sy = niceStep(g.y[1] - g.y[0]);
    const ticksX = [];
    const ticksY = [];
    for (let v = Math.ceil(g.x[0] / sx) * sx; v <= g.x[1] + 1e-9; v += sx) ticksX.push(v);
    for (let v = Math.ceil(g.y[0] / sy) * sy; v <= g.y[1] + 1e-9; v += sy) ticksY.push(v);
    if (g.grid) {
      out.push('<g stroke="#d9dde3" stroke-width="1">');
      for (const v of ticksX) out.push(`<line x1="${n(X(v))}" y1="${box.y}" x2="${n(X(v))}" y2="${box.y + box.h}"/>`);
      for (const v of ticksY) out.push(`<line x1="${box.x}" y1="${n(Y(v))}" x2="${box.x + box.w}" y2="${n(Y(v))}"/>`);
      out.push('</g>');
    }
    // Axes through 0 when 0 is in view, otherwise along the edge.
    const ax = g.y[0] <= 0 && g.y[1] >= 0 ? Y(0) : box.y + box.h;
    const ay = g.x[0] <= 0 && g.x[1] >= 0 ? X(0) : box.x;
    out.push(`<line x1="${box.x}" y1="${n(ax)}" x2="${box.x + box.w}" y2="${n(ax)}" stroke="#444" stroke-width="1.4"/>` + arrowHead(box.x, ax, box.x + box.w + 6, ax, '#444', 8));
    out.push(`<line x1="${n(ay)}" y1="${box.y + box.h}" x2="${n(ay)}" y2="${box.y}" stroke="#444" stroke-width="1.4"/>` + arrowHead(ay, box.y + box.h, ay, box.y - 6, '#444', 8));
    out.push(textAt(box.x + box.w + 4, ax - 8, g.axes[0], '#333', 15, 'end'), textAt(ay + 8, box.y + 4, g.axes[1], '#333', 15));
    if (g.ticks) {
      for (const v of ticksX) if (Math.abs(v) > 1e-9) out.push(textAt(X(v), ax + 15, fmt(v), '#666', 11, 'middle'));
      for (const v of ticksY) if (Math.abs(v) > 1e-9) out.push(textAt(ay - 5, Y(v) + 4, fmt(v), '#666', 11, 'end'));
    }
    out.push(`<g clip-path="url(#clip)">`);
    const labels = [];
    // Labels near the right edge end at their point instead of starting there, so they stay in view.
    const near = (x, y, text, color, size = 13, dx = 6, dy = -8) => {
      const right = x > box.x + box.w * 0.68;
      labels.push(textAt(x + (right ? -dx : dx), y + dy, text, color, size, right ? 'end' : 'start'));
    };
    // Curves get their labels at different places along them, so crossing curves don't stack labels.
    const SPOTS = [0.72, 0.28, 0.88, 0.12, 0.6, 0.4];
    let curveCount = 0;
    for (const it of g.items) {
      if (it.three) continue;
      if (it.kind === 'fn') {
        const pts = [];
        for (let i = 0; i <= 480; i++) { const x = g.x[0] + ((g.x[1] - g.x[0]) * i) / 480; pts.push([X(x), Y(it.f(x))]); }
        out.push(`<path d="${pathFrom(pts, box)}" ${strokeAttrs(it)}/>`);
        if (it.label) {
          const at = pts.filter((p) => Number.isFinite(p[1]) && p[1] > box.y + 14 && p[1] < box.y + box.h - 6);
          const p = at[Math.floor(at.length * SPOTS[curveCount++ % SPOTS.length])] || at[at.length - 1];
          if (p) near(p[0], p[1], it.label, it.color, 13, 6, -9);
        }
      } else if (it.kind === 'vline') {
        out.push(`<line x1="${n(X(it.at))}" y1="${box.y}" x2="${n(X(it.at))}" y2="${box.y + box.h}" ${strokeAttrs(it)}/>`);
        if (it.label) labels.push(textAt(X(it.at) + 5, box.y + 16, it.label, it.color, 13));
      } else if (it.kind === 'param') {
        const pts = [];
        for (let i = 0; i <= 480; i++) { const t = it.t[0] + ((it.t[1] - it.t[0]) * i) / 480; pts.push([X(it.fx(t)), Y(it.fy(t))]); }
        out.push(`<path d="${pathFrom(pts, box)}" ${strokeAttrs(it)}/>`);
        if (it.label) { const p = pts[Math.floor(480 * [0.125, 0.375, 0.625, 0.875][curveCount++ % 4])]; near(p[0], p[1], it.label, it.color, 13, 5, -6); }
      } else if (it.kind === 'level') {
        for (const k of it.ks) {
          const segs = contour(it.f, g.x, g.y, k);
          if (!segs.length) continue;
          out.push(`<path d="${segs.map((s) => `M${n(X(s[0][0]))} ${n(Y(s[0][1]))}L${n(X(s[1][0]))} ${n(Y(s[1][1]))}`).join('')}" ${strokeAttrs(it)}/>`);
          if (it.quiet) continue;
          const top = segs.reduce((best, s) => (s[0][1] > best[0][1] ? s : best), segs[0]);
          labels.push(textAt(X(top[0][0]) + 3, Y(top[0][1]) - 4, (it.label ? it.label + ' ' : 'k = ') + fmt(k), it.color, 11));
        }
      } else if (it.kind === 'slope' || it.kind === 'field') {
        const len = Math.min(box.w, box.h) / it.n * 0.36;
        for (let i = 0; i < it.n; i++) {
          for (let j = 0; j < it.n; j++) {
            const x = g.x[0] + ((i + 0.5) * (g.x[1] - g.x[0])) / it.n;
            const y = g.y[0] + ((j + 0.5) * (g.y[1] - g.y[0])) / it.n;
            // Direction on screen: slope fields use (1, f); fields use (P, Q), scaled for the axes.
            const ux = it.kind === 'slope' ? 1 : it.p(x, y);
            const uy = it.kind === 'slope' ? it.f(x, y) : it.q(x, y);
            let sxv = (ux * box.w) / (g.x[1] - g.x[0]);
            let syv = (-uy * box.h) / (g.y[1] - g.y[0]);
            const m = Math.hypot(sxv, syv);
            if (!Number.isFinite(m) || m === 0) continue;
            sxv = (sxv / m) * len; syv = (syv / m) * len;
            const cx = X(x), cy = Y(y);
            if (it.kind === 'slope') out.push(`<line x1="${n(cx - sxv)}" y1="${n(cy - syv)}" x2="${n(cx + sxv)}" y2="${n(cy + syv)}" ${strokeAttrs(it)}/>`);
            else out.push(`<line x1="${n(cx - sxv)}" y1="${n(cy - syv)}" x2="${n(cx + sxv)}" y2="${n(cy + syv)}" ${strokeAttrs(it)}/>` + arrowHead(cx - sxv, cy - syv, cx + sxv, cy + syv, it.color, 6));
          }
        }
      } else if (it.kind === 'polygon') {
        const d = it.pts.map((p, i) => `${i ? 'L' : 'M'}${n(X(p[0]))} ${n(Y(p[1]))}`).join('') + 'Z';
        out.push(`<path d="${d}" ${strokeAttrs(it)}${it.fill ? ` fill="${it.fill}" fill-opacity="0.18"` : ''}/>`.replace('fill="none" ', it.fill ? '' : 'fill="none" '));
        if (it.label) {
          const cx = it.pts.reduce((s, p) => s + p[0], 0) / it.pts.length;
          const cy = it.pts.reduce((s, p) => s + p[1], 0) / it.pts.length;
          labels.push(textAt(X(cx), Y(cy) + 5, it.label, it.color, 13, 'middle'));
        }
      } else if (it.kind === 'vector' || it.kind === 'segment') {
        const [x1, y1, x2, y2] = [X(it.from[0]), Y(it.from[1]), X(it.to[0]), Y(it.to[1])];
        out.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${strokeAttrs(it)}/>`);
        if (it.kind === 'vector') out.push(arrowHead(x1, y1, x2, y2, it.color, 11));
        if (it.label) {
          const right = x2 > box.x + box.w * 0.68 || (x2 < x1 && x2 > box.x + box.w * 0.25);
          labels.push(textAt(x2 + (right ? -6 : 6), y2 + (y2 <= y1 ? -6 : 16), it.label, it.color, 14, right ? 'end' : 'start'));
        }
      } else if (it.kind === 'point') {
        out.push(`<circle cx="${n(X(it.at[0]))}" cy="${n(Y(it.at[1]))}" r="4.2" fill="${it.color}"/>`);
        if (it.label) near(X(it.at[0]), Y(it.at[1]), it.label, it.color, 13, 7, -7);
      } else if (it.kind === 'text') {
        labels.push(textAt(X(it.at[0]), Y(it.at[1]), it.label, it.color, 14, 'middle'));
      }
    }
    out.push('</g>', ...labels);
    return out.join('');
  }

  // 3D: x comes toward you (down-left), y goes right, z goes up.
  function projector(g, box) {
    const norm = (v, r) => ((v - r[0]) / (r[1] - r[0])) * 2 - 1;
    const s = Math.min(box.w / 2.6, box.h / 2.4);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2 + s * 0.08;
    return (x, y, z) => {
      const a = norm(x, g.x), b = norm(y, g.y), c = norm(z, g.z);
      return [cx + s * (-0.5 * a + 0.95 * b), cy + s * (0.4 * a + 0.1 * b - 0.88 * c)];
    };
  }

  function graph3D(g, box) {
    const P = projector(g, box);
    const out = [];
    const labels = [];
    const inZ = (z) => z >= g.z[0] - 1e-9 && z <= g.z[1] + 1e-9;
    const o = [g.x[0] <= 0 && g.x[1] >= 0 ? 0 : g.x[0], g.y[0] <= 0 && g.y[1] >= 0 ? 0 : g.y[0], g.z[0] <= 0 && g.z[1] >= 0 ? 0 : g.z[0]];
    const axis = (to, name) => {
      const [x1, y1] = P(...o);
      const [x2, y2] = P(...to);
      out.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#444" stroke-width="1.4"/>` + arrowHead(x1, y1, x2, y2, '#444', 8));
      labels.push(textAt(x2 + (x2 < x1 ? -6 : 6), y2 + (y2 > y1 ? 14 : -4), name, '#333', 15, x2 < x1 ? 'end' : 'start'));
    };
    if (g.grid) {
      out.push('<g stroke="#e0e3e8" stroke-width="1">');
      for (let i = 0; i <= 8; i++) {
        const x = g.x[0] + ((g.x[1] - g.x[0]) * i) / 8;
        const y = g.y[0] + ((g.y[1] - g.y[0]) * i) / 8;
        const a = P(x, g.y[0], o[2]), b = P(x, g.y[1], o[2]), c = P(g.x[0], y, o[2]), d = P(g.x[1], y, o[2]);
        out.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}"/><line x1="${n(c[0])}" y1="${n(c[1])}" x2="${n(d[0])}" y2="${n(d[1])}"/>`);
      }
      out.push('</g>');
    }
    axis([g.x[1], o[1], o[2]], g.axes[0]);
    axis([o[0], g.y[1], o[2]], g.axes[1]);
    axis([o[0], o[1], g.z[1]], g.axes[2]);
    const line3 = (pts) => {
      let d = '';
      let pen = false;
      for (const p of pts) {
        if (!p || !p.every(Number.isFinite) || !inZ(p[2])) { pen = false; continue; }
        const [sx, sy] = P(...p);
        d += (pen ? 'L' : 'M') + n(sx) + ' ' + n(sy);
        pen = true;
      }
      return d;
    };
    for (const it of g.items) {
      if (it.kind === 'surface') {
        const paths = [];
        for (let i = 0; i <= it.mesh; i++) {
          const x = g.x[0] + ((g.x[1] - g.x[0]) * i) / it.mesh;
          const y = g.y[0] + ((g.y[1] - g.y[0]) * i) / it.mesh;
          const rowA = [], rowB = [];
          for (let j = 0; j <= 48; j++) {
            const u = g.y[0] + ((g.y[1] - g.y[0]) * j) / 48;
            const v = g.x[0] + ((g.x[1] - g.x[0]) * j) / 48;
            rowA.push([x, u, it.f(x, u)]);
            rowB.push([v, y, it.f(v, y)]);
          }
          paths.push(line3(rowA), line3(rowB));
        }
        out.push(`<path d="${paths.join('')}" stroke="${it.color}" stroke-opacity="0.55" stroke-width="${it.width}" fill="none"/>`);
        for (const k of it.levels || []) {
          const segs = contour(it.f, g.x, g.y, k, 70, 70);
          const lifted = segs.map((s) => line3([[s[0][0], s[0][1], k], [s[1][0], s[1][1], k]])).join('');
          out.push(`<path d="${lifted}" stroke="${it.color}" stroke-width="2.4" fill="none"/>`);
          if (it.floor) {
            const flat = segs.map((s) => line3([[s[0][0], s[0][1], g.z[0]], [s[1][0], s[1][1], g.z[0]]])).join('');
            out.push(`<path d="${flat}" stroke="${it.color}" stroke-width="1.6" stroke-dasharray="4 3" fill="none"/>`);
          }
        }
        if (it.label) labels.push(textAt(box.x + 4, box.y + 12, it.label, it.color, 14));
      } else if (it.kind === 'curve3') {
        const pts = [];
        for (let i = 0; i <= 360; i++) { const t = it.t[0] + ((it.t[1] - it.t[0]) * i) / 360; pts.push([it.fx(t), it.fy(t), it.fz(t)]); }
        out.push(`<path d="${line3(pts)}" ${strokeAttrs(it)}/>`);
        if (it.label) { const p = P(...pts[40]); labels.push(textAt(p[0] + 6, p[1] - 6, it.label, it.color, 13)); }
      } else if (it.three && it.kind === 'polygon') {
        const d = it.pts.map((p, i) => { const q = P(...p); return `${i ? 'L' : 'M'}${n(q[0])} ${n(q[1])}`; }).join('') + 'Z';
        out.push(`<path d="${d}" stroke="${it.color}" stroke-width="${it.width}" stroke-linejoin="round"${it.dash ? ` stroke-dasharray="${it.dash}"` : ''} fill="${it.fill || 'none'}" fill-opacity="0.22"/>`);
        if (it.label) {
          const c = [0, 1, 2].map((k) => it.pts.reduce((s, p) => s + p[k], 0) / it.pts.length);
          const q = P(...c);
          labels.push(textAt(q[0], q[1], it.label, it.color, 13, 'middle'));
        }
      } else if (it.three && (it.kind === 'vector' || it.kind === 'segment')) {
        const a = P(...it.from), b = P(...it.to);
        out.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" ${strokeAttrs(it)}/>`);
        if (it.kind === 'vector') out.push(arrowHead(a[0], a[1], b[0], b[1], it.color, 11));
        if (it.label) labels.push(textAt(b[0] + 6, b[1] - 6, it.label, it.color, 14));
      } else if (it.three && it.kind === 'point') {
        const a = P(...it.at);
        out.push(`<circle cx="${n(a[0])}" cy="${n(a[1])}" r="4.2" fill="${it.color}"/>`);
        if (it.label) labels.push(textAt(a[0] + 7, a[1] - 7, it.label, it.color, 13));
      } else if (it.three && it.kind === 'text') {
        const a = P(...it.at);
        labels.push(textAt(a[0], a[1], it.label, it.color, 14, 'middle'));
      }
    }
    return out.join('') + labels.join('');
  }

  // ---------- Hand-drawn items ----------

  function itemSVG(it) {
    const c = colorOf(it.c);
    const sw = Math.max(0.5, Math.min(24, Number(it.sw) || 3));
    const dash = it.dash ? ` stroke-dasharray="${n(sw * 3)} ${n(sw * 2.2)}"` : '';
    const fill = it.fill ? `fill="${colorOf(it.fill, c)}" fill-opacity="0.2"` : 'fill="none"';
    const stroke = `stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dash}`;
    switch (it.t) {
      case 'pen': {
        const pts = (it.pts || []).filter((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
        if (!pts.length) return '';
        if (pts.length === 1) return `<circle cx="${n(pts[0][0])}" cy="${n(pts[0][1])}" r="${n(sw / 2)}" fill="${c}"/>`;
        // Smooth the stroke through the midpoints of the points the pen passed.
        let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
        for (let i = 1; i < pts.length - 1; i++) d += `Q${n(pts[i][0])} ${n(pts[i][1])} ${n((pts[i][0] + pts[i + 1][0]) / 2)} ${n((pts[i][1] + pts[i + 1][1]) / 2)}`;
        const last = pts[pts.length - 1];
        return `<path d="${d}L${n(last[0])} ${n(last[1])}" ${stroke} fill="none"/>`;
      }
      case 'line': {
        let out = `<line x1="${n(it.x1)}" y1="${n(it.y1)}" x2="${n(it.x2)}" y2="${n(it.y2)}" ${stroke}/>`;
        if (it.arrow >= 1) out += arrowHead(it.x1, it.y1, it.x2, it.y2, c, 8 + sw * 2);
        if (it.arrow >= 2) out += arrowHead(it.x2, it.y2, it.x1, it.y1, c, 8 + sw * 2);
        return out;
      }
      case 'rect': return `<rect x="${n(Math.min(it.x, it.x + it.w))}" y="${n(Math.min(it.y, it.y + it.h))}" width="${n(Math.abs(it.w))}" height="${n(Math.abs(it.h))}" rx="3" ${stroke} ${fill}/>`;
      case 'ellipse': return `<ellipse cx="${n(it.cx)}" cy="${n(it.cy)}" rx="${n(Math.abs(it.rx))}" ry="${n(Math.abs(it.ry))}" ${stroke} ${fill}/>`;
      case 'text': return String(it.s || '').split('\n').map((line, i) => `<text x="${n(it.x)}" y="${n(it.y + i * (it.size || 20) * 1.25)}" font-family="${FONT}" font-size="${Math.max(8, Math.min(72, Number(it.size) || 20))}" fill="${c}">${label(line)}</text>`).join('');
      default: return '';
    }
  }

  // The area a hand-drawn item covers, for the eraser.
  function itemBounds(it) {
    if (it.t === 'pen') {
      const xs = it.pts.map((p) => p[0]), ys = it.pts.map((p) => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
    if (it.t === 'line') return [Math.min(it.x1, it.x2), Math.min(it.y1, it.y2), Math.max(it.x1, it.x2), Math.max(it.y1, it.y2)];
    if (it.t === 'rect') return [Math.min(it.x, it.x + it.w), Math.min(it.y, it.y + it.h), Math.max(it.x, it.x + it.w), Math.max(it.y, it.y + it.h)];
    if (it.t === 'ellipse') return [it.cx - Math.abs(it.rx), it.cy - Math.abs(it.ry), it.cx + Math.abs(it.rx), it.cy + Math.abs(it.ry)];
    if (it.t === 'text') { const size = it.size || 20; const lines = String(it.s).split('\n'); return [it.x, it.y - size, it.x + Math.max(...lines.map((l) => l.length)) * size * 0.55, it.y + (lines.length - 1) * size * 1.25 + size * 0.3]; }
    return [0, 0, 0, 0];
  }
  // How close (in pixels) a point is to a hand-drawn item: 0 when on it.
  function itemDistance(it, x, y) {
    const segDist = (ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay;
      const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
      return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
    };
    if (it.t === 'pen') return it.pts.reduce((best, p, i) => Math.min(best, i ? segDist(it.pts[i - 1][0], it.pts[i - 1][1], p[0], p[1]) : Math.hypot(x - p[0], y - p[1])), Infinity);
    if (it.t === 'line') return segDist(it.x1, it.y1, it.x2, it.y2);
    const [x1, y1, x2, y2] = itemBounds(it);
    const dx = Math.max(x1 - x, 0, x - x2), dy = Math.max(y1 - y, 0, y - y2);
    return Math.hypot(dx, dy);
  }

  // ---------- The whole figure ----------

  /**
   * figureSVG(fig) -> a complete <svg> document as text, sized fig.w × fig.h.
   * Everything typed into it is escaped; colors and numbers are checked.
   */
  // layer 'all' (default), 'base' (paper, picture and graph) or 'items' (what was drawn by hand,
  // on a clear background) — the drawing editor redraws only the items while you draw.
  function figureSVG(fig, layer = 'all') {
    const w = Math.max(80, Math.min(2000, Number(fig && fig.w) || 640));
    const h = Math.max(80, Math.min(2000, Number(fig && fig.h) || 400));
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`];
    if (layer === 'items') {
      for (const it of fig.items || []) out.push(itemSVG(it));
      return out.join('') + '</svg>';
    }
    out.push(`<defs><clipPath id="clip"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs>`);
    out.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
    if (fig.photo && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(fig.photo)) {
      out.push(`<image href="${fig.photo}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`);
    } else if (fig.bg === 'grid' || fig.bg === 'dots') {
      out.push(`<defs><pattern id="bg" width="20" height="20" patternUnits="userSpaceOnUse">${fig.bg === 'grid' ? '<path d="M20 0H0V20" fill="none" stroke="#e4e7ec" stroke-width="1"/>' : '<circle cx="10" cy="10" r="1.2" fill="#c9cdd4"/>'}</pattern></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`);
    }
    if (fig.graph && String(fig.graph).trim()) {
      const g = parseGraph(fig.graph);
      const box = { x: 46, y: 26, w: w - 82, h: h - 62 };
      out.push(g.three ? graph3D(g, box) : graph2D(g, box));
    }
    if (layer !== 'base') for (const it of fig.items || []) out.push(itemSVG(it));
    out.push('</svg>');
    return out.join('');
  }
  const figureDataURL = (fig, layer) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(figureSVG(fig, layer));

  // A stored figure has only these fields, with sane values.
  function cleanFigure(fig) {
    if (!fig || typeof fig !== 'object') return null;
    const out = { w: Math.max(80, Math.min(2000, Number(fig.w) || 640)), h: Math.max(80, Math.min(2000, Number(fig.h) || 400)), bg: ['grid', 'dots', 'plain'].includes(fig.bg) ? fig.bg : 'plain', graph: String(fig.graph || '').slice(0, 20000), items: [] };
    if (typeof fig.photo === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,/.test(fig.photo)) out.photo = fig.photo;
    if (Array.isArray(fig.items)) out.items = fig.items.filter((it) => it && ['pen', 'line', 'rect', 'ellipse', 'text'].includes(it.t)).slice(0, 4000);
    return out;
  }

  return { FIGURE_LINE, FIGURE_COLORS: COLORS, FIGURE_PALETTE: PALETTE, GRAPH_HELP, newFigure, compileExpr, parseGraph, contour, figureSVG, figureDataURL, cleanFigure, itemBounds, itemDistance };
});
