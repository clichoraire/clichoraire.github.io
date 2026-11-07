// Paper Run — données du jeu : personnages, pouvoirs, mondes, coupes, difficultés, objets, économie.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  PR.VERSION = '0.3.0';
  PR.SAVE_KEY = 'paperrun.save';

  // Personnages : la famille au complet. outfit = chandail, pants = pantalon, size : 1 = adulte.
  // Les têtes viennent des portraits de famille partagés (js/family-heads.js).
  // perk : petit avantage propre à chacun (les mêmes noms que dans Canon Big Boom).
  PR.CHARACTERS = [
    { id: 'zachary',  name: 'Zachary',  family: 'jo',   size: 1.0,  outfit: '#d9342b', pants: '#243b6b', perk: { name: 'Fusée',            icon: '🚀', desc: 'Saute 8 % plus haut.',                   mods: { jump: .08 } } },
    { id: 'alexie',   name: 'Alexie',   family: 'jo',   size: 0.86, outfit: '#9b3fd4', pants: '#ff5fc8', perk: { name: 'Licorne',          icon: '🦄', desc: '+6 % d’or et un bouclier au départ.',    mods: { gold: .06, shield: 1 } } },
    { id: 'eliott',   name: 'Eliott',   family: 'jo',   size: 0.84, outfit: '#2f9d3a', pants: '#1b1b1b', perk: { name: 'Soccer étoile',    icon: '⚽', desc: 'Saute 5 % plus haut et court 3 % plus vite.', mods: { jump: .05, speed: .03 } } },
    { id: 'adam',     name: 'Adam',     family: 'bibi', size: 0.74, outfit: '#ff8a1f', pants: '#b5541a', perk: { name: 'Pika-choc',        icon: '⚡', desc: 'Court 6 % plus vite.',                   mods: { speed: .06 } } },
    { id: 'milo',     name: 'Milo',     family: 'bibi', size: 0.62, outfit: '#3f9cff', pants: '#8d6e63', perk: { name: 'Zoom-zoom',        icon: '🏎️', desc: '+12 % d’or.',                            mods: { gold: .12 } } },
    { id: 'edison',   name: 'Edison',   family: 'jay',  size: 0.66, outfit: '#f4c430', pants: '#8d6e63', perk: { name: 'Tornade',          icon: '🌪️', desc: 'Court 4 % plus vite, saute 3 % plus haut.', mods: { speed: .04, jump: .03 } } },
    { id: 'matthieu', name: 'Matthieu', family: 'matt', size: 1.0,  outfit: '#1e5bd8', pants: '#2b2b2b', perk: { name: 'Code de triche',   icon: '🕹️', desc: 'Accès aux outils de test.',              mods: { cheats: 1 } } },
    { id: 'josee',    name: 'Josée',    family: 'matt', size: 0.94, outfit: '#b48cf0', pants: '#4a4a4a', perk: { name: 'Prière',           icon: '🙏', desc: 'Un bouclier au départ de chaque course.', mods: { shield: 1 } } },
    { id: 'richard',  name: 'Richard',  family: 'matt', size: 0.96, outfit: '#8d6e63', pants: '#3e2723', perk: { name: 'Boulet du vétéran', icon: '💥', desc: '+10 % d’or.',                           mods: { gold: .10 } } },
    { id: 'mickael',  name: 'Mickael',  family: 'bibi', size: 0.98, outfit: '#00897b', pants: '#1b1b1b', perk: { name: 'Lunettes laser',   icon: '👓', desc: 'Les pièces viennent à toi de plus loin.', mods: { magnet: 1 } } },
    { id: 'marie',    name: 'Marie',    family: 'bibi', size: 0.94, outfit: '#e91e63', pants: '#3a3a3a', perk: { name: 'Mère protectrice', icon: '🛡️', desc: 'Un bouclier au départ de chaque course.', mods: { shield: 1 } } },
    { id: 'jeremie',  name: 'Jérémie',  family: 'jay',  size: 1.0,  outfit: '#b71c1c', pants: '#1b1b1b', perk: { name: 'Téléportation',    icon: '✨', desc: 'L’élan va 20 % plus loin.',               mods: { dash: .2 } } },
    { id: 'jessica',  name: 'Jessica',  family: 'jay',  size: 0.94, outfit: '#f9a825', pants: '#4a4a4a', perk: { name: 'Aimant à or',      icon: '🧲', desc: '+8 % d’or et les pièces viennent à toi.', mods: { gold: .08, magnet: 1 } } },
    { id: 'josue',    name: 'Josué',    family: 'jo',   size: 0.98, outfit: '#0f5a2a', pants: '#1b1b1b', perk: { name: 'Cri du capitaine', icon: '📣', desc: '+10 % d’or.',                            mods: { gold: .10 } } },
    { id: 'emily',    name: 'Émily',    family: 'jo',   size: 0.94, outfit: '#26c6da', pants: '#3a3a3a', perk: { name: 'Blizzard',         icon: '❄️', desc: 'Les ennemis sont 15 % plus lents.',       mods: { slow: .15 } } },
  ];
  PR.FAMILIES = { jo: 'Josué & Émily', bibi: 'Mickael & Marie', jay: 'Jérémie & Jessica', matt: 'Matthieu, Josée & Richard' };
  PR.charById = id => PR.CHARACTERS.find(c => c.id === id) || PR.CHARACTERS[0];

  // Pouvoirs de la Papeterie. Chaque niveau coûte cost[i]. Les effets sont traduits par PR.buildCfg (physics.js).
  PR.POWERS = [
    { id: 'ressort',  name: 'Bottes à ressort',  icon: '🥾', desc: 'Saute plus haut.',                                    levels: ['+8 % de hauteur', '+16 % de hauteur', '+24 % de hauteur'], cost: [80, 180, 360] },
    { id: 'course',   name: 'Souliers de course', icon: '👟', desc: 'Cours plus vite.',                                   levels: ['+8 % de vitesse', '+16 % de vitesse', '+24 % de vitesse'], cost: [80, 180, 360] },
    { id: 'double',   name: 'Double saut',        icon: '🪶', desc: 'Un deuxième saut dans les airs : passe par-dessus les falaises.', levels: ['Un saut de plus en l’air'], cost: [250] },
    { id: 'elan',     name: 'Élan de papier',     icon: '💨', desc: 'Maj ou X pour foncer vers l’avant, même en l’air : saute les grandes fosses.', levels: ['Un élan, puis 0,7 s de repos', 'Repos de 0,45 s', 'Repos de 0,25 s'], cost: [220, 300, 420] },
    { id: 'ruban',    name: 'Ruban collant',      icon: '🩹', desc: 'Glisse le long des murs et saute d’un mur à l’autre : grimpe les puits.', levels: ['Saut mural'], cost: [300] },
    { id: 'ciseaux',  name: 'Ciseaux',            icon: '✂️', desc: 'Déchire les murs de papier (les blocs rayés) : plus de détour !', levels: ['Coupe les murs de papier'], cost: [200] },
    { id: 'parachute', name: 'Avion de papier',   icon: '🛩️', desc: 'Tiens le saut en tombant pour planer loin.',        levels: ['Planer'], cost: [180] },
    { id: 'aimant',   name: 'Aimant à pièces',    icon: '🧲', desc: 'Les pièces proches viennent à toi.',                levels: ['Petit aimant', 'Grand aimant'], cost: [120, 240] },
    { id: 'bouclier', name: 'Bouclier de papier', icon: '🛡️', desc: 'Commence chaque course avec un bouclier contre les objets et les pièges.', levels: ['Un coup gratuit'], cost: [260] },
    { id: 'tirelire', name: 'Tirelire',           icon: '🐷', desc: 'Gagne plus d’or dans les courses.',                levels: ['+15 % d’or', '+30 % d’or'], cost: [150, 350] },
  ];
  PR.powerById = id => PR.POWERS.find(p => p.id === id);

  // Mondes (biomes) : couleurs du décor.
  PR.WORLDS = [
    { id: 'prairie',  name: 'La Prairie de papier',   sky: ['#9fd8ff', '#e8f6ff'], ground: '#d9a066', grass: '#7fd45a', hill: ['#b9e58a', '#8fcf6c', '#67b64f'], accent: '#ffcc4d' },
    { id: 'foret',    name: 'La Forêt de carton',     sky: ['#78b8a0', '#dff3e6'], ground: '#a87448', grass: '#4f9d4a', hill: ['#6fae7d', '#4d8a62', '#356a4b'], accent: '#ff8f5e' },
    { id: 'ciseaux',  name: 'Les Montagnes de ciseaux', sky: ['#b8c6e8', '#f1f3fb'], ground: '#8f8f9c', grass: '#dfe6f2', hill: ['#c9d2e8', '#a3afd0', '#7d8bb5'], accent: '#ff5f7a' },
    { id: 'chateau',  name: 'Le Château d’origami',   sky: ['#5f4a8c', '#c7b5ee'], ground: '#6b5479', grass: '#f0c86c', hill: ['#8e78b5', '#6c5898', '#4e3f73'], accent: '#ffd54a' },
    { id: 'ciel',     name: 'Le Ciel de papier',      sky: ['#ffb87a', '#ffe9c7'], ground: '#eef1f8', grass: '#ffd36b', hill: ['#f6c3d6', '#e49bbd', '#c27aa5'], accent: '#8ad7ff' },
  ];
  PR.worldById = id => PR.WORLDS.find(w => w.id === id) || PR.WORLDS[0];

  // Coupes : 4 courses chacune, façon Mario Kart 64.
  PR.CUPS = [
    { id: 'prairie',  name: 'Coupe Prairie',   icon: '🌼', world: 'prairie', races: ['1-1', '1-2', '1-3', '1-4'], desc: 'Collines douces, premiers sauts, premiers objets.' },
    { id: 'foret',    name: 'Coupe Forêt',     icon: '🌲', world: 'foret',   races: ['2-1', '2-2', '2-3', '2-4'], desc: 'Avions de papier, plateformes qui bougent, grands trous.' },
    { id: 'montagne', name: 'Coupe Montagne',  icon: '⛰️', world: 'ciseaux', races: ['3-1', '3-2', '3-3', '3-4'], desc: 'Punaises, encre et ressorts en série.' },
    { id: 'chateau',  name: 'Coupe Château',   icon: '🏰', world: 'chateau', races: ['4-1', '4-2', '4-3', '4-4'], desc: 'Ponts-levis, tours et oubliettes : tout y passe.' },
    { id: 'speciale', name: 'Coupe Spéciale',  icon: '⭐', world: 'ciel',    races: ['1-5', '2-5', '3-5', '5-1'], desc: 'Les grands tableaux de chaque monde, puis le Ciel de papier.', needs: 4 },
  ];
  PR.cupById = id => PR.CUPS.find(c => c.id === id);

  // Difficultés : les adversaires rejouent le meilleur chemin trouvé avec ces pouvoirs, à cette vitesse (rate).
  PR.DIFFICULTIES = [
    { id: 'feuille', name: 'Feuille', sub: 'Facile',    cc: '50 cc',  powers: {}, rate: 0.78, gold: 1, color: '#7fd45a', desc: 'Les adversaires n’ont aucun pouvoir et courent tranquillement.' },
    { id: 'carton',  name: 'Carton',  sub: 'Moyen',     cc: '100 cc', powers: { double: 1, ciseaux: 1, course: 1 }, rate: 0.88, gold: 1.5, color: '#ffcc4d', desc: 'Les adversaires ont le Double saut et les Ciseaux : ils prennent les raccourcis.' },
    { id: 'origami', name: 'Origami', sub: 'Difficile', cc: '150 cc', powers: { double: 1, ciseaux: 1, course: 2, ressort: 2, elan: 2, ruban: 1, parachute: 1 }, rate: 0.95, gold: 2, color: '#ff5f7a', desc: 'Les adversaires ont presque tous les pouvoirs et courent vite. Il te faudra la Papeterie au complet.' },
  ];
  PR.diffById = id => PR.DIFFICULTIES.find(d => d.id === id) || PR.DIFFICULTIES[0];

  // Objets des cubes « ? ».  weights : chances selon la position (1er → 4e).
  PR.ITEMS = [
    { id: 'boule',    name: 'Boule de papier', icon: '🧻', desc: 'Lancée vers l’avant : étourdit celui qu’elle touche.',   weights: [40, 30, 15, 5] },
    { id: 'avion',    name: 'Avion chercheur', icon: '✈️', desc: 'Vole vers le coureur juste devant et l’étourdit.',       weights: [0, 25, 30, 25] },
    { id: 'colle',    name: 'Flaque de colle', icon: '🫧', desc: 'Laissée derrière toi : ralentit celui qui marche dedans.', weights: [40, 20, 10, 0] },
    { id: 'fusee',    name: 'Fusée',           icon: '🚀', desc: 'Vitesse ×1,5 pendant 4 secondes.',                       weights: [0, 15, 30, 40] },
    { id: 'orage',    name: 'Orage de papier', icon: '⚡', desc: 'Étourdit tous les autres coureurs.',                     weights: [0, 0, 5, 25] },
    { id: 'bouclier', name: 'Bouclier',        icon: '🛡️', desc: 'Bloque le prochain objet ou piège.',                      weights: [20, 10, 10, 5] },
  ];
  PR.itemById = id => PR.ITEMS.find(i => i.id === id);
  PR.rollItem = (pos, rnd = Math.random) => {
    const k = Math.max(0, Math.min(3, pos - 1)); const total = PR.ITEMS.reduce((a, i) => a + i.weights[k], 0);
    let r = rnd() * total; for (const i of PR.ITEMS) { r -= i.weights[k]; if (r <= 0) return i.id; } return 'boule';
  };
  PR.ITEM_T = { stun: 1.3, glue: 2.2, boost: 4, orage: 1.6 };

  // Points par course (4 coureurs), trophée selon le classement final de la coupe.
  PR.POINTS = [9, 6, 3, 1];
  PR.TROPHY = ['gold', 'silver', 'bronze', null];
  PR.TROPHY_NAMES = { gold: 'Trophée d’or', silver: 'Trophée d’argent', bronze: 'Trophée de bronze' };
  PR.POS_NAMES = ['1er', '2e', '3e', '4e'];

  // Économie.
  PR.ECON = {
    race: [30, 20, 12, 6],      // or par position, × multiplicateur de la difficulté
    coin: 1, bigCoin: 5, enemy: 2,
    trophy: { gold: 100, silver: 50, bronze: 25 },   // × multiplicateur de la difficulté
    first: 20,                  // première fois qu'on finit une course
  };
  PR.fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return (m ? m + ':' : '') + (m ? String(Math.floor(r)).padStart(2, '0') : Math.floor(r)) + '.' + String(Math.floor((r % 1) * 100)).padStart(2, '0'); };
  if (typeof module !== 'undefined') module.exports = PR;
})(typeof window !== 'undefined' ? window : globalThis);
