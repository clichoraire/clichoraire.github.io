// Goblin Malin — deux petits sorts du 1er cercle qui affaiblissent un monstre, sans lui faire mal :
//   Maladresse : le monstre visé devient maladroit. Ses coups font bien moins mal et il rate une partie de ses attaques.
//   Tête vide : pour ceux qui lancent des sorts ou tirent de loin. Leur magie fait bien moins mal.
// Chacun a ses trois niveaux (plus fort, plus longtemps, puis tous les monstres autour de la cible). Réglages : CG.SortsFaibles.
'use strict';
(function (CG) {
  const G = CG.G, SP = CG.SPELLS;
  const Sf = CG.SortsFaibles = { PORTEE: 330, DUR: [18, 26, 36], MALADROIT: [0.9, 0.85, 0.8], RATE: [0.4, 0.55, 0.7], FAIBLE: [0.6, 0.45, 0.33], TETE: [0.5, 0.35, 0.25], AUTOUR: 130 }; /* MALADROIT / TETE : ce qu'il reste des dégâts du monstre ; RATE : la part des coups qu'il manque */
  SP.maladroit = { nom: 'Maladresse', icon: '🫨', mp: 4, prix: 300, color: '#e8c070', desc: 'Le monstre le plus proche devient tout maladroit : ses coups font bien moins mal, et il en rate plusieurs.' };
  SP.tetevide = { nom: 'Tête vide', icon: '😵‍💫', mp: 4, prix: 350, color: '#b8a0ff', desc: 'Le lanceur de sorts ou le tireur le plus proche oublie ce qu\'il sait : sa magie et ses tirs font bien moins mal.' };
  SP.maladroit.desc = 'Le monstre le plus proche devient tout maladroit : il rate une bonne partie de ses coups.';
  SP.faiblesse = { nom: 'Faiblesse', icon: '🥀', mp: 4, prix: 320, color: '#c8a0a0', desc: 'Le monstre le plus proche perd ses forces : ses coups font bien moins mal.' };
  ['maladroit', 'tetevide', 'faiblesse'].forEach(id => { if (!CG.SCROLL_POOL.includes(id)) CG.SCROLL_POOL.push(id); });
  if (CG.Niveaux) { CG.Niveaux.T.maladroit = null; CG.Niveaux.T.tetevide = null; delete CG.Niveaux.T.maladroit; delete CG.Niveaux.T.tetevide; }
  Sf.T = { maladroit: ['Encore plus maladroit, plus longtemps.', 'Tous les monstres autour de la cible deviennent maladroits.'], faiblesse: ['Encore plus faible, plus longtemps.', 'Tous les monstres autour de la cible perdent leurs forces.'], tetevide: ['Sa magie fait encore moins mal, plus longtemps.', 'Tous les lanceurs de sorts autour de la cible sont touchés.'] };
  const niv = id => (CG.Niveaux && CG.Niveaux.niv ? Math.min(3, CG.Niveaux.niv(id)) : 1);
  const loin = e => { const d = CG.ENEMIES[e.type] || {}; return !!(e.range || d.range || d.magic); };
  function toucher(e, id, n) {
    const k = id === 'maladroit' ? Sf.MALADROIT[n - 1] : id === 'faiblesse' ? Sf.FAIBLE[n - 1] : Sf.TETE[n - 1], a = e.affaibli || (e.affaibli = {}); if (a[id]) { e.dmg = e.dmg / a[id].k; if (e.dmg0 !== undefined) e.dmg0 /= a[id].k; } // déjà touché : on repart de sa vraie force
    a[id] = { t: Sf.DUR[n - 1], k, rate: id === 'maladroit' ? Sf.RATE[n - 1] : 0 }; e.dmg *= k; if (e.dmg0 !== undefined) e.dmg0 *= k; /* les loups recalculent leurs dégâts depuis e.dmg0 (loups.js) */
    G.text(e.x, e.y - 62, id === 'maladroit' ? '🫨 Maladroit !' : id === 'faiblesse' ? '🥀 Affaibli !' : '😵‍💫 Tête vide !', SP[id].color, true); CG.R.rings.push({ x: e.x, y: e.y - 8, r: 44, life: 0.45, col: SP[id].color }); G.puff(e.x, e.y - 30, SP[id].color, 10, 80, 3);
  }
  const ca0 = G.cast; G.cast = function (id) {
    if (id !== 'maladroit' && id !== 'tetevide' && id !== 'faiblesse') return ca0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return; const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    let tg = null, bd = Sf.PORTEE; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || (id === 'tetevide' && !loin(e))) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tg = e; } }
    if (!tg) { CG.sfx('no'); G.text(p.x, p.y - 56, id === 'tetevide' ? 'Aucun lanceur de sorts ici' : 'Aucun monstre ici', SP[id].color); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); const n = niv(id); p.face = tg.x > p.x ? 1 : -1;
    R.bolts.push({ x1: p.x, y1: p.y - 26, x2: tg.x, y2: tg.y - 18, life: 0.25 }); toucher(tg, id, n);
    if (n >= 3) for (const e of R.enemies) { if (e === tg || e.dead || e.struct || e.charm > 0 || (id === 'tetevide' && !loin(e)) || Math.hypot(e.x - tg.x, e.y - tg.y) > Sf.AUTOUR) continue; toucher(e, id, n); }
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const R = CG.R; if (!R || !R.enemies) return;
    for (const e of R.enemies) { const a = e.affaibli; if (!a || e.dead) continue; for (const id in a) { const q = a[id]; q.t -= dt;
        if (q.rate && e.atkCd > (q.vu || 0) + 0.2 && Math.random() < q.rate) { e.atkCd += 0.9; if (CG.onScreen(e.x, e.y)) G.text(e.x, e.y - 54, 'Oups !', '#e8c070'); } q.vu = e.atkCd; // il s'emmêle : son prochain coup tarde
        if (q.t <= 0) { e.dmg = e.dmg / q.k; if (e.dmg0 !== undefined) e.dmg0 /= q.k; delete a[id]; } else if (Math.random() < dt * 3) R.parts.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - 40 - Math.random() * 10, vx: 0, vy: -20, life: 0.5, max: 0.5, col: SP[id].color, size: 2.5, float: true }); } }
  };
})(window.CG);
