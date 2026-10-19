/*
 * The Page view's layout: a notebook's text becomes lines of handwriting on paper.
 * Headings, bullets, numbered lists, tasks, definitions, formulas and highlighted ideas
 * are recognised with the same rules as the map (describe() from parser.js).
 *
 * Distances are CSS pixels (96 per inch). Letter widths come from an advance(char, size)
 * function passed in, so this runs in the browser and in the Node tests.
 */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./parser.js') : root.VisualNotes);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function (parser) {
  'use strict';

  const PAGE_SIZES = {
    letter: { label: 'Letter', w: 816, h: 1056, pt: [612, 792] },
    a4: { label: 'A4', w: 794, h: 1123, pt: [595.28, 841.89] },
  };

  // rule: distance between printed lines, or null for paper without lines.
  const PAPERS = {
    lined: { label: 'Notebook (college ruled)', rule: 27, top: 120, left: 132, right: 48, bottom: 56 },
    legal: { label: 'Yellow legal pad', rule: 34, top: 128, left: 138, right: 52, bottom: 56 },
    graph: { label: 'Graph paper', rule: 24, top: 96, left: 72, right: 72, bottom: 72 },
    dotted: { label: 'Dot grid', rule: 26, top: 96, left: 78, right: 66, bottom: 66 },
    plain: { label: 'Plain paper', rule: null, top: 88, left: 88, right: 88, bottom: 88 },
    chalkboard: { label: 'Chalkboard', rule: null, top: 92, left: 92, right: 92, bottom: 92 },
  };

  const HEADING_SCALE = { 1: 1.6, 2: 1.3, 3: 1.12 };
  // Exponents and subscripts become letters the handwriting writes small, above or below the line.
  const hand = (text) => (typeof VisualNotes !== 'undefined' && VisualNotes.mathHand ? VisualNotes : require('./mathtext.js')).mathHand(text);
  const HEADING = /^(#{1,6})\s+(.*)$/;
  const BULLET = /^([-*+•·–—]|\d{1,3}[.)])\s+(.*)$/;
  const RULE = /^[-*_=~]{3,}$/;
  const TODO = /^\[( |x|X)\]\s*/;

  function paperMetrics(paperId, pageSizeId, size) {
    const paper = PAPERS[paperId] || PAPERS.lined;
    const page = PAGE_SIZES[pageSizeId] || PAGE_SIZES.letter;
    const rule = paper.rule || Math.round(size * 1.5);
    return {
      pageW: page.w,
      pageH: page.h,
      left: paper.left,
      right: page.w - paper.right,
      firstRule: paper.top,
      lastRule: page.h - paper.bottom,
      rule,
    };
  }

  // Ink marks ({red}…{/}) become private-use characters while the lines are read and
  // wrapped: each one says which ink comes after it, takes no room, and is taken out of
  // the text again (as ink runs) once a line is placed.
  const INK_BASE = 0xf780;
  const INK_CHARS = /[\uf780-\uf8ff]/g;
  const isInkChar = (ch) => ch >= '\uf780' && ch <= '\uf8ff';

  function markInks(text) {
    const inks = [null];
    let out = '';
    let last = 0;
    parser.inkRuns(text, (index, length, ink) => {
      let n = inks.indexOf(ink);
      if (n < 0) n = inks.push(ink) - 1;
      out += text.slice(last, index) + String.fromCharCode(INK_BASE + Math.min(n, 0x17f));
      last = index + length;
    });
    return { text: out + text.slice(last), inks };
  }

  // Splits text with ink characters into the letters and where the ink changes.
  function readInks(text, ink, inks) {
    let clean = '';
    const runs = ink ? [{ at: 0, ink }] : [];
    for (const ch of text) {
      if (!isInkChar(ch)) { clean += ch; continue; }
      ink = inks[ch.charCodeAt(0) - INK_BASE] || null;
      const at = [...clean].length;
      while (runs.length && runs[runs.length - 1].at === at) runs.pop();
      if (ink || runs.length) runs.push({ at, ink });
    }
    return { text: clean, runs, ink };
  }

  function readEntries(text) {
    const aligned = String(text || '').replace(/\r\n?/g, '\n').split('\n').map(parser.readAlign);
    const marked = markInks(aligned.map((a) => a.line).join('\n'));
    const raw = marked.text.split('\n');
    const plain = raw.map((l) => l.replace(INK_CHARS, ''));
    const firstIndex = plain.findIndex((l) => l.trim());
    const hasHeadings = plain.some((l, i) => i !== firstIndex && HEADING.test(l.trim()));
    const entries = [];
    let indents = [];
    let ink = null; // the ink at the start of the line being read

    // Ink marks at the very start of a line (or of a bullet's words) set the line's ink.
    const leadingInk = (s) => {
      let i = 0;
      while (i < s.length && (isInkChar(s[i]) || (i > 0 && s[i] === ' '))) {
        if (isInkChar(s[i])) ink = marked.inks[s.charCodeAt(i) - INK_BASE] || null;
        i++;
      }
      return s.slice(i).trimStart();
    };

    raw.forEach((line, i) => {
      const start = ink;
      // The ink after the line's last mark carries on to the next line.
      for (const ch of line) if (isInkChar(ch)) ink = marked.inks[ch.charCodeAt(0) - INK_BASE] || null;
      const next = ink;
      ink = start;
      readLine(line, i);
      ink = next;
    });

    function readLine(line, i) {
      const expanded = line.replace(/\t/g, '    ');
      const indent = /^[ \uf780-\uf8ff]*/.exec(expanded)[0].replace(INK_CHARS, '').length;
      const trimmed = expanded.trim();
      if (trimmed && !trimmed.replace(INK_CHARS, '').trim()) return; // a line with only ink marks
      const body = leadingInk(trimmed).replace(/[\uf780-\uf8ff\s]+$/, '');
      if (!body || RULE.test(body)) {
        if (entries.length && !entries[entries.length - 1].blank) entries.push({ blank: true });
        return;
      }
      const h = HEADING.exec(body);
      const bullet = h ? null : BULLET.exec(body);
      let heading = 0;
      if (h) heading = Math.min(3, h[1].length);
      else if (i === firstIndex && !bullet) heading = 1;
      else if (!hasHeadings && !bullet && indent === 0) heading = 2;
      const content = leadingInk(h ? h[2] : bullet ? bullet[2] : body);
      const at = aligned[i].align ? { ink, align: aligned[i].align } : { ink };

      if (heading) {
        indents = [];
        const idea = parser.describe(content);
        entries.push({ ...at, heading, level: 0, marker: null, text: hand(idea.text || content.trim()), accent: heading > 1 ? Infinity : 0, highlight: idea.important, boxed: false });
        return;
      }

      while (indents.length && indents[indents.length - 1] > indent) indents.pop();
      if (!indents.length || indents[indents.length - 1] < indent) indents.push(indent);
      const level = Math.min(6, indents.length - 1);

      // A drawing sits on the page with its caption written under it.
      const fig = /^!\[([^\]]*)\]\(fig:([\w-]{1,64})\)\s*$/.exec(content.trim());
      if (fig) {
        entries.push({ ...at, heading: 0, level, marker: null, figure: fig[2], text: hand(fig[1].trim() || 'Drawing'), accent: Infinity, highlight: false, boxed: false });
        return;
      }

      // A label (**INTUITION**) is written in the accent ink and underlined, like a small heading.
      if (!bullet && parser.isLabel(body)) {
        const text = hand(content.replace(/\*\*|__/g, '').replace(/\s*:\s*$/, '').trim());
        entries.push({ ...at, heading: 0, label: true, level, marker: null, text, accent: Infinity, highlight: false, boxed: false });
        return;
      }

      let marker = null;
      if (bullet) marker = /^\d/.test(bullet[1]) ? bullet[1] : '•';
      const todo = TODO.exec(content);
      if (todo) marker = todo[1] === ' ' ? '☐' : '☑';

      const idea = parser.describe(content);
      let words = hand(idea.text);
      let accent = 0;
      // The lead-in (a term, "Theorem 2:", "Ex 3:") is written in the accent ink.
      const leadIn = (lead, rest) => { const l = hand(lead); words = rest ? `${l}: ${hand(rest)}` : l; accent = l.length + 1; };
      if (idea.kind === 'definition') leadIn(idea.term, idea.detail);
      else if (idea.kind === 'callout') leadIn(idea.label, idea.body);
      else if (idea.kind === 'example') {
        if (idea.label) leadIn(idea.label, idea.text);
        else { words = `e.g. ${hand(idea.text)}`; accent = 4; }
      } else if (idea.kind === 'question') {
        if (!/\?\s*$/.test(words)) words += '?';
        accent = Infinity;
      } else if (idea.kind === 'flow') {
        words = hand(idea.steps.join(' → '));
      }
      entries.push({ ...at, heading: 0, level, marker, text: words, accent, highlight: idea.important, boxed: idea.kind === 'formula' });
    }
    while (entries.length && entries[entries.length - 1].blank) entries.pop();
    return { entries, inks: marked.inks };
  }

  /**
   * notesToEntries(text) -> [{ blank } | { heading, level, marker, text, accent, highlight, boxed, ink, inks }]
   *
   * accent is how many characters at the start of text are written in the accent ink
   * (Infinity for the whole line). marker is '•', '☐', '☑', '1.' and so on, or null.
   * ink is the ink the line starts in from an ink mark (a name or hex, or null for the
   * page's ink); inks lists where it changes: [{ at, ink }].
   */
  function notesToEntries(text) {
    const { entries, inks } = readEntries(text);
    return entries.map((e) => {
      if (e.blank) return e;
      const r = readInks(e.text, e.ink, inks);
      const accent = e.accent === Infinity ? Infinity : [...e.text.slice(0, e.accent)].filter((ch) => !isInkChar(ch)).length;
      return Object.assign({}, e, { text: r.text, accent, inks: r.runs });
    });
  }

  // Splits one line into pieces that fit `width`. Long words are broken.
  function wrapLine(text, width, size, advance) {
    const measure = (s) => [...s].reduce((sum, ch) => sum + advance(ch, size), 0);
    const words = text.split(/ +/).filter((w, i, all) => w || all.length === 1);
    const space = advance(' ', size);
    const lines = [];
    let line = '';
    let lineW = 0;
    for (let word of words) {
      let w = measure(word);
      if (line && lineW + space + w <= width) {
        line += ` ${word}`;
        lineW += space + w;
        continue;
      }
      if (line) lines.push(line);
      while (w > width && word.length > 1) {
        let piece = '';
        let pieceW = 0;
        for (const ch of word) {
          const cw = advance(ch, size);
          if (piece && pieceW + cw > width) break;
          piece += ch;
          pieceW += cw;
        }
        lines.push(piece);
        word = word.slice(piece.length);
        w = measure(word);
      }
      line = word;
      lineW = w;
    }
    lines.push(line);
    return lines;
  }

  /**
   * layoutPages(text, metrics, size, advance) -> [{ lines }]
   *
   * Each line: { text, x, y (where the letters sit), width, size, heading,
   *              marker: { text, x } | null, accent, highlight, boxed }.
   * Writing sits on the printed lines of ruled paper; text too big for one line
   * takes up more than one.
   */
  // spacing: 1 writes on every ruled line, 2 on every other one (double spacing), 1.5 in between.
  function layoutPages(text, m, size, measure, figureSize = null, spacing = 1) {
    const advance = (ch, sz) => (isInkChar(ch) ? 0 : measure(ch, sz));
    const pages = [{ lines: [] }];
    let row = 0; // which ruled line we're on, counting from the top of the page
    let extra = 0; // spacing rows still owed, for 1.5 spacing
    const step = size * 1.2; // indentation per level

    const rulesFor = (lineSize) => Math.max(1, Math.ceil((lineSize * 1.1) / m.rule));
    function place(line) {
      const need = line.rows || rulesFor(line.size);
      let y = m.firstRule + (row + need - 1) * m.rule;
      if (y > m.lastRule && (row > 0 || pages[pages.length - 1].lines.length)) {
        pages.push({ lines: [] });
        row = 0;
        y = m.firstRule + (need - 1) * m.rule;
      }
      line.y = y - Math.min(m.rule * 0.2, 6);
      // A drawing fills the ruled lines it takes, from just under the line above.
      if (line.figure) line.figure.y = y - need * m.rule + 6;
      pages[pages.length - 1].lines.push(line);
      row += need;
      extra += need * (spacing - 1);
      row += Math.floor(extra + 1e-9);
      extra -= Math.floor(extra + 1e-9);
    }

    const alignShift = (align, room) => (align === 'center' ? Math.max(0, room / 2) : align === 'right' ? Math.max(0, room) : 0);
    const { entries, inks } = readEntries(text);
    // A placed line keeps its letters and the ink runs; the ink carries on to its next piece.
    let ink = null;
    function inked(line, piece) {
      const r = readInks(piece, ink, inks);
      ink = r.ink;
      line.accent = Math.min(r.text.length, [...piece.slice(0, line.accent)].filter((ch) => !isInkChar(ch)).length);
      line.text = r.text;
      if (r.runs.length) line.inks = r.runs;
      return line;
    }
    entries.forEach((entry, i) => {
      ink = entry.ink || null;
      if (entry.blank) {
        if (row > 0) row += 1;
        return;
      }
      const prev = entries[i - 1];
      if (entry.heading >= 2 && prev && !prev.blank && row > 0) row += 1;
      if (entry.figure) {
        const dims = figureSize && figureSize(entry.figure);
        const x = m.left + entry.level * step;
        if (dims) {
          let w = Math.min(m.right - x, 460);
          let h = (w * dims.h) / dims.w;
          const maxH = Math.min(360, m.lastRule - m.firstRule - m.rule * 2);
          if (h > maxH) { w = (w * maxH) / h; h = maxH; }
          const fx = x + alignShift(entry.align, m.right - x - w);
          place({ text: '', x: fx, width: 0, size, rows: Math.ceil((h + 12) / m.rule), heading: 0, marker: null, accent: 0, highlight: false, boxed: false, figure: { id: entry.figure, x: fx, w, h } });
        }
        const caption = Math.round(size * 0.85);
        wrapLine(entry.text, m.right - x, caption, advance).forEach((piece) => {
          const width = [...piece].reduce((t, ch) => t + advance(ch, caption), 0);
          place(inked({ x: x + alignShift(entry.align, m.right - x - width), width, size: caption, heading: 0, marker: null, accent: piece.length, highlight: false, boxed: false }, piece));
        });
        return;
      }
      const lineSize = entry.heading ? Math.round(size * HEADING_SCALE[entry.heading]) : size;
      const markerW = entry.marker ? Math.max(step, [...entry.marker].reduce((s, ch) => s + advance(ch, size), 0) + size * 0.45) : 0;
      const markerX = m.left + entry.level * step;
      const x = markerX + markerW;
      const pieces = wrapLine(entry.text, Math.max(size * 3, m.right - x - (entry.boxed ? size * 0.4 : 0)), lineSize, advance);
      let offset = 0;
      pieces.forEach((piece, j) => {
        const width = [...piece].reduce((s, ch) => s + advance(ch, lineSize), 0);
        const lineInk = ink;
        // Centered and right-aligned lines move over, bullet and all.
        const shift = alignShift(entry.align, m.right - x - width);
        place(inked({
          x: x + shift,
          width,
          size: lineSize,
          heading: entry.heading,
          label: !!entry.label,
          marker: j === 0 && entry.marker ? Object.assign({ text: entry.marker, x: markerX + shift }, lineInk ? { ink: lineInk } : {}) : null,
          accent: Math.max(0, Math.min(piece.length, entry.accent - offset)),
          highlight: !!entry.highlight,
          boxed: !!entry.boxed,
        }, piece));
        offset += piece.length + 1;
      });
    });
    return pages;
  }

  return { PAGE_SIZES, PAPERS, paperMetrics, notesToEntries, layoutPages, wrapLine };
});
