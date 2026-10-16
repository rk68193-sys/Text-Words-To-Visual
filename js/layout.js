/*
 * Positions for the two views, worked out from the tree that parseNotes returns.
 * Nothing here touches the page: text widths come from a measure() function passed in,
 * so the same code runs in the browser and in the Node tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // How each level of the map is drawn. family is 'hand' or 'body'; the page maps
  // these to real font stacks.
  const LEVELS = [
    { family: 'hand', size: 30, maxW: 300, padX: 24, padY: 12, gapAfter: 52 },
    { family: 'hand', size: 23, maxW: 230, padX: 16, padY: 8, gapAfter: 36, siblingGap: 22 },
    { family: 'body', size: 15, maxW: 240, padX: 12, padY: 7, gapAfter: 28, siblingGap: 10 },
  ];
  const DETAIL = { family: 'body', size: 13.5 };
  const LINE_HEIGHT = 1.3;
  const BADGE_ROOM = 30; // space for the "+3" badge on a folded branch

  // scale is the reader's text-size choice; boxes, gaps and wrapping grow with it.
  function levelFor(depth, scale = 1) {
    const level = LEVELS[Math.min(depth, LEVELS.length - 1)];
    if (scale === 1) return level;
    const out = {};
    for (const [k, v] of Object.entries(level)) out[k] = typeof v === 'number' ? Math.round(v * scale * 10) / 10 : v;
    return out;
  }

  // Greedy word wrap. Words longer than the line are broken by character.
  function wrap(text, font, maxW, measure) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (let word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, font) <= maxW) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      while (measure(word, font) > maxW && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && measure(word.slice(0, cut), font) > maxW) cut--;
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      line = word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function labelFor(node) {
    let prefix = '';
    if (node.kind === 'todo') prefix = node.done ? '☑ ' : '☐ ';
    else if (node.kind === 'example') prefix = 'e.g. ';
    if (node.important) prefix = `★ ${prefix}`;
    if (node.kind === 'flow') return prefix + node.steps.join(' → ');
    if (node.kind === 'question' && !/\?\s*$/.test(node.text)) return `${prefix}${node.text}?`;
    if (node.kind === 'definition') return prefix + node.term;
    return prefix + node.text;
  }

  // Lines of text inside one box, with their fonts and baselines.
  function measureBox(node, depth, measure, scale = 1) {
    const level = levelFor(depth, scale);
    const head = { family: level.family, size: level.size, weight: depth >= 2 && node.kind === 'definition' ? 700 : 400 };
    const rows = wrap(labelFor(node), head, level.maxW, measure).map((text) => ({ text, font: head }));
    if (node.kind === 'definition') {
      const detailFont = depth >= 2 ? { family: 'body', size: level.size - 1, weight: 400 } : { family: DETAIL.family, size: Math.round(DETAIL.size * scale * 10) / 10, weight: 400 };
      for (const text of wrap(node.detail, detailFont, level.maxW, measure)) rows.push({ text, font: detailFont, detail: true });
    }
    let y = level.padY;
    let width = 0;
    for (const row of rows) {
      const lh = row.font.size * LINE_HEIGHT;
      row.width = measure(row.text, row.font);
      row.baseline = y + lh / 2 + row.font.size * 0.34;
      y += lh;
      width = Math.max(width, row.width);
    }
    return { rows, w: Math.ceil(width + level.padX * 2), h: Math.ceil(y + level.padY) };
  }

  function countDescendants(node) {
    return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
  }

  /**
   * layoutMindMap(tree, measure, { collapsed: Set<key>, oneSide: bool })
   *   -> { boxes, links, bounds }
   *
   * The main topic sits at (0, 0). Branches grow to the right, and to the left as well
   * unless oneSide is set. Each box is centered on the ideas that hang off it.
   */
  function layoutMindMap(tree, measure, options) {
    const opts = Object.assign({ collapsed: new Set(), oneSide: false, textScale: 1 }, options);
    const scale = Math.min(2, Math.max(0.6, Number(opts.textScale) || 1));
    const boxes = [];
    const links = [];

    function build(node, depth, branch) {
      const box = Object.assign(measureBox(node, depth, measure, scale), {
        node, key: node.key, depth, branch, x: 0, y: 0, side: 1, children: [],
        hidden: 0,
      });
      const collapsed = depth > 0 && opts.collapsed.has(node.key);
      if (collapsed) box.hidden = countDescendants(node);
      else box.children = node.children.map((c, i) => build(c, depth + 1, depth === 0 ? i : branch));
      box.collapsible = node.children.length > 0 && depth > 0;
      boxes.push(box);
      return box;
    }

    function gapBetween(children) {
      return children.length ? levelFor(children[0].depth, scale).siblingGap : 0;
    }

    function measureSpan(box) {
      const kids = box.children.map(measureSpan);
      const kidsSpan = kids.reduce((a, b) => a + b, 0) + gapBetween(box.children) * Math.max(0, kids.length - 1);
      box.kidsSpan = kidsSpan;
      box.span = Math.max(box.h, kidsSpan);
      return box.span;
    }

    function place(box, edge, top, side) {
      box.side = side;
      box.y = top + (box.span - box.h) / 2;
      box.x = side > 0 ? edge : edge - box.w;
      const gap = gapBetween(box.children);
      const reach = levelFor(box.depth, scale).gapAfter;
      let t = box.y + box.h / 2 - box.kidsSpan / 2;
      for (const child of box.children) {
        place(child, side > 0 ? box.x + box.w + reach : box.x - reach, t, side);
        links.push({ from: box, to: child, side });
        t += child.span + gap;
      }
    }

    const rootBox = build(tree.root, 0, -1);
    measureSpan(rootBox);
    rootBox.x = -rootBox.w / 2;
    rootBox.y = -rootBox.h / 2;

    // Split the branches so both sides end up about the same height.
    const total = rootBox.children.reduce((a, c) => a + c.span, 0);
    const right = [];
    const left = [];
    let acc = 0;
    for (const child of rootBox.children) {
      if (opts.oneSide || acc + child.span / 2 <= total / 2 || !right.length) right.push(child);
      else left.push(child);
      acc += child.span;
    }

    const reach = levelFor(0, scale).gapAfter;
    for (const [group, side] of [[right, 1], [left, -1]]) {
      const gap = gapBetween(group);
      const height = group.reduce((a, c) => a + c.span, 0) + gap * Math.max(0, group.length - 1);
      let t = -height / 2;
      for (const child of group) {
        place(child, side > 0 ? rootBox.x + rootBox.w + reach : rootBox.x - reach, t, side);
        links.push({ from: rootBox, to: child, side });
        t += child.span + gap;
      }
    }

    // Draw order: main topic last so it sits on top of the branch lines.
    boxes.sort((a, b) => b.depth - a.depth);

    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const b of boxes) {
      const badge = b.hidden ? BADGE_ROOM : 0;
      bounds.minX = Math.min(bounds.minX, b.x - (b.side < 0 ? badge : 0));
      bounds.minY = Math.min(bounds.minY, b.y);
      bounds.maxX = Math.max(bounds.maxX, b.x + b.w + (b.side > 0 ? badge : 0));
      bounds.maxY = Math.max(bounds.maxY, b.y + b.h);
    }
    bounds.width = bounds.maxX - bounds.minX;
    bounds.height = bounds.maxY - bounds.minY;

    return { boxes, links, bounds, root: rootBox };
  }

  // The path for a branch line between two boxes: a smooth S-curve.
  function linkPath(link) {
    const { from, to, side } = link;
    const x1 = side > 0 ? from.x + from.w : from.x;
    const y1 = from.y + from.h / 2;
    const x2 = side > 0 ? to.x : to.x + to.w;
    const y2 = to.y + to.h / 2;
    const mx = (x1 + x2) / 2;
    return { x1, y1, x2, y2, c1x: mx, c1y: y1, c2x: mx, c2y: y2 };
  }

  /**
   * toCards(tree) -> [{ head, branch, items }]
   * One card per branch. Branches with nothing under them are gathered on one
   * "Key points" card so the board doesn't fill up with empty cards.
   */
  function toCards(tree) {
    const cards = [];
    let loose = null;
    tree.root.children.forEach((child, i) => {
      if (child.children.length) {
        cards.push({ head: child, branch: i, items: child.children });
        return;
      }
      if (!loose) {
        loose = { head: null, branch: i, items: [] };
        cards.push(loose);
      }
      loose.items.push(child);
    });
    return cards;
  }

  return { layoutMindMap, linkPath, toCards, wrap, LEVELS };
});
