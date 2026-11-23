// Clan Gobelin — données : métiers, objets, sorts, ennemis, noms, répliques.
'use strict';
(function (CG) {
  CG.RES = {
    food: { nom: 'Nourriture', icon: '🍖' },
    bois: { nom: 'Bois', icon: '🪵' },
    minerai: { nom: 'Minerai', icon: '🪨' },
    cuir: { nom: 'Cuir', icon: '🟤' },
    or: { nom: 'Or', icon: '🪙' }
  };

  CG.JOBS = {
    aucun: { nom: 'Bricoleur', nomF: 'Bricoleuse', icon: '🔨', desc: 'Pas de métier fixe : bâtit tout ce que tu poses, et flâne entre deux chantiers.' },
    cueilleur: { nom: 'Cueilleur', nomF: 'Cueilleuse', icon: '🍓', desc: 'Cueille des baies : +nourriture.', node: 'bush', work: 5, gain: { food: 2 } },
    chasseur: { nom: 'Chasseur', nomF: 'Chasseuse', icon: '🏹', desc: 'Chasse au loin : +nourriture et +cuir.', node: 'game', work: 7, gain: { food: 2, cuir: 1 } },
    bucheron: { nom: 'Bûcheron', nomF: 'Bûcheronne', icon: '🪓', desc: 'Abat un arbre, le coupe en deux et rapporte chaque moitié : +bois et plus de place.', work: 8, gain: { bois: 2 } },
    mineur: { nom: 'Mineur', nomF: 'Mineuse', icon: '⛏️', desc: 'Pioche dans les collines : +minerai.', node: 'ore', work: 7, gain: { minerai: 2 } },
    forgeron: { nom: 'Forgeron', nomF: 'Forgeronne', icon: '⚒️', desc: 'Forge des épées chez lui (2 minerai + 1 bois).', craft: 'epee', work: 24, need: { minerai: 2, bois: 1 } },
    arcier: { nom: 'Facteur d\'arcs', nomF: 'Factrice d\'arcs', icon: '🎯', desc: 'Taille des arcs chez lui (2 bois), et des flèches pour le chef.', craft: 'arc', work: 24, need: { bois: 2 } },
    tanneur: { nom: 'Tanneur', nomF: 'Tanneuse', icon: '🧥', desc: 'Coud des armures de cuir chez lui (2 cuir).', craft: 'armure', work: 24, need: { cuir: 2 } },
    garde: { nom: 'Garde', nomF: 'Garde', icon: '🛡️', desc: 'Patrouille et défend le village pendant les attaques.' },
    guerisseur: { tech: 'b25', nom: 'Guérisseur', nomF: 'Guérisseuse', icon: '🌿', desc: 'Reste à la hutte du guérisseur et soigne tous ceux qui s\'en approchent : gobelins, animaux et toi. Il faut d\'abord bâtir la hutte.' }
  };
  CG.JOB_ORDER = ['cueilleur', 'chasseur', 'bucheron', 'mineur', 'forgeron', 'arcier', 'tanneur', 'garde', 'guerisseur', 'aucun'];
  CG.jobsAvail = () => CG.JOB_ORDER.filter(j => !CG.JOBS[j].tech || CG.G.tech(CG.JOBS[j].tech) || (j === 'guerisseur' && CG.G.count('guerisseur') > 0)); // une hutte déjà bâtie (ancienne partie) garde son métier

  CG.CRAFTS = {
    epee: { nom: 'Épée', icon: '🗡️', prix: 5, effet: '+4 dégâts' },
    arc: { nom: 'Arc', icon: '🏹', prix: 3, effet: 'attaque à distance' },
    armure: { nom: 'Armure de cuir', icon: '🧥', prix: 4, effet: '+15 vie' }
  };

  CG.BUILDS = {
    hut: { nom: 'Hutte', icon: '🛖', w: 2, h: 2, cout: { bois: 20 }, desc: '+3 places pour de nouveaux gobelins.' },
    tower: { nom: 'Tour de guet', icon: '🗼', w: 2, h: 2, cout: { bois: 30, minerai: 10 }, desc: 'Il faut un garde dedans : il y monte tout seul et tire des flèches sur les ennemis proches. Vide, elle ne tire pas.' },
    totem: { nom: 'Totem de guerre', icon: '🗿', w: 1, h: 1, cout: { bois: 40, or: 30 }, desc: 'Gardes : +20 % de dégâts par totem.' },
    marmite: { nom: 'Grande marmite', icon: '🍲', w: 1, h: 1, cout: { bois: 25, minerai: 15 }, desc: 'La fête du soir coûte 25 % moins de nourriture (une seule compte).' }
  };

  // Sorts : chacun doit d'abord être copié d'un parchemin dans le grimoire.
  CG.SPELLS = {
    etincelle: { nom: 'Étincelle', icon: '✨', mp: 4, prix: 25, desc: 'Un petit trait de magie.', color: '#ffe36b' },
    vision: { nom: 'Œil de vérité', icon: '👁️', mp: 8, prix: 40, desc: 'Pendant 30 secondes, tu vois les forces et les faiblesses de chaque gobelin.', color: '#7dffea' },
    feu: { nom: 'Boule de feu', icon: '🔥', mp: 12, prix: 60, desc: 'Explose et brûle tout ce qui est autour.', color: '#ff7a2a' },
    glace: { nom: 'Souffle de givre', icon: '❄️', mp: 12, prix: 55, desc: 'Gèle et ralentit les ennemis autour de toi.', color: '#8fe1ff' },
    soin: { nom: 'Soin', icon: '❤️', mp: 15, prix: 50, desc: 'Te soigne, ainsi que les gobelins proches.', color: '#7dff8a' },
    racines: { nom: 'Racines', icon: '🌿', mp: 12, prix: 55, desc: 'Des racines immobilisent les ennemis.', color: '#6fbf4a' },
    eclair: { nom: 'Éclair en chaîne', icon: '⚡', mp: 16, prix: 90, desc: 'Saute d\'un ennemi à l\'autre.', color: '#d6c8ff' },
    bouclier: { nom: 'Bouclier', icon: '🔮', mp: 14, prix: 70, desc: 'Absorbe les coups pendant un moment.', color: '#9ab6ff' },
    cri: { nom: 'Cri de guerre', icon: '📯', mp: 16, prix: 80, desc: 'Tes gardes frappent plus fort et plus vite.', color: '#ffb05a' },
    illusion: { nom: 'Illusion terrifiante', icon: '👻', mp: 16, prix: 85, desc: 'Un monstre imaginaire surgit : les ennemis autour de toi fuient vers chez eux pendant 6 secondes, restent confus 2 secondes, puis reviennent.', color: '#c08aff' },
    murfeu: { nom: 'Mur de feu', icon: '♨️', mp: 18, prix: 95, desc: 'Dresse devant toi un mur de flammes qui brûle pendant 10 secondes tous les ennemis qui le traversent.', color: '#ff8a1e' },
    retour: { nom: 'Retour au village', icon: '🏠', mp: 14, prix: 70, desc: 'Te ramène d\'un coup devant ta hutte, où que tu sois.', color: '#b070ff' },
    meteore: { nom: 'Météore', icon: '☄️', mp: 30, prix: 160, desc: 'Une pierre de feu tombe du ciel.', color: '#ff4a2a' }
  };
  CG.SCROLL_POOL = ['etincelle', 'vision', 'feu', 'glace', 'soin', 'racines', 'eclair', 'bouclier', 'cri', 'illusion', 'retour', 'murfeu', 'meteore'];

  // Ennemis. cost = poids dans le budget d'une attaque.
  CG.ENEMIES = {
    milicien: { nom: 'Milicien', race: 'humain', hp: 18, dmg: 3, spd: 68, xp: 6, or: 3, cost: 1, look: { tunic: '#8a6a3c', hair: '#5a3a1c', weapon: 'fourche' } },
    soldat: { nom: 'Soldat', race: 'humain', hp: 30, dmg: 5, spd: 74, xp: 10, or: 5, cost: 2, look: { tunic: '#4a6aa8', hair: '#3a2a1a', weapon: 'epee', helmet: true } },
    archer: { nom: 'Archer', race: 'humain', hp: 20, dmg: 4, spd: 72, xp: 10, or: 5, cost: 2, range: 230, look: { tunic: '#3f7a3f', hair: '#c9a24a', weapon: 'arc', hood: true } },
    chevalier: { nom: 'Chevalier', race: 'humain', hp: 70, dmg: 9, spd: 58, xp: 25, or: 12, cost: 5, r: 15, look: { tunic: '#b8bcc8', hair: '#888', weapon: 'epee', helmet: true, armor: true } },
    mage: { nom: 'Mage', race: 'humain', hp: 26, dmg: 8, spd: 62, xp: 22, or: 10, cost: 5, range: 250, magic: true, scroll: 0.35, look: { tunic: '#6a3fa8', hair: '#eee', weapon: 'baton', hat: true } },
    capitaine: { nom: 'Capitaine', race: 'humain', hp: 170, dmg: 12, spd: 64, xp: 80, or: 50, cost: 14, r: 18, boss: true, scroll: 0.6, look: { tunic: '#a8322a', hair: '#222', weapon: 'epee', helmet: true, armor: true, cape: '#e8c84a' } },
    loup: { nom: 'Loup', race: 'bete', hp: 16, dmg: 4, spd: 112, xp: 6, or: 0, cost: 1.5, food: 1 },
    sanglier: { nom: 'Sanglier', race: 'bete', hp: 28, dmg: 6, spd: 92, xp: 9, or: 0, cost: 2.5, food: 3 },
    araignee: { nom: 'Araignée géante', race: 'bete', hp: 22, dmg: 4, spd: 100, xp: 8, or: 1, cost: 2 },
    ours: { nom: 'Ours', race: 'bete', hp: 64, dmg: 9, spd: 78, xp: 20, or: 0, cost: 5, r: 17, food: 6 },
    troll: { nom: 'Troll', race: 'bete', hp: 230, dmg: 16, spd: 52, xp: 100, or: 40, cost: 14, r: 24, boss: true },
    diablotin: { nom: 'Diablotin', race: 'demon', hp: 20, dmg: 5, spd: 96, xp: 12, or: 6, cost: 2.5, range: 210, magic: true },
    demon: { nom: 'Démon', race: 'demon', hp: 62, dmg: 10, spd: 78, xp: 28, or: 15, cost: 5, r: 16 },
    seigneur: { nom: 'Seigneur démon', race: 'demon', hp: 450, dmg: 14, spd: 70, xp: 220, or: 150, cost: 14, r: 19, boss: true, scroll: 1 },
    // créatures qui rôdent dans les alentours (tirées au sort chaque matin)
    gelee: { nom: 'Gelée', race: 'bete', hp: 14, dmg: 3, spd: 58, xp: 5, or: 2, cost: 1 },
    champi: { nom: 'Champi-mordeur', race: 'bete', hp: 25, dmg: 5, spd: 56, xp: 7, or: 1, cost: 1.5, food: 2 },
    follet: { nom: 'Feu follet', race: 'bete', hp: 12, dmg: 5, spd: 88, xp: 9, or: 4, cost: 2, range: 200, magic: true },
    brigand: { nom: 'Brigand', race: 'humain', hp: 24, dmg: 5, spd: 76, xp: 9, or: 9, cost: 2, look: { tunic: '#4a4038', hair: '#221', weapon: 'epee', hood: true } },
    ogre: { nom: 'Ogre', race: 'bete', hp: 110, dmg: 12, spd: 60, xp: 45, or: 25, cost: 7, r: 20, food: 4, scroll: 0.15 },
    gnome: { nom: 'Gnome archer', race: 'gnome', hp: 14, dmg: 4, spd: 80, xp: 8, or: 5, cost: 1.5, range: 210 },
    // repaires : ils ne bougent pas, ils fabriquent des ennemis (voir camps.js)
    tente: { nom: 'Tente de brigands', race: 'repaire', struct: true, hp: 70, dmg: 0, spd: 0, xp: 25, or: 15, cost: 99, r: 26 },
    camp: { nom: 'Camp humain', race: 'repaire', struct: true, hp: 150, dmg: 0, spd: 0, xp: 50, or: 35, cost: 99, r: 34 },
    cabane: { nom: 'Cabane de gnomes', race: 'repaire', struct: true, hp: 100, dmg: 0, spd: 0, xp: 35, or: 25, cost: 99, r: 30 },
    grotte: { nom: 'Grotte d\'ogres', race: 'repaire', struct: true, hp: 190, dmg: 0, spd: 0, xp: 60, or: 40, cost: 99, r: 34 },
    squelette: { nom: 'Squelette', race: 'mort', hp: 26, dmg: 5, spd: 66, xp: 10, or: 6, cost: 2 }
  };

  CG.NAMES_M = ['Grok', 'Zug', 'Brak', 'Snik', 'Morg', 'Dûk', 'Raz', 'Krunch', 'Gorbak', 'Fizz', 'Tork', 'Blurg', 'Skab', 'Nob', 'Vrak', 'Zogg', 'Pustule', 'Gnash', 'Ruk', 'Bolg', 'Trik', 'Klog', 'Murk', 'Drib', 'Yak', 'Gribouille', 'Tordu', 'Crasse'];
  CG.NAMES_F = ['Zila', 'Grenda', 'Mok\'a', 'Snaga', 'Ruza', 'Tikka', 'Bruna', 'Yeza', 'Krilla', 'Vixa', 'Nazzi', 'Glimma', 'Orza', 'Pika', 'Shazz', 'Mirgle', 'Zuzu', 'Draga', 'Kessa', 'Baba', 'Rikki', 'Gobette', 'Lutine', 'Ortie', 'Ronce', 'Fripouille', 'Mousse', 'Noisette'];

  CG.LINES = {
    aucun: ['Pose un plan, chef, et je sors mon marteau.', 'Entre deux chantiers, je compte les nuages. Il y en a... beaucoup.', 'Une bonne hutte, c\'est quatre murs et pas de courant d\'air.', 'Plus on est de bricoleurs, plus ça monte vite.'],
    cueilleur: ['Les baies du nord-est sont bien mûres.', 'J\'en mange une sur trois. Ne le dis à personne.', 'Mon panier est presque plein, chef !'],
    chasseur: ['Les sangliers courent vite, mais ma flèche court plus vite.', 'Chut... il y a un cerf, juste là.', 'Ce soir, on mange de la viande !'],
    bucheron: ['Chaque arbre tombé, c\'est de la place pour une hutte.', 'TIMBEEER ! ... J\'adore crier ça.', 'La forêt recule, le village avance.'],
    mineur: ['Les collines du nord-ouest sont pleines de minerai.', 'Je creuse, je creuse... un jour je trouverai un diamant.', 'Le forgeron a toujours faim de minerai.'],
    forgeron: ['Sans minerai, pas d\'épée. Envoie des mineurs !', 'Une bonne lame, ça se vend bien aux marchands.', 'Cling ! Clang ! La plus belle musique du monde.'],
    arcier: ['Un bon arc commence par une bonne branche.', 'Donne des arcs aux gardes, ils tireront de loin.', 'Je teste chaque corde moi-même. Aïe.'],
    tanneur: ['Il me faut du cuir. Les chasseurs en rapportent.', 'Une armure de cuir, ça sauve une peau verte.', 'Ça sent fort chez moi ? C\'est le métier.'],
    guerisseur: ['Approche, chef, que je regarde cette égratignure.', 'Une feuille de plantain, un peu de bave de limace, et hop.', 'Ça va piquer un peu. ... Beaucoup, en fait.', 'Ceux qui ont mal n\'ont qu\'à venir s\'asseoir près de ma hutte.', 'J\'ai une tisane pour tout. Même pour les tisanes.'],
    garde: ['Rien à signaler, chef.', 'Qu\'ils viennent, les humains. Je les attends.', 'Avec une épée et une armure, je tiendrais plus longtemps.'],
    soir: ['Quelle belle fête ! Bois un coup, chef !', 'Regarde-les danser ! Le feu les rend folles de joie.', 'Demain on travaille. Ce soir, on chante !', 'Hic ! ... C\'est le jus de baies.', 'Les tambours me font vibrer les oreilles.'],
    peur: ['Aaah ! Je cours me cacher !', 'Protège-nous, chef !'],
    faim: ['J\'ai le ventre qui gargouille, chef...', 'Il faudrait plus de cueilleurs et de chasseurs.']
  };

  CG.TIPS = [
    'Parle à un gobelin (E) pour lui donner un métier.',
    'Le soir, va à ta hutte de chef (E) pour dormir et passer au lendemain.',
    'Copie un parchemin dans ton grimoire (G) pour connaître le sort à jamais : l\'encre coûte de l\'or.',
    'Les bûcherons font reculer la forêt : plus de place pour bâtir.',
    'Explore les alentours : des coffres se cachent dans la forêt.',
    'Ta vie ne remonte pas toute seule : bâtis une hutte de guérisseur, garde des potions (Q), ou dors jusqu\'au matin.',
    'Chaque jour, les attaques deviennent plus dures. Arme tes gardes !'
  ];
})(window.CG);
