/*
 * Course notebooks that ship with the site. Each one joins your desk once, the first time
 * you open the site after it was added (deleting it later is remembered). Version 2 adds
 * drawings; it replaces a copy you never edited and arrives beside one you did. They are
 * also in the "Borrow a starting point" list, which adds a fresh copy.
 *
 * The math notebooks were written from the study notes of October 16, 2026. The AP Biology
 * notebook (Unit 2 Part II) was written from the class slide decks of October 19, 2026; its
 * multiple-choice cards explain every answer choice.
 */
(function (root) {
  root.VisualNotes = Object.assign(root.VisualNotes || {}, {
    COURSE_NOTES: [
      {
        id: 'course-2026-10-16-linear-algebra',
        version: 2,
        replaces: ["d5c5fba0"],
        label: 'Linear Algebra · Oct 16 (Lay 3.1–4.2)',
        date: '2026-10-16T12:00:00.000Z',
        text: `# Linear Algebra · Oct 16

## Ch 3 intro: why determinants
- Weighing-diamonds example: design matrix D (+1 right pan, −1 left pan; rows = weighings, cols = objects). Best design maximizes det(DᵀD) (e.g. 64 vs 256).
  - Intuition: bigger det = rows "more independent/spread out" = less error amplification.
- Big picture: det = scale factor for area/volume under x → Ax (seed of the Jacobian in Calc III); det ≠ 0 ⇔ invertible (used heavily in Ch 5 eigenvalues).

## 3.1 Cofactor expansion
**INTUITION**
- Det generalizes the 2×2 test ad − bc ≠ 0. The 3×3 formula literally falls out of row-reducing A: last pivot ends up as a₁₁·Δ, so Δ ≠ 0 is what keeps the pivot alive.
- Recursive: n×n det built from (n−1)×(n−1) dets. Sign checkerboard (−1)^(i+j) depends on POSITION, not the entry's sign.
- ! Zeros are your friend: a row/col of mostly zeros kills terms. Triangular ⇒ det = product of diagonal (Thm 2). A zero row/col ⇒ det 0.
- Size sanity check: |det| ≤ n·p, p = product of n largest |entries| (count repeats).
  - Warning: check this bound. A 3×3 matrix of ±1s can have det 4 > n·p = 3, so it is probably n!·p (each of the n! terms in the expansion is at most p).
- Cofactor expansion costs > n! mults (25×25 ≈ 500k years) → theoretical/hand tool only.
**EQUATIONS / PROCEDURE**
- A_ij = delete row i, col j. Cofactor C_ij = (−1)^(i+j) det A_ij.
- det A = Σ_j a_1j C_1j. Thm 1: expand along ANY row i (Σ_j a_ij C_ij) or column j (Σ_i a_ij C_ij).
- 3×3 shortcut: copy first two cols, add 3 down-diagonals minus 3 up-diagonals (NOT for 4×4+).
- Problem tactic: pick row/col with most zeros; repeat recursively (Ex 3: 5×5 → 3·2·(−2) = −12).
- Exercise themes: elementary matrix dets (replacement = 1, swap = −1, scale = k); det(EA) = det E · det A; det(kA) = kⁿ det A (2×2: k²), NOT k det A.

## 3.2 Properties
**INTUITION**
- ! "The secret of determinants lies in how they change under row ops." Replacement = shear (area unchanged); swap = flips orientation (sign); scaling a row by k scales volume by k.
  - ![A row replacement is a shear: same base, same height, same area](fig:la-shear)
- So row-reduce to triangular, multiply pivots, fix sign for swaps. Product of pivots is unique up to sign even though echelon forms aren't.
- det A = 0 ⇔ columns (or rows) dependent ⇔ parallelepiped is flat ⇔ squashes space down a dimension ⇔ not invertible (Thm 4, joins IMT).
- det Aᵀ = det A (Thm 5) ⇒ every row fact is also a column fact.
- det(AB) = det A · det B: scale factors compose (do B then A). det is NOT additive: det(A+B) ≠ det A + det B.
- Multilinear: det is linear in any ONE column when others fixed (T(cx) = cT(x), T(u+v) = T(u) + T(v)).
**EQUATIONS / PROCEDURE**
- Thm 3: replacement → det unchanged; interchange → −det; scale row by k → k·det (factor a common k OUT of a row).
- (1) det A = (−1)^r · (product of pivots of echelon U) if invertible; 0 otherwise (r = # swaps).
- Cost ≈ 2n³/3 ops (25×25 instant).
- Thm 6: det AB = (det A)(det B). Consequences: det A⁻¹ = 1/det A; det Aᵏ = (det A)ᵏ; A² = I ⇒ det A = ±1; A³ = 0 ⇒ det A = 0; det(AᵀA) = (det A)² ≥ 0; det(−A) = (−1)ⁿ det A.
- Tactics: get a 1 in top-left (factor out or swap); spot two equal/proportional rows after a replacement ⇒ det 0 immediately (Ex 3); mix row ops + cofactor expansion (Ex 4: −30). Test independence of 3 vectors in R³: det[v1 v2 v3] ≠ 0.
- Proof idea (Thm 3 by induction on n, expand along an untouched row; Thm 6 via A = E_p…E_1 or both sides 0).

## 3.3 Cramer's rule, A⁻¹ formula, area/volume, linear transformations
**INTUITION**
- Cramer: x_i = (volume when b replaces column i) / (original volume). Proof trick: A·I_i(x) = A_i(b), and det I_i(x) = x_i.
  - Theoretical tool: shows how x depends on b (sensitivity); hopeless for big n (each det ≈ cost of solving the system). OK for 2×2/3×3, or 3×3 complex.
- Parameter systems (Laplace-transform engineering, Ex 2): unique solution exactly where det A(s) ≠ 0 (3s² − 12 ⇒ s ≠ ±2).
- Adjugate formula: just Cramer applied to each column A x = e_j. Useful theoretically: integer A with det 1 ⇒ A⁻¹ integer.
- Geometry: |det[a1 a2]| = parallelogram area; |det[a1 a2 a3]| = parallelepiped volume. Why: diagonal case is a rectangle/box; shearing (adding c·a1 to a2) slides the top along a parallel line/plane, keeping base and height.
  - ![The parallelogram on a₁ and a₂ has area |det| of the matrix with columns a₁, a₂](fig:la-parallelogram)
- ! T(x) = Ax multiplies EVERY area/volume by |det A| (any region with finite area, via grid of tiny squares → parallelograms). Translations don't change area. Ex: ellipse = image of unit disk under diag(a,b) ⇒ area πab. This is the Jacobian idea.
  - ![T = diag(a, b) stretches the unit disk to an ellipse: area π becomes πab](fig:la-ellipse)
- Sign of det = orientation (negative = flip); |det| = size.
**EQUATIONS / PROCEDURE**
- A_i(b) = A with column i replaced by b. Thm 7: x_i = det A_i(b) / det A (A invertible).
- Thm 8: A⁻¹ = (1/det A)·adj A, adj A = TRANSPOSE of cofactor matrix: (i,j) entry of adj A is C_ji. Check: (adj A)A = (det A)I (Ex 3: 14I ⇒ det 14).
- 2×2 case reproduces [d −b; −c a]/(ad − bc).
- Area of parallelogram from 4 vertices: translate one vertex to origin, put the two adjacent edge vectors as columns, |det| (Ex 4: 28). Triangle with vertices 0, u, v = ½|det[u v]|.
- Thm 10: area T(S) = |det A|·area S (2D); volume T(S) = |det A|·vol S (3D). Combine: area of image of parallelogram from b1, b2 = |det A|·|det[b1 b2]| = |det(AB)|.
- Supplementary T/F traps: det 5A = 125 det A for 3×3; det(A+B) unknown; det A³ = 8 if det A = 2; det Aᵀ = det A; det A⁻¹ = 1/det A; Cramer needs invertible A; adding a combination of OTHER rows keeps det.
- Row-op tricks for "show det = 0": subtract rows to create equal/proportional rows (e.g. consecutive-integer rows; rows a, a+x, a+y).
- Line through 2 points: det[[1,x,y],[1,x1,y1],[1,x2,y2]] = 0.

## Ch 4 intro: vector spaces everywhere
- Discrete-time signals (DSP, Alexa, stock smoothing): a signal {y_k} is a "vector"; filters are linear transformations.
- Goal of chapter: everything learned in Rⁿ works for ANY set where you can add and scale sensibly.

## 4.1 Vector spaces & subspaces
**INTUITION**
- A vector space = any "universe" closed under + and scalar ·, with the usual algebra rules. Vectors can be arrows (no coordinates), sequences, polynomials, functions, matrices. Think of a whole function f as ONE point.
- Subspace = a smaller universe inside V that you can't escape by adding or scaling. Geometrically in R³: {0}, lines through 0, planes through 0, R³ itself.
  - ![Subspaces of R³ pass through 0; a shifted plane does not](fig:la-subspaces)
- ! Anything NOT through the origin (shifted line/plane, solutions of Ax = b with b ≠ 0) is not a subspace.
- Span{v1..vp} is always a subspace; spanning vectors are "handles" for an infinite set.
- R² is NOT a subspace of R³ (different-length vectors), though the x1x2-plane {(s,t,0)} "acts like" R².
**EQUATIONS / PROCEDURE**
- 10 axioms (closure under +, commutative, associative, zero vector, negatives, closure under ·, two distributive laws, c(du) = (cd)u, 1u = u). Facts: 0u = 0, c0 = 0, −u = (−1)u; zero and negatives are unique.
- Standard examples: Rⁿ; arrows; S (doubly infinite signals); S_f finitely supported signals (subspace of S); P_n polynomials deg ≤ n (subspace of P, which is a subspace of functions on R); all real functions on a set D; M_{m×n} matrices.
- SUBSPACE TEST (H ⊆ V): (a) 0 ∈ H (b) u, v ∈ H ⇒ u + v ∈ H (c) u ∈ H ⇒ cu ∈ H. Check 0 FIRST — if missing, done (not a subspace).
- Disproving: give a specific counterexample (e.g. H = {(3s, 2+5s)}: u = (3,7), 2u = (6,14) needs s = 2 and s = 12/5 — impossible).
  - Common failures: missing 0, conditions like x ≥ 0 (fails scaling by −1), xy = 0 or unions (fail addition), nonhomogeneous constants.
- Thm 1: Span{v1..vp} is a subspace of V. FASTEST proof technique: rewrite the parametric set as a linear combination, e.g. (a−3b, b−a, a, b) = a(1,−1,1,0) + b(−3,1,0,1) ⇒ H = Span{v1, v2} ⇒ subspace.
- Each v_k ∈ Span{v1..vp} (weight 1 on v_k, 0 elsewhere).
- "Is y in Span{v1, v2, v3}?" = is [v1 v2 v3 | y] consistent; parameter h found by row reduction (Ex 13: h = 5).
- Symmetric 3×3 matrices form a subspace of M_{3×3} (0ᵀ = 0, (A+B)ᵀ = A+B, (cA)ᵀ = cA).
- Text: solution set of y'' + ω²y = 0 is the space in 4.1 Ex 19 (span of cos ωt, sin ωt) — ties to MTH 267.

## 4.2 Nul A, Col A, Row A, kernel & range
**INTUITION**
- Two ways subspaces arise: (1) IMPLICITLY as solutions of homogeneous equations (Nul A — a test vectors must pass), (2) EXPLICITLY as all combos of given vectors (Col A — a recipe to build vectors).
- Nul A = everything x → Ax crushes to 0 (lives in DOMAIN Rⁿ). Col A = everything Ax can reach = range (lives in CODOMAIN Rᵐ). For non-square A they live in different universes.
  - ![Nul A lives in the domain and is crushed to 0; Col A is everything Ax can reach](fig:la-nul-col)
- Nul A = {0} ⇔ one-to-one; Col A = Rᵐ ⇔ onto.
- Homogeneous matters: Ax = b (b ≠ 0) solution set is a shifted copy of Nul A, not a subspace.
- Kernel/range generalize to any linear T: V → W.
  - Differentiation D is linear: kernel = constants, range = all continuous functions.
  - ! Solutions of y'' + ω²y = 0 = kernel of y ↦ y'' + ω²y (homogeneous linear ODE solution sets are kernels — superposition principle!).
  - 2-day moving average M2{p_k} = {(p_k + p_{k−1})/2}: kernel = multiples of alternating signal {(−1)ᵏ} → it kills day-to-day zigzag but keeps trends.
    - ![The 2-day moving average sends the zigzag (−1)ᵏ to 0, so it is in the kernel](fig:la-zigzag)
**EQUATIONS / PROCEDURE**
- Def: Nul A = {x ∈ Rⁿ : Ax = 0}. Thm 2: subspace of Rⁿ (A(u+v) = Au + Av = 0, A(cu) = cAu = 0).
- Show set defined by homogeneous linear equations is a subspace: rewrite as Ax = 0, cite Thm 2 (Ex 2).
- Is u in Nul A? Just compute Au (easy).
- SPANNING SET FOR Nul A:
  1. Row reduce [A 0] to RREF.
  2. Write basic vars in terms of free vars.
  3. Split general solution into x_free1·u + x_free2·v + …
  - The vectors u, v, w are automatically linearly independent; # vectors = # free variables. (Ex 3: free x2, x4, x5 → 3 vectors.)
- Def: Col A = Span{a1..an} = {b : b = Ax for some x}. Thm 3: subspace of Rᵐ.
- Find A with W = Col A: write the parametric vector as a combination (6a−b, a+b, −7a) = a(6,1,−7) + b(−1,1,0); those vectors are the columns.
- Is v in Col A? Row reduce [A v]; consistent ⇔ yes (harder). A nonzero vector in Col A: any column.
- Row A = span of rows ⊆ Rⁿ = Col Aᵀ.
- ! Size check first: Nul A ⊆ R^(#cols), Col A ⊆ R^(#rows) — a vector of the wrong length can't be in it (Ex 6–8).
- Contrast: Nul implicit / Col explicit; Nul easy to test membership, hard to list; Col easy to list, hard to test.
- Linear T: T(u+v) = T(u) + T(v), T(cu) = cT(u). Kernel ⊆ V, range ⊆ W are subspaces. If T(x) = Ax: kernel = Nul A, range = Col A.
- Practice ideas:
  - W = {a − 3b − c = 0} is a subspace two ways (Nul of [1 −3 −1], or as a Span).
  - Ax = v and Ax = w consistent ⇒ Ax = v + w consistent (Col A closed under +).
  - Col A = Nul A ⇒ A²x = A(Ax) = 0 for all x so Nul A² = Rⁿ.
- Note: 4.3 Linearly Independent Sets; Bases not yet covered.

## Cross-course connections
- Wronskian (DE) = determinant test for independence (Lin Alg Ch 3); W ≠ 0 is exactly what makes the IC system solvable.
- Solutions of homogeneous linear ODE = kernel/null space of L (Lin Alg 4.2) → vector space of dimension n.
- Nonhomogeneous: y = y_c + y_p ⇔ Ax = b solutions = x_p + Nul A.
- |det A| as area/volume scale factor (Lin Alg 3.3) → Jacobian (Calc III, coming in Ch 15).

## Quick self-test
- For a 3×3 matrix A, what is det 5A?
  - 125 det A, because det(kA) = kⁿ det A, not k det A.
- What does each row operation do to the determinant?
  - Replacement: unchanged (a shear). Interchange: −det (orientation flips). Scaling a row by k: k·det.
- If det A = 2, what is det A³?
  - 8, since det Aᵏ = (det A)ᵏ.
- What can you say about det(A + B)?
  - Nothing in general: det is not additive. det(AB) = det A · det B is the rule that holds.
- What is the (i, j) entry of adj A?
  - C_ji. adj A is the TRANSPOSE of the cofactor matrix.
- When can you use Cramer's rule?
  - Only when A is invertible (det A ≠ 0).
- How do you find the area of a parallelogram from its 4 vertices?
  - Translate one vertex to the origin, put the two adjacent edge vectors as columns, and take |det|.
- What do you check first in the subspace test?
  - Whether 0 is in H. If it is missing, H is not a subspace.
- Is the solution set of Ax = b with b ≠ 0 a subspace?
  - No. It is a shifted copy of Nul A and does not contain 0.
- For an m×n matrix A, where do Nul A and Col A live?
  - Nul A ⊆ Rⁿ (the domain, # columns). Col A ⊆ Rᵐ (the codomain, # rows).
- How many vectors does the RREF method give for a spanning set of Nul A?
  - One per free variable, and they are automatically linearly independent.
- Why is R² not a subspace of R³?
  - Its vectors have a different length. The x1x2-plane {(s,t,0)} only acts like R².`,
        figures: {"la-parallelogram":{"w":640,"h":400,"bg":"plain","graph":"x: -0.6 .. 5\ny: -0.6 .. 3.6\nequal\npolygon 0,0; 3,1; 4,3; 1,2 | fill blue | label area = |3·2 − 1·1| = 5\nvector 0,0 -> 3,1 | red | label a₁ = (3, 1)\nvector 0,0 -> 1,2 | green | label a₂ = (1, 2)","items":[]},"la-shear":{"w":640,"h":400,"bg":"plain","graph":"x: -0.6 .. 6\ny: -0.6 .. 3\nequal\npolygon 0,0; 3,0; 3,2; 0,2 | fill gray | label area 6\npolygon 0,0; 3,0; 5,2; 2,2 | dashed fill orange\ntext 4.3,2.45 : a₂ → a₂ + c·a₁ slides the top\nvector 0,0 -> 3,0 | red | label a₁\nvector 0,0 -> 2,2 | orange | label a₂ + c·a₁\nsegment 5.4,0 -> 5.4,2 | gray dashed | label height stays 2","items":[]},"la-ellipse":{"w":640,"h":400,"bg":"plain","graph":"x: -2.6 .. 2.6\ny: -1.6 .. 1.6\nequal\nparam cos(t), sin(t) | blue | label unit disk, area π\nparam 2cos(t), sin(t) | red thick | label T(disk) with a = 2, b = 1: area 2π\nvector 0,0 -> 2,0 | red | label a\nvector 0,0 -> 0,1 | red | label b","items":[]},"la-subspaces":{"w":640,"h":440,"bg":"plain","graph":"3d\nx: -2 .. 2\ny: -2 .. 2\nz: -2 .. 3\naxes x₁, x₂, x₃\npolygon3 -1.6,-1.6,-0.08; 1.6,-1.6,1.04; 1.6,1.6,0.08; -1.6,1.6,-1.04 | fill blue | label plane through 0: a subspace\npolygon3 -1.6,-1.6,1.62; 1.6,-1.6,2.74; 1.6,1.6,1.78; -1.6,1.6,0.66 | fill red dashed | label shifted plane: not a subspace\nsegment3 -1.8,1.8,-1.4 -> 1.8,-1.8,1.4 | green thick | label line through 0\npoint3 0,0,0 | black | label 0","items":[]},"la-nul-col":{"w":640,"h":380,"bg":"plain","graph":"","items":[{"t":"ellipse","cx":170,"cy":200,"rx":135,"ry":125,"c":"gray","sw":2},{"t":"text","x":60,"y":52,"s":"Rⁿ  (domain: one entry per column)","c":"gray","size":15},{"t":"ellipse","cx":475,"cy":200,"rx":135,"ry":125,"c":"gray","sw":2},{"t":"text","x":372,"y":52,"s":"Rᵐ  (codomain: one entry per row)","c":"gray","size":15},{"t":"ellipse","cx":150,"cy":250,"rx":75,"ry":45,"c":"blue","sw":2,"fill":"blue"},{"t":"text","x":112,"y":256,"s":"Nul A","c":"blue","size":20},{"t":"ellipse","cx":495,"cy":165,"rx":90,"ry":62,"c":"green","sw":2,"fill":"green"},{"t":"text","x":450,"y":160,"s":"Col A","c":"green","size":20},{"t":"text","x":430,"y":184,"s":"all the Ax","c":"green","size":14},{"t":"ellipse","cx":455,"cy":285,"rx":5,"ry":5,"c":"black","sw":2,"fill":"black"},{"t":"text","x":468,"y":292,"s":"0","c":"black","size":18},{"t":"line","x1":215,"y1":238,"x2":446,"y2":282,"c":"blue","sw":2.2,"arrow":1},{"t":"line","x1":200,"y1":272,"x2":446,"y2":287,"c":"blue","sw":2.2,"arrow":1},{"t":"text","x":262,"y":300,"s":"Ax = 0","c":"blue","size":15},{"t":"ellipse","cx":120,"cy":140,"rx":4,"ry":4,"c":"black","sw":2,"fill":"black"},{"t":"text","x":100,"y":132,"s":"x","c":"black","size":18},{"t":"line","x1":126,"y1":138,"x2":448,"y2":160,"c":"green","sw":2.2,"arrow":1},{"t":"text","x":250,"y":130,"s":"x ↦ Ax","c":"green","size":16},{"t":"text","x":40,"y":360,"s":"Nul A: a test vectors must pass (Ax = 0)   ·   Col A: a recipe to build vectors (Ax)","c":"black","size":14}]},"la-zigzag":{"w":640,"h":320,"bg":"plain","graph":"x: -0.5 .. 8.5\ny: -1.6 .. 1.8\naxes k, p\nsegment 0,1 -> 1,-1 | gray thin\nsegment 1,-1 -> 2,1 | gray thin\nsegment 2,1 -> 3,-1 | gray thin\nsegment 3,-1 -> 4,1 | gray thin\nsegment 4,1 -> 5,-1 | gray thin\nsegment 5,-1 -> 6,1 | gray thin\nsegment 6,1 -> 7,-1 | gray thin\nsegment 7,-1 -> 8,1 | gray thin\npoint 0,1 | blue\npoint 1,-1 | blue\npoint 2,1 | blue\npoint 3,-1 | blue\npoint 4,1 | blue\npoint 5,-1 | blue\npoint 6,1 | blue\npoint 7,-1 | blue\npoint 8,1 | blue\ny = 0 | red thick | label M2 gives (1 + (−1))/2 = 0 every day","items":[]}},
      },
      {
        id: 'course-2026-10-16-differential-equations',
        version: 2,
        replaces: ["a617e8e6"],
        label: 'Differential Equations · Oct 16 (Zill 4.1–4.2)',
        date: '2026-10-16T12:00:00.000Z',
        text: `# Differential Equations · Oct 16

## 4.1 Theory of linear equations: overview
- Note: MTH 267, Zill, DE with Boundary-Value Problems 10e, §4.1–4.2. Numbering = the book's own theorem/definition/example numbers, verified page by page in MindTap.
- Book intro: Ch 2 gave one-parameter families; only linear 1st-order DEs gave a true GENERAL solution (family containing ALL solutions on I).
- Ch 4 goal = general solutions of linear higher-order DEs, so 4.1 lays down the theory first.

## 4.1.1 Initial-value and boundary-value problems
**INTUITION**
- nth-order linear DE needs n facts to pin down one curve. IVP = all n facts at ONE point x₀ (2nd order: curve passes through (x₀, y₀) with slope y₁) — like launching a car with known position + speed; path is determined.
- BVP = facts at DIFFERENT points (graph must pass through (a, y₀) AND (b, y₁)) — like a string/beam pinned at both ends, or aiming a cannon at a target: one angle, many, or none may work.
  - ![IVP: value and slope at one point. BVP: values at two points](fig:de-ivp-bvp)
  - ! So BVPs can have many, one, or no solutions even when Thm 4.1.1's hypotheses hold.
- If a_n(x) = 0 somewhere, the equation "loses its top derivative" there; uniqueness (even existence) can fail.
**EQUATIONS**
- (1) nth-order IVP: a_n(x)y⁽ⁿ⁾ + a_{n−1}(x)y⁽ⁿ⁻¹⁾ + … + a_1(x)y' + a_0(x)y = g(x); y(x₀) = y₀, y'(x₀) = y₁, …, y⁽ⁿ⁻¹⁾(x₀) = y_{n−1}.
- **Theorem 4.1.1 (Existence of a Unique Solution):** a_n, …, a_0, g continuous on I, a_n(x) ≠ 0 for every x in I, x₀ in I → a solution of IVP (1) exists on I and is unique.
- Ex 1: 3y''' + 5y'' − y' + 7y = 0, y(1) = y'(1) = y''(1) = 0 → trivial solution y = 0; constant coeffs so Thm holds → y = 0 is the ONLY solution on any interval containing x = 1.
- Ex 2: verify y = 3e^{2x} + e^{−2x} − 3x solves y'' − 4y = 12x, y(0) = 4, y'(0) = 1; coefficients/g continuous, a₂ = 1 ≠ 0 → unique on any I containing 0.
- Warning: failure example. y = cx² + x + 3 solves x²y'' − 2xy' + 2y = 6, y(0) = 3, y'(0) = 1 on (−∞, ∞) for ANY c → not unique, because a₂ = x² is 0 at x = 0 and ICs are imposed there.
- BVP (2nd order): a₂y'' + a₁y' + a₀y = g, y(a) = y₀, y(b) = y₁ — "two-point BVP"; prescribed values = boundary conditions (BC). Solution must hold on I containing a and b.
- Other BC pairs: y'(a) = y₀, y(b) = y₁; y(a) = y₀, y'(b) = y₁; y'(a) = y₀, y'(b) = y₁ — all special cases of α₁y(a) + β₁y'(a) = γ₁, α₂y(b) + β₂y'(b) = γ₂.
- Ex 3 (x'' + 16x = 0, family x = c₁cos4t + c₂sin4t):
  - ![Ex 3: x = c₂ sin 4t with x(0) = 0. Every c₂ hits x(π/2) = 0; only c₂ = 0 hits x(π/8) = 0; none hits x(π/2) = 1](fig:de-bvp-ex3)
  - (a) x(0) = 0, x(π/2) = 0: c₁ = 0, then 0 = c₂ sin2π true for all c₂ → infinitely many solutions x = c₂ sin4t.
  - (b) x(0) = 0, x(π/8) = 0: c₁ = 0, 0 = c₂ sin(π/2) = c₂ → x = 0 only solution.
  - (c) x(0) = 0, x(π/2) = 1: c₁ = 0, 1 = c₂·0 contradiction → no solution.
**PROBLEM-SOLVING**
- "Largest interval of unique solution": find where a_n = 0 and where any a_i or g is discontinuous; I = biggest interval containing x₀ avoiding those points.
- BVP questions: plug general solution into each BC → linear equations in c₁, c₂ → unique / infinite / none.

## 4.1.2 Homogeneous equations
- Note: y = 0 is always a solution of a homogeneous linear equation.
**INTUITION**
- Homogeneous (6): RHS = 0. Nonhomogeneous (7): g(x) not identically 0. To solve (7) you FIRST need the associated homogeneous equation (6). "Homogeneous" here ≠ homogeneous-coefficient functions of §2.5.
- Operator view: D = d/dx is a machine turning a function into another function. L = a_nDⁿ + … + a_1D + a_0 is linear: it respects sums and constant multiples, exactly like a matrix/linear transformation in linear algebra.
  - ! Solutions of L(y) = 0 = the kernel (null space) of L → a vector space → superposition is automatic.
- Dimension of that solution space = n (order). Book's analogy: any 3D vector = combo of independent i, j, k; any solution of nth-order homogeneous DE = combo of n independent solutions ("basic building blocks").
- Linear dependence = some function is redundant (a combo of the others). For TWO functions: dependent ⇔ one is a constant multiple of the other ⇔ ratio f₂/f₁ constant. Independent ⇒ quotient not constant (used in 4.2).
- Wronskian = determinant check, like checking columns of a matrix are independent. For solutions of (6) it is either identically zero or never zero on I → just test one convenient point.
**EQUATIONS**
- Standing assumptions: on common interval I, coefficients a_i(x) and g(x) continuous; a_n(x) ≠ 0 for every x in I.
- Classification: 2y'' + 3y' − 5y = 0 homogeneous 2nd order; x³y''' + 6y' + 10y = eˣ nonhomogeneous 3rd order.
- D examples: D(cos4x) = −4sin4x; D(5x³ − 6x²) = 15x² − 12x; d/dx(dy/dx) = D²y, dⁿy/dxⁿ = Dⁿy. Polynomial operators: D + 3, D² + 3D − 4, 5x³D³ − 6x²D² + 4xD + 9.
- (8) nth-order differential (polynomial) operator L = a_n(x)Dⁿ + … + a_1(x)D + a_0(x).
- (9) Linearity: L{αf + βg} = αL(f) + βL(g) → L is a linear operator. Comes from D(cf) = cDf and D(f+g) = Df + Dg.
- Operator form: y'' + 5y' + 6y = 5x − 3 ⇔ (D² + 5D + 6)y = 5x − 3. So (6) is L(y) = 0 and (7) is L(y) = g(x).
- **Theorem 4.1.2 (Superposition — Homogeneous):** y₁..y_k solutions of (6) on I → y = c₁y₁ + … + c_ky_k is a solution.
  - Proof (k = 2): L(c₁y₁ + c₂y₂) = c₁L(y₁) + c₂L(y₂) = 0 + 0 = 0.
- Corollaries: (A) y = c₁y₁ is a solution; (B) homogeneous linear DE always has trivial solution y = 0.
- Ex 4: y₁ = x², y₂ = x² ln x both solve x³y''' − 2xy' + 4y = 0 on (0, ∞) → y = c₁x² + c₂x² ln x also a solution.
- If y = e^{7x} solves a linear homogeneous DE then ce^{7x} (9e^{7x}, 0, −√5 e^{7x}, …) all do.
- **Definition 4.1.1 (Linear Dependence/Independence):** f₁..f_n dependent on I if constants c₁..c_n NOT all zero exist with c₁f₁ + … + c_nf_n = 0 for every x in I; independent if only c₁ = … = c_n = 0 works.
- Two-function examples: sin2x and sinx cosx dependent on (−∞, ∞) (sin2x = 2 sinx cosx). f₁ = x, f₂ = |x| independent on (−∞, ∞).
- Ex 5: cos²x, sin²x, sec²x, tan²x dependent on (−π/2, π/2): c₁ = c₂ = 1, c₃ = −1, c₄ = 1 (uses cos² + sin² = 1, 1 + tan² = sec²).
- General: n functions dependent ⇔ at least one is a linear combination of the others.
- Ex 6: f₁ = √x + 5, f₂ = √x + 5x, f₃ = x − 1, f₄ = x² dependent on (0, ∞): f₂ = 1·f₁ + 5·f₃ + 0·f₄.
- **Definition 4.1.2 (Wronskian):** W(f₁..f_n) = det with row 1 = f₁..f_n, row 2 = f₁'..f_n', …, row n = f₁⁽ⁿ⁻¹⁾..f_n⁽ⁿ⁻¹⁾.
- **Theorem 4.1.3 (Criterion for Linearly Independent Solutions):** y₁..y_n solutions of (6) on I are independent ⇔ W(y₁..y_n) ≠ 0 for every x in I.
- Consequence: W of solutions is identically zero or never zero on I, so W ≠ 0 at SOME x₀ in I suffices.
  - Illustration: y₁ = cos(2 ln x)/x³, y₂ = sin(2 ln x)/x³ solve x²y'' + 7xy' + 13y = 0 on (0, ∞); at x = 1: W = |1 0; −3 2| = 2 ≠ 0 → independent.
- **Definition 4.1.3 (Fundamental Set of Solutions):** any n linearly independent solutions of (6) on I.
- **Theorem 4.1.4:** a fundamental set exists for (6) on I.
- **Theorem 4.1.5 (General Solution — Homogeneous):** fundamental set y₁..y_n → general solution y = c₁y₁ + … + c_ny_n. ANY solution Y can be written Y = C₁y₁ + … + C_ny_n.
  - Proof (n = 2): pick t in I with W(y₁(t), y₂(t)) ≠ 0; let Y(t) = k₁, Y'(t) = k₂. Solve C₁y₁(t) + C₂y₂(t) = k₁, C₁y₁'(t) + C₂y₂'(t) = k₂ — solvable uniquely since coefficient determinant = Wronskian ≠ 0. G = C₁y₁ + C₂y₂ solves DE with same ICs as Y → by uniqueness Y = G.
  - Insight: the Wronskian is literally the determinant you need nonzero to fit any initial condition.
- Ex 7: y'' − 9y = 0, y₁ = e^{3x}, y₂ = e^{−3x}; W = −6 ≠ 0 → fundamental set; y = c₁e^{3x} + c₂e^{−3x}.
  - ![Ex 7–8: e^{3x}, e^{−3x}, and 4 sinh 3x − 5e^{−3x} = 2e^{3x} − 7e^{−3x} in the same family](fig:de-family)
- Ex 8: y = 4sinh3x − 5e^{−3x} is in that family: c₁ = 2, c₂ = −7. (Different-looking answers can be the same general solution.)
- Ex 9: y''' − 6y'' + 11y' − 6y = 0, y₁ = eˣ, y₂ = e^{2x}, y₃ = e^{3x}; W = 2e^{6x} ≠ 0 → y = c₁eˣ + c₂e^{2x} + c₃e^{3x} on (−∞, ∞).
**PROBLEM-SOLVING (show a fundamental set / write general solution)**
1. Substitute each function to verify it solves the DE.
2. Count = order n.
3. Compute W; evaluate at an easy point (x = 0 or 1) to show ≠ 0.
4. y = c₁y₁ + … + c_ny_n.
- Dependence problems: find nonzero c's using identities (trig, algebra) or show one function = combo of others; for two functions check ratio is non-constant on I.
- Watch out: the W-test as an iff only applies to SOLUTIONS of the DE.
- Exercises 4.1 (end of set): dependence/independence discussion problems, e.g. e^{x+2} vs e^{x−3} (constant multiples → dependent); adding y_{k+1} = 0 to an independent set makes it dependent.

## 4.1.3 Nonhomogeneous equations
**INTUITION**
- Particular solution y_p = any one solution of (7) with no arbitrary parameters.
- Why y_c + y_p works: L sends c₁y₁ + … + c_ky_k to 0 and sends y_p to g, so L(sum) = 0 + g = g.
- ! Geometric picture: solution set = one particular point + the whole homogeneous solution space (a shifted plane). Linear algebra twin: solutions of Ax = b = x_p + null space.
  - ![All solutions of L(y) = g are y_p plus the solution plane of L(y) = 0](fig:de-shifted-plane)
- y_c = system's natural/free behavior; y_p = response to the forcing g.
- Superposition for inputs: split a complicated g into pieces, find a y_p for each piece, add them (set up for undetermined coefficients in §4.4).
**EQUATIONS**
- Ex: y_p = 3 is a particular solution of y'' + 9y = 27.
- (10) y = c₁y₁ + … + c_ky_k + y_p solves (7) whenever y_i solve (6).
- **Theorem 4.1.6 (General Solution — Nonhomogeneous):** y_p any particular solution of (7), y₁..y_n fundamental set of (6) → general solution y = c₁y₁ + … + c_ny_n + y_p.
  - Proof: Y, y_p both solve L(y) = g; u = Y − y_p gives L(u) = 0 → u = c₁y₁ + … + c_ny_n → Y = c₁y₁ + … + c_ny_n + y_p.
- Complementary function y_c = c₁y₁ + … + c_ny_n. General solution of nonhomogeneous = y_c + y_p.
- Ex 10: y_p = −11/12 − x/2 solves y''' − 6y'' + 11y' − 6y = 3x; y_c from Ex 9 → y = c₁eˣ + c₂e^{2x} + c₃e^{3x} − 11/12 − x/2.
- **Theorem 4.1.7 (Superposition — Nonhomogeneous):** if y_{pi} solves a_ny⁽ⁿ⁾ + … + a_0y = g_i(x), i = 1..k, then y_p = y_{p1} + … + y_{pk} solves LHS = g₁ + … + g_k.
- Ex 11: y'' − 3y' + 4y: y_{p1} = −4x² for −16x² + 24x − 8; y_{p2} = e^{2x} for 2e^{2x}; y_{p3} = xeˣ for 2xeˣ − eˣ → y = −4x² + e^{2x} + xeˣ solves RHS = sum of all three.
- c₁y_{p1} + … + c_ky_{pk} is a particular solution when RHS is c₁g₁ + … + c_kg_k (scale inputs → scale outputs).
**PROBLEM-SOLVING**
1. Solve/obtain y_c from homogeneous eq.
2. Get y_p (given/verify by substitution, or build by superposition of pieces).
3. y = y_c + y_p.
4. Apply ICs to the FULL y (not to y_c alone — common mistake). Fix a scaled RHS by scaling the matching y_p.
**REMARKS (dynamical systems)**
- nth-order linear DE in t = nth-order LINEAR SYSTEM. State variables: y(t), y'(t), …, y⁽ⁿ⁻¹⁾(t); their values at time t = state of the system. g = input/forcing function; solution y(t) = output/response.
- Under Thm 4.1.1, output is uniquely determined by input + state at t₀ (the ICs).
- Linear system requires superposition (Thm 4.1.7): response to a sum of inputs = sum of responses.
- Takeaway: the engineering meaning of linearity — why springs/circuits/beams are analyzable piece by piece.

## Project 4.1: cooling fin (engineering BVP)
- Fins = passive extensions on equipment (e.g., car radiator) that increase surface area so heat dissipates faster.
- Modeling recipe: assumptions → conservation laws (energy/mass) → physical laws. Unknown: T(x,y,z).
- Setup: wall at constant T_wall, fin in fluid at T_fluid < T_wall. Heat conducts along fin and is removed at the fin–fluid surface.
  - ![The cooling fin: heat Qₓ flows in, Q(x + Δx) flows out, convection carries the rest away](fig:de-fin)
- Assumptions: homogeneous, isotropic material; fin thin so ∂T/∂x ≫ ∂T/∂y, ∂T/∂z → T ≈ T(x): 3D problem becomes 1D (fin length L).
- Element Δx: heat in Q_x, heat out Q_{x+Δx}, heat lost by convection.
- Energy balance: Q_x − Q_{x+Δx} = Q_convection; Q_convection = hCΔx(T − T_fluid), C = perimeter, h = heat transfer coefficient. Steady state.
- Fourier's law: q = Q/A = −k dT/dx (minus sign: heat flows hot → cold).
- Taylor-expand Q_{x+Δx} ≈ Q_x + (dQ/dx)Δx → governing ODE: d/dx(kA dT/dx) = hC(T − T_fluid).
- BCs: x = 0: T = T_wall; x = L: dT/dx = 0 (insulated tip).
- Related problems:
  1. Constant A → T'' − α²(T − T_fluid) = 0, α² = hC/(kA), solve with BCs, rewrite using θ = (T − T_fluid)/(T_wall − T_fluid) and cosh.
  2. Sketch θ vs x/L with αL = 2.
    - ![θ = (T − T_fluid)/(T_wall − T_fluid) along the fin: θ = cosh(αL(1 − x/L)) / cosh(αL)](fig:de-fin-theta)
  3. Re-solve with BCs T(0) = T_wall, T(L) = T_fluid.
- Intuition: a real BVP — conditions at both ends of the fin; θ decays from 1 at the wall.

## 4.2 Reduction of order
**INTUITION**
- Context: §4.3 (constant coefficients) sometimes yields only ONE solution y₁. Reduction of order builds y₂ from a known nonzero y₁ — even with variable coefficients.
- Key idea: independent ⇒ y₂/y₁ is NOT constant, so write y₂ = u(x)y₁(x) and find u. Every term multiplying undifferentiated u collects into y₁'' + Py₁' + Qy₁ = 0 → only u'' and u' remain → set w = u' → FIRST-order linear (also separable) DE. Hence "reduction of order".
- Why choose c₁ = 1, c₂ = 0 at the end: c₂ just adds a multiple of y₁; c₁ only scales.
- Formula (5)'s e^{−∫P dx} is the Wronskian's shape (Abel): W(y₁, y₂) = e^{−∫P dx} ≠ 0, so independence is automatic wherever y₁ ≠ 0.
- Preview: reappears in §4.3 (repeated roots → xe^{mx}), §4.7 (Cauchy-Euler repeated root → x^m ln x), §6.3.
**EQUATIONS**
- (1) a₂(x)y'' + a₁(x)y' + a₀(x)y = 0; general solution y = c₁y₁ + c₂y₂ with {y₁, y₂} independent on I.
- Ex 1: y₁ = eˣ solves y'' − y = 0.
  - y = ueˣ: y' = ueˣ + eˣu', y'' = ueˣ + 2eˣu' + eˣu'' → eˣ(u'' + 2u') = 0 → w' + 2w = 0 → w = c₁e^{−2x} → u = −(c₁/2)e^{−2x} + c₂ → y = −(c₁/2)e^{−x} + c₂eˣ.
  - Choose c₂ = 0, c₁ = −2 → y₂ = e^{−x}. W(eˣ, e^{−x}) ≠ 0.
- General case: divide by a₂ → (3) standard form y'' + P(x)y' + Q(x)y = 0, y₁ known with y₁(x) ≠ 0 on I.
  - y = uy₁ → y'' + Py' + Qy = u[y₁'' + Py₁' + Qy₁] (= 0) + y₁u'' + (2y₁' + Py₁)u' = 0.
- (4) y₁w' + (2y₁' + Py₁)w = 0, w = u' — linear AND separable.
- Separate: dw/w + 2(y₁'/y₁)dx + P dx = 0 → wy₁² = c₁e^{−∫P dx} → u = c₁∫(e^{−∫P dx}/y₁²)dx + c₂. Choose c₁ = 1, c₂ = 0.
- **Theorem 4.2.1 (Reduction of Order):** y₁ solution of (3) on I, y₁(x) ≠ 0 on I → (5) y₂(x) = y₁(x) ∫ [e^{−∫P(x)dx} / y₁²(x)] dx is a second solution on I.
- Independence: W(y₁, y₂) = e^{−∫P(x)dx} ≠ 0 on any I where y₁ ≠ 0.
- Ex 2: y₁ = x² solves x²y'' − 3xy' + 4y = 0 on (0, ∞). Standard form y'' − (3/x)y' + (4/x²)y = 0 → P = −3/x, e^{−∫P} = x³. y₂ = x²∫x³/x⁴ dx = x² ln x. General: y = c₁x² + c₂x² ln x.
  - ![Ex 2 (reduction of order): y₂/y₁ = ln x is not constant, so x² and x² ln x are independent](fig:de-reduction)
- Remarks:
  - (i) (5) is used again in §4.7 and §6.3; instructor decides whether to memorize (5) or use first-principles substitution.
  - (ii) Reduction of order also gives the general solution of NONhomogeneous a₂y'' + a₁y' + a₀y = g(x) when y₁ of the homogeneous eq is known (Exercises 4.2 #19–22).
  - (iii) If the integral in (5) is nonelementary, write y₂(x) = y₁(x)∫_{x₀}^{x} e^{−∫P(t)dt}/y₁²(t) dt (#23–24).
**PROBLEM-SOLVING CHECKLIST**
1. Divide by a₂(x) → standard form; read off P(x) with its sign (most common error: using a₁ instead of a₁/a₂).
2. Compute e^{−∫P dx}; drop the constant; simplify e^{ln(…)} (e.g. e^{3 ln x} = x³).
3. Divide by y₁² and integrate (drop constant).
4. Multiply by y₁ → y₂; discard any piece that is a multiple of y₁.
5. General solution y = c₁y₁ + c₂y₂; optional: confirm W ≠ 0.
- Alternative (first principles, Ex 1 style): substitute y = uy₁ directly, simplify, set w = u', solve first-order eq, integrate. Use when problem says "use reduction of order" or for nonhomogeneous versions.
- Watch the interval: ln x needs x > 0 (use ln|x| on negative intervals); y₁ must be nonzero on I.

## Cross-course connections
- Wronskian (DE) = determinant test for independence (Lin Alg Ch 3); W ≠ 0 is exactly what makes the IC system solvable.
- Solutions of homogeneous linear ODE = kernel/null space of L (Lin Alg 4.2) → vector space of dimension n.
- Nonhomogeneous: y = y_c + y_p ⇔ Ax = b solutions = x_p + Nul A.
- Steepest-ascent paths (Calc III 14.6) solved as DEs (MTH 267).

## Quick self-test
- What does Theorem 4.1.1 need for a unique solution of an IVP on I?
  - a_n, …, a_0 and g continuous on I, a_n(x) ≠ 0 for every x in I, and x₀ in I.
- Why is x²y'' − 2xy' + 2y = 6, y(0) = 3, y'(0) = 1 not uniquely solvable?
  - a₂ = x² is 0 at x = 0, where the ICs are imposed. y = cx² + x + 3 works for ANY c.
- How many solutions can a BVP have?
  - Many, one, or none, even when the hypotheses of Theorem 4.1.1 hold (Ex 3 shows all three).
- When are two functions linearly dependent?
  - When one is a constant multiple of the other, so their ratio is constant on I.
- For solutions of a homogeneous DE, where do you have to check W ≠ 0?
  - At one convenient point. The Wronskian of solutions is identically zero or never zero on I.
- What is the general solution of a nonhomogeneous linear DE?
  - y = y_c + y_p: the complementary function c₁y₁ + … + c_ny_n plus any particular solution.
- When you apply initial conditions to y = y_c + y_p, which part do you use?
  - The FULL y, not y_c alone.
- What substitution starts reduction of order?
  - y = u(x)y₁(x). Then w = u' gives a first-order linear (and separable) DE.
- What is formula (5) for the second solution?
  - y₂ = y₁ ∫ e^{−∫P dx} / y₁² dx
- What is the most common error when reading off P(x)?
  - Using a₁ instead of a₁/a₂. Divide by a₂ first to get standard form.
- What are the boundary conditions for the cooling fin?
  - T = T_wall at x = 0, and dT/dx = 0 at x = L (insulated tip).`,
        figures: {"de-ivp-bvp":{"w":640,"h":400,"bg":"plain","graph":"x: -0.4 .. 4.6\ny: -0.4 .. 3.6\ngrid off\ny = 2.6 + 0.6sin(x - 1) | blue | label IVP: one curve\npoint 1,2.6 | blue | label (x₀, y₀)\nsegment 0.3,2.18 -> 1.7,3.02 | blue dashed\ntext 0.55,3.15 : slope y₁\ny = 0.5 + 1.5(x - 0.5)/3.5 + 0.6sin(pi(x - 0.5)/3.5) | red | label BVP\npoint 0.5,0.5 | red | label y(a) = y₀\npoint 4,2 | red | label y(b) = y₁","items":[]},"de-bvp-ex3":{"w":640,"h":400,"bg":"plain","graph":"x: -0.1 .. 1.8\ny: -1.3 .. 1.4\naxes t, x\ny = sin(4x) | blue | label c₂ = 1\ny = 0.5sin(4x) | green | label c₂ = 0.5\ny = -0.7sin(4x) | purple | label c₂ = −0.7\npoint 0,0 | black\npoint pi/2,0 | black | label (a) every c₂ passes\nx = pi/8 | gray dashed | label (b) at t = π/8 only c₂ = 0 gives 0\npoint pi/2,1 | red | label (c) none reach","items":[]},"de-shifted-plane":{"w":640,"h":440,"bg":"plain","graph":"3d\nx: -2 .. 2\ny: -2 .. 2\nz: -1.5 .. 3.5\npolygon3 -1.6,-1.6,-0.72; 1.6,-1.6,0.08; 1.6,1.6,0.72; -1.6,1.6,-0.08 | fill blue | label y_c = c₁y₁ + c₂y₂ (through 0)\npolygon3 -1.6,-1.6,1.28; 1.6,-1.6,2.08; 1.6,1.6,2.72; -1.6,1.6,1.92 | fill green | label y_c + y_p (a shifted copy)\nvector3 0,0,0 -> 1.2,-1.2,2.06 | red thick | label y_p\npoint3 0,0,0 | black | label 0","items":[]},"de-family":{"w":640,"h":400,"bg":"plain","graph":"x: -1 .. 1\ny: -8 .. 8\ny = e^(3x) | blue | label y₁ = e³ˣ\ny = e^(-3x) | green | label y₂ = e⁻³ˣ\ny = 4sinh(3x) - 5e^(-3x) | red thick | label c₁ = 2, c₂ = −7","items":[]},"de-reduction":{"w":640,"h":400,"bg":"plain","graph":"x: 0 .. 2.6\ny: -1 .. 6\ny = x^2 | blue | label y₁ = x²\ny = x^2 ln(x) | red | label y₂ = x² ln x\ny = ln(x) | gray dashed | label y₂/y₁ = ln x","items":[]},"de-fin":{"w":640,"h":360,"bg":"plain","graph":"","items":[{"t":"rect","x":40,"y":40,"w":60,"h":270,"c":"brown","sw":2,"fill":"brown"},{"t":"text","x":26,"y":30,"s":"wall: T = T_wall","c":"brown","size":15},{"t":"rect","x":100,"y":150,"w":460,"h":60,"c":"orange","sw":2,"fill":"orange"},{"t":"text","x":400,"y":238,"s":"fin, length L","c":"orange","size":15},{"t":"text","x":250,"y":60,"s":"fluid at T_fluid < T_wall","c":"teal","size":16},{"t":"rect","x":300,"y":150,"w":60,"h":60,"c":"red","sw":2.5,"dash":true},{"t":"text","x":318,"y":232,"s":"Δx","c":"red","size":17},{"t":"line","x1":232,"y1":180,"x2":297,"y2":180,"c":"red","sw":3,"arrow":1},{"t":"text","x":214,"y":172,"s":"Qₓ","c":"red","size":18},{"t":"line","x1":362,"y1":180,"x2":425,"y2":180,"c":"red","sw":3,"arrow":1},{"t":"text","x":380,"y":140,"s":"Q(x + Δx)","c":"red","size":16},{"t":"line","x1":330,"y1":148,"x2":330,"y2":92,"c":"blue","sw":2.5,"arrow":1},{"t":"line","x1":330,"y1":212,"x2":330,"y2":268,"c":"blue","sw":2.5,"arrow":1},{"t":"text","x":342,"y":100,"s":"hC·Δx·(T − T_fluid)","c":"blue","size":15},{"t":"line","x1":100,"y1":318,"x2":590,"y2":318,"c":"black","sw":1.8,"arrow":1},{"t":"text","x":596,"y":323,"s":"x","c":"black","size":16},{"t":"text","x":94,"y":342,"s":"0","c":"black","size":15},{"t":"text","x":552,"y":342,"s":"L","c":"black","size":15},{"t":"text","x":440,"y":296,"s":"tip: dT/dx = 0","c":"black","size":15}]},"de-fin-theta":{"w":640,"h":400,"bg":"plain","graph":"x: 0 .. 1.05\ny: 0 .. 1.1\naxes x/L, θ\ny = cosh(2(1 - x))/cosh(2) | red thick | label αL = 2\ny = cosh(1 - x)/cosh(1) | blue dashed | label αL = 1\npoint 0,1 | black | label wall: θ = 1\npoint 1,1/cosh(2) | red | label insulated tip: θ' = 0","items":[]}},
      },
      {
        id: 'course-2026-10-16-calculus-3',
        version: 2,
        replaces: ["9a6ef96b"],
        label: 'Calculus III · Oct 16 (Stewart 14.1–14.6)',
        date: '2026-10-16T12:00:00.000Z',
        text: `# Calculus III · Oct 16

## 14.1 Functions of several variables
**INTUITION**
- f(x,y) = a machine taking a point in the plane, returning one number (temperature at a location, height of terrain). Graph z = f(x,y) is a SURFACE over the domain.
- ! Level curves f(x,y) = k = contour lines on a topographic map. Tightly packed contours = steep; spread out = gentle.
  - ![Level curves are the horizontal traces z = k, dropped onto the xy-plane](fig:c3-paraboloid)
- Traces/cross-sections: slice the surface with x = const or y = const planes to get 1-variable curves.
- 3 variables f(x,y,z): graph lives in 4D; use LEVEL SURFACES f(x,y,z) = k instead (e.g., nested spheres for x² + y² + z²).
- Examples in text: wind-chill/heat index tables, Cobb-Douglas production P = bL^α K^(1−α).
**EQUATIONS / PROBLEM-SOLVING**
- Domain: find (x,y) making the formula defined — √(stuff) needs stuff ≥ 0, ln(stuff) needs > 0, denominators ≠ 0. Sketch region; dashed boundary if excluded.
- Range: what values the output can take (e.g., √(9 − x² − y²) → [0,3], upper hemisphere).
- Level curves: set f = k, solve; identify conic. Space k values evenly to judge steepness.
- Recognize surfaces: linear → plane; x² + y² → paraboloid; √(x² + y²) → cone; quadric surfaces from Ch 12.
**TEXTBOOK DETAILS**
- Four views of a function: verbal, numerical (table), algebraic (formula), visual (graph or level curves).
- Def: f of two variables assigns to each (x,y) in D a unique real f(x,y); range = {f(x,y) | (x,y) ∈ D}. No domain stated → all (x,y) where formula is a real number.
- Ex 1: f = √(x + y + 1)/(x − 1): f(3,2) = √6/2; D: y ≥ −x − 1 and x ≠ 1. f = x ln(y² − x): f(3,2) = 0; D: x < y².
- Ex 2: g = √(9 − x² − y²): D = disk x² + y² ≤ 9; range [0,3].
- Ex 3: wind-chill W = f(T,v) table; f(−5,50) = −15.
- Ex 4: Cobb-Douglas P = 1.01L^0.75 K^0.25; P(147,208) ≈ 161.9, P(194,407) ≈ 235.8 vs actual 159, 231. Domain L, K ≥ 0.
- Ex 5: f = 6 − 3x − 2y is a plane; intercepts x = 2, y = 3, z = 6. Linear function f = ax + by + c → plane.
- Ex 6: g = √(9 − x² − y²) → upper hemisphere. A whole sphere is NOT one function.
- Ex 7: Cobb-Douglas surface: P increases as L or K increases.
- Ex 8: h = 4x² + y²: D = ℝ², range [0,∞); elliptic paraboloid; horizontal traces ellipses, vertical traces parabolas.
- Fig 10 examples: (x² + 3y²)e^(−x² − y²) flat far away; sin x + sin y egg-crate; sin x sin y/(xy).
  - ![Fig 10: z = sin x + sin y, the egg crate](fig:c3-egg-crate)
- Level curve def: f(x,y) = k, k in range. Contour map = collection of level curves, equally spaced k.
  - Level curves = horizontal traces at z = k projected down; mentally LIFT them to rebuild the surface. Close curves = steep; far apart = flat.
- Real-world: topographic maps, isothermals, isobars (winds flow high → low pressure, strongest where isobars tightly packed), precipitation maps.
- Ex 9: read contour map by interpolating: f(1,3) ≈ 73, f(4,5) ≈ 56.
- Ex 10: 6 − 3x − 2y = k → parallel lines slope −3/2, equally spaced (graph is a plane).
- Ex 11: √(9 − x² − y²) = k → circles radius √(9 − k²); circles bunch up near the edge.
- Ex 12: 4x² + y² + 1 = k → ellipses with semiaxes ½√(k−1), √(k−1) for k > 1.
  - ![Ex 12: level curves 4x² + y² + 1 = k are ellipses, closer together where it is steeper](fig:c3-ellipses)
- Ex 13: Cobb-Douglas contours: for fixed P, as L ↑, K ↓ (trade-off).
- Fig 20: −xye^(−x² − y²) two hills/two valleys; −3y/(x² + y² + 1): contours crowd near origin ⇔ graph steep near origin.
  - ![Fig 20: −xy e^{−x²−y²}: two hills (red) and two valleys (blue)](fig:c3-hills)
- Ex 14: f = ln(z − y) + xy sin z → D = {z > y}, a half-space above plane z = y.
- Ex 15: x² + y² + z² = k → concentric spheres radius √k. Ex 16: x² − y − z² = k → family of hyperbolic paraboloids (shifted saddles).
- n variables: f(x₁..x_n); e.g. cost C = c·x (dot product). Three views: n real variables, one point variable, one vector variable.

## 14.2 Limits and continuity
**INTUITION**
- In 1D you approach a point from only 2 directions; in 2D from INFINITELY many (lines, parabolas, spirals). The limit exists only if EVERY path gives the same value.
- ! So paths can DISPROVE a limit but never PROVE one.
- Continuity = no tears/holes/jumps in the surface; polynomials, rationals (where denom ≠ 0), compositions of continuous functions are continuous.
**EQUATIONS / PROBLEM-SOLVING**
- Definition: lim_{(x,y)→(a,b)} f = L if ∀ε > 0 ∃δ > 0: 0 < √((x−a)² + (y−b)²) < δ ⇒ |f − L| < ε.
- Strategy 1 — if continuous at point: plug in.
- Strategy 2 — show DNE: two-path test. Try x = 0, y = 0, y = mx, y = x², x = y². Different values (or value depending on m) ⇒ DNE.
  - Classic: xy/(x² + y²) along y = mx gives m/(1 + m²) ⇒ DNE.
  - Trap: xy²/(x² + y⁴) is 0 on every line but 1/2 on x = y² ⇒ DNE.
- Strategy 3 — prove it exists: Squeeze. Bound |f − L| ≤ g → 0. Useful bounds: x² ≤ x² + y², |y| ≤ √(x² + y²).
  - Ex: 3x²y/(x² + y²): |…| ≤ 3|y| → 0 so limit 0.
- Strategy 4 — polar: x = r cosθ, y = r sinθ, r → 0; if result → L independent of θ, limit = L.
- Continuity at (a,b): lim f = f(a,b). Piecewise functions: check limit at the special point.
- Tip: degree of numerator > degree of denominator → often limit 0; equal degrees → usually DNE.
**TEXTBOOK DETAILS**
- Motivation via tables: sin(x² + y²)/(x² + y²) → 1 near origin; (x² − y²)/(x² + y²) has no limit.
- ε-δ def is distance-only: says nothing about direction.
- DNE rule: f → L₁ along C₁ and f → L₂ along C₂ with L₁ ≠ L₂ ⇒ DNE.
- Ex 1: (x² − y²)/(x² + y²): x-axis → 1, y-axis → −1 ⇒ DNE.
- Ex 2: xy/(x² + y²): both axes give 0 (NOT enough!), y = x gives 1/2 ⇒ DNE.
  - ![xy/(x² + y²) near (0, 0): different values along different lines, so no limit](fig:c3-two-paths)
- Ex 3: xy²/(x² + y⁴): every line gives 0, parabola x = y² gives 1/2 ⇒ DNE.
  - Lesson: all lines agreeing proves nothing.
- Limit laws carry over. Polynomials/rationals: direct substitution if (a,b) in domain. Ex 4: x²y³ − x³y² + 3x + 2y at (1,2) = 11. Ex 5: (x²y + 1)/(x³y² − 2x) at (−2,3) = −13/68.
- Ex 6: 3x²y/(x² + y²) → 0. Paths all give 0 → SUSPECT 0, then prove. Sol 1 (ε-δ): choose δ = ε/3. Sol 2 (Squeeze): −3|y| ≤ f ≤ 3|y|.
- Def 6 Continuity: lim f = f(a,b). Polynomials continuous on ℝ²; rationals continuous on their domain.
- Ex 7: (x² − y²)/(x² + y²) continuous on {(x,y) ≠ (0,0)}. Ex 8: same with g(0,0) = 0 — still discontinuous at origin.
- Ex 9: piecewise 3x²y/(x² + y²), f(0,0) = 0 → continuous on ℝ² (limit = 0 = f(0,0)). Template for piecewise continuity questions.
- Composition: h = g∘f continuous if f, g continuous. Ex 10: e^(−(x² + y²)) continuous everywhere. Ex 11: arctan(y/x) continuous except on x = 0.
- 3 variables: same with 3D distance. E.g. 1/(x² + y² + z² − 1) discontinuous on unit sphere.
- Vector form (Def 7): lim_{x→a} f(x) = L if x ∈ D and 0 < |x − a| < δ ⇒ |f(x) − L| < ε.

## 14.3 Partial derivatives
**INTUITION**
- Freeze every variable but one; then it's a normal 1-variable derivative. f_x = slope walking east, f_y = slope walking north.
- Geometric: slice surface with plane y = b → curve C₁; f_x(a,b) = slope of tangent line to C₁. Same for x = a → f_y.
- Rate-of-change reading: f_x = sensitivity of output to x alone ("all else held constant"); estimate from tables by averaging forward/backward difference quotients.
- Second partials: f_xx = concavity in x-direction; f_xy = how the x-slope changes as you move in y (twist).
- Clairaut: for nice functions (continuous 2nd partials), f_xy = f_yx.
**EQUATIONS / PROBLEM-SOLVING**
- f_x(a,b) = lim_{h→0} [f(a+h,b) − f(a,b)]/h; f_y similarly. Notation: f_x = ∂f/∂x = ∂z/∂x = D₁f = D_x f.
- ! Rule: treat other variables as constants and differentiate normally.
- Implicit partials: x³ + y³ + z³ + 6xyz = 1 → z_x = −(x² + 2yz)/(z² + 2xy). (Shortcut in 14.5: z_x = −F_x/F_z.)
- 3+ variables: same rule; f_x holds y, z fixed.
- Higher derivatives: f_xy = (f_x)_y = ∂²f/∂y∂x (order reverses in ∂ notation). Use Clairaut to pick easiest order.
- Piecewise / at origin: use the limit definition directly.
- PDEs: Laplace u_xx + u_yy = 0 (harmonic, e.g. eˣ sin y); wave u_tt = a²u_xx (u = sin(x − at) works).
- Cobb-Douglas: ∂P/∂L, ∂P/∂K = marginal productivity; ∂P/∂L = αP/L, ∂P/∂K = βP/K.
**TEXTBOOK DETAILS**
- Heat index I = f(T,H): f_T(96,70) ≈ 3.75 (avg of 4 and 3.5); f_H(96,70) ≈ 0.9 (avg of 1 and 0.8).
- Ex 1: f = x³ + x²y³ − 2y²: f_x = 3x² + 2xy³, f_x(2,1) = 16; f_y = 3x²y² − 4y, f_y(2,1) = 8.
- Ex 2: f = sin(x/(1+y)): f_x = cos(x/(1+y))·1/(1+y); f_y = −cos(x/(1+y))·x/(1+y)².
- Ex 3: f = 4 − x² − 2y²: f_x(1,1) = −2, f_y(1,1) = −4.
- Ex 4: BMI B = m/h². ∂B/∂m at (64,1.68) ≈ 0.35; ∂B/∂h ≈ −27. Units of a partial = output units / input units.
- Ex 5 (implicit): x³ + y³ + z³ + 6xyz + 4 = 0 at (−1,1,2): z_x = −5/2, z_y = 3/2. Check point is ON surface first.
- Ex 6: f = e^(xy) ln z: f_x = ye^(xy) ln z, f_y = xe^(xy) ln z, f_z = e^(xy)/z.
- Ex 7: f = x³ + x²y³ − 2y²: f_xx = 6x + 2y³, f_xy = f_yx = 6xy², f_yy = 6x²y − 4.
- Clairaut's theorem: f defined on disk D containing (a,b), f_xy and f_yx continuous on D ⇒ f_xy(a,b) = f_yx(a,b). Higher order too.
- Ex 8: f = sin(3x + yz): f_xxyz = −9cos(3x + yz) + 9yz sin(3x + yz).
- Ex 9: u = eˣ sin y satisfies Laplace. Ex 10: u = sin(x − at) satisfies wave equation.
- 3D Laplace u_xx + u_yy + u_zz = 0 (geophysics applications).

## 14.4 Tangent planes and linear approximations
**INTUITION**
- ! Zoom in on a smooth surface far enough and it looks FLAT — that flat piece is the tangent plane.
- Plane is built from the two tangent lines (x-slice slope f_x and y-slice slope f_y).
- Linearization = replace curved surface by its tangent plane to estimate nearby values.
- Differentiable = "locally flat-looking"; existence of f_x, f_y alone is NOT enough. Sufficient: f_x, f_y exist near point and are continuous there.
- dz = change along the tangent plane; Δz = actual change on surface; dz ≈ Δz for small dx, dy.
**EQUATIONS / PROBLEM-SOLVING**
- Tangent plane: z − z₀ = f_x(a,b)(x − a) + f_y(a,b)(y − b).
- Linearization: L(x,y) = f(a,b) + f_x(a,b)(x − a) + f_y(a,b)(y − b); f ≈ L near (a,b).
- Differentiability: Δz = f_xΔx + f_yΔy + ε₁Δx + ε₂Δy with ε₁, ε₂ → 0.
- Differential: dz = f_x dx + f_y dy. Error propagation: dx, dy = measurement errors, dz = max error (absolute values for worst case).
- 3 variables: L = f + f_x(x−a) + f_y(y−b) + f_z(z−c); dw = f_x dx + f_y dy + f_z dz. Relative error = dV/V.
**TEXTBOOK DETAILS**
- Tangent plane = plane containing T₁ and T₂ (later: contains tangent lines of ALL curves on S through P).
- Ex 1: z = 2x² + y² at (1,1,3) → z = 4x + 2y − 3. f(1.1, 0.95) ≈ 3.3 vs true 3.3225; far away (2,3): 11 vs 17.
  - ![Ex 1: the tangent plane z = 4x + 2y − 3 touches z = 2x² + y² at (1, 1, 3)](fig:c3-tangent-plane)
- WARNING: f = xy/(x² + y²), f(0,0) = 0: partials at origin both 0 but f = 1/2 on y = x → need differentiability.
- Theorem 8: f_x, f_y exist near (a,b) and continuous at (a,b) ⇒ differentiable.
- Ex 2: f = xe^(xy) at (1,0): L = x + y; f(1.1, −0.1) ≈ 1 vs actual ≈ 0.98542.
- Ex 3: heat index: f ≈ 125 + 3.75(T − 96) + 0.9(H − 70); f(97,72) ≈ 130.55.
- Ex 4: z = x² + 3xy − y², (2,3) → (2.05, 2.96): dz = 0.65 vs Δz = 0.6449.
- Ex 5: cone r = 10, h = 25: dV = 200πε; ε = 0.1 → ≈ 63 cm³ (≈ 2.4% relative error).
- Ex 6: box 75×60×40: dV = 9900ε; ε = 0.2 → 1980 cm³ (~1%).

## 14.5 The chain rule
**INTUITION**
- ! Dependency tree: output depends on intermediate variables, which depend on independent variables. To get the effect of t on z, add up ALL paths from z down to t; multiply derivatives along each path.
  - ![Chain rule tree: multiply along each path from z down to s, then add the paths](fig:c3-chain-tree)
- Physical: temperature T(x,y) felt by a moving bug at (x(t), y(t)) → dT/dt combines spatial change with the bug's motion.
**EQUATIONS / PROBLEM-SOLVING**
- Case 1: z = f(x,y), x = g(t), y = h(t): dz/dt = (∂z/∂x)(dx/dt) + (∂z/∂y)(dy/dt).
- Case 2: x = g(s,t), y = h(s,t): ∂z/∂s = z_x x_s + z_y y_s; ∂z/∂t = z_x x_t + z_y y_t.
- General: ∂u/∂t_i = Σ_j (∂u/∂x_j)(∂x_j/∂t_i). Draw tree diagram.
- Express final answer in terms of independent variables, or plug numbers at the end. Table problems: evaluate f_x at (x(t₀), y(t₀)), not at t₀.
- Second derivatives: ∂z/∂x is ITSELF a function of x, y → needs chain rule again (product + chain rule).
- Implicit: F(x,y) = 0 ⇒ dy/dx = −F_x/F_y. F(x,y,z) = 0 ⇒ ∂z/∂x = −F_x/F_z, ∂z/∂y = −F_y/F_z (F_z ≠ 0). Remember the MINUS sign.
**TEXTBOOK DETAILS**
- Thm 1 proof idea: divide Δz = f_xΔx + f_yΔy + ε₁Δx + ε₂Δy by Δt, let Δt → 0.
- Ex 1: z = x²y + 3xy⁴, x = sin2t, y = cos t: at t = 0, dz/dt = 6.
- Ex 2: PV = 8.31T, T = 300, dT/dt = 0.1, V = 100, dV/dt = 0.2 → dP/dt = −0.04155 kPa/s.
- Ex 3: z = eˣ sin y, x = st², y = s²t: z_s = (eˣ sin y)(t²) + (eˣ cos y)(2st); z_t = (eˣ sin y)(2st) + (eˣ cos y)(s²).
- Vocabulary: s, t INDEPENDENT; x, y INTERMEDIATE; z DEPENDENT.
- Ex 4: w = f(x,y,z,t) with x,y,z,t functions of (u,v): 4 terms each.
- Ex 5: u = x⁴y + y²z³, x = rse^t, y = rs²e^(−t), z = r²s sin t; at r = 2, s = 1, t = 0: u_s = 192.
- Ex 6: g(s,t) = f(s² − t², t² − s²) ⇒ t g_s + s g_t = 0.
- Ex 7: x = r² + s², y = 2rs: z_rr = 2z_x + 4r²z_xx + 8rs z_xy + 4s²z_yy.
- Implicit Function Theorem: F(a,b) = 0, F_y(a,b) ≠ 0, F_x, F_y continuous ⇒ y is a function of x near (a,b).
- Ex 8: x³ + y³ = 6xy → y' = −(x² − 2y)/(y² − 2x).
- Ex 9: x³ + y³ + z³ + 6xyz + 4 = 0 → same as 14.3 Ex 5 with less work.

## 14.6 Directional derivatives and the gradient vector
**INTUITION**
- f_x, f_y only give slopes east/north. D_u f = slope of the surface walking in ANY direction u (unit vector).
- ! ∇f = the arrow pointing UPHILL most steeply; its length = that steepest slope. −∇f = steepest descent; ⊥ to ∇f = no change (walking along a contour).
- D_u f = ∇f·u = |∇f|cosθ → max along ∇f, 0 when perpendicular, min when opposite.
  - ![D_u f = ∇f·u = |∇f| cos θ: largest along ∇f, zero along the contour](fig:c3-directional)
- ∇f is perpendicular to level curves (2D) and level surfaces (3D) → a NORMAL vector → tangent planes to implicit surfaces.
- On a contour map, gradient arrows cross contours at right angles, longer where contours are close.
**EQUATIONS / PROBLEM-SOLVING**
- D_u f(x₀,y₀) = lim_{h→0} [f(x₀ + ha, y₀ + hb) − f(x₀,y₀)]/h, u = ⟨a,b⟩ unit. D_i f = f_x, D_j f = f_y.
- ∇f = ⟨f_x, f_y⟩ (or ⟨f_x, f_y, f_z⟩). D_u f = ∇f·u.
- ! MUST normalize the direction: u = v/|v|. Angle given: u = ⟨cosθ, sinθ⟩.
- Max rate = |∇f(P)| in direction ∇f(P). Min = −|∇f|. Zero change: directions ⊥ ∇f.
- "Toward Q from P": v = Q − P, then normalize.
- Tangent plane to level surface F = k at P: F_x(P)(x − x₀) + F_y(P)(y − y₀) + F_z(P)(z − z₀) = 0. Normal line: x = x₀ + F_x t, etc. z = f(x,y) → F = f − z recovers 14.4 formula.
- Tangent line to level curve f(x,y) = k: f_x(x − x₀) + f_y(y − y₀) = 0.
- Path of steepest ascent: dx/dt, dy/dt proportional to ∇f components → solve the resulting DE.
**TEXTBOOK DETAILS**
- Ex 1 (contour map): Reno toward SE, u = (i − j)/√2 → D_uT ≈ 10/75 ≈ 0.13 °F/mi.
- Thm 3: f differentiable ⇒ D_u f = f_x a + f_y b. Proof via chain rule on g(h) = f(x₀ + ha, y₀ + hb).
- Ex 2: f = x³ − 3xy + 4y², θ = π/6: D_u f(1,2) = (13 − 3√3)/2.
- Ex 3: f = sin x + e^(xy): ∇f(0,1) = ⟨2,0⟩.
- D_u f = ∇f·u = scalar projection of gradient onto u.
- Ex 4: f = x²y³ − 4y at (2,−1), v = 2i + 5j: ∇f = ⟨−4, 8⟩, D_u f = 32/√29. (NORMALIZE first!)
- Ex 5: f = x sin yz at (1,3,0), v = i + 2j − k: ∇f = ⟨0,0,3⟩, D_u f = −√(3/2).
- Thm 15: max of D_u f is |∇f|, attained along ∇f.
- Ex 6: f = xe^y at (2,0): ∇f = ⟨1,2⟩. Toward Q(1/2,2): u = ⟨−3/5, 4/5⟩, D_u f = 1. Max rate √5.
- Ex 7: T = 80/(1 + x² + 2y² + 3z²) at (1,1,−2): ∇T = (5/8)⟨−1,−2,6⟩; max rate (5/8)√41 ≈ 4 °C/m.
- Tangent plane derivation: any curve r(t) on S: F(r(t)) = k → ∇F·r'(t) = 0 → ∇F ⊥ every tangent vector → normal to tangent plane.
- Ex 8: ellipsoid x²/4 + y² + z²/9 = 3 at (−2,1,−3): plane 3x − 6y + 2z + 18 = 0; normal line (x+2)/(−1) = (y−1)/2 = (z+3)/(−2/3).
- Ex 9: z = 2x² + y² at (1,1,3) via F = 2x² + y² − z: z = 4x + 2y − 3 (same as 14.4 Ex 1).
- Summary: (1) D_u f = ∇f·u; (2) ∇f points in direction of max increase, max rate = |∇f|; (3) ∇f ⊥ level curve/surface through the point.
- Curve of steepest ascent crosses every contour at right angles. Gradient field of x² − y²: arrows uphill, ⊥ hyperbolic level curves.
  - ![Gradient field of x² − y²: arrows point uphill and cross every level curve at a right angle](fig:c3-gradient-field)
- Note: 14.1–14.6 textbook pages read from MindTap; exercises not included.

## Chapter connections
- 14.3 partials → 14.4 tangent plane built from them → 14.5 chain rule = linearization composed → 14.6 gradient packages partials into one vector; D_u f = ∇f·u is the chain rule along a line.
- Tangent plane two ways: explicit z = f(x,y) (14.4) vs implicit F = k via ∇F normal (14.6).
- Next: 14.7 max/min uses ∇f = 0 (critical points) and second-derivative test.
- Cross-course: |det A| as area/volume scale factor (Lin Alg 3.3) → Jacobian (Calc III, coming in Ch 15).
- Cross-course: steepest-ascent paths (Calc III 14.6) solved as DEs (MTH 267).

## Quick self-test
- Can checking paths prove that a limit exists?
  - No. Paths can only DISPROVE a limit. Prove it with the Squeeze theorem or polar coordinates.
- Why does lim of xy/(x² + y²) at (0,0) not exist?
  - Along y = mx it gives m/(1 + m²), which depends on m.
- Every line through the origin gives 0 for xy²/(x² + y⁴). Does the limit exist?
  - No. The parabola x = y² gives 1/2. All lines agreeing proves nothing.
- What is the tangent plane to z = f(x,y) at (a,b)?
  - z − z₀ = f_x(a,b)(x − a) + f_y(a,b)(y − b)
- Are f_x and f_y existing enough for f to be differentiable?
  - No. Sufficient: f_x and f_y exist near the point and are continuous there (Theorem 8).
- For F(x,y,z) = 0, what is ∂z/∂x?
  - −F_x/F_z (F_z ≠ 0). Remember the minus sign.
- What must you do to v before computing D_u f?
  - Normalize it: u = v/|v|.
- In which direction does f increase fastest, and how fast?
  - Along ∇f, at rate |∇f|.
- How is ∇f related to level curves and level surfaces?
  - Perpendicular to them, so ∇F is the normal vector for tangent planes to F = k.
- What do closely packed contour lines mean?
  - Steep. Far apart means gentle or flat.
- What does the domain need for √(stuff), ln(stuff) and fractions?
  - √ needs stuff ≥ 0, ln needs stuff > 0, denominators ≠ 0.`,
        figures: {"c3-paraboloid":{"w":640,"h":440,"bg":"plain","graph":"3d\nx: -2 .. 2\ny: -2 .. 2\nz: 0 .. 8\nsurface z = x^2 + y^2 | levels 1, 2, 4, 6 | floor | label z = x² + y²: traces at z = 1, 2, 4, 6","items":[]},"c3-ellipses":{"w":520,"h":440,"bg":"plain","graph":"x: -2 .. 2\ny: -3.2 .. 3.2\nequal\nlevel 4x^2 + y^2 + 1 = 2, 3, 5, 7, 10 | blue","items":[]},"c3-egg-crate":{"w":640,"h":420,"bg":"plain","graph":"3d\nx: -pi .. pi\ny: -pi .. pi\nz: -2 .. 2\nsurface z = sin(x) + sin(y) | mesh 18 | teal","items":[]},"c3-hills":{"w":520,"h":460,"bg":"plain","graph":"x: -2.4 .. 2.4\ny: -2.4 .. 2.4\nequal\nlevel -x y e^(-x^2 - y^2) = 0.03, 0.08, 0.14 | red | label hill\nlevel -x y e^(-x^2 - y^2) = -0.03, -0.08, -0.14 | blue | label valley","items":[]},"c3-two-paths":{"w":520,"h":460,"bg":"plain","graph":"x: -2 .. 2\ny: -2 .. 2\nequal\ny = 0 | gray thick | label x-axis: 0\ny = x | red thick | label y = x: 1/2\ny = -x | blue thick | label y = −x: −1/2\ny = 2x | green | label y = 2x: 2/5\nparam t^2, t | t: -1.5 .. 1.5 | purple dashed | label x = y²: 1/2 for xy²/(x²+y⁴)\npoint 0,0 | black","items":[]},"c3-tangent-plane":{"w":640,"h":440,"bg":"plain","graph":"3d\nx: -1.6 .. 1.6\ny: -1.6 .. 1.6\nz: 0 .. 8\nsurface z = 2x^2 + y^2 | mesh 12 | blue\npolygon3 0.45,0.45,-0.3; 1.55,0.45,4.1; 1.55,1.55,6.3; 0.45,1.55,1.9 | fill orange | label tangent plane\npoint3 1,1,3 | red | label (1, 1, 3)","items":[]},"c3-chain-tree":{"w":600,"h":400,"bg":"plain","graph":"","items":[{"t":"text","x":290,"y":52,"s":"z","c":"black","size":28},{"t":"text","x":12,"y":52,"s":"dependent","c":"gray","size":13},{"t":"text","x":150,"y":190,"s":"x","c":"blue","size":26},{"t":"text","x":430,"y":190,"s":"y","c":"green","size":26},{"t":"text","x":12,"y":190,"s":"intermediate","c":"gray","size":13},{"t":"text","x":84,"y":330,"s":"s","c":"blue","size":24},{"t":"text","x":212,"y":330,"s":"t","c":"blue","size":24},{"t":"text","x":366,"y":330,"s":"s","c":"green","size":24},{"t":"text","x":494,"y":330,"s":"t","c":"green","size":24},{"t":"text","x":12,"y":300,"s":"independent","c":"gray","size":13},{"t":"line","x1":288,"y1":62,"x2":162,"y2":168,"c":"blue","sw":2,"arrow":0},{"t":"line","x1":302,"y1":62,"x2":430,"y2":168,"c":"green","sw":2,"arrow":0},{"t":"line","x1":152,"y1":200,"x2":92,"y2":306,"c":"blue","sw":2,"arrow":0},{"t":"line","x1":160,"y1":200,"x2":216,"y2":306,"c":"blue","sw":2,"arrow":0},{"t":"line","x1":432,"y1":200,"x2":372,"y2":306,"c":"green","sw":2,"arrow":0},{"t":"line","x1":440,"y1":200,"x2":497,"y2":306,"c":"green","sw":2,"arrow":0},{"t":"text","x":172,"y":112,"s":"∂z/∂x","c":"blue","size":15},{"t":"text","x":372,"y":112,"s":"∂z/∂y","c":"green","size":15},{"t":"text","x":70,"y":262,"s":"∂x/∂s","c":"blue","size":14},{"t":"text","x":192,"y":262,"s":"∂x/∂t","c":"blue","size":14},{"t":"text","x":352,"y":262,"s":"∂y/∂s","c":"green","size":14},{"t":"text","x":474,"y":262,"s":"∂y/∂t","c":"green","size":14},{"t":"text","x":60,"y":385,"s":"∂z/∂s = (∂z/∂x)(∂x/∂s) + (∂z/∂y)(∂y/∂s)","c":"black","size":17}]},"c3-directional":{"w":560,"h":460,"bg":"plain","graph":"x: -0.4 .. 2.6\ny: -0.4 .. 2.4\nequal\nlevel x^2 + y^2 = 0.5, 2, 3.5 | gray\npoint 1,1 | black | label P\nvector 1,1 -> 1.75,1.75 | red thick | label ∇f (steepest)\nvector 1,1 -> 1.94,0.66 | blue thick | label u\nsegment 0.4,1.6 -> 1.6,0.4 | green dashed | label D_u f = 0 along the contour\ntext 1.45,1.08 : θ","items":[]},"c3-gradient-field":{"w":520,"h":460,"bg":"plain","graph":"x: -2 .. 2\ny: -2 .. 2\nequal\nlevel x^2 - y^2 = -2, -1, 1, 2 | blue quiet\nfield 2x, -2y | red n 10","items":[]}},
      },
      {
        id: 'course-2026-10-19-ap-biology-unit-2',
        version: 1,
        label: 'AP Biology · Unit 2 Part II (transport, water potential)',
        date: '2026-10-19T12:00:00.000Z',
        text: `# AP Biology · Unit 2 Part II

## Start here
- Note: Unit 2 Part II is transport (textbook Module 10) plus tonicity, water potential, osmolarity and osmoregulation (Module 11, AP Classroom 2.8–2.9).
- Tip: every idea comes with a Hook (a keyword) and a Picture (a mental image). Read the hook, see the picture, then say the fact out loud.
- Note: the AP formula sheet gives Ψ = Ψₚ + Ψₛ, Ψₛ = −iCRT and R. A class test may not, so memorize them.
- Tip: short on time? Read Water potential, then Solute potential, the worked problems, Osmosis and tonicity, and finish with the memory hooks.
- ![Every way across the membrane: passive goes downhill for free, active pays ATP to go uphill](fig:bio-transport-tree)

## Passive vs. active transport
**INTUITION**
- ! Passive transport goes downhill, from high to low concentration, for free. Active transport pays ATP to go uphill, from low to high.
- Hook: passive = downhill and free; active = uphill and pay ATP. Picture: a sled coasting downhill vs. a person shoving a boulder uphill past an ATP toll booth.
- ![The membrane up close: four passive routes and one ATP pump](fig:bio-membrane)
**KEY TERMS**
- What is a solute?
  - Anything dissolved in a liquid, such as salt or glucose.
- What is a solvent?
  - The liquid that does the dissolving, such as water. Solute + solvent = solution.
- Concentration: the amount of solute per unit of solvent
- Molarity (M) = moles of solute per liter; 1 M NaCl is 1 mole of NaCl dissolved in 1 liter of water
- What is a concentration gradient?
  - A difference in concentration between two areas.
- Diffusion: movement of molecules from high to low concentration without ATP; it helps keep an organism at homeostasis
- Dynamic equilibrium: the state where molecules keep moving but there is no net movement
- Passive transport: movement down the concentration gradient (high → low) with no ATP, such as simple diffusion, facilitated diffusion and osmosis
- Active transport: movement against the gradient (low → high) that needs ATP and a membrane-spanning protein, such as the Na⁺/K⁺ pump, endocytosis and exocytosis
**WHO GOES WHICH WAY**
- Simple diffusion: diffusion straight through the bilayer with no protein, for small nonpolar molecules (O₂, CO₂, N₂) and small uncharged polar molecules
  - Hook: SNP and SUP slip through. Picture: a ninja slipping between the phospholipids.
- Facilitated diffusion: passive movement through an embedded protein, for larger hydrophilic molecules and ions (glucose, amino acids, Na⁺, K⁺, water)
  - Hook: a facilitator opens the door. Picture: a channel is a tunnel and a carrier is a revolving door.
- What is a channel protein?
  - A tunnel through the membrane for specific ions or water.
- What is a carrier protein?
  - A protein that changes shape to carry a specific molecule across, such as glucose.
- What is an aquaporin?
  - A channel protein that only water can pass through (aqua = water, porin = pore).
- What is a leak channel?
  - A channel that is always open, so ions can always diffuse through it.
- What is a gated channel?
  - A channel that opens only on a signal, such as a voltage change, a molecule binding, or touch and stretch.
- Osmosis: diffusion of water across a semipermeable membrane, through small gaps or aquaporins
- Why do ions and large polar molecules need a protein to cross the membrane?
  - The middle of the bilayer is made of hydrophobic fatty-acid tails, which repel charged and polar particles.
  - Picture: an oil slick that charged particles bounce off.
**WHAT SPEEDS UP DIFFUSION**
- Which factors make diffusion faster?
  - Higher temperature (more kinetic energy)
  - Larger surface area (a bigger SA:V)
  - A steeper concentration gradient
  - Smaller particles
  - A shorter distance (rate is inversely proportional to distance)
  - The medium: fastest in a gas, slower in a liquid, slowest in a solid
- Hook: fast diffusion = HOT, BIG, STEEP, SMALL, SHORT, GAS. Picture: a big hot-air balloon racing down a short, steep slope.

## Osmosis and tonicity
**INTUITION**
- ! Water moves toward the side with more solute, which is the side with the lower water potential.
- Hook: water follows solute ("where salt goes, water flows"). Picture: a salt shaker with a stream of water chasing it.
- Tonicity always describes the solution outside the cell, compared with the inside of the cell.
- What do hyper, hypo, iso and tonic mean?
  - Hyper means above or more, hypo means below or less, iso means equal, and tonic means solution.
- ![Same solution, two outcomes: the wall saves the plant cell from bursting](fig:bio-tonicity)
**KEY TERMS**
- What is a hypotonic solution?
  - A solution with less solute than the inside of the cell, so water moves into the cell.
- What is an isotonic solution?
  - A solution with the same solute concentration as the cell, so there is no net water movement (NNMW).
- What is a hypertonic solution?
  - A solution with more solute than the inside of the cell, so water moves out of the cell.
- Osmolarity: the total solute concentration (osmoles per liter); it sets the rate and direction of osmosis
- Tonicity: a comparison of a solution with a cell that counts only the solutes that can't cross the membrane
- What does hyperosmotic mean?
  - A solution has a higher solute concentration than another solution.
- What does hypoosmotic mean?
  - A solution has a lower solute concentration than another solution.
- What does isosmotic mean?
  - Two solutions have the same solute concentration.
- Lysis: an animal cell bursting after too much water enters (hypotonic)
- Crenation: an animal cell shriveling as water leaves (hypertonic)
- What does turgid mean?
  - A plant cell is firm and swollen with water (in a hypotonic solution). It is the healthy normal state for plants.
- What does flaccid mean?
  - A plant cell is limp (in an isotonic solution).
- Plasmolysis: the cell membrane pulling away from the cell wall as water leaves (hypertonic); the plant wilts and can die
- Osmotic pressure: the pressure needed to stop osmosis; it rises with higher concentration and higher temperature
**WHAT HAPPENS TO CELLS**
- What happens to animal and plant cells in a hypotonic solution?
  - Water moves into the cell.
  - Animal cell (red blood cell): swells and may burst (lysis).
  - Plant cell: turgid and firm, because the cell wall stops it from bursting.
- What happens to animal and plant cells in an isotonic solution?
  - Water moves in and out at equal rates, so there is no net movement.
  - Animal cell: stays normal.
  - Plant cell: flaccid (limp).
- What happens to animal and plant cells in a hypertonic solution?
  - Water moves out of the cell.
  - Animal cell: shrivels (crenation).
  - Plant cell: plasmolysis, as the membrane pulls away from the wall and the plant wilts.
- Why can a plant cell take in water without bursting when an animal cell can't?
  - A plant cell has a cell wall and a membrane, but an animal cell has only a membrane. The wall pushes back (turgor pressure).
- Warning: the slides disagree on isotonic plant cells. Slide 27 says normal, but the Tonicity Review table says flaccid. AP and the textbook say flaccid.
**HOOKS**
- Hook (hypotonic): hyp-O swells into an O, then pOps. Picture: a water balloon bursting on a faucet.
- Hook (hypertonic): a hyper solution is a hyper sponge that sucks water out. Picture: a grape shriveling into a raisin.
- Hook (isotonic): I-S-O, I Stay the same, Okay. Picture: a cell relaxing in a hammock.
- Hook (turgid, flaccid): Turgid = Tight, Flaccid = Floppy. Picture: a water balloon filling a box vs. wilted lettuce.
- Hook (plasmolysis): the plasma membrane lets go of the wall. Picture: a deflating balloon shrinking away from the inside of a box.
- Hook (lysis, crenation): lysis = burst, crenation = crinkled. Picture: a crinkle-cut fry.
**SLIDE EXAMPLES**
- A red blood cell goes into pure water. Does water move in or out, and why?
  - In. Pure water (Ψ = 0) is hypotonic to the cell and has the higher Ψ, so water enters by osmosis and the cell may burst.
- A patient gets an IV of pure water. Will water move into or out of the blood cells?
  - Into the blood cells. The IV fluid has the higher Ψ, so the cells swell and could burst.
- What does osmotic pressure have to do with salami?
  - Salt makes the meat hypertonic to bacteria. The bacteria lose water, can't grow, and the food keeps.
- What happens in a U-tube when sugar is added to one arm and the membrane lets only water through?
  - Water moves into the sugar side, so that arm's level rises.
  - ![U-tube: add sugar to one arm and water moves in, so that side rises](fig:bio-u-tube)
- Hook (osmotic pressure): osmotic pressure is Ψₛ without the minus sign. Picture: the sugar arm of the U-tube rising like a thermometer.

## Water potential (Ψ)
**INTUITION**
- ! Water always moves from higher Ψ to lower Ψ. Every problem comes down to finding two Ψ values and comparing them.
- Water potential (Ψ): the potential water has to move to another location; it explains water movement in plants, animals and soil
- Hook: water flows downhill. Picture: a waterfall that starts at 0 at the top and spills down into the negative numbers.
- ![Water flows downhill, from higher Ψ to lower Ψ](fig:bio-psi-stairs)
- The larger Ψ is in an area, the more likely water is to move away from it. The lower (more negative) Ψ is, the less likely water is to leave.
**EQUATIONS**
- Ψ = Ψₚ + Ψₛ
- Pressure potential (Ψₚ): the physical pressure on the water, called turgor pressure in a plant cell
- Solute potential (Ψₛ): the effect of dissolved solutes; more solute makes it more negative
- 1 MPa = 10 bars
- What units does water potential use?
  - Bars or megapascals (MPa). 1 MPa = 10 bars.
**SIGN RULES**
- What is Ψ of pure (distilled) water in an open container?
  - 0. It is the reference point.
- What sign does Ψₛ have when anything is dissolved in the water?
  - Negative. More solute makes it more negative.
- What is Ψₚ of a solution open to the air, such as an open beaker?
  - 0, so Ψ = Ψₛ.
- When is Ψₚ positive?
  - In a turgid plant cell, where the wall pushes back on the water. The slides say positive pressure = turgid and negative pressure = flaccid.
- What is Ψₚ of an animal cell?
  - Usually 0, because an animal cell has no wall.
- What raises Ψ, and what lowers it?
  - Raises it: positive pressure (turgor, squeezing) or removing solute.
  - Lowers it: adding solute (salt, sugar), negative pressure (tension), and gravity pulling water down.
**DECIDE THE DIRECTION**
- How to decide which way water moves
  1. Find Ψ for side A (Ψₚ + Ψₛ).
  2. Find Ψ for side B.
  3. Water moves from the higher Ψ (closer to zero, or positive) to the lower Ψ (more negative).
  4. If the two are equal, there is no net movement (dynamic equilibrium).
- Warning: −2.43 is higher than −2.7. The number closer to zero is the higher Ψ.
- Hook (negative numbers): Ψ is a bank balance. −2 beats −5, and water flows toward whoever is deeper in debt, the thirstier side.
- Which side has the lower Ψ, the hypertonic side or the hypotonic side?
  - The hypertonic side (more solute), so water moves into it. The hypotonic side has the higher Ψ, so water leaves it.
- How do you explain water movement on an FRQ?
  - Say it both ways: "The solution is hypertonic, so it has a lower Ψ than the cell. Water moves by osmosis from the cell's higher Ψ to the solution's lower Ψ."

## Solute potential: Ψₛ = −iCRT
**INTUITION**
- ! The formula turns a concentration and a temperature into a solute potential in bars. Its minus sign is why adding solute always lowers Ψ.
- Why does adding solute make Ψ more negative?
  - A bigger C makes iCRT bigger, and the minus sign makes Ψₛ more negative. More solute means a lower Ψ.
- ![Ψₛ falls in a straight line as C rises, and NaCl falls twice as fast as sucrose](fig:bio-icrt)
**EQUATIONS**
- Ψₛ = −iCRT
  - Hook: Melting Ice Cream Ruins T-shirts = Minus, i, C, R, T. Picture: a melting cone dripping on a T-shirt on a hot day; the heat reminds you that T must be in Kelvin.
- i (ionization constant): how many particles one unit splits into in water; sucrose and glucose = 1, NaCl = 2, CaCl₂ = 3
  - Hook: count the pieces. Picture: a sugar cube stays whole (1), but a salt crystal snaps into Na⁺ and Cl⁻ (2).
- C (molar concentration): moles of solute per liter (M), from the problem or the lab graph
- R (pressure constant): 0.0831 L·bar/(mol·K), which gives the answer in bars
  - Hook: read 0.0831 as 8/31, the end of summer, when ice cream melts fastest. Picture: a calendar torn to August 31.
- T (temperature): the temperature in Kelvin, never in °C
- T (Kelvin) = °C + 273
  - 20°C is 293 K, 22°C is 295 K, 25°C is 298 K, 27°C is 300 K, and 37°C is 310 K.
- Hook (MPa and bars): one Mega bar = ten candy bars. MPa × 10 gives bars, and bars ÷ 10 gives MPa.
**THE PROCEDURE**
- How to calculate Ψₛ and then Ψ
  1. Write the formula Ψₛ = −iCRT.
  2. Pick i: 1 for sugars, 2 for NaCl.
  3. Get C in mol/L.
  4. Convert T to Kelvin (add 273).
  5. Multiply i × C × 0.0831 × T, then attach the minus sign.
  6. Round as asked (usually to the hundredth); the units are bars.
  7. For Ψ, add Ψₚ (0 if the container is open).
- Warning: 0.25 M NaCl and 0.5 M sucrose have the same Ψₛ at the same temperature, because i × C = 0.5 for both. Compare i × C, not just C.
**SHORTCUTS**
- What happens to Ψₛ if you double i, C or T (in Kelvin)?
  - It doubles (twice as negative), because Ψₛ is directly proportional to each one.
- At the same molarity, how does the Ψₛ of NaCl compare with that of sucrose?
  - NaCl's Ψₛ is twice as negative, because its i is 2.
- How do you find C when Ψₛ is given?
  - C = −Ψₛ ÷ (iRT)
**POTATO LAB CONNECTION**
- How do you get the potato's Ψ from the lab graph?
  - Plot % change in mass (y) against sucrose molarity (x) and draw a best-fit line.
  - The x-intercept (0% change) is the iso-osmolar molarity, where the potato neither gains nor loses water.
  - Plug that molarity in as C to get Ψₛ. The beaker is open and at equilibrium, so that is also the potato's Ψ.
- ![Potato cores (example data): the best-fit line crosses 0% at the potato's iso-osmolar molarity](fig:bio-potato)
- Hook (lab graph): the x-intercept is the potato's break-even point, where water traffic is equal both ways.

## Worked water potential problems
- Tip: cover each answer and try the problem first. On an FRQ, show the formula, the numbers with units, the answer with units, and one sentence on which way water moves.
**FROM THE SLIDES**
- Problem 1: A plant cell has Ψₚ = 3 bars and Ψₛ = −2.5 bars. What is Ψ?
  - Ψ = Ψₚ + Ψₛ = 3 + (−2.5) = 0.5 bars
- Problem 2: That cell (Ψ = 0.5 bars) goes into an open beaker of sugar water with Ψₛ = −3.0 bars. Which way does water move?
  - The beaker is open, so Ψₚ = 0 and the sugar water's Ψ = −3.0 bars.
  - 0.5 > −3.0, so water moves out of the cell (higher to lower).
- Problem 3: A cell has Ψₚ = 2 bars and Ψₛ = −3.5 bars. What is its Ψ, and which way does water move in sugar water with Ψₛ = −4.0 bars, or with Ψₛ = −0.15 MPa?
  - Ψ = 2 + (−3.5) = −1.5 bars
  - In −4.0 bars: −1.5 > −4.0, so water moves out of the cell.
  - In −0.15 MPa: convert first, −0.15 × 10 = −1.5 bars. That equals the cell's Ψ, so there is no net flow (equilibrium).
- Problem 4: Root tissue has Ψ = −2.7 bars (the packet version uses −3.3). It goes into 0.1 M sucrose at 20°C in an open beaker. What is the solution's Ψ, and which way does water move?
  - T = 20 + 273 = 293 K
  - Ψₛ = −(1)(0.1 mol/L)(0.0831 L·bar/mol·K)(293 K) = −2.43 bars, and Ψ = −2.43 bars (open beaker)
  - −2.43 > −2.7 (and > −3.3), so water moves into the root.
- Problem 5: Same as Problem 4, but with 0.1 M NaCl. What is the solution's Ψ, and which way does water move?
  - NaCl splits into Na⁺ and Cl⁻, so i = 2.
  - Ψₛ = −(2)(0.1)(0.0831)(293) = −4.87 bars, so Ψ = −4.87 bars
  - −3.3 > −4.87, so water moves out of the root into the salt solution.
- Problem 6: A sugar solution in an open beaker is 0.3 M at 27°C. What are Ψₛ and Ψ, to the hundredth?
  - T = 27 + 273 = 300 K
  - Ψₛ = −(1)(0.3)(0.0831)(300) = −7.48 bars, and Ψ = 0 + (−7.48) = −7.48 bars
- Problem 7 (paramecium FRQ): An animal cell without contractile vacuoles has Ψₛ = −2 and Ψₚ = 0. What is Ψ?
  - Ψ = 0 + (−2) = −2 bars
**NEW PRACTICE WITH TRAPS**
- Problem 8 (the i trap): What is Ψₛ of 0.15 M CaCl₂ at 25°C?
  - CaCl₂ splits into Ca²⁺ and two Cl⁻, so i = 3, and T = 298 K.
  - Ψₛ = −(3)(0.15)(0.0831)(298) = −11.14 bars
- Problem 9 (working backward): A sucrose solution at 25°C has Ψₛ = −5.0 bars. What is its molarity?
  - C = −Ψₛ ÷ (iRT) = 5.0 ÷ (1 × 0.0831 × 298) = 0.20 M
- Problem 10 (turgor counts): A turgid plant cell has Ψₛ = −6.0 bars and Ψₚ = +2.0 bars. Which way does water move in 0.1 M NaCl at 20°C, and in 0.1 M sucrose at 20°C?
  - Ψ = 2.0 + (−6.0) = −4.0 bars
  - 0.1 M NaCl has Ψ = −4.87 bars. −4.0 > −4.87, so water leaves the cell.
  - 0.1 M sucrose has Ψ = −2.43 bars. −2.43 > −4.0, so water enters the cell.
- Problem 11 (mixed units): A cell has Ψ = −0.35 MPa, and the solution around it has Ψ = −4.0 bars. Which way does water move?
  - Convert: −0.35 MPa × 10 = −3.5 bars.
  - −3.5 > −4.0, so water moves out of the cell into the solution.
- Problem 12 (potato lab): The best-fit line crosses 0% mass change at 0.27 M sucrose, and the room is 23°C. What is the potato's Ψ?
  - T = 296 K, so Ψₛ = −(1)(0.27)(0.0831)(296) = −6.64 bars.
  - No net water moves at that molarity, so the potato's Ψ = −6.64 bars.
- Problem 13 (percent change): A potato core goes from 4.00 g to 3.60 g. What is the percent change, and what kind of solution was it in?
  - Mass difference = 3.60 − 4.00 = −0.40 g
  - % change = −0.40 ÷ 4.00 × 100 = −10%
  - It lost water, so the solution was hypertonic to the potato (lower Ψ).
- Problem 14 (U-tube): Arm A holds 0.2 M sucrose and arm B holds 0.5 M sucrose, and the membrane lets only water through. What happens?
  - B has more solute, so B has the lower Ψ. Water moves from A to B, so B rises and A falls.
  - If sucrose could cross too, it would diffuse from B to A until both sides were 0.35 M, and the levels would end up equal.
- Problem 15 (dialysis bag): A bag of 0.4 M sucrose sits in 0.1 M sucrose, and only water can cross. What happens to the bag's mass?
  - The bag has the lower Ψ, so water moves in and the bag's mass increases.
  - With 0.1 M inside and 0.4 M outside, the bag would lose mass instead.
- Problem 16 (isosmotic): 0.25 M NaCl is separated from 0.5 M sucrose by a membrane that lets only water through, at the same temperature. Which way does water move?
  - NaCl: i × C = 2 × 0.25 = 0.5. Sucrose: i × C = 1 × 0.5 = 0.5. Their Ψₛ values are equal.
  - There is no net water movement.

## Na⁺/K⁺ pump and neurons
**INTUITION**
- ! The Na⁺/K⁺ pump uses ATP to push 3 Na⁺ out and bring 2 K⁺ in, against both gradients. Neurons and muscle cells need it to reset after every signal.
- ![The Na⁺/K⁺ pump: 3 Na⁺ out, 2 K⁺ in, one ATP per cycle](fig:bio-nak-pump)
- Hook: 3 salty sailors out, 2 kings in, one ATP ticket per round. Picture: a nightclub bouncer tossing out 3 sailors (Na⁺, from the salty sea outside) and waving in 2 kings (K⁺).
- Hook (backup): Na⁺ lives in the sea (outside), and K⁺ lives in the pantry with the bananas (inside).
**KEY TERMS**
- What is the Na⁺/K⁺ pump?
  - An embedded protein that uses ATP to move 3 Na⁺ out and 2 K⁺ in, against their gradients.
- What is an electrogenic pump?
  - A pump that builds a voltage across the membrane. The Na⁺/K⁺ pump sends out 3 positive charges for every 2 it brings in, so the inside gets more negative.
- What is a neurotransmitter?
  - A chemical messenger stored in vesicles in the axon terminal. Neurotransmitters control mood, movement and sleep, and are excitatory, inhibitory or modulatory.
- What is the synaptic cleft?
  - The gap between the axon terminal and the next cell.
**THE PUMP CYCLE**
- The Na⁺/K⁺ pump cycle
  1. Three Na⁺ from the cytoplasm bind to the pump.
  2. ATP phosphorylates the pump: ATP is split to ADP, and the phosphate sticks to the pump.
  3. The pump changes shape and releases the Na⁺ outside.
  4. Two K⁺ from outside bind, and the phosphate falls off (dephosphorylation).
  5. The pump returns to its original shape.
  6. K⁺ is released inside, and the cycle repeats.
**HOW A NEURON FIRES**
- Neurons use passive transport (K⁺, Na⁺ and Cl⁻ leak channels) and active transport (the Na⁺/K⁺ pump, exocytosis and endocytosis).
- Polarization (resting potential): the neuron at rest, with nothing firing; the inside is negative, the outside is positive (mostly Na⁺), and the pump keeps the gradients
- Depolarization (action potential): the inside turning positive as a stimulus lets Na⁺ rush in; the charge travels down the axon
- Repolarization: the return to a negative inside as K⁺ flows out; then the Na⁺/K⁺ pump returns every ion to its original side
- ![Membrane potential during one action potential](fig:bio-action-potential)
- Hook: Sodium Storms in, Potassium Packs out, the Pump cleans up. Picture: a stadium wave, then the cleanup crew resetting the seats.
- Resting potential is about −70 mV (beyond the slides).
**NEUROTRANSMITTER RELEASE**
- How a neurotransmitter is released at the synapse
  1. The action potential reaches the axon terminal.
  2. Ca²⁺ gated channels open, and Ca²⁺ diffuses into the axon.
  3. The Ca²⁺ makes vesicles full of neurotransmitter fuse with the membrane.
  4. Exocytosis releases the neurotransmitters into the synaptic cleft.
  5. They bind receptors on the next neuron or muscle cell, opening ion channels and starting a new signal.
  6. They are taken back into the axon for reuse (reuptake) or broken down.
- Hook: Calcium Calls the vesicles. Picture: calcium ringing a doorbell, and the delivery trucks (vesicles) unloading at the dock.
- What are parts 1 to 8 of the synapse diagram, where A is the presynaptic axon terminal and B is the postsynaptic cell?
  - 1 mitochondrion (makes ATP), 2 synaptic vesicle full of neurotransmitter, 3 autoreceptor, 4 synaptic cleft
  - 5 receptors on the postsynaptic cell, 6 Ca²⁺ channel, 7 vesicle fusing with the membrane (exocytosis), 8 reuptake pump
  - This is the standard version of that diagram, so check it against the class key.
  - ![Synapse: the numbered parts from the review slide](fig:bio-synapse)
- Which neuron steps use active transport, and which use passive transport?
  - Active (ATP): the Na⁺/K⁺ pump holding the resting potential, restoring the gradients after an action potential, and releasing neurotransmitters by exocytosis.
  - Passive (no ATP): Na⁺ entering during depolarization, K⁺ leaving during repolarization, and ion movement in the receiving neuron.
  - Removing neurotransmitters can use diffusion, transport or endocytosis.
**NEUROTRANSMITTERS (RECORD 3)**
- What does serotonin do, and what does an imbalance cause?
  - It affects mood, hunger, sleep and arousal. Too little is linked to depression.
- What does dopamine do, and what does an imbalance cause?
  - It affects movement, learning, attention and emotion. Too much is linked to schizophrenia; too little to tremors, Parkinson's and ADHD.
- What does acetylcholine (ACh) do, and what does an imbalance cause?
  - It enables muscle action, learning and memory. ACh-making neurons deteriorate in Alzheimer's.
- Hook (ACh): ACh = ACTion. Picture: a flexing bicep.
- What does norepinephrine do, and what does an imbalance cause?
  - It controls alertness and arousal. Too little can depress mood and cause ADHD-like attention problems.
- What does GABA do, and what does an imbalance cause?
  - It is the major inhibitory neurotransmitter. Too little is linked to seizures, tremors and insomnia.
- What does glutamate do, and what does an imbalance cause?
  - It is the major excitatory neurotransmitter and is involved in memory. Too much can cause migraines or seizures.
- Hook (GABA, glutamate): GABA is the brakes, glutamate is the gas pedal.

## Endocytosis and exocytosis
**INTUITION**
- ! Endocytosis brings large materials in by folding the membrane into a vesicle. Exocytosis sends them out by fusing a vesicle with the membrane. Both need ATP and count as active transport.
- ![Endocytosis folds the membrane in; exocytosis fuses a vesicle out](fig:bio-endo-exo)
- Hook: ENDO = ENter, EXO = EXit. Picture: a revolving door with an ENTER sign on one side and an EXIT sign on the other.
**KEY TERMS**
- Endocytosis: taking material in, as a patch of membrane folds inward around it, forms a vesicle and pinches off inside; the contents go to an organelle or stay in the cytoplasm
- Exocytosis: sending material out, as a vesicle moves to the membrane, fuses with it, and releases its contents outside the cell
- Phagocytosis: "cell eating", where the cell engulfs large particles such as microbes or food
  - Hook: phago = eat. Picture: Pac-Man gobbling a bacterium.
- Pinocytosis: "cell drinking", where the cell takes in a small volume of the fluid outside it
  - Hook: pino = drink. Picture: the membrane sipping through a straw.
- Receptor-mediated endocytosis: endocytosis that takes in only molecules bound to specific receptors, such as LDL cholesterol (beyond the slides)
  - Hook: a VIP list. Picture: a bouncer at a velvet rope checking names.
- What are examples of exocytosis?
  - Neurotransmitters released from vesicles at a neuron's axon terminal, and proteins (such as insulin) released after protein synthesis.
  - Picture: a mail truck backing up to a loading dock and dropping its packages outside.
- What do endocytosis and exocytosis have in common?
  - Both use vesicles, both move large particles or bulk material, and both need ATP (active transport).

## Osmoregulation and nitrogenous wastes
**INTUITION**
- Osmoregulation: how an organism keeps its water and solute balance (homeostasis); it makes up for water loss, avoids excess water gain, and keeps body fluids at the right osmolarity
- Why do water potential and osmolarity matter to organisms?
  - They control plant turgor, kidney function, cell homeostasis and water balance.
- In organisms the membrane acts as a semipermeable barrier, so osmotic pressure moves water in and out of cells and changes their volume and shape. More solute means more osmotic pressure.
**KEY TERMS**
- What is an osmoregulator?
  - An organism that actively keeps its internal solute concentration steady, whatever the environment. It requires energy (fish, humans, birds, reptiles, plants).
- What is an osmoconformer?
  - An organism whose internal solute concentration matches the environment. It uses minimal energy (marine invertebrates such as starfish, jellyfish, crabs, mussels and sea cucumbers).
- Hook: Regulator = Resists, Conformer = Copies. Picture: a thermostat vs. a chameleon.
- What does a contractile vacuole do?
  - In freshwater protists such as paramecia, it collects extra water and pumps it out of the cell, using ATP.
  - Hook: a bilge pump. Picture: a sailor pumping water out of a leaky boat; the fresher the water, the faster he pumps.
- What does the central vacuole do in a plant cell?
  - It stores water to keep turgor pressure up.
**FISH**
- ![Freshwater fish gain water and lose salt; saltwater fish lose water and gain salt](fig:bio-fish)
- How do freshwater fish osmoregulate?
  - They are saltier than the water around them, so water floods in and salt leaks out.
  - They don't drink, they make lots of dilute urine, and they actively take up salt through their gills.
  - Hook: never drink, pee a lot. Picture: a leaky boat bailing water nonstop.
- How do saltwater fish osmoregulate?
  - They are less salty than the sea, so they lose water by osmosis.
  - They drink seawater constantly, pump extra salt out through their gills (active transport), and make a little concentrated urine.
  - Hook: drink a lot, pee a little, spit salt. Picture: a hiker lost in the desert, chugging water.
**CLASS OSMOREGULATION CHART**
- How do bacteria osmoregulate?
  - Land and water. They actively transport ions with membrane transport proteins to steer osmosis, and the cell wall resists bursting.
- How do paramecia (protists) osmoregulate?
  - Water. They have a high solute concentration inside, so water floods in, and contractile vacuoles pump it out.
- How do plants osmoregulate?
  - Land and water. Transpiration through stomata, the central vacuole, and the roots.
- How do humans osmoregulate?
  - Land. Kidneys plus the hormone ADH; wastes leave as urine and sweat.
- How do reptiles and birds osmoregulate?
  - Reptiles use kidneys, thick skin and salt glands. Birds use kidneys and nasal salt glands. Both excrete uric acid.
- How do fungi osmoregulate?
  - Land. A cell wall plus organic osmolytes, such as glycerol, to match pressures.
- How do sea cucumbers handle osmoregulation?
  - They are osmoconformers: their body fluid matches seawater, and they excrete ammonia.
- How do adult amphibians osmoregulate (not on the class chart)?
  - They absorb water through their skin, use kidneys, and excrete urea.
**NITROGENOUS WASTES**
- Which animals excrete ammonia (NH₃), and what is it like?
  - Aquatic animals and most bony fish. It is highly toxic and very water-soluble, so it needs lots of water to flush out.
- Which animals excrete urea ((NH₂)₂CO), and what is it like?
  - Mammals, amphibians and sharks. It is moderately toxic and moderately soluble.
- Which animals excrete uric acid, and what is it like?
  - Birds, reptiles and insects. It has low toxicity and low solubility, and it leaves as a paste that saves water.
- Hook (nitrogenous wastes): A, U, U, the farther from water, the less toxic and the drier the waste. Picture: a fish in a lake (ammonia), a person at a toilet (urea), white bird droppings on a car (uric acid).
- Why do land animals make urea or uric acid instead of ammonia?
  - Ammonia costs no energy to make but needs lots of water. Urea and uric acid cost energy to make but save water.

## The labs: potato cores and dialysis tubing
**INVESTIGATION 3: POTATO CORES**
- What was the objective of Investigation 3?
  - Find the sucrose concentration inside a potato.
- How was the potato core lab set up?
  - Potato cores sat in 0.0, 0.2, 0.4, 0.6, 0.8 and 1.0 M sucrose. Each core was blotted and weighed before and after.
- % change in mass = (final − initial) ÷ initial × 100
- What results do you expect from the potato cores?
  - They gain mass in low-molarity (hypotonic) solutions and lose mass in high-molarity (hypertonic) ones.
- How do you analyze the potato lab's class data?
  - Graph % change (y) against molarity (x), add a best-fit line (trendline), and read the x-intercept as the iso-osmolar molarity. Then use Ψₛ = −iCRT.
- What format does the lab hypothesis use?
  - An "If … then …" statement.
**DIALYSIS TUBING (STARCH AND IODINE)**
- ![Dialysis bag: iodine gets in, starch can't get out](fig:bio-dialysis)
- Dialysis tubing: a semipermeable membrane that sorts molecules by size (molecular weight cut-off); water, ions, iodine and glucose pass through, while starch, proteins and DNA are too big
- What was set up in the dialysis activity?
  - Starch solution inside the bag, and iodine (Lugol's solution) in the beaker. Iodine turns blue-black when it touches starch.
- What happened in the dialysis activity, and why?
  - Iodine diffused in, so the inside turned blue-black. Starch couldn't get out, so the beaker stayed amber-brown.
  - Glucose inside the bag would diffuse out, and glucose test strips would show it.
- In the dialysis activity, where did the color change happen, and how do you know?
  - Inside the bag, because that is where the liquid turned blue-black.
- In the dialysis activity, did the starch go through the polymer, and how do you know?
  - No. The liquid in the beaker never turned purple.
- In the dialysis activity, is the polymer completely solid, and how do you know?
  - No. It has pores, because iodine got through.
- If the starch-filled dialysis bag gains mass, what moved, and why?
  - Water moved in, because the starch lowered the bag's Ψ.
- Hook (dialysis): a reverse tea bag. Picture: the leaves (starch) stay trapped, but the color flows into the bag instead of out.

## Beyond the slides
- Note: AP topics 2.6–2.9 test these often, even though the decks only hint at them.
**COTRANSPORT**
- What is a proton pump?
  - A pump (H⁺-ATPase) in plants, fungi and bacteria that uses ATP to push H⁺ out of the cell.
- Cotransport: transport in which a protein lets one ion flow back down its gradient and uses that flow to drag another molecule against its gradient (secondary active transport)
- How does the sucrose-H⁺ cotransporter work?
  - The proton pump uses ATP to build up H⁺ outside. H⁺ flows back in through the cotransporter and pulls sucrose in against its gradient.
  - ATP builds the gradient, and the gradient does the work.
- Animals do the same with Na⁺. The Na⁺/K⁺ pump builds a Na⁺ gradient, and Na⁺ flowing back in pulls glucose into intestine and kidney cells.
- Hook (cotransport): riding the gradient. Picture: an elevator counterweight; H⁺ drops down the shaft and pulls the sucrose car up.
**MEMBRANE POTENTIAL AND CHANNELS**
- What is an electrochemical gradient?
  - The combined push from an ion's concentration gradient and the charge difference across the membrane.
- Membrane potential: the voltage across a membrane; the inside is negative at rest (about −70 mV in neurons)
- What opens a voltage-gated, a ligand-gated and a mechanically gated channel?
  - Voltage-gated: a change in membrane voltage, like the Na⁺ and K⁺ channels in an action potential.
  - Ligand-gated: a chemical binding to it, like a neurotransmitter receptor.
  - Mechanically gated: touch or stretch.
**SELECTIVE PERMEABILITY (FRQ LANGUAGE)**
- What is the phospholipid bilayer?
  - Two layers of phospholipids, with hydrophilic heads facing the water and hydrophobic tails hidden in the middle.
- Why is the membrane selectively permeable?
  - Its hydrophobic core lets small nonpolar molecules dissolve straight through but blocks ions and large polar molecules, which need channel or carrier proteins.
- Why does a cell need a selectively permeable membrane?
  - To keep its inside different from the outside (homeostasis): it takes in what it needs, keeps what it has made, and removes wastes.
**SURFACE AREA AND VOLUME**
- Why do cells stay small?
  - Smaller cells have a higher surface area to volume ratio, so they exchange materials faster. As a cell grows, its volume (cubed) outgrows its surface area (squared).
**WATER POTENTIAL IN A WHOLE PLANT**
- What path does water take through a plant, from the highest Ψ to the lowest?
  - Soil → root → stem → leaf → air
- Water moves up a plant down a Ψ gradient. Air has the lowest Ψ, so evaporation from the leaves (transpiration) pulls water up, and this is where negative pressure (tension) shows up.
**TONICITY FINE PRINT**
- Only solutes that can't cross the membrane set tonicity. A solute that crosses, like urea, eventually evens out and stops pulling water.
**COMPARTMENTALIZATION (AP 2.10–2.11)**
- Compartmentalization: dividing a cell with internal membranes, which keeps incompatible reactions apart and adds surface area for reactions, like the folded inner membrane of a mitochondrion
- Endosymbiotic theory: the idea that mitochondria and chloroplasts were once free-living prokaryotes; the evidence is a double membrane, their own circular DNA, their own ribosomes, and division by binary fission

## Memory hooks: name the concept
- Tip: these cards flip the hooks around. Read the hook, then name the concept and the fact it unlocks.
- Which formula does "Melting Ice Cream Ruins T-shirts" unlock?
  - Ψₛ = −iCRT: Minus, i (ionization constant), C (molarity), R (0.0831), T (Kelvin).
- What does "8/31, the end of summer" stand for?
  - R = 0.0831 L·bar/(mol·K), the pressure constant in Ψₛ = −iCRT.
- What does "count the pieces" stand for?
  - The ionization constant i: sucrose 1, NaCl 2, CaCl₂ 3.
- What does "one Mega bar = ten candy bars" stand for?
  - 1 MPa = 10 bars.
- What does "water flows downhill" stand for?
  - Water moves from higher Ψ to lower Ψ.
- What does "Ψ is a bank balance" stand for?
  - The number closer to zero is the higher Ψ (−2 beats −5), and water flows toward the more negative side.
- What does "water follows solute" stand for?
  - Osmosis: water moves toward the side with more solute.
- What does "hyp-O swells into an O, then pOps" stand for?
  - A hypotonic solution: water enters, so an animal cell swells and may burst (lysis).
- What does "a hyper sponge" stand for?
  - A hypertonic solution pulls water out: animal cells crenate and plant cells plasmolyze.
- What does "Turgid = Tight, Flaccid = Floppy" stand for?
  - Plant cells are turgid in a hypotonic solution (healthy) and flaccid in an isotonic one.
- What does "HOT, BIG, STEEP, SMALL, SHORT, GAS" stand for?
  - What speeds up diffusion: higher temperature, more surface area, a steeper gradient, smaller particles, a shorter distance, and gas as the medium.
- What does "SNP and SUP slip through" stand for?
  - Simple diffusion: small nonpolar and small uncharged polar molecules cross the bilayer with no protein.
- What does "3 salty sailors out, 2 kings in" stand for?
  - The Na⁺/K⁺ pump: 3 Na⁺ out and 2 K⁺ in, one ATP per cycle.
- What does "Sodium Storms in, Potassium Packs out" stand for?
  - Depolarization (Na⁺ rushes in), then repolarization (K⁺ flows out); the pump then cleans up.
- What does "Calcium Calls the vesicles" stand for?
  - Neurotransmitter release: Ca²⁺ enters the axon terminal and makes the vesicles fuse for exocytosis.
- What does "ENDO = ENter, EXO = EXit" stand for?
  - Endocytosis brings material into the cell and exocytosis sends it out. Both use vesicles and ATP.
- What does "a VIP list" stand for?
  - Receptor-mediated endocytosis: only molecules that bind specific receptors get in.
- What does "Regulator = Resists, Conformer = Copies" stand for?
  - Osmoregulators spend energy holding their internal concentration steady; osmoconformers match the environment.
- What does "never drink, pee a lot" stand for?
  - Freshwater fish: water floods in, so they make lots of dilute urine and take up salt through their gills.
- What does "drink a lot, pee a little, spit salt" stand for?
  - Saltwater fish: they lose water, so they drink seawater and pump the extra salt out through their gills.
- What does "a bilge pump" stand for?
  - The contractile vacuole, which pumps extra water out of freshwater protists.
- What does "A, U, U: the farther from water, the drier the waste" stand for?
  - Nitrogenous wastes: ammonia (aquatic animals), urea (mammals), uric acid (birds, reptiles, insects).
- What does "a reverse tea bag" stand for?
  - The dialysis bag: iodine gets in and turns the starch blue-black, but starch can't get out.
- What does "the break-even point" stand for?
  - The x-intercept of the potato lab graph, the iso-osmolar molarity used as C in Ψₛ = −iCRT.

## Multiple choice: every choice explained
- Tip: say your pick out loud, then read why each wrong choice is wrong.
**WHICH MODE OF TRANSPORT? (SLIDE REVIEW)**
- Which mode of transport moves H₂O: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (D) both A and B. Water slips through small gaps in the bilayer (simple) and through aquaporins (facilitated).
  - Not (A) or (B) alone: each one leaves out one of water's two routes.
  - Not (C): water moves by osmosis, down its gradient, with no ATP.
- Which mode of transport moves glucose (C₆H₁₂O₆): (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (B) facilitated diffusion. Glucose is too large and polar for the bilayer, so it rides a carrier protein.
  - Not (A) or (D): glucose can't slip through the bilayer on its own.
  - Not (C): here it moves down its gradient, so no ATP is needed. (Cotransport into gut cells is the active exception.)
- Which mode of transport moves O₂: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (A) simple diffusion. O₂ is small and nonpolar, so it passes straight through the bilayer.
  - Not (B) or (D): it needs no protein.
  - Not (C): it moves down its gradient with no ATP.
- Which mode of transport uses channels: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (B) facilitated diffusion. A channel is an embedded protein that lets ions or water flow down their gradient.
  - Not (A): simple diffusion uses no protein.
  - Not (C): channels never spend ATP.
  - Not (D): nothing in a channel is simple diffusion.
- Which mode of transport uses pumps: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (C) active transport. A pump spends ATP to move ions against their gradient.
  - Not (A), (B) or (D): those are all passive and never use ATP.
- Which mode of transport moves K⁺ and Na⁺ in the slide review: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (C) active transport, in the class key: the Na⁺/K⁺ pump moves them against their gradients with ATP.
  - (B) is also true when they leak through channels down their gradients, as in an action potential, so read the question's context.
  - Not (A) or (D): ions are charged and can't cross the bilayer on their own.
- Which mode of transport uses aquaporins: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (B) facilitated diffusion. An aquaporin is a channel protein for water, and it uses no ATP.
  - Not (A): an aquaporin is a protein, so it is not simple diffusion.
  - Not (C): no ATP is used.
  - Not (D): the question names only the protein route.
- Which mode of transport is endocytosis: (A) simple diffusion, (B) facilitated diffusion, (C) active transport, or (D) both A and B?
  - (C) active transport. The membrane folds in to form a vesicle, which takes ATP.
  - Not (A), (B) or (D): moving bulk material in vesicles is never passive.
**WATER POTENTIAL AND TONICITY**
- A cell with Ψ = −0.5 MPa sits in a solution with Ψ = −0.8 MPa. Which way does water move: (A) into the cell, (B) out of the cell, (C) no net movement, or (D) it depends on the temperature?
  - (B) out of the cell. −0.5 is higher than −0.8, and water moves from higher Ψ to lower Ψ.
  - Not (A): that would mean moving from lower Ψ to higher Ψ.
  - Not (C): the two values are different.
  - Not (D): temperature is already built into each Ψ (T is in Ψₛ = −iCRT), so the given values decide it.
- At 25°C, which solution has the lowest Ψ: (A) 0.2 M sucrose, (B) 0.1 M NaCl, (C) 0.15 M glucose, or (D) 0.1 M CaCl₂?
  - (D) 0.1 M CaCl₂. Its i × C = 3 × 0.1 = 0.3, the largest, so its Ψₛ is the most negative.
  - Not (A): i × C = 1 × 0.2 = 0.2.
  - Not (B): i × C = 2 × 0.1 = 0.2.
  - Not (C): i × C = 1 × 0.15 = 0.15, which gives the highest Ψ of the four.
- Red blood cells are placed in distilled water. What happens: (A) they crenate, (B) they swell and may burst, (C) they stay the same, or (D) they plasmolyze?
  - (B) they swell and may burst (lysis). Distilled water is hypotonic, so water rushes in.
  - Not (A): crenation happens in a hypertonic solution.
  - Not (C): only an isotonic solution keeps them the same.
  - Not (D): plasmolysis needs a cell wall, and red blood cells have none.
- A plant cell is placed in a strong salt solution. What happens: (A) lysis, (B) it becomes turgid, (C) plasmolysis, or (D) no change?
  - (C) plasmolysis. The salt solution is hypertonic, so water leaves and the membrane pulls away from the wall.
  - Not (A): water is leaving, not entering, and the wall would stop bursting anyway.
  - Not (B): a cell turns turgid when it gains water in a hypotonic solution.
  - Not (D): the Ψ values differ, so water moves.
- In the potato lab, the best-fit line crosses 0% mass change at 0.3 M sucrose. What does that mean: (A) the potato has no sucrose, (B) the potato is iso-osmolar with about 0.3 M sucrose, (C) the cores gained the most mass at 0.3 M, or (D) the potato's Ψ is 0?
  - (B) the potato is iso-osmolar with about 0.3 M sucrose: at that molarity no net water moves.
  - Not (A): a potato with no solute would lose mass in every sucrose solution.
  - Not (C): the cores gain the most mass in pure water (0 M).
  - Not (D): the potato's Ψ is negative, Ψₛ = −iCRT with C = 0.3 M.
- What does adding solute do to a solution's water potential: (A) raises it, (B) lowers it, (C) no change, or (D) makes Ψₚ negative?
  - (B) lowers it. More solute makes Ψₛ more negative, and Ψ = Ψₚ + Ψₛ.
  - Not (A) or (C): solute always pulls Ψ down.
  - Not (D): solute changes Ψₛ, not the pressure term Ψₚ.
**PUMPS, NEURONS AND BULK TRANSPORT**
- What does the Na⁺/K⁺ pump move each cycle: (A) 3 Na⁺ in and 2 K⁺ out, (B) 3 Na⁺ out and 2 K⁺ in, (C) 2 Na⁺ out and 3 K⁺ in, or (D) Na⁺ and K⁺ down their gradients?
  - (B) 3 Na⁺ out and 2 K⁺ in, using one ATP.
  - Not (A): the directions are reversed.
  - Not (C): the numbers are swapped.
  - Not (D): a pump moves ions against their gradients.
- What happens during depolarization: (A) K⁺ flows out, (B) Na⁺ rushes in, (C) the pump moves 3 Na⁺ out, or (D) Ca²⁺ leaves the axon?
  - (B) Na⁺ rushes in, and the inside of the neuron turns positive.
  - Not (A): K⁺ flowing out is repolarization.
  - Not (C): the pump restores the gradients afterward.
  - Not (D): Ca²⁺ flows into the axon terminal, where it triggers neurotransmitter release.
- What makes neurotransmitter vesicles fuse with the membrane: (A) K⁺ leaving the neuron, (B) Na⁺ being pumped out, (C) Ca²⁺ entering the axon terminal, or (D) ATP made in the synaptic cleft?
  - (C) Ca²⁺ entering the axon terminal through gated channels.
  - Not (A) or (B): those reset the membrane potential.
  - Not (D): ATP is made by mitochondria inside the neuron, not in the cleft.
- Which process takes in only molecules that bind specific receptors: (A) phagocytosis, (B) pinocytosis, (C) receptor-mediated endocytosis, or (D) exocytosis?
  - (C) receptor-mediated endocytosis.
  - Not (A): phagocytosis engulfs large particles such as bacteria.
  - Not (B): pinocytosis gulps fluid without choosing what is in it.
  - Not (D): exocytosis sends material out of the cell.
**OSMOREGULATION**
- How do saltwater fish osmoregulate: (A) drink little and make lots of dilute urine, (B) drink seawater, pump salt out through the gills and make a little concentrated urine, (C) match seawater as osmoconformers, or (D) absorb extra salt through the gills?
  - (B) They lose water to the salty sea, so they drink it and pump out the extra salt.
  - Not (A): that describes freshwater fish.
  - Not (C): bony fish are osmoregulators; osmoconformers are invertebrates such as sea cucumbers.
  - Not (D): saltwater fish already take in too much salt.
- Why do freshwater fish excrete ammonia instead of converting it to urea: (A) fish metabolism doesn't use nitrogen, (B) diluting ammonia by excreting it straight into freshwater conserves energy, (C) ammonia is stored in tissues before excretion, or (D) the nitrogen is recycled into proteins and nucleotides?
  - (B) Making urea costs energy, and fish are surrounded by water that dilutes ammonia for free.
  - Not (A): all animals make nitrogen waste when they break down proteins.
  - Not (C): ammonia is toxic, so it is not stored.
  - Not (D): the question is about waste that is excreted, not recycled.
- Paramecia are moved from freshwater into saltier water. What happens to their contractile vacuoles: (A) they pump faster, (B) they pump out less fluid, (C) they stop and the cell bursts, or (D) no change?
  - (B) they pump out less fluid. Saltier water has a lower Ψ, closer to the cell's, so less water enters.
  - Not (A): they pump fastest in freshwater, where the most water enters.
  - Not (C): bursting is a risk only when lots of water enters.
  - Not (D): the FRQ data show the output falling from 1.3 to 0.05 picoliters per minute.
  - ![FRQ data: contractile vacuole output falls as salinity rises](fig:bio-paramecium)

## Quick self-test
**FRQ: SELECTIVE PERMEABILITY**
- Membrane FRQ (a): Why must a cell be surrounded by a selectively permeable membrane?
  - It keeps internal conditions different from the outside (homeostasis): it controls what enters (nutrients) and leaves (wastes) and keeps needed molecules in.
- Membrane FRQ (b): How does the figure show the membrane is selectively permeable to specific ions?
  - The ions can't cross the bilayer itself. Only the specific ions that fit the membrane channel pass through it, and the others stay on one side.
- Membrane FRQ (c): What lets small hydrophobic molecules pass directly through the bilayer?
  - The bilayer's interior is made of nonpolar, hydrophobic fatty-acid tails, so small nonpolar molecules dissolve through it with no protein.
- Membrane FRQ (d): Do the molecules crossing the membrane in the figure need energy?
  - No. Both move from high concentration (top) to low concentration (bottom), down their gradients: simple diffusion for the lipid-soluble molecules and facilitated diffusion through the channel for the ions.
**FRQ: PARAMECIUM CONTRACTILE VACUOLES**
- Paramecium FRQ (a): How do phospholipids control what crosses, and what happens to an animal cell in a low-Ψ environment?
  - The hydrophobic core blocks large and polar molecules, so they need transport proteins.
  - In a low-Ψ (high-solute) environment, water leaves the animal cell by osmosis and the cell shrinks.
- Paramecium FRQ (b): How should the graph of Table 1 be set up?
  - x-axis: salinity (milliosmoles/kg). y-axis: average fluid output of the contractile vacuole (picoliters/min).
  - Plot (10, 1.3), (250, 0.25), (750, 0.1) and (1000, 0.05), connect the points, and add a title.
- Paramecium FRQ (c): How does salinity affect the fluid ejected, and what is Ψ if Ψₛ = −2 and Ψₚ = 0?
  - Higher salinity means less fluid ejected each time, because less water enters the cell.
  - Ψ = Ψₚ + Ψₛ = 0 + (−2) = −2 bars
**NEURONS**
- What are the three stages of a neuron firing, and what moves in each?
  - Polarization (resting): the pump keeps Na⁺ out and K⁺ in, and the inside is negative.
  - Depolarization: Na⁺ rushes in, and the inside turns positive.
  - Repolarization: K⁺ flows out, and then the pump restores the gradients.
- What is the charge outside and inside a neuron at resting potential?
  - Outside positive (mostly Na⁺), inside negative.
- What disrupts the resting potential, and what is that called?
  - A stimulus that lets Na⁺ rush in. It is called depolarization, or an action potential.
- What types of transport do neurons use?
  - Both: passive (leak channels, Na⁺ in, K⁺ out) and active (the Na⁺/K⁺ pump, exocytosis, endocytosis).
**QUICK FIRE**
- Which Ψ is higher, −3.1 bars or −2.9 bars?
  - −2.9 bars, because it is closer to zero.
- If you warm a sugar solution, what happens to its Ψₛ?
  - It becomes more negative, because T gets bigger in −iCRT.
- A cell has Ψ = −0.6 MPa and the solution around it has Ψ = −0.4 MPa. Which way does water move?
  - Into the cell, from the solution's higher Ψ (−0.4) to the cell's lower Ψ (−0.6).
- Why can't you compare 0.2 M NaCl and 0.3 M glucose by molarity alone?
  - NaCl splits into 2 particles, so compare i × C: 0.4 for NaCl vs. 0.3 for glucose. The NaCl has the lower Ψ.`,
        figures: {"bio-transport-tree":{"w":680,"h":404,"bg":"plain","graph":"","items":[{"t":"rect","x":16,"y":160,"w":116,"h":60,"c":"black","sw":2},{"t":"text","x":56,"y":186,"s":"Cell","c":"black","size":17},{"t":"text","x":33.5,"y":206,"s":"transport","c":"black","size":17},{"t":"rect","x":170,"y":60,"w":140,"h":76,"c":"blue","sw":2.5,"fill":"blue"},{"t":"text","x":202.9,"y":89,"s":"Passive","c":"blue","size":20},{"t":"text","x":202.9,"y":109,"s":"high → low","c":"black","size":14},{"t":"text","x":217.7,"y":127,"s":"no ATP","c":"black","size":14},{"t":"rect","x":170,"y":244,"w":140,"h":76,"c":"red","sw":2.5,"fill":"red"},{"t":"text","x":208.2,"y":273,"s":"Active","c":"red","size":20},{"t":"text","x":202.9,"y":293,"s":"low → high","c":"black","size":14},{"t":"text","x":191.8,"y":311,"s":"ATP + protein","c":"black","size":14},{"t":"line","x1":132,"y1":190,"x2":150,"y2":190,"c":"gray","sw":2},{"t":"line","x1":150,"y1":98,"x2":150,"y2":282,"c":"gray","sw":2},{"t":"line","x1":150,"y1":98,"x2":168,"y2":98,"c":"gray","sw":2,"arrow":1},{"t":"line","x1":150,"y1":282,"x2":168,"y2":282,"c":"gray","sw":2,"arrow":1},{"t":"line","x1":310,"y1":98,"x2":332,"y2":98,"c":"gray","sw":2},{"t":"line","x1":332,"y1":38,"x2":332,"y2":158,"c":"gray","sw":2},{"t":"line","x1":310,"y1":282,"x2":332,"y2":282,"c":"gray","sw":2},{"t":"line","x1":332,"y1":246,"x2":332,"y2":366,"c":"gray","sw":2},{"t":"rect","x":356,"y":14,"w":300,"h":48,"c":"blue","sw":1.5},{"t":"text","x":368,"y":35,"s":"Simple diffusion","c":"blue","size":16},{"t":"text","x":368,"y":54,"s":"O₂, CO₂, N₂ slip through the bilayer","c":"gray","size":13},{"t":"line","x1":332,"y1":38,"x2":354,"y2":38,"c":"gray","sw":2,"arrow":1},{"t":"rect","x":356,"y":74,"w":300,"h":48,"c":"blue","sw":1.5},{"t":"text","x":368,"y":95,"s":"Facilitated diffusion","c":"blue","size":16},{"t":"text","x":368,"y":114,"s":"glucose and ions: channel or carrier","c":"gray","size":13},{"t":"line","x1":332,"y1":98,"x2":354,"y2":98,"c":"gray","sw":2,"arrow":1},{"t":"rect","x":356,"y":134,"w":300,"h":48,"c":"blue","sw":1.5},{"t":"text","x":368,"y":155,"s":"Osmosis","c":"blue","size":16},{"t":"text","x":368,"y":174,"s":"water, through gaps or aquaporins","c":"gray","size":13},{"t":"line","x1":332,"y1":158,"x2":354,"y2":158,"c":"gray","sw":2,"arrow":1},{"t":"rect","x":356,"y":222,"w":300,"h":48,"c":"red","sw":1.5},{"t":"text","x":368,"y":243,"s":"Na⁺/K⁺ pump","c":"red","size":16},{"t":"text","x":368,"y":262,"s":"3 Na⁺ out, 2 K⁺ in, one ATP","c":"gray","size":13},{"t":"line","x1":332,"y1":246,"x2":354,"y2":246,"c":"gray","sw":2,"arrow":1},{"t":"rect","x":356,"y":282,"w":300,"h":48,"c":"red","sw":1.5},{"t":"text","x":368,"y":303,"s":"Endocytosis","c":"red","size":16},{"t":"text","x":368,"y":322,"s":"phago-, pino-, receptor-mediated: IN","c":"gray","size":13},{"t":"line","x1":332,"y1":306,"x2":354,"y2":306,"c":"gray","sw":2,"arrow":1},{"t":"rect","x":356,"y":342,"w":300,"h":48,"c":"red","sw":1.5},{"t":"text","x":368,"y":363,"s":"Exocytosis","c":"red","size":16},{"t":"text","x":368,"y":382,"s":"a vesicle fuses: neurotransmitters OUT","c":"gray","size":13},{"t":"line","x1":332,"y1":366,"x2":354,"y2":366,"c":"gray","sw":2,"arrow":1}]},"bio-membrane":{"w":760,"h":444,"bg":"plain","graph":"","items":[{"t":"ellipse","cx":26,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":24,"y1":195,"x2":24,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":28,"y1":195,"x2":28,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":26,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":24,"y1":224,"x2":24,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":28,"y1":224,"x2":28,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":40,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":38,"y1":195,"x2":38,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":42,"y1":195,"x2":42,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":40,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":38,"y1":224,"x2":38,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":42,"y1":224,"x2":42,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":54,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":52,"y1":195,"x2":52,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":56,"y1":195,"x2":56,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":54,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":52,"y1":224,"x2":52,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":56,"y1":224,"x2":56,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":68,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":66,"y1":195,"x2":66,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":70,"y1":195,"x2":70,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":68,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":66,"y1":224,"x2":66,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":70,"y1":224,"x2":70,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":82,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":80,"y1":195,"x2":80,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":84,"y1":195,"x2":84,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":82,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":80,"y1":224,"x2":80,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":84,"y1":224,"x2":84,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":96,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":94,"y1":195,"x2":94,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":98,"y1":195,"x2":98,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":96,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":94,"y1":224,"x2":94,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":98,"y1":224,"x2":98,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":110,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":108,"y1":195,"x2":108,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":112,"y1":195,"x2":112,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":110,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":108,"y1":224,"x2":108,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":112,"y1":224,"x2":112,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":124,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":122,"y1":195,"x2":122,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":126,"y1":195,"x2":126,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":124,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":122,"y1":224,"x2":122,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":126,"y1":224,"x2":126,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":138,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":136,"y1":195,"x2":136,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":140,"y1":195,"x2":140,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":138,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":136,"y1":224,"x2":136,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":140,"y1":224,"x2":140,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":152,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":150,"y1":195,"x2":150,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":154,"y1":195,"x2":154,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":152,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":150,"y1":224,"x2":150,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":154,"y1":224,"x2":154,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":166,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":164,"y1":195,"x2":164,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":168,"y1":195,"x2":168,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":166,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":164,"y1":224,"x2":164,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":168,"y1":224,"x2":168,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":180,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":178,"y1":195,"x2":178,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":182,"y1":195,"x2":182,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":180,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":178,"y1":224,"x2":178,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":182,"y1":224,"x2":182,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":194,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":192,"y1":195,"x2":192,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":196,"y1":195,"x2":196,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":194,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":192,"y1":224,"x2":192,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":196,"y1":224,"x2":196,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":208,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":206,"y1":195,"x2":206,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":210,"y1":195,"x2":210,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":208,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":206,"y1":224,"x2":206,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":210,"y1":224,"x2":210,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":292,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":290,"y1":195,"x2":290,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":294,"y1":195,"x2":294,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":292,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":290,"y1":224,"x2":290,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":294,"y1":224,"x2":294,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":306,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":304,"y1":195,"x2":304,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":308,"y1":195,"x2":308,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":306,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":304,"y1":224,"x2":304,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":308,"y1":224,"x2":308,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":320,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":318,"y1":195,"x2":318,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":322,"y1":195,"x2":322,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":320,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":318,"y1":224,"x2":318,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":322,"y1":224,"x2":322,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":334,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":332,"y1":195,"x2":332,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":336,"y1":195,"x2":336,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":334,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":332,"y1":224,"x2":332,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":336,"y1":224,"x2":336,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":348,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":346,"y1":195,"x2":346,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":350,"y1":195,"x2":350,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":348,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":346,"y1":224,"x2":346,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":350,"y1":224,"x2":350,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":446,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":444,"y1":195,"x2":444,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":448,"y1":195,"x2":448,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":446,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":444,"y1":224,"x2":444,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":448,"y1":224,"x2":448,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":460,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":458,"y1":195,"x2":458,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":462,"y1":195,"x2":462,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":460,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":458,"y1":224,"x2":458,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":462,"y1":224,"x2":462,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":474,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":472,"y1":195,"x2":472,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":476,"y1":195,"x2":476,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":474,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":472,"y1":224,"x2":472,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":476,"y1":224,"x2":476,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":488,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":486,"y1":195,"x2":486,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":490,"y1":195,"x2":490,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":488,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":486,"y1":224,"x2":486,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":490,"y1":224,"x2":490,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":502,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":500,"y1":195,"x2":500,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":504,"y1":195,"x2":504,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":502,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":500,"y1":224,"x2":500,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":504,"y1":224,"x2":504,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":516,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":514,"y1":195,"x2":514,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":518,"y1":195,"x2":518,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":516,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":514,"y1":224,"x2":514,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":518,"y1":224,"x2":518,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":586,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":584,"y1":195,"x2":584,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":588,"y1":195,"x2":588,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":586,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":584,"y1":224,"x2":584,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":588,"y1":224,"x2":588,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":600,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":598,"y1":195,"x2":598,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":602,"y1":195,"x2":602,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":600,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":598,"y1":224,"x2":598,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":602,"y1":224,"x2":602,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":614,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":612,"y1":195,"x2":612,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":616,"y1":195,"x2":616,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":614,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":612,"y1":224,"x2":612,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":616,"y1":224,"x2":616,"y2":241,"c":"brown","sw":1.2},{"t":"ellipse","cx":628,"cy":188,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":626,"y1":195,"x2":626,"y2":212,"c":"brown","sw":1.2},{"t":"line","x1":630,"y1":195,"x2":630,"y2":212,"c":"brown","sw":1.2},{"t":"ellipse","cx":628,"cy":248,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":626,"y1":224,"x2":626,"y2":241,"c":"brown","sw":1.2},{"t":"line","x1":630,"y1":224,"x2":630,"y2":241,"c":"brown","sw":1.2},{"t":"text","x":16,"y":160,"s":"outside","c":"gray","size":14},{"t":"text","x":16,"y":290,"s":"inside","c":"gray","size":14},{"t":"text","x":184.9,"y":24,"s":"PASSIVE: down the gradient, no ATP","c":"blue","size":15},{"t":"line","x1":40,"y1":34,"x2":600,"y2":34,"c":"blue","sw":2},{"t":"line","x1":40,"y1":34,"x2":40,"y2":44,"c":"blue","sw":2},{"t":"line","x1":600,"y1":34,"x2":600,"y2":44,"c":"blue","sw":2},{"t":"text","x":642.3,"y":24,"s":"ACTIVE: ATP","c":"red","size":15},{"t":"line","x1":632,"y1":34,"x2":742,"y2":34,"c":"red","sw":2},{"t":"line","x1":632,"y1":34,"x2":632,"y2":44,"c":"red","sw":2},{"t":"line","x1":742,"y1":34,"x2":742,"y2":44,"c":"red","sw":2},{"t":"ellipse","cx":70,"cy":92,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":96,"cy":74,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":126,"cy":98,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":80,"cy":128,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":134,"cy":136,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":112,"cy":150,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":150,"cy":160,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":84,"cy":306,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"ellipse","cx":126,"cy":318,"rx":5,"ry":5,"c":"red","sw":1.5,"fill":"red"},{"t":"line","x1":100,"y1":104,"x2":100,"y2":330,"c":"red","sw":2.5,"arrow":1},{"t":"text","x":36.4,"y":370,"s":"Simple diffusion","c":"black","size":15},{"t":"text","x":34.5,"y":389,"s":"O₂, CO₂: no protein","c":"gray","size":13},{"t":"rect","x":222,"y":164,"w":22,"h":108,"c":"teal","sw":2,"fill":"teal"},{"t":"rect","x":256,"y":164,"w":22,"h":108,"c":"teal","sw":2,"fill":"teal"},{"t":"ellipse","cx":226,"cy":96,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":252,"cy":78,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":282,"cy":104,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":236,"cy":132,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":270,"cy":142,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":240,"cy":318,"rx":5,"ry":5,"c":"orange","sw":1.5,"fill":"orange"},{"t":"line","x1":250,"y1":112,"x2":250,"y2":330,"c":"orange","sw":2.5,"arrow":1},{"t":"text","x":222.2,"y":370,"s":"Channel","c":"black","size":15},{"t":"text","x":194.9,"y":389,"s":"ions such as Na⁺","c":"gray","size":13},{"t":"ellipse","cx":400,"cy":218,"rx":34,"ry":52,"c":"purple","sw":2,"fill":"purple"},{"t":"pen","pts":[[384,92],[380,98.9],[372,98.9],[368,92],[372,85.1],[380,85.1],[384,92]],"c":"green","sw":2},{"t":"pen","pts":[[428,80],[424,86.9],[416,86.9],[412,80],[416,73.1],[424,73.1],[428,80]],"c":"green","sw":2},{"t":"pen","pts":[[410,120],[406,126.9],[398,126.9],[394,120],[398,113.1],[406,113.1],[410,120]],"c":"green","sw":2},{"t":"pen","pts":[[440,140],[436,146.9],[428,146.9],[424,140],[428,133.1],[436,133.1],[440,140]],"c":"green","sw":2},{"t":"pen","pts":[[380,146],[376,152.9],[368,152.9],[364,146],[368,139.1],[376,139.1],[380,146]],"c":"green","sw":2},{"t":"pen","pts":[[424,316],[420,322.9],[412,322.9],[408,316],[412,309.1],[420,309.1],[424,316]],"c":"green","sw":2},{"t":"line","x1":400,"y1":132,"x2":400,"y2":330,"c":"purple","sw":2.5,"arrow":1},{"t":"text","x":372.2,"y":370,"s":"Carrier","c":"black","size":15},{"t":"text","x":313.9,"y":389,"s":"glucose; it changes shape","c":"gray","size":13},{"t":"rect","x":528,"y":164,"w":18,"h":108,"c":"blue","sw":2,"fill":"blue"},{"t":"rect","x":554,"y":164,"w":18,"h":108,"c":"blue","sw":2,"fill":"blue"},{"t":"ellipse","cx":530,"cy":90,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":556,"cy":76,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":578,"cy":104,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":540,"cy":128,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":568,"cy":146,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":560,"cy":314,"rx":4,"ry":4,"c":"blue","sw":1.5,"fill":"blue"},{"t":"line","x1":550,"y1":110,"x2":550,"y2":330,"c":"blue","sw":2.5,"arrow":1},{"t":"text","x":514.2,"y":370,"s":"Aquaporin","c":"black","size":15},{"t":"text","x":515.6,"y":389,"s":"water only","c":"gray","size":13},{"t":"rect","x":650,"y":160,"w":62,"h":118,"c":"gold","sw":2.5,"fill":"gold"},{"t":"line","x1":664,"y1":336,"x2":664,"y2":92,"c":"orange","sw":3,"arrow":1},{"t":"text","x":626,"y":86,"s":"Na⁺","c":"orange","size":15},{"t":"line","x1":698,"y1":92,"x2":698,"y2":336,"c":"teal","sw":3,"arrow":1},{"t":"text","x":704,"y":112,"s":"K⁺","c":"teal","size":15},{"t":"ellipse","cx":734,"cy":300,"rx":22,"ry":13,"c":"gold","sw":1.5,"fill":"gold"},{"t":"text","x":721,"y":305,"s":"ATP","c":"black","size":12},{"t":"text","x":642.3,"y":370,"s":"Na⁺/K⁺ pump","c":"black","size":15},{"t":"text","x":624,"y":389,"s":"3 Na⁺ out, 2 K⁺ in","c":"gray","size":13},{"t":"text","x":658.4,"y":406,"s":"uses ATP","c":"gray","size":13},{"t":"text","x":16,"y":430,"s":"More dots on one side = higher concentration. Passive arrows run from many dots to few.","c":"gray","size":13}]},"bio-tonicity":{"w":760,"h":474,"bg":"plain","graph":"","items":[{"t":"text","x":207.1,"y":40,"s":"Hypotonic","c":"black","size":18},{"t":"text","x":184.5,"y":60,"s":"less solute outside","c":"gray","size":13},{"t":"text","x":401.8,"y":40,"s":"Isotonic","c":"black","size":18},{"t":"text","x":398.7,"y":60,"s":"equal solute","c":"gray","size":13},{"t":"text","x":582.3,"y":40,"s":"Hypertonic","c":"black","size":18},{"t":"text","x":564.5,"y":60,"s":"more solute outside","c":"gray","size":13},{"t":"text","x":20,"y":150,"s":"Animal cell","c":"black","size":16},{"t":"text","x":20,"y":170,"s":"(red blood cell)","c":"gray","size":13},{"t":"text","x":20,"y":186,"s":"no wall","c":"gray","size":13},{"t":"text","x":20,"y":336,"s":"Plant cell","c":"black","size":16},{"t":"text","x":20,"y":356,"s":"has a wall","c":"gray","size":13},{"t":"rect","x":158,"y":76,"w":184,"h":176,"c":"gray","sw":1},{"t":"rect","x":158,"y":262,"w":184,"h":176,"c":"gray","sw":1},{"t":"rect","x":348,"y":76,"w":184,"h":176,"c":"gray","sw":1},{"t":"rect","x":348,"y":262,"w":184,"h":176,"c":"gray","sw":1},{"t":"rect","x":538,"y":76,"w":184,"h":176,"c":"gray","sw":1},{"t":"rect","x":538,"y":262,"w":184,"h":176,"c":"gray","sw":1},{"t":"ellipse","cx":250,"cy":140,"rx":46,"ry":46,"c":"red","sw":2,"fill":"red"},{"t":"line","x1":166,"y1":140,"x2":198,"y2":140,"c":"blue","sw":2.5,"arrow":1},{"t":"line","x1":334,"y1":140,"x2":302,"y2":140,"c":"blue","sw":2.5,"arrow":1},{"t":"ellipse","cx":440,"cy":140,"rx":38,"ry":26,"c":"red","sw":2,"fill":"red"},{"t":"ellipse","cx":440,"cy":140,"rx":15,"ry":8,"c":"red","sw":1.5},{"t":"line","x1":356,"y1":140,"x2":394,"y2":140,"c":"blue","sw":2.5,"arrow":2},{"t":"line","x1":486,"y1":140,"x2":524,"y2":140,"c":"blue","sw":2.5,"arrow":2},{"t":"pen","pts":[[660,140],[650,146.5],[654.3,157.6],[642.3,157],[639.3,168.5],[630,161],[620.7,168.5],[617.7,157],[605.7,157.6],[610,146.5],[600,140],[610,133.5],[605.7,122.4],[617.7,123],[620.7,111.5],[630,119],[639.3,111.5],[642.3,123],[654.3,122.4],[650,133.5],[660,140]],"c":"red","sw":2.5},{"t":"line","x1":596,"y1":140,"x2":546,"y2":140,"c":"blue","sw":2.5,"arrow":1},{"t":"line","x1":664,"y1":140,"x2":714,"y2":140,"c":"blue","sw":2.5,"arrow":1},{"t":"text","x":182.4,"y":216,"s":"Swells, may burst","c":"black","size":15},{"t":"text","x":174.2,"y":234,"s":"lysis: water rushes in","c":"gray","size":13},{"t":"text","x":392.3,"y":216,"s":"Normal shape","c":"black","size":15},{"t":"text","x":371.1,"y":234,"s":"water in = water out","c":"gray","size":13},{"t":"text","x":598.2,"y":216,"s":"Shrivels","c":"black","size":15},{"t":"text","x":550.8,"y":234,"s":"crenation: water leaves","c":"gray","size":13},{"t":"rect","x":204,"y":284,"w":92,"h":92,"c":"green","sw":4},{"t":"rect","x":208,"y":288,"w":84,"h":84,"c":"green","sw":1.5,"fill":"green"},{"t":"ellipse","cx":250,"cy":330,"rx":30,"ry":30,"c":"blue","sw":1.5,"fill":"blue"},{"t":"line","x1":166,"y1":330,"x2":198,"y2":330,"c":"blue","sw":2.5,"arrow":1},{"t":"line","x1":334,"y1":330,"x2":302,"y2":330,"c":"blue","sw":2.5,"arrow":1},{"t":"rect","x":394,"y":284,"w":92,"h":92,"c":"green","sw":4},{"t":"rect","x":398,"y":288,"w":84,"h":84,"c":"green","sw":1.5,"fill":"green"},{"t":"ellipse","cx":440,"cy":330,"rx":15,"ry":15,"c":"blue","sw":1.5,"fill":"blue"},{"t":"line","x1":356,"y1":330,"x2":388,"y2":330,"c":"blue","sw":2.5,"arrow":2},{"t":"line","x1":492,"y1":330,"x2":524,"y2":330,"c":"blue","sw":2.5,"arrow":2},{"t":"rect","x":584,"y":284,"w":92,"h":92,"c":"green","sw":4},{"t":"rect","x":609,"y":309,"w":42,"h":42,"c":"green","sw":1.5,"fill":"green"},{"t":"ellipse","cx":630,"cy":330,"rx":8,"ry":8,"c":"blue","sw":1.5,"fill":"blue"},{"t":"line","x1":578,"y1":330,"x2":546,"y2":330,"c":"blue","sw":2.5,"arrow":1},{"t":"line","x1":682,"y1":330,"x2":714,"y2":330,"c":"blue","sw":2.5,"arrow":1},{"t":"text","x":186.4,"y":404,"s":"Turgid (healthy)","c":"black","size":15},{"t":"text","x":170.8,"y":422,"s":"the wall stops bursting","c":"gray","size":13},{"t":"text","x":384.4,"y":404,"s":"Flaccid (limp)","c":"black","size":15},{"t":"text","x":367.7,"y":422,"s":"no net water movement","c":"gray","size":13},{"t":"text","x":586.3,"y":404,"s":"Plasmolysis","c":"black","size":15},{"t":"text","x":547.3,"y":422,"s":"membrane leaves the wall","c":"gray","size":13},{"t":"text","x":20,"y":462,"s":"Blue arrows show net water movement. Green box = wall, inner box = membrane, blue = vacuole.","c":"gray","size":13}]},"bio-psi-stairs":{"w":760,"h":444,"bg":"plain","graph":"","items":[{"t":"rect","x":96,"y":90,"w":150,"h":72,"c":"gray","sw":1.8},{"t":"text","x":103.4,"y":115,"s":"Turgid plant cell","c":"black","size":15},{"t":"text","x":112.4,"y":135,"s":"Ψₚ > 0 can lift Ψ","c":"gray","size":13},{"t":"text","x":109,"y":153,"s":"above 0, e.g. +0.5","c":"black","size":13},{"t":"rect","x":262,"y":166,"w":150,"h":72,"c":"blue","sw":2.5,"fill":"blue"},{"t":"text","x":297.3,"y":191,"s":"Pure water","c":"black","size":15},{"t":"text","x":299.1,"y":211,"s":"open beaker","c":"gray","size":13},{"t":"text","x":278.4,"y":229,"s":"Ψ = 0 (reference)","c":"black","size":13},{"t":"rect","x":428,"y":242,"w":150,"h":72,"c":"gray","sw":1.8},{"t":"text","x":451.3,"y":267,"s":"0.1 M sucrose","c":"black","size":15},{"t":"text","x":465.1,"y":287,"s":"20°C, i = 1","c":"gray","size":13},{"t":"text","x":454.8,"y":305,"s":"Ψ = −2.43 bars","c":"black","size":13},{"t":"rect","x":594,"y":318,"w":150,"h":72,"c":"gray","sw":1.8},{"t":"text","x":629.3,"y":343,"s":"0.1 M NaCl","c":"black","size":15},{"t":"text","x":631.1,"y":363,"s":"20°C, i = 2","c":"gray","size":13},{"t":"text","x":620.8,"y":381,"s":"Ψ = −4.87 bars","c":"black","size":13},{"t":"line","x1":246,"y1":110,"x2":320,"y2":110,"c":"blue","sw":3},{"t":"line","x1":320,"y1":110,"x2":320,"y2":164,"c":"blue","sw":3,"arrow":1},{"t":"line","x1":412,"y1":186,"x2":486,"y2":186,"c":"blue","sw":3},{"t":"line","x1":486,"y1":186,"x2":486,"y2":240,"c":"blue","sw":3,"arrow":1},{"t":"line","x1":578,"y1":262,"x2":652,"y2":262,"c":"blue","sw":3},{"t":"line","x1":652,"y1":262,"x2":652,"y2":316,"c":"blue","sw":3,"arrow":1},{"t":"text","x":254,"y":102,"s":"water flows","c":"blue","size":13},{"t":"line","x1":50,"y1":92,"x2":50,"y2":386,"c":"gray","sw":2,"arrow":1},{"t":"text","x":22,"y":80,"s":"higher Ψ","c":"gray","size":13},{"t":"text","x":22,"y":410,"s":"lower Ψ","c":"gray","size":13},{"t":"text","x":440,"y":100,"s":"Water always moves to the lower Ψ","c":"black","size":16},{"t":"text","x":440,"y":122,"s":"Equal Ψ on both sides: no net movement","c":"gray","size":13},{"t":"text","x":440,"y":141,"s":"More solute lowers Ψ; pressure raises it","c":"gray","size":13},{"t":"text","x":96,"y":300,"s":"Closer to 0 = higher Ψ","c":"black","size":15},{"t":"text","x":96,"y":320,"s":"−2.43 is higher than −4.87, so water","c":"gray","size":13},{"t":"text","x":96,"y":338,"s":"moves from the sucrose to the NaCl","c":"gray","size":13},{"t":"text","x":96,"y":430,"s":"Steps are in order, not to scale. Solutions are in open beakers.","c":"gray","size":12}]},"bio-icrt":{"w":660,"h":420,"bg":"plain","graph":"x: 0 .. 0.5\ny: -26 .. 2\naxes C (mol/L), Ψₛ (bars)\ny = -0.0831*293x | blue thick | label sucrose, i = 1\ny = -2*0.0831*293x | red thick | label NaCl, i = 2\npoint 0.1,-2.43 | blue\npoint 0.1,-4.87 | red\npoint 0.2,-4.87 | blue\ntext 0.14,-14 : blue dot: 0.1 M sucrose = −2.43 bars | blue\ntext 0.14,-16.6 : red dot: 0.1 M NaCl = −4.87 bars | red\ntext 0.14,-19.2 : blue dot: 0.2 M sucrose = −4.87 bars too | blue\ntext 0.14,-21.8 : (same i × C = 0.2) | gray\ntext 0.37,-3 : at 20°C (293 K), slope = −iRT | gray","items":[]},"bio-potato":{"w":660,"h":420,"bg":"plain","graph":"x: -0.05 .. 1.05\ny: -52 .. 26\naxes sucrose (M), % change in mass\ny = 18 - 66x | red\ntext 0.88,-26 : best-fit line | red\npoint 0,17.2 | blue\npoint 0.2,5.9 | blue\npoint 0.4,-9.1 | blue\npoint 0.6,-20.8 | blue\npoint 0.8,-35.6 | blue\npoint 1,-47.2 | blue\npoint 0.273,0 | black | label x-intercept ≈ 0.27 M: no net change\ntext 0.24,20 : gains mass (hypotonic) | green\ntext 0.78,-12 : loses mass (hypertonic) | orange\ntext 0.74,-44 : example data, not your class data | gray","items":[]},"bio-u-tube":{"w":700,"h":356,"bg":"plain","graph":"","items":[{"t":"rect","x":71,"y":140,"w":42,"h":110,"c":"blue","sw":0.5,"fill":"blue"},{"t":"rect","x":191,"y":140,"w":42,"h":110,"c":"blue","sw":0.5,"fill":"blue"},{"t":"rect","x":71,"y":250,"w":162,"h":41,"c":"blue","sw":0.5,"fill":"blue"},{"t":"line","x1":70,"y1":70,"x2":70,"y2":292,"c":"black","sw":2.5},{"t":"line","x1":70,"y1":292,"x2":234,"y2":292,"c":"black","sw":2.5},{"t":"line","x1":234,"y1":292,"x2":234,"y2":70,"c":"black","sw":2.5},{"t":"line","x1":114,"y1":70,"x2":114,"y2":250,"c":"black","sw":2.5},{"t":"line","x1":114,"y1":250,"x2":190,"y2":250,"c":"black","sw":2.5},{"t":"line","x1":190,"y1":250,"x2":190,"y2":70,"c":"black","sw":2.5},{"t":"line","x1":152,"y1":251,"x2":152,"y2":291,"c":"black","sw":3,"dash":true},{"t":"text","x":125,"y":40,"s":"Before","c":"black","size":17},{"t":"text","x":74.8,"y":316,"s":"water","c":"gray","size":13},{"t":"text","x":194.8,"y":316,"s":"water","c":"gray","size":13},{"t":"text","x":37.5,"y":342,"s":"the membrane lets only water through","c":"gray","size":12},{"t":"line","x1":416,"y1":140,"x2":608,"y2":140,"c":"gray","sw":1.5,"dash":true},{"t":"text","x":423,"y":60,"s":"dashed line = starting level","c":"gray","size":12},{"t":"rect","x":431,"y":170,"w":42,"h":80,"c":"blue","sw":0.5,"fill":"blue"},{"t":"rect","x":551,"y":108,"w":42,"h":142,"c":"orange","sw":0.5,"fill":"orange"},{"t":"rect","x":431,"y":250,"w":162,"h":41,"c":"blue","sw":0.5,"fill":"blue"},{"t":"line","x1":430,"y1":70,"x2":430,"y2":292,"c":"black","sw":2.5},{"t":"line","x1":430,"y1":292,"x2":594,"y2":292,"c":"black","sw":2.5},{"t":"line","x1":594,"y1":292,"x2":594,"y2":70,"c":"black","sw":2.5},{"t":"line","x1":474,"y1":70,"x2":474,"y2":250,"c":"black","sw":2.5},{"t":"line","x1":474,"y1":250,"x2":550,"y2":250,"c":"black","sw":2.5},{"t":"line","x1":550,"y1":250,"x2":550,"y2":70,"c":"black","sw":2.5},{"t":"line","x1":512,"y1":251,"x2":512,"y2":291,"c":"black","sw":3,"dash":true},{"t":"ellipse","cx":565,"cy":130,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":580,"cy":160,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":562,"cy":196,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":582,"cy":226,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":570,"cy":244,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":538,"cy":270,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":560,"cy":280,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":580,"cy":266,"rx":4,"ry":4,"c":"orange","sw":1.5,"fill":"orange"},{"t":"line","x1":486,"y1":270,"x2":530,"y2":270,"c":"blue","sw":3,"arrow":1},{"t":"text","x":372.9,"y":40,"s":"After adding sugar to the right arm","c":"black","size":15},{"t":"text","x":434.8,"y":316,"s":"water","c":"gray","size":13},{"t":"text","x":534.1,"y":316,"s":"sugar water","c":"orange","size":13},{"t":"line","x1":620,"y1":160,"x2":620,"y2":112,"c":"red","sw":2.5,"arrow":1},{"t":"text","x":628,"y":140,"s":"rises","c":"red","size":13},{"t":"line","x1":410,"y1":146,"x2":410,"y2":168,"c":"red","sw":2.5,"arrow":1},{"t":"text","x":366,"y":172,"s":"falls","c":"red","size":13},{"t":"text","x":413.4,"y":342,"s":"water moves into the sugar side","c":"blue","size":12}]},"bio-nak-pump":{"w":700,"h":420,"bg":"plain","graph":"","items":[{"t":"ellipse","cx":20,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":18,"y1":193,"x2":18,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":22,"y1":193,"x2":22,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":20,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":18,"y1":220,"x2":18,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":22,"y1":220,"x2":22,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":34,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":32,"y1":193,"x2":32,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":36,"y1":193,"x2":36,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":34,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":32,"y1":220,"x2":32,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":36,"y1":220,"x2":36,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":48,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":46,"y1":193,"x2":46,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":50,"y1":193,"x2":50,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":48,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":46,"y1":220,"x2":46,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":50,"y1":220,"x2":50,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":62,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":60,"y1":193,"x2":60,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":64,"y1":193,"x2":64,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":62,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":60,"y1":220,"x2":60,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":64,"y1":220,"x2":64,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":76,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":74,"y1":193,"x2":74,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":78,"y1":193,"x2":78,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":76,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":74,"y1":220,"x2":74,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":78,"y1":220,"x2":78,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":90,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":88,"y1":193,"x2":88,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":92,"y1":193,"x2":92,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":90,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":88,"y1":220,"x2":88,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":92,"y1":220,"x2":92,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":104,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":102,"y1":193,"x2":102,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":106,"y1":193,"x2":106,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":104,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":102,"y1":220,"x2":102,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":106,"y1":220,"x2":106,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":118,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":116,"y1":193,"x2":116,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":120,"y1":193,"x2":120,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":118,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":116,"y1":220,"x2":116,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":120,"y1":220,"x2":120,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":132,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":130,"y1":193,"x2":130,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":134,"y1":193,"x2":134,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":132,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":130,"y1":220,"x2":130,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":134,"y1":220,"x2":134,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":146,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":144,"y1":193,"x2":144,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":148,"y1":193,"x2":148,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":146,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":144,"y1":220,"x2":144,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":148,"y1":220,"x2":148,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":160,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":158,"y1":193,"x2":158,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":162,"y1":193,"x2":162,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":160,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":158,"y1":220,"x2":158,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":162,"y1":220,"x2":162,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":174,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":172,"y1":193,"x2":172,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":176,"y1":193,"x2":176,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":174,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":172,"y1":220,"x2":172,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":176,"y1":220,"x2":176,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":188,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":186,"y1":193,"x2":186,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":190,"y1":193,"x2":190,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":188,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":186,"y1":220,"x2":186,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":190,"y1":220,"x2":190,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":202,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":200,"y1":193,"x2":200,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":204,"y1":193,"x2":204,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":202,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":200,"y1":220,"x2":200,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":204,"y1":220,"x2":204,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":216,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":214,"y1":193,"x2":214,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":218,"y1":193,"x2":218,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":216,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":214,"y1":220,"x2":214,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":218,"y1":220,"x2":218,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":230,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":228,"y1":193,"x2":228,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":232,"y1":193,"x2":232,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":230,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":228,"y1":220,"x2":228,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":232,"y1":220,"x2":232,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":244,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":242,"y1":193,"x2":242,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":246,"y1":193,"x2":246,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":244,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":242,"y1":220,"x2":242,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":246,"y1":220,"x2":246,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":258,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":256,"y1":193,"x2":256,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":260,"y1":193,"x2":260,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":258,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":256,"y1":220,"x2":256,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":260,"y1":220,"x2":260,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":272,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":270,"y1":193,"x2":270,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":274,"y1":193,"x2":274,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":272,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":270,"y1":220,"x2":270,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":274,"y1":220,"x2":274,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":398,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":396,"y1":193,"x2":396,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":400,"y1":193,"x2":400,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":398,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":396,"y1":220,"x2":396,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":400,"y1":220,"x2":400,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":412,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":410,"y1":193,"x2":410,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":414,"y1":193,"x2":414,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":412,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":410,"y1":220,"x2":410,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":414,"y1":220,"x2":414,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":426,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":424,"y1":193,"x2":424,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":428,"y1":193,"x2":428,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":426,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":424,"y1":220,"x2":424,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":428,"y1":220,"x2":428,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":440,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":438,"y1":193,"x2":438,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":442,"y1":193,"x2":442,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":440,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":438,"y1":220,"x2":438,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":442,"y1":220,"x2":442,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":454,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":452,"y1":193,"x2":452,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":456,"y1":193,"x2":456,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":454,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":452,"y1":220,"x2":452,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":456,"y1":220,"x2":456,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":468,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":466,"y1":193,"x2":466,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":470,"y1":193,"x2":470,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":468,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":466,"y1":220,"x2":466,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":470,"y1":220,"x2":470,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":482,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":480,"y1":193,"x2":480,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":484,"y1":193,"x2":484,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":482,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":480,"y1":220,"x2":480,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":484,"y1":220,"x2":484,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":496,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":494,"y1":193,"x2":494,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":498,"y1":193,"x2":498,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":496,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":494,"y1":220,"x2":494,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":498,"y1":220,"x2":498,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":510,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":508,"y1":193,"x2":508,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":512,"y1":193,"x2":512,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":510,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":508,"y1":220,"x2":508,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":512,"y1":220,"x2":512,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":524,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":522,"y1":193,"x2":522,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":526,"y1":193,"x2":526,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":524,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":522,"y1":220,"x2":522,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":526,"y1":220,"x2":526,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":538,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":536,"y1":193,"x2":536,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":540,"y1":193,"x2":540,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":538,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":536,"y1":220,"x2":536,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":540,"y1":220,"x2":540,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":552,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":550,"y1":193,"x2":550,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":554,"y1":193,"x2":554,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":552,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":550,"y1":220,"x2":550,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":554,"y1":220,"x2":554,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":566,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":564,"y1":193,"x2":564,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":568,"y1":193,"x2":568,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":566,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":564,"y1":220,"x2":564,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":568,"y1":220,"x2":568,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":580,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":578,"y1":193,"x2":578,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":582,"y1":193,"x2":582,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":580,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":578,"y1":220,"x2":578,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":582,"y1":220,"x2":582,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":594,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":592,"y1":193,"x2":592,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":596,"y1":193,"x2":596,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":594,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":592,"y1":220,"x2":592,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":596,"y1":220,"x2":596,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":608,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":606,"y1":193,"x2":606,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":610,"y1":193,"x2":610,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":608,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":606,"y1":220,"x2":606,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":610,"y1":220,"x2":610,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":622,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":620,"y1":193,"x2":620,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":624,"y1":193,"x2":624,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":622,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":620,"y1":220,"x2":620,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":624,"y1":220,"x2":624,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":636,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":634,"y1":193,"x2":634,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":638,"y1":193,"x2":638,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":636,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":634,"y1":220,"x2":634,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":638,"y1":220,"x2":638,"y2":237,"c":"brown","sw":1.2},{"t":"ellipse","cx":650,"cy":186,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":648,"y1":193,"x2":648,"y2":210,"c":"brown","sw":1.2},{"t":"line","x1":652,"y1":193,"x2":652,"y2":210,"c":"brown","sw":1.2},{"t":"ellipse","cx":650,"cy":244,"rx":6,"ry":6,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":648,"y1":220,"x2":648,"y2":237,"c":"brown","sw":1.2},{"t":"line","x1":652,"y1":220,"x2":652,"y2":237,"c":"brown","sw":1.2},{"t":"rect","x":296,"y":150,"w":88,"h":130,"c":"purple","sw":2.5,"fill":"purple"},{"t":"text","x":325.2,"y":220,"s":"pump","c":"purple","size":14},{"t":"text","x":20,"y":36,"s":"OUTSIDE: lots of Na⁺","c":"orange","size":16},{"t":"text","x":20,"y":400,"s":"INSIDE: lots of K⁺","c":"teal","size":16},{"t":"ellipse","cx":60,"cy":80,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":110,"cy":120,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":150,"cy":104,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":220,"cy":140,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":460,"cy":80,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":520,"cy":130,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":580,"cy":70,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":630,"cy":120,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":420,"cy":150,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":250,"cy":96,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":80,"cy":150,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":560,"cy":160,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":70,"cy":330,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":140,"cy":300,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":210,"cy":350,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":540,"cy":300,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":520,"cy":360,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":600,"cy":310,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":640,"cy":360,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":250,"cy":300,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":120,"cy":360,"rx":7,"ry":7,"c":"orange","sw":1.5,"fill":"orange"},{"t":"ellipse","cx":600,"cy":100,"rx":7,"ry":7,"c":"teal","sw":1.5,"fill":"teal"},{"t":"line","x1":312,"y1":340,"x2":312,"y2":70,"c":"orange","sw":3.5,"arrow":1},{"t":"text","x":130,"y":66,"s":"3 Na⁺ pumped out","c":"orange","size":16},{"t":"line","x1":368,"y1":70,"x2":368,"y2":340,"c":"teal","sw":3.5,"arrow":1},{"t":"text","x":378,"y":336,"s":"2 K⁺ pumped in","c":"teal","size":16},{"t":"ellipse","cx":462,"cy":290,"rx":26,"ry":15,"c":"gold","sw":2,"fill":"gold"},{"t":"text","x":448,"y":295,"s":"ATP","c":"black","size":13},{"t":"line","x1":436,"y1":284,"x2":388,"y2":262,"c":"gold","sw":2.5,"arrow":1},{"t":"text","x":492,"y":295,"s":"→ ADP + phosphate","c":"black","size":13},{"t":"text","x":380,"y":400,"s":"3 + out, 2 + in: the inside gets more negative","c":"gray","size":13}]},"bio-action-potential":{"w":680,"h":420,"bg":"plain","graph":"x: 0 .. 6\ny: -95 .. 55\naxes time (ms), membrane potential (mV)\ngrid off\ny = -70 | gray dashed | label resting potential −70 mV\ny = -70 + 110e^(-((x - 2)^2)/0.06) - 16e^(-((x - 2.8)^2)/0.18) | red thick\ntext 0.75,-58 : 1 polarization (rest) | black\ntext 1.05,22 : 2 depolarization | blue\ntext 1.05,12 : Na⁺ rushes in | blue\ntext 3.15,22 : 3 repolarization | teal\ntext 3.15,12 : K⁺ flows out | teal\ntext 4.4,-84 : then the pump restores Na⁺ and K⁺ | purple","items":[]},"bio-synapse":{"w":760,"h":464,"bg":"plain","graph":"","items":[{"t":"rect","x":250,"y":8,"w":80,"h":90,"c":"orange","sw":2.5,"fill":"orange"},{"t":"ellipse","cx":290,"cy":150,"rx":170,"ry":80,"c":"orange","sw":2.5,"fill":"orange"},{"t":"ellipse","cx":290,"cy":392,"rx":170,"ry":70,"c":"orange","sw":2.5,"fill":"orange"},{"t":"rect","x":250,"y":400,"w":80,"h":52,"c":"orange","sw":2.5,"fill":"orange"},{"t":"text","x":283.6,"y":52,"s":"A","c":"black","size":24},{"t":"text","x":283.6,"y":440,"s":"B","c":"black","size":24},{"t":"ellipse","cx":200,"cy":140,"rx":32,"ry":15,"c":"green","sw":2,"fill":"green"},{"t":"pen","pts":[[176,140],[184,132],[192,148],[200,132],[208,148],[216,132],[224,140]],"c":"green","sw":1.5},{"t":"ellipse","cx":158,"cy":112,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":153.4,"y":117.6,"s":"1","c":"black","size":15},{"t":"line","x1":168,"y1":118,"x2":182,"y2":128,"c":"black","sw":1.2},{"t":"ellipse","cx":290,"cy":132,"rx":17,"ry":17,"c":"navy","sw":2},{"t":"ellipse","cx":284,"cy":128,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":296,"cy":130,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":290,"cy":139,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":340,"cy":158,"rx":17,"ry":17,"c":"navy","sw":2},{"t":"ellipse","cx":334,"cy":154,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":346,"cy":156,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":340,"cy":165,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":254,"cy":176,"rx":17,"ry":17,"c":"navy","sw":2},{"t":"ellipse","cx":248,"cy":172,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":260,"cy":174,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":254,"cy":183,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":392,"cy":112,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":387.4,"y":117.6,"s":"2","c":"black","size":15},{"t":"line","x1":380,"y1":118,"x2":356,"y2":144,"c":"black","sw":1.2},{"t":"pen","pts":[[312,229],[318,217],[330,211],[342,217],[348,229]],"c":"navy","sw":2},{"t":"ellipse","cx":322,"cy":242,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":336,"cy":252,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":318,"cy":262,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":344,"cy":270,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":300,"cy":284,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":352,"cy":292,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":398,"cy":238,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":393.4,"y":243.6,"s":"7","c":"black","size":15},{"t":"line","x1":386,"y1":234,"x2":350,"y2":220,"c":"black","sw":1.2},{"t":"ellipse","cx":104,"cy":276,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":99.4,"y":281.6,"s":"4","c":"black","size":15},{"t":"line","x1":118,"y1":276,"x2":200,"y2":276,"c":"gray","sw":1.5,"dash":true},{"t":"rect","x":236,"y":316,"w":10,"h":18,"c":"blue","sw":1.5,"fill":"blue"},{"t":"rect","x":276,"y":316,"w":10,"h":18,"c":"blue","sw":1.5,"fill":"blue"},{"t":"rect","x":316,"y":316,"w":10,"h":18,"c":"blue","sw":1.5,"fill":"blue"},{"t":"rect","x":356,"y":316,"w":10,"h":18,"c":"blue","sw":1.5,"fill":"blue"},{"t":"ellipse","cx":428,"cy":330,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":423.4,"y":335.6,"s":"5","c":"black","size":15},{"t":"line","x1":416,"y1":330,"x2":368,"y2":326,"c":"black","sw":1.2},{"t":"rect","x":152,"y":194,"w":12,"h":24,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":140,"cy":246,"rx":3,"ry":3,"c":"teal","sw":1.5,"fill":"teal"},{"t":"ellipse","cx":152,"cy":256,"rx":3,"ry":3,"c":"teal","sw":1.5,"fill":"teal"},{"t":"line","x1":146,"y1":240,"x2":156,"y2":222,"c":"teal","sw":2,"arrow":1},{"t":"ellipse","cx":116,"cy":194,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":111.4,"y":199.6,"s":"6","c":"black","size":15},{"t":"line","x1":128,"y1":196,"x2":150,"y2":202,"c":"black","sw":1.2},{"t":"rect","x":220,"y":220,"w":10,"h":14,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":206,"cy":266,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":201.4,"y":271.6,"s":"3","c":"black","size":15},{"t":"line","x1":212,"y1":255,"x2":222,"y2":236,"c":"black","sw":1.2},{"t":"rect","x":418,"y":192,"w":12,"h":24,"c":"purple","sw":1.5,"fill":"purple"},{"t":"ellipse","cx":436,"cy":252,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"line","x1":436,"y1":246,"x2":428,"y2":220,"c":"purple","sw":2,"arrow":1},{"t":"ellipse","cx":456,"cy":186,"rx":12,"ry":12,"c":"black","sw":1.8},{"t":"text","x":451.4,"y":191.6,"s":"8","c":"black","size":15},{"t":"line","x1":444,"y1":190,"x2":432,"y2":198,"c":"black","sw":1.2},{"t":"text","x":490,"y":64,"s":"1 mitochondrion (makes ATP)","c":"black","size":13},{"t":"text","x":490,"y":94,"s":"2 synaptic vesicle with neurotransmitter","c":"black","size":13},{"t":"text","x":490,"y":124,"s":"3 autoreceptor","c":"black","size":13},{"t":"text","x":490,"y":154,"s":"4 synaptic cleft","c":"black","size":13},{"t":"text","x":490,"y":184,"s":"5 receptors on cell B","c":"black","size":13},{"t":"text","x":490,"y":214,"s":"6 Ca²⁺ channel","c":"black","size":13},{"t":"text","x":490,"y":244,"s":"7 vesicle fusing (exocytosis)","c":"black","size":13},{"t":"text","x":490,"y":274,"s":"8 reuptake pump","c":"black","size":13},{"t":"text","x":490,"y":330,"s":"A = axon terminal (presynaptic)","c":"gray","size":13},{"t":"text","x":490,"y":350,"s":"B = next cell (postsynaptic)","c":"gray","size":13}]},"bio-endo-exo":{"w":760,"h":350,"bg":"plain","graph":"","items":[{"t":"text","x":45.8,"y":36,"s":"Endocytosis: the membrane folds IN","c":"blue","size":16},{"t":"text","x":438.6,"y":36,"s":"Exocytosis: a vesicle fuses OUT","c":"red","size":16},{"t":"text","x":12,"y":92,"s":"outside","c":"gray","size":13},{"t":"text","x":12,"y":160,"s":"inside","c":"gray","size":13},{"t":"pen","pts":[[40,120],[140,120]],"c":"brown","sw":5},{"t":"ellipse","cx":90,"cy":100,"rx":11,"ry":11,"c":"green","sw":2,"fill":"green"},{"t":"pen","pts":[[150,120],[174,120],[180,134],[188,159.1],[200,166],[212,159.1],[220,134],[226,120],[250,120]],"c":"brown","sw":5},{"t":"ellipse","cx":200,"cy":150,"rx":11,"ry":11,"c":"green","sw":2,"fill":"green"},{"t":"pen","pts":[[260,120],[360,120]],"c":"brown","sw":5},{"t":"ellipse","cx":310,"cy":190,"rx":24,"ry":24,"c":"brown","sw":4},{"t":"ellipse","cx":310,"cy":190,"rx":11,"ry":11,"c":"green","sw":2,"fill":"green"},{"t":"line","x1":142,"y1":160,"x2":152,"y2":160,"c":"gray","sw":2,"arrow":1},{"t":"line","x1":250,"y1":160,"x2":262,"y2":160,"c":"gray","sw":2,"arrow":1},{"t":"text","x":32.8,"y":250,"s":"1 near the surface","c":"gray","size":12},{"t":"text","x":168.2,"y":250,"s":"2 folds in","c":"gray","size":12},{"t":"text","x":259.1,"y":250,"s":"3 vesicle inside","c":"gray","size":12},{"t":"text","x":30,"y":284,"s":"phagocytosis (\"eating\"), pinocytosis","c":"black","size":13},{"t":"text","x":30,"y":302,"s":"(\"drinking\"), receptor-mediated (VIP list)","c":"black","size":13},{"t":"pen","pts":[[420,120],[520,120]],"c":"brown","sw":5},{"t":"ellipse","cx":470,"cy":190,"rx":24,"ry":24,"c":"brown","sw":4},{"t":"ellipse","cx":463,"cy":185,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":477,"cy":187,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":470,"cy":197,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"pen","pts":[[530,120],[630,120]],"c":"brown","sw":5},{"t":"ellipse","cx":580,"cy":146,"rx":24,"ry":24,"c":"brown","sw":4},{"t":"ellipse","cx":573,"cy":141,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":587,"cy":143,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":580,"cy":153,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"pen","pts":[[640,120],[664,120],[670,134],[678,138.7],[690,142],[702,138.7],[710,134],[716,120],[740,120]],"c":"brown","sw":5},{"t":"ellipse","cx":676,"cy":98,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":690,"cy":86,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":700,"cy":102,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"ellipse","cx":684,"cy":108,"rx":3,"ry":3,"c":"pink","sw":1.5,"fill":"pink"},{"t":"line","x1":522,"y1":160,"x2":534,"y2":160,"c":"gray","sw":2,"arrow":1},{"t":"line","x1":632,"y1":160,"x2":644,"y2":160,"c":"gray","sw":2,"arrow":1},{"t":"text","x":441.4,"y":250,"s":"1 vesicle","c":"gray","size":12},{"t":"text","x":557.7,"y":250,"s":"2 fuses","c":"gray","size":12},{"t":"text","x":645.5,"y":250,"s":"3 contents out","c":"gray","size":12},{"t":"text","x":420,"y":284,"s":"neurotransmitters, proteins (insulin)","c":"black","size":13},{"t":"line","x1":380,"y1":56,"x2":380,"y2":310,"c":"gray","sw":1,"dash":true},{"t":"text","x":216.8,"y":336,"s":"Both use vesicles and ATP (active transport)","c":"black","size":14}]},"bio-fish":{"w":760,"h":344,"bg":"plain","graph":"","items":[{"t":"rect","x":10,"y":50,"w":362,"h":286,"c":"blue","sw":1,"fill":"blue"},{"t":"rect","x":388,"y":50,"w":362,"h":286,"c":"teal","sw":1,"fill":"teal"},{"t":"text","x":36,"y":34,"s":"Freshwater fish: saltier than its water","c":"black","size":15},{"t":"text","x":414,"y":34,"s":"Saltwater fish: less salty than the sea","c":"black","size":15},{"t":"ellipse","cx":210,"cy":170,"rx":92,"ry":46,"c":"green","sw":2.5,"fill":"green"},{"t":"pen","pts":[[118,170],[74,138],[74,202],[118,170]],"c":"green","sw":2.5},{"t":"ellipse","cx":268,"cy":160,"rx":5,"ry":5,"c":"black","sw":1,"fill":"black"},{"t":"pen","pts":[[244,140],[237,170],[244,200]],"c":"green","sw":2},{"t":"line","x1":176,"y1":74,"x2":190,"y2":120,"c":"blue","sw":3,"arrow":1},{"t":"line","x1":250,"y1":74,"x2":238,"y2":120,"c":"blue","sw":3,"arrow":1},{"t":"text","x":122,"y":70,"s":"water floods in","c":"blue","size":14},{"t":"line","x1":292,"y1":104,"x2":244,"y2":146,"c":"orange","sw":3,"arrow":1},{"t":"text","x":254,"y":96,"s":"gills take","c":"orange","size":13},{"t":"text","x":254,"y":112,"s":"up salt","c":"orange","size":13},{"t":"line","x1":150,"y1":150,"x2":110,"y2":120,"c":"gray","sw":2,"arrow":1},{"t":"text","x":34,"y":116,"s":"salt leaks out","c":"gray","size":13},{"t":"line","x1":128,"y1":204,"x2":84,"y2":244,"c":"blue","sw":3,"arrow":1},{"t":"text","x":28,"y":268,"s":"lots of dilute urine","c":"blue","size":14},{"t":"text","x":210,"y":300,"s":"never drinks","c":"black","size":14},{"t":"ellipse","cx":590,"cy":170,"rx":92,"ry":46,"c":"green","sw":2.5,"fill":"green"},{"t":"pen","pts":[[498,170],[454,138],[454,202],[498,170]],"c":"green","sw":2.5},{"t":"ellipse","cx":648,"cy":160,"rx":5,"ry":5,"c":"black","sw":1,"fill":"black"},{"t":"pen","pts":[[624,140],[617,170],[624,200]],"c":"green","sw":2},{"t":"line","x1":560,"y1":124,"x2":546,"y2":78,"c":"blue","sw":3,"arrow":1},{"t":"line","x1":620,"y1":124,"x2":634,"y2":78,"c":"blue","sw":3,"arrow":1},{"t":"text","x":500,"y":70,"s":"water leaves","c":"blue","size":14},{"t":"line","x1":736,"y1":150,"x2":686,"y2":166,"c":"blue","sw":3,"arrow":1},{"t":"text","x":690,"y":130,"s":"drinks","c":"blue","size":13},{"t":"text","x":690,"y":146,"s":"seawater","c":"blue","size":13},{"t":"line","x1":626,"y1":200,"x2":676,"y2":244,"c":"orange","sw":3,"arrow":1},{"t":"text","x":602,"y":268,"s":"gills pump salt out","c":"orange","size":14},{"t":"line","x1":470,"y1":140,"x2":506,"y2":158,"c":"gray","sw":2,"arrow":1},{"t":"text","x":402,"y":132,"s":"salt leaks in","c":"gray","size":13},{"t":"line","x1":508,"y1":204,"x2":478,"y2":232,"c":"blue","sw":2,"arrow":1},{"t":"text","x":402,"y":256,"s":"a little","c":"blue","size":13},{"t":"text","x":402,"y":272,"s":"concentrated urine","c":"blue","size":13}]},"bio-paramecium":{"w":660,"h":400,"bg":"plain","graph":"x: 0 .. 1200\ny: 0 .. 1.5\naxes mOsm/kg, output (pL/min)\ntext 900,1.38 : x-axis: salinity (milliosmoles of solute/kg) | gray\nsegment 10,1.3 -> 250,0.25 | blue\nsegment 250,0.25 -> 750,0.1 | blue\nsegment 750,0.1 -> 1000,0.05 | blue\npoint 10,1.3 | blue | label 1.3 in freshwater\npoint 250,0.25 | blue | label 0.25\npoint 750,0.1 | blue | label 0.1\npoint 1000,0.05 | blue | label 0.05\ntext 640,0.95 : saltier water: less water gets in, | gray\ntext 640,0.84 : so the vacuole pumps out less | gray","items":[]},"bio-dialysis":{"w":640,"h":400,"bg":"plain","graph":"","items":[{"t":"rect","x":124,"y":132,"w":392,"h":226,"c":"orange","sw":0.5,"fill":"orange"},{"t":"line","x1":124,"y1":132,"x2":516,"y2":132,"c":"orange","sw":2},{"t":"line","x1":122,"y1":84,"x2":122,"y2":360,"c":"black","sw":3},{"t":"line","x1":122,"y1":360,"x2":518,"y2":360,"c":"black","sw":3},{"t":"line","x1":518,"y1":360,"x2":518,"y2":84,"c":"black","sw":3},{"t":"ellipse","cx":320,"cy":240,"rx":78,"ry":104,"c":"navy","sw":3,"fill":"navy"},{"t":"pen","pts":[[312,136],[320,124],[328,136]],"c":"navy","sw":3},{"t":"pen","pts":[[268,196],[274,190],[280,196],[286,190],[292,196],[298,190],[304,196]],"c":"navy","sw":2.5},{"t":"pen","pts":[[308,252],[314,246],[320,252],[326,246],[332,252],[338,246],[344,252]],"c":"navy","sw":2.5},{"t":"pen","pts":[[278,296],[284,290],[290,296],[296,290],[302,296],[308,290],[314,296]],"c":"navy","sw":2.5},{"t":"pen","pts":[[326,196],[332,190],[338,196],[344,190],[350,196],[356,190],[362,196]],"c":"navy","sw":2.5},{"t":"ellipse","cx":160,"cy":170,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":176,"cy":258,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":470,"cy":190,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":452,"cy":300,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":204,"cy":330,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":480,"cy":336,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":150,"cy":214,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":300,"cy":176,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":350,"cy":226,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":312,"cy":320,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"ellipse","cx":282,"cy":240,"rx":4,"ry":4,"c":"brown","sw":1.5,"fill":"brown"},{"t":"line","x1":470,"y1":236,"x2":404,"y2":236,"c":"brown","sw":3,"arrow":1},{"t":"text","x":528,"y":228,"s":"iodine","c":"brown","size":15},{"t":"text","x":528,"y":246,"s":"gets in","c":"brown","size":13},{"t":"line","x1":232,"y1":192,"x2":248,"y2":208,"c":"red","sw":3},{"t":"line","x1":248,"y1":192,"x2":232,"y2":208,"c":"red","sw":3},{"t":"line","x1":290,"y1":208,"x2":256,"y2":202,"c":"navy","sw":2,"arrow":1},{"t":"text","x":14,"y":188,"s":"starch is","c":"navy","size":15},{"t":"text","x":14,"y":206,"s":"too big to","c":"navy","size":13},{"t":"text","x":14,"y":222,"s":"get out","c":"navy","size":13},{"t":"line","x1":262,"y1":304,"x2":196,"y2":318,"c":"green","sw":3,"arrow":1},{"t":"text","x":14,"y":316,"s":"glucose","c":"green","size":15},{"t":"text","x":14,"y":334,"s":"diffuses out","c":"green","size":13},{"t":"text","x":93.4,"y":30,"s":"The inside turns blue-black; the beaker stays amber-brown","c":"black","size":15},{"t":"text","x":116.7,"y":386,"s":"tubing = semipermeable: small molecules pass, big ones stay","c":"gray","size":13}]}},
      },
    ],
  });
})(typeof self !== 'undefined' ? self : this);
