const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes, describe } = require('../js/parser.js');
const { LIBRARY_KEY, notebook, titleOf, validLibrary, readLibrary, writeLibrary, studyCards, startPractice, ratePractice } = require('../js/notebooks.js');

function memory(values = {}) {
  const data = new Map(Object.entries(values));
  return { getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => data.set(k, v) };
}
test('ordinary words beginning eg are not truncated as examples', () => {
  for (const word of ['eggs', 'Egypt', 'egress', 'for examples']) assert.equal(describe(word).text, word);
  for (const text of ['e.g. a cell', 'e.g a cell', 'eg: a cell', 'for example, a cell']) {
    assert.equal(describe(text).kind, 'example');
    assert.equal(describe(text).text, 'a cell');
  }
});
test('source locations retain blank lines, dividers, headings, tabs and CRLF', () => {
  const tree = parseNotes('\r\nTopic\r\n\r\n---\r\n## Branch\r\n\t- Term: meaning');
  assert.equal(tree.root.sourceLine, 2);
  assert.equal(tree.root.children[0].sourceLine, 5);
  assert.equal(tree.root.children[0].children[0].sourceLine, 6);
});
test('synthetic root has no source but first bullet keeps its source', () => {
  const tree = parseNotes('\n- one');
  assert.equal(tree.root.sourceLine, null);
  assert.equal(tree.root.children[0].sourceLine, 2);
});
test('legacy notes migrate without deleting their old storage key', () => {
  const storage = memory({ 'tn2vn.notes': 'My old notebook\n- idea' });
  const result = readLibrary(storage, 'Sample', 'legacy');
  assert.equal(result.library.documents[0].text, 'My old notebook\n- idea');
  assert.equal(writeLibrary(storage, result.library, result.raw).ok, true);
  assert.equal(storage.getItem('tn2vn.notes'), 'My old notebook\n- idea');
});
test('an intentionally empty legacy notebook stays empty', () => {
  assert.equal(readLibrary(memory({ 'tn2vn.notes': '' }), 'Sample', 'id').library.documents[0].text, '');
});
test('multiple notebooks and active selection round-trip, including empty text', () => {
  const storage = memory();
  const library = { version: 1, activeId: 'two', documents: [notebook('First', 'one'), notebook('', 'two')] };
  const result = writeLibrary(storage, library, null);
  assert.equal(result.ok, true);
  const restored = readLibrary(storage, 'Sample');
  assert.deepEqual(restored.library, library);
  assert.equal(titleOf(restored.library.documents[1]), 'Untitled notebook');
});
test('invalid or duplicate notebook identities are rejected', () => {
  for (const value of [null, {}, { version: 9, documents: [] },
    { version: 1, activeId: 'a', documents: [notebook('x','a'), notebook('y','a')] },
    { version: 1, activeId: 'missing', documents: [notebook('x','a')] }]) assert.equal(validLibrary(value), false);
});
test('unreadable stored library is preserved and editing starts with a visible warning', () => {
  const storage = memory({ [LIBRARY_KEY]: '{broken' });
  const result = readLibrary(storage, 'Sample', 'id');
  assert.equal(result.blocked, true);
  assert.match(result.error, /unreadable/);
  assert.equal(storage.getItem(LIBRARY_KEY), '{broken');
});
test('storage denial and quota failures are reported instead of successful saves', () => {
  const denied = { getItem() { throw new Error('SecurityError'); } };
  assert.equal(readLibrary(denied, 'Sample').blocked, true);
  const full = { getItem: () => null, setItem() { throw new Error('QuotaExceededError'); } };
  const lib = { version: 1, activeId: 'a', documents: [notebook('Keep this', 'a')] };
  assert.equal(writeLibrary(full, lib, null).ok, false);
  assert.equal(lib.documents[0].text, 'Keep this');
});
test('a stale tab cannot overwrite notes saved by another tab', () => {
  const storage = memory();
  const first = readLibrary(storage, 'First', 'a');
  const second = readLibrary(storage, 'Second', 'b');
  const saved = writeLibrary(storage, first.library, first.raw);
  assert.equal(saved.ok, true);
  const rejected = writeLibrary(storage, second.library, second.raw);
  assert.equal(rejected.conflict, true);
  assert.equal(readLibrary(storage, '').library.documents[0].text, 'First');
});
test('practice uses exact definitions, explicit answers and successive flow steps', () => {
  const tree = parseNotes('Biology\n## Cells\n- ATP: energy currency\n- A -> B -> C\n- Why green?\n  - Chlorophyll reflects green light\n- Missing answer?');
  const deck = studyCards(tree);
  assert.equal(deck.cards.length, 4);
  assert.equal(deck.unanswered, 1);
  assert.deepEqual(deck.cards.map(c => c.answer), ['energy currency', 'B', 'C', 'Chlorophyll reflects green light']);
  assert.deepEqual(deck.cards.map(c => c.sourceLine), [3, 4, 4, 5]);
  assert.equal(new Set(deck.cards.map(c => c.id)).size, 4);
});
test('contextual labels retain the branch in the practice prompt', () => {
  const deck = studyCards(parseNotes('Bio\n## Light reactions\n- Where: thylakoids'));
  assert.match(deck.cards[0].prompt, /Light reactions/);
  assert.match(deck.cards[0].prompt, /where/);
});
test('practice does not invent answers from adjacent notes', () => {
  const deck = studyCards(parseNotes('Topic\n## Branch\n- Unanswered?\n- A nearby fact\n- ! Important fact'));
  assert.equal(deck.cards.length, 0);
  assert.equal(deck.unanswered, 1);
});
test('questions retain all nested written answer lines', () => {
  const deck = studyCards(parseNotes('Topic\n## Branch\n- How?\n  - First\n    - Detail\n  - Second'));
  assert.equal(deck.cards[0].answer, 'First\nDetail\nSecond');
});
test('practice ratings require a reveal and repeat missed cards until remembered', () => {
  const cards = [{ id: 'one' }, { id: 'two' }];
  let session = startPractice(cards);
  assert.equal(ratePractice(session, 'known'), session);
  session = ratePractice({ ...session, revealed: true }, 'again');
  assert.deepEqual(session.queue.map(c => c.id), ['two', 'one']);
  assert.equal(session.remembered, 0);
  session = ratePractice({ ...session, revealed: true }, 'known');
  session = ratePractice({ ...session, revealed: true }, 'known');
  assert.equal(session.queue.length, 0);
  assert.equal(session.remembered, 2);
  assert.equal(session.attempts, 3);
  assert.equal(cards.length, 2);
});
test('practice answers remain untrusted strings and rendering escapes markup', () => {
  const { esc, cardsHTML } = require('../js/render.js');
  const { toCards } = require('../js/layout.js');
  const tree = parseNotes('Topic\n## Branch\n- X: <img src=x onerror=alert(1)>');
  assert.equal(studyCards(tree).cards[0].answer, '<img src=x onerror=alert(1)>');
  assert.equal(esc(studyCards(tree).cards[0].answer).includes('<img'), false);
  const html = cardsHTML(tree, toCards(tree));
  assert.equal(html.includes('<img'), false);
  assert.match(html, /data-source-line="3"/);
});
