/* Notebook persistence and source-grounded practice. Shared by browser and Node. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./parser.js') : root.VisualNotes);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function (parser) {
  'use strict';
  const LIBRARY_KEY = 'tn2vn.library.v1';
  function makeId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() :
      Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function notebook(text, id = makeId()) {
    return { id, text: String(text), updatedAt: new Date().toISOString() };
  }
  function titleOf(doc) {
    return parser.stripInk(doc.text).split(/\r?\n/).find(line => line.trim())?.replace(/^#+\s*/, '').trim() || 'Untitled notebook';
  }
  function validLibrary(value) {
    return !!value && value.version === 1 && Array.isArray(value.documents) && value.documents.length > 0 &&
      value.documents.every(d => d && typeof d.id === 'string' && d.id.length > 0 && typeof d.text === 'string') &&
      new Set(value.documents.map(d => d.id)).size === value.documents.length &&
      value.documents.some(d => d.id === value.activeId);
  }
  function readLibrary(storage, fallbackText, id = makeId()) {
    let raw = null;
    try {
      raw = storage.getItem(LIBRARY_KEY);
      if (raw !== null) {
        const library = JSON.parse(raw);
        if (!validLibrary(library)) throw new Error('Invalid notebook library');
        return { library, raw, error: null, blocked: false };
      }
      const legacy = storage.getItem('tn2vn.notes');
      const doc = notebook(legacy === null ? fallbackText : legacy, id);
      return { library: { version: 1, activeId: doc.id, documents: [doc] }, raw, error: null, blocked: false };
    } catch (e) {
      const doc = notebook(fallbackText, id);
      return { library: { version: 1, activeId: doc.id, documents: [doc] }, raw, error: 'Browser storage unavailable or unreadable. Download a backup before closing.', blocked: true };
    }
  }
  // A lease prevents another open tab from silently overwriting newer saved notes.
  function writeLibrary(storage, library, expectedRaw) {
    try {
      if (!validLibrary(library)) throw new Error('Invalid notebook library');
      if (storage.getItem(LIBRARY_KEY) !== expectedRaw) return { ok: false, conflict: true, error: 'Another tab changed these notebooks. Download your backup, then reload.' };
      const raw = JSON.stringify(library);
      storage.setItem(LIBRARY_KEY, raw);
      return { ok: true, raw };
    } catch (e) {
      return { ok: false, error: 'Notes are not saved. Browser storage is unavailable or full. Download a backup before closing.' };
    }
  }
  // Removing a notebook returns what is needed to put it back exactly where it was.
  function removeNotebook(library, id) {
    const index = library.documents.findIndex(d => d.id === id);
    if (index < 0) return null;
    const removed = library.documents[index];
    const documents = library.documents.filter(d => d.id !== id);
    if (!documents.length) documents.push(notebook(''));
    const activeId = library.activeId === id ? documents[Math.min(index, documents.length - 1)].id : library.activeId;
    return { library: { version: 1, activeId, documents }, removed, index };
  }
  function restoreNotebook(library, removed, index) {
    if (library.documents.some(d => d.id === removed.id)) return library;
    const documents = library.documents.slice();
    // A blank notebook made only to avoid an empty desk is replaced by the restored one.
    if (documents.length === 1 && !documents[0].text.trim()) documents.length = 0;
    documents.splice(Math.min(index, documents.length), 0, removed);
    return { version: 1, activeId: removed.id, documents };
  }
  function duplicateNotebook(library, id) {
    const index = library.documents.findIndex(d => d.id === id);
    if (index < 0) return library;
    const copy = notebook(library.documents[index].text);
    const documents = library.documents.slice();
    documents.splice(index + 1, 0, copy);
    return { version: 1, activeId: copy.id, documents };
  }
  // Notebooks whose title or text contains every word of the query.
  function searchNotebooks(library, query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return library.documents.slice();
    return library.documents.filter(d => { const t = d.text.toLowerCase(); return words.every(w => t.includes(w)); });
  }

  // A short fingerprint of a notebook's text, to tell whether it was edited.
  function textHash(text) {
    let h = 0x811c9dc5;
    for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  /**
   * deliverNotebooks(library, bundles, delivered) -> { library, added, updated, delivered }
   *
   * Notebooks that ship with the site (course notes) join the desk once. `delivered`
   * remembers them, so one you delete stays deleted. A newer version of a bundle
   * (bundle.version) replaces your copy only if you never edited it (its text matches one
   * of bundle.replaces); an edited copy is kept and the new version arrives beside it.
   * Drawings the bundles use are added to library.figures.
   */
  function deliverNotebooks(library, bundles, delivered) {
    const seen = new Set(delivered || []);
    const documents = library.documents.slice();
    const figures = Object.assign({}, library.figures);
    const added = [];
    const updated = [];
    for (const b of bundles || []) {
      const tag = b.id + '@' + (b.version || 1);
      if (seen.has(tag)) continue;
      const index = documents.findIndex(d => d.id === b.id);
      const doc = { id: b.id, text: String(b.text), updatedAt: b.date || new Date().toISOString() };
      if (index >= 0) {
        const mine = documents[index];
        if (mine.text !== doc.text) {
          if ((b.replaces || []).includes(textHash(mine.text))) { documents[index] = Object.assign({}, mine, { text: doc.text, updatedAt: doc.updatedAt }); updated.push(documents[index]); }
          else if (!documents.some(d => d.id === tag)) {
            const copy = { id: tag, text: doc.text.replace(/^(#*\s*)(.*)/, '$1$2 (new version)'), updatedAt: doc.updatedAt };
            documents.splice(index + 1, 0, copy);
            added.push(copy);
          }
        }
      } else if (!seen.has(b.id)) {
        documents.push(doc);
        added.push(doc);
      } else {
        seen.add(tag);
        continue; // you deleted this notebook earlier
      }
      for (const [id, fig] of Object.entries(b.figures || {})) if (!figures[id]) figures[id] = fig;
      seen.add(b.id);
      seen.add(tag);
    }
    const ids = [...seen];
    if (!added.length && !updated.length) return { library, added, updated, delivered: ids };
    const activeId = (added[0] || updated[0]).id;
    return { library: { version: 1, activeId, documents, figures }, added, updated, delivered: ids };
  }

  // "Big picture: …" or "Problem tactic: …" name a note, not a concept, so they are recalled, not defined.
  const NOTE_TAG = /\b(?:big picture|picture|tactics?|tricks?|tips?|ideas?|notes?|strateg(?:y|ies)|cases?|costs?|sanity|geometry|motivation|context|consequences?|examples?|themes?|recipe|setup|insights?|rules?|takeaways?|failures?|contrast|remarks?|assumptions?|summary|checks?|vocabulary|real-world|related|facts?|preview|practice|exercises?|illustration|alternative|general|standing|classification|lessons?|disproving|traps?|intro|uses?|applications?|physical|meaning|reading|view|forms?|tests?|classic|next|cross-course|geometric|why|how|is|are|was|were|means|matters|works|arise|gives|makes|has|have|does|can|needs?)\b/i;
  function definitionPrompt(node, branch) {
    if (/^(where|when|why|how)$/i.test(node.term)) return { prompt: 'For “' + branch + '”, ' + node.term.toLowerCase() + '?', kind: 'Definition' };
    if (/\?["”]?$/.test(node.term)) return { prompt: node.term.replace(/^["“]|["”]$/g, ''), kind: 'Your question' };
    if (NOTE_TAG.test(node.term)) return { prompt: 'Recall: ' + node.term, kind: 'Recall' };
    return { prompt: 'What is ' + node.term + '?', kind: 'Definition' };
  }
  // "State Theorem 4.1.1 (Existence…)." / "Define Wronskian (Definition 4.1.2)." / "Define Nul A."
  function calloutPrompt(node) {
    if (node.callout === 'theorem') return 'State ' + node.label + '.';
    const m = /^(?:definition|defn|def)\.?\s*([\d.]*)\s*(.*)$/i.exec(node.label);
    let name = m ? m[2].trim() : '';
    const inParens = /^\((.*)\)$/.exec(name);
    if (inParens) name = inParens[1].trim();
    if (!name) { const lhs = /^(.{1,40}?)\s*(?:=|:)\s/.exec(node.body || ''); name = lhs ? lhs[1] : ''; }
    if (name) return 'Define ' + name + (m && m[1] ? ' (Definition ' + m[1] + ')' : '') + '.';
    return /^(?:definition|defn|def)\.?$/i.test(node.label) ? 'State the definition.' : 'State ' + node.label + '.';
  }
  // Answers are copied exactly as written, every line under the question.
  const writtenUnder = (node) => { const out = []; const collect = n => { out.push(n.raw || n.text); n.children.forEach(collect); }; node.children.forEach(collect); return out; };

  function studyCards(tree) {
    const cards = [];
    const unansweredList = [];
    let unanswered = 0;
    function visit(node, branch) {
      // Numbered lines under one idea, label or heading are a procedure: practise listing them in order.
      const steps = node.children.filter(c => c.numbered);
      if (steps.length >= 2) {
        cards.push({ id: node.key + ':steps', prompt: 'List the steps: ' + node.text, answer: steps.map(c => c.numbered + '. ' + (c.raw || c.text)).join('\n'), kind: 'Steps', branch, sourceLine: node.sourceLine });
      }
      // A heading or a label names a section, and a numbered step is practised with its list.
      if (node.heading || node.kind === 'label' || node.numbered) {
        node.children.forEach(child => visit(child, branch || node.text));
        return;
      }
      if (node.kind === 'definition') {
        const { prompt, kind } = definitionPrompt(node, branch);
        cards.push({ id: node.key + ':definition', prompt, answer: node.detail, kind, branch, sourceLine: node.sourceLine });
      } else if (node.kind === 'callout' && (node.callout === 'theorem' || node.callout === 'definition')) {
        const answer = [node.body, ...writtenUnder(node)].filter(Boolean).join('\n');
        if (answer) cards.push({ id: node.key + ':callout', prompt: calloutPrompt(node), answer, kind: node.callout === 'theorem' ? 'Theorem' : 'Definition', branch, sourceLine: node.sourceLine });
      } else if (node.kind === 'question') {
        if (node.children.length) {
          const answers = [];
          const collect = n => { answers.push(n.raw || n.text); n.children.forEach(collect); };
          node.children.forEach(collect);
          cards.push({ id: node.key + ':question', prompt: node.text, answer: answers.join('\n'), kind: 'Your question', branch, sourceLine: node.sourceLine });
        } else {
          unanswered++;
          unansweredList.push({ text: node.text, branch, sourceLine: node.sourceLine });
        }
      } else if (node.kind === 'formula') {
        cards.push({ id: node.key + ':formula', prompt: 'Complete the formula: ' + node.lhs + ' = ?', answer: node.rhs, kind: 'Formula', branch, sourceLine: node.sourceLine });
      } else if (node.kind === 'flow') {
        node.steps.slice(0, -1).forEach((step, i) => cards.push({
          id: node.key + ':step:' + i, prompt: 'What follows “' + step + '” in this sequence?',
          answer: node.steps[i + 1], context: node.steps.slice(0, i + 1).join(' → '),
          kind: 'Sequence', branch, sourceLine: node.sourceLine
        }));
      }
      // The lines under an answered question are its answer, not more cards.
      if (node.kind === 'question' && node.children.length) return;
      node.children.forEach(child => visit(child, branch || node.text));
    }
    tree.root.children.forEach(node => visit(node, node.text));
    return { cards, unanswered, unansweredList };
  }
  // shuffle takes a random() function so tests can pass a seeded one.
  function startPractice(cards, { shuffle = null } = {}) {
    const queue = cards.slice();
    if (shuffle) for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(shuffle() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
    return { queue, remembered: 0, attempts: 0, revealed: false, missed: [] };
  }
  function ratePractice(session, rating) {
    if (!session.revealed || !session.queue.length || !['again', 'known'].includes(rating)) return session;
    const queue = session.queue.slice();
    const card = queue.shift();
    const missed = (session.missed || []).slice();
    if (rating === 'again') {
      queue.push(card);
      if (!missed.some(c => c.id === card.id)) missed.push(card);
    }
    return { queue, remembered: session.remembered + (rating === 'known' ? 1 : 0), attempts: session.attempts + 1, revealed: false, missed };
  }
  // Tab-separated front/back/tags for Anki and most flashcard apps.
  function cardsTSV(cards, deckTitle) {
    const clean = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
    const tag = String(deckTitle || 'notes').trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '').slice(0, 60) || 'notes';
    const rows = ['#separator:tab', '#html:true', '#columns:Front\tBack\tTags'];
    for (const c of cards) {
      const front = (c.branch ? '<small>' + clean(c.branch) + '</small><br>' : '') + clean(c.prompt) + (c.context ? '<br><small>So far: ' + clean(c.context) + '</small>' : '');
      rows.push(front + '\t' + clean(c.answer) + '\t' + tag);
    }
    return rows.join('\n') + '\n';
  }
  return { LIBRARY_KEY, makeId, notebook, titleOf, validLibrary, readLibrary, writeLibrary, removeNotebook, restoreNotebook, duplicateNotebook, searchNotebooks, deliverNotebooks, textHash, studyCards, startPractice, ratePractice, cardsTSV };
});
