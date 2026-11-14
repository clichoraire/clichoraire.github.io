// K.O. en Famille — mixage, bruitages multicouches, ambiance stéréo sans synthèse vocale.
(function (root) {
  'use strict';
  const BX = root.BX = root.BX || {}, A = BX.audio = {};
  const PREF = 'ko-famille.son';
  let pref = { sound: true, music: true, volume: .8 };
  try { Object.assign(pref, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { }
  delete pref.voice; // Ancienne préférence vocale : la synthèse a été retirée.
  A.pref = pref;
  A.save = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { } };
  let ctx, master, effects, room, noiseBuf, crowdGain, crowdSrc, crowdTarget = 0;
  let active = 0, mutedByPage = false;
  const now = () => ctx.currentTime, rand = (a, b) => a + Math.random() * (b - a);
  function gainNode(value, dest) { const g = ctx.createGain(); g.gain.value = value; g.connect(dest); return g; }
  function track(source, nodes, at) {
    active++; source.onended = () => { active--; source.disconnect(); nodes.forEach(n => n.disconnect()); };
    source.start(at);
  }
  function ramp(param, value, duration = .12) {
    const t = now(); param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(value, t + duration);
  }
  const samples = {};
  function decodeSamples() {
    if (!ctx) return;
    for (const sample of Object.values(samples)) if (!sample.pending && !sample.buffer) {
      sample.pending = true;
      const bytes = Uint8Array.from(atob(sample.data), c => c.charCodeAt(0));
      ctx.decodeAudioData(bytes.buffer).then(buffer => { sample.buffer = buffer; sample.data = null; }).catch(() => { sample.failed = true; });
    }
  }
  A.registerSamples = entries => { for (const [name, data] of Object.entries(entries)) samples[name] = { data }; decodeSamples(); };
  A.unlock = function () {
    if (ctx) { if (ctx.state === 'suspended' && !mutedByPage) ctx.resume().catch(() => {}); return; }
    const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -9; limiter.knee.value = 9; limiter.ratio.value = 8; limiter.attack.value = .003; limiter.release.value = .14;
    limiter.connect(ctx.destination); master = gainNode(pref.sound ? pref.volume : 0, limiter);
    effects = gainNode(.7, master);
    // Petite pièce : réflexions courtes plutôt qu’une longue réverbération de cathédrale.
    const reverb = ctx.createConvolver(), ir = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * .85), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * (i < ctx.sampleRate * .012 ? .15 : 1); }
    reverb.buffer = ir; room = gainNode(.18, reverb); reverb.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    decodeSamples(); A.resumeMusic && A.resumeMusic(); if (crowdTarget) A.crowd(crowdTarget);
  };
  A.setSound = on => {
    pref.sound = on; A.save(); if (master) ramp(master.gain, on ? pref.volume : 0);
    if (!on) { A.musicStop(); A.hush(); } else { A.unlock(); A.resumeMusic && A.resumeMusic(); }
  };
  A.setVolume = value => { pref.volume=Math.max(0,Math.min(1,value));A.save();if(master)ramp(master.gain,pref.sound?pref.volume:0); };
  A.setMusic = on => { pref.music = on; A.save(); if (!on) A.musicStop(); else { A.unlock(); A.resumeMusic && A.resumeMusic(); } };
  function envelope(g, t, attack, peak, duration, sustain = 0) {
    const end = t + Math.max(duration, attack + .02);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack);
    if (sustain) g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak * sustain), t + attack + (end - t - attack) * .45);
    g.gain.exponentialRampToValueAtTime(.0001, end); return end;
  }
  function route(g, dest, pan = 0, wet = .15) {
    const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(dest || effects);
    if (wet && (!dest || dest === effects)) { const send = gainNode(wet, room); p.connect(send); return [p, send]; } return [p];
  }
  function osc(type, f, t, dur, peak, f2, dest, pan = 0, wet = .12) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f), t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    envelope(g, t, .003, peak, dur); o.connect(g); const nodes = route(g, dest, pan, wet); track(o, [g, ...nodes], t); o.stop(t + dur + .03); return o;
  }
  function noise(t, dur, peak, type = 'lowpass', f = 1000, q = .7, f2, dest, pan = 0) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf;
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    envelope(g, t, .002, peak, dur); s.connect(fl); fl.connect(g); const nodes = route(g, dest, pan, .18);
    active++; s.onended = () => { active--; [s, fl, g, ...nodes].forEach(n => n.disconnect()); };
    s.start(t, rand(0, 1)); s.stop(t + dur + .02);
  }
  function impact(kind, strength = 1) {
    const t = now(), pitch = rand(.91, 1.08), pan = rand(-.16, .16), heavy = kind === 'heavy' || kind === 'hurt';
    osc('sine', (heavy ? 114 : kind === 'body' ? 96 : 168) * pitch, t, heavy ? .3 : .17, .7 * strength, heavy ? 34 : 48, null, pan, .1);
    noise(t, heavy ? .17 : .09, .55 * strength, 'lowpass', kind === 'body' ? 850 : 2350, .7, 240, null, pan);
    noise(t + .008, .035, .23 * strength, 'highpass', 3400, .7, 1600, null, pan);
    if (heavy) { osc('triangle', 74 * pitch, t + .012, .15, .2, 38, null, -pan); noise(t + .026, .2, .22, 'bandpass', 420, 1.2, 150); }
  }
  function bell(t = now(), velocity = 1) {
    [1, 1.483, 2.051, 2.674, 3.91, 5.43].forEach((r, i) => osc('sine', 536 * r, t, 2.6 / (1 + i * .3), .32 * velocity / (1 + i * .75), null, null, i % 2 ? -.12 : .12, .45));
    noise(t, .018, .18 * velocity, 'highpass', 4200);
  }
  function chime(notes, speed = .075, level = .16) {
    const t = now(); notes.forEach((f, i) => { osc('sine', f, t + i * speed, .4, level, null, null, (i % 3 - 1) * .16, .4); osc('sine', f * 2.01, t + i * speed, .13, level * .2); });
  }
  function clap(t, level = .25, pan = 0, dest) {
    for (let i = 0; i < 3; i++) noise(t + i * .012, .055, level / (1 + i * .35), 'bandpass', 1450, .65, 950, dest, pan);
  }
  function shout(t, pitch, level, pan) {
    // Groupe de voyelles « ah », sans paroles enregistrées.
    for (const formant of [1, 2.1, 3.2, 5.8]) osc('sine', pitch * formant, t, .45, level / (formant * 2), pitch * formant * .88, null, pan, .5);
    noise(t, .5, level * .35, 'bandpass', 750, 1.5, 500, null, pan);
  }
  const SFX = {
    cat(){const t=now();osc('triangle',680,t,.11,.12,1100);osc('sine',1040,t+.08,.3,.16,440);osc('sine',1500,t+.1,.2,.04,780);},

    punch: k => impact('glove', typeof k === 'number' ? Math.min(1.3, k) : 1), bigpunch: () => impact('heavy'), body: () => impact('body'), hurt: () => impact('hurt', 1.15),
    block() { const t = now(); impact('glove', .4); noise(t, .08, .36, 'bandpass', 1200, .6, 580); },
    whoosh() { const t = now(); noise(t, .17, .24, 'bandpass', 450, .8, 2800, null, rand(-.5, .5)); noise(t + .03, .13, .12, 'highpass', 3500, .6, 800); },
    miss() { noise(now(), .19, .15, 'bandpass', 1600, .9, 350, null, rand(-.5, .5)); },
    star() { chime([659.25, 987.77, 1318.51, 1975.53], .065, .16); },
    upper() { const t = now(); noise(t, .28, .32, 'bandpass', 280, 1.2, 4200); osc('sine', 90, t, .27, .3, 360); },
    bell() { bell(); bell(now() + .28, .8); bell(now() + .56, .7); }, bell1() { bell(); },
    tick() { noise(now(), .025, .13, 'bandpass', 2600, 2); osc('sine', 1200, now(), .035, .07, 700); },
    heart() { osc('sine', 84, now(), .14, .3, 42); osc('sine', 72, now() + .18, .12, .2, 38); },
    down() { const t = now(); osc('sine', 78, t, .6, .7, 27); noise(t, .5, .45, 'lowpass', 580, .8, 90); noise(t + .08, .35, .14, 'bandpass', 1300, 1, 300); },
    ko() { SFX.down(); A.cheer(2); chime([392, 523.25, 659.25, 783.99], .1, .18); },
    boing() { osc('sine', 165, now(), .32, .27, 430); osc('triangle', 510, now() + .04, .24, .08, 135); },
    munch() { for (let i = 0; i < 4; i++) noise(now() + i * .11, .055, .22, 'bandpass', rand(900, 2000), 1.5); },
    burp() { const t = now(); for (let i = 0; i < 8; i++) { osc('triangle', 80 + i % 3 * 12, t + i * .055, .1, .14, 58); noise(t + i * .055, .07, .08, 'bandpass', 290, 3); } },
    whistle() { const t = now(); osc('sine', 2460, t, .36, .13, 2670, null, .2, .4); osc('sine', 2830, t, .35, .07, 2920); noise(t, .28, .05, 'highpass', 4800); },
    wood() { const t = now(); for (const d of [0, .17]) { noise(t + d, .065, .3, 'bandpass', 780, 2); osc('sine', 185, t + d, .13, .24, 95); osc('sine', 490, t + d, .07, .08, 380); } },
    stomp() { SFX.down(); noise(now(), .09, .23, 'bandpass', 240, .7); },
    puck() { const t = now(); noise(t, .025, .32, 'highpass', 2800); osc('sine', 1370, t, .065, .17, 620); },
    chime() { chime([880, 1108.73, 1318.51], .09); },
    thunder() { const t = now(); for (let i = 0; i < 4; i++) noise(t + i * .075, .8, .35 / (1 + i), 'lowpass', 1000, .5, 65, null, i % 2 ? -.6 : .6); osc('sine', 48, t, .9, .35, 26); },
    wind() { noise(now(), .9, .2, 'bandpass', 320, .8, 1700, null, -.45); noise(now() + .1, .8, .1, 'highpass', 2200, .5, 600, null, .45); },
    beep() { chime([523.25, 659.25, 783.99], .14, .09); },
    fart() { const t = now(); for (let i = 0; i < 7; i++) { osc('triangle', rand(56, 95), t + i * .045, .085, .18, 42); noise(t + i * .045, .065, .14, 'lowpass', rand(180, 440), 2); } },
    steam() { noise(now(), 1.1, .18, 'highpass', 3800, .5, 1200, null, .3); },
    pop() { const t = now(); osc('sine', 780, t, .085, .24, 160); noise(t, .025, .18, 'highpass', 1500); },
    fireworks() { const t = now(); for (let i = 0; i < 5; i++) { noise(t + i * .12, .2, .25, 'highpass', 1200, .7, 500, null, rand(-.8, .8)); chime([880 + i * 220], .1, .08); } },
    chomp() { SFX.munch(); }, ting() { chime([2093, 3139], .025, .08); },
    roar() { for (let i = 0; i < 4; i++) shout(now() + i * .045, 110 + i * 9, .18, (i - 1.5) * .3); },
    rocket() { noise(now(), .65, .26, 'bandpass', 180, .8, 4000); osc('sine', 62, now(), .55, .16, 190); },
    glint() { osc('sine', 1870, now(), .11, .07, 2800, null, .2, .35); },
    fanfare() { chime([392, 493.88, 587.33, 783.99], .1, .15); SFX.drumroll(); },
    win() { chime([523.25, 659.25, 783.99, 1046.5, 1318.51], .12, .17); A.cheer(2); },
    lose() { chime([392, 349.23, 311.13, 261.63], .23, .13); },
    select() { osc('sine', 640, now(), .065, .12, 860); noise(now(), .018, .06, 'bandpass', 1900, 1); },
    tied() { noise(now(), .21, .17, 'bandpass', 1350, 2, 2700); },
    drumroll() { for (let i = 0; i < 8; i++) clap(now() + i * .055, .06 + i * .008, (i % 2 ? 1 : -1) * .2); },
    step() { noise(now(), .055, .08, 'lowpass', 650, .7, 230); },
    time30() { chime([523.25, 659.25], .13, .11); },
    time10() { chime([659.25, 880, 1046.5], .1, .13); },
    countdown() { const t = now(); osc('sine', 700, t, .1, .2, 520); noise(t, .025, .12, 'bandpass', 1800, 1.2); },
  };
  const lastPlayed = {};
  A.play = (name, ...args) => {
    if (!ctx || !pref.sound || mutedByPage) return;
    const t = now(), minGap = name === 'tick' ? .045 : name === 'step' ? .12 : .018;
    if (lastPlayed[name] != null && t - lastPlayed[name] < minGap) return;
    lastPlayed[name] = t;
    if (samples[name]?.buffer) {
      const source = ctx.createBufferSource(); source.buffer = samples[name].buffer;
      const gain = gainNode(.8, effects); source.connect(gain); track(source, [gain], t); return;
    }
    if (SFX[name]) SFX[name](...args);
  };

  // Le lecteur des morceaux enregistrés est installé par music.js.
  A.musicStop = () => {};
  A.musicPaused = () => {};

  A.crowd = function (level) {
    crowdTarget = level; if (!ctx) return;
    if (!crowdSrc && level > 0) {
      crowdSrc = [];
      crowdGain = gainNode(0, master);
      for (const pan of [-.7, .7]) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), p = ctx.createStereoPanner(), g = ctx.createGain();
        s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = pan < 0 ? .83 : 1.07;
        f.type = 'bandpass'; f.frequency.value = pan < 0 ? 460 : 820; f.Q.value = .6; p.pan.value = pan; g.gain.value = .5;
        const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = pan < 0 ? .17 : .23; depth.gain.value = .12; lfo.connect(depth); depth.connect(g.gain);
        s.connect(f); f.connect(g); g.connect(p); p.connect(crowdGain); s.start(); lfo.start(); crowdSrc.push(s, lfo);
      }
    }
    if (crowdGain) ramp(crowdGain.gain, pref.sound ? level * .08 : 0, .5);
  };
  A.cheer = (amount = 1) => {
    if (!ctx || !pref.sound || mutedByPage) return;
    if (crowdGain) { const t = now(); crowdGain.gain.cancelScheduledValues(t); crowdGain.gain.setTargetAtTime(Math.min(.3, .08 * crowdTarget + .1 * amount), t, .04); crowdGain.gain.setTargetAtTime(crowdTarget * .08, t + .65, .7); }
    if (amount >= 1) {
      const t = now(); for (let i = 0; i < Math.min(8, 3 + Math.floor(amount * 2)); i++) { const pan = rand(-.85, .85); clap(t + i * .06, .07, pan); if (i % 2 === 0) shout(t + i * .045, rand(120, 190), .08, pan); }
    }
  };
  // Compatibility with scene dialogue hooks: text stays visible, no voice is generated.
  A.say = () => {};
  A.hush = () => {};
  document.addEventListener('visibilitychange', () => {
    mutedByPage = document.hidden;
    if (!ctx) return;
    if (mutedByPage) { ctx.suspend().catch(() => {}); A.hush(); }
    else ctx.resume().catch(() => {});
  });
  // Premier geste utilisateur : autorisation audio du navigateur, sans écran supplémentaire.
  for (const event of ['pointerdown', 'keydown']) document.addEventListener(event, () => A.unlock(), { once: true });
  A.debug = { status: () => ({ context: ctx && ctx.state, scene: A.currentScene, playing: false, voices: active, music: pref.music, sound: pref.sound }),
    context: () => ctx, samples: () => Object.fromEntries(Object.entries(samples).map(([name,s])=>[name,!!s.buffer])), sounds: () => [...Object.keys(SFX),...Object.keys(samples)] };
})(window);
