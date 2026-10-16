/*
 * Drawing: the mind map as SVG (on screen and for download), the same map on a
 * canvas (for PNG download), and the study cards as HTML.
 *
 * theme = { paper, sheet, ink, inkSoft, highlight, branches: [{ strong, soft }] }
 * fonts = { hand: 'font stack', body: 'font stack' }
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // layout.js is loaded first in the browser; Node gets it with require.
  const linkPath = (link) => (typeof VisualNotes !== 'undefined' ? VisualNotes : require('./layout.js')).linkPath(link);
  const mathHTML = (text) => (typeof VisualNotes !== 'undefined' && VisualNotes.mathHTML ? VisualNotes : require('./mathtext.js')).mathHTML(text);

  function esc(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Two decimals is plenty for screen and file coordinates.
  const n = (v) => Math.round(v * 100) / 100;

  function fontCss(font, fonts) {
    return `${font.weight || 400} ${font.size}px ${fonts[font.family]}`;
  }

  function branchColors(box, theme) {
    return theme.branches[Math.max(0, box.branch) % theme.branches.length];
  }

  function boxStyle(box, theme) {
    const br = branchColors(box, theme);
    const node = box.node;
    if (box.depth === 0) {
      return { fill: theme.ink, stroke: theme.ink, strokeWidth: 0, text: theme.paper, detail: theme.paper, rx: Math.min(box.h / 2, 24) };
    }
    // A sub-section label reads as a tab in the branch's color, not as another idea.
    if (node.kind === 'label' && box.depth > 1) {
      return { fill: br.soft, stroke: br.strong, strokeWidth: 0, text: br.strong, detail: theme.inkSoft, rx: 4 };
    }
    const fill = node.important ? theme.highlight : box.depth === 1 ? br.soft : theme.sheet;
    const callout = node.kind === 'callout' ? node.callout : null;
    let dash = node.kind === 'question' ? [5, 4] : null;
    if (callout === 'warning') dash = [8, 3, 2, 3];
    else if (['proof', 'tip', 'note'].includes(callout)) dash = [2, 3];
    return {
      fill,
      stroke: br.strong,
      strokeWidth: box.depth === 1 ? 2.5 : callout === 'theorem' || callout === 'definition' ? 3 : 1.5,
      dash,
      text: theme.ink,
      detail: theme.inkSoft,
      rx: box.depth === 1 ? 14 : callout === 'theorem' || callout === 'definition' ? 3 : 9,
    };
  }

  function linkStyle(link, theme) {
    return { stroke: branchColors(link.to, theme).strong, width: link.to.depth === 1 ? 4.5 : 2.2 };
  }

  function badgeSpot(box) {
    return { cx: box.side > 0 ? box.x + box.w + 15 : box.x - 15, cy: box.y + box.h / 2, r: 11 };
  }

  // The lines, boxes and words of the map, as SVG markup.
  function mindMapMarkup(layout, theme, fonts, interactive) {
    const out = [];
    out.push('<g class="links" fill="none" stroke-linecap="round">');
    for (const link of layout.links) {
      const p = linkPath(link);
      const s = linkStyle(link, theme);
      out.push(`<path d="M${n(p.x1)} ${n(p.y1)}C${n(p.c1x)} ${n(p.c1y)} ${n(p.c2x)} ${n(p.c2y)} ${n(p.x2)} ${n(p.y2)}" stroke="${s.stroke}" stroke-width="${s.width}"/>`);
    }
    out.push('</g><g class="ideas">');
    for (const box of layout.boxes) {
      const s = boxStyle(box, theme);
      const attrs = [`class="idea${box.collapsible ? ' can-fold' : ''}"`, `transform="translate(${n(box.x)} ${n(box.y)})"`];
      if (interactive && box.node.sourceLine) {
        attrs.push(`data-key="${esc(box.key)}"`, 'tabindex="0"', 'role="button"', `aria-pressed="false"`,
          `aria-label="${esc(box.node.text)}. Select idea and source."`);
      }
      out.push(`<g ${attrs.join(' ')}>`);
      out.push(`<rect width="${box.w}" height="${box.h}" rx="${n(s.rx)}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${s.dash ? ` stroke-dasharray="${s.dash.join(' ')}"` : ''}/>`);
      const padX = (box.w - Math.max(...box.rows.map((r) => r.width))) / 2;
      for (const row of box.rows) {
        const f = row.font;
        const x = box.depth <= 1 ? (box.w - row.width) / 2 : padX;
        // textLength pins each line to the width it was measured at, so a saved SVG opened
        // on a computer without these fonts still keeps its words inside the boxes.
        const fit = row.width > 0 && row.text.length > 1 ? ` textLength="${n(row.width)}" lengthAdjust="spacingAndGlyphs"` : '';
        out.push(`<text x="${n(x)}" y="${n(row.baseline)}" font-family="${esc(fonts[f.family])}" font-size="${f.size}" font-weight="${f.weight || 400}"${fit} fill="${row.detail ? s.detail : s.text}">${esc(row.text)}</text>`);
      }
      if (box.hidden) {
        const b = badgeSpot(box);
        const br = branchColors(box, theme);
        out.push(`<circle cx="${b.cx - box.x}" cy="${b.cy - box.y}" r="${b.r}" fill="${br.strong}"/>`);
        out.push(`<text x="${b.cx - box.x}" y="${b.cy - box.y + 4}" text-anchor="middle" font-family="${esc(fonts.body)}" font-size="11" font-weight="700" fill="${theme.sheet}">+${box.hidden}</text>`);
      }
      out.push('</g>');
    }
    out.push('</g>');
    return out.join('');
  }

  // A complete, standalone SVG file for download.
  function mindMapSVGFile(layout, theme, fonts, padding = 40) {
    const b = layout.bounds;
    const w = Math.ceil(b.width + padding * 2);
    const h = Math.ceil(b.height + padding * 2);
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${n(b.minX - padding)} ${n(b.minY - padding)} ${w} ${h}">` +
      `<rect x="${n(b.minX - padding)}" y="${n(b.minY - padding)}" width="${w}" height="${h}" fill="${theme.paper}"/>` +
      mindMapMarkup(layout, theme, fonts, false) +
      '</svg>\n';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The same map drawn on a canvas, for PNG download. Returns the canvas.
  function mindMapCanvas(layout, theme, fonts, { padding = 40, scale = 2 } = {}) {
    const b = layout.bounds;
    const w = b.width + padding * 2;
    const h = b.height + padding * 2;
    const fit = Math.min(scale, 8192 / w, 8192 / h, Math.sqrt(32000000 / (w * h))); // browsers refuse very large canvases
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * fit);
    canvas.height = Math.ceil(h * fit);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.scale(fit, fit);
    ctx.fillStyle = theme.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(padding - b.minX, padding - b.minY);

    ctx.lineCap = 'round';
    for (const link of layout.links) {
      const p = linkPath(link);
      const s = linkStyle(link, theme);
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.bezierCurveTo(p.c1x, p.c1y, p.c2x, p.c2y, p.x2, p.y2);
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = s.width;
      ctx.stroke();
    }

    for (const box of layout.boxes) {
      const s = boxStyle(box, theme);
      roundRect(ctx, box.x, box.y, box.w, box.h, s.rx);
      ctx.fillStyle = s.fill;
      ctx.fill();
      if (s.strokeWidth) {
        ctx.setLineDash(s.dash || []);
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.strokeWidth;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const padX = (box.w - Math.max(...box.rows.map((r) => r.width))) / 2;
      for (const row of box.rows) {
        ctx.font = fontCss(row.font, fonts);
        ctx.fillStyle = row.detail ? s.detail : s.text;
        const x = box.depth <= 1 ? (box.w - row.width) / 2 : padX;
        ctx.fillText(row.text, box.x + x, box.y + row.baseline);
      }
      if (box.hidden) {
        const spot = badgeSpot(box);
        ctx.beginPath();
        ctx.arc(spot.cx, spot.cy, spot.r, 0, Math.PI * 2);
        ctx.fillStyle = branchColors(box, theme).strong;
        ctx.fill();
        ctx.font = `700 11px ${fonts.body}`;
        ctx.fillStyle = theme.sheet;
        ctx.textAlign = 'center';
        ctx.fillText(`+${box.hidden}`, spot.cx, spot.cy + 4);
        ctx.textAlign = 'start';
      }
    }
    return canvas;
  }

  const CALLOUT_ICONS = { theorem: '◆', definition: '≔', proof: '∴', warning: '⚠', tip: '✦', note: '✎' };

  function itemHTML(node) {
    const m = mathHTML;
    const classes = ['item', `is-${node.kind}`];
    if (node.kind === 'callout') classes.push(`callout-${node.callout}`);
    if (node.important) classes.push('is-important');
    if (node.done) classes.push('is-done');
    let body;
    switch (node.kind) {
      case 'definition':
        body = `<span class="term">${m(node.term)}</span> <span class="detail">${m(node.detail)}</span>`;
        break;
      case 'flow':
        body = `<span class="flow">${node.steps.map((s) => `<span class="step">${m(s)}</span>`).join('<span class="arrow" aria-label="then">→</span>')}</span>`;
        break;
      case 'question':
        body = `<span class="badge" aria-label="Question">?</span><span class="words">${m(node.text)}</span>`;
        break;
      case 'formula':
        body = `<span class="formula"><span class="lhs">${m(node.lhs)}</span> = <span class="rhs">${m(node.rhs)}</span></span>`;
        break;
      case 'example':
        body = `<span class="badge">${node.label ? m(node.label) : 'e.g.'}</span><span class="words">${m(node.text)}</span>`;
        break;
      case 'callout':
        body = `<span class="callout-tag"><span aria-hidden="true">${CALLOUT_ICONS[node.callout]}</span> ${m(node.label)}</span>` +
          (node.body ? `<span class="words">${m(node.body)}</span>` : '');
        break;
      case 'label':
        body = `<span class="label-text">${m(node.text)}</span>`;
        break;
      case 'todo':
        body = `<span class="check" role="img" aria-label="${node.done ? 'Done' : 'To do'}">${node.done ? '✓' : ''}</span><span class="words">${m(node.text)}</span>`;
        break;
      default:
        body = `<span class="words">${m(node.text)}</span>`;
    }
    const num = node.numbered ? `<span class="num">${node.numbered}.</span>` : '';
    const star = node.important ? '<span class="star" role="img" aria-label="Important">★</span>' : '';
    const kids = node.children.length ? `<ul>${node.children.map(itemHTML).join('')}</ul>` : '';
    return `<li class="${classes.join(' ')}"><div class="line">${star}${num}${body}<button class="source-link" type="button" data-source-line="${node.sourceLine}" aria-label="Edit source: ${esc(node.text)}">↗</button></div>${kids}</li>`;
  }

  // The study-card board for the Cards view.
  function cardsHTML(tree, cards) {
    const parts = [`<header class="board-head"><h2 class="board-title">${mathHTML(tree.title)}</h2></header>`];
    if (!cards.length) {
      parts.push('<p class="board-empty">Add a few lines under the first one and each branch gets its own card.</p>');
      return parts.join('');
    }
    parts.push('<div class="cards">');
    cards.forEach((card) => {
      const color = (card.branch % 6) + 1;
      const head = card.head;
      let title;
      let sub = '';
      if (!head) title = 'Key points';
      else if (head.kind === 'definition') {
        title = head.term;
        sub = `<p class="card-sub">${mathHTML(head.detail)}</p>`;
      } else if (head.kind === 'callout') {
        title = head.label;
        if (head.body) sub = `<p class="card-sub">${mathHTML(head.body)}</p>`;
      } else title = head.text;
      const star = head && head.important ? '★ ' : '';
      parts.push(`<article class="card" style="--c: var(--b${color}); --c-soft: var(--b${color}-soft)">` +
        `<h3 class="card-title"><span class="mark">${esc(star)}${mathHTML(title)}</span></h3>${sub}` +
        `<ul class="items">${card.items.map(itemHTML).join('')}</ul></article>`);
    });
    parts.push('</div>');
    return parts.join('');
  }

  return { mindMapMarkup, mindMapSVGFile, mindMapCanvas, cardsHTML, esc };
});
