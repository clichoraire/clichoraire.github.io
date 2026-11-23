// Goblin Malin — les morts se diversifient. Squelettes et spectres ont maintenant trois rangs et un lanceur de sorts :
//   rouge : court plus vite et tape plus fort ;
//   noir  : encore plus vite, encore plus fort, et deux attaques spéciales qu'on voit venir et qu'on peut éviter ;
//   mage  : il flotte (le squelette n'a plus de jambes) et lance des boules de feu de loin.
// Squelette noir : un os lancé tout droit, et un grand coup au sol dans un cercle. Spectre noir : une charge en ligne droite, et un cri glaçant autour de lui.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, Art = CG.Art, Sp = CG.Spectres, TAU = Math.PI * 2, rand = CG.rand, dist = CG.dist, pick = CG.pick;
  const Mt = CG.Morts = { REPOS: [4.5, 7], OS_V: 330, OS_T: 0.85, FRACAS: 62, CHARGE: 330, CHARGE_V: 620, CRI: 96, GEL: 3, GEL_K: 0.6 };
  Object.assign(CG.ENEMIES, {
    squeletteRouge: { nom: 'Squelette rouge', race: 'mort', hp: 40, dmg: 9, spd: 125, xp: 18, or: 9, cost: 3.5 },
    squeletteNoir: { nom: 'Squelette noir', race: 'mort', hp: 74, dmg: 13, spd: 140, xp: 40, or: 16, cost: 6.5, r: 13 },
    squeletteMage: { nom: 'Liche volante', race: 'mort', hp: 34, dmg: 8, spd: 70, xp: 24, or: 10, cost: 4, range: 220, magic: true },
    spectreRouge: { nom: 'Spectre écarlate', race: 'mort', hp: 44, dmg: 10, spd: 125, xp: 34, or: 7, cost: 4.5, r: 12 },
    spectreNoir: { nom: 'Spectre noir', race: 'mort', hp: 82, dmg: 14, spd: 140, xp: 60, or: 14, cost: 8, r: 13 },
    spectreMage: { nom: 'Spectre ensorceleur', race: 'mort', hp: 36, dmg: 8, spd: 64, xp: 30, or: 9, cost: 4.5, range: 220, magic: true }
  });
  if (Sp && Sp.FANTOME) { Sp.FANTOME.spectreRouge = 1; Sp.FANTOME.spectreNoir = 1; } // eux aussi traversent tout
  // qui apparaît à la place d'un squelette ou d'un spectre ordinaire, selon le jour : [type, à partir du jour, chance]
  Mt.RANGS = { squelette: [['squeletteNoir', 8, 0.12], ['squeletteRouge', 4, 0.25], ['squeletteMage', 3, 0.15]], spectre: [['spectreNoir', 9, 0.12], ['spectreRouge', 5, 0.25], ['spectreMage', 4, 0.15]] };
  Mt.variante = function (type) { const l = Mt.RANGS[type], d = CG.S ? CG.S.day : 1; if (!l) return type; for (const q of l) if (d >= q[1] && Math.random() < q[2]) return q[0]; return type; };
  const sp0 = G.spawnEnemy; G.spawnEnemy = function (type, x, y, opts) { return sp0.call(this, opts && opts.exact ? type : Mt.variante(type), x, y, opts); };

  // ---------- les attaques spéciales des noirs ----------
  const pris = e => e.para > 0 || e.poly || e.sleepT > 0 || e.charm > 0 || e.fear > 0 || e.daze > 0 || e.rooted > 0 || e.retreat;
  const nous = () => { const S = CG.S, R = CG.R, l = []; if (!(R.ko > 0)) l.push(S.player); for (const g of S.goblins) if (!g.hidden && g.ko !== true) l.push(g); for (const a of S.pets) if (!a.ko && !a.ridden) l.push(a); return l; };
  const frappe = (o, dmg) => { const S = CG.S; if (o === S.player) G.hurtPlayer(dmg); else if (S.pets.includes(o)) CG.P.hurt(o, dmg); else G.hurtGoblin(o, dmg); };
  function pas(e, dt) {
    const S = CG.S, R = CG.R, noirS = e.type === 'squeletteNoir';
    if (pris(e)) { e.spe = null; return; }
    const s = e.spe;
    if (!s) {
      e.speCd = (e.speCd === undefined ? rand(1.5, 3.5) : e.speCd) - dt; const tg = e.target; if (!tg || e.speCd > 0 || tg.dead) return; const d = dist(e, tg);
      const k = e.speAlt = !e.speAlt; // une fois l'une, une fois l'autre
      if (noirS) { if (k) { if (d < 70 || d > 290 || !W.lineClear(e.x, e.y, tg.x, tg.y)) { e.speAlt = !k; return; } e.spe = { k: 'os', t: 0.6, max: 0.6 }; } else { if (d > 150) { e.speAlt = !k; return; } e.spe = { k: 'fracas', t: 0.9, max: 0.9, cx: tg.x, cy: tg.y }; } }
      else { if (k) { if (d < 60 || d > 300) { e.speAlt = !k; return; } e.spe = { k: 'charge', t: 0.6, max: 0.6 }; } else { if (d > 130) { e.speAlt = !k; return; } e.spe = { k: 'cri', t: 1, max: 1 }; } }
      const sp = e.spe, dx = tg.x - e.x, dy = tg.y - e.y, l = Math.hypot(dx, dy) || 1; sp.ux = dx / l; sp.uy = dy / l; sp.x = e.x; sp.y = e.y; e.path = null; e.face = dx > 0 ? 1 : -1;
      G.text(e.x, e.y - 58, '❗', '#ff6a4a', true); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); return;
    }
    e.x = s.x; e.y = s.y; e.moving = false; e.atkCd = Math.max(e.atkCd, 0.4);
    if (!s.parti) { s.t -= dt; if (s.t > 0) return; s.parti = true; e.atkAnim = 1;
      if (s.k === 'os') { (R.osMorts = R.osMorts || []).push({ x: e.x, y: e.y - 20, ux: s.ux, uy: s.uy, t: 0, dmg: e.dmg * 1.3, vus: new Set() }); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); fin(e); }
      else if (s.k === 'fracas') { for (const o of nous()) if (Math.hypot(o.x - s.cx, o.y - s.cy) < Mt.FRACAS) frappe(o, e.dmg * 1.6); R.rings.push({ x: s.cx, y: s.cy, r: Mt.FRACAS * 1.5, life: 0.4, col: '#c8b8ff' }); G.puff(s.cx, s.cy - 6, '#d8d0c0', 22, 170, 5); R.shake = Math.max(R.shake || 0, 0.25); if (CG.onScreen(s.cx, s.cy)) CG.sfx('tombe'); fin(e); }
      else if (s.k === 'cri') { for (const o of nous()) if (Math.hypot(o.x - e.x, o.y - e.y) < Mt.CRI) { frappe(o, e.dmg * 0.8); if (o === S.player) { R.gelMort = Mt.GEL; G.text(o.x, o.y - 70, '🥶 Glacé jusqu\'aux os', '#bfe6ff', true); } } for (let i = 0; i < 2; i++) R.rings.push({ x: e.x, y: e.y - 10, r: Mt.CRI * (1.1 + i * 0.4), life: 0.4 + i * 0.12, col: '#bfe6ff' }); if (CG.onScreen(e.x, e.y)) CG.sfx('horn'); fin(e); }
      else { s.d = 0; s.vus = new Set(); if (CG.onScreen(e.x, e.y)) CG.sfx('swing'); }
      return;
    }
    // la charge du spectre noir : tout droit, à travers tout
    const st = Mt.CHARGE_V * dt; s.d += st; e.x = s.x = CG.clamp(s.x + s.ux * st, 20, CG.MW * CG.TILE - 20); e.y = s.y = CG.clamp(s.y + s.uy * st, 20, CG.MH * CG.TILE - 20); e.moving = true; e.step += dt * 4;
    R.parts.push({ x: e.x, y: e.y - 24, vx: 0, vy: 0, life: 0.25, max: 0.25, col: '#4a3a70', size: 7, float: true });
    for (const o of nous()) if (!s.vus.has(o) && Math.hypot(o.x - e.x, o.y - e.y) < 24) { s.vus.add(o); frappe(o, e.dmg * 1.4); }
    if (s.d >= Mt.CHARGE) fin(e);
  }
  function fin(e) { e.spe = null; e.speCd = rand(Mt.REPOS[0], Mt.REPOS[1]); e.atkCd = Math.max(e.atkCd, 0.6); }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R, L = [];
    if (S && R) for (const e of R.enemies) if ((e.type === 'squeletteNoir' || e.type === 'spectreNoir') && !e.dead) { L.push(e); if (e.spe) e.atkCd = Math.max(e.atkCd, 0.4); }
    up0.apply(this, arguments); if (CG.S !== S || CG.R !== R || !S || !R || R.night || R.cine) return;
    if (R.gelMort > 0) R.gelMort -= dt;
    for (const e of L) if (!e.dead) pas(e, dt);
    const O = R.osMorts; if (O && O.length) { for (const o of O) { o.t += dt; o.x += o.ux * Mt.OS_V * dt; o.y += o.uy * Mt.OS_V * dt; for (const q of nous()) if (!o.vus.has(q) && Math.hypot(q.x - o.x, q.y - 18 - o.y) < 18) { o.vus.add(q); frappe(q, o.dmg); o.t = 9; } } R.osMorts = O.filter(o => o.t < Mt.OS_T); }
  };
  const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (CG.R && CG.R.gelMort > 0 ? Mt.GEL_K : 1); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'gelMort', ic: '🥶', mal: true, nom: () => 'Glacé jusqu\'aux os', txt: 'Le cri du spectre noir t\'a transi : tu marches bien moins vite.', t: () => CG.R.gelMort > 0 ? CG.R.gelMort : 0 });

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const OS = { squeletteRouge: { skin: '#f08070', tunic: '#8a2a22', legs: '#c85a4c', sleeve: '#d86a5a', s: 1.06 }, squeletteNoir: { skin: '#4a4454', tunic: '#1c1824', legs: '#35303e', sleeve: '#3c3646', s: 1.2, cape: '#3a1450' } };
  const BRUME = {
    spectreRouge: [{ corps: 'rgba(255,140,130,0.92)', clair: 'rgba(255,225,215,0.5)', oeil: '#3a0c10', alpha: 0.82 }, 1.08],
    spectreNoir: [{ corps: 'rgba(30,26,46,0.96)', clair: 'rgba(110,90,160,0.4)', oeil: '#c8a0ff', alpha: 0.94, capuche: '#120e1c' }, 1.3],
    spectreMage: [{ corps: 'rgba(170,150,255,0.9)', clair: 'rgba(255,255,255,0.5)', oeil: '#fff07a', alpha: 0.84, capuche: '#3c2f72' }, 1.05]
  };
  function orbe(g, x, y, t, col) { const r = 3.6 + Math.sin(t * 7) * 0.8; ell(g, x, y, r * 2.4, r * 2.4, 'rgba(255,150,60,0.22)'); ell(g, x, y, r, r, col); ell(g, x - 1, y - 1, r * 0.4, r * 0.4, '#fff6d0'); }
  const ae = Art.enemy; Art.enemy = function (g, e, t) {
    const T0 = t + (e.seed || 0), f = e.face < 0 ? -1 : 1;
    if (OS[e.type]) { if (e.type === 'squeletteNoir') ell(g, e.x, e.y - 24, 24, 30, 'rgba(130,60,200,0.14)');
      return Art.humanoid(g, Object.assign({ x: e.x, y: e.y, face: e.face, t: T0, moving: e.moving, step: e.step, atk: e.atkAnim, angry: !e.calm, skull: true, weapon: 'epee' }, OS[e.type])); }
    if (e.type === 'squeletteMage') { // il flotte : un buste de squelette en robe, sans jambes, le bas en lambeaux
      const fl = Math.sin(T0 * 2.2) * 3, haut = 15 + fl; ell(g, e.x, e.y + 1, 10, 3.2, 'rgba(0,0,0,0.16)'); ell(g, e.x, e.y - 34, 22, 28, 'rgba(150,90,255,0.12)');
      g.save(); g.beginPath(); g.rect(e.x - 50, e.y - 120, 100, 120 - haut - 8); g.clip();
      Art.humanoid(g, { x: e.x, y: e.y - haut, face: e.face, t: T0, moving: false, step: 0, atk: e.atkAnim, angry: true, skull: true, skin: '#e6e0f2', tunic: '#3c2a66', legs: '#3c2a66', sleeve: '#4c3880', robe: true }); g.restore();
      g.fillStyle = '#3c2a66'; g.beginPath(); const y0 = e.y - haut - 9; g.moveTo(e.x - 9, y0); for (let i = 0; i < 4; i++) { const x1 = e.x - 9 + (i + 0.5) * 4.5, x2 = e.x - 9 + (i + 1) * 4.5; g.lineTo(x1 + Math.sin(T0 * 5 + i) * 1.6, y0 + 9 + (i % 2) * 5); g.lineTo(x2, y0); } g.closePath(); g.fill();
      orbe(g, e.x + f * (13 + (e.atkAnim > 0 ? e.atkAnim * 6 : 0)), e.y - haut - 24, T0, '#ff8a3a'); return; }
    if (BRUME[e.type] && Sp && Sp.dessin) { const q = BRUME[e.type];
      if (e.type === 'spectreNoir') ell(g, e.x, e.y - 30, 30, 36, 'rgba(90,50,160,0.16)');
      Sp.dessin(g, e, t, q[0], q[1]); if (e.type === 'spectreMage') orbe(g, e.x + f * (17 + (e.atkAnim > 0 ? e.atkAnim * 6 : 0)), e.y - 30 + Math.sin(T0 * 2.4) * 3, T0, '#ffb04a'); return; }
    return ae.apply(this, arguments);
  };
  // ce qu'on voit venir : le trait de l'os et de la charge, le cercle du coup au sol, l'anneau du cri
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const e of R.enemies) { const s = e.spe; if (!s || !s.k || s.parti || e.dead || !CG.onScreen(e.x, e.y)) continue; const k = 1 - s.t / s.max; g.save();
      if (s.k === 'os' || s.k === 'charge') { const L = s.k === 'os' ? Mt.OS_V * Mt.OS_T : Mt.CHARGE; g.globalAlpha = 0.22 + k * 0.4; g.strokeStyle = s.k === 'os' ? '#ffd0a0' : '#a070ff'; g.lineWidth = s.k === 'os' ? 9 : 20; g.lineCap = 'round'; g.setLineDash([14, 11]); g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + s.ux * L, e.y + s.uy * L); g.stroke(); }
      else { const cx = s.k === 'fracas' ? s.cx : e.x, cy = s.k === 'fracas' ? s.cy : e.y, r = s.k === 'fracas' ? Mt.FRACAS : Mt.CRI, col = s.k === 'fracas' ? '255,80,60' : '150,210,255';
        g.translate(cx, cy); g.scale(1, 0.8); g.fillStyle = 'rgba(' + col + ',' + (0.1 + k * 0.16) + ')'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(' + col + ',0.85)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
        g.setLineDash([]); g.fillStyle = 'rgba(' + col + ',' + (0.2 + k * 0.2) + ')'; g.beginPath(); g.arc(0, 0, r * k, 0, TAU); g.fill(); }
      g.restore(); }
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R || !R.osMorts) return;
    for (const o of R.osMorts) { g.save(); g.translate(o.x, o.y); g.rotate(o.t * 16); const C = o.c || ['#3a3440', '#8a8496', '#4a4454']; /* [contour, milieu, bouts] : sans couleur donnée, l'os sombre du squelette noir */ g.strokeStyle = C[0]; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.stroke(); g.strokeStyle = C[1]; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.stroke(); [[-10, -2.4], [-10, 2.4], [10, -2.4], [10, 2.4]].forEach(q => ell(g, q[0], q[1], 2.6, 2.6, C[2])); g.restore(); }
  };
})(window.CG);
