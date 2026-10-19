const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes, stripInk } = require('../js/parser.js');
const { notesToEntries, layoutPages, paperMetrics } = require('../js/handpage.js');
const NB = require('../js/notebooks.js');

const advance = (ch, size) => size * 0.5;
const inkOf = (e) => e.inks.map((r) => [r.at, r.ink]);

test('a paragraph mark sets the ink until the next one', () => {
  const entries = notesToEntries('Cells\n\n{blue}\nThe first paragraph\nstill blue\n\n{red}\nThe second paragraph\n{/}\nBack to blue');
  const lines = entries.filter((e) => !e.blank);
  assert.deepEqual(lines.map((e) => [e.text, e.ink]), [
    ['Cells', null],
    ['The first paragraph', 'blue'],
    ['still blue', 'blue'],
    ['The second paragraph', 'red'],
    ['Back to blue', 'blue'],
  ]);
  // Lines holding only a mark leave no gap.
  assert.equal(entries.filter((e) => e.blank).length, 2);
});

test('inline marks color some words; {/} goes back to the ink before', () => {
  const [, e] = notesToEntries('T\nPlain then {green}green {#c0392b}hex{/} green{/} plain');
  assert.equal(e.text, 'Plain then green hex green plain');
  assert.deepEqual(inkOf(e), [[11, 'green'], [17, '#c0392b'], [20, 'green'], [26, null]]);
});

test('marks keep headings, bullets, terms and math working', () => {
  const entries = notesToEntries('T\n## {red}Parts{/}\n{blue}- ATP: energy currency{/}\n- {pink}[x] Done\n- e^{x} and a_{ij}');
  assert.deepEqual(entries.map((e) => [e.heading, e.marker, e.ink]), [[1, null, null], [2, null, 'red'], [0, '•', 'blue'], [0, '☑', 'pink'], [0, '•', 'pink']]);
  assert.equal(entries[1].text, 'Parts');
  assert.equal(entries[2].text, 'ATP: energy currency');
  assert.equal(entries[2].accent, 'ATP:'.length);
  assert.notEqual(entries[4].text.indexOf('e'), -1);
  assert.doesNotMatch(entries[4].text, /\{|\}/); // e^{x} is still math, not an ink
});

test('wrapped lines keep their ink, and marks take no room', () => {
  const m = paperMetrics('lined', 'letter', 22);
  const long = 'word '.repeat(60).trim();
  const plain = layoutPages(`T\n${long}`, m, 22, advance)[0].lines;
  const inked = layoutPages(`T\n{teal}${long}{/}`, m, 22, advance)[0].lines;
  assert.deepEqual(inked.map((l) => l.text), plain.map((l) => l.text));
  assert.ok(inked.length > 2);
  for (const l of inked.slice(1)) assert.deepEqual(l.inks.map((r) => r.ink), ['teal']);
  assert.equal(plain[1].inks, undefined);
  const bullet = layoutPages('T\n{red}\n- a point', m, 22, advance)[0].lines[1];
  assert.equal(bullet.marker.ink, 'red');
});

test('the map, cards and notebook titles never show the marks', () => {
  const text = '{navy}Cells{/}\n## {red}Parts\n- Wall: keeps shape{/}';
  assert.equal(stripInk('{red}a{/} e^{x} {#abc}b{/red} {}'), 'a e^{x} b {}');
  const tree = parseNotes(text);
  assert.equal(tree.title, 'Cells');
  assert.equal(tree.root.children[0].text, 'Parts');
  assert.equal(NB.titleOf({ text }), 'Cells');
});

test('{center} and {right} line a line up on the page, bullet and all', () => {
  const m = paperMetrics('plain', 'letter', 20);
  const lines = layoutPages('T\n- left\n- middle {center}\n{right}far side', m, 20, advance)[0].lines;
  const [, left, middle, right] = lines;
  assert.ok(Math.abs(middle.marker.x - left.marker.x - (m.right - left.x - middle.width) / 2) < 0.01);
  assert.ok(Math.abs(right.x + right.width - m.right) < 0.01);
  assert.equal(middle.text, 'middle');
  assert.equal(parseNotes('T\n- middle {center}').root.children[0].text, 'middle');
});

test('double spacing writes on every other ruled line, 1.5 in between', () => {
  const m = paperMetrics('lined', 'letter', 22);
  const gaps = (sp) => layoutPages('- a\n- b\n- c\n- d\n- e', m, 22, advance, null, sp)[0].lines.map((l, i, all) => (i ? Math.round((l.y - all[i - 1].y) / m.rule) : 0)).slice(1);
  assert.deepEqual(gaps(1), [1, 1, 1, 1]);
  assert.deepEqual(gaps(2), [2, 2, 2, 2]);
  assert.deepEqual(gaps(1.5), [1, 2, 1, 2]);
});
