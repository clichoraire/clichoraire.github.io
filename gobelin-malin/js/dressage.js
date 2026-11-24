// Goblin Malin — l'école des animaux (technologie « École des animaux », l'ancienne « Compagnons fidèles »).
// On y envoie un animal en allant lui parler : il marche jusqu'à l'école, y reste une journée entière (24 h du jeu), puis il en
// ressort dressé. Un animal dressé obéit à trois ordres : me suivre sans se battre (il recule pendant les combats et revient
// après), me suivre et me défendre, ou rester au village et le défendre. Un animal pas encore dressé garde le village.
// Tout est réglable dans CG.Dressage.
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P, UI = CG.UI, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2;
  const Dr = CG.Dressage = { TYPE: 'ecoleAnimaux', TECH: 'b24', HEURES: 24, PLACES: 2, DELAI: 90, MENACE: 300, PROCHE: 200, RECUL: 170, PAS: 1.3 }; /* HEURES : durée du dressage ; PLACES : élèves par école ; MENACE : un ennemi à cette distance du chef fait reculer l'animal « sans se battre » ; RECUL : jusqu'où il s'écarte */
  CG.BUILDS[Dr.TYPE] = { nom: 'École des animaux', icon: '🎓', w: 2, h: 2, cat: 'clan', cout: { bois: 40, food: 10 }, tech: Dr.TECH, desc: 'Envoie-y un animal en allant lui parler. Il en ressort le lendemain, et il sait t\'obéir.' };
  if (CG.FicheBati && CG.FicheBati.TEXTE) CG.FicheBati.TEXTE[Dr.TYPE] = 'Une école où tes animaux apprennent à t\'obéir.';

  // ---------- le dessin : une niche à toit rouge, un cerceau, une balle ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function rr(g, x, y, w, h, r, f) { g.fillStyle = f; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
  if (Art.extra) Art.extra[Dr.TYPE] = { w: 108, h: 104,
    draw(c) { const m = 54, b = 96;
      ell(c, m, b, 50, 9, 'rgba(0,0,0,0.25)'); ell(c, m + 2, b - 4, 44, 7, '#d8c070'); ell(c, m + 12, b - 5, 24, 3.5, '#e8d48c'); // la paille
      rr(c, m - 46, b - 48, 54, 46, 6, '#a47a46'); box(c, m - 19, b - 48, 27, 44, 'rgba(0,0,0,0.13)'); // la niche
      c.strokeStyle = 'rgba(60,40,16,0.3)'; c.lineWidth = 1.2; for (let y = b - 38; y < b - 6; y += 9) { c.beginPath(); c.moveTo(m - 43, y); c.lineTo(m + 5, y); c.stroke(); }
      c.fillStyle = '#2e1c0e'; c.beginPath(); c.arc(m - 19, b - 17, 12, Math.PI, 0); c.lineTo(m - 7, b - 2); c.lineTo(m - 31, b - 2); c.closePath(); c.fill();
      poly(c, [m - 52, b - 45, m + 14, b - 45, m - 1, b - 72, m - 37, b - 72], '#c2483c'); poly(c, [m - 19, b - 45, m + 14, b - 45, m - 1, b - 72, m - 19, b - 72], 'rgba(0,0,0,0.17)'); box(c, m - 52, b - 47, 66, 4, 'rgba(0,0,0,0.22)'); box(c, m - 37, b - 73, 36, 3, '#dc6a58');
      circ(c, m - 19, b - 38, 7.5, '#f0e2b8'); ell(c, m - 19, b - 36.4, 3, 2.4, '#6b4a2a'); [[-3.4, -3.6], [0, -5], [3.4, -3.6]].forEach(q => circ(c, m - 19 + q[0], b - 36.4 + q[1], 1.3, '#6b4a2a')); // l'enseigne : une patte
      box(c, m - 20, b - 86, 2, 15, '#6b4a2a'); poly(c, [m - 18, b - 86, m - 6, b - 82, m - 18, b - 78], '#ffd84a'); // le fanion
      ell(c, m + 33, b - 2, 9, 3, '#5a3d22'); box(c, m + 31, b - 36, 4, 34, '#6b4a2a'); box(c, m + 31, b - 36, 1.5, 34, '#84603a'); // le cerceau
      c.lineWidth = 4.5; for (let i = 0; i < 10; i++) { c.strokeStyle = i % 2 ? '#f4f0e6' : '#e8483a'; c.beginPath(); c.ellipse(m + 33, b - 51, 11, 15, 0, i / 10 * TAU, (i + 1) / 10 * TAU + 0.03); c.stroke(); }
      circ(c, m + 14, b - 8, 6.5, '#4a8fd8'); c.fillStyle = '#f4f0e6'; c.beginPath(); c.arc(m + 14, b - 8, 6.5, -0.5, 0.9); c.arc(m + 11, b - 8, 6.5, 0.6, -0.4, true); c.fill(); circ(c, m + 11.6, b - 10.6, 1.8, 'rgba(255,255,255,0.55)'); },
    anim(g, cx, by, t, night, bd) { const n = Dr.dedans(bd).length; if (!n) return; const m = cx, b = by - 2; // quelqu'un apprend à l'intérieur : deux yeux dans le noir, une petite patte qui flotte
      if ((t * 0.5 + bd.tx) % 4 > 0.2) { circ(g, m - 22.5, b - 14, 1.5, '#ffe36b'); circ(g, m - 15.5, b - 14, 1.5, '#ffe36b'); }
      g.save(); g.font = '15px sans-serif'; g.textAlign = 'center'; g.globalAlpha = 0.9; g.fillText('🐾', m - 19, b - 92 + Math.sin(t * 2.4 + bd.tx) * 3); g.restore(); } };

  // ---------- qui est où ----------
  const liste = () => (CG.S ? CG.S.buildings.filter(b => b.type === Dr.TYPE && !b.site && !b.gone) : []);
  const eleves = () => CG.S.ecole || (CG.S.ecole = []);
  const maintenant = () => CG.S.day * 24 + CG.S.hour;
  const porte = b => ({ x: (b.tx + 0.88) * T, y: (b.ty + b.h) * T + 12 });
  Dr.dedans = b => (CG.S && CG.S.ecole ? CG.S.ecole.filter(o => o.tx === b.tx && o.ty === b.ty) : []);
  Dr.libre = function (p) { let best = null, bd = 1e9; for (const b of liste()) { if (Dr.dedans(b).length + CG.S.pets.filter(a => a.ecole && a.ecole.tx === b.tx && a.ecole.ty === b.ty).length >= Dr.PLACES) continue; const q = porte(b), d = p ? Math.hypot(q.x - p.x, q.y - p.y) : 0; if (d < bd) { bd = d; best = b; } } return best; };
  Dr.ordre = p => !p.follow ? 'village' : p.calme ? 'calme' : 'defend';
  Dr.TEXTE = { calme: 'Te suit, sans se battre', defend: 'Te suit et te défend', village: 'Garde le village' };
  Dr.etat = p => (p.dresse ? Dr.TEXTE[Dr.ordre(p)] : p.ecole ? 'En route vers l\'école' : 'Garde le village');
  Dr.ordonner = function (p, o) { p.follow = o !== 'village'; p.calme = o === 'calme'; p.eat = null; p.path = null; p.sleep = false; if (!p.follow) { p.timer = 0; p.wx = undefined; } G.text(p.x, p.y - 44, o === 'village' ? '🏕️' : o === 'calme' ? '🐾' : '⚔️', '#fff', true); CG.sfx('ok'); };
  const ORDRES = [['calme', '🐾 Suis-moi, sans te battre', 'Il recule pendant les combats, puis il revient près de toi'], ['defend', '⚔️ Suis-moi et défends-moi', 'Il t\'accompagne partout et se bat à tes côtés'], ['village', '🏕️ Reste au village et défends-le', 'Il retourne près du feu et garde le clan']];
  // les boutons à ajouter quand on parle à un animal (pets.js)
  Dr.options = function (p) {
    if (p.dresse) { const o = Dr.ordre(p); return ORDRES.filter(q => q[0] !== o).map(q => ({ label: q[1], sub: q[2], fn: () => Dr.ordonner(p, q[0]) })); }
    if (!liste().length) return [];
    if (p.ecole) return [{ label: '✋ Finalement, reste ici', sub: 'Il n\'ira pas à l\'école aujourd\'hui', fn: () => { p.ecole = null; p.timer = 0; } }];
    const b = Dr.libre(p);
    return [{ label: '🎓 Va à l\'école des animaux', sub: b ? 'Il y reste une journée entière, puis il sait t\'obéir' : 'L\'école est pleine pour l\'instant', disabled: !b, fn: () => { const q = Dr.libre(p); if (!q) return; p.ecole = { tx: q.tx, ty: q.ty, go: Dr.DELAI }; p.eat = null; p.soin = null; p.path = null; p.follow = false; p.sleep = false; G.text(p.x, p.y - 44, '🎓', '#fff', true); CG.sfx('ok'); } }];
  };
  // ---------- entrer, sortir ----------
  function copie(p) { const o = {}; for (const k in p) { const v = p[k]; if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') o[k] = v; } delete o.ridden; delete o.moving; delete o.sleep; return o; }
  function entrer(p, b) {
    const S = CG.S, i = S.pets.indexOf(p); if (i < 0) return; p.ecole = null;
    if (Dr.dedans(b).length >= Dr.PLACES) { G.text(p.x, p.y - 44, 'L\'école est pleine...', '#ffd0a0'); return; }
    S.pets.splice(i, 1); eleves().push({ tx: b.tx, ty: b.ty, fin: maintenant() + Dr.HEURES, pet: copie(p) });
    G.puff(p.x, p.y - 14, '#ffe9a8', 12, 80, 3.5); CG.sfx('ok'); UI.toast('🎓 ' + p.name + ' entre à l\'école des animaux. Il en ressortira demain.');
  }
  function sortir(o, appris) {
    const S = CG.S, R = CG.R, b = liste().find(q => q.tx === o.tx && q.ty === o.ty), f = G.firePos(), p = Object.assign({}, o.pet), d = b ? porte(b) : { x: f.x + 40, y: f.y + 70 };
    P.reset(p); p.x = d.x; p.y = d.y + 6; p.ko = false; p.follow = false; p.calme = false; if (!(p.hp > 0)) p.hp = P.maxHp(p); if (appris) p.dresse = true; S.pets.push(p);
    G.puff(p.x, p.y - 14, appris ? '#c8ffb0' : '#d8d0c0', 14, 90, 4);
    if (appris) { R.rings.push({ x: p.x, y: p.y - 10, r: 70, life: 0.5, col: '#c8ffb0' }); for (let i = 0; i < 4; i++) G.text(p.x + CG.rand(-22, 22), p.y - CG.rand(26, 60), '⭐', '#fff'); CG.sfx('heal'); G.banner(p.name + ' sort de l\'école !', 'Il sait maintenant t\'obéir. Va lui parler pour lui dire quoi faire.', '#c8ffb0'); }
    else UI.toast('🎓 L\'école n\'est plus là : ' + p.name + ' est ressorti sans avoir fini.');
  }
  Dr.finir = () => { eleves().forEach(o => { o.fin = 0; }); }; // pour les essais
  // ---------- chaque instant ----------
  let tic = 0;
  function recule(p, e, dt) { // « sans te battre » : il se met à l'abri, de l'autre côté du chef
    const pl = CG.S.player, k = P.KINDS[p.kind], dx = pl.x - e.x, dy = pl.y - e.y, n = Math.hypot(dx, dy) || 1; let tx = pl.x + dx / n * Dr.RECUL, ty = pl.y + dy / n * Dr.RECUL;
    if (!k.fly && !W.walkPx(tx, ty)) { const c = [[-dy / n, dx / n], [dy / n, -dx / n]].map(v => [pl.x + v[0] * Dr.RECUL * 0.8, pl.y + v[1] * Dr.RECUL * 0.8]).find(v => W.walkPx(v[0], v[1])); if (c) { tx = c[0]; ty = c[1]; } else { tx = pl.x; ty = pl.y + 26; } }
    p.moving = false; p.sleep = false; p.eat = null; if (p.atkAnim > 0) p.atkAnim -= dt * 4; if (p.flash > 0) p.flash -= dt; if (p.buffT > 0) p.buffT -= dt;
    const d = Math.hypot(tx - p.x, ty - p.y), spd = k.spd * Dr.PAS;
    if (Math.hypot(pl.x - p.x, pl.y - p.y) > 600) { p.x = pl.x - 30; p.y = pl.y + 10; p.path = null; }
    else if (d > 20) { if (k.fly) { const st = Math.min(d, spd * dt); p.x += (tx - p.x) / d * st; p.y += (ty - p.y) / d * st; p.moving = true; p.step += dt * 3; if (Math.abs(tx - p.x) > 3) p.face = tx > p.x ? 1 : -1; } else G.chase(p, tx, ty, spd, dt); }
    else p.face = e.x > p.x ? 1 : -1;
  }
  const up0 = P.update; P.update = function (dt) {
    const S = CG.S, R = CG.R, pl = S.player, loin = [], route = new Map();
    if (!S.dressV) { S.dressV = 1; if (G.tech(Dr.TECH)) S.pets.forEach(p => { p.dresse = true; }); } // une partie d'avant l'école : ceux qui obéissaient déjà obéissent toujours
    tic -= dt; if (tic <= 0) { tic = 1; const L = eleves(); if (L.length) { const now = maintenant(); for (const o of L.slice()) { const b = liste().some(q => q.tx === o.tx && q.ty === o.ty); if (b && now < o.fin) continue; L.splice(L.indexOf(o), 1); sortir(o, b); } } }
    for (const p of S.pets) {
      if (!p.dresse) { p.calme = false; if (p.follow && !p.amene) p.follow = false; }
      if (p.ko || p.ridden || !P.KINDS[p.kind]) { p.ecole = null; continue; }
      if (p.ecole) { const b = liste().find(q => q.tx === p.ecole.tx && q.ty === p.ecole.ty); p.ecole.go -= dt; if (!b || p.ecole.go <= 0) { p.ecole = null; continue; }
        const d = porte(b); p.wx = d.x; p.wy = d.y; p.timer = 2; p.eat = null; p.soin = null; p.rentre = 0; route.set(p, { x: p.x, y: p.y, b, d }); continue; }
      if (p.dresse && p.follow && p.calme && !(R.ko > 0)) { let e = null, bd = 1e9; for (const q of R.enemies) { if (q.dead || q.calm || q.retreat) continue; const d1 = Math.hypot(q.x - pl.x, q.y - pl.y), d2 = Math.hypot(q.x - p.x, q.y - p.y); if ((d1 < Dr.MENACE || d2 < Dr.PROCHE) && d1 < bd) { bd = d1; e = q; } } if (e) { p.ridden = true; loin.push([p, e]); } }
    }
    let r; try { r = up0.apply(this, arguments); } finally { for (const q of loin) q[0].ridden = false; }
    for (const q of loin) recule(q[0], q[1], dt);
    route.forEach((q, p) => { if (p.ko) return; const dx = p.x - q.x, dy = p.y - q.y; if (dx || dy) { const nx = p.x + dx * 0.9, ny = p.y + dy * 0.9; if (P.KINDS[p.kind].fly || W.walkPx(nx, ny)) { p.x = nx; p.y = ny; } } // il y va d'un bon pas
      if (Math.hypot(q.d.x - p.x, q.d.y - p.y) < 26) entrer(p, q.b); });
    return r;
  };
  // ---------- la sauvegarde : ce que l'animal a appris, et l'ordre qu'il suit ----------
  { const pk = CG.pack; CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.pets && S) d.pets.forEach((o, i) => { const a = S.pets[i]; if (!a) return; if (a.dresse) o.dresse = true; if (a.calme) o.calme = true; if (a.caresse) o.caresse = a.caresse; /* le jour de sa dernière caresse (pets.js) */ }); return d; }; }
  // ---------- l'onglet Animaux et la fiche de l'école : on dit qui est en classe ----------
  const noms = L => L.map(o => o.pet.name).join(' et ');
  { const pp = P.panel; P.panel = function () { const h = pp.apply(this, arguments), L = CG.S.ecole || []; return L.length && typeof h === 'string' ? h + '<p class="note">🎓 ' + noms(L) + (L.length > 1 ? ' sont' : ' est') + ' à l\'école des animaux.</p>' : h; }; }
  if (CG.FicheBati && CG.FicheBati.phrase) { const ph = CG.FicheBati.phrase; CG.FicheBati.phrase = function (b) { const s = ph.apply(this, arguments); if (!b || b.type !== Dr.TYPE) return s; const L = Dr.dedans(b); return s + (L.length ? ' ' + noms(L) + (L.length > 1 ? ' y apprennent' : ' y apprend') + ' en ce moment.' : ' Va parler à un animal pour l\'y envoyer.'); }; }
})(window.CG);
