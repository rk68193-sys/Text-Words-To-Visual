/*
 * The drawing editor: pen, lines, arrows, boxes, ellipses, text and an eraser over grid paper,
 * a picture, or a math graph written in plain text (see GRAPH_HELP in figure.js).
 *
 * VisualNotes.openDrawing(figure, caption, onSave) opens it; onSave(figure, caption) runs on Save.
 */
(function (root) {
  'use strict';

  const VN = root.VisualNotes;
  const $ = (id) => document.getElementById(id);
  const dialog = $('draw');
  if (!dialog) return;

  const EXAMPLES = {
    fn: 'x: -2pi .. 2pi\ny: -2 .. 2\ny = sin(x) | label sin x\ny = cos(x) | dashed | label cos x',
    level: 'x: -3 .. 3\ny: -3 .. 3\nlevel x^2 + y^2 = 1, 4, 9 | blue\nvector 1,1 -> 2,2 | red | label ∇f',
    slope: 'x: -3 .. 3\ny: -3 .. 3\naxes t, y\nslope x - y\ny = x - 1 + 2e^(-x) | red thick | label a solution',
    vectors: 'x: -1 .. 5\ny: -1 .. 4\npolygon 0,0; 3,1; 4,3; 1,2 | fill blue | label area = |det A|\nvector 0,0 -> 3,1 | red | label a₁\nvector 0,0 -> 1,2 | green | label a₂',
    param: 'x: -2 .. 2\ny: -2 .. 2\nparam cos(t), sin(t) | label unit circle\nparam 2cos(t), sin(t) | red | label ellipse',
    surface: '3d\nx: -2 .. 2\ny: -2 .. 2\nz: 0 .. 8\nsurface z = x^2 + y^2 | levels 1, 2, 4 | floor | label z = x² + y²',
  };
  const SIZES = { wide: [640, 400], square: [560, 560], tall: [480, 640], banner: [800, 340] };

  let fig = null;
  let onSave = null;
  let tool = 'pen';
  let color = VN.FIGURE_PALETTE[0];
  let draft = null; // the item being drawn
  let undo = [];
  let redo = [];
  let dirty = false;
  const snapshot = () => JSON.stringify(fig);

  // ---------- Showing it ----------

  let baseKey = '';
  function renderBase() {
    const key = JSON.stringify([fig.w, fig.h, fig.bg, fig.graph, fig.photo ? fig.photo.length : 0]);
    if (key === baseKey) return;
    baseKey = key;
    $('draw-base').src = VN.figureDataURL(fig, 'base');
    $('draw-stage').style.aspectRatio = `${fig.w} / ${fig.h}`;
    const g = VN.parseGraph(fig.graph);
    $('draw-graph-errors').textContent = fig.graph.trim() ? (g.errors.join(' · ') || 'Graph drawn.') : '';
    $('draw-graph-errors').classList.toggle('bad', g.errors.length > 0);
  }
  function renderItems() {
    const items = draft ? fig.items.concat(draft) : fig.items;
    $('draw-items').innerHTML = VN.figureSVG({ w: fig.w, h: fig.h, items }, 'items');
  }
  function render() {
    renderBase();
    renderItems();
    $('draw-undo').disabled = !undo.length;
    $('draw-redo').disabled = !redo.length;
  }
  function commit(change) {
    undo.push(snapshot());
    if (undo.length > 200) undo.shift();
    redo = [];
    change();
    dirty = true;
    render();
  }

  // ---------- Drawing with the pointer ----------

  const stage = $('draw-stage');
  function at(e) {
    const r = stage.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * fig.w, ((e.clientY - r.top) / r.height) * fig.h];
  }
  const style = () => ({ c: color, sw: Number($('draw-width').value), dash: $('draw-dash').checked || undefined });
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const [x, y] = at(e);
    if (tool === 'erase') {
      let hit = -1;
      let best = 12 * (fig.w / stage.getBoundingClientRect().width);
      fig.items.forEach((it, i) => { const d = VN.itemDistance(it, x, y); if (d <= best) { best = d; hit = i; } });
      if (hit >= 0) commit(() => fig.items.splice(hit, 1));
      return;
    }
    if (tool === 'text') {
      const words = prompt('Text to place here (x^2 and a_1 work):');
      if (words && words.trim()) commit(() => fig.items.push(Object.assign(style(), { t: 'text', x, y, s: words.trim(), size: 12 + Number($('draw-width').value) * 2 })));
      return;
    }
    stage.setPointerCapture(e.pointerId);
    const s = style();
    const fill = $('draw-fill').checked ? color : undefined;
    if (tool === 'pen') draft = Object.assign(s, { t: 'pen', pts: [[x, y]] });
    else if (tool === 'line' || tool === 'arrow') draft = Object.assign(s, { t: 'line', x1: x, y1: y, x2: x, y2: y, arrow: tool === 'arrow' ? 1 : 0 });
    else if (tool === 'rect') draft = Object.assign(s, { t: 'rect', x, y, w: 0, h: 0, fill });
    else if (tool === 'ellipse') draft = Object.assign(s, { t: 'ellipse', cx: x, cy: y, rx: 0, ry: 0, fill, x0: x, y0: y });
    renderItems();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!draft) return;
    const [x, y] = at(e);
    if (draft.t === 'pen') {
      const last = draft.pts[draft.pts.length - 1];
      if (Math.hypot(x - last[0], y - last[1]) >= 2) draft.pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    } else if (draft.t === 'line') {
      // Shift keeps a line flat, upright or at 45°.
      let [x2, y2] = [x, y];
      if (e.shiftKey) {
        const a = Math.round(Math.atan2(y - draft.y1, x - draft.x1) / (Math.PI / 4)) * (Math.PI / 4);
        const len = Math.hypot(x - draft.x1, y - draft.y1);
        x2 = draft.x1 + len * Math.cos(a); y2 = draft.y1 + len * Math.sin(a);
      }
      Object.assign(draft, { x2, y2 });
    } else if (draft.t === 'rect') Object.assign(draft, { w: x - draft.x, h: y - draft.y });
    else if (draft.t === 'ellipse') Object.assign(draft, { cx: (draft.x0 + x) / 2, cy: (draft.y0 + y) / 2, rx: Math.abs(x - draft.x0) / 2, ry: Math.abs(y - draft.y0) / 2 });
    renderItems();
  });
  function finish() {
    if (!draft) return;
    const item = draft;
    draft = null;
    delete item.x0; delete item.y0;
    const tiny = (item.t === 'line' && Math.hypot(item.x2 - item.x1, item.y2 - item.y1) < 3) ||
      (item.t === 'rect' && Math.abs(item.w) < 3 && Math.abs(item.h) < 3) || (item.t === 'ellipse' && item.rx < 2 && item.ry < 2);
    if (tiny) { renderItems(); return; }
    commit(() => fig.items.push(item));
  }
  stage.addEventListener('pointerup', finish);
  stage.addEventListener('pointercancel', finish);

  // ---------- Tools ----------

  document.querySelectorAll('[data-draw-tool]').forEach((b) => b.addEventListener('click', () => {
    tool = b.dataset.drawTool;
    document.querySelectorAll('[data-draw-tool]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    stage.dataset.tool = tool;
  }));
  const swatches = $('draw-swatches');
  for (const c of VN.FIGURE_PALETTE) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.style.background = c; b.dataset.color = c;
    b.setAttribute('aria-label', 'Color ' + c);
    swatches.append(b);
  }
  function setColor(c) {
    color = c;
    $('draw-color').value = c;
    swatches.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.color.toLowerCase() === c.toLowerCase())));
  }
  swatches.addEventListener('click', (e) => { const s = e.target.closest('.swatch'); if (s) setColor(s.dataset.color); });
  $('draw-color').addEventListener('input', () => setColor($('draw-color').value));
  $('draw-width').addEventListener('input', () => { $('draw-width-out').textContent = $('draw-width').value; });

  $('draw-bg').addEventListener('change', () => commit(() => { fig.bg = $('draw-bg').value; }));
  $('draw-size').addEventListener('change', () => commit(() => { [fig.w, fig.h] = SIZES[$('draw-size').value]; delete fig.photo; }));
  $('draw-clear').addEventListener('click', () => { if (fig.items.length && confirm('Remove everything drawn by hand? The graph stays.')) commit(() => { fig.items = []; }); });
  $('draw-undo').addEventListener('click', () => step(undo, redo));
  $('draw-redo').addEventListener('click', () => step(redo, undo));
  function step(from, to) {
    if (!from.length) return;
    to.push(snapshot());
    fig = JSON.parse(from.pop());
    syncControls();
    render();
  }

  let graphTimer = 0;
  $('draw-graph-spec').addEventListener('input', () => {
    clearTimeout(graphTimer);
    graphTimer = setTimeout(() => commit(() => { fig.graph = $('draw-graph-spec').value; }), 250);
  });
  $('draw-graph-example').addEventListener('change', () => {
    const spec = EXAMPLES[$('draw-graph-example').value];
    $('draw-graph-example').value = '';
    if (!spec) return;
    if (fig.graph.trim() && !confirm('Replace the graph you have with this example?')) return;
    $('draw-graph-spec').value = spec;
    commit(() => { fig.graph = spec; });
  });
  $('draw-graph-help').textContent = VN.GRAPH_HELP;

  // A picture is shrunk to at most 1200 pixels across and kept as JPEG, so notes stay small.
  $('draw-photo').addEventListener('click', () => $('draw-photo-file').click());
  $('draw-photo-file').addEventListener('change', async () => {
    const file = $('draw-photo-file').files[0];
    $('draw-photo-file').value = '';
    if (!file) return;
    try {
      const url = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
      const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('That file is not a picture this browser can open.')); i.src = url; });
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/jpeg', 0.82);
      const w = Math.min(800, canvas.width);
      commit(() => { fig.photo = photo; fig.w = w; fig.h = Math.round((w * canvas.height) / canvas.width); fig.bg = 'plain'; });
    } catch (err) {
      alert(err.message || 'That picture could not be used.');
    }
  });

  // ---------- Opening, saving, leaving ----------

  function syncControls() {
    $('draw-bg').value = fig.bg;
    $('draw-graph-spec').value = fig.graph;
    const size = Object.entries(SIZES).find(([, s]) => s[0] === fig.w && s[1] === fig.h);
    $('draw-size').value = size ? size[0] : '';
  }
  function close() {
    dirty = false;
    if (dialog.open) dialog.close();
  }
  $('draw-save').addEventListener('click', () => {
    clearTimeout(graphTimer);
    fig.graph = $('draw-graph-spec').value;
    const done = onSave;
    const result = VN.cleanFigure(fig);
    const caption = $('draw-caption').value.trim() || 'Drawing';
    close();
    if (done) done(result, caption);
  });
  $('draw-cancel').addEventListener('click', () => { if (!dirty || confirm('Leave without saving this drawing?')) close(); });
  dialog.addEventListener('cancel', (e) => { if (dirty && !confirm('Leave without saving this drawing?')) e.preventDefault(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.target.matches('textarea, input[type="text"]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) step(redo, undo); else step(undo, redo); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); step(redo, undo); }
  });

  VN.openDrawing = function (figure, caption, save, { pickPhoto = false } = {}) {
    fig = JSON.parse(JSON.stringify(figure || VN.newFigure()));
    fig.items = fig.items || [];
    fig.graph = fig.graph || '';
    onSave = save;
    undo = []; redo = []; draft = null; dirty = false; baseKey = '';
    $('draw-caption').value = caption || '';
    syncControls();
    setColor(color);
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    render();
    if (pickPhoto) $('draw-photo-file').click();
  };
})(typeof self !== 'undefined' ? self : this);
