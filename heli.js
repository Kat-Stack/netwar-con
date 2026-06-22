/* Helicopter cursor — demo_v2.html
 *  - the chopper follows the pointer (smoothed), banks into its travel, and faces the
 *    direction it's heading; the blades spin faster while moving
 *  - a synthesized rotor "wokka" plays while the cursor MOVES and fades to a faint idle
 *    (then silence) when it stops — louder/faster with speed
 *  - the heart is grabbed/carried/deployed by the existing psyop.js drag (it just hangs
 *    slung under the chopper via heli.css); nothing about the puzzle changes
 */
(() => {
  'use strict';
  const heli = document.getElementById('heli');
  if (!heli) return;
  const sprite = heli.querySelector('svg');
  const bgmBtn = document.getElementById('bgm-toggle');   // reuse the page's sound on/off

  // Once the puzzle is solved and we cross into the hero/reveal page, the chopper RETIRES: the OS
  // cursor comes back (heli.css drops cursor:none on .revealed) and the rotor SFX fades out + stops.
  const revealed = () => document.body.classList.contains('revealed');
  let off = false;
  function retire() {
    if (off) return; off = true;
    heli.classList.remove('show');
    document.documentElement.style.cursor = '';   // clear the inline cursor:none so the OS cursor returns
    try { if (master && actx) master.gain.setTargetAtTime(0, actx.currentTime, 0.08); } catch (e) {}  // fade the rotor out
    if (actx) setTimeout(() => { try { actx.suspend(); } catch (e) {} }, 300);                          // then stop the engine
  }

  let px = innerWidth / 2, py = innerHeight * 0.6;   // pointer target
  let hx = px, hy = py;                               // smoothed chopper position
  let lpx = px, lpy = py, lastT = 0;
  let vel = 0, vx = 0, face = 1, shown = false, spin = 0, phase = 0, tphase = 0;   // spin/phases drive the rotor (reset on audio resume)

  function onMove(e) {
    if (revealed()) { retire(); return; }   // on the hero page the OS cursor is back; the chopper stays retired
    px = e.clientX; py = e.clientY;
    const now = (performance.now ? performance.now() : Date.now());
    const dt = Math.max(8, now - lastT); lastT = now;
    const dx = px - lpx, dy = py - lpy;
    vel = Math.min(60, Math.max(vel, Math.hypot(dx, dy) / dt * 16));   // spike on move; decays in the loop
    vx = vx * 0.6 + dx * 0.4;
    if (Math.abs(dx) > 1) face = dx > 0 ? 1 : -1;   // face INSTANTLY toward horizontal travel — even slow moves flip it
    lpx = px; lpy = py;
    if (!shown) { shown = true; heli.classList.add('show'); }
    audioStart();   // spin the rotor up the moment the chopper appears
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  // any genuine user gesture unlocks/resumes the audio context (browser autoplay policy); we try
  // on the first move too, so the rotor is live as early as the browser allows — no click needed
  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((ev) =>
    window.addEventListener(ev, audioStart, { passive: true }));

  /* ---- synthesized rotor (its own AudioContext; unlocked on first tap) ---- */
  let actx = null, master = null, amp = null, lfo = null, ready = false;
  function audioStart() {
    // resuming after a suspend (the first real gesture) → start from a DEAD STOP so the rotor doesn't
    // blare on the unlocking click; it spins up only as the cursor/heli actually starts moving.
    if (actx) { if (actx.state === 'suspended') { actx.resume(); spin = 0; vel = 0; } return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = 0;
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      master.connect(lp); lp.connect(actx.destination);
      // blade-chop carrier — a loop of filtered noise
      const sr = actx.sampleRate, buf = actx.createBuffer(1, sr, sr), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const noise = actx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 360; bp.Q.value = 0.7;
      amp = actx.createGain(); amp.gain.value = 0.42;
      noise.connect(bp); bp.connect(amp);
      // turbine body rumble
      const osc = actx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 56;
      const olp = actx.createBiquadFilter(); olp.type = 'lowpass'; olp.frequency.value = 150;
      const og = actx.createGain(); og.gain.value = 0.5;
      osc.connect(olp); olp.connect(og); og.connect(amp);
      // LFO = the chop — pulses the amplitude (the "wokka wokka")
      lfo = actx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 9;
      const lg = actx.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(amp.gain);
      amp.connect(master);
      noise.start(); osc.start(); lfo.start();
      ready = true;
    } catch (e) { actx = null; }
  }
  const muted = () => document.hidden || (bgmBtn && bgmBtn.classList.contains('is-off'));

  /* ---- per-frame: smooth-follow, bank, face, and a rotor that revs up on movement and coasts to a
     DEAD STOP (blades + sound together) when the pointer is still, then spins back up on the next move ---- */
  const blade = heli.querySelector('.blade'), tailblade = heli.querySelector('.tailblade');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function loop() {
    if (revealed()) { retire(); return; }          // crossed into the hero page → retire the chopper, stop the loop
    hx += (px - hx) * 0.22; hy += (py - hy) * 0.22;
    vel *= 0.86;                                    // velocity decays when the pointer is still
    const target = muted() ? 0 : Math.min(1, vel / 26);
    spin += (target - spin) * (target > spin ? 0.22 : 0.04);   // rev up FAST, coast down SLOW
    if (spin < 0.0025) spin = 0;                    // fully halted → blades freeze, rotor silent
    // blades: phase advances with spin (so they decelerate to a stop) and the squash DEPTH scales with
    // spin too (so a stopped rotor rests as a full blade, not a frozen edge-on sliver)
    if (!reduceMotion) {
      phase += spin * 0.9; tphase += spin * 1.35;
      if (blade) blade.style.transform = 'scaleX(' + (1 - 0.92 * spin * (1 - Math.abs(Math.cos(phase)))).toFixed(3) + ')';
      if (tailblade) tailblade.style.transform = 'scaleY(' + (1 - 0.9 * spin * (1 - Math.abs(Math.cos(tphase)))).toFixed(3) + ')';
    }
    const bank = Math.max(-16, Math.min(16, vx * 1.2));   // facing is set instantly in onMove now
    heli.style.transform = 'translate(' + hx + 'px,' + hy + 'px) translate(-50%,-50%) rotate(' + bank + 'deg)';
    if (sprite) sprite.style.transform = 'scaleX(' + face + ')';
    vx *= 0.82;                                     // let bank/face settle when idle
    // the rotor SFX rides the SAME spin → the hum + "wokka" slow to silence with the blades, then pick up
    if (ready) {
      master.gain.setTargetAtTime(spin * 0.24, actx.currentTime, 0.09);
      lfo.frequency.setTargetAtTime(2.5 + spin * 12, actx.currentTime, 0.12);
    }
    requestAnimationFrame(loop);
  })();

  document.addEventListener('visibilitychange', () => {
    if (ready && document.hidden) master.gain.setTargetAtTime(0, actx.currentTime, 0.05);
  });

  // keep the OS cursor hidden at the root, and re-assert on back-navigation (bfcache restore) so it
  // never reappears over the chopper; the chopper itself re-shows on the next pointer move
  if (!revealed()) document.documentElement.style.cursor = 'none';
  window.addEventListener('pageshow', () => {
    if (revealed()) { retire(); return; }   // hero page: leave the OS cursor alone
    document.documentElement.style.cursor = 'none';
    shown = false; heli.classList.remove('show');
  });
})();
