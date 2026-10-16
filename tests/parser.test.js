const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes, describe } = require('../js/parser.js');

// A compact picture of the tree: "text" for leaves, ["text", [...children]] otherwise.
function shape(node) {
  return node.children.length ? [node.text, node.children.map(shape)] : node.text;
}

test('first plain line is the main topic and unindented lines are branches', () => {
  const tree = parseNotes(`Photosynthesis
Light reactions
  - in the thylakoids
  - make ATP
Calvin cycle
  - in the stroma`);
  assert.equal(tree.title, 'Photosynthesis');
  assert.deepEqual(shape(tree.root), ['Photosynthesis', [
    ['Light reactions', ['in the thylakoids', 'make ATP']],
    ['Calvin cycle', ['in the stroma']],
  ]]);
  assert.equal(tree.count, 5);
});

test('indentation nests ideas, whether it uses 2 spaces, 4 spaces or tabs', () => {
  for (const unit of ['  ', '    ', '\t']) {
    const tree = parseNotes(`Cells\nOrganelles\n${unit}- nucleus\n${unit}${unit}- holds DNA\n${unit}- ribosome`);
    assert.deepEqual(shape(tree.root.children[0]), ['Organelles', [['nucleus', ['holds DNA']], 'ribosome']]);
  }
});

test('bullets right under the main topic hang off it', () => {
  const tree = parseNotes('Photosynthesis\n- happens in chloroplasts\n- needs light');
  assert.deepEqual(shape(tree.root), ['Photosynthesis', ['happens in chloroplasts', 'needs light']]);
});

test('notes that start with a bullet get a default main topic', () => {
  const tree = parseNotes('- one\n- two');
  assert.equal(tree.title, 'My notes');
  assert.deepEqual(shape(tree.root), ['My notes', ['one', 'two']]);
});

test('empty notes give just the main topic', () => {
  const tree = parseNotes('  \n\n');
  assert.equal(tree.title, 'My notes');
  assert.equal(tree.count, 0);
});

test('Markdown headings make branches, and plain lines under them become ideas', () => {
  const tree = parseNotes(`# Cells
## Organelles
Mitochondria: makes ATP
### Plant cells only
- Chloroplast
## Membranes
- Phospholipid bilayer`);
  assert.deepEqual(shape(tree.root), ['Cells', [
    ['Organelles', ['Mitochondria: makes ATP', ['Plant cells only', ['Chloroplast']]]],
    ['Membranes', ['Phospholipid bilayer']],
  ]]);
});

test('headings work without a # title, and skipped heading levels do not break nesting', () => {
  const tree = parseNotes('Chemistry\n## Atoms\n#### Protons\n## Bonds');
  assert.deepEqual(shape(tree.root), ['Chemistry', [['Atoms', ['Protons']], 'Bonds']]);
});

test('a line ending in a colon loses the colon', () => {
  const tree = parseNotes('Bio\nLight reactions:\n  - ATP');
  assert.equal(tree.root.children[0].text, 'Light reactions');
});

test('numbered lists, other bullet marks and dividers', () => {
  const tree = parseNotes('Steps\n1. mix\n2) heat\n• cool\n---\n* serve');
  assert.deepEqual(shape(tree.root), ['Steps', ['mix', 'heat', 'cool', 'serve']]);
});

test('definitions: "Term: meaning", "Term - meaning" and "Term = meaning"', () => {
  for (const line of ['ATP: energy currency', 'ATP - energy currency', 'ATP = energy currency', 'ATP — energy currency']) {
    const idea = describe(line);
    assert.equal(idea.kind, 'definition', line);
    assert.equal(idea.term, 'ATP');
    assert.equal(idea.detail, 'energy currency');
  }
});

test('times, links and long sentences are not mistaken for definitions', () => {
  assert.equal(describe('Meeting at 10:30 today').kind, 'text');
  assert.equal(describe('see https://example.com/notes').kind, 'text');
  assert.equal(describe('The cell membrane is selectively permeable and this matters: a lot').kind, 'text');
  assert.equal(describe('Mitochondria-powered cells').kind, 'text');
});

test('arrows make a flow of steps', () => {
  const idea = describe('CO2 -> G3P => glucose → starch');
  assert.equal(idea.kind, 'flow');
  assert.deepEqual(idea.steps, ['CO2', 'G3P', 'glucose', 'starch']);
  assert.equal(idea.text, 'CO2 → G3P → glucose → starch');
});

test('a definition can contain arrows', () => {
  const idea = describe('Calvin cycle: CO2 -> glucose');
  assert.equal(idea.kind, 'definition');
  assert.equal(idea.detail, 'CO2 → glucose');
});

test('questions, examples, checklist items and important ideas', () => {
  assert.equal(describe('Why are leaves green?').kind, 'question');
  assert.deepEqual(
    [describe('Q: what is ATP').kind, describe('Q: what is ATP').text],
    ['question', 'what is ATP'],
  );
  assert.deepEqual([describe('e.g. maple trees').kind, describe('e.g. maple trees').text], ['example', 'maple trees']);
  assert.equal(describe('Example: a greenhouse').kind, 'example');

  const open = describe('[ ] read chapter 8');
  const done = describe('[x] read chapter 7');
  assert.deepEqual([open.kind, open.done, open.text], ['todo', false, 'read chapter 8']);
  assert.deepEqual([done.kind, done.done], ['todo', true]);

  for (const line of ['! needs light', 'Important: needs light', 'remember - needs light', '**needs light**']) {
    const idea = describe(line);
    assert.equal(idea.important, true, line);
    assert.equal(idea.text, 'needs light', line);
  }
  const both = describe('! Chlorophyll: green pigment');
  assert.deepEqual([both.important, both.kind, both.term], [true, 'definition', 'Chlorophyll']);
});

test('inline Markdown marks are removed from the text', () => {
  assert.equal(describe('the `ATP` and **NADPH** and __O2__').text, 'the ATP and NADPH and O2');
});

test('every idea gets a key, and repeated text under one parent stays unique', () => {
  const tree = parseNotes('T\nA\n  - x\n  - x\nB\n  - x');
  const [a, b] = tree.root.children;
  assert.equal(a.children[0].key, 'root/A/x');
  assert.equal(a.children[1].key, 'root/A/x#2');
  assert.equal(b.children[0].key, 'root/B/x');
});

test('Windows line endings', () => {
  const tree = parseNotes('Topic\r\nBranch\r\n  - idea\r\n');
  assert.deepEqual(shape(tree.root), ['Topic', [['Branch', ['idea']]]]);
});
