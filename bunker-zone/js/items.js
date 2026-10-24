// ============================================================
//  items.js — Équipement des héros (fiche façon Diablo) : emplacements, raretés, objets
//  procéduraux à niveau d'objet et affixes « magiques », stats (Attaque, Défense, Flux),
//  courbe d'expérience sans niveau maximum, et calcul du « build » appliqué en partie.
// ============================================================
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

  // ------------------------------------------------------------ Objets
  ZC.ITEM_SLOTS = {
    weapon: { name: 'Arme',   icon: '⚔' },
    helmet: { name: 'Casque', icon: '⛑' },
    armor:  { name: 'Armure', icon: '🛡' },
    gloves: { name: 'Gants',  icon: '✋' },
    boots:  { name: 'Bottes', icon: '👢' },
    cape:   { name: 'Cape',   icon: '🧣' },
  };
  ZC.SLOT_ORDER = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'cape'];
  ZC.RARITIES = {
    common:    { name: 'Commun',     color: '#d0d8e4', mult: 1.0, affixes: 0, w: 0.56 },
    rare:      { name: 'Rare',       color: '#4fa8ff', mult: 1.35, affixes: 1, w: 0.30 },
    epic:      { name: 'Épique',     color: '#c060ff', mult: 1.8, affixes: 2, w: 0.11 },
    legendary: { name: 'Légendaire', color: '#ffa030', mult: 2.4, affixes: 3, w: 0.03 },
  };
  // Bases par emplacement : nom, stats principales (par niveau d'objet) et teinte de base pour le dessin
  const BASES = {
    weapon: [
      { name: 'Fusil gauss',          stats: { dmgPct: 0.025, dmg: 0.4 }, hue: 200 },
      { name: 'Carabine à impulsion', stats: { dmgPct: 0.02, cdMult: -0.004 }, hue: 185 },
      { name: 'Canon à rail',         stats: { dmgPct: 0.03, rangeAdd: 0.5 }, hue: 215 },
      { name: 'Fusil à plasma',       stats: { dmgPct: 0.02, dmg: 0.5, splash: 0.25 }, hue: 290 },
    ],
    helmet: [
      { name: 'Casque tactique', stats: { armor: 0.08, fluxMax: 0.5 }, hue: 120 },
      { name: 'Heaume blindé',   stats: { armor: 0.12, hpPct: 0.006 }, hue: 35 },
      { name: 'Visière neurale', stats: { fluxMax: 0.9, fluxRegen: 0.012 }, hue: 265 },
    ],
    armor: [
      { name: 'Plastron composite', stats: { hpPct: 0.012, armor: 0.08 }, hue: 150 },
      { name: 'Exo-cuirasse',       stats: { hpPct: 0.016, armor: 0.1, speedMult: -0.002 }, hue: 25 },
      { name: 'Armure réactive',    stats: { hpPct: 0.01, regen: 0.06 }, hue: 60 },
    ],
    gloves: [
      { name: 'Gantelets de combat', stats: { cdMult: -0.006, dmg: 0.2 }, hue: 20 },
      { name: 'Gants servo',         stats: { cdMult: -0.008 }, hue: 190 },
      { name: 'Griffes de tir',      stats: { dmgPct: 0.015, cdMult: -0.003 }, hue: 340 },
    ],
    boots: [
      { name: 'Bottes de saut',      stats: { speedMult: 0.006, dodge: 0.002 }, hue: 95 },
      { name: 'Bottes magnétiques',  stats: { speedMult: 0.004, armor: 0.05 }, hue: 210 },
      { name: 'Rangers blindées',    stats: { hpPct: 0.006, speedMult: 0.003 }, hue: 40 },
    ],
    cape: [
      { name: 'Cape de campagne',    stats: { dodge: 0.003, hpPct: 0.005 }, hue: 10 },
      { name: 'Manteau thermique',   stats: { regen: 0.05, fluxRegen: 0.01 }, hue: 220 },
      { name: 'Cape du commandant',  stats: { xpMult: 0.004, dodge: 0.002 }, hue: 50 },
    ],
  };
  // Affixes magiques (rares et plus) : nom accolé, effet. Les plus puissants demandent un niveau d'objet minimum.
  const AFFIXES = [
    { id: 'speed',    name: 'de célérité',      min: 1,  stats: { speedMult: 0.12 },    desc: '+12 % de vitesse' },
    { id: 'shadow',   name: 'd\'ombre',          min: 4,  stats: { dodge: 0.08 },        desc: '8 % d\'esquive' },
    { id: 'vampire',  name: 'vampirique',        min: 8,  stats: { lifesteal: 0.06 },    desc: 'soigne 6 % des dégâts infligés' },
    { id: 'regen',    name: 'de régénération',   min: 1,  stats: { regen: 2 },           desc: '+2 PV par seconde' },
    { id: 'reach',    name: 'de portée',         min: 6,  stats: { rangeAdd: 16 },       desc: '+0,5 case de portée' },
    { id: 'haste',    name: 'de cadence',        min: 3,  stats: { cdMult: -0.08 },      desc: '+8 % de cadence de tir' },
    { id: 'flux',     name: 'de flux',           min: 1,  stats: { fluxMax: 15 },        desc: '+15 de flux maximum' },
    { id: 'awaken',   name: 'd\'éveil',          min: 5,  stats: { fluxRegen: 0.5 },     desc: '+0,5 flux par seconde' },
    { id: 'power',    name: 'de puissance',      min: 1,  stats: { atk: 3 },             desc: '+3 Attaque' },
    { id: 'resist',   name: 'de résistance',     min: 1,  stats: { def: 3 },             desc: '+3 Défense' },
    { id: 'insight',  name: 'de clairvoyance',   min: 2,  stats: { xpMult: 0.1 },        desc: '+10 % d\'expérience' },
    { id: 'recharge', name: 'de recharge',       min: 10, stats: { powerCd: -0.15 },     desc: 'pouvoirs rechargés 15 % plus vite' },
    { id: 'fire',     name: 'incendiaire',       min: 12, stats: { splash: 16 },         desc: 'les tirs touchent les ennemis à 0,5 case de la cible' },
    { id: 'storm',    name: 'de foudre',         min: 16, stats: { stunChance: 0.1 },    desc: '10 % de chance d\'étourdir la cible 0,5 s' },
  ];
  ZC.AFFIXES = AFFIXES;
  // Lignes de stats : libellé et format d'affichage
  const STAT_FMT = {
    dmg:        (v) => '+' + Math.round(v) + ' dégâts',
    dmgPct:     (v) => '+' + Math.round(v * 100) + ' % de dégâts',
    hpPct:      (v) => '+' + Math.round(v * 100) + ' % de points de vie',
    armor:      (v) => '+' + Math.round(v) + ' armure',
    speedMult:  (v) => (v >= 0 ? '+' : '') + Math.round(v * 100) + ' % de vitesse',
    cdMult:     (v) => '+' + Math.round(-v * 100) + ' % de cadence',
    dodge:      (v) => Math.round(v * 100) + ' % d\'esquive',
    lifesteal:  (v) => 'soigne ' + Math.round(v * 100) + ' % des dégâts infligés',
    regen:      (v) => '+' + (Math.round(v * 10) / 10) + ' PV/s',
    rangeAdd:   (v) => '+' + (Math.round(v / ZC.TILE * 100) / 100) + ' case de portée',
    fluxMax:    (v) => '+' + Math.round(v) + ' flux max',
    fluxRegen:  (v) => '+' + (Math.round(v * 100) / 100) + ' flux/s',
    atk:        (v) => '+' + Math.round(v) + ' Attaque',
    def:        (v) => '+' + Math.round(v) + ' Défense',
    flux:       (v) => '+' + Math.round(v) + ' Flux',
    xpMult:     (v) => '+' + Math.round(v * 100) + ' % d\'expérience',
    powerCd:    (v) => 'pouvoirs rechargés ' + Math.round(-v * 100) + ' % plus vite',
    splash:     (v) => 'dégâts de zone (' + (Math.round(v / ZC.TILE * 10) / 10) + ' case)',
    stunChance: (v) => Math.round(v * 100) + ' % de chance d\'étourdir',
  };
  ZC.statLine = (k, v) => STAT_FMT[k] ? STAT_FMT[k](v) : k + ' ' + v;

  let seq = 0;
  const pickW = (obj) => { const ks = Object.keys(obj); let r = Math.random() * ks.reduce((a, k) => a + obj[k].w, 0); for (const k of ks) { r -= obj[k].w; if (r <= 0) return k; } return ks[ks.length - 1]; };
  const round2 = (v) => Math.round(v * 100) / 100;

  // Tire un objet de niveau ilvl. opts : slot imposé, rarity imposée, luck (0..1) qui pousse vers les raretés hautes.
  ZC.rollItem = (ilvl, opts) => {
    opts = opts || {};
    ilvl = Math.max(1, Math.round(ilvl));
    const slot = opts.slot || ZC.SLOT_ORDER[Math.floor(Math.random() * ZC.SLOT_ORDER.length)];
    let rarity = opts.rarity;
    if (!rarity) {
      const luck = opts.luck || 0, w = {};
      for (const k in ZC.RARITIES) w[k] = { w: ZC.RARITIES[k].w * (k === 'common' ? Math.max(0.15, 1 - luck) : 1 + luck * (k === 'legendary' ? 3 : k === 'epic' ? 2 : 1)) };
      rarity = pickW(w);
    }
    const R = ZC.RARITIES[rarity];
    const base = BASES[slot][Math.floor(Math.random() * BASES[slot].length)];
    const stats = {};
    for (const k in base.stats) {
      const per = base.stats[k];
      // la stat principale croît avec le niveau d'objet et la rareté ; légère variation aléatoire
      let v = per * (2 + ilvl) * R.mult * (0.85 + Math.random() * 0.3);
      if (k === 'dmg' || k === 'armor' || k === 'fluxMax') v = Math.max(1, Math.round(v));
      else if (k === 'rangeAdd') v = Math.max(8, Math.round(v / 8) * 8); // par quart de case
      else v = round2(v);
      stats[k] = v;
    }
    const affixes = [];
    const pool = AFFIXES.filter(a => a.min <= ilvl);
    for (let i = 0; i < R.affixes && pool.length; i++) {
      const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      affixes.push(a.id);
      for (const k in a.stats) stats[k] = round2((stats[k] || 0) + a.stats[k]);
    }
    const name = base.name + (affixes.length ? ' ' + AFFIXES.find(a => a.id === affixes[0]).name : '') + (affixes.length > 1 ? ' et ' + AFFIXES.find(a => a.id === affixes[1]).name : '');
    const item = { id: 'i' + Date.now().toString(36) + (seq++).toString(36), slot, base: base.name, name, ilvl, rarity, stats, affixes, hue: base.hue };
    item.value = ZC.itemValue(item);
    return item;
  };
  ZC.itemValue = (it) => Math.round((8 + it.ilvl * 3) * ZC.RARITIES[it.rarity].mult * (1 + 0.25 * it.affixes.length)); // prix de vente
  ZC.itemPrice = (it) => Math.round(ZC.itemValue(it) * 3.2);                                                                 // prix d'achat en boutique
  ZC.itemColor = (it) => ZC.RARITIES[it.rarity].color;
  // Lignes descriptives d'un objet (stats puis affixes magiques)
  ZC.itemLines = (it) => {
    const lines = [];
    for (const k in it.stats) lines.push({ text: ZC.statLine(k, it.stats[k]), magic: AFFIXES.some(a => it.affixes.includes(a.id) && a.stats[k] !== undefined) });
    return lines;
  };

  // ------------------------------------------------------------ Build : ce que le héros apporte en partie
  // hero = données sauvegardées { xp, points: {atk, def, flux}, gear: {slot: item} } ; null = héros nu (parties simples, IA)
  ZC.heroBuild = (hero) => {
    const lvl = hero ? ZC.heroLevel(hero.xp || 0) : 0;
    const pts = Object.assign({ atk: 0, def: 0, flux: 0 }, hero && hero.points);
    const g = { dmg: 0, dmgPct: 0, hpPct: 0, armor: 0, speedMult: 0, cdMult: 0, dodge: 0, lifesteal: 0, regen: 0, rangeAdd: 0, fluxMax: 0, fluxRegen: 0, atk: 0, def: 0, flux: 0, xpMult: 0, powerCd: 0, splash: 0, stunChance: 0 };
    const gear = {};
    if (hero && hero.gear) for (const slot in hero.gear) { const it = hero.gear[slot]; if (!it) continue; gear[slot] = it; for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k]; }
    const atk = pts.atk + g.atk, def = pts.def + g.def, flux = pts.flux + g.flux;
    return {
      level: lvl, xp: hero ? hero.xp || 0 : 0,
      points: pts, totals: { atk, def, flux },
      spent: pts.atk + pts.def + pts.flux, unspent: Math.max(0, lvl * ZC.HERO_POINTS_PER_LEVEL - (pts.atk + pts.def + pts.flux)),
      dmgMult: (1 + 0.03 * atk) * (1 + g.dmgPct), dmgFlat: Math.round(g.dmg),
      hpMult: (1 + 0.02 * def) * (1 + g.hpPct), armor: Math.floor(def / 4) + Math.round(g.armor),
      speedMult: Math.max(0.5, 1 + g.speedMult), cdMult: Math.max(0.4, 1 + g.cdMult),
      dodge: Math.min(0.5, g.dodge), lifesteal: g.lifesteal, regen: g.regen, rangeAdd: g.rangeAdd,
      fluxMax: Math.round(ZC.FLUX_BASE + 6 * flux + g.fluxMax), fluxRegen: round2(ZC.FLUX_REGEN + 0.15 * flux + g.fluxRegen),
      xpMult: 1 + g.xpMult, powerCd: Math.max(0.4, 1 + g.powerCd), splash: g.splash, stunChance: Math.min(0.5, g.stunChance),
      gear,
    };
  };
  ZC.DEFAULT_BUILD = ZC.heroBuild(null);
})(window.ZC);
