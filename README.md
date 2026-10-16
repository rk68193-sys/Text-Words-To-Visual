# Fieldnotes — text notes to visual notes

Fieldnotes is a local notebook that turns your words into a mind map, a board of reading cards, and recall practice. **Live site: https://rk68193-sys.github.io/Text-Words-To-Visual/** (GitHub Pages, deployed from the `main` branch root). You can also open **index.html** directly in a modern browser; no install, build, external fonts, account, or model API is required.

Developed in [rk68193-sys/-](https://github.com/rk68193-sys/-) (PRs #2–#4); this repository is the published copy.

![Fieldnotes desktop](docs/fieldnotes-desktop.jpg)

[Evening preview](docs/fieldnotes-evening.jpg) · [Phone preview](docs/fieldnotes-mobile.jpg)

## Beta: what's new

![The Page view: your notes in handwriting](docs/beta-page-view.png)

- **Page view, your notes in handwriting.** A fourth tab writes the current notebook out by hand on paper. Choose the handwriting (6 bundled fonts), pen (ballpoint, gel, pencil, fountain, felt tip, chalk), ink, a second accent ink for headings, terms and questions, a highlighter for `!` ideas, paper (college ruled, legal pad, graph, dot grid, plain, chalkboard), Letter or A4, writing size and messiness. **Download PDF** saves every page. Formulas get a hand-drawn box and tasks get hand-drawn check boxes. The engine comes from the Handwritten PDF Maker (PR #1); fonts and jsPDF are bundled, so it works offline.
- **Parser fixes.** `F = ma`, `E=mc^2` and `v = d / t` are formulas (shown boxed, with fill-in practice cards) instead of definitions. A term called `Key:` keeps its name. A deeper heading after a bullet (`####` under `##`) now nests under its section heading instead of under the bullet.
- **Desk management.** Delete a notebook (with Undo), duplicate one, and find notebooks by any words in them (`Ctrl+K`).
- **Focus a branch.** Select a branch on the map and press Focus (or `F`) to see just that part, with a "← Whole map" button (`Esc`).
- **Better practice.** Keyboard practice (`Space` reveals, `1` / `2` rate), shuffle, "Practice the ones I missed" at the end, and a list of questions still waiting for an answer with a link to each one.
- **Anki export.** Export → Practice cards for Anki saves a tab-separated file that Anki (File → Import) and most flashcard apps read.
- **Phone writing toolbar.** On phones and tablets, buttons above the editor indent, outdent, make headings, bullets, tasks and `!` marks, so you don't need a Tab key.
- **Settings.** Theme (including "match my device"), map lettering in any of the handwriting fonts, map text size, shuffled practice, and typing `->` to get →.
- **Shortcuts.** `Alt+1`–`4` switch views, `Ctrl+S` saves now, `Ctrl+E` jumps between the editor and the board, `?` lists everything.
- **Fixes.** A saved SVG keeps its words inside the boxes on computers without the same fonts (each line is pinned with `textLength`). Notes save shortly after you pause instead of rewriting storage on every key, and always before the tab closes. The Undo message no longer crowds phone screens.

## What changed after prototype PR #2

- **A notebook desk:** keep separate notebooks, switch between them, and add examples without replacing your work.
- **Practice:** definitions become question/answer cards, arrows become next-step questions, and questions with indented answers use exactly those written answers. Reveal, self-rate, and repeat missed cards. Questions without written answers are excluded.
- **Source navigation:** select any map idea, then Edit source; use ↗ next to a reading-card item or in Practice to select the original line in the editor.
- **Portable files:** import .md/.txt, export this notebook as Markdown, and back up all notebooks as JSON. Import a backup to add its notebooks without replacing existing ones.
- **Safer persistence:** saves are explicitly reported. Full/blocked/corrupt storage and stale tabs produce a persistent warning and backup action. The old single-note key migrates without being deleted.
- **Reachable maps:** Fit all really fits; arrow keys and click/tap Move controls pan. +/− zoom, Home fits, and selecting a branch exposes Fold/Unfold.
- **Paper-and-ink UI:** notebook tabs, serif headings, ruled writing space, restrained branch colors, daylight/evening themes, reduced-motion support, and a stacked phone layout.
- **Export fixes:** PNG/SVG build from the latest text even during the typing debounce. PNG dimensions and total pixels are bounded.
- **Print:** Export → Print study cards / PDF uses the browser's print dialog and always prints the current cards.

## Write naturally, add structure when useful

The first nonempty unbulleted line is the topic. Unindented lines become branches when there are no Markdown headings; otherwise use headings for branches and bullets for ideas.

```text
Cell biology
## Energy
- ATP: the cell's energy currency
- Light → excited electrons → ATP
- Where is DNA stored?
  - In the nucleus
- ! Follow the evidence
- e.g. a plant cell
- [ ] Read chapter 8
```

Tab / Shift+Tab indent/outdent. Enter continues a list. Esc then Tab leaves the editor. Select map ideas with click, Enter, or Space; fold them using the selected-idea panel. Map movement works with arrows or the Move menu.

Practice ratings are your own check-in, not a mastery score. Sessions reset when the note text changes or the page reloads. This release does not schedule spaced repetition.

## Open and test

Double-click **index.html**, or serve this folder with any static HTTP server. Keep using the same origin/browser profile to keep browser saves together.

Requires Node 18+ for tests only:

```sh
npm test
```

62 tests cover the original parser/layout/render behaviors plus example-boundary regressions, source locations, notebook validation, migration, save denial/quota, stale writes, source-grounded study cards, recall sessions, and the beta additions: formulas, the Key/heading fixes, delete/undo/duplicate/search, shuffle and missed cards, Anki escaping, map text size, SVG text pinning, and handwritten page layout (margins, page breaks, accent ink across wrapped lines).

## Privacy and limits

Notes stay in this browser. There are no outbound API calls or external assets; fonts and the PDF library ship in this folder. Browser storage is not a durable backup: exporting JSON is the recovery path, and browser/file origins can differ. No automatic cross-device sync, encryption, OCR, AI cleanup, collaborative editing, or long-term practice scheduling is included.

Storage conflict checks detect normal stale-tab writes; this is not a transactional database. Close extra editing tabs before continuing. If storage is unreadable, the app preserves it and blocks overwriting; download your in-memory notes before repairing browser storage. Text imports are limited to 2 MB; extremely large/deep maps are not a supported workload.

The existing docs/screenshot-*.png images in the original PR depict the earlier interface. See **docs/REVIEW-AND-ROADMAP.md** for findings, prioritized ideas, UI alternatives, and the review checklist for Claude.

## Files

- js/parser.js — notes structure, kinds, and source lines
- js/layout.js — map geometry and reading-card grouping
- js/render.js — escaped SVG/HTML and canvas exports
- js/notebooks.js — validated persistence, notebook desk actions, recall model and Anki export, shared with Node
- js/handpage.js — notes → handwritten lines → pages (pure, tested)
- js/hand.js, js/symbols.js — drawing handwriting, paper and hand-drawn symbols on a canvas
- fonts/ — six handwriting fonts (SIL Open Font License / Apache 2.0, licences alongside)
- vendor/ — jsPDF 2.5.1 (MIT) for the PDF download
- js/app.js — editor, notebook/file actions, views, and camera interactions
- css/styles.css — responsive paper-and-ink design and print styles
- tests/ — behavior and regression tests
