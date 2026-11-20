// Clan Gobelin — constructions : catalogue, effets (tours, pièges, production), siège des clôtures, démolition.
'use strict';
(function (CG) {
  // deux étangs qui se touchent par un côté sont voisins : ils se rejoignent à l'écran, et chacun produit un peu plus vite
  CG.ETANG_BONUS = 0.15;
  CG.etangColle = (a, b) => { const dx = Math.abs(a.tx - b.tx), dy = Math.abs(a.ty - b.ty); return (dx === 2 && dy < 2) || (dy === 2 && dx < 2); };

  const G = CG.G, W = CG.W, T = CG.TILE;
  G.etangsVoisins = b => CG.S.buildings.filter(o => o !== b && o.type === 'etang' && !o.site && CG.etangColle(b, o));
  // cat : rubrique du menu · tile : comment la case se comporte · hp : peut être détruit par les ennemis · repeat : on en pose plusieurs d'affilée
  Object.assign(CG.BUILDS.hut, { cat: 'clan' }); Object.assign(CG.BUILDS.totem, { cat: 'defense' }); Object.assign(CG.BUILDS.marmite, { cat: 'vivres' });
  Object.assign(CG.BUILDS.tower, { cat: 'defense', shoot: { range: 300, cd: 1.5, dmg: [5, 0.4], kind: 'arrow', top: 120 } });
  Object.assign(CG.BUILDS, {
    cloture: { nom: 'Clôture', icon: '🚧', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 3 }, hp: 45, barrier: true, low: true, repeat: true, desc: 'Basse : tes gardes à l\'arc tirent par-dessus, et on peut y fixer un mécanisme. Elle barre le passage à tout le monde : prévois un Portail.' },
    palissade: { nom: 'Palissade', icon: '🪵', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 7 }, hp: 110, barrier: true, tall: true, repeat: true, desc: 'Un mur de rondins, bien plus solide qu\'une clôture. Mais elle est haute : personne ne tire par-dessus, ni toi ni l\'ennemi.' },
    muret: { nom: 'Muret de pierre', icon: '🪨', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 3, minerai: 3 }, hp: 100, barrier: true, low: true, repeat: true, desc: 'Un muret bas en pierre : on tire par-dessus comme une clôture, et il tient deux fois mieux.' },
    portail: { nom: 'Portail', icon: '🚪', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 8 }, hp: 70, barrier: true, tile: 'gate', repeat: true, desc: 'Toi et tes gobelins passez librement, pas les ennemis.' },
    clotureFer: { nom: 'Clôture en métal', icon: '⛓️', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 3, minerai: 8 }, hp: 190, barrier: true, low: true, repeat: true, desc: 'Des barreaux de métal : basse comme une clôture, on tire par-dessus, et presque incassable.' },
    portailFer: { nom: 'Portail ferré', icon: '🚪', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 10, minerai: 2 }, hp: 140, barrier: true, tile: 'gate', repeat: true, desc: 'Un portail renforcé de fer, deux fois plus solide. Toi et tes gobelins passez librement, pas les ennemis.' },
    mur: { nom: 'Mur de pierre', icon: '🧱', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 7, minerai: 6 }, hp: 240, barrier: true, tall: true, repeat: true, desc: 'Une palissade rebâtie en pierre : très solide, et trop haute pour tirer par-dessus.' },
    murMetal: { nom: 'Mur de métal', icon: '🛡️', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 7, minerai: 16 }, hp: 420, barrier: true, tall: true, repeat: true, desc: 'Un mur plaqué de métal : le plus solide de tous.' },
    douve: { nom: 'Douve', icon: '💧', w: 1, h: 1, cat: 'terrain', on: 'road', cout: { bois: 1 }, tile: 'moat', flat: true, repeat: true, desc: 'Un fossé plein d\'eau : les ennemis y pataugent très lentement. Il te faut un pont pour traverser.' },
    pont: { nom: 'Pont', icon: '🌉', w: 1, h: 1, cat: 'terrain', cout: { bois: 6 }, tile: 'bridge', on: 'water', flat: true, repeat: true, desc: 'Se pose sur l\'eau (douve ou étang) pour traverser à pied sec. Appuie sur R pour le mettre à l\'horizontale ou à la verticale.' },
    piege: { nom: 'Piège à pointes', icon: '📌', w: 1, h: 1, cat: 'defense', on: 'road', cout: { bois: 4, minerai: 2 }, tile: 'flat', flat: true, repeat: true, desc: 'Caché dans le sol : les pointes jaillissent sous l\'ennemi qui marche dessus, rentrent, et ressortent tant qu\'il reste là. Sans danger pour les gobelins.' },
    baliste: { nom: 'Baliste', icon: '🏹', w: 2, h: 2, cat: 'defense', cout: { bois: 45, minerai: 20 }, shoot: { range: 430, cd: 3.2, dmg: [18, 1.4], kind: 'carreau', top: 52 }, desc: 'Tire de très loin d\'énormes carreaux. Lente mais dévastatrice.' },
    tourMagie: { nom: 'Tour de magie', icon: '🔮', w: 2, h: 2, cat: 'magie', cout: { bois: 30, minerai: 25, or: 60 }, shoot: { range: 290, cd: 2.3, dmg: [9, 0.7], kind: 'feu', aoe: 58, top: 124 }, desc: 'Lance des boules de feu qui explosent sur les groupes d\'ennemis.' },
    cristal: { nom: 'Cristal de mana', icon: '💎', w: 1, h: 1, cat: 'magie', cout: { minerai: 15, or: 50 }, desc: '+0,4 mana par seconde par cristal (jusqu\'à 3). S\'ajoute au 0,5 par seconde de départ.' },
    torche: { nom: 'Torche', icon: '🔥', w: 1, h: 1, cat: 'terrain', on: 'road', cout: { bois: 2 }, tile: 'flat', repeat: true, desc: 'Éclaire le village la nuit.' },
    puits: { nom: 'Puits', icon: '🪣', w: 1, h: 1, cat: 'clan', cout: { bois: 15, minerai: 10 }, desc: 'De l\'eau fraîche : +3 de moral chaque matin (un seul compte).' },
    potager: { nom: 'Potager à champignons', icon: '🍄', w: 2, h: 2, cat: 'vivres', cout: { bois: 20 }, tile: 'flat', flat: true, prod: { every: 22, gain: { food: 1 } }, desc: 'Pousse tout seul : de la nourriture toute la journée. À bâtir à l\'ombre, loin du feu, des torches et des cristaux.' },
    etang: { nom: 'Étang à poissons', icon: '🐟', w: 2, h: 2, cat: 'vivres', cout: { bois: 15, or: 10 }, flat: true, prod: { every: 40, gain: { food: 2 } }, desc: 'Un bassin poissonneux : de la nourriture sans cueilleur. Collés l\'un à l\'autre, les étangs se rejoignent en un seul grand bassin, et chacun pêche 15 % plus vite par étang voisin.' },
    enclos: { nom: 'Enclos à sangliers', icon: '🐗', w: 2, h: 2, cat: 'vivres', cout: { bois: 30, food: 10 }, prod: { every: 48, gain: { food: 1, cuir: 1 } }, desc: 'Donne régulièrement de la viande et du cuir.' },
    depot: { nom: 'Dépôt', icon: '📦', w: 2, h: 1, cat: 'vivres', cout: { bois: 15 }, desc: 'Un second endroit où déposer bois, nourriture et minerai. Place-le près du lieu de travail : les trajets raccourcissent.' },
    grenier: { nom: 'Grenier', icon: '🏚️', w: 2, h: 2, cat: 'vivres', cout: { bois: 40 }, desc: 'Réserves à l\'abri : les pillards volent deux fois moins.' },
    scierie: { nom: 'Scierie', icon: '🪚', w: 2, h: 2, cat: 'vivres', cout: { bois: 35, minerai: 10 }, desc: 'Chaque arbre abattu donne +1 bois.' },
    caserne: { nom: 'Caserne', icon: '⚔️', w: 2, h: 2, cat: 'clan', cout: { bois: 50, minerai: 20 }, desc: 'Gardes : +12 vie, et ils s\'entraînent chaque matin (expérience).' },
    chaman: { nom: 'Hutte du chaman', icon: '💀', w: 2, h: 2, cat: 'clan', cout: { bois: 35, or: 40 }, desc: 'Soigne les gobelins hors combat. Un gobelin tombé a une chance sur deux de survivre.' },
    taverne: { nom: 'Taverne', icon: '🍺', w: 2, h: 2, cat: 'clan', cout: { bois: 45, or: 30 }, desc: 'La fête du soir donne plus de moral et le double d\'expérience.' },
    marche: { nom: 'Marché', icon: '⚖️', w: 2, h: 2, cat: 'clan', cout: { bois: 40, or: 40 }, desc: 'Les objets des artisans se vendent 50 % plus cher, et les marchands passent plus souvent.' }
  });
  // terrain : pas un bâtiment, la case change tout de suite
  Object.assign(CG.BUILDS, {
    chemin: { nom: 'Chemin', icon: '🟫', w: 1, h: 1, cat: 'terrain', cout: { bois: 1 }, terrain: 'path', repeat: true, desc: 'Trace un sentier de terre sur l\'herbe. On y marche 20 % plus vite, et la forêt n\'y repousse pas.' },
    gazon: { nom: 'Gazon', icon: '🟩', w: 1, h: 1, cat: 'terrain', cout: { food: 1 }, terrain: 'grass', repeat: true, desc: 'Sème de l\'herbe sur un sentier ou une clairière. On peut ensuite y bâtir, et la forêt n\'y repousse pas.' }
  });
  /* le piège à pointes : SORT = temps pour jaillir (les dégâts tombent à cet instant), puis il reste sorti, rentre, et se repose jusqu'à CYCLE */
  CG.PIEGE = { SORT: 0.1, TENU: 0.4, RENTRE: 0.6, CYCLE: 0.9, etat: new WeakMap() };
  CG.PIEGE.sorti = b => { const P = CG.PIEGE, q = P.etat.get(b); if (!q) return 0; const t = q.t; return t < P.SORT ? t / P.SORT : t < P.TENU ? 1 : t < P.RENTRE ? 1 - (t - P.TENU) / (P.RENTRE - P.TENU) : 0; };
  CG.BUILD_CATS = [['terrain', '🌱 Terrain'], ['defense', '🛡️ Défense'], ['vivres', '🍖 Vivres et ressources'], ['clan', '🏘️ Vie du clan'], ['magie', '✨ Magie'], ['lumiere', '💡 Lumière']];
  const FIXED = ['fire', 'chief', 'stock', 'hut'];

  G.buildingAt = function (tx, ty) {
    const B = CG.S.buildings;
    for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; if (tx >= b.tx && tx < b.tx + b.w && ty >= b.ty && ty < b.ty + b.h) return b; }
    return null;
  };
  G.canDemolish = b => !!b && !FIXED.includes(b.type);
  G.removeBuilding = function (b, refund) {
    const S = CG.S, i = S.buildings.indexOf(b); if (i < 0) return;
    W.unblock(b); S.buildings.splice(i, 1); b.gone = true;
    S.goblins.forEach(g => { if (g.home > i) g.home--; });
    const c = { x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T }; G.puff(c.x, c.y, '#c9a56b', 16, 110, 4);
    if (refund) { let k = 0; const cout = CG.BUILDS[b.type].cout; for (const r in cout) { const n = Math.floor(cout[r] / 2); if (n) G.gain(r, n, c.x, c.y - 20 - (k++) * 16); } }
  };

  // Un ennemi dont le chemin est barré s'en prend à la clôture la plus proche qu'il peut atteindre.
  G.siege = function (e, dt, spd) {
    const S = CG.S;
    if (e.sb && e.sb.gone) { e.sb = null; e.siege = 0; e.path = null; return; }
    if (!e.sb) {
      const list = S.buildings.filter(b => CG.BUILDS[b.type] && CG.BUILDS[b.type].barrier).map(b => ({ b, d: Math.hypot((b.tx + 0.5) * T - e.x, (b.ty + 0.5) * T - e.y) })).sort((a, b) => a.d - b.d);
      for (let i = 0; i < Math.min(5, list.length) && !e.sb; i++) { const b = list[i].b; if (G.goTo(e, (b.tx + 0.5) * T, (b.ty + 0.5) * T)) e.sb = b; }
      if (!e.sb) { e.siege = 0; e.repath = 2; return; }
    }
    const b = e.sb, bx = (b.tx + 0.5) * T, by = (b.ty + 0.5) * T, d = Math.hypot(bx - e.x, by - e.y);
    if (d > 52 && e.path && e.path.length) { if (spd) G.follow(e, spd, dt); return; }
    e.face = bx > e.x ? 1 : -1;
    if (e.atkCd <= 0) {
      e.atkCd = 1.1; e.atkAnim = 1; b.hp -= e.dmg; G.puff(bx, by - 14, '#c9a56b', 4, 60, 3); if (CG.onScreen(bx, by)) CG.sfx(b.hp <= 0 ? 'fire' : 'chop');
      if (b.hp <= 0) { G.text(bx, by - 40, CG.BUILDS[b.type].nom + ' détruit !', '#ff9a8a'); G.removeBuilding(b); }
    }
  };

  G.updateBuildings = function (dt) {
    const S = CG.S, R = CG.R, work = S.hour >= 6 && S.hour < 19 && !R.alarm;
    for (const b of S.buildings) {
      const d = CG.BUILDS[b.type]; if (!d || b.site) continue;
      const cx = (b.tx + b.w / 2) * T, base = (b.ty + b.h) * T;
      const gd = b.type === 'tower' ? G.towerGuard(b) : null; if (b.type === 'tower') b.manned = !!gd; // une tour de guet vide ne tire pas
      if (d.shoot && (b.type !== 'tower' || gd)) {
        b.cd = (b.cd || 0) - dt;
        if (b.cd <= 0) {
          const s = d.shoot, lv = b.type === 'tower' ? Math.min(2, b.up || 0) : b.type === 'tourMagie' && b.up ? 1 : 0;
          const mul = b.type === 'tower' ? [1, 1.5, 2][lv] * (1 + 0.07 * (gd.lvl - 1)) * G.apt(gd, 'garde') : lv ? 1.4 : 1, e = G.nearestEnemy(cx, base - 20, s.range + lv * 45);
          if (e && gd) { gd.atkAnim = 1; gd.face = e.x > cx ? 1 : -1; }
          if (e) { b.cd = s.cd * (b.type === 'tower' ? [1, 1, 0.6][lv] : lv ? 0.7 : 1); G.shoot({ x: cx, y: base - s.top + 18 }, e, s.kind, (s.dmg[0] + S.day * s.dmg[1]) * mul, 'g', gd, s.aoe ? s.aoe * (lv ? 1.4 : 1) : 0); } else b.cd = 0.3;
        }
      }
      if (d.prod && work) {
        b.pt = (b.pt || 0) + dt;
        if (b.pt >= d.prod.every / (b.type === 'etang' ? 1 + CG.ETANG_BONUS * Math.min(4, G.etangsVoisins(b).length) : 1)) { b.pt = 0; let k = 0; for (const r in d.prod.gain) G.gain(r, d.prod.gain[r], cx, base - 40 - (k++) * 16); }
      }
      if (b.type === 'piege') { /* caché dans le sol : les pointes jaillissent sous l'ennemi, piquent au moment où elles sont sorties, rentrent, et recommencent tant qu'il reste dessus */
        const P = CG.PIEGE, dessus = e => !e.dead && Math.floor(e.x / T) === b.tx && Math.floor(e.y / T) === b.ty; let q = P.etat.get(b);
        if (!q && R.enemies.some(dessus)) { q = { t: 0, fait: false }; P.etat.set(b, q); if (CG.onScreen(cx, base)) CG.sfx('swing'); }
        if (q) { q.t += dt;
          if (!q.fait && q.t >= P.SORT) { q.fait = true; const poison = G.tech('d10'); let touche = false; for (const e of R.enemies) { if (!dessus(e)) continue; touche = true; if (poison) e.slow = Math.max(e.slow, 1.6); G.hurtEnemy(e, (5 + S.day * 0.8) * (poison ? 2 : 1), null); } if (touche && CG.onScreen(cx, base)) CG.sfx('hit'); }
          if (q.t >= P.CYCLE) P.etat.delete(b); }
      }
    }
    if (!R.alarm && G.count('chaman')) for (const g of S.goblins) { const m = G.gobMaxHp(g); if (g.hp < m) g.hp = Math.min(m, g.hp + dt); }
  };
})(window.CG);
