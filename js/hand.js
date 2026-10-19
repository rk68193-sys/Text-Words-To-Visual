/*
 * Draws one handwritten page on a canvas: the paper, then the writing, letter by letter,
 * with small seeded changes (tilt, size, height, spacing, ink) so it looks written by hand.
 * The same text and settings always give the same page; "New handwriting" picks a new seed.
 *
 * Adapted from the Handwritten PDF Maker (PR #1). Fonts are bundled in fonts/ so the
 * page works offline.
 */
(function (root) {
  'use strict';

  const H = root.Handwriter;

  // scale evens out the fonts' different natural sizes.
  const FONTS = {
    caveat: { label: 'Caveat (quick notes)', family: 'Caveat', scale: 1.22 },
    kalam: { label: 'Kalam (neat print)', family: 'Kalam', scale: 0.98 },
    patrick: { label: 'Patrick Hand (clear)', family: 'Patrick Hand', scale: 1.05 },
    indie: { label: 'Indie Flower (round)', family: 'Indie Flower', scale: 1.0 },
    shadows: { label: 'Shadows Into Light (tall)', family: 'Shadows Into Light', scale: 1.12 },
    homemade: { label: 'Homemade Apple (cursive)', family: 'Homemade Apple', scale: 0.82 },
    dancing: { label: 'Dancing Script (flowing cursive)', family: 'Dancing Script', scale: 1.18 },
    gloria: { label: 'Gloria Hallelujah (comic)', family: 'Gloria Hallelujah', scale: 0.86 },
    architects: { label: "Architects Daughter (drafting print)", family: 'Architects Daughter', scale: 0.9 },
    delius: { label: 'Delius (rounded and tidy)', family: 'Delius', scale: 0.94 },
    comingsoon: { label: 'Coming Soon (careful print)', family: 'Coming Soon', scale: 0.9 },
    nanum: { label: 'Nanum Pen Script (fine pen)', family: 'Nanum Pen Script', scale: 1.15 },
    covered: { label: 'Covered By Your Grace (casual)', family: 'Covered By Your Grace', scale: 1.12 },
    justhand: { label: 'Just Another Hand (tall, narrow)', family: 'Just Another Hand', scale: 1.4 },
    reenie: { label: 'Reenie Beanie (rushed)', family: 'Reenie Beanie', scale: 1.22 },
    marker: { label: 'Permanent Marker (marker caps)', family: 'Permanent Marker', scale: 0.82 },
    rocksalt: { label: 'Rock Salt (scratchy)', family: 'Rock Salt', scale: 0.66 },
    gochi: { label: 'Gochi Hand (bold felt pen)', family: 'Gochi Hand', scale: 1.0 },
    handlee: { label: 'Handlee (friendly print)', family: 'Handlee', scale: 0.98 },
    schoolbell: { label: 'Schoolbell (school print)', family: 'Schoolbell', scale: 1.04 },
    sueellen: { label: 'Sue Ellen Francisco (thin and tall)', family: 'Sue Ellen Francisco', scale: 1.28 },
    nothing: { label: 'Nothing You Could Do (loose cursive)', family: 'Nothing You Could Do', scale: 0.93 },
    mali: { label: 'Mali (round print)', family: 'Mali', scale: 0.9 },
    pangolin: { label: 'Pangolin (sketchy print)', family: 'Pangolin', scale: 0.89 },
    edu: { label: 'Edu SA Beginner (school cursive)', family: 'Edu SA Beginner', scale: 1.16 },
    belle: { label: 'La Belle Aurore (slanted cursive)', family: 'La Belle Aurore', scale: 1.09 },
    cedarville: { label: 'Cedarville Cursive (light cursive)', family: 'Cedarville Cursive', scale: 0.97 },
    amatic: { label: 'Amatic SC (skinny caps)', family: 'Amatic SC', scale: 1.3 },
    caveatbrush: { label: 'Caveat Brush (brush pen)', family: 'Caveat Brush', scale: 1.11 },
    shantell: { label: 'Shantell Sans (bouncy marker)', family: 'Shantell Sans', scale: 0.91 },
    annie: { label: 'Annie Use Your Telescope (quick scrawl)', family: 'Annie Use Your Telescope', scale: 1.02 },
    satisfy: { label: 'Satisfy (smooth script)', family: 'Satisfy', scale: 1.18 },
    sunrise: { label: 'Waiting for the Sunrise (airy print)', family: 'Waiting for the Sunrise', scale: 0.96 },
  };

  //   weight: extra stroke around each letter (thicker pens)
  //   alpha / alphaJitter: how dark the ink is, and how much that changes letter to letter
  //   grain: how much paper texture shows through (pencil, chalk)
  //   bleed: ink soaking into the paper a little (fountain pen)
  const PENS = {
    ballpoint: { label: 'Ballpoint', weight: 0.004, alpha: 0.92, alphaJitter: 0.18, grain: 0.12, bleed: 0 },
    gel: { label: 'Gel pen', weight: 0.018, alpha: 0.97, alphaJitter: 0.05, grain: 0, bleed: 0 },
    pencil: { label: 'Pencil', weight: 0.006, alpha: 0.78, alphaJitter: 0.25, grain: 0.5, bleed: 0 },
    fountain: { label: 'Fountain pen', weight: 0.012, alpha: 0.9, alphaJitter: 0.3, grain: 0, bleed: 0.9 },
    marker: { label: 'Felt tip', weight: 0.05, alpha: 0.94, alphaJitter: 0.06, grain: 0.05, bleed: 0.4 },
    chalk: { label: 'Chalk', weight: 0.02, alpha: 0.92, alphaJitter: 0.2, grain: 0.55, bleed: 0 },
  };

  const INKS = {
    blue: { label: 'Blue', color: '#1f3a93' },
    black: { label: 'Black', color: '#16161d' },
    graphite: { label: 'Graphite', color: '#4b4b4f' },
    red: { label: 'Red', color: '#b3202a' },
    green: { label: 'Green', color: '#1e6b3a' },
    purple: { label: 'Purple', color: '#5b2a86' },
    teal: { label: 'Teal', color: '#11706f' },
    navy: { label: 'Navy', color: '#14234f' },
    brown: { label: 'Brown', color: '#6b4226' },
    orange: { label: 'Orange', color: '#c4560f' },
    pink: { label: 'Pink', color: '#c2266f' },
    maroon: { label: 'Maroon', color: '#7a1631' },
    forest: { label: 'Forest', color: '#24492c' },
    white: { label: 'Chalk white', color: '#f3f1e7' },
    yellow: { label: 'Chalk yellow', color: '#f2dc7a' },
  };

  const HIGHLIGHTERS = {
    yellow: { label: 'Yellow', color: '#ffe45c' },
    green: { label: 'Green', color: '#a8f08c' },
    pink: { label: 'Pink', color: '#ffa3cf' },
    blue: { label: 'Blue', color: '#9fd8ff' },
    orange: { label: 'Orange', color: '#ffbf6b' },
    purple: { label: 'Purple', color: '#d4b5ff' },
    none: { label: 'None', color: null },
  };

  // ---------- Seeded randomness ----------

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFor(seed, page, line) {
    return mulberry32((seed * 2654435761) ^ (page * 40503) ^ (line * 2246822519));
  }

  // ---------- Paper ----------

  function drawPaper(ctx, paperId, m, rand) {
    const { pageW: W, pageH: Hh } = m;
    const line = (x1, y1, x2, y2, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    if (paperId === 'chalkboard') {
      ctx.fillStyle = '#2d4537';
      ctx.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 14; i++) {
        const x = rand() * W;
        const y = rand() * Hh;
        const r = 80 + rand() * 220;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(235, 240, 230, 0.05)');
        g.addColorStop(1, 'rgba(235, 240, 230, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.strokeStyle = '#7a5532';
      ctx.lineWidth = 22;
      ctx.strokeRect(11, 11, W - 22, Hh - 22);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(22, 22, W - 44, Hh - 44);
      return;
    }

    const colors = {
      lined: { bg: '#fdfdfb', rule: '#a9c3e3', margin: '#e8a3a3' },
      legal: { bg: '#fbf1a9', rule: '#8fb0d6', margin: '#e08b8b' },
      graph: { bg: '#fbfdfc', rule: '#c4dcd4' },
      dotted: { bg: '#fdfcf8', rule: '#b9bcc4' },
      plain: { bg: '#fffefb' },
    }[paperId] || { bg: '#fdfdfb' };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, Hh);

    if (paperId === 'graph') {
      for (let x = m.rule / 2; x < W; x += m.rule) line(x, 0, x, Hh, colors.rule, 0.8);
      for (let y = m.firstRule % m.rule; y < Hh; y += m.rule) line(0, y, W, y, colors.rule, 0.8);
      return;
    }
    if (paperId === 'dotted') {
      ctx.fillStyle = colors.rule;
      for (let y = m.firstRule % m.rule; y < Hh; y += m.rule) {
        for (let x = m.rule / 2; x < W; x += m.rule) {
          ctx.beginPath();
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }
    if (paperId === 'lined' || paperId === 'legal') {
      for (let y = m.firstRule; y <= m.lastRule + 0.5; y += m.rule) line(0, y, W, y, colors.rule, 1);
      const mx = m.left - 12;
      line(mx, 0, mx, Hh, colors.margin, 1.2);
      if (paperId === 'legal') line(mx + 4, 0, mx + 4, Hh, colors.margin, 1.2);
    }
    if (paperId === 'lined') {
      for (const fy of [0.14, 0.5, 0.86]) {
        ctx.fillStyle = '#e6e9ee';
        ctx.beginPath();
        ctx.arc(38, Hh * fy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cfd4db';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // ---------- Grain texture for pencil and chalk ----------

  let grainCanvas = null;
  function grainPattern(ctx) {
    if (!grainCanvas) {
      grainCanvas = document.createElement('canvas');
      grainCanvas.width = grainCanvas.height = 160;
      const g = grainCanvas.getContext('2d');
      const img = g.createImageData(160, 160);
      const rand = mulberry32(7);
      for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] = Math.pow(rand(), 2.2) * 255;
      g.putImageData(img, 0, 0);
    }
    return ctx.createPattern(grainCanvas, 'repeat');
  }

  // ---------- Letters ----------

  function fontCss(font, size) {
    return `${size * font.scale}px "${font.family}", cursive`;
  }

  // Raised and lowered letters (exponents, subscripts) come from mathtext.js as private-use
  // characters; they are written as smaller letters above or below the line.
  const SCRIPT_SIZE = 0.62;
  const scriptOf = (ch) => (root.VisualNotes && root.VisualNotes.handScript ? root.VisualNotes.handScript(ch) : null);

  // How much room a character takes. Shared by the layout and the drawing so they agree.
  function makeAdvance(font, measureCtx) {
    const cache = new Map();
    return function advance(ch, size) {
      const key = `${ch}|${size}`;
      let w = cache.get(key);
      if (w === undefined) {
        const sym = H.SYMBOLS[ch];
        const script = sym ? null : scriptOf(ch);
        if (script) w = advance(script.base, size * SCRIPT_SIZE) * 1.04;
        else if (sym) w = (sym.w / 100) * size * font.scale;
        else {
          measureCtx.font = fontCss(font, size);
          w = measureCtx.measureText(ch).width;
        }
        cache.set(key, w);
      }
      return w;
    };
  }

  function drawSymbol(ctx, sym, size, font, pen, fill) {
    const unit = (size * font.scale) / 100;
    ctx.save();
    ctx.scale(unit, unit);
    const path = new Path2D(sym.d);
    ctx.lineWidth = (size * (0.055 + pen.weight * 1.5)) / unit;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = fill;
    ctx.stroke(path);
    if (sym.fill) {
      ctx.fillStyle = fill;
      ctx.fill(path);
    }
    ctx.restore();
  }

  function wobblyLine(ctx, x1, x2, y, rand, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y + (rand() - 0.5) * 2);
    ctx.quadraticCurveTo((x1 + x2) / 2, y + (rand() - 0.5) * 5, x2, y + (rand() - 0.5) * 3);
    ctx.stroke();
  }

  // A quick box around a formula, drawn as four slightly wavy strokes.
  function wobblyBox(ctx, x1, y1, x2, y2, rand, width, color) {
    const j = () => (rand() - 0.5) * 3;
    wobblyLine(ctx, x1 + j(), x2 + j(), y1, rand, width, color);
    wobblyLine(ctx, x1 + j(), x2 + j(), y2, rand, width, color);
    ctx.beginPath();
    ctx.moveTo(x1 + j(), y1 + j());
    ctx.quadraticCurveTo(x1 + j(), (y1 + y2) / 2, x1 + j(), y2 + j());
    ctx.moveTo(x2 + j(), y1 + j());
    ctx.quadraticCurveTo(x2 + j(), (y1 + y2) / 2, x2 + j(), y2 + j());
    ctx.stroke();
  }

  // A highlighter swipe behind a line: a wide, translucent, slightly uneven stroke.
  function highlighter(ctx, x1, x2, y, size, rand, color) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineCap = 'butt';
    ctx.lineWidth = size * 0.78;
    ctx.beginPath();
    const mid = y - size * 0.28;
    ctx.moveTo(x1, mid + (rand() - 0.5) * 3);
    ctx.quadraticCurveTo((x1 + x2) / 2, mid + (rand() - 0.5) * 4, x2, mid + (rand() - 0.5) * 3);
    ctx.stroke();
    ctx.restore();
  }

  // An ink mark's color: a named ink ({red}) or a hex color ({#c0392b}).
  const INK_ALIASES = { gray: 'graphite', grey: 'graphite' };
  function inkColor(spec) {
    if (!spec) return null;
    const named = INKS[INK_ALIASES[spec] || spec];
    return named ? named.color : /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(spec) ? spec : null;
  }

  let inkLayer = null;

  /**
   * renderPage(canvas, page, pageIndex, s, advance)
   * s = { paper, metrics, font, pen, ink, accent, highlight, messiness (0–1), seed, scale }
   */
  function renderPage(canvas, page, pageIndex, s, advance) {
    const { metrics: m, font, pen, scale } = s;
    const mess = s.messiness;
    canvas.width = Math.round(m.pageW * scale);
    canvas.height = Math.round(m.pageH * scale);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawPaper(ctx, s.paper, m, rngFor(s.seed, pageIndex, 9999));

    // Highlighter goes on the paper, under the ink.
    if (s.highlight) {
      ctx.globalCompositeOperation = s.paper === 'chalkboard' ? 'screen' : 'multiply';
      page.lines.forEach((line, li) => {
        if (!line.highlight || !line.text.trim()) return;
        const rand = rngFor(s.seed, pageIndex, li + 5000);
        highlighter(ctx, line.x - 5, line.x + line.width + 6, line.y, line.size, rand, s.highlight);
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    // Drawings go on the paper too, a touch transparent on ruled paper so the lines show through.
    for (const line of page.lines) {
      const f = line.figure;
      const img = f && s.figureImage && s.figureImage(f.id);
      if (!img || !img.complete || !img.naturalWidth) continue;
      ctx.save();
      ctx.globalAlpha = s.paper === 'chalkboard' ? 0.92 : 0.96;
      ctx.drawImage(img, f.x, f.y, f.w, f.h);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
      ctx.restore();
    }

    // Writing goes on its own layer first, so pencil grain only eats into the ink.
    // One layer is reused for every page: a new full-page canvas each time adds up to
    // hundreds of MB on a long notebook, more than a phone browser allows.
    const ink = inkLayer || (inkLayer = document.createElement('canvas'));
    ink.width = canvas.width;
    ink.height = canvas.height;
    const ictx = ink.getContext('2d');
    ictx.setTransform(scale, 0, 0, scale, 0, 0);
    ictx.textBaseline = 'alphabetic';

    page.lines.forEach((line, li) => {
      const rand = rngFor(s.seed, pageIndex, li);
      const size = line.size;
      const slope = (rand() - 0.5) * mess * 0.02;
      const startX = line.x + (rand() - 0.5) * mess * 6;
      const lineY = line.y + (rand() - 0.5) * mess * 2;
      ictx.font = fontCss(font, size);

      const putGlyph = (glyph, x, color, fullSize = size) => {
        const script = scriptOf(glyph);
        const ch = script ? script.base : glyph;
        const glyphSize = script ? fullSize * SCRIPT_SIZE : fullSize;
        const shift = script ? (script.pos > 0 ? -0.42 : 0.2) * fullSize : 0;
        const tilt = (rand() - 0.5) * mess * 0.13;
        const lift = shift + (rand() - 0.5) * mess * glyphSize * 0.07 + slope * (x - startX);
        const grow = 1 + (rand() - 0.5) * mess * 0.12;
        ictx.save();
        if (pen.bleed) {
          ictx.shadowColor = color;
          ictx.shadowBlur = pen.bleed * scale * 0.8;
        }
        ictx.globalAlpha = pen.alpha * (1 - rand() * pen.alphaJitter);
        ictx.translate(x, lineY + lift);
        ictx.rotate(tilt);
        ictx.scale(grow, grow);
        const sym = H.SYMBOLS[ch];
        if (sym) drawSymbol(ictx, sym, glyphSize, font, pen, color);
        else {
          ictx.font = fontCss(font, glyphSize);
          ictx.fillStyle = color;
          ictx.fillText(ch, 0, 0);
          if (pen.weight > 0) {
            ictx.strokeStyle = color;
            ictx.lineJoin = 'round';
            ictx.lineWidth = glyphSize * pen.weight * 2;
            ictx.strokeText(ch, 0, 0);
          }
        }
        ictx.restore();
        return grow;
      };

      // A line in an ink of its own ({red}…{/}) writes everything in it, accents too.
      const runs = line.inks || [];
      const lineInk = inkColor(runs.length && runs[0].at === 0 ? runs[0].ink : null);
      if (line.marker) {
        let mx = line.marker.x + (startX - line.x);
        const markerColor = inkColor(line.marker.ink) || (line.marker.text === '•' ? s.ink : s.accent);
        for (const ch of line.marker.text) {
          putGlyph(ch, mx, markerColor, Math.min(size, line.size));
          mx += advance(ch, line.size);
        }
      }

      let x = startX;
      let run = -1;
      let own = null;
      [...line.text].forEach((ch, i) => {
        while (run + 1 < runs.length && runs[run + 1].at <= i) own = inkColor(runs[++run].ink);
        const adv = advance(ch, size);
        if (ch === ' ') {
          x += adv * (1 + (rand() - 0.5) * mess * 0.6);
          return;
        }
        const grow = putGlyph(ch, x, own || (i < line.accent ? s.accent : s.ink));
        x += adv * grow + (rand() - 0.5) * mess * size * 0.05;
      });

      ictx.globalAlpha = pen.alpha;
      const width = size * (0.05 + pen.weight);
      if ((line.heading === 1 || line.label) && line.text.trim()) {
        wobblyLine(ictx, startX - 2, x + 2, lineY + size * 0.2 + slope * (x - startX), rand, width, lineInk || s.accent);
      }
      if (line.boxed && line.text.trim()) {
        ictx.lineWidth = width * 0.8;
        wobblyBox(ictx, startX - size * 0.3, lineY - size * 0.95, x + size * 0.3, lineY + size * 0.3, rand, width * 0.8, lineInk || s.accent);
      }
      ictx.globalAlpha = 1;
    });

    if (pen.grain > 0) {
      ictx.setTransform(1, 0, 0, 1, 0, 0);
      ictx.globalCompositeOperation = 'destination-out';
      ictx.globalAlpha = pen.grain;
      ictx.fillStyle = grainPattern(ictx);
      ictx.fillRect(0, 0, ink.width, ink.height);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = s.paper === 'chalkboard' ? 'source-over' : 'multiply';
    ctx.drawImage(ink, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  }

  root.Handwriter = Object.assign(H, { FONTS, PENS, INKS, HIGHLIGHTERS, makeAdvance, renderPage, fontCss, inkColor });
})(typeof self !== 'undefined' ? self : this);
