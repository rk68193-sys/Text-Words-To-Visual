const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../js/figure.js');
const { parseNotes, describe } = require('../js/parser.js');
const NB = require('../js/notebooks.js');
const { layoutMindMap, toCards } = require('../js/layout.js');
const { cardsHTML, mindMapMarkup } = require('../js/render.js');
const { notesToEntries, layoutPages, paperMetrics } = require('../js/handpage.js');

global.self = global;
require('../js/course-notes.js');
const { COURSE_NOTES } = global.VisualNotes;

const measure = (text, font) => text.length * font.size * 0.55;
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---------- Expressions ----------

test('expressions: implicit products, powers, functions, constants and Unicode', () => {
  assert.ok(close(F.compileExpr('2x^2 + sin(4x)')(1), 2 + Math.sin(4)));
  assert.ok(close(F.compileExpr('x y + e^(−x²)', ['x', 'y'])(2, 3), 6 + Math.exp(-4)));
  assert.ok(close(F.compileExpr('cosh(2(1 - x))/cosh(2)')(0.5), Math.cosh(1) / Math.cosh(2)));
  assert.equal(F.compileExpr('-x^2')(3), -9);
  assert.equal(F.compileExpr('2^-1')(), 0.5);
  assert.ok(close(F.compileExpr('sin^2 x + cos(x)^2')(0.7), 1));
  assert.ok(close(F.compileExpr('2pi')(), 2 * Math.PI));
  assert.ok(Number.isNaN(F.compileExpr('ln(x)')(-1)));
});

test('expressions only compute numbers: anything else is a readable error', () => {
  for (const [bad, message] of [['alert(1)', /Unknown name/], ['x +', /ends too soon/], ['(x', /\)/], ['constructor', /Unknown name/], ['x;y', /Unexpected/], ['', /empty/]]) {
    assert.throws(() => F.compileExpr(bad), message, bad);
  }
});

// ---------- The graph language ----------

test('graph lines: ranges, curves, colors, options and labels that hold |', () => {
  const g = F.parseGraph('x: -pi .. pi\ny: -2 .. 2\nequal\ny = sin(4x) | red dashed | label c₂ sin 4t\nlevel x^2 + y^2 = 1, 4 | quiet\nvector 0,0 -> 3,1 | label a_1 | green\npolygon 0,0; 3,1; 4,3; 1,2 | fill blue | label area = |det A|\nnonsense here');
  assert.ok(close(g.x[0], -Math.PI) && g.equal);
  assert.deepEqual(g.items.map((i) => i.kind), ['fn', 'level', 'vector', 'polygon']);
  const [fn, level, vector, polygon] = g.items;
  assert.deepEqual([fn.color, fn.dash, fn.label], ['#c0392b', '7 5', 'c₂ sin 4t']);
  assert.deepEqual([level.ks, level.quiet], [[1, 4], true]);
  assert.deepEqual([vector.label, vector.color, vector.to], ['a_1', '#2e7d4f', [3, 1]]);
  assert.deepEqual([polygon.label, polygon.fill], ['area = |det A|', '#2b5fab']);
  assert.deepEqual(g.errors, ['Line 8: Not a graph line: "nonsense here"']);
});

test('3D lines and slope fields parse; curves without a color take the next one', () => {
  const g = F.parseGraph('3d\nsurface z = x^2 + y^2 | levels 1, 2 | floor\ncurve3 cos(t), sin(t), 1\npoint3 1,1,2 | label P\nslope x - y');
  assert.equal(g.three, true);
  assert.deepEqual(g.items.map((i) => i.kind), ['surface', 'curve3', 'point', 'slope']);
  assert.deepEqual([g.items[0].levels, g.items[0].floor], [[1, 2], true]);
  assert.equal(new Set(g.items.map((i) => i.color)).size, 4);
});

test('level curves by marching squares sit on the curve', () => {
  const segs = F.contour((x, y) => x * x + y * y, [-2, 2], [-2, 2], 1);
  assert.ok(segs.length > 50);
  for (const s of segs) for (const [x, y] of s) assert.ok(Math.abs(Math.hypot(x, y) - 1) < 0.03);
});

// ---------- The figure as SVG ----------

test('figures escape what you typed and accept only real picture data', () => {
  const svg = F.figureSVG({ w: 300, h: 200, bg: 'grid', graph: 'point 1,1 | label <b>P</b>', items: [{ t: 'text', x: 5, y: 20, s: '<script>x^2', c: 'red' }, { t: 'pen', pts: [[1, 1], [9, 9], [20, 4]], c: '#123456', sw: 3 }] });
  assert.ok(!svg.includes('<b>') && !svg.includes('<script>'));
  assert.ok(svg.includes('&lt;b&gt;P&lt;/b&gt;') && svg.includes('x²'));
  assert.ok(svg.includes('stroke="#123456"'));
  assert.ok(!F.figureSVG({ photo: 'javascript:alert(1)' }).includes('javascript'));
  assert.ok(F.figureSVG({ photo: 'data:image/png;base64,iVBORw0KGgo=' }).includes('<image href="data:image/png;base64,iVBORw0KGgo='));
  const items = F.figureSVG({ w: 300, h: 200, bg: 'grid', graph: 'y = x', items: [{ t: 'line', x1: 0, y1: 0, x2: 10, y2: 10 }] }, 'items');
  assert.ok(items.includes('<line') && !items.includes('pattern') && !items.includes('<path d="M46'));
});

test('stored figures keep only known fields and kinds', () => {
  const clean = F.cleanFigure({ w: 99999, h: 'x', bg: 'weird', graph: 'y = x', items: [{ t: 'pen', pts: [] }, { t: 'script' }, null], extra: 1, photo: 'http://x/y.png' });
  assert.deepEqual(clean, { w: 2000, h: 400, bg: 'plain', graph: 'y = x', items: [{ t: 'pen', pts: [] }] });
  assert.equal(F.cleanFigure('nope'), null);
});

test('the eraser finds the stroke under the pointer', () => {
  const pen = { t: 'pen', pts: [[0, 0], [100, 0]] };
  assert.ok(F.itemDistance(pen, 50, 3) < 4);
  assert.ok(F.itemDistance(pen, 50, 40) > 30);
  assert.equal(F.itemDistance({ t: 'rect', x: 10, y: 10, w: 20, h: 20 }, 15, 15), 0);
});

// ---------- Figures in notes, cards, map and pages ----------

test('a figure line in the notes is a figure idea, as a bullet too, and never a label', () => {
  const idea = describe('![LEVEL CURVES](fig:c3-paraboloid)');
  assert.deepEqual([idea.kind, idea.figure, idea.text], ['figure', 'c3-paraboloid', 'LEVEL CURVES']);
  const tree = parseNotes('T\n## S\n- point\n  - ![Picture](fig:f1)\n![SKETCH](fig:f2)');
  const section = tree.root.children[0];
  assert.equal(section.children[0].children[0].kind, 'figure');
  assert.equal(section.children[1].kind, 'figure');
  assert.equal(NB.studyCards(tree).cards.length, 0);
});

test('cards and the map show the picture, or say it is missing', () => {
  const tree = parseNotes('T\n## S\n- ![Here](fig:a)\n- ![Gone](fig:b)');
  const src = (id) => (id === 'a' ? 'data:image/svg+xml,A' : null);
  const html = cardsHTML(tree, toCards(tree), src);
  assert.match(html, /<img src="data:image\/svg\+xml,A" alt="Here"/);
  assert.match(html, /data-figure-edit="a"/);
  assert.match(html, /not in this notebook/);
  const layout = layoutMindMap(tree, measure, { figureSize: (id) => (id === 'a' ? { w: 640, h: 400 } : null) });
  const box = layout.boxes.find((b) => b.node.figure === 'a');
  assert.ok(box.thumb && Math.abs(box.thumb.w / box.thumb.h - 1.6) < 0.05);
  assert.equal(layout.boxes.find((b) => b.node.figure === 'b').thumb, null);
  assert.match(mindMapMarkup(layout, { ink: '#000', paper: '#fff', sheet: '#fff', inkSoft: '#666', highlight: '#ff0', branches: [{ strong: '#111', soft: '#eee' }] }, { hand: 'serif', body: 'sans' }, false, src), /<image href="data:image\/svg\+xml,A"/);
});

test('handwritten pages leave room for a drawing and write its caption under it', () => {
  const entries = notesToEntries('T\n## S\n- ![The fin](fig:a)');
  assert.deepEqual([entries[2].figure, entries[2].text], ['a', 'The fin']);
  const m = paperMetrics('lined', 'letter', 22);
  const pages = layoutPages('T\n## S\n- before\n- ![The fin](fig:a)\n- after', m, 22, (ch, size) => size * 0.5, () => ({ w: 640, h: 400 }));
  const lines = pages[0].lines;
  const fig = lines.find((l) => l.figure);
  assert.ok(fig.figure.w <= m.right - fig.x && fig.figure.h > 200);
  const caption = lines[lines.indexOf(fig) + 1];
  const after = lines[lines.indexOf(fig) + 2];
  assert.equal(caption.text, 'The fin');
  assert.ok(caption.y > fig.figure.y + fig.figure.h && after.y > caption.y);
});

// ---------- Delivering the notebooks with drawings ----------

test('a newer course notebook replaces an unedited copy and sits beside an edited one', () => {
  const v1 = { id: 'n1', text: 'Old one', version: 1 };
  const v2 = { id: 'n1', text: 'New one\n- ![Pic](fig:p1)', version: 2, replaces: [NB.textHash('Old one')], figures: { p1: { w: 100, h: 100, bg: 'plain', graph: '', items: [] } } };
  const fresh = NB.deliverNotebooks({ version: 1, activeId: 'x', documents: [{ id: 'x', text: 'mine' }] }, [v1], []);
  const updated = NB.deliverNotebooks(fresh.library, [v2], fresh.delivered);
  assert.deepEqual([updated.updated.length, updated.added.length], [1, 0]);
  assert.equal(updated.library.documents.find((d) => d.id === 'n1').text, v2.text);
  assert.ok(updated.library.figures.p1);
  assert.equal(NB.deliverNotebooks(updated.library, [v2], updated.delivered).updated.length, 0, 'only once');

  const edited = { version: 1, activeId: 'n1', documents: [{ id: 'n1', text: 'Old one, plus my edits' }] };
  const beside = NB.deliverNotebooks(edited, [v2], ['n1']);
  assert.equal(beside.library.documents[0].text, 'Old one, plus my edits');
  assert.equal(beside.library.documents[1].text.split('\n')[0], 'New one (new version)');
  assert.equal(NB.validLibrary(beside.library), true);

  const deleted = NB.deliverNotebooks({ version: 1, activeId: 'x', documents: [{ id: 'x', text: 'mine' }] }, [v2], ['n1']);
  assert.equal(deleted.added.length + deleted.updated.length, 0, 'a deleted notebook stays deleted');
});

test('every drawing the course notebooks use exists, and every graph reads without errors', () => {
  for (const book of COURSE_NOTES) {
    assert.equal(book.version, 2);
    const used = [...book.text.matchAll(/\]\(fig:([\w-]+)\)/g)].map((m) => m[1]);
    assert.ok(used.length >= 6, book.id);
    assert.deepEqual(used.slice().sort(), Object.keys(book.figures).sort(), book.id);
    for (const [id, fig] of Object.entries(book.figures)) {
      assert.deepEqual(F.parseGraph(fig.graph).errors, [], id);
      assert.deepEqual(F.cleanFigure(fig), fig, id);
      assert.ok(F.figureSVG(fig).length > 1000, id);
    }
  }
});
