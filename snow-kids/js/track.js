// Snow Kids — construction d'une piste à partir de sa définition (SK.COURSES) : segments, relief, décors, boîtes, pièces.
(function (SK) {
  'use strict';
  const SEG = SK.SEG;
  // Rayon (m) et hauteur (m) des obstacles posés sur la piste ; les décors hors piste n'ont pas de collision.
  SK.OBSTACLES = {
    pine: { r: 1.2 }, rock: { r: 1.3 }, snowman: { r: 1.1 }, cactus: { r: 0.9 }, car: { r: 2.2 }, cone: { r: 0.6 },
    cow: { r: 1.5 }, tree: { r: 1.2 }, bush: { r: 1.1 }, skull: { r: 1 }, icicle: { r: 1 }, lantern: { r: 0.8 }, statue: { r: 1.1 },
    bamboo: { r: 0.8 }, teacup: { r: 1.8 }, balloon: { r: 1.2 }, lollipop: { r: 0.8 },
  };

  SK.buildTrack = function (course, seed) {
    const rng = SK.rng(seed || 7), theme = SK.THEMES[course.theme];
    const segs = []; let y = 0, surface = course.surface || 'snow', tunnel = false, prevW = 12;
    const ease = (a, b, p) => a + (b - a) * (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
    const push = (curve, w, dy, sec) => {
      const i = segs.length, s = { i, z: i * SEG, y1: y, y2: y + dy, curve, w, surface, tunnel, ramp: false, jump: false, props: [], boxes: [], coins: [], sec };
      y += dy; segs.push(s); return s;
    };
    const base = -SK.SLOPE * SEG;
    for (const sec of course.sections) {
      if (sec.t === 'x') { surface = sec.s; continue; }
      if (sec.t === 'tunnel') { tunnel = !!sec.on; continue; }
      const n = sec.n, w = sec.w || prevW, start = segs.length, trans = Math.min(n, 12);
      for (let k = 0; k < n; k++) {
        const ww = ease(prevW, w, k / trans); let curve = 0, dy = base;
        if (sec.t === 'c') { const q = n / 4; curve = sec.c * (k < q ? ease(0, 1, k / q) : k > 3 * q ? ease(1, 0, (k - 3 * q) / q) : 1); }
        if (sec.t === 'b') { const f = kk => sec.a * Math.sin(2 * Math.PI * kk * 3 / n); dy += f(k + 1) - f(k); }
        if (sec.t === 'r') { dy += sec.h / n; const s = push(curve, ww, dy, sec); s.ramp = true; if (k === n - 1) { s.jump = true; y -= sec.h + 1.5; } continue; }
        push(curve, ww, dy, sec);
      }
      prevW = w;
      sec._start = start; sec._end = segs.length;
    }
    const L = segs.length * SEG;
    // Zone d'arrivée : 40 segments plats après la ligne (gare de la remontée), pour le dessin seulement.
    for (let k = 0; k < 40; k++) { const s = push(0, prevW, k < 6 ? base * (1 - k / 6) : 0, null); s.finish = true; }
    segs[segs.length - 40].props.push({ type: 'gate', x: 0, r: 0, decor: true, wide: true });
    for (let k = 2; k < 40; k += 3) segs[segs.length - 40 + k].props.push({ type: 'liftpole', x: prevW + 4, r: 0, decor: true });

    // Décors hors piste
    const nRace = segs.length - 40;
    for (let i = 2; i < segs.length; i++) {
      const s = segs[i];
      if (s.tunnel) continue;
      if (i % 3 === 0 && !s.ramp) { s.props.push({ type: 'fence', x: -(s.w + 1.3), r: 0, decor: true, v: 0.3 }); s.props.push({ type: 'fence', x: s.w + 1.3, r: 0, decor: true, v: 0.7 }); }
      if (rng() < 0.55) { const side = rng() < 0.5 ? -1 : 1; s.props.push({ type: rng.pick(theme.decor), x: side * (s.w + 3 + rng() * 22), r: 0, decor: true, v: rng() }); }
      if (rng() < 0.25) { const side = rng() < 0.5 ? -1 : 1; s.props.push({ type: rng.pick(theme.decor), x: side * (s.w + 20 + rng() * 40), r: 0, decor: true, v: rng(), far: true }); }
    }
    // Garnitures par section : obstacles, boîtes, pièces
    for (const sec of course.sections) {
      if (sec._start == null) continue;
      const a = sec._start, b = sec._end, n = b - a;
      if (sec.obst) for (let k = 0; k < sec.obst; k++) {
        const s = segs[a + 3 + rng.int(Math.max(1, n - 6))]; if (s.ramp) continue;
        const type = rng.pick(theme.obst), x = rng.range(-s.w + 2.5, s.w - 2.5);
        if (s.props.some(p => !p.decor && Math.abs(p.x - x) < 4)) continue;
        s.props.push({ type, x, r: (SK.OBSTACLES[type] || { r: 1 }).r, decor: false, v: rng() });
      }
      if (sec.boxes) {
        const s = segs[a + Math.floor(n / 2)];
        const kinds = sec.boxes === 'rb' ? ['red', 'blue', 'red'] : sec.boxes === 'r' ? ['red', 'red', 'red'] : ['blue', 'blue', 'blue'];
        if (sec.boxes === 'rb' && rng() < 0.5) kinds.reverse();
        [-0.6, 0, 0.6].forEach((f, k) => s.boxes.push({ kind: kinds[k], x: f * s.w, taken: 0 }));
      }
      if (sec.coins) {
        const lane = rng.range(-0.6, 0.6), s0 = a + 2 + rng.int(Math.max(1, n - 2 * sec.coins - 4));
        for (let k = 0; k < sec.coins; k++) { const s = segs[Math.min(b - 1, s0 + k * 2)]; s.coins.push({ x: lane * s.w, taken: 0 }); }
      }
    }
    // Repères de thème (gros décors au tiers et aux deux tiers)
    const landmarks = { rookie: 'lodge', snowman: 'bigsnowman', sunset: 'mesa', highway: 'tower', grass: 'windmill', sand: 'pyramid', silver: 'peak', ninja: 'pagoda', dizzy: 'ferris' };
    [0.33, 0.7].forEach((f, k) => { const s = segs[Math.floor(nRace * f)]; s.props.push({ type: landmarks[course.theme], x: (k ? -1 : 1) * (s.w + 18), r: 0, decor: true, big: true }); });

    const track = { course, theme, segs, nRace, L, length: segs.length };
    track.segAt = z => segs[SK.clamp(Math.floor(z / SEG), 0, segs.length - 1)];
    track.groundY = z => { const s = track.segAt(z); const p = SK.clamp((z - s.z) / SEG, 0, 1); return s.y1 + (s.y2 - s.y1) * p; };
    track.widthAt = z => track.segAt(z).w;
    return track;
  };
})(window.SK);
