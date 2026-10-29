// Progression des héros : expérience, niveaux et caractéristiques.
(function (ZC) {
  'use strict';

  // ------------------------------------------------------------ Progression du héros
  // Points de kills nécessaires pour passer du niveau L au niveau L+1 (×10 XP : un soldat de base vaut 10 XP).
  // 5 kills au départ, puis 6, 7, 9, 11, 13, 15, 18, 21, 24, 28 (niveau 10)... 50 (niveau 15), 81 (20), 164 (30).
  ZC.heroXpNeed = (lvl) => Math.round((5 + 0.8 * lvl + 0.15 * lvl * lvl) * 10);
  const CUM = [0];
  ZC.heroXpFor = (lvl) => { while (CUM.length <= lvl) CUM.push(CUM[CUM.length - 1] + ZC.heroXpNeed(CUM.length - 1)); return CUM[lvl]; }; // XP cumulée pour atteindre le niveau lvl
  ZC.heroLevel = (xp) => { let l = 0; while (xp >= ZC.heroXpFor(l + 1)) l++; return l; };
  ZC.HERO_MAX_LEVEL = Infinity;
  ZC.HERO_POINTS_PER_LEVEL = 2;                  // points de caractéristiques gagnés par niveau
  ZC.heroScale = (lvl) => ({ hp: 1 + 0.04 * lvl, dmg: 1 + 0.04 * lvl, armor: Math.floor(lvl / 5) }); // bonus bruts par niveau (en plus des points)

  // Les trois caractéristiques. Le Flux est la réserve d'énergie qui alimente les pouvoirs (pas de mana ici).
  ZC.HERO_STATS = {
    atk:  { name: 'Attaque', short: 'ATQ', color: '#ff8a6a', desc: '+3 % de dégâts par point' },
    def:  { name: 'Défense', short: 'DÉF', color: '#7fd0ff', desc: '+2 % de points de vie par point, +1 armure tous les 4 points' },
    flux: { name: 'Flux',    short: 'FLX', color: '#c080ff', desc: '+6 de flux maximum et +0,15 flux/s par point. Le flux alimente les pouvoirs du héros' },
  };
  ZC.FLUX_BASE = 40; ZC.FLUX_REGEN = 1.0;        // flux de base et régénération par seconde


  ZC.heroBuild = (hero) => {
    const lvl = hero ? ZC.heroLevel(hero.xp || 0) : 0;
    const pts = Object.assign({ atk: 0, def: 0, flux: 0 }, hero && hero.points);
    const { atk, def, flux } = pts;
    return {
      level: lvl, xp: hero ? hero.xp || 0 : 0,
      points: pts, totals: { atk, def, flux },
      spent: atk + def + flux,
      unspent: Math.max(0, lvl * ZC.HERO_POINTS_PER_LEVEL - atk - def - flux),
      dmgMult: 1 + 0.03 * atk, hpMult: 1 + 0.02 * def, armor: Math.floor(def / 4),
      fluxMax: ZC.FLUX_BASE + 6 * flux,
      fluxRegen: Math.round((ZC.FLUX_REGEN + 0.15 * flux) * 100) / 100,
    };
  };
  ZC.DEFAULT_BUILD = ZC.heroBuild(null);
})(window.ZC);
