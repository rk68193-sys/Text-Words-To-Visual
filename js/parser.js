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
  const BULLET = /^(?:([-*+•·–—])|(\d{1,3})[.)])\s+(.*)$/;
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
  const DEFINITION = /^(.{1,48}?)\s*(:\s|\s=\s|\s[-–—]\s)\s*(.+)$/;
  // "det A = 0 ⇔ columns dependent" and "Ax = v and Ax = w consistent ⇒ …" state facts; they are not definitions.
  const IMPLIES = /[⇒⇔]/;
  // "Theorem 4.1.1 (Existence): …", "Def: …", "Proof (n = 2): …", "Warning: …", "Tip: …", "Hook: …" (a memory hook)
  const CALLOUT = /^((theorem|thm|lemma|corollary|proposition|prop|definition|defn|def|proof|pf|warning|caution|trap|pitfall|common mistake|watch|tip|hint|insight|intuition|takeaway|lesson|hook|mnemonic|note|nb)\b[^:]{0,90}?):\s*(.*)$/i;
  const PROOF_START = /^(proof(?:\s+(?:idea|sketch))?)\b\s*(.*)$/i;
  const CALLOUT_TYPES = [
    ['proof', /^(?:proof|pf)\b|\bproof\b/i],
    ['theorem', /^(?:theorem|thm|lemma|corollary|proposition|prop)\b/i],
    ['definition', /^(?:definition|defn|def)\b/i],
    ['warning', /^(?:warning|caution|trap|pitfall|common mistake|watch)\b/i],
    ['tip', /^(?:tip|hint|insight|intuition|takeaway|lesson|hook|mnemonic)\b/i],
    ['note', /^(?:note|nb)\b/i],
  ];
  // "Ex 3: …", "Ex 3 (x'' + 16x = 0):", "Example 2: …", "Fig 20: …"
  const NUMBERED_EXAMPLE = /^((?:ex|example|fig|figure)\.?\s*\d[\w.–-]*(?:\s*\([^)]*\))?)\s*:\s*(.*)$/i;
  // A whole line in bold names a part of a section: **INTUITION**, __Steps__.
  const BOLD_LINE = /^(?:\*\*[^*]+\*\*|__[^_]+__)\s*:?$/;

  // ---------- Ink marks ----------
  // {red}…{/} writes the words between in another ink on the handwritten pages, across
  // lines too: {blue} at the start of one paragraph and {red} at the start of the next.
  // A mark is a named ink or a hex color; {/} (or {/red}) goes back to the ink before it.
  // Only these names count, so math like e^{x} is left alone.
  const INK_NAMES = ['blue', 'black', 'graphite', 'gray', 'grey', 'red', 'green', 'purple', 'teal', 'navy', 'brown', 'orange', 'pink', 'maroon', 'forest', 'white', 'yellow'];
  const INK_MARK = new RegExp(`\\{(/?)(${INK_NAMES.join('|')}|#[0-9a-f]{6}|#[0-9a-f]{3})?\\}`, 'gi');

  // {center} or {right} anywhere on a line lines it up on the handwritten pages ({left} is the usual).
  const ALIGN_MARK = /\{(left|center|centre|right)\}/gi;

  // The notes without their ink and alignment marks, for the map, cards and practice.
  function stripInk(text) {
    return String(text).replace(INK_MARK, (all, close, spec) => (close || spec ? '' : all)).replace(ALIGN_MARK, '');
  }

  // A line's alignment mark, and the line without it.
  function readAlign(line) {
    let align = null;
    const rest = String(line).replace(ALIGN_MARK, (all, a) => { align = a.toLowerCase() === 'centre' ? 'center' : a.toLowerCase(); return ''; });
    return { align: align === 'left' ? null : align, line: rest };
  }

  /**
   * inkRuns(text, onMark) walks the ink marks in order, keeping a stack so {/} returns
   * to the ink before. Calls onMark(index, length, inkAfter) for each mark, where inkAfter
   * is a lower-case name or hex, or null for the page's own ink.
   */
  function inkRuns(text, onMark) {
    const stack = [];
    String(text).replace(INK_MARK, (all, close, spec, index) => {
      if (!close && !spec) return all;
      if (close) stack.pop();
      else stack.push(spec.toLowerCase());
      onMark(index, all.length, stack.length ? stack[stack.length - 1] : null);
      return all;
    });
  }

  function cleanInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .trim();
  }

  function looksLikeFormula(left, right) {
    if (/:\/\//.test(left + right)) return false;
    // A long explanation after the = is a sentence about the thing, not a formula to fill in.
    if (IMPLIES.test(right) || (right.match(/[A-Za-z]{3,}/g) || []).length > 3) return false;
    const lhs = left.trim();
    if (!lhs || lhs.split(/\s+/).length > 4) return false;
    if (MATH.test(right) || MATH.test(lhs)) return true;
    // A short symbol on each side: F = ma, KE = ½mv². "ATP = energy currency" stays a definition.
    // Ψₛ = −iCRT: lowered letters (ₐ … ₜ) count as part of a symbol's name, like digits (₀ … ₉).
    return /^[A-Za-zΑ-ω][\w₀-ₜΑ-ω']{0,2}$/.test(lhs) && /^\S{1,8}$/.test(right.trim());
  }

  // "If a_n(x) = 0 somewhere…", "(a) x(0) = 0, …" and "Nul A = {0} ⇔ one-to-one" are statements
  // with an = in them, not "Term = meaning".
  function looksLikeStatement(term, sep, detail) {
    if (/\?["”]?$/.test(term)) return false; // "Is y in Span{…}?" = how to answer it
    if (term.split(/\s+/).length >= 4 && detail.trim().length < 10) return true;
    if (sep !== '=') return false;
    if (IMPLIES.test(detail) || /^(?:if|when|choose|let|then|so|and|but|since|re-\w+)\b|^\(\w\)/i.test(term)) return true;
    const named = (term.match(/[A-Za-z]{3,}/g) || []).length >= 2;
    const explained = /^(?:(?:a|an|the)\s+)?[A-Za-z][a-z'’-]{2,}\b/.test(detail.trim());
    return !named && !explained;
  }

  function looksLikeTerm(term) {
    if (/https?$|www\./i.test(term)) return false;
    if (/[.!?]$/.test(term)) return false;
    return term.split(/\s+/).length <= 6;
  }

  /**
   * isLabel(body) -> true for a line that names a sub-section rather than saying something:
   * a line in bold (**INTUITION**), a short line in capitals (PROBLEM-SOLVING CHECKLIST),
   * or a short line ending in a colon (Light reactions:). Bullets are never labels.
   */
  function isLabel(body) {
    if (FIGURE.test(body)) return false;
    if (BOLD_LINE.test(body)) return true;
    if (/[?.!=]$/.test(body) || /[=→]/.test(body)) return false;
    const words = body.replace(/\([^)]*\)/g, ' ').trim();
    const letters = words.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase() && words.split(/\s+/).length <= 6) return true;
    return /^[^:]{1,60}:$/.test(body) && body.split(/\s+/).length <= 8;
  }

  function calloutType(label) {
    const hit = CALLOUT_TYPES.find(([, test]) => test.test(label));
    return hit ? hit[0] : 'note';
  }

  // ![Caption](fig:abc) puts a drawing or graph from the notebook into the notes.
  const FIGURE = /^!\[([^\]]*)\]\(fig:([\w-]{1,64})\)\s*$/;

  // Reads one line of text and works out what kind of idea it is.
  function describe(rawText) {
    let text = rawText.trim();
    const idea = { text: '', kind: 'text', important: false };
    const figure = FIGURE.exec(text);
    if (figure) return Object.assign(idea, { kind: 'figure', figure: figure[2], text: figure[1].trim() || 'Drawing', raw: text });

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
    idea.raw = text; // the words as written, for answers that should not be reworded

    if (idea.kind === 'text') {
      const callout = CALLOUT.exec(text);
      const proof = callout ? null : PROOF_START.exec(text);
      if (callout || (proof && proof[2])) {
        idea.kind = 'callout';
        idea.label = (callout ? callout[1] : proof[1]).trim();
        idea.callout = calloutType(idea.label);
        idea.body = (callout ? callout[3] : proof[2]).trim();
        idea.text = !callout ? text : idea.body ? `${idea.label}: ${idea.body}` : idea.label;
        return idea;
      }
    }

    if (idea.kind === 'text') {
      const numbered = NUMBERED_EXAMPLE.exec(text);
      const example = numbered ? null : EXAMPLE.exec(text);
      if (numbered) {
        idea.kind = 'example';
        idea.label = numbered[1].trim();
        text = numbered[2].trim() || idea.label;
        if (text === idea.label) idea.label = '';
      } else if (example && example[0].length < text.length) {
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
      if (def && !looksLikeStatement(def[1], def[2].trim(), def[3]) && looksLikeTerm(def[1])) {
        idea.kind = 'definition';
        idea.term = def[1].trim();
        idea.detail = def[3].replace(ARROW_ALL, ' → ').trim();
      }
    }

    if (idea.kind === 'text' && ARROW.test(text)) {
      const steps = text.split(ARROW).map((s) => s.trim());
      if (steps.length >= 2 && steps.every((step) => step && step.length <= 90)) {
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

  // A label line keeps only its words: "**INTUITION**" -> "INTUITION", "Light reactions:" -> "Light reactions".
  function describeLabel(rawText) {
    const text = cleanInline(rawText.trim()).replace(/\s*:\s*$/, '').trim();
    return { text, kind: 'label', important: false };
  }

  function makeNode(line, depth, parent) {
    const idea = line.label ? describeLabel(line.text) : describe(line.text);
    const node = Object.assign(idea, { depth, children: [] });
    if (line.heading) node.heading = line.heading;
    if (line.numbered) node.numbered = line.numbered;
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
    for (const [lineIndex, line] of stripInk(String(input || '')).replace(/\r\n?/g, '\n').split('\n').entries()) {
      const expanded = line.replace(/\t/g, '    ');
      const body = expanded.trim();
      if (!body || RULE.test(body)) continue;
      const indent = expanded.length - expanded.trimStart().length;
      const heading = HEADING.exec(body);
      if (heading) {
        lines.push({ sourceLine: lineIndex + 1, indent, heading: heading[1].length, bullet: false, label: false, text: heading[2].trim() });
        continue;
      }
      const bullet = BULLET.exec(body);
      lines.push({
        sourceLine: lineIndex + 1, indent, heading: 0, bullet: !!bullet,
        numbered: bullet && bullet[2] ? Number(bullet[2]) : 0,
        label: !bullet && isLabel(body),
        text: bullet ? bullet[3].trim() : body,
      });
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
   *
   * A label line (**INTUITION**, STEPS, "Light reactions:") opens a sub-section: the lines
   * after it at the same indent, or deeper, belong to it until the next label at that
   * indent, a line further left, or a heading.
   */
  function parseNotes(input) {
    const lines = readLines(input);
    let start = 0;
    let root;
    if (lines.length && (lines[0].heading || (!lines[0].bullet && lines[0].indent === 0))) {
      root = makeNode(Object.assign({}, lines[0], { label: false }), 0, null);
      start = 1;
    } else {
      root = makeNode({ text: 'My notes' }, 0, null);
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
    let indents = []; // indentation widths seen since the last branch or label
    let labels = []; // open sub-sections: [{ indent, path, indents }]

    for (const line of rest) {
      const isBranch = line.heading > 0 || (!hasHeadings && !line.bullet && line.indent === 0);
      let parentPath;
      if (line.heading) {
        while (headings.length && headings[headings.length - 1].level >= line.heading) headings.pop();
        parentPath = headings.length ? headings[headings.length - 1].path : [root];
      } else if (isBranch) {
        parentPath = [root];
      } else {
        // A line further left than a label, or another label at its indent, closes that sub-section.
        while (labels.length) {
          const top = labels[labels.length - 1];
          if (line.indent > top.indent || (line.indent === top.indent && !line.label)) break;
          indents = top.indents;
          labels.pop();
        }
        while (indents.length && indents[indents.length - 1] > line.indent) indents.pop();
        if (!indents.length || indents[indents.length - 1] < line.indent) indents.push(line.indent);
        const basePath = labels.length ? labels[labels.length - 1].path
          : headings.length ? headings[headings.length - 1].path : branchBase;
        parentPath = path.slice(0, Math.min(basePath.length + indents.length - 1, path.length));
      }
      const parent = parentPath[parentPath.length - 1];
      const node = makeNode(isBranch ? Object.assign({}, line, { label: false }) : line, parent.depth + 1, parent);
      node.sourceLine = line.sourceLine;
      path = parentPath.concat(node);
      if (isBranch) {
        indents = [];
        labels = [];
        if (line.heading) headings.push({ level: line.heading, path });
        else branchBase = path;
      } else if (line.label) {
        labels.push({ indent: line.indent, path, indents });
        indents = [];
      }
    }

    return { title: root.text, root, count: countIdeas(root) - 1 };
  }

  function countIdeas(node) {
    return node.children.reduce((sum, c) => sum + countIdeas(c), 1);
  }

  return { parseNotes, describe, countIdeas, isLabel, stripInk, inkRuns, readAlign, INK_NAMES };
});
