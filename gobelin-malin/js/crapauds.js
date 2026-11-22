// Goblin Malin — les hommes-crapauds : les alliés du marais. Comme les orcs et les trolls de la forêt, ils viennent parfois
// jusqu'au feu demander une place dans le clan, mais seulement dans le deuxième monde. Trois sortes : le lancier (il attrape
// les ennemis avec sa langue), le chaman (il tire de loin et soigne) et le colosse (il retombe de tout son poids).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, P = CG.P, K = P.KINDS, Al = CG.Allies, Art = CG.Art, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand, dist = CG.dist;
  const Cr = CG.Crapauds = {};
  const marais = () => !!(CG.Mondes && CG.Mondes.marais());
  const langue = (p, e, d) => {
    if (d < 56 || d > 230) return false; const R = CG.R; p.lg = { x: e.x, y: e.y - 14, fin: R.t + 0.3 };
    for (let i = 0; i < 24 && dist(p, e) > 34 + e.r; i++) { const dx = p.x - e.x, dy = p.y - e.y, q = Math.hypot(dx, dy) || 1; if (!G.slide(e, dx / q * 8, dy / q * 8)) break; }
    e.path = null; e.slow = Math.max(e.slow, 2.5); G.hurtEnemy(e, P.dmg(p) * 2, p); p.atkAnim = 1; p.cdS = 6; CG.sfx('swing'); G.text(p.x, p.y - 62, 'Slurp !', '#ffb0c0'); P.xp(p, 2); return true;
  };
  const pluie = (p, e, d) => {
    const S = CG.S, R = CG.R, n = P.dmg(p) * 2.5, pl = S.player; let fait = false;
    if (dist(pl, p) < 240 && pl.hp < pl.maxhp - 1 && !(R.ko > 0)) { pl.hp = Math.min(pl.maxhp, pl.hp + n); G.text(pl.x, pl.y - 56, '+' + Math.round(n) + ' ❤', '#8dff9a'); fait = true; }
    for (const a of S.pets) { if (a.ko || dist(a, p) > 240) continue; const mh = P.maxHp(a); if (a.hp < mh - 1) { a.hp = Math.min(mh, a.hp + n); fait = true; } }
    for (const o of S.goblins) { if (o.hidden || dist(o, p) > 240) continue; const mh = G.gobMaxHp(o); if (o.hp < mh - 1) { o.hp = Math.min(mh, o.hp + n); fait = true; } }
    if (!fait) return false; R.rings.push({ x: p.x, y: p.y - 6, r: 240, life: 0.6, col: '#7dffd0' }); G.puff(p.x, p.y - 40, '#7dffd0', 20, 150, 4); CG.sfx('heal'); p.atkAnim = 1; p.cdS = 9; P.xp(p, 2); return true;
  };
  const plouf = (p, e, d) => {
    if (d > 74) return false; const R = CG.R; R.rings.push({ x: p.x, y: p.y - 4, r: 112, life: 0.5, col: '#b8c860' }); G.puff(p.x, p.y - 4, '#b8c860', 20, 190, 5); CG.sfx('fire'); p.atkAnim = 1;
    for (const o of R.enemies) if (!o.dead && dist(o, p) < 112 + o.r) { o.slow = Math.max(o.slow, 3); G.hurtEnemy(o, P.dmg(p) * 1.9, p); } p.cdS = 8; P.xp(p, 2); return true;
  };
  Object.assign(K, {
    crapaudLancier: { monstre: true, marais: true, faim: 4, min: 1, nom: 'Homme-crapaud lancier', evo: 'Champion des roseaux', icon: '🐸', hp: 80, dmg: 9, spd: 74, cd: 0.9, pz: 0.9, special: 'Coup de langue : il attrape un ennemi de loin, le ramène à lui et le frappe.', sp: langue, hello: '« Croâ. Toi, le petit vert qui a chassé le roi des lézards de nos mares ? Ma lance est à toi. Croâ. »' },
    crapaudChaman: { monstre: true, marais: true, faim: 3, min: 5, nom: 'Homme-crapaud chaman', evo: 'Oracle des brumes', icon: '🪷', hp: 58, dmg: 8, spd: 62, cd: 1.5, range: 220, pz: 0.9, special: 'Pluie des marais : il soigne le chef, les gobelins et les compagnons autour de lui.', sp: pluie, hello: '« Les têtards ont rêvé de ton feu, chef des gobelins. Les rêves des têtards ne mentent jamais. Je peux m\'asseoir ? »' },
    crapaudColosse: { monstre: true, marais: true, faim: 8, min: 8, nom: 'Homme-crapaud colosse', evo: 'Père de la vase', icon: '🪨', hp: 190, dmg: 14, spd: 50, cd: 1.4, pz: 0.62, special: 'Grand plouf : il saute, retombe de tout son poids et ralentit les ennemis autour.', sp: plouf, hello: 'Un crapaud grand comme une hutte s\'assoit lourdement près du feu. « Bôôô. Moi garder. Toi nourrir. Bon marché ? »' }
  });
  const NOMS = { crapaudLancier: ['Croâ', 'Glouk', 'Rainet', 'Têtard', 'Nénuphar'], crapaudChaman: ['Mamie Vase', 'Coasse', 'Brumeux'], crapaudColosse: ['Gros Plouf', 'Bouffi', 'Marmite'] };
  // dans la forêt, ils ne viennent pas ; dans le marais, il n'y a qu'eux
  Al.pickKind = function (lvl) {
    const m = marais(), ok = Object.keys(K).filter(k => K[k].monstre && lvl >= K[k].min && !!K[k].marais === m); if (!ok.length) return m ? 'crapaudLancier' : 'gelee';
    let tot = 0; const w = ok.map((k, i) => { const v = 1 + i * 0.7; tot += v; return v; }); let r = Math.random() * tot; for (let i = 0; i < ok.length; i++) { r -= w[i]; if (r <= 0) return ok[i]; } return ok[0];
  };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev && ev.role === 'monstre' && marais() && !CG.Mondes.feuIci()) return null; return sv0.apply(this, arguments); };
  Cr.parler = function (v) {
    const S = CG.S, R = CG.R, k = K[v.kind], full = S.pets.length >= P.MAX;
    CG.UI.dialog({ visitor: v, who: k.nom, tag: 'un habitant du marais qui vient en ami', text: k.hello, options: [
      { label: '🤝 Bienvenue dans le clan !', sub: full ? 'Tu as déjà trop de compagnons (' + P.MAX + ')' : 'Il défendra le village avec tes compagnons (il mangera ' + P.eats({ kind: v.kind }) + ' 🍖 par jour)', disabled: full, fn: () => {
        if (!R.visitors.includes(v) || S.pets.length >= P.MAX) return; R.visitors.splice(R.visitors.indexOf(v), 1);
        const used = S.pets.map(p => p.name), p = { id: S.nextId++, kind: v.kind, name: pick(NOMS[v.kind].filter(n => !used.includes(n))) || k.nom, lvl: 1, xp: 0, evo: 0, x: v.x, y: v.y, pet: true };
        p.hp = P.maxHp(p); P.reset(p); S.pets.push(p); S.morale = Math.min(100, S.morale + 3);
        for (let i = 0; i < 6; i++) G.text(p.x + rand(-24, 24), p.y - rand(20, 60), '💚', '#fff'); CG.sfx('heal');
        G.banner(p.name + ' rejoint le clan !', k.icon + ' ' + k.nom + ' · un allié du marais pour défendre le village.', '#c8ffb0');
      } },
      { label: '👋 Non merci, retourne à ta mare', sub: 'Il repart en sautillant', fn: () => { if (R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } } }] });
  };
  const tk0 = D.talk; D.talk = function (v) { if (v.role === 'monstre' && K[v.kind] && K[v.kind].marais) return Cr.parler(v); return tk0.apply(this, arguments); };

  // ---------- dessin ----------
  const el = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  const rr = (g, x, y, w, h, r, f) => { g.fillStyle = f; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  const pl = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const ln = (g, p, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const LOOKS = {
    crapaudLancier: { s: 1, skin: '#6a9a4a', dark: '#4a7434', light: '#8ab862', ventre: '#dce4a4', arme: 'lance', pagne: '#8a5a30' },
    crapaudChaman: { s: 0.96, skin: '#4a9a8a', dark: '#2e6a5e', light: '#6cbcaa', ventre: '#d0ecd0', arme: 'baton', pagne: '#6a3a7a' },
    crapaudColosse: { s: 1.5, skin: '#8a8c3e', dark: '#606222', light: '#a8aa58', ventre: '#e4dca4', arme: 'massue', pagne: '#5a4630' }
  };
  function dessin(g, o, t) {
    const k = o.kind, c = LOOKS[k], evo = o.evo ? 1.2 : 1, portrait = o.x === 0 && o.y === 0, z = (portrait ? (K[k].pz || 1) : 1) * evo * c.s, face = o.face < 0 ? -1 : 1;
    const st = o.moving ? Math.sin((o.step || 0) * TAU) : 0, bob = o.moving ? Math.abs(Math.cos((o.step || 0) * TAU)) * 2.4 : Math.sin(t * 2.2 + (o.seed || 0)) * 0.8, at = o.atkAnim || 0, gorge = 1 + Math.sin(t * 3 + (o.seed || 0)) * 0.16;
    const R = CG.R, lg = o.lg && R && o.lg.fin > R.t ? o.lg : null;
    if (lg) { const bx = o.x + face * 12 * z, by = o.y - 27 * z; ln(g, [bx, by, lg.x, lg.y], '#b83a5a', 4.4); ln(g, [bx, by, lg.x, lg.y], '#f08aa0', 2.4); el(g, lg.x, lg.y, 4.4, 4.4, '#f08aa0'); }
    g.save(); g.translate(o.x, o.y); g.scale(face * z, z);
    if (!portrait) el(g, 0, 1, 17, 5.4, 'rgba(90,220,110,0.28)');   // le halo vert des alliés
    el(g, 0, 1, 14, 4.2, 'rgba(0,0,0,0.25)');
    // cuisses pliées et grands pieds palmés
    [-1, 1].forEach(s => { const up = s * st > 0 ? 3 : 0; el(g, s * 8, -7 - up, 6, 5, c.dark, s * 0.5); pl(g, [s * 5, -1.5 - up, s * 16, -3 - up, s * 17, 0.5 - up, s * 12, -0.4 - up, s * 13, 1.6 - up, s * 6, 1.4 - up], c.dark); });
    g.save(); g.translate(0, -bob);
    ln(g, [-9, -22, -14, -14 + st * 2], c.dark, 4.6); el(g, -14.4, -13 + st * 2, 3, 3, c.dark);                                         // bras arrière
    if (c.arme === 'lance') { el(g, -15, -16 + st * 2, 7.4, 8.4, '#5a8a3a'); el(g, -15, -16 + st * 2, 5, 6, '#7aaa4a'); ln(g, [-15, -23 + st * 2, -15, -9 + st * 2], '#4a7434', 1.2); } // bouclier de feuille
    el(g, 0, -16, 12, 10.4, c.skin); el(g, 2.4, -14, 8.4, 7.6, c.ventre);                                                                // corps et ventre clair
    pl(g, [-11, -9, 11, -9, 9, -3.6, 3, -5.6, -3, -3, -9, -5], c.pagne);                                                                 // pagne
    [[-8, -20, 1.5], [-10.4, -15, 1.2], [-5, -24, 1.1]].forEach(q => el(g, q[0], q[1], q[2], q[2], c.dark));                             // verrues
    pl(g, [-7, -24.4, 0, -19.6, 7.4, -24.4], '#3f9a3a');                                                                                 // foulard vert du clan
    el(g, 9, -23.4, 5.2 * gorge, 4.2 * gorge, c.ventre);                                                                                 // la gorge qui gonfle
    el(g, 2, -29, 13, 7.4, c.skin); el(g, 3, -26.6, 10.4, 3.6, c.light);                                                                 // grosse tête plate
    [[-3.4, -35.4], [8, -35]].forEach(q => { el(g, q[0], q[1], 4.6, 4.6, c.skin); el(g, q[0] + 0.5, q[1] - 0.3, 3.2, 3.2, '#ffd23a'); el(g, q[0] + 0.8, q[1] - 0.3, 2.3, 1, '#1c1410'); });
    if (at > 0.2 || lg) { el(g, 9, -27.4, 5.4, 2.2 + at * 2.2, '#5a1420'); } else ln(g, [-4, -27.6, 4, -26.2, 14, -28.4], c.dark, 1.5);
    el(g, 10, -31, 0.8, 0.6, c.dark); el(g, 12.4, -30.6, 0.8, 0.6, c.dark);
    if (c.arme === 'baton') { [-0.5, 0, 0.5].forEach((a, i) => { g.save(); g.translate(1 + i * 2.4 - 2.4, -35.6); g.rotate(a - 0.2); el(g, 0, -6, 1.8, 6, i === 1 ? '#f0e6c8' : '#c05a8a'); g.restore(); }); } // coiffe de plumes
    if (o.evo) pl(g, [-5, -35.6, -4, -41, -1.4, -37.6, 2, -42.4, 5, -37.6, 8.4, -41, 9, -35.6], '#f0c030');
    // bras avant et arme
    g.save(); g.translate(9.4, -22); g.rotate(-0.3 - at * 1.4 - st * 0.18); ln(g, [0, 0, 3, 9], c.skin, 4.8); g.translate(3, 9);
    if (c.arme === 'lance') { rr(g, -1.3, -30, 2.6, 40, 1.2, '#7a5a34'); pl(g, [0, -40, -3.6, -30, 3.6, -30], '#f0ead8'); rr(g, -2.6, -30.4, 5.2, 2.4, 1, '#c05a3a'); }
    else if (c.arme === 'baton') { rr(g, -1.4, -24, 2.8, 32, 1.3, '#5a4a34'); el(g, 0, -27, 7 + Math.sin(t * 4) * 1, 7 + Math.sin(t * 4) * 1, 'rgba(125,255,208,0.35)'); el(g, 0, -27, 4.2, 4.2, '#7dffd0'); el(g, -1.2, -28.2, 1.4, 1.4, '#eafff6'); }
    else { rr(g, -1.8, -16, 3.6, 22, 1.6, '#6a4a2a'); el(g, 0, -20, 6.4, 8.4, '#7a5a36'); [[-3, -22], [3, -18], [0, -26]].forEach(q => el(g, q[0], q[1], 1.5, 1.5, '#4a3420')); }
    el(g, 0, 0, 3.2, 3.2, c.light); g.restore();
    g.restore(); g.restore();
  }
  const pet0 = Art.pet; Art.pet = function (g, o, t) { if (!LOOKS[o.kind]) return pet0.apply(this, arguments); if (!o.ko) return dessin(g, o, t); g.save(); g.translate(o.x, o.y); g.rotate(1.4); g.globalAlpha = 0.55; dessin(g, Object.assign({}, o, { x: 0, y: 0, moving: false, atkAnim: 0 }), 0); g.restore(); }; /* mort : couché par terre, pâle, comme les autres animaux */
  Cr.dessin = dessin;
})(window.CG);
