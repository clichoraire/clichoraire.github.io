// Clan Gobelin — la nuit : une scène quand le chef va se coucher, et parfois une attaque en plein sommeil.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, DUR = 9, clamp = CG.clamp;
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // qui sort se battre la nuit : tout le monde, sauf les peureux, les enfants et ceux qui ne savent pas se battre
  G.canFight = g => g.job === 'garde' || (g.perso !== 'peureux' && !g.child && G.apt(g, 'garde') >= 1);
  G.militia = g => !!(CG.R.event && CG.R.event.nightRaid) && g.job !== 'garde' && g.koNight !== CG.S.day && G.canFight(g);

  D.startNight = function (resume) {
    const S = CG.S, R = CG.R; if (R.night) return;
    const raid = !resume && !R.cine && S.day >= 3 && !R.noNightRaid && Math.random() < 0.3;
    R.night = { t: resume ? DUR * 0.5 : 0, raid, raidAt: 3.2 + Math.random() * 1.6, babies: !!R.cine, bebes: R.cine ? (R.cine.shown || 0) : 0, vus: 0, resume: !!resume, horn: false };
    if (!resume) CG.sfx('nuitAnim');
    R.fireLit = false; R.backToBed = 0; document.body.classList.add('nuit'); if (CG.UI.modal && !CG.UI.modal.pauses) CG.UI.close();
  };
  function endNight() { CG.R.night = null; document.body.classList.remove('nuit'); }
  function nightStep(dt) {
    const R = CG.R, n = R.night; n.t += dt; R.fade = clamp(n.t / 1.0, 0, 1); if (n.resume) R.fade = 1;
    if (n.raid) { if (n.t >= n.raidAt && !n.horn) { n.horn = true; CG.sfx('warning'); } if (n.t >= n.raidAt + 1.9) nightRaid(); return; }
    if (n.t >= DUR) { endNight(); R.fade = 1; R.fadeDir = -1; D.nextDay(); }
  }
  // l'alerte en pleine nuit : on revient au village, tout le monde dehors
  function nightRaid() {
    const S = CG.S, R = CG.R, p = S.player; endNight(); R.fade = 1; R.fadeDir = -1; S.hour = 22.6;
    if (R.cine) CG.Soc.endCine();
    const d = G.door(G.find('chief')); p.x = d.x; p.y = d.y + 10;
    const kind = S.day >= 6 && Math.random() < 0.25 ? 'demons' : Math.random() < 0.55 ? 'humains' : 'betes', exitName = kind === 'demons' ? 'nord' : CG.pick(['ouest', 'est', 'sud']), e = W.EXITS[exitName], f = G.firePos();
    let list = D.compose(kind, S.day, false); list = list.slice(0, Math.max(2, Math.ceil(list.length * 0.6)));
    // ils sont déjà en route : ils surgissent à mi-chemin de la lisière
    const ex = e.x * T + T / 2, ey = e.y * T + T / 2, sx = ex + (f.x - ex) * 0.35, sy = ey + (f.y - ey) * 0.35;
    list.forEach((type, i) => R.spawnQ.push({ t: 0.3 + i * 0.5, type, x: sx + CG.rand(-34, 34), y: sy + CG.rand(-34, 34) }));
    S.goblins.forEach(g => { G.resetGoblin(g); g.hidden = false; });
    R.event = { type: 'attack', kind, exit: exitName, nightRaid: true, quiet: true, msg: ['Attaque en pleine nuit !', 'Tout le clan sort se battre, sauf les peureux et ceux qui ne savent pas tenir une arme.'] };
    D.soundAlarm();
    const out = S.goblins.filter(g => G.canFight(g)).length, stay = S.goblins.length - out;
    setTimeout(() => CG.UI.toast('⚔️ ' + out + ' gobelin' + (out > 1 ? 's sortent' : ' sort') + ' se battre' + (stay ? ' · ' + stay + ' reste' + (stay > 1 ? 'nt cachés' : ' caché') : '') + '.'), 900);
  }
  const up = D.update; D.update = function (dt) {
    const R = CG.R; if (R.night) return nightStep(dt);
    if (R.backToBed > 0 && !R.event) { R.backToBed -= dt; if (R.backToBed <= 0) { CG.UI.toast('😴 Le calme est revenu. Tout le monde retourne se coucher.'); D.startNight(true); return; } }
    return up.apply(this, arguments);
  };
  const passer = e => { const R = CG.R, n = R && R.night; if (!n || e.repeat || n.t < 0.6 || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; n.t = Math.max(n.t, n.raid ? n.raidAt : DUR - 1.7); };
  window.addEventListener('keydown', passer); window.addEventListener('mousedown', passer);

  // ---------- la place du feu reste libre : rien ne se bâtit dans le cercle où le clan danse ----------
  W.FIRE_FREE = 3.3; // en cases, autour du centre du feu
  W.nearFire = function (tx, ty, w, h) { const cx = W.CX + 0.5, cy = W.CY + 0.5, dx = Math.max(tx - cx, 0, cx - (tx + w)), dy = Math.max(ty - cy, 0, cy - (ty + h)); return Math.hypot(dx, dy) < W.FIRE_FREE; };
  const cb = W.canBuild; W.canBuild = function (tx, ty, w, h) { if (W.nearFire(tx, ty, w, h)) return false; return cb.apply(this, arguments); };
  const pb = D.placeBuild; D.placeBuild = function () { const R = CG.R, b = R.build && CG.BUILDS[R.build.type]; if (b && !b.terrain) { const sp = D.buildSpot(); if (!sp.ok && W.nearFire(sp.tx, sp.ty, sp.w, sp.h)) { CG.sfx('no'); CG.UI.toast('🔥 On ne bâtit pas autour du feu de camp : c\'est là que le clan danse le soir.'); return; } } return pb.apply(this, arguments); };

  // ---------- les champignons poussent à l'ombre : pas de potager près d'une lumière, ni de lumière près d'un potager ----------
  W.LIGHTS = { fire: 6, torche: 4, cristal: 2.5, tourMagie: 2.5 }; // portée de la lumière, en cases
  const gap = (ax, ay, aw, ah, bx, by, bw, bh) => Math.hypot(Math.max(bx - (ax + aw), 0, ax - (bx + bw)), Math.max(by - (ay + ah), 0, ay - (by + bh)));
  // renvoie le nom de ce qui gêne, ou null
  W.shadeClash = function (type, tx, ty, w, h) {
    const S = CG.S, NOM = { fire: 'du feu de camp', torche: 'd\'une torche', cristal: 'd\'un cristal de mana', tourMagie: 'd\'une tour de magie' };
    if (type === 'potager') { for (const b of S.buildings) { const r = W.LIGHTS[b.type]; if (r && gap(tx, ty, w, h, b.tx, b.ty, b.w, b.h) < r) return NOM[b.type] || 'd\'une lumière'; } return null; }
    const r = W.LIGHTS[type]; if (!r) return null;
    for (const b of S.buildings) if (b.type === 'potager' && gap(tx, ty, w, h, b.tx, b.ty, b.w, b.h) < r) return 'potager';
    return null;
  };
  const bs = D.buildSpot; D.buildSpot = function () { const sp = bs.apply(this, arguments), type = CG.R.build && CG.R.build.type; if (sp && sp.ok && type && (type === 'potager' || W.LIGHTS[type])) { const c = W.shadeClash(type, sp.tx, sp.ty, sp.w, sp.h); if (c) { sp.ok = false; sp.shade = c; } } return sp; };
  const pb2 = D.placeBuild; D.placeBuild = function () { const R = CG.R; if (R.build) { const sp = D.buildSpot(); if (sp && sp.shade) { CG.sfx('no'); CG.UI.toast(sp.shade === 'potager' ? '🍄 Pas de lumière si près d\'un potager : les champignons ne poussent qu\'à l\'ombre.' : '🍄 Trop de lumière ici (près ' + sp.shade + ') : les champignons ne poussent qu\'à l\'ombre.'); return; } } return pb2.apply(this, arguments); };

  // ---------- la scène ----------
  Art.nightScene = function (g, w, h, n) {
    const t = n.t, a = n.resume ? 1 : clamp(t / 1.0, 0, 1), dawn = n.raid ? 0 : clamp((t - (DUR - 2.4)) / 2.2, 0, 1), u = clamp(t / DUR, 0, 1), k = Math.min(w, h) / 720;
    const alert = n.raid ? clamp((t - n.raidAt) / 0.5, 0, 1) : 0, shake = alert ? Math.sin(t * 60) * 3 * alert : 0;
    g.save(); g.globalAlpha = a; g.translate(shake, 0);
    let bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#04051a'); bg.addColorStop(0.6, '#0b1236'); bg.addColorStop(1, '#16224e'); g.fillStyle = bg; g.fillRect(-10, 0, w + 20, h);
    if (dawn > 0) { bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, 'rgba(60,70,140,' + dawn * 0.7 + ')'); bg.addColorStop(0.55, 'rgba(230,120,110,' + dawn * 0.75 + ')'); bg.addColorStop(0.8, 'rgba(255,196,110,' + dawn + ')'); bg.addColorStop(1, 'rgba(255,225,150,' + dawn + ')'); g.fillStyle = bg; g.fillRect(-10, 0, w + 20, h); }
    // étoiles
    for (let i = 0; i < 150; i++) { const x = hash(i) * w, y = hash(i + 500) * h * 0.72, s = 0.6 + hash(i + 900) * 1.6, tw = 0.45 + 0.55 * Math.sin(t * (1.5 + hash(i + 40) * 3) + i); g.globalAlpha = a * tw * (1 - dawn) * (y < h * 0.6 ? 1 : 0.5); g.fillStyle = hash(i + 7) < 0.15 ? '#ffe9b0' : '#e8eeff'; g.beginPath(); g.arc(x, y, s * k, 0, TAU); g.fill(); if (s > 1.9) { g.fillRect(x - 4 * k, y - 0.4, 8 * k, 0.8); g.fillRect(x - 0.4, y - 4 * k, 0.8, 8 * k); } }
    g.globalAlpha = a;
    // étoile filante
    const sh = (t - 2.6) / 0.7; if (sh > 0 && sh < 1 && !n.resume) { const x = w * (0.72 - sh * 0.3), y = h * (0.12 + sh * 0.16); const gr = g.createLinearGradient(x, y, x + 90 * k, y - 48 * k); gr.addColorStop(0, 'rgba(255,255,255,' + Math.sin(sh * Math.PI) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr; g.lineWidth = 2.5 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 90 * k, y - 48 * k); g.stroke(); }
    // lune : elle traverse le ciel
    const mx = w * (0.16 + 0.68 * u), my = h * (0.58 - Math.sin(u * Math.PI) * 0.42), mr = 44 * k;
    let gl = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4.2); gl.addColorStop(0, 'rgba(210,225,255,' + 0.35 * (1 - dawn) + ')'); gl.addColorStop(1, 'rgba(210,225,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(mx, my, mr * 4.2, 0, TAU); g.fill();
    g.globalAlpha = a * (1 - dawn * 0.75); g.fillStyle = '#f4f1dc'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(190,188,165,0.55)'; [[-0.3, -0.25, 0.2], [0.28, 0.1, 0.26], [-0.1, 0.42, 0.15], [0.38, -0.4, 0.12]].forEach(c => { g.beginPath(); g.arc(mx + c[0] * mr, my + c[1] * mr, c[2] * mr, 0, TAU); g.fill(); });
    g.globalAlpha = a;
    // soleil qui pointe à l'aube
    if (dawn > 0) { const sx2 = w * 0.5, sy2 = h * (0.86 - dawn * 0.1); gl = g.createRadialGradient(sx2, sy2, 0, sx2, sy2, 260 * k); gl.addColorStop(0, 'rgba(255,250,210,' + dawn + ')'); gl.addColorStop(0.25, 'rgba(255,214,120,' + dawn * 0.8 + ')'); gl.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = gl; g.beginPath(); g.arc(sx2, sy2, 260 * k, 0, TAU); g.fill(); }
    // nuages
    for (let i = 0; i < 5; i++) { const cx = ((hash(i + 60) * w * 1.4 + t * (8 + i * 3) * k) % (w * 1.4)) - w * 0.2, cy = h * (0.18 + hash(i + 70) * 0.3); g.fillStyle = dawn > 0 ? 'rgba(255,190,170,' + (0.10 + dawn * 0.16) + ')' : 'rgba(120,135,190,0.10)'; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(cx + (j - 1.5) * 46 * k, cy + Math.sin(j * 2 + i) * 8 * k, 58 * k, 20 * k, 0, 0, TAU); g.fill(); } }
    // collines et forêt en ombre
    const hill = (base, amp, f, ph, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-10, h); for (let x = -10; x <= w + 10; x += 14) g.lineTo(x, h * base - Math.sin(x / w * f + ph) * amp * k - Math.sin(x / w * f * 2.7 + ph * 2) * amp * 0.3 * k); g.lineTo(w + 10, h); g.closePath(); g.fill(); };
    hill(0.74, 46, 5, 0.6, dawn > 0.5 ? '#2a2f55' : '#0c1330'); hill(0.82, 30, 7, 2.1, '#080d22');
    const gy = h * 0.88; g.fillStyle = '#04070f';
    for (let i = 0; i < 26; i++) { const x = hash(i + 200) * w, s = (26 + hash(i + 210) * 34) * k; if (x > w * 0.26 && x < w * 0.76) continue; g.beginPath(); g.moveTo(x, gy - s * 2.2); g.lineTo(x + s * 0.55, gy + 6); g.lineTo(x - s * 0.55, gy + 6); g.closePath(); g.fill(); }
    g.fillRect(-10, gy, w + 20, h - gy + 2);
    // les huttes endormies
    const huts = [[0.33, 0.8], [0.42, 1.0], [0.5, 1.35], [0.6, 0.95], [0.68, 0.8]];
    huts.forEach((d, i) => { const x = w * d[0], s = 52 * k * d[1]; g.fillStyle = '#04070f'; g.beginPath(); g.moveTo(x, gy - s * 1.35); g.lineTo(x + s * 0.95, gy - s * 0.42); g.lineTo(x + s * 0.72, gy - s * 0.42); g.lineTo(x + s * 0.72, gy + 2); g.lineTo(x - s * 0.72, gy + 2); g.lineTo(x - s * 0.72, gy - s * 0.42); g.lineTo(x - s * 0.95, gy - s * 0.42); g.closePath(); g.fill(); if (i === 2) { g.fillRect(x + s * 0.8, gy - s * 1.5, 3 * k, s * 1.5); g.fillStyle = '#3a0f12'; g.beginPath(); g.moveTo(x + s * 0.8 + 3 * k, gy - s * 1.5); g.lineTo(x + s * 1.15, gy - s * 1.38); g.lineTo(x + s * 0.8 + 3 * k, gy - s * 1.26); g.closePath(); g.fill(); } });
    // les braises du feu de camp et leur fumée
    const fx = w * 0.555, fy = gy - 2, em = 0.6 + Math.sin(t * 5) * 0.2 + Math.sin(t * 13) * 0.1;
    gl = g.createRadialGradient(fx, fy, 0, fx, fy, 70 * k); gl.addColorStop(0, 'rgba(255,140,50,' + 0.5 * em + ')'); gl.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gl; g.beginPath(); g.arc(fx, fy, 70 * k, 0, TAU); g.fill();
    g.fillStyle = '#ff9a3a'; g.beginPath(); g.ellipse(fx, fy, 9 * k, 3.5 * k, 0, 0, TAU); g.fill();
    for (let i = 0; i < 5; i++) { const p = (t * 0.22 + i * 0.2) % 1; g.fillStyle = 'rgba(150,160,190,' + 0.16 * (1 - p) + ')'; g.beginPath(); g.arc(fx + Math.sin(p * 5 + i) * 12 * k * p, fy - p * 120 * k, (6 + p * 18) * k, 0, TAU); g.fill(); }
    // Zzz au-dessus de la hutte du chef, cœurs quand on a fait des enfants
    if (!alert) {
      g.textAlign = 'center'; g.fillStyle = '#dfe6ff';
      for (let i = 0; i < 3; i++) { const p = (t * 0.33 + i / 3) % 1; g.globalAlpha = a * Math.sin(p * Math.PI) * (1 - dawn); g.font = 'bold ' + Math.round((14 + p * 20) * k) + 'px sans-serif'; g.fillText(p > 0.6 ? 'Z' : 'z', w * 0.5 + (10 + p * 40) * k + Math.sin(p * 6) * 6 * k, gy - 80 * k - p * 110 * k); }
      if (n.babies) for (let i = 0; i < 4; i++) { const p = (t * 0.4 + i / 4) % 1; g.globalAlpha = a * Math.sin(p * Math.PI) * (1 - dawn); g.font = Math.round((14 + p * 12) * k) + 'px sans-serif'; g.fillStyle = '#fff'; g.fillText('💕', w * 0.42 + Math.sin(p * 5 + i) * 14 * k, gy - 60 * k - p * 90 * k); }
      if (n.bebes && !n.resume) { // un « +1 👶 » par bébé, l'un après l'autre, au-dessus de la hutte
        const nb = Math.min(n.bebes, Math.floor((t - 1.8) / 0.95) + 1); if (nb > (n.vus || 0)) { n.vus = nb; CG.sfx('coin'); }
        for (let i = 0; i < nb; i++) { const q = t - 1.8 - i * 0.95, pop = Math.min(1, q / 0.25), sc = 1 + (1 - pop) * 0.8, x = w * 0.42 + (i - (n.bebes - 1) / 2) * 74 * k, y = gy - 150 * k - Math.min(1, q / 0.6) * 26 * k + Math.sin(t * 2 + i) * 3 * k;
          g.globalAlpha = a * Math.min(1, q / 0.2) * (1 - dawn * 0.6); g.font = 'bold ' + Math.round(26 * k * sc) + 'px "Trebuchet MS", system-ui, sans-serif'; g.lineWidth = 5 * k; g.lineJoin = 'round'; g.strokeStyle = 'rgba(60,10,40,0.85)'; g.strokeText('+1 👶', x, y); g.fillStyle = '#ffd0e4'; g.fillText('+1 👶', x, y); }
      }
      g.globalAlpha = a;
    }
    // lucioles
    for (let i = 0; i < 16; i++) { const x = w * (0.2 + hash(i + 300) * 0.6) + Math.sin(t * (0.5 + hash(i + 310)) + i) * 40 * k, y = gy - (20 + hash(i + 320) * 150) * k + Math.cos(t * (0.7 + hash(i + 330)) + i * 2) * 18 * k, tw = Math.max(0, Math.sin(t * (1.5 + hash(i + 340) * 2) + i * 3)); g.globalAlpha = a * tw * (1 - dawn) * 0.9; g.fillStyle = '#e8ff8a'; g.beginPath(); g.arc(x, y, 2.2 * k, 0, TAU); g.fill(); g.globalAlpha = a * tw * (1 - dawn) * 0.25; g.beginPath(); g.arc(x, y, 7 * k, 0, TAU); g.fill(); }
    g.globalAlpha = a;
    // l'alerte : des torches à la lisière, tout vire au rouge
    if (alert) {
      for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1, x = side > 0 ? w * (1.02 - alert * (0.06 + i * 0.025)) : w * (-0.02 + alert * (0.06 + i * 0.025)), y = gy - (8 + hash(i + 400) * 26) * k + Math.sin(t * 9 + i) * 3; gl = g.createRadialGradient(x, y, 0, x, y, 34 * k); gl.addColorStop(0, 'rgba(255,170,60,0.9)'); gl.addColorStop(1, 'rgba(255,90,30,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 34 * k, 0, TAU); g.fill(); g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(x, y, 3.5 * k, 0, TAU); g.fill(); }
      const v = g.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85); v.addColorStop(0, 'rgba(160,0,0,0)'); v.addColorStop(1, 'rgba(200,20,10,' + (0.35 + Math.sin(t * 10) * 0.15) * alert + ')'); g.fillStyle = v; g.fillRect(-10, 0, w + 20, h);
    }
    // textes
    const txt = (s, y, size, col, al) => { if (al <= 0) return; g.globalAlpha = a * Math.min(1, al); g.font = 'bold ' + Math.round(size * k) + 'px Trebuchet MS, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(s, w / 2 + 2, y + 3); g.fillStyle = col; g.fillText(s, w / 2, y); g.globalAlpha = a; };
    if (alert) { txt('⚠ Des bruits dans la nuit...', h * 0.3, 44, '#ff9a8a', alert); txt('AUX ARMES !', h * 0.42, 62, '#ffe36b', (t - n.raidAt - 0.8) / 0.3); }
    else {
      if (!n.resume) txt(n.babies ? 'Une douce nuit tombe sur le village...' : 'La nuit tombe sur le village...', h * 0.3, 38, '#dfe6ff', Math.min((t - 0.8) / 0.8, (4.2 - t) / 0.8));
      else txt('Le calme revient. Tout le monde se rendort...', h * 0.3, 34, '#dfe6ff', Math.min((t - DUR * 0.5) / 0.6, (DUR - 2.6 - t) / 0.6));
      txt('Jour ' + (CG.S.day + 1), h * 0.34, 76, '#fff3c4', (dawn - 0.25) / 0.4); txt('Le soleil se lève', h * 0.43, 30, '#ffe9a8', (dawn - 0.45) / 0.4);
      g.globalAlpha = a * 0.45; g.font = Math.round(14 * k) + 'px sans-serif'; g.textAlign = 'right'; g.fillStyle = '#dfe6ff'; g.fillText('Une touche : passer', w - 18, h - 16);
    }
    g.restore();
  };
})(window.CG);
