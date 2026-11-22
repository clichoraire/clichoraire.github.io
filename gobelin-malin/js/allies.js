// Goblin Malin — esprits de la forêt (bénédictions) et monstres amicaux qui demandent à rejoindre le clan.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, P = CG.P, K = P.KINDS, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand, Al = CG.Allies = {};
  const el = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const rr = (g, x, y, w, h, r, f) => { g.fillStyle = f; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  const pl = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const ln = (g, p, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };

  // ================= les monstres alliés =================
  // coup spécial commun des costauds : ils frappent le sol
  const slam = (col, r, mul) => (p, e, d) => { if (d > 70) return false; const R = CG.R; R.rings.push({ x: p.x, y: p.y - 4, r, life: 0.5, col }); G.puff(p.x, p.y - 4, col, 18, 180, 5); CG.sfx('fire'); p.atkAnim = 1; for (const o of R.enemies) if (!o.dead && CG.dist(o, p) < r + o.r) G.hurtEnemy(o, P.dmg(p) * mul, p); P.xp(p, 2); return true; };
  Object.assign(K, {
    gelee: { monstre: true, min: 1, nom: 'Gelée amicale', evo: 'Gelée royale', icon: '🟢', hp: 45, dmg: 4, spd: 60, cd: 1.0, pz: 1, special: 'Grand plouf : elle retombe de tout son poids et éclabousse les ennemis autour.', sp: slam('#8fe08a', 80, 1.4), hello: 'Une gelée toute ronde rebondit jusqu\'à toi. Elle fait « blob ? » en penchant la tête. Elle n\'a pas l\'air méchante du tout.' },
    orc: { monstre: true, faim: 5, min: 4, nom: 'Orc', evo: 'Orc berserker', icon: '🪓', hp: 90, dmg: 9, spd: 70, cd: 1.0, pz: 0.8, special: 'Rage : un grand coup de hache qui fauche tout ce qui l\'entoure.', sp: slam('#ff9a4a', 95, 1.7), hello: '« Toi, chef fort. Moi entendu parler. Moi veux me battre pour chef fort. » L\'orc plante sa hache dans le sol et attend.' },
    orcChaman: { monstre: true, faim: 4, min: 6, nom: 'Orc chaman', evo: 'Grand chaman orc', icon: '🔮', hp: 60, dmg: 8, spd: 64, cd: 1.6, range: 220, pz: 0.8, special: 'Foudre des ancêtres : un éclair qui saute entre trois ennemis.', hello: '« Les esprits m\'ont montré ton feu de camp, petit seigneur. Ils disent que ma place est ici. Qu\'en dis-tu ? »' },
    troll: { monstre: true, faim: 8, min: 8, nom: 'Troll', evo: 'Troll des cavernes', icon: '🧌', hp: 170, dmg: 13, spd: 52, cd: 1.4, pz: 0.6, special: 'Écrase-tout : sa massue fait trembler le sol et sonne les ennemis.', sp: slam('#9ab0c8', 115, 1.9), hello: 'Un troll énorme s\'accroupit pour te regarder de près. « Moi pas manger gobelins. Promis. Moi garder village ? »' },
    ettin: { monstre: true, faim: 10, min: 10, nom: 'Ettin', evo: 'Ettin colossal', icon: '👥', hp: 230, dmg: 17, spd: 50, cd: 1.5, pz: 0.52, special: 'Double massue : les deux têtes frappent en même temps.', sp: slam('#e0b060', 125, 2.2), hello: 'Tête gauche : « On veut rester ! » Tête droite : « Non, c\'est MOI qui lui demande ! » Tête gauche : « On veut rester. S\'il te plaît. »' }
  });
  const NOMS = { gelee: ['Blob', 'Gloup', 'Flaque', 'Pudding', 'Mousse'], orc: ['Grok', 'Urzog', 'Brak', 'Dursh'], orcChaman: ['Zul\'Ga', 'Morgul', 'Yaga'], troll: ['Gronk', 'Mogh', 'Trumb'], ettin: ['Tic et Tac', 'Bim et Bam', 'Ho et Hé'] };
  // plus ton niveau est haut, plus les gros monstres viennent souvent — mais une gelée peut toujours passer
  Al.pickKind = function (lvl) {
    const ok = Object.keys(K).filter(k => K[k].monstre && lvl >= K[k].min); let tot = 0; const w = ok.map((k, i) => { const v = 1 + i * 0.7; tot += v; return v; });
    let r = Math.random() * tot; for (let i = 0; i < ok.length; i++) { r -= w[i]; if (r <= 0) return ok[i]; } return ok[0];
  };
  function visitor(role, look, extra) {
    const S = CG.S, R = CG.R, en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = Object.assign({ id: S.nextId++, role, look, x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4), dest: { x: f.x - 60 + rand(-20, 20), y: f.y + 100 } }, extra);
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v); return v; // pas d'annonce : on le découvre près du feu
  }
  Al.startMonster = function (kind) { const S = CG.S; if (S.pets.length >= P.MAX) return null; return visitor('monstre', 'animal', { kind: kind || Al.pickKind(S.player.lvl), evo: 0 }); };
  Al.talkMonster = function (v) {
    const S = CG.S, R = CG.R, k = K[v.kind], full = S.pets.length >= P.MAX;
    CG.UI.dialog({ visitor: v, who: k.nom, tag: 'un monstre qui vient en ami', text: k.hello, options: [
      { label: '🤝 Bienvenue dans le clan !', sub: full ? 'Tu as déjà trop de compagnons (' + P.MAX + ')' : 'Il défendra le village avec tes animaux (il mangera ' + P.eats({ kind: v.kind }) + ' 🍖 par jour' + (k.faim ? ' : fort, mais gros mangeur' : '') + ')', disabled: full, fn: () => {
        if (!R.visitors.includes(v) || S.pets.length >= P.MAX) return; R.visitors.splice(R.visitors.indexOf(v), 1);
        const used = S.pets.map(p => p.name), p = { id: S.nextId++, kind: v.kind, name: pick((NOMS[v.kind] || ['Ami']).filter(n => !used.includes(n))) || k.nom, lvl: 1, xp: 0, evo: 0, x: v.x, y: v.y, pet: true };
        p.hp = P.maxHp(p); P.reset(p); S.pets.push(p); S.morale = Math.min(100, S.morale + 3);
        for (let i = 0; i < 6; i++) G.text(p.x + rand(-24, 24), p.y - rand(20, 60), '💚', '#fff'); CG.sfx('heal');
        G.banner(p.name + ' rejoint le clan !', k.icon + ' ' + k.nom + ' · un allié de plus pour défendre le village.', '#c8ffb0');
      } },
      { label: '👋 Non merci, passe ton chemin', sub: 'Il repart sans faire d\'histoires', fn: () => { if (R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } } }] });
  };

  // ---------- dessin des monstres (les nôtres portent un foulard vert du clan) ----------
  function brute(g, o, t, c) {
    const st = o.moving ? Math.sin((o.step || 0) * TAU) : 0, bob = o.moving ? Math.abs(Math.cos((o.step || 0) * TAU)) * 2 : Math.sin(t * 2.4 + (o.seed || 0)) * 1, at = o.atkAnim || 0, h = c.h, w = c.w;
    el(g, 0, 1, w * 0.95, w * 0.3, 'rgba(0,0,0,0.25)');
    [-1, 1].forEach(k => { rr(g, k * w * 0.42 - w * 0.2, -h * 0.3 - (k * st > 0 ? 3 : 0), w * 0.4, h * 0.32, 4, c.dark); el(g, k * w * 0.42 + 2, -1 - (k * st > 0 ? 3 : 0), w * 0.27, 4, c.dark); });
    g.save(); g.translate(0, -bob);
    rr(g, -w * 0.5 - 6, -h * 0.74 + st * 2, 9, h * 0.42, 4.5, c.skin); el(g, -w * 0.5 - 1.5, -h * 0.33 + st * 2, 5.5, 5.5, c.light);        // bras arrière
    g.fillStyle = c.cloth; g.beginPath(); g.moveTo(-w * 0.62, -h * 0.74); g.quadraticCurveTo(-w * 0.72, -h * 0.4, -w * 0.5, -h * 0.24); g.lineTo(w * 0.5, -h * 0.24); g.quadraticCurveTo(w * 0.72, -h * 0.4, w * 0.62, -h * 0.74); g.closePath(); g.fill();
    if (c.robe) pl(g, [-w * 0.52, -h * 0.3, w * 0.52, -h * 0.3, w * 0.62, -4, -w * 0.62, -4], c.cloth);
    el(g, 0, -h * 0.5, w * 0.5, h * 0.2, 'rgba(0,0,0,0.12)'); rr(g, -w * 0.56, -h * 0.34, w * 1.12, 5, 2.5, '#3b2416');
    pl(g, [-w * 0.3, -h * 0.76, 0, -h * 0.62, w * 0.3, -h * 0.76], '#3f9a3a');                                                               // foulard vert du clan
    // bras avant + arme
    g.save(); g.translate(w * 0.5 + 2, -h * 0.72); g.rotate(-0.25 - at * 1.5 - st * 0.2); rr(g, -4.5, 0, 9, h * 0.4, 4.5, c.skin);
    g.translate(0, h * 0.4);
    if (c.weapon === 'hache') { rr(g, -1.6, -h * 0.5, 3.2, h * 0.56, 1.5, '#6b4a2a'); g.fillStyle = '#b8bcc8'; g.beginPath(); g.moveTo(1, -h * 0.5); g.quadraticCurveTo(15, -h * 0.5 - 4, 13, -h * 0.5 + 15); g.lineTo(1, -h * 0.5 + 10); g.closePath(); g.fill(); }
    else if (c.weapon === 'baton') { rr(g, -1.6, -h * 0.66, 3.2, h * 0.74, 1.5, '#5a3d22'); el(g, 0, -h * 0.7, 6.5, 6.5, 'rgba(120,255,220,0.35)'); el(g, 0, -h * 0.7, 4, 4.5, '#f4ead0'); el(g, -1.5, -h * 0.71, 1, 1.3, '#2a1c2a'); el(g, 1.5, -h * 0.71, 1, 1.3, '#2a1c2a'); }
    else { g.fillStyle = '#7a5630'; g.beginPath(); g.moveTo(-2.2, 4); g.lineTo(-6, -h * 0.5); g.quadraticCurveTo(0, -h * 0.58, 6, -h * 0.5); g.lineTo(2.2, 4); g.closePath(); g.fill(); [[-3, -h * 0.4], [3.5, -h * 0.32], [-1, -h * 0.25]].forEach(q => el(g, q[0], q[1], 1.6, 1.6, '#3b2416')); }
    el(g, 0, 0, 5.5, 5.5, c.light); g.restore();
    // la ou les têtes
    c.heads.forEach(hd => {
      const hx = hd[0] * w, hy = -h * 0.74 - c.hr * 0.72 + hd[1], r = c.hr * (hd[2] || 1);
      pl(g, [hx - r * 0.9, hy - 1, hx - r * 1.75, hy - r * 0.5, hx - r * 0.85, hy + r * 0.45], c.skin); pl(g, [hx + r * 0.9, hy - 1, hx + r * 1.75, hy - r * 0.5, hx + r * 0.85, hy + r * 0.45], c.dark);
      g.fillStyle = c.skin; g.beginPath(); g.moveTo(hx, hy - r); g.bezierCurveTo(hx + r * 0.9, hy - r, hx + r * 1.1, hy - r * 0.2, hx + r, hy + r * 0.35); g.bezierCurveTo(hx + r * 0.9, hy + r * 0.95, hx + r * 0.6, hy + r, hx, hy + r); g.bezierCurveTo(hx - r * 0.6, hy + r, hx - r * 0.9, hy + r * 0.95, hx - r, hy + r * 0.35); g.bezierCurveTo(hx - r * 1.1, hy - r * 0.2, hx - r * 0.9, hy - r, hx, hy - r); g.fill();
      el(g, hx + r * 0.25, hy + r * 0.12, r * (c.nose || 0.3), r * (c.nose || 0.3) * 0.8, c.light);
      [-0.3, 0.55].forEach(k => { el(g, hx + r * k, hy - r * 0.22, r * 0.19, r * 0.21, '#fffdf0'); el(g, hx + r * k + r * 0.05, hy - r * 0.2, r * 0.09, r * 0.11, '#1c1510'); });
      g.fillStyle = c.deep; g.beginPath(); g.moveTo(hx - r * 0.62, hy - r * 0.55); g.lineTo(hx - r * 0.02, hy - r * 0.36); g.lineTo(hx - r * 0.05, hy - r * 0.5); g.closePath(); g.fill(); g.beginPath(); g.moveTo(hx + r * 0.9, hy - r * 0.55); g.lineTo(hx + r * 0.3, hy - r * 0.36); g.lineTo(hx + r * 0.33, hy - r * 0.5); g.closePath(); g.fill();
      ln(g, [hx - r * 0.35, hy + r * 0.58, hx + r * 0.15, hy + r * 0.52, hx + r * 0.6, hy + r * 0.6], c.deep, 1.6);
      [-0.3, 0.55].forEach(k => pl(g, [hx + r * k - 2, hy + r * 0.62, hx + r * k, hy + r * 0.2, hx + r * k + 2, hy + r * 0.62], '#fff8dc'));
      if (c.plume) { [-0.35, 0, 0.35].forEach(a => { g.save(); g.translate(hx + a * r, hy - r * 0.9); g.rotate(a); el(g, 0, -r * 0.45, r * 0.16, r * 0.5, a ? '#14a89a' : '#2dd4bf'); g.restore(); }); rr(g, hx - r * 0.95, hy - r * 0.82, r * 1.9, r * 0.24, 2, '#5a3d22'); }
      if (c.hair) el(g, hx - r * 0.15, hy - r * 0.95, r * 0.5, r * 0.22, c.hair);
    });
    g.restore();
  }
  const LOOKS = {
    orc: { h: 46, w: 17, hr: 10.5, skin: '#7f9a56', light: '#9cb86e', dark: '#5f7840', deep: '#2f3a1e', cloth: '#6a4a30', weapon: 'hache', heads: [[0, 0]], hair: '#2a2420' },
    orcChaman: { h: 44, w: 15, hr: 10, skin: '#7a9a70', light: '#98b88c', dark: '#58785a', deep: '#283a2a', cloth: '#4a3470', robe: true, weapon: 'baton', heads: [[0, 0]], plume: true },
    troll: { h: 62, w: 23, hr: 11.5, skin: '#7e98b0', light: '#a4bccf', dark: '#5a7388', deep: '#2a3a4a', cloth: '#5a4a38', weapon: 'massue', heads: [[0, 4]], nose: 0.46, hair: '#3a4a3a' },
    ettin: { h: 70, w: 27, hr: 11, skin: '#c8a274', light: '#e0bf94', dark: '#a07c52', deep: '#4a3420', cloth: '#6a5a3a', weapon: 'massue', heads: [[-0.42, 2], [0.42, -1, 1.04]], hair: '#5a3a1c' }
  };
  function monster(g, o, t) {
    const k = o.kind, evo = o.evo ? 1.22 : 1, portrait = o.x === 0 && o.y === 0, z = portrait ? (K[k].pz || 1) : 1;
    g.save(); g.translate(o.x, o.y); g.scale((o.face < 0 ? -1 : 1) * evo * z, evo * z);
    if (o.ko && k === 'gelee') { // morte : il ne reste qu'une flaque, les yeux en croix
      g.globalAlpha = 0.6; el(g, 0, 1, 21, 6.5, o.evo ? '#58c8a8' : '#7ad86a'); el(g, -5, -0.5, 8, 2.2, 'rgba(255,255,255,0.3)'); el(g, 12, 3.5, 4, 1.6, o.evo ? '#58c8a8' : '#7ad86a'); el(g, -15, 4, 3, 1.3, o.evo ? '#58c8a8' : '#7ad86a');
      [-1, 1].forEach(s => { const x = 2 + s * 5; ln(g, [x - 1.6, -0.6, x + 1.6, 1.8], '#1c3a1c', 1.3); ln(g, [x - 1.6, 1.8, x + 1.6, -0.6], '#1c3a1c', 1.3); }); g.restore(); return; }
    if (o.ko) { g.globalAlpha = 0.55; g.rotate(1.4); } // mort : couché par terre, pâle, comme les autres animaux
    if (!portrait && !o.ko) el(g, 0, 1, 16 * (LOOKS[k] ? LOOKS[k].w / 15 : 1), 5, 'rgba(90,220,110,0.28)');   // le halo vert des alliés
    if (k === 'gelee') {
      const ph = t * 4 + (o.seed || 0), sq = o.moving ? Math.sin(ph * 1.6) * 0.16 : Math.sin(ph * 0.6) * 0.06, hop = o.moving ? Math.max(0, Math.sin(ph * 1.6)) * 8 : 0, at = o.atkAnim || 0;
      el(g, 0, 1, 15, 4.5, 'rgba(0,0,0,0.22)'); g.translate(0, -hop); g.scale(1 + sq + at * 0.2, 1 - sq - at * 0.15);
      g.fillStyle = o.evo ? '#58c8a8' : '#7ad86a'; g.beginPath(); g.moveTo(-15, 0); g.bezierCurveTo(-19, -14, -11, -27, 0, -27); g.bezierCurveTo(11, -27, 19, -14, 15, 0); g.quadraticCurveTo(0, 4, -15, 0); g.fill();
      el(g, 3, -6, 11, 6, 'rgba(0,0,0,0.1)'); el(g, -6, -19, 5, 3.4, 'rgba(255,255,255,0.55)', -0.5); el(g, -9.5, -13, 1.6, 1.6, 'rgba(255,255,255,0.5)');
      [-1, 1].forEach(s => { el(g, 2 + s * 5.5, -13, 3, 3.6, '#fffdf0'); el(g, 2.8 + s * 5.5, -12.6, 1.5, 2, '#1c1510'); }); ln(g, [-1, -6.5, 2.5, -4.6, 6, -6.5], '#2a5a2a', 1.6);
      pl(g, [-5, -26, 0, -32, 5, -26], '#3f9a3a'); el(g, 0, -32, 2.6, 2.6, '#5ab84a');
      if (o.evo) { pl(g, [-7, -27, -7, -35, -3.5, -30, 0, -37, 3.5, -30, 7, -35, 7, -27], '#f0c030'); }
    } else brute(g, o, t, LOOKS[k]);
    g.restore();
  }
  const pet0 = Art.pet; Art.pet = function (g, o, t) { if (K[o.kind] && K[o.kind].monstre) return monster(g, o, t); return pet0.apply(this, arguments); };

  // ================= les esprits de la forêt =================
  Al.BLESS = {
    seve: { icon: '🌿', nom: 'Sève vive', desc: 'Toi, tes gobelins et tes compagnons retrouvez toute votre vie, tout de suite.', now: () => { const S = CG.S, p = S.player; p.hp = p.maxhp; p.mp = p.maxmp; S.goblins.forEach(g => { g.hp = G.gobMaxHp(g); }); S.pets.forEach(a => { a.hp = P.maxHp(a); a.ko = false; }); } },
    recolte: { icon: '🍄', nom: 'Récolte généreuse', day: true, desc: 'Jusqu\'à demain matin, cueilleurs, chasseurs et mineurs rapportent 1 de plus à chaque voyage.' },
    cerf: { icon: '🦌', nom: 'Pas du cerf', day: true, desc: 'Jusqu\'à demain matin, toi et tout ton clan marchez bien plus vite.' },
    ecorce: { icon: '🛡️', nom: 'Écorce de chêne', day: true, desc: 'Jusqu\'à demain matin, toi et tes gobelins recevez un tiers de dégâts en moins.' },
    graine: { icon: '🌰', nom: 'Graine de sagesse', desc: '+1 point de technologie.', now: () => { CG.S.tech.points++; } },
    glands: { icon: '✨', nom: 'Glands dorés', desc: 'Une poignée de glands en or pur : +45 or.', now: () => { const p = CG.S.player; G.gain('or', 45, p.x, p.y - 40); } }
  };
  Al.bless = id => { const b = CG.S && CG.S.bless; return !!b && b.id === id && b.day === CG.S.day; };
  Al.startSpirit = function () { const ids = Object.keys(Al.BLESS), a = pick(ids), b = pick(ids.filter(i => i !== a)); return visitor('esprit', 'esprit', { offers: [a, b], leaveAt: Math.min(18.5, CG.S.hour + 3) }); };
  Al.talkSpirit = function (v) {
    const S = CG.S, R = CG.R, gone = () => { if (!R.visitors.includes(v)) return; R.visitors.splice(R.visitors.indexOf(v), 1); G.puff(v.x, v.y - 30, '#c8ffd8', 30, 160, 4); R.rings.push({ x: v.x, y: v.y - 10, r: 80, life: 0.5, col: '#aef5c8' }); };
    CG.UI.dialog({ visitor: v, who: 'Esprit de la forêt', tag: 'il ne restera pas longtemps', text: 'Une voix douce comme le vent dans les feuilles : « Petit chef, tu prends soin de ces bois. Choisis un cadeau. »',
      options: v.offers.map(id => { const B = Al.BLESS[id]; return { label: B.icon + ' ' + B.nom, sub: B.desc, fn: () => {
        if (!R.visitors.includes(v)) return; if (B.now) B.now(); if (B.day) S.bless = { id, day: S.day };
        const p = S.player; G.puff(p.x, p.y - 24, '#aef5c8', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 110, life: 0.6, col: '#aef5c8' }); CG.sfx('heal'); S.morale = Math.min(100, S.morale + 3);
        CG.UI.toast(B.icon + ' Bénédiction de la forêt : ' + B.nom + '. ' + B.desc); gone();
      } }; }).concat([{ label: '🙏 Merci, mais je n\'ai besoin de rien', sub: 'L\'esprit s\'efface en souriant', fn: gone }]) });
  };
  // les bénédictions qui durent la journée
  const gm = G.gobMul; G.gobMul = () => gm() * (Al.bless('cerf') ? 1.3 : 1);
  const hm = G.heroMul; G.heroMul = () => hm() * (Al.bless('cerf') ? 1.25 : 1);
  const hg = G.hurtGoblin; G.hurtGoblin = function (g, dmg) { return hg.call(this, g, Al.bless('ecorce') ? dmg * 0.67 : dmg); };
  const hp = G.hurtPlayer; G.hurtPlayer = function (dmg) { return hp.call(this, Al.bless('ecorce') ? dmg * 0.67 : dmg); };

  // dessin de l'esprit : une petite lueur de la forêt, avec des bois en feuilles
  function spirit(g, v, t) {
    const ph = t * 2 + (v.seed || 0), fl = Math.sin(ph) * 4, portrait = v.x === 0 && v.y === 0;
    g.save(); g.translate(v.x, v.y - (portrait ? 4 : 10) + fl); if (portrait) { g.translate(0, 12); g.scale(0.82, 0.82); }
    if (!portrait) { g.save(); g.translate(0, 12 - fl); el(g, 0, 0, 16 - fl * 0.5, 5, 'rgba(160,255,200,0.3)'); g.restore(); }
    const gr = g.createRadialGradient(0, -22, 2, 0, -22, 46); gr.addColorStop(0, 'rgba(190,255,215,0.55)'); gr.addColorStop(1, 'rgba(190,255,215,0)'); g.fillStyle = gr; g.fillRect(-46, -68, 92, 92);
    for (let i = 0; i < 5; i++) { const a = ph * 0.7 + i * 1.257, r = 24 + Math.sin(ph + i) * 4; g.save(); g.translate(Math.cos(a) * r, -22 + Math.sin(a) * r * 0.5); g.rotate(a * 2); el(g, 0, 0, 4, 2, Math.sin(a) > 0 ? '#7ad86a' : 'rgba(122,216,106,0.5)'); g.restore(); }
    g.globalAlpha = 0.92; g.fillStyle = '#e4fff0'; g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(15, -42, 17, -22, 13, -8); g.quadraticCurveTo(9 + Math.sin(ph * 2) * 2, 0, 5, -5); g.quadraticCurveTo(0, 3 + Math.sin(ph * 2 + 1) * 2, -5, -5); g.quadraticCurveTo(-9 + Math.sin(ph * 2 + 2) * 2, 0, -13, -8); g.bezierCurveTo(-17, -22, -15, -42, 0, -42); g.fill(); g.globalAlpha = 1;
    el(g, -3, -18, 9, 12, 'rgba(160,235,200,0.35)');
    [-1, 1].forEach(s => { ln(g, [s * 5, -40, s * 9, -50, s * 15, -54], '#8a6a3a', 2.2); ln(g, [s * 9, -50, s * 6, -57], '#8a6a3a', 1.8); el(g, s * 16, -56, 4.2, 2.4, '#5ab84a', s * 0.6); el(g, s * 6, -59, 3.6, 2.2, '#7ad86a', -s * 0.5); });
    [-1, 1].forEach(s => ln(g, [s * 5 - 2.5, -28, s * 5, -30.5, s * 5 + 2.5, -28], '#2a5a4a', 1.8)); el(g, 0, -22, 2, 1.4, '#2a5a4a'); el(g, -9, -23, 2.6, 1.6, 'rgba(255,150,170,0.5)'); el(g, 9, -23, 2.6, 1.6, 'rgba(255,150,170,0.5)');
    g.restore();
  }
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) { if (v.look === 'esprit') return spirit(g, v, t + (v.seed || 0)); return vis0.apply(this, arguments); };

  // ================= branchement : visites et discussions =================
  const sv = D.startVisit; D.startVisit = function (ev) { if (ev.role === 'monstre') return Al.startMonster(ev.kind); if (ev.role === 'esprit') return Al.startSpirit(); return sv.apply(this, arguments); };
  const tk = D.talk; D.talk = function (v) { if (v.role === 'monstre') return Al.talkMonster(v); if (v.role === 'esprit') return Al.talkSpirit(v); return tk.apply(this, arguments); };
  Al.MONSTER_CHANCE = 0.25; Al.SPIRIT_CHANCE = 0.22;
  const plan = D.plan; D.plan = function () {
    plan.apply(this, arguments); const S = CG.S, R = CG.R; if (S.day < 2) return;
    if (S.pets.length < P.MAX && Math.random() < Al.MONSTER_CHANCE) R.schedule.push({ h: rand(7.5, 15.5), type: 'visit', role: 'monstre' });
    if (Math.random() < Al.SPIRIT_CHANCE) R.schedule.push({ h: rand(7, 15), type: 'visit', role: 'esprit' });
    R.schedule.sort((a, b) => a.h - b.h);
  };
  CG.debug && 0;
})(window.CG);
