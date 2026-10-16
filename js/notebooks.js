/* Notebook persistence and source-grounded practice. Shared by browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
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
    return doc.text.split(/\r?\n/).find(line => line.trim())?.replace(/^#+\s*/, '').trim() || 'Untitled notebook';
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

  function studyCards(tree) {
    const cards = [];
    const unansweredList = [];
    let unanswered = 0;
    function visit(node, branch) {
      if (node.kind === 'definition') {
        cards.push({ id: node.key + ':definition', prompt: /^(where|when|why|how)$/i.test(node.term) ? 'For “' + branch + '”, ' + node.term.toLowerCase() + '?' : 'What is ' + node.term + '?', answer: node.detail, kind: 'Definition', branch, sourceLine: node.sourceLine });
      } else if (node.kind === 'question') {
        if (node.children.length) {
          const answers = [];
          const collect = n => { answers.push(n.text); n.children.forEach(collect); };
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
  return { LIBRARY_KEY, makeId, notebook, titleOf, validLibrary, readLibrary, writeLibrary, removeNotebook, restoreNotebook, duplicateNotebook, searchNotebooks, studyCards, startPractice, ratePractice, cardsTSV };
});
