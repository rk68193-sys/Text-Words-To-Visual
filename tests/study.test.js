const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNotes, describe } = require('../js/parser.js');
const NB = require('../js/notebooks.js');
const S = require('../js/structure.js');
const M = require('../js/mathtext.js');
const { layoutMindMap } = require('../js/layout.js');
const { cardsHTML } = require('../js/render.js');
const { toCards } = require('../js/layout.js');
const { notesToEntries } = require('../js/handpage.js');

global.self = global;
require('../js/examples.js');
require('../js/course-notes.js');
const { EXAMPLES, COURSE_NOTES } = global.VisualNotes;

const shape = (node) => (node.children.length ? [node.text, node.children.map(shape)] : node.text);
const measure = (text, font) => text.length * font.size * 0.55;

// ---------- Labels: sub-sections inside a section ----------

test('a bold, capital or colon label owns the lines under it until the next label', () => {
  const tree = parseNotes('# LA\n## 3.1\n**INTUITION**\n- a\n  - a1\n- b\nEQUATIONS / PROCEDURE\n- c\nSteps:\n1. one\n2. two\n## 3.2\n- d');
  assert.deepEqual(shape(tree.root), ['LA', [
    ['3.1', [['INTUITION', [['a', ['a1']], 'b']], ['EQUATIONS / PROCEDURE', ['c']], ['Steps', ['one', 'two']]]],
    ['3.2', ['d']],
  ]]);
  assert.deepEqual(tree.root.children[0].children.map((n) => n.kind), ['label', 'label', 'label']);
});

test('a line further left closes a label, and a label inside a bullet nests under it', () => {
  const tree = parseNotes('T\n## S\n- Ex 3:\n  **Part b**\n  - inside\n- after');
  assert.deepEqual(shape(tree.root.children[0]), ['S', [['Ex 3', [['Part b', ['inside']]]], 'after']]);
});

test('bullets are never labels, and without headings an unindented label is a branch', () => {
  assert.equal(parseNotes('T\n## S\n- **bold bullet**\n- next').root.children[0].children[0].kind, 'text');
  const tree = parseNotes('Bio\nLIGHT REACTIONS\n  - ATP\nCalvin cycle\n  - sugar');
  assert.deepEqual(shape(tree.root), ['Bio', [['LIGHT REACTIONS', ['ATP']], ['Calvin cycle', ['sugar']]]]);
});

// ---------- Study blocks ----------

test('theorems, definitions, proofs, warnings, tips and notes become callouts', () => {
  const cases = [
    ['**Theorem 4.1.1 (Existence of a Unique Solution):** a_n continuous', 'theorem', 'Theorem 4.1.1 (Existence of a Unique Solution)', 'a_n continuous'],
    ['Thm 3: replacement → det unchanged', 'theorem', 'Thm 3', 'replacement → det unchanged'],
    ['Definition 4.1.2 (Wronskian): W = det', 'definition', 'Definition 4.1.2 (Wronskian)', 'W = det'],
    ['Proof (n = 2): pick t', 'proof', 'Proof (n = 2)', 'pick t'],
    ['Thm 1 proof idea: divide by Δt', 'proof', 'Thm 1 proof idea', 'divide by Δt'],
    ['WARNING: partials exist but f is not differentiable', 'warning', 'WARNING', 'partials exist but f is not differentiable'],
    ['Watch the interval: ln x needs x > 0', 'warning', 'Watch the interval', 'ln x needs x > 0'],
    ['Tip: check units', 'tip', 'Tip', 'check units'],
    ['Note: y = 0 is always a solution', 'note', 'Note', 'y = 0 is always a solution'],
  ];
  for (const [line, type, label, body] of cases) {
    const idea = describe(line);
    assert.deepEqual([idea.kind, idea.callout, idea.label, idea.body], ['callout', type, label, body], line);
  }
  const proof = describe('Proof idea (Thm 3 by induction on n)');
  assert.deepEqual([proof.callout, proof.text], ['proof', 'Proof idea (Thm 3 by induction on n)']);
  for (const line of ['Theorems are useful', 'Notebook: a thing', 'Defining moment: the end']) assert.notEqual(describe(line).kind, 'callout', line);
});

test('numbered worked examples are examples, not definitions', () => {
  const ex = describe("Ex 1: 3y''' + 5y = 0");
  assert.deepEqual([ex.kind, ex.label, ex.text], ['example', 'Ex 1', "3y''' + 5y = 0"]);
  const open = describe("Ex 3 (x'' + 16x = 0):");
  assert.deepEqual([open.kind, open.text], ['example', "Ex 3 (x'' + 16x = 0)"]);
  assert.equal(describe('Fig 20: two hills').kind, 'example');
});

test('statements with = or ⇒ are not definitions, and long explanations are not formulas', () => {
  for (const line of ['If a_n(x) = 0 somewhere, uniqueness can fail', '(a) x(0) = 0, x(π/2) = 0: c₁ = 0', 'Nul A = {0} ⇔ one-to-one', 'Ax = v and Ax = w consistent ⇒ Ax = v + w consistent']) {
    assert.equal(describe(line).kind === 'definition' || describe(line).kind === 'formula', false, line);
  }
  assert.equal(describe('A_ij = delete row i, col j').kind, 'definition');
  assert.ok(['definition', 'formula'].includes(describe('Complementary function y_c = c₁y₁ + … + c_ny_n').kind));
  assert.equal(describe('A vector space = any "universe" closed under + and scalar ·, with the usual rules').kind, 'definition');
  assert.equal(describe('KE = ½mv²').kind, 'formula');
});

// ---------- Practice ----------

test('theorems and definitions become "state it" cards; headings and labels make none', () => {
  const tree = parseNotes('DE\n## 4.1.2: Homogeneous\n**EQUATIONS**\n- **Theorem 4.1.3 (Criterion):** independent ⇔ W ≠ 0\n- Definition 4.1.2 (Wronskian): W(f₁..f_n) = det\n- Def: Nul A = {x : Ax = 0}\n- Def 6 Continuity: lim f = f(a,b)\n- Def: assigns each point a number\n- Thm 4: a fundamental set exists');
  const prompts = NB.studyCards(tree).cards.map((c) => [c.kind, c.prompt]);
  assert.deepEqual(prompts, [
    ['Theorem', 'State Theorem 4.1.3 (Criterion).'],
    ['Definition', 'Define Wronskian (Definition 4.1.2).'],
    ['Definition', 'Define Nul A.'],
    ['Definition', 'Define Continuity (Definition 6).'],
    ['Definition', 'State the definition.'],
    ['Theorem', 'State Thm 4.'],
  ]);
});

test('numbered steps become one "list the steps" card, and the steps make no cards of their own', () => {
  const tree = parseNotes('DE\n## 4.2\n**PROBLEM-SOLVING CHECKLIST**\n1. Divide by a₂ → standard form\n2. Compute e^{−∫P dx}\n3. y = c₁y₁ + c₂y₂');
  const deck = NB.studyCards(tree);
  assert.equal(deck.cards.length, 1);
  assert.equal(deck.cards[0].kind, 'Steps');
  assert.equal(deck.cards[0].prompt, 'List the steps: PROBLEM-SOLVING CHECKLIST');
  assert.equal(deck.cards[0].answer, '1. Divide by a₂ → standard form\n2. Compute e^{−∫P dx}\n3. y = c₁y₁ + c₂y₂');
});

test('answers are copied as written and the lines under a question make no cards', () => {
  const deck = NB.studyCards(parseNotes('LA\n## Self-test\n- For 3×3 A, what is det 5A?\n  - 125 det A, because det(kA) = kⁿ det A'));
  assert.equal(deck.cards.length, 1);
  assert.equal(deck.cards[0].answer, '125 det A, because det(kA) = kⁿ det A');
});

test('a note name is recalled rather than defined, and a written question stays a question', () => {
  const cards = NB.studyCards(parseNotes('T\n## S\n- Big picture: det is a scale factor\n- Wronskian: a determinant of derivatives\n- "Is y in Span{v1, v2}?" = is [v1 v2 | y] consistent')).cards;
  assert.deepEqual(cards.map((c) => [c.kind, c.prompt]), [
    ['Recall', 'Recall: Big picture'],
    ['Definition', 'What is Wronskian?'],
    ['Your question', 'Is y in Span{v1, v2}?'],
  ]);
});

// ---------- Math ----------

test('superscripts, subscripts and matrices render as HTML, and text stays escaped', () => {
  assert.equal(M.mathHTML('e^{2x} + a_ij'), 'e<sup>2x</sup> + a<sub>ij</sub>');
  assert.equal(M.mathHTML('(−1)^(i+j) C_ij'), '(−1)<sup>i+j</sup> C<sub>ij</sub>');
  assert.equal(M.mathHTML('e^{x_1}'), 'e<sup>x<sub>1</sub></sup>');
  assert.equal(M.mathHTML('<b>x^2</b>'), '&lt;b&gt;x<sup>2</sup>&lt;/b&gt;');
  assert.equal(M.mathHTML('see https://a.b/c_d^e'), 'see https://a.b/c_d^e');
  assert.equal(M.mathHTML('snake__case and a ^ b'), 'snake__case and a ^ b');
  const det = M.mathHTML('W = |1 0; −3 2| = 2');
  assert.match(det, /class="matrix det"[^>]*style="--cols:2"><span>1<\/span><span>0<\/span><span>−3<\/span><span>2<\/span><\/span> = 2$/);
  assert.match(M.mathHTML('[d −b; −c a]'), /class="matrix brackets"/);
  assert.match(M.mathHTML('det[[1,x,y],[1,x1,y1],[1,x2,y2]] = 0'), /--cols:3/);
  assert.match(M.mathHTML('|cos x, sin x; −sin x, cos x|'), /<span>−sin x<\/span>/);
  for (const prose of ['[see note; page 3]', 'area T(S) = |det A|·area S (2D); volume T(S) = |det A|·vol S']) assert.doesNotMatch(M.mathHTML(prose), /class="matrix/, prose);
});

test('the map uses Unicode where it reads cleanly; f_x and f_y stay written alike', () => {
  assert.equal(M.mathPlain('e^{2x} + x^2 + a_ij + y_{1}'), 'e²ˣ + x² + aᵢⱼ + y₁');
  assert.equal(M.mathPlain('f_x and f_y'), 'f_x and f_y');
  assert.equal(M.mathPlain('e^{−∫P dx}'), 'e^(−∫P dx)');
});

test('handwriting gets small raised and lowered letters for scripts and Unicode ² ₁', () => {
  const decode = (s) => [...s].map((c) => { const h = M.handScript(c); return h ? (h.pos > 0 ? '^' : '_') + h.base : c; }).join('');
  assert.equal(decode(M.mathHand('e^{2x} + c₁ + x²')), 'e^2^x + c_1 + x^2');
  assert.equal(M.mathHand('plain words'), 'plain words');
});

// ---------- Structure editing ----------

test('line types: read and set, keeping the words', () => {
  assert.deepEqual(['## Sec', '**INTUITION**', 'STEPS', '  - a', '1. one', '- [ ] t', 'plain', ''].map(S.lineType),
    ['section', 'label', 'label', 'bullet', 'numbered', 'task', 'plain', 'plain']);
  const lines = ['# T', '## Sec', '  - first', '1. one', 'two', '  - [x] done'];
  assert.equal(S.setLineType(lines, 2, 'subsection'), '### first');
  assert.equal(S.setLineType(lines, 1, 'label'), '**Sec**');
  assert.equal(S.setLineType(lines, 4, 'numbered'), '2. two');
  assert.equal(S.setLineType(lines, 5, 'plain'), '  done');
  assert.equal(S.setLineType(lines, 3, 'bullet'), '- one');
});

test('indenting moves one level, brings sub-points along, and never jumps two levels', () => {
  const lines = ['## S', '- a', '- b', '  - b1', '- c'];
  const moved = S.shiftLines(lines, 2, 2, 1);
  assert.deepEqual(moved.lines, ['## S', '- a', '  - b', '    - b1', '- c']);
  assert.equal(S.shiftLines(moved.lines, 2, 2, 1), null, 'already one level under a');
  assert.deepEqual(S.shiftLines(moved.lines, 2, 2, -1).lines, lines);
  assert.equal(S.shiftLines(lines, 0, 0, 1), null, 'headings stay at the left edge');
  // Odd spacing snaps to the level grid.
  assert.deepEqual(S.shiftLines(['- a', '   - b'], 1, 1, -1).lines, ['- a', '  - b']);
  // A label takes the lines it groups.
  assert.deepEqual(S.shiftLines(['- x', '**L**', '- a', '- b', '**M**'], 1, 1, 1).lines, ['- x', '  **L**', '  - a', '  - b', '**M**']);
});

test('tidy evens out tabs, odd spaces and bullet marks without changing the tree', () => {
  const messy = 'Topic\n## A\n\t- one\n\t\t* deep\n   - three\n## B\n**L**\n    - x\n  - y\nz';
  const tidy = S.tidyNotes(messy);
  assert.equal(tidy, 'Topic\n## A\n- one\n  - deep\n- three\n## B\n**L**\n- x\n- y\nz');
  assert.deepEqual(shape(parseNotes(tidy).root), shape(parseNotes(messy).root));
  assert.equal(S.tidyNotes(tidy), tidy);
  for (const ex of Object.values(EXAMPLES)) assert.equal(S.tidyNotes(ex.text), ex.text, ex.label);
});

test('the section list holds headings and labels in order', () => {
  const sections = S.sectionsOf(parseNotes('T\n## A\n**INTUITION**\n- x\n### A.1\n## B'));
  assert.deepEqual(sections.map((s) => [s.text, s.level, s.sourceLine]), [['A', 0, 2], ['INTUITION', 1, 3], ['A.1', 1, 5], ['B', 0, 6]]);
});

// ---------- Course notebooks ----------

test('course notebooks join the desk once, and a deleted one stays deleted', () => {
  const desk = { version: 1, activeId: 'mine', documents: [{ id: 'mine', text: 'Mine' }] };
  const first = NB.deliverNotebooks(desk, COURSE_NOTES, []);
  assert.equal(first.added.length, COURSE_NOTES.length);
  assert.equal(first.library.activeId, COURSE_NOTES[0].id);
  assert.equal(NB.validLibrary(first.library), true);
  assert.equal(desk.documents.length, 1, 'the old desk is not changed');
  const again = NB.deliverNotebooks(first.library, COURSE_NOTES, first.delivered);
  assert.equal(again.added.length, 0);
  const removed = NB.removeNotebook(first.library, COURSE_NOTES[2].id).library;
  assert.equal(NB.deliverNotebooks(removed, COURSE_NOTES, first.delivered).added.length, 0);
});

test('each course notebook has sections split into labelled parts, practice cards and answered self-tests', () => {
  assert.deepEqual(COURSE_NOTES.map((b) => b.id.replace(/^course-2026-10-1[69]-/, '')), ['linear-algebra', 'differential-equations', 'calculus-3', 'ap-biology-unit-2']);
  for (const book of COURSE_NOTES) {
    const tree = parseNotes(book.text);
    const sections = tree.root.children;
    assert.ok(sections.length >= 7, book.id);
    assert.ok(sections.every((s) => s.heading === 2), book.id);
    assert.ok(sections.filter((s) => s.children.some((c) => c.kind === 'label')).length >= 4, book.id);
    const deck = NB.studyCards(tree);
    assert.ok(deck.cards.length >= 60, book.id);
    assert.equal(deck.unanswered, 0, book.id);
    // The math notebooks state theorems; the biology one has formulas (Ψ = Ψₚ + Ψₛ, Ψₛ = −iCRT).
    assert.ok(deck.cards.some((c) => c.kind === (book.id.includes('biology') ? 'Formula' : 'Theorem')), book.id);
    assert.equal(S.tidyNotes(book.text), book.text, book.id);
    const layout = layoutMindMap(tree, measure, {});
    assert.equal(layout.boxes.length, tree.count + 1);
  }
});

test('the AP Biology notebook makes only cards that make sense', () => {
  const book = COURSE_NOTES.find((b) => b.id.includes('biology'));
  const deck = NB.studyCards(parseNotes(book.text));
  assert.ok(deck.cards.length >= 150);
  for (const c of deck.cards) {
    // Memory hooks are tip boxes, not "What is Hook?" cards, and no card asks about a "Picture".
    assert.doesNotMatch(c.prompt, /^(What is (Hook|Picture|Note|Tip)|Recall: )/, c.prompt);
    assert.ok(c.answer.trim().length > 0, c.prompt);
    // A definition answers in words, not with a bare symbol or a stray fragment.
    if (c.kind === 'Definition') assert.ok(c.answer.split(/\s+/).length >= 4, c.prompt);
  }
  assert.equal(deck.cards.filter((c) => c.kind === 'Sequence').length, 0, 'sequences without context were made into questions');
});

test('every multiple-choice card names the right letter and explains each wrong choice', () => {
  const book = COURSE_NOTES.find((b) => b.id.includes('biology'));
  const mcq = NB.studyCards(parseNotes(book.text)).cards.filter((c) => /\(A\).*\(B\).*\(C\).*\(D\)/.test(c.prompt));
  assert.ok(mcq.length >= 18, String(mcq.length));
  for (const c of mcq) {
    const lines = c.answer.split('\n');
    const pick = /^\(([A-D])\)/.exec(lines[0]);
    assert.ok(pick, c.prompt);
    // Every other letter is explained on a "Not (…)" line, or named as also true in context.
    for (const letter of 'ABCD'.replace(pick[1], '')) {
      assert.ok(lines.slice(1).some((l) => new RegExp('\\(' + letter + '\\)').test(l)), c.prompt + ' misses (' + letter + ')');
    }
  }
});

// ---------- Cards, map and handwriting ----------

test('cards show labels, callouts, worked examples and steps', () => {
  const tree = parseNotes('T\n## S\n**INTUITION**\n- Theorem 1 (Big): x^{2} ≥ 0\n- Warning: check the sign\n- Ex 2: a_ij = 1\n1. first\n2. second');
  const html = cardsHTML(tree, toCards(tree));
  assert.match(html, /<span class="label-text">INTUITION<\/span>/);
  assert.match(html, /callout-theorem.*Theorem 1 \(Big\).*x<sup>2<\/sup> ≥ 0/);
  assert.match(html, /callout-warning/);
  assert.match(html, /<span class="badge">Ex 2<\/span><span class="words">a<sub>ij<\/sub> = 1<\/span>/);
  assert.match(html, /<span class="num">2\.<\/span>/);
});

test('the map shortens long statements but cards keep them whole', () => {
  const long = 'Theorem 9: ' + 'every word of a very long statement '.repeat(12);
  const tree = parseNotes('T\n## S\n- ' + long);
  const box = layoutMindMap(tree, measure, {}).boxes.find((b) => b.node.kind === 'callout');
  const detail = box.rows.filter((r) => r.detail).map((r) => r.text).join(' ');
  assert.ok(detail.endsWith('…') && detail.length < 240);
  assert.match(cardsHTML(tree, toCards(tree)), /statement <\/span>|statement<\/span>/);
});

test('handwriting writes labels and study-block lead-ins in the accent ink', () => {
  const entries = notesToEntries('T\n## S\n**INTUITION**\n- Theorem 1: x^2 ≥ 0\n- Ex 2: worked');
  const label = entries.find((e) => e.label);
  assert.deepEqual([label.text, label.accent], ['INTUITION', Infinity]);
  const thm = entries.find((e) => e.text.startsWith('Theorem'));
  assert.equal(thm.accent, 'Theorem 1'.length + 1);
  assert.equal(M.handScript([...thm.text].find((c) => M.handScript(c))).base, '2');
  assert.equal(entries.find((e) => e.text.startsWith('Ex 2')).accent, 5);
});
