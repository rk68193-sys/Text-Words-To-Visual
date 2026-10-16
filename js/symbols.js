/*
 * Hand-drawn versions of symbols that handwriting fonts usually don't have.
 * Without these, ∴ or Δ would come out in a typed-looking fallback font.
 *
 * Each symbol is drawn as pen strokes in a 100-unit box: x runs from 0 to w (how
 * much room the symbol takes), y = 0 is the line the letters sit on, and negative y
 * is up (a capital letter is about 70 tall). `d` is SVG path data.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Handwriter = Object.assign(root.Handwriter || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // A small filled-in dot, drawn as a tight circle.
  const dot = (x, y, r = 3.5) => `M${x + r} ${y} A${r} ${r} 0 1 1 ${x - r} ${y} A${r} ${r} 0 1 1 ${x + r} ${y}`;

  const SYMBOLS = {
    '→': { w: 62, d: 'M6 -28 Q30 -30 56 -28 M41 -40 L56 -28 L41 -16' },
    '←': { w: 62, d: 'M56 -28 Q32 -30 6 -28 M21 -40 L6 -28 L21 -16' },
    '↔': { w: 74, d: 'M6 -28 Q37 -30 68 -28 M19 -39 L6 -28 L19 -17 M55 -39 L68 -28 L55 -17' },
    '⇒': { w: 64, d: 'M6 -35 L50 -35 M6 -21 L50 -21 M40 -47 L58 -28 L40 -9' },
    '↑': { w: 40, d: 'M20 -2 Q19 -32 20 -64 M8 -50 L20 -64 L32 -50' },
    '↓': { w: 40, d: 'M20 -64 Q21 -32 20 -2 M8 -16 L20 -2 L32 -16' },
    '∴': { w: 50, d: `${dot(25, -48)} ${dot(10, -6)} ${dot(40, -6)}`, fill: true },
    '∵': { w: 50, d: `${dot(10, -48)} ${dot(40, -48)} ${dot(25, -6)}`, fill: true },
    '≈': { w: 52, d: 'M6 -36 Q16 -46 26 -36 T46 -36 M6 -21 Q16 -31 26 -21 T46 -21' },
    '≠': { w: 52, d: 'M7 -35 L45 -35 M7 -20 L45 -20 M35 -50 L17 -5' },
    '≤': { w: 50, d: 'M42 -56 L8 -38 L42 -20 M8 -6 L42 -6' },
    '≥': { w: 50, d: 'M8 -56 L42 -38 L8 -20 M8 -6 L42 -6' },
    '±': { w: 50, d: 'M25 -56 L25 -22 M9 -39 L41 -39 M9 -7 L41 -7' },
    '×': { w: 46, d: 'M10 -46 L36 -14 M36 -46 L10 -14' },
    '÷': { w: 50, d: `M8 -30 L42 -30 ${dot(25, -45, 3)} ${dot(25, -15, 3)}` },
    '∞': { w: 66, d: 'M33 -30 C23 -48 6 -44 6 -30 C6 -16 23 -12 33 -30 C43 -48 60 -44 60 -30 C60 -16 43 -12 33 -30' },
    '√': { w: 62, d: 'M3 -30 L12 -35 L23 -2 L37 -68 L61 -68' },
    '∫': { w: 36, d: 'M31 -64 C25 -73 18 -67 18 -55 L16 -8 C16 4 8 6 4 -2' },
    '°': { w: 26, d: 'M19 -58 A6 6 0 1 1 7 -58 A6 6 0 1 1 19 -58' },
    'Σ': { w: 52, d: 'M46 -62 L8 -62 L29 -31 L8 0 L46 0' },
    'Δ': { w: 56, d: 'M28 -66 L5 0 L51 0 Z' },
    'π': { w: 56, d: 'M5 -40 C15 -47 40 -44 52 -47 M19 -44 L15 0 M38 -44 L40 -5 C40 2 46 2 50 -3' },
    'θ': { w: 44, d: 'M22 -66 C5 -66 5 0 22 0 C39 0 39 -66 22 -66 Z M10 -33 L34 -33' },
    'α': { w: 52, d: 'M45 -42 C39 -20 31 2 19 0 C6 -2 6 -42 23 -43 C35 -43 41 -6 48 0' },
    'β': { w: 46, d: 'M11 18 L13 -54 C15 -70 41 -68 37 -50 C35 -39 23 -38 19 -38 C41 -38 45 -16 35 -6 C27 2 15 0 13 -6' },
    'μ': { w: 48, d: 'M11 16 L13 -42 M13 -15 C15 4 35 4 37 -15 L37 -42 M37 -14 C37 -2 41 0 45 -4' },
    'λ': { w: 46, d: 'M8 -66 C15 -67 19 -60 23 -48 L39 0 M25 -41 L8 0' },
    '✓': { w: 52, d: 'M6 -30 L19 -10 L47 -60' },
    '★': { w: 58, d: 'M29 -64 L36 -42 L57 -42 L40 -28 L47 -6 L29 -20 L11 -6 L18 -28 L1 -42 L22 -42 Z', fill: true },
    '♥': { w: 56, d: 'M28 -6 C10 -20 2 -32 6 -46 C10 -58 25 -58 28 -44 C31 -58 46 -58 50 -46 C54 -32 46 -20 28 -6 Z', fill: true },
    '•': { w: 34, d: dot(15, -24, 6.5), fill: true },
    '☐': { w: 50, d: 'M8 -52 Q24 -54 42 -52 Q44 -28 42 -4 Q24 -2 8 -4 Q6 -28 8 -52' },
    '☑': { w: 50, d: 'M8 -52 Q24 -54 42 -52 Q44 -28 42 -4 Q24 -2 8 -4 Q6 -28 8 -52 M14 -28 L22 -14 L46 -62' },
  };
  // Look-alike characters people might paste in.
  SYMBOLS['∆'] = SYMBOLS['Δ'];
  SYMBOLS['∑'] = SYMBOLS['Σ'];
  SYMBOLS['✔'] = SYMBOLS['✓'];
  SYMBOLS['☒'] = SYMBOLS['☑'];

  return { SYMBOLS };
});
