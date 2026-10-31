// Mode Aventure : mondes et tableaux (sortie cachée, interrupteurs, mini-boss, boss), vies, score et sauvegarde.
// Cartes : # bloc dur, x bloc mou, ? bloc mou au hasard, 1 départ, E porte, e porte cachée sous un bloc, S interrupteur,
// ennemis : b ballounet, g gluant, f fantôme, k chevalier, t crapaud géant, o roi golem.
(function (BK) {
  'use strict';
  const ENEMY_CODES = { b: 'ballon', g: 'gluant', f: 'fantome', k: 'chevalier', t: 'crapaud', o: 'golem' };
  // Constructeur de cartes d'exploration : grille remplie d'eau, puis rectangles et cases.
  function buildMap(cols, rows, fn) {
    const g = Array.from({ length: rows }, () => Array(cols).fill('~'));
    const m = { set(c, r, ch) { if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = ch; }, rect(c0, r0, c1, r1, ch) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) m.set(c, r, ch); } };
    fn(m); return g.map(row => row.join(''));
  }
  // 1-1 : le Jardin vert, d'après la carte de Matthieu. Départ en bas à droite, but en bas à gauche.
  const GARDEN = buildMap(26, 34, m => {
    m.rect(2, 1, 23, 7, ':');                                       // plateau du haut (niveau 1)
    m.rect(3, 2, 5, 4, ';'); m.rect(20, 2, 22, 4, ';'); m.set(4, 3, 'X'); m.set(21, 3, 'X'); m.set(13, 2, 'T'); m.set(8, 1, 'T'); m.set(18, 1, 'T');
    m.rect(10, 5, 12, 7, 'X'); m.set(11, 6, 'k'); m.set(6, 3, 'k'); m.rect(15, 4, 16, 4, 'X');
    m.set(2, 8, '/'); m.set(22, 8, '/');                            // rampes vers le bas
    m.rect(1, 9, 7, 18, '.');                                       // région de gauche (niveau 0)
    m.rect(2, 11, 4, 13, ','); m.set(3, 12, 'x'); m.rect(5, 15, 7, 17, ','); m.set(6, 16, 'x'); m.set(1, 18, 'k'); m.rect(1, 9, 1, 10, 'W'); m.rect(6, 9, 7, 10, 'W');
    m.rect(2, 19, 4, 28, '.');                                      // couloir de gauche
    m.rect(4, 21, 7, 26, '~'); m.set(6, 22, 'B'); m.rect(2, 23, 3, 24, 'b');   // eau, cible B sur son îlot, pont-levis b
    m.rect(1, 25, 7, 32, '.'); m.rect(4, 27, 6, 29, ','); m.set(5, 28, 'x'); m.set(3, 31, 'G'); m.set(1, 30, 'k'); m.set(7, 25, 'x'); m.rect(1, 25, 1, 26, 'W');
    m.set(1, 29, '#'); m.set(1, 31, '#'); m.set(2, 29, '#'); m.set(2, 31, '#'); m.set(2, 30, 'Q');          // la carte est derrière une porte scellée…
    m.set(6, 30, 'P'); m.set(5, 30, 'p'); m.set(4, 30, 'p'); m.set(3, 30, 'p');                              // …qu'un baril et sa traînée de poudre ouvrent
    m.rect(22, 9, 22, 10, '.'); m.set(22, 10, 'a');                 // descente de droite et grille a
    m.rect(16, 11, 24, 23, '.');                                    // place de droite
    m.rect(17, 13, 19, 15, ','); m.rect(21, 13, 23, 15, ','); m.set(18, 14, 'x'); m.set(22, 14, 'x'); m.set(18, 12, 'h'); m.set(22, 12, 'h');
    m.rect(17, 18, 19, 21, ','); m.rect(21, 18, 23, 21, ','); m.set(18, 19, 'x'); m.set(22, 20, 'x'); m.set(16, 23, 'W'); m.set(24, 11, 'W');
    m.rect(22, 24, 24, 31, '.'); m.set(23, 31, '1'); m.set(23, 26, 'k'); m.set(22, 28, 'x'); m.set(24, 29, 'x');   // couloir de départ
    m.rect(10, 15, 13, 19, '.'); m.set(13, 17, 'A'); m.rect(11, 16, 12, 18, ','); m.set(11, 17, 'x');             // îlot central avec la cible A
    m.rect(9, 12, 9, 13, '='); m.rect(8, 11, 9, 11, '.');           // petit pont décoratif vers un quai
    m.rect(9, 14, 9, 14, '.');
  });
  BK.WORLDS = [
    { id: 'foret', name: 'La Forêt verte', theme: 'forest', stages: [
      // 1-1 : la vraie carte de Matthieu (js/stage-1-1.js, importée de l'éditeur) ; le Jardin vert d'avant reste dans BK.GARDEN_STAGE (tests, `#stage=jardin`)
      { id: '1-1', name: BK.STAGE_1_1.name, objective: 'goal', explore: true, theme: BK.STAGE_1_1.theme, items: 0.25, map: BK.STAGE_1_1.grid, props: BK.STAGE_1_1.props, houses: BK.STAGE_1_1.houses, npcs: BK.STAGE_1_1.npcs, shop: BK.STAGE_1_1.shop, music: BK.STAGE_1_1.music, mapId: 'stage-1-1', enemies: BK.STAGE_1_1.enemies,
        hint: 'Le village de Matthieu : explore, casse des blocs, entre dans les maisons, ramasse les pièces et trouve le but tout en haut. Les cibles rayées s’atteignent en lançant une bombe (Shift).' },
      { id:'1-2',name:BK.STAGE_1_2.name,objective:'goal',explore:true,theme:BK.STAGE_1_2.theme,map:BK.STAGE_1_2.grid,props:BK.STAGE_1_2.props,houses:BK.STAGE_1_2.houses,npcs:BK.STAGE_1_2.npcs,shop:BK.STAGE_1_2.shop,music:BK.STAGE_1_2.music,enemies:BK.STAGE_1_2.enemies,mapId:'stage-1-2',items:.25,hint:'Explore le sentier et trouve le portail de sortie.' },
      { id:'1-3',name:BK.STAGE_1_3.name,objective:'goal',explore:true,theme:BK.STAGE_1_3.theme,map:BK.STAGE_1_3.grid,props:BK.STAGE_1_3.props,houses:BK.STAGE_1_3.houses,npcs:BK.STAGE_1_3.npcs,shop:BK.STAGE_1_3.shop,music:BK.STAGE_1_3.music,enemies:BK.STAGE_1_3.enemies,mapId:'stage-1-3',items:.25,hint:'Active les trois cibles pour ouvrir le chemin vers le portail de sortie.' },
      { id:'1-4',name:BK.STAGE_1_4.name,objective:'goal',explore:true,preview:'volcano',theme:BK.STAGE_1_4.theme,map:BK.STAGE_1_4.grid,props:BK.STAGE_1_4.props,houses:BK.STAGE_1_4.houses,npcs:BK.STAGE_1_4.npcs,shop:BK.STAGE_1_4.shop,music:BK.STAGE_1_4.music,enemies:BK.STAGE_1_4.enemies,mapId:'stage-1-4',items:.25,hint:'Explore le volcan, évite la lave et les éruptions, puis trouve le portail de sortie.' },
      {id:'1-5',name:BK.STAGE_1_5.name,objective:'boss',encounter:'firstBoss',explore:true,theme:BK.STAGE_1_5.theme,map:BK.STAGE_1_5.grid,props:BK.STAGE_1_5.props,houses:BK.STAGE_1_5.houses,enemies:[],mapId:'stage-1-5',items:.2,hint:'Vaincs les deux gardiens crapauds, puis les deux formes du Roi Golem. Attention aux jets d’eau et aux attaques annoncées !'},
    ] },
    { id: 'chateau', name: 'Le Château des ombres', theme: 'castle', stages: BK.CASTLE_STAGES },
  ];
  // Normalise les cartes (toutes les lignes de même longueur).
  for (const w of BK.WORLDS) for (const s of w.stages) { if (s.explore) continue; const n = Math.max(...s.map.map(l => l.length)); s.map = s.map.map(l => (l + '#'.repeat(n)).slice(0, n)); }
  BK.stageList = () => BK.WORLDS.flatMap(w => w.stages.map(s => ({ ...s, world: w })));
  // L'ancien 1-1 (le Jardin vert, d'après la carte Bomberman 64 de Matthieu) : jouable comme tableau personnalisé, utilisé par les tests.
  BK.GARDEN_STAGE = { id: 'Jardin', name: 'Le Jardin vert', objective: 'goal', explore: true, theme: 'garden', items: 0.25, map: GARDEN, custom: true, world: BK.WORLDS[0],
    hint: 'Explore le jardin jusqu’au but. Les cibles rayées s’atteignent en lançant une bombe (Shift) : elles ouvrent les grilles et les ponts-levis. Un baril dormant et sa traînée de poudre ouvrent la porte scellée. Ramasse les cartes d’or !',
    enemies: [{ type: 'ballon', c: 23, r: 28 }, { type: 'ballon', c: 20, r: 16 }, { type: 'gluant', c: 19, r: 22 }, { type: 'gluant', c: 12, r: 3 }, { type: 'ballon', c: 18, r: 6 }, { type: 'ballon', c: 4, r: 15 }, { type: 'gluant', c: 3, r: 26 }] };

  const KEY = id => 'bk.adventure.' + id;
  // Stats du personnage : stamina max et récupération ; les points gagnés par niveau s'y placent.
  BK.applyStats = (p, save, keepCurrent) => { const st = Object.assign(BK.defaultStats(), save.stats || {}); const ratio = keepCurrent && p.staminaMax ? p.stamina / p.staminaMax : 1; p.staminaMax = st.staminaMax; p.staminaRegen = st.regen; p.fireRegen = st.fireRegen; p.stamina = Math.min(st.staminaMax, st.staminaMax * ratio); const hpMax = st.hpMax + 10 * ((save.upgrades || {}).heart || 0); const hpBefore = p.hp, maxBefore = p.maxHp; p.maxHp = hpMax; p.hp = keepCurrent ? Math.min(hpMax, hpBefore + Math.max(0, hpMax - maxBefore)) : hpMax; };
  BK.showStats = (charId, save, onClose) => {
    save.stats = Object.assign(BK.defaultStats(), save.stats || {}); save.points = save.points || 0;
    const lv = BK.levelFromXp(save.xp || 0);
    const html = () => '<p>Niveau <b>' + lv.level + '</b> · ' + lv.current + ' / ' + lv.needed + ' XP · <b class="pts">' + save.points + '</b> point' + (save.points > 1 ? 's' : '') + ' à placer</p>' +
      '<div class="stats">' + Object.entries(BK.STATS).map(([k, d]) => '<div class="stat"><span class="ic">' + d.icon + '</span><b>' + d.name + '</b><span class="val">' + save.stats[k] + d.unit + '</span><button data-stat="' + k + '" ' + (save.points ? '' : 'disabled') + '>+' + d.step + d.unit + '</button></div>').join('') + '</div>' +
      '<p class="hint">Courir (deux appuis rapides sur une direction) use la stamina ; elle se recharge de ' + save.stats.regen + ' % par seconde au repos. Près d’un feu de camp, la vie remonte de ' + save.stats.fireRegen + ' point' + (save.stats.fireRegen > 1 ? 's' : '') + ' par seconde.</p>';
    const render = () => { BK.overlay.show({ title: 'Fiche de ' + BK.charById(charId).name, html: html(), buttons: [{ label: 'Fermer', primary: true, onClick: () => { BK.overlay.hide(); BK.saveAdventure(charId, save); onClose && onClose(); } }] });
      document.querySelectorAll('#overlay button[data-stat]').forEach(b => b.addEventListener('click', () => { if (!save.points) return; const k = b.dataset.stat; save.points--; save.stats[k] += BK.STATS[k].step; BK.audio.item(); BK.saveAdventure(charId, save); render(); })); };
    render();
  };
  // L'or est partagé par toute la famille (une seule cagnotte, bk.gold) ; niveaux, stats, achats et tableaux restent à chaque personnage.
  // Première fois : on additionne l'or que chaque personnage avait déjà.
  const GOLD_KEY = 'bk.gold';
  BK.loadGold = () => { try { const v = localStorage.getItem(GOLD_KEY); if (v != null) return Math.max(0, Math.floor(+v) || 0); let sum = 0; for (const id of BK.ORDER) { try { const s = JSON.parse(localStorage.getItem(KEY(id)) || 'null'); if (s && s.gold) sum += Math.floor(s.gold); } catch (e) { } } localStorage.setItem(GOLD_KEY, String(sum)); return sum; } catch (e) { return 0; } };
  BK.saveGold = n => { try { localStorage.setItem(GOLD_KEY, String(Math.max(0, Math.floor(n) || 0))); } catch (e) { } };
  BK.addGold = n => { const g = BK.loadGold() + Math.max(0, Math.floor(n) || 0); BK.saveGold(g); return g; };
  BK.loadAdventure = id => { let s; try { s = JSON.parse(localStorage.getItem(KEY(id)) || 'null') || { unlocked: 1, best: {}, score: 0 }; } catch (e) { s = { unlocked: 1, best: {}, score: 0 }; } BK.migrateRemedyData(s);s.gold = BK.loadGold(); return s; };
  BK.saveAdventure = (id, s) => { try { if (s.gold != null) BK.saveGold(s.gold); localStorage.setItem(KEY(id), JSON.stringify(s)); } catch (e) { } };

  const BOSS_REWARDS=[{type:'coin',value:200,label:'Pièces d’or'},{type:'honey',value:3,label:'Pots de miel'},{type:'antidote',value:2,label:'Antidotes'},{type:'wood',value:5,label:'Bois'}];
  class Adventure {
    constructor(charId, stageIndex, o) {
      this.charId = charId; this.def = BK.charById(charId); this.stageIndex = stageIndex; this.save = BK.loadAdventure(charId);
      this.save0 = BK.loadAdventure(charId); this.lives = 3 + ((this.save0.upgrades || {}).life || 0); this.score = 0; this.cam = new BK.Camera(BK.W, BK.H); this.o = o || {}; this.msgT = 0; this.custom = this.o.custom || null;
      this.challenge = this.o.challenge || null; if (this.challenge) { this.lives = this.challenge.lives || 2; this.timeLeft = this.challenge.time || 0; }   // défi : deux vies, un chrono
      if (BK.setTestMode) BK.setTestMode(!!(this.custom && BK.editor));
      this.loadStage();
    }
    get stage() { return this.custom || BK.stageList()[this.stageIndex]; }
    loadStage(keepPowers) {
      this.medalFeedback=null;this.bossFormUntil=0;this.castleRevealUntil=0;this.celebKind=null;this.allyPanelPage=0;this.allyPanelPager=null;this.allyPortraitRects=[];
      const s = this.stage, prev = this.player; this.hired = new Set();
      const W = this.world = new BK.World({ map: s.roomExit ? BK.roomMap(s.map,true) : s.map, exitKind:s.roomExit?'door':'portal', theme: s.theme || s.world.theme, mode: 'adventure', hearts: true, dayCycle: s.dayCycle!==false, itemChance: s.items == null ? 0.4 : s.items, softChance: 0.75, explore: !!s.explore, coins: true, houses: s.houses, props: s.props });
      if(s.dayCycle===false)W.clouds=[];
      if(s.roomExit)W.ensureRoomExit();
      if(s.encounter==='firstBoss')W.setupFirstBoss();
      if(s.encounter==='castleBoss')W.setupCastleBoss();
      const st = W.starts[0] || { c: 1, r: 1 };
      const p = this.player = W.addPlayer(this.def, st.c, st.r, { hp: 3, lives: this.lives, bombs: (s.start && s.start.bombs) || 1, fire: (s.start && s.start.fire) || 2 });
      p.invuln = 1.5; BK.applyStats(p, this.save);
      const up = this.save.upgrades || {}; for (const key of BK.BOMB_POWERS) p[key] = !!up[key];   // achats au magasin de grand-maman
      p.bombsMax = Math.min(BK.MAX_BOMBS, p.bombsMax + (up.bomb || 0)); p.fire = Math.min(BK.MAX_FIRE, p.fire + (up.fire || 0)); p.speed += 0.45 * (up.speed || 0); p.speedUp = up.speed || 0; if (up.kick) p.kick = true; if (up.gloves) p.gloves = true; if (up.lantern) p.lantern = true; BK.applyStats(p, this.save);
      // les objets trouvés dans un tableau ne durent que ce tableau ; seuls les achats (save.upgrades, pots de miel save.inv) restent
      p.found = []; p.inv = (this.save.inv || []).filter(s => s.n > 0).map(s => ({ type: s.type, n: s.n, perm: s.n, ...(s.snails?{snails:s.snails.map(sn=>({...sn}))}:{}) })); p.bagSlots = (this.save.bagSlots || []).slice(); p.quickSlots = (this.save.quickSlots || []).slice(); void prev; void keepPowers;
      if(this.challenge?.kind==='timing'){p.kick=true;this.timingHits=0;this.timingNext=0;W.timingTarget={c:this.challenge.target,r:3};}
      this.deliverBossLoot();
      for (const en of s.enemies || []) W.addEnemy(en.type, en.c, en.r, {shellColor:en.shellColor, catColor:en.catColor});
      if (BK.music) BK.music.play(s.music && BK.hasInstrument(W) ? s.music : this.stageMusic());
      if (s.custom || (s.npcs && s.npcs.length) || (s.shop && s.shop.length)) this.setupShop(W, s, 'map:' + (s.mapId || s.name));
      for (const sp of W.spawns) { const type = ENEMY_CODES[sp.code]; if (!type) continue; const e = W.addEnemy(type, sp.c, sp.r); if (e.boss && s.bossHp) { e.hp = e.maxHp = s.bossHp; } if (e.boss && s.bossName) e.name = s.bossName; if (s.id === '2-3') e.fast = true; }
      this.restoreBossCompanions();
      this.fitCamera();
      this.state = 'intro'; this.stateT = 0; this.world.frozen = true; this.exitOpened = !!(W.exit && W.exit.open); p.cards = 0;
      this.toast(null);
    }
    fitCamera() {
      const W = this.world, cam = this.cam;
      const vc = W.explore ? 17 : 15, vr = W.explore ? 14 : 13;
      this.follow = W.cols > vc || W.rows > vr;
      cam.fit(Math.min(W.cols, vc), Math.min(W.rows, vr), { top: 86, bottom: 24, left: 24, right: 24 });
      if (this.follow) { this.viewCols = vc; this.viewRows = vr; this.updateCamera(0, true); }
    }
    updateCamera(dt, snap) {
      if (!this.follow) return;
      const W = this.world, p = this.player, cam = this.cam;
      const tx = Math.max(this.viewCols / 2, Math.min(W.cols - this.viewCols / 2, p.x)), ty = Math.max(this.viewRows / 2, Math.min(W.rows - this.viewRows / 2, p.y)) + 0.3;
      if (snap) { cam.target.x = tx; cam.target.y = ty; } else { const k = Math.min(1, dt * 4); cam.target.x += (tx - cam.target.x) * k; cam.target.y += (ty - cam.target.y) * k; }
    }
    toast(text, dur) { this.msg = text; this.msgT = dur || 3; }
    // Expérience : affichée au-dessus de la tête, sauvegardée ; un niveau de plus = soins complets, +1 cœur max tous les 5 niveaux.
    gainXp(n) {
      const before = BK.levelFromXp(this.save.xp || 0).level; this.save.xp = (this.save.xp || 0) + n; this.goldDirty = true;
      const p = this.player, W = this.world; W.addFloater(p.x, p.y, '+' + n + ' XP', { color: '#8fe3ff', follow: p });
      const after = BK.levelFromXp(this.save.xp).level;
      if (after > before) { this.save.points = (this.save.points || 0) + (after - before); p.hp = p.maxHp; setTimeout(() => W.addFloater(p.x, p.y, 'NIVEAU ' + after + ' !', { color: '#ffd54a', size: 0.5, life: 2.4, follow: p }), 450); BK.audio.win(); this.toast('Niveau ' + after + ' ! Vie complète et un point de stat (Tab).', 4); }
    }
    openExit() {
      const W = this.world; if (!W.exit || W.exit.open) return;
      W.exit.open = true; this.exitOpened = true; if (W.exit.hidden) { W.cells[W.idx(W.exit.c, W.exit.r)] = 0; W.exit.hidden = false; W.burst(W.exit.c + 0.5, W.exit.r + 0.5, 0.5, W.theme.soft, 12, 1); }
      BK.audio.door(); this.toast('La porte est ouverte ! Trouve-la.', 4);
    }
    objectiveDone() {
      const W = this.world, s = this.stage;
      if(s.objective==='timing')return this.timingHits>=this.challenge.count;
      if (s.objective === 'enemies') return W.livingEnemies().length === 0;
      if (s.objective === 'switches') return W.switches.every(sw => sw.on);
      if (s.objective === 'boss') return (!W.castleEncounter||W.castleEncounter.done) && !W.enemies.some(e => e.boss && !e.dead);
      if (s.objective === 'goal') return true;
      return false;
    }
    objectiveText() {
      const W = this.world, s = this.stage;
      if(s.objective==='timing')return '🥾 Cibles : '+this.timingHits+' / '+this.challenge.count+' · explosion au centre !';
      if (s.objective === 'enemies') return 'Monstres : ' + W.livingEnemies().length;
      if (s.objective === 'switches') return 'Interrupteurs : ' + W.switches.filter(sw => sw.on).length + ' / ' + W.switches.length;
      if (s.objective === 'boss') { const guards=W.enemies.filter(e=>e.arenaGuard&&!e.dead);if(guards.length)return 'Gardiens crapauds : '+guards.length+' / 2';const b = W.enemies.find(e => e.arenaBoss&&!e.dead)||W.enemies.find(e=>e.boss&&!e.dead)||W.enemies.find(e=>e.boss); return b ? (b.dead ? 'Boss vaincu !' : b.name + ' : ' + b.hp + ' ❤') : ''; }
      if (s.objective === 'goal') return '🃏 ' + (this.player.cards || 0) + ' / ' + W.cardsTotal + '   ·   Trouve le but';
      return '';
    }
    update(dt) {
      const W = this.world, p = this.player; this.stateT += dt; if (this.msgT > 0) this.msgT -= dt;
      const K = BK.input;
      if (this.state === 'intro') { W.update(dt); if (this.stateT > 0.4 && (K.hitAny() || K.touch.bomb || this.stateT > 6)) { K.touch.bomb = false; W.frozen = false; this.state = 'play'; this.stateT = 0; BK.audio.go(); } return; }
      if (this.state === 'play') {
        if (K.hit(['KeyI'])) { BK.openInventory(this); return; }
        if (K.hit(['Tab'])) { this.state = 'pause'; W.frozen = true; BK.showStats(this.charId, this.save, () => { this.state = 'play'; W.frozen = false; BK.applyStats(p, this.save, true); }); return; }
        if (this.outer && !p.swallowedBy && K.hit(['Escape'])) { this.leaveHouse(); return; }
        if (K.hit(['Escape', 'KeyP'])) { this.showPause(); return; }
        if (this.challenge && this.challenge.time) { this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; this.failChallenge('Le temps est écoulé !'); return; } }
        if(this.challenge)BK.updateChallengeFeedback(this.challenge,this,dt);
        if (K.hit(['Enter']) && this.pressEnter()) return;
        for (let i=0;i<BK.QUICK_SIZE;i++) if (K.hit(['Digit'+(i+1), ...(i===0?['KeyQ']:i===1?['KeyW']:[])])) BK.useQuickItem(W,p,i);
        K.read(p, 0);
        if(p.input.action&&W.nearbyPipe(p)){p.input.action=false;W.usePipe(p);}
        if(p.input.action && (p.seat||W.nearbySeat(p))){p.input.action=false;W.useSeat(p);}
        if(p.input.action && (p.boat || W.nearbyBoat(p))){p.input.action=false;W.useBoat(p);}
        if (p.input.action && (W.displays && W.displays.length || W.players.some(n => n.npc))) { const d = this.displayNear(p); if (d) { p.input.action = false; this.buy(d); } else if (W.talkTo(p)) p.input.action = false; }
        p.nearDisplay = null; if (W.displays && W.displays.length) { const near = this.displayNear(p); p.nearDisplay = near; for (const d of W.displays) { d.active = d === near; d.affordable = (this.save.gold || 0) >= d.price; } }
        W.update(dt); BK.audio.events(W.events);
        if(W.events.some(e=>e.type==='cured'&&e.player===p)){this.syncInv();BK.saveAdventure(this.charId,this.save);this.toast('Remède utilisé : effet supprimé !',2);}
        if (this.outer) {   // dans une maison : la porte du bas ramène dehors
          for (const e of W.events) { if (e.type === 'exit') { this.leaveHouse(); return; } if (e.type === 'playerDied' && e.player === p) { this.state = 'dying'; this.stateT = 0; } }
          this.score = p.score; return;
        }
        for (const e of W.events) {
          if (e.type === 'exit') { this.startCelebration(e.kind || 'portal'); return; }
          if (e.type === 'switch') this.toast(W.switches.filter(sw => sw.on).length < W.switches.length ? 'Interrupteur activé ! Encore ' + (W.switches.length - W.switches.filter(sw => sw.on).length) + '.' : 'Tous les interrupteurs sont activés !', 3);
          if (e.type === 'playerDied' && e.player === p) { this.state = 'dying'; this.stateT = 0; }
          if(e.type==='secretFound')this.toast('✨ Une pièce secrète !',3);
          if(e.type==='pipeMessage')this.toast(e.text,3);
          if(e.type==='pipeTravel')this.updateCamera(0,true);
          if(e.type==='towerHint')this.toast('Vise une fenêtre et lance une bombe ! Tu peux aussi ramasser celles du bombardier et les renvoyer.',6);
          if(e.type==='towerLoaded')this.toast('Dans la fenêtre ! Éloigne-toi de la tour !',2);
          if(e.type==='castleFalseVictory')this.toast('Le régent est vaincu… Mais pourquoi le portail tremble-t-il ?',4);
          if(e.type==='castleReveal'){this.castleRevealUntil=W.time+4;this.toast('SURPRISE ! Matthieu, le roi tricheur, sort de la faille !',5);BK.audio.hurt();}
          if(e.type==='arenaAwake')this.toast('Les gardiens sont vaincus ! Le Roi Golem se réveille !',4);
          if(e.type==='arenaTransform'){this.bossFormUntil=W.time+4;this.toast('Attention aux ondes de choc et aux bombes rouges !',4);}
          if(e.type==='explosion'&&this.challenge?.kind==='timing'&&e.bomb?.timingBall&&!e.bomb.timingCounted){e.bomb.timingCounted=true;if(e.bomb.kicker===p&&e.c===W.timingTarget.c&&e.r===W.timingTarget.r){this.timingHits++;this.toast('🎯 Bien visé ! '+this.timingHits+' / '+this.challenge.count,2);}else this.toast('Réessaie : attends un peu avant de botter !',2);}
          if (e.type === 'bossDead') {if(!this.custom&&this.stage.objective==='boss'&&!W.enemies.some(q=>q.boss&&!q.dead))this.revealBossCrystal(e.enemy);if(e.enemy.arenaBoss||e.enemy.castleFinal)this.spawnBossChest(e.enemy);else this.toast(e.enemy.name + ' est vaincu !', 4);}
          if (e.type === 'targetHit') { BK.audio.switch(); this.toast('Cible ' + BK.targetName(e.target.letter) + ' atteinte !', 2); }
          if (e.type === 'gateOpened') { BK.audio.door(); this.toast(e.bridge ? 'Le pont-levis ' + BK.targetName(e.letter) + ' s’abaisse !' : 'La grille ' + BK.targetName(e.letter) + ' s’ouvre !', 3.5); }
          if (e.type === 'frozen' && e.player === p) this.toast('Gelé ! Attends que ça fonde…', 1.8);
          if (e.type === 'elevatorUp') { BK.audio.lift(); this.toast('L’ascenseur monte !', 2.5); }
          if (e.type === 'burn') this.toast('Aïe, ça brûle ! Sors de la lave !', 1.5);
          if (e.type === 'liftUp') { BK.audio.lift(); this.toast('Boum ! La plateforme monte d’un étage.', 2.5); }
          if (e.type === 'liftMax') this.toast('La plateforme est déjà tout en haut.', 2);
          if (e.type === 'bounce' && e.player === p) this.toast('Boing ! Le champignon te propulse !', 1.5);
          if (e.type === 'beeOut') this.toast('Bzzz… une abeille sort de la ruche !', 2);
          if (e.type === 'drank' && e.player === p) this.toast('Glou glou glou… Stamina pleine !', 2);
          if (e.type === 'honeyUsed' && e.player === p) this.toast('Flaque de miel ! Les monstres qui y marchent sont englués.', 2.5);
          if (e.type === 'honeyEmpty' && e.player === p) this.toast('Tu as utilisé tout le pot de miel.', 2.5);
          if (e.type === 'invFull' && e.player === p) this.toast('Sac plein : 24 objets différents au maximum.', 2);
          if (e.type === 'dusk') this.toast(BK.wearsLantern(p) ? 'Le soir tombe… la fée de ta lanterne se réveille et s’allume.' : 'Le soir tombe. Une lanterne à fée (magasin) éclairerait la nuit.', 3.5);
          if (e.type === 'dawn') this.toast(BK.wearsLantern(p) ? 'Le jour se lève. La fée s’endort… zzz' : 'Le jour se lève.', 3);
          if (e.type === 'needKick' && e.player === p) this.toast('Il faut d’abord trouver le coup de pied.', 2);
          if(e.type==='campfireFueled'&&e.player===p)this.toast('Bois ajouté : +15 secondes !',2);
          if (e.type === 'campfireBuilt' && e.player === p) this.toast('Feu de camp allumé ! Approche-toi pour te soigner ou cuisiner.', 3);
          if (e.type === 'campfireBlocked' && e.player === p) this.toast('Choisis une case dégagée devant toi pour le feu.', 2);
          if (e.type === 'bombFusion') this.toast('Giga-fusion ! Éloigne-toi vite !', 2);
          if (e.type === 'shieldBroken' && e.player === p) this.toast('Le bouclier a absorbé l’explosion et s’est brisé !', 2);
          if (e.type === 'sporeBlocked' && e.player === p) this.toast('Il faut une case libre devant toi, au même étage.', 2);
          if (e.type === 'mushroomGrown') this.toast('Un champignon géant ! Saute dessus depuis une bombe : il te renvoie 3 cases plus loin.', 3.5);
          if (e.type === 'noWater' && e.player === p) this.toast('Il faut être au bord de l’eau pour pêcher.', 2);
          if (e.type === 'fished' && e.player === p) this.toast('Un poisson ! Q ou W pour le lancer, ou Entrée près d’un feu de camp pour le cuire.', 3.5);
          if (e.type === 'fishHit') this.toast('En pleine face ! ' + e.enemy.name + ' a reçu un poisson.', 2);
          if (e.type === 'fishLost' && e.player === p) this.toast('Le poisson est retourné à l’eau…', 2);
          if (e.type === 'cookStart' && e.player === p) this.toast('Ça grille… attends un peu.', 2.5);
          if (e.type === 'cookDone') this.toast('C’est prêt ! Ramasse le repas, puis utilise-le depuis le sac ou un raccourci.', 3.5);
          if (e.type === 'feast' && e.player === p) this.toast('Miam ! Ta vie est doublée pendant 3 minutes.', 3);
          if (e.type === 'feastEnd' && e.player === p) this.toast('Le poisson grillé ne fait plus effet.', 2.5);
          if (e.type === 'hiveBroken') this.toast('La ruche éclate… un pot de miel ! (Q ou W pour l’utiliser)', 3);
          if (e.type === 'chestOpened') { BK.audio.coin(); this.toast('Un coffre ! ' + e.coins + ' pièces d’or s’éparpillent.', 2.5); }
          if (e.type === 'mailboxBroken') this.toast('La boîte aux lettres tombe : une pièce d’or !', 2);
          if (e.type === 'statueBroken') this.toast('La statue vole en éclats… et cachait quelque chose !', 2.5);
          if (e.type === 'splash' && e.bomb) this.toast('Plouf ! La bombe est tombée à l’eau.', 2.5);
          if (e.type === 'playerFell') this.toast(e.kind === 'water' ? 'Plouf ! Un cœur de moins.' : 'Tombé dans le vide ! Un cœur de moins.', 2.5);
          if (e.type === 'barrelLit') { BK.audio.switch(); this.toast('Le baril s’allume… l’étincelle suit la poudre !', 3); }
          if (e.type === 'blast') BK.audio.boss();
          if (e.type === 'sealedOpened') { BK.audio.door(); this.toast('La porte scellée vole en éclats !', 3); }
          if (e.type === 'metalBroken') { BK.audio.block(); this.toast('Le bloc de métal cède par sa face en bois !', 2.5); }
          if (e.type === 'itemTaken' && [...BK.BOMB_POWERS,'bombdiarrhea','shortfuse'].includes(e.item) && e.player === p) this.toast(BK.ITEMS[e.item].icon+' '+BK.ITEMS[e.item].name+' : '+BK.ITEMS[e.item].desc,5);
          if (e.type === 'itemTaken' && e.item === 'card') { this.toast('Carte d’or ' + p.cards + ' / ' + W.cardsTotal, 2.5); }
          if (e.type === 'itemTaken' && e.item === 'coin') { this.save.gold = (this.save.gold || 0) + 1; this.goldDirty = true; }
          if (e.type === 'honeyUsed') this.syncInv();
          if (e.type === 'enemyKilled' && e.player === p && e.enemy.def.xp) this.gainXp(e.enemy.def.xp);
          if (e.type === 'poisoned' && e.player === p) this.toast('Mordu ! Empoisonné : 2 points de vie par seconde pendant 6 secondes.', 3);
          if (e.type === 'poisonEnd' && e.player === p) this.toast('Le poison ne fait plus effet.', 2);
          if (e.type === 'rabbitCharge') this.toast('Le lapin t’a vu : il fonce ! Écarte-toi !', 1.8);
          if (e.type === 'rabbitTired') this.toast('Le lapin est essoufflé… c’est le moment de le bombarder.', 2.5);
          if (e.type === 'rabbitSawCarrot') this.toast('Le lapin a vu la carotte !', 1.5);
          if (e.type === 'rabbitTamed') this.toast('Miam… le lapin est apprivoisé : il ne te fera plus de mal.', 3);
          if (e.type === 'growl') this.toast(e.back ? 'GRR… l’orque retourne auprès de son shaman.' : 'GRRR ! L’orque fonce sur toi, l’épée en avant !', 2.2);
          if (e.type === 'shamanHeal') this.toast('Le shaman soigne son orque. Occupe-toi du shaman !', 2.5);
          if(e.type==='snailGrown')this.toast('🐌 Ton escargot est devenu adulte !',4);
          if(e.type==='snailBorn')this.toast('🐌 Un tout petit bébé escargot est né dans le terrarium !',4);
          if (e.type === 'carrotPicked' && e.player === p) this.toast('Une carotte ! Q ou W pour la lancer devant un lapin.', 3);
        }
        BK.playTime = (BK.playTime || 0) + dt; this.saveT = (this.saveT || 0) + dt; if (this.saveT > 5) { this.saveT = 0; try { localStorage.setItem('bk.playtime', String(Math.round(BK.playTime))); } catch (err) { } if (this.goldDirty) { this.goldDirty = false; BK.saveAdventure(this.charId, this.save); } }
        {
        }
        // boss rapide (crapaud royal)
        for (const e of W.enemies) if (e.fast && e.state === 'sit' && e.stateT > 0.9) e.stateT = Math.max(e.stateT, 1.4);
        this.deliverBossLoot();
        if(this.challenge?.kind==='timing'&&!W.bombs.some(b=>b.timingBall)&&W.time>this.timingNext&&!W.flameAt.has(W.idx(3,3))){const dispenser={x:3.5,y:3.5,bombsOut:0,bombsMax:1,fire:1,dir:3};if(W.placeBomb(dispenser)){W.bombs[W.bombs.length-1].timingBall=true;this.timingNext=W.time+5;}}
        const chest=W.bossChest;if(chest&&!chest.open&&W.time-chest.born>.8&&p.alive&&Math.hypot(p.x-chest.x,p.y-chest.y)<1.6){this.openBossChest();return;}
        if (!W.bossChest && !this.outer && !this.exitOpened && this.objectiveDone()) { if (W.exit) this.openExit(); else if (this.custom) { this.clearStage(); return; } }
        this.score = p.score;
        this.updateCamera(dt);
        return;
      }
      if (this.state === 'dying') {
        W.update(dt); this.updateCamera(dt);
        if (this.stateT > 1.6) {
          this.lives--; BK.saveAdventure(this.charId, this.save);
          if (this.lives <= 0 && this.challenge) { this.failChallenge('Plus de vies…'); return; }
          if (this.lives <= 0) { this.state = 'over'; BK.audio.lose(); BK.overlay.show({ title: 'Partie terminée', text: 'Score : ' + this.score + '. On réessaie ?', buttons: [{ label: 'Recommencer le tableau', primary: true, onClick: () => { BK.overlay.hide(); this.lives = 3; this.loadStage(); } }, { label: this.custom && BK.editor ? 'Retour à l’éditeur' : 'Menu', onClick: () => { BK.overlay.hide(); if (this.custom && BK.editor) { BK.show('editor'); BK.current = BK.editor; } else BK.toMenu(); } }] }); }
          else { const st = W.starts[0]; W.revive(p, st.c, st.r); p.lives = this.lives; this.state = 'play'; this.stateT = 0; this.toast('Il te reste ' + this.lives + ' vie' + (this.lives > 1 ? 's' : '') + '.', 3); }
        }
        return;
      }
      if (this.state === 'clear') { W.update(dt); return; }
      if (this.state === 'celebrate') {
        W.update(dt); const ex = W.exit, u = this.stateT;
        if (this.celebKind === 'portal' && p.vanish) { p.vanish.t += dt; const k = Math.min(1, 6 * dt); p.x += (ex.x - p.x) * k; p.y += (ex.y - p.y) * k; p.zOff = Math.min(1, p.vanish.t / p.vanish.dur) * 0.5; if (!p.vanish.flashed && p.vanish.t >= p.vanish.dur) { p.vanish.flashed = true; W.burst(ex.x, ex.y, 0.8, '#bfe3ff', 24); } }
        if(this.celebKind==='boss'&&Math.random()<50*dt){const colors=['#ffd54a','#ff7bbd','#66e9cf','#8ab5ff'];W.particles.push({x:p.x+(Math.random()-.5)*8,y:p.y+(Math.random()-.5)*5,z:4+Math.random()*2,gz:W.groundZ(p.x,p.y),vx:Math.random()-.5,vy:Math.random()-.5,vz:0,life:3,t:0,color:colors[Math.floor(Math.random()*colors.length)],size:.12,heavy:true});}
        if (this.celebKind === 'diamond') {
          ex.taken = Math.min(1.2, (ex.taken || 0) + dt);
          if (u > 0.9 && u < 3.2 && Math.random() < 40 * dt) { const cols = ['#ff5c8a', '#ffd54a', '#49e26a', '#3f9cff', '#b48cf0', '#fff']; W.particles.push({ x: p.x + (Math.random() - 0.5) * 7, y: p.y + (Math.random() - 0.5) * 5, z: 3.2 + Math.random() * 1.5, gz: W.explore ? W.groundZ(p.x, p.y) : 0, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), vz: 0, life: 3.5, t: 0, color: cols[Math.floor(Math.random() * cols.length)], size: 0.1 + Math.random() * 0.08, heavy: true }); }
          if (!ex.burstDone && ex.taken >= 0.95) { ex.burstDone = true; W.burst(ex.x, ex.y, 1.4, '#ffffff', 36); W.burst(ex.x, ex.y, 1.1, '#7fe9ff', 36); W.shake = 0.35; BK.audio.diamond(); }
        }
        if (this.stateT > this.celebDur) this.clearStage();
        return;
      }
    }
    // Fin de tableau : on se fait aspirer dans le portail, ou le diamant s'envole dans une pluie de confettis
    // avec un gros titre qui claque à l'écran (façon N64) ; ensuite le bilan habituel.
    startCelebration(kind) {
      if(kind==='diamond')this.captureBossCrystal();
      const W = this.world, p = this.player; if (this.state === 'celebrate' || this.state === 'clear') return;
      this.state = 'celebrate'; this.stateT = 0; this.celebKind = kind; W.frozen = true; p.input.dx = p.input.dy = 0; p.onBomb = null; p.air = null; p.zOff = 0; p.running = false; this.toast(null);
      if(kind==='boss'){for(const ally of W.bossSurvivors||[]){ally.input.dx=ally.input.dy=0;ally.vx=ally.vy=0;ally.running=false;ally.moving=false;ally.path=[];ally.air=ally.falling=ally.onBomb=null;ally.zOff=0;W.setPose(ally,'win',99);}p.pose='win';p.poseT=0;p.poseDur=99;BK.audio.fanfare();this.celebDur=6;W.burst(p.x,p.y,1.5,'#ffd54a',60);}
      else if (kind === 'portal') { p.vanish = { t: 0, dur: 1.0 }; W.exit.boost = 1; p.pose = 'win'; p.poseT = 0; p.poseDur = 99; BK.audio.portal(); this.celebDur = 3.2; }
      else { p.pose = 'win'; p.poseT = 0; p.poseDur = 99; W.exit.taken = 0; this.diamondBonus = 1000; BK.audio.fanfare(); this.celebDur = 4.6; W.burst(W.exit.x, W.exit.y, 0.6, '#bfe3ff', 16); }
    }
    // Titre géant qui arrive lettre par lettre (zoom + rebond), dégradé doré et contour sombre.
    drawBigTitle(ctx, u) {
      const diamond = this.celebKind === 'diamond', title = this.celebKind==='boss'?'VICTOIRE !':diamond ? 'BRAVO !' : 'TABLEAU RÉUSSI !', sub = this.celebKind==='boss'?(this.stage.id==='1-5'?'🔓 MONDE 2 DÉBLOQUÉ !':'💎 CRISTAL DU CHÂTEAU LIBÉRÉ !'):diamond ? 'Diamant trouvé · Tableau réussi !' : 'En route vers la suite…';
      const start = diamond ? 1.15 : 1.0, size = diamond ? 128 : 92; if (u < start - 0.15) return;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const flash = 1 - Math.abs(u - start) / 0.25; if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (flash * 0.8) + ')'; ctx.fillRect(0, 0, BK.W, BK.H); }
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.3, Math.max(0, u - start) * 0.6) + ')'; ctx.fillRect(0, 0, BK.W, BK.H);
      ctx.font = '900 ' + size + 'px Nunito, sans-serif'; const letters = title.split(''), widths = letters.map(l => ctx.measureText(l).width), total = widths.reduce((a, b) => a + b, 0); let x = BK.W / 2 - total / 2; const yBase = BK.H * 0.42;
      const back = a => 1 + 2.7 * Math.pow(a - 1, 3) + 1.7 * Math.pow(a - 1, 2);
      letters.forEach((l, i) => { const a = (u - start - i * 0.045) / 0.4; if (a > 0 && l !== ' ') { const e = a < 1 ? back(a) : 1, sc = 2.4 - 1.4 * e, bounce = Math.sin(u * 5 + i * 0.6) * 5; ctx.save(); ctx.translate(x + widths[i] / 2, yBase + bounce); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, a * 2.5); ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.14; ctx.strokeStyle = '#1b2a4a'; ctx.strokeText(l, 0, 0); const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#fff6c2'); g.addColorStop(0.5, '#ffd54a'); g.addColorStop(1, '#e08a00'); ctx.fillStyle = g; ctx.fillText(l, 0, 0); ctx.restore(); } x += widths[i]; });
      const subA = (u - start - letters.length * 0.045 - 0.35) / 0.4; if (subA > 0) { ctx.globalAlpha = Math.min(1, subA); ctx.font = '900 38px Nunito, sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#1b2a4a'; ctx.strokeText(sub, BK.W / 2, yBase + size * 0.8); ctx.fillStyle = '#fff'; ctx.fillText(sub, BK.W / 2, yBase + size * 0.8); }
      if(this.celebKind==='boss'&&u>2){
        BOSS_REWARDS.forEach((reward,i)=>{const a=Math.min(1,Math.max(0,(u-2-i*.18)/.35));if(!a)return;const x=BK.W/2-310+i*160,y=yBase+size*1.12+(1-a)*25;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#fff6d9';BK.sprites.rr(ctx,x,y,140,140,22);ctx.fill();ctx.strokeStyle='#ffd45a';ctx.lineWidth=4;ctx.stroke();ctx.save();ctx.translate(x+70,y+73);BK.sprites.drawItem(ctx,reward.type,66,u);ctx.restore();ctx.fillStyle='#6541a0';ctx.font='900 26px Nunito, sans-serif';ctx.fillText('+'+reward.value,x+70,y+100);ctx.font='bold 16px Nunito, sans-serif';ctx.fillText(reward.label,x+70,y+124);ctx.restore();});
        const party=[this.player,...(this.world.bossSurvivors||[]).filter(p=>p.alive)],gap=Math.min(86,800/party.length);
        party.forEach((p,i)=>{ctx.save();ctx.translate(BK.W/2+(i-(party.length-1)/2)*gap,BK.H-90-Math.abs(Math.sin(u*5+i*.7))*8);BK.sprites.drawCharacter(ctx,p.def,{s:44,pose:'win',poseT:u,t:u,view:'front'});ctx.restore();});

      }
      ctx.restore();
    }
    // Intérieur d'une maison (créé dans l'éditeur) : on garde le monde extérieur de côté et on y revient par la porte.
    // Commerçants (PNJ) et articles posés dans l'éditeur. Un article « une seule fois » déjà acheté reste épuisé (save.bought).
    setupShop(W, src, prefix) {
      BK.migrateRemedyData(src.shop);
      W.shopPrefix=prefix;const waiting=Object.values(this.save.waitingAllies||{});
      const recruits=[];
      for (const n of src.npcs || []) { const recruitKey=prefix+':ally:'+n.c+','+n.r;if(n.ally && (this.hired.has(recruitKey)||waiting.some(q=>q.member.recruitKey===recruitKey||q.prefix===prefix&&q.c===n.c&&q.r===n.r)))continue; const npc = W.addNpc(BK.charById(n.id) || BK.charById('richard'), n.c, n.r, n.lines && n.lines.length ? n.lines : ['Bienvenue !']); if(n.ally){npc.recruit=true;npc.say='🤝 '+(n.price||0)+' pièces · '+(n.lives||3)+' vies';npc.sayT=999;recruits.push({c:n.c,r:n.r,ally:true,npc,id:n.id,price:Math.max(0,n.price||0),lives:Math.max(1,Math.min(9,n.lives||3)),key:recruitKey,affordable:true});} }
      const bought = this.save.bought || {};
      W.displays = (src.shop || []).map(s => { const key = prefix + ':' + s.c + ',' + s.r; return { c: s.c, r: s.r, id: s.item, icon: (BK.ITEMS[s.item] || BK.ITEMS.bomb).icon, price: s.price || 0, once: s.once !== false, key, soldOut: s.once !== false && !!bought[key], affordable: (this.save.gold || 0) >= (s.price || 0) }; }); W.displays.push(...recruits);
      for(const record of waiting)if(record.prefix===prefix)this.placeWaitingAlly(W,record);
    }
    activeAllies() {
      // Un compagnon en attente de réapparition garde sa place dans l’équipe.
      return this.world.players.filter(p=>p.ally&&p.leader===this.player&&(p.alive||p.lives>0));
    }
    showAllySwap(d) {
      if(this.allySwap)return;
      const W=this.world,token={},state=this.state,frozen=W.frozen;
      this.allySwap=token;this.state='pause';W.frozen=true;
      const reset=()=>{BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});for(const p of W.players){Object.assign(p.input,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});p.vx=p.vy=0;}};
      reset();
      const close=()=>{if(this.allySwap!==token)return false;this.allySwap=null;reset();BK.overlay.hide();if(this.world===W){this.state=state;W.frozen=frozen;}return true;};
      BK.overlay.show({playful:'ally-food',title:'🤝 Ton équipe est complète !',text:'Tu peux avoir '+BK.MAX_ALLIES+' alliés. Pour recruter '+d.npc.name+(d.waiting?' gratuitement':' pour '+d.price+' pièces')+', choisis le compagnon qui attendra ici. Il gardera sa santé et ses vies. Rien ne sera payé si tu annules.',buttons:[
        ...this.activeAllies().map(p=>({label:'Remplacer '+p.name+' · ♥ '+Math.max(0,Math.ceil(p.hp))+'/'+p.maxHp+' · '+p.lives+' vies',onClick:()=>{if(this.allySwap!==token||this.world!==W)return;if(this.recruit(d,p))close();}})),
        {label:'↩ Garder mon équipe',onClick:close}
      ]});
    }
    dismissAlly(p) {
      const W=this.world;
      if(p.swallowedBy)W.releaseSwallowed(p);
      W.dropCarried(p);
      for(const boat of W.boats)boat.passengers=(boat.passengers||[]).filter(q=>q!==p);
      p.boat=null;p.path=[];p.input={dx:0,dy:0,bomb:false,action:false};
      W.players=W.players.filter(q=>q!==p);
      if(W.bossSurvivors)W.bossSurvivors=W.bossSurvivors.filter(q=>q!==p);
    }
    placeWaitingAlly(W,record) {
      const def=BK.charById(record.member.id);if(!def)return null;
      const p=W.addNpc(def,record.c,record.r,['Je t’attends ici !']);
      Object.assign(p,record.member,{npc:true,ally:false,human:false,leader:null,alive:true,recruit:true,waitingMember:record.member,waitingOwner:this.charId,sayT:999,say:'🤝 Reprendre gratuitement · ♥ '+Math.max(0,Math.ceil(record.member.hp))+'/'+record.member.maxHp+' · '+record.member.lives+' vies'});
      W.displays.push({c:record.c,r:record.r,ally:true,waiting:true,npc:p,id:p.id,price:0,lives:p.lives,key:record.key,affordable:true});return p;
    }
    parkAlly(p,d) {
      const fields=['id','name','hp','maxHp','lives','alive','deadT','speed','speedUp','bombsMax','fire','kick','shield','gloves','lantern','stamina','staminaMax','staminaRegen','poison','poisonTick','diarrheaT','shortfuseT','recruitKey',...BK.BOMB_POWERS];
      const member=Object.fromEntries(fields.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
      const key=p.reserveKey||'waiting:'+(this.save.allyReserveSerial=(this.save.allyReserveSerial||0)+1);
      member.reserveKey=key;
      const record={key,prefix:this.world.shopPrefix,c:d.c,r:d.r,member};
      this.dismissAlly(p);this.save.waitingAllies=this.save.waitingAllies||{};this.save.waitingAllies[key]=record;
      this.placeWaitingAlly(this.world,record);
    }
    recruit(d,replace) {
      if(!d||!this.world.displays.includes(d)||!this.world.players.includes(d.npc)||!d.waiting&&this.hired.has(d.key))return false;
      if((this.save.gold||0)<d.price){this.toast('Pas assez d’or pour recruter cet allié.',2);return false;}
      const team=this.activeAllies();
      if(replace&&!team.includes(replace))return false;
      if(team.length>=BK.MAX_ALLIES&&!replace){this.showAllySwap(d);return false;}
      if(team.length-(replace?1:0)>=BK.MAX_ALLIES)return false;
      const p=d.npc;if(p.seat&&!this.world.useSeat(p)){this.toast('Libère une case près du siège pour que cet allié puisse se lever.',3);return false;}const stored=d.waiting?this.save.waitingAllies?.[d.key]:null;
      if(d.waiting&&!stored)return false;
      // Retirer la réservation entrante avant d’installer le compagnon sortant sur sa place.
      if(stored){Object.assign(p,stored.member);delete this.save.waitingAllies[d.key];}
      else {p.lives=d.lives;p.hp=p.maxHp=30;p.speed=this.player.speed*1.05;p.recruitKey=d.key;}
      if(replace)this.parkAlly(replace,d);
      p.waitingMember=null;p.waitingOwner=null;p.npc=false;p.recruit=false;p.ally=true;p.human=false;p.leader=this.player;p.invuln=1;p.sayT=0;p.path=[];p.planT=0;p.bombCool=1;
      for(const q of [...this.world.players])if(q.ally&&q.leader===this.player&&!q.alive&&q.lives<=0)this.dismissAlly(q);
      if(p.recruitKey)this.hired.add(p.recruitKey);this.world.displays=this.world.displays.filter(x=>x!==d);this.player.nearDisplay=null;this.save.gold-=d.price;this.syncInv();BK.saveAdventure(this.charId,this.save);this.toast(p.name+(replace?' remplace '+replace.name+' dans ton équipe !':' rejoint ton équipe !'),3);return true;
    }
    transferAllies(from,to,leader) {
      const team=from.players.filter(p=>p.ally && (p.alive || p.lives>0));from.players=from.players.filter(p=>!team.includes(p));
      const places=Math.max(0,BK.MAX_ALLIES-to.players.filter(p=>p.ally&&(p.alive||p.lives>0)).length);
      for(const p of team.slice(0,places)){p.leader=leader;p.path=[];p.planT=0;p.input={dx:0,dy:0,bomb:false,action:false};p.carrying=p.air=p.falling=p.onBomb=null;p.zOff=0;const spot=to.freeCellNear(Math.floor(leader.x),Math.floor(leader.y))||{c:Math.floor(leader.x),r:Math.floor(leader.y)};p.x=spot.c+.5;p.y=spot.r+.5;p.safe={x:p.x,y:p.y,dir:0};p.invuln=1;to.players.push(p);}
    }
    displayNear(p) {
      const W = this.world; if (!W.displays || !W.displays.length) return null; const c = Math.floor(p.x), r = Math.floor(p.y), D = BK.DIRS[p.dir] || BK.DIRS[0];
      const at = (cc, rr) => W.displays.find(d => d.c === cc && d.r === rr) || null;
      return at(c, r) || at(c + D.dx, r + D.dy) || at(c + 1, r) || at(c - 1, r) || at(c, r + 1) || at(c, r - 1);
    }
    buy(d) {
      if(d.ally)return this.recruit(d);
      const W = this.world, p = this.player, it = BK.ITEMS[d.id], npc = W.players.find(n => n.npc) || null, say = (t) => BK.say(npc, t);
      if (d.soldOut) { this.toast('Épuisé : cet article a déjà été acheté.', 2); say('Désolé, c’est vendu !'); BK.audio.hurt(); return false; }
      const gold = this.save.gold || 0; if (gold < d.price) { const m = d.price - gold; this.toast('Il te manque ' + m + ' pièce' + (m > 1 ? 's' : '') + ' d’or.', 2.5); say('Reviens avec plus de pièces !'); BK.audio.hurt(); return false; }
      // un achat est pour toujours : bombe, flamme, patins et coup de pied s'ajoutent aux améliorations (comme chez grand-maman), les pots de miel restent dans l'inventaire
      const PERM = { bomb: ['bombsMax', BK.MAX_BOMBS], fire: ['fire', BK.MAX_FIRE], speed: ['speedUp', BK.MAX_SPEED_UP], kick: ['kick', 1], gloves: ['gloves', 1] };   // la lanterne, elle, va dans le sac puis la ceinture
      for (const key of BK.BOMB_POWERS) PERM[key] = [key,1];
      if (d.id === 'fusion' && !p.kick) { this.toast('Il faut d’abord trouver le coup de pied.', 2); return false; }
      if (PERM[d.id] && (p[PERM[d.id][0]] || 0) >= PERM[d.id][1]) { this.toast('Déjà au maximum !', 2); say('Tu en as déjà le maximum !'); BK.audio.hurt(); return false; }
      if (d.id === 'lantern' && (p.inv || []).some(s => s.type === 'lantern' && s.n > 0)) { this.toast('Tu as déjà une lanterne dans ton sac : mets-la dans ta ceinture pour la porter.', 3); say('Tu en as déjà une ! Range-la dans ta ceinture.'); BK.audio.hurt(); return false; }
      if (!W.giveItem(p, d.id, d.id === 'heart' ? 20 : d.id === 'lantern' ? 1 : 3, true)) { this.toast('Sac plein : 24 objets différents au maximum.', 2); return false; }
      if (PERM[d.id]) { this.save.upgrades = this.save.upgrades || {}; this.save.upgrades[d.id] = d.id === 'kick' || d.id === 'gloves' || BK.BOMB_POWERS.includes(d.id) ? 1 : (this.save.upgrades[d.id] || 0) + 1; }
      this.save.gold = gold - d.price; this.goldDirty = true; if (d.once) { d.soldOut = true; this.save.bought = this.save.bought || {}; this.save.bought[d.key] = true; }
      this.syncInv(); BK.saveAdventure(this.charId, this.save); say('Merci ! ' + it.name + ' : ' + it.desc); this.toast(it.icon + ' ' + it.name + ' acheté pour 🪙 ' + d.price + '.', 2.5); W.burst(d.c + 0.5, d.r + 0.5, 0.4, '#ffd54a', 12);
      return true;
    }
    showPause() { const W=this.world; BK.input.keys.clear(); BK.input.flush(); Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false}); for(const p of W.players) Object.assign(p.input,{dx:0,dy:0,bomb:false,bombHeld:false,action:false}); this.state = 'pause'; W.frozen = true; BK.overlay.show({ playful:'pause',title: '⏸ Petite pause !', text: 'Ton aventure t’attend. Prêt à repartir ?', buttons: [{label:'💎 Mes cristaux',onClick:()=>this.showCrystals()},{label:'🎮 Contrôles',onClick:()=>this.showControls()}, {label:'🪙 Triche : ajouter de l’or',onClick:()=>this.showGoldCheat()}, {label:'🔓 Triche : tout débloquer',onClick:()=>{this.unlockAllStages();BK.overlay.show({playful:'pause',title:'🔓 À toi l’aventure !',text:'Tous les mondes et tableaux disponibles sont débloqués pour ce personnage.',buttons:[{label:'↩ Retour à la pause',primary:true,onClick:()=>this.showPause()}]});}}, {label:'⚙️ Options',onClick:()=>BK.showOptions(()=>{BK.overlay.hide();this.state='play';W.frozen=false;})}, { label: '▶ C’est parti !', primary: true, onClick: () => { BK.overlay.hide(); this.state = 'play'; W.frozen = false; } }, { label: '🏠 Quitter le tableau', onClick: () => { BK.overlay.hide(); if (this.challenge) BK.showChallenges(this.charId); else if (this.custom && BK.editor) { BK.show('editor'); BK.current = BK.editor; } else BK.toMenu(); } }] }); }
    showControls() {
      this.state='pause';this.world.frozen=true;
      BK.overlay.show({playful:'controls',title:'🎮 Comment jouer ?',html:`<div class="control-cards"><section>
        <h3>⌨️ Avec le clavier</h3>
        <p><b>Flèches</b> : se déplacer ou ramer.<br><b>Courir</b> : deux appuis rapides dans la même direction, puis maintenir.</p>
        <p><b>Espace / X</b> : poser une bombe, la ramasser ou la lancer.<br><b>Shift / C</b> : ramasser, lancer ou interagir à proximité.<br><b>Entrée</b> ou <b>clic sur la pancarte au-dessus du héros</b> : acheter, recruter, s’asseoir, se lever, caresser, embarquer ou débarquer, selon ce qui est proposé.</p>
        <p><b>1 à 8</b> : utiliser les objets de la ceinture.<br><b>Q / W</b> : utiliser le premier / deuxième raccourci.<br><b>I</b> ou <b>icône du sac</b> : inventaire (glisser-déposer pour ranger).<br><b>Tab</b> : fiche du personnage et statistiques.<br><b>P</b> : pause. <b>Échap</b> : pause dehors, sortir de la maison à l’intérieur.</p>
        </section><section><h3>💣 Les bonds et les bombes</h3>
        <p>Pose une bombe, éloigne-toi, puis avance vers elle. Avec le pouvoir de botter, <b>cours</b> vers elle pour monter dessus : marcher la pousse. Une fois dessus, <b>relâche la direction puis réappuie</b> pour faire un grand bond.</p>
        <p><b>Gonfler une bombe</b> : avec le pouvoir correspondant, maintiens Espace en la ramassant, puis relâche pour la lancer.</p>
        </section><section><h3>👆 Avec les doigts</h3>
        <p><b>⏸ Pause à l’écran</b> : contrôles, options et triche pour ajouter de l’or.<br><b>Manette à gauche</b> : se déplacer ou ramer. Deux impulsions dans la même direction permettent de courir.<br><b>💣</b> : bombe (maintenir pour gonfler avec le pouvoir). <b>✋</b> : ramasser, lancer ou interagir.<br>Touche la <b>pancarte au-dessus du héros</b> pour l’action proposée, un <b>objet de la ceinture</b> pour l’utiliser, ou le <b>sac</b> pour ouvrir l’inventaire. Glisse les objets au doigt pour les ranger.</p>
      </section></div>`,buttons:[{label:'↩ Retour à la pause',onClick:()=>this.showPause()},{label:'▶ À moi de jouer !',primary:true,onClick:()=>{BK.overlay.hide();this.state='play';this.world.frozen=false;}}]});
    }
    addCheatGold(amount) {
      const value=Number(amount);if(!Number.isSafeInteger(value)||value<=0||!Number.isSafeInteger((this.save.gold||0)+value))return false;
      this.save.gold=(this.save.gold||0)+value;BK.saveAdventure(this.charId,this.save);this.toast('🪙 +'+value+' pièces d’or',2);return true;
    }
    unlockAllStages() {
      this.save.unlocked=Math.max(this.save.unlocked||1,BK.stageList().length);
      this.save0.unlocked=this.save.unlocked;
      BK.saveAdventure(this.charId,this.save);return this.save.unlocked;
    }
    showGoldCheat() {
      BK.overlay.show({playful:'gold',title:'🪙 Une pluie de pièces !',html:'<label for="cheat-gold">Combien de pièces ajouter ?</label><input id="cheat-gold" type="number" inputmode="numeric" min="1" step="1" value="1000" style="display:block;margin:16px auto;padding:12px;font-size:20px;width:80%"><p id="cheat-gold-error" role="status"></p>',buttons:[{label:'Ajouter',primary:true,onClick:()=>{const el=document.getElementById('cheat-gold');if(!this.addCheatGold(el.value)){document.getElementById('cheat-gold-error').textContent='Entre un nombre entier positif valide.';return;}document.getElementById('cheat-gold-error').textContent='Or disponible : '+this.save.gold+' pièces. Tu peux en ajouter encore !';}},{label:'Retour au jeu',onClick:()=>{BK.overlay.hide();this.state='play';this.world.frozen=false;}}]});
    }
    syncInv() { const p = this.player;BK.normalizeRemedyBag(p); this.save.bagSlots = (p.bagSlots || []).slice(); this.save.quickSlots = (p.quickSlots || []).slice(); this.save.inv = (p.inv || []).filter(s => (s.perm || 0) > 0).map(s => ({ type: s.type, n: s.perm, ...(BK.ITEMS[s.type]?.snailColor?{snails:BK.snailStack(s).filter(sn=>sn.perm).map(sn=>({...sn}))}:{}) })); }
    // Entrée (ou un tap sur la grosse pancarte jaune, pour les iPad et les cellulaires) : entrer dans la maison, acheter
    // l'article d'à côté, cuire le poisson, boire à la fontaine. Vrai si le monde a changé (on arrête la mise à jour).
    pressEnter() {
      const W = this.world, p = this.player; if (!p.alive||p.swallowedBy) return false;
      if(W.nearbyPipe(p)){W.usePipe(p);return false;}
      const terrarium=W.nearbyTerrarium(p);if(terrarium){this.showTerrarium(terrarium);return false;}
      if(W.useSnail(p)) return false;
      if(p.seat||W.nearbySeat(p)){W.useSeat(p);return false;}
      if(p.boat || W.nearbyBoat(p)){W.useBoat(p);return false;}
      if (p.nearDoor) { this.enterHouse(p.nearDoor); return true; }
      if (!p.nearDisplay && W.petAnimal(p)) return false;
      if (p.nearDisplay) { if(p.nearDisplay.waiting)this.showAllyFood(p.nearDisplay.npc);else this.buy(p.nearDisplay); return false; }
      if (p.nearFire && !p.fishing) return this.showCooking(p.nearFire);
      if (p.nearFountain && !p.drinkT) { if (p.stamina < p.staminaMax - 0.5) W.drink(p); else this.toast('Ta stamina est déjà pleine.', 1.5); }
      return false;
    }
    showTerrarium(terrarium,message='') {
      const W=this.world,p=this.player,key=terrarium.key;if(W.nearbyTerrarium(p)?.key!==key)return;
      this.state='pause';W.frozen=true;BK.input.flush();
      const snails=W.props[key].snails||[],choices=Object.entries(BK.ITEMS).filter(([type,c])=>c.snailColor).map(([type,c])=>({type,name:(c.baby?(c.growth===2?'Jeune · ':c.growth===1?'Petit · ':'Bébé · '):'')+BK.SNAIL_COLORS[c.snailColor].name,n:(p.inv||[]).find(s=>s.type===type)?.n||0,count:snails.filter(s=>BK.snailItemType(s)===type).length}));
      const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const babies=snails.filter(s=>s.baby);
      const growthHtml=babies.length?'<section class="snail-growth-list" aria-label="Croissance des bébés escargots"><h3>🌱 Ils grandissent !</h3>'+babies.map((sn,i)=>{
        const meals=Math.max(0,Math.min(2,Math.floor(sn.growth||0))),left=3-meals,color=BK.SNAIL_COLORS[sn.color]||BK.SNAIL_COLORS.default,label=esc(sn.nickname||('Bébé '+(i+1)+' · coquille '+color.name.toLowerCase()));
        return '<div class="snail-growth-card"><div class="snail-growth-label"><strong><span class="snail-shell-dot" style="background:'+color.shell+'" aria-hidden="true"></span>🐌 '+label+'</strong><span>Encore '+left+' repas</span></div><div class="snail-growth-track" role="progressbar" aria-label="Croissance : '+label+'" aria-valuemin="0" aria-valuemax="3" aria-valuenow="'+meals+'" aria-valuetext="'+meals+' repas terminés sur 3, encore '+left+' repas"><span style="width:'+(meals/3*100)+'%"></span></div></div>';
      }).join('')+'<p class="snail-growth-note">Chaque repas terminé fait grandir les bébés. Après 3 repas, ils deviennent adultes !</p></section>':'';

      const label=(sn,i)=>sn.nickname||((sn.baby?'Bébé':'Escargot')+' '+(i+1)+' · '+(BK.SNAIL_COLORS[sn.color]?.name||'Dorée'));
      const bag=(p.inv||[]).filter(s=>BK.ITEMS[s.type]?.snailColor).flatMap(s=>BK.snailStack(s).map((sn,i)=>({value:s.type+':'+i,name:label(sn,i)}))),inside=snails.map((sn,i)=>({value:BK.snailItemType(sn)+':'+i,name:label(sn,i)})),buttons=[];
      const select=(id,list)=>'<select id="'+id+'" style="font:inherit;max-width:100%;padding:12px;border-radius:14px">'+list.map(c=>'<option value="'+esc(c.value)+'">'+esc(c.name)+'</option>').join('')+'</select>';
      const namesHtml=snails.length?'<section class="snail-names"><h3>✏️ Leurs petits noms</h3>'+snails.map((sn,i)=>'<label>🐌 '+esc((BK.SNAIL_COLORS[sn.color]?.name||'Dorée')+' · '+(sn.baby?'bébé':'adulte'))+'<input data-snail-name="'+i+'" maxlength="24" placeholder="Escargot '+(i+1)+'" value="'+esc(sn.nickname||'')+'" aria-label="Nom de l’escargot '+(i+1)+'"></label>').join('')+'<small>Les noms sont gardés automatiquement.</small></section>':'';
      const transfer=(id,take)=>{const [type,index]=document.getElementById(id).value.split(':'),done=W.terrariumTransfer(p,key,type,take,Number(index));this.syncInv();BK.saveAdventure(this.charId,this.save);this.showTerrarium(terrarium,done?(take?'Escargot remis dans le sac !':'Bienvenue dans ton petit jardin !'):(take?'Ton sac est plein.':'Le terrarium accueille jusqu’à 8 escargots.'));};
      const carrots=(p.inv||[]).find(s=>s.type==='carrot')?.n||0;
      if(snails.length&&carrots&&!W.props[key].snailFood)buttons.push({label:'🥕 Nourrir (1 carotte · '+carrots+' dans le sac)',onClick:()=>{if(W.feedTerrarium(p,key)){this.syncInv();BK.saveAdventure(this.charId,this.save);BK.overlay.hide();this.state='play';W.frozen=false;BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});this.toast('Les escargots viennent grignoter la carotte !',3);}else this.showTerrarium(terrarium,'Impossible de nourrir les escargots pour le moment.');}});
      if(bag.length)buttons.push({label:'🐌 Installer un escargot',onClick:()=>transfer('terrarium-add',false)});
      if(inside.length)buttons.push({label:'🎒 Reprendre un escargot',onClick:()=>transfer('terrarium-take',true)});
      buttons.push({label:'🌿 Regarder mes escargots',onClick:()=>{BK.overlay.hide();this.state='play';W.frozen=false;BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});}});
      BK.overlay.show({playful:'terrarium',title:'🐌 Mon petit terrarium',html:'<p>'+snails.length+' / 8 escargots installés</p><p>Deux adultes nourris peuvent avoir un tout petit bébé, s’il reste une place !</p>'+(W.props[key].snailFood?'<p>🥕 Le repas est servi !</p>':snails.length&&!carrots?'<p>🥕 Apporte une carotte de ton sac pour les nourrir.</p>':'')+namesHtml+growthHtml+(bag.length?'<label class="cook-choice">Dans mon sac '+select('terrarium-add',bag)+'</label>':'<p>Range un escargot dans ton sac pour l’installer ici.</p>')+(inside.length?'<label class="cook-choice">Dans le terrarium '+select('terrarium-take',inside)+'</label>':'<p>Un petit jardin attend ses habitants !</p>')+'<p role="status">'+message+'</p>',buttons});
      if(typeof document!=='undefined')document.querySelectorAll('[data-snail-name]').forEach(input=>input.addEventListener('input',()=>{const i=Number(input.dataset.snailName);W.renameTerrariumSnail(p,key,i,input.value);const option=document.querySelector('#terrarium-take option[value="'+BK.snailItemType(snails[i])+':'+i+'"]');if(option)option.textContent=label(snails[i],i);}));
    }
    showCooking(fire) {
      const W=this.world,p=this.player;
      const choices=Object.keys(BK.COOKABLE).map(type=>({type,n:(p.inv||[]).filter(s=>s.type===type).reduce((n,s)=>n+s.n,0)})).filter(s=>s.n>0);
      if(this.state!=='play'||!p.alive||!W.campfires.includes(fire)||fire.cook||Math.hypot(p.x-fire.c-.5,p.y-fire.r-.5)>=1.7||!choices.length)return false;
      const wasFrozen=W.frozen;this.state='pause';W.frozen=true;let closed=false;
      const clearInput=()=>{BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});Object.assign(p.input,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});};clearInput();
      const close=()=>{if(closed)return;closed=true;BK.overlay.hide();this.state='play';W.frozen=wasFrozen;clearInput();};
      BK.overlay.show({playful:'cooking',title:'🔥 À la cuisine !',html:'<p class="menu-intro">Choisis tes portions, puis lance la cuisson !<br><b>⏱ 5 secondes par portion</b></p>'+choices.map(s=>'<label class="cook-choice">'+(BK.ITEMS[s.type].icon+' '+BK.ITEMS[s.type].name)+' <small>'+s.n+' dans ton sac</small><input id="cook-count-'+s.type+'" type="number" inputmode="numeric" min="1" max="'+s.n+'" step="1" value="1" aria-label="Quantité à cuire"></label>').join('')+'<p class="fire-note">'+(fire.remaining!=null?'Temps de feu restant : '+Math.ceil(fire.remaining)+' s. Ajoute du bois pour prolonger la cuisson.':'Ce feu est permanent.')+' Les portions non cuites seront rendues crues si le feu s’éteint.</p><p id="cook-error" role="status"></p>',buttons:[...choices.map(s=>({label:(s.type==='fish'?'🐟 Cuire le poisson':s.type==='poultryraw'?'🍗 Cuire la volaille':'🥩 Cuire la viande')+' ('+s.n+' disponibles)',onClick:()=>{
        if(closed)return;
        if(this.world!==W||!p.alive||!W.campfires.includes(fire)||Math.hypot(p.x-fire.c-.5,p.y-fire.r-.5)>=1.7){close();return;}
        const quantity=typeof document==='undefined'?1:Number(document.getElementById('cook-count-'+s.type).value);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>s.n){if(typeof document!=='undefined')document.getElementById('cook-error').textContent='Choisis une quantité entre 1 et '+s.n+'.';return;}
        const cooked=W.cookFish(p,fire,s.type,quantity);close();if(cooked){this.syncInv();BK.saveAdventure(this.charId,this.save);this.toast(quantity+' portion'+(quantity>1?'s':'')+' en cuisson, 5 secondes chacune !',2.5);}else this.toast('Cet aliment ou ce feu n’est plus disponible.',2);
      }})),{label:'↩ Pas maintenant',onClick:close}]});return true;
    }
    // Défi raté (temps écoulé ou plus de vies) : on réessaie ou on retourne à la liste.
    failChallenge(msg) {
      const ch = this.challenge; this.state = 'over'; this.world.frozen = true; BK.audio.lose();
      BK.overlay.show({ title: 'Défi raté', text: msg + ' Score : ' + this.score + '.', buttons: [{ label: 'Réessayer', primary: true, onClick: () => { BK.overlay.hide(); BK.startChallenge(this.charId, ch); } }, { label: 'Retour aux défis', onClick: () => { BK.overlay.hide(); BK.showChallenges(this.charId); } }] });
    }
    onClick(x, y) {
      if (this.state !== 'play') return;
      const pipe=this.world.pipeRect;if(pipe&&x>=pipe.x&&x<=pipe.x+pipe.w&&y>=pipe.y&&y<=pipe.y+pipe.h){this.world.usePipe(this.player);return;}
      const portrait=(this.allyPortraitRects||[]).find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(portrait){this.showAllyFood(portrait.ally);return;}
      const pager=this.allyPanelPager;if(pager&&x>=pager.x&&x<=pager.x+pager.w&&y>=pager.y&&y<=pager.y+pager.h){this.allyPanelPage=(this.allyPanelPage+1)%pager.pages;return;}
      const foodBubble=(this.world.allyFoodRects||[]).find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h&&this.world.canCareForAlly(this.player,r.ally)&&this.world.allyCareNeeds(r.ally).includes(r.careType));if(foodBubble){if(foodBubble.careType==='food')this.showAllyFood(foodBubble.ally);else if(this.world.cureAlly(this.player,foodBubble.ally,foodBubble.careType)){this.syncInv();BK.saveAdventure(this.charId,this.save);BK.inventoryLayout(this.player);this.toast(foodBubble.ally.name+' : '+'poison et malus guéris !',2);}else this.toast('Il te manque un '+BK.ITEMS[foodBubble.careType].name.toLowerCase()+' dans ton sac.',2);return;}
      const petBubble=(this.world.petFoodRects||[]).find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
      if(petBubble){const e=petBubble.pet,type=this.world.petFood(this.player,e);if(type&&this.world.feedPet(this.player,e,type)){this.syncInv();BK.saveAdventure(this.charId,this.save);BK.inventoryLayout(this.player);this.toast('Miam ! Ton ami te suit plus longtemps.',2);}else this.toast(type?'Approche-toi de ton ami.':'Il te faut : '+(BK.PET_FOODS[e.type]||[]).map(k=>BK.ITEMS[k].name).join(', ')+'.',2);return;}
      const stow=this.world.stowSnailRect;if(stow&&x>=stow.x&&x<=stow.x+stow.w&&y>=stow.y&&y<=stow.y+stow.h){if(this.world.stowSnail(this.player)){this.syncInv();BK.saveAdventure(this.charId,this.save);this.toast('Escargot rangé dans le sac !',2);}else this.toast('Ton sac est plein.',2);return;}
      const snail=this.world.snailRect;if(snail&&x>=snail.x&&x<=snail.x+snail.w&&y>=snail.y&&y<=snail.y+snail.h){this.world.useSnail(this.player);return;}
      const fuel=this.world.fuelRect;if(fuel&&x>=fuel.x&&x<=fuel.x+fuel.w&&y>=fuel.y&&y<=fuel.y+fuel.h){if(this.world.addWoodToFire(this.player)){this.syncInv();BK.saveAdventure(this.charId,this.save);this.toast('Bois ajouté : +15 secondes !',2);}return;}
      const sr = this.world.signRect;
      if (sr && x >= sr.x - 10 && x <= sr.x + sr.w + 10 && y >= sr.y - 10 && y <= sr.y + sr.h + 16) { this.pressEnter(); return; }
      if (!this.invRects) return; for (const r of this.invRects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) BK.useQuickItem(this.world, this.player, r.i);
    }
    stageMusic() { return this.stage.objective === 'boss' ? 'boss' : 'stage'; }
    enterHouse(door) {
      this.world.releaseSnail(this.player);
      const key = door.c + ',' + door.r, hp = this.world.houses[key]; if (!hp || !hp.interior) return;
      const it = hp.interior; BK.audio.door();
      this.outer = { world: this.world, player: this.player, cam: this.cam, follow: this.follow, viewCols: this.viewCols, viewRows: this.viewRows, door };
      const W = this.world = new BK.World({ map: BK.roomMap(it.grid,it.roomExit), theme: it.theme || 'interior', mode: 'adventure', hearts: true, explore: true, itemChance: 0.25, softChance: 0.75, coins: true, houses: {}, props: it.props || {}, exitKind: 'door' });
      const savedTerrariums=this.outer.world.terrariumRooms?.[key];if(savedTerrariums)for(const [k,state] of Object.entries(savedTerrariums))if(W.props[k]?.deco==='terrarium'){W.props[k].snails=state.snails.map(s=>({...s}));W.props[k].snailFood=state.food?JSON.parse(JSON.stringify(state.food)):null;W.props[k].snailSatiety=state.satiety||0;}
      W.ensureRoomExit();
      for (const en of it.enemies || []) W.addEnemy(en.type, en.c, en.r, {shellColor:en.shellColor, catColor:en.catColor});
      const residents=this.outer.world.snailResidents?.[key];if(residents){W.enemies=W.enemies.filter(e=>e.type!=='escargot');for(const sn of residents)W.addEnemy('escargot',Math.floor(sn.x),Math.floor(sn.y),{...sn,home:{c:Math.floor(sn.x),r:Math.floor(sn.y)}});}
      this.setupShop(W, it, 'house:' + (this.stage.mapId || this.stage.id) + ':' + key);
      const st = W.starts[0] || { c: 1, r: 1 }, o = this.outer.player, p = this.player = W.addPlayer(this.def, st.c, st.r, { hp: o.maxHp });
      Object.assign(p, { bombsMax: o.bombsMax, fire: o.fire, speed: o.speed, speedUp: o.speedUp, kick: o.kick, gloves: o.gloves, lantern: o.lantern, inv: o.inv, bagSlots: o.bagSlots, quickSlots: o.quickSlots, found: o.found, feastT: o.feastT, feastBase: o.feastBase, maxHp: o.maxHp, hp: o.hp, score: o.score, cards: o.cards, gold: o.gold, staminaMax: o.staminaMax, stamina: o.stamina, staminaRegen: o.staminaRegen, dir: 2, invuln: 1 });
      for (const key of [...BK.BOMB_POWERS, 'shield', 'diarrheaT', 'shortfuseT', 'poison', 'poisonTick']) p[key] = o[key];
      this.transferAllies(this.outer.world,W,p);
      this.cam = new BK.Camera(BK.W, BK.H); this.fitCamera(); this.toast('Tu entres dans la maison. Marche sur la case SORTIE pour ressortir.', 3);
      if (BK.music && it.music && BK.hasInstrument(W)) BK.music.play(it.music);   // la musique de la pièce, s'il y a un instrument pour la jouer
    }
    leaveHouse() {
      this.world.releaseSnail(this.player);
      const o = this.outer; if (!o) return; const inner = this.player, innerWorld=this.world; this.outer = null; BK.audio.door();
      o.world.snailResidents=o.world.snailResidents||{};o.world.snailResidents[o.door.c+','+o.door.r]=innerWorld.enemies.filter(e=>e.type==='escargot'&&!e.dead).map(e=>({x:e.x,y:e.y,shellColor:e.shellColor,color:e.color,nickname:e.nickname,baby:!!e.baby,growth:e.growth||0,perm:!!e.perm,shell:e.shell||0}));
      o.world.terrariumRooms=o.world.terrariumRooms||{};o.world.terrariumRooms[o.door.c+','+o.door.r]=Object.fromEntries(Object.entries(innerWorld.props).filter(([k,pr])=>pr.deco==='terrarium').map(([k,pr])=>[k,{snails:(pr.snails||[]).map(s=>({...s})),food:pr.snailFood?JSON.parse(JSON.stringify(pr.snailFood)):null,satiety:pr.snailSatiety||0}]));
      this.world = o.world; this.player = o.player; this.cam = o.cam; this.follow = o.follow; this.viewCols = o.viewCols; this.viewRows = o.viewRows;
      Object.assign(this.player, { bombsMax: inner.bombsMax, fire: inner.fire, speed: inner.speed, speedUp: inner.speedUp, kick: inner.kick, gloves: inner.gloves, lantern: inner.lantern, inv: inner.inv, bagSlots: inner.bagSlots, quickSlots: inner.quickSlots, found: inner.found, feastT: inner.feastT, feastBase: inner.feastBase, maxHp: inner.maxHp, hp: inner.hp, score: inner.score, cards: inner.cards, gold: inner.gold, stamina: inner.stamina, bombsOut: 0, carrying: null, dir: 0, invuln: 1 });
      for (const key of [...BK.BOMB_POWERS, 'shield', 'diarrheaT', 'shortfuseT', 'poison', 'poisonTick']) this.player[key] = inner[key];
      this.player.x = o.door.c + 0.5; this.player.y = o.door.r + 1.5; this.world.frozen = false; this.state = 'play';this.transferAllies(innerWorld,this.world,this.player);
      if (BK.music) BK.music.play(this.stage.music && BK.hasInstrument(this.world) ? this.stage.music : this.stageMusic());
    }
    revealBossCrystal(enemy){
      if(this.custom||this.challenge||this.stage.world?.stages?.at(-1)?.id!==this.stage.id)return;
      const W=this.world;if(W.castleEncounter&&!W.castleEncounter.done)return;const spot=W.freeCellNear(Math.floor(enemy.x),Math.floor(enemy.y));if(!spot)return;
      W.bossCrystal={x:spot.c+.5,y:spot.r+.5,stage:this.stage.id};
      if(!enemy.arenaBoss&&!enemy.castleFinal){if(W.exit)W.special.delete(W.exit.c+','+W.exit.r);W.exit={c:spot.c,r:spot.r,x:spot.c+.5,y:spot.r+.5,kind:'diamond',open:true};W.special.set(spot.c+','+spot.r,{type:'exit'});this.exitOpened=true;}
      this.toast('💎 Le grand cristal est libéré ! Approche pour le récupérer.',5);
    }
    captureBossCrystal(){
      if(this.custom||this.challenge||this.stage.objective!=='boss'||this.stage.world?.stages?.at(-1)?.id!==this.stage.id)return;
      (this.save.crystals||(this.save.crystals={}))[this.stage.id]=true;
      if(this.world.bossCrystal)this.world.bossCrystal.captured=true;
      BK.saveAdventure(this.charId,this.save);
    }
    showCrystals(){
      const bosses=BK.stageList().filter(s=>s.objective==='boss'&&s.world.stages.at(-1).id===s.id);
      BK.overlay.show({playful:'pause',title:'💎 Mes cristaux',html:'<p class="menu-intro">'+bosses.filter(s=>this.save.crystals?.[s.id]).length+' / '+bosses.length+' cristaux récupérés</p>'+bosses.map(s=>'<p class="big">'+(this.save.crystals?.[s.id]?'💎':'🔒')+' '+s.world.name+'<br><small>'+s.name+' · '+(this.save.crystals?.[s.id]?'Capturé !':'À trouver')+'</small></p>').join(''),buttons:[{label:'↩ Retour à la pause',primary:true,onClick:()=>this.showPause()}]});
    }
    spawnBossChest(enemy) {
      const W=this.world;if(W.bossChest||W.castleEncounter&&!W.castleEncounter.done)return;
      const spot=W.freeCellNear(Math.floor(enemy.x),Math.floor(enemy.y))||W.starts[0];
      W.bossSurvivors=W.players.filter(p=>p.ally&&p.alive);
      W.bossChest={x:spot.c+.5,y:spot.r+.5,born:W.time,open:false};
      // Le butin ne doit pas être perdu dans les dernières explosions du combat.
      W.bombs=[];W.flames=[];W.flameAt.clear();W.shots=[];W.arenaAnvils=[];W.arenaWaves=[];
      for(const v of W.volcanoes)v.cool=Infinity;
      for(const p of W.players){p.bombsOut=0;p.carrying=null;p.invuln=Infinity;}
      W.burst(W.bossChest.x,W.bossChest.y,1.2,'#ffd54a',45);BK.audio.fanfare();
      this.toast('Le boss est vaincu ! Approche du grand coffre doré pour recevoir ton trésor !',6);
    }
    deliverBossLoot() {
      const pending=this.save.pendingBossLoot;if(!pending?.length)return;
      this.save.pendingBossLoot=pending.filter(it=>!this.world.applyItem(this.player,it,true));
      if(this.save.pendingBossLoot.length!==pending.length){this.syncInv();BK.saveAdventure(this.charId,this.save);}
    }
    openBossChest() {
      const W=this.world,chest=W.bossChest;if(!chest||chest.open||!this.player.alive)return false;
      chest.open=true;chest.openedAt=W.time;this.captureBossCrystal();
      this.save.gold=(this.save.gold||0)+BOSS_REWARDS[0].value;
      this.save.pendingBossLoot=[...(this.save.pendingBossLoot||[]),...BOSS_REWARDS.slice(1).map(({type,value})=>({type,value}))];
      this.deliverBossLoot();this.syncInv();
      if(!this.custom&&!this.challenge)this.save.unlocked=Math.max(this.save.unlocked||1,this.stageIndex+2);
      BK.saveAdventure(this.charId,this.save);
      this.saveBossCompanions();this.startCelebration('boss');return true;
    }
    saveBossCompanions() {
      if(this.custom||this.challenge)return;
      const next=BK.stageList()[this.stageIndex+1];
      this.saveCompanionsFor(next?.id||this.stage.id,(this.world.bossSurvivors||[]).filter(p=>p.alive));
    }
    saveCompanionsFor(destination,team) {
      if(this.custom||this.challenge)return;
      const fields=['id','name','hp','maxHp','lives','speed','speedUp','bombsMax','fire','kick','shield','staminaMax','staminaRegen','recruitKey','reserveKey',...BK.BOMB_POWERS];
      this.save.bossCompanions={destination,members:team.filter(p=>p.ally&&p.lives>0).slice(0,BK.MAX_ALLIES).map(p=>({
        ...Object.fromEntries(fields.map(k=>[k,p[k]])),
        // La vie a déjà été décomptée à la mort : terminer la réapparition sans en enlever une autre.
        hp:p.alive?p.hp:p.maxHp
      }))};
      BK.saveAdventure(this.charId,this.save);
    }
    restoreBossCompanions() {
      const team=this.save.bossCompanions;if(!team||team.destination!==this.stage.id||this.custom||this.challenge)return;
      const W=this.world,leader=this.player,bfs=BK.ai.bfs(W,leader,null),spots=[];
      for(let k=0;k<bfs.dist.length;k++)if(bfs.dist[k]>0&&!W.special.has((k%W.cols)+','+Math.floor(k/W.cols)))spots.push({c:k%W.cols,r:Math.floor(k/W.cols),dist:bfs.dist[k]});
      spots.sort((a,b)=>a.dist-b.dist);
      for(const member of team.members){if(this.activeAllies().length>=BK.MAX_ALLIES)break;const def=BK.charById(member.id);if(!def||member.hp<=0||member.lives<=0)continue;const spot=spots.shift()||{c:Math.floor(leader.x),r:Math.floor(leader.y)};const p=W.addPlayer(def,spot.c,spot.r,{hp:member.maxHp,lives:member.lives});Object.assign(p,member,{ally:true,human:false,leader,invuln:2,stamina:member.staminaMax,planT:0,path:[],bombCool:1});}
      delete this.save.bossCompanions;BK.saveAdventure(this.charId,this.save);
    }
    showBossRewards() {
      const destination=this.stageIndex+1<BK.stageList().length?this.stageIndex+1:-1;
      const cards=BOSS_REWARDS.map((r,i)=>'<li class="treasure-card" style="--reward-order:'+i+'"><span class="treasure-icon" aria-hidden="true">'+(r.type==='coin'?'🪙':BK.ITEMS[r.type].icon)+'</span><strong>+'+r.value+'</strong><span>'+r.label+'</span></li>').join('');
      BK.overlay.show({playful:'treasure',title:'🎉 Ton grand trésor !',html:'<p class="treasure-unlock">'+(this.stage.id==='1-5'?'💎 Cristal de la forêt capturé !<br>🔓 Le monde 2 t’attend !':'💎 Cristal du château capturé !<br>Le roi Matthieu est vaincu !')+'</p><ul class="treasure-grid">'+cards+'</ul><p class="treasure-note">'+(this.save.pendingBossLoot?.length?'Ton sac est plein : les objets restants sont réservés jusqu’à ce qu’une place se libère.':'Ton argent et tes objets sont sauvegardés !')+'</p>',buttons:[...(destination>=0?[{label:this.stage.id==='1-5'?'🌍 Aller au monde 2':'🌍 Continuer l’aventure',primary:true,onClick:()=>{if(this.state!=='clear')return;BK.overlay.hide();this.stageIndex=destination;this.loadStage(true);}}]:[]),{label:'🗺️ Choisir un tableau',onClick:()=>{BK.overlay.hide();BK.showAdventureSelect(this.charId);}}]});
    }
    clearStage() {
      if(this.state==='clear')return;
      const W = this.world, p = this.player; this.state = 'clear'; W.frozen = true; p.pose = 'win'; p.poseT = 0; p.poseDur = 99;
      const bonus = 500 + this.lives * 200 + (p.cards || 0) * 300 + (this.diamondBonus || 0); p.score += bonus; this.score = p.score; BK.audio.win(); this.syncInv();
      if (this.challenge) {   // défi réussi : l'or va dans la cagnotte de toute la famille
        const ch=this.challenge,missionScore=BK.challengeScore(ch,this.timeLeft,this.lives),reward=BK.awardChallenge(ch,missionScore,this.charId,this.save),next=BK.nextChallenge(ch);
        const left = ch.time ? Math.floor(this.timeLeft / 60) + ':' + String(Math.floor(this.timeLeft % 60)).padStart(2, '0') : '';
        setTimeout(() => BK.overlay.show({ title: 'Défi réussi !', html: BK.challengeResultHtml(ch,missionScore,reward), buttons: [...(next ? [{ label: 'Défi suivant : ' + next.name, primary: true, onClick: () => { BK.overlay.hide(); BK.startChallenge(this.charId, next); } }] : []), { label: 'Retour aux défis', primary: !next, onClick: () => { BK.overlay.hide(); BK.showChallenges(this.charId); } }, { label: 'Menu', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] }), 900);
        return;
      }
      if (this.custom) {
        const back = BK.editor ? [{ label: 'Retour à l’éditeur', primary: true, onClick: () => { BK.overlay.hide(); BK.show('editor'); BK.current = BK.editor; } }] : [];
        setTimeout(() => BK.overlay.show({ title: 'Tableau réussi !', html: '<p class="big">Score : ' + this.score + '</p>' + (W.cardsTotal ? '<p>Cartes d’or ' + (p.cards || 0) + ' / ' + W.cardsTotal + '</p>' : ''), buttons: [...back, { label: 'Rejouer', primary: !back.length, onClick: () => { BK.overlay.hide(); this.lives = 3; this.loadStage(); } }, { label: 'Menu', onClick: () => { BK.overlay.hide(); BK.editor = null; BK.toMenu(); } }] }), 900);
        return;
      }
      const list = BK.stageList(), next = this.stageIndex + 1;
      if(this.stage.id.startsWith('2-')&&list[next]?.id.startsWith('2-'))this.saveCompanionsFor(list[next].id,W.players);
      BK.saveAdventure(this.charId, this.save);
      this.save.unlocked = Math.max(this.save.unlocked, next + 1); this.save.best[this.stage.id] = Math.max(this.save.best[this.stage.id] || 0, this.score); this.save.score = Math.max(this.save.score || 0, this.score);
      BK.saveAdventure(this.charId, this.save);
      if(this.celebKind==='boss'){this.showBossRewards();return;}
      const last = next >= list.length, newWorld = !last && list[next].world !== this.stage.world;
      setTimeout(() => BK.overlay.show({ title: 'Tableau réussi !', html: '<p>' + this.stage.name + ' — bonus ' + bonus + (W.cardsTotal ? ' · cartes d’or ' + (p.cards || 0) + ' / ' + W.cardsTotal : '') + '</p><p class="big">Score : ' + this.score + '</p>' + (last ? '<p>Tu as terminé toute l’aventure… pour l’instant ! D’autres mondes arriveront.</p>' : newWorld ? '<p>Nouveau monde : <b>' + list[next].world.name + '</b></p>' : ''),
        buttons: last ? [{ label: 'Menu', primary: true, onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] : [{ label: 'Tableau suivant', primary: true, onClick: () => { BK.overlay.hide(); this.stageIndex = next; this.loadStage(true); } }, { label: 'Choisir un tableau', onClick: () => { BK.overlay.hide(); BK.showAdventureSelect(this.charId); } }] }), 900);
    }
    showAllyFood(ally,message='') {
      const W=this.world,p=this.player;if(!W.canCareForAlly(p,ally))return;
      BK.normalizeRemedyBag(p);
      const waiting=(W.displays||[]).find(d=>d.waiting&&d.npc===ally),restingDead=ally.waitingMember?.alive===false;
      this.state='pause';W.frozen=true;
      const resetInput=()=>{BK.input.keys.clear();BK.input.flush();Object.assign(BK.input.touch,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});for(const q of W.players){Object.assign(q.input,{dx:0,dy:0,bomb:false,bombHeld:false,action:false});q.vx=q.vy=0;}};
      resetInput();
      const close=()=>{resetInput();BK.overlay.hide();this.state='play';W.frozen=false;};
      const foods=(p.inv||[]).filter(s=>BK.ALLY_FOOD_HEAL[s.type]&&s.n>0),canEat=ally.alive&&!restingDead&&ally.lives>0&&ally.hp<ally.maxHp;
      const remedies=(p.inv||[]).filter(s=>s.n>0&&ally.alive&&!restingDead&&ally.lives>0&&s.type==='antidote'&&(ally.diarrheaT>0||ally.shortfuseT>0||ally.poison>0));
      const ailments=[ally.poison>0?'☠️ Poison':null,ally.diarrheaT>0?'💣 Diarrhée de bombes':null,ally.shortfuseT>0?'⏱️ Mèche courte':null].filter(Boolean);
      const status=!ally.alive||restingDead||ally.lives<=0?(ally.lives>0?'Cet allié doit d’abord revenir avant de manger.':'Cet allié n’a plus de vies.'):ally.hp>=ally.maxHp?'Sa vie est déjà pleine !':!foods.length?'Tu n’as pas de nourriture prête à manger. Apporte des morceaux de citrouille, de la viande cuite ou du poisson cuit.':'Choisis une portion de ton sac. Le jeu est en pause pendant le repas.';
      BK.overlay.show({playful:'ally-food',title:'💝 Prendre soin de '+ally.name,text:'♥ '+Math.max(0,Math.ceil(ally.hp))+' / '+ally.maxHp+' PV · '+ally.lives+' vies. '+(message?message+' ':'')+status+(ailments.length?' Effets actifs : '+ailments.join(' · ')+'. Choisis le remède adapté dans ton sac.':''),buttons:[...(canEat?foods.map(s=>({label:BK.ITEMS[s.type].icon+' '+BK.ITEMS[s.type].name+' · ×'+s.n+' · +'+Math.min(BK.ALLY_FOOD_HEAL[s.type],ally.maxHp-ally.hp)+' PV',onClick:()=>{
        if(this.state!=='pause'||this.world!==W)return;const before=ally.hp;
        if(W.feedAlly(p,ally,s.type)){this.syncInv();BK.saveAdventure(this.charId,this.save);BK.inventoryLayout(p);this.showAllyFood(ally,'Miam ! +'+(ally.hp-before)+' PV.');}
        else this.showAllyFood(ally,'Cette portion n’est plus disponible.');
      }})):[]),...remedies.map(s=>({label:BK.ITEMS[s.type].icon+' '+BK.ITEMS[s.type].name+' · ×'+s.n+' · '+'Guérir le poison et les malus',onClick:()=>{
        if(this.state!=='pause'||this.world!==W)return;
        if(W.cureAlly(p,ally,s.type)){this.syncInv();BK.saveAdventure(this.charId,this.save);BK.inventoryLayout(p);this.showAllyFood(ally,'Le poison et les malus sont guéris !');}
        else this.showAllyFood(ally,'Ce remède n’est pas nécessaire ou n’est plus disponible.');
      }})),...(waiting?[{label:'🤝 Reprendre gratuitement dans mon équipe',onClick:()=>{if(this.world!==W||!W.displays.includes(waiting))return;close();this.buy(waiting);}}]:[]),{label:waiting?'↩ Le laisser se reposer':'▶ Reprendre l’aventure',primary:true,onClick:close}]});
    }
    drawAllyPanel(ctx) {
      const team=this.world.players.filter(p=>p.ally&&!p.npc);this.allyPanelPager=null;this.allyPortraitRects=[];if(!team.length)return;
      const pageSize=5,pages=Math.ceil(team.length/pageSize);this.allyPanelPage=Math.min(this.allyPanelPage||0,pages-1);
      const visible=team.slice(this.allyPanelPage*pageSize,(this.allyPanelPage+1)*pageSize),w=224,x=BK.W-w-170,y=170,rowH=58,h=36+visible.length*rowH+(pages>1?42:0);
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='rgba(35,29,65,.9)';BK.sprites.rr(ctx,x,y,w,h,16);ctx.fill();ctx.strokeStyle='#bba1ec';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#ffe59b';ctx.font='900 16px Nunito, sans-serif';ctx.fillText('MON ÉQUIPE · '+team.filter(p=>p.lives>0).length+'/'+team.length,x+12,y+19);
      visible.forEach((p,i)=>{
        const yy=y+36+i*rowH,exhausted=p.lives<=0,returning=!p.alive&&!exhausted,hp=p.alive?Math.max(0,p.hp):0,ratio=Math.max(0,Math.min(1,hp/p.maxHp));
        this.allyPortraitRects.push({x:x+8,y:yy,w:w-16,h:rowH-5,ally:p});
        ctx.fillStyle=exhausted?'#494653':'#51416f';BK.sprites.rr(ctx,x+8,yy,w-16,rowH-5,11);ctx.fill();
        ctx.save();ctx.beginPath();ctx.arc(x+33,yy+25,21,0,Math.PI*2);ctx.clip();ctx.fillStyle=exhausted?'#89848e':'#dfd1f2';ctx.fill();ctx.globalAlpha=exhausted?.45:1;ctx.translate(x+33,yy+67);BK.sprites.drawCharacter(ctx,p.def,{s:62/(.8+.7*(p.def.size||1)),pose:'idle',t:this.world.time,view:'front'});ctx.restore();
        // Alerte douce (un cycle toutes les deux secondes), sans masquer le visage ni les badges.
        const bombWarning=p.alive&&!exhausted&&!!p.bombAlert;
        if(p.alive&&!exhausted&&(ratio<=.25||bombWarning)){
          const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const pulse=reduced?.5:(1-Math.cos((bombWarning?this.world.time-p.bombAlert.since:this.world.time)*Math.PI))/2;
          ctx.save();ctx.strokeStyle=(bombWarning?'rgba(255,163,52,':'rgba(255,85,100,')+(.4+pulse*.5)+')';ctx.lineWidth=3+pulse*1.5;
          ctx.shadowColor=bombWarning?'#ffa334':'#ff5564';ctx.shadowBlur=4+pulse*8;ctx.beginPath();ctx.arc(x+33,yy+25,22,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
        // L'alerte de bombe reste distincte des malus sous le visage.
        if(bombWarning){
          ctx.save();ctx.fillStyle='#ffb84d';ctx.strokeStyle='#fff0bd';ctx.lineWidth=1.5;
          ctx.beginPath();ctx.arc(x+17,yy+8,10,0,Math.PI*2);ctx.fill();ctx.stroke();
          ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#263044';ctx.fillText('💣',x+17,yy+8.5);ctx.restore();
        }
        // Badges sous le visage : les effets simultanés restent tous visibles.
        const effects=p.alive&&!exhausted?[
          ...(p.poison>0?[{icon:'☠️',color:'#467d3a'}]:[]),
          ...(p.diarrheaT>0?[{icon:'💣',color:'#7952a9'}]:[]),
          ...(p.shortfuseT>0?[{icon:'⏱️',color:'#ae572c'}]:[])
        ]:[];
        ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='13px sans-serif';
        effects.forEach((effect,j)=>{const cx=x+33+(j-(effects.length-1)/2)*18,cy=yy+43;ctx.fillStyle=effect.color;ctx.strokeStyle='#fff3bf';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(effect.icon,cx,cy+.5);});
        ctx.restore();
        ctx.font='900 14px Nunito, sans-serif';ctx.fillStyle=exhausted?'#c8c3d0':'#fff';let name=p.name||p.def.name;while(name.length>1&&ctx.measureText(name).width>99)name=name.slice(0,-1);if(name!==(p.name||p.def.name))name=name.slice(0,-1)+'…';ctx.fillText(name,x+61,yy+13);
        ctx.textAlign='right';ctx.fillStyle=exhausted?'#c8c3d0':'#ffbacd';ctx.fillText('♥ ×'+Math.max(0,p.lives),x+w-15,yy+13);ctx.textAlign='left';
        const bx=x+61,by=yy+26,bw=w-77;ctx.fillStyle='#242238';BK.sprites.rr(ctx,bx,by,bw,10,5);ctx.fill();if(ratio>0){ctx.fillStyle=ratio>.5?'#7ce3a3':ratio>.25?'#ffd36a':'#ff7b83';BK.sprites.rr(ctx,bx,by,bw*ratio,10,5);ctx.fill();}
        ctx.fillStyle=returning?'#ffe59b':'#e5dff2';ctx.font='bold 11px Nunito, sans-serif';ctx.fillText(exhausted?'Plus de vies':returning?'Revient bientôt…':p.retreating?'Repli · '+Math.ceil(hp)+' / '+p.maxHp+' PV':Math.ceil(hp)+' / '+p.maxHp+' PV',bx,yy+45);
      });
      if(pages>1){const yy=y+h-40;ctx.fillStyle='#7454a4';BK.sprites.rr(ctx,x+8,yy,w-16,34,10);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 14px Nunito, sans-serif';ctx.fillText('Équipe '+(this.allyPanelPage+1)+' / '+pages+'  →',x+w/2,yy+17);this.allyPanelPager={x:x+8,y:yy,w:w-16,h:34,pages};}
      ctx.restore();
    }
    drawBossHealth(ctx) {
      const W=this.world,boss=W.enemies.find(e=>(e.arenaBoss||e.castleBoss)&&!e.dead);if(!boss)return;
      const phase=boss.phase||1,sealed=boss.state==='sealed',guards=W.enemies.filter(e=>e.arenaGuard&&!e.dead).length;
      const w=Math.min(480,BK.W-40),x=(BK.W-w)/2,y=76,ratio=Math.max(0,Math.min(1,boss.hp/boss.maxHp));
      ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#292344';BK.sprites.rr(ctx,x,y,w,60,15);ctx.fill();ctx.strokeStyle=phase===2?'#ffad48':'#ffe38b';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#fff3bf';ctx.font='900 19px Nunito, sans-serif';ctx.fillText(sealed?'🔒 Roi Golem · '+guards+' crapaud'+(guards>1?'s':'')+' à battre':(boss.castleBoss?boss.name:boss.name+' · FORME '+phase+' / 2'),BK.W/2,y+17);
      const bx=x+14,by=y+32,bw=w-28;ctx.fillStyle='#17192d';BK.sprites.rr(ctx,bx,by,bw,21,8);ctx.fill();
      if(ratio>0){const g=ctx.createLinearGradient(bx,0,bx+bw,0);g.addColorStop(0,sealed?'#64748b':phase===2?'#e53c49':'#7c50cf');g.addColorStop(1,sealed?'#a4b2c6':phase===2?'#ffac39':'#cc8dff');ctx.fillStyle=g;BK.sprites.rr(ctx,bx,by,bw*ratio,21,8);ctx.fill();}
      ctx.font='900 15px Nunito, sans-serif';ctx.strokeStyle='#231a36';ctx.lineWidth=3;ctx.fillStyle='#fff';const hp=Math.max(0,Math.ceil(boss.hp))+' / '+boss.maxHp;ctx.strokeText(hp,BK.W/2,by+11);ctx.fillText(hp,BK.W/2,by+11);
      if(boss.castleFinal&&W.time<this.castleRevealUntil){ctx.fillStyle='#f6b8ff';ctx.font='900 27px Nunito, sans-serif';ctx.fillText('LE VÉRITABLE ROI !',BK.W/2,y+91);}
      if(boss.state==='transform'||W.time<this.bossFormUntil){
        ctx.fillStyle='#672d58';BK.sprites.rr(ctx,x,y+70,w,62,16);ctx.fill();ctx.strokeStyle='#ffd768';ctx.lineWidth=3;ctx.stroke();
        ctx.fillStyle='#ffe17b';ctx.font='900 24px Nunito, sans-serif';ctx.fillText('🔥 DEUXIÈME FORME !',BK.W/2,y+91);
        ctx.fillStyle='#fff';ctx.font='bold 17px Nunito, sans-serif';ctx.fillText('Golem de braise · Nouvelle barre de vie',BK.W/2,y+116);
      }
      ctx.restore();
    }
    render(ctx) {
      const W = this.world, p = this.player, cam = this.cam;
      W.render(ctx, cam, {}); W.renderNight(ctx, cam);
      // HUD
      const s = this.stage;
      ctx.save(); ctx.font = 'bold 22px Nunito, sans-serif'; ctx.textBaseline = 'middle';
      BK.sprites.uiPanel(ctx, 14, 12, 420, 60);
      // barre de vie : cœur, cadre métal, dégradé rouge → orange → jaune selon les points de vie restants
      ctx.font = '26px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('❤️', 22, 30);
      const bx = 58, by = 19, bw = 350, bh = 22; ctx.fillStyle = '#5a6678'; BK.sprites.rr(ctx, bx - 3, by - 3, bw + 6, bh + 6, 9); ctx.fill(); ctx.fillStyle = '#1b2236'; BK.sprites.rr(ctx, bx, by, bw, bh, 7); ctx.fill();
      const frac = Math.max(0, Math.min(1, p.hp / p.maxHp)); if (frac > 0) { const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#ff3b2f'); g.addColorStop(0.55, '#ff8a1f'); g.addColorStop(1, '#ffe36b'); ctx.fillStyle = g; BK.sprites.rr(ctx, bx, by, bw * frac, bh, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; BK.sprites.rr(ctx, bx + 2, by + 2, Math.max(0, bw * frac - 4), bh * 0.35, 5); ctx.fill(); }
      ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; ctx.strokeText(Math.ceil(p.hp) + ' / ' + p.maxHp, bx + bw - 8, by + bh / 2 + 1); ctx.fillText(Math.ceil(p.hp) + ' / ' + p.maxHp, bx + bw - 8, by + bh / 2 + 1);
      if (p.feastT > 0) { const m = Math.floor(p.feastT / 60), sec = Math.floor(p.feastT % 60); ctx.fillStyle = '#ff8a1f'; BK.sprites.rr(ctx, bx + bw + 10, by - 2, 118, 26, 9); ctx.fill(); ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('🍖 vie ×2 ' + m + ':' + String(sec).padStart(2, '0'), bx + bw + 69, by + 12); }
      if (p.poison > 0) { const px = bx + bw + 10 + (p.feastT > 0 ? 126 : 0); ctx.fillStyle = Math.floor(this.stateT * 4) % 2 ? '#2e7d32' : '#43a047'; BK.sprites.rr(ctx, px, by - 2, 112, 26, 9); ctx.fill(); ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('☠️ poison ' + Math.ceil(p.poison) + ' s', px + 56, by + 12); }
      ctx.globalAlpha = 1; ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.text; ctx.textAlign = 'left';
      ctx.fillText('💣 ×' + (p.bombsMax - p.bombsOut) + '/' + p.bombsMax + '   🔥 ' + p.fire + (p.kick ? '   🦵' : '') + (p.gloves ? '   🧤' : '') + (BK.wearsLantern(p) ? '   🏮' : '') + (p.speedUp ? '   ⚡' + p.speedUp : ''), 22, 58);
      const lv = BK.levelFromXp(this.save.xp || 0); BK.sprites.uiPanel(ctx, 14, 78, 260, 26, { r: 10 });
      ctx.fillStyle = '#c9dcf0'; BK.sprites.rr(ctx, 96, 86, 168, 10, 5); ctx.fill(); ctx.fillStyle = '#3f9cff'; BK.sprites.rr(ctx, 96, 86, 168 * lv.current / lv.needed, 10, 5); ctx.fill();
      ctx.font = 'bold 15px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = BK.sprites.UI.text; ctx.fillText('Niveau ' + lv.level, 24, 91); ctx.font = 'bold 11px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.textAlign = 'right'; ctx.fillText(lv.current + ' / ' + lv.needed + ' XP', 262, 91);
      // stamina : barre verte (jaune quand on court), points de stat à placer
      BK.sprites.uiPanel(ctx, 14, 108, 260, 24, { r: 10 }); ctx.fillStyle = '#c9dcf0'; BK.sprites.rr(ctx, 96, 115, 168, 10, 5); ctx.fill();
      ctx.fillStyle = p.running ? '#ffd54a' : p.stamina < 20 ? '#ff6b6b' : '#49e26a'; BK.sprites.rr(ctx, 96, 115, 168 * p.stamina / p.staminaMax, 10, 5); ctx.fill();
      ctx.font = 'bold 14px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = BK.sprites.UI.text; ctx.fillText('Stamina', 24, 120); ctx.font = 'bold 11px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.textAlign = 'right'; ctx.fillText(Math.round(p.stamina) + ' / ' + p.staminaMax, 262, 120);
      const effects = [];
      if (p.diarrheaT > 0) effects.push('💣 Diarrhée de bombes · '+Math.ceil(p.diarrheaT)+' s');
      if (p.shortfuseT > 0) effects.push('⏱ Mèche courte · '+Math.ceil(p.shortfuseT)+' s');
      if (p.inflating) effects.push('🎈 Gonflage '+Math.round((p.inflating.inflation||0)*100)+' % · Relâche pour lancer');
      effects.forEach((label,i) => { ctx.fillStyle='rgba(70,25,45,.9)'; BK.sprites.rr(ctx,14,172+i*30,370,26,9);ctx.fill();ctx.font='bold 14px Nunito, sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(label,24,185+i*30); });
      if (p.found && p.found.length) {   // objets trouvés dans ce tableau (perdus à la fin), avec leur nombre
        let x = 14; const y = 138;
        for (const f of p.found) { const it = BK.ITEMS[f.type]; if (!it) continue; const w = 30 + (f.n > 1 ? 30 : 8); BK.sprites.uiPanel(ctx, x, y, w, 26, { r: 9, lineWidth: 2 }); ctx.font = '17px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(it.icon, x + 7, y + 14); if (f.n > 1) { ctx.font = 'bold 13px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.gold; ctx.fillText('×' + f.n, x + 31, y + 14); } x += w + 6; }

      }
      if (this.save.points) { ctx.save();if(W.enemies.some(e=>(e.arenaBoss||e.castleBoss)&&!e.dead))ctx.translate(BK.W-486,0);ctx.fillStyle = '#ffd54a'; BK.sprites.rr(ctx, 282, 108, 190, 24, 10); ctx.fill(); ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#1b2a4a'; ctx.fillText('Tab : ' + this.save.points + ' point' + (this.save.points > 1 ? 's' : '') + ' à placer', 377, 120);ctx.restore(); }
      ctx.font = 'bold 22px Nunito, sans-serif';
      ctx.textAlign = 'right'; BK.sprites.uiPanel(ctx, BK.W - 454, 12, 320, 60);   // laisse la case du bouton Pause libre
      ctx.fillStyle = BK.sprites.UI.gold; BK.sprites.textWithCoin(ctx, 'SCORE ' + String(this.score).padStart(6, '0') + '   🪙 ' + (this.save.gold || 0), BK.W - 150, 30);
      ctx.fillStyle = BK.sprites.UI.text; ctx.font = 'bold 18px Nunito, sans-serif'; ctx.fillText(this.objectiveText() + '   ·   ' + '👤 × ' + this.lives, BK.W - 150, 56);
      ctx.textAlign = 'center'; BK.sprites.uiPanel(ctx, BK.W / 2 - 150, 12, 300, 36, { r: 12 });
      ctx.fillStyle = BK.sprites.UI.text; ctx.font = 'bold 18px Nunito, sans-serif'; ctx.fillText(s.id + ' · ' + s.name + (W.dayCycle ? '   ' + W.dayIcon() : ''), BK.W / 2, 30);
      if(this.challenge)BK.drawChallengeProgress(ctx,this.challenge,this);
      if (this.challenge && this.challenge.time) { const tl = Math.max(0, this.timeLeft), low = tl < 15; BK.sprites.uiPanel(ctx, BK.W / 2 - 60, 52, 120, 30, { r: 10, fill: low && Math.floor(this.stateT * 4) % 2 ? 'rgba(255,205,200,0.95)' : undefined }); ctx.fillStyle = low ? BK.sprites.UI.bad : BK.sprites.UI.gold; ctx.font = '900 20px Nunito, sans-serif'; ctx.fillText('⏱ ' + Math.floor(tl / 60) + ':' + String(Math.floor(tl % 60)).padStart(2, '0'), BK.W / 2, 67); }
      this.drawAllyPanel(ctx);
      this.drawBossHealth(ctx);
      if(p.swallowedBy||p.tongueSlow>0){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#49325f';BK.sprites.rr(ctx,BK.W/2-240,BK.H-185,480,p.swallowedBy?82:66,16);ctx.fill();ctx.fillStyle='#fff0a3';ctx.font='900 20px Nunito,sans-serif';ctx.fillText(p.swallowedBy?'🐸 Avalé ! Tapote vite 💣 / Espace !':'🐸 Langue collante : vitesse −80 %',BK.W/2,BK.H-162);ctx.font='bold 16px Nunito,sans-serif';ctx.fillStyle='#fff';ctx.fillText(p.swallowedBy?'Libération dans '+Math.ceil(p.swallowT)+' s · Chaque appui aide !':Math.ceil(p.tongueSlow)+' s restantes',BK.W/2,BK.H-137);if(p.swallowedBy){const bw=400,ratio=Math.max(0,Math.min(1,p.swallowT/(p.swallowMax||6)));ctx.fillStyle='#241b36';BK.sprites.rr(ctx,BK.W/2-bw/2,BK.H-121,bw,9,5);ctx.fill();if(ratio>0){ctx.fillStyle='#82e3b0';BK.sprites.rr(ctx,BK.W/2-bw/2,BK.H-121,bw*ratio,9,5);ctx.fill();}}ctx.restore();}
      BK.inventoryLayout(p); this.invRects = []; for (let i = 0; i < BK.QUICK_SIZE; i++) {   // huit raccourcis, touches 1–8 (Q/W pour les deux premiers)
        const x = BK.W / 2 - 252 + i * 64, y = BK.H - 76, sz = 56, slot = (p.inv || []).find(s => s.type === p.quickSlots[i]); this.invRects.push({ x, y, w: sz, h: sz, i });
        ctx.fillStyle = slot ? 'rgba(234,246,255,0.93)' : 'rgba(234,246,255,0.4)'; BK.sprites.rr(ctx, x, y, sz, sz, 14); ctx.fill(); ctx.strokeStyle = slot ? '#ffc53f' : 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; BK.sprites.rr(ctx, x, y, sz, sz, 14); ctx.stroke();
        ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#cfe3ff'; ctx.fillText(i === 0 ? '1 · Q' : i === 1 ? '2 · W' : String(i + 1), x + sz / 2, y - 10);
        if (slot) { ctx.save(); ctx.translate(x + sz/2,y + sz*0.75); BK.sprites.drawItem(ctx,slot.type,sz*0.7,0); ctx.restore(); if (!BK.ITEMS[slot.type].unique) { ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.arc(x + sz - 8, y + sz - 8, 13, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.font = '900 15px Nunito, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(slot.n, x + sz - 8, y + sz - 7); } }
      }
      if ((this.state === 'celebrate' || this.state === 'clear') && this.celebKind) this.drawBigTitle(ctx, this.state === 'clear' ? this.celebDur + 1 : this.stateT);
      BK.sprites.drawHelpBubble(ctx,this.msg,this.msgT);
      if (this.state === 'intro') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, BK.W, BK.H);
        ctx.fillStyle = '#ffd54a'; ctx.font = 'bold 54px Nunito, sans-serif'; ctx.fillText(s.world.name + '  ·  ' + s.id, BK.W / 2, BK.H / 2 - 90);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px Nunito, sans-serif'; ctx.fillText(s.name, BK.W / 2, BK.H / 2 - 30);
        ctx.font = '24px Nunito, sans-serif'; BK.wrapText(ctx, s.hint, BK.W / 2, BK.H / 2 + 30, 900, 32);
        ctx.font = 'bold 22px Nunito, sans-serif'; ctx.fillStyle = Math.sin(this.stateT * 6) > 0 ? '#fff' : '#aaa'; ctx.fillText('Appuie sur une touche pour commencer', BK.W / 2, BK.H / 2 + 140);
        ctx.fillStyle = '#ccc'; ctx.font = '18px Nunito, sans-serif'; ctx.fillText(BK.input.NAMES[0] + ' · deux fois la même direction = courir · I = sac · Tab = fiche', BK.W / 2, BK.H / 2 + 180);
      }
      ctx.restore();
    }
  }
  BK.Adventure = Adventure;
})(window.BK);
