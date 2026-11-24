// Goblin Malin — ceux qui se cachent dans l'ombre : voleurs qui se glissent jusqu'à la réserve, embuscades sur les chemins, et le sort qui les débusque.
// Tant qu'un ennemi est « dans l'ombre », il n'est pas dans R.enemies : personne ne le voit, ne le vise, ni ne le montre sur la carte.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, rand = CG.rand, pick = CG.pick, Om = CG.Ombre = {};
  Om.VOL = { jour: 2, chance: 0.4, coups: 4, tempo: 1.7 };       // voleurs : à partir de quel jour, chance par jour, nombre de larcins chacun
  Om.EMB = { jour: 5, rayon: 95 };                               // embuscades : à partir de quel jour, à quelle distance elles se déclenchent
  Om.SORT = { dur: 20, rayon: 520 };
  CG.ENEMIES.voleur = { nom: 'Voleur', race: 'humain', hp: 20, dmg: 3, spd: 104, xp: 12, or: 4, cost: 2, look: { tunic: '#2c2a36', hair: '#15121c', weapon: 'epee', hood: true } };
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // un ennemi créé normalement, puis retiré du monde visible
  function cacher(type, x, y, extra) { const R = CG.R, e = G.spawnEnemy(type, x, y, {}); const i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1); Object.assign(e, extra); (R.ombres || (R.ombres = [])).push(e); return e; }
  // il sort de l'ombre : le voilà dans le monde, visible et vulnérable
  Om.reveler = function (e, parSort) {
    const R = CG.R, i = R.ombres.indexOf(e); if (i < 0) return; R.ombres.splice(i, 1); R.enemies.push(e); e.path = null;
    G.puff(e.x, e.y - 18, '#7a5ad0', 12, 90, 4); R.rings.push({ x: e.x, y: e.y - 6, r: 46, life: 0.45, col: '#a080ff' });
    if (parSort) { e.daze = 2.2; e.debusque = 3; G.text(e.x, e.y - 64, '👁️ Débusqué !', '#f0e8ff', true); G.puff(e.x, e.y - 20, '#ffffff', 16, 150, 3); R.rings.push({ x: e.x, y: e.y - 6, r: 80, life: 0.6, col: '#ffffff' }); CG.sfx('zap'); } // surpris : il reste figé un instant, pris dans la lumière
    if (e.voleur) e.volEtat = e.volEtat || 'vient';
  };

  // ---------- les voleurs ----------
  const RES = ['food', 'bois', 'minerai', 'cuir', 'or'];
  function bande() {
    const S = CG.S, R = CG.R, n = Math.min(5, 2 + Math.floor(S.day / 4));
    const exit = (() => { const q = pick(Object.values(W.EXITS)); return W.center(q.x, q.y); })();
    for (let i = 0; i < n; i++) { const e = cacher('voleur', exit.x + rand(-26, 26), exit.y + rand(-26, 26), { voleur: true, exit: { x: exit.x, y: exit.y }, sac: {}, coups: 0, vt: 0 }); const f = G.stockSpot(e); G.goTo(e, f.x + rand(-14, 14), f.y + rand(-6, 10)); }
    R.volBande = { n, pris: {}, partis: 0, tues: 0, dit: false };
  }
  // un voleur visible : il pille, puis file. Blessé, il détale tout de suite. (appelé par game.js ; renvoie true = c'est moi qui m'en occupe)
  Om.vole = function (e, dt) {
    const S = CG.S, R = CG.R;
    if (e.hp < e.maxhp || e.coups >= Om.VOL.coups) { e.retreat = true; e.path = null; return true; }
    const f = G.stockSpot(e);
    if (d2(e, f) > 50) { if (!e.path || !e.path.length) G.goTo(e, f.x, f.y); G.follow(e, e.spd, dt); return true; }
    e.moving = false; e.face = f.bx > e.x ? 1 : -1; e.vt += dt; if (e.vt < Om.VOL.tempo) return true; e.vt = 0; e.coups++; e.atkAnim = 1;
    const dispo = RES.filter(r => S.res[r] >= 1); if (!dispo.length) return true;
    const r = pick(dispo), q = Math.min(Math.floor(S.res[r]), 3 + S.day); G.gain(r, -q, e.x, e.y - 40); e.sac[r] = (e.sac[r] || 0) + q;
    if (R.volBande) R.volBande.pris[r] = (R.volBande.pris[r] || 0) + q;
    return true;
  };
  // tué : son sac se renverse par terre
  const he = G.hurtEnemy;
  G.hurtEnemy = function (e) {
    const r = he.apply(this, arguments);
    if (e && e.voleur && e.dead && !e.rendu) { e.rendu = true; for (const k in e.sac) if (e.sac[k] > 0) { G.dropRes(e.x, e.y, k, e.sac[k]); if (CG.R.volBande) CG.R.volBande.pris[k] -= e.sac[k]; } if (CG.R.volBande) CG.R.volBande.tues++; }
    return r;
  };

  // ---------- les embuscades : une bande tapie quelque part dans les alentours ----------
  const rw = D.rollWild;
  D.rollWild = function () {
    rw.apply(this, arguments); const S = CG.S, R = CG.R; R.ombres = []; R.volBande = null;
    R.volH = S.day >= Om.VOL.jour && Math.random() < Om.VOL.chance ? rand(8.5, 17) : 0;
    if (S.day < Om.EMB.jour) return;
    const f = W.field(), n = Math.min(4, 1 + Math.floor((S.day - Om.EMB.jour) / 3)), types = S.day >= 9 ? ['brigand', 'soldat', 'araignee', 'loup'] : ['brigand', 'araignee', 'loup'];
    for (let k = 0, made = 0; k < 300 && made < n; k++) {
      const tx = CG.irand(4, CG.MW - 5), ty = CG.irand(4, CG.MH - 5);
      if (f[W.idx(tx, ty)] < 0 || Math.hypot(tx - W.CX, ty - W.CY) < 17 || (W.sites || []).some(s => Math.hypot(s.x - tx, s.y - ty) < s.r + 4) || (S.camps || []).some(c => Math.hypot(c.x - tx, c.y - ty) < 7)) continue;
      const c = W.center(tx, ty), type = pick(types), gid = 'emb' + made, nb = Math.min(5, 2 + Math.floor(S.day / 5));
      for (let i = 0; i < nb; i++) { let x = c.x + rand(-40, 40), y = c.y + rand(-34, 34); if (!W.walkPx(x, y)) { x = c.x; y = c.y; } cacher(type, x, y, { embuscade: gid, wild: { x: c.x, y: c.y } }); }
      made++;
    }
  };

  // ---------- chaque instant : les voleurs avancent dans l'ombre, les embuscades guettent, le sort débusque ----------
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return; const p = S.player, O = R.ombres || (R.ombres = []);
    if (R.oeilOmbre > 0) R.oeilOmbre -= dt;
    voile(R.oeilOmbre > 0); for (const e of R.enemies) if (e.debusque > 0) e.debusque -= dt;
    if (R.volH && S.hour >= R.volH && !R.event) { R.volH = 0; bande(); }
    for (const e of O.slice()) {
      if (R.oeilOmbre > 0 && d2(e, p) < Om.SORT.rayon) { // le sort : tout ce qui se cache près du chef est débusqué
        if (e.embuscade) O.filter(o => o.embuscade === e.embuscade).forEach(o => Om.reveler(o, true)); else Om.reveler(e, true);
        continue;
      }
      if (e.voleur) { // il se faufile jusqu'à la réserve, invisible, puis se met à piller : là, on le voit
        if (G.follow(e, e.spd * 0.85, dt) || !e.path || !e.path.length) { Om.reveler(e); e.volEtat = 'vole'; const b = R.volBande; if (b && !b.dit) { b.dit = true; CG.sfx('warning'); CG.UI.toast('⚠️ Au voleur ! Des ombres pillent ta réserve !'); G.text(e.x, e.y - 60, '❗ Au voleur !', '#ffe36b', true); } }
      } else if (e.embuscade && R.ko <= 0 && !(R.invis > 0) && d2(e, p) < Om.EMB.rayon) { // HOP ! toute la bande surgit autour du chef
        const gang = O.filter(o => o.embuscade === e.embuscade); gang.forEach(o => { Om.reveler(o); o.wild = null; o.target = p; o.seek = 3; o.atkCd = 0.6; });
        CG.sfx('warning'); G.text(p.x, p.y - 80, '❗ Embuscade !', '#ff9a8a', true); R.rings.push({ x: p.x, y: p.y - 6, r: 130, life: 0.5, col: '#ff7a6a' });
      }
    }
    // le bilan, quand toute la bande de voleurs est partie ou morte
    const b = R.volBande;
    if (b && b.dit && !b.fini && !O.some(e => e.voleur) && !R.enemies.some(e => e.voleur && !e.dead)) {
      b.fini = true; const butin = Object.keys(b.pris).filter(k => b.pris[k] > 0).map(k => b.pris[k] + ' ' + CG.RES[k].icon);
      CG.UI.toast(butin.length ? '😡 Les voleurs ont filé avec ' + butin.join(', ') + '.' : '😄 Les voleurs n\'ont rien emporté : tout le butin est par terre, ramasse-le.');
    }
  };

  // ---------- le sort : Œil des ombres ----------
  CG.SPELLS.ombres = { nom: 'Œil des ombres', icon: '🌑', mp: 10, prix: 500, desc: 'Pendant 20 secondes, tout ce qui se cache dans l\'ombre près de toi est débusqué : voleurs qui se faufilent, bandes en embuscade. Surpris, ils restent figés un instant. Dans un château, les dalles piégées se mettent à luire.', color: '#a080ff' };
  CG.SCROLL_POOL.push('ombres');
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'ombres') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.oeilOmbre = Om.SORT.dur;
    const n = (R.ombres || []).filter(e => d2(e, p) < Om.SORT.rayon).length;
    R.rings.push({ x: p.x, y: p.y - 6, r: 200, life: 0.6, col: '#a080ff' }); R.rings.push({ x: p.x, y: p.y - 6, r: Om.SORT.rayon * 0.8, life: 0.9, col: '#7a5ad0' });
    G.text(p.x, p.y - 70, n ? '🌑 ' + n + ' ombre' + (n > 1 ? 's' : '') + ' !' : '🌑 Rien ne se cache ici', '#d8c8ff', true);
  };
  // l'autre monde : un voile violet par-dessus le jeu tant que l'œil est ouvert (une simple couche de couleur, rien de lourd)
  let voileEl = null;
  function voile(on) {
    if (!voileEl) { if (!on) return; voileEl = document.createElement('div'); voileEl.id = 'voile-ombre'; voileEl.innerHTML = '<i></i><b></b>'; const c = document.getElementById('game'); c.parentNode.insertBefore(voileEl, c.nextSibling); void voileEl.offsetWidth; }
    voileEl.classList.toggle('on', !!on);
  }
  // ceux qui sont encore tapis, hors de portée du sort : des silhouettes d'ombre aux yeux brillants
  function silhouette(g, e, t) {
    const w = Math.sin(t * 3 + e.seed) * 1.5, r = e.r || 12, h = 34 + r;
    g.save(); g.translate(e.x, e.y);
    g.fillStyle = 'rgba(12,6,30,0.5)'; g.beginPath(); g.ellipse(0, 2, r + 8, 5, 0, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(10,4,26,0.86)'; g.beginPath(); g.moveTo(-r - 3, 2); g.quadraticCurveTo(-r - 6 + w, -h * 0.55, -r * 0.5, -h * 0.82); g.quadraticCurveTo(0, -h - 6 + w, r * 0.5, -h * 0.82); g.quadraticCurveTo(r + 6 - w, -h * 0.55, r + 3, 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,130,255,0.75)'; g.lineWidth = 1.5; g.stroke();
    const bl = Math.sin(t * 1.7 + e.seed * 3) > 0.93 ? 0.15 : 1; g.fillStyle = '#fff'; g.shadowColor = '#c8a8ff'; g.shadowBlur = 8; g.beginPath(); g.ellipse(-4, -h * 0.66, 2.6, 2.2 * bl, 0, 0, 6.3); g.ellipse(4, -h * 0.66, 2.6, 2.2 * bl, 0, 0, 6.3); g.fill();
    g.restore();
  }
  // débusqué : pris dans un faisceau de lumière, cerclé, l'œil au-dessus de lui
  function prisDansLaLumiere(g, e, t) {
    const a = Math.min(1, e.debusque / 0.8), h = 60 + (e.r || 12);
    g.save(); g.globalCompositeOperation = 'lighter';
    const col = g.createLinearGradient(e.x - 26, 0, e.x + 26, 0); col.addColorStop(0, 'rgba(200,170,255,0)'); col.addColorStop(0.5, 'rgba(235,220,255,' + 0.5 * a + ')'); col.addColorStop(1, 'rgba(200,170,255,0)'); g.fillStyle = col; g.fillRect(e.x - 26, e.y - 420, 52, 424);
    g.restore(); g.save(); g.globalAlpha = a;
    g.strokeStyle = '#f0e8ff'; g.lineWidth = 2.5; g.setLineDash([7, 6]); g.lineDashOffset = -t * 40; g.beginPath(); g.ellipse(e.x, e.y + 2, (e.r || 12) + 16, ((e.r || 12) + 16) * 0.42, 0, 0, 6.3); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(190,150,255,0.9)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const an = t * 2 + i * 1.571, rr = (e.r || 12) + 26; g.beginPath(); g.moveTo(e.x + Math.cos(an) * rr, e.y - h * 0.45 + Math.sin(an) * rr * 0.9); g.lineTo(e.x + Math.cos(an) * (rr - 9), e.y - h * 0.45 + Math.sin(an) * (rr - 9) * 0.9); g.stroke(); }
    g.font = '17px sans-serif'; g.textAlign = 'center'; g.fillText('👁️', e.x, e.y - h - 6 + Math.sin(t * 6) * 2);
    g.restore();
  }
  const mk0 = CG.Magie.marks;
  CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R;
    for (const e of R.enemies) if (e.debusque > 0 && !e.dead && CG.onScreen(e.x, e.y)) prisDansLaLumiere(g, e, t);
    if (!(R.oeilOmbre > 0)) return;
    for (const e of R.ombres || []) if (CG.onScreen(e.x, e.y)) silhouette(g, e, t); const p = CG.S.player, a = Math.min(1, R.oeilOmbre / 2);
    g.save(); g.globalAlpha = 0.5 * a; g.strokeStyle = '#a080ff'; g.lineWidth = 2; g.setLineDash([4, 10]); g.lineDashOffset = t * 24; g.beginPath(); g.ellipse(p.x, p.y - 4, 44, 19, 0, 0, 6.3); g.stroke(); g.restore();
    g.globalAlpha = 0.85 * a; g.font = '15px sans-serif'; g.textAlign = 'center'; g.fillText('👁️', p.x, p.y - 74 + Math.sin(t * 3) * 2); g.globalAlpha = 1;
  };

  // ---------- dessin soigné : la touche E au-dessus de ce qu'on peut utiliser, et la plaque des forces et faiblesses ----------
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  CG.Art.toucheE = function (g, x, y, t) {
    y += Math.sin(t * 4) * 2; g.save();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y + 16, 9, 3, 0, 0, 6.3); g.fill();
    rr(g, x - 11, y - 9, 22, 22, 6); g.fillStyle = '#7a5a12'; g.fill();                                   // la tranche de la touche
    const gr = g.createLinearGradient(0, y - 12, 0, y + 8); gr.addColorStop(0, '#fff3b8'); gr.addColorStop(1, '#f2c53a');
    rr(g, x - 11, y - 12, 22, 21, 6); g.fillStyle = gr; g.fill(); g.strokeStyle = '#5a3f08'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; rr(g, x - 8, y - 10, 16, 5, 3); g.fill();
    g.fillStyle = '#3a2606'; g.font = '900 13px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('E', x, y - 1);
    g.fillStyle = '#f2c53a'; g.beginPath(); g.moveTo(x - 4, y + 12.5); g.lineTo(x + 4, y + 12.5); g.lineTo(x, y + 17); g.closePath(); g.fill();
    g.restore(); g.textBaseline = 'alphabetic';
  };
  // une petite plaque de parchemin : en haut ce qu'il fait bien (pastille verte), en bas ce qu'il fait mal (pastille rouge)
  CG.Art.aptitudes = function (g, x, y, up, dn) {
    const n = Math.max(up.length, dn.length, 1), w = 26 + n * 17, h = 38, x0 = x - w / 2, y0 = y - h;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x0 + 1, y0 + 2, w, h, 9); g.fill();
    const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#fbf0cf'); gr.addColorStop(1, '#ecd9a4'); rr(g, x0, y0, w, h, 9); g.fillStyle = gr; g.fill(); g.strokeStyle = '#8a6a34'; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(x - 5, y0 + h - 0.5); g.lineTo(x + 5, y0 + h - 0.5); g.lineTo(x, y0 + h + 6); g.closePath(); g.fillStyle = '#ecd9a4'; g.fill(); g.beginPath(); g.moveTo(x - 5, y0 + h); g.lineTo(x, y0 + h + 6); g.lineTo(x + 5, y0 + h); g.stroke();
    g.strokeStyle = 'rgba(138,106,52,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 7, y0 + h / 2); g.lineTo(x0 + w - 7, y0 + h / 2); g.stroke();
    [[up, '#4fae3a', '#2a6a1c', '▲', 10], [dn, '#d8553e', '#8a2414', '▼', 28]].forEach(([list, c1, c2, sg, dy]) => {
      g.fillStyle = c1; g.beginPath(); g.arc(x0 + 12, y0 + dy, 6.5, 0, 6.3); g.fill(); g.strokeStyle = c2; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#fff'; g.font = '8px sans-serif'; g.fillText(sg, x0 + 12, y0 + dy + (sg === '▲' ? -0.5 : 1));
      g.font = '13px sans-serif'; if (!list.length) { g.fillStyle = '#a88a5a'; g.fillText('—', x0 + 30, y0 + dy); } list.forEach((ic, i) => { g.fillStyle = '#000'; g.fillText(ic, x0 + 30 + i * 17, y0 + dy + 1); });
    });
    g.restore(); g.textBaseline = 'alphabetic';
  };
})(window.CG);
