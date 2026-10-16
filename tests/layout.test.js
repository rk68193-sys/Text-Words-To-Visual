const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes } = require('../js/parser.js');
const { layoutMindMap, toCards, wrap, linkPath } = require('../js/layout.js');
const { mindMapSVGFile, cardsHTML } = require('../js/render.js');

// Pretend every character is 0.55 of the font size wide.
const measure = (text, font) => text.length * font.size * 0.55;

const NOTES = `Photosynthesis
Light reactions
  - thylakoid membrane
  - Light -> electrons -> ATP + NADPH
  - O2 is a by-product
Calvin cycle
  - stroma
  - CO2 -> G3P -> glucose
Key words
  - Chlorophyll: green pigment that absorbs red and blue light
  - Stomata: pores that let gases in and out
Limiting factors
  - light
  - CO2
  - temperature
  - e.g. greenhouses add CO2`;

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function assertNoOverlaps(boxes) {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      assert.ok(!overlaps(boxes[i], boxes[j]), `"${boxes[i].node.text}" overlaps "${boxes[j].node.text}"`);
    }
  }
}

test('no two boxes overlap, on both sides or on one side', () => {
  const tree = parseNotes(NOTES);
  assertNoOverlaps(layoutMindMap(tree, measure).boxes);
  assertNoOverlaps(layoutMindMap(tree, measure, { oneSide: true }).boxes);
});

test('the main topic is centered and branches grow away from it', () => {
  const map = layoutMindMap(parseNotes(NOTES), measure);
  const root = map.root;
  assert.equal(root.x + root.w / 2, 0);
  assert.equal(root.y + root.h / 2, 0);
  for (const link of map.links) {
    if (link.side > 0) assert.ok(link.to.x >= link.from.x + link.from.w, link.to.node.text);
    else assert.ok(link.to.x + link.to.w <= link.from.x, link.to.node.text);
  }
});

test('branches are split between the two sides, or all on the right with oneSide', () => {
  const tree = parseNotes(NOTES);
  const sides = (map) => map.root.children.map((c) => c.side);
  assert.deepEqual(sides(layoutMindMap(tree, measure)), [1, 1, -1, -1]);
  assert.deepEqual(sides(layoutMindMap(tree, measure, { oneSide: true })), [1, 1, 1, 1]);
});

test('each branch keeps one color index all the way down', () => {
  const map = layoutMindMap(parseNotes(NOTES), measure);
  for (const box of map.boxes) {
    if (box.depth === 0) continue;
    let top = box;
    while (top.depth > 1) top = map.links.find((l) => l.to === top).from;
    assert.equal(box.branch, map.root.children.indexOf(top));
  }
});

test('a folded branch hides its ideas and says how many', () => {
  const tree = parseNotes(NOTES);
  const map = layoutMindMap(tree, measure, { collapsed: new Set(['root/Limiting factors']) });
  const folded = map.boxes.find((b) => b.key === 'root/Limiting factors');
  assert.equal(folded.hidden, 4);
  assert.equal(folded.children.length, 0);
  assert.equal(map.boxes.length, 1 + tree.count - 4);
});

test('the bounds hold every box', () => {
  const map = layoutMindMap(parseNotes(NOTES), measure);
  for (const b of map.boxes) {
    assert.ok(b.x >= map.bounds.minX && b.x + b.w <= map.bounds.maxX);
    assert.ok(b.y >= map.bounds.minY && b.y + b.h <= map.bounds.maxY);
  }
});

test('definitions show the term on top and the meaning underneath', () => {
  const map = layoutMindMap(parseNotes(NOTES), measure);
  const box = map.boxes.find((b) => b.node.kind === 'definition');
  assert.equal(box.rows[0].text, 'Chlorophyll');
  assert.ok(box.rows.slice(1).every((r) => r.detail));
  assert.equal(box.rows.slice(1).map((r) => r.text).join(' '), 'green pigment that absorbs red and blue light');
});

test('wrap keeps lines inside the width and breaks very long words', () => {
  const font = { size: 10 };
  const lines = wrap('a short line and then Pneumonoultramicroscopicsilicovolcanoconiosis', font, 100, measure);
  for (const line of lines) assert.ok(measure(line, font) <= 100, line);
  assert.equal(lines.join('').replace(/\s/g, ''), 'ashortlineandthenPneumonoultramicroscopicsilicovolcanoconiosis');
});

test('branch lines start and end on the box edges', () => {
  const map = layoutMindMap(parseNotes(NOTES), measure);
  const link = map.links.find((l) => l.side < 0);
  const p = linkPath(link);
  assert.equal(p.x1, link.from.x);
  assert.equal(p.x2, link.to.x + link.to.w);
});

test('cards: one per branch, with lone branches gathered on one card', () => {
  const tree = parseNotes('Topic\nLonely one\nBranch\n  - idea\nLonely two');
  const cards = toCards(tree);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].head, null);
  assert.deepEqual(cards[0].items.map((n) => n.text), ['Lonely one', 'Lonely two']);
  assert.equal(cards[1].head.text, 'Branch');
});

test('the SVG file and the cards escape what you typed', () => {
  const tree = parseNotes('Tags & <b>stuff</b>\nA <script>\n  - "quotes"');
  const svg = mindMapSVGFile(layoutMindMap(tree, measure), {
    paper: '#fff', sheet: '#fff', ink: '#000', inkSoft: '#555', highlight: '#ff0',
    branches: [{ strong: '#f00', soft: '#fee' }],
  }, { hand: '"Patrick Hand", cursive', body: 'sans-serif' });
  assert.ok(svg.startsWith('<?xml'));
  assert.ok(!svg.includes('<script>') && !svg.includes('<b>'));
  assert.ok(svg.includes('&lt;b&gt;stuff&lt;/b&gt;') && svg.includes('A &lt;script&gt;'));
  const html = cardsHTML(tree, toCards(tree));
  assert.ok(!html.includes('<script>') && html.includes('&quot;quotes&quot;'));
});
