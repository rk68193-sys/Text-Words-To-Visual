/*
 * Course notebooks that ship with the site. Each one joins your desk once, the first time
 * you open the site after it was added (deleting it later is remembered). Version 2 adds
 * drawings; it replaces a copy you never edited and arrives beside one you did. They are
 * also in the "Borrow a starting point" list, which adds a fresh copy.
 *
 * Written from the study notes of October 16, 2026.
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
    ],
  });
})(typeof self !== 'undefined' ? self : this);
