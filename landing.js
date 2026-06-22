/* landing.js — The Last Psyop reveal: the war-room hero, copy, hosts, the feature video, the
 * background muzak and the "eternal september" marquee. Paired with landing.css.
 *
 * The gate (puzzle.js) drives the experience; this file owns everything AFTER it. The two talk
 * through a tiny window.PSYOP bridge so neither needs the other's internals:
 *   puzzle.js  →  PSYOP.reveal(instant)   when the heart is blessed (or ?reveal is used)
 *   here       →  PSYOP.isSoundOn()        master sound switch (lives with the audio engine)
 *              →  PSYOP.sfxReveal()        the low reveal pad (part of the SFX engine)
 *              →  PSYOP.markBlessed()      tell the puzzle we skipped straight to the reveal
 *   the master sound toggle dispatches `psyop:sound`; we fade the muzak to match.
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const hero = $('hero'), revealEl = $('reveal'), revvid = $('revvid');
  const P = (window.PSYOP = window.PSYOP || {});
  const soundOn = () => (P.isSoundOn ? P.isSoundOn() : true);

  // Warm the reveal assets so "The Last Psyop" fades in seamlessly: the LED font + the war-room
  // video's first frame are decoded now (the <link rel=preload> in <head> already kicked off the
  // network), so the reveal never flashes the fallback font or a black backdrop.
  const assetsReady = (function warm() {
    const vidP = new Promise((res) => {
      if (!revvid) return res();
      try { revvid.muted = true; revvid.play().catch(() => {}); } catch (e) {}
      if (revvid.readyState >= 2) return res();                       // already has a frame
      const done = () => res();
      revvid.addEventListener('loadeddata', done, { once: true });
      revvid.addEventListener('canplay', done, { once: true });
      revvid.addEventListener('error', done, { once: true });
      setTimeout(done, 5000);                                        // never block the reveal forever
    });
    const fontP = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load("400 184px 'LEDLIGHT'"),
          document.fonts.load("600 48px 'Cormorant Garamond'"),
          document.fonts.load("400 22px 'EB Garamond'"),
          document.fonts.load("italic 400 22px 'EB Garamond'"),
        ]).catch(() => {}) : Promise.resolve();
    return Promise.all([vidP, fontP]);
  })();

  /* ---- background muzak (fades in on reveal); the master toggle lives in puzzle.js ---- */
  const bgm = $('bgm');
  // warm the muzak now (download only — playback still needs the user gesture) so it's cached and
  // plays instantly on reveal. Firefox treats <audio preload="auto"> conservatively and otherwise
  // won't fetch it until the first play(), which is why the sound came in late there vs Chrome.
  if (bgm) { try { bgm.preload = 'auto'; bgm.load(); } catch (e) {} }
  let bgmFadeT = 0;
  function bgmFadeIn() {
    if (!bgm || !soundOn()) return;
    try { bgm.volume = 0; bgm.play().catch(() => {}); } catch (e) { return; }
    clearInterval(bgmFadeT);
    bgmFadeT = setInterval(() => {                 // ~2s ramp to a soft background level
      bgm.volume = Math.min(0.4, bgm.volume + 0.01);
      if (bgm.volume >= 0.4) clearInterval(bgmFadeT);
    }, 50);
  }
  // react to the master sound switch (toggled in puzzle.js, which owns the audio engine + SFX)
  document.addEventListener('psyop:sound', (e) => {
    if (e.detail && e.detail.on) bgmFadeIn();
    else { clearInterval(bgmFadeT); if (bgm) bgm.pause(); }
  });

  // Firefox is conservative about lazy images inside a subtree that was just un-hidden: it waits
  // until they're nearly in view to fetch (Chrome uses a much wider margin), so the host portraits
  // visibly pop in as you scroll. Warm them into the HTTP cache a beat after the reveal so the lazy
  // <img>s load instantly from cache when scrolled to — matching Chrome's eagerness.
  function warmRevealImages() {
    document.querySelectorAll('#reveal img').forEach((img) => {        // host portraits, the emblem
      const src = img.currentSrc || img.getAttribute('src');
      if (src) { const w = new Image(); w.src = src; }
    });
    const paper = new Image(); paper.src = 'assets/paper.jpg';          // graph-paper texture (a CSS bg, not an <img>)
  }
  // Warm the landing pictures DURING the gate (not only on reveal) so they're already cached by the
  // time you solve the puzzle and scroll — deferred so it doesn't compete with the gate's first paint.
  setTimeout(warmRevealImages, 2500);

  /* ---- the reveal: cross from the gate into The Last Psyop (called by puzzle.js on bless) ---- */
  function reveal(instant) {
    document.title = 'Our Last Psyop';
    body.classList.add('revealed');
    document.documentElement.classList.add('revealed');   // dark root → no white showing on overscroll
    // the reveal is gesture-driven, so this play() is allowed even if autoplay was deferred
    if (revvid) { revvid.muted = true; revvid.play().catch(() => {}); }
    bgmFadeIn();                                          // muzak fades in as we enter The Last Psyop
    hero.style.opacity = '0';
    setTimeout(() => {
      hero.style.display = 'none';
      revealEl.hidden = false;                       // rendered but still opacity:0 (invisible)
      warmRevealImages();                            // prefetch the below-the-fold portraits (esp. for Firefox)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // only fade the text in once the LED font + video frame are ready, so the title never flashes
      // in the fallback font and the backdrop is already painted
      assetsReady.finally(() => requestAnimationFrame(() => { revealEl.classList.add('show'); if (P.sfxReveal) P.sfxReveal(); }));
    }, instant ? 0 : 1000);
  }
  P.reveal = reveal;

  /* ---- the feature video at the bottom: autoplay WITH sound when scrolled into view, centre
     play/pause toggle, bottom-left mute. The page already has user activation from the heart-drag,
     so audio playback is normally permitted; if a browser still blocks it we fall back to muted
     autoplay and surface the unmute button. ---- */
  (function featureVideo() {
    const vf = document.querySelector('.vfeature');
    if (!vf) return;
    const v = vf.querySelector('.vfeature__vid');
    const setMuted = (m) => { v.muted = m; vf.classList.toggle('is-muted', m); };
    v.addEventListener('play', () => vf.classList.add('is-playing'));
    v.addEventListener('pause', () => vf.classList.remove('is-playing'));
    const toggle = () => { if (v.paused) v.play().catch(() => {}); else v.pause(); };
    vf.querySelector('.vfeature__center').addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    vf.querySelector('.vfeature__mute').addEventListener('click', (e) => { e.stopPropagation(); setMuted(!v.muted); });
    setMuted(false);   // audio on by default

    // ── scrub bar: click / drag to seek back and forth ──
    const bar = vf.querySelector('.vfeature__bar'), played = vf.querySelector('.vfeature__played');
    if (bar && played) {
      let scrubbing = false;
      const draw = () => { if (v.duration) played.style.width = (Math.min(1, v.currentTime / v.duration) * 100).toFixed(2) + '%'; };
      const seekAt = (clientX) => {
        const r = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        if (v.duration) { v.currentTime = ratio * v.duration; played.style.width = (ratio * 100).toFixed(2) + '%'; }
      };
      v.addEventListener('timeupdate', () => { if (!scrubbing) draw(); });
      v.addEventListener('loadedmetadata', draw);
      bar.addEventListener('pointerdown', (e) => { e.stopPropagation(); scrubbing = true; try { bar.setPointerCapture(e.pointerId); } catch (_) {} seekAt(e.clientX); });
      bar.addEventListener('pointermove', (e) => { if (scrubbing) seekAt(e.clientX); });
      const endScrub = (e) => { if (scrubbing) { scrubbing = false; e.stopPropagation(); } };
      bar.addEventListener('pointerup', endScrub);
      bar.addEventListener('pointercancel', endScrub);
      bar.addEventListener('click', (e) => e.stopPropagation());   // the bar seeks; don't toggle play
    }

    let started = false;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!started) {                       // first time it scrolls in → start WITH sound
            started = true; setMuted(false);
            v.play().catch(() => { setMuted(true); v.play().catch(() => {}); });   // blocked w/ audio → muted fallback
          } else if (v.paused) { v.play().catch(() => {}); }
        } else if (!en.isIntersecting) {
          v.pause();
        }
      }
    }, { threshold: [0, 0.5] });
    io.observe(v);
  })();

  // pause muzak + the feature video when the tab/page is hidden; resume on return
  const fvid = document.querySelector('.vfeature__vid');
  let bgmWasOn = false, fvWasOn = false;
  function pauseMedia() {
    bgmWasOn = !!(bgm && !bgm.paused); fvWasOn = !!(fvid && !fvid.paused);
    clearInterval(bgmFadeT); if (bgm) bgm.pause(); if (fvid) fvid.pause();
  }
  function resumeMedia() {
    if (bgm && bgmWasOn && soundOn()) bgm.play().catch(() => {});
    if (fvid && fvWasOn) fvid.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseMedia(); else resumeMedia(); });
  window.addEventListener('pagehide', pauseMedia);

  /* ---- the "eternal september" scrolling separator between the hero and the paper body ---- */
  const esTrack = $('es-track');
  if (esTrack) {
    const run = 'eternal september · '.repeat(18);   // duplicated for a seamless -50% loop
    esTrack.innerHTML = '<span class="es-run">' + run + '</span><span class="es-run">' + run + '</span>';
  }

  /* ---- easter egg: Cmd/Ctrl+Shift+L puts a cursor-tracking eye on the "A" in "The Last Psyop" ---- */
  const setTitleEye = (function titleEye() {
    const eye = document.querySelector('.lp-a-eye');
    const gaze = eye && eye.querySelector('.lp-a-eye__gaze');
    if (!eye || !gaze) return () => {};
    let px = 0, py = 0, tgx = 0, tgy = 0, gx = 0, gy = 0, raf = 0, on = false;
    const MAXX = 14, MAXY = 10, REACH = 240;   // iris drift (viewBox units) + how fast it maxes out (px)
    function aim() {
      const r = eye.getBoundingClientRect(); if (!r.width) return;   // 0 while the reveal is still hidden
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = px - cx, dy = py - cy, len = Math.hypot(dx, dy) || 1, reach = Math.min(1, len / REACH);
      tgx = (dx / len) * MAXX * reach; tgy = (dy / len) * MAXY * reach;
    }
    function loop() {
      gx += (tgx - gx) * 0.2; gy += (tgy - gy) * 0.2;            // ease toward the target so the eye glides
      gaze.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
      raf = on ? requestAnimationFrame(loop) : 0;                // loop only while the eye is on
    }
    addEventListener('pointermove', (e) => { if (!on) return; px = e.clientX; py = e.clientY; aim(); }, { passive: true });
    return (state) => {
      on = state;
      if (on) { if (!raf) raf = requestAnimationFrame(loop); }
      else { tgx = tgy = gx = gy = 0; gaze.setAttribute('transform', 'translate(0 0)'); }   // recentre + stop
    };
  })();
  // apply + sync the watching-eye toggle (shared by the gear checkbox and the Cmd/Ctrl+Shift+L shortcut)
  function applyEye(on) { body.classList.toggle('eye-a', on); setTitleEye(on); const c = $('set-eye'); if (c) c.checked = on; }
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.code === 'KeyL' || e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      applyEye(!body.classList.contains('eye-a'));
    }
  });

  /* ---- ⚙ settings gear: handwritten-copy / watching-eye / september-banner toggles ---- */
  (function settings() {
    const gear = $('gear-toggle'), panel = $('settings');
    if (!gear || !panel) return;
    const open = (o) => { panel.hidden = !o; gear.setAttribute('aria-expanded', String(o)); };
    gear.addEventListener('click', (e) => { e.stopPropagation(); open(panel.hidden); });
    document.addEventListener('click', (e) => { if (!panel.hidden && !gear.contains(e.target) && !panel.contains(e.target)) open(false); });
    const cHand = $('set-handwriting'), cEye = $('set-eye'), cSep = $('set-september');
    if (cHand) cHand.addEventListener('change', () => body.classList.toggle('font-default', !cHand.checked));  // off → revert to the serif
    if (cEye) cEye.addEventListener('change', () => applyEye(cEye.checked));
    if (cSep) cSep.addEventListener('change', () => body.classList.toggle('no-september', !cSep.checked));       // off → hide the marquee
    // Cmd/Ctrl+Shift+I reveals the (hidden-by-default) gear and opens the panel; press again to hide both
    addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        open(body.classList.toggle('show-gear'));
      }
    });
  })();
  applyEye(body.classList.contains('eye-a'));   // default-on: start tracking + sync the checkbox

  /* ---- allow the puzzle to be skipped: ?reveal jumps straight into The Last Psyop ---- */
  if (location.search.includes('reveal')) {
    if (P.markBlessed) P.markBlessed();    // tell the gate it's solved so the eye stops reacting
    reveal(true);
  }
})();
