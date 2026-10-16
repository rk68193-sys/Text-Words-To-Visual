/*
 * Editing the outline: line types (section, sub-section, label, bullet, step, task),
 * indenting one level at a time, tidying a notebook's indentation, and the section list.
 *
 * Everything works on plain lines of text, so the browser and the Node tests share it.
 */
(function (root, factory) {
  const parser = typeof module === 'object' && module.exports ? require('./parser.js') : root.VisualNotes;
  const api = factory(parser);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function (parser) {
  'use strict';

  const UNIT = 2; // spaces per level
  const PARTS = /^([ \t]*)(?:(#{1,6})\s+|([-*+•·–—]|\d{1,3}[.)])\s+)?(\[[ xX]\]\s+)?(.*)$/;
  const BOLD = /^\*\*(.+?)\*\*\s*:?$|^__(.+?)__\s*:?$/;

  const LINE_TYPES = {
    plain: 'Plain text',
    title: 'Title  #',
    section: 'Section  ##',
    subsection: 'Sub-section  ###',
    subsubsection: 'Sub-sub-section  ####',
    label: 'Label  **bold** (groups the lines below)',
    bullet: 'Bullet  -',
    numbered: 'Numbered step  1.',
    task: 'Task  [ ]',
  };
  const HEADING_TYPES = { 1: 'title', 2: 'section', 3: 'subsection', 4: 'subsubsection', 5: 'subsubsection', 6: 'subsubsection' };
  const HEADING_MARKS = { title: '#', section: '##', subsection: '###', subsubsection: '####' };

  const widthOf = (ws) => ws.replace(/\t/g, ' '.repeat(UNIT)).length;

  // { indent, heading, marker, todo, content } for one line. A tab counts as one level.
  function splitLine(line) {
    const m = PARTS.exec(line);
    return { indent: widthOf(m[1]), heading: m[2] ? m[2].length : 0, marker: m[3] || '', todo: m[4] || '', content: m[5] };
  }

  function lineType(line) {
    const p = splitLine(line);
    if (!line.trim()) return 'plain';
    if (p.heading) return HEADING_TYPES[p.heading];
    if (p.todo) return 'task';
    if (/^\d/.test(p.marker)) return 'numbered';
    if (p.marker) return 'bullet';
    return parser.isLabel(p.content.trim()) ? 'label' : 'plain';
  }

  // The words of a line without its marks: no #, bullet, number, box or bold wrapper.
  function wordsOf(line) {
    const content = splitLine(line).content.trim();
    const bold = BOLD.exec(content);
    return bold ? (bold[1] || bold[2]).trim() : content;
  }

  /**
   * setLineType(lines, index, type) -> the new text of lines[index].
   * Headings start at the left edge; everything else keeps its indentation.
   * A numbered step continues the numbering of the step above it at the same indent.
   */
  function setLineType(lines, index, type) {
    const line = lines[index];
    const p = splitLine(line);
    const words = wordsOf(line);
    const pad = ' '.repeat(p.heading ? 0 : p.indent);
    if (HEADING_MARKS[type]) return `${HEADING_MARKS[type]} ${words}`;
    if (type === 'label') return `${pad}**${words.replace(/\s*:$/, '')}**`;
    if (type === 'bullet') return `${pad}- ${words}`;
    if (type === 'task') return `${pad}- [ ] ${words}`;
    if (type === 'numbered') {
      let n = 1;
      for (let i = index - 1; i >= 0; i--) {
        if (!lines[i].trim()) continue;
        const q = splitLine(lines[i]);
        if (q.heading || q.indent < p.indent) break;
        if (q.indent === p.indent) {
          if (/^\d/.test(q.marker)) n = parseInt(q.marker, 10) + 1;
          break;
        }
      }
      return `${pad}${n}. ${words}`;
    }
    return `${pad}${words}`;
  }

  // The last line of the block that starts at `from`: its sub-points come with it.
  // A label also takes the lines at its own indent that it groups.
  function blockEnd(lines, from, to) {
    const first = splitLine(lines[from]);
    const isLabel = lineType(lines[from]) === 'label' && from === to;
    let minIndent = Infinity;
    for (let i = from; i <= to; i++) if (lines[i].trim()) minIndent = Math.min(minIndent, splitLine(lines[i]).indent);
    let end = to;
    for (let i = to + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const q = splitLine(lines[i]);
      const inside = q.indent > minIndent || (isLabel && q.indent === first.indent && !q.heading && lineType(lines[i]) !== 'label');
      if (!inside || q.heading) break;
      end = i;
    }
    return end;
  }

  /**
   * shiftLines(lines, from, to, direction) -> { lines, from, to } or null when nothing can move.
   * Moves the chosen lines (and the sub-points under them) exactly one level. A line can
   * be at most one level deeper than the line above it, so nesting never jumps.
   */
  function shiftLines(lines, from, to, direction) {
    while (from < to && !lines[from].trim()) from++;
    const end = blockEnd(lines, from, to);
    const first = splitLine(lines[from]);
    let target;
    if (direction > 0) {
      let above = -1;
      for (let i = from - 1; i >= 0; i--) if (lines[i].trim()) { above = i; break; }
      if (above < 0) return null;
      const prev = splitLine(lines[above]);
      const deepest = (prev.heading ? 0 : prev.indent) + UNIT;
      target = Math.min(deepest, Math.floor(first.indent / UNIT) * UNIT + UNIT);
    } else {
      target = Math.max(0, Math.ceil(first.indent / UNIT) * UNIT - UNIT);
    }
    const shift = target - first.indent;
    if (first.heading || (direction > 0 ? shift <= 0 : shift >= 0)) return null;
    const out = lines.slice();
    for (let i = from; i <= end; i++) {
      if (!out[i].trim()) continue;
      const q = splitLine(out[i]);
      if (q.heading) continue;
      out[i] = ' '.repeat(Math.max(0, q.indent + shift)) + out[i].replace(/^[ \t]*/, '');
    }
    return { lines: out, from, to: end };
  }

  // A picture of the tree for comparing two versions of a notebook.
  function shapeOf(node) {
    return [node.text, node.kind, node.children.map(shapeOf)];
  }

  /**
   * tidyNotes(text) -> text with even, two-space indentation and "-" bullets.
   * The tree stays exactly the same: if the neat version would change what nests
   * under what, only the spacing is evened out instead.
   */
  function tidyNotes(text) {
    const source = String(text).replace(/\r\n?/g, '\n');
    const lines = source.split('\n').map((l) => l.replace(/\s+$/, ''));
    const bullets = (l) => l.replace(/^(\s*)[*+•·–—](\s+)/, '$1-$2');
    const tree = parser.parseNotes(source);
    const hasHeadings = lines.slice(1).some((l) => /^\s*#{1,6}\s/.test(l));

    const target = new Map();
    function place(node, parent) {
      let indent = 0;
      if (parent && !node.heading) {
        if (parent.kind === 'label') indent = target.get(parent.sourceLine) || 0;
        else if (parent.depth === 0 || parent.heading) indent = 0;
        else if (parent.depth === 1 && !hasHeadings) indent = UNIT;
        else indent = (target.get(parent.sourceLine) || 0) + UNIT;
      }
      if (node.sourceLine) target.set(node.sourceLine, indent);
      node.children.forEach((child) => place(child, node));
    }
    place(tree.root, null);
    const neat = lines.map((l, i) => {
      if (!l.trim() || !target.has(i + 1)) return l.trim() ? l : '';
      return ' '.repeat(target.get(i + 1)) + bullets(l.trimStart());
    }).join('\n');
    const same = (t) => JSON.stringify(shapeOf(parser.parseNotes(t).root)) === JSON.stringify(shapeOf(tree.root));
    if (same(neat)) return neat;

    // Fallback: keep every line's place in the order of indents, just evenly spaced.
    const widths = lines.map((l) => l.trim() ? l.replace(/\t/g, '    ').length - l.replace(/\t/g, '    ').trimStart().length : 0);
    const levels = [...new Set([0, ...widths])].sort((a, b) => a - b);
    const even = lines.map((l, i) => l.trim() ? ' '.repeat(levels.indexOf(widths[i]) * UNIT) + bullets(l.trimStart()) : '').join('\n');
    return same(even) ? even : lines.join('\n');
  }

  // Headings and labels, in order, for the "Jump to" list.
  function sectionsOf(tree) {
    const out = [];
    (function visit(node, level) {
      for (const child of node.children) {
        const section = child.heading || child.kind === 'label';
        if (section && child.sourceLine) out.push({ text: child.text, sourceLine: child.sourceLine, level, label: child.kind === 'label' });
        visit(child, section ? level + 1 : level);
      }
    })(tree.root, 0);
    return out;
  }

  return { LINE_TYPES, splitLine, lineType, setLineType, shiftLines, tidyNotes, sectionsOf, INDENT_UNIT: UNIT };
});
