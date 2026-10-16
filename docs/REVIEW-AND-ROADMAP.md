# Prototype review and next directions

Review date: October 15, 2026. Original pull request: [rk68193-sys/- #2](https://github.com/rk68193-sys/-/pull/2). Reviewed snapshot: `18f9237f301490e15d18b65aed98d0c97321ded1`. The working follow-up remains plain HTML/CSS/JavaScript with no build step.

## Beta follow-up (Claude, October 16, 2026)

Built on this branch. From the brainstorm below, these are now in the app: **focus one branch** (with a way back to the whole map), the **unanswered-question inbox**, **Anki-compatible export**, **user-set map text size**, and **notebook removal with Undo** (plus duplicate and search). The beta also adds a handwritten **Page** view with PDF download, carrying over the Handwritten PDF Maker engine from PR #1 so the project's original goal (typed notes that come out looking handwritten, with a choice of pen, font, paper and size) lives in one app.

Review findings on this branch, fixed in the beta:

| Finding | Fix |
| --- | --- |
| `F = ma` and `x = 5` became definitions ("F: ma") | New formula kind, boxed in cards and pages, with fill-in practice cards |
| `Key: a tool that opens locks` lost its term (bare "Key" was a highlight marker) | Only "Key point" / "Key idea", "Important", "Remember" and `!` mark highlights |
| `####` after a bullet nested under the bullet | Headings nest under the nearest shallower heading |
| Saved SVG text spilled out of boxes on computers without the same fonts | Each line is pinned with `textLength` to the width it was measured at |
| Every keystroke rewrote the whole notebook library to storage | Saves after a short pause, and always on tab hide/close |
| The Undo message was cramped on phones | Full-width toast with a larger Undo button on small screens |

Still open from the list below: labelled connections, timeline/comparison views, blank-map recall, spaced review, import preview, version history, IndexedDB.

## Product judgment

The prototype has a useful foundation: instant feedback, predictable local parsing, an approachable note syntax, escaped rendering, shared layout logic, and 28 passing tests. Its strongest next step is a complete study loop: **write → see relationships → retrieve from memory → check the source → revise**.

The original Cards view is a reading board, not flashcard practice. Its mind map describes a hierarchy, not every kind of relationship. Treat these as distinct functions so users know what they are seeing.

Students studying from class notes are the working audience assumption for this pass. The supplied biology/history examples support that choice; it has not been validated with users.

## Concrete findings in the original PR

All five findings below are addressed in the follow-up. The links point to the original snapshot so Claude can reproduce the before/after behavior.

| Priority | Finding and reproduction | Follow-up |
| --- | --- | --- |
| P1 | **Storage failure is invisible.** Deny browser storage or fill its quota, type notes, then close/reload. The catch at [app.js:22](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L22) swallows the failure; users have no durable note backup and no warning. | Explicit saved/unsaved state, persistent warning, JSON/Markdown backup, preservation of malformed storage, and migration tests. |
| P2 | **Ordinary words lose letters.** The example regex at [parser.js:19](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/parser.js#L19) accepts an unbounded “eg” prefix: `eggs` becomes `gs` and `Egypt` becomes `ypt`. | Bound example markers; regression cases retain ordinary words. |
| P2 | **An immediate export can use the previous notes.** Rendering waits 120 ms at [app.js:130](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L130), but export consumes cached layout at [app.js:320](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L320). Rapid edit/export can miss the edit. | Build each image export from current editor text; cap PNG dimensions and total pixels. |
| P2 | **Fit does not always show the whole map.** At [app.js:152](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L152), the 0.55 minimum scale leaves large maps outside a small board despite the Fit label. | True overview fit. Zoom provides a readable detail view. |
| P2 | **Map movement depends on dragging.** Pointer movement at [app.js:192](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L192) has no equivalent pan buttons; the keyboard handler at [app.js:247](https://github.com/rk68193-sys/-/blob/18f9237f301490e15d18b65aed98d0c97321ded1/text-notes-to-visual-notes/js/app.js#L247) only folds branches. | Arrow-key panning, Home to fit, +/− zoom, and visible Move buttons for single-pointer use. |

## What the working follow-up adds

1. **Separate notebooks.** A horizontal desk shelf, New notebook, and independent document text. Examples and imports create new notebooks instead of replacing the current one.
2. **Actual recall practice.** Definition cards, next-step sequence cards, and questions with explicitly indented answers. Reveal before self-rating; missed cards repeat. Unanswered questions are counted and excluded. No model generates or guesses answers.
3. **Source navigation.** Map selection, card-item links, and practice links select the original editor line. Blank lines, Markdown headings, tabs, and CRLF are accounted for.
4. **Portability.** Markdown/text imports, Markdown export, all-notebook JSON backup, additive JSON restore, PNG/SVG, and browser printing of reading cards.
5. **Truthful save status.** Legacy notes migrate without deletion. Blocked/quota/corrupt storage surfaces a persistent warning. Normal stale-tab writes are rejected and the user can back up in-memory edits.
6. **A paper-and-ink design.** Fieldnotes is a provisional working name. Serif editorial headings, a ruled writing surface, notebook tabs, restrained branch colors, daylight/evening palettes, and short task-based language carry the identity. No external fonts or assets are needed.
7. **A usable map path.** Select an idea → Edit source or Fold branch; pan by drag, keyboard, or buttons. Fit all is a complete overview.

Practice is a session-only self-check, not a mastery estimate or spaced-repetition scheduler. Notebook storage is local to a browser origin; it is not cross-device sync or guaranteed archival storage.

## Functionality brainstorm from different angles

These are proposals, not claims that the prototype already supports them. Effort is relative to this small local app.

| Angle | Function | Why it helps | Suggested order / effort |
| --- | --- | --- | --- |
| Understanding | **Labeled connections** such as causes, contrasts with, and depends on | A branch only says “belongs under”; labels express the actual relationship | Next / medium; introduce an explicit graph schema |
| Understanding | **Focus one branch** with a breadcrumb back to the whole map | Preserve readable text on dense maps without losing context | Next / small–medium |
| Understanding | **Representation picker:** timeline, comparison table, process, hierarchy | Match the structure to dates, alternatives, and steps rather than forcing everything into a tree | Next / medium per view |
| Learning | **Blank-map recall:** hide labels and rebuild relationships, then compare | Practice connections and explanation, beyond term definitions | Next / medium |
| Learning | **Unanswered-question inbox** with a source link | Turn gaps into a concrete action and prevent empty practice cards | Next / small |
| Learning | **Spaced review** with due dates and optional reminders | Bring ideas back after some forgetting | Later / medium; requires durable per-card history and stable identities |
| Learning | **Explain it to someone** prompts and a private written response | Encourage explanations and transfer beyond recognition | Next / small; self-check against source, not automatic truth scoring |
| Learning | **Compare two concepts** prompts | Build understanding of similarities and differences | Later / medium; relationships must be authored or explicitly accepted |
| Input | **Import preview** showing detected headings, examples, and questions | Explain how rough text is interpreted before adding it | Next / medium |
| Input | **Messy-note cleanup proposals** with a before/after diff and undo | Reduce formatting effort while preserving user control over meaning | Later / medium–large |
| Input | **Photo/PDF OCR with highlighted uncertain words** | Make paper notes reusable; source crops help users verify errors | Later / large; choose on-device or explicit opt-in processing |
| Input | **Audio transcript with timestamp links** | Let lecture notes lead back to the exact explanation | Later / large; recording/transcription requires explicit user intent |
| Evidence | **Source page/paragraph anchors** for imported reading | Keep an attractive summary traceable to its evidence | Next / medium; add provenance to the data model first |
| Editing | **Edit a node in place**, with the source line changing visibly | Make the visual board a working surface, not only an output | Next / medium; define reversible text edits |
| Editing | **Reorder/reparent ideas** by buttons and keyboard as well as drag | Let people correct structure without wrestling with indentation | Next / medium |
| Organization | **Version history and recoverable trash** | Recover from accidental edits and remove notebooks safely | Next / medium; current release intentionally has no delete action |
| Organization | **Link across notebooks** and surface repeated terms | Connect ideas across lectures and subjects | Later / medium; avoid equating same-name terms automatically |
| Organization | **Local search** across notebook titles and concepts | Keep a growing desk usable | Next / medium |
| Export | **Anki-compatible TSV** of accepted question/answer cards | Connect this capture tool to existing study habits | Next / small; escape tabs/newlines and include source context |
| Export | **Open canvas export** with editable nodes and edges | Preserve structure in other visual tools | Later / medium; JSON Canvas is one documented option |
| Access | **Semantic zoom / reading mode** that keeps labels legible | A complete overview is useful, but small text should not be the only view | Next / medium |
| Access | **User-set text size and board density** | Support different screens, vision, and working preferences | Next / small–medium; test reflow, do not only scale a screenshot |
| Reliability | **IndexedDB, background parsing, and input stress budgets** | Keep larger libraries responsive and reduce synchronous storage work | Later / medium; profile real workloads first |
| Trust | **Interpretation inspector** showing the source, detected type, and rules | Help users fix mistaken parsing without believing the app “understands” more than it does | Next / small–medium |

A focused next increment should combine branch focus, an unanswered-question inbox, and source-aware timeline/comparison views. OCR, transcription, and optional AI cleanup deserve separate experiments because each adds accuracy, permission, cost, and recovery work.

## Human UI directions to explore

### Study desk — implemented in this pass

An open notebook next to a working board. Horizontal notebook tabs create a sense of place. The primary verbs are Map, Cards, Practice, Edit source, and Reveal answer. A warm neutral surface, dark green ink, modest terracotta selection, and readable serif headings give the app a recognizable character.

Use handwriting sparingly, if at all: the notes themselves must remain easy to read. Branch color communicates grouping; labels, indentation, outlines, and controls also communicate structure. Paper texture remains quiet enough that the words dominate.

### Field guide

An editorial study book: topic index, chapter dividers, specimen-style diagrams, margin questions, and source footnotes. This suits history, biology, and structured lessons. Timeline and comparison views fit naturally. It should feel like a well-edited reference book rather than a feed of generated cards.

### Synthesis studio

A spacious workspace for researchers and project work: free connections, a selected-item detail panel, evidence anchors, and saved views of the same source material. Use a restrained palette, generous typography, and precise tool labels. Avoid decorative dashboard statistics; every control should affect the current material.

### Pocket notebook

A phone-first capture flow: open straight into the current notebook, then move to Map or Practice when ready. Use a deliberate editor/board switch so both surfaces have enough room. Keep source editing and recovery controls reachable without hover. This is a separate mobile experiment; the implemented release currently stacks editor and board.

Across all directions, make the document and the person's thinking the center of the screen. Keep generative assistance, if added, contextual: “Suggest a clearer heading” or “Propose a connection” beside selected material, with an inspectable change.

## Evidence informing the proposals

- [The Learning Scientists: retrieval practice](https://www.learningscientists.org/blog/2016/6/23-1) recommends retrieving before checking notes, feedback afterward, and concept-map reconstruction from memory. This supports hidden-answer practice and motivates blank-map recall; it does not establish that this prototype improves grades.
- [W3C: understanding dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) distinguishes keyboard support from a single-pointer alternative. That is why this release includes both arrow keys and Move buttons. This is not a complete WCAG audit.
- [Obsidian Canvas](https://obsidian.md/canvas) documents text/file/media cards and connections in an open format. It is a reference for portability and authored relationships, not a reason to copy its interface.

## Validation completed

- Original snapshot: **28/28 Node tests pass**.
- Follow-up: **44/44 Node tests pass**.
- Browser checks: notebook creation and reload persistence; preservation of the existing notebook; Markdown import as a separate notebook; recall reveal, retry and remembered actions; source-line selection; card and map modes; branch selection/folding/unfolding; arrow-key pan and fit; daylight/evening rendering.
- Real SVG, PNG, and JSON backup downloads inspected. The PNG has a valid signature and dimensions; SVG contains the edited notes; the backup contains both test notebooks.
- Desktop, 390 px phone, and 320 px narrow layouts inspected for document overflow. Saved screenshots accompany the follow-up.
- Print CSS is implemented; the system print dialog/PDF output and other browser engines were not verified in this environment. No usability study or full assistive-technology audit has been run.

## Suggested review for Claude

1. Run `npm test` in `text-notes-to-visual-notes`.
2. Inspect `js/notebooks.js` for migration, malformed data preservation, stale-tab handling, validation, and recall-session transitions.
3. Check source-line selection after blank lines, CRLF, nested headings, repeated labels, and edits.
4. Try editing then immediately exporting; verify file content matches the editor and folded state.
5. Exercise imports/backups on `file://` and HTTP origins separately; notes are origin-specific. Check blocked storage with a backup path before closing.
6. Assess question quality for generic labels such as “Where” and for ambiguous sequences. Answers are copied, not fact-checked.
7. Review whether the mobile editor should become a deliberate separate screen, and whether branch focus should precede additional visual formats.
8. Prioritize a small next release from the roadmap rather than treating every idea as a required feature.

## Known limitations and decisions

- LocalStorage saves remain synchronous. The compare-before-write lease detects normal stale saves but is not an atomic multi-tab transaction.
- Practice progress resets on edits/reload. Card identities derive from parsed text; durable spaced scheduling needs a stronger identity model.
- Notebook removal, conflict merging, automatic recovery history, cross-device sync, and cloud accounts are not implemented.
- Extremely large or deeply nested inputs may exceed layout/parser budgets. Imports are capped at 2 MB, but this is not a comprehensive performance or memory guarantee.
- Source navigation is line-based. Future OCR/PDF/URL evidence will need a richer provenance model.
- The provisional Fieldnotes name needs availability checks before public branding.
