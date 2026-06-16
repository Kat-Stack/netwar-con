# Devlog — The Last Psyop / INFOHAZARD

A running log of the technical problems hit while building the `lastpsyop.com` gate
(the watching-eye hazard triangle) and reveal (The Last Psyop landing), and the fix that
**actually worked** for each — with the root cause and the commit. Most of the hard ones were
Firefox-specific rendering quirks that didn't reproduce in Chrome (or in automation).

Files: `index.html` · `puzzle.js`/`puzzle.css` (the gate) · `landing.js`/`landing.css` (the reveal)
· `scripts/dev.sh`. See [`LEARNINGS.md`](./LEARNINGS.md) for the distilled, reusable lessons.

---

## 1. Deployment & dev environment

### GitHub Pages was running Jekyll over the static site
- **Symptom:** deploys didn't reflect the committed files; the "last animation file" never showed.
- **Root cause:** GitHub Pages defaults to a Jekyll build, which mangles/ignores some static assets.
- **Fix that worked:** add an empty `.nojekyll` file at the repo root → Pages serves the files as-is.
- **Commit:** `9121336`

### Browser served stale JS/CSS during local dev
- **Symptom:** edits to `puzzle.js`/styles didn't show on reload; old versions lingered (worst on Firefox).
- **Root cause:** `python -m http.server` sends only `Last-Modified`; Firefox heuristically caches that.
- **Fix that worked:** `scripts/dev.sh` runs a tiny `ThreadingHTTPServer` subclass that sends
  `Cache-Control: no-store, must-revalidate` on every response, so the browser always refetches.
- **Commit:** `13f71eb`
- **Note:** this kills bfcache locally (no-store disables it) — fine for dev, but it means the dev
  server is *not* the place to test the bfcache bug below (use a plain server for that).

---

## 2. Architecture

### One monolithic `psyop.css`/`psyop.js` was hard to reason about
- **Fix that worked:** split into **`puzzle.*`** (the eye/triangle/heart gate + audio engine) and
  **`landing.*`** (the reveal). They talk through a tiny `window.PSYOP` bridge + a `psyop:sound`
  CustomEvent, so neither needs the other's internals.
  - `puzzle.js` → `PSYOP.reveal(instant)` on bless; `landing.js` → `PSYOP.isSoundOn()`, `sfxReveal()`, `markBlessed()`.
- **Commit:** `dbc248c`

---

## 3. First paint & FOUC (flash of unstyled / wrong content)

This was the most recurring theme: the gate looked wrong for the *first frame(s)* before CSS/JS
settled. Four distinct causes, four fixes.

### (a) First frame flashed the OLD "game" look (neon outline, gold gradient eye)
- **Root cause:** the SVG's **inline presentation attributes** were the old design, and they paint
  before `puzzle.css` overrides them — made worse by the render-blocking Google Fonts request.
- **Fix that worked:** set the SVG inline attributes to the *flat* scheme so the first paint is
  already correct (`<polygon fill="#f2dd00" stroke="#0c0c0c">`, flat iris/sclera, hidden highlight),
  **and** load Google Fonts non-blocking: `media="print" onload="this.media='all'"` (+ `<noscript>`).
- **Commit:** `a847707`

### (b) Firefox painted a black canvas + dark UI chrome before CSS
- **Root cause:** `<meta name="color-scheme" content="dark">` conflicting with the light paper design.
- **Fix that worked:** `content="light"` + `:root { color-scheme: light }` + `html,body{background:#f4f2ea}`.
- **Commit:** `40bdd71`

### (c) Triangle "zoomed in" on the first frame, then snapped into position
- **Symptom:** on load the triangle appeared ~1.8× too big, then shrank into place.
- **Root cause:** `<svg id="hazard" viewBox="0 0 600 560">` has a viewBox but **no `width`/`height`**,
  so before `puzzle.css` applied it had no intrinsic size and the browser stretched it toward the
  container width (measured **1184px** with CSS blocked, vs the styled 660px).
- **Fix that worked:** size `#hazard` from the first byte — folded into the critical inline CSS below.
- **Commit:** `98ce6e3` (initially an inline `style` on the SVG; consolidated into critical CSS in `4373dae`)

### (d) On slow loads the whole page painted UNSTYLED (uncentred triangle, video poster, scrolling)
- **Symptom:** over a VPN / cold CDN, refresh showed a top-left triangle, the war-room video poster
  (`#revbg`), and a scrolling page.
- **Root cause:** Firefox stops waiting for a slow **render-blocking stylesheet** and paints unstyled
  content. The triangle's *colours* survive (inline SVG attrs) but its *layout* (centring, hiding
  `#revbg`, no-scroll) lived only in the external CSS.
- **Fix that worked:** inline the **critical layout CSS** in `<head>` so the first paint is correct
  regardless of external-CSS timing:
  ```html
  <style>
    html, body { margin: 0; height: 100%; background: #f4f2ea; }
    body { overflow: hidden; }
    #hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem 1rem 11vh; }
    #hazard { width: min(92vw, 88vh, 660px); height: auto; }
    .credit { position: fixed; left: 0; right: 0; bottom: 26px; margin: 0; text-align: center; }
    #revbg, #dread, #boom { display: none; }
  </style>
  ```
  The external sheets still take over — `body.revealed #revbg { display: block }` out-specifies the
  inline `display:none`, so the reveal still shows the video.
- **Commit:** `4373dae`
- **Verified:** with **both** stylesheets blocked, the gate renders centred, sized, no video, no
  scroll, on Chromium *and* Firefox.

---

## 4. The opening flip symbols (☣ → ☢ → eye)

### Symbols sat too low / were clipped at the bottom on Firefox
- **Symptom:** the biohazard/radioactive glyphs were off-centre (low) and the bottom was cut off —
  **Firefox only**.
- **Failed attempts (instructive):**
  1. `getBBox()` box-centring (`40bdd71`) — `getBBox` returns the *font line-metric box*, identical in
     both browsers; it does **not** see the visible ink, which Firefox seats ~45px lower.
  2. Canvas ink-measurement to centre the `<text>` (`c122477`) — measured the glyph ink on a canvas
     and offset the SVG `<text>`. This **only works if canvas and SVG render the emoji identically**,
     and on **real Firefox they don't** — so it kept clipping. (Playwright's Firefox uses a different
     emoji font and "passed" the test → false confidence.)
- **Fix that worked:** stop rendering a live emoji `<text>` entirely. Rasterise each symbol **once** to
  a canvas, scan alpha for the real ink bbox, crop to it, and show that PNG as an SVG `<image>` centred
  on the eye and scaled to fit (`rasterGlyph()` + `setFace()` in `puzzle.js`). Positioning no longer
  depends on font metrics → centred + in-bounds on every engine **by construction** (can't be clipped).
- **Commit:** `5fcee4e`

### Symbols then looked pixelated and too large
- **Root cause:** rasterised at only `PX = 384`, then the SVG upscaled it on hi-DPI → blocky; and the
  target size filled the triangle.
- **Fix that worked:** raster at `PX = 1024` (so the bitmap is *downscaled* to display size → crisp) and
  drop `SYM_TARGET` 296 → 230 (sits inside the triangle at ~eye size).
- **Commit:** `72bfcda`

---

## 5. Firefox: warning triangle stuck RED after Back (bfcache)

The signature Firefox-only bug. Resisted three in-place fixes before the right one.

- **Symptom:** tap the eye → it flares red → go to a rabbit-hole link → hit Back → the **triangle stays
  alarm-red** while the eye recovers to yellow. **Firefox only.**
- **Root cause:** on Back, Firefox restores the page from **bfcache** frozen *mid-alarm* (the `<polygon>`
  painted red) and **will not repaint a flat fill in place** no matter what value JS writes. The iris
  recovered only because `applyIntensity()` actively rewrites its gradient `<stop>` colours every frame
  (which forces a gradient re-render); a flat `fill` has no equivalent. Chrome repaints flat fills in
  place, so it never showed the bug.
- **Failed attempts (instructive):**
  1. Re-assert the fill in a `pageshow` rAF (`c1ec370`).
  2. Self-heal the resting state every frame in the rAF loop (`d9156de`).
  3. Alternate between two near-identical yellows each frame to force a value change (`57ecf46`).
  All three left the frozen red snapshot painted.
- **Fix that worked:** on a `persisted` pageshow, **hard-reload** to a clean eye (the only thing that
  reliably discards the frozen snapshot), flagging the next load to skip the opening flip so the return
  is instant. Gated on `!blessed` so a solved landing isn't blown away.
  ```js
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || blessed) return;
    try { sessionStorage.setItem('psyop:skipflip', '1'); } catch (_) {}
    try { triEl.style.fill = '#f2dd00'; scleraE.style.fill = '#f2dd00'; hazard.style.visibility = 'hidden'; } catch (_) {}
    location.reload();
  });
  ```
  On load, a `psyop:skipflip` flag in `sessionStorage` skips `startSpin()` and shows the resting eye.
- **Commit:** `8f08e6a`
- **Verification note:** **Playwright's Firefox cannot reproduce bfcache** under automation — `goBack()`
  does a fresh reload (`pageshow.persisted` is never `true`, `window.*` state never survives). Verified
  the fix's wiring instead by dispatching a synthetic `new PageTransitionEvent('pageshow',{persisted:true})`
  and asserting it reloads to a clean, flip-skipped, clickable eye.

---

## 6. Performance / lag

- **Symptom:** animation felt laggy (reported on Firefox).
- **Fixes that worked (measured, not guessed):**
  1. **Bitmap flip** (§4): the old flip re-rasterised a 340px emoji *every frame*; the `<image>` just
     `scaleX`'s a composited bitmap. (`5fcee4e`)
  2. **Idle change-detection** in `tick()`: it rewrote the lid/gaze transforms + crease opacity every
     frame *even at rest* — and because `#gaze` carries the drop-shadow filter, re-setting its transform
     re-rendered that filter on every idle frame. Cache the last value, only write on change → the loop
     goes quiet when settled (idle measured ~120fps). (`5fcee4e`)
  3. **Coarsen intensity** 256 → 64 steps: the iris radialGradient + glow were re-rendered on every
     hair-fine intensity step during cursor approach; 64 shades is still smooth but ~4× fewer
     gradient/filter re-renders. (`5fcee4e`)
  4. Earlier heart-drag pass: drive position via `transform` (GPU) not `left/top` (reflow), cache the
     hazard/eye/heart rects, and only repaint on change. (`b5b6e3d`)
- **What I did NOT change (because I measured it):** moving/removing the `#gaze` drop-shadow filter — a
  headed-Firefox FPS probe showed removing it did **not** improve hover FPS (it wasn't the bottleneck),
  so the glow's look was left untouched.

---

## 7. Firefox loaded reveal images/audio late

- **Symptom:** the war-room backdrop image and the muzak came in noticeably later on Firefox than Chrome.
- **Root cause:** the reveal assets live in `display:none` / `hidden` subtrees. Chrome's preload scanner
  fetches them eagerly anyway; Firefox is conservative — it won't buffer media or fetch `loading="lazy"`
  images in a hidden subtree until they're shown/near-viewport. Also `<link rel="preload" as="video">`
  is **not a valid preload destination** — Firefox ignores it (and warns), so the intended head-start
  did nothing.
- **Fix that worked:**
  - Preload the war-room **poster** instead of the bogus video preload: `<link rel="preload" as="image"
    href="assets/warroom.jpg">` → backdrop paints instantly on reveal, every browser.
  - Warm the muzak: `bgm.preload = 'auto'; bgm.load();` (download only; playback still needs the gesture).
  - Warm the below-the-fold portraits into cache a beat after reveal (`new Image().src = …`) so the lazy
    `<img>`s load instantly on scroll, matching Chrome's eagerness.
- **Commit:** `8f08e6a`
- **Note:** `assets/revbg.mp4` is **8.4 MB** — the genuinely heavy asset; the poster covers it while the
  loop streams in. Compressing it is the real win if the video motion needs to be instant.

---

## 8. Eye visuals & the title easter egg

### A stray "eyelid line" appeared across the open eye (regression)
- **Symptom:** a horizontal line through the resting eye.
- **Root cause:** a **change-detection cache desync** introduced in `5fcee4e`. The crease (closed-lid
  line) was in the `eyeVis` group, so `startSpin()`'s "reveal the eye" step (`opacity = '1'`) forced it
  visible *directly* — and the new change-detection then saw its cached opacity as already-hidden and
  never re-hid it.
- **Fix that worked:** the crease is openness-driven and should be controlled **only** by `tick()`
  (hidden while the eye is open), so it was removed from `eyeVis` — nothing forces it visible now.
- **Commit:** `72bfcda`

### Title easter egg: a watching eye on the "A" in "The Last Psyop"
- **What worked:** the letter stays in flow; a small SVG eye (mirroring the hero eye 1:1) is an
  absolutely-positioned overlay on `.lp-a`, **on by default** (`body class="eye-a"`) and toggled off/on
  with **Cmd/Ctrl+Shift+L**. Its gaze group is eased toward the pointer in `landing.js`; the rAF loop
  runs only while it's on.
- **Tuning that landed:** recoloured to the font amber `#ffbe4d` (was gate-yellow), 2× smaller
  (`.58em → .29em`), nudged higher in the A (`top: 54% → 47%`), default-on.
- **Commits:** `1dc5080` (initial, replaced an earlier triangle-swap), `98ce6e3` (restyle)

---

## Appendix — how things were verified

- **Playwright** (Firefox + Chromium) installed at `/tmp/ffrepro`. Used for: pixel screenshots of the
  flip/eye, geometry assertions (symbol centre on both engines), FPS probes (headed Firefox), and
  CSS-blocked FOUC simulation (`route('**/puzzle.css', r => r.abort())`).
- **Automation blind spots:** Playwright's Firefox can't exercise bfcache, and its emoji font differs
  from a real macOS machine's — see `LEARNINGS.md`.
