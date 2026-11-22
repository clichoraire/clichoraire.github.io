// Goblin Malin — le monolithe magique. Une pierre dressée, gravée de runes, qui sent ce qui se cache : les voleurs et les bandes
// en embuscade qui passent dans son rayon sortent de l'ombre, surpris. Le rayon ne se voit pas : il faut cliquer sur le monolithe.
// Il peut aussi tirer des boules magiques, mais seulement avec la mana que le chef lui verse en restant à côté (E) : un point de mana, un tir.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  const Mn = CG.Monolithe = { RAYON: 300, PLEIN: 100, DEBIT: 14, PRES: 74, CD: 0.9, DMG: [7, 0.6], COUT: 1 }; /* RAYON : ce qu'il détecte et jusqu'où il tire ; PLEIN : sa charge complète ; DEBIT : mana versée par seconde ; DMG : dégâts d'un tir + par jour */
  CG.BUILDS.monolithe = { nom: 'Monolithe magique', icon: '🗿', w: 1, h: 1, cat: 'magie', cout: { minerai: 25, or: 40 },
    desc: 'Débusque les voleurs et tout ce qui se cache près de lui. Verse-lui ta mana (E, en restant à côté) : il tire une boule magique par point de mana. Clique dessus pour voir jusqu\'où il porte.' };
  // il se débloque dans l'arbre des technologies (branche magie) : on ne sait plus le bâtir dès le départ
  Mn.TECH = 's21'; CG.BUILDS.monolithe.tech = Mn.TECH;
  { const n = { id: Mn.TECH, br: 'sorc', rang: 0.6, cout: 2, t: 5, r: 1, icon: '🗿', nom: 'Monolithe magique', desc: 'Révèle le Monolithe magique : une pierre dressée qui débusque ce qui se cache et tire des boules magiques.', unlock: ['monolithe'] }; CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; }
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  if (Art.extra) Art.extra.monolithe = { w: 48, h: 104, draw(c) { const m = 24, b = 96;
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(m, b, 20, 6, 0, 0, TAU); c.fill();
    poly(c, [m - 17, b, m - 14, b - 8, m + 14, b - 8, m + 17, b], '#4a4656'); poly(c, [m - 12, b - 6, m - 10, b - 70, m - 3, b - 86, m + 6, b - 84, m + 11, b - 66, m + 12, b - 6], '#5e5a70');
    poly(c, [m + 1, b - 6, m + 1, b - 85, m + 6, b - 84, m + 11, b - 66, m + 12, b - 6], '#48445a'); poly(c, [m - 10, b - 70, m - 3, b - 86, m + 1, b - 85, m - 5, b - 68], '#7a7690');
    c.strokeStyle = 'rgba(20,16,30,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(m - 9, b - 40); c.lineTo(m - 2, b - 44); c.moveTo(m + 4, b - 22); c.lineTo(m + 10, b - 27); c.stroke();
    c.fillStyle = 'rgba(90,150,90,0.7)'; c.fillRect(m - 13, b - 12, 7, 4); c.fillRect(m + 5, b - 10, 6, 3); } }; /* un peu de mousse au pied */
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h) * T - 4 });
  const liste = () => (CG.S ? CG.S.buildings.filter(b => b.type === 'monolithe' && !b.site) : []);
  const cds = new WeakMap(); let choisi = null;
  // ---------- un clic sur le monolithe : on voit son rayon ; un clic ailleurs : il disparaît ----------
  Mn.clic = function (cx, cy) { const b = [G.buildingAt(cx, cy), G.buildingAt(cx, cy + 1), G.buildingAt(cx, cy + 2)].find(o => o && o.type === 'monolithe' && !o.site); if (!b) { choisi = null; return false; } choisi = choisi === b ? null : b; CG.sfx('click'); return true; };
  // ---------- verser sa mana : E à côté, et rester là ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (!R || R.ko > 0 || R.cine || R.build || (it && it.type !== 'ameliorer')) return it; const p = CG.S.player; let best = null, bd = Mn.PRES;
    for (const b of liste()) { const c = centre(b), d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd) { bd = d; best = b; } } if (!best) return it;
    const n = Math.floor(best.charge || 0), c = centre(best);
    return { type: 'monolithe', obj: { x: c.x, y: c.y - 70, b: best }, label: R.monoVerse === best ? 'Arrêter de verser ta mana (' + n + ' / ' + Mn.PLEIN + ')' : n >= Mn.PLEIN ? 'Le monolithe est plein (' + n + ' / ' + Mn.PLEIN + ')' : 'Verser ta mana dans le monolithe (' + n + ' / ' + Mn.PLEIN + ')' };
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'monolithe') return in0.apply(this, arguments); const R = CG.R, b = it.obj.b, p = CG.S.player;
    if (R.monoVerse === b) { R.monoVerse = null; return; } if ((b.charge || 0) >= Mn.PLEIN) { CG.sfx('no'); return CG.UI.toast('Le monolithe est déjà plein de mana.'); } if (p.mp < 1) { CG.sfx('no'); return CG.UI.toast('Tu n\'as plus de mana à lui donner.'); }
    R.monoVerse = b; CG.sfx('spell'); };
  // depuis sa fiche : où en est-il, et le bouton pour verser (il faut être à côté)
  Mn.etat = function (b) { const R = CG.R, p = CG.S.player, c = centre(b), n = Math.floor(b.charge || 0); return { n, plein: n >= Mn.PLEIN, verse: R.monoVerse === b, pres: Math.hypot(p.x - c.x, p.y - c.y) < Mn.PRES, mana: p.mp >= 1 }; };
  Mn.verser = function (b) { const R = CG.R, e = Mn.etat(b); if (e.verse) { R.monoVerse = null; return true; } if (e.plein || !e.pres || !e.mana) { CG.sfx('no'); return false; } R.monoVerse = b; CG.sfx('spell'); return true; };
  // ---------- chaque instant : il débusque, il boit la mana du chef, il tire ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night || R.cine) return; const l = liste(); if (choisi && !l.includes(choisi)) choisi = null; if (!l.length) { R.monoVerse = null; return; } const p = S.player, Om = CG.Ombre;
    const v = R.monoVerse; /* le chef verse sa mana : il doit rester à côté */
    if (v) { const c = centre(v), q = Math.min(Mn.DEBIT * dt, p.mp, Mn.PLEIN - (v.charge || 0));
      if (!l.includes(v) || R.ko > 0 || Math.hypot(p.x - c.x, p.y - c.y) > Mn.PRES + 14 || q <= 0.0001 || p.mp < 1) { /* plus de mana (moins d'un point) : ça s'arrête tout seul, sans boire au goutte-à-goutte ce qui revient */ R.monoVerse = null; if (l.includes(v)) { G.text(c.x, c.y - 96, (v.charge || 0) >= Mn.PLEIN - 0.01 ? '🔮 Plein !' : '🔮 ' + Math.floor(v.charge || 0) + ' / ' + Mn.PLEIN, '#d8b8ff', true); if ((v.charge || 0) >= Mn.PLEIN - 0.01) { v.charge = Mn.PLEIN; CG.sfx('level'); } } }
      else { p.mp -= q; v.charge = (v.charge || 0) + q; p.face = c.x > p.x ? 1 : -1; R.monoT = (R.monoT || 0) - dt; if (R.monoT <= 0) { R.monoT = 0.5; CG.sfx('zap'); }
        for (let i = 0; i < 2; i++) if (Math.random() < dt * 30) { const a = Math.random() * TAU, sx = p.x + Math.cos(a) * 16, sy = p.y - 22 + Math.sin(a) * 14, tx = c.x, ty = c.y - 56, life = 0.45; R.parts.push({ x: sx, y: sy, vx: (tx - sx) / life, vy: (ty - sy) / life, life, max: life, col: Math.random() < 0.5 ? '#7db8ff' : '#c9a0ff', size: rand(2.5, 4.5), float: true }); } /* la mana quitte le chef et file vers la pierre */
        if (Math.random() < dt * 9) R.rings.push({ x: p.x, y: p.y - 6, r: 26, life: 0.35, col: '#7db8ff' }); } }
    for (const b of l) { const c = centre(b);
      if (Om && R.ombres && R.ombres.length) for (const e of R.ombres.slice()) { if (!R.ombres.includes(e) || Math.hypot(e.x - c.x, e.y - c.y) > Mn.RAYON) continue; /* ce qui se cache dans son rayon sort de l'ombre */
        if (e.embuscade) R.ombres.filter(o => o.embuscade === e.embuscade).forEach(o => Om.reveler(o, true)); else Om.reveler(e, true);
        R.rings.push({ x: c.x, y: c.y - 50, r: 70, life: 0.6, col: '#c9a0ff' }); G.text(c.x, c.y - 100, '👁️', '#fff', true); }
      if ((b.charge || 0) < Mn.COUT) continue; let cd = (cds.get(b) || 0) - dt; /* chargé : une boule magique sur l'ennemi le plus proche */
      if (cd <= 0) { let e = null, bd = Mn.RAYON; for (const o of R.enemies) { if (o.dead || o.calm || o.retreat || o.struct) continue; const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; e = o; } }
        if (e) { cd = Mn.CD; b.charge -= Mn.COUT; G.shoot({ x: c.x, y: c.y - 62 }, e, 'bolt', Mn.DMG[0] + S.day * Mn.DMG[1], 'g'); const s = R.shots[R.shots.length - 1]; if (s) s.etin = 3; G.puff(c.x, c.y - 80, '#c9a0ff', 6, 70, 3); if (CG.onScreen(c.x, c.y)) CG.sfx('zap'); } else cd = 0.25; }
      cds.set(b, cd); }
  };
  // ---------- dessin : les runes s'allument avec la charge ; le rayon, seulement pour le monolithe choisi ----------
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); if (!choisi || !CG.S || !CG.S.buildings.includes(choisi)) return; const c = centre(choisi);
    g.save(); g.fillStyle = 'rgba(170,130,255,0.07)'; g.beginPath(); g.ellipse(c.x, c.y - 10, Mn.RAYON, Mn.RAYON, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(200,170,255,0.75)'; g.lineWidth = 2; g.setLineDash([10, 8]); g.lineDashOffset = -t * 14; g.stroke(); g.restore();
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const b of liste()) { const c = centre(b); if (!CG.onScreen(c.x, c.y)) continue; const k = Math.min(1, (b.charge || 0) / Mn.PLEIN), verse = R.monoVerse === b, a = 0.25 + k * 0.6 + Math.sin(t * (verse ? 9 : 2.4)) * 0.12;
      g.strokeStyle = 'rgba(' + (k > 0 ? '190,150,255,' : '120,160,200,') + a + ')'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); /* trois runes gravées, l'une au-dessus de l'autre */
      g.moveTo(c.x - 5, c.y - 68); g.lineTo(c.x + 1, c.y - 76); g.lineTo(c.x + 5, c.y - 66); g.moveTo(c.x, c.y - 76); g.lineTo(c.x, c.y - 60);
      g.moveTo(c.x - 5, c.y - 50); g.lineTo(c.x + 4, c.y - 50); g.lineTo(c.x - 4, c.y - 40); g.lineTo(c.x + 5, c.y - 40);
      g.moveTo(c.x - 4, c.y - 30); g.lineTo(c.x, c.y - 20); g.lineTo(c.x + 5, c.y - 31); g.moveTo(c.x - 5, c.y - 24); g.lineTo(c.x + 5, c.y - 24); g.stroke();
      if (k > 0 || verse || b === choisi) { const w = 34, x = c.x - w / 2, y = c.y - 104; g.fillStyle = 'rgba(10,8,20,0.6)'; g.fillRect(x - 1, y - 1, w + 2, 6); g.fillStyle = '#9a6aff'; g.fillRect(x, y, w * k, 4); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, w * k, 1.2); } }
  };
  // ---------- le prix : chaque monolithe déjà posé dans ce monde ajoute Mn.OR pièces d'or au suivant (les roches ne bougent pas) ----------
  Mn.OR = 250;
  Mn.prix = function () { const S = CG.S, n = S ? S.buildings.filter(b => b.type === 'monolithe').length : 0; CG.BUILDS.monolithe.cout.or = Mn.OR * (n + 1); return CG.BUILDS.monolithe.cout; };
  Mn.prix();
  { const up1 = G.update; G.update = function () { Mn.prix(); return up1.apply(this, arguments); };
    const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); Mn.prix(); return r; }; }
  Mn.essai = function () { const S = CG.S, p = S.player, b = { type: 'monolithe', tx: Math.floor(p.x / T) + 2, ty: Math.floor(p.y / T), w: 1, h: 1, variant: 0 }; S.buildings.push(b); W.blockBuilding(b); return b; };
})(window.CG);
