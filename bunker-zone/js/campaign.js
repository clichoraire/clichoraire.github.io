// ============================================================
//  campaign.js — Mode Aventure : quatre mondes (un par race) de 13 missions,
//  trois difficultés par mission, points, boutique d'améliorations passives,
//  héros à niveaux. Progression sauvegardée dans localStorage (« bz-campaign »).
// ============================================================
(function (ZC) {
  'use strict';

  // ------------------------------------------------------------ Personnages (dialogues)
  ZC.CHARACTERS = {
    orsk:  { name: 'Général Orsk',      side: 'ally',  role: 'Commandement de la Division Bunker', portrait: 'a_idleN',     tint: 'rgba(255,200,80,0.28)', color: '#ffd040' },
    ops:   { name: 'Opératrice Lin',    side: 'ally',  role: 'Centre des opérations',              portrait: 'm_idleW',     tint: 'rgba(80,160,255,0.3)',  color: '#c8d4e8' },
    kael:  { name: 'Sergent Kael',      side: 'hero',  role: 'Héros · exo-marine',                 portrait: 'exo_idle',    tint: null,                    color: '#8ad88a' },
    voss:  { name: 'Lieutenante Voss',  side: 'hero',  role: 'Héros · archonte',                   portrait: 'archon_idle', tint: null,                    color: '#7fd0ff' },
    dax:   { name: 'Commandant Dax',    side: 'hero',  role: 'Héros · mech de siège',              portrait: 'siege_idle',  tint: null,                    color: '#c8d4e8' },
    varek: { name: 'Seigneur Varek',    side: 'enemy', role: 'Chef des renégats humains',          portrait: 'a_idleE',     tint: 'rgba(255,40,40,0.35)',  color: '#ff5050' },
    szeth: { name: 'Matriarche Szeth',  side: 'enemy', role: 'Esprit-ruche de Nidus',              portrait: 'beast_idle',  tint: null,                    color: '#ff8a6a' },
    aelon: { name: 'Hiérarque Aelon',   side: 'enemy', role: 'Conclave de Lumen',                  portrait: 'archon_idle', tint: 'rgba(200,120,255,0.3)', color: '#c8a0ff' },
    core:  { name: 'Noyau-Directeur 7', side: 'enemy', role: 'Intelligence de Forge-Oméga',        portrait: 'siege_idle',  tint: 'rgba(255,60,60,0.3)',   color: '#ff7070' },
  };

  // ------------------------------------------------------------ Héros
  ZC.HEROES = {
    kael: { id: 'kael', unit: 'heroKael', name: 'Sergent Kael', title: 'Le Vétéran',
      desc: 'Exo-marine d\'élite : fusil gauss lourd à longue portée, stimpack permanent (T). Polyvalent, frappe aussi les unités volantes.' },
    voss: { id: 'voss', unit: 'heroVoss', name: 'Lieutenante Voss', title: 'L\'Archonte',
      desc: 'Archonte mécanique : frappes d\'énergie de zone, bouclier qui se recharge. Dévastatrice contre les nuées.' },
    dax:  { id: 'dax',  unit: 'heroDax',  name: 'Commandant Dax', title: 'Le Blindé',
      desc: 'Mech de siège de commandement : obus explosifs à très longue portée, blindage épais. Lent mais écrase bunkers et grosses unités.' },
  };
  ZC.HERO_MAX_LEVEL = 10;
  ZC.HERO_RESPAWN = 20;                                 // secondes pour ressusciter le héros au centre de commandement
  ZC.heroReviveCost = (lvl) => 100 + 25 * lvl;           // coût de la résurrection selon le niveau
  ZC.heroXpFor = (lvl) => 50 * lvl * (lvl + 1);
  ZC.heroLevel = (xp) => { let l = 0; while (l < ZC.HERO_MAX_LEVEL && xp >= ZC.heroXpFor(l + 1)) l++; return l; };
  ZC.heroScale = (lvl) => ({ hp: 1 + 0.08 * lvl, dmg: 1 + 0.08 * lvl, armor: Math.floor(lvl / 3) });
  // Répliques des héros avant mission (choisies selon la mission)
  const HERO_LINES = {
    kael: ['Je prends la tête de l\'escouade, Commandant. Dites-moi où tirer.', 'Mes gars sont prêts. On tient, on avance, on nettoie.', 'Encore une grille à reprendre. J\'ai connu pire.', 'Je couvre vos bunkers. Personne ne passe.', 'Donnez l\'ordre, Commandant. Le reste, c\'est mon affaire.', 'On ne laisse personne derrière. Jamais.'],
    voss: ['Mes lames chantent déjà. Qu\'ils viennent.', 'Un bouclier, deux lames, zéro pitié. Allons-y.', 'Je prends le centre. Gardez-moi les flancs.', 'Le Conclave m\'a appris une chose : frapper d\'abord.', 'Six minutes, six heures, peu importe. Je tiens.', 'Ils vont voir ce qu\'un archonte fait à une nuée.'],
    dax:  ['Mon mech est chaud. Donnez-moi une cible et je vous ouvre la route.', 'Les obus parlent plus fort que les discours, Commandant.', 'Je tire à six cases. Ils ne m\'approcheront même pas.', 'Blindage à cent pour cent. On rentre par la porte.', 'Un bunker ennemi ? Deux obus et on en reparle.', 'Je suis lent, mais je ne recule pas.'],
  };

  // ------------------------------------------------------------ Boutique (améliorations passives, hors combat)
  ZC.SHOP = [
    { id: 'armor',    name: 'Blindage renforcé',    icon: '⛨', max: 3, costs: [250, 500, 900],            desc: '+1 armure pour toutes vos unités, par niveau.' },
    { id: 'weapons',  name: 'Munitions perforantes', icon: '✦', max: 3, costs: [250, 500, 900],            desc: '+1 dégât pour toutes vos unités, par niveau.' },
    { id: 'training', name: 'Entraînement',          icon: '♥', max: 5, costs: [150, 250, 400, 600, 900],  desc: '+10 % de points de vie pour vos unités et héros, par niveau.' },
    { id: 'logistic', name: 'Logistique',            icon: '✈', max: 3, costs: [150, 300, 500],            desc: 'Dropships 10 % moins chers, par niveau.' },
    { id: 'factory',  name: 'Chaîne de production',  icon: '⚙', max: 3, costs: [150, 300, 500],            desc: 'Dropships produits 15 % plus vite, par niveau.' },
    { id: 'treasury', name: 'Trésorerie',            icon: '◆', max: 4, costs: [100, 200, 350, 550],       desc: '+50 minerais au début de chaque mission, par niveau.' },
    { id: 'mining',   name: 'Prospection',           icon: '⛏', max: 3, costs: [200, 400, 700],            desc: '+1 minerai par bunker à chaque vague, par niveau.' },
    { id: 'repair',   name: 'Réparation',            icon: '🔧', max: 2, costs: [250, 500],                desc: 'Vos bunkers se réparent 2x puis 3x plus vite.' },
    { id: 'reinforce', name: 'Renforts',             icon: '⇶', max: 3, costs: [150, 300, 500],            desc: '+2 unités de départ, par niveau.' },
    { id: 'mentor',   name: 'Mentorat',              icon: '★', max: 2, costs: [200, 400],                 desc: 'Vos héros gagnent 25 % d\'expérience en plus, par niveau.' },
  ];
  ZC.campaignBonus = (up) => ({
    armor: up.armor || 0, dmg: up.weapons || 0, hp: 1 + 0.10 * (up.training || 0),
    costMult: 1 - 0.10 * (up.logistic || 0), timeMult: 1 - 0.15 * (up.factory || 0),
    startMinerals: 50 * (up.treasury || 0), income: up.mining || 0, regen: 1 + (up.repair || 0),
    startUnits: 2 * (up.reinforce || 0), heroXp: 1 + 0.25 * (up.mentor || 0),
  });

  // ------------------------------------------------------------ Difficultés
  ZC.DIFFICULTIES = {
    easy:   { key: 'easy',   label: 'Facile',    ai: 'easy',   desc: 'IA lentes et peu agressives.' },
    medium: { key: 'medium', label: 'Moyen',     ai: 'normal', desc: 'IA normales.' },
    hard:   { key: 'hard',   label: 'Difficile', ai: 'hard',   desc: 'IA agressives et une IA ennemie de plus.' },
  };

  // ------------------------------------------------------------ Mondes (un par race) et scénarios
  // L'aventure se joue avec la race humaine ; les autres races sont verrouillées pour l'aventure.
  ZC.ADVENTURE_RACE = 'human';
  ZC.WORLDS = [
    { id: 'w1', name: 'Terra Prime', race: 'human',  leader: 'varek', tileset: 'jungle',   color: '#8ad88a',
      desc: 'La planète humaine. Les renégats du seigneur Varek tiennent les secteurs de Kessel-9.',
      names: ['Premier contact', 'Le couloir', 'Tenir la ligne', 'Cœur de grille', 'Frères d\'armes', 'La bande côtière', 'Laboratoires', 'Vagues serrées', 'Tournoi des secteurs', 'Le siège de Kessel', 'Pris en tenaille', 'Trois contre trois', 'Forteresse Varek'],
      taunts: ['Alors c\'est vous, le nouveau jouet d\'Orsk ? Vous ne tiendrez pas une heure.', 'Un couloir, Commandant. Pas de place pour fuir.', 'Mes lieutenants arrivent. Comptez les minutes qu\'il vous reste.', 'Vous êtes au milieu de ma grille. Entouré.', 'Un allié ? Il vous trahira avant la fin.', 'Longue, étroite, mortelle. Cette bande est à moi.', 'Vous n\'avez aucune idée de ce qui sort de ces cuves.', 'Mes vagues ne s\'arrêtent jamais, Commandant.', 'Réglons ça comme des soldats. Premier à deux rounds.', 'Un siège. Pas de minerai, pas de secours. Combien de temps ?', 'Deux fronts, Commandant. Choisissez lequel perdre.', 'Trois contre trois. Vos alliés sont faibles.', 'Venez. Ma forteresse a brisé des flottes entières.'],
      outro: 'Varek est tombé avec sa forteresse. Terra Prime respire, et la Division lève les yeux vers Nidus.' },
    { id: 'w2', name: 'Nidus', race: 'insect', leader: 'szeth', tileset: 'badlands', color: '#ff8a6a',
      desc: 'La planète-ruche de l\'essaim insectoïde. La matriarche Szeth parle d\'une seule voix pour des millions de coureurs.',
      names: ['Atterrissage', 'Galerie étroite', 'Nuée montante', 'Le nid central', 'Alliance fragile', 'La faille', 'Mutations', 'Marée de chitine', 'Rite de la ruche', 'Siège des cuves', 'Entre deux nids', 'Trois essaims', 'La Matriarche'],
      taunts: ['Petits soldats de chair. La ruche vous a déjà digérés.', 'Un tunnel. Mes coureurs y courent plus vite que vous.', 'Nous sommes des millions. Vous êtes huit.', 'Le nid central est le cœur de Nidus. Vous y mourrez.', 'Vos alliés sentent la peur. La ruche aussi.', 'La faille est longue. Mes bêtes y patientent.', 'Nos chairs changent. Les vôtres pourrissent.', 'Chaque vague est plus grosse que la précédente.', 'La ruche accepte votre rite. Deux rounds.', 'Sans minerai, sans secours. La ruche attend.', 'Deux nids vous enserrent, chair tendre.', 'Trois essaims contre trois proies.', 'Je suis Szeth. Je suis Nidus. Venez me rencontrer.'],
      outro: 'La Matriarche s\'est tue. Sans esprit-ruche, les coureurs se dispersent. Lumen est le prochain monde.' },
    { id: 'w3', name: 'Lumen', race: 'energy', leader: 'aelon', tileset: 'space', color: '#7fd0ff',
      desc: 'Le monde-cristal des guerriers d\'énergie. Le Conclave du hiérarque Aelon considère la Division comme une impureté.',
      names: ['Lumière froide', 'Le pont de cristal', 'Veille des lames', 'Le sanctuaire', 'Pacte d\'énergie', 'La crête', 'Transcendance', 'Déferlante', 'Épreuve du Conclave', 'Siège du sanctuaire', 'Entre deux lames', 'Trois conclaves', 'Le Hiérarque'],
      taunts: ['Impureté détectée. Le Conclave vous purgera.', 'Un pont. Un seul chemin. Nos lames l\'attendent.', 'Tenez si vous le pouvez. Nos lames ne se fatiguent pas.', 'Le sanctuaire est à nous depuis mille cycles.', 'Un allié impur n\'est qu\'une impureté de plus.', 'La crête est étroite et nos boucliers sont larges.', 'L\'énergie évolue. Vous, non.', 'Déferlez tant que vous voulez. Les boucliers tiennent.', 'Le Conclave accepte l\'épreuve. Deux rounds.', 'Sans minerai, votre résistance est pure arithmétique.', 'Deux lames, un cou.', 'Trois conclaves jugent trois impuretés.', 'Je suis Aelon. La lumière ne négocie pas.'],
      outro: 'Le Hiérarque est tombé et le Conclave s\'est dispersé. Ne reste que Forge-Oméga.' },
    { id: 'w4', name: 'Forge-Oméga', race: 'mecha', leader: 'core', tileset: 'space', color: '#c8d4e8',
      desc: 'La planète-usine des mécas cybernétiques. Le Noyau-Directeur 7 calcule votre défaite depuis votre arrivée dans le secteur.',
      names: ['Ligne d\'assemblage', 'Le convoyeur', 'Protocole de siège', 'Le noyau', 'Alliance de circonstance', 'Le canyon de fer', 'Mise à jour', 'Surproduction', 'Simulation 9', 'Siège de la forge', 'Pinces d\'acier', 'Trois réseaux', 'Noyau-Directeur'],
      taunts: ['Probabilité de victoire : 2 %. Procédure d\'élimination lancée.', 'Convoyeur linéaire. Vos options : avancer, mourir.', 'Protocole de siège activé. Durée estimée de votre résistance : courte.', 'Le noyau est protégé par 4 096 mechs. Je recompte.', 'Votre allié est une variable. Je l\'annulerai.', 'Canyon étroit. Tir de siège optimal.', 'Mise à jour des mechs : 2.0. Mise à jour des humains : aucune.', 'Production : 100 %. Vos pertes : 100 %.', 'Simulation 9 : deux rounds. Résultat déjà calculé.', 'Ressources : zéro. Issue : zéro.', 'Deux pinces d\'acier se referment.', 'Trois réseaux contre trois erreurs.', 'Je suis le Noyau-Directeur. Terminons cette simulation.'],
      outro: 'Le Noyau-Directeur s\'est éteint. Les quatre mondes sont libres. La Division Bunker a gagné sa guerre.' },
  ];
  // Treize scénarios, joués sur chaque monde (contre la race du monde). obj : eliminate | survive | rounds
  ZC.SCENARIOS = [
    { key: 'contact',   brief: 'Un avant-poste {enemy} s\'est installé sur une petite grille. Prenez le contrôle et éliminez-le.', obj: { type: 'eliminate' }, set: { mapZones: 5, aiCount: 1, startUnits: 8 },
      line: ['ops', 'Un seul chef de guerre, mal équipé, sur une grille 5x5. Idéal pour prendre nos marques sur {world}.'] },
    { key: 'corridor',  brief: 'Un couloir de cinq zones, un adversaire en face. Pas de contournement possible : poussez.', obj: { type: 'eliminate' }, set: { mapZones: 5, mapZonesY: 1, aiCount: 1, startUnits: 8 },
      line: ['orsk', 'Carte en couloir : une seule ligne de zones. Tout se joue sur la zone centrale, qui produit le double.'] },
    { key: 'holdline',  brief: 'Aucune base ennemie : les vagues {enemy} déferlent par les bords de la carte, de plus en plus grosses, toutes les 15 à 35 secondes. Aucun minerai de départ : vos travailleurs devront récolter. Tenez 5 minutes jusqu\'aux renforts.', obj: { type: 'survive', time: 300 }, set: { mapZones: 5, aiCount: 0, startUnits: 8, startMinerals: 0, invasion: { min: 15, max: 35, scale: 1 } },
      line: ['ops', 'Cinq minutes avant la flotte, et zéro minerai de départ. Ils n\'ont pas de base : ils arrivent par vagues, de n\'importe quel bord. Garnissez vos bunkers, Commandant.'] },
    { key: 'center',    brief: 'Vous démarrez au cœur de la grille avec deux zones d\'avance et la zone centrale. Trois chefs de guerre vous entourent.', obj: { type: 'eliminate' }, set: { mapZones: 7, aiCount: 3, startUnits: 8, humanStart: 'center', extraZones: 2 },
      line: ['orsk', 'Nos éclaireurs ont pris le centre avant eux : vous partez avec trois zones et une production doublée. Ne gaspillez pas cette avance.'] },
    { key: 'teams',     brief: 'Un allié vous rejoint : deux contre deux sur une grille 7x7. Coordonnez-vous avec lui.', obj: { type: 'eliminate' }, set: { mapZones: 7, aiCount: 3, teams: [0, 0, 1, 1], startUnits: 8 },
      line: ['ops', 'Une armée alliée se bat à vos côtés (en jaune). Vous ne pouvez pas la commander, mais elle ne vous tirera jamais dessus.'] },
    { key: 'ribbon',    brief: 'Une longue bande de 3 zones sur 9. Deux adversaires aux extrémités, vous au milieu du chaos.', obj: { type: 'eliminate' }, set: { mapZones: 3, mapZonesY: 9, aiCount: 2, startUnits: 8 },
      line: ['orsk', 'Grille 3x9 : étroite et longue. Les fronts sont partout. Prenez les zones une à une.'] },
    { key: 'evolution', brief: 'Les unités produites changent à chaque round, pour tout le monde. Adaptez-vous plus vite que l\'ennemi.', obj: { type: 'eliminate' }, set: { mode: 'evolution', mapZones: 7, aiCount: 2, startUnits: 8, roundDuration: 100 },
      line: ['ops', 'Mode évolution : vos bunkers produisent la même créature que l\'ennemi, et elle change toutes les 1 min 40. Vos améliorations restent.'] },
    { key: 'rush',      brief: 'Les vagues arrivent toutes les 4 secondes et la supply est limitée. Trois chefs de guerre, une grille 5x5 : ça va aller vite.', obj: { type: 'eliminate' }, set: { mapZones: 5, aiCount: 3, spawnInterval: 4, unitCap: 60, startUnits: 10 },
      line: ['orsk', 'Vagues toutes les 4 secondes, supply à 60. Dépensez vite, attaquez vite : ici on ne thésaurise pas.'] },
    { key: 'tournament', brief: 'L\'ennemi propose un duel réglé : des rounds, une unité par round, le premier à deux victoires garde le secteur.', obj: { type: 'rounds', wins: 2 }, set: { mode: 'rounds', mapZones: 5, aiCount: 3, startUnits: 8, roundsToWin: 2, roundTimeLimit: 240 },
      line: ['orsk', 'C\'est un piège, évidemment. Mais une victoire devant ses propres troupes vaut dix batailles. Acceptez.'] },
    { key: 'siege',     brief: 'Un siège sans base ennemie : les vagues {enemy} déferlent sur vos trois zones par tous les bords, toutes les 15 à 35 secondes. Aucun minerai de départ : tenez 8 minutes avec ce que vos travailleurs ramènent.', obj: { type: 'survive', time: 480 }, set: { mapZones: 7, aiCount: 0, extraZones: 2, startMinerals: 0, startUnits: 8, invasion: { min: 15, max: 35, scale: 1.3 } },
      line: ['ops', 'Huit minutes. Vous avez trois zones et quatre ennemis. Les bunkers garnis sont votre seule chance.'] },
    { key: 'ambush',    brief: 'Une bande de 7 zones sur 3, vous au centre, un chef de guerre à chaque bout. Deux fronts à la fois.', obj: { type: 'eliminate' }, set: { mapZones: 7, mapZonesY: 3, aiCount: 2, humanStart: 'center', startUnits: 6 },
      line: ['orsk', 'Pris en tenaille : deux ennemis, deux directions. La zone centrale produit le double, servez-vous-en.'] },
    { key: 'bigteams',  brief: 'Trois contre trois sur une grille 9x9. Vos deux alliés tiennent leurs flancs ; à vous de percer.', obj: { type: 'eliminate' }, set: { mapZones: 9, aiCount: 5, teams: [0, 0, 0, 1, 1, 1], startUnits: 10 },
      line: ['ops', 'Deux armées alliées (en jaune) se battent avec vous. La grille est grande : prenez le centre avant l\'ennemi.'] },
    { key: 'fortress',  brief: 'L\'assaut final sur ce monde : une grille immense tenue par cinq chefs de guerre. Ne laissez rien debout.', obj: { type: 'eliminate' }, set: { mapZones: 9, aiCount: 5, startUnits: 12, unitCap: 150 },
      line: ['orsk', 'Tout ce que vous avez acheté, tout ce que vos héros ont appris : c\'est maintenant. Zone après zone.'] },
  ];
  const ENEMY = { human: 'renégat', insect: 'insectoïde', energy: 'du Conclave', mecha: 'cybernétique' };
  // Génération des missions : 4 mondes x 13 scénarios
  ZC.MISSIONS = [];
  ZC.WORLDS.forEach((w, wi) => {
    w.missions = [];
    ZC.SCENARIOS.forEach((sc, i) => {
      const base = Math.round((10 + i * 3) * (1 + wi * 0.6));
      const r5 = (v) => Math.max(5, Math.round(v / 5) * 5);
      const m = {
        id: w.id + 'm' + (i + 1), world: w.id, index: i, scenario: sc.key,
        name: w.names[i], brief: sc.brief.replace('{enemy}', ENEMY[w.race]).replace('{world}', w.name),
        objective: sc.obj, settings: Object.assign({ mode: 'classic', tileset: w.tileset }, sc.set),
        points: { easy: r5(base), medium: r5(base * 2), hard: r5(base * 3.5) },
        line: [sc.line[0], sc.line[1].replace('{world}', w.name)], taunt: [w.leader, w.taunts[i]],
        x: i < 7 ? 8 + i * 14 : 92 - (i - 7) * 14, y: i < 7 ? 30 : 72,
      };
      w.missions.push(m); ZC.MISSIONS.push(m);
    });
  });

  // ------------------------------------------------------------ Progression sauvegardée
  const KEY = 'bz-campaign';
  const blank = () => ({ points: 0, earned: 0, upgrades: {}, missions: {}, heroes: { kael: { xp: 0 }, voss: { xp: 0 }, dax: { xp: 0 } }, hero: 'kael', world: 'w1' });

  class Campaign {
    constructor() { this.data = blank(); this.load(); }
    load() {
      try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) this.data = Object.assign(blank(), d, { heroes: Object.assign(blank().heroes, d.heroes || {}) }); } catch (e) { /* ignore */ }
    }
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } }
    reset() { this.data = blank(); this.save(); }

    get points() { return this.data.points; }
    world(id) { return ZC.WORLDS.find(w => w.id === id); }
    mission(id) { return ZC.MISSIONS.find(m => m.id === id); }
    done(id, diff) { return !!(this.data.missions[id] && this.data.missions[id][diff]); }
    completed(id) { const m = this.data.missions[id]; return !!(m && (m.easy || m.medium || m.hard)); }
    worldCompleted(wid) { return this.world(wid).missions.every(m => this.completed(m.id)); }
    worldUnlocked(wid) { const i = ZC.WORLDS.findIndex(w => w.id === wid); return i === 0 || this.worldCompleted(ZC.WORLDS[i - 1].id); }
    unlocked(id) {
      const m = this.mission(id);
      if (!this.worldUnlocked(m.world)) return false;
      return m.index === 0 || this.completed(this.world(m.world).missions[m.index - 1].id);
    }
    remaining(id) { const m = this.mission(id); let s = 0; for (const d in m.points) if (!this.done(id, d)) s += m.points[d]; return s; }
    worldPoints(wid) { let s = 0, e = 0; for (const m of this.world(wid).missions) for (const d in m.points) { s += m.points[d]; if (this.done(m.id, d)) e += m.points[d]; } return { total: s, earned: e }; }
    totalPoints() { let s = 0; for (const m of ZC.MISSIONS) for (const d in m.points) s += m.points[d]; return s; }

    level(id) { return this.data.upgrades[id] || 0; }
    cost(id) { const u = ZC.SHOP.find(s => s.id === id), l = this.level(id); return l >= u.max ? -1 : u.costs[l]; }
    buy(id) {
      const c = this.cost(id);
      if (c < 0 || this.data.points < c) return false;
      this.data.points -= c; this.data.upgrades[id] = this.level(id) + 1; this.save();
      return true;
    }
    bonus() { return ZC.campaignBonus(this.data.upgrades); }

    hero(id) { const h = this.data.heroes[id || this.data.hero]; return { id: id || this.data.hero, xp: h.xp, level: ZC.heroLevel(h.xp) }; }
    selectHero(id) { if (ZC.HEROES[id]) { this.data.hero = id; this.save(); } }
    selectWorld(id) { if (this.world(id)) { this.data.world = id; this.save(); } }

    // Dialogue d'avant-mission : briefing, provocation du chef ennemi, réplique du héros choisi
    dialogue(id) {
      const m = this.mission(id), h = this.data.hero;
      return [m.line, m.taunt, [h, HERO_LINES[h][m.index % HERO_LINES[h].length]]];
    }

    // Réglages de partie pour une mission (fusionnés avec les réglages généraux du joueur)
    missionSettings(id, diff) {
      const m = this.mission(id), w = this.world(m.world), d = ZC.DIFFICULTIES[diff], h = this.hero();
      const s = Object.assign({}, m.settings, { difficulty: d.ai, humanPlayer: true, admin: false, playerRace: ZC.ADVENTURE_RACE, aiRace: w.race });
      if (s.invasion) { // missions de survie : la difficulté règle la taille et le rythme des vagues, pas le nombre d'IA
        const k = diff === 'easy' ? 0.7 : diff === 'hard' ? 1.5 : 1;
        s.invasion = Object.assign({}, s.invasion, { scale: (s.invasion.scale || 1) * k, min: diff === 'hard' ? 12 : s.invasion.min, max: diff === 'hard' ? 28 : s.invasion.max, name: (ZC.CHARACTERS[w.leader] || {}).name || 'Envahisseurs' });
      }
      else if (diff === 'hard') { s.aiCount = Math.min(7, (s.aiCount || 1) + 1); if (s.teams) s.teams = s.teams.concat([1]); }
      s.campaign = { mission: id, difficulty: diff, objective: m.objective, bonus: this.bonus(), hero: { id: h.id, level: h.level, xp: h.xp, unit: ZC.HEROES[h.id].unit } };
      return s;
    }

    // Fin de mission : points (première réussite par difficulté) et expérience du héros
    onMissionEnd(game, victory) {
      const c = game.settings.campaign; if (!c) return null;
      const m = this.mission(c.mission), w = this.world(m.world);
      const res = { victory, points: 0, firstTime: false, xp: Math.round(game.heroXpGained || 0), heroId: c.hero.id, levelBefore: c.hero.level, levelAfter: c.hero.level, outro: '', worldDone: false };
      const h = this.data.heroes[c.hero.id];
      h.xp += res.xp; res.levelAfter = ZC.heroLevel(h.xp);
      if (victory && !this.done(c.mission, c.difficulty)) {
        res.points = m.points[c.difficulty]; res.firstTime = true;
        this.data.points += res.points; this.data.earned += res.points;
        this.data.missions[c.mission] = this.data.missions[c.mission] || {};
        this.data.missions[c.mission][c.difficulty] = true;
      }
      if (victory && m.index === ZC.SCENARIOS.length - 1) { res.outro = w.outro; res.worldDone = this.worldCompleted(w.id); }
      this.save();
      return res;
    }
  }
  ZC.Campaign = Campaign;
})(window.ZC);
