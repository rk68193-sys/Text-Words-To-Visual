const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes, describe } = require('../js/parser.js');
const { layoutMindMap } = require('../js/layout.js');
const { mindMapSVGFile, cardsHTML } = require('../js/render.js');
const { toCards } = require('../js/layout.js');
const NB = require('../js/notebooks.js');
const { notesToEntries, layoutPages, paperMetrics, PAPERS } = require('../js/handpage.js');

const measure = (text, font) => text.length * font.size * 0.55;
const advance = (ch, size) => size * 0.5;
const shape = (node) => (node.children.length ? [node.text, node.children.map(shape)] : node.text);
function seeded(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// ---------- Parser fixes ----------

test('simple equations become formulas, not definitions', () => {
  for (const [line, lhs, rhs] of [['F = ma', 'F', 'ma'], ['E=mc^2', 'E', 'mc^2'], ['x = 5', 'x', '5'], ['Speed = distance / time', 'Speed', 'distance / time'], ['KE = ½mv²', 'KE', '½mv²']]) {
    const idea = describe(line);
    assert.equal(idea.kind, 'formula', line);
    assert.equal(idea.lhs, lhs);
    assert.equal(idea.rhs, rhs);
  }
});

test('word definitions written with = stay definitions', () => {
  for (const line of ['ATP = energy currency', 'Mitosis = cell division']) assert.equal(describe(line).kind, 'definition', line);
  for (const line of ['a => b', 'x == y', 'see https://example.com?a=b', 'Light -> ATP']) assert.notEqual(describe(line).kind, 'formula', line);
});

test('a term called Key keeps its name; marker phrases still highlight', () => {
  const key = describe('Key: a tool that opens locks');
  assert.equal(key.kind, 'definition');
  assert.equal(key.term, 'Key');
  assert.equal(key.important, false);
  for (const line of ['! Follow the evidence', 'Important: wash hands', 'Remember - check units', 'Key point: ATP is energy']) {
    assert.equal(describe(line).important, true, line);
  }
  assert.equal(describe('Key point: ATP is energy').text, 'ATP is energy');
});

test('a deeper heading after a bullet stays under its section heading', () => {
  const tree = parseNotes('# Cells\n## Organelles\n- Nucleus\n#### Plant only\n- Chloroplast\n## Membranes\n- Bilayer\n  - lipids\n### Transport\n- Diffusion');
  assert.deepEqual(shape(tree.root), ['Cells', [
    ['Organelles', ['Nucleus', ['Plant only', ['Chloroplast']]]],
    ['Membranes', [['Bilayer', ['lipids']], ['Transport', ['Diffusion']]]],
  ]]);
});

// ---------- Practice ----------

test('formulas make fill-in cards and unanswered questions are listed with their source', () => {
  const tree = parseNotes('Physics\n## Motion\n- F = ma\n- Why does a ball slow down?\n- What is inertia?\n  - Resistance to change in motion');
  const deck = NB.studyCards(tree);
  const formula = deck.cards.find((c) => c.kind === 'Formula');
  assert.equal(formula.prompt, 'Complete the formula: F = ?');
  assert.equal(formula.answer, 'ma');
  assert.equal(formula.sourceLine, 3);
  assert.equal(deck.unanswered, 1);
  assert.deepEqual(deck.unansweredList, [{ text: 'Why does a ball slow down?', branch: 'Motion', sourceLine: 4 }]);
});

test('missed cards are remembered once, so they can be practised on their own', () => {
  const cards = [{ id: 'a' }, { id: 'b' }];
  let s = NB.startPractice(cards);
  for (const rating of ['again', 'known', 'again', 'known']) {
    s = Object.assign({}, s, { revealed: true });
    s = NB.ratePractice(s, rating);
  }
  assert.deepEqual(s.missed.map((c) => c.id), ['a']);
  assert.equal(s.queue.length, 0);
  assert.equal(NB.startPractice(s.missed).queue.length, 1);
});

test('shuffled practice keeps every card and is repeatable with the same random source', () => {
  const cards = Array.from({ length: 12 }, (_, i) => ({ id: String(i) }));
  const a = NB.startPractice(cards, { shuffle: seeded(7) }).queue.map((c) => c.id);
  const b = NB.startPractice(cards, { shuffle: seeded(7) }).queue.map((c) => c.id);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), cards.map((c) => c.id).sort());
  assert.notDeepEqual(a, cards.map((c) => c.id));
});

test('Anki export escapes HTML, tabs and new lines', () => {
  const tsv = NB.cardsTSV([{ prompt: 'What is <b>?', answer: 'line one\nline\ttwo & more', branch: 'Tags & things' }], 'My Biology notes!');
  const rows = tsv.trim().split('\n');
  assert.equal(rows[0], '#separator:tab');
  const fields = rows[3].split('\t');
  assert.equal(fields.length, 3);
  assert.equal(fields[0], '<small>Tags &amp; things</small><br>What is &lt;b&gt;?');
  assert.equal(fields[1], 'line one<br>line two &amp; more');
  assert.equal(fields[2], 'My_Biology_notes');
});

// ---------- Notebook desk ----------

test('deleting a notebook can be undone into the same place', () => {
  const lib = { version: 1, activeId: 'b', documents: [NB.notebook('A', 'a'), NB.notebook('B', 'b'), NB.notebook('C', 'c')] };
  const removed = NB.removeNotebook(lib, 'b');
  assert.deepEqual(removed.library.documents.map((d) => d.id), ['a', 'c']);
  assert.equal(removed.library.activeId, 'c');
  assert.ok(NB.validLibrary(removed.library));
  const back = NB.restoreNotebook(removed.library, removed.removed, removed.index);
  assert.deepEqual(back.documents.map((d) => d.id), ['a', 'b', 'c']);
  assert.equal(back.activeId, 'b');
});

test('deleting the last notebook leaves a blank one, which undo replaces', () => {
  const lib = { version: 1, activeId: 'only', documents: [NB.notebook('Mine', 'only')] };
  const removed = NB.removeNotebook(lib, 'only');
  assert.equal(removed.library.documents.length, 1);
  assert.equal(removed.library.documents[0].text, '');
  assert.ok(NB.validLibrary(removed.library));
  const back = NB.restoreNotebook(removed.library, removed.removed, removed.index);
  assert.deepEqual(back.documents.map((d) => d.id), ['only']);
});

test('duplicate sits next to the original and search matches every word', () => {
  const lib = { version: 1, activeId: 'a', documents: [NB.notebook('Cells\n- ATP', 'a'), NB.notebook('Revolution\n- 1776', 'b')] };
  const dup = NB.duplicateNotebook(lib, 'a');
  assert.equal(dup.documents.length, 3);
  assert.equal(dup.documents[1].text, 'Cells\n- ATP');
  assert.equal(dup.activeId, dup.documents[1].id);
  assert.deepEqual(NB.searchNotebooks(lib, 'atp cells').map((d) => d.id), ['a']);
  assert.deepEqual(NB.searchNotebooks(lib, '  ').map((d) => d.id), ['a', 'b']);
  assert.deepEqual(NB.searchNotebooks(lib, 'nothing'), []);
});

// ---------- Map ----------

test('map text size scales boxes without overlaps', () => {
  const tree = parseNotes('Topic\nOne\n  - a fairly long idea that wraps a bit\nTwo\n  - b');
  const small = layoutMindMap(tree, measure, { textScale: 1 });
  const big = layoutMindMap(tree, measure, { textScale: 1.5 });
  assert.ok(big.root.w > small.root.w * 1.3);
  for (const a of big.boxes) for (const b of big.boxes) {
    if (a !== b) assert.ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h), `${a.key} overlaps ${b.key}`);
  }
});

test('saved SVG pins each line to its measured width, so missing fonts cannot spill text', () => {
  const tree = parseNotes('Topic\nBranch\n  - Chlorophyll: green pigment that absorbs red and blue light');
  const svg = mindMapSVGFile(layoutMindMap(tree, measure, {}), { paper: '#fff', sheet: '#fff', ink: '#000', inkSoft: '#333', highlight: '#ff0', branches: [{ strong: '#a00', soft: '#fee' }] }, { hand: 'Georgia', body: 'Arial' });
  const texts = svg.match(/<text [^>]*>/g).filter((t) => !/text-anchor/.test(t));
  assert.ok(texts.length > 3);
  for (const t of texts) assert.match(t, /textLength="[\d.]+" lengthAdjust="spacingAndGlyphs"/);
});

test('reading cards show formulas as formulas', () => {
  const tree = parseNotes('Physics\nMotion\n  - F = ma');
  assert.match(cardsHTML(tree, toCards(tree)), /<span class="formula"><span class="lhs">F<\/span> = <span class="rhs">ma<\/span><\/span>/);
});

// ---------- Handwritten pages ----------

test('notes become handwriting entries: title, branches, bullets, tasks, terms, highlights, formulas', () => {
  const entries = notesToEntries('Photosynthesis\nLight reactions\n  - ATP: energy currency\n  - [x] Read chapter\n  2. second step\n  - ! Happens in chloroplasts\n  - F = ma\n  - Does it need light\nCalvin cycle');
  const plain = entries.map((e) => [e.heading, e.level, e.marker, e.text]);
  assert.deepEqual(plain, [
    [1, 0, null, 'Photosynthesis'],
    [2, 0, null, 'Light reactions'],
    [0, 0, '•', 'ATP: energy currency'],
    [0, 0, '☑', 'Read chapter'],
    [0, 0, '2.', 'second step'],
    [0, 0, '•', 'Happens in chloroplasts'],
    [0, 0, '•', 'F = ma'],
    [0, 0, '•', 'Does it need light'],
    [2, 0, null, 'Calvin cycle'],
  ]);
  assert.equal(entries[2].accent, 'ATP:'.length);
  assert.equal(entries[5].highlight, true);
  assert.equal(entries[6].boxed, true);
  assert.equal(entries[1].accent, Infinity);
});

test('with Markdown headings, plain lines are not promoted and nesting follows indentation', () => {
  const entries = notesToEntries('# Cells\n\n\n## Parts\nPlain line\n- a\n    - b\n        - c\n- d');
  assert.deepEqual(entries.map((e) => e.blank ? 'blank' : [e.heading, e.level, e.text]), [
    [1, 0, 'Cells'], 'blank', [2, 0, 'Parts'], [0, 0, 'Plain line'], [0, 0, 'a'], [0, 1, 'b'], [0, 2, 'c'], [0, 0, 'd'],
  ]);
});

test('handwritten lines stay inside the margins and flow onto new pages', () => {
  for (const paper of Object.keys(PAPERS)) {
    const m = paperMetrics(paper, 'a4', 22);
    const text = 'Topic\n' + Array.from({ length: 80 }, (_, i) => `- idea ${i} ` + 'word '.repeat(i % 9)).join('\n');
    const pages = layoutPages(text, m, 22, advance);
    assert.ok(pages.length > 1, paper);
    for (const page of pages) {
      for (const line of page.lines) {
        assert.ok(line.x + line.width <= m.right + 0.001, `${paper}: ${line.text}`);
        assert.ok(line.y <= m.lastRule, `${paper}: below the last line`);
      }
    }
  }
});

test('accent ink follows a term across a wrapped line', () => {
  const m = paperMetrics('plain', 'letter', 22);
  const term = 'Supercalifragilistic expialidocious terminology';
  const [page] = layoutPages(`T\n- ${term}: meaning`, m, 22, (ch, size) => size * 1.3);
  const pieces = page.lines.slice(1);
  assert.ok(pieces.length > 1);
  const accented = pieces.map((l) => l.text.slice(0, l.accent)).join(' ');
  assert.equal(accented, `${term}:`);
  assert.equal(pieces[0].marker.text, '•');
  assert.equal(pieces[1].marker, null);
});
