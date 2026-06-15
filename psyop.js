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
        eyeHit = $('eyeHit'), crease = $('crease'), heart = $('heart'), boom = $('boom'),
        hero = $('hero'), revealEl = $('reveal');
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
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://web.english.upenn.edu/~cavitch/pdf-library/Bernays_Propaganda.pdf',       // Bernays — Propaganda
    'https://en.wikipedia.org/wiki/Born_secret',
    'https://dn790007.ca.archive.org/0/items/pdfy-NekqfnoWIEuYgdZl/Manufacturing%20Consent%20%5BThe%20Political%20Economy%20Of%20The%20Mass%20Media%5D.pdf',  // Herman & Chomsky
    'https://www.cnn.com/world',
    'https://www.foxnews.com/world',
    'https://www.nytimes.com/section/world',
  ];

  // kick off the reveal-asset loads immediately (the <link rel=preload> in <head> starts the
  // network fetch). assetsReady resolves once the LED font + serifs are loaded AND the background
  // video has its first frame decoded — the reveal waits on it, so it never flashes black.
  const revvid = document.getElementById('revvid');
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

  const toSvg = (cx, cy) => {
    const r = hazard.getBoundingClientRect();
    const s = Math.min(r.width / 600, r.height / 560);
    return { x: (cx - r.left - (r.width - 600 * s) / 2) / s, y: (cy - r.top - (r.height - 560 * s) / 2) / s };
  };
  const eyeCenterScreen = () => { const r = eyeHit.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const heartCenterScreen = () => { const r = heart.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  // is an SVG-space point inside the warning triangle? (vertices A,B,C)
  function inTriangle(px, py) {
    const A = [300, 46], B = [542, 498], C = [58, 498];
    const sign = (a, b) => (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d1 = sign(A, B), d2 = sign(B, C), d3 = sign(C, A);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  /* ---- pointer helpers (mouse + touch unified) ---- */
  const overRect = (el, x, y, m) => { const r = el.getBoundingClientRect(); return x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m; };
  const overEye = (x, y) => overRect(eyeHit, x, y, 36);          // generous — for dropping the heart
  const overHeart = (x, y) => overRect(heart, x, y, 14);   // tight — you must actually tap/touch the heart
  const onEye = (x, y) => {                                      // tight — the visible eye only (NOT the triangle)
    const r = eyeHit.getBoundingClientRect();
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

  function applyIntensity(t) {
    if (typeof clicking !== 'undefined' && clicking) return;   // click sequence owns the visuals
    if (blessed) {
      for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', PINK[i]);
      pupil.setAttribute('r', '23');
      gaze.style.filter = 'drop-shadow(0 0 14px #ff8fd0)';
      root.style.setProperty('--dread', '0'); if (typeof redTri !== 'undefined') redTri.setAttribute('opacity', '0'); hazard.style.transform = '';
      return;
    }
    const ct = Math.min(1, t);
    for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', toHex(mix(COOL[i], HOT[i], ct)));
    // round pupil; widens (and accelerates) with fear — widest when the held heart nears the eye
    pupil.setAttribute('r', (20 + Math.pow(ct, 1.4) * 24).toFixed(1));
    gaze.style.filter = `drop-shadow(0 0 ${(6 + t * 22).toFixed(0)}px ${toHex(mix(GLOW_COOL, GLOW_HOT, ct))})`;
    if (!busy) {   // proximity glow; while busy (the click pulse) the pulse owns the red via style.opacity
      redTri.style.opacity = '';
      redTri.setAttribute('opacity', Math.min(0.85, t * 0.6 + (dragging ? 0.18 : 0)).toFixed(3));
    }
    const j = t * t * 10 + (dragging ? 6 : 0);     // shakier while the heart is held
    if (j > 0.8) hazard.style.transform = `translate(${((Math.random() - .5) * j).toFixed(1)}px,${((Math.random() - .5) * j).toFixed(1)}px)`;
    else hazard.style.transform = '';
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
  let spinning = false;
  const EYE_CX = 300, EYE_CY = 355;                  // the pupil / eye centre (the flip lands here)
  // per-glyph placement, dialed in via demo_test.html (each symbol's optical centre/size differs)
  const SYM_CFG = {
    '☣': { cx: 298, cy: 305, size: 334 },
    '☢': { cx: 301, cy: 328, size: 340 },
  };
  const flipSym = document.createElementNS(SVGNS, 'text');
  flipSym.id = 'flipSym';
  flipSym.setAttribute('x', EYE_CX); flipSym.setAttribute('y', EYE_CY);
  flipSym.setAttribute('text-anchor', 'middle');     // (no dominant-baseline — its emoji metrics differ per browser)
  flipSym.setAttribute('fill', '#0c0c0c');
  hazard.appendChild(flipSym);
  // set a glyph at its tuned centre/size, then fine-centre by ACTUAL rendered bounds (cross-browser)
  function setFace(ch) {
    const c = SYM_CFG[ch] || { cx: 300, cy: 342, size: 248 };
    flipSym.textContent = ch;
    flipSym.setAttribute('font-size', c.size);
    flipSym.setAttribute('x', c.cx); flipSym.setAttribute('y', c.cy);
    // Centre the ACTUAL rendered glyph box on (c.cx, c.cy). Emoji metrics differ per engine
    // (Firefox renders ☣/☢ larger + shifted vs Chrome), so correcting Y only left them off-centre
    // in Firefox — compensate on BOTH axes from the measured bounds → consistent across browsers.
    try {
      const bb = flipSym.getBBox();
      flipSym.setAttribute('x', (c.cx + (c.cx - (bb.x + bb.width / 2))).toFixed(1));
      flipSym.setAttribute('y', (c.cy + (c.cy - (bb.y + bb.height / 2))).toFixed(1));
    } catch (e) {}
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
  //startSpin();

  (function tick() {
    intensity += ((blessed ? 0 : targetInt) - intensity) * 0.12;
    openness += (1 - openness) * 0.16;                 // the eye stays open
    gx += (tgx - gx) * 0.14; gy += (tgy - gy) * 0.14;
    if (!busy) lid.setAttribute('transform', `translate(${EX} ${EY}) scale(1 ${openness.toFixed(4)}) translate(${-EX} ${-EY})`);
    gaze.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
    crease.style.opacity = (1 - Math.min(1, openness * 1.25)).toFixed(3);
    applyIntensity(intensity);
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
    heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.left = ''; heart.style.top = '';
    tgx = tgy = gx = gy = 0; targetInt = intensity = 0;
    gaze.style.filter = 'none'; redTri.style.opacity = '0';
    pupil.removeAttribute('mask'); pupil.setAttribute('r', '22'); pupil.style.fill = '#0a0608';
    redi.innerHTML = RI_HEART; redi.style.opacity = '1'; puzzle(0);   // the "i" becomes a heart (1st unlock sound)
    [irisC, scleraE, triEl].forEach((el) => { el.style.transition = 'fill .16s linear'; });
    const PINK = '#ff8fd0';
    const STEPS = [irisC, scleraE, triEl];                            // pink fills section by section
    let i = 0;
    (function step() {
      if (i >= STEPS.length) { puzzle(4); explode(); reveal(); return; }   // triangle full → burst + UNLOCK sound + transition
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // only fade the text in once the LED font + video frame are ready, so the title never flashes
      // in the fallback font and the backdrop is already painted
      assetsReady.finally(() => requestAnimationFrame(() => { revealEl.classList.add('show'); sfx.reveal(); }));
    }, instant ? 0 : 1000);
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
  const moveHeart = (x, y) => { heart.style.left = x + 'px'; heart.style.top = y + 'px'; };
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
  const dropHeart = () => { stopShimmer(); sfx.drop(); heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.left = ''; heart.style.top = ''; };
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
    applyIntensity(0);   // force the resting visuals immediately (don't wait for the rAF tick)
  }
  // only reset on a bfcache RESTORE (e.persisted) — a fresh load must let the opening flip play.
  // Firefox repaints the bfcache-frozen (red) frame AFTER pageshow fires, which re-reds the triangle
  // right after resetEye() clears it. The eye self-corrects (the rAF tick repaints it every frame) but
  // the triangle fill is cleared only once — so re-assert the reset on the next frames to win the race.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    resetEye();
    requestAnimationFrame(resetEye);
    requestAnimationFrame(() => requestAnimationFrame(resetEye));
  });
  window.addEventListener('pagehide', resetEye);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !spinning) resetEye(); });

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

  /* ---- background muzak (fades in on reveal) + ONE top-right toggle for music & SFX ---- */
  const bgm = $('bgm'), bgmBtn = $('bgm-toggle');
  let bgmFadeT = 0;
  function bgmFadeIn() {
    if (!bgm || !soundOn) return;
    try { bgm.volume = 0; bgm.play().catch(() => {}); } catch (e) { return; }
    clearInterval(bgmFadeT);
    bgmFadeT = setInterval(() => {                 // ~2s ramp to a soft background level
      bgm.volume = Math.min(0.4, bgm.volume + 0.01);
      if (bgm.volume >= 0.4) clearInterval(bgmFadeT);
    }, 50);
  }
  if (bgmBtn) bgmBtn.addEventListener('click', () => {
    soundOn = !soundOn;                            // master switch: music + all SFX (tone()/puzzle() check it)
    bgmBtn.classList.toggle('is-off', !soundOn);
    bgmBtn.setAttribute('aria-pressed', String(soundOn));
    if (soundOn) bgmFadeIn(); else if (bgm) { clearInterval(bgmFadeT); bgm.pause(); }
  });

  // pause music + feature video + the hold shimmer when the tab/page is hidden; resume on return
  const fvid = document.querySelector('.vfeature__vid');
  let bgmWasOn = false, fvWasOn = false;
  function pauseMedia() {
    bgmWasOn = !!(bgm && !bgm.paused); fvWasOn = !!(fvid && !fvid.paused);
    clearInterval(bgmFadeT); if (bgm) bgm.pause(); if (fvid) fvid.pause(); stopShimmer();
  }
  function resumeMedia() {
    if (bgm && bgmWasOn && soundOn) bgm.play().catch(() => {});
    if (fvid && fvWasOn) fvid.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseMedia(); else resumeMedia(); });
  window.addEventListener('pagehide', pauseMedia);

  /* ---- settings panel (gear) + the "eternal september" scrolling separator ---- */
  const esTrack = $('es-track');
  if (esTrack) {
    const run = 'eternal september · '.repeat(18);   // duplicated for a seamless -50% loop
    esTrack.innerHTML = '<span class="es-run">' + run + '</span><span class="es-run">' + run + '</span>';
  }

    /// Allow the puzzle to be skipped

    if (location.search.includes('reveal')) {
      blessed = true;
      reveal(true);
    }

})();


