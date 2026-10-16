/*
 * Turns plain text notes into a tree of ideas.
 *
 * Works as a classic <script> in the browser (adds parseNotes to window.VisualNotes)
 * and as a CommonJS module in Node, so the tests can require it.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualNotes = Object.assign(root.VisualNotes || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HEADING = /^(#{1,6})\s+(.*)$/;
  const BULLET = /^(?:[-*+•·–—]|\d{1,3}[.)])\s+(.*)$/;
  const RULE = /^[-*_=~]{3,}$/;
  const TODO = /^\[( |x|X)\]\s*(.*)$/;
  // "Key" on its own is left alone so "Key: a tool that opens locks" stays a definition.
  const IMPORTANT = /^(?:!+\s*|(?:important|key point|key idea|remember)\s*[:!–-]\s*)/i;
  const EXAMPLE = /^(?:e\.g\.?(?=\s|$)|eg:|ex:|example:|for example(?:,|(?=\s|$)))\s*/i;
  const QUESTION_PREFIX = /^q\s*[:.]\s*/i;
  const ARROW = /\s*(?:->|=>|→|⟶)\s*/;
  const ARROW_ALL = /\s*(?:->|=>|→|⟶)\s*/g;
  // "Term: meaning", "Term = meaning", "Term - meaning". The colon needs a space after
  // it so times (10:30) and links (https://) are left alone.
  // "F = ma", "E=mc^2", "Speed = distance / time". A lone = with math on either side.
  const FORMULA = /^([^=<>!:]{1,40}?)\s*(?<![=<>!])=(?![=>])\s*([^=]+)$/;
  const MATH = /[+*/^×÷√·\d()²³]|\s-\s/;
  const DEFINITION = /^(.{1,48}?)\s*(?::\s|\s=\s|\s[-–—]\s)\s*(.+)$/;

  function cleanInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .trim();
  }

  function looksLikeFormula(left, right) {
    if (/:\/\//.test(left + right)) return false;
    const lhs = left.trim();
    if (!lhs || lhs.split(/\s+/).length > 4) return false;
    if (MATH.test(right) || MATH.test(lhs)) return true;
    // A short symbol on each side: F = ma, KE = ½mv². "ATP = energy currency" stays a definition.
    return /^[A-Za-zΑ-ω][\w₀-₉Α-ω']{0,2}$/.test(lhs) && /^\S{1,8}$/.test(right.trim());
  }

  function looksLikeTerm(term) {
    if (/https?$|www\./i.test(term)) return false;
    if (/[.!?]$/.test(term)) return false;
    return term.split(/\s+/).length <= 6;
  }

  // Reads one line of text and works out what kind of idea it is.
  function describe(rawText) {
    let text = rawText.trim();
    const idea = { text: '', kind: 'text', important: false };

    if (/^\*\*.+\*\*$/.test(text) || /^__.+__$/.test(text)) idea.important = true;
    text = cleanInline(text);

    const todo = TODO.exec(text);
    if (todo) {
      idea.kind = 'todo';
      idea.done = todo[1] !== ' ';
      text = todo[2];
    }

    const important = IMPORTANT.exec(text);
    if (important && important[0].length < text.length) {
      idea.important = true;
      text = text.slice(important[0].length);
    }

    if (idea.kind === 'text') {
      const example = EXAMPLE.exec(text);
      if (example && example[0].length < text.length) {
        idea.kind = 'example';
        text = text.slice(example[0].length);
      }
    }

    if (idea.kind === 'text' && (QUESTION_PREFIX.test(text) || /\?\s*$/.test(text))) {
      idea.kind = 'question';
      text = text.replace(QUESTION_PREFIX, '');
    }

    if (idea.kind === 'text' && !ARROW.test(text)) {
      const formula = FORMULA.exec(text);
      if (formula && looksLikeFormula(formula[1], formula[2])) {
        idea.kind = 'formula';
        idea.lhs = formula[1].trim();
        idea.rhs = formula[2].trim();
      }
    }

    if (idea.kind === 'text') {
      const def = DEFINITION.exec(text);
      if (def && looksLikeTerm(def[1])) {
        idea.kind = 'definition';
        idea.term = def[1].trim();
        idea.detail = def[2].replace(ARROW_ALL, ' → ').trim();
      }
    }

    if (idea.kind === 'text' && ARROW.test(text)) {
      const steps = text.split(ARROW).map((s) => s.trim());
      if (steps.length >= 2 && steps.every(Boolean)) {
        idea.kind = 'flow';
        idea.steps = steps;
      }
    }

    text = text.replace(/:\s*$/, '').replace(ARROW_ALL, ' → ').trim();
    if (idea.kind === 'definition') idea.text = `${idea.term}: ${idea.detail}`;
    else if (idea.kind === 'formula') idea.text = `${idea.lhs} = ${idea.rhs}`;
    else idea.text = text;
    return idea;
  }

  function makeNode(text, depth, parent) {
    const node = Object.assign(describe(text), { depth, children: [] });
    if (parent) {
      // A key that survives small edits elsewhere, so a collapsed branch stays collapsed.
      let key = `${parent.key}/${node.text}`;
      let n = 2;
      while (parent.children.some((c) => c.key === key)) key = `${parent.key}/${node.text}#${n++}`;
      node.key = key;
      parent.children.push(node);
    } else {
      node.key = 'root';
    }
    return node;
  }

  function readLines(input) {
    const lines = [];
    for (const [lineIndex, line] of String(input || '').replace(/\r\n?/g, '\n').split('\n').entries()) {
      const expanded = line.replace(/\t/g, '    ');
      const body = expanded.trim();
      if (!body || RULE.test(body)) continue;
      const indent = expanded.length - expanded.trimStart().length;
      const heading = HEADING.exec(body);
      if (heading) {
        lines.push({ sourceLine: lineIndex + 1, indent, heading: heading[1].length, bullet: false, text: heading[2].trim() });
        continue;
      }
      const bullet = BULLET.exec(body);
      lines.push({ sourceLine: lineIndex + 1, indent, heading: 0, bullet: !!bullet, text: bullet ? bullet[1].trim() : body });
    }
    return lines.filter((l) => l.text);
  }

  /**
   * parseNotes(text) -> { title, root, count }
   *
   * The first line is the main topic (the center of the mind map), unless it is a bullet.
   * After that, Markdown headings make branches; if there are no headings, every line
   * that starts at the left edge without a bullet makes a branch. Bullets and indented
   * lines become sub-ideas of whatever is above them, nested by indentation.
   */
  function parseNotes(input) {
    const lines = readLines(input);
    let start = 0;
    let root;
    if (lines.length && (lines[0].heading || (!lines[0].bullet && lines[0].indent === 0))) {
      root = makeNode(lines[0].text, 0, null);
      start = 1;
    } else {
      root = makeNode('My notes', 0, null);
    }
    root.kind = 'title';
    root.sourceLine = start ? lines[0].sourceLine : null;

    const rest = lines.slice(start);
    const hasHeadings = rest.some((l) => l.heading);
    let branchBase = [root]; // the plain-line branch we are inside, when there are no headings

    // path is the chain from the main topic to the most recent idea. Headings keep their
    // own stack so a deeper heading after a bullet still lands under its section heading.
    let path = [root];
    let headings = []; // [{ level, path }]
    let indents = []; // indentation widths seen since the last branch

    for (const line of rest) {
      const isBranch = line.heading > 0 || (!hasHeadings && !line.bullet && line.indent === 0);
      let parentPath;
      if (line.heading) {
        while (headings.length && headings[headings.length - 1].level >= line.heading) headings.pop();
        parentPath = headings.length ? headings[headings.length - 1].path : [root];
      } else if (isBranch) {
        parentPath = [root];
      } else {
        while (indents.length && indents[indents.length - 1] > line.indent) indents.pop();
        if (!indents.length || indents[indents.length - 1] < line.indent) indents.push(line.indent);
        const branchPath = headings.length ? headings[headings.length - 1].path : branchBase;
        parentPath = path.slice(0, Math.min(branchPath.length + indents.length - 1, path.length));
      }
      const parent = parentPath[parentPath.length - 1];
      const node = makeNode(line.text, parent.depth + 1, parent);
      node.sourceLine = line.sourceLine;
      path = parentPath.concat(node);
      if (isBranch) {
        indents = [];
        if (line.heading) headings.push({ level: line.heading, path });
        else branchBase = path;
      }
    }

    return { title: root.text, root, count: countIdeas(root) - 1 };
  }

  function countIdeas(node) {
    return node.children.reduce((sum, c) => sum + countIdeas(c), 1);
  }

  return { parseNotes, describe, countIdeas };
});
