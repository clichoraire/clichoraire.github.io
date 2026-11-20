// Goblin Malin — le butin d'un chef vaincu : plus de fenêtre ni de roulement de tambours. Il éclate en une gerbe d'or et tout tombe
// par terre autour de lui : soit un parchemin de sort (ou une recette d'alchimie) au milieu d'une poignée de pièces, soit un vrai
// trésor — des tas d'or, du bois, du minerai ou du cuir, des fioles. On ramasse en marchant dessus.
'use strict';
(function (CG) {
  const G = CG.G, Bu = CG.Butin = {}, TAU = Math.PI * 2, rand = CG.rand;
  Bu.CHANCE = { capitaine: 0.6, troll: 0.55, seigneur: 0.9 }; // chance de trouver un parchemin (s'il t'en reste à découvrir)
  // ce que le chef cachait
  function tirage(type) {
    const Po = CG.Potions; if (Po && Math.random() < Po.CHANCE) { const r = Po.nouvelle(); if (r) return { recette: r }; } // parfois : une recette d'alchimie (potions.js)
    const id = Math.random() < (Bu.CHANCE[type] || 0.55) ? G.newScroll() : null;
    return id ? { scroll: id } : {};
  }
  // n objets d'une ressource, en plusieurs tas qui jaillissent l'un après l'autre
  function tas(x, y, res, total, n) { let reste = Math.round(total); for (let i = 0; i < n && reste > 0; i++) { const q = i === n - 1 ? reste : Math.max(1, Math.round(total / n * rand(0.7, 1.3))), v = Math.min(reste, q); reste -= v; G.drop(x, y, { kind: 'res', res, n: v }); } }
  function pluie(x, y, type, prix) {
    const S = CG.S, R = CG.R, d = S.day, beau = !!(prix.scroll || prix.recette), def = CG.ENEMIES[type] || {};
    if (prix.scroll) G.drop(x, y, { kind: 'scroll', id: prix.scroll }); else if (prix.recette) G.drop(x, y, { kind: 'recette', id: prix.recette });
    if (beau) tas(x, y, 'or', 50 + 12 * d, 6); // le parchemin tombe au milieu d'une poignée de pièces
    else { tas(x, y, 'or', 150 + 40 * d, 16); tas(x, y, 'bois', 60 + 15 * d, 6); if (Math.random() < 0.5) tas(x, y, 'minerai', 20 + 5 * d, 5); else tas(x, y, 'cuir', 10 + 3 * d, 5); for (let i = 0; i < 2; i++) G.drop(x, y, { kind: 'potion', n: 1 }); }
    // le spectacle : l'écran tremble, des anneaux d'or, une gerbe de pièces qui monte et retombe
    R.shake = Math.max(R.shake || 0, 0.5);
    for (let i = 0; i < 5; i++) R.rings.push({ x, y: y - 10, r: 60 + i * 46, life: 0.4 + i * 0.13, col: i % 2 ? '#ffffff' : '#ffe36b' });
    G.puff(x, y - 20, '#ffe36b', 46, 240, 5); G.puff(x, y - 20, '#ffffff', 22, 160, 4);
    for (let i = 0; i < 54; i++) { const a = Math.random() * TAU, v = rand(60, 230); R.parts.push({ x: x + Math.cos(a) * 6, y: y - 18, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - rand(120, 300), life: rand(0.7, 1.3), max: 1.3, col: i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? '#ffd84a' : i % 4 === 2 ? '#ffb020' : '#fff3a8', size: rand(2.5, 5) }); }
    if (beau) { const col = prix.scroll ? (CG.SPELLS[prix.scroll] || {}).color || '#ffe36b' : (CG.Potions.L[prix.recette] || {}).col || '#ffe36b'; for (let i = 0; i < 3; i++) R.rings.push({ x, y: y - 10, r: 40 + i * 30, life: 0.7 + i * 0.2, col }); G.puff(x, y - 30, col, 30, 130, 5); }
    G.text(x, y - 96, '💀 ' + (def.nom || 'Le chef') + ' est vaincu !', '#ffb0a0', true);
    G.text(x, y - 70, prix.scroll ? '📜 Il cachait un parchemin !' : prix.recette ? '📄 Il cachait une recette !' : '💰 Son trésor est à toi !', '#ffe36b', true);
    if (CG.onScreen(x, y)) { CG.sfx('victory'); CG.sfx('coin'); setTimeout(() => CG.sfx(beau ? 'discovery' : 'coin'), 350); }
  }
  CG.Boss.loot = function (e) { pluie(e.x, e.y, e.type, tirage(e.type)); };
  Bu.essai = (type, forcer) => { const p = CG.S.player, t = type || 'troll'; pluie(p.x + 70, p.y, t, forcer === 'zut' ? {} : forcer === 'oui' ? { scroll: G.newScroll() || 'feu' } : forcer === 'recette' ? { recette: (CG.Potions && CG.Potions.nouvelle()) || 'vitesse' } : tirage(t)); };
})(window.CG);
