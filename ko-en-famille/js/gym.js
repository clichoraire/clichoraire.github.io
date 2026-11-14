// K.O. en Famille — salle d’entraînement : un mini-jeu par statistique, séances de 60 secondes, 90 secondes pour les mitaines.
// L’XP s’accumule pendant la séance et est donnée quand on arrête (Échap / bouton « Terminer »).
// Le coach tire un exercice au sort ; ses défis se débloquent en les réussissant.
//   Force    : sac de frappe — Libre (balancement et esquives), Jauge (zone rouge).
//   Rapidité : ballon élastique — refrapper du bon gant, bloquer ou esquiver.
//   Stamina  : corde à sauter — sauter au bon moment (et la corde devient néon, électrique… puis EN FEU).
//   Souffle  : le coach (le vrai !) frappe avec ses mitaines — esquiver ; il gagne des pouvoirs en montant.
(function (root) {
  'use strict';
  const BX = root.BX, A = BX.art, AU = BX.audio;
  const G = BX.gym = {};
  const W = 1280, H = 720, TAU = Math.PI * 2;
  G.uiPanel=(ctx,x,y,w,h,r=18)=>{const gr=ctx.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'#2a1c55');gr.addColorStop(1,'#0d0820');ctx.fillStyle=gr;A.rr(ctx,x,y,w,h,r);ctx.fill();ctx.strokeStyle='#ffd54f';ctx.lineWidth=2;ctx.stroke();};
  const rand = (a, b) => a + Math.random() * (b - a), lerp = A.lerp, clamp = A.clamp;
  const pick = a => a[Math.random() * a.length | 0];
  let S = null, bg = null, bgQ = 0;

  // Expérience nécessaire pour passer de v à v+1 (courbe raide).
  G.duration = (stat, mode) => mode === 'bench' ? 120 : stat === 'souffle' && !mode ? 90 : 60;
  G.DIFFICULTIES = [
    { name: 'Facile', pace: 1, features: 10, desc: 'Tous les effets, un rythme souple.' },
    { name: 'Normal', pace: 5, features: 10, desc: 'Tous les effets, un rythme soutenu.' },
    { name: 'Difficile', pace: 10, features: 10, desc: 'Tous les effets, à pleine vitesse.' },
  ];
  // Réglages Facile : conserver le répertoire, élargir les délais et plafonner l’emballement.
  G.isEasy = state => state.difficulty === 1;
  G.tune = (state, values) => values[G.tier(state.difficulty) - 1];
  G.ropeJumpDuration = state => G.tune(state, [.65, .52, .44]);
  G.ropeSpeedCap = state => G.tune(state, [5, 6, 7]);
  G.difficulty = lvl => G.DIFFICULTIES[G.tier(lvl) - 1];
  G.tier = lvl => Math.max(1, Math.min(3, Math.floor(Number(lvl) || 1)));
  G.migrateDifficulties = p => {
    if (p.gymDifficultyVersion === 2) return false;
    const convert = value => Number(value) >= 8 ? 3 : Number(value) >= 4 ? 2 : 1;
    for (const field of ['gymLevels', 'gymSelected']) {
      p[field] = Object.fromEntries(Object.entries(p[field] || {}).map(([key, value]) => [key, convert(value)]));
    }
    if (p.c?.pendingWorkout) p.c.pendingWorkout.lvl = convert(p.c.pendingWorkout.lvl);
    p.gymDifficultyVersion = 2;
    return true;
  };
  G.MAX_TIME = 60; // une minute pour accumuler le plus d’XP possible
  G.need = v => 80 + 40 * v + 10 * v * v;
  // Rejouer en facile conserve toute sa récompense, même après déblocage.
  G.relax = () => 1;

  G.EX = {
    force: { name: 'Sac de frappe', icon: '💪', rate: .05 },
    vitesse: { name: 'Ballon élastique', icon: '⚡', rate: .1, how: 'Frappe le ballon (Z / X). Quand il revient : refrappe-le du gant de son côté, bloque (tiens ↓) ou esquive (← →, ↓↓). Pendant qu’il est loin : feintes ← → bonus !' },
    stamina: { name: 'Corde à sauter', icon: '❤️', rate: .3, how: 'Deux adultes tournent la corde. Saute (Espace). Déplace-toi (← →) pour éviter les objets dès le premier défi.' },
    souffle: { name: 'Mitaines du coach', icon: '🌬️', rate: .25, how: 'Mitaine jaune : frappe avec Z ou X. Attaque orange : esquive ou bloque. Réussis la série 4 fois.' },
  };
  G.MODES = {
    force: [
      { id: 'jauge', name: 'Jauge', icon: '📊', rate: .05, how: 'Frappe (Z / X) quand l’aiguille est dans la zone ROUGE.' },
      { id: 'libre', name: 'Libre', icon: '🥊', rate: .08, how: 'Frappe librement : Z / X au corps, ↑ + Z / X en haut, Espace uppercut. Après 3–4 coups rapides, esquive le retour (← → ou ↓↓), puis reprends !' },
    ],
    vitesse: [
      { id: 'poire', name: 'Poire de vitesse', icon: '🍐', rate: .08, how: 'Z / X : deux coups fixent ton tempo. Sur les temps suivants, frappe ou esquive avec ← / → (2 esquives alternées maximum), puis reprends Z / X au même rythme. Reprise réussie : bonus XP !' },
      { id: 'elastique', name: 'Ballon double élastique', icon: '🎈', rate: .1, how: 'Frappe le ballon (Z / X). Quand il revient : refrappe-le du gant de son côté, bloque (tiens ↓) ou esquive (← →, ↓↓). Pendant qu’il est loin : feintes ← → bonus !' },
      { id: 'punching', name: 'Punching-ball', icon: '🥊', rate: .12, how: 'Frappe-le (Z / X) : le ressort le renvoie vers toi. Refrappe-le du gant de son côté quand il revient !' },
    ],
  };
  // Ce qui s’ajoute à chaque niveau.
  G.LEVELS = {
    jauge: ['La jauge de base : grosse zone rouge', 'Zone mobile : la zone rouge se promène', 'Zone dorée : petite zone OR qui vaut le double', 'Aiguille capricieuse : sa vitesse varie', 'Précision : la zone rouge se resserre', 'Zone qui rapetisse quand tu enchaînes', 'Aiguille qui change de sens', 'Le sac revient ! Esquive-le (← → ou ↓↓)', 'Zone clignotante', 'Mode CHAMPION : tout en même temps, plus vite'],
    libre: Array.from({length:10},(_,i)=>'Frappe librement, varie tes coups et esquive · retours '+(i===0?'souples':'plus rapides')),
    combos: ['Jauge et bonus d’enchaînement doublé', 'Zone mobile', 'Zone dorée', 'Aiguille capricieuse', 'Zone plus précise', 'Zone qui rapetisse', 'Aiguille qui change de sens', 'Le sac revient : esquive !', 'Zone clignotante', 'Mode CHAMPION'],
    poire: ['Donne ton tempo', 'Garde ta cadence', 'Enchaîne librement', 'Une plus longue série', 'Change de tempo', 'Trouve ton rythme', 'Tiens la cadence', 'Au son et à l’œil', 'Endurance et régularité', 'Mode CHAMPION'],
    punching: ['Le punching-ball de base', 'Ressort plus raide : plus rapide', 'Il revient de côté : frappe avec le gant de son côté', 'Ressort fou : rebonds imprévisibles', 'Il BRILLE : uppercut (Espace) pour le triple', 'Coup de ressort : il fonce de côté, esquive (← →) !', 'Ressort encore plus raide', 'Moins de freinage : il revient plus fort', 'Cercle caché', 'Mode CHAMPION'],
    elastique: ['Le ballon de base', 'Retours plus rapides', 'Ballon qui zigzague', 'Ballon vicieux : il change de côté en chemin', 'Ballon de PLOMB (gris) : bloque-le ou esquive, ne le frappe pas !', 'Coup de fouet : retours éclair', 'Ballon HAUT (violet) : seulement ↓↓', 'Ballon qui hésite… puis fonce', 'Brouillard : son côté se voit à la dernière seconde', 'Mode CHAMPION'],
    stamina: ['La corde de base', 'Ça accélère plus vite', 'Corde NÉON : déplace-toi (← →) pour éviter les objets', 'Double tour (corde dorée) : un tour super rapide', 'Corde ÉLECTRIQUE : objets plus gros et plus rapides', 'Arrêts surprise : la corde s’arrête net', 'Corde EN FEU : doubles chutes d’objets et rythme irrégulier', 'Corde invisible quand elle passe derrière', 'Saut croisé (corde violette) : saute avec ↓', 'Corde de LAVE : saute et esquive, mode champion'],
    souffle: ['Séries mixtes : frappe et esquive', 'Le coach accélère et balaie en haut', 'Feinte : la mitaine tremble… ne bouge pas !', 'Enchaînements mixtes plus rapides', 'Pouvoir : MITAINE DE FEU 🔥 (plus rapide)', 'Uppercut d’en bas : bloque (tiens ↓)', 'Pouvoir : TÉLÉPORTATION ⚡ (change de côté au dernier moment)', 'Séries de six gestes', 'Frappes et esquives à haute vitesse', 'Mode LÉGENDE : tous les pouvoirs, plus vite'],
  };
  G.levelKey = (stat, mode) => G.extra?.defs[mode] ? mode : G.MODES[stat] ? (mode || G.MODES[stat][0].id) : stat;
  // La difficulté se débloque par exercice, indépendamment des statistiques du jeune.
  const CHALLENGES = {
    jauge: [12, 'coups puissants'], libre: [24, 'frappes réussies'], combos: [12, 'coups puissants'],
    poire: [18, 'frappes réussies'], elastique: [12, 'retours maîtrisés'], punching: [16, 'frappes réussies'],
    stamina: [18, 'sauts réussis'], souffle: [16, 'gestes réussis'],
  };
  G.challenge = (stat, mode, lvl) => {
    const tier = G.tier(lvl), key = G.levelKey(stat, mode), [base, label] = G.extra?.defs[key] ? [G.extra.defs[key].goal, G.extra.defs[key].goalLabel] : CHALLENGES[key];
    // Les ateliers lents ne peuvent pas absorber un ajout fixe de 18 actions.
    const targets = key === 'mannequin' ? [12,24,36] : key === 'course' ? [20,30,40] : key === 'bench' ? [4,4,4] : key === 'oeufs' ? [6,9,12] : [Math.ceil(base*.65),base,Math.ceil(base*1.25)];
    return { target: targets[tier-1], label, avoid: stat === 'stamina' && !G.extra?.defs[mode] ? [2,4,6][tier-1] : 0 };
  };
  G.xpMultiplier = (lvl, max) => [1, 1.5, 2][G.tier(lvl) - 1];
  G.poireGuideVisible = () => false;
  const RATINGS = [
    { min: 0, title: 'ON SE RÉCHAUFFE', color: '#b8d6d2' },
    { min: 8, title: 'BEAU TRAVAIL !', color: '#81c784' },
    { min: 20, title: 'ÇA COGNE FORT !', color: '#63c4ed' },
    { min: 40, title: 'CHAMPION DU GYM !', color: '#f3c962' },
    { min: 75, title: 'PLUIE D’XP !', color: '#f5a2dd' },
    { min: 120, title: 'LÉGENDAIRE !', color: '#fff1ad' },
  ];
  G.rating = xp => { const tier = RATINGS.reduce((at, r, i) => xp >= r.min ? i : at, 0); return Object.assign({ tier }, RATINGS[tier]); };
  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'up', KeyZ: 'pL', KeyX: 'pR', Space: 'upper', KeyC: 'upper' };

  // opts : { mode (force), max (difficulté débloquée), bonus (multiplicateur du coach), coach (personnage) }
  G.start = function (stat, ch, onDone, lvl, opts) {
    opts = {...opts}; if(stat==='force'&&opts.mode==='combos')opts.mode='libre'; const difficulty = G.tier(lvl); lvl = G.difficulty(difficulty).pace;
    S = { stat, ch, onDone, lvl, difficulty, features: G.difficulty(difficulty).features, mode: G.extra?.defs[opts.mode] ? opts.mode : G.MODES[stat] ? (opts.mode || G.MODES[stat][0].id) : null, max: G.tier(opts.max || difficulty), bonus: opts.bonus || 1, coach: opts.coach || null,
      t: 0, phase: 'ready', phT: 0, score: 0, best: 0, combo: 0, successes: 0, challenge: G.challenge(stat, opts.mode, difficulty), misses: 0, msgs: [], pose: null, poseT: 9, done: false, lastDown: -9, xpf: 0, goT: 0, guard: false, upHeld: false, fx: [] };
    S.vegetable = opts.vegetable;
    S.stats = opts.stats || ch.stats; S.mods = opts.mods || {}; S.combos = opts.combos || [];
    S.strength = opts.strength || ch.stats?.force || 1;
    S.duration = G.duration(stat, opts.mode);
    // lvl reste l’intensité du moteur (1 / 5 / 10) ; difficulty est le choix public (1 / 2 / 3).
    const L = lvl;
    if (stat === 'force') {
      Object.assign(S, { bag: 0, bagV: 0, swing: null, nextSwing: rand(5, 8), lastHand: null });
      if (S.mode !== 'libre') { Object.assign(S, { ph: 0, dir: 1, sp0: G.tune(S,[1.5,2,2.5]), revT: rand(2, 4), gold: null }); S.sp = S.sp0; newZone(); }
      if (S.mode === 'libre') S.free={hits:0,styles:{},recent:[],energy:0,depth:0,depthV:0,impactAt:-9,impactPower:0,hitStop:0,lastAt:-9,swings:0,dodges:0,collisions:0,hitPoints:0,stylePoints:0,swingPoints:0,dodgePoints:0};
      newCombo();
    }
    if (stat === 'vitesse' && S.mode === 'poire') Object.assign(S, { pb: { st: 'rest', u: 0, cur: .5, lastAt: null, tempoKnown: false, dodges: 0, dodgeSide: null, amplitude: 1, trip: 0, gold: false }, tempoT: 6, lastHand: null });
    if (stat === 'vitesse' && S.mode === 'punching') Object.assign(S, { pu: { z: 0, vz: 0, x: 0, vx: 0, glow: false, charge: 0, armed: false, hitCD: 0 }, lastHand: null });
    if (stat === 'vitesse') Object.assign(S, { ball: { st: 'rest', z: 0, x: 0, side: 0, sv: 0, t: 0, dur: 1, back: 1, kk: 0, kind: 'normal' }, rally: 0 });
    if (stat === 'souffle') Object.assign(S, { atk: null, queue: [], nextIn: 1.2, dodgeDir: null, dodgeT: 9, moved: false, shout: null, spin: 0, teleFx: 0 });
    if (stat === 'stamina') Object.assign(S, { ang: Math.PI, w0: 3 + L * .3, w: 3 + L * .3, jumps: 0, jumpT: -1, jumpKind: 'up', trip: 0, burn: 0, burnKind:null,ropeHp:100,ropeMaxHp:100,ropeDamageAt:-10, req: 'up', dbl: 0, dblNext: false, halt: 0, haltNext: false, tempoT: 5,
      ropeX: 755, ropeKeys: { left: false, right: false }, obstacles: [], obstacleNext: 2.5, obstacleHit: 0, obstaclesDodged: 0 });
    if(G.extra?.defs[S.mode])G.extra.init(S,{streak,miss,msg,pose,puff});
    AU.crowd(0);
  };
  G.click = (x,y) => {
    if(!S||S.mode!=='poulet')return false;
    if(S.phase==='ready'){S.phase='go';S.phT=0;AU.play('bell1');return true;}
    return G.extra.click(S,x,y);
  };
  G.state = () => S;
  G.stop = () => { S = null; };
  G.clearKeys = () => { if(S?.cb?.charge)S.chargeKey=null; if(S?.work){S.work.held={};if(S.work.combat)BX.fight.practice.clear(S.work.combat);} if (S && S.ropeKeys) S.ropeKeys.left = S.ropeKeys.right = false; };
  const rate = () => S.work ? .08 : G.MODES[S.stat] ? G.MODES[S.stat].find(m => m.id === S.mode).rate : G.EX[S.stat].rate;
  G.xp = () => S ? Math.round(S.xpf * G.xpMultiplier(S.difficulty, S.max) * S.bonus) : 0;
  // Le rendement reste constant pendant toute la minute.
  G.fatigue = () => 1;
  const ACTIONS = { jauge: 40, libre: 65, combos: 40, poire: 140, elastique: 24, punching: 40, stamina: 40, souffle: 26 };
  G.actionXp = (stat, mode) => G.extra?.defs[mode] ? 100/G.extra.defs[mode].actions : (stat === 'stamina' ? 80 : 100) / ACTIONS[G.levelKey(stat, mode)];
  function awardAction(quality = 1) { S.xpf += G.actionXp(S.stat, S.mode) * quality; }
  function gain(n) { S.score += n; S.xpf += n * rate() * .1; }
  G.started = () => !!S && S.phase === 'go';
  G.finish = function () {
    if (!S || S.phase !== 'go') return false;
    S.phase = 'end'; S.phT = 0; S.rating = G.rating(G.xp());if(S.work?.ko||S.trainingKO)S.rating={tier:0,title:S.stat==='stamina'?'K.O. — FIN DE LA CORDE':'K.O. — FIN DU SPARRING',color:'#ffac94'}; if(S.work?.failed)S.rating={tier:0,title:S.mode==='mannequin'?'FIN DU DÉFI — RÉESSAIE !':S.mode==='tennis'?'K.O. — FIN DES ESQUIVES':'FIN DE LA COURSE — 3 ERREURS',color:'#ffac94'}; S.endHold = 3 + S.rating.tier * .18;
    if (G.passed()) S.endHold = Math.max(2, S.endHold);
    if (S.rating.tier > 0) { puff(370, 260, S.rating.color, 8 + S.rating.tier * 9); puff(910, 260, '#ffd878', 8 + S.rating.tier * 9); }
    AU.play('bell'); AU.play(S.work?.ko?'down':S.rating.tier >= 4 ? 'win' : S.rating.tier >= 2 ? 'star' : 'chime'); return true;
  };
  G.passed = () => !S.trainingKO && !S.work?.failed && !S.work?.ko && S.successes >= S.challenge.target && (!S.challenge.avoid || S.obstaclesDodged >= S.challenge.avoid);
  G.result = () => ({ stat: S.stat, score: S.score, xp: G.xp(), best: S.best, lvl: S.difficulty, mode: S.mode, distance: ['pneu','traineau'].includes(S.mode)?S.work.distance:null,
    sparring:S.mode==='sparring'?{defended:S.work.defended,counters:S.work.counters,errors:S.work.errors,hp:S.work.hp,ko:!!S.work.ko}:null, free: S.free ? {...S.free,styles:Object.keys(S.free.styles).length,recent:undefined} : null, successes: S.successes, challenge: S.challenge, passed: G.passed(), obstaclesDodged: S.obstaclesDodged || 0, elapsed: S.goT, healthBonus: S.mode==='repas' ? Math.min(.2,Math.floor(S.work.caught/3)/100) : 0 });

  function msg(text, col, size) { S.msgs.push({ text, col: col || '#fff', size: size || 54, t: 0 }); if (S.msgs.length > 3) S.msgs.shift(); }
  function pose(p) { S.pose = p; S.poseT = 0; }
  const has = n => S.features >= n;
  function streak(pts) {
    S.combo++; S.best = Math.max(S.best, S.combo); gain(pts); awardAction(); S.successes++;
    if (G.passed() && !S.goalAnnounced) { S.goalAnnounced = true; msg('DÉFI RÉUSSI !', '#81c784', 54); AU.play('star'); }
  }
  function miss() { S.combo = 0; S.misses++; }
  function puff(x, y, col, n) { for (let i = 0; i < (n || 8); i++) S.fx.push({ x, y, vx: rand(-160, 160), vy: rand(-220, -40), t: 0, life: rand(.4, .8), col, r: rand(5, 12) }); }

  G.keydown = function (e) {
    if(S?.work){if(e.repeat)return true;if(S.phase==='ready'){if(['Space'].includes(e.code)){S.phase='go';S.phT=0;AU.play('bell1');}return true;}if(S.phase==='go')G.extra.input(S,e);return true;}
    const a = KEYS[e.code]; if (!S || !a || e.repeat) return !!a;
    if (a === 'up') S.upHeld = true;
    if (S.stat === 'lesson') { if(S.cb.charge){if(S.phase==='go'&&!S.chargeKey&&['pL','pR'].includes(a)){S.chargeKey=a;S.chargeStart=S.t;}return true;} lessonKey(a); return true; }
    if (S.phase === 'ready') { if (a === 'upper' || a === 'pL' || a === 'pR') { S.phase = 'go'; S.phT = 0; AU.play('bell1'); } return true; }
    if (S.phase !== 'go') return true;
    if (S.stat === 'force') bagInput(a);
    if (S.stat === 'vitesse') (S.mode === 'poire' ? poireInput : S.mode === 'punching' ? punchInput : ballInput)(a);
    if (S.stat === 'stamina') {
      if (a === 'upper') jump('up');
      else if (a === 'down') jump('down');
      else if (a === 'left' || a === 'right') S.ropeKeys[a] = true;
    }
    if (S.stat === 'souffle') mittInput(a);
    return true;
  };
  G.keyup = function (e) {
    if (!S) return;
    if(S.work){G.extra.release(S,e);return;}
    if(S.stat==='lesson'&&S.cb.charge&&S.chargeKey===KEYS[e.code]){
      const held=S.t-S.chargeStart;S.chargeKey=null;
      if(S.phase==='go'&&held>=.7){S.rep++;S.powerHitAt=S.t;AU.play('bigpunch');if(S.rep>=4){S.phase='end';S.phT=0;}}
      else if(S.phase==='go')msg('Tiens au moins un peu plus longtemps !','#ffcb9b',26);
      return;
    }
    if (S.ropeKeys && KEYS[e.code] in S.ropeKeys) S.ropeKeys[KEYS[e.code]] = false;
    if (e.code === 'ArrowDown') S.guard = false;
    if (e.code === 'ArrowUp') S.upHeld = false;
  };

  G.trainingAction=function(s,a){
    if(s!==S||s.phase!=='go')return;
    if(S.work){const p=S.combat.p;S.work.held={up:p.high,down:p.zone==='low'};G.extra.input(S,{code:a==='pL'?'KeyZ':a==='pR'||a==='upper'?'KeyX':'Space',repeat:false});}
    else if(S.stat==='force')bagInput(a);
    else if(S.stat==='vitesse')(S.mode==='poire'?poireInput:S.mode==='punching'?punchInput:ballInput)(a==='upper'&&S.mode!=='punching'?'pR':a);
    else if(S.stat==='souffle')mittInput(a);
  };
  // ======================= FORCE : SAC DE FRAPPE =======================
  // Jauge : retours au niveau 8. Libre : retours provoqués dès le premier niveau.
  const swingLvl = () => 8;
  function bagInput(a) {
    if (a === 'left' || a === 'right') { pose(a === 'left' ? 'dodgeL' : 'dodgeR'); AU.play('whoosh'); S.dodged = S.t; return; }
    if (a === 'down') { if (S.t - S.lastDown < .3) { pose('duck'); AU.play('whoosh'); S.dodged = S.t; S.lastDown = -9; } else S.lastDown = S.t; return; }
    if (a !== 'pL' && a !== 'pR' && a !== 'upper') return;
    if(S.mode==='libre'){hitFree(a);return;}
    if (S.swing && S.swing.t > .5) return; // le sac fonce sur toi : pas le temps de frapper
    if (a !== 'upper') comboHit(a, hitGauge(a));
    pose(a === 'upper' ? 'pR' : a);
  }
  // --- Jauge ---
  const needle = () => (Math.sin(S.ph) + 1) / 2;
  function newZone() {
    // Plus le niveau monte, plus la zone est petite — et sa taille varie BEAUCOUP d’un coup à l’autre.
    const base = G.tune(S,[.25,.22,.19]);
    S.red0 = base * rand(.95, 1.25); S.yel = S.red0 * 2.3; S.zone0 = rand(.15, .85);
    S.gold = has(3) && Math.random() < .35 ? (S.zone0 > .5 ? rand(.08, .35) : rand(.65, .92)) : null;
  }
  const zoneNow = () => has(2) ? clamp(S.zone0 + .1 * Math.sin(S.t * .9), .06, .94) : S.zone0;
  const redNow = () => S.red0 * (has(6) ? Math.max(G.tune(S,[.9,.87,.85]), 1 - .08 * S.combo) : 1);
  function hitGauge(a) {
    const n = needle(), d = Math.abs(n - zoneNow()), spMax = G.tune(S,[2.4,2.8,3.2]), red = redNow();
    let quality = null; S.lastHand = a;
    if (S.gold != null && Math.abs(n - S.gold) < S.red0 * .7) { quality = 'perfect'; streak(25 + Math.min(15, S.combo)); msg('ZONE OR !!', '#ffd700', 70); AU.play('bigpunch'); AU.play('ting'); S.bagV += 12; S.sp = Math.min(spMax, S.sp + .4); puff(640, 300, '#ffd700', 14); }
    else if (d < red) { quality = 'perfect'; streak(10 + Math.min(10, S.combo)); msg(S.combo > 1 ? 'PARFAIT ×' + S.combo : 'PARFAIT !', '#ff5252', 64); AU.play('bigpunch'); S.bagV += 9; S.sp = Math.min(spMax, S.sp + .4); }
    else if (d < S.yel) { quality = 'good'; gain(5); awardAction(.5); S.combo = 0; msg('Beau coup', '#ffd54f', 46); AU.play('punch'); S.bagV += 5; S.sp = Math.min(spMax, S.sp + .15); }
    else { miss(); msg('Raté… ça ralentit', '#9e9e9e', 40); AU.play('miss'); S.bagV += 1.5; S.sp = Math.max(S.sp0, S.sp - .6); }
    newZone(); return quality;
  }
  // Libre : l'énergie provient des frappes, jamais d'un minuteur aléatoire.
  function hitFree(a){
    const f=S.free;if(S.goT-f.lastAt<.12||S.t-f.impactAt<.48)return;
    if(S.swing&&S.swing.t>.5&&S.swing.t<1.1){pose(a==='upper'?'upper':a);AU.play('miss');return;}
    const style=a==='upper'?'upper':a+(S.upHeld?'haut':'corps');
    const diverse=!f.recent.includes(style),bonus=diverse?4:0;
    f.hits++;f.styles[style]=(f.styles[style]||0)+1;f.hitPoints+=3;f.stylePoints+=bonus;
    f.recent.push(style);if(f.recent.length>4)f.recent.shift();
    f.lastAt=S.goT;f.energy=Math.min(4,f.energy+1);S.lastHand=a;S.punchHigh=S.upHeld;S.dodged=-9;
    streak(3+bonus);pose(a==='upper'?'upper':a);AU.play(a==='upper'?'upper':'punch');
    // Successive close hits add momentum in the punch direction, with a soft cap.
    f.depthV=Math.min(3.8,f.depthV+.65+f.energy*.28);
    S.bagV=clamp(S.bagV+(a==='pL'?-1:a==='pR'?1:0)*(2+f.energy),-18,18);puff(640,330,'#ffe3a2',5);
    if(!S.swing&&f.energy>=2.9){S.swing={t:0,hit:false,power:clamp(f.energy/4,.7,1),fromDepth:f.depth};f.swings++;f.swingPoints+=8;gain(8);f.energy=0;AU.play('glint');}
  }
  const FREE_CONTACT = .95;
  // Même géométrie pour le rendu et l'instant de collision : le bas du sac
  // atteint le visage, puis repart, sans grossir à travers le corps.
  G.freeBagGeometry = (s, time=s.swing?.t||0) => {
    const smooth=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const ch=s.ch,kid=.7+.14*clamp((ch.size-.6)/.4,0,1);
    const contactY=742-262*kid-24,peak=(contactY-40)/520,rest=.72;
    let scale=rest*(1-clamp(s.free.depth,-.65,.9)*.15),tilt=-clamp(s.free.depth,-.65,.9)*.18,angle=s.bag*.012;
    if(s.swing){
      if(time<.5){const u=smooth(time/.5);scale=lerp(rest,.63,u);tilt=lerp(-(s.swing.fromDepth||0)*.18,-.18,u);}
      else if(time<FREE_CONTACT){const u=smooth((time-.5)/(FREE_CONTACT-.5));scale=lerp(.63,peak,u);tilt=lerp(-.18,0,u);angle*=1-u;}
      else{const u=smooth(Math.min(1,(time-FREE_CONTACT)/.55));scale=lerp(peak,rest,u);tilt=0;angle*=u;}
    }
    return {scale,tilt,angle,contactY,bottom:40+520*scale,contactTime:FREE_CONTACT};
  };
  function updateFree(dt){
    const f=S.free;f.energy=Math.max(0,f.energy-dt*1.05);
    // Damped spring: a single hit sways gently; rapid hits accumulate depth.
    for(let remaining=dt;remaining>0;){const step=Math.min(remaining,1/120);f.depthV+=(-f.depth*13-f.depthV*2.4)*step;f.depth+=f.depthV*step;remaining-=step;}
    if(f.hitStop>0){const frozen=Math.min(dt,f.hitStop);f.hitStop-=frozen;dt-=frozen;}
    if(!S.swing)return;
    const sw=S.swing;sw.t+=dt*(1+(S.lvl-1)*.045);
    if(!sw.hit&&sw.t>=G.freeBagGeometry(S).contactTime){
      sw.hit=true;
      if(S.combat?G.combatAttack(S,['L','R','duck'],8):S.t-(S.dodged??-9)>=.08&&S.t-(S.dodged??-9)<.36&&['dodgeL','dodgeR','duck'].includes(S.pose)){
        f.dodges++;f.dodgePoints+=12;gain(12);awardAction(.5);msg('ESQUIVÉ ! +12','#81c784',44);
      }else{
        f.collisions++;miss();pose('hit');f.impactAt=S.t;f.impactPower=sw.power;f.hitStop=.085;sw.t=FREE_CONTACT;
        AU.play('bigpunch');AU.play('hurt');puff(640,G.freeBagGeometry(S).contactY,'#ffe4bb',20);msg('BOUM ! LE SAC TE PERCUTE !','#ff8a80',46);
      }
    }
    if(sw.t>=1.5){S.swing=null;f.energy=0;}
  }
  // Bonus facultatif : aucune pénalité de score, aucune croix d’erreur.
  G.COMBO_WAIT = 3;
  function newCombo(previous) {
    let seq;
    do {
      const len = 3 + Math.floor(Math.random() * 4);
      seq = Array.from({ length: len }, () => Math.random() < .5 ? 'pL' : 'pR');
    } while (previous && seq.join() === previous.join());
    S.bagCombo = { seq, idx: 0, perfect: true, lastAt: null, completed: 0, bonus: 0, flash: 0 };
  }
  function resetCombo() {
    const cb = S.bagCombo; cb.idx = 0; cb.perfect = true; cb.lastAt = null;
  }
  function expireCombo() {
    const cb = S.bagCombo;
    if (cb.idx && S.goT - cb.lastAt > G.COMBO_WAIT) resetCombo();
  }
  function comboHit(hand, quality) {
    const cb = S.bagCombo; expireCombo();
    if (hand !== cb.seq[cb.idx]) { resetCombo(); return; }
    if (!quality) { if (cb.idx) cb.perfect = false; return; }
    cb.perfect = cb.perfect && quality === 'perfect'; cb.idx++; cb.lastAt = S.goT;
    if (cb.idx === cb.seq.length) {
      const perfect = cb.perfect, len = cb.seq.length, bonus = len * (perfect ? 12 : 5) * (S.mode === 'combos' ? 2 : 1);
      gain(bonus); S.xpf += bonus * .12; AU.play(perfect ? 'star' : 'ting');
      const completed = cb.completed + 1, previous = cb.seq;
      newCombo(previous); S.bagCombo.completed = completed; S.bagCombo.bonus = bonus; S.bagCombo.flash = 1.1;
      msg((perfect ? 'ENCHAÎNEMENT PARFAIT ! +' : 'ENCHAÎNEMENT ! +') + bonus, perfect ? '#ffd54f' : '#81c784', 40);
    }
  }
  function updateForce(dt) {
    if(S.mode==='libre'){updateFree(dt);return;}
    expireCombo(); S.bagCombo.flash = Math.max(0, S.bagCombo.flash - dt);
    if (S.mode !== 'libre') {
      let m = 1; if (has(4)) m *= 1 + .35 * Math.sin(S.t * 1.7);
      if (has(7)) { S.revT -= dt; if (S.revT <= 0) { S.dir *= -1; S.revT = rand(1.8, 3.6); } }
      S.ph += S.dir * S.sp * m * dt;
    }

    // Le sac revient !
    if (has(swingLvl())) {
      if (!S.swing) { S.nextSwing -= dt; if (S.nextSwing <= 0) { S.swing = { t: 0, hit: false }; AU.play('glint'); } }
      else {
        S.swing.t += dt;
        if (!S.swing.hit && S.swing.t >= .95) { S.swing.hit = true; if (S.combat?G.combatAttack(S,['L','R','duck','block'],8):S.t - (S.dodged || -9) < .5) { gain(3); msg('Esquivé !', '#81c784', 48); } else { miss(); msg('BOUM ! Le sac…', '#ff8a80', 48); AU.play('hurt'); pose('hit'); } }
        if (S.swing.t > 1.5) { S.swing = null; S.nextSwing = rand(5, 9); }
      }
    }
  }

  // ======================= RAPIDITÉ : BALLON ÉLASTIQUE =======================
  // z : 0 = au repos juste devant tes gants, -1 = au fond (frappé), 1 = sur ton visage.
  const WIN = () => -.12 + S.lvl * .02, PERF = () => .55 + S.lvl * .012;
  function ballInput(a) {
    const b = S.ball;
    if (a === 'pL' || a === 'pR') {
      S.guard = false; pose(a);
      const sd = a === 'pL' ? -1 : 1;
      if (b.st === 'rest' || b.st === 'swing') { b.perf = false; launch(); AU.play('punch'); return; }
      if (b.st === 'back' && b.z > WIN()) { returnBall(sd); return; }
      if (b.st === 'back') { S.pend = { sd, t: S.t }; return; } // un peu trop tôt : gardé une fraction de seconde
      AU.play('miss'); return;
    }
    if (a === 'left' || a === 'right' || a === 'down') {
      let dodge;
      if (a === 'down') {
        if (S.t - S.lastDown < .3) { dodge = 'duck'; S.lastDown = -9; S.guard = false; }
        else { S.lastDown = S.t; S.guard = true; return; } // ↓ tenu = garde
      } else { dodge = a === 'left' ? -1 : 1; S.guard = false; }
      pose(dodge === 'duck' ? 'duck' : dodge < 0 ? 'dodgeL' : 'dodgeR'); AU.play('whoosh');
      const okDodge = b.kind === 'high' ? dodge === 'duck' : (dodge === 'duck' || dodge === -b.side);
      if (b.st === 'back' && b.z > 0 && okDodge) { b.st = 'past'; b.t = 0; streak(b.kind === 'normal' ? 1 : 2); msg('Esquive !', '#81c784', 46); }
      else if ((b.st === 'out' || (b.st === 'back' && b.z < -.3)) && b.feints < 4 && S.t - b.lastFeint > .18) {
        b.feints++; b.lastFeint = S.t; const pts = b.perf ? 2 : 1; gain(pts); msg('Feinte +' + pts + (b.feints === 4 ? '  MAX' : ''), '#ce93d8', 34);
      }
    }
  }
  function returnBall(sd) {
    const b = S.ball; S.pend = null;
    if (b.kind === 'heavy') { if(S.combat)G.combatAttack(S,[],12);bonk('Ouch ! Du PLOMB !'); return; }
    if (b.kind === 'high') { if(S.combat)G.combatAttack(S,[],8);bonk('Trop haut ! ↓↓'); return; }
    if (b.side !== sd) { if(S.combat)G.combatAttack(S,[],8);bonk('Mauvais gant !'); return; }
    const perfect = b.z > PERF(); b.perf = perfect; S.rally++;
    streak((perfect ? 3 : 2) + Math.floor(S.combo / 5));
    msg(perfect ? 'PARFAIT ×' + S.combo : 'Retour ×' + S.combo, perfect ? '#4fc3f7' : '#fff', perfect ? 58 : 44);
    AU.play(perfect ? 'bigpunch' : 'punch'); if (S.combo % 10 === 0) AU.play('star');
    launch();
  }
  function toSwing() { const b = S.ball; b.st = 'swing'; b.t = 0; b.sz = b.z; b.sx = b.x; b.kind = 'normal'; }
  function launch(slow) {
    const b = S.ball;
    b.z0 = b.z; b.x0 = b.x; b.st = 'out'; b.t = 0; b.dur = .32; b.feints = 0; b.lastFeint = -9; S.pend = null; b.kk = 0; b.flipped = false; b.paused = 0;
    b.side = Math.random() < .5 ? -1 : 1;
    const r = Math.random();
    b.kind = has(7) && r < .18 ? 'high' : has(5) && r < .4 ? 'heavy' : 'normal';
    b.flip = has(4) && Math.random() < .3; b.pauseAt = has(8) && Math.random() < .25 ? rand(.35, .55) : null;
    const whip = has(6) && Math.random() < .3;
    b.back = Math.max(G.tune(S,[1.5,1.2,1.05]), (1.75 - S.lvl * .06 - S.rally * (has(2) ? .07 : .05)) * (whip ? .7 : 1) * (S.lvl >= 10 ? .85 : 1)) + (slow ? .15 : 0);
    if (whip) msg('Coup de fouet !', '#ffcc80', 34);
  }
  function bonk(t) {
    const b = S.ball; b.z0 = Math.min(1, b.z); b.st = 'bonk'; b.t = 0; S.rally = 0; b.perf = false; miss();
    msg(t, '#ff8a80', 46); AU.play('hurt'); pose('hit');
  }
  function updateBall(dt) {
    const b = S.ball; b.t += dt;
    b.sv += (b.side - b.sv) * Math.min(1, dt * 9);
    if (b.st === 'rest') { const f = Math.min(1, dt * 5); b.z = lerp(b.z, Math.sin(S.t * 2) * .05, f); b.x = lerp(b.x, Math.sin(S.t * 1.3) * .08, f); }
    else if (b.st === 'out') { const k = Math.min(1, b.t / b.dur); b.z = lerp(b.z0, -1, A.eout(k)); b.x = lerp(b.x0, 0, A.eout(k)); if (k >= 1) { b.st = 'back'; b.t = 0; b.sv = 0; } }
    else if (b.st === 'back') {
      if (b.pauseAt != null && b.kk >= b.pauseAt && b.paused < .35) b.paused += dt; // il hésite…
      else b.kk += dt / b.back;
      const k = b.kk;
      if (b.flip && !b.flipped && k > .4) { b.flipped = true; b.side = -b.side; }
      b.z = -1 + 2.05 * k * k;
      const xs = has(9) ? Math.pow(Math.min(1, k), G.tune(S,[1.3,1.6,2])) : Math.sin(Math.min(1, k) * Math.PI / 2);
      b.x = b.sv * xs + (has(3) ? .22 * Math.sin(k * Math.PI * 3) * (1 - k) : 0);
      if (S.pend) { if (b.z > WIN()) returnBall(S.pend.sd); else if (S.t - S.pend.t > .16) { S.pend = null; AU.play('miss'); } if (b.st !== 'back') return; }
      if(S.combat&&b.z>=1.02){
        const avoid=b.kind==='high'?['duck']:['duck',b.side>0?'L':'R','block'];
        if(G.combatAttack(S,avoid,b.kind==='heavy'?12:8)){b.st='past';b.t=0;streak(2);msg('Bien défendu !','#81c784',38);}
        else bonk('Dans la face !');return;
      }
      if (!S.combat && S.guard && b.z > .85 && b.kind !== 'high') { // bloqué : il rebondit sur les gants
        gain(b.kind === 'heavy' ? 2 : 1); msg(b.kind === 'heavy' ? 'Bloqué ! Solide !' : 'Bloqué !', '#cfd8dc', 44); AU.play('block'); S.poseT = 0; launch(true); b.dur = .4; return;
      }
      if (!S.combat && b.z >= 1.02) bonk('Dans la face !');
    }
    else if (b.st === 'past') { const v = Math.max(0, 1 - b.t / .4); b.z += dt * 1.6 * v; b.x += b.side * dt * 1.2 * v; if (b.t > .4) toSwing(); }
    else if (b.st === 'bonk') {
      const ta = .05 + .15 * (1 - b.z0);
      if (b.t < ta) b.z = lerp(b.z0, 1, b.t / ta);
      else { b.z = 1 - .5 * A.eout(Math.min(1, (b.t - ta) / .35)); b.x *= Math.pow(.05, dt); }
      if (b.t > ta + .35) toSwing();
    }
    else if (b.st === 'swing') { const k = A.eout(Math.min(1, b.t / .6)); b.z = lerp(b.sz, 0, k); b.x = lerp(b.sx, 0, k); if (b.t >= .6) b.st = 'rest'; }
  }

  // ======================= RAPIDITÉ : POIRE DE VITESSE =======================
  function missPoire(message){
    const p=S.pb;miss();p.st='reset';p.resetT=.65;p.tempoKnown=false;p.lastAt=null;p.dodges=0;p.dodgeSide=null;
    AU.play('miss');msg(message||'DANS LE VIDE ! Reprends ton tempo','#ffae8b',40);
  }
  function poireInput(a){
    const dodge=a==='left'||a==='right';
    if(!dodge&&a!=='pL'&&a!=='pR')return;
    const p=S.pb;
    if(dodge){pose(a==='left'?'dodgeL':'dodgeR');AU.play('whoosh');}
    else {pose(a);S.lastHand=a;}
    if(p.st==='reset'){return;}
    // Establish the rhythm with punches; a dodge then occupies exactly one beat.
    if(dodge&&!p.tempoKnown)return;
    const gap=p.lastAt==null?null:S.goT-p.lastAt;
    if(gap!=null&&gap<.06){if(p.tempoKnown)missPoire();return;}
    if(p.tempoKnown){
      const tolerance=Math.max(.025,p.cur*(G.isEasy(S) ? .35 : .22-(S.lvl-1)*.008));
      if(Math.abs(gap-p.cur)>tolerance){missPoire(dodge?'ESQUIVE HORS TEMPO ! Reprends tes coups.':null);return;}
      if(dodge){
        if(p.dodges>=2){missPoire('REPRENDS LA POIRE avec Z / X !');return;}
        if(p.dodges&&p.dodgeSide===a){missPoire('ALTERNE GAUCHE ET DROITE !');return;}
        p.dodges++;p.dodgeSide=a;p.lastAt=S.goT;p.u=0;p.amplitude*=.9;
        msg(p.dodges===2?'REPRENDS Z / X !':'ESQUIVE ! Même tempo…','#80deea',32);
        return;
      }
      const resumed=p.dodges;
      streak(Math.abs(gap-p.cur)<p.cur*.1?3:2);
      if(resumed){awardAction(.5*resumed);msg('REPRISE ! XP +'+(resumed*50)+' %','#ffd54f',34);}
      else if(S.combo%4===0)msg('CADENCE ×'+S.combo,'#4fc3f7',38);
    }else if(gap!=null&&gap<=2){p.cur=gap;p.tempoKnown=true;msg('GARDE CE TEMPO !','#81c784',36);}
    else {p.cur=.5;S.combo=0;}
    p.dodges=0;p.dodgeSide=null;p.lastAt=S.goT;p.st='spin';p.u=0;p.amplitude=1;AU.play('punch');
  }
  function updatePoire(dt){
    const p=S.pb;if(S.phase!=='go')return;
    if(p.st==='reset'){p.resetT-=dt;p.u+=dt/p.cur;p.amplitude*=Math.exp(-dt*4);if(p.resetT<=0){p.st='rest';p.u=0;}return;}
    if(p.st!=='spin')return;
    const before=p.u,after=before+dt/p.cur;
    for(const contact of [.3,.65])if(Math.floor(after-contact)>Math.floor(before-contact)&&p.amplitude>.2)AU.play('tick');
    p.u=after;
    const elapsed=S.goT-p.lastAt,tolerance=Math.max(.025,p.cur*(G.isEasy(S) ? .35 : .22-(S.lvl-1)*.008));
    if(p.tempoKnown&&elapsed>p.cur+tolerance){missPoire();return;}
    if(!p.tempoKnown&&elapsed>2){p.st='rest';p.lastAt=null;p.u=0;}
  }
  // angle de la poire selon le cycle (+ = vers toi, − = vers le fond)
  function poireAngle(T) {
    const p = S.pb;
    if (p.st === 'rest') return .05 * Math.sin(T * 2);
    const u = p.u % 1, key = [[0, .45], [.3, -1.45], [.65, 1.45], [1, .45], [1.4, .1]];
    for (let i = 0; i < key.length - 1; i++) if (u <= key[i + 1][0]) { const k = (u - key[i][0]) / (key[i + 1][0] - key[i][0]); return lerp(key[i][1], key[i + 1][1], A.ease(k)) * p.amplitude; }
    return .1;
  }

  // ======================= RAPIDITÉ : PUNCHING-BALL =======================
  // Ballon sur ressort : z (profondeur, − = repoussé), x (côté). Il revient vers toi en rebondissant.
  const pkK = () => 26 + S.lvl * 3 + (S.lvl - 1) * 10 / 9 + (S.lvl >= 10 ? 8 : 0), pkC = () => 2.2 - (S.lvl - 1) / 9;
  function punchInput(a) {
    const u = S.pu;
    if (a === 'left' || a === 'right') {
      pose(a === 'left' ? 'dodgeL' : 'dodgeR'); AU.play('whoosh');
      if (u.charge > 0 && Math.sign(u.x) === (a === 'left' ? 1 : -1)) { u.charge = 0; streak(2); msg('Esquive !', '#81c784', 44); u.vx *= -.5; u.vz = -3; }
      return;
    }
    if (a !== 'pL' && a !== 'pR' && a !== 'upper') return;
    pose(a === 'upper' ? 'pR' : a);
    if (u.hitCD > 0) return;
    const sd = a === 'pL' ? -1 : a === 'pR' ? 1 : 0, near = u.z > -.15;
    if (!near) { AU.play('miss'); return; }
    if (!u.armed) { u.armed = true; u.vz = -6.5; u.vx = has(3) ? (sd || 1) * -2.2 : 0; u.hitCD = .15; AU.play('punch'); return; } // premier coup
    if (has(3) && sd && Math.abs(u.x) > .12 && Math.sign(u.x) !== sd) { miss(); msg(u.x < 0 ? 'À gauche : touche Z !' : 'À droite : touche X !', '#ff8a80', 36); AU.play('punch'); kick(sd); return; }
    if (u.glow && sd) { gain(1); msg('Uppercut (Espace) !', '#ffcc80', 36); AU.play('punch'); kick(sd); return; }
    const good = u.vz > 0 && u.z > (G.isEasy(S) ? -.1 : .15), perfect = good && u.z > .4;
    if (good) { streak(((perfect ? 3 : 2) + Math.floor(S.combo / 5)) * (u.glow ? 3 : 1)); msg(u.glow ? 'UPPERCUT ×3 !' : perfect ? 'PARFAIT ×' + S.combo : 'Bien ×' + S.combo, u.glow ? '#ffd700' : perfect ? '#4fc3f7' : '#fff', perfect || u.glow ? 52 : 40); AU.play(perfect || u.glow ? 'bigpunch' : 'punch'); }
    else { gain(1); AU.play('punch'); }
    kick(sd || pick([-1, 1]));
  }
  function kick(sd) {
    const u = S.pu; u.vz = -6.5 - Math.min(S.combo,10) * .05; u.vx = has(3) ? -sd * rand(1.6, 2.6) : 0; u.hitCD = .15;
    if (has(4)) { u.vx += rand(-1.5, 1.5); u.vz *= rand(.85, 1.2); }
    u.glow = has(5) && Math.random() < .2;
    if (has(6) && Math.random() < .15) { u.charge = 1; u.vx = pick([-1, 1]) * 5; u.vz = -2; msg('ATTENTION !', '#ffeb3b', 40); }
  }
  function updatePunch(dt) {
    dt *= G.tune(S,[.6,.65,.7]);
    const u = S.pu; u.hitCD -= dt;
    const k = pkK(), c = pkC();
    u.vz += (-k * u.z - c * u.vz) * dt; u.z += u.vz * dt;
    u.vx += (-k * .8 * u.x - c * u.vx) * dt; u.x += u.vx * dt;
    if (u.charge > 0) { u.charge -= dt * .9; if (u.charge <= 0 && Math.abs(u.x) > .3) { if(S.combat&&G.combatAttack(S,[u.x>0?'L':'R'],8)){streak(2);u.vz=-3;return;}miss(); msg('Toc !', '#ff8a80', 40); AU.play('hurt'); pose('hit'); } }
    if (u.armed && u.z > .75 && u.vz > 0) { if(S.combat&&G.combatAttack(S,['L','R','block'],8)){streak(2);u.vz=-3;return;}miss(); u.vz = -3; msg('Toc ! dans le nez', '#ff8a80', 40); AU.play('hurt'); pose('hit'); }
    if (u.armed && Math.abs(u.z) < .03 && Math.abs(u.vz) < .25) { u.armed = false; if (S.combo) { S.combo = 0; msg('Il s’est arrêté', '#9e9e9e', 34); } }
  }

  // ======================= SOUFFLE : LES MITAINES DU COACH =======================
  function mittInput(a) {
    const at=S.atk;
    if(at&&!at.hit&&at.target&&(a==='pL'||a==='pR')){
      pose(a);AU.play('punch');
      if(a===at.hand){at.hit=true;at.t=at.tell;streak(2);AU.play('bigpunch');puff(at.kind==='L'?510:770,300,'#ffe082',9);msg('Bien frappé !','#ffe082',38);}
      else {S.pattern.clean=false;miss();msg(at.hand==='pL'?'Gauche · Z':'Droite · X','#ffe082',34);}
      return;
    }
    if (at && !at.hit) S.moved = true;
    if (a === 'left' || a === 'right') { S.dodgeDir = a === 'left' ? -1 : 1; S.dodgeT = 0; S.guard = false; pose(a === 'left' ? 'dodgeL' : 'dodgeR'); AU.play('whoosh'); }
    if (a === 'down') {
      if (S.t - S.lastDown < .3) { S.dodgeDir = 'duck'; S.dodgeT = 0; S.lastDown = -9; S.guard = false; pose('duck'); AU.play('whoosh'); }
      else { S.lastDown = S.t; S.guard = true; }
    }
  }
  const tellBase = () => G.tune(S,[1.8,1.3,1.05]);
  function shout(t) { S.shout = { t: 0, text: t }; }
  function newMittPattern(){
    const count=6,steps=[];
    // Chaque série contient de l’attaque ET de la défense, dès le premier défi.
    for(let i=0;i<count;i++){
      const target=i<count/2,side=pick(['L','R']);
      if(target)steps.push({kind:side,target:true,hand:side==='L'?'pL':'pR'});
      else {
        const kind=has(6)&&Math.random()<.18?'low':has(2)&&Math.random()<.2?'high':side;
        steps.push({kind,fire:has(5)&&Math.random()<.2,feint:has(3)&&Math.random()<.12,tele:has(7)&&Math.random()<.15?(kind==='L'?'R':kind==='R'?'L':null):null});
      }
    }
    // L’ordre change au tirage, puis reste identique pendant les répétitions.
    for(let i=steps.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[steps[i],steps[j]]=[steps[j],steps[i]];}
    S.pattern={steps,total:4,completed:0,clean:true,index:0};
    shout('Nouvelle série !');
  }
  function spawnAttack(){
    if(!S.pattern||S.pattern.completed>=S.pattern.total)newMittPattern();
    S.pattern.clean=true;
    S.queue=S.pattern.steps.map((x,index)=>Object.assign({},x,{index,t:0,hit:false,tell:x.target?(G.isEasy(S)?1.6:Math.max(.65,1.12-S.lvl*.035)):tellBase()*(x.fire?.8:1)}));
  }
  function updateMitts(dt) {
    S.dodgeT += dt; if (S.shout) { S.shout.t += dt; if (S.shout.t > 1.2) S.shout = null; }
    S.teleFx = Math.max(0, S.teleFx - dt * 3);
    if (!S.atk) {
      S.nextIn -= dt; if (S.nextIn > 0) return;
      if (!S.queue.length) spawnAttack();
      S.atk = S.queue.shift();S.pattern.index=S.atk.index; S.moved = false; AU.play('glint'); return;
    }
    const at=S.atk;at.t+=dt;
    if(at.tele&&at.t>=at.tell*.35){at.kind=at.tele;at.tele=null;S.teleFx=1;AU.play('thunder');}
    if(!at.hit&&at.t>=at.tell){
      at.hit=true;const active=S.dodgeT<(G.tune(S,[.95,.7,.55]));
      const ok=!at.target&&(at.feint?!S.moved:S.combat?G.combatAttack(S,at.kind==='high'?['duck']:at.kind==='low'?['block']:[at.kind==='L'?'R':'L'],8):at.kind==='high'?active&&S.dodgeDir==='duck':at.kind==='low'?S.guard:active&&S.dodgeDir===(at.kind==='L'?1:-1));
      if(ok){streak(1);msg(at.feint?'Bien attendu !':at.kind==='low'?'Bloqué !':'Esquive !','#b9f6ca',38);AU.play(at.kind==='low'?'block':'whoosh');}
      else {S.pattern.clean=false;miss();msg(at.target?'Mitaine jaune : frappe !':at.feint?'Attends la vraie frappe !':at.kind==='high'?'Baisse-toi !':at.kind==='low'?'Garde en bas !':'Touché !','#ffcf96',36);if(!at.target&&!at.feint){AU.play('hurt');pose('hit');}}
    }
    if(at.t>=at.tell+.28){
      if(!S.queue.length){
        if(S.pattern.clean){S.pattern.completed++;shout(S.pattern.completed===S.pattern.total?'Série maîtrisée !':S.pattern.completed+' / '+S.pattern.total+' · Encore !');AU.play('chime');}
        else shout('On la reprend !');
      }
      S.atk=null;S.nextIn=S.queue.length ? .16 : .65;
    }
  }

  // ======================= STAMINA : CORDE À SAUTER =======================
  // Tous les looks défilent pendant la séance, dans chaque difficulté.
  G.effectTheme = (time, count) => Math.floor(Math.max(0, time) / 8) % count;
  const ropeTheme = () => ['neon', 'elec', 'fire', 'lava'][G.effectTheme(S.goT, 4)];
  G.ropeDamage=theme=>({base:10,neon:10,elec:14,fire:18,lava:24}[theme]||10);
  function hurtRope(amount){
    if(S.phase!=='go'||S.ropeHp<=0)return;
    S.ropePreviousHp=S.ropeHp;S.ropeHp=Math.max(0,S.ropeHp-amount);S.ropeDamage=amount;S.ropeDamageAt=S.t;
    if(S.ropeHp===0){S.trainingKO=true;msg('K.O. ! PLUS DE VIE','#ff887c',56);G.finish();}
  }
  function jump(kind) { if(!S.jumpTaps)S.jumpTaps=[];S.jumpTaps.push(S.t);S.jumpTaps=S.jumpTaps.filter(t=>S.t-t<G.ropeJumpDuration(S)); if (S.jumpT >= 0) return; S.jumpT = 0; S.jumpKind = kind; AU.play('whoosh'); }
  function nextReq() {
    const r = Math.random();
    S.req = has(9) && r < .15 ? 'down' : 'up';
    S.dbl = S.dblNext ? 1 : 0; if (S.dbl) S.req = 'up'; S.dblNext = has(4) && !S.dbl && Math.random() < .15;
    S.haltNext = has(6) && Math.random() < .12;
  }
  function updateRope(dt) {
    const dir = (S.ropeKeys.right ? 1 : 0) - (S.ropeKeys.left ? 1 : 0);
    S.ropeX = clamp(S.ropeX + dir * (130 + S.lvl * 10) * dt, 630, 880);
    S.obstacleHit = Math.max(0, S.obstacleHit - dt);
    if (S.trip > 0) S.trip -= dt; if (S.burn > 0) S.burn -= dt;
    if (S.jumpT >= 0) { S.jumpT += dt; if (S.jumpT > G.ropeJumpDuration(S)) S.jumpT = -1; }
    updateRopeObstacles(dt);if(S.phase!=='go')return;
    if (S.halt > 0) { S.halt -= dt; return; }
    if (has(3)) { S.tempoT -= dt; if (S.tempoT <= 0) { S.tempoT = rand(4, 7); S.w = clamp(S.w + rand(-.9, 1.1), S.w0, G.ropeSpeedCap(S)); msg('Changement de rythme !', '#80deea', 34); } }
    let w = S.w * (S.dbl ? G.tune(S,[1.4,1.5,1.6]) : 1) * (has(7) ? 1 + .2 * Math.sin(S.t * 2.3) : 1);
    const before = Math.floor(S.ang / TAU), half = Math.floor((S.ang - Math.PI) / TAU);
    S.ang += w * dt;
    if (S.haltNext && Math.floor((S.ang - Math.PI) / TAU) > half) { S.haltNext = false; S.halt = .55; S.ang = Math.ceil((S.ang - Math.PI) / TAU) * TAU - TAU + Math.PI; msg('STOP !', '#fff', 40); }
    if (Math.floor(S.ang / TAU) > before) { // la corde passe sous les pieds
      const air = S.jumpT >= 0 && S.jumpT > .03 && S.jumpT < G.ropeJumpDuration(S)-.02, doubleOK=!S.dbl||(S.jumpTaps||[]).filter(t=>S.t-t<G.ropeJumpDuration(S)).length>=2, right = air && S.jumpKind === S.req && doubleOK;
      if (right) {
        S.jumps++; streak(S.req === 'up' ? 1 : 2); AU.play('tick');
        if (S.combo % 10 === 0) { msg(S.combo + ' de suite !', '#81c784', 56); AU.play('star'); }
        if (S.combo % 5 === 0) S.w = Math.min(G.ropeSpeedCap(S), S.w + (has(2) ? .6 : .45));
      } else {
        S.trip = .6; miss(); S.w = Math.max(S.w0, S.w - .8);
        const th = ropeTheme();S.burnKind=th;hurtRope(G.ropeDamage(th));
        if (th === 'fire' || th === 'lava') { S.burn = 1.2; msg(pick(['AÏE ÇA BRÛLE !', 'OUCH ! LES FESSES !', 'AU FEU !']), '#ff7043', 52); AU.play('steam'); AU.play('hurt'); puff(S.ropeX, 640, '#ff7043', 16); puff(S.ropeX, 600, '#9e9e9e', 8); }
        else if (th === 'elec') { S.burn = .8; msg('BZZZT !', '#80d8ff', 52); AU.play('thunder'); puff(S.ropeX, 640, '#80d8ff', 12); }
        else msg(air&&!doubleOK?'Double : deux pressions !':air ? 'Mauvais saut !' : 'Accroché !', '#ff8a80', 44), AU.play('hurt');
      }
      S.jumpTaps=[];nextReq();
    }
  }

  function updateRopeObstacles(dt) {
    S.obstacleNext -= dt;
    if (S.obstacleNext <= 0) {
      const x = clamp(S.ropeX + rand(-65, 65), 630, 880);
      const spawn = at => S.obstacles.push({ x: at, y: 225, vy: 55 + S.lvl * 6, wait: Math.max(.65, 1.65 - S.lvl * .1), r: has(5) ? 21 : 17, hit: false, kind: pick(has(5) ? ['ball', 'glove', 'towel'] : ['glove', 'towel']) });
      spawn(x);
      if (has(7) && Math.random() < .45) spawn(x > 755 ? Math.max(630, x - 135) : Math.min(880, x + 135));
      S.obstacleNext = rand(Math.max(2.5, 8 - S.lvl * .55), Math.max(3.5, 10 - S.lvl * .65));
    }
    const jy = S.jumpT >= 0 ? -Math.sin(Math.min(1, S.jumpT / G.ropeJumpDuration(S)) * Math.PI) * 76 : 0;
    const bodyScale=.65*A.childScale(S.ch)*1.35*(BX.familyBody?.factor(S.ch)||1);
    const headY = BX.familyBody?670+jy-289*bodyScale:670+jy-500*.65*A.childScale(S.ch), headRadius = BX.familyBody?BX.familyBody.headHeight(S.ch)*.45*bodyScale:76*.65*A.childScale(S.ch);
    for (const item of S.obstacles) {
      if (item.wait > 0) { item.wait -= dt; continue; }
      item.vy += (115 + S.lvl * 18) * dt; item.y += item.vy * dt;
      if (!item.hit && Math.abs(item.x - S.ropeX) < headRadius + item.r && item.y + item.r >= headY && item.y - item.r <= headY + 65) {
        item.hit = true; S.obstacleHit = .5; miss();hurtRope(8); AU.play('body'); msg('Oups ! Décale-toi !', '#ffcf96', 35);if(S.phase!=='go')return;
      }
      if (item.y > 700 && !item.hit && !item.scored) {
        item.scored = true; S.obstaclesDodged++; gain(2); S.xpf += 20 * ((Math.max(2.5, 8 - S.lvl * .55) + Math.max(3.5, 10 - S.lvl * .65)) / 2) / 60;
        if (G.passed() && !S.goalAnnounced) { S.goalAnnounced = true; msg('DÉFI RÉUSSI !', '#81c784', 54); AU.play('star'); }
      }
    }
    S.obstacles = S.obstacles.filter(item => item.y < 730);
  }

  G.update = function (dt) {
    if (!S) return;
    S.t += dt; S.phT += dt; S.poseT += dt;
    S.msgs.forEach(m => m.t += dt); S.msgs = S.msgs.filter(m => m.t < 1);
    S.fx.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }); S.fx = S.fx.filter(p => p.t < p.life);
    if (S.stat === 'lesson') { updateLesson(dt); return; }
    if (S.stat === 'force') { S.bagV -= S.bag * 30 * dt; S.bagV *= Math.pow(.2, dt); S.bag += S.bagV * dt; }
    if (S.phase === 'end') { if (S.phT > S.endHold && !S.done) { S.done = true; S.onDone && S.onDone(G.result()); } return; }
    if (S.phase !== 'go') return;
    const before = S.duration - S.goT;
    S.goT = Math.min(S.duration, S.goT + dt);
    const remaining = S.duration - S.goT, cues = [30, 10, 3, 2, 1].filter(n => before > n && remaining <= n);
    if (cues.length) {
      const n = cues[cues.length - 1]; S.timeCue = { n, at: S.t };
      AU.play(n > 3 ? (n === 30 ? 'time30' : 'time10') : 'countdown');
      AU.say(n > 3 ? n + ' secondes restantes !' : ['un', 'deux', 'trois'][n - 1], { interrupt: true, rate: 1.2 });
    }
    if (S.goT >= S.duration) { msg('Temps écoulé !', '#ffd54f', 56); G.finish(); return; }
    if(S.combat){G.combatStep(S,dt);if(S.phase!=='go')return;}
    if (!S.work && S.stat === 'vitesse' && S.mode!=='poire') (S.mode === 'punching' ? updatePunch : updateBall)(dt);
    if(S.work){G.extra.update(S,dt);return;}
    if(S.stat==='vitesse'&&S.mode==='poire')updatePoire(dt);
    if (S.stat === 'force') updateForce(dt);
    if (S.stat === 'souffle') updateMitts(dt);
    if (S.stat === 'stamina') updateRope(dt);
  };

  // ======================= LEÇON DU COACH (apprendre un combo) =======================
  // Étapes : 1) Regarde  2) À toi, doucement  3) Plus vite !  4) Sans aide !
  const LSTAGES = [{ name: 'Regarde bien…', reps: 1 }, { name: 'À toi, doucement', reps: 2 }, { name: 'Plus vite !', reps: 3 }, { name: 'Sans aide !', reps: 2 }];
  const DIR_LABEL={left:'←',right:'→',up:'↑',down:'↓'};
  const tokKey = k => DIR_LABEL[k]?{side:'C',h:'',direction:k}:({ side: k.slice(-1), h: k.length > 1 ? k[0] : '' });
  G.keyLabel = k => { if(DIR_LABEL[k])return DIR_LABEL[k];const t = tokKey(k); return (t.h === 'h' ? '↑+' : '') + (t.side === 'L' ? 'Z' : 'X') + (t.h === 'b' ? ' (corps)' : ''); };
  G.startLesson = function (cb, ch, coach, onDone) {
    S = { stat: 'lesson', cb, ch, coach, onDone, t: 0, phase: 'go', phT: 0, stage: 0, rep: 0, idx: 0, stT: 0, hitT: 0, fails: 0, msgs: [], fx: [], pose: null, poseT: 9, upHeld: false, guard: false, pop: [0, 0], shout: null, teleFx: 0, atk: null, done: false, score: 0, combo: 0, best: 0, goT: 0 };
    shout('Regarde bien !'); AU.crowd(0);
  };
  G.isLesson = () => !!S && S.stat === 'lesson';
  function lessonKey(a) {
    if(S.specialT!=null)return;
    if (S.phase !== 'go' || S.stage === 0) return;
    if(!['left','right','up','down','pL','pR'].includes(a))return;
    const k = S.cb.seq[S.idx], t = tokKey(k), side = a === 'pL' ? 'L' : 'R';
    S.pose = a; S.poseT = 0;
    if(S.idx===0)S.stT=0;
    const token=BX.commandToken(a,S.upHeld),ok=token===k;
    if (ok) {
      S.pop[side === 'L' ? 0 : 1] = 1; AU.play(S.idx === S.cb.seq.length - 1 ? 'bigpunch' : 'punch'); S.idx++; S.hitT = 0;
      puff(side === 'L' ? 540 : 740, 300, '#ffeb3b', 6);
      if (S.idx >= S.cb.seq.length) { S.specialT=0;S.idx = 0; S.rep++; S.stT = 0; msg(pick(['Oui !', 'Parfait !', 'C’est ça !', 'Wow !']), '#81c784', 50);
        if (S.rep >= LSTAGES[S.stage].reps) { S.stage++; S.rep = 0; if (S.stage >= LSTAGES.length) { S.phase = 'end'; S.phT = 0; AU.play('fanfare'); shout('T’es un champion !'); } else { shout(['', 'Bien ! Maintenant…', 'Plus vite !', 'Sans mon aide !'][S.stage]); AU.play('star'); } } }
    } else {
      AU.play('miss');
      if (S.stage === 1) msg('Commande attendue : '+G.keyLabel(k), '#ff8a80', 40);
      else lessonFail('Mauvaise commande !');
    }
  }
  function lessonFail(t) { S.idx = 0; S.stT = 0; S.hitT = 0; S.fails++; msg(t + ' On recommence', '#ff8a80', 38); if (S.fails % 3 === 0) shout(pick(['Respire…', 'Prends ton temps', 'Tu vas l’avoir !'])); }
  function updateLesson(dt) {
    if(S.cb.charge){S.t+=dt;S.phT+=dt;S.msgs=S.msgs.filter(m=>(m.t+=dt)<1);if(S.phase==='end'&&S.phT>2&&!S.done){S.done=true;S.onDone&&S.onDone(true);}return;}

    S.t += dt; S.phT += dt; S.poseT += dt; S.stT += dt; S.hitT += dt;
    S.msgs.forEach(m => m.t += dt); S.msgs = S.msgs.filter(m => m.t < 1);
    S.fx.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }); S.fx = S.fx.filter(p => p.t < p.life);
    S.pop = S.pop.map(v => Math.max(0, v - dt * 4)); if (S.shout) { S.shout.t += dt; if (S.shout.t > 1.6) S.shout = null; }
    if(S.specialT!=null&&S.phase==='end')S.specialT=Math.min(BX.SPECIAL_DURATION,S.specialT+dt);
    if (S.phase === 'end') { if (S.phT > 2.2 && !S.done) { S.done = true; S.onDone && S.onDone(true); } return; }
    if(S.specialT!=null){S.specialT+=dt;S.hitT=S.stT=0;if(S.specialT>=BX.SPECIAL_DURATION)S.specialT=null;return;}
    const n = S.cb.seq.length;
    if (S.stage === 0) { // démo : le coach allume les mitaines une à une
      const i = Math.floor(S.stT / .6);
      if (i !== S.demoI && i < n) { S.demoI = i; AU.play('tick'); }
      if (S.stT > n * .6 + 1.4 && S.rep === 0) { S.rep = 1; }
      if (S.stT > n * .6 + 1.2 && S.rep >= 1) { S.stage = 1; S.rep = 0; S.stT = 0; S.idx = 0; shout('À toi !'); }
      return;
    }
    if (S.stage >= 2 && S.idx>0 && S.hitT > BX.COMMAND_GAP) lessonFail('Trop lent !');
    if (S.stage >= 2 && S.idx>0 && S.stT > BX.COMMAND_TIME) lessonFail('Trop lent !');
  }
  function drawLesson(ctx, T, ch) {
    const n = S.cb.seq.length;
    let cur = -1, labels = true;
    if (S.stage === 0) { cur = Math.floor(S.stT / .6); if (cur >= n || (S.stT % .6) > .45) cur = -1; }
    else if (S.stage < 3) cur = S.idx; else labels = false;
    const k = cur >= 0 && cur < n ? tokKey(S.cb.seq[cur]) : null;
    const pos = side => { const on = k && k.side === side, pop = S.pop[side === 'L' ? 0 : 1], y = on ? (k.h === 'h' ? 240 : k.h === 'b' ? 400 : 310) : 330;
      return { x: (side === 'L' ? 530 : 750) + (side === 'L' ? 1 : -1) * pop * 20, y: y - pop * 30, s: (on ? 1.15 : .95) * (1 - pop * .15) }; };
    const L = pos('L'), Rr = pos('R');
    drawCoach(ctx, T, L, Rr);
    const glow = 'rgba(255,235,59,.75)';
    drawMittPad(ctx, L.x, L.y, L.s, -1, k && k.side === 'L' ? glow : null, false, false, T);
    drawMittPad(ctx, Rr.x, Rr.y, Rr.s, 1, k && k.side === 'R' ? glow : null, false, false, T);
    if (k && labels) { const p = k.side==='C'?{x:640,y:260}:k.side === 'L' ? L : Rr, lab = G.keyLabel(S.cb.seq[cur]); ctx.save(); ctx.fillStyle = '#fff'; A.rr(ctx, p.x - 52, p.y - 110, 104, 50, 14); ctx.fill(); ctx.fillStyle = '#140a26'; ctx.font = '26px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText(lab.replace(' (corps)', ''), p.x, p.y - 74); if (k.h === 'b') { ctx.font = '900 14px Nunito'; ctx.fillStyle = '#fff'; ctx.fillText('au corps', p.x, p.y - 118); } ctx.restore(); }
    A.player(ctx,ch,{time:T,st:S.specialT!=null?'special':S.poseT<.3?(S.pose==='left'||S.pose==='right'?'dodge':S.pose==='down'?'duck':S.pose==='up'?'idle':'punch'):'idle',element:S.cb.element,side:S.specialT!=null?(S.cb.seq.at(-1).endsWith('L')?'L':'R'):S.pose==='pL'?'L':'R',dir:S.pose==='left'?-1:1,high:S.upHeld,t:S.specialT!=null?S.specialT/BX.SPECIAL_DURATION:S.poseT/.3});
    for (const p of S.fx) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    // bandeau : nom du combo, étape, progression
    ctx.save(); ctx.fillStyle = 'rgba(10,6,30,.85)'; A.rr(ctx, 24, 80, 400, 210, 18); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ff80ab'; ctx.font = '15px Bungee, Impact'; ctx.fillText('LEÇON DU COACH', 44, 110);
    ctx.fillStyle = '#ffd54f'; ctx.font = '28px Bungee, Impact'; ctx.fillText(S.cb.name, 44, 146, 360);
    LSTAGES.forEach((st, i) => { const y = 180 + i * 26, done = i < S.stage || S.phase === 'end', on = i === S.stage && S.phase !== 'end';
      ctx.fillStyle = done ? '#81c784' : on ? '#fff' : 'rgba(255,255,255,.35)'; ctx.font = (on ? '900 ' : '800 ') + '18px Nunito'; ctx.fillText((done ? '✔ ' : on ? '▶ ' : '○ ') + (i + 1) + '. ' + st.name + (on && st.reps > 1 ? '  ' + '●'.repeat(S.rep) + '○'.repeat(st.reps - S.rep) : ''), 44, y); });
    ctx.restore();
    // la séquence en bas
    const bw = 96, x0 = 640 - (n * bw + (n - 1) * 12) / 2, y = 650;
    ctx.save(); ctx.textAlign = 'center';
    S.cb.seq.forEach((tk, i) => { const x = x0 + i * (bw + 12), done = S.stage > 0 && S.stage < 3 && i < S.idx, on = i === cur;
      ctx.fillStyle = done ? '#2e7d32' : on ? '#ffd54f' : 'rgba(10,6,30,.8)'; A.rr(ctx, x, y - 36, bw, 60, 14); ctx.fill();
      ctx.fillStyle = on ? '#140a26' : '#fff'; ctx.font = '22px Bungee, Impact'; ctx.fillText(S.stage === 3 && S.phase !== 'end' ? '?' : G.keyLabel(tk).replace(' (corps)', ''), x + bw / 2, y + 4);
      if (tokKey(tk).h === 'b' && S.stage !== 3) { ctx.font = '900 12px Nunito'; ctx.fillText('corps', x + bw / 2, y + 18); } });
    if (S.stage === 2) { const f = Math.max(0, 1 - S.hitT / BX.COMMAND_GAP); ctx.fillStyle = f < .3 ? '#ff5252' : '#81c784'; ctx.fillRect(x0, y + 30, (n * (bw + 12) - 12) * f, 6); }
    if (S.stage === 3) { const f = Math.max(0, 1 - S.stT / BX.COMMAND_TIME); ctx.fillStyle = f < .3 ? '#ff5252' : '#81c784'; ctx.fillRect(x0, y + 30, (n * (bw + 12) - 12) * f, 6); }
    ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const m of S.msgs) { ctx.globalAlpha = Math.min(1, (1 - m.t) * 3); ctx.font = m.size + 'px Bungee, Impact'; ctx.lineWidth = 8; ctx.strokeStyle = '#140a26'; ctx.strokeText(m.text, 640, 560 - m.t * 40); ctx.fillStyle = m.col; ctx.fillText(m.text, 640, 560 - m.t * 40); }
    if (S.phase === 'end') { ctx.globalAlpha = 1; const p = 1 + Math.sin(T * 8) * .04; ctx.translate(640, 330); ctx.scale(p, p); ctx.font = '84px Bungee, Impact'; ctx.lineWidth = 12; ctx.strokeText('COMBO APPRIS !', 0, 0); ctx.fillStyle = '#ffd600'; ctx.fillText('COMBO APPRIS !', 0, 0); }
    ctx.restore();
    ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 15px Nunito'; ctx.fillText('↑ tenu = coup au visage · Échap = finir plus tard', 30, 312);if(S.stage>=2){ctx.fillStyle='#ffd54f';ctx.fillText('0,42 s entre commandes · 2,8 s au total',30,334);} ctx.restore();
  }

  // ======================= RENDU =======================
  function gymBg(q) {
    const c = document.createElement('canvas'); c.width = W * q; c.height = H * q; const g = c.getContext('2d'); g.scale(q, q);
    g.fillStyle = '#342e2a'; g.fillRect(0, 0, W, 500);
    const brick = ['#745147', '#7f594c', '#6c4e45', '#826050'];
    for (let row = 0; row < 17; row++) for (let col = -1; col < 22; col++) {
      g.fillStyle = brick[((col + 22) * 13 + row * 7) % brick.length]; g.fillRect(col * 64 + (row % 2) * 32 + 2, row * 30 + 2, 60, 26);
    }
    g.fillStyle = '#293e41'; g.fillRect(0, 388, W, 112); g.fillStyle = '#b5a47f'; g.fillRect(0, 388, W, 6);
    let gr = g.createLinearGradient(0, 500, 0, H); gr.addColorStop(0, '#263438'); gr.addColorStop(1, '#485456'); g.fillStyle = gr; g.fillRect(0, 500, W, H - 500);
    for (let x = -500; x < W + 500; x += 100) {
      g.strokeStyle = 'rgba(10,25,29,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(640 + (x - 640) * .35, 500); g.lineTo(x, H); g.stroke();
    }
    for (const y of [516, 545, 584, 638, 714]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // Deux grandes glaces, des protections murales et des poutres métalliques.
    for (const x of [55, 955]) {
      g.fillStyle = '#1e3037'; A.rr(g, x, 126, 270, 235, 4); g.fill();
      gr = g.createLinearGradient(x, 126, x + 270, 361); gr.addColorStop(0, '#4c656b'); gr.addColorStop(.5, '#94a6a0'); gr.addColorStop(1, '#4c6368');
      g.fillStyle = gr; g.fillRect(x + 7, 133, 256, 221);
      g.strokeStyle = 'rgba(231,242,226,.12)'; g.lineWidth = 18; g.beginPath(); g.moveTo(x + 40, 346); g.lineTo(x + 180, 141); g.stroke();
      g.fillStyle = '#243a40'; g.fillRect(x + 132, 133, 4, 221);
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#334a4d' : '#3e5555'; A.rr(g, x + i * 68, 410, 62, 80, 6); g.fill(); }
    }
    for (const x of [30, 350, 920, 1240]) {
      g.fillStyle = '#1f2d32'; g.fillRect(x, 0, 12, 500); g.fillStyle = '#63726e'; g.fillRect(x + 2, 0, 2, 500);
    }
    g.fillStyle = '#243137'; g.fillRect(0, 88, W, 14); g.fillStyle = '#6f7971'; g.fillRect(0, 90, W, 2);
    for (const x of [190, 640, 1090]) {
      gr = g.createLinearGradient(0, 106, 0, 600); gr.addColorStop(0, 'rgba(255,225,160,.12)'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x - 50, 106); g.lineTo(x + 50, 106); g.lineTo(x + 200, 600); g.lineTo(x - 200, 600); g.fill();
      g.fillStyle = '#14242c'; A.rr(g, x - 65, 101, 130, 9, 3); g.fill(); g.fillStyle = '#ffe5a8'; g.fillRect(x - 57, 110, 114, 3);
    }
    g.fillStyle = '#13252d'; A.rr(g, 360, 14, 560, 63, 5); g.fill();
    g.textAlign = 'center'; g.font = '30px Bungee, Impact'; g.fillStyle = '#f1dfbc'; g.fillText('SALLE D’ENTRAÎNEMENT', 640, 53);
    g.font = '11px Bungee, Impact'; g.fillStyle = '#c6ac7d'; g.fillText('À TOI DE TE DÉPASSER', 640, 70);
    gr = g.createRadialGradient(640, 340, 260, 640, 340, 800); gr.addColorStop(0, 'rgba(9,20,27,0)'); gr.addColorStop(1, 'rgba(9,20,27,.4)'); g.fillStyle = gr; g.fillRect(0, 90, W, H);
    return c;
  }
  const modeOf = () => G.MODES[S.stat] && G.MODES[S.stat].find(m => m.id === S.mode);
  G.exercise=(stat,mode)=>{
    if(G.extra?.defs[mode])return G.extra.defs[mode];
    const item=G.MODES[stat]?.find(m=>m.id===(mode||G.MODES[stat][0].id));
    return item?Object.assign({},G.EX[stat],item,{name:stat==='force'?'Sac de frappe — '+item.name:item.name}):G.EX[stat];
  };
  const exName = () => S.work ? G.extra.defs[S.mode].name : S.stat === 'force' ? 'Sac de frappe — ' + modeOf().name : modeOf() ? modeOf().name : G.EX[S.stat].name;
  const exHow = () => modeOf() ? modeOf().how : G.EX[S.stat].how;
  // Shared short instructions: one action per row, actual key shapes instead of prose.
  G.ruleRows=(stat,mode,lvl=10)=>{
    lvl=10; // Toutes les commandes sont disponibles dès Facile.
    const rows={
      jauge:[[['Z','X'],'Frappe dans le rouge']],
      libre:[[['Z','X'],'Frappe au corps'],[['↑','Z','X'],'Frappe au visage'],[['ESPACE'],'Uppercut'],[['←','→'],'Esquive'],[['↓','↓'],'Baisse-toi']],
      poire:[[['Z','X'],'Garde ton rythme'],[['←','→'],'Esquive en rythme'],[['Z','X'],'Reprends la poire']],
      elastique:[[['Z','X'],'Refrappe la balle'],[['↓'],'Garde appuyé : bloque'],[['←','→'],'Esquive'],[['↓','↓'],'Baisse-toi']],
      punching:[[['Z','X'],'Frappe au retour'],...(lvl>=5?[[['ESPACE'],'Balle dorée : uppercut']]:[]),...(lvl>=6?[[['←','→'],'Esquive le ressort']]:[])],
      course:[[['ESPACE','↑'],'Maintiens : monte · relâche : descends'],[[],'Course automatique · 3 vies']],
      escaliers:[[['Z','X'],'Alterne pour fuir l’avalanche'],[['ESPACE'],'Saute avant les crevasses'],[[],'Attrape les orbes : boost de 2 s'],[[],'Chute ou rocher : −1 vie. Trois vies.']],
      tennis:[[['←','→'],'Rejoins la zone libre'],[[],'Gauche + droite visées : reste au centre'],[['↓'],'Protège-toi des balles simples'],[['↓','↓'],'Penche-toi sous les barres']],
      cibles:[[['Z'],'Cibles du poteau gauche'],[['X'],'Cibles du poteau droit'],[['↓','Z','X'],'Bas du corps'],[['Z','X'],'Haut du corps, sans flèche'],[['↑','Z','X'],'Visage : attends la cible ouverte']],
      parade:[[['↑'],'Protège le visage'],[['↓'],'Protège le corps'],[['Z'],'Bloque à gauche'],[['X'],'Bloque à droite']],
      pneu:[[['←','↑','→','↓'],'Suis la série illuminée'],[['ESPACE'],'Appuie quand ce symbole apparaît'],[[],'Enchaîne vite pour faire rouler le pneu']],
      masse:[[['Z'],'Choisis ton angle'],[['X'],'Frappe à pleine puissance']],
      bench:[[['Z','X'],'Alterne pour pousser'],[['←','→'],'Équilibre la barre'],[[],'Relâche pour souffler']],
      traineau:[[['←','→','ESPACE'],'Trois lignes : une par touche'],[[],'Maintiens la touche sur toute la longueur'],[[],'Joue les autres touches pendant une note tenue']],
      paos:[[['Z'],'Frappe à gauche'],[['X'],'Frappe à droite'],[['↑','Z','X'],'Frappe au visage']],
      mannequin:[[['Z','X'],'Frappe les aliments demandés'],[[],'Une cible de plus toutes les 15 s'],[[],'Cible manquée : une vie perdue']],
      oeufs:[[['←','→'],'Place le panier sous les œufs'],[[],'Collecte automatique · paniers de 5 / 7 / 10'],[[],'Dépose aux caisses des deux côtés'],[[],'Gros panier : plus lent, jusqu’à ×5'],[[],'Évite les flaques d’œuf : ça glisse !']],
      poulet:[[['CLIC'],'Clique ou touche une poule'],[['★'],'Dorées : points et XP ×3']],
      repas:[[[],'Choisis ton repas au restaurant avec ton coach.']],
      sparring:[[[],'Protège-toi des coups puis riposte au bon moment.']],
      stamina:[[['ESPACE'],'Saute'],[['←','→'],'Évite les objets'],...(lvl>=4?[[['ESPACE','ESPACE'],'Corde dorée : double saut']]:[]),...(lvl>=9?[[['↓'],'Corde violette : saut croisé']]:[])],
      souffle:[[['Z','X'],'Frappe la mitaine jaune'],[['←','→'],'Esquive'],[['↓'],'Garde appuyé : bloque'],[['↓','↓'],'Baisse-toi']]
    };
    return rows[mode]||rows[stat]||[];
  };
  function keycap(ctx,label,x,y,w=46){
    ctx.save();ctx.fillStyle='#0d1024';A.rr(ctx,x,y+4,w,38,7);ctx.fill();
    const gr=ctx.createLinearGradient(0,y,0,y+38);gr.addColorStop(0,'#fff8dc');gr.addColorStop(1,'#d1c8ad');
    ctx.fillStyle=gr;A.rr(ctx,x,y,w,36,7);ctx.fill();ctx.strokeStyle='#9d927a';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#21173b';ctx.font='900 '+(label.length>2?17:26)+'px Nunito';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+18);ctx.restore();
  }
  G.keycap=keycap;
  G.render = function (ctx, q) {
    if (!S) return;
    if (!bg || bgQ !== q) { bg = gymBg(q); bgQ = q; }
    ctx.save();
    const impactAge=S.free?S.t-S.free.impactAt:9,impact=impactAge<.4?(1-impactAge/.4)*(S.free.impactPower||1):0;
    if(impact>0)ctx.translate(Math.sin(impactAge*105)*12*impact,Math.cos(impactAge*83)*8*impact);
    ctx.drawImage(bg, 0, 0, W, H);ctx.restore();
    const T = S.t, ch = S.ch;
    if (S.stat === 'lesson') { if(S.cb.charge)drawPowerLesson(ctx,S);else drawLesson(ctx, T, ch); return; }
    // Conserver la scène sous le résultat pour une transition continue.
    ctx.save();if(impact>0)ctx.translate(Math.sin(impactAge*105)*12*impact,Math.cos(impactAge*83)*8*impact);
    if(S.work)G.extra.draw(ctx,S,T);
    else if (S.stat === 'force') drawForce(ctx, T, ch);
    if (!S.work && S.stat === 'vitesse') (S.mode === 'poire' ? drawPoire : S.mode === 'punching' ? drawPunch : drawBall)(ctx, T, ch);
    if (!S.work && S.stat === 'stamina') drawRope(ctx, T, ch);
    if (!S.work && S.stat === 'souffle') drawMitts(ctx, T, ch);
    for (const p of S.fx) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.restore();
    if(impact>0){ctx.save();ctx.fillStyle='rgba(255,73,48,'+(impact*.16)+')';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,105,75,'+(impact*.85)+')';ctx.lineWidth=16*impact;ctx.strokeRect(8,8,W-16,H-16);ctx.restore();}
    // HUD
    const ex = G.exercise(S.stat,S.mode);
    const goal=S.challenge,passed=G.passed();
    if(S.phase==='go'){
      ctx.save();ctx.font='900 17px Nunito';ctx.textAlign=S.mode==='poulet'?'center':'left';ctx.fillStyle=S.mode==='poulet'?'#30442c':'#fff1d3';
      ctx.fillText(Math.ceil(Math.max(0,S.duration-S.goT))+' s · '+S.successes+'/'+goal.target+' · +'+G.xp()+' XP',S.mode==='poulet'?640:20,S.mode==='poulet'?38:705);ctx.restore();
    }
    if(!S.work&&S.stat==='stamina'&&S.dbl){ctx.save();ctx.fillStyle='#ffe082';ctx.font='900 30px Nunito';ctx.textAlign='center';ctx.fillText('DOUBLE : ESPACE · ESPACE',770,190);ctx.restore();}
    if (S.phase === 'ready') {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.66)'; ctx.fillRect(0, 0, W, H); const theme=ctx.createLinearGradient(64,150,1216,680);theme.addColorStop(0,'#2a1c55');theme.addColorStop(1,'#0d0820');ctx.fillStyle=theme; A.rr(ctx,64,150,1152,530,22);ctx.fill();ctx.strokeStyle='#ffd54f';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#192b40';A.rr(ctx,100,315,1080,280,18);ctx.fill();ctx.strokeStyle='#625b80';ctx.lineWidth=2;ctx.stroke(); ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd54f'; ctx.font = '44px Bungee, Impact'; ctx.fillText(ex.icon + ' ' + exName().toUpperCase(), 640, 220, 1080);
      ctx.fillStyle = '#d4c6ea'; ctx.font = '24px Bungee, Impact'; ctx.fillText(G.difficulty(S.difficulty).name.toUpperCase() + '  ·  ' + S.duration + ' SECONDES  ·  ' + goal.target + ' ' + goal.label + (goal.avoid ? ' + ' + goal.avoid + ' objets évités' : ''), 640, 279, 1120);
      ctx.fillStyle='#ffd57b';ctx.font='900 30px Nunito';keycap(ctx,S.mode==='poulet'?'CLIC':'ESPACE',465,612,112);ctx.fillText('COMMENCER',735,640);
      ctx.font='900 21px Nunito';ctx.fillText('RÈGLEMENTS',640,345);
      if(S.mode==='mannequin'){ctx.fillStyle='#ffe5a3';ctx.font='900 22px Nunito';ctx.fillText(S.work.vegetable.icon+' '+S.work.vegetable.name+' · '+S.work.lives+' erreurs maximum',640,391,1000);}
      const rows=G.ruleRows(S.stat,S.mode,S.features),startY=365+(5-rows.length)*21;
      rows.forEach(([keys,label],i)=>{
        const y=startY+i*44,widths=keys.map(key=>key==='ESPACE'?108:key==='CLIC'?80:46),total=widths.reduce((a,b)=>a+b,0)+Math.max(0,keys.length-1)*10;
        let x=558-total;
        keys.forEach((key,j)=>{keycap(ctx,key,x,y,widths[j]);x+=widths[j]+10;});
        const simple=keys.length===0;
        ctx.textAlign=simple?'center':'left';ctx.fillStyle='#eee4d4';ctx.font='900 24px Nunito';ctx.fillText(label,simple?640:590,y+26,simple?1020:620);
      });
      ctx.restore();
    }
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const m of (['escaliers','oeufs'].includes(S.mode)&&S.phase==='go'?[]:S.msgs)) { ctx.globalAlpha = Math.min(1, (1 - m.t) * 3); ctx.font = m.size + 'px Bungee, Impact'; ctx.lineWidth = 8; ctx.strokeStyle = '#140a26'; ctx.strokeText(m.text, 640, 300 - m.t * 40); ctx.fillStyle = m.col; ctx.fillText(m.text, 640, 300 - m.t * 40); }
    if (S.mode !== 'escaliers' && S.timeCue && S.phase === 'go' && S.t - S.timeCue.at < 1.3) {
      const cue = S.timeCue, age = S.t - cue.at;
      ctx.globalAlpha = Math.min(1, age * 10, (1.3 - age) * 4); ctx.font = (cue.n <= 3 ? '80' : '30') + 'px Bungee, Impact';
      ctx.strokeStyle = '#14262d'; ctx.lineWidth = 7;
      const text = cue.n <= 3 ? String(cue.n) : cue.n + ' SECONDES RESTANTES';
      ctx.strokeText(text, 640, 190); ctx.fillStyle = cue.n <= 10 ? '#ffd178' : '#e7e5cf'; ctx.fillText(text, 640, 190);
    }
    if(S.stat==='stamina'&&!S.work)drawRopeHealth(ctx);
    if(S.mode==='sparring')G.drawTrainingVitals(ctx,{...S.work.combat.p,hp:S.work.hp,maxHp:S.work.maxHp});
    if (S.phase === 'end') drawSessionCelebration(ctx);
    ctx.restore();
  };

  function drawPowerLesson(c,s){
    const power=s.chargeKey?clamp((s.t-s.chargeStart)/1.2,0,1):0,age=s.t-(s.powerHitAt??-10);
    A.cornerCoach(c,s.coach,970,650,.7,s.t,-1,false,0);
    A.player(c,s.ch,{inRing:true,st:s.chargeKey?'charge':age<.6?'punch':'idle',side:s.chargeKey==='pR'?'R':'L',power:s.chargeKey?power:age<.6?1:0,t:age/.6,time:s.t});
    c.textAlign='center';c.fillStyle='#ffdc82';c.font='32px Bungee';c.fillText('COUPS DE PUISSANCE',640,180);
    c.font='900 24px Nunito';c.fillStyle='#fff3d4';c.fillText(s.phase==='end'?'TECHNIQUE APPRISE !':s.chargeKey?'RELÂCHE POUR FRAPPER !':'MAINTIENS Z OU X, PUIS RELÂCHE',640,230);
    c.fillText(s.rep+' / 4 coups chargés',640,282);c.fillStyle='#39384a';c.fillRect(490,310,300,14);c.fillStyle='#ffd368';c.fillRect(490,310,300*power,14);
    c.font='900 19px Nunito';c.fillStyle='#e4d9c4';c.fillText('Plus de puissance = plus de stamina. Le coach te demande quatre charges.',640,695);
  }
  function drawSessionCelebration(ctx) {
    const rating = S.rating, t = S.phT, tier = rating.tier, xp = G.xp(), count = Math.round(xp * A.eout(Math.min(1, t / .8)));
    ctx.save(); ctx.globalAlpha = A.ease(Math.min(1, t / .65)) * A.ease(Math.min(1, Math.max(0, S.endHold - t) / .65)); ctx.fillStyle = 'rgba(8,19,30,.82)'; ctx.fillRect(0, 170, W, 350);
    if (tier >= 2) {
      ctx.save(); ctx.translate(640, 340); ctx.rotate(t * .13); ctx.fillStyle = tier >= 4 ? 'rgba(240,197,107,.17)' : 'rgba(99,196,237,.1)';
      A.star(ctx, 0, 0, 225 + tier * 15, 12, .6); ctx.fill(); ctx.restore();
      for (let i = 0; i < tier * 5; i++) {
        const angle = i * 2.4 + t * .5, r = 170 + i % 4 * 38;
        A.sparkle(ctx, 640 + Math.cos(angle) * r * 1.6, 340 + Math.sin(angle) * r * .65, 4 + i % 3 * 3, rating.color);
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = '#0a1726';
    ctx.font = (52 + tier * 7) + 'px Bungee, Impact'; ctx.strokeText(rating.title, 640, 275, 1160); ctx.fillStyle = rating.color; ctx.fillText(rating.title, 640, 275, 1160);
    ctx.font = (66 + tier * 10) + 'px Bungee, Impact'; ctx.strokeText('+' + count + ' XP', 640, 380); ctx.fillStyle = '#fff7de'; ctx.fillText('+' + count + ' XP', 640, 380);
    ctx.font = '900 21px Nunito'; ctx.fillStyle = rating.color; ctx.fillText(G.passed() ? '✓ Défi réussi !' : S.successes + ' / ' + S.challenge.target + ' ' + S.challenge.label + (S.challenge.avoid ? ' · objets évités ' + S.obstaclesDodged + ' / ' + S.challenge.avoid : ''), 640, 465);
    if (G.passed()) {
      const bounce = Math.sin(t * 6) ** 2 * 10 * Math.min(1, t / .5) * Math.min(1, Math.max(0, S.endHold - t) / .7);
      if(S.mode!=='poulet')A.playerFront(ctx, S.ch, 640, 700 - bounce, .38 / A.childScale(S.ch), t * 2, { celebrate: true, rope: S.stat === 'stamina' });
      for (let i = 0; i < 18 + tier * 7; i++) {
        const age = (t + i * .053) % 1.4, x = 640 + Math.sin(i * 3.7) * (80 + age * 210), y = 470 + age * 170;
        ctx.save(); ctx.translate(x, y); ctx.rotate(i + t * 3); ctx.fillStyle = [rating.color, '#f4cf76', '#9bdbbb'][i % 3]; ctx.fillRect(-3, -5, 6, 10); ctx.restore();
      }
    }
    ctx.restore();
  }

  function playerPose() {
    if(S.combat)return G.combatPose(S);
    const pz = S.pose, d = S.poseT;
    if (S.guard && !(pz === 'hit' && d < .4)) return { st: 'block' };
    if (!pz) return { st: 'idle' };
    if(pz==='upper'&&d<.55)return {st:'upper',side:'R',t:d,wind:.15};
    if ((pz === 'pL' || pz === 'pR') && d < .3) return { st: 'punch', side: pz === 'pL' ? 'L' : 'R', high: S.mode==='libre'?!!S.punchHigh:S.work ? !!S.work.held.up : true, t: d / .3 };
    if ((pz === 'dodgeL' || pz === 'dodgeR') && d < .45) return { st: 'dodge', dir: pz === 'dodgeL' ? -1 : 1, t: d / .45 };
    if (pz === 'duck' && d < .5) return { st: 'duck', t: d / .5 };
    if (pz === 'hit' && d < .4) return { st: 'hit', t: d / .4, hitSide: 1 };
    return { st: 'idle' };
  }

  // ----- Force -----
  // Les cinq looks de jauge défilent dans toutes les difficultés.
  const GAUGES = [
    { name: 'BOIS', frame: '#6d4c41', edge: '#a1887f', track: '#3e2723', glow: null },
    { name: 'BRONZE', frame: '#8d5524', edge: '#cd7f32', track: '#2b1a0e', glow: null },
    { name: 'ACIER', frame: '#455a64', edge: '#cfd8dc', track: '#1c262b', glow: null },
    { name: 'OR', frame: '#8a6d00', edge: '#ffd700', track: '#2a2000', glow: 'rgba(255,215,0,.35)' },
    { name: 'PLASMA', frame: '#4a148c', edge: '#e040fb', track: '#12001f', glow: 'rgba(224,64,251,.55)' },
  ];
  function drawBag(ctx, T) {
    const sw = S.swing; let k = 0, sc = 1;
    if(S.free){const d=clamp(S.free.depth,-.65,.9);k=-d*.22;sc=1-d*.18;}
    if (sw) {
      const power=sw.power||1,peak=1+.8*power;
      if(sw.t<.5){const u=A.ease(sw.t/.5);k=lerp(-(sw.fromDepth||0)*.22,-.25*power,u);sc=lerp(1-(sw.fromDepth||0)*.18,.88,u);}
      else if(sw.t<.95){const u=A.ease((sw.t-.5)/.45);k=lerp(-.25*power,0,u);sc=lerp(.88,peak,u);}
      else {const u=A.ease(Math.min(1,(sw.t-.95)/.55));k=0;sc=lerp(peak,1,u);}
    }
    const geometry=S.free?G.freeBagGeometry(S):null;if(geometry){sc=geometry.scale;k=geometry.tilt;}
    ctx.save(); ctx.translate(640, 40); ctx.rotate(geometry?geometry.angle:S.bag * .02); ctx.scale(sc, sc); ctx.rotate(k);
    if (sw && !S.free && sw.t < .95) ctx.translate(Math.sin(T * 50) * 3, 0);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, 120); ctx.moveTo(0, 0); ctx.lineTo(40, 120); ctx.stroke();
    const gr = ctx.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, '#5d1010'); gr.addColorStop(.4, '#c62828'); gr.addColorStop(1, '#4a0c0c');
    ctx.fillStyle = gr; A.rr(ctx, -95, 120, 190, 400, 60); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-95, 170, 190, 18); ctx.fillRect(-95, 450, 190, 18);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '30px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText('K.O.', 0, 330);
    ctx.restore();
    if (sw && sw.t < .95) { ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#ffeb3b'; ctx.font = '900 30px Nunito'; ctx.globalAlpha = .7 + Math.sin(T * 20) * .3; ctx.fillText('⚠ LE SAC REVIENT !', 640, 110); ctx.restore(); }
  }
  function drawGauge(ctx, T) {
    const th = GAUGES[G.effectTheme(S.goT, GAUGES.length)], gx = 860, y0 = 150, hh = 400, zy = v => y0 + (1 - v) * hh;
    ctx.save();
    if (th.glow) { ctx.shadowColor = th.glow; ctx.shadowBlur = 30 + Math.sin(T * 4) * 10; }
    ctx.fillStyle = th.frame; A.rr(ctx, gx - 26, y0 - 20, 72, hh + 40, 16); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = th.edge; ctx.lineWidth = 4; A.rr(ctx, gx - 26, y0 - 20, 72, hh + 40, 16); ctx.stroke();
    // rivets / décor
    ctx.fillStyle = th.edge; for (const yy of [y0 - 8, y0 + hh + 8]) for (const xx of [gx - 16, gx + 36]) { ctx.beginPath(); ctx.arc(xx, yy, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = th.track; ctx.fillRect(gx - 8, y0, 36, hh);
    // graduations
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 1; i < 10; i++) ctx.fillRect(gx - 8, y0 + i * hh / 10, 10, 2);
    const visible = !has(9) || (S.t % 1.4) < 1.3 - (S.lvl - 1) / 30, z = zoneNow(), red = redNow();
    if (visible) {
      ctx.fillStyle = '#ffca28'; ctx.fillRect(gx - 8, zy(Math.min(1, z + S.yel)), 36, (Math.min(1, z + S.yel) - Math.max(0, z - S.yel)) * hh);
      const rg = ctx.createLinearGradient(gx - 8, 0, gx + 28, 0); rg.addColorStop(0, '#b71c1c'); rg.addColorStop(.5, '#ff5252'); rg.addColorStop(1, '#b71c1c');
      ctx.fillStyle = rg; ctx.fillRect(gx - 8, zy(Math.min(1, z + red)), 36, (Math.min(1, z + red) - Math.max(0, z - red)) * hh);
    }
    if (S.gold != null) { const gw = S.red0 * .7; ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 16; ctx.fillRect(gx - 8, zy(S.gold + gw), 36, 2 * gw * hh); ctx.shadowBlur = 0; }
    if (th.name === 'PLASMA') { ctx.globalAlpha = .25 + .15 * Math.sin(T * 9); ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = y0; y < y0 + hh; y += 12) ctx.lineTo(gx + 10 + Math.sin(y * .3 + T * 20) * 14, y); ctx.stroke(); ctx.globalAlpha = 1; }
    const ny = zy(needle()); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(gx - 12, ny); ctx.lineTo(gx - 30, ny - 11); ctx.lineTo(gx - 30, ny + 11); ctx.fill(); ctx.fillRect(gx - 10, ny - 3, 40, 6);
    ctx.fillStyle = th.edge; ctx.font = '15px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText('PUISSANCE', gx + 10, y0 + hh + 46); ctx.font = '12px Bungee, Impact'; ctx.fillText('JAUGE ' + th.name, gx + 10, y0 - 30);

    ctx.restore();
  }
  function drawFreeBeat(ctx,T){
    const f=S.free,x=930,y=160;ctx.save();ctx.fillStyle='rgba(12,25,32,.94)';A.rr(ctx,x,y,326,340,14);ctx.fill();ctx.textAlign='left';
    ctx.font='21px Bungee, Impact';ctx.fillStyle='#f3d595';ctx.fillText('À TON STYLE',x+20,y+32);
    ctx.font='bold 18px Nunito';ctx.fillStyle='#d7e9e5';
    const lines=[f.hits+' coups · '+f.hitPoints+' pts',Object.keys(f.styles).length+'/5 styles · +'+f.stylePoints+' pts',f.swings+' grands retours · +'+f.swingPoints+' pts',f.dodges+' esquives · +'+f.dodgePoints+' pts',f.collisions+' collisions'];
    lines.forEach((t,i)=>ctx.fillText(t,x+20,y+70+i*32));
    ctx.fillStyle='#36505a';ctx.fillRect(x+20,y+235,286,12);ctx.fillStyle='#ffca70';ctx.fillRect(x+20,y+235,286*Math.min(1,f.energy/2.9),12);
    ctx.font='bold 15px Nunito';ctx.fillStyle='#e6d5af';ctx.fillText('Z / X · ↑ + Z / X · Espace',x+20,y+279);ctx.fillText('Esquive : ← → ou ↓↓',x+20,y+307);ctx.restore();
  }
  function drawComboBox(ctx, T) {
    const cb = S.bagCombo, x = 932, y = 135, w = 324, bw = 40, gap = 8;
    ctx.save(); ctx.fillStyle = 'rgba(12,25,32,.93)'; A.rr(ctx, x, y, w, 186, 14); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8d9b5'; ctx.font = '15px Bungee, Impact'; ctx.fillText('ENCHAÎNEMENT BONUS', x + w / 2, y + 27);
    ctx.fillStyle = '#abbdb8'; ctx.font = '800 13px Nunito'; ctx.fillText('Facultatif · ← gant Z / → gant X', x + w / 2, y + 48);
    const x0 = x + (w - cb.seq.length * (bw + gap) + gap) / 2;
    cb.seq.forEach((hand, i) => {
      const done = i < cb.idx, current = i === cb.idx, xx = x0 + i * (bw + gap);
      if (current) { ctx.shadowColor = '#f6ce7b'; ctx.shadowBlur = 12 + Math.sin(T * 5) * 3; }
      ctx.fillStyle = done ? '#3f7660' : current ? '#f0ca78' : '#2c4149'; A.rr(ctx, xx, y + 65, bw, 45, 8); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = current ? '#182b32' : done ? '#d4efcf' : '#92a5a6'; ctx.font = '900 30px Nunito'; ctx.fillText(hand === 'pL' ? '←' : '→', xx + bw / 2, y + 97);
    });
    const rem = cb.idx ? Math.max(0, G.COMBO_WAIT - (S.goT - cb.lastAt)) : G.COMBO_WAIT;
    ctx.fillStyle = '#2c4149'; A.rr(ctx, x + 20, y + 122, w - 40, 4, 2); ctx.fill();
    ctx.fillStyle = '#b6c9bd'; if (rem > 0) { A.rr(ctx, x + 20, y + 122, (w - 40) * rem / G.COMBO_WAIT, 4, 2); ctx.fill(); }
    ctx.fillStyle = '#d1dccb'; ctx.font = '800 13px Nunito';
    ctx.fillText(cb.flash ? '+' + cb.bonus + ' points au dernier coup !' : 'Beau ou parfait = avance · 3 s entre coups', x + w / 2, y + 148);
    ctx.fillStyle = '#e6c67c'; ctx.fillText('Tous parfaits = super bonus', x + w / 2, y + 169);
    ctx.restore();
  }
  function drawForce(ctx, T, ch) {
    const swingFront = S.swing && S.swing.t >= (S.free?FREE_CONTACT:.5) && S.swing.t < 1.3;
    if (!swingFront) drawBag(ctx, T);
    if (S.mode !== 'libre') drawGauge(ctx, T);
    if (S.mode === 'libre') drawFreeBeat(ctx, T);
    ctx.save();const age=S.free?S.t-S.free.impactAt:9;
    if(age<.48){const recoil=Math.sin(Math.min(1,age/.48)*Math.PI);ctx.translate(0,recoil*38);ctx.translate(640,650);ctx.rotate(0);ctx.translate(-640,-650);}
    if(S.free&&['dodgeL','dodgeR'].includes(S.pose)&&S.poseT<.45)ctx.translate((S.pose==='dodgeL'?-1:1)*75*Math.sin(S.poseT/.45*Math.PI),0);
    A.player(ctx, ch, Object.assign({ time: T }, age<.48?{st:'hit',t:age/.48,hitSide:0}:playerPose()));ctx.restore();
    if (swingFront) drawBag(ctx, T);
    if(S.mode!=='libre')drawComboBox(ctx, T);
  }

  // ----- Rapidité -----
  function ballGeo() {
    const b = S.ball, z = b.z, hi = b.kind === 'high' ? 70 * Math.max(0, z) : 0;
    const x = 640 + b.x * (60 + 35 * clamp(z, 0, 1)), y = (z >= 0 ? 385 + z * 95 : 385 + z * 75) - hi, r = z >= 0 ? 48 * (1 + z * .75) : 48 * (1 + z * .42);
    return { x, y, r };
  }
  function drawCords(ctx) {
    const { x, y, r } = ballGeo(), b = S.ball, tense = b.st === 'out' || b.st === 'back' ? 1 : 0;
    ctx.save(); ctx.lineCap = 'round';
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(610, 0, 60, 10); ctx.fillStyle = '#616161'; ctx.fillRect(630, 10, 20, 8);
    ctx.fillStyle = '#424242'; A.ell(ctx, 640, 640, 34, 9); ctx.fill(); ctx.fillStyle = '#757575'; A.ell(ctx, 640, 636, 22, 5); ctx.fill();
    const cord = (x0, y0, x1, y1) => {
      const mx = (x0 + x1) / 2 + (1 - tense) * 10 * Math.sin(S.t * 3), my = (y0 + y1) / 2;
      ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      ctx.strokeStyle = tense ? '#ef5350' : '#455a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    };
    ctx.globalAlpha = .22; ctx.fillStyle = '#000'; A.ell(ctx, x, 640 + b.z * 30, r * .9, r * .2); ctx.fill(); ctx.globalAlpha = 1;
    cord(640, 18, x, y - r * .92); cord(640, 636, x, y + r * .92);
    ctx.restore();
  }
  const BALL_COL = { normal: ['#ff6f60', '#d32f2f', '#6d0f0f', '#b71c1c'], heavy: ['#cfd8dc', '#607d8b', '#263238', '#37474f'], high: ['#e1bee7', '#8e24aa', '#38006b', '#6a1b9a'] };
  function drawBallBody(ctx) {
    const b = S.ball, z = b.z, { x, y, r } = ballGeo(), col = BALL_COL[b.kind] || BALL_COL.normal;
    const win = b.st === 'back' && z > WIN() && b.kind === 'normal', perfect = win && z > PERF();
    ctx.save();
    if (b.st === 'out' || (b.st === 'back' && z > 0)) {
      for (let i = 1; i <= 3; i++) { ctx.globalAlpha = .12 / i; ctx.fillStyle = col[3]; ctx.beginPath(); ctx.arc(x - b.x * 18 * i, y - (b.st === 'out' ? -14 : 14) * i, r * (1 - i * .08), 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (win) { const pulse = .5 + .5 * Math.sin(S.t * 30); ctx.strokeStyle = perfect ? '#4fc3f7' : 'rgba(255,255,255,' + (.55 + pulse * .3) + ')'; ctx.lineWidth = perfect ? 9 : 6; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, TAU); ctx.stroke(); }
    if (b.kind !== 'normal' && b.st === 'back') { ctx.strokeStyle = b.kind === 'heavy' ? '#ffeb3b' : '#ea80fc'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(x, y, r + 12, S.t * 4, S.t * 4 + TAU); ctx.stroke(); ctx.setLineDash([]); }
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    g.addColorStop(0, col[0]); g.addColorStop(.45, col[1]); g.addColorStop(1, col[2]);
    ctx.fillStyle = g; A.ell(ctx, x, y, r, r * 1.08); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = Math.max(1.5, r * .045);
    ctx.beginPath(); ctx.ellipse(x, y, r * .42, r * 1.06, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * .22, x + r, y); ctx.stroke();
    ctx.setLineDash([r * .06, r * .07]); ctx.strokeStyle = 'rgba(255,230,200,.55)'; ctx.lineWidth = Math.max(1, r * .025);
    ctx.beginPath(); ctx.ellipse(x, y, r * .47, r * 1.0, 0, -1.2, 1.2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.ellipse(x, y - r * .05, r * .5, r * .19, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col[3]; ctx.font = (r * .26) + 'px Bungee, Impact'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.kind === 'heavy' ? 'PLOMB' : b.kind === 'high' ? '↓↓' : 'K.O.', x, y - r * .03, r * .9);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; A.ell(ctx, x - r * .38, y - r * .55, r * .22, r * .12, -.6); ctx.fill();
    ctx.fillStyle = '#bdbdbd'; ctx.fillRect(x - r * .12, y - r * 1.12, r * .24, r * .12); ctx.fillRect(x - r * .12, y + r * 1.0, r * .24, r * .12);
    ctx.restore();
  }
  function drawBall(ctx, T, ch) {
    const b = S.ball, z = b.z;
    drawCords(ctx);
    const front = z >= .25 || b.st === 'past' || b.st === 'bonk';
    if (!front) drawBallBody(ctx);
    A.player(ctx, ch, Object.assign({ time: T }, playerPose()));
    if (front) drawBallBody(ctx);
    if (b.st === 'rest' && S.phase === 'go') { ctx.save(); ctx.globalAlpha = .6 + Math.sin(T * 5) * .3; ctx.fillStyle = '#fff'; ctx.font = '900 24px Nunito'; ctx.textAlign = 'center'; ctx.fillText('Frappe le ballon !  (Z / X)', 640, 250); ctx.restore(); }
  }

  // ----- Poire de vitesse -----
  function drawPoire(ctx, T, ch) {
    const p = S.pb, th = poireAngle(T), shake = p.st === 'spin' ? Math.sin(T * 40) * p.amplitude : 0;
    // plateforme (vue du dessous, en perspective)
    ctx.save(); ctx.translate(640 + shake, 150); ctx.scale(1.15, 1.15); ctx.translate(0, -40);
    ctx.fillStyle = '#4e342e'; ctx.fillRect(-14, -200, 28, 320);
    ctx.fillStyle = '#3e2723'; A.ell(ctx, 0, 130, 250, 34); ctx.fill();
    const wg = ctx.createLinearGradient(0, 100, 0, 150); wg.addColorStop(0, '#a1887f'); wg.addColorStop(1, '#6d4c41');
    ctx.fillStyle = wg; A.ell(ctx, 0, 120, 250, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(0, 120, 250 - Math.abs(i) * 40, 34 - Math.abs(i) * 5, 0, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(-8, 140, 16, 12); // émerillon
    // la poire : pend de l’émerillon, se raccourcit à l’horizontale, grossit quand elle vient vers toi
    const Lb = 150, len = Lb * Math.cos(th) * .9 + 30, sc = 1 + .32 * Math.sin(th);
    const tipY = 152 + len;
    ctx.save(); ctx.translate(0, 152); ctx.scale(sc, 1);
    const bg2 = ctx.createRadialGradient(-14, len * .55, 6, 0, len * .6, 70); const gold = p.gold && p.st === 'spin';
    bg2.addColorStop(0, gold ? '#fff59d' : '#ef9a9a'); bg2.addColorStop(.5, gold ? '#ffc107' : '#c62828'); bg2.addColorStop(1, gold ? '#8d6e00' : '#5d0b0b');
    if (gold) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 25; }
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-20, len * .3, -62 * sc, len * .55, -48, len * .85); ctx.quadraticCurveTo(0, len * 1.08, 48, len * .85); ctx.bezierCurveTo(62 * sc, len * .55, 20, len * .3, 14, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, len * .95); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; A.ell(ctx, -20, len * .5, 9, len * .16, -.2); ctx.fill();
    ctx.restore();
    // impact sur la plateforme
    if (p.st === 'spin') for (const uu of [.3, .65]) { const d = Math.abs(p.u % 1 - uu); if (d < .07) { ctx.globalAlpha = 1 - d / .07; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { const a2 = -Math.PI / 2 + (i - 2) * .4; ctx.beginPath(); ctx.moveTo(Math.cos(a2) * 40, 140 + Math.sin(a2) * 10); ctx.lineTo(Math.cos(a2) * 80, 140 + Math.sin(a2) * 30); ctx.stroke(); } ctx.globalAlpha = 1; } }
    ctx.restore();
    void tipY;
    A.player(ctx, ch, Object.assign({ time: T }, playerPose()));
    if (p.st === 'rest' && S.phase === 'go') { ctx.save(); ctx.globalAlpha = .6 + Math.sin(T * 5) * .3; ctx.fillStyle = '#fff'; ctx.font = '900 24px Nunito'; ctx.textAlign = 'center'; ctx.fillText('Gauche Z · Droite X · Au choix !', 640, 470); ctx.restore(); }
    if (S.phase === 'go' && p.st === 'spin') { ctx.save(); ctx.fillStyle = '#ffe082'; ctx.font = '900 22px Nunito'; ctx.textAlign = 'center'; ctx.fillText(p.tempoKnown ? Math.round(60 / p.cur) + ' BPM · '+(p.dodges>=2?'Z / X : reprends la poire !':p.dodges?'Z / X : reprends · '+(p.dodgeSide==='left'?'→':'←')+' : esquive':'Z / X : frappe · ← → : esquive') : 'Encore un coup pour donner le tempo', 640, 460); ctx.restore(); }
    if (p.trip > 0) { ctx.save(); ctx.fillStyle = '#ffeb3b'; ctx.font = '900 26px Nunito'; ctx.textAlign = 'center'; ctx.fillText('⚡ TRIPLÉ ⚡', 640, 90); ctx.restore(); }
  }
  // ----- Punching-ball -----
  function drawPunch(ctx, T, ch) {
    const u = S.pu, z = u.z, sc = 1 + z * .55, x = 640 + u.x * 120, y = 380 + z * 40 - (1 - sc) * 10, r = 62 * sc;
    // socle + ressort (derrière le joueur)
    ctx.save();
    ctx.fillStyle = '#263238'; A.ell(ctx, 640, 690, 120, 26); ctx.fill(); ctx.fillStyle = '#37474f'; A.ell(ctx, 640, 682, 110, 22); ctx.fill();
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(640, 680); ctx.lineTo(640, 560); ctx.stroke();
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 6; ctx.beginPath(); for (let i = 0; i <= 14; i++) { const t = i / 14, px = lerp(640, x, t) + (i % 2 ? 14 : -14), py = lerp(560, y + r * .8, t); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(lerp(640, x, .95), lerp(560, y + r * .8, .95)); ctx.lineTo(x, y + r * .9); ctx.stroke();
    ctx.restore();
    const ball = () => {
      ctx.save();
      if (u.glow) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 30; }
      const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, u.glow ? '#fff59d' : '#90caf9'); g.addColorStop(.5, u.glow ? '#ffb300' : '#1565c0'); g.addColorStop(1, u.glow ? '#6d4c00' : '#0d2a5c');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * .45, r, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; A.ell(ctx, x - r * .35, y - r * .45, r * .25, r * .14, -.5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = (r * .3) + 'px Bungee, Impact'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(u.glow ? '⎵' : 'K.O.', x, y);
      if (S.difficulty < 3 && u.armed && u.vz > 0 && z > .15) { ctx.strokeStyle = z > .4 ? '#4fc3f7' : 'rgba(255,255,255,.8)'; ctx.lineWidth = z > .4 ? 8 : 5; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, TAU); ctx.stroke(); }
      if (u.charge > 0) { ctx.fillStyle = '#ffeb3b'; ctx.font = '900 28px Nunito'; ctx.fillText(u.x > 0 ? '← esquive !' : 'esquive ! →', 640, 150); }
      ctx.restore();
    };
    if (z < .2) ball();
    A.player(ctx, ch, Object.assign({ time: T }, playerPose()));
    if (z >= .2) ball();
    if (u.armed && S.phase === 'go') { ctx.save(); ctx.textAlign='center'; ctx.font='900 27px Nunito'; ctx.fillStyle='#ffe082'; ctx.fillText(u.glow ? 'ESPACE · UPPERCUT' : has(3) && Math.abs(u.x)>.12 ? (u.x<0?'Z · GAUCHE':'X · DROITE') : 'Z / X',640,230); ctx.restore(); }
    if (!u.armed && S.phase === 'go') { ctx.save(); ctx.globalAlpha = .6 + Math.sin(T * 5) * .3; ctx.fillStyle = '#fff'; ctx.font = '900 24px Nunito'; ctx.textAlign = 'center'; ctx.fillText('Frappe le punching-ball !  (Z / X)', 640, 230); ctx.restore(); }
  }

  // ----- Souffle : le coach en personne, avec ses mitaines -----
  function drawMittPad(ctx, x, y, s, sd, glow, fire, elec, T) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (fire) { for (let i = 0; i < 7; i++) { const a = T * 9 + i; ctx.globalAlpha = .55; ctx.fillStyle = i % 2 ? '#ff9800' : '#ff3d00'; ctx.beginPath(); ctx.ellipse(Math.sin(a) * 14, -40 - (i * 9 + (T * 120) % 30), 16 - i * 1.6, 26 - i * 2, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    if (glow) { const gr = ctx.createRadialGradient(0, 0, 20, 0, 0, 90); gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill(); }
    // poignet
    ctx.fillStyle = '#1a1a1a'; A.rr(ctx, -26, 40, 52, 34, 10); ctx.fill(); ctx.fillStyle = '#d32f2f'; ctx.fillRect(-26, 50, 52, 8);
    // dos de la mitaine (rembourré)
    ctx.fillStyle = '#111'; A.ell(ctx, 0, 4, 52, 62); ctx.fill();
    // pouce
    ctx.fillStyle = '#222'; A.ell(ctx, sd * 46, 10, 14, 26, sd * .4); ctx.fill();
    // coussin de frappe
    const pg = ctx.createRadialGradient(-12, -16, 6, 0, 0, 52); pg.addColorStop(0, fire ? '#ffab40' : '#ff5252'); pg.addColorStop(1, fire ? '#bf360c' : '#8e0000');
    ctx.fillStyle = pg; A.ell(ctx, 0, 0, 44, 54); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); A.ell(ctx, 0, 0, 38, 47); ctx.stroke(); ctx.setLineDash([]);
    // cible
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -2, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = fire ? '#ff6d00' : '#ffd600'; ctx.beginPath(); ctx.arc(0, -2, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(0, -2, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; A.ell(ctx, -16, -26, 14, 8, -.5); ctx.fill();
    if (elec) { ctx.strokeStyle = '#80d8ff'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = 0, py = 0; ctx.moveTo(px, py); for (let j = 0; j < 5; j++) { px += rand(-25, 25); py += rand(-25, 25); ctx.lineTo(px, py); } ctx.stroke(); } }
    ctx.restore();
  }
  // Articulation à deux segments : longueurs fixes, coudes fléchis, poignets attachés.
  G.coachArm=function(m,side,cx=640,turn=1){
    const shoulder={x:side*120*turn,y:330},wanted={x:m.x-cx,y:m.y+40*m.s};
    let dx=wanted.x-shoulder.x,dy=wanted.y-shoulder.y,d=Math.hypot(dx,dy)||1;
    const reach=clamp(d,25,198);dx*=reach/d;dy*=reach/d;
    const hand={x:shoulder.x+dx,y:shoulder.y+dy},mid={x:shoulder.x+dx*.5,y:shoulder.y+dy*.5},bend=Math.sqrt(10000-reach*reach/4);
    return {shoulder,elbow:{x:mid.x-side*dy/reach*bend,y:mid.y+side*dx/reach*bend},hand};
  };
  function drawCoach(ctx, T, Lm, Rm) {
    const co = S.coach, cx = 640 + (S.teleFx ? Math.sin(T * 80) * 30 * S.teleFx : 0), sp = S.atk && S.atk.tornado && !S.atk.hit ? Math.cos(S.atk.t * 18) : 1;
    ctx.save(); ctx.translate(cx, 0);
    const shirt = co ? co.tank : '#37474f';
    // Tornade : il tourne sur lui-même
    ctx.save(); ctx.scale(sp, 1);
    // corps
    ctx.fillStyle = A.shade(shirt, -.25); A.rr(ctx, -150, 300, 300, 260, 60); ctx.fill();
    ctx.fillStyle = shirt; A.rr(ctx, -138, 296, 276, 250, 56); ctx.fill();
    ctx.fillStyle = '#e9bc98'; ctx.beginPath(); ctx.moveTo(-36, 296); ctx.quadraticCurveTo(0, 340, 36, 296); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '30px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText('COACH', 0, 420);
    // sifflet
    ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 300); ctx.quadraticCurveTo(0, 380, 30, 300); ctx.stroke();
    ctx.fillStyle = '#b0bec5'; A.rr(ctx, -10, 366, 22, 14, 5); ctx.fill();
    ctx.restore();
    // Les mitaines suivent les mains, sans bras qui s’étirent ou se croisent.
    ctx.lineCap='round';
    for(const [m,sd] of [[Lm,-1],[Rm,1]]){
      const limb=G.coachArm(m,sd,cx,sp);m.x=cx+limb.hand.x;m.y=limb.hand.y-40*m.s;
      ctx.strokeStyle=A.shade(shirt,-.12);ctx.lineWidth=42;ctx.beginPath();ctx.moveTo(limb.shoulder.x,limb.shoulder.y);ctx.lineTo(limb.elbow.x,limb.elbow.y);ctx.stroke();
      ctx.strokeStyle='#e9bc98';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(limb.elbow.x,limb.elbow.y);ctx.lineTo(limb.hand.x,limb.hand.y);ctx.stroke();
    }
    // tête (la vraie tête du coach !)
    const F = root.FamilyHeads, img = co && F && F.frame(co.id, 'front');
    if (img) { const h = 200, w = h * img.width / img.height; ctx.drawImage(img, -w / 2, 110, w, h); }
    else { ctx.fillStyle = '#e9bc98'; ctx.beginPath(); ctx.arc(0, 220, 80, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (S.shout) { const a = Math.min(1, (1.2 - S.shout.t) * 3); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; A.rr(ctx, cx + 90, 120, 260, 54, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 100, 160); ctx.lineTo(cx + 70, 190); ctx.lineTo(cx + 130, 168); ctx.fill(); ctx.fillStyle = '#140a26'; ctx.font = '20px Bungee, Impact'; ctx.textAlign = 'center'; ctx.fillText(S.shout.text, cx + 220, 155, 240); ctx.restore(); }
    if (co) { ctx.save(); ctx.fillStyle = 'rgba(10,6,30,.8)'; A.rr(ctx, 1010, 650, 240, 44, 14); ctx.fill(); ctx.fillStyle = '#ffd54f'; ctx.font = '900 20px Nunito'; ctx.textAlign = 'center'; ctx.fillText('📋 Coach ' + co.name, 1130, 679); ctx.restore(); }
  }
  G.drawDefenseMitts=function(ctx,T,w){
    const side=w.cue.hand==='A'?0:1,headY=A.ringHeadY(S.ch),targetY=w.cue.high?headY:headY+70;
    const progress=w.phase==='windup'?clamp((w.timer/w.windup-.5)*2,0,1):w.phase==='impact'?1-w.timer/.25:0;
    const pads=[{x:500,y:300,s:1},{x:780,y:300,s:1}];
    pads[side]={x:lerp(side?810:470,side?675:605,progress),y:lerp(w.cue.high?260:380,targetY,progress),s:1+progress*.35};
    drawCoach(ctx,T,pads[0],pads[1]);
    const posed=w.phase==='impact'&&!w.blocked?{st:'hit',t:w.timer/.25,hitSide:side?1:-1}:w.guard&&w.clock-w.guardAt<.28?{st:'parry',hand:w.guard.hand,high:w.guard.high}:{st:'idle'};
    A.player(ctx,S.ch,Object.assign({time:T,inRing:true},posed));
    pads.forEach((pad,i)=>drawMittPad(ctx,pad.x,pad.y,pad.s,i===0?-1:1,i===side&&w.phase==='windup'?'rgba(255,170,80,.65)':null,false,false,T));
    if(w.guard&&w.clock-w.guardAt<.28){
      const x=w.guard.hand==='A'?605:675,y=w.guard.high?headY:headY+70;
      ctx.save();ctx.strokeStyle=w.blocked?'#9cf3bd':'#8cd6ff';ctx.lineWidth=8;A.rr(ctx,x-28,y-32,56,64,16);ctx.stroke();ctx.fillStyle='rgba(125,207,255,.2)';ctx.fill();ctx.restore();
    }
  };
  // Même corps, portrait, cadrage et échelle que le sparring.
  G.drawSparringCoach=function(ctx,coach,T,frame={},boxer){
    const base=boxer||BX.boxerById('coach'),b=boxer||{...base,look:{...base.look,shirt:{type:'tank',c1:coach.tank},gloves:coach.gloves}};
    ctx.save();ctx.translate(640,570);ctx.scale(.88,.88);A.boxer(ctx,b,{ph:'idle',time:T,guard:'high',familyId:coach.id,...frame});ctx.restore();
  };
  G.drawFocusMitts=function(ctx,T,cue,active){
    const coach=S.coach||BX.charById('richard'),base=BX.boxerById('coach'),boxer={...base,look:{...base.look,shirt:{type:'tank',c1:coach.tank},gloves:coach.gloves}};
    const pads=[{x:510,y:cue.high?270:390,s:1},{x:770,y:cue.high?270:390,s:1}];
    const frame={ph:'idle',time:T,guard:'high'},r=A.pose(boxer,frame);
    pads.forEach((pad,i)=>{r.g[i].x=(pad.x-640)/.88;r.g[i].y=(pad.y-570)/.88;});
    G.drawSparringCoach(ctx,coach,T,{...frame,R:r},boxer);
    pads.forEach((pad,i)=>{const selected=active&&(cue.hand==='A'?i===0:i===1);drawMittPad(ctx,pad.x,pad.y,1,i===0?-1:1,selected?'rgba(255,230,75,.7)':null,false,false,T);});
    A.player(ctx,S.ch,Object.assign({time:T,inRing:true},playerPose()));return pads[cue.hand==='A'?0:1];
  };
  function drawMitts(ctx, T, ch) {
    const at = S.atk, bob = Math.sin(T * 3) * 6;
    let L = { x: 510, y: 270 + bob, s: 1 }, Rr = { x: 770, y: 270 - bob, s: 1 }, front = false;
    if (at && !at.target) {
      const k = Math.min(1, at.t / at.tell), shake = k > .5 ? Math.sin(T * 60) * 5 : 0, sw = at.t > at.tell ? Math.min(1, (at.t - at.tell) / .15) : 0, back = at.t > at.tell + .15 ? Math.min(1, (at.t - at.tell - .15) / .15) : 0;
      const hit = sw * (1 - back), fsw = at.feint ? Math.min(hit, .25) : hit;
      if (at.kind === 'L') { L = { x: lerp(410 - 50 * k + shake, 600, fsw), y: lerp(280, 470, fsw), s: 1 + fsw * .5 }; front = fsw > .3; }
      if (at.kind === 'R') { Rr = { x: lerp(870 + 50 * k + shake, 680, fsw), y: lerp(280, 470, fsw), s: 1 + fsw * .5 }; front = fsw > .3; }
      if (at.kind === 'high') { L = { x: lerp(360 - 40 * k, 640, hit), y: 380 + shake, s: 1 + hit * .4 }; Rr = { x: lerp(920 + 40 * k, 640, hit), y: 380 - shake, s: 1 + hit * .4 }; front = hit > .3; }
      if (at.kind === 'low') { Rr = { x: lerp(720, 660, hit), y: lerp(lerp(300, 640, k), 470, hit), s: 1 + hit * .5 }; front = k > .4; }
    }
    const glowCol = at && !at.hit ? (at.target ? 'rgba(255,235,59,'+(.45+.35*Math.sin(T*12))+')' : at.fire ? 'rgba(255,87,34,.7)' : at.tele ? 'rgba(128,216,255,.7)' : at.feint ? 'rgba(255,235,59,.45)' : 'rgba(255,110,65,.65)') : null;
    const fireL = at && at.fire && at.kind === 'L', fireR = at && at.fire && at.kind === 'R', elec = S.teleFx > 0 || (at && at.tele);
    const gL = glowCol && (at.kind === 'L' || at.kind === 'high'), gR = glowCol && (at.kind === 'R' || at.kind === 'high' || at.kind === 'low');
    drawCoach(ctx, T, L, Rr);
    if(at&&at.target&&!at.hit){const m=at.kind==='L'?L:Rr;ctx.save();ctx.strokeStyle='#ffe45e';ctx.lineWidth=5+Math.sin(T*12)*2;ctx.beginPath();ctx.arc(m.x,m.y,78+Math.sin(T*12)*7,0,TAU);ctx.stroke();ctx.fillStyle='#ffe45e';ctx.font='900 24px Nunito';ctx.textAlign='center';ctx.fillText(at.hand==='pL'?'Z · GAUCHE':'X · DROITE',m.x,m.y+100);ctx.restore();}
    if(S.pattern){
      const p=S.pattern;ctx.save();ctx.fillStyle='rgba(14,20,29,.92)';A.rr(ctx,956,165,300,86+p.steps.length*37,18);ctx.fill();ctx.textAlign='left';ctx.fillStyle='#ffe082';ctx.font='900 21px Nunito';ctx.fillText('SÉRIE · '+p.completed+' / '+p.total,976,198);ctx.fillStyle='#d2dedb';ctx.font='800 16px Nunito';ctx.fillText('Jaune : frappe · Orange : défends',976,226);
      p.steps.forEach((step,i)=>{const active=!!at&&at.index===i;ctx.fillStyle=active?'#ffe082':'#a5b9bd';ctx.font=(active?'900':'800')+' 20px Nunito';const label=step.target?(step.hand==='pL'?'Z · Coup gauche':'X · Coup droit'):step.feint?'Attends · Feinte':step.kind==='high'?'↓↓ · Baisse-toi':step.kind==='low'?'↓ · Bloque':step.kind==='L'?'→ · Esquive droite':'← · Esquive gauche';ctx.fillText((active?'▶ ':'   ')+label,974,260+i*37,268);});ctx.restore();
    }
    if (!front) { drawMittPad(ctx, L.x, L.y, L.s, -1, gL && glowCol, fireL, elec, T); drawMittPad(ctx, Rr.x, Rr.y, Rr.s, 1, gR && glowCol, fireR, elec, T); }
    A.player(ctx, ch, Object.assign({ time: T }, playerPose()));
    if (front) { drawMittPad(ctx, L.x, L.y, L.s, -1, false, fireL, false, T); drawMittPad(ctx, Rr.x, Rr.y, Rr.s, 1, false, fireR, false, T); }
    if (at && !at.hit && !at.target && at.kind === 'high') { ctx.fillStyle = '#ffd54f'; ctx.font = '900 30px Nunito'; ctx.textAlign = 'center'; ctx.fillText('↔ balayage !', 640, 640); }
    if (at && !at.hit && !at.target && at.kind === 'low') { ctx.fillStyle = '#ffd54f'; ctx.font = '900 30px Nunito'; ctx.textAlign = 'center'; ctx.fillText('⬆ par en bas !', 640, 640); }
  }

  // ----- Stamina : la corde (thèmes) -----
  const REQ_LABEL = { up: '', left: '← pied gauche', right: 'pied droit →', down: '↓ saut croisé' };
  function drawRopeObstacles(ctx, T) {
    ctx.save();
    for (const item of S.obstacles) {
      if (item.wait > 0) {
        ctx.globalAlpha = .45 + Math.sin(T * 12) * .15; ctx.strokeStyle = '#f6c473'; ctx.lineWidth = 2;
        ctx.setLineDash([5, 8]); ctx.beginPath(); ctx.moveTo(item.x, 278); ctx.lineTo(item.x, 650); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f6c473'; A.ell(ctx, item.x, 668, item.r + 10, 5); ctx.fill();
        ctx.font = '900 27px Nunito'; ctx.textAlign = 'center'; ctx.fillText('!', item.x, 268);
        ctx.globalAlpha = 1; continue;
      }
      ctx.save(); ctx.translate(item.x, item.y); ctx.rotate((T + item.x) * (item.kind === 'towel' ? 2 : 1));
      ctx.globalAlpha = item.hit ? .5 : 1;
      if (item.kind === 'glove') A.glove(ctx, 0, 0, .5, '#a84a40', 1, false, 0);
      else if (item.kind === 'towel') {
        ctx.fillStyle = '#e8dcc0'; A.rr(ctx, -17, -12, 34, 25, 3); ctx.fill(); ctx.fillStyle = '#6c9ca2'; ctx.fillRect(-17, 4, 34, 5);
      } else {
        ctx.fillStyle = '#876e4d'; ctx.beginPath(); ctx.arc(0, 0, item.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#d4b47b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, item.r - 5, -.8, 2); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  G.drawTrainingVitals=(ctx,p,options={})=>BX.fight.drawPlayerHud(ctx,p,S.ch,S.t,options);
  function drawRopeHealth(ctx){
    G.drawTrainingVitals(ctx,{hp:S.ropeHp,maxHp:S.ropeMaxHp},{health:true,stamina:false});
  }
  function drawRope(ctx, T, ch) {
    const ground = 670, a = S.ang, front = Math.sin(a) < 0, th = ropeTheme();
    const jumpY = S.jumpT >= 0 ? -Math.sin(Math.min(1, S.jumpT / G.ropeJumpDuration(S)) * Math.PI) * 76 : 0;
    const coach = S.coach || BX.charById('richard'), helper = BX.charById(coach.id === 'josee' ? 'matthieu' : 'josee');
    // Les deux extrémités restent dans les mains des adultes, jamais dans celles du jeune.
    const L = A.cornerCoach(ctx, coach, 460, ground, .49, T, 1, false, a);
    const Rr = A.cornerCoach(ctx, helper, 1050, ground, .49, T, -1, false, a);
    const endY = (L.y + Rr.y) / 2;
    // La corde touche le sol à ang=0, exactement au moment testé par updateRope.
    const middleY = 495 + Math.cos(a) * (ground - 495);
    const point = u => ({ x: lerp(L.x, Rr.x, u), y: lerp(L.y, Rr.y, u) + (middleY - endY) * Math.pow(Math.sin(Math.PI * u), .15) });
    const path = () => { ctx.beginPath(); ctx.moveTo(L.x, L.y); for (let i = 1; i <= 64; i++) { const p = point(i / 64); ctx.lineTo(p.x, p.y); } };
    const rope = () => {
      ctx.save(); ctx.lineCap = 'round';
      const special = S.req === 'down' ? '#bc83db' : S.req !== 'up' ? '#6fd0db' : null;
      const color = special || (S.dbl ? '#ffd45e' : th === 'base' ? '#d9bd7b' : th === 'neon' ? '#32e7dd' : th === 'elec' ? '#72ceff' : '#ff9c36');
      if (th !== 'base' || S.dbl) { ctx.shadowColor = color; ctx.shadowBlur = th === 'lava' ? 25 : 14; }
      ctx.strokeStyle = th === 'fire' || th === 'lava' ? '#d74b25' : '#524736'; ctx.lineWidth = front ? 9 : 7; path(); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = front ? 5 : 4; path(); ctx.stroke();
      if (th !== 'base') { ctx.strokeStyle = '#fff1b7'; ctx.lineWidth = 1.5; path(); ctx.stroke(); }
      ctx.shadowBlur = 0;
      if (th === 'elec') {
        ctx.strokeStyle = '#e3f7ff'; ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) { const p = point((i + T * 5 % 1) / 10); ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 4); ctx.lineTo(p.x + 4, p.y + Math.sin(T * 30 + i) * 13); ctx.lineTo(p.x + 11, p.y - 4); ctx.stroke(); }
      }
      if (th === 'fire' || th === 'lava') {
        for (let i = 1; i < 20; i++) {
          const p = point(i / 20), flame = 7 + Math.sin(T * 17 + i * 2.1) * 4;
          ctx.fillStyle = i % 3 ? '#ffac36' : '#ffe48b'; ctx.beginPath(); ctx.ellipse(p.x, p.y - flame * .55, 4, flame, Math.sin(T * 6 + i) * .25, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    };
    if (!front) { ctx.save(); if (has(8)) ctx.globalAlpha = .55 - (S.lvl - 1) * .43 / 9; rope(); ctx.restore(); }
    drawRopeObstacles(ctx, T);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; A.ell(ctx, S.ropeX, ground + 3, 40 + jumpY * .12, 7); ctx.fill();
    ctx.save(); if (S.trip > 0 || S.obstacleHit > 0) ctx.translate(Math.sin(T * 40) * 5, 0);
    A.playerFront(ctx, ch, S.ropeX, ground + jumpY, .65, T * 2, { rope: true }); ctx.restore();
    if (S.burn > 0) {
      ctx.save();ctx.translate(S.ropeX,ground+jumpY);ctx.globalAlpha=Math.min(1,S.burn*2);
      if(S.burnKind==='elec'){
        ctx.strokeStyle='#b9f5ff';ctx.shadowColor='#52bfff';ctx.shadowBlur=14;ctx.lineWidth=3;
        for(let i=0;i<5;i++){ctx.beginPath();for(let j=0;j<7;j++){const x=-55+i*27+Math.sin(T*24+j*3+i)*9,y=-20-j*23;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
      }else{
        ctx.shadowColor='#ff6927';ctx.shadowBlur=16;
        for(let i=0;i<11;i++){
          const x=-45+i*9,y=-14-(i%3)*28,h=35+20*(.5+.5*Math.sin(T*13+i*2)),sway=Math.sin(T*10+i)*9;
          ctx.fillStyle=S.burnKind==='lava'?'#ff4627':'#ff842b';ctx.beginPath();ctx.moveTo(x-10,y);ctx.bezierCurveTo(x-21,y-20,x+sway-9,y-h*.5,x+sway,y-h);ctx.bezierCurveTo(x+sway+4,y-h*.4,x+22,y-18,x+10,y);ctx.closePath();ctx.fill();
          ctx.fillStyle='#ffe270';ctx.beginPath();ctx.moveTo(x-5,y);ctx.quadraticCurveTo(x-10,y-13,x+sway*.4,y-h*.58);ctx.quadraticCurveTo(x+12,y-10,x+5,y);ctx.fill();
        }
      }ctx.restore();
    }
    const damageAge=S.t-S.ropeDamageAt;
    if(damageAge<.8){ctx.save();ctx.globalAlpha=1-damageAge/.8;ctx.font='900 34px Nunito';ctx.textAlign='center';ctx.fillStyle='#ff7464';ctx.strokeStyle='#261627';ctx.lineWidth=4;const y=ground+jumpY-220-damageAge*45;ctx.strokeText('-'+S.ropeDamage,S.ropeX,y);ctx.fillText('-'+S.ropeDamage,S.ropeX,y);ctx.restore();}
    if (front) rope();
    // Poignées visibles, toujours attachées à la corde.
    for (const [p, side] of [[L, 1], [Rr, -1]]) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(a) * .3 * side); ctx.fillStyle = '#24363d'; A.rr(ctx, -4, -12, 8, 23, 3); ctx.fill(); ctx.fillStyle = '#c5b796'; ctx.fillRect(-4, -8, 8, 3); ctx.restore();
    }
    ctx.save(); ctx.textAlign = 'center'; ctx.font = '900 16px Nunito'; ctx.fillStyle = '#d8dfcb';
    if (S.req !== 'up' || S.dblNext || S.dbl || S.halt > 0) {
      ctx.font = '900 27px Nunito'; ctx.lineWidth = 5; ctx.strokeStyle = '#14252e'; ctx.fillStyle = S.req === 'down' ? '#e3b2ed' : '#ffdc85';
      const instruction = S.halt > 0 ? 'STOP… attends !' : S.req !== 'up' ? REQ_LABEL[S.req] : S.dbl ? 'DOUBLE TOUR !' : 'Double tour au prochain…';
      ctx.strokeText(instruction, 755, 251); ctx.fillText(instruction, 755, 251);
    }
    if (th !== 'base') { ctx.textAlign = 'right'; ctx.font = '17px Bungee, Impact'; ctx.fillStyle = th === 'fire' || th === 'lava' ? '#ffaf69' : '#8ddde9'; ctx.fillText({ neon: 'CORDE NÉON', elec: 'CORDE ÉLECTRIQUE', fire: 'CORDE EN FEU', lava: 'CORDE DE LAVE' }[th], 1250, 702); }
    ctx.restore();
  }
})(window);
