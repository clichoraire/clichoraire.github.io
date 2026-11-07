// Données du jeu : sorciers, baguettes et sorts. Tout ce qui s'achètera ou s'améliorera plus tard part d'ici.
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};
  DS.VERSION = '1.0'; // à augmenter à chaque mise en ligne (affichée sur la carte du site)

  // Âge d'un sorcier selon son niveau : enfant jusqu'au niveau 7, ado de 8 à 15, vrai magicien (chapeau pointu) à partir de 16.
  // h : taille par rapport à un adulte · head : grosseur de la tête par rapport au corps · eye : grosseur des yeux · hem : hauteur du bas de la robe
  // (un enfant porte une robe courte d'écolier : on voit ses jambes). Avant d'être adulte, personne n'a les cheveux gris ou blancs : young = couleur des cheveux, jeune.
  DS.AGES = { kid: { h: 0.6, head: 1.34, eye: 1.35, hem: 24 }, teen: { h: 0.88, head: 1.14, eye: 1.12, hem: 12 }, adult: { h: 1, head: 1, eye: 1, hem: 4 } };
  DS.ageOf = function (level) { return level <= 7 ? 'kid' : level <= 15 ? 'teen' : 'adult'; };

  // perk : petit avantage propre à chaque sorcier. beard : il porte la barbe une fois adulte. Barbes, moustaches, chapeaux, motifs… : voir drawWizard (js/art.js).
  DS.CHARACTERS = [
    { id: 'elora', f: true, name: 'Élora', title: 'la Vive', robe: '#8a2433', trim: '#e2b44c', hair: '#c9552b', skin: '#f3cba8', hairStyle: 'long', perk: { spellSpeed: 1.12 }, perkText: 'Ses sorts filent 12 % plus vite' },
    { id: 'theo', nice: true, name: 'Théo', title: 'le Sage', robe: '#24418f', trim: '#c3cee0', hair: '#3b2a1d', skin: '#e9bb93', hairStyle: 'short', glasses: true, perk: { mana: 12 }, perkText: '+12 d’énergie magique' },
    { id: 'maelle', f: true, nice: true, name: 'Maëlle', title: 'la Brave', robe: '#1f6a45', trim: '#e6e1d0', hair: '#1c1b26', skin: '#c88f68', hairStyle: 'braids', perk: { hp: 20 }, perkText: '+20 points de vie' },
    { id: 'oscar', name: 'Oscar', title: 'le Rusé', robe: '#9a7414', trim: '#2b2533', hair: '#e0c074', skin: '#f5d6b8', hairStyle: 'curly', perk: { shieldCd: 0.6 }, perkText: 'Son bouclier se recharge plus vite' }
  ];

  // Rivaux : adversaires des duels et des tournois (en plus des sorciers jouables qu'on n'a pas choisis).
  DS.RIVALS = [
    { id: 'barnabe', nice: true, name: 'Barnabé', title: 'le Distrait', robe: '#5b3d7a', trim: '#e2b44c', hair: '#8a8f9c', young: '#7a5230', skin: '#f0c9a4', hairStyle: 'curly', glasses: true, beard: true, hat: 'floppy' },
    { id: 'ysolde', f: true, name: 'Ysolde', title: 'la Sévère', robe: '#2c2f3a', trim: '#c3cee0', hair: '#e8e2d4', young: '#e2b84a', skin: '#f3d3b8', hairStyle: 'long', collar: 'ruff' },
    { id: 'gaspard', name: 'Gaspard', title: 'le Costaud', robe: '#7a3b1c', trim: '#f0d9a0', hair: '#2a1a12', skin: '#b97c56', hairStyle: 'short', beard: true, stache: 'walrus' },
    { id: 'lison', f: true, name: 'Lison', title: 'la Farceuse', robe: '#c2477f', trim: '#ffe9a0', hair: '#f0b73c', skin: '#f5d6b8', hairStyle: 'braids', pattern: 'checks', collar: 'bow', shoes: 'curl', accent: '#3f8fd9' },
    { id: 'anselme', name: 'Anselme', title: 'le Vieux', robe: '#3d5a66', trim: '#d9d2c4', hair: '#d7d7d7', young: '#5a3a22', skin: '#e3b48f', hairStyle: 'long', glasses: true, beard: 'long', brows: 'bushy' },
    { id: 'capucine', f: true, name: 'Capucine', title: 'l’Éclair', robe: '#c9682a', trim: '#2b2533', hair: '#7a2f1a', skin: '#d9a57e', hairStyle: 'curly' },
    { id: 'victor', name: 'Victor', title: 'le Ténébreux', robe: '#1d1b2c', trim: '#9a7bff', hair: '#15131c', skin: '#eac4a6', hairStyle: 'short', collar: 'high' },
    { id: 'ondine', f: true, nice: true, name: 'Ondine', title: 'des Marais', robe: '#1f7a7a', trim: '#bfeee0', hair: '#2d5a4a', skin: '#c88f68', hairStyle: 'long' },
    { id: 'firmin', nice: true, name: 'Firmin', title: 'le Chanceux', robe: '#4a7a22', trim: '#ffd978', hair: '#b5651d', skin: '#f3cba8', hairStyle: 'curly', hat: 'bent', collar: 'bow' },
    { id: 'zelie', f: true, nice: true, name: 'Zélie', title: 'la Rêveuse', robe: '#6a78c9', trim: '#ffffff', hair: '#5a3d7a', skin: '#8d5a3c', hairStyle: 'braids', glasses: true, pattern: 'moons', hat: 'cap' },
    { id: 'hector', name: 'Hector', title: 'le Grognon', robe: '#6b6f2a', trim: '#e6e1d0', hair: '#4a3a2a', skin: '#e9bb93', hairStyle: 'short', glasses: true, beard: true, brows: 'bushy' },
    { id: 'morgane', f: true, name: 'Morgane', title: 'l’Archimage', robe: '#3a1450', trim: '#ffd978', hair: '#c9c9d9', young: '#2a2238', skin: '#f0c9a4', hairStyle: 'long', hat: 'tall', pattern: 'stars', collar: 'high' },
    // les farfelus : barbes interminables, moustaches géantes, favoris, sourcils en broussaille, chapeaux et habits bizarres (voir drawWizard, js/art.js)
    { id: 'archibald', name: 'Archibald', title: 'le Barbu', robe: '#2f5d8a', trim: '#f0e6c8', hair: '#ece7db', young: '#a0522d', skin: '#f0c9a4', hairStyle: 'short', bald: true, hat: 'none', beard: 'huge', pattern: 'stars' },
    { id: 'philemon', name: 'Philémon', title: 'le Moustachu', robe: '#7d2a4a', trim: '#f2c14e', hair: '#2a1a12', skin: '#f3cba8', hairStyle: 'short', stache: 'giant', hat: 'top', collar: 'bow', glasses: 'mono', accent: '#2f9e8f' },
    { id: 'cunegonde', f: true, name: 'Cunégonde', title: 'l’Ébouriffée', robe: '#8a4fc0', trim: '#ffe066', hair: '#1c1b26', skin: '#f5d6b8', hairStyle: 'poof', hat: 'none', collar: 'ruff', pattern: 'dots' },
    { id: 'balthazar', name: 'Balthazar', title: 'le Fortuné', robe: '#0f5a4a', trim: '#d8b45c', hair: '#6a4a32', skin: '#e9bb93', hairStyle: 'short', bald: true, hat: 'none', whiskers: true, glasses: 'mono', pattern: 'stripes' },
    { id: 'zephyrin', name: 'Zéphyrin', title: 'le Farouche', robe: '#8c2f1b', trim: '#f6e27a', hair: '#e0e0e0', young: '#c98a2b', skin: '#d9a57e', hairStyle: 'short', brows: 'bushy', stache: 'curl', hat: 'bent', shoes: 'curl', accent: '#2f6fb0' },
    { id: 'petronille', f: true, name: 'Pétronille', title: 'la Rapiécée', robe: '#6d7f8c', trim: '#f2b84b', hair: '#b5462f', skin: '#f3d3b8', hairStyle: 'curly', tufts: true, nose: true, pattern: 'patches', hat: 'floppy', shoes: 'curl' },
    { id: 'leopold', name: 'Léopold', title: 'le Magnifique', robe: '#22577a', trim: '#ffcf56', hair: '#1c1b26', skin: '#8d5a3c', hairStyle: 'short', beard: 'fork', stache: 'curl', hat: 'turban', hatCol: '#f0e6d2', pattern: 'moons', shoes: 'curl' }
  ];

  // power : dégâts · speed : vitesse des sorts · regen : recharge de l'énergie.
  // price : prix au magasin de baguettes (sans prix : baguette offerte au départ).
  DS.WANDS = [
    { id: 'saule', name: 'Baguette de saule', desc: 'Équilibrée et docile. Parfaite pour débuter.', wood: '#b88d58', handle: '#6c4a2b', glow: '#7fd0ff', power: 1, speed: 1, regen: 1 },
    // swipe : pouvoir unique — un coup de baguette rapide à travers l'anneau doré d'un sort ennemi le dévie, sans clic (js/duel.js, swipeParry)
    { id: 'josue', name: 'Baguette de Josué', desc: 'Docile comme le saule… mais elle sait dévier un sort d’un simple revers.', wood: '#c9a25e', handle: '#2f5d8a', glow: '#ffe9a0', power: 1, speed: 1, regen: 1, price: 300, swipe: true,
      unique: 'Traverse vite l’anneau doré avec ta baguette : le sort est dévié du côté où tu frappes. Sans clic, et sans temps de recharge.' },
    { id: 'chene', name: 'Baguette de chêne', desc: 'Frappe fort, mais ses sorts sont plus lents.', wood: '#6f4826', handle: '#3a2413', glow: '#ffc27a', power: 1.25, speed: 0.85, regen: 0.9 },
    { id: 'houx', name: 'Baguette de houx', desc: 'Vive et légère : sorts rapides, énergie vite revenue.', wood: '#e6d8b6', handle: '#7d2b2b', glow: '#b9ffd9', power: 0.85, speed: 1.25, regen: 1.2 },
    { id: 'sureau', name: 'Baguette de sureau', desc: 'On raconte qu’elle n’a jamais perdu un duel.', wood: '#d9d2c4', handle: '#8f8676', glow: '#ffffff', power: 1.3, speed: 1.15, regen: 1.1, price: 450 },
    { id: 'ebene', name: 'Baguette d’ébène', desc: 'Noire comme la nuit, capricieuse comme un chat.', wood: '#2a2530', handle: '#5b3d7a', glow: '#c58bff', power: 1.45, speed: 0.95, regen: 0.85, price: 600 }
  ];

  // Potions : à acheter au magasin, à mettre à sa ceinture (une case chacune, comme un sort), à boire d'un clic pendant le duel. Une fois bue, plus de potion.
  // save.potions = { id: nombre } · à la ceinture, l'identifiant est 'potion-<id>' (DS.item le retrouve).
  DS.POTIONS = [
    { id: 'vie', name: 'Potion de vie', icon: '❤️', color: '#ff6b6b', label: 'Soin', desc: 'Rend 40 points de vie d’un trait.', heal: 40, price: 60 },
    { id: 'energie', name: 'Potion d’énergie', icon: '🔷', color: '#5fb8ff', label: 'Énergie', desc: 'Rend 30 points d’énergie magique.', mana: 30, price: 50 },
    { id: 'elixir', name: 'Élixir pur', icon: '🌿', color: '#8dffb0', label: 'Guérison', desc: 'Efface tous les maléfices, le poison et les brûlures.', cure: true, price: 70 },
    { id: 'force', name: 'Potion de force', icon: '💪', color: '#ff9a5a', label: 'Force', desc: 'Tes 3 prochaines attaques frappent une fois et demie plus fort.', amp: 3, price: 90 },
    { id: 'bouclier', name: 'Potion de bouclier', icon: '🛡️', color: '#ffd978', label: 'Dôme', desc: 'Un dôme absorbe le prochain sort qui te touche (10 s).', ward: 10, price: 80 }
  ];
  DS.POTIONS.forEach(function (p) { p.pid = 'potion-' + p.id; p.potion = true; p.cat = 'potion'; p.how = 'Un clic sur la fiole, pendant le duel'; });
  DS.item = function (id) { return DS.byId(DS.SPELLS, id) || DS.POTIONS.filter(function (p) { return p.pid === id; })[0] || null; }; // un sort ou une potion de la ceinture

  // Catégories de sorts (cat) : pages du grimoire, rayons du magasin de magie. course : le cours de l'école où ils s'enseignent.
  DS.CATS = [
    { id: 'attaque', name: 'Attaque', icon: '⚔️', of: 'd’attaque', course: 'attaque' },
    { id: 'protection', name: 'Protection', icon: '🛡️', of: 'de protection', course: 'protection' },
    { id: 'renfort', name: 'Renfort', icon: '💪', of: 'de renfort', course: 'protection' },
    { id: 'effet', name: 'Effet', icon: '✨', of: 'd’effet', course: 'effet' }
  ];

  // glyph : forme à tracer (voir gestures.js) · icon : petite image du sort (ceinture, tiroir) · flight : durée du vol en secondes (avant bonus de baguette)
  // price : prix au magasin de magie, en or (sans prix : sort connu dès le départ).
  // Ce que fait le sort quand il touche —
  //   burn, poison : { dps, dur } dégâts par seconde · quake : { delay, ticks, dmg } secousses à retardement · beam : { dur, tick, dmg } rayon qu'on dirige
  //   chain : saute sur les copies · pierce : part des dégâts qui traverse une parade · wind : chasse la brume et interrompt à coup sûr · wallDmg : coups portés à un mur
  //   drain : énergie volée · echo : pendant ce temps, tous les dégâts reçus sont notés, puis reçus une seconde fois
  //   maléfices, en secondes (un seul à la fois) — freeze : glaçon · disarm : baguette envolée · slow : ralenti · soak : trempé · blind : noir complet · sleep : endormi
  //     dazzle : ébloui (tout blanc) · fast : baguette emballée · heavy : baguette qui tombe · invert : commandes inversées · silence : plus d'attaques · noShield : plus de boucliers
  // self : sort lancé sur soi, durées en secondes —
  //   ward : avale le prochain sort · antiIce, grip, antiPoison : insensible à la glace, à Désarmo, au poison · absorb : la prochaine attaque devient de l'énergie
  //   mirror : renvoie le prochain sort · mist : un sort sur deux passe à côté · bastion : dégâts reçus ÷ 2 · fortis : dégâts infligés × 2 · bigR : bouclier plus grand
  //   amp : nombre d'attaques renforcées · heal : vie rendue · regen : { hps, dur } · purge : efface les maléfices · copies : deux doubles · wall : mur (coups pour l'abattre)
  // On emporte au duel une ceinture de quelques sorts (BELT_BASE cases, plus le talent Ceinture) ; les autres restent à portée de main dans le tiroir.
  DS.BELT_BASE = 3;
  DS.SPELLS = [
    // ── Attaque ──
    { id: 'scintilla', cat: 'attaque', icon: '✨', name: 'Scintilla', label: 'Étincelle', glyph: 'line', how: 'Un trait', color: '#7fd4ff', dmg: 8, mana: 8, flight: 0.7, desc: 'Petite, rapide, pas chère.' },
    { id: 'fulgur', cat: 'attaque', icon: '💠', name: 'Fulgur', label: 'Éclat', glyph: 'zigzag', how: 'Un Z', color: '#dfe6ff', dmg: 16, mana: 18, flight: 0.5, desc: 'Un éclat d’énergie si rapide qu’il est dur à parer.' },
    { id: 'ignis', cat: 'attaque', icon: '🔥', name: 'Ignis', label: 'Boule de feu', glyph: 'triangle', how: 'Un triangle', color: '#ff7a3a', dmg: 22, mana: 28, flight: 1.2, burn: { dps: 3, dur: 3 }, desc: 'Lente mais brûlante.' },
    { id: 'sagitta', cat: 'attaque', icon: '🏹', name: 'Sagitta', label: 'Flèche magique', glyph: 'arrow', how: 'Une flèche vers le haut', color: '#9fffd0', dmg: 11, mana: 14, flight: 0.38, price: 80, desc: 'Très rapide, dégâts modérés.' },
    { id: 'terra', cat: 'attaque', icon: '🪨', name: 'Terra', label: 'Jet de roches', glyph: 'square', how: 'Un carré', color: '#c49a6c', dmg: 14, mana: 15, flight: 0.6, wallDmg: 4, price: 90, desc: 'Lourd et rapide. Démolit les murs : chaque cube de terre compte pour 4 coups.' },
    { id: 'tonnero', cat: 'attaque', icon: '⚡', name: 'Tonnero', label: 'Foudre', glyph: 'cup', how: 'Un U carré', color: '#ffe14a', dmg: 15, mana: 20, flight: 0.7, chain: true, price: 120, desc: 'La foudre frappe, puis saute sur tout ce qui est collé à la cible : les copies n’y résistent pas.' },
    { id: 'vespera', cat: 'attaque', icon: '🌙', name: 'Vespera', label: 'Vague d’ombre', glyph: 'crescent', how: 'Un C', color: '#8a78ff', dmg: 15, mana: 20, flight: 0.85, pierce: 0.5, price: 130, desc: 'La moitié des dégâts traverse les boucliers.' },
    { id: 'toxicus', cat: 'attaque', icon: '☠️', name: 'Toxicus', label: 'Nuage toxique', glyph: 'infinity', how: 'Un 8 couché', color: '#5fd35f', dmg: 4, mana: 22, flight: 1, poison: { dps: 2.5, dur: 6 }, price: 140, desc: 'Empoisonne : la vie fond petit à petit.' },
    { id: 'tremor', cat: 'attaque', icon: '💢', name: 'Tremor', label: 'Secousses', glyph: 'emm', how: 'Un M', color: '#d9a066', dmg: 0, mana: 18, flight: 0.9, quake: { delay: 2.5, ticks: 3, dmg: 6 }, price: 150, desc: 'D’abord, rien. Puis la cible tremble de plus en plus et perd de la vie 3 fois. Une protection lancée à temps l’annule.' },
    { id: 'tornado', cat: 'attaque', icon: '🌪️', name: 'Tornado', label: 'Tornade', glyph: 'ess', how: 'Un S', color: '#cfe8e0', dmg: 16, mana: 26, flight: 0.8, wind: true, price: 160, desc: 'Blesse, interrompt le sort en cours et chasse la brume.' },
    { id: 'radius', cat: 'attaque', icon: '🔴', name: 'Radius', label: 'Rayon rouge', glyph: 'sigma', how: 'Un Σ', color: '#ff3b3b', dmg: 0, mana: 30, flight: 0, beam: { dur: 3.5, tick: 0.5, dmg: 4 }, price: 220, desc: 'Un rayon sort de ta baguette pendant 3,5 s : promène-le sur l’adversaire, là où son bouclier n’est pas.' },
    { id: 'infernus', cat: 'attaque', icon: '🐉', name: 'Infernus', label: 'Souffle de dragon', glyph: 'star', how: 'Une étoile', color: '#ff5a1a', dmg: 0, mana: 40, flight: 0, beam: { dur: 3.2, tick: 0.4, dmg: 5, fire: true }, burn: { dps: 3, dur: 3 }, price: 400, desc: 'Tu craches un torrent de feu que tu diriges. Énorme, et ça brûle encore après.' },
    { id: 'foudrus', cat: 'attaque', icon: '🌩️', name: 'Foudrus', label: 'Éclair du ciel', glyph: 'bolt', how: 'Un éclair', color: '#fff27a', dmg: 24, mana: 24, flight: 0.3, sky: 2, price: 240, desc: 'Rien pendant 2 secondes… puis un éclair tombe du ciel. Il se pare : l’anneau apparaît toujours en haut.' },
    { id: 'flammurus', cat: 'attaque', icon: '🌋', name: 'Flammurus', label: 'Mur de feu', glyph: 'flames3', how: 'Trois flammes', color: '#ff8a2a', dmg: 20, mana: 34, flight: 1.1, burn: { dps: 3, dur: 3 }, unparry: true, sweep: true, price: 360, desc: 'Un mur de flammes balaie la salle. Le bouclier ne l’arrête pas : seul un sort de protection le peut. Il brûle toutes les copies d’un coup.' },
    { id: 'vortex', cat: 'attaque', icon: '🌊', name: 'Vortex', label: 'Tourbillon d’eau', glyph: 'trefoil', how: 'Un trèfle à trois feuilles', color: '#3fa8ff', dmg: 8, mana: 38, flight: 0.4, whirl: { dur: 5, dps: 5 }, price: 420, desc: 'Long à tracer, mais il fonce. Un immense tourbillon enferme la cible : elle perd de la vie à chaque seconde et voit tout comme sous l’eau.' },
    // ── Attaque, suite (6 novembre 2026) ──
    { id: 'nocturna', cat: 'attaque', icon: '🟣', name: 'Nocturna', label: 'Triple nuit', glyph: 'why', how: 'Un Y', color: '#b14cff', dmg: 13, mana: 42, flight: 0.9, volley: 3, price: 340, desc: 'Trois boules de nuit cerclées de feu mauve, qui arrivent l’une derrière l’autre, très vite. Chacune se pare… si on est rapide.' },
    { id: 'bombus', cat: 'attaque', icon: '💣', name: 'Bombus', label: 'Explosif', glyph: 'asterisk', how: 'Un flocon : une barre, deux diagonales', color: '#ff6a3a', dmg: 24, mana: 30, flight: 1.1, bomb: true, price: 240, desc: 'Comme une boule de feu… mais elle explose quand on la bloque ou qu’elle touche. Seuls le renvoi parfait et la déviation en viennent à bout.' },
    { id: 'meteorus', cat: 'attaque', icon: '☄️', name: 'Meteorus', label: 'Pluie de météores', glyph: 'meteor', how: 'Une boucle, puis une queue qui zigzague', color: '#ff9a3a', dmg: 9, mana: 60, flight: 0.55, sky: 1.3, meteors: 6, price: 440, desc: 'Une pluie de six météores enflammés tombe du ciel sur l’adversaire. Énorme… si on réussit le signe.' },
    { id: 'blizzardus', cat: 'attaque', icon: '🌨️', name: 'Blizzardus', label: 'Blizzard', glyph: 'cross', how: 'Une croix', color: '#dff6ff', dmg: 10, mana: 45, flight: 0.9, blizzard: { dps: 4, dur: 4 }, price: 380, desc: 'D’un coup, tout l’écran de l’adversaire disparaît dans un blizzard qui mord pendant 4 secondes.' },
    { id: 'stiria', cat: 'attaque', icon: '🧊', name: 'Stiria', label: 'Pique de givre', glyph: 'lt', how: 'Un <', color: '#9fe8ff', dmg: 12, mana: 20, flight: 0.5, pierce: 0.5, freeze: 1.2, price: 150, desc: 'Une pique de glace qui traverse à moitié le bouclier, et gèle qui elle touche.' },
    { id: 'stalagma', cat: 'attaque', icon: '🔱', name: 'Stalagma', label: 'Éclat de stalactites', glyph: 'psi', how: 'Un psi', color: '#bfe6ff', dmg: 10, mana: 22, flight: 0, self: true, needles: true, price: 170, desc: 'Des aiguilles de glace jaillissent tout autour de toi : elles brisent tous les sorts en vol vers toi et piquent l’adversaire.' },
    { id: 'orbis', cat: 'attaque', icon: '🔵', name: 'Orbis', label: 'Orbe d’orage', glyph: 'step', how: 'Une marche', color: '#ffe14a', dmg: 0, mana: 30, flight: 0.8, quake: { dmg: 6, ticks: 4, delay: 0.7 }, orb: true, price: 220, desc: 'Une sphère d’orage reste près de l’adversaire et le foudroie quatre fois de suite.' },
    { id: 'acidus', cat: 'attaque', icon: '🧪', name: 'Acidus', label: 'Souffle d’acide', glyph: 'two', how: 'Un 2', color: '#b8ff3a', dmg: 12, mana: 24, flight: 0.9, noShield: 6, price: 190, desc: 'Un jet d’acide qui ronge les boucliers : l’adversaire ne peut plus en lancer pendant 6 secondes.' },
    { id: 'saxum', cat: 'attaque', icon: '🪨', name: 'Saxum', label: 'Éboulement', glyph: 'four', how: 'Un 4', color: '#a08060', dmg: 20, mana: 28, flight: 0.7, dazzle: 2, price: 210, desc: 'Un bloc de roche qui assomme : l’adversaire reste étourdi deux secondes.' },
    { id: 'spina', cat: 'attaque', icon: '🌵', name: 'Spina', label: 'Ronces empoisonnées', glyph: 'kay', how: 'Un K', color: '#7fcf5a', dmg: 8, mana: 24, flight: 0.9, poison: { dps: 3, dur: 5 }, heavy: 4, price: 200, desc: 'Des ronces venimeuses poussent sous ses pieds : poison, et une baguette qui pèse une tonne.' },
    { id: 'vampyra', cat: 'attaque', icon: '🦇', name: 'Vampyra', label: 'Voleur d’âme', glyph: 'stairsup', how: 'Deux marches qui montent', color: '#c04a8a', dmg: 16, mana: 26, flight: 0.9, leech: 0.5, price: 250, desc: 'Une morsure d’ombre : la moitié des dégâts te revient en vie.' },
    // ── Protection ──
    { id: 'aegis', cat: 'protection', icon: '🛡️', name: 'Aegis', label: 'Dôme', glyph: 'roof', how: 'Un toit', color: '#ffd978', dmg: 0, mana: 24, flight: 0, self: true, ward: 10, price: 80, desc: 'Absorbe le prochain sort qui te touche.' },
    { id: 'calor', cat: 'protection', icon: '☀️', name: 'Calor', label: 'Anti-glace', glyph: 'veecross', how: 'Un V barré', color: '#ffb36b', dmg: 0, mana: 12, flight: 0, self: true, antiIce: 15, price: 50, desc: 'Les sorts de glace ne te font plus rien.' },
    { id: 'tenax', cat: 'protection', icon: '✊', name: 'Tenax', label: 'Poigne de fer', glyph: 'phi', how: 'Un cercle barré', color: '#e0a8ff', dmg: 0, mana: 12, flight: 0, self: true, grip: 15, price: 50, desc: 'Désarmo ne t’arrache plus ta baguette.' },
    { id: 'absorbo', cat: 'protection', icon: '🌀', name: 'Absorbo', label: 'Conversion', glyph: 'gt', how: 'Un >', color: '#7fb0ff', dmg: 0, mana: 14, flight: 0, self: true, absorb: 12, price: 120, desc: 'Avale la prochaine attaque et change tous ses dégâts en énergie.' },
    { id: 'vapor', cat: 'protection', icon: '🌫️', name: 'Vapor', label: 'Brume', glyph: 'loop', how: 'Une boucle', color: '#cfd8e6', dmg: 0, mana: 20, flight: 0, self: true, mist: 12, price: 150, desc: 'Un sort sur deux te passe à côté. Le vent (Tornado) chasse la brume.' },
    { id: 'copius', cat: 'protection', icon: '👥', name: 'Copius', label: 'Copies', glyph: 'three', how: 'Un 3', color: '#ffc8f0', dmg: 0, mana: 26, flight: 0, self: true, copies: 15, price: 240, desc: 'Tu te dédoubles en trois. Un seul est le vrai : les sorts des copies ne font rien.' },
    { id: 'puritas', cat: 'protection', icon: '🫧', name: 'Puritas', label: 'Purification', glyph: 'coil', how: 'Trois boucles', color: '#bff5ff', dmg: 0, mana: 30, flight: 0, self: true, purge: true, price: 260, desc: 'Efface d’un coup tous tes maléfices, brûlure et poison compris.' },
    { id: 'stabilis', cat: 'protection', icon: '🧘', name: 'Stabilis', label: 'Concentration', glyph: 'aitch', how: 'Un H', color: '#9fe0c8', dmg: 0, mana: 12, flight: 0, self: true, focus: 2, price: 150, desc: 'Les 2 prochains sorts qui t’atteignent (touché ou paré) ne peuvent pas interrompre ton tracé ni ton rayon.' },
    { id: 'arcanum', cat: 'protection', icon: '🔷', name: 'Arcanum', label: 'Bouclier arcanique', glyph: 'perp', how: 'Un T à l’envers', color: '#8fb8ff', dmg: 0, mana: 26, flight: 0, self: true, shieldHp: 30, price: 210, desc: 'Un bouclier d’énergie qui encaisse 30 points de dégâts à ta place, puis se brise.' },
    // ── Renfort ──
    { id: 'cura', cat: 'renfort', icon: '💚', name: 'Cura', label: 'Petit soin', glyph: 'heart', how: 'Un cœur', color: '#8dffb0', dmg: 0, mana: 14, flight: 0, self: true, heal: 15, price: 70, desc: 'Rend un peu de vie.' },
    { id: 'antidotum', cat: 'renfort', icon: '🧪', name: 'Antidotum', label: 'Antidote', glyph: 'root', how: 'Une racine √', color: '#b8f27a', dmg: 0, mana: 10, flight: 0, self: true, antiPoison: 10, price: 60, desc: 'Chasse le poison et t’en protège un moment.' },
    { id: 'magnus', cat: 'renfort', icon: '⭕', name: 'Magnus', label: 'Grand bouclier', glyph: 'balloon', how: 'Un cercle à queue', color: '#9fd0ff', dmg: 0, mana: 14, flight: 0, self: true, bigR: 15, price: 110, desc: 'Le cercle de ton bouclier grossit : parer devient plus facile.' },
    { id: 'amplio', cat: 'renfort', icon: '⏫', name: 'Amplio', label: 'Amplification', glyph: 'stairs', how: 'Un escalier', color: '#ffd24a', dmg: 0, mana: 18, flight: 0, self: true, amp: 3, price: 130, desc: 'Tes 3 prochaines attaques frappent 50 % plus fort.' },
    { id: 'sana', cat: 'renfort', icon: '💖', name: 'Sana', label: 'Grand soin', glyph: 'pulse', how: 'Un battement de cœur', color: '#ff8fb0', dmg: 0, mana: 32, flight: 0, self: true, heal: 40, price: 200, desc: 'Rend beaucoup de vie.' },
    { id: 'fortis', cat: 'renfort', icon: '💪', name: 'Fortis', label: 'Force double', glyph: 'pee', how: 'Un P', color: '#ff9a5a', dmg: 0, mana: 26, flight: 0, self: true, fortis: 8, price: 220, desc: 'Tes attaques frappent 2 fois plus fort.' },
    { id: 'speculum', cat: 'renfort', icon: '🪞', name: 'Speculum', label: 'Miroir', glyph: 'arch', how: 'Une arche', color: '#e8eef8', dmg: 0, mana: 26, flight: 0, self: true, mirror: 12, price: 240, desc: 'Le prochain sort qui te touche repart tout seul vers l’envoyeur.' },
    { id: 'vigor', cat: 'renfort', icon: '🌿', name: 'Vigor', label: 'Régénération', glyph: 'zigzag3', how: 'Deux Z empilés', color: '#6fe0a0', dmg: 0, mana: 34, flight: 0, self: true, regen: { hps: 4, dur: 8 }, price: 280, desc: 'Ta vie remonte toute seule, seconde après seconde.' },
    { id: 'bastion', cat: 'renfort', icon: '🏰', name: 'Bastion', label: 'Peau de pierre', glyph: 'crown', how: 'Une couronne', color: '#c9b79a', dmg: 0, mana: 34, flight: 0, self: true, bastion: 10, price: 320, desc: 'Les attaques te font 2 fois moins mal.' },
    { id: 'preparus', cat: 'renfort', icon: '🔮', name: 'Preparus', label: 'Sort en réserve', glyph: 'tee', how: 'Un T', color: '#b8c8ff', dmg: 0, mana: 6, flight: 0, self: true, prep: 1, price: 200, desc: 'Ta prochaine attaque ne part pas : elle flotte à côté de toi. Clique dessus pour la lancer quand tu veux… avant qu’elle s’éteigne.' },
    { id: 'conjura', cat: 'renfort', icon: '🎩', name: 'Conjura', label: 'Animal magique', glyph: 'hat', how: 'Un chapeau', color: '#d9a8ff', dmg: 0, mana: 30, flight: 0, self: true, conjure: 6, price: 320, desc: 'Puis trace vite ton animal : un V pour le hibou 🦉, un W pour le dragonnet 🐲, un rond pour le crapaud 🐸. Il attaque à tes côtés pendant 7 secondes.' },
    // ── Effet ──
    { id: 'glacius', cat: 'effet', icon: '❄️', name: 'Glacius', label: 'Glaçon', glyph: 'vee', how: 'Un V', color: '#a8f0ff', dmg: 10, mana: 18, flight: 0.9, freeze: 2, desc: 'Enferme la cible dans un cube de glace : 2 secondes sans rien pouvoir faire.' },
    { id: 'desarmo', cat: 'effet', icon: '🪄', name: 'Désarmo', label: 'Désarmement', glyph: 'circle', how: 'Un cercle', color: '#c58bff', dmg: 5, mana: 22, flight: 0.8, disarm: 3, desc: 'Fait voler la baguette adverse : il faut la rattraper pendant qu’elle retombe.' },
    { id: 'lentus', cat: 'effet', icon: '🐌', name: 'Lentus', label: 'Ralentissement', glyph: 'ell', how: 'Un L', color: '#a6e36a', dmg: 0, mana: 16, flight: 0.8, slow: 6, price: 60, desc: 'L’adversaire bouge au ralenti.' },
    { id: 'aqua', cat: 'effet', icon: '💦', name: 'Aqua', label: 'Jet d’eau', glyph: 'wave', how: 'Un W', color: '#4fb8ff', dmg: 10, mana: 20, flight: 0.9, soak: 5, price: 100, desc: 'En pleine figure : il voit trouble et vise mal.' },
    { id: 'vitus', cat: 'effet', icon: '🐇', name: 'Vitus', label: 'Emballement', glyph: 'gamma', how: 'Un L à l’envers', color: '#ffe08a', dmg: 0, mana: 16, flight: 0.8, fast: 6, price: 110, desc: 'Ses gestes partent beaucoup trop vite : bonne chance pour tracer une forme compliquée !' },
    { id: 'fractura', cat: 'effet', icon: '🔨', name: 'Fractura', label: 'Brise-bouclier', glyph: 'corner', how: 'Un coin', color: '#ff8a6b', dmg: 0, mana: 18, flight: 0.8, noShield: 5.5, price: 120, desc: 'Plus aucun bouclier pendant 5 à 6 secondes.' },
    { id: 'gravitas', cat: 'effet', icon: '⚓', name: 'Gravitas', label: 'Pesanteur', glyph: 'arrowdown', how: 'Une flèche vers le bas', color: '#9a8fd0', dmg: 0, mana: 18, flight: 0.8, heavy: 6, price: 130, desc: 'Sa baguette pèse une tonne et descend toute seule.' },
    { id: 'tenebra', cat: 'effet', icon: '🌑', name: 'Tenebra', label: 'Aveuglement', glyph: 'enn', how: 'Un N', color: '#9a7bff', dmg: 0, mana: 24, flight: 0.9, blind: 4, price: 140, desc: 'Noir complet : il ne voit plus rien venir.' },
    { id: 'lumina', cat: 'effet', icon: '🌟', name: 'Lumina', label: 'Éblouissement', glyph: 'rbracket', how: 'Un crochet ]', color: '#fff6c0', dmg: 0, mana: 22, flight: 0.6, dazzle: 4.5, price: 140, desc: 'Un éclair blanc : sa vue ne revient que tout doucement.' },
    { id: 'murus', cat: 'effet', icon: '🧱', name: 'Murus', label: 'Mur', glyph: 'crenel', how: 'Des créneaux', color: '#b9a58c', dmg: 0, mana: 22, flight: 0, self: true, wall: 5, price: 150, desc: 'Dresse un mur entre vous deux. Il faut 5 coups d’attaque, de l’un ou de l’autre, pour l’abattre.' },
    { id: 'siphon', cat: 'effet', icon: '🧲', name: 'Siphon', label: 'Vol d’énergie', glyph: 'hook', how: 'Un J', color: '#6fd6ff', dmg: 0, mana: 6, flight: 0.8, drain: 15, price: 150, desc: 'Vole de l’énergie magique à l’adversaire pour remplir la tienne.' },
    { id: 'silencio', cat: 'effet', icon: '🤫', name: 'Silencio', label: 'Silence', glyph: 'fish', how: 'Un poisson', color: '#b8c0dc', dmg: 0, mana: 20, flight: 0.8, silence: 6, price: 160, desc: 'Il ne peut plus lancer de sorts d’attaque.' },
    { id: 'inversium', cat: 'effet', icon: '🔄', name: 'Inversium', label: 'Tête en bas', glyph: 'saw', how: 'Des dents de scie', color: '#ff7ad9', dmg: 0, mana: 20, flight: 0.8, invert: 6, price: 170, desc: 'L’adversaire se retrouve la tête en bas : tout son monde est à l’envers pendant 6 secondes.' },
    { id: 'somnus', cat: 'effet', icon: '💤', name: 'Somnus', label: 'Sommeil', glyph: 'spiral', how: 'Une spirale', color: '#ff9ad5', dmg: 0, mana: 28, flight: 1, sleep: 5, price: 180, desc: 'Ses paupières tombent, ses gestes ralentissent.' },
    { id: 'ritardo', cat: 'effet', icon: '⏳', name: 'Ritardo', label: 'Écho', glyph: 'hourglass', how: 'Un sablier', color: '#e8c36b', dmg: 0, mana: 24, flight: 0.9, echo: 10, price: 260, desc: 'Pendant 10 s, chaque dégât reçu est noté… puis reçu une seconde fois, d’un seul coup.' },
    { id: 'atchoum', cat: 'effet', icon: '🤧', name: 'Atchoum', label: 'Éternuements', glyph: 'aye', how: 'Un A', color: '#ffe08a', dmg: 0, mana: 16, flight: 0.9, sneeze: 6, price: 150, desc: 'Quatre gros éternuements : la tête plonge, la baguette part de travers.' },
    { id: 'fumus', cat: 'effet', icon: '💨', name: 'Fumus', label: 'Écran de fumée', glyph: 'check', how: 'Un crochet ✓', color: '#b8b8c8', dmg: 0, mana: 24, flight: 0, self: true, smoke: 8, price: 220, desc: 'Un nuage de fumée se dresse devant toi : l’adversaire ne voit plus tes gestes et ne peut plus parer tes sorts pendant 8 secondes.' },
    { id: 'evanesco', cat: 'effet', icon: '👻', name: 'Evanesco', label: 'Invisibilité', glyph: 'arrowright', how: 'Une flèche vers la droite', color: '#d8d8ff', dmg: 0, mana: 28, flight: 0, self: true, invis: 4, price: 270, desc: 'Tu disparais 4 secondes : les boules d’énergie te traversent. Le mur de feu, lui, te trouve. Dès que tu lances un sort, tu réapparais.' },
    { id: 'deviatus', cat: 'effet', icon: '↪️', name: 'Deviatus', label: 'Baguette déviante', glyph: 'arrowleft', how: 'Une flèche vers la gauche', color: '#ffd978', dmg: 0, mana: 22, flight: 0, self: true, swipe: 10, price: 230, desc: 'Pendant 10 secondes, ta baguette dévie les sorts d’un revers rapide à travers l’anneau doré, comme la baguette de Josué.' },
    { id: 'myopia', cat: 'effet', icon: '👓', name: 'Myopia', label: 'Vue brouillée', glyph: 'ex', how: 'Un X', color: '#c8b8e8', dmg: 0, mana: 18, flight: 0.9, blur: 6, price: 170, desc: 'Tout devient flou, comme si on avait perdu ses lunettes.' }
  ];
  // Animaux magiques de Conjura : après Conjura, le prochain tracé choisit l'animal (ces trois signes-là changent alors de sens).
  // every : secondes entre deux tirs · life : secondes de présence · shot : le petit sort qu'il lance (un sort comme les autres, mais qu'on ne peut pas apprendre).
  DS.ALLIES = [
    { id: 'hibou', icon: '🦉', name: 'Hibou', glyph: 'vee', how: 'Un V', color: '#cdb8ff', every: 0.9, life: 7, desc: 'Rapide : une étincelle par seconde.', shot: { icon: '✨', dmg: 3, flight: 0.5 } },
    { id: 'dragonnet', icon: '🐲', name: 'Dragonnet', glyph: 'wave', how: 'Un W', color: '#ff7a3a', every: 2.2, life: 7, desc: 'Trois boules de feu, qui brûlent.', shot: { icon: '🔥', dmg: 8, flight: 0.9, burn: { dps: 2, dur: 2 } } },
    { id: 'crapaud', icon: '🐸', name: 'Crapaud', glyph: 'circle', how: 'Un rond', color: '#5fd35f', every: 1.6, life: 7, desc: 'Des bulles de poison.', shot: { icon: '🫧', dmg: 3, flight: 0.8, poison: { dps: 2, dur: 3 } } }
  ];
  DS.ALLIES.forEach(function (a) { var sh = a.shot; sh.id = 'allie-' + a.id; sh.cat = 'attaque'; sh.name = a.name; sh.color = a.color; sh.mana = 0; });

  // Durées qui s'allongent avec le niveau du sort, et description chiffrée d'un sort à un niveau donné (M = DS.spellMul(niveau)).
  DS.SPELL_DURS = ['blur', 'sneeze', 'freeze', 'disarm', 'slow', 'soak', 'blind', 'sleep', 'dazzle', 'fast', 'heavy', 'invert', 'silence', 'noShield', 'ward', 'antiIce', 'grip', 'antiPoison', 'absorb', 'mirror', 'mist', 'bastion', 'fortis', 'bigR', 'copies'];
  // Les mêmes chiffres, ligne par ligne : [nom, valeur] (la page du grimoire les met en tableau, niveau actuel et niveau suivant côte à côte).
  DS.spellStats = function (s, M) {
    var out = [], dur = 0, sec = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' s'; };
    DS.SPELL_DURS.forEach(function (k) { if (s[k]) dur = s[k]; });
    if (s.dmg) out.push(['Dégâts', Math.round(s.dmg * M.dmg)]);
    if (s.beam) out.push(['Dégâts', Math.round(s.beam.dur / s.beam.tick) + ' × ' + Math.round(s.beam.dmg * M.dmg)]);
    if (s.quake) out.push(['Dégâts', s.quake.ticks + ' × ' + Math.round(s.quake.dmg * M.dmg)]);
    if (s.flight) out.push(['Vitesse', Math.round(100 * M.speed) + ' %']);
    if (s.dmg || s.beam) out.push(['Taille', Math.round(100 * M.size) + ' %']);
    if (s.burn) out.push(['Brûlure', sec(s.burn.dur * M.dur)]);
    if (s.poison) out.push(['Poison', sec(s.poison.dur * M.dur)]);
    if (s.whirl) out.push(['Tourbillon', Math.round(s.whirl.dps * M.pow) + ' / s, ' + sec(s.whirl.dur * M.dur)]);
    if (s.sky) out.push(['Tombe après', sec(s.sky)]);
    if (s.focus) out.push(['Sorts protégés', s.focus]);
    if (s.heal) out.push(['Vie rendue', '+' + Math.round(s.heal * M.pow)]);
    if (s.regen) out.push(['Vie rendue', '+' + Math.round(s.regen.hps * s.regen.dur * M.dur) + ' en ' + sec(s.regen.dur * M.dur)]);
    if (s.drain) out.push(['Énergie volée', Math.round(s.drain * M.pow)]);
    if (s.amp) out.push(['Attaques', s.amp]);
    if (s.wall) out.push(['Coups', s.wall]);
    if (s.volley) out.push(['Boules', s.volley]);
    if (s.meteors) out.push(['Météores', s.meteors]);
    if (s.blizzard) out.push(['Blizzard', Math.round(s.blizzard.dps * M.pow) + ' / s, ' + sec(s.blizzard.dur * M.dur)]);
    if (s.shieldHp) out.push(['Encaisse', Math.round(s.shieldHp * M.pow)]);
    if (s.leech) out.push(['Vie volée', Math.round(s.leech * 100) + ' %']);
    if (s.smoke) out.push(['Fumée', sec(s.smoke * M.dur)]);
    if (s.invis) out.push(['Invisible', sec(s.invis * M.dur)]);
    if (s.swipe) out.push(['Déviation', sec(s.swipe * M.dur)]);
    if (s.echo) out.push(['Pendant', sec(s.echo)]);
    if (dur) out.push([out.length ? 'Effet' : 'Durée', sec(dur * M.dur)]);
    return out;
  };
  DS.spellNums = function (s, M) {
    var out = [], dur = 0, sec = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' s'; };
    DS.SPELL_DURS.forEach(function (k) { if (s[k]) dur = s[k]; });
    if (s.dmg) out.push(Math.round(s.dmg * M.dmg) + ' dégâts');
    if (s.beam) out.push(Math.round(s.beam.dur / s.beam.tick) + ' × ' + Math.round(s.beam.dmg * M.dmg) + ' dégâts');
    if (s.quake) out.push(s.quake.ticks + ' × ' + Math.round(s.quake.dmg * M.dmg) + ' dégâts');
    if (s.burn) out.push('brûlure ' + sec(s.burn.dur * M.dur));
    if (s.poison) out.push('poison ' + sec(s.poison.dur * M.dur));
    if (s.whirl) out.push(Math.round(s.whirl.dps * M.pow) + ' dégâts par seconde pendant ' + sec(s.whirl.dur * M.dur));
    if (s.sky) out.push('après ' + sec(s.sky));
    if (s.focus) out.push(s.focus + ' sorts');
    if (s.heal) out.push('+' + Math.round(s.heal * M.pow) + ' vie');
    if (s.regen) out.push('+' + Math.round(s.regen.hps * s.regen.dur * M.dur) + ' vie en ' + sec(s.regen.dur * M.dur));
    if (s.drain) out.push(Math.round(s.drain * M.pow) + ' d’énergie');
    if (s.amp) out.push(s.amp + ' attaques');
    if (s.wall) out.push(s.wall + ' coups');
    if (s.volley) out.push(s.volley + ' boules'); if (s.meteors) out.push(s.meteors + ' météores');
    if (s.blizzard) out.push('blizzard ' + Math.round(s.blizzard.dps * M.pow) + ' par seconde pendant ' + sec(s.blizzard.dur * M.dur));
    if (s.shieldHp) out.push('encaisse ' + Math.round(s.shieldHp * M.pow)); if (s.leech) out.push(Math.round(s.leech * 100) + ' % de vie volée');
    if (s.smoke) out.push('fumée ' + sec(s.smoke * M.dur)); if (s.invis) out.push('invisible ' + sec(s.invis * M.dur)); if (s.swipe) out.push('déviation ' + sec(s.swipe * M.dur));
    if (s.echo) out.push('pendant ' + sec(s.echo));
    if (dur) out.push((out.length ? 'effet ' : 'dure ') + sec(dur * M.dur));
    return out.join(', ');
  };

  // Niveau des sorts (1 à 5) : c'est le joueur qui les fait monter, avec ses points de sort — un point par niveau de sorcier gagné (grimoire, js/main.js).
  DS.SPELL_MAX_LV = 5;
  // Points à dépenser pour gagner un niveau : les sorts les plus puissants (les plus chers au magasin) coûtent plus cher à faire monter.
  DS.spellUpCost = function (s) { return s.price >= 300 ? 3 : s.price >= 150 ? 2 : 1; };
  // Ce qu'apporte le niveau : dégâts, vitesse du projectile, durée et intensité des effets, taille du projectile. La différence doit se voir à chaque niveau :
  // au niveau 5, un sort frappe 2,4 fois plus fort, file une fois et demie plus vite, et ses effets durent deux fois plus longtemps.
  // Les enchaînements : des sorts lancés dans cet ordre, sans traîner (COMBO_GAP secondes au plus entre deux), et le dernier frappe comme s'il avait un niveau de plus.
  // Ce sont ceux que le professeur Brasier enseigne au cours d'attaque (js/lecons.js) ; main.js et duel.js les reconnaissent.
  DS.COMBO_GAP = 3.5;
  DS.COMBOS = [
    { id: 'untroi', name: 'Le un-deux-trois', seq: ['scintilla', 'scintilla', 'fulgur'] },
    { id: 'dragon', name: 'Le coup du dragon', seq: ['fulgur', 'ignis'] },
    { id: 'archer', name: 'Le coup de l’archer', seq: ['ignis', 'sagitta'] },
    { id: 'macon', name: 'Le coup du maçon', seq: ['terra', 'terra', 'fulgur'] },
    { id: 'orage', name: 'Le coup de l’orage', seq: ['sagitta', 'tonnero'] },
    { id: 'eclipse', name: 'Le coup de l’éclipse', seq: ['scintilla', 'vespera'] },
    { id: 'serpent', name: 'Le coup du serpent', seq: ['toxicus', 'sagitta', 'sagitta'] },
    { id: 'taupe', name: 'Le coup de la taupe', seq: ['tremor', 'ignis'] },
    { id: 'phare', name: 'Le coup du phare', seq: ['tremor', 'radius'] }
  ];
  // raw : sans plafond (un enchaînement réussi donne un niveau de plus, même au niveau 5)
  DS.spellMul = function (lv, raw) { var m = Math.max(0, (raw ? lv : Math.min(DS.SPELL_MAX_LV, lv || 1)) - 1); return { lv: m + 1, dmg: 1 + 0.35 * m, speed: 1 + 0.12 * m, dur: 1 + 0.25 * m, pow: 1 + 0.3 * m, size: 1 + 0.16 * m }; };

  // Talents du sorcier : un point à placer par niveau gagné. per : gain par point · max : nombre de points au plus (STAT_MAX sinon).
  DS.STAT_MAX = 10;
  DS.STATS = [
    { id: 'hp', icon: '❤️', name: 'Vitalité', per: 10, text: function (v) { return '+' + v + ' points de vie'; } },
    { id: 'mana', icon: '🔷', name: 'Réserve', per: 5, text: function (v) { return '+' + v + ' d’énergie magique max'; } },
    { id: 'regen', icon: '✨', name: 'Source', per: 6, text: function (v) { return 'L’énergie revient ' + v + ' % plus vite'; } },
    { id: 'cost', icon: '🪶', name: 'Économie', per: 3, text: function (v) { return 'Les sorts coûtent ' + v + ' % de moins'; } },
    { id: 'gold', icon: '<i class="coin"></i>', name: 'Fortune', per: 8, text: function (v) { return '+' + v + ' % d’or après un duel'; } },
    { id: 'guard', icon: '🛡️', name: 'Garde', per: 0.1, text: function (v) { return 'Garde le clic enfoncé : le bouclier tient ' + v.toFixed(1).replace('.', ',') + ' s de plus'; } },
    { id: 'belt', icon: '🎒', name: 'Ceinture', per: 1, max: 5, text: function (v) { return '+' + v + (v > 1 ? ' cases' : ' case') + ' de sort à la ceinture'; } }
  ];
  DS.xpNeed = function (lv) { return 50 + 30 * lv; }; // expérience pour passer du niveau lv au suivant

  // Ce que l'adversaire nous lance avant le duel, selon son âge : les enfants fanfaronnent, les ados prennent tout de haut, les adultes sont plus malicieux.
  // {nom} : le prénom de celui qui parle. {le meilleur|la meilleure} : selon que celui qui parle est un sorcier ou une sorcière (f: true dans sa fiche).
  // [nouveau|nouvelle] : selon notre sorcier à nous.
  DS.TAUNTS = {
    kid: [
      'Na na nère ! Tu vas perdre, tu vas perdre !',
      'Ma baguette est plus forte que la tienne. Et mon papa, il est plus fort que ton papa !',
      'Si je gagne, tu me donnes ton dessert. Promis ?',
      'Même pas peur ! … Bon, un tout petit peu. Mais je vais gagner quand même !',
      'J’ai appris un nouveau sort hier. Tu vas voir, ça va faire BOUM !',
      'Tu traces tes sorts comme un bébé troll !',
      'Le dernier qui a perdu contre moi, il a pleuré. C’était mon petit frère.',
      'Prépare-toi à manger de la poussière d’étoile !',
      'Ma maman dit que personne ne me bat, dans ma classe. Et les mamans, ça ne ment jamais.',
      'Tu sens le vieux chaudron ! Hi hi hi !',
      'Je te préviens : je ne sais pas encore bien viser. Ça peut partir n’importe où !',
      'Un, deux, trois… tu perdras !',
      'Si tu gagnes, c’est que tu as triché. Voilà.',
      'Après le duel, on joue à chat ? Mais d’abord, je te bats.',
      'Tu sauras que j’ai remporté la médaille d’or l’année passée !',
      'C’est moi qui serai {le meilleur|la meilleure} !',
      'Zoom zoom boom, tu seras sur tes foufounes !',
      'Bah alors ? On commence ou non ?',
      'C’est long… j’ai faim…',
      'Allô ! Moi c’est {nom}, toi c’est quoi ton nom ?',
      'BoOoOo !!! T’as eu peur ? Hihi !',
      'Ma maman m’a toujours dit que j’étais {le meilleur|la meilleure}.',
      'L’autre jour, j’ai incanté une boule de feu et ça m’a explosé à la figure…',
      'Et si on devenait amis ?',
      'Mon papa m’a dit que tu allais me laisser gagner ?',
      'Hé, t’as vu le monsieur à la grande barbe ? Hihihi, il est drôle !',
      'Je suis {le meilleur|la meilleure}, na na na !',
      'J’attaque super vite, tu n’as aucune chance.',
      'Elle est où ma maman ?',
      'Il est où mon papa ?'
    ],
    teen: [
      'Sérieux, c’est toi mon adversaire ? Bon… ça va être rapide alors.',
      'Essaie de tenir plus de trente secondes, que ça vaille le déplacement.',
      'J’ai révisé mes sorts ce matin. Toi, t’as révisé comment perdre ?',
      'T’as une belle baguette. Dommage que ce soit toi qui la tiennes.',
      'Pfff. Réveille-moi quand ça devient intéressant.',
      'Pas de panique : je vais y aller doucement. Enfin… au début.',
      'On parie ta baguette ? Non ? T’as raison, garde-la pour pleurer dessus.',
      'J’ai battu un professeur à l’entraînement. Bon, il dormait. Mais ça compte.',
      'Tu trembles déjà, ou c’est juste ta façon de tenir une baguette ?',
      'On se dépêche ? J’ai un entraînement de balai volant après.',
      'Je te laisse le premier sort. Cadeau. Tu vas en avoir besoin.',
      'T’inquiète : perdre contre moi, c’est presque un honneur.',
      'Tes étincelles, elles chatouillent. C’est ça, ton plan ?',
      'Grr… Ton nom va finir sur ma liste de victoires !',
      'Booya ! Tu as aucune chance, mon pote !',
      'Voyons voir ce que tu as dans le ventre…',
      'Ughhh… j’ai hâte d’écouter ma télé-réalité préférée…',
      'Hey.',
      '{Désolé|Désolée}, j’écoute pas les gens qui ont zéro style.',
      'Je suis pratiquement, déjà, presque, mais pas loin, {un vrai|une vraie} archimage !',
      'Pour moi, tout est dans la souplesse du poignet.',
      'Salut, t’es [nouveau|nouvelle] toi ici, non ?',
      'Ssssssssssssssssssssssalut. Ççççççççççççççça va ?',
      'Sa-sa… salut… ça va ?',
      'Écoute, sur le plan strictement épistémologique, ton raisonnement frôle la vacuité absolue, mais bon… bel effort.',
      'Ne le prends pas personnellement, c’est juste que mon quotient intellectuel crée naturellement un décalage systémique entre nous.',
      'C’est fascinant à quel point tu énonces une platitude avec une assurance aussi déconcertante. Whoa.',
      'Je pourrais t’expliquer en détail pourquoi tu as tort, mais la pédagogie face à un tel manque de plasticité cérébrale me fatigue d’avance.',
      'Parle à ma main, mon cerveau a déjà déconnecté.',
      'Même en cherchant bien, je trouve absolument rien d’intéressant chez toi.'
    ],
    adult: [
      'J’ai étudié ta façon de tracer. Charmante. Prévisible, mais charmante.',
      'Rassure-toi : je ne te ferai que le strict nécessaire de mal.',
      'Un bon duelliste sait quand abandonner. Je te laisse y réfléchir… trois secondes.',
      'Tu comptes sur ta rapidité ? Comme c’est touchant. Moi, je compte sur tes erreurs.',
      'J’ai déjà gagné ce duel hier soir, dans ma tête. Il ne reste que les formalités.',
      'Protège-toi bien. Ça ne changera rien, mais j’apprécie l’effort.',
      'On dit que tu progresses vite. Voyons si c’est assez vite.',
      'Je ne te souhaite pas bonne chance : la chance n’a rien à voir là-dedans.',
      'Garde un peu d’énergie pour la fin. Il t’en faudra pour applaudir.',
      'Chaque sort que tu lances m’en apprend un peu plus sur toi. Continue, je t’en prie.',
      'Dans dix ans, tu raconteras ce duel. En oubliant la fin, sans doute.',
      'Ne le prends pas mal : ce n’est pas toi qui manques de talent, c’est moi qui en ai trop.',
      'J’espère que tu as une bonne mémoire des formes. La mienne est irréprochable.',
      'Un conseil gratuit : surveille mes étincelles. L’autre conseil, tu le découvriras trop tard.',
      'Tu as du talent. C’est presque dommage de devoir te donner cette leçon.',
      'Savoure le silence avant le duel. Après, il n’y aura plus que le bruit de ta défaite.',
      'C’est fou comme tout devient ennuyeux dès que tu ouvres la bouche.',
      'Ta baguette sert à lancer des sorts ou juste à mélanger la soupe à la cantine ?',
      'J’ai vu des mannequins d’entraînement avec une meilleure maîtrise des arcanes que toi.',
      'Même ton propre grimoire refuse de s’ouvrir tellement tes sorts font pitié.',
      'C’était censé être un bouclier, ça ? On dirait une bulle de savon au premier coup de vent.',
      'Tu devrais retourner en cours d’initiation, parce que là, c’est de l’autodestruction magique.',
      'Ton temps d’incantation est si lent que j’ai eu le temps de lire trois grimoires complets.',
      'C’est pas de l’énergie magique qui manque chez toi, c’est juste du talent.',
      'Beau sort d’attaque… si ton but était de me chatouiller la robe !',
      'Ton reflet dans le miroir a l’air plus terrifiant que tes boules de feu.',
      'Es-tu [sûr|sûre] d’être [un sorcier|une sorcière] ? Parce que là, tu m’évoques plutôt [un moldu confus|une moldue confuse].'
    ]
  };
  // Pour tous les âges.
  DS.TAUNTS.all = [
    'Sérieux, c’est toi mon adversaire ? Bhahahaha !',
    'Tu as l’air complètement ridicule.',
    'Bhahaha ! Je vais tellement gagner facilement !',
    'Mais tu es minuscule, toi. Ça va être vite gagné, ce duel.',
    'Hrmpf. Hrmpf. Hrmpf.',
    'GAZOU TUT MINUSCULUS !!!',
    'Tu… seras… [vaincu|vaincue]…'
  ];
  // Les sorciers gentils (nice: true dans leur fiche) disent plutôt ça, plus d'une fois sur deux.
  DS.TAUNTS.nice = [
    'Je te souhaite un excellent match !',
    'On fait ça selon les règles, d’accord ?',
    'Hé, psitt…'
  ];
  // La réplique fétiche de chaque rival, une fois adulte (un tiers du temps).
  DS.QUIPS = {
    barnabe: 'Où ai-je mis ma baguette… Ah, dans ma main. Parfait. Où en étions-nous ? Ah oui : ta défaite.',
    ysolde: 'Tiens-toi droit. On ne perd pas le dos rond, dans ma salle.',
    gaspard: 'Je pourrais te battre à mains nues. Mais le règlement exige une baguette.',
    lison: 'J’ai caché une surprise dans un de mes sorts. Devine lequel !',
    anselme: 'Je lançais déjà des sorts quand tes professeurs portaient des couches.',
    capucine: 'Cligne des yeux, et ce sera déjà fini.',
    victor: 'L’ombre est patiente. Moi, beaucoup moins.',
    ondine: 'Dans mon marais, on dit : qui s’y frotte finit trempé.',
    firmin: 'J’ai trouvé un trèfle à quatre feuilles ce matin. Désolé pour toi.',
    zelie: 'J’ai rêvé de ce duel cette nuit. Tu perdais très joliment.',
    hector: 'Grmbl. Finissons-en, j’ai une soupe sur le feu.',
    morgane: 'On ne devient pas archimage en perdant contre des élèves.',
    archibald: 'J’ai laissé pousser cette barbe en attendant un adversaire à ma mesure. J’attends toujours.',
    philemon: 'Ma moustache a remporté plus de duels que toi.',
    cunegonde: 'Ne fixe pas mes cheveux. Fixe plutôt le sort qui arrive.',
    balthazar: 'Le temps, c’est de l’or. Je t’en accorde donc très peu.',
    zephyrin: 'Mes sourcils se froncent tout seuls quand ils sentent la victoire.',
    petronille: 'Chaque pièce de ma robe vient d’un adversaire battu. Il me reste de la place.',
    leopold: 'Admire. Puis incline-toi. Dans cet ordre.'
  };

  // Tournois : un tableau de 8 sorciers (quart, demi, finale), précédé de pre duels de qualification pour les coupes les plus longues.
  // levels : [niveau le plus bas, niveau le plus haut] des adversaires ; les niveaux de chaque duel sont tirés au hasard à chaque participation (cupLevels, js/main.js).
  DS.ROUNDS = ['Quart de finale', 'Demi-finale', 'Finale'];
  DS.CUPS = [
    { id: 'apprentis', name: 'Coupe des Apprentis', levels: [10, 14], pre: 0, gold: 100, xp: 80, color: '#9fe8c0' },
    { id: 'bronze', name: 'Coupe de Bronze', levels: [13, 17], pre: 0, gold: 200, xp: 160, color: '#e0a36b' },
    { id: 'argent', name: 'Coupe d’Argent', levels: [17, 22], pre: 1, gold: 350, xp: 280, color: '#d5dbe6' },
    { id: 'or', name: 'Coupe d’Or', levels: [20, 25], pre: 2, gold: 550, xp: 420, color: '#ffd978' },
    { id: 'archimages', name: 'Coupe des Archimages', levels: [20, 30], pre: 3, gold: 900, xp: 650, color: '#c58bff' }
  ];
  // Récompenses d'un duel contre un adversaire de niveau L.
  DS.reward = function (win, L) { return win ? { gold: 20 + 6 * L, xp: 30 + 12 * L } : { gold: 6 + 2 * L, xp: 10 + 4 * L }; };

  DS.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };

  // ── Le magasin de magie : une boutique à fouiller (img/magasin.jpg, 1376 × 768). Chaque zone r = [x, y, largeur, hauteur] en pixels de l'image.
  // hide : la zone peut cacher un sort (parchemins, coffre, note) · gold : on peut y trouver des pièces oubliées · pid : une potion, toujours là.
  // text : ce qu'on trouve quand il n'y a rien d'utile · found : la phrase quand un sort s'y cache ({sort} = son nom).
  DS.SHOP_W = 1376; DS.SHOP_H = 768;
  DS.SHOP_SPOTS = [
    { id: 'p1', name: 'Une pile de parchemins', r: [118, 150, 215, 85], hide: true, icon: '📜' },
    { id: 'p2', name: 'Une montagne de parchemins', r: [330, 60, 275, 170], hide: true, icon: '📜' },
    { id: 'p3', name: 'Un parchemin debout', r: [640, 80, 80, 150], hide: true, icon: '📜' },
    { id: 'p4', name: 'Des parchemins ficelés', r: [800, 60, 230, 170], hide: true, icon: '📜' },
    { id: 'p5', name: 'Trois vieux rouleaux', r: [40, 300, 190, 85], hide: true, icon: '📜' },
    { id: 'p6', name: 'Une pile de parchemins', r: [240, 250, 230, 140], hide: true, icon: '📜' },
    { id: 'p7', name: 'Un tas de parchemins', r: [480, 250, 250, 140], hide: true, icon: '📜' },
    { id: 'p8', name: 'Des parchemins en vrac', r: [740, 250, 160, 78], hide: true, icon: '📜' },
    { id: 'p9', name: 'Une pile de parchemins', r: [905, 250, 175, 140], hide: true, icon: '📜' },
    { id: 'p10', name: 'Des rouleaux près du coffre', r: [118, 420, 122, 140], hide: true, icon: '📜' },
    { id: 'p11', name: 'Des parchemins derrière les fioles', r: [300, 398, 220, 44], hide: true, icon: '📜' },
    { id: 'p12', name: 'Un parchemin déroulé', r: [700, 430, 80, 120], hide: true, icon: '📜' },
    { id: 'p13', name: 'Une pile de parchemins', r: [782, 420, 158, 140], hide: true, icon: '📜' },
    { id: 'p14', name: 'Des parchemins poussiéreux', r: [945, 420, 180, 140], hide: true, icon: '📜' },
    { id: 'chest', name: 'Un coffre', r: [20, 445, 110, 115], hide: true, icon: '🧰', text: 'Tu soulèves le couvercle… Des vieilles chaussettes du marchand. Tu le refermes vite.', found: 'Tu soulèves le couvercle… Un parchemin brille à l’intérieur : c’est le sort {sort} !' },
    { id: 'note', name: 'Une note épinglée', r: [1105, 135, 60, 95], hide: true, icon: '📝', text: 'Une note du marchand : « Je reviens dans 5 minutes. » Elle date de trois ans.', found: 'Ce n’est pas une note : quelqu’un a écrit un sort dessus, tout petit. C’est {sort} !' },
    { id: 'lantern1', name: 'Une lanterne', r: [30, 40, 110, 170], icon: '🏮', text: 'Une lanterne. Elle éclaire, c’est déjà pas mal.' },
    { id: 'lantern2', name: 'Une lanterne', r: [1265, 110, 105, 200], icon: '🏮', text: 'Une lanterne qui grésille. Un papillon de nuit tourne autour, très occupé.' },
    { id: 'catapult', name: 'Une mini catapulte', r: [700, 150, 105, 80], icon: '🪃', text: 'Une mini catapulte. Elle lance… des miettes. Le marchand s’en sert pour nourrir les souris.' },
    { id: 'herbs1', name: 'Des herbes séchées', r: [1030, 140, 70, 110], icon: '🌿', text: 'Des herbes séchées. Ça sent la lavande et un peu les chaussettes.' },
    { id: 'coins1', name: 'Des pièces anciennes', r: [1165, 120, 105, 105], gold: true, icon: '<i class="coin"></i>', text: 'Des pièces anciennes, collées à l’étagère avec de la résine. Impossible de les décoller.' },
    { id: 'glasses', name: 'Des lunettes de sorcier', r: [745, 330, 155, 65], icon: '👓', text: 'Des lunettes de sorcier. Tout paraît plus magique… et plus flou.' },
    { id: 'amulets', name: 'Des amulettes de pierre', r: [1050, 300, 85, 100], gold: true, icon: '🧿', text: 'Des amulettes de pierre. Celle-ci protège contre le hoquet. Celle-là, contre les lundis.' },
    { id: 'jar1', name: 'Un bocal de poudre', r: [1160, 305, 55, 90], gold: true, icon: '🫙', text: 'Un bocal de poudre grise. L’étiquette dit : NE PAS ÉTERNUER.' },
    { id: 'jar2', name: 'Un bocal de poudre violette', r: [1255, 300, 60, 90], icon: '🫙', text: 'De la poudre violette. Le marchand dit que c’est du sucre. Il rit bizarrement en le disant.' },
    { id: 'flask1', name: 'Une fiole rouge sans étiquette', r: [240, 440, 70, 120], icon: '🧪', text: 'Une fiole sans étiquette. Le marchand ne se souvient plus de ce que c’est. Mieux vaut ne pas y goûter.' },
    { id: 'flask2', name: 'Une fiole rouge sombre', r: [340, 440, 70, 120], icon: '🧪', text: 'Du jus de betterave. Le marchand le vend aux sorciers qui veulent un nez tout rouge.' },
    { id: 'flask3', name: 'Une fiole bleue', r: [440, 440, 70, 120], icon: '🧪', text: 'Une fiole bleue qui tourbillonne. Si tu la secoues, elle fait des bulles. C’est tout.' },
    { id: 'flask4', name: 'Une fiole verte', r: [540, 440, 70, 120], icon: '🧪', text: 'Une potion verte avec des paillettes. « Pour faire briller les crapauds », dit l’étiquette.' },
    { id: 'flask5', name: 'Une petite fiole jaune', r: [648, 470, 56, 90], icon: '🧪', text: 'Une fiole de jus de citron. Pour les crêpes du marchand.' },
    { id: 'prism1', name: 'Un prisme de cristal', r: [840, 490, 85, 70], icon: '🔮', text: 'Un prisme magique. Il fait des arcs-en-ciel au plafond. Joli, mais ça ne sert à rien en duel.' },
    { id: 'prism2', name: 'Un prisme multicolore', r: [940, 495, 100, 65], icon: '🔮', text: 'Un prisme qui change de couleur quand on le regarde. Il devient vert : il est timide.' },
    { id: 'herbs2', name: 'Un bouquet de lavande', r: [1130, 420, 75, 140], icon: '💐', text: 'Un bouquet de lavande. Pour les sorciers qui veulent sentir bon pendant le duel.' },
    { id: 'herbs3', name: 'Des herbes en bouquet', r: [1240, 420, 80, 140], gold: true, icon: '🌾', text: 'Des herbes piquantes. Tu te piques. Aïe.' },
    { id: 'bottles', name: 'Des bouteilles grises', r: [660, 590, 65, 100], gold: true, icon: '🍶', text: 'Des bouteilles d’eau de pluie. « Du mardi », précise l’étiquette.' },
    { id: 'crystal', name: 'Une boule de cristal', r: [738, 610, 65, 80], icon: '🔮', text: 'La boule de cristal te montre… toi, en train de regarder une boule de cristal.' },
    { id: 'snake', name: 'Un serpent endormi', r: [800, 640, 195, 60], icon: '🐍', text: 'Chut ! Le serpent dort. C’est lui qui garde les potions, paraît-il. Il ronfle.' },
    { id: 'flasks2', name: 'Des fioles bleues et vertes', r: [800, 570, 210, 70], icon: '⚗️', text: 'Des potions pas encore étiquetées. Le marchand n’a pas fini de les goûter. Il a le ventre qui gargouille.' },
    { id: 'bigred', name: 'Une énorme fiole rouge', r: [1030, 520, 120, 160], icon: '🍷', text: 'Une énorme fiole de jus de cerise. Le marchand la garde pour lui. Pas touche.' },
    { id: 'flasks3', name: 'Des fioles rouges', r: [1155, 560, 215, 120], icon: '🧪', text: 'Du sirop contre la toux des dragons. Pas pour les sorciers : ça fait cracher des étincelles.' },
    { id: 'key1', name: 'Une clé rouillée', r: [135, 700, 85, 55], icon: '🗝️', text: 'Une clé rouillée. Elle n’ouvre rien ici… à ta connaissance.' },
    { id: 'key2', name: 'Des clés et des rouages', r: [265, 690, 120, 65], gold: true, icon: '⚙️', text: 'Des rouages et des vieilles clés. Il paraît qu’ensemble, ils formaient une horloge.' },
    { id: 'coins2', name: 'Des piles d’or', r: [0, 680, 135, 88], icon: '<i class="coin"></i>', text: 'L’or du marchand. Il te regarde du coin de l’œil. Pas touche !' },
    { id: 'coins3', name: 'L’or du marchand', r: [1275, 680, 101, 88], icon: '<i class="coin"></i>', text: 'Encore de l’or. Le marchand fait de bonnes affaires avec les apprentis.' },
    { id: 'feather1', name: 'Une plume violette', r: [990, 690, 160, 78], gold: true, icon: '🪶', text: 'Une plume de phénix. Elle écrit toute seule, mais seulement des bêtises.' },
    { id: 'feather2', name: 'Une plume bleue', r: [1175, 660, 105, 95], icon: '🪶', text: 'Une plume d’oiseau-tonnerre. Elle te chatouille le nez. Atchoum !' },
    { id: 'pot-vie', name: 'Potion de vie', r: [150, 580, 100, 95], pid: 'potion-vie' },
    { id: 'pot-energie', name: 'Potion d’énergie', r: [295, 570, 105, 105], pid: 'potion-energie' },
    { id: 'pot-elixir', name: 'Élixir pur', r: [400, 570, 105, 105], pid: 'potion-elixir' },
    { id: 'pot-force', name: 'Potion de force', r: [500, 570, 105, 105], pid: 'potion-force' },
    { id: 'pot-bouclier', name: 'Potion de bouclier', r: [600, 585, 58, 85], pid: 'potion-bouclier' }
  ];
  // La deuxième salle : l'arrière-boutique (img/magasin2.jpg, 1385 × 752). Mêmes règles ; les identifiants commencent par b-.
  DS.SHOP_SPOTS2 = [
    { id: 'b-p1', name: 'Un parchemin déroulé', r: [12, 18, 140, 115], hide: true, icon: '📜' },
    { id: 'b-p2', name: 'Une montagne de parchemins', r: [330, 0, 290, 205], hide: true, icon: '📜' },
    { id: 'b-p3', name: 'Un grand parchemin au mur', r: [598, 130, 195, 150], hide: true, icon: '📜' },
    { id: 'b-p4', name: 'Des parchemins ficelés', r: [830, 0, 250, 195], hide: true, icon: '📜' },
    { id: 'b-p5', name: 'Un rouleau sur la caisse', r: [95, 375, 85, 75], hide: true, icon: '📜' },
    { id: 'b-p6', name: 'Des parchemins sur la table', r: [430, 335, 295, 150], hide: true, icon: '📜' },
    { id: 'b-p7', name: 'Un paquet de rouleaux', r: [390, 505, 105, 115], hide: true, icon: '📜' },
    { id: 'b-p8', name: 'Des rouleaux sous le comptoir', r: [745, 490, 200, 60], hide: true, icon: '📜' },
    { id: 'b-book1', name: 'Le grand livre ouvert', r: [580, 525, 255, 137], hide: true, icon: '📖', text: 'Le grand livre du marchand : ses comptes. Il écrit très mal.', found: 'Entre deux pages du grand livre, un parchemin : c’est le sort {sort} !' },
    { id: 'b-book2', name: 'Un livre sur un lutrin', r: [955, 268, 175, 115], hide: true, icon: '📕', text: 'Un livre de recettes de potions. Toutes les pages collent.', found: 'Une page du livre brille : c’est {sort} !' },
    { id: 'b-chest', name: 'Un coffre', r: [20, 390, 120, 110], hide: true, icon: '🧰', text: 'Le coffre est plein de boutons de manteau. Des centaines.', found: 'Au fond du coffre, un parchemin : le sort {sort} !' },
    { id: 'b-herbs1', name: 'Des herbes suspendues', r: [190, 140, 130, 115], icon: '🌿', text: 'Des herbes qui sèchent. Une araignée y a fait sa toile. Elle a l’air contente.' },
    { id: 'b-herbs2', name: 'Des bouquets séchés', r: [1035, 65, 130, 125], icon: '🌾', text: 'Du thym, du romarin, et une plante que personne ne reconnaît.' },
    { id: 'b-lantern', name: 'Une lanterne', r: [1285, 55, 100, 205], icon: '🏮', text: 'La lanterne de l’arrière-boutique. Elle grésille un peu.' },
    { id: 'b-root', name: 'Une racine tordue', r: [1160, 125, 115, 140], gold: true, icon: '🪵', text: 'Une racine de mandragore. Ne la tire pas : elle crie.' },
    { id: 'b-jars1', name: 'Des bocaux sur l’étagère', r: [848, 198, 205, 70], gold: true, icon: '🫙', text: 'Des bocaux d’yeux de triton. Ils te regardent.' },
    { id: 'b-fairy1', name: 'Une fée sous cloche', r: [148, 288, 112, 135], icon: '🧚', text: 'Une petite fée dort sous sa cloche de verre. Elle ronfle, minuscule.' },
    { id: 'b-golem', name: 'Un golem de bois', r: [245, 248, 112, 185], icon: '🪆', text: 'Un golem de bois. Il cligne des yeux quand tu ne regardes pas.' },
    { id: 'b-vials', name: 'Des fioles colorées', r: [340, 268, 215, 115], icon: '🧪', text: 'Des potions ratées. Le marchand les garde « au cas où ».' },
    { id: 'b-key', name: 'Une clé pendue', r: [540, 195, 50, 80], gold: true, icon: '🗝️', text: 'Une vieille clé. Celle de l’arrière-boutique ? Non, tu es déjà dedans.' },
    { id: 'b-fairy2', name: 'Une fée qui danse', r: [138, 485, 130, 165], icon: '🧚', text: 'Cette fée-là danse sous sa cloche. Elle te fait un clin d’œil.' },
    { id: 'b-golem2', name: 'Un petit golem', r: [35, 525, 90, 115], icon: '🪆', text: 'Un petit golem de pierre qui monte la garde près de l’or. Il bâille.' },
    { id: 'b-gold1', name: 'Des piles d’or', r: [0, 605, 135, 57], icon: '🪙', text: 'L’or du marchand. Le petit golem te surveille.' },
    { id: 'b-gold2', name: 'Un tas de pièces', r: [770, 355, 190, 105], gold: true, icon: '🪙', text: 'Un tas de pièces sur le comptoir. Le marchand les compte dix fois par jour.' },
    { id: 'b-scales', name: 'Une balance', r: [1175, 295, 125, 105], icon: '⚖️', text: 'La balance du marchand. Elle penche toujours de son côté.' },
    { id: 'b-crystals', name: 'Des cristaux', r: [1265, 345, 115, 105], gold: true, icon: '💎', text: 'Des cristaux qui chantent quand on les frotte. Faux.' },
    { id: 'b-jars2', name: 'Des bocaux à plantes', r: [1138, 445, 105, 125], icon: '🪴', text: 'Des plantes en bocal. Celle-ci bouge. Celle-là te suit du regard.' },
    { id: 'b-flasks', name: 'Des fioles rouges', r: [1148, 528, 235, 134], icon: '🧪', text: 'Du sirop de fraise. Pour les crêpes du dimanche.' },
    { id: 'b-flasks2', name: 'Deux fioles', r: [928, 548, 115, 114], icon: '⚗️', text: 'Une bleue, une verte. Le marchand ne sait plus laquelle est laquelle.' },
    { id: 'b-gears', name: 'Des rouages', r: [285, 638, 125, 24], icon: '⚙️', text: 'Des rouages d’horloge. Il en manque toujours un.' },
    { id: 'b-feather', name: 'Une plume', r: [1025, 648, 125, 14], gold: true, icon: '🪶', text: 'Une plume de paon. Elle écrit en couleurs.' },
    { id: 'b-pot-vie', name: 'Potion de vie', r: [328, 188, 48, 62], pid: 'potion-vie' },
    { id: 'b-pot-energie', name: 'Potion d’énergie', r: [378, 188, 48, 62], pid: 'potion-energie' },
    { id: 'b-pot-elixir', name: 'Élixir pur', r: [428, 188, 48, 62], pid: 'potion-elixir' },
    { id: 'b-pot-force', name: 'Potion de force', r: [478, 188, 48, 62], pid: 'potion-force' },
    { id: 'b-pot-bouclier', name: 'Potion de bouclier', r: [72, 270, 62, 85], pid: 'potion-bouclier' }
  ];
  DS.SHOP_ROOMS = [{ name: 'La boutique', img: 'img/magasin.jpg', w: 1376, h: 768, spots: DS.SHOP_SPOTS }, { name: 'L’arrière-boutique', img: 'img/magasin2.jpg', w: 1385, h: 662, spots: DS.SHOP_SPOTS2 }];
  // Les parchemins qui ne servent à rien : on en tire un au hasard pour chaque pile sans sort.
  DS.SHOP_JUNK = [
    'Une recette de soupe aux limaces. Trois limaces, un chou, et beaucoup de courage.',
    'La liste d’épicerie du marchand : 2 crapauds, 1 œil de triton, du pain.',
    'Une carte au trésor… d’un trésor déjà trouvé. Quelqu’un a écrit dessus : « Trop tard ! »',
    'Un poème d’amour signé « ton admirateur zecret ». Ce n’est pas un sort.',
    'Rien. Un parchemin complètement vide. Même pas une tache.',
    'Des devoirs de potions, corrigés en rouge : 3 sur 10.',
    'Un vieux sort… raturé partout. Impossible de le lire.',
    'Le mode d’emploi d’un balai. Étape 1 : monter dessus.',
    'Un dessin de dragon fait par un enfant. Il est très réussi.',
    'Un sort qui fait pousser la barbe. Dommage : il est périmé depuis cent ans.',
    'Une chanson pour endormir les trolls. Les paroles sont surtout des ronflements.',
    'La facture du marchand pour 200 chandelles. Il a oublié de la payer.',
    'Une lettre : « Cher marchand, votre serpent a encore mangé mon chapeau. »',
    'Le règlement de l’école, en 412 articles. Article 1 : pas de dragons en classe.'
  ];
  DS.SHOP_FOUND = 'Tu déroules le parchemin… Des signes se mettent à briller : c’est le sort {sort} !';

  // ── La Tour des Épreuves (js/extras.js) : on grimpe étage par étage, un duel par étage, contre un adversaire du niveau de l'étage.
  // Chaque étage (à partir du 3e) tire au sort une ou deux règles qui changent le duel. Les champs sont lus par js/duel.js (D.mod) et js/main.js (gold).
  //   pHp, foeHp, pMana : vie et énergie multipliées · regen : énergie qui revient · cost : prix des sorts · speed : vitesse de tous les projectiles
  //   fireDmg : dégâts de nos sorts de feu · pDmg : dégâts de tous nos sorts · shieldT : durée de notre bouclier au clic · noShield : plus de bouclier au clic
  //   comboLv : niveaux en plus pour le dernier sort d'un enchaînement · dodge : chance que nos sorts le traversent · leech : part des dégâts rendue en vie (des deux côtés)
  //   foeSpeed : rapidité de l'adversaire · gold : or gagné à l'étage · heals : soins de l'adversaire
  DS.TOWER_MODS = [
    { id: 'brasier', icon: '🔥', name: 'Brasier', desc: 'Tes sorts de feu font +50 % de dégâts, mais ton bouclier tient deux fois moins longtemps.', fireDmg: 1.5, shieldT: 0.5 },
    { id: 'geant', icon: '🗿', name: 'Le géant', desc: 'L’adversaire a 50 % de vie en plus… et l’étage rapporte 50 % d’or en plus.', foeHp: 1.5, gold: 1.5 },
    { id: 'verre', icon: '🫧', name: 'Sorciers de verre', desc: 'Vous n’avez que 60 % de votre vie, tous les deux. Ça va vite !', pHp: 0.6, foeHp: 0.6 },
    { id: 'sansbouclier', icon: '🔨', name: 'Mains nues', desc: 'Pas de bouclier au clic : seules tes protections te défendent. En échange, un enchaînement réussi vaut deux niveaux de plus.', noShield: true, comboLv: 1 },
    { id: 'source', icon: '🔷', name: 'Source tarie', desc: 'Ton énergie revient deux fois moins vite, mais tes sorts coûtent moitié prix.', regen: 0.5, cost: 0.5 },
    { id: 'tempete', icon: '💨', name: 'Grand vent', desc: 'Tous les projectiles filent 40 % plus vite, les tiens comme les siens.', speed: 1.4 },
    { id: 'brume', icon: '🌫️', name: 'Brume épaisse', desc: 'Un de tes sorts sur trois le traverse sans le toucher… mais ceux qui touchent font +40 %.', dodge: 0.34, pDmg: 1.4 },
    { id: 'vampire', icon: '🧛', name: 'Nuit des vampires', desc: 'Chaque blessure infligée rend un tiers de sa valeur en vie, à toi comme à lui.', leech: 0.34 },
    { id: 'eclair', icon: '⚡', name: 'Adversaire fébrile', desc: 'Il réfléchit et trace deux fois plus vite. Reste sur tes gardes !', foeSpeed: 1.6 },
    { id: 'guerisseur', icon: '🌿', name: 'Le guérisseur', desc: 'Il se soigne bien plus souvent. Il faut frapper vite et fort.', heals: 4 },
    { id: 'tresor', icon: '💰', name: 'Étage au trésor', desc: 'Rien ne change au duel… mais l’étage rapporte le double d’or.', gold: 2 },
    { id: 'colosse', icon: '🏔️', name: 'Le colosse', desc: 'Il a le double de vie et frappe un peu plus fort. Toi, tes sorts font +30 %.', foeHp: 2, foeDmg: 1.2, pDmg: 1.3 }
  ];
  DS.TOWER_STEP = 5; // un palier tous les 5 étages : une défaite ramène au dernier palier, et le palier offre un coffre
  DS.towerFloorOf = function (floor) { return { level: floor, mods: floor < 3 ? 0 : floor < 10 ? 1 : 2, boss: floor % 10 === 0 }; }; // le 10e, 20e… étage : un maître de la tour

  // ── Le laboratoire d'alchimie (js/extras.js) : des ingrédients, à trouver au magasin de magie (parmi les objets qui ne servent à rien) et après un duel gagné.
  DS.INGREDIENTS = [
    { id: 'plume', icon: '🪶', name: 'Plume de phénix', color: '#ffb347', desc: 'Encore tiède. Elle sent le feu de camp.' },
    { id: 'ecaille', icon: '🐉', name: 'Écaille de dragon', color: '#7a3b1c', desc: 'Dure comme la pierre, chaude comme la braise.' },
    { id: 'larme', icon: '🌙', name: 'Larme de lune', color: '#cfe0ff', desc: 'Une goutte d’argent qui brille toute seule.' },
    { id: 'racine', icon: '🌱', name: 'Racine de mandragore', color: '#8dffb0', desc: 'Elle a crié quand on l’a arrachée. Un peu.' },
    { id: 'poudre', icon: '✨', name: 'Poudre d’étoile', color: '#ffe9a0', desc: 'Scintille et grésille entre les doigts.' },
    { id: 'venin', icon: '🐍', name: 'Venin de vipère', color: '#5fd35f', desc: 'Vert, épais, et il bouge tout seul dans sa fiole.' },
    { id: 'cendre', icon: '🔥', name: 'Cendre de salamandre', color: '#ff6a1a', desc: 'Ne s’éteint jamais tout à fait.' },
    { id: 'givre', icon: '❄️', name: 'Cristal de givre', color: '#bfe6ff', desc: 'Froid à en faire mal aux doigts.' }
  ];
  // Recettes : deux ingrédients, parfois un sort connu comme base (base). Résultat : une potion (potion : id, qty fioles) ou un sort appris pour toujours (spell).
  // Le codex les cache tant qu'on ne les a pas trouvées ; on les découvre en essayant.
  DS.RECIPES = [
    { id: 'vie', ins: ['larme', 'racine'], potion: 'vie', qty: 2, name: 'Potion de vie' },
    { id: 'energie', ins: ['poudre', 'larme'], potion: 'energie', qty: 2, name: 'Potion d’énergie' },
    { id: 'elixir', ins: ['racine', 'givre'], potion: 'elixir', qty: 1, name: 'Élixir pur' },
    { id: 'force', ins: ['ecaille', 'cendre'], potion: 'force', qty: 1, name: 'Potion de force' },
    { id: 'bouclier', ins: ['ecaille', 'givre'], potion: 'bouclier', qty: 1, name: 'Potion de bouclier' },
    { id: 'ressac', ins: ['plume', 'poudre'], potion: 'energie', qty: 3, name: 'Trois potions d’énergie' },
    { id: 'infernus', ins: ['cendre', 'plume'], base: 'ignis', spell: 'infernus', name: 'Infernus' },
    { id: 'spina', ins: ['venin', 'racine'], base: 'toxicus', spell: 'spina', name: 'Spina' },
    { id: 'stiria', ins: ['givre', 'poudre'], base: 'glacius', spell: 'stiria', name: 'Stiria' },
    { id: 'orbis', ins: ['poudre', 'ecaille'], base: 'fulgur', spell: 'orbis', name: 'Orbis' },
    { id: 'nocturna', ins: ['larme', 'venin'], base: 'vespera', spell: 'nocturna', name: 'Nocturna' },
    { id: 'saxum', ins: ['racine', 'ecaille'], base: 'terra', spell: 'saxum', name: 'Saxum' },
    { id: 'arcanum', ins: ['givre', 'larme'], base: 'aegis', spell: 'arcanum', name: 'Arcanum' },
    { id: 'evanesco', ins: ['plume', 'larme'], base: 'vapor', spell: 'evanesco', name: 'Evanesco' },
    { id: 'meteorus', ins: ['cendre', 'poudre'], base: 'foudrus', spell: 'meteorus', name: 'Meteorus' },
    { id: 'vampyra', ins: ['venin', 'cendre'], base: 'siphon', spell: 'vampyra', name: 'Vampyra' },
    { id: 'blizzardus', ins: ['givre', 'plume'], base: 'tornado', spell: 'blizzardus', name: 'Blizzardus' },
    { id: 'vigor', ins: ['racine', 'plume'], base: 'cura', spell: 'vigor', name: 'Vigor' }
  ];

  // ── Les familiers (js/extras.js) : un compagnon qui vient au duel et y apporte un pouvoir passif. Trois niveaux : on le nourrit (en or) pour qu'il évolue.
  // names : son nom à chaque niveau · feed : prix pour passer au niveau 2, puis 3 · stats(lv) : son pouvoir, lu par js/duel.js (D.fam)
  //   regen : énergie qui revient plus vite (×) · shot + every : il tire tout seul · guard : part des dégâts reçus qu'il absorbe · hps : vie rendue par seconde quand on est à moins de la moitié
  //   cd : recharge du bouclier (×) et ring : anneau de parade plus grand (×)
  DS.FAMILIARS = [
    { id: 'chouette', icon: '🦉', color: '#cdb8ff', price: 120, feed: [90, 180], names: ['Chouette astrale', 'Grand-duc astral', 'Hibou des constellations'], desc: 'Elle veille sur ta réserve de magie.',
      power: function (lv) { return { regen: [1.15, 1.3, 1.5][lv - 1] }; }, text: function (lv) { return 'Ton énergie revient ' + [15, 30, 50][lv - 1] + ' % plus vite.'; } },
    { id: 'dragonneau', icon: '🐲', color: '#ff7a3a', price: 180, feed: [120, 240], names: ['Dragonneau', 'Dragon de braise', 'Dragon de l’aube'], desc: 'Il crache du feu sur ton adversaire, tout seul.',
      power: function (lv) { return { every: [7, 5.5, 4][lv - 1], shot: { id: 'fam-dragon', cat: 'attaque', name: 'Souffle', icon: '🔥', color: '#ff7a3a', dmg: [6, 9, 13][lv - 1], flight: 0.9, mana: 0, burn: { dps: 2, dur: 2 } } }; },
      text: function (lv) { return 'Une boule de feu de ' + [6, 9, 13][lv - 1] + ' dégâts toutes les ' + String([7, 5.5, 4][lv - 1]).replace('.', ',') + ' secondes.'; } },
    { id: 'golem', icon: '🗿', color: '#c9b79a', price: 150, feed: [100, 200], names: ['Golem de poche', 'Golem de granit', 'Golem des remparts'], desc: 'Il encaisse une partie des coups à ta place.',
      power: function (lv) { return { guard: [0.1, 0.18, 0.25][lv - 1] }; }, text: function (lv) { return 'Tu reçois ' + [10, 18, 25][lv - 1] + ' % de dégâts en moins.'; } },
    { id: 'fee', icon: '🧚', color: '#9fe8c0', price: 140, feed: [100, 200], names: ['Fée de cristal', 'Fée des sources', 'Reine des cristaux'], desc: 'Elle te soigne quand tu vas mal.',
      power: function (lv) { return { hps: [1, 1.6, 2.4][lv - 1] }; }, text: function (lv) { return 'Sous la moitié de ta vie, tu regagnes ' + String([1, 1.6, 2.4][lv - 1]).replace('.', ',') + ' point de vie par seconde.'; } },
    { id: 'chat', icon: '🐈‍⬛', color: '#b8b8c8', price: 130, feed: [90, 180], names: ['Chat de nuit', 'Chat de gouttière', 'Matou des ombres'], desc: 'Vif comme lui, ton bouclier revient plus vite.',
      power: function (lv) { return { cd: [0.75, 0.6, 0.45][lv - 1], ring: [1.05, 1.1, 1.18][lv - 1] }; }, text: function (lv) { return 'Ton bouclier se recharge ' + [25, 40, 55][lv - 1] + ' % plus vite, et son anneau est un peu plus grand.'; } }
  ];

  // ── L'aventure (js/aventure.js) : on quitte l'école par le tapis, et on traverse des biomes, case par case, avec les flèches. Des monstres y rôdent :
  // on les affronte comme en duel (js/duel.js : un monstre est un adversaire avec monster: true, dessiné par drawMonster dans js/art.js), et ils ne lancent que des sorts.
  // kind : sa silhouette (slime, bat, ghost, skeleton, golem, spider, wisp, dragon, yeti) · spells : les seuls sorts qu'il lance (5 au plus ; il ne trace rien, il crie le nom) · hp : vie (× celle d'un sorcier du même niveau) · size : taille
  var M = function (id, kind, name, title, color, spells, o) { var m = { id: id, kind: kind, name: name, title: title, color: color, spells: spells, monster: true, size: 1, hp: 1 }; for (var k in o || {}) m[k] = o[k]; return m; };
  DS.MONSTERS = [
    M('gluant', 'slime', 'Gluant', 'vert', '#6fd36f', ['scintilla', 'toxicus'], { eye: '#1b3a1b', taunts: ['Blorp… blorp…', 'Glou. Glou glou !'] }),
    M('chauvesouris', 'bat', 'Chauve-souris', 'de la forêt', '#5b3d7a', ['scintilla', 'vespera', 'tenebra'], { eye: '#ff5a5a', taunts: ['Scriiii !', 'Tes yeux ne te serviront à rien.'] }),
    M('follet', 'wisp', 'Feu follet', '', '#9fe8ff', ['scintilla', 'fulgur', 'lumina'], { taunts: ['Suis-moi… suis-moi…', 'Hi hi hi hi !'] }),
    M('araignee', 'spider', 'Araignée', 'géante', '#3a2a3a', ['toxicus', 'spina', 'tremor', 'scintilla'], { eye: '#ff3b3b', size: 1.3, hp: 1.3, taunts: ['Viens dans ma toile, petit sorcier…', 'Huit yeux pour te regarder perdre.'] }),
    M('gluantnoir', 'slime', 'Gluant', 'des marais', '#2f3f2f', ['toxicus', 'acidus', 'scintilla'], { eye: '#9fe8c0', taunts: ['Blorp.', 'Ça va coller…'] }),
    M('fantome', 'ghost', 'Fantôme', 'des marais', '#cfe0ff', ['vespera', 'somnus', 'evanesco', 'scintilla'], { eye: '#0d0b1c', taunts: ['Ouuuuuh…', 'Dors… dors…'] }),
    M('folletbleu', 'wisp', 'Follet', 'bleu', '#5fb8ff', ['aqua', 'fulgur', 'scintilla'], { taunts: ['Plouf !', 'Un petit bain ?'] }),
    M('vouivre', 'dragon', 'Vouivre', 'des marais', '#2f8a5a', ['aqua', 'vortex', 'toxicus', 'ignis'], { eye: '#ffe14a', size: 1.35, hp: 1.4, taunts: ['Mon marais, mes règles.', 'Je vais te noyer dans la vase.'] }),
    M('squelette', 'skeleton', 'Squelette', 'errant', '#4a2a5a', ['vespera', 'tenebra', 'fractura', 'scintilla'], { eye: '#ff7a3a', taunts: ['Clac clac clac.', 'Rejoins-moi sous le sable.'] }),
    M('scorpion', 'spider', 'Scorpion', 'des dunes', '#c9a25e', ['toxicus', 'spina', 'terra'], { eye: '#1b1b1b', taunts: ['Mon dard est vif.', 'Le désert n’a pas pitié.'] }),
    M('golemsable', 'golem', 'Golem', 'de sable', '#d9b36b', ['terra', 'saxum', 'tremor'], { eye: '#ffe14a', hp: 1.2, taunts: ['Grrrmmm.', 'Tu es sur mes terres.'] }),
    M('colosse', 'golem', 'Colosse', 'de cendre', '#5a5a66', ['terra', 'saxum', 'orbis', 'tremor', 'murus'], { eye: '#ff6a1a', size: 1.45, hp: 1.5, taunts: ['Rien ne m’ébrèche.', 'Les pierres se souviennent de toi.'] }),
    M('yeti', 'yeti', 'Yéti', '', '#e8f0ff', ['glacius', 'stiria', 'terra', 'scintilla'], { eye: '#2a3a6a', hp: 1.1, taunts: ['RRRAAAH !', 'Le froid ne me fait rien. Et toi ?'] }),
    M('chouetteneige', 'bat', 'Chouette', 'des neiges', '#f3f6ff', ['glacius', 'lumina', 'sagitta', 'scintilla'], { eye: '#ffd978', taunts: ['Hou. Hou.', 'Je vois tout, même la nuit.'] }),
    M('golemglace', 'golem', 'Golem', 'de glace', '#bfe6ff', ['glacius', 'stalagma', 'saxum'], { eye: '#5fb8ff', hp: 1.2, taunts: ['Crrrac.', 'Tu vas geler sur place.'] }),
    M('dragongivre', 'dragon', 'Dragon', 'de givre', '#9fd8ff', ['blizzardus', 'stiria', 'glacius', 'stalagma', 'sagitta'], { eye: '#ffffff', size: 1.4, hp: 1.5, taunts: ['Mon souffle est un hiver.', 'Personne ne redescend de ma montagne.'] }),
    M('espritlave', 'wisp', 'Esprit', 'de lave', '#ff7a3a', ['ignis', 'fulgur', 'scintilla'], { taunts: ['Ça chauffe !', 'Viens te brûler les doigts.'] }),
    M('salamandre', 'slime', 'Salamandre', 'de feu', '#ff5a2a', ['ignis', 'radius', 'scintilla'], { eye: '#ffe14a', taunts: ['Sssss…', 'Je vis dans les flammes.'] }),
    M('golemmagma', 'golem', 'Golem', 'de magma', '#7a2a1a', ['ignis', 'terra', 'bombus', 'tremor'], { eye: '#ffb347', hp: 1.3, taunts: ['Le sol va fondre sous toi.', 'BOUM.'] }),
    M('dragonfeu', 'dragon', 'Dragon', 'de feu', '#c9361b', ['infernus', 'flammurus', 'meteorus', 'ignis', 'fulgur'], { eye: '#ffe14a', size: 1.45, hp: 1.6, taunts: ['Tout brûle, à la fin.', 'Je ferai de toi un petit tas de cendres.'] }),
    M('spectre', 'ghost', 'Spectre', 'des ombres', '#8a7bff', ['vespera', 'nocturna', 'tenebra', 'silencio'], { eye: '#ffffff', taunts: ['Tais-toi… à jamais.', 'La nuit est à moi.'] }),
    M('squelettemage', 'skeleton', 'Squelette', 'mage', '#2a1a40', ['vampyra', 'toxicus', 'fractura', 'inversium', 'vespera'], { eye: '#c58bff', hp: 1.2, taunts: ['J’ai eu mille ans pour apprendre.', 'Ta vie sera la mienne.'] }),
    M('vampire', 'bat', 'Chauve-souris', 'vampire', '#2a0a1a', ['vampyra', 'vespera', 'somnus', 'scintilla'], { eye: '#ff2a4a', taunts: ['J’ai soif…', 'Un cou bien tendre.'] }),
    M('roiombres', 'ghost', 'Le Roi', 'des Ombres', '#1d1b2c', ['nocturna', 'vampyra', 'tenebra', 'vortex', 'ritardo'], { eye: '#ff3b6b', size: 1.5, hp: 1.8, taunts: ['Agenouille-toi.', 'Tous ceux qui sont venus ici sont restés.'] })
  ];
  // Les biomes, dans l'ordre : niveau des monstres (le boss a deux niveaux de plus), monstres qu'on y croise, boss devant la sortie, couleurs et décor.
  // obst : les obstacles (tree, reed, rock, pine, lava, tomb) · deco : ce qui pousse entre les cases (flower, mushroom, bone, snow, ember, skull)
  DS.BIOMES = [
    { id: 'foret', name: 'Forêt enchantée', level: 1, monsters: ['gluant', 'chauvesouris', 'follet'], boss: 'araignee', ground: ['#3f7a3a', '#376b33'], obst: 'tree', deco: 'flower', sky: '#1f3a2a' },
    { id: 'marais', name: 'Marais brumeux', level: 4, monsters: ['gluantnoir', 'fantome', 'folletbleu'], boss: 'vouivre', ground: ['#4a5a3a', '#3f4f33'], obst: 'reed', deco: 'mushroom', sky: '#26302a' },
    { id: 'desert', name: 'Désert de cendres', level: 8, monsters: ['squelette', 'scorpion', 'golemsable'], boss: 'colosse', ground: ['#b89a60', '#a88a52'], obst: 'rock', deco: 'bone', sky: '#3a3028' },
    { id: 'givre', name: 'Montagne de givre', level: 12, monsters: ['yeti', 'chouetteneige', 'golemglace'], boss: 'dragongivre', ground: ['#dfe9f5', '#cdd9ea'], obst: 'pine', deco: 'snow', sky: '#263650' },
    { id: 'volcan', name: 'Volcan', level: 16, monsters: ['espritlave', 'salamandre', 'golemmagma'], boss: 'dragonfeu', ground: ['#4a3a3a', '#3f3030'], obst: 'lava', deco: 'ember', sky: '#2a1414' },
    { id: 'ombres', name: 'Royaume des Ombres', level: 21, monsters: ['spectre', 'squelettemage', 'vampire'], boss: 'roiombres', ground: ['#2a2440', '#221c36'], obst: 'tomb', deco: 'skull', sky: '#120e22' }
  ];
  DS.ADV_LOOP = 8; // une fois le dernier biome traversé, on recommence au premier, avec des monstres de 8 niveaux de plus

  // ── Le miroir magique 2.0 (js/extras.js) : chapeaux, baguette et titres. Chacun se débloque par un exploit (unlock(save) → true) ; les premiers sont offerts.
  // hat : forme du chapeau (js/art.js drawWizard) · hatCol · pattern · aura : couleur des étincelles autour de notre reflet.
  var lv = function (s, id) { return s.owned.indexOf(id) >= 0; }, all = function (s, ids) { return ids.every(function (id) { return lv(s, id); }); }, cup = function (s, id) { return (s.cups[id] || 0) > 0; };
  DS.HATS = [
    { id: 'classique', name: 'Chapeau de l’école', desc: 'Le chapeau pointu de tous les sorciers (à partir du niveau 16).', unlock: function () { return true; } },
    { id: 'etoiles', name: 'Chapeau étoilé', desc: 'Grand, bleu nuit, semé d’étoiles. Des étincelles dorées t’entourent.', hat: 'tall', hatCol: '#24418f', pattern: 'stars', aura: '#ffe9a0', how: '10 victoires', unlock: function (s) { return s.wins >= 10; } },
    { id: 'braise', name: 'Chapeau de braise', desc: 'Rouge feu, la pointe retombe. Il laisse des flammèches derrière lui.', hat: 'bent', hatCol: '#8a2433', aura: '#ff7a3a', how: 'Connaître Ignis, Infernus et Flammurus', unlock: function (s) { return all(s, ['ignis', 'infernus', 'flammurus']); } },
    { id: 'givre', name: 'Bonnet de givre', desc: 'Bleu glacier, bordé de blanc. Des flocons tombent autour de toi.', hat: 'cap', hatCol: '#5fb8ff', aura: '#dff6ff', how: 'Connaître Glacius, Stiria et Blizzardus', unlock: function (s) { return all(s, ['glacius', 'stiria', 'blizzardus']); } },
    { id: 'nuit', name: 'Haut-de-forme de minuit', desc: 'Noir comme la nuit, avec une lueur violette.', hat: 'top', hatCol: '#1d1b2c', aura: '#c58bff', how: 'Gagner la Coupe d’Argent', unlock: function (s) { return cup(s, 'argent'); } },
    { id: 'lune', name: 'Chapeau mou des lunes', desc: 'Tout mou, couvert de lunes. Une brume argentée te suit.', hat: 'floppy', hatCol: '#6a78c9', pattern: 'moons', aura: '#cfe0ff', how: 'Atteindre le niveau 16', unlock: function (s) { return s.plv >= 16; } },
    { id: 'tour', name: 'Turban du gardien', desc: 'Celui des maîtres de la Tour des Épreuves. Des éclats d’or dansent autour.', hat: 'turban', hatCol: '#e9c46a', aura: '#ffd978', how: 'Atteindre l’étage 20 de la tour', unlock: function (s) { return (s.tower.best || 0) >= 20; } }
  ];
  // La baguette : couleur du tracé (trail), bois du manche (handle), lueur de la pointe (core).
  DS.WAND_LOOKS = {
    trail: [
      { id: 'azur', name: 'Azur', color: '#3fa2ff', hi: '#7fc4ff', unlock: function () { return true; } },
      { id: 'emeraude', name: 'Émeraude', color: '#2fd27a', hi: '#9fffc8', how: '5 leçons réussies', unlock: function (s) { return Object.keys(s.lessons).length >= 5; } },
      { id: 'rubis', name: 'Rubis', color: '#ff4a5a', hi: '#ffb0b8', how: '25 victoires', unlock: function (s) { return s.wins >= 25; } },
      { id: 'or', name: 'Or', color: '#ffc63a', hi: '#fff0b8', how: 'Gagner une coupe', unlock: function (s) { return DS.CUPS.some(function (c) { return cup(s, c.id); }); } },
      { id: 'amethyste', name: 'Améthyste', color: '#b06bff', hi: '#e0c0ff', how: 'Découvrir 6 recettes', unlock: function (s) { return Object.keys(s.recipes).length >= 6; } },
      { id: 'argent', name: 'Argent', color: '#e8eef8', hi: '#ffffff', how: 'Un familier au niveau 3', unlock: function (s) { return Object.keys(s.fam.owned).some(function (id) { return s.fam.owned[id] >= 3; }); } }
    ],
    handle: [
      { id: 'cuir', name: 'Cuir brun', color: null, unlock: function () { return true; } },
      { id: 'nacre', name: 'Nacre', color: '#e8e0d0', how: '10 victoires', unlock: function (s) { return s.wins >= 10; } },
      { id: 'obsidienne', name: 'Obsidienne', color: '#1a1420', how: 'Atteindre l’étage 10 de la tour', unlock: function (s) { return (s.tower.best || 0) >= 10; } },
      { id: 'corail', name: 'Corail', color: '#ff7a6b', how: 'Gagner la Coupe des Apprentis', unlock: function (s) { return cup(s, 'apprentis'); } },
      { id: 'dore', name: 'Filigrane d’or', color: '#e2b44c', how: 'Gagner la Coupe d’Or', unlock: function (s) { return cup(s, 'or'); } }
    ],
    core: [
      { id: 'naturel', name: 'Cœur naturel', color: null, unlock: function () { return true; } },
      { id: 'phenix', name: 'Plume de phénix', color: '#ffb347', how: 'Découvrir 3 recettes', unlock: function (s) { return Object.keys(s.recipes).length >= 3; } },
      { id: 'licorne', name: 'Crin de licorne', color: '#ffffff', how: 'Atteindre le niveau 10', unlock: function (s) { return s.plv >= 10; } },
      { id: 'dragon', name: 'Ventricule de dragon', color: '#ff4a2a', how: 'Dragonneau au niveau 3', unlock: function (s) { return (s.fam.owned.dragonneau || 0) >= 3; } },
      { id: 'ombre', name: 'Ombre de minuit', color: '#9a7bff', how: 'Connaître Vespera, Nocturna et Vampyra', unlock: function (s) { return all(s, ['vespera', 'nocturna', 'vampyra']); } }
    ]
  };
  // Titres honorifiques : [au masculin, au féminin], affichés après le prénom.
  DS.TITLES = [
    { id: 'apprenti', names: ['l’Apprenti', 'l’Apprentie'], how: 'Offert', unlock: function () { return true; } },
    { id: 'flammes', names: ['l’Érudit des Flammes', 'l’Érudite des Flammes'], how: 'Connaître Ignis, Infernus, Flammurus et Meteorus', unlock: function (s) { return all(s, ['ignis', 'infernus', 'flammurus', 'meteorus']); } },
    { id: 'givre', names: ['le Maître du Givre', 'la Maîtresse du Givre'], how: 'Connaître Glacius, Stiria, Stalagma et Blizzardus', unlock: function (s) { return all(s, ['glacius', 'stiria', 'stalagma', 'blizzardus']); } },
    { id: 'foudre', names: ['Foudre vivante', 'Foudre vivante'], how: 'Connaître Fulgur, Tonnero, Foudrus et Orbis', unlock: function (s) { return all(s, ['fulgur', 'tonnero', 'foudrus', 'orbis']); } },
    { id: 'ombre', names: ['l’Ombre', 'l’Ombre'], how: 'Connaître Vespera, Nocturna, Vampyra et Tenebra', unlock: function (s) { return all(s, ['vespera', 'nocturna', 'vampyra', 'tenebra']); } },
    { id: 'vaillant', names: ['le Vaillant', 'la Vaillante'], how: '50 victoires', unlock: function (s) { return s.wins >= 50; } },
    { id: 'champion', names: ['le Champion', 'la Championne'], how: 'Gagner une coupe', unlock: function (s) { return DS.CUPS.some(function (c) { return cup(s, c.id); }); } },
    { id: 'archimage', names: ['l’Archimage', 'l’Archimage'], how: 'Gagner la Coupe des Archimages', unlock: function (s) { return cup(s, 'archimages'); } },
    { id: 'nuages', names: ['le Grimpeur des Nuages', 'la Grimpeuse des Nuages'], how: 'Atteindre l’étage 20 de la tour', unlock: function (s) { return (s.tower.best || 0) >= 20; } },
    { id: 'alchimiste', names: ['l’Alchimiste', 'l’Alchimiste'], how: 'Découvrir 10 recettes', unlock: function (s) { return Object.keys(s.recipes).length >= 10; } },
    { id: 'dresseur', names: ['le Dresseur', 'la Dresseuse'], how: 'Deux familiers au niveau 3', unlock: function (s) { return Object.keys(s.fam.owned).filter(function (id) { return s.fam.owned[id] >= 3; }).length >= 2; } },
    { id: 'erudit', names: ['le Grand Érudit', 'la Grande Érudite'], how: 'Connaître tous les sorts', unlock: function (s) { return s.owned.length >= DS.SPELLS.length; } }
  ];
})();
