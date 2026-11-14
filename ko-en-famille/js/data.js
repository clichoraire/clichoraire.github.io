// K.O. en Famille — données : boxeurs de la famille, statistiques, circuits et adversaires.
(function (root) {
  'use strict';
  const BX = root.BX = root.BX || {};
  BX.BOXING_KEYS = Object.freeze({ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'up',KeyZ:'pL',KeyX:'pR',Space:'upper'});
  BX.VERSION = '1.2';
  BX.SAVE_KEY = 'ko-famille.save';
  BX.STAT_MAX = 10;
  BX.statCap = progress => progress.beaten.includes('caribou') ? BX.STAT_MAX * 2 : BX.STAT_MAX;
  BX.WIN_POINTS = 2;            // points d’entraînement gagnés à la première victoire contre un adversaire

  BX.STATS = [
    { id: 'force',   name: 'Force',    icon: '💪', desc: 'Chaque coup fait plus mal.' },
    { id: 'vitesse', name: 'Rapidité', icon: '⚡', desc: 'Coups plus vifs, esquives plus courtes.' },
    { id: 'stamina', name: 'Stamina',  icon: '❤️', desc: 'Plus de stamina, encaisse mieux, se relève plus vite.' },
    { id: 'defense', name: 'Défense', icon: '🛡️', desc: '−5 % par point jusqu’à 10, puis −2 % par point (65 % au niveau 20).' },
    { id: 'souffle', name: 'Souffle',  icon: '🌬️', desc: 'Chaque esquive réussie redonne de la stamina.' },
  ];

  // La famille. size : 1 = adulte (taille vue de dos). Les têtes viennent des portraits partagés (family-heads.js).
  // Tout le monde commence faible (1 à 3) : c’est l’entraînement qui fait le champion.
  BX.CHARACTERS = [
    { id: 'matthieu', name: 'Matthieu', nick: 'Le Patron',          family: 'matt', size: 1.0,  tank: '#1e5bd8', gloves: '#d32f2f', stats: { force: 2, vitesse: 2, stamina: 2, souffle: 1 } },
    { id: 'josee',    name: 'Josée',    nick: 'L’Ouragan',          family: 'matt', size: 0.94, tank: '#b48cf0', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 2, souffle: 1 } },
    { id: 'richard',  name: 'Richard',  nick: 'Le Vétéran',         family: 'matt', size: 0.96, tank: '#8d6e63', gloves: '#d32f2f', stats: { force: 3, vitesse: 1, stamina: 2, souffle: 1 } },
    { id: 'mickael',  name: 'Mickael',  nick: 'Lunettes Laser',     family: 'bibi', size: 0.98, tank: '#00897b', gloves: '#d32f2f', stats: { force: 2, vitesse: 1, stamina: 2, souffle: 2 } },
    { id: 'marie',    name: 'Marie',    nick: 'La Mère Protectrice', family: 'bibi', size: 0.94, tank: '#e91e63', gloves: '#d32f2f', stats: { force: 1, vitesse: 2, stamina: 2, souffle: 2 } },
    { id: 'jeremie',  name: 'Jérémie',  nick: 'Téléportation',      family: 'jay',  size: 1.0,  tank: '#b71c1c', gloves: '#d32f2f', stats: { force: 2, vitesse: 3, stamina: 1, souffle: 1 } },
    { id: 'jessica',  name: 'Jessica',  nick: 'L’Aimant',           family: 'jay',  size: 0.94, tank: '#f9a825', gloves: '#d32f2f', stats: { force: 2, vitesse: 1, stamina: 2, souffle: 2 } },
    { id: 'josue',    name: 'Josué',    nick: 'Le Capitaine',       family: 'jo',   size: 0.98, tank: '#0f5a2a', gloves: '#d32f2f', stats: { force: 3, vitesse: 1, stamina: 1, souffle: 2 } },
    { id: 'emily',    name: 'Émily',    nick: 'Blizzard',           family: 'jo',   size: 0.94, tank: '#26c6da', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 1, souffle: 2 } },
    { id: 'zachary',  name: 'Zachary',  nick: 'La Fusée',           family: 'jo',   size: 1.0,  tank: '#d9342b', gloves: '#d32f2f', stats: { force: 2, vitesse: 2, stamina: 1, souffle: 2 } },
    { id: 'alexie',   name: 'Alexie',   nick: 'Licorne',            family: 'jo',   size: 0.86, tank: '#9b3fd4', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 2, souffle: 1 } },
    { id: 'eliott',   name: 'Eliott',   nick: 'Soccer Étoile',      family: 'jo',   size: 0.84, tank: '#2f9d3a', gloves: '#d32f2f', stats: { force: 1, vitesse: 2, stamina: 2, souffle: 2 } },
    { id: 'adam',     name: 'Adam',     nick: 'Pika-Choc',          family: 'bibi', size: 0.74, tank: '#ff8a1f', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 1, souffle: 2 } },
    { id: 'milo',     name: 'Milo',     nick: 'Zoom-Zoom',          family: 'bibi', size: 0.62, tank: '#3f9cff', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 1, souffle: 1 } },
    { id: 'edison',   name: 'Edison',   nick: 'Tornade',            family: 'jay',  size: 0.66, tank: '#f4c430', gloves: '#d32f2f', stats: { force: 1, vitesse: 3, stamina: 1, souffle: 2 } },
  ];
  BX.FAMILIES = { jo: 'Josué & Émily', bibi: 'Mickael & Marie', jay: 'Jérémie & Jessica', matt: 'Matthieu, Josée & Richard' };
  BX.charById = id => BX.CHARACTERS.find(c => c.id === id) || BX.CHARACTERS[0];
  // Les jeunes boxent, les adultes coachent. Chaque coach a une spécialité : +25 % d’XP dans ce stat.
  BX.KIDS = ['zachary', 'alexie', 'eliott', 'adam', 'milo', 'edison'];
  BX.COACHES = ['richard', 'matthieu', 'josee', 'mickael', 'marie', 'jeremie', 'jessica', 'josue', 'emily'];
  BX.COACH_SPEC = { richard: 'stamina', matthieu: 'force', josee: 'vitesse', mickael: 'souffle', marie: 'stamina', jeremie: 'vitesse', jessica: 'souffle', josue: 'force', emily: 'vitesse' };

  BX.CIRCUITS = [
    { id: 'bronze', name: 'Circuit Bronze',  belt: 'Ceinture de bronze', color: '#cd7f32', ropes: ['#c62828', '#f5f5f5', '#1565c0'], apron: '#0d2a5c' },
    { id: 'argent', name: 'Circuit Argent',  belt: 'Ceinture d’argent',  color: '#cfd8dc', ropes: ['#eceff1', '#90a4ae', '#eceff1'], apron: '#263238' },
    { id: 'or',     name: 'Circuit Or',      belt: 'Ceinture d’or',      color: '#ffd54f', ropes: ['#ffd54f', '#c62828', '#ffd54f'], apron: '#4a1c00' },
    { id: 'titre',  name: 'Championnat',     belt: 'Ceinture du Roi',    color: '#e040fb', ropes: ['#ffd600', '#7b1fa2', '#ffd600'], apron: '#1a0033' },
    { id: 'secret', name: '???',             belt: 'Ceinture de l’Ombre', color: '#7c4dff', ropes: ['#311b92', '#000000', '#311b92'], apron: '#07000f', secret: true },
  ];

  // ---------- Coups des adversaires ----------
  // from : gant qui frappe, vu de l’écran (L = gauche de l’écran, R = droite, C = les deux / le corps).
  // avoid : défenses qui marchent — 'L' / 'R' = esquive de ce côté, 'duck' = se pencher, 'block' = garde.
  // tell = durée du signal (s), hit = durée du coup, rec = ouverture après un coup raté (on peut cogner).
  // star : 'counter' = le premier coup dans l’ouverture donne une étoile ; 'early' = frapper pendant le signal / la pause.
  const mir = s => s === 'L' ? 'R' : s === 'R' ? 'L' : s;
  const Z = (from, o) => Object.assign({ pose: 'jab', from, tell: .55, hit: .16, rec: .55, dmg: 7, avoid: ['L', 'R', 'block'], name: 'Direct', glint: 1 }, o);
  const H = (from, o) => Object.assign({ pose: 'hook', from, tell: .75, hit: .22, rec: .9, dmg: 12, avoid: [mir(from), 'duck'], star: 'counter', name: 'Crochet', glint: 1 }, o);
  const U = (from, o) => Object.assign({ pose: 'upper', from, tell: .85, hit: .22, rec: 1, dmg: 15, avoid: ['L', 'R'], star: 'counter', name: 'Uppercut', glint: 1 }, o);
  const pair = (fn, id, o) => ({ [id + 'L']: fn('L', o), [id + 'R']: fn('R', o) });
  const sweep = (from, o) => Object.assign({ pose: 'sweep', from, tell: .85, hit: .3, rec: 1, dmg: 15, avoid: ['duck'], star: 'counter', name: 'Balayage' }, o);
  const toss = (from, o) => Object.assign({ pose: 'throw', from, tell: .9, hit: .34, rec: .9, dmg: 11, avoid: ['L', 'R', 'duck'], star: 'counter', name: 'Lancer' }, o);

  BX.BOXERS = [
    // ===== CIRCUIT BRONZE =====
    {
      id: 'bobby', circuit: 'bronze', name: 'Bobby Bédard', nick: 'Bédaine', city: 'Drummondville', record: '6 V – 31 D', weight: '142 kg', age: 44,
      job: 'Proprio du dépanneur Chez Bob', quote: 'Z’ai mangé trois poutines pour être en forme !',
      hp: 80, dmg: .75, spd: 1.3, maxCombo: 5, grit: 0, guard: { high: .45, both: 0, sw: [2, 4] }, gap: [1.5, 2.6], sfx: 'boing', taunt: 'poutine',
      look: { skin: '#f1c7a1', w: 1.28, h: .95, head: 1.06, belly: 1.15, shirt: { type: 'tank', c1: '#f4f1e8', stain: 1 }, trunks: '#1565c0', trim: '#fafafa', gloves: '#c62828', hair: { style: 'cap', c: '#5a3b22', cap: '#2e7d32' }, mustache: '#5a3b22', stubble: 1 },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .72 }), {
        belly: { pose: 'belly', from: 'C', tell: 1.0, hit: .26, rec: 1.15, dmg: 12, avoid: ['L', 'R'], star: 'counter', name: 'Bédaine-Boum', say: 'BÉDAINE-BOUM !', sfx: 'boing' },
        poutine: { pose: 'eat', free: true, dur: 2.3, heal: .12, star: 'early', name: 'Pause poutine', say: 'Une p’tite bouchée…', prop: 'poutine', sfx: 'munch' },
        burp: { pose: 'shout', from: 'C', tell: .8, hit: .55, rec: .5, dmg: 0, fx: 'stun', avoid: ['block'], name: 'Rot sonique', say: 'BUUURRP !', sfx: 'burp', chain: ['jabL'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['belly', 2], ['poutine', 1]],
      pool2: [['jabL', 3], ['jabR', 3], ['belly', 3], ['burp', 2], ['poutine', 1]],
      tips: ['Quand sa bedaine se met à gonfler, il ne regarde plus ni à gauche ni à droite… et après, il a de la misère à se replacer.',
        'Ce gars-là ne peut pas résister à sa poutine. Pendant qu’il mange, il ne pense plus du tout à se défendre.',
        'Regarde bien ses gants : il n’est jamais capable de tout protéger en même temps.'],
      taunts: ['Ma poutine refroidit, dépêche-toi !', 'Z’ai perdu 31 fois. Z’ai de l’EXPÉRIENCE !', 'Attention… j’ai mangé des bines ce matin.'],
    },
    {
      id: 'ginette', circuit: 'bronze', name: 'Ginette Lavigueur', nick: 'Arrêt-Stop', city: 'Laval', record: '15 V – 12 D', weight: '58 kg', age: 61,
      job: 'Brigadière scolaire depuis 34 ans', quote: 'On regarde des deux bords avant de traverser… MON POING !',
      hp: 95, dmg: .85, spd: 1.15, maxCombo: 4, grit: .2, guard: { high: .55, both: .05, sw: [1.6, 3] }, gap: [1.2, 2.2], sfx: 'whistle', taunt: 'stop',
      look: { skin: '#f3d0b5', w: .9, h: .9, head: 1, shirt: { type: 'vest', c1: '#ff6d00', c2: '#ffee58' }, trunks: '#37474f', trim: '#ffee58', gloves: '#fafafa', hair: { style: 'bun', c: '#cfcfcf' }, glasses: '#5d4037', lips: '#c2185b' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .55 }), pair(Z, 'jabf', { tell: .3, dmg: 5 }), {
        stop: { pose: 'stop', stop: true, dur: 1.5, go: 1.25, punish: 'ticket', name: 'ARRÊT !', say: 'ARRÊT !', sfx: 'whistle', star: 'counter' },
        ticket: { pose: 'jab', from: 'R', tell: .3, hit: .16, rec: .4, dmg: 13, avoid: [], name: 'Contravention', say: 'CONTRAVENTION !', glint: 1 },
        sign: H('R', { pose: 'hook', tell: .85, dmg: 14, name: 'Coup de pancarte', prop: 'sign', say: 'Pancarte !' }),
        cross: { pose: 'shout', from: 'C', tell: .45, hit: .2, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'On traverse !', say: 'On traverse en trois !', sfx: 'whistle', chain: ['jabfL', 'jabfR', 'jabfL'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['stop', 2], ['sign', 2]],
      pool2: [['jabL', 2], ['jabR', 2], ['stop', 3], ['sign', 2], ['cross', 2]],
      tips: ['Quand elle crie « ARRÊT ! », on dirait qu’elle n’attend que ça, que tu bouges… Une brigadière, ça surveille ceux qui traversent sur la rouge.',
        'Sa pancarte, elle la sort toujours du même côté. Le coup passe pas mal haut, aussi…',
        'Quand elle annonce qu’on traverse en trois, ce sont des petits coups vites et droits, rien de bien lourd.'],
      taunts: ['Tu marches pas dans la ligne !', 'Je vais appeler tes parents !', 'Pas de course dans le corridor !'],
    },
    {
      id: 'tibeuf', circuit: 'bronze', name: 'Gaétan Tremblay', nick: 'Ti-Bœuf', city: 'Saint-Félicien', record: '22 V – 4 D', weight: '131 kg', age: 38,
      job: 'Bûcheron au Lac-Saint-Jean', quote: 'Chez nous, les arbres tombent du premier coup. Toi aussi.',
      hp: 135, dmg: 1.05, spd: 1.0, maxCombo: 4, grit: .4, guard: { high: .6, both: .1, sw: [1.4, 2.6] }, gap: [1.0, 1.9], sfx: 'wood', taunt: 'flex',
      look: { skin: '#e8b48f', w: 1.32, h: 1.12, head: 1.05, belly: .35, shirt: { type: 'plaid', c1: '#c62828', c2: '#1b1b1b' }, trunks: '#3e2723', trim: '#ffb300', gloves: '#8d1c1c', hair: { style: 'tuque', c: '#7a3b1a', cap: '#d32f2f', c2: '#fafafa' }, beard: '#7a3b1a' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .55, dmg: 8 }), {
        hookR: H('R', { tell: .8, dmg: 14, name: 'Tronc d’arbre' }),
        chop: { pose: 'overhead', from: 'C', tell: 1.0, hit: .22, rec: 1.25, dmg: 18, avoid: ['L', 'R'], star: 'counter', name: 'Coup de hache', say: 'HO-HISSE !', sfx: 'wood' },
        stomp: { pose: 'stomp', from: 'C', tell: .85, hit: .4, rec: .3, dmg: 0, fx: 'stun', avoid: ['block'], name: 'Tremblement de pied', say: 'BOUM !', sfx: 'stomp', chain: ['hookR'] },
        timber: { pose: 'charge', from: 'C', tell: 1.15, hit: .3, rec: 1.6, dmg: 22, avoid: ['L', 'R'], star: 'counter', name: 'Timber !', say: 'TIMBERRRR !', sfx: 'wood' },
        // Coupe à blanc : trois crochets rapides qui changent de bord, puis la hache. Il faut lire chaque bras.
        hookfL: H('L', { tell: .4, dmg: 10, star: null, name: 'Coup de scie' }), hookfR: H('R', { tell: .4, dmg: 10, star: null, name: 'Coup de scie' }),
        clearcut: { pose: 'shout', from: 'C', tell: .5, hit: .15, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Coupe à blanc', say: 'COUPE À BLANC !', sfx: 'wood', chain: ['hookfL', 'hookfR', 'hookfL', 'chop'] },
        // Bûche volante : une bûche lancée à l’horizontale, à hauteur de tête. Seulement se pencher.
        log: toss('R', { projectile: 'log', tell: .7, dmg: 17, avoid: ['duck'], name: 'Bûche volante', say: 'ATTRAPE ÇA !', sfx: 'wood' }),
      }),
      pool: [['jabL', 3], ['jabR', 3], ['hookR', 2], ['chop', 2], ['stomp', 1], ['log', 2], ['clearcut', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['hookR', 2], ['chop', 2], ['stomp', 2], ['timber', 2], ['log', 2], ['clearcut', 2]],
      tips: ['Quand il lève ses deux poings au-dessus de sa tête, ça descend tout droit au milieu. Pas sûr que te faire petit suffise…',
        'As-tu remarqué qu’il lève le genou avant de faire trembler le ring ? Ceux qui ont les pieds bien plantés et la garde haute s’en tirent mieux.',
        'Quand il crie qu’il va couper à blanc, ça part d’un bord, puis de l’autre… comme une scie qui va et vient. Et ça finit toujours par la hache.',
        'Une bûche qui tourne à l’horizontale, à hauteur de tête… ça passe juste au-dessus de ceux qui se font petits.',
        'Après ses gros coups, il met du temps à se remettre d’aplomb. Un gars rapide en profiterait…'],
      taunts: ['Z’ai mangé des plus gros arbres que toi !', 'Mon chainsaw est plus jasant que toi.', 'Timberrrr… bientôt !'],
    },

    // ===== CIRCUIT ARGENT =====
    {
      id: 'coach', circuit: 'argent', name: 'Réal Pelletier', nick: 'Coach Sifflet', city: 'Sherbrooke', record: '27 V – 8 D', weight: '84 kg', age: 52,
      job: 'Prof d’éduc depuis 1998', quote: 'Vingt tours de gymnase… APRÈS le combat.',
      hp: 130, dmg: 1, spd: 1.0, maxCombo: 4, grit: .35, guard: { high: .5, both: .1, sw: [1.3, 2.6] }, gap: [1.0, 1.9], sfx: 'whistle', taunt: 'jacks',
      look: { skin: '#f0c39e', w: 1.02, h: 1.02, head: 1, shirt: { type: 'track', c1: '#1565c0', c2: '#fafafa' }, trunks: '#1565c0', trim: '#fafafa', gloves: '#e53935', hair: { style: 'balding', c: '#8d8d8d' }, mustache: '#6d6d6d', headband: '#e53935', whistle: 1 },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .48 }), pair(Z, 'jabf', { tell: .26, dmg: 5, glint: 0 }), {
        intervals: { pose: 'shout', from: 'C', tell: .55, hit: .2, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Intervalles', say: 'INTERVALLES !', sfx: 'whistle', chain: ['jabfL', 'jabfR', 'jabfL', 'jabfR'] },
        ball: toss('R', { projectile: 'ball', name: 'Ballon chasseur', say: 'BALLON !', dmg: 12 }),
        ballL: toss('L', { projectile: 'ball', name: 'Ballon chasseur', say: 'BALLON !', dmg: 12 }),
        jacks: { pose: 'jacks', free: true, dur: 2.0, armor: .5, star: 'early', name: 'Sauts étoiles', say: 'Échauffement !' },
        upperR: U('R', { tell: .8, dmg: 15 }),
        blast: { pose: 'shout', from: 'C', tell: .7, hit: .5, rec: .3, dmg: 0, fx: 'stun', avoid: ['block'], name: 'Coup de sifflet', say: 'TWIIIIIT !', sfx: 'whistle', chain: ['upperR'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['intervals', 2], ['ball', 2], ['ballL', 1], ['jacks', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['intervals', 2], ['ball', 2], ['ballL', 2], ['blast', 2], ['jacks', 1]],
      tips: ['Quand il crie « Intervalles ! », c’est toute une série, rapide et droite. Les pieds bougent pas assez vite pour ça…',
        'Son ballon, il le lance tout droit vers ta face. Il n’y a qu’une place où il ne faut pas être.',
        'Pendant ses sauts étoiles, ses bras partent dans tous les sens : il en arrête la moitié sans le vouloir.'],
      taunts: ['Ça, c’est un C-moins !', 'On lâche pas, la gang !', 'Mon grand-père frappait plus fort !'],
    },
    {
      id: 'lemur', circuit: 'argent', name: 'Pierre-Luc Gagnon', nick: 'Le Mur', city: 'Chicoutimi', record: '31 V – 6 D', weight: '109 kg', age: 29,
      job: 'Dur à cuire de la ligue de garage', quote: 'Z’ai passé plus de temps au banc des pénalités que sur la glace.',
      hp: 150, dmg: 1.1, spd: .95, maxCombo: 3, grit: .45, guard: { high: .75, both: .12, sw: [1.4, 2.8] }, gap: [1.0, 1.8], sfx: 'puck', taunt: 'gloves',
      look: { skin: '#f2c6a6', w: 1.22, h: 1.1, head: 1, shirt: { type: 'jersey', c1: '#c62828', c2: '#fafafa', num: '44' }, trunks: '#212121', trim: '#c62828', gloves: '#c62828', hair: { style: 'mullet', c: '#4e342e' }, toothGap: 1, scar: 1, stubble: 1 },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .5, dmg: 8 }), pair(H, 'hook', { tell: .7, dmg: 13 }), pair(H, 'hookf', { tell: .45, dmg: 10, star: null }), {
        check: { pose: 'charge', from: 'C', tell: .9, hit: .28, rec: 1.2, dmg: 16, avoid: ['L', 'R'], star: 'counter', name: 'Mise en échec', say: 'MISE EN ÉCHEC !', sfx: 'puck' },
        jersey: { pose: 'grab', from: 'C', tell: .85, hit: .26, rec: 1.0, dmg: 4, fx: 'dark', avoid: ['duck'], star: 'counter', name: 'Chandail sur la tête', say: 'Viens ici, toi !' },
        dropgloves: { pose: 'taunt', free: true, dur: 1.6, star: 'early', rage: 1, name: 'On jette les gants', say: 'ON JETTE LES GANTS !' },
        brawl: { pose: 'shout', from: 'C', tell: .5, hit: .2, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Bagarre générale', say: 'BAGARRE !', chain: ['hookfL', 'hookfR', 'hookfL', 'hookR'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['hookL', 2], ['hookR', 2], ['check', 2], ['jersey', 1], ['dropgloves', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['hookL', 2], ['hookR', 2], ['check', 2], ['jersey', 2], ['brawl', 2]],
      tips: ['Quand il ouvre grand les bras, il ne vise pas ta face… il veut t’attraper par en haut.',
        'Si tu ne vois plus rien, fie-toi à tes oreilles : chacun de ses coups a son propre bruit.',
        'Il protège sa face comme un gardien de but. Le reste, un peu moins…'],
      taunts: ['Cinq minutes pour bagarre !', 'Je joue sans casque, moi.', 'T’as du jus de pomme dans les veines ?'],
    },
    {
      id: 'meteo', circuit: 'argent', name: 'Colette Nuage', nick: 'Madame Météo', city: 'Québec', record: '33 V – 5 D', weight: '64 kg', age: 41,
      job: 'Présentatrice météo au téléjournal', quote: 'Aujourd’hui : 100 % de chances de K.O.',
      hp: 150, dmg: 1.1, spd: .92, maxCombo: 4, grit: .45, guard: { high: .5, both: .1, sw: [1.2, 2.4] }, gap: [1.0, 1.8], sfx: 'chime', taunt: 'present',
      look: { skin: '#f5d5c0', w: .95, h: 1.0, head: 1, shirt: { type: 'blazer', c1: '#7b1fa2', c2: '#f3e5f5' }, trunks: '#4a148c', trim: '#ffd54f', gloves: '#ffd54f', hair: { style: 'big', c: '#e65100' }, lips: '#d81b60', earrings: '#ffd54f' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .48 }), pair(Z, 'drop', { tell: .24, dmg: 4, glint: 0 }), {
        soleil: { pose: 'shout', from: 'C', icon: '☀️', tell: .85, hit: .3, rec: .9, dmg: 3, fx: 'blind', avoid: ['L', 'R'], star: 'counter', name: 'Coup de soleil', say: 'Ensoleillé !', sfx: 'chime' },
        averse: { pose: 'present', from: 'C', icon: '🌧️', tell: .6, hit: .2, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Averses', say: 'Averses en rafales !', chain: ['dropL', 'dropR', 'dropL', 'dropR', 'dropL'] },
        orageL: H('L', { icon: '⛈️', tell: 1.0, dmg: 17, name: 'Orage électrique', say: 'Orages !', sfx: 'thunder', lie: 0, mirror: 'orageR' }),
        orageR: H('R', { icon: '⛈️', tell: 1.0, dmg: 17, name: 'Orage électrique', say: 'Orages !', sfx: 'thunder', lie: 0, mirror: 'orageL' }),
        brume: { pose: 'present', free: true, dur: .9, icon: '🌫️', tellFx: 'fog', fxDur: 5, name: 'Brouillard', say: 'Bancs de brouillard…', star: 'early' },
        tornade: sweep('R', { icon: '🌪️', pose: 'spin', tell: 1.1, dmg: 16, name: 'Tornade', say: 'Tornade !', sfx: 'wind' }),
      }),
      pool: [['jabL', 3], ['jabR', 3], ['soleil', 2], ['averse', 2], ['orageL', 1], ['orageR', 1], ['brume', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['soleil', 2], ['averse', 2], ['orageL', 2], ['orageR', 2], ['brume', 1], ['tornade', 2]],
      phase2: { lie: .4 },
      tips: ['Elle annonce toujours sa météo avant de frapper. Lis sa carte comme un bulletin du soir.',
        'Une tornade, ça tourne… et ça balaie tout ce qui dépasse.',
        'Quand elle se fâche, ses prévisions deviennent moins fiables. Surveille ses gants jusqu’à la dernière seconde.'],
      taunts: ['Demain : nuageux avec des bleus.', 'Facteur vent : OUCH.', 'Ici Colette, en direct de ta défaite !'],
    },

    // Dernière adversaire du circuit Argent : petites tapes, grosses tempêtes de minous.
    {
      id:'minou',circuit:'argent',name:'Géraldine Griffe',nick:'Madame Minou',city:'Limoilou',record:'39 V – 7 D',weight:'58 kg',age:67,
      job:'Gardienne autoproclamée des 47 chats du quartier',quote:'TOUCHE PAS À MON TI-MOUSTACHE !',
      hp:155,dmg:.62,spd:.73,maxCombo:5,grit:.38,guard:{high:.58,both:.04,sw:[.65,1.3]},gap:[.45,.85],sfx:'cat',taunt:'shout',
      look:{catlady:true,skin:'#e9c8a4',w:1.02,h:.96,head:1.02,wrinkles:1,toothGap:1,shirt:{type:'cardigan',c1:'#6c5683',c2:'#9ba46d'},trunks:'#777047',trim:'#d4b986',gloves:'#a96886',hair:{style:'wild',c:'#a5a49c'},slippers:true},
      moves:Object.assign({},pair(Z,'jab',{tell:.38,hit:.13,rec:.18,dmg:3,name:'Petite tape'}),pair(Z,'pat',{tell:.28,hit:.12,rec:.08,dmg:2.5,glint:1,name:'Patte éclair'}),{
        rafale:{pose:'shout',from:'C',tell:.55,hit:.1,rec:.05,dmg:0,avoid:['L','R','block','duck'],name:'La danse des moustaches',say:'GAUCHE ! DROITE ! MES CHATS BOXENT MIEUX !',chain:['patL','patR','patR','patR','patL','patL','patR','patL','chatR','rappel']},
        panique:{pose:'shout',from:'C',tell:.55,hit:.1,rec:.05,dmg:0,avoid:['L','R','block','duck'],name:'Le quart d’heure des minous',say:'LES MINOUS, FORMATION TORNADE !',chain:['patR','patL','chatL','patR','patR','patL','chatR','rappel']},
        chatL:toss('L',{projectile:'cat',tell:.85,hit:.6,rec:.12,dmg:5,avoid:['R','duck'],name:'Ti-Moustache volant',say:'ATTRAPE MON TI-MOUSTACHE !',sfx:'cat'}),
        chatR:toss('R',{projectile:'cat',tell:.85,hit:.6,rec:.12,dmg:5,avoid:['L','duck'],name:'Capitaine Ronron',say:'CAPITAINE RONRON, À L’ATTAQUE !',sfx:'cat'}),
        rappel:{pose:'taunt',free:true,dur:1.9,star:'early',name:'Rappel des minous',say:'REVIENS ICI ! PAS DANS LE POPCORN !',prop:'cat'},
        calin:{pose:'taunt',free:true,dur:1.35,star:'early',name:'Pause câlin',say:'QUI C’EST LE BEAU MINOU ? OUI, C’EST TOI !',prop:'cat'},
      }),
      pool:[['jabL',2],['jabR',2],['rafale',4],['chatL',1],['chatR',1],['calin',1]],
      pool2:[['rafale',4],['panique',4],['chatL',1],['chatR',1],['calin',1]],
      tips:['Ses tapes sont légères mais nombreuses : garde tes gants hauts pendant ses rafales.', 'Quand elle sort un minou, baisse-toi deux fois ou esquive à l’opposé du gant qui le tient.', 'Attends qu’elle rappelle ses chats : elle a les mains occupées et tu peux contre-attaquer.'],
      taunts:['C’EST PAS UN RING, C’EST MA COUR !','TU VAS RÉVEILLER MES BÉBÉS !','FÉLIX ! RECRACHE LE PROTÈGE-DENTS !','QUI A MANGÉ MES CROQUETTES ?!','ARRÊTE DE BOUGER, Z’TE PEIGNE !'],
    },

    // ===== CIRCUIT OR =====
    {
      id: 'robot', circuit: 'or', name: 'Robo-Souffleuse 3000', nick: 'RS-3000', city: 'Garage du cousin Gilles, Saint-Jérôme', record: '0 V – 0 D', weight: '340 kg', age: 1,
      job: 'Souffleuse à neige devenue boxeuse (bogue)', quote: 'BIP. ANALYSE : ADVERSAIRE = BANC DE NEIGE. BIP.',
      hp: 175, dmg: 1.15, spd: .86, maxCombo: 3, grit: .5, guard: { high: .5, both: .1, sw: [.9, 1.8] }, gap: [.9, 1.6], sfx: 'beep', taunt: 'scan', overheat: 5,
      look: { kind: 'robot', w: 1.25, h: 1.12, head: 1, metal: '#ff6f00', dark: '#37474f', eye: '#00e5ff', gloves: '#b0bec5', trunks: '#263238', trim: '#ff6f00' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .46, dmg: 8, eyes: 1 }), pair(Z, 'jabf', { tell: .26, dmg: 6, eyes: 1, glint: 0 }), {
        rocketL: toss('L', { projectile: 'rocket', tell: 1.0, avoid: ['R', 'duck'], dmg: 18, name: 'Poing-fusée', say: '3… 2… 1… FEU !', sfx: 'beep', eyes: 1, lie: 0, mirror: 'rocketR' }),
        rocketR: toss('R', { projectile: 'rocket', tell: 1.0, avoid: ['L', 'duck'], dmg: 18, name: 'Poing-fusée', say: '3… 2… 1… FEU !', sfx: 'beep', eyes: 1, lie: 0, mirror: 'rocketL' }),
        blow: { pose: 'blow', from: 'C', tell: .75, hit: 1.0, rec: .7, dmg: 2, fx: 'snow', avoid: ['block'], name: 'Souffleuse', say: 'SOUFFLAGE ACTIVÉ', sfx: 'wind' },
        overheat: { pose: 'overheat', free: true, dur: 2.4, star: 'early', name: 'Surchauffe', say: 'SURCHAUFFE… REFROIDISSEMENT…', sfx: 'steam' },
        turbo: { pose: 'shout', from: 'C', tell: .45, hit: .15, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Mode turbo', say: 'MODE TURBO', sfx: 'beep', chain: ['jabfL', 'jabfR', 'jabfR', 'jabfL', 'rocketR'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['rocketL', 2], ['rocketR', 2], ['blow', 2]],
      pool2: [['jabL', 2], ['jabR', 2], ['rocketL', 2], ['rocketR', 2], ['blow', 2], ['turbo', 2]],
      phase2: { lie: .35 },
      tips: ['Ses yeux, c’est un écran. Il affiche ce qu’il calcule… y compris d’où va partir son coup.',
        'Quand la souffleuse démarre, ceux qui se cachent derrière leurs gants voient encore clair après.',
        'Une machine qui travaille fort, ça finit par chauffer. Et quand ça fume, ça ne se défend plus bien. Mais quand il bogue, ses yeux changent de couleur…'],
      taunts: ['BIP. TU ES UN BANC DE NEIGE.', 'MISE À JOUR EN COURS… 3 %…', 'ERREUR 404 : TA GARDE EST INTROUVABLE.'],
    },
    {
      id: 'petardo', circuit: 'or', name: 'Rosaire Lafleur', nick: 'El Pétardo', city: 'Montréal-Nord', record: '41 V – 9 D', weight: '92 kg', age: 35,
      job: 'Lutteur masqué reconverti en boxeur', quote: '¡Olé! Le spectacle, c’est MOI.',
      hp: 175, dmg: 1.15, spd: .82, maxCombo: 3, grit: .55, guard: { high: .5, both: .15, sw: [.9, 1.8] }, gap: [.85, 1.5], sfx: 'pop', taunt: 'flex',
      look: { skin: '#d9a066', w: 1.12, h: 1.05, head: 1, shirt: { type: 'bare' }, cape: '#ffd600', trunks: '#00897b', trim: '#ffd600', gloves: '#ffd600', hair: { style: 'mask', c: '#00897b', c2: '#ffd600' } },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .42, dmg: 8 }), pair(H, 'hook', { tell: .62, dmg: 14 }), {
        feintL: H('L', { tell: .62, feint: 1, glint: 0, name: 'Feinte', dmg: 14 }),
        feintR: H('R', { tell: .62, feint: 1, glint: 0, name: 'Feinte', dmg: 14 }),
        olé: Z('R', { tell: .22, dmg: 9, glint: 0, name: 'Olé !', say: '¡OLÉ!' }),
        tornado: sweep('L', { pose: 'spin', tell: 1.0, dmg: 16, name: 'Tornade Pétardo', say: '¡TORNADO!', sfx: 'wind' }),
        angel: { pose: 'leap', from: 'C', tell: 1.25, hit: .3, rec: 1.4, dmg: 20, avoid: ['L', 'R'], star: 'counter', name: 'Saut de l’ange', say: 'SAUT DE L’ANGE !', sfx: 'pop' },
        pose: { pose: 'flex', free: true, dur: 1.6, star: 'early', rage: 1, name: 'Pose de champion', say: '¡Mírenme!' },
        fireworks: { pose: 'shout', from: 'C', tell: .7, hit: .35, rec: .3, dmg: 0, fx: 'flash', avoid: ['block'], name: 'Pétards', say: '¡FUEGO!', sfx: 'fireworks', chain: ['hookL', 'hookR'] },
      }),
      pool: [['jabL', 3], ['jabR', 3], ['hookL', 2], ['hookR', 2], ['feintL', 2], ['feintR', 2], ['angel', 1], ['pose', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['hookL', 2], ['hookR', 2], ['feintL', 2], ['feintR', 2], ['tornado', 2], ['angel', 2], ['fireworks', 2]],
      tips: ['Un vrai crochet, ça brille avant de partir. Celui qui ne brille pas… c’est peut-être juste du spectacle.',
        'Quand il disparaît par en haut, il redescend toujours au même endroit : plein centre.',
        'Il aime trop la foule. Pendant qu’il prend la pose, il oublie un peu son adversaire… mais il n’aime pas qu’on gâche son show.'],
      taunts: ['¡Qué lento!', 'Ma cape a plus de muscles que toi.', 'Les caméras m’aiment !'],
    },
    {
      id: 'rita', circuit: 'or', name: 'Rita Bouchard', nick: 'Grand-Maman Tricot', city: 'Trois-Rivières', record: '58 V – 2 D', weight: '49 kg', age: 82,
      job: 'Grand-maman de 23 petits-enfants', quote: 'Viens donner un bec à grand-maman… sur mon poing.',
      hp: 185, dmg: 1.2, spd: .8, maxCombo: 3, grit: .7, guard: { high: .5, both: .15, sw: [.9, 1.7] }, gap: [.85, 1.5], sfx: 'chime', taunt: 'knit',
      look: { skin: '#f3d3c0', w: .86, h: .84, head: 1.05, shirt: { type: 'cardigan', c1: '#8e6e9e', c2: '#fafafa' }, trunks: '#ad1457', trim: '#fafafa', gloves: '#f48fb1', hair: { style: 'curlers', c: '#eeeeee', c2: '#ec407a' }, glasses: '#8d6e63', lips: '#c2185b', wrinkles: 1, pearls: 1 },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .4, dmg: 8 }), {
        purseR: sweep('R', { prop: 'purse', tell: .85, dmg: 18, name: 'Sacoche tournante', say: 'Ma sacoche !', sfx: 'wind' }),
        purseL: sweep('L', { prop: 'purse', tell: .85, dmg: 18, name: 'Sacoche tournante', say: 'Ma sacoche !', sfx: 'wind' }),
        slipper: toss('R', { projectile: 'slipper', tell: .8, dmg: 12, name: 'Pantoufle volante', say: 'PANTOUFLE !' }),
        knit: { pose: 'knit', from: 'C', tell: 1.0, hit: .3, rec: .9, dmg: 3, fx: 'tie', avoid: ['L', 'R'], star: 'counter', name: 'Tricot express', say: 'Je te tricote une tuque !', projectile: 'yarn' },
        cookie: { pose: 'eat', free: true, dur: 2.0, heal: .14, star: 'early', name: 'P’tit biscuit', say: 'Un p’tit biscuit…', prop: 'cookie', sfx: 'munch' },
        teeth: toss('L', { projectile: 'teeth', tell: .7, dmg: 13, name: 'Dentier volant', say: 'Mon dentier !', sfx: 'chomp' }),
      }),
      pool: [['jabL', 3], ['jabR', 3], ['purseR', 2], ['purseL', 1], ['slipper', 2], ['knit', 1], ['cookie', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['purseR', 2], ['purseL', 2], ['slipper', 2], ['knit', 2], ['cookie', 1], ['teeth', 2]],
      tips: ['Sa sacoche tourne à la hauteur de ta tête. Elle balaie de gauche à droite, alors bouger de côté…',
        'Son tricot, ça attache solide. Mais avec assez d’énergie, on finit par se libérer.',
        'Ses p’tits biscuits lui redonnent de l’énergie. Ce serait dommage qu’elle ne puisse pas les finir…'],
      taunts: ['T’as mangé tes croûtes ?', 'De mon temps, on boxait dans la neige !', 'Grand-maman est pas fatiguée, mon chou.'],
    },

    // ===== CHAMPIONNAT =====
    {
      id: 'caribou', circuit: 'titre', name: 'Maximilien Lemay', nick: 'Le Roi Caribou', city: 'Gaspé', record: '49 V – 0 D', weight: '118 kg', age: 33,
      job: 'Champion du monde, invaincu', quote: 'Agenouille-toi devant le Roi du Nord.',
      hp: 230, dmg: 1.3, spd: .72, maxCombo: 3, grit: .85, guard: { high: .55, both: .15, sw: [.8, 1.5] }, gap: [.7, 1.3], sfx: 'ting', taunt: 'roar',
      look: { skin: '#e0ac7e', w: 1.3, h: 1.18, head: 1, shirt: { type: 'bare' }, cape: '#4a148c', capeTrim: '#fafafa', belt: '#ffd600', trunks: '#1a237e', trim: '#ffd600', gloves: '#ffc400', hair: { style: 'slick', c: '#1b1b1b' }, beard: '#1b1b1b', antlers: '#c9a227' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .38, dmg: 9 }), pair(H, 'hook', { tell: .6, dmg: 15 }), pair(U, 'upper', { tell: .7, dmg: 18 }), pair(Z, 'jabf', { tell: .24, dmg: 7, glint: 0 }), {
        charge: { pose: 'charge', from: 'C', tell: .8, hit: .28, rec: 1.2, dmg: 22, avoid: ['L', 'R'], star: 'counter', name: 'Charge du caribou', say: 'PLACE AU ROI !', sfx: 'roar' },
        roar: { pose: 'shout', from: 'C', tell: .7, hit: .5, rec: .25, dmg: 0, fx: 'stun', avoid: ['block'], name: 'Brame royal', say: 'BRRRAAAAME !', sfx: 'roar', chain: ['upperR'] },
        aurora: { pose: 'present', free: true, dur: .9, tellFx: 'aurora', fxDur: 7, name: 'Aurore boréale', say: 'Que le ciel s’éteigne…', star: 'early' },
        reign: { pose: 'shout', from: 'C', tell: .5, hit: .15, rec: .1, dmg: 0, avoid: ['L', 'R', 'block', 'duck'], name: 'Règne éternel', say: 'RÈGNE ÉTERNEL !', chain: ['jabfL', 'jabfR', 'hookL', 'upperR'] },
        feintL: H('L', { tell: .6, feint: 1, glint: 0, name: 'Feinte royale' }),
        feintR: H('R', { tell: .6, feint: 1, glint: 0, name: 'Feinte royale' }),
        olé: Z('L', { tell: .22, dmg: 9, glint: 0, name: 'Riposte' }),
      }),
      pool: [['jabL', 3], ['jabR', 3], ['hookL', 2], ['hookR', 2], ['upperL', 1], ['upperR', 1], ['charge', 2], ['roar', 1]],
      pool2: [['jabL', 2], ['jabR', 2], ['hookL', 2], ['hookR', 2], ['upperL', 2], ['upperR', 2], ['charge', 2], ['roar', 2], ['aurora', 1], ['reign', 2], ['feintL', 1], ['feintR', 1]],
      phase2: { lie: .3, cape: 0 },
      tips: ['Il ne prévient presque pas avant ses directs. Juste un petit éclat dans l’œil…',
        'Quand il baisse ses bois, il fonce tout droit comme un vrai caribou. Les gants ne pèsent pas lourd contre ça.',
        'Son brame fait trembler tout le ring. Et dans l’aurore boréale, regarde bien les couleurs de ses gants.'],
      taunts: ['Tu n’es qu’un faon.', '49 victoires. Bientôt 50.', 'Ma couronne pèse plus que toi.'],
    },

    // ===== SECRET =====
    {
      id: 'ombre', circuit: 'secret', name: 'L’Ombre', nick: 'Ton reflet', city: 'De l’autre côté du miroir', record: '? V – 0 D', weight: 'Exactement le tien', age: 0,
      job: 'Connaît toutes tes feintes', quote: 'Tu ne peux pas battre ce que tu es.',
      hp: 240, dmg: 1.35, spd: .7, maxCombo: 3, grit: .9, guard: { high: .5, both: .2, sw: [.7, 1.3] }, gap: [.65, 1.2], sfx: 'ting', taunt: 'mirror',
      look: { kind: 'shadow', w: 1.1, h: 1.05, head: 1, gloves: '#7c4dff', trunks: '#12002b', trim: '#7c4dff' },
      moves: Object.assign({}, pair(Z, 'jab', { tell: .36, dmg: 9 }), pair(H, 'hook', { tell: .58, dmg: 15, lie: .3 }), pair(U, 'upper', { tell: .68, dmg: 18 }), pair(Z, 'jabf', { tell: .24, dmg: 7, glint: 0 }), {
        chop: { pose: 'overhead', from: 'C', tell: .8, hit: .22, rec: 1.1, dmg: 20, avoid: ['L', 'R'], star: 'counter', name: 'Hache d’ombre', say: 'HO-HISSE !' },
        purse: sweep('R', { tell: .75, dmg: 18, name: 'Balayage d’ombre' }),
        rocket: toss('L', { projectile: 'rocket', tell: .85, avoid: ['R', 'duck'], dmg: 18, name: 'Poing-fusée d’ombre', eyes: 1 }),
        jersey: { pose: 'grab', from: 'C', tell: .75, hit: .26, rec: 1.0, dmg: 4, fx: 'dark', avoid: ['duck'], star: 'counter', name: 'Étreinte d’ombre', say: 'Viens…' },
        roar: { pose: 'shout', from: 'C', tell: .6, hit: .5, rec: .25, dmg: 0, fx: 'stun', avoid: ['block'], name: 'Cri du miroir', say: 'HAAAAA !', sfx: 'roar', chain: ['upperL'] },
        feintL: H('L', { tell: .58, feint: 1, glint: 0, name: 'Feinte' }),
        feintR: H('R', { tell: .58, feint: 1, glint: 0, name: 'Feinte' }),
        olé: Z('R', { tell: .2, dmg: 9, glint: 0, name: 'Riposte' }),
        angel: { pose: 'leap', from: 'C', tell: 1.1, hit: .3, rec: 1.3, dmg: 20, avoid: ['L', 'R'], star: 'counter', name: 'Chute d’ombre', say: 'D’EN HAUT !' },
      }),
      pool: [['jabL', 2], ['jabR', 2], ['hookL', 2], ['hookR', 2], ['upperL', 1], ['upperR', 1], ['chop', 1], ['purse', 1], ['rocket', 1], ['jersey', 1], ['roar', 1], ['feintL', 1], ['feintR', 1], ['angel', 1]],
      tips: ['L’Ombre se bat avec les coups de tous ceux que tu as déjà affrontés. Tu les connais… non ?',
        'Ses crochets ont la même mauvaise habitude que les prévisions de Madame Météo.',
        'Plus tu gardes d’étoiles, plus ton uppercut frappe fort. Choisis bien ton moment.'],
      taunts: ['Je suis toi, en mieux.', 'Chaque coup que tu donnes, je le connais.', 'Le miroir ne ment jamais.'],
    },
  ];
  // ---------- Aventure : combos, boutique, or ----------
  // Dès Madame Minou : feinte sans dégâts, puis vraie frappe lisible et de plus en plus vive.
  const fakeStart=BX.BOXERS.findIndex(b=>b.id==='minou');
  BX.feintChance=(b,phase2=false)=>{const rank=BX.BOXERS.indexOf(b)-fakeStart;return rank<0?0:Math.min(.42,.12+rank*.045+(phase2?.05:0));};
  BX.BOXERS.slice(fakeStart).forEach((b,rank)=>{
    b.feints=true;
    const choices=['jabL','jabR',...(b.moves.patL?['patL','patR']:[]),...(rank>=1&&b.moves.hookL?['hookL','hookR']:[]),...(rank>=2&&b.moves.upperL?['upperL','upperR']:[])];
    const follows=choices.map((id,i)=>{const name='riposteFake'+i;b.moves[name]=Object.assign({},b.moves[id],{tell:Math.max(.24,.46-rank*.035),glint:1,feint:false,feintFollow:true,chain:undefined,name:'Riposte après feinte'});return name;});
    for(const side of ['L','R'])b.moves['fake'+side]=Z(side,{tell:Math.max(.3,.5-rank*.025),feint:true,dmg:0,glint:0,retract:Math.max(.1,.24-rank*.025),follow:follows,name:'Faux direct'});
    b.tips.push('Son premier départ peut être une feinte sans éclat. Attends le vrai gant qui s’allume avant d’esquiver la riposte.');
  });

  // Commandes de finishers : directions pressées, frappes et hauteur de la dernière frappe.
  BX.SPECIAL_DURATION=2.8; BX.SPECIAL_LEAD=.55; BX.SPECIAL_HITS=5;
  BX.specialCost=maxHearts=>Math.max(10,Math.ceil(maxHearts*.55));
  BX.COMMAND_GAP=.42; BX.COMMAND_TIME=2.8;
  BX.commandToken=(action,high)=>action==='pL'?(high?'hL':'L'):action==='pR'?(high?'hR':'R'):action;
  BX.COMBOS = [
    {id:'puissance',name:'Coups de puissance',charge:true,seq:['L','R'],mult:1,cost:60,keys:'Maintiens Z ou X, puis relâche',desc:'Maintiens Z ou X pour charger, puis relâche. Le poing grossit, le bond monte et les dégâts augmentent jusqu’à ×3,2. Jusqu’à 6 stamina ; vulnérable pendant la charge.'},
    {id:'undeux',name:'Dragon brasier',element:'fire',seq:['down','right','L','left','down','right','R'],mult:3.2,cost:80,keys:'↓ → Z ← ↓ → X',desc:'↓ → Z ← ↓ → X : charge basse, bond en avant et cross enflammé. 7 commandes, 0,42 s maximum entre chaque, 2,8 s au total. 5 coups puis brûlure pendant 5 s. Coûte 55 % de la stamina maximale (minimum 10).'},
    {id:'corpstete',name:'Marteau polaire',element:'ice',seq:['left','down','R','right','left','up','hL'],mult:3.4,cost:160,keys:'← ↓ X → ← ↑ ↑+Z',desc:'← ↓ X → ← ↑ puis Z en gardant ↑ : rassemble la glace et abat le poing. 5 coups puis ralentit 6 s. 0,42 s entre commandes, 2,8 s au total, 55 % de stamina maximale (minimum 10).'},
    {id:'jju',name:'Ascension du tonnerre',element:'lightning',seq:['down','left','down','right','L','up','hR'],mult:3.8,upper:true,cost:280,keys:'↓ ← ↓ → Z ↑ ↑+X',desc:'↓ ← ↓ → Z ↑ puis X en gardant ↑ : 5 coups, accroupissement, saut et uppercut électrique : puissance adverse réduite de 35 % pendant 6 s. Traverse la garde mais ne remplace pas ★. 0,42 s entre commandes, 2,8 s au total, 55 % de stamina maximale (minimum 10).'},
    {id:'rafale',name:'Ouragan familial',element:'wind',seq:['right','left','L','down','R','right','up','hL'],mult:4.2,stun:true,cost:480,keys:'→ ← Z ↓ X → ↑ ↑+Z',desc:'→ ← Z ↓ X → ↑ puis Z en gardant ↑ : 5 coups, pivot debout, crochet et confusion pendant 5 s. 8 commandes, 0,42 s entre chaque, 2,8 s au total, 55 % de stamina maximale (minimum 10).'},
  ];
  BX.itemPrice = (item, count = 0) => item.id === 'bandage' ? item.cost * Math.pow(2, Math.min(2, count)) : item.cost;
  // mods : dmg (+ dégâts), dodge (esquives plus rapides), def (– dégâts reçus), heal (récup. entre les rounds), hearts (+ stamina max), stars (étoiles au départ).
  BX.ITEMS = [
    { id: 'gants1', name: 'Gants rembourrés', icon: '🥊', cost: 120, mods: { dmg: .10 }, desc: '+10 % de dégâts.', slot: 'gants' },
    { id: 'gants2', name: 'Gants de pro', icon: '🥊', cost: 320, mods: { dmg: .20 }, desc: '+20 % de dégâts.', slot: 'gants', needs: 'gants1' },
    { id: 'gants3', name: 'Gants de champion', icon: '🏆', cost: 700, mods: { dmg: .32 }, desc: '+32 % de dégâts. La couleur suit tes titres.', slot: 'gants', needs: 'gants2' },
    { id: 'souliers', name: 'Souliers légers', icon: '👟', cost: 180, mods: { dodge: .12 }, desc: 'Esquives 12 % plus rapides.' },
    { id: 'protege', name: 'Protège-dents', icon: '🦷', cost: 160, mods: { def: .12 }, desc: '–12 % de dégâts reçus.' },
    { id: 'serviette', name: 'Serviette du coin', icon: '🧺', cost: 120, mods: { heal: .10 }, desc: '+10 % d’énergie récupérée entre les rounds.' },
    { id: 'boisson', name: 'Boisson énergétique', icon: '🧃', cost: 35, use: true, mods: { hearts: .25 }, desc: 'Prochain combat seulement : +25 % de stamina.' },
    { id: 'bandage', name: 'Bandage chanceux', icon: '🩹', cost: 50, use: true, mods: { stars: 1 }, desc: 'Jusqu’à 3 ★ au prochain combat. Prix : 50, 100 puis 200 or.' },
  ];
  BX.buyShopItem = (career, id) => {
    const item = BX.ITEMS.find(item => item.id === id);
    if (!item || career.shopPurchaseDay === career.day) return false;
    const have = career.items[id] || 0, cost = BX.itemPrice(item, have);
    if (item.needs && !career.items[item.needs] || have && !item.use || id === 'bandage' && have >= 3 || career.gold < cost) return false;
    career.gold -= cost; career.items[id] = have + 1; career.shopPurchaseDay = career.day;
    return true;
  };
  BX.GOLD_WIN = { bronze: 60, argent: 100, or: 150, titre: 250, secret: 400 };
  BX.MOMENTS = 2;                 // moments libres par jour (une séance d’entraînement = 1 moment)

  // Fiches du tableau des combats : une petite bio rigolote + un « signe particulier ».
  BX.BIOS = {
    bobby: ['Bobby s’entraîne tous les matins… en soulevant des caisses de liqueur. Il a déjà gagné un combat : son adversaire s’était endormi en l’attendant.', 'Garde toujours un sac de chips dans ses culottes.'],
    ginette: ['Trente-quatre ans au coin de la rue sans laisser passer UN char. Elle respecte les règles à la lettre… et compte bien que toi aussi.', 'Sa pancarte a son propre fan-club.'],
    tibeuf: ['Il a appris à boxer en se battant contre des épinettes. Les épinettes ont perdu. Il mange ses crêpes avec une hache.', 'N’a jamais acheté de bois de chauffage de sa vie.'],
    coach: ['Le prof d’éduc qui t’a fait courir le test Léger en 4e année. Il ne s’en est jamais remis. Toi non plus.', 'A un sifflet de rechange… dans son sifflet.'],
    lemur: ['Expulsé de 14 ligues de garage, dont une ligue de ringuette. Il dit que les mises en échec, c’est sa façon de dire bonjour.', 'Ses dents de devant sont dans un pot Mason.'],
    meteo: ['Elle prédit la météo à la seconde près… surtout quand c’est elle qui la fait. Ses fans l’appellent « la Tempête en tailleur ».', 'Ne sort jamais sans son parapluie. Ni sans son orage.'],
    minou: ['Elle arrive avec un vieux manteau violet, des cheveux en bataille et une armée de minous. Ses petites tapes ne font pas très mal… mais elle n’arrête JAMAIS.', 'A inscrit ses 47 chats comme entraîneurs adjoints.'],
    robot: ['Une souffleuse à neige que le cousin Gilles a « améliorée » un soir de tempête. Personne ne sait comment l’arrêter.', 'Carbure au lave-glace bleu.'],
    petardo: ['Ancien lutteur masqué de Montréal-Nord. Personne n’a jamais vu son visage, même pas sa mère. Il entre dans le ring en faisant la roue.', 'Son masque a des paillettes. Beaucoup de paillettes.'],
    rita: ['Vingt-trois petits-enfants, tous champions de boxe. Devine qui leur a appris. Ses biscuits sont meilleurs que ses crochets… de peu.', 'Tricote une tuque complète entre deux rounds.'],
    caribou: ['Invaincu depuis si longtemps qu’on a renommé une montagne en son honneur. Son brame fait trembler les vitres jusqu’à Rimouski.', 'Son trône est fait de ceintures de champions.'],
    ombre: ['Personne ne sait d’où elle vient. Elle a ta tête, tes coups, tes feintes. Elle t’attendait depuis le début.', '… c’est toi. Mais en pire.'],
  };
  // Stats d’un adversaire sur 10, pour comparer avec les tiennes.
  BX.oppStats = b => {
    const c = v => Math.max(1, Math.min(10, Math.round(v)));
    return [
      { icon: '💪', name: 'Force', v: c(2 + (b.dmg - .75) / .6 * 8) },
      { icon: '⚡', name: 'Rapidité', v: c(2 + (1.3 - b.spd) / .6 * 8) },
      { icon: '❤️', name: 'Endurance', v: c(2 + (b.hp - 80) / 160 * 8) },
      { icon: '🪨', name: 'Coriace', v: c(1 + b.grit * 10) },
    ];
  };

  BX.boxerById = id => BX.BOXERS.find(b => b.id === id);
  BX.ORDER = BX.BOXERS.map(b => b.id);
  // Chaque adversaire arrive avec son propre entraîneur et ses conseils douteux.
  BX.RIVAL_COACHES = {
    bobby: { name: 'Ti-Guy', lines: ['Bob, tes gants servent à boxer. La poutine, c’est APRÈS !', 'Arrête de regarder la cantine ! Ton adversaire est de l’autre bord !'] },
    ginette: { name: 'Monique', lines: ['Ginette, on a dit un crochet. Pas un constat d’infraction !', 'T’as le droit de respirer même quand le feu est rouge !'] },
    tibeuf: { name: 'Gaston', lines: ['C’est un ring, Gaétan. Pas un érable à entailler !', 'Moins de hache imaginaire. Plus de gants bien réels !'] },
    coach: { name: 'Coach Luc', lines: ['Réal, arrête de donner des devoirs au petit !', 'Deux tours de ring ! Non, attends… c’est toi qui boxes !'] },
    lemur: { name: 'Marcel', lines: ['Pierre-Luc, y’a pas de banc des punitions ici !', 'Si tu cherches la rondelle, on l’a laissée dans l’auto !'] },
    meteo: { name: 'Gisèle', lines: ['Colette, tes prévisions annonçaient pourtant une victoire facile !', 'On dirait un petit front froid avec de très gros gants !'] },
    minou: { name:'Lucien', lines:['Géraldine ! Les chats, c’est pas des gants de rechange !','Minou numéro douze : arrête de manger la serviette du petit !','Rappelle tes chats, on n’a plus de place dans les estrades !'] },
    robot: { name: 'Mécano Jo', lines: ['Redémarre-toi ! Mais pas pendant que je suis branché !', 'Z’avais installé la mise à jour anti-uppercut !'] },
    petardo: { name: 'Pepe', lines: ['Rosaire, essaie de gagner avec tes POINGS cette fois !', 'Z’ouvre la fenêtre. Toi, ferme ta garde !'] },
    rita: { name: 'Yvette', lines: ['Rita, le petit n’a pas besoin d’un autre chandail !', 'Garde tes mailles serrées… et tes gants encore plus !'] },
    caribou: { name: 'Léon', lines: ['Majesté, votre couronne ne bloque pas les coups !', 'Le petit a oublié de lire le scénario où tu gagnes !'] },
    ombre: { name: 'Coach Écho', lines: ['Copie ses bons coups. Pas ses erreurs !', 'Même ton reflet a besoin d’un conseil !'] },
  };
})(window);
