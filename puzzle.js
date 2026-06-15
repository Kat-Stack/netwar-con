/* The Last Psyop — the eye (exact gate eye)
 *
 *  - the gate's eye: lid shut until the cursor moves, pupil tracks it, iris
 *    reddens + a red dread wash blooms as you get close, info-"i" in the pupil
 *  - CLICK the eye → a random rabbit hole (psyop history / war-news front page)
 *  - DRAG the ❤️ onto the eye → it blinks twice, the "i" becomes a heart, hearts
 *    erupt from the eye, and the page fades into "The Last Psyop"
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement, body = document.body;
  const hazard = $('hazard'), lid = $('lid'), gaze = $('gaze'), pupil = $('pupil'),
        eyeHit = $('eyeHit'), crease = $('crease'), heart = $('heart'), boom = $('boom');
        // (#hero fade-out + #reveal live in landing.js now)
  const irisStops = ['s0', 's1', 's2', 's3'].map($);

  /* ---- geometry (viewBox 600×560) ---- */
  const EX = 300, EY = 355, GAZE_X = 34, GAZE_Y = 20, REACH = 260;
  const HEART_FAR = 480, DRAG_FAR = 540;   // anger ramps with cursor→heart / heart→eye distance

  /* ---- colour ---- */
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const COOL = ['#fffbd0', '#f2dd00', '#a07a00', '#3a2a00'].map(hex);  // yellow/amber iris (no green)
  const HOT  = ['#ffe3d6', '#ff2a00', '#5e0a00', '#180200'].map(hex);
  const PINK = ['#ffe1f0', '#ff5fa6', '#a8005a', '#3a0020'];
  const GLOW_COOL = hex('#eaff00'), GLOW_HOT = hex('#ff1500');

  /* ---- state ---- */
  let openness = 1, gx = 0, gy = 0, tgx = 0, tgy = 0;   // start open & ready (no load-time blink)
  let intensity = 0, targetInt = 0;
  let blessed = false, dragging = false, busy = false, woken = false;
  let heartX = 0, heartY = 0;                           // tracked drag position (avoids reading the heart's rect)

  // the rabbit holes the eye throws you into
  const LINKS = [
    'https://en.wikipedia.org/wiki/Operation_Mockingbird',
    'https://en.wikipedia.org/wiki/Project_MKUltra',
    'https://en.wikipedia.org/wiki/Operation_INFEKTION',
    'https://en.wikipedia.org/wiki/COINTELPRO',
    'https://en.wikipedia.org/wiki/Operation_Northwoods',
    'https://en.wikipedia.org/wiki/Active_measures',
    'https://en.wikipedia.org/wiki/Gulf_of_Tonkin_incident',
    'https://en.wikipedia.org/wiki/Operation_Gladio',
    'https://en.wikipedia.org/wiki/Operation_Paperclip',
    'https://en.wikipedia.org/wiki/Psychological_warfare',
    'https://en.wikipedia.org/wiki/Psychological_operations_(United_States)',
    'https://en.wikipedia.org/wiki/Ghost_Army',
    'https://en.wikipedia.org/wiki/Memetic_warfare',
    'https://en.wikipedia.org/wiki/Information_warfare',
    'https://www.lesswrong.com/w/information-hazards',
    'https://en.wikipedia.org/wiki/USS_Liberty_incident',
    'https://en.wikipedia.org/wiki/Lavon_Affair',
    'https://es.wikipedia.org/wiki/Folke_Bernadotte',
    'https://en.wikipedia.org/wiki/Project_Blue_Book',
    'https://www.cia.gov/readingroom/docs/CIA-RDP96-00789R002800180001-2.pdf',      // CIA Gateway Process
    'https://www.ussc.gov/sites/default/files/pdf/training/annual-national-training-seminar/2018/Emerging_Tech_Bitcoin_Crypto.pdf',
    'https://www.goodreads.com/book/show/57540.The_Ethnic_Cleansing_of_Palestine',  // Ilan Pappé
    'https://www.goodreads.com/book/show/213079154',                                // Hijacking Bitcoin
    'https://www.youtube.com/watch?v=s2b-I0Yqisc',                                  // Bezmenov — Griffin interview
    'https://www.youtube.com/watch?v=yErKTVdETpw',                                  // Bezmenov — four stages
    'https://www.youtube.com/watch?v=g4XiKChyK7A',
    'https://www.youtube.com/watch?v=-gGLvg0n-uY',
    'https://www.youtube.com/watch?v=sjoad6gcRzs',
    'https://youtu.be/FLUUUZWjfGk?si=grdQvVgIuB26P1BV&t=163',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://web.english.upenn.edu/~cavitch/pdf-library/Bernays_Propaganda.pdf',       // Bernays — Propaganda
    'https://en.wikipedia.org/wiki/Born_secret',
    'https://dn790007.ca.archive.org/0/items/pdfy-NekqfnoWIEuYgdZl/Manufacturing%20Consent%20%5BThe%20Political%20Economy%20Of%20The%20Mass%20Media%5D.pdf',  // Herman & Chomsky
    'https://en.wikipedia.org/wiki/Zhemao_hoaxes',                                   // fabricated Russian history on Wikipedia
    'https://en.wikipedia.org/wiki/False_flag',
    'https://en.wikipedia.org/wiki/Memory_hole',
    'https://en.wikipedia.org/wiki/Book_burning',
    'https://www.goodreads.com/en/book/show/929587.Tl_n_Uqbar_Orbis_Tertius',        // Borges — a fiction that rewrites reality
    'https://4chan.org/pol',
    'https://www.cnn.com/world',
    'https://www.foxnews.com/world',
    'https://www.nytimes.com/section/world',
  ];

  // (the reveal-asset warming + the reveal/landing live in landing.js)

  // Cached layout rects: the eye SVG and the resting heart don't move during the puzzle (the page
  // can't scroll here), so reading getBoundingClientRect on every pointer-move forces a synchronous
  // layout (jank). Cache them; invalidate on resize / orientation / scroll.
  let _hazardR = null, _eyeR = null, _heartR = null;
  const hazardR = () => _hazardR || (_hazardR = hazard.getBoundingClientRect());
  const eyeR    = () => _eyeR    || (_eyeR    = eyeHit.getBoundingClientRect());
  const heartR  = () => _heartR  || (_heartR  = heart.getBoundingClientRect());
  const invalidateRects = () => { _hazardR = _eyeR = _heartR = null; };
  addEventListener('resize', invalidateRects);
  addEventListener('orientationchange', invalidateRects);
  addEventListener('scroll', invalidateRects, { passive: true });

  const toSvg = (cx, cy) => {
    const r = hazardR();
    const s = Math.min(r.width / 600, r.height / 560);
    return { x: (cx - r.left - (r.width - 600 * s) / 2) / s, y: (cy - r.top - (r.height - 560 * s) / 2) / s };
  };
  const eyeCenterScreen = () => { const r = eyeR(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  // while held, the heart rides the pointer (we track heartX/Y) — use that, not its rect; at rest the cached rect is right
  const heartCenterScreen = () => {
    if (dragging) return { x: heartX, y: heartY };
    const r = heartR(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  // is an SVG-space point inside the warning triangle? (vertices A,B,C)
  function inTriangle(px, py) {
    const A = [300, 46], B = [542, 498], C = [58, 498];
    const sign = (a, b) => (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d1 = sign(A, B), d2 = sign(B, C), d3 = sign(C, A);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  /* ---- pointer helpers (mouse + touch unified) ---- */
  const overRectC = (r, x, y, m) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
  const overEye = (x, y) => overRectC(eyeR(), x, y, 36);          // generous — for dropping the heart
  const overHeart = (x, y) => overRectC(heartR(), x, y, 14);   // tight — you must actually tap/touch the heart (always checked at rest)
  const onEye = (x, y) => {                                      // tight — the visible eye only (NOT the triangle)
    const r = eyeR();
    const nx = (x - (r.left + r.width / 2)) / (r.width / 2 * 0.85);
    const ny = (y - (r.top + r.height / 2)) / (r.height / 2 * 0.85);
    return nx * nx + ny * ny <= 1;
  };

  function updateGaze(x, y) {                         // the eye follows the cursor / finger
    const p = toSvg(x, y);
    if (!woken) { if (inTriangle(p.x, p.y)) woken = true; else { tgx = 0; tgy = 0; targetInt = 0; return false; } }
    const dx = p.x - EX, dy = p.y - EY, len = Math.hypot(dx, dy) || 1, reach = Math.min(1, len / REACH);
    tgx = (dx / len) * GAZE_X * reach; tgy = (dy / len) * GAZE_Y * reach;
    return true;
  }
  function updateAnger(x, y) {                        // anger from the HEART (worse near the eye while held)
    if (dragging) {
      const ec = eyeCenterScreen();
      const near = 1 - Math.min(1, Math.hypot(x - ec.x, y - ec.y) / DRAG_FAR);
      targetInt = 0.66 + near * 0.34;
    } else {
      const hc = heartCenterScreen();
      const near = 1 - Math.min(1, Math.hypot(x - hc.x, y - hc.y) / HEART_FAR);
      targetInt = (near * 0.82) ** 1.4;
    }
  }

  // change-detection caches: tick() calls applyIntensity every frame, but at rest the intensity is
  // flat — re-writing the iris stops, pupil radius and (costly) drop-shadow filter every frame just
  // burns paint. Only write when the rounded value actually moves. resetEye() invalidates these.
  let _aiCt = -1, _aiRed = -1, _aiJit = false, _aiBless = null;
  let _restoreFrames = 0;   // after a reset/bfcache-restore, re-assert the triangle's resting fill for ~0.6s
  function applyIntensity(t) {
    if (typeof clicking !== 'undefined' && clicking) return;   // click sequence owns the visuals
    if (blessed) {
      if (_aiBless !== true) {                                 // paint the pink resting visuals once
        _aiBless = true; _aiCt = -1; _aiRed = -1;
        for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', PINK[i]);
        pupil.setAttribute('r', '23');
        gaze.style.filter = 'drop-shadow(0 0 14px #ff8fd0)';
        root.style.setProperty('--dread', '0');
        if (typeof redTri !== 'undefined') redTri.setAttribute('opacity', '0');
        if (_aiJit) { hazard.style.transform = ''; _aiJit = false; }
      }
      return;
    }
    _aiBless = false;
    const ct = Math.min(1, t), ctR = Math.round(ct * 256) / 256;
    if (ctR !== _aiCt) {                                       // iris colour + pupil + glow only move with intensity
      _aiCt = ctR;
      for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', toHex(mix(COOL[i], HOT[i], ctR)));
      pupil.setAttribute('r', (20 + Math.pow(ctR, 1.4) * 24).toFixed(1));   // widens with fear
      gaze.style.filter = `drop-shadow(0 0 ${(6 + ctR * 22).toFixed(0)}px ${toHex(mix(GLOW_COOL, GLOW_HOT, ctR))})`;
    }
    if (!busy) {   // proximity glow; while busy (the click pulse) the pulse owns the red via style.opacity
      const roR = Math.round(Math.min(0.85, t * 0.6 + (dragging ? 0.18 : 0)) * 256) / 256;
      if (roR !== _aiRed) { _aiRed = roR; redTri.style.opacity = ''; redTri.setAttribute('opacity', roR.toFixed(3)); }
    }
    const j = t * t * 10 + (dragging ? 6 : 0);     // shakier while the heart is held
    if (j > 0.8) { hazard.style.transform = `translate(${((Math.random() - .5) * j).toFixed(1)}px,${((Math.random() - .5) * j).toFixed(1)}px)`; _aiJit = true; }
    else if (_aiJit) { hazard.style.transform = ''; _aiJit = false; }   // reset the shake once, not every idle frame
  }

  /* ░░░ DEMO extras: triangle-contained red glow · casino reel landing on the eye · click→pulsing red "i" + rising beeps ░░░ */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgDefs = hazard.querySelector('defs');
  const TRI_PTS = '300,46 542,498 58,498';

  // (a) red glow that STAYS INSIDE the triangle — it's a triangle-shaped fill, so red can't leak out/to the sides
  const rgGrad = document.createElementNS(SVGNS, 'radialGradient');
  rgGrad.id = 'redGlowGrad';
  rgGrad.setAttribute('cx', '50%'); rgGrad.setAttribute('cy', '70%'); rgGrad.setAttribute('r', '45%');
  rgGrad.innerHTML =
    '<stop offset="0%" stop-color="#ff2a00" stop-opacity="0.95"/>' +
    '<stop offset="46%" stop-color="#cc0a00" stop-opacity="0.5"/>' +
    '<stop offset="100%" stop-color="#5a0000" stop-opacity="0"/>';
  svgDefs.appendChild(rgGrad);
  const redTri = document.createElementNS(SVGNS, 'polygon');
  redTri.setAttribute('points', TRI_PTS);
  redTri.setAttribute('fill', 'url(#redGlowGrad)');
  redTri.setAttribute('opacity', '0');
  redTri.setAttribute('pointer-events', 'none');
  $('triangle').after(redTri);   // above the yellow triangle fill, below the eye → eye stays visible on top

  // the eye parts we flatten on click/bless (flat fills, no shine)
  const irisC = $('irisC'), scleraE = $('scleraE'), triEl = $('triangle');

  // (b) the mark over the pupil — a red "i" (on click) that morphs into a pink heart (on bless).
  //     it lives INSIDE #gaze so it tracks and stays centred in the pupil as the eye looks around.
  const RI_I = '<circle cx="300" cy="346.5" r="3.8" fill="#ff3b1a"/><rect x="296.6" y="351.3" width="6.8" height="14.4" rx="3.4" fill="#ff3b1a"/>';
  const RI_HEART = '<path d="M300 367 C316 353 311 340 300 348 C289 340 284 353 300 367 Z" fill="#ff8fd0"/>';
  const redi = document.createElementNS(SVGNS, 'g');
  redi.id = 'redi'; redi.setAttribute('pointer-events', 'none');
  redi.innerHTML = RI_I;
  redi.style.opacity = '0';
  redi.style.transformBox = 'fill-box'; redi.style.transformOrigin = 'center';
  gaze.appendChild(redi);   // inside #gaze → moves with the pupil
  let clicking = false;   // while a click/bless sequence runs, the per-frame applyIntensity stands down

  // (c) tasteful SFX — all synthesized (no asset files), soft, and only audible after a user
  //     gesture (browser autoplay policy). A master gain keeps everything quiet; a gentle lowpass
  //     warms it. Nothing loops or plays ambiently — sound only on deliberate interactions.
  let audioCtx = null, master = null, soundOn = true;   // master sound switch (music + SFX)
  function audio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        master = audioCtx.createGain(); master.gain.value = 0.5;
        const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
        master.connect(lp); lp.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  // one soft enveloped tone; optional pitch glide to `to`
  function tone(freq, dur, vol, type, to, delay) {
    if (!soundOn) return;
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.04);
  }
  // the click "loading" beeps (square, a bit louder — it's the alarm)
  function beep(freq, dur, vol) { tone(freq, dur, vol, 'square'); }
  const sfx = {
    wake()  { tone(180, 0.5, 0.05, 'sine', 300); tone(360, 0.5, 0.025, 'triangle', 600); },   // low awakening swell
    grab()  { tone(520, 0.16, 0.08, 'sine', 760); },                                          // soft pickup
    drop()  { tone(360, 0.16, 0.05, 'sine', 220); },                                          // soft put-down
    twinkle(){ tone(1300 + Math.random() * 900, 0.09, 0.022, 'triangle'); },                  // faint sparkle
    bless() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 0.07, 'sine', null, i * 0.11)); }, // C-E-G-C chime
    bloom() { tone(196, 0.7, 0.09, 'sine', 90); tone(784, 0.5, 0.04, 'triangle', 1200); },    // warm pop for the heart burst
    reveal(){ tone(110, 1.6, 0.06, 'sine'); tone(164.81, 1.6, 0.045, 'sine'); tone(220, 1.6, 0.03, 'triangle'); }, // low ominous pad
    land()  { tone(880, 0.12, 0.07, 'square'); tone(1318.5, 0.22, 0.08, 'square', null, 0.1); },  // reel landing ding (post-gesture)
  };
  // the lovepill puzzle SFX: four "unlock-step" sounds layer into a chord as the eye fills, then
  // 5.wav is the final unlock for the heart burst (used by the bless / pink-cascade sequence)
  const PUZZLE = ['assets/sfx/1.wav', 'assets/sfx/2.wav', 'assets/sfx/3.wav', 'assets/sfx/4.wav', 'assets/sfx/5.wav']
    .map((s) => { const a = new Audio(s); a.preload = 'auto'; return a; });
  function puzzle(i) { if (!soundOn) return; try { const a = PUZZLE[i]; if (a) { a.currentTime = 0; a.play().catch(() => {}); } } catch (e) {} }

  // (d) the OPENING: large hazard symbols flip in the CENTRE of the triangle — ☣ → ☢ → eye (the 3rd flip)
  const eyeVis = [hazard.querySelector('g[clip-path="url(#eyeClip)"]'), $('rim'), $('crease')].filter(Boolean);
  let spinning = true;   // play the ☣ → ☢ → eye opening flip by default (re-enabled; see startSpin() below)
  const EYE_CX = 300, EYE_CY = 355;                  // the pupil / eye centre (the flip lands here)
  // per-glyph size; the ink is centred on (cx, cy) by canvas measurement in setFace, so we aim the
  // ink centre right at the eye centre (EYE_CX/EYE_CY) — the flip then lands exactly on the eye.
  const SYM_CFG = {
    '☣': { cx: EYE_CX, cy: EYE_CY, size: 334 },
    '☢': { cx: EYE_CX, cy: EYE_CY, size: 340 },
  };
  const SYM_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif";
  const flipSym = document.createElementNS(SVGNS, 'text');
  flipSym.id = 'flipSym';
  flipSym.setAttribute('x', EYE_CX); flipSym.setAttribute('y', EYE_CY);
  flipSym.setAttribute('text-anchor', 'middle');     // (no dominant-baseline — its emoji metrics differ per browser)
  flipSym.setAttribute('font-family', SYM_FONT);     // pin the font so the canvas ink-measure below matches the SVG glyph
  flipSym.setAttribute('fill', '#0c0c0c');
  hazard.appendChild(flipSym);
  // ☣/☢ are emoji glyphs, and every engine seats the emoji at a DIFFERENT vertical offset inside its
  // font metric box (Firefox ~45px lower than Chrome). getBBox() only sees that metric box, not the
  // visible ink — so box-centring can't fix it. Instead rasterise the glyph to a canvas (same font) and
  // measure where the real INK centre sits relative to the baseline / advance-centre; cache per glyph+size.
  const _inkCache = {};
  function inkOffset(ch, size) {
    const key = ch + '@' + size;
    if (_inkCache[key]) return _inkCache[key];
    let off = { dx: 0, dy: 0 };
    try {
      const S = Math.ceil(size * 1.6), base = S * 0.75, cx0 = S / 2;
      const cv = document.createElement('canvas'); cv.width = cv.height = S;
      const ctx = cv.getContext('2d');
      ctx.font = size + 'px ' + SYM_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#000';
      ctx.fillText(ch, cx0, base);
      const d = ctx.getImageData(0, 0, S, S).data;
      let minX = S, maxX = -1, minY = S, maxY = -1;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (d[(y * S + x) * 4 + 3] > 20) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (maxY >= 0) off = { dx: (minX + maxX) / 2 - cx0, dy: (minY + maxY) / 2 - base };
    } catch (e) {}
    _inkCache[key] = off; return off;
  }
  // place a glyph so its real ink centre lands on the tuned (cx, cy) — consistent across browsers
  function setFace(ch) {
    const c = SYM_CFG[ch] || { cx: 300, cy: 342, size: 248 };
    flipSym.textContent = ch;
    flipSym.setAttribute('font-size', c.size);
    const off = inkOffset(ch, c.size);
    flipSym.setAttribute('x', (c.cx - off.dx).toFixed(1));
    flipSym.setAttribute('y', (c.cy - off.dy).toFixed(1));
  }
  // horizontal "card flip" via scaleX (transform attribute → works on every engine, like the lid blink)
  const sx = (el, s) => el.setAttribute('transform', `translate(${EYE_CX} ${EYE_CY}) scale(${s.toFixed(3)} 1) translate(${-EYE_CX} ${-EYE_CY})`);
  const sxEye = (s) => eyeVis.forEach((el) => sx(el, s));
  const easeIO = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  function anim(set, from, to, dur, onEnd) {
    const t0 = performance.now();
    (function f(now) {
      const p = Math.min(1, (now - t0) / dur);
      set(from + (to - from) * easeIO(p));
      if (p < 1) requestAnimationFrame(f); else onEnd && onEnd();
    })(t0);
  }
  function startSpin() {
    eyeVis.forEach((el) => { el.style.opacity = '0'; }); sxEye(0);   // eye hidden until the 3rd flip
    setFace('☣'); sx(flipSym, 0);
    const HALF = 210, HOLD = 360;
    const setSym = (s) => sx(flipSym, s);
    anim(setSym, 0, 1, HALF, () => {                                  // flip 1 — biohazard appears
      setTimeout(() => anim(setSym, 1, 0, HALF, () => {               // flip 2 — to radioactive
        setFace('☢');
        anim(setSym, 0, 1, HALF, () => {
          setTimeout(() => anim(setSym, 1, 0, HALF, () => {           // flip 3 — to the eye
            flipSym.remove(); sfx.land();
            eyeVis.forEach((el) => { el.style.opacity = '1'; });
            anim(sxEye, 0, 1, HALF + 50, () => {
              eyeVis.forEach((el) => el.removeAttribute('transform'));  // identity → lid/gaze resume normally
              spinning = false;
            });
          }), HOLD);
        });
      }), HOLD);
    });
  }
  startSpin();   // the opening: biohazard → radioactive → eye flips into the triangle centre

  (function tick() {
    intensity += ((blessed ? 0 : targetInt) - intensity) * 0.12;
    openness += (1 - openness) * 0.16;                 // the eye stays open
    gx += (tgx - gx) * 0.14; gy += (tgy - gy) * 0.14;
    if (!busy) lid.setAttribute('transform', `translate(${EX} ${EY}) scale(1 ${openness.toFixed(4)}) translate(${-EX} ${-EY})`);
    gaze.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
    crease.style.opacity = (1 - Math.min(1, openness * 1.25)).toFixed(3);
    applyIntensity(intensity);
    // After a bfcache restore (Back from a rabbit hole) Firefox keeps painting the frozen alarm-red
    // triangle even though resetEye() already cleared the style. CLEARING an inline fill doesn't
    // reliably repaint in that path — the iris recovers only because applyIntensity actively re-SETS
    // its gradient stops. So for a short window after a reset, re-assert the resting fill with an
    // ALTERNATING value: a guaranteed value-change forces a real repaint every frame and flushes the
    // stale red whenever Firefox finally composites the restored page. Gated so a fresh alarm wins.
    if (_restoreFrames > 0 && !clicking && !busy && !blessed) {
      _restoreFrames--;
      const y = (_restoreFrames & 1) ? '#f2dd01' : '#f2dd00';   // 2 imperceptible yellows; settles on #f2dd00
      triEl.style.fill = y; scleraE.style.fill = y;
    }
    requestAnimationFrame(tick);
  })();

  /* ---- heart explosion from the eye ---- */
  function explode() {
    const c = eyeCenterScreen();
    boom.style.display = 'block';
    boom.style.width = innerWidth + 'px'; boom.style.height = innerHeight + 'px';
    const ctx = boom.getContext('2d');
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    boom.width = innerWidth * DPR; boom.height = innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // pre-render a few glowing heart sprites ONCE — drawImage()'ing these per frame is far cheaper
    // than the old per-heart fillText + shadowBlur (canvas shadowBlur was the main cause of the lag).
    const SPR = 64, sprites = [];
    for (let k = 0; k < 5; k++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = SPR;
      const sx = cv.getContext('2d');
      sx.translate(SPR / 2, SPR / 2);
      sx.fillStyle = `hsl(${330 + k * 6},100%,${64 + k * 2}%)`;
      sx.shadowColor = sx.fillStyle; sx.shadowBlur = 7;          // glow baked in here, not every frame
      sx.font = `bold ${(SPR * 0.66) | 0}px ui-monospace, Menlo, monospace`;
      sx.textAlign = 'center'; sx.textBaseline = 'middle';
      sx.fillText('♥', 0, 0);
      sprites.push(cv);
    }

    const N = window.matchMedia('(max-width: 640px)').matches ? 64 : 100;   // fewer hearts
    const P = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 12;
      P.push({
        x: c.x + (Math.random() - .5) * 8, y: c.y + (Math.random() - .5) * 8,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
        spr: sprites[(Math.random() * sprites.length) | 0],
        size: 17 + Math.random() * 20, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .4, gone: false,
      });
    }
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const el = Math.max(0, t - t0);
      if (el < 200) {
        const fa = 1 - el / 200, fr = 10 + (1 - fa) * 90;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, fr);
        g.addColorStop(0, `rgba(255,180,220,${0.9 * fa})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, fr, 0, 7); ctx.fill();
      }
      let alive = 0;
      for (const p of P) {
        if (p.gone) continue;
        p.vy += 0.15; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.rot += p.vr;   // gravity carries them off
        // a heart vanishes by flying off screen: full opacity on-screen, a soft fade across a
        // margin band as it crosses an edge (left/right/bottom — upward ones arc back down via gravity)
        const m = p.size + 50;
        const over = Math.max(-p.x, p.x - innerWidth, p.y - innerHeight, 0);
        if (over >= m) { p.gone = true; continue; }                            // fully off screen
        alive++;
        const d = p.size * 1.7;
        ctx.globalAlpha = 1 - over / m;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.drawImage(p.spr, -d / 2, -d / 2, d, d);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);   // reset transform (cheaper than save/restore per heart)
      }
      ctx.globalAlpha = 1;
      // end only once every heart has flown off (never a hard mid-air cut); el cap is just a safety net
      if (alive > 0 && el < 7000) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, innerWidth, innerHeight); boom.style.display = 'none'; }
    })(t0);
  }

  /* ---- blessing: bubblegum-pink floods in (iris → sclera → triangle) with the "i" as a heart,
     RISING tones; when the pink fills the triangle, the heart bursts and we cross to The Last Psyop ---- */
  function bless() {
    if (blessed) return; blessed = true; busy = true; clicking = true;
    stopShimmer();
    heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.transform = ''; heart.style.left = ''; heart.style.top = '';
    tgx = tgy = gx = gy = 0; targetInt = intensity = 0;
    gaze.style.filter = 'none'; redTri.style.opacity = '0';
    pupil.removeAttribute('mask'); pupil.setAttribute('r', '22'); pupil.style.fill = '#0a0608';
    redi.innerHTML = RI_HEART; redi.style.opacity = '1'; puzzle(0);   // the "i" becomes a heart (1st unlock sound)
    [irisC, scleraE, triEl].forEach((el) => { el.style.transition = 'fill .16s linear'; });
    const PINK = '#ff8fd0';
    const STEPS = [irisC, scleraE, triEl];                            // pink fills section by section
    let i = 0;
    (function step() {
      if (i >= STEPS.length) { puzzle(4); explode(); if (window.PSYOP && PSYOP.reveal) PSYOP.reveal(false); return; }   // triangle full → burst + UNLOCK sound + cross to landing.js
      const el = STEPS[i]; const last = i === STEPS.length - 1;
      puzzle(i + 1);                                                  // lovepill unlock-step sounds (2,3,4) layer up
      el.style.fill = PINK; i++;
      redi.style.transition = 'none'; redi.style.opacity = '1'; redi.style.transform = 'scale(1.22)';
      requestAnimationFrame(() => {
        redi.style.transition = 'opacity .3s ease, transform .3s ease';
        redi.style.opacity = '1'; redi.style.transform = 'scale(1)';
      });
      setTimeout(step, last ? 460 : 360);
    })();
  }
  /* ---- sparkle trail ---- */
  function sparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'sparkle'; s.textContent = Math.random() < 0.28 ? '💫' : '✨';
    s.style.left = (x + (Math.random() - .5) * 18) + 'px';
    s.style.top = (y + (Math.random() - .5) * 18) + 'px';
    s.style.fontSize = (12 + Math.random() * 12) + 'px';
    s.style.setProperty('--dx', ((Math.random() - .5) * 34).toFixed(0) + 'px');
    s.style.setProperty('--dy', (10 + Math.random() * 32).toFixed(0) + 'px');
    body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }

  /* ---- unified pointer handling (mouse + touch) ---- */
  let lastSpX = 0, lastSpY = 0, pdown = false, downX = 0, downY = 0, moved = false;
  // move via transform (GPU compositor) instead of left/top (which reflows every pointer-move)
  const moveHeart = (x, y) => { heartX = x; heartY = y; heart.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; };
  // fairy-dust shimmer while holding the heart — sweet bell sparkles that quicken + swell as the
  // heart nears the eye and slow + soften as it drifts away
  // a sweet music-box twinkle: a note from a major-pentatonic scale (always consonant) as a soft
  // sine bell + a quiet octave shimmer — warm, not the old squeaky high random tones
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];
  function fairy(vol) {
    const f = PENTA[(Math.random() * PENTA.length) | 0];
    tone(f, 0.55, vol, 'sine');                 // gentle bell-like decay
    tone(f * 2, 0.4, vol * 0.35, 'sine', null, 0.01);   // soft octave shimmer
  }
  let shimmerT = 0;
  function startShimmer() {
    clearTimeout(shimmerT);
    (function tickShimmer() {
      if (!dragging) return;
      const ec = eyeCenterScreen(), hc = heartCenterScreen();
      const t = Math.min(1, Math.hypot(hc.x - ec.x, hc.y - ec.y) / 460);   // 0 = on the eye, 1 = far
      fairy(0.34 - t * 0.22);                           // audible + warm; louder near the eye
      shimmerT = setTimeout(tickShimmer, 150 + t * 360);  // faster near, slower far
    })();
  }
  function stopShimmer() { clearTimeout(shimmerT); }
  function grab(x, y) {
    const first = !dragging;
    dragging = true; woken = true;                       // set BEFORE startShimmer so its loop runs
    if (first) { sfx.grab(); startShimmer(); }
    heart.classList.add('dragging'); heart.textContent = '💖';
    lastSpX = x; lastSpY = y; targetInt = Math.max(targetInt, 0.85);
    moveHeart(x, y);
  }
  const dropHeart = () => { stopShimmer(); sfx.drop(); heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.transform = ''; heart.style.left = ''; heart.style.top = ''; };
  function alarmAndGo() {                         // tap the eye: red floods in — iris, then sclera, then triangle
    if (busy || spinning) return;
    busy = true; clicking = true; woken = true;   // clicking → applyIntensity stands down; we own the visuals
    tgx = tgy = gx = gy = 0; targetInt = intensity = 0;
    gaze.style.filter = 'none';                   // no shine
    redTri.style.opacity = '0';                   // the proximity glow is off; this is flat fills only
    pupil.removeAttribute('mask'); pupil.setAttribute('r', '22'); pupil.style.fill = '#070605';
    [irisC, scleraE, triEl].forEach((el) => { el.style.transition = 'fill .16s linear'; });
    const RED = '#d60000';
    const url = LINKS[(Math.random() * LINKS.length) | 0];
    const STEPS = [                               // pulse 1 → iris · pulse 2 → sclera · pulse 3 → triangle
      { f: 784, d: 0.13, v: 0.17, el: irisC },    // DESCENDING pitch (alarm winding down)
      { f: 523, d: 0.14, v: 0.21, el: scleraE },
      { f: 330, d: 0.34, v: 0.34, el: triEl },
    ];
    let i = 0;
    (function step() {
      if (i >= STEPS.length) { setTimeout(() => { window.location.href = url; }, 380); return; }
      const s = STEPS[i++], last = i >= STEPS.length;
      beep(s.f, s.d, s.v);
      s.el.style.fill = RED;                      // flat red fills in
      // the "i" pulses bright→dim, scaling only a hair so it stays INSIDE the pupil
      redi.style.transition = 'none'; redi.style.opacity = '1'; redi.style.transform = 'scale(1.12)';
      requestAnimationFrame(() => {
        redi.style.transition = 'opacity .28s ease, transform .28s ease';
        redi.style.opacity = last ? '1' : '0.5'; redi.style.transform = 'scale(1)';
      });
      setTimeout(step, last ? 380 : 300);
    })();
  }

  let firstWake = true;
  window.addEventListener('pointerdown', (e) => {
    if (blessed || spinning) return;
    audio();   // unlock the audio context inside this user gesture so later SFX can play
    if (firstWake) { firstWake = false; sfx.wake(); }
    pdown = true; moved = false; downX = e.clientX; downY = e.clientY;
    if (overHeart(e.clientX, e.clientY)) grab(e.clientX, e.clientY);                 // tap / press the heart
    else { woken = true; updateGaze(e.clientX, e.clientY); updateAnger(e.clientX, e.clientY); }  // any tap wakes it → eye drifts toward the tap
  });
  window.addEventListener('pointermove', (e) => {
    if (blessed || spinning || busy) return;   // freeze the gaze during the click/bless cascade
    if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 8) moved = true;
    if (!dragging && pdown && overHeart(e.clientX, e.clientY)) grab(e.clientX, e.clientY);   // swipe past the heart grabs it
    const awake = updateGaze(e.clientX, e.clientY);                                  // eye locks onto the moving finger
    if (dragging) {
      moveHeart(e.clientX, e.clientY); updateAnger(e.clientX, e.clientY);
      if (Math.hypot(e.clientX - lastSpX, e.clientY - lastSpY) > 14) { sparkle(e.clientX, e.clientY); lastSpX = e.clientX; lastSpY = e.clientY; }
    } else if (awake) updateAnger(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', (e) => {
    if (blessed || spinning) { pdown = false; return; }
    if (dragging) {
      dragging = false;
      if (overEye(e.clientX, e.clientY)) bless();          // let go over the eye → open the site
      else dropHeart();
    } else if (!moved && !busy && onEye(e.clientX, e.clientY)) {
      alarmAndGo();                                        // tap the EYE only (not the triangle) → alarm → rabbit hole
    }
    pdown = false;
  });
  window.addEventListener('pointercancel', () => { if (dragging) { dragging = false; dropHeart(); } pdown = false; });

  // back button / bfcache restore: the page may come back frozen mid-alarm (red eye, busy=true).
  // reset to the calm resting state so a fresh tap fires alarmAndGo() again → a new rabbit hole.
  // forcibly restore a clean, re-clickable RESTING eye on return (bfcache restore / tab re-focus),
  // and repaint now — so a click/bless that left it red or pink never persists when you come back
  function resetEye() {
    if (blessed) return;
    body.classList.remove('alarm');
    busy = false; pdown = false; dragging = false; moved = false; woken = false; spinning = false; clicking = false;
    dropHeart(); stopShimmer();
    targetInt = 0; intensity = 0; tgx = 0; tgy = 0; gx = 0; gy = 0;
    root.style.setProperty('--dread', '0');
    pupil.setAttribute('mask', 'url(#iMask)'); pupil.style.fill = ''; gaze.style.filter = '';
    redi.innerHTML = RI_I;
    redi.style.transition = 'none'; redi.style.opacity = '0'; redi.style.transform = 'scale(1)';
    redTri.style.opacity = ''; redTri.setAttribute('opacity', '0');
    [irisC, scleraE, triEl].forEach((el) => { el.style.transition = 'none'; el.style.fill = ''; el.removeAttribute('transform'); });
    if (flipSym.isConnected) flipSym.remove();
    eyeVis.forEach((el) => { el.style.transition = 'none'; el.style.opacity = '1'; el.removeAttribute('transform'); });
    invalidateRects();                         // layout may have changed while we were away
    _aiCt = _aiRed = -1; _aiBless = null;      // force applyIntensity to repaint the resting visuals
    _restoreFrames = 40;                       // ~0.6s of forced triangle repaints (beats Firefox's bfcache snapshot)
    applyIntensity(0);   // force the resting visuals immediately (don't wait for the rAF tick)
  }
  // only reset on a bfcache RESTORE (e.persisted) — a fresh load must let the opening flip play.
  // resetEye() handles the immediate repaint; the tick() resting self-heal above is the guarantee
  // against Firefox repainting the bfcache-frozen red frame a few frames after pageshow.
  window.addEventListener('pageshow', (e) => { if (e.persisted) resetEye(); });
  window.addEventListener('pagehide', resetEye);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopShimmer(); else if (!spinning) resetEye(); });

  /* ---- master sound toggle (music + SFX). The audio engine + soundOn live here; the muzak in
     landing.js follows the `psyop:sound` event this fires. ---- */
  const bgmBtn = $('bgm-toggle');
  if (bgmBtn) bgmBtn.addEventListener('click', () => {
    soundOn = !soundOn;                            // master switch: music + all SFX (tone()/puzzle() check it)
    bgmBtn.classList.toggle('is-off', !soundOn);
    bgmBtn.setAttribute('aria-pressed', String(soundOn));
    document.dispatchEvent(new CustomEvent('psyop:sound', { detail: { on: soundOn } }));
  });

  /* ---- bridge to landing.js (the reveal half of the page) ---- */
  window.PSYOP = window.PSYOP || {};
  window.PSYOP.isSoundOn = () => soundOn;          // landing's muzak respects the master switch
  window.PSYOP.sfxReveal = () => sfx.reveal();     // the low reveal pad — the SFX engine lives here
  window.PSYOP.markBlessed = () => { blessed = true; };   // the ?reveal skip tells the gate it's solved
})();


