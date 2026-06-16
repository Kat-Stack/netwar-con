# Learnings

The reusable, cross-cutting lessons behind the fixes in [`README.md`](./README.md). Most are about
browser rendering quirks (heavily Firefox) and about verifying fixes when the bug won't reproduce in
automation. Each is a rule of thumb plus the why.

---

## Browser rendering

### 1. After a bfcache restore, Firefox won't repaint a flat fill in place — reload to escape it
Firefox restores a page from the back/forward cache **frozen exactly as you left it**, and JS style
changes to a flat `fill`/`background` often don't repaint over that snapshot. Things that *are* actively
re-rendered (gradient `<stop>`s, transforms, filters) recover; a plain `fill` re-assert does not — not by
clearing it, re-setting it, or alternating values.
- **Rule:** if visual state can be "stuck" after Back, handle `pageshow` with `e.persisted` and, if an
  in-place repaint isn't reliable, just `location.reload()` (optionally with a `sessionStorage` flag to
  skip an intro on the reload). It's the one thing guaranteed to discard the frozen snapshot.
- Chrome repaints flat fills in place, so this class of bug is **Firefox-only** — don't expect to see it
  in Chrome.

### 2. Emoji glyphs are seated differently per engine AND differently on canvas vs SVG
`getBBox()` returns the font's line-metric box (same across engines), **not** the visible ink. And the
ink offset differs per engine (Firefox seats ☣/☢ ~45px lower than Chrome). Measuring the ink on a
`<canvas>` to position an SVG `<text>` only works if canvas and SVG render the glyph identically — on
real Firefox they don't.
- **Rule:** to place an emoji/symbol precisely and identically everywhere, **don't** position a live
  glyph. Rasterise it once to a canvas, crop to its real ink (alpha scan), and display the **bitmap**
  (`<image>` / `drawImage`) centred and scaled. Positioning then depends on nothing font-related.
- Bonus: a pre-rendered bitmap is far cheaper to animate than re-rasterising a large glyph each frame.

### 3. Render-blocking CSS is not a guarantee on slow loads — inline the critical layout
Firefox will paint **unstyled** content if a render-blocking stylesheet is slow to arrive (VPN, cold
CDN). Colours baked into inline SVG attributes survive; layout that lives only in the external sheet
(centring, `display:none`, no-scroll) does not — so you get an uncentred, scrolling, half-visible page.
- **Rule:** put the handful of **layout-critical** rules in an inline `<style>` in `<head>` (centre the
  hero, size key elements, hide what should be hidden, lock scroll). Keep the external sheets for the
  rest; their more-specific state rules (`body.revealed #x`) still override the inline defaults.

### 3b. Inline critical CSS must replicate the global resets, not just the component rules
Critical CSS is a *subset* of the real stylesheet, but it inherits the browser defaults for whatever it
omits — including `box-sizing`. puzzle.css sets `*{box-sizing:border-box}`; the critical block didn't, so
in the critical-only paint `#hero` used `content-box`, its padding inflated the height, and the centred
triangle sat ~50px low until the external CSS (border-box) snapped it back — a visible down-then-up jump.
- **Rule:** when you inline critical CSS, copy the global resets (`box-sizing`, margins) too, and make
  the critical rules byte-identical to their external counterparts. Verify by measuring the layout with
  the external sheets **blocked** vs present — the numbers must match, or you'll get a load-time reflow.

### 4. An inline `<svg>` with a viewBox but no width/height stretches to the container before CSS
With no intrinsic size, the browser sizes a viewBox-only SVG to the container width on first paint, then
the CSS snaps it down → a visible "zoom then shrink."
- **Rule:** always give an inline SVG an explicit size that doesn't depend on the external CSS (inline
  `style`/attributes, or an inline critical-CSS rule). Same idea as #3.

### 5. Make third-party / cross-origin CSS non-blocking
A render-blocking `<link>` to Google Fonts delays first paint on everything behind it.
- **Rule:** load decorative fonts non-blocking: `media="print" onload="this.media='all'"` (+ a
  `<noscript>` fallback). Only block on CSS that's needed for the very first frame.

### 6. Firefox is conservative about assets inside `display:none` / `hidden` subtrees
It won't eagerly buffer `<video>`/`<audio>` or fetch `loading="lazy"` images that aren't shown yet
(Chrome's preload scanner does). And `<link rel="preload" as="video">` / `as="audio"` are **not valid**
preload destinations — Firefox ignores them.
- **Rule:** warm reveal assets explicitly — preload the **poster image** (valid `as="image"`), call
  `media.load()` to download audio early, and prefetch below-the-fold images (`new Image().src = …`) so
  the lazy `<img>`s hit cache on scroll.

---

## Process

### 7. Measure before you optimise — the obvious suspect often isn't the cost
The `#gaze` drop-shadow filter *looked* like the lag culprit. A headed-Firefox FPS probe showed removing
it made **no** difference; the real costs were the per-frame emoji raster and an idle render loop that
never went quiet. Measuring saved a needless (and look-changing) "fix."
- **Rule:** quantify the hot path (FPS / frame time, with the suspect toggled off) before changing it —
  especially before changing anything that alters the look.

### 8. Automation has blind spots — verify the mechanism, and distrust a green check that can't repro the bug
- **Playwright's Firefox can't exercise bfcache** (`goBack()` does a fresh reload; `pageshow.persisted`
  is never `true`). Don't conclude "fixed" from it — verify the wiring with a **synthetic event**
  (`new PageTransitionEvent('pageshow', { persisted: true })`) and reason about the real path.
- **Playwright's Firefox uses a different emoji font** than a real macOS machine, so a pixel test of
  emoji positioning can pass while the real browser still clips. If a check *cannot* reproduce the
  reported symptom, its pass means little.
- **Rule:** when the real trigger can't be reproduced in automation, (a) verify the fix's mechanism via
  a synthetic trigger, (b) prefer fixes that are correct **by construction** (e.g. bitmap centring) over
  ones that depend on the very behaviour you can't test.

### 9. A change-detection cache has one owner — or it desyncs
Caching "last written value" to skip redundant DOM writes is a great perf win, but if **another code
path writes the same property directly**, the cache goes stale and the value gets stuck (this is exactly
how the stray eyelid line appeared: `startSpin()` set `opacity='1'` behind the cache's back).
- **Rule:** the property a change-detection loop owns must be written **only** by that loop. If something
  else needs to set it, either route it through the same cache or don't cache that property.

### 10. Reproduce → root-cause → fix → verify — and write down what *didn't* work
Several bugs here ate multiple attempts (bfcache: 3; emoji clipping: 2) because the first fixes treated
symptoms. The ones that stuck came from nailing the mechanism (frozen snapshot; canvas≠SVG) and then
choosing a fix that couldn't fail for that reason. Recording the dead ends stopped them being retried.
