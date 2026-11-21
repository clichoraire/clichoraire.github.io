// Clan Gobelin — boucle principale, rendu, sauvegarde.
'use strict';
(function (CG) {
  const T = CG.TILE, W = CG.W, G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art;
  const SAVE = 'clan-gobelin-save-v1';
  let cv, ctx, vw = 1280, vh = 720, scale = 1, dpr = 1, S, R, last = 0, nightC, nightG, frame = 0, mini, miniG;

  // ---------- sauvegarde ----------
  CG.pack = function () {
    const s = CG.S, p = s.player;
    const data = Object.assign({}, s, {
      pets: s.pets.map(a => ({ id: a.id, kind: a.kind, name: a.name, lvl: a.lvl, xp: a.xp, evo: a.evo, hp: a.hp, x: a.x, y: a.y, nomme: a.nomme, naming: a.naming, follow: a.follow, ko: a.ko || undefined, evoDemain: a.evoDemain || undefined, bebe: a.bebe || undefined })),
      logs: s.logs.map(l => ({ tx: l.tx, ty: l.ty, halves: l.halves, cut: l.cut, dir: l.dir })),
      goblins: s.goblins.map(g => ({ hat: g.hat || undefined, hats: g.hats, lazy: g.lazy, cls: g.cls, classing: g.classing, fun: g.fun, look: g.look, nomme: g.nomme, naming: g.naming, apt: g.apt, weak: g.weak, jobs: g.jobs, ami: g.ami || 0, child: g.child, bebe: g.bebe, fertile: g.fertile, amour: g.amour || undefined, flirtDay: g.flirtDay, met: g.met, jumeau: g.jumeau || undefined, demenage: g.demenage || undefined, sansMaison: g.sansMaison || undefined, perso: g.perso, bio: g.bio, talent: g.talent, id: g.id, name: g.name, sex: g.sex, job: g.job, lvl: g.lvl, xp: g.xp, hp: g.hp, home: g.home, hue: g.hue, lum: g.lum, equip: g.equip, outil: g.outil || undefined })),
      buildings: s.buildings.map(b => { const o = { type: b.type, tx: b.tx, ty: b.ty, w: b.w, h: b.h, variant: b.variant }; if (b.hp !== undefined) o.hp = b.hp; if (b.champ) o.champ = b.champ; if (b.charge) o.charge = Math.round(b.charge * 10) / 10; if (b.recolte) o.recolte = true; if (b.flip) o.flip = true; if (b.up) o.up = b.up; if (b.upg) o.upg = b.upg; if (b.ori) o.ori = b.ori; if (b.ruin) o.ruin = true; if (b.mech) o.mech = { k: b.mech.k, dir: b.mech.dir, cd: 1 }; if (b.site) { o.site = true; o.prog = b.prog; o.need = b.need; } return o; }),
      player: { hp: p.hp, maxhp: p.maxhp, mp: p.mp, maxmp: p.maxmp, lvl: p.lvl, xp: p.xp, weapon: p.weapon, armor: p.armor, spells: p.spells, scrolls: p.scrolls, potions: p.potions, fioles: p.fioles, sortNiv: p.sortNiv, x: p.x, y: p.y }
    });
    return data;
  };
  CG.save = function () {
    if (CG.dead) return; // le chef est mort : la partie est finie pour de bon
    try { localStorage.setItem(SAVE, JSON.stringify(CG.pack())); } catch (e) { /* stockage indisponible */ }
  };
  CG.peekSave = function () { try { const d = JSON.parse(localStorage.getItem(SAVE)); return d && d.v === 1 ? d : null; } catch (e) { return null; } };
  // on ferme l'onglet ou la fenêtre : la partie est sauvegardée telle quelle (heure comprise), sauf pendant la nuit ou une scène
  window.addEventListener('pagehide', () => { if (CG.running && CG.S && CG.R && !CG.R.night && !CG.R.cine && !CG.R.death) CG.save(); });
  CG.wipe = function () { try { localStorage.removeItem(SAVE); } catch (e) { /* rien */ } };
  CG.start = function (isNew, name) {
    if (isNew) G.newState(name); else CG.S = CG.peekSave();
    const h0 = !isNew && CG.S && CG.S.hour > 6 ? CG.S.hour : 0, ou = !isNew && CG.S && CG.S.player && CG.S.player.x !== undefined ? { x: CG.S.player.x, y: CG.S.player.y } : null, vm = !isNew && CG.S && CG.S.player ? { hp: CG.S.player.hp, mp: CG.S.player.mp } : null;
    const vies = {}; if (!isNew && CG.S) (CG.S.goblins || []).concat(CG.S.pets || []).forEach(e => { if (e && e.id !== undefined && isFinite(e.hp)) vies[e.id] = e.hp; });
    G.initRuntime(); D.startDay(); S = CG.S; R = CG.R;
    S.goblins.forEach(g => { const v = vies[g.id]; if (v !== undefined) g.hp = Math.max(1, Math.min(G.gobMaxHp(g), v)); }); (S.pets || []).forEach(a => { const v = vies[a.id]; if (v !== undefined && v > 0 && !a.ko) a.hp = Math.min(CG.P.maxHp(a), v); });
    if (vm) { const q = S.player; if (isFinite(vm.hp)) q.hp = Math.max(1, Math.min(q.maxhp, vm.hp)); if (isFinite(vm.mp)) q.mp = Math.max(0, Math.min(q.maxmp, vm.mp)); } // la vie et le mana reviennent comme on les avait laissés
    if (h0) { // partie reprise en cours de journée : même heure qu'en quittant, et ce qui était prévu avant cette heure est passé
      S.hour = Math.min(h0, 23.5); (R.schedule || []).forEach(e => { if (e.h <= S.hour) e.done = true; }); R.eveningSaid = S.hour >= 19;
      if (S.feastDay === S.day) { R.feast = true; R.feastOk = true; R.fireLit = true; }
      if (ou && isFinite(ou.x) && isFinite(ou.y)) { const q = S.player; q.x = ou.x; q.y = ou.y; if (!W.walkPx(q.x, q.y)) G.unstick(q, 9); } // on reprend là où l'on était, pas devant la hutte
    } CG.running = true; W.drawMini(); if (R.campNote) setTimeout(() => UI.toast(R.campNote), 12000); document.getElementById('hud').style.visibility = 'visible';
    if (isNew) { CG.save(); /* plus de bandeau « Jour 1 » : on arrive directement dans le jeu, sous le cercle noir */ }
    else G.banner('Jour ' + S.day, 'Bon retour, chef ' + S.name + '.', '#ffe9a8');
  };

  // ---------- écran ----------
  // la loupe a été retirée du menu : la vue revient toujours à sa taille normale (CG.zoomer ne sert plus qu'aux essais)
  const ZOOMS = [0.7, 0.85, 1, 1.2, 1.45, 1.75], ZKEY = 'goblin-malin-zoom'; let zoom = 1; try { localStorage.removeItem(ZKEY); } catch (e) { /* rien */ }
  CG.zoom = () => zoom;
  CG.zoomer = function (sens) { const i = CG.clamp(ZOOMS.indexOf(zoom) + sens, 0, ZOOMS.length - 1); if (ZOOMS[i] === zoom) { CG.sfx('no'); return zoom; } zoom = ZOOMS[i]; resize(); CG.sfx('click'); majZoom(); return zoom; };
  function majZoom() { const m = document.getElementById('zoom-moins'), p = document.getElementById('zoom-plus'); if (m) m.disabled = zoom === ZOOMS[0]; if (p) p.disabled = zoom === ZOOMS[ZOOMS.length - 1]; }
  { const m = document.getElementById('zoom-moins'), p = document.getElementById('zoom-plus'); if (m) m.onclick = () => CG.zoomer(-1); if (p) p.onclick = () => CG.zoomer(1); majZoom(); }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2) * (window.GMPerf ? window.GMPerf.res : 1); // la finesse du dessin baisse toute seule sur un ordinateur qui peine (perf.js)
    const w = window.innerWidth, h = window.innerHeight;
    scale = Math.max(h / 640, w / 1320) * zoom; vw = w / scale; vh = h / scale;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    nightC.width = Math.ceil(cv.width / 2); nightC.height = Math.ceil(cv.height / 2);
  }
  CG.viewScale = () => scale;
  CG.toScreen = (x, y) => ({ x: (x - R.cam.x) * scale, y: (y - R.cam.y) * scale });
  CG.onScreen = (x, y) => R && x > R.cam.x - 40 && x < R.cam.x + vw + 40 && y > R.cam.y - 40 && y < R.cam.y + vh + 60;

  // ---------- un pas de jeu ----------
  function step(dt) {
    S = CG.S; R = CG.R;
    const presses = CG.takePresses();
    if (R.death) { presses.length = 0; CG.keys.clear(); dt *= CG.Mort.SLOW; if (UI.modal && !UI.modal.pauses) UI.close(); } // la mort du chef : plus de commandes, tout au ralenti
    if (UI.modal) { presses.forEach(UI.key); if (UI.modal) CG.keys.clear(); }
    else for (const k of presses) {
      if (k === 'Escape') { if (R.build) R.build = null; else if (CG.Bt.open) CG.Bt.toggle(false); else UI.pause(); }
      else if (k === 'b') CG.Bt.toggle();
      else if (k === 'r' && R.build) CG.Bt.rotate();
      else if (CG.Bt.open && k >= '1' && k <= '9' && k.length === 1) CG.Bt.key1(+k);
      else if (k === 'p') UI.pause(); else if (k === 't') UI.tech();
      else if (k === 'f') G.power('dash'); else if (k === 'r') G.power('slam'); else if (k === 'x') G.power('tele');
      else if (k === 'e' || k === 'Enter') D.interact();
      else if (k === 'Space' || k === 'j') G.attack();
      else if (k >= '0' && k <= '9' && k.length === 1 && CG.Meta && CG.Meta.forme()) CG.Meta.touche(k); /* transformé : les touches sont celles de la créature */
      else if (k >= '0' && k <= '9' && k.length === 1) { const id = S.player.spells[k === '0' ? 9 : +k - 1]; if (id) G.cast(id); } // 1 à 9, puis 0 pour le dixième
      else if (k === 'q') G.drinkPotion(); else if (k === 'z' && G.drinkMana) G.drinkMana(); else if (k === 'v' && CG.Potions) CG.Potions.besace(); else if (k === 'i' && CG.Inventaire) CG.Inventaire.ouvrir();
      else if (k === 'c') UI.carte(); else if (k === 'g') UI.grimoire(); else if (k === 'h') UI.help();
      else if (k === 'm') document.getElementById('btn-sound').click();
      if (UI.modal) break;
    }
    // seuls le titre, le bilan du matin et la Pause arrêtent le temps
    if (UI.modal && UI.modal.pauses) return;
    D.update(dt); if (UI.modal && UI.modal.pauses) return;
    if (!R.night) G.update(dt);
    if (R.fireLit) {
      const f = G.firePos(), vis = CG.onScreen(f.x, f.y);
      if (Math.random() < dt * 9) R.parts.push({ x: f.x + CG.rand(-10, 10), y: f.y - 24, vx: CG.rand(-14, 14), vy: CG.rand(-90, -50), life: CG.rand(0.5, 1.1), max: 1.1, col: Math.random() < 0.5 ? '#ffb432' : '#ff7a2a', size: 2.2, float: true });
      if (CG.audio.drums(dt, vis) && vis) G.text(f.x + CG.rand(-130, 130), f.y - CG.rand(30, 90), CG.pick(['♪', '♫', '♬']), CG.pick(['#ffe36b', '#ffb0d0', '#b0e8ff']));
    }
  }

  // ---------- rendu ----------
  const pool = []; let np = 0;
  const FLAT = {}; Object.keys(CG.BUILDS).forEach(k => { if (CG.BUILDS[k].flat) FLAT[k] = true; });
  function push(y, k, a, b) { let o = pool[np]; if (!o) o = pool[np] = { y: 0, k: 0, a: null, b: null }; o.y = y; o.k = k; o.a = a; o.b = b; np++; }
  // chantier : fondations, échafaudage, et la construction qui monte avec l'avancement
  // barre de vie + chiffres, pour tous ceux qui ne sont pas à 100 %
  function hpBar(x, y, w, hp, max, col) { Art.bar(ctx, x, y, w, hp / max, col); ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.fillStyle = '#fff'; const s = Math.ceil(hp) + '/' + Math.round(max); ctx.strokeText(s, x, y - 4); ctx.fillText(s, x, y - 4); }
  // une construction détruite : des décombres (pas l'échafaudage d'un chantier neuf), d'où elle se relève quand on la rebâtit
  // la vraie hauteur à l'écran d'une construction (mesurée une fois par sorte) : le chantier la dévoile de bas en haut, du premier au dernier coup de marteau
  const SITE_H = {};
  function siteH(b) {
    const k = b.type + ':' + (b.up || 0) + ':' + (b.ori || 0) + ':' + b.w + 'x' + b.h; if (SITE_H[k]) return SITE_H[k];
    let H = 170;
    try {
      const c = document.createElement('canvas'), base = 300; c.width = b.w * T + 200; c.height = base + b.h * T + 20; const g = c.getContext('2d'); g.translate(100 - b.tx * T, base - b.ty * T);
      if (Art.extra[b.type]) Art.drawExtra(g, b, 0, false); else Art.building(g, b, 0, false);
      const d = g.getImageData(0, 0, c.width, c.height).data; let top = -1;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 90) { top = Math.floor((i >> 2) / c.width); break; }
      if (top >= 0) H = Math.max(30, base + b.h * T + 14 - top + 3);
    } catch (e) { /* on garde la hauteur par défaut */ }
    return (SITE_H[k] = H);
  }
  CG.siteH = siteH;
  function drawRuin(b, t, x, y, w, h, pr) {
    let sd = (b.tx * 73 + b.ty * 151) % 997; const rnd = () => (sd = (sd * 197 + 61) % 997) / 997, cx = x + w / 2, by = y + h, hut = /hut|chief|stock/.test(b.type);
    ctx.fillStyle = 'rgba(40,30,22,0.5)'; ctx.beginPath(); ctx.ellipse(cx, by - h * 0.42, w * 0.56, h * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(20,14,10,0.35)'; ctx.beginPath(); ctx.ellipse(cx - w * 0.08, by - h * 0.4, w * 0.3, h * 0.24, 0, 0, 7); ctx.fill();
    const k = 1 - pr * 0.75; ctx.save(); ctx.globalAlpha = Math.min(1, 1.25 - pr);
    for (let i = 0; i < 3; i++) { const px = x + w * (0.14 + 0.36 * i) + rnd() * 6, ph = (16 + rnd() * 26) * k, py = by - 6 - rnd() * h * 0.5; ctx.fillStyle = '#5a3d20'; ctx.fillRect(px - 3.5, py - ph, 7, ph); ctx.fillStyle = '#2c1c0e'; ctx.beginPath(); ctx.moveTo(px - 3.5, py - ph); ctx.lineTo(px - 1, py - ph - 6); ctx.lineTo(px + 1, py - ph - 1); ctx.lineTo(px + 3.5, py - ph - 5); ctx.lineTo(px + 3.5, py - ph + 3); ctx.lineTo(px - 3.5, py - ph + 3); ctx.fill(); }
    const n = Math.round((7 + b.w * b.h * 2) * k);
    for (let i = 0; i < n; i++) { const px = x + 8 + rnd() * (w - 16), py = by - 8 - rnd() * (h - 12), a = (rnd() - 0.5) * 2.4, L = 16 + rnd() * 22; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = i % 3 ? '#7a5630' : '#4a3018'; ctx.fillRect(-L / 2, -2.5, L, 5); ctx.fillStyle = 'rgba(255,220,160,0.18)'; ctx.fillRect(-L / 2, -2.5, L, 1.5); ctx.restore(); }
    for (let i = 0; i < 5; i++) { const px = x + 6 + rnd() * (w - 12), py = by - 5 - rnd() * (h - 10), r = 4 + rnd() * 4; ctx.fillStyle = '#77736b'; ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.72, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9a968c'; ctx.beginPath(); ctx.ellipse(px - 1, py - 1.2, r * 0.6, r * 0.35, 0, 0, 7); ctx.fill(); }
    if (hut) for (let i = 0; i < 6; i++) { const px = x + 8 + rnd() * (w - 16), py = by - 8 - rnd() * (h - 14); ctx.strokeStyle = i % 2 ? '#c9a13e' : '#a8842c'; ctx.lineWidth = 2; ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(px, py); ctx.lineTo(px + j * 4, py - 9 + Math.abs(j)); } ctx.stroke(); }
    ctx.restore();
    if (pr > 0.02) { const H = siteH(b); ctx.save(); ctx.beginPath(); ctx.rect(x - 70, by + 14 - H * pr, w + 140, H * pr); ctx.clip(); CG.Bt.flipped(ctx, b, () => { if (Art.extra[b.type]) Art.drawExtra(ctx, b, t, false); else Art.building(ctx, b, t, false); }); ctx.restore(); }
    else for (let i = 0; i < 2; i++) { const u = (t * 0.22 + i * 0.5) % 1; ctx.fillStyle = 'rgba(90,86,82,' + (0.3 * (1 - u)) + ')'; ctx.beginPath(); ctx.arc(cx - 10 + i * 22 + Math.sin(t + i * 2 + u * 4) * 5, by - h * 0.5 - u * 46, 5 + u * 9, 0, 7); ctx.fill(); }
    if (pr > 0.02) Art.bar(ctx, cx, y - 8, Math.max(30, w - 16), pr, '#ffe36b'); CG.Chantier.draw(ctx, b, t);
  }
  function drawSite(b, t, night) {
    const x = b.tx * T, y = b.ty * T, w = b.w * T, h = b.h * T, pr = CG.clamp(b.prog / b.need, 0, 1);
    if (b.ruin && !FLAT[b.type]) return drawRuin(b, t, x, y, w, h, pr);
    ctx.fillStyle = 'rgba(122,94,58,0.6)'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.strokeStyle = '#c9a56b'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(x + 3, y + 3, w - 6, h - 6); ctx.setLineDash([]);
    const H = FLAT[b.type] ? h + 14 : siteH(b);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 70, y + h + 14 - H * pr, w + 140, H * pr); ctx.clip(); ctx.globalAlpha = 0.92;
    CG.Bt.flipped(ctx, b, () => { if (FLAT[b.type]) Art.flats(ctx, [b], t); else if (Art.extra[b.type]) Art.drawExtra(ctx, b, t, false); else Art.building(ctx, b, t, false); });
    ctx.restore(); ctx.globalAlpha = 1;
    if (!FLAT[b.type]) { ctx.strokeStyle = '#7a5630'; ctx.lineWidth = 3; const top = y + h - 26 - b.h * 22; [x + 2, x + w - 2].forEach(px => { ctx.beginPath(); ctx.moveTo(px, y + h + 2); ctx.lineTo(px, top); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(x + 2, top + 12); ctx.lineTo(x + w - 2, top + 12); ctx.moveTo(x + 2, y + h - 16); ctx.lineTo(x + w - 2, top + 12); ctx.stroke(); }
    Art.bar(ctx, x + w / 2, y - 8, Math.max(30, w - 16), pr, '#ffe36b'); CG.Chantier.draw(ctx, b, t);
  }
  let shA = null, shB = null, ringCv = null;
  function drawChief(c, p, t, alpha) { const cp = p === S.player && R.chefPose && R.chefPose.fin > R.t && !(R.swing > 0.02) && !(R.castAnim > 0) ? R.chefPose : null; /* au travail : cueillir, piocher, bâtir (pas de coup d'arme) */ const up = R.mount && p === S.player ? CG.Monture.pre(c, p, t) : 0; Art.goblin(c, { dir: CG.Art8.dirFrom(R.dir.x, R.dir.y), x: p.x, y: p.y - up, face: p.face, t: t, moving: up ? false : p.moving, noLegs: !!up, step: p.step, sex: 'm', hue: 112, lum: 46, chief: true, pierre: p === S.player && CG.peauDePierre(), tool: cp ? (cp.k === 'mine' ? 'pioche' : cp.k === 'chop' ? 'hache' : cp.k === 'build' ? 'marteau' : 'baton') : 'baton', glow: R.castAnim > 0 ? '#fff' : '#b070ff', atk: cp ? 0 : R.ruee && R.ruee.ph === 'course' && p === S.player ? 0.42 : Math.max(R.swing, R.castAnim || 0), equip: { armure: p.armor > 0 }, s: 1.12 * (CG.Evo ? CG.Evo.chefScale() : 1), alpha: alpha, pose: cp ? 'work' : (R.trouve || R.criShout > 0) && p === S.player ? 'cheer' : undefined }); }
  // rond de terre autour du feu, de la taille exacte de la zone où l'on ne peut pas bâtir (dessiné une fois, en double résolution)
  function fireRing() {
    if (ringCv) return ringCv;
    const r = W.FIRE_FREE * T * 2, n = Math.ceil(r + 16) * 2, c = ringCv = document.createElement('canvas'), g = c.getContext('2d'), rng = CG.makeRng(77), m = n / 2; c.width = c.height = n;
    const blob = (rad, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.2832, rr = rad + Math.sin(a * 5 + 1) * 3 + Math.sin(a * 11 + 2) * 2.2 + Math.sin(a * 17) * 1.4; g.lineTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    blob(r + 5, 'rgba(60,44,22,0.35)'); blob(r, '#b08a56'); blob(r - 9, '#bd9862');
    for (let i = 0; i < 150; i++) { const a = rng() * 6.2832, d = Math.sqrt(rng()) * (r - 14), s = 3 + rng() * 9; g.fillStyle = rng() < 0.5 ? 'rgba(150,112,64,0.35)' : 'rgba(214,180,124,0.3)'; g.beginPath(); g.ellipse(m + Math.cos(a) * d, m + Math.sin(a) * d, s, s * 0.6, rng() * 3, 0, 6.2832); g.fill(); }
    for (let i = 0; i < 46; i++) { const a = i / 46 * 6.2832 + rng() * 0.08, d = r - 5 + rng() * 5, s = 4 + rng() * 4.5; g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(m + Math.cos(a) * d + 1.5, m + Math.sin(a) * d + 3, s, s * 0.8, 0, 0, 6.2832); g.fill(); g.fillStyle = ['#8f8a80', '#a39d90', '#7b766c'][i % 3]; g.beginPath(); g.ellipse(m + Math.cos(a) * d, m + Math.sin(a) * d, s, s * 0.8, rng() * 3, 0, 6.2832); g.fill(); }
    return c;
  }
  function darkness(h) { if (h < 6) return 0.64; if (h < 7.2) return 0.3 * (1 - (h - 6) / 1.2); if (h < 17.8) return 0; if (h < 20.5) return 0.64 * (h - 17.8) / 2.7; return 0.64; }
  function render() {
    S = CG.S; R = CG.R; frame++;
    const p = S.player, t = R.t, cam = R.cam, k = scale * dpr;
    cam.x = CG.clamp(p.x - vw / 2, 0, CG.MW * T - vw); cam.y = CG.clamp(p.y - 30 - vh / 2, 0, CG.MH * T - vh);
    cam.x = Math.round(cam.x * k) / k; cam.y = Math.round(cam.y * k) / k;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.drawImage(W.terrain, cam.x, cam.y, vw, vh, 0, 0, vw, vh);
    ctx.translate(-cam.x, -cam.y);
    if (!CG.Mondes || CG.Mondes.feuIci()) { const f = G.firePos(), fr = fireRing(); ctx.drawImage(fr, f.x - fr.width / 4, f.y - fr.height / 4, fr.width / 2, fr.height / 2); } // le rond de terre battue : on ne bâtit pas dedans
    // effets au sol
    for (const q of R.rings) { const a = q.life / 0.5; ctx.strokeStyle = q.col; ctx.globalAlpha = Math.min(1, a * 1.4); ctx.lineWidth = 5; ctx.beginPath(); { const rr = Math.max(0, q.r * (1 - a * 0.5)); ctx.ellipse(q.x, q.y, rr, rr * 0.8, 0, 0, 6.3); } ctx.stroke(); ctx.fillStyle = q.col; ctx.globalAlpha = a * 0.18; ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const d of R.delayed) { const f = 1 - d.t / d.max; ctx.fillStyle = 'rgba(255,60,20,' + (0.15 + f * 0.25) + ')'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 10, d.r * (0.4 + f * 0.6), d.r * (0.4 + f * 0.6) * 0.7, 0, 0, 6.3); ctx.fill(); }
    CG.Boss.ground(ctx, t); CG.Magie.ground(ctx, t);
    CG.Bt.tick(); Art.healGlow(ctx, t);
    Art.flats(ctx, S.buildings.filter(b => FLAT[b.type] && !b.site && b.tx + b.w >= cam.x / T - 1 && b.tx <= (cam.x + vw) / T + 1 && b.ty + b.h >= cam.y / T - 1 && b.ty <= (cam.y + vh) / T + 1), t);
    // tout ce qui a une hauteur, trié du fond vers l'avant
    np = 0;
    const x0 = Math.max(0, Math.floor(cam.x / T) - 2), x1 = Math.min(CG.MW - 1, Math.ceil((cam.x + vw) / T) + 1), y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(CG.MH - 1, Math.ceil((cam.y + vh) / T) + 3);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const tl = W.tile[ty * CG.MW + tx];
      if (tl === W.TREE) push(ty * T + T / 2 + 10, 0, tx, ty); else if (tl === W.ROCK) push(ty * T + T / 2 + 8, 1, tx, ty); else if (tl === W.WALL) push(ty * T + T - 4, 2, tx, ty);
    }
    for (const n of W.nodes) if (!n.gone && n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1) push(n.y * T + T / 2 + 6, 3, n, null);
    W.chestDefs.forEach((c, i) => { if (c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1) push(c.y * T + T / 2 + 6, 4, c, i); });
    for (const c of R.chests) if (CG.onScreen(c.x, c.y)) push(c.y + 6, 11, c, null);
    for (const l of S.logs) if (l.tx >= x0 - 2 && l.tx <= x1 + 2 && l.ty >= y0 && l.ty <= y1) push(l.ty * T + T / 2 + 9, 12, l, null);
    const po = W.POI.portail; push((po.y - 2) * T, 5, po, null);
    for (const b of S.buildings) if ((!FLAT[b.type] || b.site) && b.tx + b.w >= x0 - 2 && b.tx <= x1 + 2 && b.ty + b.h >= y0 - 2 && b.ty <= y1 + 3) push((b.ty + b.h) * T - (b.type === 'fire' ? T / 2 : 8), 6, b, null);
    for (const g of S.goblins) if (!g.hidden && CG.onScreen(g.x, g.y)) { if (g.perch) push((g.perch.ty + g.perch.h) * T - 7.5, 15, g, null); else push(g.node && g.tree === null && (g.state === 'work' || Math.abs(g.y - (g.node.y * T + T / 2)) < 22) && Math.abs(g.x - (g.node.x * T + T / 2)) < 34 ? Math.max(g.y, g.node.y * T + T / 2 + 7) : g.y, 7, g, null); } // celui qui cueille ou pioche est dessiné par-dessus son buisson, jamais derrière
    for (const e of R.enemies) if (CG.onScreen(e.x, e.y)) push(e.y, 8, e, null);
    for (const v of R.visitors) if (CG.onScreen(v.x, v.y)) push(v.y, 9, v, null);
    for (const a of S.pets) if (!a.ridden && CG.onScreen(a.x, a.y)) push(a.y + (a.evoT > 0 ? 2 : 0), 13, a, null);
    if (R.golem && !R.golem.dead && CG.onScreen(R.golem.x, R.golem.y)) push(R.golem.y, 14, R.golem, null);
    if (R.band) { const b = R.band; if (b.st === 'camp' || b.st === 'refus') { if (CG.onScreen(b.x, b.y)) push(b.y + 5, 17, b, null); } for (const o of b.m) if (CG.onScreen(o.x, o.y)) push(o.y, 18, o, null); }
    if (S.autels) for (const a of S.autels) if (CG.onScreen(a.tx * T + T / 2, a.ty * T + T / 2)) push(a.ty * T + T / 2 + 14, 16, a, null);
    if (S.statues) for (const a of S.statues.list) if (CG.onScreen(a.tx * T + T / 2, a.ty * T + T / 2)) push(a.ty * T + T / 2 + 14, 20, a, null);
    if (CG.Tableau) { const tb = CG.Tableau.pos(); if (tb && CG.onScreen(tb.x, tb.y)) push(tb.y + 4, 19, tb, null); }
    if (CG.Armee) CG.Armee.pousser(push);
    if (!R.sieste) push(p.y, 10, p, null); // en pleine sieste, le chef est dans sa hutte
    const elite = G.tech('d13'), items = pool.slice(0, np).sort((a, b) => a.y - b.y), night = darkness(S.hour) > 0.3;
    for (const it of items) {
      const a = it.a, big = (it.k === 7 || it.k === 13) && a.nomme;
      if (big) { ctx.save(); ctx.translate(a.x, a.y); ctx.scale(1.14, 1.14); ctx.translate(-a.x, -a.y); }
      switch (it.k) {
        case 0: Art.tree(ctx, a, it.b, 0, R.young.has(it.b * CG.MW + a) ? 0.62 : 0); break;
        case 12: { const el = a.fall !== undefined ? t - a.fall : 9; if (el < 0.9) { const k = el / 0.9, bx = a.tx * T + T / 2 + (W.hash(a.ty, a.tx) - 0.5) * 12, by = a.ty * T + T / 2 + (W.hash(a.tx, a.ty) * 7 % 1 - 0.5) * 8 + 14; ctx.fillStyle = 'rgba(0,0,0,' + (0.25 * (1 - k)) + ')'; ctx.beginPath(); ctx.ellipse(bx, by - 16, 26, 9, 0, 0, 6.3); ctx.fill(); Art.tree(ctx, a.tx, a.ty, Math.pow(k, 2.2) * 1.5 * (a.dir < 0 ? -1 : 1), 0, true); } else Art.log(ctx, a); break; }
        case 1: Art.rock(ctx, a, it.b); break;
        case 2: Art.wall(ctx, a, it.b); break;
        case 3: Art.node(ctx, a, t); break;
        case 4: Art.chest(ctx, a.x * T + T / 2, a.y * T + T / 2, S.chests.includes(it.b)); break;
        case 11: Art.chest(ctx, a.x, a.y, a.open, a.kind); break;
        case 5: Art.portal(ctx, a.x * T + T / 2, (a.y - 2) * T, t, (R.event && (R.event.kind === 'demons' || R.event.type === 'demande')) || (CG.Mondes && (CG.Mondes.ouvert() || CG.Mondes.marais()))); break;
        case 6: if (a.site) { drawSite(a, t, night); break; } CG.Bt.flipped(ctx, a, () => { if (Art.extra[a.type]) Art.drawExtra(ctx, a, t, night); else Art.building(ctx, a, t, a.type === 'fire' ? R.fireLit : night); }); if (a.type === 'tower' && a.manned === false) Art.bubble(ctx, (a.tx + a.w / 2) * T, (a.ty + a.h) * T - 150 + Math.sin(t * 2.5) * 2, '❌'); break;
        case 7: if (a.nap) { CG.Paresse.draw(ctx, a, t); break; } Art.goblin(ctx, { ent: a, x: a.x, y: a.y, face: a.face, t: t, moving: a.moving, step: a.step, sex: a.sex, hue: a.hue, lum: a.lum, job: a.job, pose: a.emoteT > 0 ? 'cheer' : a.pose, equip: a.equip, elite: elite, tool: G.toolOf(a), atk: a.atkAnim, carry: a.carry }); break;
        case 8: Art.enemy(ctx, a, t); break;
        case 9: Art.visitor(ctx, a, t); break;
        case 13: Art.pet(ctx, a, t); break;
        case 14: CG.Magie.draw(ctx, a, t); break;
        case 15: CG.Tours.draw(ctx, a, t); break;
        case 16: CG.Autels.draw(ctx, a, t); break;
        case 19: CG.Tableau.draw(ctx, a, t); break;
        case 20: CG.Statues.draw(ctx, a, t); break;
        case 21: a.draw(ctx, a, t); break;
        case 17: CG.PetitClan.drawCamp(ctx, a, t); break;
        case 18: CG.PetitClan.draw(ctx, a, t); break;
        case 10:
          if (R.cine && R.cine.phase !== 'walk') break;
          if (R.aspire) { const k = Math.min(1, R.aspire.t / R.aspire.dur), an = R.aspire.t * (5 + k * 16); ctx.save(); ctx.beginPath(); ctx.rect(p.x - 60, p.y - 120, 120, 122); ctx.clip(); ctx.translate(p.x, k * k * 58); ctx.scale(Math.cos(an) * (1 - k * 0.25), 1 - k * 0.15); ctx.translate(-p.x, 0); drawChief(ctx, p, t, 1); ctx.restore(); } /* aspiré par le tourbillon : il tourne sur lui-même et s'enfonce */
          else if (R.death) CG.Mort.chief(ctx, p, t, drawChief);
          else if (R.ko > 0) { ctx.save(); ctx.translate(p.x, p.y - 6); ctx.rotate(1.45); Art.goblin(ctx, { x: 0, y: 0, face: 1, t: 0, sex: 'm', hue: 112, lum: 46, chief: true }); ctx.restore(); CG.etoiles(ctx, p.x + 14, p.y - 30, 17, t, 1); }
          else {
            /* le bouclier est dessiné dans effets.js */
            const gz = CG.Potions ? CG.Potions.taille() : 1; if (gz !== 1) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(gz, gz); ctx.translate(-p.x, -p.y); }
            drawChief(ctx, p, t, R.invis > 0 ? 0.3 + Math.sin(t * 5) * 0.06 : R.passe > 0 ? (R.passe <= 3 && Math.floor(t * 8) % 2 ? 0.85 : 0.55 + Math.sin(t * 6) * 0.07) : (R.hurtFlash > 0 || R.invuln > 0) && Math.floor(t * 30) % 2 ? 0.5 : 1);
            if (gz !== 1) ctx.restore();
            if (R.swing > 0) { const a0 = Math.atan2(R.dir.y, R.dir.x); ctx.strokeStyle = 'rgba(255,255,255,' + R.swing * 0.8 + ')'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); if (R.spin) ctx.arc(p.x, p.y - 16, 54, a0 + (1 - R.swing) * 6.3, a0 + 2.6 + (1 - R.swing) * 6.3); else ctx.arc(p.x, p.y - 16, 40, a0 - 1 + (1 - R.swing) * 1.2, a0 + 0.2 + (1 - R.swing) * 1.2); ctx.stroke(); }
          }
          break;
      }
      if (big) ctx.restore();
    }
    // le chef caché derrière un arbre, une hutte, un rocher : on voit sa silhouette en ombre
    if (R.ko <= 0 && !R.cine) {
      const occ = items.filter(it => {
        if (it.y <= p.y) return false; const a = it.a;
        if (it.k === 0) { const x = a * T + T / 2, y = it.b * T + T / 2 + 14; return Math.abs(x - p.x) < 50 && p.y > y - 124 && !R.young.has(it.b * CG.MW + a); }
        if (it.k === 1 || it.k === 2) return Math.abs(a * T + T / 2 - p.x) < 40 && p.y > it.b * T - 30;
        if (it.k === 6) return !a.site && !FLAT[a.type] && a.type !== 'fire' && p.x > a.tx * T - 30 && p.x < (a.tx + a.w) * T + 30 && p.y > a.ty * T - 90;
        return false;
      });
      if (occ.length) {
        const w = 110, h = 124, ox = p.x - w / 2, oy = p.y - h + 14;
        if (!shA) { shA = document.createElement('canvas'); shB = document.createElement('canvas'); }
        for (const c of [shA, shB]) { if (c.width !== Math.ceil(w * k)) { c.width = Math.ceil(w * k); c.height = Math.ceil(h * k); } }
        const ga = shA.getContext('2d'), gb = shB.getContext('2d');
        ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-over'; ga.clearRect(0, 0, shA.width, shA.height); ga.setTransform(k, 0, 0, k, -ox * k, -oy * k);
        for (const it of occ) { const a = it.a; if (it.k === 0) Art.tree(ga, a, it.b, 0, 0); else if (it.k === 1) Art.rock(ga, a, it.b); else if (it.k === 2) Art.wall(ga, a, it.b); else CG.Bt.flipped(ga, a, () => { if (Art.extra[a.type]) Art.drawExtra(ga, a, t, night); else Art.building(ga, a, t, night); }); }
        gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, shB.width, shB.height); gb.setTransform(k, 0, 0, k, -ox * k, -oy * k);
        drawChief(gb, p, t, 1);
        gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'source-in'; gb.fillStyle = '#0a1030'; gb.fillRect(0, 0, shB.width, shB.height);
        ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-in'; ga.drawImage(shB, 0, 0);
        ctx.globalAlpha = 0.66; ctx.drawImage(shA, ox, oy, w, h); ctx.globalAlpha = 1;
      }
    }
    // barres de vie et bulles
    CG.Boss.sky(ctx, t); CG.Magie.marks(ctx, t);
    for (const e of R.enemies) { if (!CG.onScreen(e.x, e.y)) continue; const d = CG.ENEMIES[e.type]; if (e.struct) { Art.bar(ctx, e.x, e.y - 84, 60, e.hp / e.maxhp, '#ff5a3a'); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(d.nom, e.x, e.y - 90); ctx.fillText(d.nom, e.x, e.y - 90); continue; } if (e.hp < e.maxhp || d.boss) Art.bar(ctx, e.x, e.y - 48 * (d.haut || (d.boss ? 1.5 : d.r > 14 ? 1.2 : 1)), d.boss ? 54 : 30, e.hp / e.maxhp, d.boss ? '#ff5aa0' : '#e8402a'); if (d.boss) { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; const ny = d.haut ? 48 * d.haut + 6 : 78; ctx.strokeText(d.nom, e.x, e.y - ny); ctx.fillText(d.nom, e.x, e.y - ny); } }
    if (R.hutSel !== null && R.hutSel !== undefined) { const hb = S.buildings[R.hutSel]; if (hb) { ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.strokeRect(hb.tx * T - 4, hb.ty * T - 4, hb.w * T + 8, hb.h * T + 8); ctx.setLineDash([]); } for (const g of S.goblins) if (g.home === R.hutSel && !g.hidden) { const yy = g.y - 66 + Math.sin(t * 5) * 4; ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.moveTo(g.x - 8, yy - 10); ctx.lineTo(g.x + 8, yy - 10); ctx.lineTo(g.x, yy + 2); ctx.closePath(); ctx.fill(); } }
    const see = G.seeApt(), tasks = CG.Soc.tasks();
    for (const g of S.goblins) { if (g.hidden || !CG.onScreen(g.x, g.y)) continue; /* ses forces et ses faiblesses ne flottent plus au-dessus de sa tête : elles sont dans sa fiche (inventaire.js) */
      if (tasks.length && !g.bubble && tasks.some(k => k.to === g)) Art.bubble(ctx, g.x, g.y - 62 + Math.sin(t * 4) * 3, '📌');
      if (g.pep > 0 && !(g.boost > 0) && !g.bubble) { ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎵', g.x + 12, g.y - 44 + Math.sin(t * 6 + g.id) * 2); }
      if (g.boost > 0 && !g.bubble) { ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💢', g.x + 12, g.y - 44 + Math.sin(t * 10) * 2); }
      if (!g.met && !g.bubble) Art.bubble(ctx, g.x, g.y - 60 + Math.sin(t * 3 + g.id) * 2, '👋'); const mh = G.gobMaxHp(g); if (g.hp < mh - 0.5) hpBar(g.x, g.y - 46, 30, g.hp, mh, '#6ad84a'); if (g.bubble) Art.bubble(ctx, g.x, g.y - 60, g.bubble); }
    { const p = S.player; if (p.hp < p.maxhp - 0.5 && R.ko <= 0) hpBar(p.x, p.y - 56, 36, p.hp, p.maxhp, '#ff5a4a'); }
    for (const b of S.buildings) { const mh = G.buildMaxHp(b); if (mh && b.hp < mh) Art.bar(ctx, (b.tx + b.w / 2) * T, b.ty * T - (b.h > 1 ? 34 : 14), b.w > 1 ? 46 : 30, b.hp / mh, '#e8c84a'); }
    for (const e of R.enemies) { if (!(e.fear > 0 || e.daze > 0 || e.etourdi > R.t) || e.dead || !CG.onScreen(e.x, e.y)) continue; ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; if (e.fear > 0) { ctx.fillText('😱', e.x, e.y - 54); continue; }
      /* assommé : de petites étoiles tournent autour de sa tête, comme dans les dessins animés (celles de derrière sont plus petites et plus pâles) */
      const gros = e.grosArene ? 1.5 : 1, rr = (e.r || 12) * gros; CG.etoiles(ctx, e.x, e.y - 30 - rr * 1.5, 11 + rr * 0.6, t, gros); }
    /* un animal tombé au combat est mort : son corps reste par terre, sans étoiles */
    if (R.etoilesKO) { R.etoilesKO = R.etoilesKO.filter(q => q.fin > R.t); for (const q of R.etoilesKO) if (CG.onScreen(q.x, q.y)) { ctx.globalAlpha = Math.min(1, (q.fin - R.t) * 2); if (q.g) { ctx.save(); ctx.translate(q.x, q.y - 6); ctx.rotate(1.45); try { Art.goblin(ctx, Object.assign({ x: 0, y: 0, face: 1, t: 0 }, q.g)); } catch (er) { /* rien */ } ctx.restore(); CG.etoiles(ctx, q.x + 14, q.y - 30, 17, t, 1); } else CG.etoiles(ctx, q.x, q.y - 44, 17, t, 1); } ctx.globalAlpha = 1; } /* là où un gobelin vient de tomber */
    for (const a of S.pets) { if (a.ko || !CG.onScreen(a.x, a.y)) continue; const mh = CG.P.maxHp(a), fly = CG.P.KINDS[a.kind].fly; if (a.hp < mh - 0.5) hpBar(a.x, a.y - (fly ? 74 : 44) * (a.evo ? 1.3 : 1), 30, a.hp, mh, '#4ad8c8'); if (a.buffT > 0 || a.eat) { ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(a.eat ? '🥣' : CG.P.BUFFS[a.buff].icon, a.x + 16, a.y - (fly ? 70 : 40) * (a.evo ? 1.3 : 1) + Math.sin(t * 5 + a.id) * 2); } }
    const ev = R.event; if (ev && ev.type === 'demande' && ev.lord.state === 'wait') { Art.bubble(ctx, ev.lord.x, ev.lord.y - 90 + Math.sin(t * 4) * 3, '❗'); Art.bar(ctx, ev.lord.x, ev.lord.y - 72, 50, ev.timer / 80, '#c070ff'); }
    for (const v of R.visitors) if (v.state === 'wait' && v.role !== 'seigneur' && v.role !== 'escorte') Art.bubble(ctx, v.x, v.y - (v.role === 'animal' ? 58 : v.role === 'monstre' ? 50 + (CG.P.KINDS[v.kind].min > 6 ? 34 : v.kind === 'gelee' ? -8 : 12) : v.role === 'esprit' ? 82 : 66) + Math.sin(t * 3 + v.seed) * 2, v.role === 'nomade' || v.role === 'monstre' ? '👋' : v.role === 'esprit' ? '🎁' : v.role === 'animal' ? '🍖' : v.role === 'fee' ? '✨' : '💰');
    const it = UI.modal ? null : D.findInteract();
    if (it && it.obj && it.obj.x !== undefined && it.type !== 'chestDay') Art.toucheE(ctx, it.obj.x, it.obj.y - (it.type === 'visitor' ? 88 : it.type === 'pet' ? (CG.P.KINDS[it.obj.kind] && CG.P.KINDS[it.obj.kind].monstre ? 66 : 52) + (it.obj.evo ? 8 : 0) : 60), t); // au-dessus de la plaque des aptitudes quand elle est affichée
    // projectiles, particules, éclairs
    for (const s of R.shots) {
      if (s.kind === 'arrow' || s.kind === 'carreau') { const big = s.kind === 'carreau' ? 2 : 1, a = Math.atan2(s.vy, s.vx); ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2 * big; ctx.beginPath(); ctx.moveTo(s.x - Math.cos(a) * 12 * big, s.y - Math.sin(a) * 12 * big); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.fillStyle = '#b8bcc8'; ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); }
      else if (s.etin && CG.Etincelle) CG.Etincelle.dessin(ctx, s, t); // l'Étincelle a son propre dessin, qui grandit avec le sort (etincelle.js)
      else { const col = s.kind === 'bolt' ? '#ffe36b' : s.kind === 'feu' ? '#ff8a1e' : '#ff5a3a', r = s.kind === 'feu' ? 9 : 6; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.45, 0, 6.3); ctx.fill(); }
    }
    if (R.picking) { const k = R.picking; Art.bar(ctx, k.n.x * T + T / 2, k.n.y * T - 6, 34, k.t / k.max, '#8dff8a'); }
    if (R.drops && R.drops.length) Art.drops(ctx, R.drops, t);
    if (R.build) CG.Bt.draw(ctx, t);
    if (R.ghost) Art.ghost(ctx, R.ghost, t);
    if (R.walls && R.walls.length) Art.fireWalls(ctx, R.walls, t);
    for (const d of R.delayed) { const f = 1 - d.t / d.max, mx = d.x + (1 - f) * 220, my = d.y - (1 - f) * 520; ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, 6.3); ctx.fill(); ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.arc(mx - 3, my + 4, 11, 0, 6.3); ctx.fill(); ctx.strokeStyle = 'rgba(255,140,40,0.5)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 40, my - 95); ctx.stroke(); }
    for (const q of R.parts) { ctx.globalAlpha = Math.min(1, q.life / q.max * 1.6); ctx.fillStyle = q.col; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
    ctx.globalAlpha = 1;
    for (const b of R.bolts) { ctx.strokeStyle = 'rgba(230,220,255,' + (b.life / 0.25) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); for (let i = 1; i < 6; i++) ctx.lineTo(CG.lerp(b.x1, b.x2, i / 6) + CG.rand(-9, 9), CG.lerp(b.y1, b.y2, i / 6) + CG.rand(-9, 9)); ctx.lineTo(b.x2, b.y2); ctx.stroke(); }
    // nuit : voile sombre troué par les lumières
    const dark = darkness(S.hour);
    if (dark > 0.01) {
      const g2 = nightG, hk = k / 2, L = Art.light();
      g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, nightC.width, nightC.height); g2.fillStyle = 'rgba(10,12,44,' + dark + ')'; g2.fillRect(0, 0, nightC.width, nightC.height);
      g2.globalCompositeOperation = 'destination-out';
      const light = (x, y, r, a) => { if (x < cam.x - r || x > cam.x + vw + r || y < cam.y - r || y > cam.y + vh + r) return; g2.globalAlpha = a; g2.drawImage(L, (x - cam.x - r) * hk, (y - cam.y - r) * hk, r * 2 * hk, r * 2 * hk); };
      const f = G.firePos();
      if (R.fireLit) light(f.x, f.y - 20, 330 + Math.sin(t * 9) * 10, 1);
      light(p.x, p.y - 16, 130, 0.75);
      for (const b of S.buildings) { if (b.site) continue; const bx = (b.tx + b.w / 2) * T, by = (b.ty + b.h) * T; if (b.type === 'hut' || b.type === 'chief' || b.type === 'taverne') light(bx, by, 70, 0.6); else if (b.type === 'torche') light(bx, by - 46, 170 + Math.sin(t * 9 + bx) * 6, 0.95); else if (b.type === 'cristal' || b.type === 'tourMagie') light(bx, by - (b.type === 'cristal' ? 36 : 134), 80, 0.6); }
      light(po.x * T + T / 2, (po.y - 2) * T - 20, 90, 0.5);
      for (const s of R.shots) if (s.kind !== 'arrow') light(s.x, s.y, 60, 0.7);
      g2.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nightC, 0, 0, cv.width, cv.height);
      if (R.fireLit) { ctx.setTransform(k, 0, 0, k, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, dark * 1.5); ctx.drawImage(Art.glow(), f.x - cam.x - 300, f.y - 20 - cam.y - 300, 600, 600); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.translate(-cam.x, -cam.y);
    }
    // bulles de parole (par-dessus la nuit)
    for (const sp of R.speech) {
      if (sp.delay > 0 || !CG.onScreen(sp.e.x, sp.e.y)) continue;
      ctx.font = '13px "Trebuchet MS", sans-serif'; const words = sp.txt.split(' '), lines = []; let cur = '';
      for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > 170 && cur) { lines.push(cur); cur = w; } else cur = tt; } lines.push(cur);
      const bw = Math.max.apply(null, lines.map(l => ctx.measureText(l).width)) + 18, bh = lines.length * 16 + 10, bx = sp.e.x - bw / 2, by = sp.e.y - 62 - bh, a = Math.min(1, sp.t * 3, 1);
      ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(40,30,20,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + 8, by); ctx.arcTo(bx + bw, by, bx + bw, by + bh, 8); ctx.arcTo(bx + bw, by + bh, bx, by + bh, 8); ctx.lineTo(sp.e.x + 7, by + bh); ctx.lineTo(sp.e.x, by + bh + 9); ctx.lineTo(sp.e.x - 5, by + bh); ctx.arcTo(bx, by + bh, bx, by, 8); ctx.arcTo(bx, by, bx + bw, by, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a1c0a'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; lines.forEach((l, i) => ctx.fillText(l, sp.e.x, by + 18 + i * 16));
    }
    ctx.globalAlpha = 1;
    // textes flottants (par-dessus la nuit)
    ctx.textAlign = 'center';
    for (const q of R.texts) { ctx.globalAlpha = Math.min(1, q.life * 1.6); ctx.font = (q.big ? 'bold 19px' : 'bold 14px') + ' sans-serif'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); }
    ctx.globalAlpha = 1;
    // flèche vers les ennemis hors de l'écran
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (R.alarm) {
      let ne = null, nd = 1e9; for (const e of R.enemies) { if (!e.event || e.dead || e.struct) continue; const d = CG.dist(e, p); if (d < nd) { nd = d; ne = e; } }
      if (ne && !CG.onScreen(ne.x, ne.y)) { const a = Math.atan2(ne.y - p.y, ne.x - p.x), ax = CG.clamp(vw / 2 + Math.cos(a) * vw, 50, vw - 50), ay = CG.clamp(vh / 2 + Math.sin(a) * vh, 110, vh - 110); ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = 'rgba(255,70,50,' + (0.6 + Math.sin(t * 8) * 0.3) + ')'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if (R.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,0,0,' + R.hurtFlash * 0.5 + ')'; ctx.fillRect(0, 0, vw, vh); }
    if (R.fade > 0) { ctx.fillStyle = 'rgba(4,4,14,' + R.fade + ')'; ctx.fillRect(0, 0, vw, vh); }
    CG.Boss.hud(ctx, vw, vh);
    if (R.death) CG.Mort.overlay(ctx, vw, vh, p.x - cam.x, p.y - cam.y);
    if (R.night) Art.nightScene(ctx, vw, vh, R.night);
    // mini-carte
    if (frame % 8 === 0 || (R.pings && R.pings.length)) {
      if (W.miniDirty) W.drawMini();
      miniG.drawImage(W.mini, 0, 0);
      const dot = (x, y, c, s) => { miniG.fillStyle = c; miniG.fillRect(x / T * 2 - s / 2, y / T * 2 - s / 2, s, s); };
      for (const g of S.goblins) if (!g.hidden) dot(g.x, g.y, '#c8ff8a', 2);
      for (const v of R.visitors) dot(v.x, v.y, '#7ad0ff', 4);
      for (const a of S.pets) if (!a.ko) dot(a.x, a.y, '#4ad8c8', 3);
      if (R.golem && !R.golem.dead) dot(R.golem.x, R.golem.y, '#e0b070', 4);
      if (R.band && R.band.seen) dot(R.band.m[0].x, R.band.m[0].y, '#ffe36b', 4);
      if (S.autels) for (const a of S.autels) if (a.st !== 'vide' && !(a.off && a.st === 'scelle')) dot(a.tx * T + T / 2, a.ty * T + T / 2, '#d080ff', 4);
      if (S.statues) for (const a of S.statues.list) if (!a.use) dot(a.tx * T + T / 2, a.ty * T + T / 2, '#e8dcff', 3);
      CG.Scout.mini(miniG, dot); // ennemis, trésors, repaires : seulement ce qui a été découvert
      for (const k of CG.Soc.tasks()) dot(k.to.x, k.to.y, '#ff7ad0', 5);
      miniG.strokeStyle = 'rgba(255,255,255,0.6)'; miniG.lineWidth = 1; miniG.strokeRect(cam.x / T * 2, cam.y / T * 2, vw / T * 2, vh / T * 2);
      dot(p.x, p.y, '#fff', 5);
    }
    let hint = '';
    if (R.build) hint = ''; /* en construction : pas de bandeau de touches (Clic, R, Échap), la barre suffit */
    else if (it) hint = '<b>E</b> ' + it.label;
    UI.refresh(hint);
  }

  // les petites étoiles qui tournent autour de la tête de quelqu'un d'assommé (celles de derrière sont plus petites et plus pâles)
  CG.etoiles = function (ctx, x, hy, rx, t, gros) { const al = ctx.globalAlpha;
    for (let i = 0; i < 4; i++) { const a = t * 5.5 + i * Math.PI / 2, dv = Math.sin(a), sx = x + Math.cos(a) * rx, sy = hy + dv * rx * 0.32, k = (4.3 + dv * 1.4) * (0.9 + gros * 0.1), rot = t * 3 + i;
      ctx.globalAlpha = al * (0.6 + (dv + 1) * 0.2); ctx.fillStyle = i % 2 ? '#fff2a0' : '#ffd84a'; ctx.beginPath(); for (let j = 0; j < 10; j++) { const q = rot + j * Math.PI / 5, d = j % 2 ? k * 0.45 : k; ctx.lineTo(sx + Math.cos(q) * d, sy + Math.sin(q) * d); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, k * 0.22, 0, 6.283); ctx.fill(); } ctx.globalAlpha = al; };
  CG.SON_FEU = { PRES: 130, LOIN: 900, MIN: 0.035, COURBE: 3, FEU_PRES: 110, FEU_LOIN: 520 }; /* COURBE : plus c'est grand, plus la musique reste basse tant qu'on n'est pas tout près */ /* la musique de la fête : à fond à moins de PRES du feu, au plus bas (MIN) au-delà de LOIN ; le crépitement s'entend de plus près */
  function updateMusic() {
    const modal = UI.modal;
    if (!CG.running || (modal && modal.name === 'over') || R.death) CG.audio.ambiance(null);
    if (!CG.running) return CG.audio.music('menu');
    if (modal && modal.name === 'over') return CG.audio.music('defeat');
    if (R.death) return CG.audio.music(null);
    const p = S.player;
    const boss = R.enemies.some(e => !e.dead && !e.retreat && CG.ENEMIES[e.type].boss && CG.dist(e, p) < 470);
    const fight = R.alarm || R.horde || R.playerCombatUntil > R.t;
    const night = R.night || S.hour >= 19 || S.hour < 6;
    const aide = CG.Arene && CG.Arene.dans() && S.arene && !(CG.Arene.Q[S.arene.id] || {}).vagues; // chez celui qui a demandé de l'aide : sa musique à lui
    const Mo = CG.Mondes, ici = Mo ? Mo.ici() : 0, dedans = ici === 2, F = CG.SON_FEU;
    const mode = boss ? 'boss' : aide ? 'aide' : fight ? 'fight' : R.night ? 'night' : R.fireLit ? (S.day % 2 ? 'party' : 'party2') : ici === 1 ? 'marais' : night ? 'night' : 'day';
    /* la fête s'entend de loin, tout bas, et de plus en plus fort en revenant vers le feu */
    let pres = 0, feu = null; if (!dedans && (!Mo || Mo.feuIci())) { try { feu = G.firePos(); } catch (e) { feu = null; } }
    if (feu) { const d = CG.dist(p, feu); pres = CG.clamp(1 - (d - F.PRES) / (F.LOIN - F.PRES), 0, 1); }
    const fete = mode === 'party' || mode === 'party2', pause = modal && modal.pauses ? 0.32 : 1;
    CG.audio.music(mode, modal && modal.pauses ? 0.32 : R.night ? 0.65 : fete ? F.MIN + (1 - F.MIN) * Math.pow(pres, F.COURBE) : 1);
    const lave = CG.GrotteNid && CG.GrotteNid.mode() === 'lave', crepite = feu && R.fireLit && !R.night ? CG.clamp(1 - (CG.dist(p, feu) - F.FEU_PRES) / (F.FEU_LOIN - F.FEU_PRES), 0, 1) : 0;
    CG.audio.ambiance({ lave: lave ? pause : 0, feu: crepite * pause, ronfle: R.night && !R.night.raid ? 1 : 0, nuit: night && !R.night && !dedans && !fight ? (1 - 0.6 * (R.fireLit ? pres : 0)) * pause : 0 });
  }
  function tick(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (CG.running) { step(dt); render(); } else CG.takePresses();
    updateMusic();
    requestAnimationFrame(tick);
  }
  window.addEventListener('load', () => {
    cv = document.getElementById('game'); ctx = cv.getContext('2d');
    nightC = document.createElement('canvas'); nightG = nightC.getContext('2d');
    mini = document.getElementById('mini'); mini.width = CG.MW * 2; mini.height = CG.MH * 2; miniG = mini.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    cv.addEventListener('mousedown', e => {
      if (!CG.running || UI.modal) return;
      if (e.button !== 0) return;
      if (R.build) { R.mouse = { x: e.clientX / scale, y: e.clientY / scale }; D.placeBuild(); return; }
      if (CG.Chantier.click(e.clientX / scale + R.cam.x, e.clientY / scale + R.cam.y)) return; // le ✖ d'un chantier
      { const cx = Math.floor((e.clientX / scale + R.cam.x) / T), cy = Math.floor((e.clientY / scale + R.cam.y) / T), hb = [G.buildingAt(cx, cy), G.buildingAt(cx, cy + 1)].find(b => b && b.type === 'hut' && !b.site); if (hb) { UI.hut(hb); return; } if (CG.Monolithe && CG.Monolithe.clic(cx, cy)) return; }
      const wx = e.clientX / scale + R.cam.x, wy = e.clientY / scale + R.cam.y, p = S.player, d = Math.hypot(wx - p.x, wy - p.y + 16) || 1;
      R.dir = { x: (wx - p.x) / d, y: (wy - p.y + 16) / d }; if (Math.abs(wx - p.x) > 6) p.face = wx > p.x ? 1 : -1; G.attack();
    });
    UI.init(); UI.title(); requestAnimationFrame(tick);
  });

  // ---------- outils d'essai ----------
  CG.debug = {
    hour: h => { CG.S.hour = h; },
    attack: (kind, boss) => D.startAttack({ kind: kind || 'humains', boss }),
    visit: role => D.startVisit({ role: role || 'nain' }),
    demand: () => D.startDemand(),
    give: () => { const s = CG.S; s.res.or += 500; s.res.bois += 200; s.res.minerai += 100; s.res.cuir += 50; s.res.food += 200; CG.SCROLL_POOL.forEach(i => { if (!s.player.spells.includes(i)) s.player.scrolls[i] = 1; }); },
    sim: (sec, dt) => { dt = dt || 1 / 30; for (let i = 0; i < sec / dt; i++) { if (UI.modal) UI.close(); D.update(dt); if (!UI.modal) G.update(dt); } },
    step, render
  };
})(window.CG);
