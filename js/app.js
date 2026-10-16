/* The page: the notes box, the two views, the map controls and saving pictures. */
(function () {
  'use strict';

  const VN = window.VisualNotes;
  const $ = (id) => document.getElementById(id);
  const KEYS = { view: 'tn2vn.view', oneSide: 'tn2vn.oneSide', settings: 'tn2vn.settings', delivered: 'tn2vn.delivered' };
  const VIEWS = ['map', 'cards', 'practice', 'page'];
  const HW = window.Handwriter;

  // Browser storage can be missing or blocked (private windows); the app still works without it.
  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* not saved; nothing else to do */
    }
  }

  const el = {
    notes: $('notes'),
    status: $('status'),
    mapView: $('map-view'),
    map: $('map'),
    camera: $('camera'),
    cardsView: $('cards-view'),
    examples: $('examples'),
    savePng: $('save-png'),
    saveSvg: $('save-svg'),
    zoomIn: $('zoom-in'),
    zoomOut: $('zoom-out'),
    fit: $('fit'),
    oneSide: $('one-side'),
    unfold: $('unfold'),
    toast: $('toast'),
    toastText: $('toast-text'),
    toastUndo: $('toast-undo'),
  };

  const state = {
    view: VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : (VIEWS.includes(load(KEYS.view, 'map')) ? load(KEYS.view, 'map') : 'map'),
    // null means "pick for me": one side on narrow screens, both sides otherwise.
    oneSide: { true: true, false: false }[load(KEYS.oneSide, '')] ?? null,
    lastOneSide: null,
    collapsed: new Set(),
    tree: null,
    layout: null,
    cam: { x: 0, y: 0, k: 1 },
    userMoved: false, // once you pan or zoom, typing no longer re-centers the map
    focusKey: null, // a branch shown on its own, or null for the whole map
    autoFold: true, // a notebook just opened: fold a big one down to its sections
  };

  const HEX = /^#[0-9a-f]{6}$/i;
  const colorOf = (table, id) => (table[id] ? table[id].color : HEX.test(id) ? id : null);

  // Reader preferences, kept together in one browser key.
  const DEFAULT_SETTINGS = {
    theme: 'light', lettering: 'print', textSize: 100, shuffle: false, arrows: true,
    hw: { font: 'caveat', pen: 'ballpoint', ink: 'blue', accent: 'red', highlight: 'yellow', paper: 'lined', pageSize: 'letter', size: 22, messiness: 45, seed: 20261016 },
  };
  const settings = (() => {
    let saved = {};
    try { saved = JSON.parse(load(KEYS.settings, '{}')) || {}; } catch (e) { saved = {}; }
    const merged = Object.assign({}, DEFAULT_SETTINGS, saved, { hw: Object.assign({}, DEFAULT_SETTINGS.hw, saved.hw) });
    if (!saved.theme && ['light', 'dark'].includes(load('tn2vn.theme', ''))) merged.theme = load('tn2vn.theme', 'light');
    const hw = merged.hw;
    if (!HW.FONTS[hw.font]) hw.font = DEFAULT_SETTINGS.hw.font;
    if (!HW.PENS[hw.pen]) hw.pen = DEFAULT_SETTINGS.hw.pen;
    // A color is one of the named inks or any #rrggbb picked on the color wheel.
    if (!HW.INKS[hw.ink] && !HEX.test(hw.ink)) hw.ink = DEFAULT_SETTINGS.hw.ink;
    if (hw.accent !== 'same' && !HW.INKS[hw.accent] && !HEX.test(hw.accent)) hw.accent = DEFAULT_SETTINGS.hw.accent;
    if (!HW.HIGHLIGHTERS[hw.highlight] && !HEX.test(hw.highlight)) hw.highlight = DEFAULT_SETTINGS.hw.highlight;
    if (!VN.PAPERS[hw.paper]) hw.paper = DEFAULT_SETTINGS.hw.paper;
    if (!VN.PAGE_SIZES[hw.pageSize]) hw.pageSize = DEFAULT_SETTINGS.hw.pageSize;
    hw.size = Math.min(34, Math.max(16, Number(hw.size) || 22));
    hw.messiness = Math.min(100, Math.max(0, Number(hw.messiness) || 0));
    if (merged.lettering !== 'print' && !HW.FONTS[merged.lettering]) merged.lettering = 'print';
    merged.textSize = Math.min(150, Math.max(80, Number(merged.textSize) || 100));
    return merged;
  })();
  function saveSettings() { save(KEYS.settings, JSON.stringify(settings)); }

  Object.assign(el, {
    practiceView: $('practice-view'), inspector: $('idea-inspector'), selectedText: $('selected-text'),
    foldSelected: $('fold-selected'), saveStatus: $('save-status')
  });
  const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
  const initialLibrary = VN.readLibrary(storage, VN.EXAMPLES.photosynthesis.text);
  const library = initialLibrary.library;
  let expectedRaw = initialLibrary.raw;
  let storageBlocked = initialLibrary.blocked;
  let practice = null;
  let practiceSource = null;
  let practiceUnanswered = 0;
  let practiceInbox = [];
  let selectedKey = null;
  const activeDoc = () => library.documents.find(d => d.id === library.activeId);

  // ---------- Drawings, kept with the notebooks in library.figures ----------
  const figures = () => library.figures || (library.figures = {});
  const srcCache = new WeakMap();
  function figureSrc(id) {
    const fig = figures()[id];
    if (!fig) return null;
    let url = srcCache.get(fig);
    if (!url) { url = VN.figureDataURL(fig); srcCache.set(fig, url); }
    return url;
  }
  const figureSize = (id) => { const fig = figures()[id]; return fig ? { w: fig.w, h: fig.h } : null; };
  const imageCache = new WeakMap();
  function figureImage(id) {
    const fig = figures()[id];
    if (!fig) return null;
    let img = imageCache.get(fig);
    if (!img) { img = new Image(); img.src = figureSrc(id); imageCache.set(fig, img); }
    return img;
  }
  const figuresIn = (text) => [...String(text).matchAll(/\]\(fig:([\w-]{1,64})\)/g)].map(m => m[1]);
  // Canvas drawing (pages, PNG) needs the pictures loaded first.
  function preloadFigures(ids) {
    return Promise.all(ids.map(id => {
      const img = figureImage(id);
      if (!img || (img.complete && img.naturalWidth)) return null;
      return new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); });
    }));
  }
  function mergeFigures(more) {
    for (const [id, fig] of Object.entries(more || {})) {
      const clean = VN.cleanFigure(fig);
      if (clean && !figures()[id]) figures()[id] = clean;
    }
  }

  function storageWarning(message) {
    $('storage-message').textContent = message;
    $('storage-banner').hidden = false;
    el.saveStatus.textContent = 'Not saved — download a backup';
  }
  function persistLibrary() {
    if (storageBlocked) return false;
    const result = VN.writeLibrary(storage, library, expectedRaw);
    if (!result.ok) {
      if (result.conflict) storageBlocked = true;
      storageWarning(result.error);
      return false;
    }
    expectedRaw = result.raw;
    $('storage-banner').hidden = true;
    el.saveStatus.textContent = 'Saved on this browser';
    return true;
  }
  let saveTimer = 0;
  function saveNotebook() {
    clearTimeout(saveTimer);
    saveTimer = 0;
    if (activeDoc().text !== el.notes.value) {
      activeDoc().text = el.notes.value;
      activeDoc().updatedAt = new Date().toISOString();
    }
    persistLibrary();
    renderShelf();
  }
  // Typing saves shortly after you pause, instead of rewriting storage on every key.
  function saveSoon() {
    if (!storageBlocked) el.saveStatus.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNotebook, 400);
  }
  window.addEventListener('pagehide', () => { if (saveTimer) saveNotebook(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveTimer) saveNotebook(); });
  function renderShelf() {
    const shelf = $('notebook-list');
    shelf.replaceChildren();
    const shown = new Set(VN.searchNotebooks(library, $('notebook-search').value));
    library.documents.forEach((doc, i) => {
      if (!shown.has(doc)) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'notebook-tab';
      b.setAttribute('aria-current', doc.id === library.activeId ? 'page' : 'false');
      const number = document.createElement('span');
      number.textContent = String(i + 1).padStart(2, '0');
      b.append(number, document.createTextNode(VN.titleOf(doc)));
      b.addEventListener('click', () => openNotebook(doc.id));
      shelf.append(b);
    });
  }
  function resetBoard() {
    clearTimeout(pending);
    state.collapsed.clear(); state.userMoved = false; state.focusKey = null; state.autoFold = true;
    selectedKey = null; el.inspector.hidden = true;
    practice = null; practiceSource = null;
  }
  function openNotebook(id) {
    if (id === library.activeId) return;
    saveNotebook(); library.activeId = id;
    el.notes.value = activeDoc().text;
    resetBoard(); persistLibrary(); renderShelf(); render();
  }
  function addNotebooks(texts, activeIndex = 0) {
    saveNotebook();
    const docs = texts.map(text => VN.notebook(text));
    library.documents.push(...docs);
    library.activeId = docs[activeIndex].id;
    el.notes.value = activeDoc().text;
    resetBoard(); persistLibrary(); renderShelf(); render();
  }
  $('new-notebook').addEventListener('click', () => { $('notebook-search').value = ''; addNotebooks(['']); el.notes.focus(); });
  function replaceLibrary(next) {
    library.documents = next.documents;
    library.activeId = next.activeId;
    el.notes.value = activeDoc().text;
    resetBoard(); persistLibrary(); renderShelf(); render();
  }
  $('duplicate-notebook').addEventListener('click', () => {
    saveNotebook();
    replaceLibrary(VN.duplicateNotebook(library, library.activeId));
    showToast(`Made a copy: “${VN.titleOf(activeDoc())}”.`);
  });
  $('delete-notebook').addEventListener('click', () => {
    saveNotebook();
    const result = VN.removeNotebook(library, library.activeId);
    if (!result) return;
    replaceLibrary(result.library);
    showToast(`Removed “${VN.titleOf(result.removed)}”.`, () => {
      saveNotebook();
      replaceLibrary(VN.restoreNotebook(library, result.removed, result.index));
      showToast('Notebook restored.');
    });
  });
  $('notebook-search').addEventListener('input', renderShelf);
  $('notebook-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = $('notebook-list').querySelector('.notebook-tab');
      if (first) first.click();
    } else if (e.key === 'Escape') {
      $('notebook-search').value = ''; renderShelf(); el.notes.focus();
    }
  });
  window.addEventListener('storage', e => {
    if (e.key === VN.LIBRARY_KEY || e.key === null) {
      storageBlocked = true;
      storageWarning('Another tab changed browser storage. Download your backup, then reload to use the saved version.');
    }
  });
  window.addEventListener('beforeunload', e => {
    if (!$('storage-banner').hidden) { e.preventDefault(); e.returnValue = ''; }
  });

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function setTheme(choice) {
    settings.theme = choice; saveSettings();
    const theme = choice === 'system' ? (systemDark.matches ? 'dark' : 'light') : choice;
    document.documentElement.dataset.theme = theme;
    $('theme').textContent = theme === 'dark' ? 'Daylight' : 'Evening';
    $('theme').setAttribute('aria-label', theme === 'dark' ? 'Switch to daylight theme' : 'Switch to evening theme');
    $('set-theme').value = choice;
  }
  $('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  if (systemDark.addEventListener) systemDark.addEventListener('change', () => { if (settings.theme === 'system') setTheme('system'); });

  // ---------- Theme and fonts, read from the CSS so the map matches the page ----------

  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name) => cs.getPropertyValue(name).trim();
    return {
      paper: v('--paper'),
      sheet: v('--sheet'),
      ink: v('--ink'),
      inkSoft: v('--ink-soft'),
      highlight: v('--highlight'),
      branches: [1, 2, 3, 4, 5, 6].map((i) => ({ strong: v(`--b${i}`), soft: v(`--b${i}-soft`) })),
    };
  }

  function readFonts() {
    const cs = getComputedStyle(document.documentElement);
    const print = cs.getPropertyValue('--font-hand').trim();
    const face = HW.FONTS[settings.lettering];
    return { hand: face ? `"${face.family}", ${print}` : print, body: cs.getPropertyValue('--font-body').trim() };
  }
  // Canvas measuring needs a web font to be loaded first, or widths come out wrong.
  function loadFace(family) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load(`24px "${family}"`).catch(() => {});
  }
  function applyLettering() {
    const face = HW.FONTS[settings.lettering];
    return (face ? loadFace(face.family) : Promise.resolve()).then(() => {
      fonts = readFonts();
      widths.clear();
      if (state.tree) render();
    });
  }

  let fonts = readFonts();
  const measureCtx = document.createElement('canvas').getContext('2d');
  const widths = new Map();
  function measure(text, font) {
    const css = `${font.weight || 400} ${font.size}px ${fonts[font.family]}`;
    const key = `${css}|${text}`;
    let w = widths.get(key);
    if (w === undefined) {
      measureCtx.font = css;
      w = measureCtx.measureText(text).width;
      if (widths.size > 3000) widths.clear();
      widths.set(key, w);
    }
    return w;
  }

  // ---------- Drawing ----------

  // A long notebook opens on the map as its sections and sub-sections, each showing how many
  // ideas it holds; select one to unfold it, or press Unfold for everything.
  const FOLD_OVER = 60;
  function foldBigNotebook() {
    state.autoFold = false;
    if (state.tree.count <= FOLD_OVER) return;
    for (const branch of state.tree.root.children) for (const node of branch.children) if (node.children.length) state.collapsed.add(node.key);
  }

  function render() {
    state.tree = VN.parseNotes(el.notes.value);
    if (state.autoFold) foldBigNotebook();
    renderGuides();
    renderJumpList();
    const branches = state.tree.root.children.length;
    el.status.textContent = `${state.tree.count} ${state.tree.count === 1 ? 'idea' : 'ideas'} · ${branches} ${branches === 1 ? 'branch' : 'branches'}`;
    const deck = VN.studyCards(state.tree);
    $('practice-count').textContent = deck.cards.length;
    if (practiceSource !== el.notes.value || !practice) {
      practice = VN.startPractice(deck.cards, { shuffle: settings.shuffle ? Math.random : null });
      practiceSource = el.notes.value;
      practiceUnanswered = deck.unanswered;
      practiceInbox = deck.unansweredList;
    }
    if (state.view === 'map') renderMap();
    else if (state.view === 'cards') renderCards();
    else if (state.view === 'practice') renderPractice();
    else renderPages();
  }

  function oneSideNow() {
    return state.oneSide ?? el.map.getBoundingClientRect().width < 640;
  }

  function renderMap(focusKey) {
    const theme = readTheme();
    const oneSide = oneSideNow();
    state.lastOneSide = oneSide;
    el.oneSide.setAttribute('aria-pressed', String(oneSide));
    state.layout = VN.layoutMindMap(mapTree(), measure, { collapsed: state.collapsed, oneSide, textScale: settings.textSize / 100, figureSize });
    el.camera.innerHTML = VN.mindMapMarkup(state.layout, theme, fonts, true, figureSrc);
    el.unfold.disabled = state.collapsed.size === 0;
    $('map-tip').textContent = state.collapsed.size ? 'Folded branches show +ideas inside. Select one, then Unfold branch, or press Unfold for all.' : 'Select an idea to find its words. Drag to wander.';
    if (state.userMoved) applyCamera();
    else fitCamera();
    if (selectedKey) updateSelection();
    if (focusKey) {
      const target = [...el.camera.querySelectorAll('[data-key]')].find((g) => g.dataset.key === focusKey);
      if (target) target.focus();
    }
  }

  function findNode(node, key) {
    if (node.key === key) return node;
    for (const child of node.children) {
      const hit = findNode(child, key);
      if (hit) return hit;
    }
    return null;
  }
  // The whole tree, or just the focused branch drawn as if it were the main topic.
  function mapTree() {
    const focus = state.focusKey && findNode(state.tree.root, state.focusKey);
    if (state.focusKey && !focus) state.focusKey = null;
    $('focus-bar').hidden = !focus;
    if (focus) $('focus-label').textContent = 'Focused on “' + focus.text + '”';
    return focus ? { title: focus.text, root: focus } : state.tree;
  }
  function setFocus(key) {
    state.focusKey = key;
    state.userMoved = false;
    if (key) state.collapsed.delete(key);
    renderMap();
    el.map.focus();
  }

  function renderCards() {
    el.cardsView.innerHTML = VN.cardsHTML(state.tree, VN.toCards(state.tree), figureSrc);
  }

  let pending = 0;
  function renderSoon() {
    clearTimeout(pending);
    pending = setTimeout(render, 120);
  }

  // ---------- Camera: pan and zoom ----------

  function applyCamera() {
    const { x, y, k } = state.cam;
    el.camera.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
    $('zoom-label').textContent = Math.round(k * 100) + '%';
  }

  function fitCamera() {
    if (!state.layout) return;
    const rect = el.map.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const b = state.layout.bounds;
    const pad = 24;
    const top = state.focusKey ? 74 : 34; // room for the tip line (and the focus bar)
    const bottom = 100; // room for the buttons
    const availW = rect.width - pad * 2;
    const availH = rect.height - top - bottom;
    // Overview shows the whole map; zoom and the Move controls make details reachable.
    const k = Math.max(Number.EPSILON, Math.min(availW / b.width, availH / b.height, 1.15));
    state.cam.k = k;
    state.cam.x = b.width * k <= availW ? rect.width / 2 - (b.minX + b.width / 2) * k : pad - b.minX * k;
    state.cam.y = b.height * k <= availH ? top + availH / 2 - (b.minY + b.height / 2) * k : top - b.minY * k;
    applyCamera();
  }

  function zoomAt(px, py, factor) {
    const cam = state.cam;
    const k = Math.min(4, Math.max(0.08, cam.k * factor));
    cam.x = px - (px - cam.x) * (k / cam.k);
    cam.y = py - (py - cam.y) * (k / cam.k);
    cam.k = k;
    state.userMoved = true;
    applyCamera();
  }

  function zoomCenter(factor) {
    const rect = el.map.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
  }

  const pointers = new Map();
  let dragged = false;
  let pinch = null;

  function localPoint(e) {
    const rect = el.map.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  el.map.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { start: localPoint(e), last: localPoint(e) });
    dragged = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()].map((p) => p.last);
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    }
  });

  el.map.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const now = localPoint(e);
    if (!dragged && Math.hypot(now.x - p.start.x, now.y - p.start.y) > 4) {
      dragged = true;
      el.map.setPointerCapture(e.pointerId);
      el.map.classList.add('is-dragging');
    }
    if (dragged && pointers.size === 1) {
      state.cam.x += now.x - p.last.x;
      state.cam.y += now.y - p.last.y;
      state.userMoved = true;
      applyCamera();
    }
    p.last = now;
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()].map((q) => q.last);
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      state.cam.x += mid.x - pinch.mid.x;
      state.cam.y += mid.y - pinch.mid.y;
      if (pinch.dist > 0) zoomAt(mid.x, mid.y, dist / pinch.dist);
      pinch = { dist, mid };
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) el.map.classList.remove('is-dragging');
  }
  el.map.addEventListener('pointerup', endPointer);
  el.map.addEventListener('pointercancel', endPointer);

  el.map.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const p = localPoint(e);
    zoomAt(p.x, p.y, Math.exp(-e.deltaY * scale * 0.0015));
  }, { passive: false });

  // Clicking (not dragging) a box folds or unfolds its branch.
  function toggleBranch(key) {
    if (state.collapsed.has(key)) state.collapsed.delete(key);
    else state.collapsed.add(key);
    renderMap(key);
  }

  el.map.addEventListener('click', (e) => {
    if (dragged) return;
    const target = e.target.closest('[data-key]');
    if (target) selectIdea(target.dataset.key);
  });

  el.map.addEventListener('keydown', (e) => {
    const target = e.target.closest && e.target.closest('[data-key]');
    if (target && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      selectIdea(target.dataset.key);
    }
  });

  function selectIdea(key) {
    selectedKey = key;
    updateSelection();
  }
  function updateSelection() {
    const box = state.layout.boxes.find(b => b.key === selectedKey);
    if (!box) { el.inspector.hidden = true; return; }
    el.inspector.hidden = false;
    el.selectedText.textContent = box.node.text;
    el.foldSelected.hidden = !box.collapsible;
    $('focus-selected').hidden = box.depth === 0 || !box.node.children.length;
    $('edit-figure').hidden = box.node.kind !== 'figure';
    el.foldSelected.textContent = box.hidden ? 'Unfold branch' : 'Fold branch';
    el.camera.querySelectorAll('[data-key]').forEach(g => {
      g.classList.toggle('is-selected', g.dataset.key === selectedKey);
      g.setAttribute('aria-pressed', String(g.dataset.key === selectedKey));
    });
  }
  function jumpToSource(line) {
    if (!Number.isInteger(Number(line)) || Number(line) < 1) return;
    const lines = el.notes.value.split('\n');
    const start = lines.slice(0, Number(line) - 1).reduce((n, text) => n + text.length + 1, 0);
    el.notes.focus();
    el.notes.setSelectionRange(start, start + (lines[Number(line) - 1] || '').length);
    el.notes.scrollTop = Math.max(0, (Number(line) - 3) * 29);
    el.notes.scrollIntoView({ block: 'nearest' });
  }
  $('edit-source').addEventListener('click', () => {
    const box = state.layout.boxes.find(b => b.key === selectedKey);
    if (box) jumpToSource(box.node.sourceLine);
  });
  $('focus-selected').addEventListener('click', () => { if (selectedKey) setFocus(selectedKey); });
  $('edit-figure').addEventListener('click', () => {
    const box = state.layout.boxes.find(b => b.key === selectedKey);
    if (box && box.node.kind === 'figure') editFigure(box.node.figure);
  });
  $('leave-focus').addEventListener('click', () => setFocus(null));
  el.foldSelected.addEventListener('click', () => {
    if (selectedKey) toggleBranch(selectedKey);
    el.foldSelected.focus();
  });
  $('close-inspector').addEventListener('click', () => {
    selectedKey = null; el.inspector.hidden = true;
    el.camera.querySelectorAll('.is-selected').forEach(g => { g.classList.remove('is-selected'); g.setAttribute('aria-pressed', 'false'); });
    el.map.focus();
  });
  el.cardsView.addEventListener('click', e => {
    const edit = e.target.closest('[data-figure-edit]');
    if (edit) { editFigure(edit.dataset.figureEdit); return; }
    const button = e.target.closest('[data-source-line]');
    if (button) jumpToSource(button.dataset.sourceLine);
  });
  function pan(direction) {
    const deltas = { up: [0, 85], down: [0, -85], left: [85, 0], right: [-85, 0] };
    const [x, y] = deltas[direction];
    state.cam.x += x; state.cam.y += y;
    state.userMoved = true; applyCamera();
  }
  document.querySelectorAll('[data-pan]').forEach(b => b.addEventListener('click', () => pan(b.dataset.pan)));
  el.map.addEventListener('keydown', e => {
    const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (dirs[e.key]) { e.preventDefault(); pan(dirs[e.key]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomCenter(1.25); }
    else if (e.key === '-') { e.preventDefault(); zoomCenter(.8); }
    else if (e.key === 'Home') { e.preventDefault(); state.userMoved = false; fitCamera(); }
    else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && selectedKey && selectedKey !== state.focusKey) {
      const box = state.layout.boxes.find(b => b.key === selectedKey);
      if (box && box.depth > 0 && box.node.children.length) { e.preventDefault(); setFocus(selectedKey); }
    } else if (e.key === 'Escape' && state.focusKey) { e.preventDefault(); setFocus(null); }
  });

  el.zoomIn.addEventListener('click', () => zoomCenter(1.25));
  el.zoomOut.addEventListener('click', () => zoomCenter(0.8));
  el.fit.addEventListener('click', () => {
    state.userMoved = false;
    fitCamera();
  });
  el.oneSide.addEventListener('click', () => {
    state.oneSide = !oneSideNow();
    save(KEYS.oneSide, String(state.oneSide));
    state.userMoved = false;
    renderMap();
  });
  el.unfold.addEventListener('click', () => {
    state.collapsed.clear();
    renderMap();
  });

  new ResizeObserver(() => {
    if (state.view !== 'map' || !state.tree) return;
    if (oneSideNow() !== state.lastOneSide) renderMap();
    else if (!state.userMoved) fitCamera();
  }).observe(el.map);

  // ---------- Views ----------

  function setView(view) {
    state.view = view;
    save(KEYS.view, view);
    document.querySelectorAll('.view-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    el.mapView.hidden = view !== 'map';
    el.cardsView.hidden = view !== 'cards';
    el.practiceView.hidden = view !== 'practice';
    $('page-view').hidden = view !== 'page';
    el.inspector.hidden = view !== 'map' || !selectedKey;
    const titles = { map: 'The shape of your thinking.', cards: 'The pieces, in place.', practice: 'What stayed with you?', page: 'In your own hand.' };
    const captions = { map: 'One idea leads to another.', cards: 'Read it through. Follow a source ↗ to edit.', practice: 'Try to remember before you reveal. Then check your notes.', page: 'Pick a pen and paper, then download the pages as a PDF.' };
    $('visual-title').textContent = titles[view];
    $('board-caption').textContent = captions[view];
    render();
  }
  document.querySelectorAll('.view-switch button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  // ---------- Saving pictures of the map ----------

  function fileName(ext) {
    const slug = state.tree.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${slug || 'visual-notes'}-mind-map.${ext}`;
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    $('export-menu').open = false;
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  el.saveSvg.addEventListener('click', () => {
    const svg = VN.mindMapSVGFile(freshExportLayout(), readTheme(), fonts, 40, figureSrc);
    download(new Blob([svg], { type: 'image/svg+xml' }), fileName('svg'));
  });

  el.savePng.addEventListener('click', async () => {
    await preloadFigures(figuresIn(el.notes.value));
    let canvas;
    try { canvas = VN.mindMapCanvas(freshExportLayout(), readTheme(), fonts, { figureImage }); }
    catch (e) { showToast('This map could not be saved as a PNG. Try SVG instead.'); return; }
    canvas.toBlob((blob) => {
      if (blob) download(blob, fileName('png'));
      else showToast('That map is too big to save as a PNG. Try Save SVG instead.');
    }, 'image/png');
  });

  // ---------- File portability and source-grounded practice ----------
  function freshExportLayout() {
    clearTimeout(pending);
    render();
    return VN.layoutMindMap(state.view === 'map' ? mapTree() : state.tree, measure, {
      collapsed: state.collapsed,
      oneSide: state.oneSide ?? state.lastOneSide ?? window.innerWidth < 900,
      textScale: settings.textSize / 100,
      figureSize,
    });
  }
  function noteSlug() {
    return VN.titleOf(activeDoc()).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 80) || 'notes';
  }
  function backupLibrary() {
    activeDoc().text = el.notes.value;
    download(new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' }), 'fieldnotes-backup.json');
    $('export-menu').open = false;
  }
  $('save-backup').addEventListener('click', backupLibrary);
  $('backup-warning').addEventListener('click', backupLibrary);
  $('save-md').addEventListener('click', () => {
    download(new Blob([el.notes.value], { type: 'text/markdown;charset=utf-8' }), noteSlug() + '.md');
    $('export-menu').open = false;
  });
  $('import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async () => {
    const file = $('import-file').files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a notes file under 2 MB.');
      const text = await file.text();
      if (/\.json$/i.test(file.name)) {
        const imported = JSON.parse(text);
        if (!VN.validLibrary(imported)) throw new Error('This is not a Fieldnotes notebook backup.');
        mergeFigures(imported.figures);
        addNotebooks(imported.documents.map(d => d.text), imported.documents.findIndex(d => d.id === imported.activeId));
        showToast('Imported notebooks were added to your desk.');
      } else if (/\.(md|txt)$/i.test(file.name)) {
        addNotebooks([text]); showToast('Imported as a new notebook.');
      } else throw new Error('Choose a .md, .txt, or Fieldnotes .json file.');
    } catch (e) { showToast(e.message || 'This file could not be imported.'); }
    $('import-file').value = '';
  });
  $('print').addEventListener('click', () => {
    clearTimeout(pending); state.tree = VN.parseNotes(el.notes.value); renderCards();
    $('export-menu').open = false; window.print();
  });
  function inboxHTML() {
    if (!practiceInbox.length) return '';
    const esc = VN.esc;
    return '<section class="inbox" aria-label="Questions without answers"><h3>Questions still waiting for an answer</h3><p class="context">Indent an answer under each one and it joins your practice set.</p><ul>' +
      practiceInbox.map(q => '<li><span>' + VN.mathHTML(q.text) + '</span><button type="button" class="btn quiet" data-practice="source" data-line="' + q.sourceLine + '">Answer it ↗</button></li>').join('') + '</ul></section>';
  }
  // An answer can hold a drawing line; it is shown as the picture.
  function richHTML(text) {
    return String(text).split('\n').map(line => {
      const m = VN.FIGURE_LINE.exec(line.trim().replace(/^(?:[-*+•]|\d{1,3}[.)])\s+/, ''));
      const src = m && figureSrc(m[2]);
      return src ? `<img class="practice-fig" src="${VN.esc(src)}" alt="${VN.esc(m[1])}">` : VN.mathHTML(line);
    }).join('\n');
  }
  function renderPractice() {
    const esc = VN.esc;
    const math = VN.mathHTML;
    const card = practice.queue[0];
    const total = VN.studyCards(state.tree).cards.length;
    if (!total) {
      el.practiceView.innerHTML = '<div class="practice-sheet"><span class="eyebrow">MAKE SOMETHING TO REMEMBER</span><h2>A little structure goes a long way.</h2><p>Add a definition such as <strong>ATP: energy currency of the cell</strong>, a formula like <strong>F = ma</strong>, a sequence like <strong>A → B → C</strong>, or a question with an indented answer.</p><button type="button" class="btn primary" data-practice="write">Back to your words ↗</button></div>' + inboxHTML() + '<p class="practice-note">Practice uses only answers you have written. Questions without an answer stay in your notes.</p>';
      return;
    }
    if (!card) {
      const missed = practice.missed || [];
      el.practiceView.innerHTML = '<div class="practice-sheet"><span class="eyebrow">A GOOD PLACE TO PAUSE</span><h2>You worked through this set.</h2><p>You marked ' + practice.remembered + ' cards as remembered across ' + practice.attempts + ' attempts. That is your own check-in, not a mastery score.</p>' +
        (missed.length ? '<p class="context">' + missed.length + ' card' + (missed.length === 1 ? '' : 's') + ' needed another look: ' + missed.slice(0, 4).map(c => '“' + VN.mathHTML(c.prompt) + '”').join(', ') + (missed.length > 4 ? '…' : '') + '</p>' : '') +
        '<div class="practice-actions">' + (missed.length ? '<button type="button" class="btn primary" data-practice="missed">Practice the ' + missed.length + ' I missed</button>' : '') +
        '<button type="button" class="btn' + (missed.length ? '' : ' primary') + '" data-practice="restart">Try the whole set again</button><button type="button" class="btn" data-practice="map">Return to the map</button></div></div>' +
        inboxHTML() + '<p class="practice-note">Come back after a break and try to retrieve the ideas again.</p>';
      return;
    }
    el.practiceView.innerHTML =
      '<div class="practice-heading"><span>' + practice.queue.length + ' left · ' + practice.remembered + ' remembered</span><div class="practice-tools"><button class="btn quiet" type="button" data-practice="shuffle">' + (settings.shuffle ? 'In order' : 'Shuffle') + '</button><button class="btn quiet" type="button" data-practice="restart">Start over</button></div></div>' +
      '<article class="practice-sheet"><span class="eyebrow">' + esc(card.kind) + '</span><p class="context">' + math(card.branch) + '</p><h2>' + math(card.prompt) + '</h2>' +
      (card.context ? '<p class="context">So far: ' + math(card.context) + '</p>' : '') +
      (practice.revealed ? '<div class="recall-answer" role="status">' + richHTML(card.answer) + '</div><div class="practice-actions"><button class="btn" type="button" data-practice="again">Need another look</button><button class="btn primary" type="button" data-practice="known">I remembered</button></div><p class="practice-keys"><kbd>1</kbd> need another look · <kbd>2</kbd> I remembered</p>' :
        '<p class="context">Take a moment. Say it, sketch it, or write it from memory.</p><div class="practice-actions"><button class="btn primary" type="button" data-practice="reveal">Reveal answer</button></div><p class="practice-keys"><kbd>Space</kbd> reveals the answer</p>') +
      '</article><p class="practice-note">Answer from your notes · <button type="button" class="btn quiet" data-practice="source">Edit source ↗</button></p>' + inboxHTML();
  }
  function practiceAction(action, line) {
    if (action === 'source') { jumpToSource(line || practice.queue[0]?.sourceLine); return; }
    if (action === 'write') { el.notes.focus(); el.notes.scrollIntoView({ block: 'nearest' }); return; }
    if (action === 'map') { setView('map'); return; }
    const shuffle = settings.shuffle ? Math.random : null;
    if (action === 'restart') practice = VN.startPractice(VN.studyCards(state.tree).cards, { shuffle });
    else if (action === 'missed') practice = VN.startPractice(practice.missed || [], { shuffle });
    else if (action === 'shuffle') {
      settings.shuffle = !settings.shuffle; saveSettings(); $('set-shuffle').checked = settings.shuffle;
      practice = VN.startPractice(VN.studyCards(state.tree).cards, { shuffle: settings.shuffle ? Math.random : null });
    } else if (action === 'reveal') practice.revealed = true;
    else practice = VN.ratePractice(practice, action);
    renderPractice();
    const focus = el.practiceView.querySelector('[data-practice="' + (practice.revealed ? 'known' : 'reveal') + '"]') ||
      el.practiceView.querySelector('[data-practice="missed"]') || el.practiceView.querySelector('[data-practice="restart"]');
    if (focus) focus.focus();
  }
  el.practiceView.addEventListener('click', e => {
    const button = e.target.closest('[data-practice]');
    if (button) practiceAction(button.dataset.practice, button.dataset.line);
  });

  // ---------- Notes box ----------

  // Uses the browser's own insert so Ctrl+Z still works after our edits.
  function insertText(text) {
    el.notes.focus();
    let ok = false;
    try { ok = text ? document.execCommand('insertText', false, text) : document.execCommand('delete'); } catch (e) { /* use textarea fallback */ }
    if (!ok) {
      el.notes.setRangeText(text, el.notes.selectionStart, el.notes.selectionEnd, 'end');
      el.notes.dispatchEvent(new Event('input'));
    }
  }

  function lineStartOf(value, pos) {
    return value.lastIndexOf('\n', pos - 1) + 1;
  }

  // The lines the selection touches, by index. A selection ending at the start of a line leaves that line out.
  function selectedLines() {
    const { value, selectionStart: start, selectionEnd: end } = el.notes;
    const lines = value.split('\n');
    const first = value.slice(0, start).split('\n').length - 1;
    const last = value.slice(0, end > start && value[end - 1] === '\n' ? end - 1 : end).split('\n').length - 1;
    return { lines, first, last, start, end };
  }
  const offsetOfLine = (lines, i) => lines.slice(0, i).reduce((n, l) => n + l.length + 1, 0);

  // Replaces lines from..to with `next` (same count), keeping the edit on the undo stack.
  // The caret stays with its words; a selection grows to cover the changed lines.
  function replaceLines(sel, from, to, next) {
    const before = sel.lines.slice(from, to + 1).join('\n');
    const after = next.join('\n');
    if (before === after) return false;
    const start = offsetOfLine(sel.lines, from);
    const caretLine = sel.first;
    const col = sel.start - offsetOfLine(sel.lines, caretLine);
    el.notes.setSelectionRange(start, start + before.length);
    insertText(after);
    if (sel.start === sel.end && caretLine >= from && caretLine <= to) {
      const oldLine = sel.lines[caretLine];
      const newLine = next[caretLine - from];
      const lead = (l) => l.length - l.trimStart().length;
      const newCol = Math.max(0, Math.min(newLine.length, col + (col >= lead(oldLine) ? newLine.length - oldLine.length : 0)));
      const caret = start + offsetOfLine(next, caretLine - from) + newCol;
      el.notes.setSelectionRange(caret, caret);
    } else {
      const first = Math.min(Math.max(sel.first, from), to) - from;
      const last = Math.min(Math.max(sel.last, from), to) - from;
      el.notes.setSelectionRange(start + offsetOfLine(next, first), start + offsetOfLine(next, last) + next[last].length);
    }
    return true;
  }

  // Rewrites every line the selection touches with fn(line, index, lines).
  function transformLines(fn) {
    const sel = selectedLines();
    const next = sel.lines.slice(sel.first, sel.last + 1).map((line, i) => fn(line, sel.first + i, sel.lines));
    replaceLines(sel, sel.first, sel.last, next);
    updateLineType();
  }

  // Tab and Shift+Tab: one level at a time, taking the sub-points along.
  function shiftSelection(direction) {
    const sel = selectedLines();
    const moved = VN.shiftLines(sel.lines, sel.first, sel.last, direction);
    if (!moved) {
      if (direction > 0) showToast('That line is already one level under the line above it. Indent the line above first, or start a sub-point under it.');
      return;
    }
    replaceLines(sel, moved.from, moved.to, moved.lines.slice(moved.from, moved.to + 1));
  }

  function applyLineType(type) {
    transformLines((line, i, lines) => (line.trim() ? VN.setLineType(lines, i, type) : line));
  }

  // Ctrl+B: bold the selected words, or make the line a label (and back).
  function boldOrLabel() {
    const { value, selectionStart: start, selectionEnd: end } = el.notes;
    const inOneLine = start !== end && !value.slice(start, end).includes('\n');
    const line = value.slice(lineStartOf(value, start)).split('\n')[0];
    if (inOneLine && value.slice(start, end).trim() !== line.trim()) {
      const words = value.slice(start, end);
      insertText(`**${words}**`);
      el.notes.setSelectionRange(start + 2, start + 2 + words.length);
      return;
    }
    applyLineType(/^\s*(?:\*\*.+\*\*|__.+__)\s*:?$/.test(line) ? 'plain' : 'label');
  }

  // Enter on a bullet line starts the next bullet at the same depth; after a label it starts
  // the first bullet that belongs to the label. Enter on an empty sub-bullet steps it back out
  // one level, and on an empty top-level bullet removes the bullet, like in most note apps.
  function continueList(e) {
    const { value, selectionStart: start, selectionEnd: end } = el.notes;
    if (start !== end) return;
    const from = lineStartOf(value, start);
    const before = value.slice(from, start);
    const restOfLine = value.slice(start).split('\n')[0];
    const bullet = /^(\s*)([-*+•]|\d{1,3}[.)])(\s+)(\[[ xX]\]\s+)?/.exec(before);
    if (!bullet) {
      const indent = /^[ \t]*/.exec(before)[0];
      if (before.trim() && !restOfLine.trim() && VN.lineType(before) === 'label') {
        e.preventDefault();
        insertText(`\n${indent}- `);
      } else if (indent && before.trim()) {
        e.preventDefault();
        insertText(`\n${indent}`);
      }
      return;
    }
    e.preventDefault();
    if (!before.slice(bullet[0].length).trim() && !restOfLine.trim()) {
      if (bullet[1].length) { shiftSelection(-1); return; }
      el.notes.setSelectionRange(from, start);
      insertText('');
      return;
    }
    let marker = bullet[2];
    if (/^\d/.test(marker)) marker = `${parseInt(marker, 10) + 1}${marker.slice(-1)}`;
    insertText(`\n${bullet[1]}${marker}${bullet[3]}${bullet[4] ? '[ ] ' : ''}`);
  }

  const LINE_TYPE_KEYS = { 0: 'plain', 1: 'title', 2: 'section', 3: 'subsection', 4: 'subsubsection' };
  let escaped = false; // Esc, then Tab, lets keyboard users leave the box
  el.notes.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      escaped = true;
      return;
    }
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Tab' && !escaped && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      shiftSelection(e.shiftKey ? -1 : 1);
      return;
    }
    escaped = false;
    if (mod && !e.altKey && !e.shiftKey && (e.key === ']' || e.key === '[')) {
      e.preventDefault();
      shiftSelection(e.key === ']' ? 1 : -1);
      return;
    }
    // Ctrl+Alt+digit. AltGr is Ctrl+Alt on Windows, so a key that types a character is left alone.
    if (mod && e.altKey && /^Digit[0-4]$/.test(e.code) && (e.metaKey || /^[0-4]$/.test(e.key))) {
      e.preventDefault();
      applyLineType(LINE_TYPE_KEYS[e.code.slice(-1)]);
      return;
    }
    if (mod && e.shiftKey && !e.altKey && (e.code === 'Digit8' || e.code === 'Digit7')) {
      e.preventDefault();
      applyLineType(e.code === 'Digit8' ? 'bullet' : 'numbered');
      return;
    }
    if (mod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      boldOrLabel();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) continueList(e);
  });
  el.notes.addEventListener('blur', () => {
    escaped = false;
  });

  el.notes.addEventListener('input', (e) => {
    if (settings.arrows && e.inputType === 'insertText' && e.data === '>') autoArrow();
    renderGuides();
    saveSoon();
    renderSoon();
  });

  // ---------- Guides: headings, labels and indent levels drawn behind the writing ----------

  const guides = $('notes-guides');
  function guideLine(line) {
    const esc = VN.esc;
    if (!line) return '<div class="g">\u200b</div>';
    const type = VN.lineType(line);
    const parts = VN.splitLine(line);
    const lead = /^[ \t]*/.exec(line)[0];
    const level = Math.floor(parts.indent / VN.INDENT_UNIT);
    const classes = ['g', `g-${type}`];
    if (parts.heading) classes.push(`g-h${Math.min(parts.heading, 4)}`);
    const idea = !parts.heading && type !== 'label' ? VN.describe(parts.content) : null;
    if (idea && idea.kind === 'callout') classes.push(`g-callout g-${idea.callout}`);
    if (idea && idea.kind === 'example' && idea.label) classes.push('g-example');
    if (idea && idea.kind === 'figure') classes.push('g-figure');
    // Each level of indentation gets its own rail, so you can see what sits under what.
    let rails = '';
    let i = 0;
    while (i < lead.length) {
      const unit = lead[i] === '\t' ? '\t' : lead.slice(i, i + VN.INDENT_UNIT);
      rails += unit === '\t' || unit.length === VN.INDENT_UNIT ? `<span class="rail">${unit}</span>` : unit;
      i += unit.length;
    }
    const rest = line.slice(lead.length);
    const mark = parts.marker && rest.startsWith(parts.marker) ? `<span class="mk mk-${level % 4}">${esc(parts.marker)}</span>` + esc(rest.slice(parts.marker.length)) : esc(rest);
    return `<div class="${classes.join(' ')}">${rails}${mark || '\u200b'}</div>`;
  }
  function syncGuides() {
    guides.style.width = el.notes.clientWidth + 'px';
    guides.style.height = el.notes.clientHeight + 'px';
    guides.scrollTop = el.notes.scrollTop;
  }
  function renderGuides() {
    const lines = el.notes.value.split('\n');
    const html = lines.map(guideLine);
    // The first line is the notebook's title even without a #.
    const first = lines.findIndex((l) => l.trim());
    if (first >= 0 && /^\S/.test(lines[first]) && !/^(?:[-*+•]|\d{1,3}[.)])\s/.test(lines[first])) html[first] = html[first].replace('class="g ', 'class="g g-title ');
    guides.innerHTML = html.join('');
    syncGuides();
  }
  el.notes.addEventListener('scroll', () => { guides.scrollTop = el.notes.scrollTop; });
  new ResizeObserver(syncGuides).observe(el.notes);

  // ---------- Line type, Jump to, Insert ----------

  const lineTypeSelect = $('line-type');
  for (const [id, label] of Object.entries(VN.LINE_TYPES)) lineTypeSelect.add(new Option(label, id));
  function updateLineType() {
    const { value, selectionStart } = el.notes;
    const line = value.slice(lineStartOf(value, selectionStart)).split('\n')[0];
    lineTypeSelect.value = VN.lineType(line);
  }
  for (const type of ['keyup', 'click', 'focus']) el.notes.addEventListener(type, updateLineType);
  lineTypeSelect.addEventListener('change', () => { applyLineType(lineTypeSelect.value); el.notes.focus(); });

  const jumpSelect = $('jump-to');
  let jumpKey = '';
  function renderJumpList() {
    const sections = VN.sectionsOf(state.tree);
    const key = JSON.stringify(sections);
    if (key === jumpKey) return;
    jumpKey = key;
    jumpSelect.replaceChildren(new Option(sections.length ? 'Jump to…' : 'Jump to… (add a ## section)', ''));
    for (const s of sections) jumpSelect.add(new Option(`${'\u2003'.repeat(s.level)}${s.label ? '▸ ' : ''}${VN.mathPlain(s.text)}`, s.sourceLine));
  }
  jumpSelect.addEventListener('change', () => {
    const line = jumpSelect.value;
    jumpSelect.value = '';
    if (line) jumpToSource(line);
  });

  $('insert-kind').addEventListener('change', () => {
    const what = $('insert-kind').value;
    $('insert-kind').value = '';
    if (!what) return;
    if (what === '__draw' || what === '__picture') { drawAtCaret({ pickPhoto: what === '__picture' }); return; }
    el.notes.focus();
    if (/: $/.test(what)) {
      // A study block goes at the start of the line, after any bullet or number.
      transformLines((line) => {
        const m = /^(\s*(?:(?:[-*+•]|\d{1,3}[.)])\s+)?)(.*)$/.exec(line);
        return m[1] + what + m[2];
      });
      return;
    }
    const { value, selectionStart: start, selectionEnd: end } = el.notes;
    const chosen = value.slice(start, end);
    if (what.endsWith('{}')) {
      insertText(what.slice(0, -1) + chosen + '}');
      if (!chosen) el.notes.setSelectionRange(start + what.length - 1, start + what.length - 1);
    } else {
      insertText(what);
      el.notes.setSelectionRange(start + 1, start + what.length - 1);
    }
  });

  // ---------- Examples and the undo toast ----------

  let toastTimer = 0;
  let toastUndo = null;
  // A short message at the bottom of the screen; with onUndo it also offers Undo.
  function showToast(message, onUndo) {
    el.toastText.textContent = message;
    toastUndo = onUndo || null;
    el.toastUndo.hidden = !onUndo;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; toastUndo = null; }, onUndo ? 10000 : 7000);
  }
  el.toastUndo.addEventListener('click', () => {
    const undo = toastUndo;
    el.toast.hidden = true; toastUndo = null;
    if (undo) undo();
  });

  for (const [id, example] of Object.entries(VN.EXAMPLES)) {
    el.examples.add(new Option(example.label, id));
  }
  const courseGroup = document.createElement('optgroup');
  courseGroup.label = 'Course notes';
  for (const book of VN.COURSE_NOTES || []) courseGroup.append(new Option(book.label, 'course:' + book.id));
  if (courseGroup.children.length) el.examples.append(courseGroup);
  el.examples.addEventListener('change', () => {
    const value = el.examples.value;
    const example = value.startsWith('course:') ? (VN.COURSE_NOTES || []).find(b => 'course:' + b.id === value) : VN.EXAMPLES[value];
    el.examples.value = '';
    if (!example) return;
    mergeFigures(example.figures);
    addNotebooks([example.text]);
    showToast(`Opened “${example.label}” as a new notebook.`);
  });

  // Course notebooks that ship with the site join the desk once; deleting one is remembered.
  function deliverCourseNotes() {
    if (storageBlocked || !VN.COURSE_NOTES) return;
    let delivered = [];
    try { delivered = JSON.parse(load(KEYS.delivered, '[]')) || []; } catch (e) { delivered = []; }
    const result = VN.deliverNotebooks(library, VN.COURSE_NOTES, delivered);
    save(KEYS.delivered, JSON.stringify(result.delivered));
    if (!result.added.length && !result.updated.length) return;
    library.documents = result.library.documents;
    library.activeId = result.library.activeId;
    library.figures = result.library.figures;
    const names = (list) => list.map(d => VN.titleOf(d).replace(/\s*·.*$/, '')).join(', ');
    const parts = [];
    const fresh = result.added.filter(d => !d.id.includes('@'));
    const beside = result.added.filter(d => d.id.includes('@'));
    if (fresh.length) parts.push(`Added ${fresh.length === 1 ? 'a notebook' : fresh.length + ' notebooks'}: ${names(fresh)}.`);
    if (beside.length) parts.push(`You had edited ${names(beside)}, so the version with drawings is beside your copy, marked "(new version)".`);
    if (result.updated.length) parts.push(`Updated with drawings: ${names(result.updated)}.`);
    setTimeout(() => showToast(parts.join(' ') + ' They are on your desk above.'), 400);
  }

  // ---------- Page view: the notebook in handwriting, and the PDF ----------

  const pageEl = { pages: $('pages'), status: $('page-status') };
  const hwMeasure = document.createElement('canvas').getContext('2d');
  const advances = new Map(); // one advance() per font, so widths are measured once
  function advanceFor(fontId) {
    if (!advances.has(fontId)) advances.set(fontId, HW.makeAdvance(HW.FONTS[fontId], hwMeasure));
    return advances.get(fontId);
  }
  function pageSettings(scale) {
    const hw = settings.hw;
    const ink = colorOf(HW.INKS, hw.ink);
    return {
      paper: hw.paper,
      metrics: VN.paperMetrics(hw.paper, hw.pageSize, hw.size),
      font: HW.FONTS[hw.font],
      pen: HW.PENS[hw.pen],
      ink,
      accent: hw.accent === 'same' ? ink : colorOf(HW.INKS, hw.accent),
      highlight: colorOf(HW.HIGHLIGHTERS, hw.highlight),
      messiness: hw.messiness / 100,
      seed: hw.seed,
      scale,
      figureImage,
    };
  }
  function layoutHandPages() {
    const hw = settings.hw;
    return VN.layoutPages(el.notes.value, VN.paperMetrics(hw.paper, hw.pageSize, hw.size), hw.size, advanceFor(hw.font), figureSize);
  }
  let pageDraw = 0;
  function renderPages() {
    const family = HW.FONTS[settings.hw.font].family;
    const token = ++pageDraw;
    pageEl.status.textContent = 'Writing…';
    Promise.all([loadFace(family), preloadFigures(figuresIn(el.notes.value))]).then(() => {
      if (token !== pageDraw || state.view !== 'page') return;
      const pages = layoutHandPages();
      const s = pageSettings(Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * 0.9)));
      const canvases = [...pageEl.pages.querySelectorAll('canvas')];
      pages.forEach((page, i) => {
        let canvas = canvases[i];
        if (!canvas) {
          canvas = document.createElement('canvas');
          pageEl.pages.append(canvas);
        }
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `Page ${i + 1} of ${pages.length}, handwritten: ` + page.lines.map(l => l.text).join(' ').slice(0, 400));
        HW.renderPage(canvas, page, i, s, advanceFor(settings.hw.font));
      });
      canvases.slice(pages.length).forEach(c => c.remove());
      const words = el.notes.value.split(/\s+/).filter(Boolean).length;
      pageEl.status.textContent = `${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · ${words} ${words === 1 ? 'word' : 'words'} · ${VN.PAGE_SIZES[settings.hw.pageSize].label}, ${VN.PAPERS[settings.hw.paper].label.toLowerCase()}`;
    });
  }

  function fillSelect(select, items, value, extra) {
    select.replaceChildren();
    if (extra) select.add(new Option(extra[1], extra[0]));
    for (const [id, item] of Object.entries(items)) select.add(new Option(item.label, id));
    if (HEX.test(value)) select.add(new Option('Custom ' + value.toLowerCase(), value));
    select.value = value;
  }
  const hwControls = {
    font: [$('hw-font'), HW.FONTS], pen: [$('hw-pen'), HW.PENS], ink: [$('hw-ink'), HW.INKS],
    accent: [$('hw-accent'), HW.INKS, ['same', 'Same as ink']], highlight: [$('hw-highlight'), HW.HIGHLIGHTERS],
    paper: [$('hw-paper'), VN.PAPERS], pageSize: [$('hw-size-page'), VN.PAGE_SIZES],
  };
  function syncPageControls() {
    for (const [key, [select, items, extra]] of Object.entries(hwControls)) fillSelect(select, items, settings.hw[key], extra);
    // The wheel beside a color list shows the color in use; picking on it makes a custom color.
    const hw = settings.hw;
    const shown = { ink: colorOf(HW.INKS, hw.ink), accent: hw.accent === 'same' ? colorOf(HW.INKS, hw.ink) : colorOf(HW.INKS, hw.accent), highlight: colorOf(HW.HIGHLIGHTERS, hw.highlight) || '#ffffff' };
    for (const [key, color] of Object.entries(shown)) $(`hw-${key}-wheel`).value = color;
    $('hw-size').value = settings.hw.size; $('hw-size-out').textContent = settings.hw.size + ' px';
    $('hw-mess').value = settings.hw.messiness; $('hw-mess-out').textContent = settings.hw.messiness + '%';
  }
  const LIGHT_INKS = ['white', 'yellow'];
  for (const [key, [select]] of Object.entries(hwControls)) {
    select.addEventListener('change', () => {
      const hw = settings.hw;
      const before = hw.paper;
      hw[key] = select.value;
      // Chalkboard needs light chalk; going back to paper needs dark ink again.
      if (key === 'paper' && hw.paper === 'chalkboard' && !LIGHT_INKS.includes(hw.ink)) Object.assign(hw, { ink: 'white', accent: 'yellow', pen: 'chalk' });
      if (key === 'paper' && before === 'chalkboard' && hw.paper !== 'chalkboard' && LIGHT_INKS.includes(hw.ink)) Object.assign(hw, { ink: 'blue', accent: 'red', pen: 'ballpoint' });
      saveSettings(); syncPageControls(); renderPages();
    });
  }
  for (const key of ['ink', 'accent', 'highlight']) {
    $(`hw-${key}-wheel`).addEventListener('change', () => {
      settings.hw[key] = $(`hw-${key}-wheel`).value;
      saveSettings(); syncPageControls(); renderPages();
    });
  }
  let rangeTimer = 0;
  for (const [id, key, unit] of [['hw-size', 'size', ' px'], ['hw-mess', 'messiness', '%']]) {
    $(id).addEventListener('input', () => {
      settings.hw[key] = Number($(id).value);
      $(id + '-out').textContent = settings.hw[key] + unit;
      saveSettings();
      clearTimeout(rangeTimer);
      rangeTimer = setTimeout(renderPages, 150);
    });
  }
  $('hw-reshuffle').addEventListener('click', () => {
    settings.hw.seed = Math.floor(Math.random() * 2 ** 31);
    saveSettings(); renderPages();
  });

  function whenPdfReady() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    return new Promise((resolve, reject) => {
      const script = document.querySelector('script[src*="jspdf"]');
      const timer = setTimeout(() => reject(new Error('The PDF tool did not load.')), 8000);
      script.addEventListener('load', () => { clearTimeout(timer); window.jspdf ? resolve(window.jspdf) : reject(new Error('The PDF tool did not load.')); });
      script.addEventListener('error', () => { clearTimeout(timer); reject(new Error('The PDF tool did not load.')); });
    });
  }
  let pdfBusy = false;
  async function downloadPdf() {
    if (pdfBusy) return;
    pdfBusy = true;
    $('hw-download').disabled = true;
    $('export-menu').open = false;
    const say = (text) => { pageEl.status.textContent = text; if (state.view !== 'page') showToast(text); };
    try {
      const { jsPDF } = await whenPdfReady();
      await loadFace(HW.FONTS[settings.hw.font].family);
      await preloadFigures(figuresIn(el.notes.value));
      const pages = layoutHandPages();
      const size = VN.PAGE_SIZES[settings.hw.pageSize].pt;
      const s = pageSettings(2.5);
      const doc = new jsPDF({ unit: 'pt', format: size, orientation: 'portrait', compress: true });
      doc.setProperties({ title: VN.titleOf(activeDoc()), creator: 'Fieldnotes' });
      const canvas = document.createElement('canvas');
      for (let i = 0; i < pages.length; i++) {
        pageEl.status.textContent = `Writing page ${i + 1} of ${pages.length}…`;
        await new Promise(r => setTimeout(r, 0)); // let the status paint between pages
        if (i > 0) doc.addPage(size, 'portrait');
        HW.renderPage(canvas, pages[i], i, s, advanceFor(settings.hw.font));
        doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, size[0], size[1]);
      }
      download(doc.output('blob'), noteSlug() + ' (handwritten).pdf');
      say(`Saved ${pages.length} handwritten ${pages.length === 1 ? 'page' : 'pages'} as a PDF.`);
    } catch (err) {
      say('The PDF could not be made. ' + (err && err.message ? err.message : ''));
    } finally {
      pdfBusy = false;
      $('hw-download').disabled = false;
    }
  }
  $('hw-download').addEventListener('click', downloadPdf);
  $('save-pdf').addEventListener('click', downloadPdf);

  $('save-anki').addEventListener('click', () => {
    clearTimeout(pending); render();
    const { cards } = VN.studyCards(state.tree);
    if (!cards.length) { $('export-menu').open = false; showToast('No practice cards yet. Add a definition, formula, sequence or answered question.'); return; }
    download(new Blob([VN.cardsTSV(cards, state.tree.title)], { type: 'text/plain;charset=utf-8' }), noteSlug() + ' (cards).txt');
    showToast(`Saved ${cards.length} cards. In Anki: File → Import.`);
  });

  // ---------- Drawing ----------

  const figureOnLine = (line) => VN.FIGURE_LINE.exec(String(line).trim().replace(/^(?:[-*+•]|\d{1,3}[.)])\s+/, ''));
  // ✎ Draw: on a drawing's line it edits that drawing; anywhere else it makes a new one,
  // put on its own line under the current line.
  function drawAtCaret({ pickPhoto = false } = {}) {
    const sel = selectedLines();
    const line = sel.lines[sel.first];
    const here = figureOnLine(line);
    if (here && !pickPhoto) { editFigure(here[2]); return; }
    VN.openDrawing(null, '', (fig, caption) => {
      const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      figures()[id] = fig;
      const indent = /^[ \t]*/.exec(line)[0];
      const end = offsetOfLine(sel.lines, sel.first) + line.length;
      el.notes.focus();
      el.notes.setSelectionRange(end, end);
      insertText((line.trim() ? '\n' + indent : '') + `![${caption.replace(/[[\]]/g, '')}](fig:${id})`);
      saveNotebook();
      showToast('Drawing added. It shows in Cards, on the map and on the handwritten pages; put the cursor on its line and press ✎ Draw to change it.');
    }, { pickPhoto });
  }
  function editFigure(id) {
    const lines = el.notes.value.split('\n');
    const at = lines.findIndex(l => { const m = figureOnLine(l); return m && m[2] === id; });
    const caption = at >= 0 ? figureOnLine(lines[at])[1] : '';
    VN.openDrawing(figures()[id] || VN.newFigure(), caption, (fig, newCaption) => {
      figures()[id] = fig;
      if (at >= 0 && newCaption !== caption) {
        const sel = selectedLines();
        const next = sel.lines.map(l => { const m = figureOnLine(l); return m && m[2] === id ? l.replace(/!\[[^\]]*\]/, `![${newCaption.replace(/[[\]]/g, '')}]`) : l; });
        replaceLines(sel, 0, sel.lines.length - 1, next);
      }
      saveNotebook();
      render();
      showToast('Drawing saved.');
    });
  }

  // ---------- Writing tools ----------

  const LINE = /^(\s*)((?:[-*+•]|\d{1,3}[.)])\s+)?(\[[ xX]\]\s+)?(!\s*)?(.*)$/;
  const TOOLS = {
    indent: () => shiftSelection(1),
    outdent: () => shiftSelection(-1),
    bullet: () => transformLines(l => { const m = LINE.exec(l); return m[2] ? m[1] + (m[3] || '') + (m[4] || '') + m[5] : m[1] + '- ' + (m[3] || '') + (m[4] || '') + m[5]; }),
    numbered: () => applyLineType('numbered'),
    todo: () => transformLines(l => { const m = LINE.exec(l); return m[3] ? m[1] + (m[2] || '') + (m[4] || '') + m[5] : m[1] + (m[2] || '- ') + '[ ] ' + (m[4] || '') + m[5]; }),
    important: () => transformLines(l => { const m = LINE.exec(l); return m[1] + (m[2] || '') + (m[3] || '') + (m[4] ? '' : '! ') + m[5]; }),
    draw: () => drawAtCaret(),
    tidy: () => {
      const tidy = VN.tidyNotes(el.notes.value);
      if (tidy === el.notes.value) { showToast('Already tidy: every level is two spaces and every bullet is "-".'); return; }
      const sel = selectedLines(); // Tidy keeps every line, so the caret stays on its line
      replaceLines(sel, 0, sel.lines.length - 1, tidy.split('\n'));
      showToast('Tidied: two spaces per level, "-" bullets. What nests where is unchanged. Ctrl+Z undoes it.');
    },
  };
  const toolbar = document.querySelector('.writing-tools');
  toolbar.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); }); // keep the caret in the notes
  toolbar.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    el.notes.focus();
    if (button.dataset.tool) TOOLS[button.dataset.tool]();
    else if (button.dataset.insert) insertText(button.dataset.insert);
  });

  // "->" becomes "→" as you type (and "<-" "←", "=>" "⇒"). Ctrl+Z brings the letters back.
  function autoArrow() {
    const pos = el.notes.selectionStart;
    if (pos !== el.notes.selectionEnd || pos < 2) return;
    const pair = el.notes.value.slice(pos - 2, pos);
    const arrow = { '->': '→', '=>': '⇒' }[pair];
    if (!arrow || el.notes.value[pos - 3] === '<' || el.notes.value[pos - 3] === '-' || el.notes.value[pos - 3] === '=') return;
    el.notes.setSelectionRange(pos - 2, pos);
    insertText(arrow);
  }

  // ---------- Settings and shortcuts ----------

  fillSelect($('set-lettering'), HW.FONTS, settings.lettering, ['print', 'Print (Georgia)']);
  $('set-lettering').addEventListener('change', () => { settings.lettering = $('set-lettering').value; saveSettings(); applyLettering(); });
  $('set-theme').addEventListener('change', () => setTheme($('set-theme').value));
  $('set-text-size').value = settings.textSize;
  $('set-text-size-out').textContent = settings.textSize + '%';
  $('set-text-size').addEventListener('input', () => {
    settings.textSize = Number($('set-text-size').value);
    $('set-text-size-out').textContent = settings.textSize + '%';
    saveSettings(); state.userMoved = false;
    if (state.view === 'map') renderMap();
  });
  $('set-shuffle').checked = settings.shuffle;
  $('set-shuffle').addEventListener('change', () => { settings.shuffle = $('set-shuffle').checked; saveSettings(); practice = null; render(); });
  $('set-arrows').checked = settings.arrows;
  $('set-arrows').addEventListener('change', () => { settings.arrows = $('set-arrows').checked; saveSettings(); });
  function openDialog(id) {
    const dialog = $(id);
    if (dialog.open) return;
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }
  $('open-settings').addEventListener('click', () => openDialog('settings'));
  $('open-help').addEventListener('click', () => openDialog('help'));

  const typing = (target) => target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (e.altKey && !mod && /^Digit[1-4]$/.test(e.code)) {
      e.preventDefault();
      setView(VIEWS[Number(e.code.slice(-1)) - 1]);
      return;
    }
    if (mod && !e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveNotebook();
      showToast(storageBlocked ? 'Browser storage is unavailable. Use Export → All notebooks to keep a copy.' : 'Saved on this browser.');
      return;
    }
    if (mod && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('notebook-search').focus(); $('notebook-search').select();
      return;
    }
    if (mod && !e.altKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      if (document.activeElement === el.notes) {
        const target = { map: el.map, cards: el.cardsView.querySelector('button'), practice: el.practiceView.querySelector('.btn.primary, button'), page: $('hw-font') }[state.view];
        if (target) target.focus();
      } else el.notes.focus();
      return;
    }
    if (typing(e.target) || mod || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === '?') { e.preventDefault(); openDialog('help'); return; }
    if (state.view === 'practice' && practice && practice.queue.length) {
      if ((e.key === ' ' || e.key === 'Enter') && !practice.revealed && !e.target.closest('button')) { e.preventDefault(); practiceAction('reveal'); }
      else if (practice.revealed && e.key === '1') { e.preventDefault(); practiceAction('again'); }
      else if (practice.revealed && e.key === '2') { e.preventDefault(); practiceAction('known'); }
    }
  });

  // ---------- Start ----------

  function refreshForTheme() {
    if (state.view === 'map' && state.tree) renderMap();
  }
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', refreshForTheme);
  new MutationObserver(refreshForTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Text widths change once the web fonts arrive, so measure again then.
  if (document.fonts) document.fonts.ready.then(applyLettering);

  deliverCourseNotes();
  el.notes.value = activeDoc().text;
  setTheme(settings.theme);
  syncPageControls();
  fonts = readFonts();
  renderShelf();
  if (initialLibrary.error) storageWarning(initialLibrary.error);
  else persistLibrary();
  setView(state.view);
})();
