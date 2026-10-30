// Simulation d'une vague : canon, boulets, ennemis, boss, cartes. Aucun accès au DOM (testable dans Node).
(function (CB) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Projection 3D → écran (x gauche/droite, y hauteur, z profondeur vers l'horizon). Le canon est en (0, 0, 0).
  // Mise en page de la scène selon la taille de la fenêtre (même recette que le prototype Canon Boom Boom) :
  // le héros est en bas au centre, l'horizon un peu au-dessus de la bouche du canon, les coéquipiers sur les côtés.
  CB.layout = (w, h) => {
    const size = Math.min(w * .16, h * .18), f = Math.min(w * .9, h * .85), fy = w < h ? Math.max(f, h * 1.5) : f;
    const ground = h - Math.max(26, size * .34), muzzle = ground - 1.55 * size, allySize = Math.min(w * .075, h * .105), allyOrigin = w * .12;
    const horizon = muzzle - 2.2 * fy / 18;
    // Zone où les monstres peuvent se trouver sans sortir de l'écran (mesurée à la profondeur z = 8, là où ils nous atteignent) :
    // demi-largeur et hauteur max en unités du monde. Même règle sur tous les appareils, donc tout le monde voit tous les monstres.
    const spread = Math.max(6, (w / 2 - 30) * 26 / f), spreadY = Math.max(8, (horizon - 40) * 26 / fy + 4);
    return { w, h, cx: w / 2, size, f, fy, ground, muzzle, horizon, allySize, allyOrigin, allyLift: w < h ? h * .08 : 0, allyX: -(w / 2 - allyOrigin - 1.05 * allySize) * 18 / f, spread, spreadY };
  };
  CB.VIEW = CB.layout(960, 640);
  CB.setView = (w, h) => { if (CB.VIEW.w !== w || CB.VIEW.h !== h) CB.VIEW = CB.layout(w, h); return CB.VIEW; };
  CB.project = p => { const V = CB.VIEW, k = p.z + 18; return { x: V.cx + p.x * V.f / k, y: V.horizon - (p.y - 4) * V.fy / k, scale: V.f / k }; };
  // Point d'écran -> coordonnées du monde à la profondeur donnée.
  CB.unproject = (x, y, depth) => { const V = CB.VIEW, k = depth + 18; return { x: (x - V.cx) * k / V.f, y: 4 - (y - V.horizon) * k / V.fy, z: depth }; };
  CB.clampAim = (x, y) => { const V = CB.VIEW; return { x: Math.max(16, Math.min(V.w - 16, x)), y: Math.max(16, Math.min(V.horizon + V.size * .5, y)) }; };
  CB.BASE_COOLDOWN = .8; CB.BASE_SPEED = 65; CB.BASE_HP = 50;

  // Stats de tir à partir du profil (améliorations, canon, niveau) et du talent du personnage.
  CB.stats = (profile, player) => {
    const P = CB.STAT_PER, up = k => (profile.upgrades?.[k] || 0) * P[k].upgrade, tal = k => (profile.talents?.[k] || 0) * P[k].talent, cannon = CB.CANNONS[profile.cannon] || CB.CANNONS.classique, cm = cannon.mods || {}, pm = player?.perk?.mods || {};
    const level = profile.level || 1;
    return {
      rate: (1 + up('cadence') + tal('cadence')) * (1 + (cm.rate || 0)) * (1 + (pm.rate || 0)),
      range: (1 + up('portee') + tal('portee')) * (1 + (cm.range || 0)) * (1 + (pm.range || 0)),
      damage: (1 + up('degats') + tal('degats')) * (1 + (cm.damage || 0)) * (1 + (pm.damage || 0)),
      maxHp: CB.BASE_HP + up('vie') + tal('vie') + (pm.hp || 0),
      gold: (1 + up('butin') + tal('butin')) * (1 + (cm.gold || 0)) * (1 + (pm.gold || 0)),
      goldFlat: 0,
      crit: up('critique') + tal('critique') + (cm.crit || 0) + (pm.crit || 0),
      level,
      fullCharge: !!(profile.items && profile.items.jaugePleine),   // objet unique « Jauge pleine »
      ally: profile.allyBought && profile.ally && profile.ally !== profile.id && CB.playerById(profile.ally) ? profile.ally : null,
      ally2: profile.ally2Bought && profile.ally2 && profile.ally2 !== profile.id && profile.ally2 !== profile.ally && CB.playerById(profile.ally2) ? profile.ally2 : null,
      towers: Math.min(CB.TOWER.max, profile.towers || 0), homing: Math.min(CB.HOMING.max, profile.homing || 0), sphere: !!(profile.items && profile.items.sphere), specialLevel: Math.max(1, Math.min(CB.SPECIAL_LEVELS.length, profile.specialLevel || 1)),
      regen: up('reparation') * 1,
      auto: true, // on tire en continu tant qu'on maintient ; c'est la cadence qui est lente au départ
      shots: 1 + (cannon.shots || 0),
      size: 1 + (pm.size || 0), // 1 = une bille ; la carte « Boulets géants » multiplie sans plafond ; Richard part à 2
      splash: 0, bounces: 0, lifesteal: 0,
      // combos secrets
      fan: false, siphon: 0, knock: 0, frostBounce: 0, cometCap: 0, odin: 0, midas: 0, blackhole: 0, anesthesie: 0, harvest: 0, rafale: 0,
      slow: pm.slow || 0, dodge: pm.dodge || 0, shield: pm.shield || 0,
      effects: Object.assign({}, profile.effects || {}),
      cannon: profile.cannon || 'classique', ball: profile.ball || 'fer',
    };
  };
  CB.comboMult = combo => Math.min(1.5, 1 + Math.floor(combo / 5) * .1);   // ×1,1 à 5 d'affilée… ×1,5 max
  CB.starsFor = (hp, maxHp) => hp >= maxHp * .7 ? 3 : hp >= maxHp * .35 ? 2 : 1;

  let nextId = 1;
  CB.Wave = class {
    // custom (optionnel) : tableau personnalisé (voir CB.Custom dans debug.js et CB.CUSTOM_WAVES dans custom-waves.js).
    constructor({ worldIndex = 0, waveIndex = 0, profile, player, random = Math.random, custom = null, carry = null }) {
      this.random = random; this.wi = worldIndex; this.vi = waveIndex; this.world = CB.WORLDS[worldIndex]; this.player = player || null;
      this.special = player && CB.SPECIALS[player.id] ? Object.assign({ id: player.id, name: player.perk.name, icon: player.perk.icon }, CB.SPECIALS[player.id]) : null;
      if (player && profile && profile.pirate && profile.usePirate) this.special = Object.assign({ id: 'pirate', name: CB.PIRATE.name, icon: CB.PIRATE.icon }, CB.SPECIALS.pirate);   // pouvoir pirate choisi au hangar à la place du sien
      const sid2 = profile && profile.slot2 && profile.special2, m2 = sid2 && CB.playerById(sid2); this.special2 = player && m2 && sid2 !== player.id && CB.SPECIALS[sid2] ? Object.assign({ id: sid2, name: m2.perk.name, icon: m2.perk.icon }, CB.SPECIALS[sid2]) : null; this.charge2 = 0;   // case vierge : un deuxième pouvoir, sa propre jauge
      this.spPower = 1; this.charge = 0; this.specialsUsed = 0; this.spUses = 0; this.spUses2 = 0;   // spPower : force de l'attaque spéciale selon son niveau au hangar (réglé après les stats)
      this.fx = { cheat: 0, slowmo: 0, rally: 0, ghost: 0, magnet: 0, laser: 0, tornado: 0, teleport: 0, licorne: 0, priere: 0, pika: 0, blizzard: 0, protect: 0, pirate: 0 }; this.pirates = null; this.pirateShots = 0; this.spirits = null; this.fxTick = 0; this.pikaTick = 0; this.blizzTick = 0; this.tornadoes = null; this.vortex = null; this.unicorn = null; this.angels = null; this.guest = null; this.flash = 0; // effets temporaires des attaques spéciales (secondes restantes)
      this.def = CB.waveDef(worldIndex, waveIndex);
      custom = custom || (window.CB.CUSTOM_WAVES || {})[this.world.id + '-' + (waveIndex + 1)] || null;
      if (custom) {
        this.custom = custom; const base = CB.worldById(custom.world) || this.world;
        this.world = Object.assign({}, base, { scene: custom.scene || base.id, sky: custom.sky || base.sky, ground: custom.ground || base.ground, space: !!custom.space, enemies: (custom.random && custom.random.enemies || []).filter(k => CB.ENEMIES[k]), boss: custom.boss || null });
        this.def = { world: worldIndex, index: waveIndex, type: custom.type || 'kill', goal: custom.goal || 10, seconds: custom.seconds || 40, density: custom.density || 1, name: custom.name || 'Tableau', text: custom.text || '', cibles: custom.cibles || null, brigands: custom.brigands || null };
        this.schedule = (custom.spawns || []).filter(s => CB.ENEMIES[s.type]).map(s => ({ type: s.type, elite: !!s.elite, every: Math.max(.05, +s.every || .5), interval: Math.max(.1, +s.interval || 5), count: Math.max(1, Math.round(+s.count || 1)), next: Math.max(0, +s.at || 0), left: Math.max(1, Math.round(+s.count || 1)), packsLeft: Math.max(1, Math.round(+s.packs || 1)) - 1 }));
        // séquence de l'éditeur : groupes ordonnés ; un groupe mélange ses sortes de monstres, et part quand le groupe d'avant est éliminé (ou à « at » s si précisé)
      }
      const seqSrc = this.custom ? (custom.sequence || []) : (this.def.sequence || null);   // séquence de groupes : éditeur, ou tableau officiel (ex. 1-3 : première vague de chauves-souris)
      if (seqSrc) {
        this.sequence = seqSrc.map((g, idx) => ({ idx, launched: false, spawned: [], kinds: (g.kinds || []).filter(k => k && (CB.ENEMIES[k.type] || (String(k.type).startsWith('boss:') && CB.BOSSES[k.type.slice(5)]))).map(k => ({ type: k.type, count: Math.max(1, Math.round(+k.count || 1)), elite: !!k.elite || !!g.elite })), every: g.every == null || g.every === '' || isNaN(+g.every) ? .6 : Math.max(0, +g.every), at: g.at == null || g.at === '' ? null : Math.max(0, +g.at), rel: g.rel == null || g.rel === '' || isNaN(+g.rel) ? null : +g.rel, elite: !!g.elite })).filter(g => g.kinds.length);
        this.seq = { i: 0, active: [], alive: [], clearAt: null, lastEnd: null, gap: CB.SEQUENCE_GAP };   // at : temps absolu ; rel : ± s par rapport à la fin des arrivées du groupe d'avant ; sinon après son élimination
      }
      this.stats = CB.stats(profile || CB.Save.blank('x'), player); if (this.stats.fullCharge && this.special) this.charge = 1; if (this.stats.fullCharge && this.special2) this.charge2 = 1;   // objet unique « Jauge pleine »
      for (const sp of [this.special, this.special2]) if (sp) { const lvl = this.stats.specialLevel, L = CB.SPECIAL_LEVELS[lvl - 1], base = CB.SPECIALS[sp.id]; sp.level = lvl; sp.power = L.power; this.spPower = L.power; sp.kills = Math.max(5, Math.round(base.kills * L.kills)); if (base.seconds) sp.seconds = base.levels && base.levels.seconds ? base.levels.seconds[lvl - 1] : +(base.seconds * L.dur).toFixed(1); }   // le niveau du hangar vaut pour les deux pouvoirs
      if (this.special && this.special.id === 'pirate') { this.special.ships = Math.max(1, Math.min(CB.PIRATE.max, (profile && profile.pirateLevel) || 1)); this.special.seconds = CB.SPECIALS.pirate.seconds; }   // le pirate a ses propres niveaux : un bateau par niveau, toujours 15 s
      this.ally2 = this.stats.ally2 ? this.makeAlly(this.stats.ally2, -1) : null;
      this.towers = []; for (let i = 0; i < this.stats.towers; i++) this.towers.push({ side: i === 0 ? -1 : 1, cooldown: 1.5 + i * .5, recoil: 0, shots: 0, aim: { x: CB.VIEW.cx, y: CB.VIEW.horizon * .6 } });
      this.sphere = this.stats.sphere ? { tick: 0, hit: 0, hits: 0 } : null;
      this.maxHp = this.stats.maxHp; this.hp = this.maxHp; this.shield = this.stats.shield;
      this.time = 0; this.intro = 2.2; this.kills = 0; this.gold = 0; this.xp = 0; this.shots = 0; this.hits = 0;
      this.enemies = []; this.balls = []; this.bursts = []; this.texts = []; this.cards = []; this.choice = null;
      this.spawn = .8; this.cooldown = 0; this.event = null; this.puzzle = null; this.stun = null; this.poison = 0; this.dark = 0; this.eventsSeen = 0; this.puzzlesSolved = 0; this.puzzleFails = 0; this.shieldsBroken = 0;
      this.nextEvent = Infinity; this.aim = { x: CB.VIEW.cx, y: CB.VIEW.horizon * .55 }; this.over = false; this.won = false; this.reason = '';
      this.lastElite = -99; this.combo = 0; this.comboTimer = 0; this.bestCombo = 0; this.boss = null; this.bossSpawned = false;
      this.bossFight = 0; this.bossHpLeft = null; this.bossActs = 0; // tableau de boss : acte en cours (0-2), PV qu'il lui reste entre deux actes, actes joués
      this.hurt = 0; this.regenTimer = 0; this.recoil = 0; this.lastEffect = null; this.elitesKilled = 0;
      this.ally = this.stats.ally ? this.makeAlly(this.stats.ally, 1) : null;
      const fam = id => (CB.playerById(id) || {}).family; this.familyBuff = !!(player && this.ally && this.ally2 && fam(this.ally.id) === player.family && fam(this.ally2.id) === player.family);
      if (this.familyBuff) { this.stats.rate *= 1 + CB.FAMILY_BUFF.rate; this.texts.push({ text: '🛡️ BONUS FAMILLE : +' + Math.round(CB.FAMILY_BUFF.rate * 100) + ' % DE CADENCE !', x: 0, y: 13, z: 18, age: -2.4, color: (CB.FAMILIES[player.family] || {}).color || '#ffd23f', big: true }); }
      // nuit sans fin
      this.seenBy = {}; this.killsBy = {}; this.boost = 0; this.boostTimer = 0;
      this.runXp = 0; this.runLevel = 1; this.pendingLevels = 0; // niveaux gagnés pendant la vague : chacun offre trois cartes
      this.E = this.def.endless === 'dinos' ? CB.ENDLESS_DINOS : CB.ENDLESS; // réglages du mode sans fin selon le tableau
      this.scenery = this.def.scene && CB.SCENERY[this.def.scene] ? Object.assign({}, this.world, CB.SCENERY[this.def.scene]) : null;
      this.miniBossDone = false; this.nextGift = Infinity; this.gifts = 0; this.crystalsBroken = 0;
      if (!this.custom && this.def.type !== 'cibles' && this.def.type !== 'brigands' && this.def.type !== 'boss' && this.def.type !== 'endless' && this.def.type !== 'swarm') { const [a, b] = CB.EVENTS.first; this.nextEvent = a + this.random() * (b - a); }   // pas dans la nuit sans fin ni la vallée : elles ont leurs propres secrets
      this.cibles = this.def.type === 'cibles' ? CB.minigame('cibles', this.def.cibles) : null; this.targetsHit = 0; this.targetsMissed = 0; this.targetsSpawned = 0; this.nextTarget = this.cibles ? 2 : Infinity; this.brigands = this.def.type === 'brigands' ? CB.minigame('brigands', this.def.brigands) : null; this.round = 0; this.brigandsHit = 0; this.civilsHit = 0; this.panels = null; this.nextRound = this.brigands ? 2.5 : Infinity; this.targetsBefore = (profile && profile.targetsHit) || 0; this.targetTimes = this.def.targets ? this.def.targets.at.slice() : null;
      this.swarm = this.def.type === 'swarm' ? this.def.swarm : null; this.nextBomb = this.swarm ? this.swarm.bombFrom : Infinity; this.bombs = 0; this.bombsDefused = 0; this.bombsExploded = 0;
      this.endless = this.def.type === 'endless'; this.discoveries = 0; this.discoveredBefore = (profile && profile.discovered) || 0; this.seen = []; this.news = []; this.nextChest = this.custom ? (+this.custom.chestEvery > 0 ? (+this.custom.chestAt > 0 ? +this.custom.chestAt : +this.custom.chestEvery) : Infinity) : this.E.chest ? this.E.chest.firstAt : Infinity; this.chestsSeen = 0;
      if (this.E.gift) this.nextGift = this.E.gift.firstAt;
      this.seenBefore = (profile && profile.seenBy) || {}; this.nightKillsBefore = (profile && profile.nightKills) || 0; this.board2Done = !!(profile && CB.Save.stars(profile, 'foret', 1) > 0); this.boatSecretBefore = !!(profile && profile.boatSecret); this.nextBoat = null; this.splashes = 0; this.bites = 0; this.px = 0; this.canDodge = !!(this.world.dodge || this.def.dodge); this.beam = null; this.nextShip = null; this.ships = 0; this.shipsSunk = 0; this.dodged = 0; this.pirateWorldWon = false; this.portalSeen = !!(profile && profile.portal); this.portal = null; this.portalSpawned = false; this.portalDone = false; this.secretFound = false;
      // Voyage par le portail : on garde les cartes, le niveau de la partie et la vie du tableau précédent.
      if (carry) { for (const k of carry.cards || []) if (CB.CARDS[k]) { this.cards.push(k); if (!CB.CARDS[k].instant) CB.CARDS[k].apply(this.stats, this, this.cardLevel(k)); } this.runLevel = carry.runLevel || 1; this.runXp = carry.runXp || 0; this.maxHp = this.stats.maxHp; this.shield = this.stats.shield; this.hp = Math.max(1, Math.round(this.maxHp * (carry.hpRatio == null ? 1 : carry.hpRatio))); this.news.push({ kind: 'discovery', text: 'BIENVENUE DANS LE PASSÉ : LA VALLÉE DES DINOSAURES', time: 0 }); }
    }
    // Monde des pirates : ◀ ▶ déplacent le canon sur le pont pour esquiver boulets et rayons (px = position en unités du monde)
    move(dir, dt) { if (!this.canDodge || this.over || this.stun || this.choice) return; const lim = Math.min(10, CB.VIEW.spread * .55); this.px = Math.max(-lim, Math.min(lim, this.px + dir * 16 * dt)); }
    get sea() { return this.def.scene === 'mer' || this.world.scene === 'mer'; }   // le tableau se joue sur l'eau (bateau pirate ou scène « mer » de l'éditeur)
    // Nageur arrivé à la coque : il reste là (tant qu'on ne l'a pas tué), bondit hors de l'eau vers le bateau et mord, avec éclaboussures.
    biteStep(e, dt) {
      const B = CB.SEA_BITE, b = e.bite || (e.bite = { timer: .5 + this.random() * 1.4, k: -1, hit: false }); e.baseX = e.x;
      const splash = () => { this.bursts.push({ x: e.x, y: 0, z: e.z, age: 0, kind: 'splash', size: .8 + e.size * .5, life: .8 }); this.splashes++; };
      if (b.k < 0) { e.z = B.z; e.jump = 0; b.timer -= dt; if (b.timer <= 0) { b.k = 0; b.hit = false; splash(); } return; }
      b.k += dt / B.dur; const k = Math.min(1, b.k), arc = Math.sin(k * Math.PI); e.jump = arc; e.z = B.z - arc * B.lunge;
      if (!b.hit && k >= .5) { b.hit = true; this.bites++; this.shake = Math.max(this.shake || 0, .45); this.bursts.push({ x: e.x, y: e.y + 1, z: e.z, age: 0, kind: 'crit', color: '#ff6b6b' }); this.texts.push({ text: 'CROC !', x: e.x, y: e.y + 4.5, z: e.z + 6, age: 0, color: '#ff6b6b' }); this.damage(Math.max(1, Math.round(e.damage * B.dmg)), e); }
      if (k >= 1) { b.k = -1; b.timer = B.every * (.75 + this.random() * .5); e.jump = 0; e.z = B.z; splash(); }
    }
    get runProgress() { return Math.min(1, this.runXp / CB.runXpFor(this.runLevel)); }
    // XP de la vague : à chaque niveau, un tirage de trois cartes (les niveaux en attente s'enchaînent).
    gainXp(n) {
      this.runXp += n; let need = CB.runXpFor(this.runLevel);
      while (this.runXp >= need) { this.runXp -= need; this.runLevel++; this.pendingLevels++; this.texts.push({ text: 'NIVEAU ' + this.runLevel + ' !', x: 0, y: 9, z: 20, age: 0, color: '#ffd23f' }); need = CB.runXpFor(this.runLevel); }
      if (this.pendingLevels > 0 && !this.choice && !this.over) this.offerCards();
    }
    get timeLeft() { return this.def.seconds != null && !this.swarm && (this.def.type === 'survive' || this.def.type === 'killTimed') ? Math.max(0, this.def.seconds - this.time) : null; }   // le compte à rebours seulement quand le temps compte
    get openEnded() { return this.endless || !!this.swarm; } // on peut arrêter quand on veut, les étoiles dépendent du temps
    get progress() { const d = this.def; if (d.type === 'sink') return Math.min(1, this.shipsSunk / d.goal); if (this.cibles) return Math.min(1, this.targetsHit / this.cibles.count); if (this.brigands) return Math.min(1, this.round / this.brigands.rounds); if (this.endless) { const E = this.E.chest; if (!E) return 0; const prev = this.chestsSeen ? E.firstAt + (this.chestsSeen - 1) * E.every : 0; return Math.min(1, (this.time - prev) / (this.nextChest - prev)); } if (d.type === 'kill' || d.type === 'killTimed') return Math.min(1, this.kills / d.goal); if (d.type === 'survive') return Math.min(1, this.time / d.seconds); if (this.boss) return 1 - this.boss.hp / this.boss.maxHp; return 0; }
    radiusOf(e) { return (e.boss ? e.size * 1.25 * CB.BOSS_SCALE : 2 + (e.size - 1) * 1.3) * (this._ballSize || 1); }
    // Profondeur visée : l'ennemi sous le réticule, sinon une distance moyenne.
    target() {
      let depth = 45, best = Infinity;
      for (const e of this.enemies) { const p = CB.project(e), d = Math.hypot(p.x - this.aim.x, p.y - this.aim.y); if (d < Math.max(28, p.scale * 2.3 * e.size * (e.boss ? CB.BOSS_SCALE : 1)) && d < best) { best = d; depth = e.boss ? e.z : e.z * 65 / (65 + e.speed); } }
      const t = depth / (CB.BASE_SPEED * this.stats.range);
      return Object.assign(CB.unproject(this.aim.x, this.aim.y, depth), { t });
    }
    rollEffect() { for (const [key, lvl] of Object.entries(this.stats.effects)) if (lvl > 0 && this.random() < lvl * CB.EFFECT_CHANCE) return key; return null; }
    // Lance un (ou plusieurs) boulets depuis la position x "origin" (0 = notre canon, CB.HELPER.x = le coéquipier).
    launch(origin, target, dmgMult = 1, ally = false) {
      const s = this.stats, t = target.t, vz = CB.BASE_SPEED * s.range, effect = this.rollEffect();
      const count = s.shots + (effect === 'etoiles' ? 2 : 0) + (this.fx.cheat > 0 ? 1 : 0), spread = (effect === 'etoiles' ? 3.2 : 2.4) * (s.fan ? 1.8 : 1);
      dmgMult *= (this.fx.rally > 0 ? 1 + this.spPower : 1) * (this.fx.ghost > 0 ? 1 + .5 * this.spPower : 1) * (this.fx.licorne > 0 ? 1 + this.spPower : 1);
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * spread, tx = target.x + off;
        this.balls.push({ x: origin, y: 1.8, z: 0, vx: (tx - origin) / t, vy: (target.y - 1.8 + 9 * t * t) / t, vz, trail: [], dmg: s.damage * dmgMult, size: s.size * (effect === 'bowling' ? 2.2 : 1) * (effect === 'etoiles' ? .8 : 1),
          pierce: effect === 'bowling' || this.fx.ghost > 0, splash: effect === 'feu' ? 6 : s.splash, chain: effect === 'eclair', freeze: effect === 'neige', effect, ally, disco: this.fx.licorne > 0, warp: this.fx.teleport > 0, ghost: this.fx.ghost > 0, hitIds: new Set(), bounced: false, age: 0 });
      }
      return effect;
    }
    fire() {
      if (this.over || this.choice || this.cooldown > 0 || this.stun) return false;
      this.lastEffect = this.launch(this.px, this.target()); this.cooldown = CB.BASE_COOLDOWN / this.stats.rate / (this.fx.slowmo > 0 ? 2.5 : 1); this.shots++; this.recoil = 1;
      return true;
    }
    // La licorne d'Alexie : vole en huit devant la scène pendant 15 s et lance des rayons arc-en-ciel sur les monstres.
    updateUnicorn(dt) {
      const u = this.unicorn; u.age += dt;
      if (!(this.fx.licorne > 0)) { this.unicorn = null; this.texts.push({ text: '🦄 AU REVOIR !', x: u.x, y: u.y + 3, z: u.z, age: 0, color: '#ff9ad5' }); return; }
      const nx = Math.sin(u.age * .75) * 26; u.dir = nx >= u.x ? 1 : -1; u.x = nx; u.y = 15 + Math.sin(u.age * 2.2) * 2.2; u.z = 38 + Math.cos(u.age * .5) * 10;
      u.cooldown -= dt; if (u.cooldown > 0) return;
      const live = this.enemies.filter(e => !e.dead && !e.escaped && !e.def.crystal && !e.def.gift && !e.def.chest && !e.def.portal && !e.def.hazard);
      if (!live.length) { u.cooldown = .3; return; }
      const e = live[Math.floor(this.random() * live.length)]; u.cooldown = .8; u.shots++;
      this.bursts.push({ x: u.x + u.dir * 3, y: u.y + 1.5, z: u.z, to: { x: e.x, y: e.y, z: e.z }, age: 0, kind: 'rainbow', life: .5 });
      this.applyDamage(e, this.stats.damage * 1.5 * this.spPower, false, 'licorne');
    }
    makeAlly(id, side) { const m = CB.playerById(id); return { id, side, cooldown: 1.2 + (side < 0 ? .6 : 0), recoil: 0, aim: { x: side > 0 ? CB.VIEW.allyOrigin : CB.VIEW.w - CB.VIEW.allyOrigin, y: CB.VIEW.horizon * .55 }, shots: 0, specials: 0, nextSpecial: CB.HELPER.specialFirst + (side < 0 ? 15 : 0), special: CB.SPECIALS[id] ? Object.assign({ id, name: m.perk.name, icon: m.perk.icon }, CB.SPECIALS[id]) : null }; }
    // Les tours de défense tirent toutes seules sur le monstre le plus proche, depuis chaque côté du canon.
    updateTowers(dt) {
      const s = this.stats; let best = null; for (const e of this.enemies) if (!e.dead && !e.escaped && e.z > 4 && !e.def.orb && (!best || e.z < best.z)) best = e;
      for (const tw of this.towers) { tw.cooldown = Math.max(0, tw.cooldown - dt); tw.recoil = Math.max(0, tw.recoil - dt * 4); if (!best) continue; const p = CB.project(best); tw.aim.x += (p.x - tw.aim.x) * Math.min(1, dt * 5); tw.aim.y += (p.y - tw.aim.y) * Math.min(1, dt * 5);
        if (tw.cooldown > 0 || this.time < this.intro) continue; const depth = best.boss ? best.z : best.z * 65 / (65 + best.speed), t = depth / (CB.BASE_SPEED * s.range);
        this.launch(tw.side * 7, { x: best.x, y: best.y, z: depth, t }, CB.TOWER.damage, true); tw.cooldown = CB.BASE_COOLDOWN * CB.TOWER.cooldown / s.rate; tw.recoil = 1; tw.shots++; }
    }
    // La sphère protectrice brûle et repousse tout monstre qui s'approche trop du canon.
    updateSphere(dt) {
      const sp = this.sphere; sp.tick -= dt; sp.hit = Math.max(0, sp.hit - dt * 3); if (sp.tick > 0) return; sp.tick = .35;
      for (const e of this.enemies) { if (e.dead || e.escaped || e.boss || this.isDecor(e) || e.swept || e.warp || e.z >= 11) continue; sp.hits++; sp.hit = 1; e.z += 2; e.baseX = e.x; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'crit', color: '#c47dff' }); this.applyDamage(e, this.stats.damage * .6, false, 'sphere'); }
    }
    // Le coéquipier vise l'ennemi le plus proche et tire dès qu'il est rechargé.
    updateAlly(dt, a = this.ally) {
      const s = this.stats, ox = a.side > 0 ? CB.VIEW.allyX : -CB.VIEW.allyX; a.cooldown = Math.max(0, a.cooldown - dt); a.recoil = Math.max(0, a.recoil - dt * 4);
      let best = null; for (const e of this.enemies) if (!e.dead && !e.escaped && e.z > 4 && (!best || e.z < best.z)) best = e;
      if (!best) return;
      if (a.special && this.time >= a.nextSpecial && this.time >= this.intro) { a.nextSpecial = this.time + CB.HELPER.specialEvery; a.specials++; this.lastAllySpecial = a.id; this.castSpecial(a.special, ox, true); }
      const p = CB.project(best); a.aim.x += (p.x - a.aim.x) * Math.min(1, dt * 6); a.aim.y += (p.y - a.aim.y) * Math.min(1, dt * 6);
      if (a.cooldown > 0 || this.time < this.intro) return;
      const depth = best.boss ? best.z : best.z * 65 / (65 + best.speed), t = depth / (CB.BASE_SPEED * s.range);
      this.launch(ox, { x: best.x, y: best.y, z: depth, t }, CB.HELPER.damage, true); a.cooldown = CB.BASE_COOLDOWN / s.rate; a.recoil = 1; a.shots++;
    }
    // Multiplicateur de PV du moment : tableau personnalisé, et montée progressive de la nuit sans fin.
    hpMult() { const E = this.E, R = this.def.ramp; return ((this.custom || {}).hpScale || 1) * (this.endless ? 1 + Math.floor(this.time / E.hpRamp) * E.hpPerRamp : 1) * (R && !this.custom ? 1 + Math.floor(this.time / R.every) * R.hp : 1); }   // def.ramp : de plus en plus forts
    spawnEnemy(type, at, forceElite, tier = 0) {
      const def = CB.ENEMIES[type], r = this.random, wi = this.wi, cs = this.custom || {}, T = CB.TIERS[tier] || CB.TIERS[0];
      const elite = forceElite != null ? (forceElite && !def.noElite) : !def.noElite && !at && this.time > 8 && this.time - this.lastElite > 11 && !this.enemies.some(e => e.elite) && r() < .13;
      if (elite) this.lastElite = this.time;
      // grosses versions (2× plus grosses, 2× plus résistantes) : seulement les apparitions naturelles ; dans la nuée, de plus en plus souvent
      const big = !!def.big && !at && forceElite === undefined && r() < def.big.chance * (this.swarm ? .5 + 1.5 * Math.min(1, this.time / this.def.seconds) : 1);
      const e = { id: nextId++, type, def, elite, tier, big, name: (elite ? def.variant.name : big ? def.big.name : def.name) + (T.name ? ' ' + T.name : ''), color: elite ? def.variant.color : (T.color || def.color), size: def.size * (elite ? 1.25 : 1) * (tier ? 1 + tier * .08 : 1) * (big ? def.big.size : 1),
        hp: def.hp * CB.hpScale(wi) * this.hpMult() * T.hp * (elite ? 3 : 1) * (big ? def.big.hp : 1), speed: def.speed * CB.speedScale(wi) * (cs.speedScale || 1) * T.speed * (.9 + r() * .25) * (elite ? 1.15 : 1) * (this.def.night && !def.shot ? this.def.night.speed : 1) * (this.def.ramp && !this.custom && !def.shot ? 1 + Math.floor(this.time / this.def.ramp.every) * this.def.ramp.speed : 1) * (this.swarm && this.swarm.ramp && !def.hazard ? 1 + this.swarm.ramp.speed * Math.min(1, this.time / this.def.seconds) : 1), damage: def.damage,
        x: 0, baseX: 0, y: 0, baseY: 0, z: at ? at.z : 80 + r() * 12, phase: r() * 6.28, age: 0, frozen: 0, amp: Math.min(1, CB.VIEW.spread / 22) };
      // Position : parfois (35 %) les monstres arrivent très larges, jusqu'au bord de la zone visible ; sinon plus groupés au centre.
      // la nuée : les chauves-souris arrivent de plus en plus éparpillées (de 35 % à 100 % de la zone en 5 minutes)
      const scatter = this.swarm ? Math.min(1, .35 + .65 * this.time / this.def.seconds) : 1;
      const cone = Math.max(.2, Math.min(1, +cs.spread || 1));   // éditeur : largeur du cône d'apparition (100 % = toute la zone visible, jamais plus : rien ne sort de l'écran)
      { const V = CB.VIEW, wide = r() < .35, sx = V.spread * (wide ? 1 : .6) * scatter * cone, sy = Math.min(17, V.spreadY), margin = 9 * e.amp;
        e.x = at ? at.x : (r() - .5) * 2 * sx; e.baseX = at ? at.x : Math.max(-V.spread + margin, Math.min(V.spread - margin, e.x * .85));
        e.y = at ? at.y : 4 + r() * (sy - 4); e.baseY = at ? e.y : 4 + r() * (sy - 4); }
      if (this.def.giant && !at && !this.isDecor(e)) { e.size *= this.def.giant.size; e.hp *= this.def.giant.hp; }   // géants de la mer
      if (this.def.scene === 'mer' && !at && !this.isDecor(e)) { const fly = !def.swim && (!!def.strafe || type === 'archeopteryx' || type === 'bat'); e.y = e.baseY = fly ? 9 + r() * 6 : def.swim ? .3 + r() * .4 : 2.5 + r() * 2.5; }   // nageurs : le corps à la ligne d'eau (y ≈ 0), à moitié immergé   // sur l'eau, ou dans les airs pour les volants
      e.maxHp = e.hp; if (at) e.baseX = at.x;
      if (def.shot) { e.x = at.x; e.y = at.y; e.tx = this.px || 0; }   // un tir vise là où est le canon au moment du départ : on peut s'en tasser
      if (def.chest) { e.y = 4 + r() * 6; e.z = 95; }
      if (def.hazard) { e.z = at ? at.z : 26 + r() * 10; e.fuse = def.fuse; e.speed = 0; }
      if (def.crystal) { e.speed = 0; if (!at) e.z = 30 + r() * 14; }
      if (def.gift) { e.y = 5 + r() * 5; e.z = 92; }
      const decor = def.chest || def.shot || def.gift || def.crystal || def.hazard || def.target; // pas des monstres : ni bestiaire, ni annonce
      if (!decor) this.seenBy[type] = (this.seenBy[type] || 0) + 1;
      if (this.endless && !decor && !this.seen.includes(type)) { this.seen.push(type); if (!(this.seenBefore[type] > 0)) this.news.push({ kind: 'monster', text: 'NOUVEAU MONSTRE : ' + def.name.toUpperCase(), time: this.time }); }
      this.enemies.push(e); return e;
    }
    // Nuit sans fin : choix du style (les derniers débloqués sont favorisés) et du palier de couleur selon le temps.
    pickEndless(timeScale = 1) {
      const E = this.E, r = this.random, avail = E.roster.filter((k, i) => E.firstAt[i] <= this.time * timeScale && CB.ENEMIES[k]);
      if (timeScale !== 1) return { type: avail[Math.min(avail.length - 1, Math.floor(Math.pow(r(), .65) * avail.length))] || 'bat', tier: 0 }; // tableaux « nuit accélérée » : pas de paliers de couleur
      const type = avail[Math.min(avail.length - 1, Math.floor(Math.pow(r(), .65) * avail.length))] || 'bat';
      let tier = 0; for (let ti = CB.TIERS.length - 1; ti >= 1; ti--) { const p = Math.min(E.tierMax[ti], Math.max(0, (this.time - E.tierFrom[ti]) / E.tierRamp[ti]) * E.tierMax[ti]); if (this.time >= E.tierFrom[ti] && r() < p) { tier = ti; break; } }
      return { type, tier };
    }
    discover(e) {
      this.discoveries++; this.chestsFound = (this.chestsFound || 0) + 1; const s = this.stats;
      const gold = (CB.goldBase(this.wi) + e.def.gold) * s.gold * 2; this.gold += gold; this.xp += 10; this.gainXp(10);
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ffd23f', size: 2 });
      const left = this.E.maxDiscoveries - Math.min(this.E.maxDiscoveries, (this.discoveredBefore || 0) + this.discoveries);
      this.texts.push({ text: 'DÉCOUVERTE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f' });
      const reveals = left >= 0 && (this.discoveredBefore || 0) + this.discoveries <= this.E.maxDiscoveries;
      this.news.push({ kind: 'discovery', text: 'COFFRE MYSTÈRE : +' + Math.round(gold) + ' PIÈCES', time: this.time });   // rien n'annonce les nouveaux tableaux (sauf le portail vers le passé) : on les découvre sur la carte
    }
    // Le coffre doré touché : un portail bleu s'ouvre, les monstres disparaissent, puis on est transporté dans le passé (finish 'portail').
    openPortal(e) {
      if (this.portal) return; this.portal = { t: 0, x: e.x, y: e.y, z: e.z }; e.dead = true;
      for (const o of this.enemies) if (!o.boss) o.dead = true;
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#7fd4ff', size: 3 });
      this.texts.push({ text: 'UN PORTAIL S’OUVRE !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#8fd6ff' });
      this.news.push({ kind: 'discovery', text: '🌀 UN PORTAIL VERS LE PASSÉ S’OUVRE !', time: this.time });
    }
    // KABOOM : la fusée de Zachary explose en malade. Gros dégâts dans un grand rayon, boule de feu, onde de choc, secousse.
    kaboom(ball) {
      if (ball.hit) return; ball.hit = true; const s = this.stats, R0 = 16, x = ball.x, y = ball.y, z = ball.z;
      let touched = 0; for (const e of this.enemies) { if (e.dead || e.escaped) continue; const d = Math.hypot(e.x - x, e.y - y, e.z - z); if (d < R0) { touched++; this.hits++; this.applyDamage(e, ball.dmg * (1 - .5 * d / R0), true, 'fusee'); if (!e.dead && !e.boss) e.z += 6; } }
      this.kabooms = (this.kabooms || 0) + 1; this.shake = 1.2;
      this.bursts.push({ x, y, z, age: 0, kind: 'kaboom', color: '#ff8c2a', size: R0, life: 1.4 });
      for (let i = 0; i < 6; i++) this.bursts.push({ x: x + (this.random() - .5) * 10, y: y + (this.random() - .5) * 6, z: z + (this.random() - .5) * 10, age: -i * .08, kind: 'boom', color: i % 2 ? '#ffd23f' : '#ff5a1a', size: 2.5 + this.random() * 2 });
      this.texts.push({ text: 'KABOOOOM !!!', x, y: y + 6, z, age: 0, color: '#ffd23f', big: true });
      if (touched) this.texts.push({ text: touched + ' TOUCHÉS', x, y: y + 2, z, age: -.3, color: '#fff' });
    }
    // Esprits d'Eliott : trois petits fantômes qui foncent sur un monstre, le font fuir (« BOUH ! ») et le blessent.
    updateSpirits(dt) {
      if (!(this.fx.ghost > 0)) { this.spirits = null; return; }
      for (const sp of this.spirits) {
        sp.age += dt; sp.cooldown -= dt;
        if (!sp.target || sp.target.dead || sp.target.escaped) { sp.target = null; const live = this.enemies.filter(e => !e.dead && !e.escaped && !e.boss && !e.swept && !e.warp && !this.isDecor(e) && !e.spooked); if (live.length && sp.cooldown <= 0) sp.target = live[Math.floor(this.random() * live.length)]; }
        if (!sp.target) { sp.x += (Math.sin(sp.age * 1.5) * 14 - sp.x) * dt * 2; sp.y += (7 + Math.sin(sp.age * 2.3) * 2 - sp.y) * dt * 2; sp.z += (14 - sp.z) * dt * 2; continue; }
        const e = sp.target, k = Math.min(1, dt * 5); sp.x += (e.x - sp.x) * k; sp.y += (e.y + 1 - sp.y) * k; sp.z += (e.z - sp.z) * k;
        if (Math.hypot(e.x - sp.x, e.y - sp.y, e.z - sp.z) < 2.5) { e.spooked = true; e.z = Math.min(110, e.z + 18); e.baseX = e.x; e.frozen = Math.max(e.frozen, .6); this.bursts.push({ x: e.x, y: e.y, z: e.z - 18, age: 0, kind: 'boom', color: '#dfe9ff', size: 2 }); this.texts.push({ text: 'BOUH !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#dfe9ff' }); this.applyDamage(e, this.stats.damage * 1.5, false, 'bouh'); sp.target = null; sp.cooldown = 1.1; sp.spooks = (sp.spooks || 0) + 1; }
      }
    }
    // Mini-jeu : une cible ailée entre par un côté, à une hauteur et une profondeur au hasard, et traverse en battant des ailes.
    // Mini-jeu du brigand : trois panneaux se lèvent (gauche, milieu, droite, pas trop écartés), un brigand et deux civils, puis redescendent
    spawnRound() {
      const B = this.brigands, r = this.random, k = this.round / Math.max(1, B.rounds - 1), show = B.show[0] + (B.show[1] - B.show[0]) * k, n = Math.max(1, Math.round(B.panels || 3)), nb = Math.max(1, Math.min(n, Math.round(B.bads || 1)));
      const idx = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const bads = new Set(idx.slice(0, nb));
      const badFace = CB.ENEMIES[B.bad] ? B.bad : 'brigand', goodFace = CB.ENEMIES[B.good] ? B.good : 'civil', sp = B.spacing == null ? 11 : B.spacing;
      this.panels = []; for (let i = 0; i < n; i++) { const bad = bads.has(i), e = this.spawnEnemy(bad ? 'brigand' : 'civil', { x: (i - (n - 1) / 2) * sp, y: B.y == null ? 3.2 : B.y, z: B.z == null ? 28 : B.z }); e.panel = { life: show, age: 0, up: 0, rise: B.rise || .35 }; e.look = (i + this.round) % 2; const face = bad ? badFace : goodFace; if (face !== e.type) e.face = face; this.panels.push(e); }
      this.round++; this.texts.push({ text: 'ROUND ' + this.round + ' / ' + B.rounds, x: 0, y: 13, z: 20, age: 0, color: '#ffd23f' }); return this.panels;
    }
    endRoundCheck() {
      if (!this.panels || !this.panels.every(e => e.dead || e.escaped)) return;
      const bad = this.panels.find(e => e.def.bad && !e.dead); if (bad) this.texts.push({ text: bad.face ? 'IL S’EST SAUVÉ !' : 'LE BRIGAND S’EST SAUVÉ !', x: 0, y: 11, z: 20, age: 0, color: '#ff8c2a' });
      this.panels = null; this.nextRound = this.time + this.brigands.gap;
    }
    spawnFlyer() {
      const C = this.cibles, r = this.random, V = CB.VIEW, k = this.targetsSpawned / Math.max(1, C.count - 1), mix = (a, q) => a[0] + (a[1] - a[0]) * q;
      const side = C.side === 'gauche' ? 1 : C.side === 'droite' ? -1 : r() < .5 ? -1 : 1, kind = CB.ENEMIES[C.kind] ? C.kind : 'cibleAilee';
      const e = this.spawnEnemy(kind, { x: -side * (V.spread + 8), y: Math.max(1, Math.min(V.spreadY - 1, mix(C.height, r()))), z: Math.max(8, mix(C.depth, r())) });
      if (!e.def.target) { e.hp = e.maxHp = 1; e.target = true; e.flyer = true; e.speed = 0; }   // n'importe quel monstre peut servir de cible : un seul tir suffit
      e.vx = side * mix(C.speed, k) * (.85 + r() * .3); e.baseY = e.y; e.baseZ = e.z; e.move = C.move; this.targetsSpawned++; return e;   // de plus en plus vite
    }
    // Vol d'une cible selon son déplacement : vagues, tout droit, zigzag, rebonds, piqués ou spirale ; sortie de l'écran = ratée
    flyStep(e, dt) {
      const a = e.age, m = e.move || 'vagues'; e.x += e.vx * dt;
      if (m === 'droit') e.y = e.baseY;
      else if (m === 'zigzag') e.y = e.baseY + (Math.abs(((a * 1.4 + e.phase / 6.28) % 2) - 1) * 2 - 1) * 3;
      else if (m === 'rebond') e.y = e.baseY + Math.abs(Math.sin(a * 2.6 + e.phase)) * 4;
      else if (m === 'piquee') e.y = Math.max(1, e.baseY - Math.max(0, Math.sin(a * 1.3 + e.phase)) * 5);
      else if (m === 'spirale') { e.y = e.baseY + Math.sin(a * 3 + e.phase) * 2; e.z = e.baseZ + Math.cos(a * 3 + e.phase) * 6; }
      else { e.y = e.baseY + Math.sin(a * 3 + e.phase) * 1.5; e.z += Math.sin(a * 1.7 + e.phase) * dt * 4; }
      if (Math.abs(e.x) > CB.VIEW.spread + 10) { e.escaped = true; this.targetsMissed++; }
    }
    // Monstres d'un monde : les trois premiers de la liste tout le temps ; les spéciaux (cracheurs, soigneurs, contact) seulement
    // à partir du deuxième tableau du monde, après 25 s et une fois sur quatre, pour que ça reste un jeu d'enfant.
    pickWorldEnemy() { if (this.def.roster) return this.def.roster[Math.floor(this.random() * this.def.roster.length)]; const list = this.world.enemies, base = list.slice(0, 3), extra = list.slice(3), r = this.random; if (extra.length && this.vi >= 1 && this.time > 25 && r() < .25) return extra[Math.floor(r() * extra.length)]; return base[Math.floor(r() * base.length)]; }
    isDecor(e) { const d = e.def; return !!(e.target === true || d.crystal || d.gift || d.chest || d.portal || d.hazard || d.shot || d.target || d.shieldAll || d.orb || d.panel || d.secretBoat); }
    // ---------- Événements loufoques ----------
    triggerEvent(kind) {
      const r = this.random; this.eventsSeen++; this.lastEvent = kind;
      if (kind === 'boucliers') { const n = 2 + (r() < .5 ? 1 : 0); for (let i = 0; i < n; i++) { const e = this.spawnEnemy('bouclier', { x: (i - (n - 1) / 2) * 10 + (r() - .5) * 3, y: 5 + r() * 5, z: 22 + r() * 6 }); e.hp = e.maxHp = 3 + this.wi * 2; } this.news.push({ kind: 'discovery', text: 'BOUCLIERS MAGIQUES ! CASSE-LES, SINON LES MONSTRES SONT PROTÉGÉS', time: this.time }); this.texts.push({ text: '🛡️ BOUCLIERS !', x: 0, y: 13, z: 20, age: 0, color: '#4fc3ff', big: true }); }
      else if (kind === 'bombeSurprise') { const e = this.spawnEnemy('bombeMagique', { x: (r() - .5) * 8, y: 4.5, z: 9 }); e.fuse = 2.5; this.shake = Math.max(this.shake || 0, .4); this.texts.push({ text: '💣 BOMBE SURPRISE !', x: 0, y: 10, z: 12, age: 0, color: '#b14fff', big: true }); }
      else if (kind === 'puzzle') { const order = [1, 2, 3].sort(() => r() - .5); const orbs = order.map((num, i) => { const e = this.spawnEnemy('orbe', { x: (i - 1) * 11, y: 9 + (r() - .5) * 3, z: 28 }); e.num = num; e.done = false; return e; }); this.puzzle = { orbs, next: 1, time: 14 }; this.news.push({ kind: 'discovery', text: 'PUZZLE ! TIRE SUR 1, 2 PUIS 3 AVANT LA FIN DU TEMPS', time: this.time }); this.texts.push({ text: '🧩 TIRE 1, 2, 3 DANS L’ORDRE !', x: 0, y: 14, z: 28, age: 0, color: '#ffd23f', big: true }); }
    }
    puzzleHit(e) {
      const p = this.puzzle; if (!p || e.done) return;
      if (e.num === p.next) { e.done = true; e.flash = .2; p.next++; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'crit', color: '#ffd23f' }); this.texts.push({ text: e.num + ' ✔', x: e.x, y: e.y + 2.5, z: e.z, age: 0, color: '#7dff9a' }); if (p.next > 3) this.endPuzzle(true); }
      else { this.puzzleFails++; for (const o of p.orbs) { o.done = false; o.flash = .3; } p.next = 1; this.texts.push({ text: 'OUPS ! RECOMMENCE : 1, 2, 3', x: 0, y: 13, z: 28, age: 0, color: '#ff6b6b' }); }
    }
    endPuzzle(ok) {
      const p = this.puzzle; this.puzzle = null; for (const o of p.orbs) { o.dead = true; this.bursts.push({ x: o.x, y: o.y, z: o.z, age: 0, kind: ok ? 'boom' : 'pop', color: '#ffd23f', size: 2 }); }
      if (ok) { const g = 15 * (this.wi + 1); this.gold += g; this.gainXp(8 * (this.wi + 1)); this.puzzlesSolved++; this.texts.push({ text: '🧩 PUZZLE RÉUSSI ! +' + g, x: 0, y: 12, z: 24, age: 0, color: '#ffd23f', big: true }); }
      else this.texts.push({ text: 'TROP TARD !', x: 0, y: 12, z: 24, age: 0, color: '#ff6b6b', big: true });
    }
    // ---------- Étourdissements et états ----------
    stunBy(kind, from) {
      if (this.stun || this.fx.priere > 0 || this.fx.ghost > 0 || this.fx.teleport > 0 || this.fx.protect > 0) return false;
      if (this.shield > 0) { this.shield--; this.hurt = .3; this.texts.push({ text: 'BOUCLIER', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      const st = CB.STUN[kind]; this.stun = { kind, need: st.need, taps: 0, time: st.seconds, total: st.seconds }; this.hurt = .4; this.shake = Math.max(this.shake || 0, .5); this.combo = 0;
      this.texts.push({ text: st.name, x: 0, y: 10, z: 10, age: 0, color: st.color, big: true }); this.texts.push({ text: 'TAPE VITE SUR TIRER !', x: 0, y: 7, z: 8, age: -.5, color: '#fff' });
      return true;
    }
    mash() { const st = this.stun; if (!st) return false; st.taps++; this.bursts.push({ x: (this.random() - .5) * 6, y: 2 + this.random() * 3, z: 2, age: 0, kind: st.kind === 'ice' ? 'ice' : 'crit', size: 2 }); if (st.taps >= st.need) this.freeStun('LIBRE !'); return true; }
    freeStun(text) { if (!this.stun) return; const k = this.stun.kind; this.stun = null; this.bursts.push({ x: 0, y: 3, z: 3, age: 0, kind: k === 'ice' ? 'ice' : 'boom', color: k === 'ice' ? '#a9e9ff' : '#ffe76c', size: 6 }); this.texts.push({ text, x: 0, y: 8, z: 8, age: 0, color: '#7dff9a', big: true }); }
    afflict(kind, from) {
      if (this.fx.priere > 0 || this.fx.ghost > 0 || this.fx.teleport > 0 || this.fx.protect > 0) return false;
      if (this.shield > 0) { this.shield--; this.hurt = .3; this.texts.push({ text: 'BOUCLIER', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      if (kind === 'poison') { this.poison = 5; this.hurt = .4; this.texts.push({ text: '🤢 EMPOISONNÉ !', x: 0, y: 9, z: 10, age: 0, color: '#7dff3a', big: true }); }
      else if (kind === 'dark') { this.dark = 4; this.texts.push({ text: '🌑 MAGIE NOIRE !', x: 0, y: 9, z: 10, age: 0, color: '#c47dff', big: true }); }
      return true;
    }
    // Tornades d'Edison : trois entonnoirs géants qui grandissent, aspirent les monstres, les font tournoyer et les envoient au loin (fondu, morts).
    updateTornadoes(dt) {
      if (!(this.fx.tornado > 0)) { for (const e of this.enemies) if (e.swept && !e.dead) { e.alpha = 0; e.killedBy = 'tornade'; this.kill(e); } this.tornadoes = null; return; }
      for (const T of this.tornadoes) { T.age += dt; T.grow = Math.max(0, Math.min(1, T.age / 1.5)); }
      for (const e of this.enemies) {
        if (e.dead || e.escaped || e.boss || e.swept || e.warp || this.isDecor(e) || e.z < 4) continue;
        let best = null, bd = Infinity; for (const T of this.tornadoes) { if (T.grow <= 0) continue; const d = Math.hypot(T.x - e.x, (T.z - e.z) * .5); if (d < bd) { bd = d; best = T; } }
        if (!best) continue;
        const pull = (14 + 10 * best.grow) * dt; e.x += Math.sign(best.x - e.x) * Math.min(Math.abs(best.x - e.x), pull); e.z += (best.z - e.z) * Math.min(1, dt * 1.4 * best.grow); e.baseX = e.x;
        if (bd < 6 + 12 * best.grow) { e.swept = { T: best, age: 0, r: 3 + this.random() * 2, y0: e.y }; e.frozen = 0; }
      }
    }
    sweepStep(e, dt) {
      const sw = e.swept, T = sw.T; sw.age += dt; const r = sw.r + sw.age * 2.2, a = sw.age * 9 + sw.r;
      e.x = T.x + Math.cos(a) * r; e.z = T.z + Math.sin(a) * r * .5; e.y = sw.y0 + sw.age * 7;
      if (sw.age > 2.4) { e.alpha = Math.max(0, 1 - (sw.age - 2.4) / .7); if (e.alpha <= 0 && !e.dead) { e.killedBy = 'tornade'; this.texts.push({ text: 'BYE BYE !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#dfe9ff' }); this.kill(e); } }
    }
    // Vortex de Jérémie : les monstres spiralent vers le vortex en rétrécissant, puis réapparaissent loin derrière, figés.
    warpStep(e, dt) {
      const w = e.warp, V = this.vortex || { x: 0, y: 17, z: 48 }; w.age += dt; const k = Math.min(1, w.age / 1.2), ease = k * k, r = 6 * (1 - ease), a = w.age * 10;
      e.x = w.x0 + (V.x - w.x0) * ease + Math.cos(a) * r; e.y = w.y0 + (V.y - w.y0) * ease + Math.sin(a) * r * .5; e.z = w.z0 + (V.z - w.z0) * ease; e.warpScale = 1 - .85 * ease; e.baseX = e.x;
      if (k >= 1) { this.bursts.push({ x: V.x, y: V.y, z: V.z, age: 0, kind: 'ice', size: 5 }); e.x = w.x0; e.baseX = w.x0; e.y = w.y0; e.z = Math.min(110, w.z0 + 70); e.frozen = Math.max(e.frozen, 2.5); e.warp = null; e.warpScale = 1; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 3 }); }
    }
    // Zoom-zoom de Milo : intensité du focus (monte en 0,3 s, redescend sur la dernière seconde) et coup de punch du départ.
    get zoomFx() { const total = (this.spOf('milo') || {}).seconds || 8, left = this.fx.slowmo, el = total - left; return { k: Math.min(1, el * 3.3, left), punch: Math.max(0, 1 - el / .45) }; }
    get laserGrow() { const sp = this.spOf('mickael'), total = (sp && sp.seconds) || 10, max = sp && CB.SPECIALS.mickael.levels ? CB.SPECIALS.mickael.levels.grow[(sp.level || 1) - 1] : 1; return (.2 + .8 * Math.min(1, (total - this.fx.laser) / 2.5)) * max; }   // le laser part petit et grossit sur 2,5 s ; sa taille maximale dépend du niveau
    get laserLevel() { const sp = this.spOf('mickael'); return sp ? (sp.level || 1) : 2; }
    get specialReady() { return !!this.special && this.charge >= 1 && !this.specialBusy; }
    spNeed(sp, uses) { return sp.kills * CB.xpPerKill(this.wi) * Math.min(4, Math.pow(CB.SPECIAL_RAMP, uses || 0)); }   // XP à accumuler : « kills » monstres ordinaires du monde, puis de plus en plus
    spOf(id) { return [this.special, this.special2].find(x => x && x.id === id) || null; }   // le pouvoir (principal ou de la case) qui porte cet id
    get special2Ready() { return !!this.special2 && this.charge2 >= 1 && !this.special2Busy; }
    get special2Busy() { const k = this.special2 && CB.SPECIAL_FX[this.special2.id]; return !!k && this.fx[k] > 0; }
    get special2Left() { const k = this.special2 && CB.SPECIAL_FX[this.special2.id]; return k ? this.fx[k] : 0; }
    useSpecial2() { if (!this.special2Ready || this.over || this.choice) return false; this.charge2 = 0; this.specialsUsed++; this.spUses2++; this.lastSpecial = this.special2.id; this.spBossDealt = 0; this.castSpecial(this.special2, 0); return true; }
    get specialBusy() { const k = this.special && CB.SPECIAL_FX[this.special.id]; return !!k && this.fx[k] > 0; }   // secondes restantes de l'attaque à durée du joueur
    get specialLeft() { const k = this.special && CB.SPECIAL_FX[this.special.id]; return k ? this.fx[k] : 0; }
    // Attaque spéciale du personnage : une par membre de la famille, déclenchée quand la jauge est pleine.
    useSpecial() {
      if (!this.specialReady || this.over || this.choice) return false;
      this.charge = 0; this.specialsUsed++; this.spUses++; this.lastSpecial = this.special.id; this.spBossDealt = 0;   // nouveau lancer : le plafond de dégâts sur le boss repart de zéro
      this.castSpecial(this.special, 0);
      return true;
    }
    // Lance une attaque spéciale (celle du joueur depuis le canon, ou celle du coéquipier depuis la gauche).
    castSpecial(sp, origin = 0, byAlly = false) {
      const s = this.stats, live = () => this.enemies.filter(e => !e.dead && !e.def.shot);
      this.texts.push({ text: (byAlly ? CB.playerById(sp.id).name.toUpperCase() + ' : ' : '') + sp.icon + ' ' + sp.name.toUpperCase() + ' !', x: byAlly ? -14 : 0, y: 12, z: 18, age: 0, color: byAlly ? '#7fd4ff' : '#ffd23f' });
      switch (sp.id) {
        case 'matthieu': { this.fx.cheat = 1.2; this.flash = 1.1; this.shake = Math.max(this.shake || 0, .5); this.hp = this.maxHp;   // claquement de doigts : flash divin, les monstres se figent, blanchissent et s'évaporent un à un (pas d'explosion)
          for (const e of live()) { if (e.boss) { e.flash = 1; this.applyDamage(e, s.damage * 10 * this.spPower, true, 'triche'); } else if (!this.isDecor(e)) e.vanish = { delay: .15 + this.random() * .5, age: 0 }; }
          this.bursts.push({ x: 0, y: 14, z: 30, age: 0, kind: 'snap', size: 60, life: 1.5 }); this.texts.push({ text: '✨ CLAC ! ✨', x: 0, y: 12, z: 16, age: -.15, color: '#ffffff', big: true }); this.texts.push({ text: '❤️ VIE PLEINE', x: 0, y: 7, z: 8, age: -1.6, color: '#ff7b87' }); this.snaps = (this.snaps || 0) + 1; break; }
        case 'josee': this.fx.priere = sp.seconds || 15; this.flash = 1; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .4); this.angels = [{ x: -16, y: 46, z: 34, base: -16, cooldown: 2.2, shots: 0, age: 0 }, { x: 16, y: 46, z: 34, base: 16, cooldown: 2.8, shots: 0, age: 0 }]; break;
        case 'pirate': { const n = sp.ships || 1, W = CB.VIEW.spread; this.fx.pirate = sp.seconds || 15; this.flash = .5; this.shake = Math.max(this.shake || 0, .6); this.pirates = [];
          for (let i = 0; i < n; i++) this.pirates.push({ x: -W - 14 - i * 13, y: 13 + (i % 3) * 4.5, z: 30 + (i % 2) * 12, dir: 1, speed: 9 + (i % 3) * 1.5, cooldown: 1 + i * .35, flash: 0, shots: 0, roll: i * 1.3, age: 0 });
          this.texts.push({ text: '🏴‍☠️ À L’ABORDAGE !', x: 0, y: 12, z: 16, age: -.3, color: '#ffd23f', big: true }); break; }
        case 'richard': { const t = this.target(); this.balls.push({ x: origin, y: 1.8, z: 0, vx: (t.x - origin) / t.t * .35, vy: Math.max(.5, (t.y - 1.8) / t.t * .6), vz: CB.BASE_SPEED * s.range * 1.7, trail: [], dmg: s.damage * 12 * this.spPower, size: Math.max(18, s.size * 7), pierce: true, splash: 0, effect: null, ally: byAlly, mega: true, special: 'veteran', dmgLevel: this.spPower, hitIds: new Set(), bounced: false, age: 0 }); this.shake = Math.max(this.shake || 0, 1.1); this.texts.push({ text: 'MÉGA BOULET !!!', x: origin / 10, y: 9, z: 12, age: -.7, color: '#ffd23f', big: true }); break; }
        case 'mickael': this.fx.laser = sp.seconds || 10; break;
        case 'marie': this.fx.protect = sp.seconds || 12; this.shield += 4; this.hp = Math.min(this.maxHp, this.hp + 20); this.flash = .35; this.bursts.push({ x: 0, y: 6, z: 10, age: 0, kind: 'ice', size: 14 }); this.texts.push({ text: '💗 MAMAN VEILLE !', x: 0, y: 9, z: 12, age: -.3, color: '#ff8ac6', big: true }); break;
        case 'adam': { const secs = sp.seconds || 2.5; this.fx.pika = secs; this.pikaTick = 0; this.flash = .5; this.shake = Math.max(this.shake || 0, .6); for (const e of live()) if (!e.boss) e.frozen = Math.max(e.frozen, secs); this.texts.push({ text: 'PI…', x: -6, y: 10, z: 14, age: -.05, color: '#ffe76c' }); this.texts.push({ text: 'KA…', x: 0, y: 11, z: 14, age: -.45, color: '#ffe76c' }); this.texts.push({ text: '⚡ CHUUUUUU !!!', x: 0, y: 12, z: 16, age: -.9, color: '#ffe76c', big: true }); break; }
        case 'milo': this.fx.slowmo = sp.seconds || 8; break;
        case 'jeremie': this.fx.teleport = sp.seconds || 6; this.vortex = { x: 0, y: 17, z: 48, age: 0 }; this.flash = .6; this.shake = Math.max(this.shake || 0, .5); for (const e of live()) if (!e.boss && !this.isDecor(e) && !e.warp) e.warp = { age: 0, x0: e.x, y0: e.y, z0: e.z }; this.texts.push({ text: '🌀 VORTEX !', x: 0, y: 24, z: 48, age: -.3, color: '#c47dff', big: true }); break;
        case 'jessica': { for (const e of live()) { const g = (CB.goldBase(this.wi) + (e.def.gold || 0)) * s.gold; this.gold += g; this.texts.push({ text: '+' + Math.round(g), x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ffd23f' }); } this.fx.magnet = sp.seconds || 30; this.texts.push({ text: '🎰 JACKPOT !!!', x: 0, y: 13, z: 16, age: -.3, color: '#ffd23f', big: true }); break; }
        case 'edison': this.fx.tornado = sp.seconds || 10; this.tornadoes = [{ x: -24, z: 60, age: 0 }, { x: 2, z: 78, age: -.6 }, { x: 26, z: 55, age: -1.1 }]; this.shake = Math.max(this.shake || 0, .8); this.texts.push({ text: '🌪️ TORNADES !', x: 0, y: 20, z: 40, age: -.3, color: '#dfe9ff', big: true }); break;
        case 'josue': for (const e of live()) if (!e.boss) e.frozen = Math.max(e.frozen, 1.5); this.fx.rally = sp.seconds || 30; this.texts.push({ text: '📣 À L’ATTAQUE !', x: 0, y: 9, z: 12, age: -.3, color: '#ff6b6b', big: true }); break;
        case 'emily': this.fx.blizzard = sp.seconds || 12; this.blizzTick = .5; this.flash = .5; this.freezeAll(3); for (const e of live()) this.applyDamage(e, s.damage * 1.5 * this.spPower, false, 'neige'); this.texts.push({ text: '❄️ BLIZZARD !', x: 0, y: 16, z: 30, age: -.4, color: '#a9e9ff', big: true }); break;
        case 'eliott': this.fx.ghost = sp.seconds || 8; this.flash = .3; this.spirits = [0, 1, 2].map(i => ({ x: (i - 1) * 12, y: 6 + i * 2, z: 10, age: i * .4, target: null, cooldown: .6 + i * .4 })); this.texts.push({ text: '👻 BOUH !', x: 0, y: 10, z: 12, age: -.3, color: '#dfe9ff', big: true }); break;
        case 'alexie': this.fx.licorne = sp.seconds || 15; this.unicorn = { x: -26, y: 16, z: 38, dir: 1, cooldown: .9, shots: 0, age: 0 }; this.hp = Math.min(this.maxHp, this.hp + 15); break;
        case 'zachary': { const t = this.target(), n = this.balls.length; this.launch(origin, t, 8 * this.spPower); for (const b of this.balls.slice(n)) { b.size *= 2.5; b.splash = 0; b.special = 'fusee'; b.rocket = true; b.fuseZ = Math.max(12, t.t * CB.BASE_SPEED * s.range); b.vy = (t.y - 1.8) / t.t; b.pierce = false; } break; }
      }
    }
    // La Prière de Josée : deux anges descendent du ciel et lancent des rayons de lumière pendant 15 s.
    updateAngels(dt) {
      if (!(this.fx.priere > 0)) { this.angels = null; this.texts.push({ text: '😇 AU REVOIR !', x: 0, y: 16, z: 34, age: 0, color: '#fff3a0' }); return; }
      for (const a of this.angels) {
        a.age += dt; a.y = Math.max(15, 46 - a.age * 18) + Math.sin(a.age * 2.5) * 1.2; a.x = a.base + Math.sin(a.age * 1.3) * 5; a.z = 34 + Math.cos(a.age * .8) * 6;
        a.cooldown -= dt; if (a.cooldown > 0 || a.y > 20) continue;
        const live = this.enemies.filter(e => !e.dead && !e.escaped && !e.def.crystal && !e.def.gift && !e.def.chest && !e.def.portal && !e.def.hazard);
        if (!live.length) { a.cooldown = .3; continue; }
        const e = live[Math.floor(this.random() * live.length)]; a.cooldown = 1.1; a.shots++;
        this.bursts.push({ x: a.x, y: a.y - 1, z: a.z, to: { x: e.x, y: e.y, z: e.z }, age: 0, kind: 'holy', life: .5 });
        this.applyDamage(e, this.stats.damage * 1.2 * this.spPower, false, 'priere');
      }
    }
    // État d'un groupe de la séquence pour le panneau Debug : pending (pas encore parti), active (en train de sortir ou encore vivant), done
    seqStatus(i) { const g = (this.sequence || []).find(x => x.idx === i); if (!g || !g.launched) return 'pending'; return this.seq.active.some(a => a.g === g) || g.spawned.some(e => !e.dead && !e.escaped) ? 'active' : 'done'; }
    // Boss demandé par l'éditeur (séquence « boss:clé ») : le Mégaoiseau garde ses deux stades, les autres font un seul grand combat
    spawnBossOf(key) { const d = CB.BOSSES[key]; if (!d) return null; return d.angry ? this.spawnMiniBoss(key) : this.spawnBoss(key, true); }
    // Les bateaux pirates volants : ils traversent le ciel (demi-tour aux bords) et canonnent les monstres un boulet à la fois, canon après canon.
    updatePirates(dt) {
      if (!(this.fx.pirate > 0)) { this.pirates = null; this.texts.push({ text: '🏴‍☠️ LES PIRATES S’EN VONT !', x: 0, y: 14, z: 30, age: 0, color: '#fff3a0' }); return; }
      const W = CB.VIEW.spread + 12, s = this.stats;
      for (const sh of this.pirates) {
        sh.age += dt; sh.x += sh.dir * sh.speed * dt; if (sh.x > W) sh.dir = -1; else if (sh.x < -W) sh.dir = 1; sh.flash = Math.max(0, sh.flash - dt);
        sh.cooldown -= dt; if (sh.cooldown > 0) continue;
        const live = this.enemies.filter(e => !e.dead && !e.escaped && !this.isDecor(e) && e.z > 4);
        if (!live.length) { sh.cooldown = .3; continue; }
        const e = live.reduce((a, b) => Math.hypot(a.x - sh.x, a.z - sh.z) < Math.hypot(b.x - sh.x, b.z - sh.z) ? a : b), k = sh.shots % 3, ox = sh.x + (k - 1) * 1.7 * sh.dir, oy = sh.y - .4, oz = sh.z;
        const pv = e.previous || e, dv = Math.max(1e-3, dt), ex = (e.x - pv.x) / dv, ey = (e.y - pv.y) / dv, ez = (e.z - pv.z) / dv;   // on vise là où le monstre sera (boulet rapide, en ligne droite)
        let t = Math.max(.25, Math.hypot(e.x - ox, e.y - oy, e.z - oz) / 40); const tx = e.x + ex * t, ty = e.y + ey * t, tz = e.z + ez * t; t = Math.max(.25, Math.hypot(tx - ox, ty - oy, tz - oz) / 40);
        this.balls.push({ x: ox, y: oy, z: oz, vx: (tx - ox) / t, vy: (ty - oy) / t, vz: (tz - oz) / t, straight: true, trail: [], dmg: s.damage * 1.6 * this.spPower, size: 1.3, pierce: false, splash: 3, chain: false, freeze: false, effect: null, ally: true, pirate: true, hitIds: new Set(), bounced: false, age: 0 });
        this.bursts.push({ x: ox, y: oy + .6, z: oz, age: 0, kind: 'pop', color: '#ffd23f', size: 1.4 }); sh.shots++; this.pirateShots++; sh.flash = .18; sh.cooldown = .5 + this.random() * .35;
      }
    }
    // Le Mégaoiseau du temps : mini-boss de la vallée, deux stades (le second rouge, fumant, deux attaques de plus).
    spawnMiniBoss(key = this.E.miniBoss) {
      const def = CB.BOSSES[key]; if (!def) return null;
      const b = { id: nextId++, type: 'boss', boss: true, mini: true, def, name: def.name, color: def.color, size: def.size, hp: def.hp * this.hpMult() * .6, speed: 6, damage: 20, x: 0, y: 12, z: 100, baseX: 0, baseY: 12, phase: 0, age: 0, frozen: 0, minionTimer: Infinity, boltTimer: def.boltEvery * 1.5, hover: 38, stage: 1, act: null, powers: def.powers[0], powerIndex: 0 };
      b.maxHp = b.hp; this.boss = b; this.bossSpawned = true; this.enemies.push(b);
      this.news.push({ kind: 'boss', text: 'MINI-BOSS : ' + def.name.toUpperCase() + ' ! CASSE SES CRISTAUX, FAIS EXPLOSER SES ROCHERS', time: this.time });
      return b;
    }
    bossAttack(b, power) {
      const at = { x: b.x, y: b.y - 1, z: b.z - 2 }, r = this.random;
      if (power === 'eventail') { for (const dx of [-7, 0, 7]) this.spawnEnemy('bolt', { x: b.x + dx, y: b.y - 1, z: b.z - 2 }); }
      else if (power === 'cristaux') { const n = b.stage === 2 ? 4 : 3; for (let i = 0; i < n; i++) this.spawnEnemy('cristal', { x: (i - (n - 1) / 2) * 9 + (r() - .5) * 4, y: 4 + r() * 7, z: 28 + r() * 16 }); }
      else if (power === 'meteores') { for (const dx of [-8, 0, 8]) this.spawnEnemy('rocher', { x: b.x + dx, y: b.y - 1, z: b.z - 2 }); }
      else if (power === 'rayonMer') { this.beam = { x: this.px, from: { x: b.x, y: b.y + 3.5, z: b.z - 1 }, t: 0, charge: 1.25, fire: .55, hit: false }; }   // vise là où on est : il faut se tasser pendant la charge
      else if (power === 'vague') { for (const dx of [-8, 0, 8]) this.spawnEnemy('bouletCanon', { x: b.x + dx, y: b.y + 2, z: b.z - 2 }); }
      else if (power === 'bordee') { for (let i = 0; i < 6; i++) { const sh = this.spawnEnemy('bouletCanon', { x: b.x + (i - 2.5) * 4.5, y: b.y + 2.5, z: b.z - 3 }); if (sh) sh.tx = this.px + (i - 2.5) * 3.2; } }
      else if (power === 'bombarde') { this.spawnEnemy('bombeNoire', { x: b.x, y: b.y + 3, z: b.z - 2 }); }
      else if (power === 'abordage') { for (const dx of [-14, 14]) if (this.enemies.filter(e => e.def.ship && !e.dead).length < 3) this.spawnEnemy('chaloupe', { x: b.x + dx, y: .5, z: b.z + 8 }); }
      else if (power === 'canonnade') { for (let i = 0; i < 4; i++) { const sh = this.spawnEnemy('bouletCanon', { x: b.x + (r() - .5) * 10, y: b.y + 2.5, z: b.z - 3 }); if (sh) sh.tx = this.px + (r() - .5) * 6; } }
      else if (power === 'rugissement') { this.shake = Math.max(this.shake || 0, 1); this.cooldown = Math.max(this.cooldown, 1.6); this.texts.push({ text: 'ÉTOURDI !', x: 0, y: 6, z: 8, age: 0, color: '#ff3a3a' }); for (let i = 0; i < 5; i++) this.spawnEnemy('compsognathus', { x: (i - 2) * 6, y: 4 + r() * 4, z: 70 + r() * 10 }); }
      else this.spawnEnemy(power, at);
      this.texts.push({ text: power === 'bolt' ? '!' : CB.BOSS_POWER_NAMES[power].toUpperCase() + ' !', x: b.x, y: b.y + 4, z: b.z, age: 0, color: power === 'rayon' ? '#b14fff' : power === 'rayonMer' ? '#7fe9ff' : '#ff3a3a' });
    }
    // Rayon du Léviathan : charge (on voit où il va frapper), puis tir ; touché seulement si le canon est resté dans la ligne
    beamStep(dt) { const B = this.beam; if (!B) return; B.t += dt; if (!B.hit && B.t >= B.charge) { B.hit = true; this.shake = Math.max(this.shake || 0, .9); this.flash = Math.max(this.flash || 0, .25); if (Math.abs(this.px - B.x) < 3.4) { this.beamHits = (this.beamHits || 0) + 1; this.texts.push({ text: 'RAYON !', x: this.px, y: 7, z: 6, age: 0, color: '#7fe9ff', big: true }); this.damage(32, null); } else { this.dodged++; this.texts.push({ text: 'ESQUIVÉ !', x: this.px, y: 6, z: 6, age: 0, color: '#7fd4ff' }); } } if (B.t >= B.charge + B.fire) this.beam = null; }
    spawnBoss(key = this.world.boss, full = false) {   // full : boss de l'éditeur, un seul combat jusqu'au bout (tous ses pouvoirs, ne s'enfuit pas)
      const def = CB.BOSSES[key]; if (!def) return null; const cs = this.custom || {};
      const b = { id: nextId++, type: 'boss', boss: true, def, name: def.name, color: def.color, size: def.size, hp: def.hp * CB.hpScale(this.wi) * (cs.hpScale || 1), speed: 6, damage: 20, x: 0, y: 9, z: 100, baseX: 0, baseY: 9, phase: 0, age: 0, frozen: 0, minionTimer: def.every, boltTimer: def.boltEvery * 1.5, hover: 34 };
      b.maxHp = b.hp; if (this.bossHpLeft != null && !full) b.hp = this.bossHpLeft;
      b.act = full ? CB.BOSS_LEVELS.length - 1 : this.bossFight; b.powers = def.powers && !def.mini ? def.powers[Math.min(b.act, def.powers.length - 1)] : CB.BOSS_POWERS[Math.min(b.act, CB.BOSS_POWERS.length - 1)]; if (def.hover) b.hover = def.hover; if (def.sea) { b.y = b.baseY = .4; } b.powerIndex = 0; b.target = full ? -1 : b.maxHp * (2 - b.act) / 3; // PV à atteindre pour finir l'acte
      this.boss = b; this.bossSpawned = true; this.bossActs++; this.enemies.push(b);
      if (full) { b.full = true; this.news.push({ kind: 'boss', text: 'BOSS : ' + def.name.toUpperCase() + ' !', time: this.time }); return b; }
      const fresh = b.powers.filter(k => !(CB.BOSS_POWERS[b.act - 1] || []).includes(k)).map(k => CB.BOSS_POWER_NAMES[k]);
      this.news.push({ kind: 'boss', text: 'ACTE ' + (b.act + 1) + ' / 3 : ' + def.name.toUpperCase() + (b.act ? ' REVIENT !' : ' !') + (fresh.length ? ' NOUVEAU : ' + fresh.join(', ').toUpperCase() : ''), time: this.time });
      return b;
    }
    // Fin d'un acte : le boss a perdu son tiers, il s'enfuit (il reviendra au prochain palier de niveau).
    bossRetreat(b) {
      if (b.leaving) return; b.leaving = true; b.hp = Math.max(b.hp, b.target); this.bossHpLeft = b.hp; this.bossFight++; this.boss = null; this.bossSpawned = false;
      for (const o of this.enemies) if (o.def && o.def.shot) o.dead = true;
      this.bursts.push({ x: b.x, y: b.y, z: b.z, age: 0, kind: 'boom', color: b.color, size: 3 });
      this.texts.push({ text: 'IL S’ENFUIT !', x: b.x, y: b.y + 4, z: b.z, age: 0, color: '#ffd23f' });
      this.news.push({ kind: 'boss', text: 'LE BOSS S’ENFUIT ! MONTE AU NIVEAU ' + CB.BOSS_LEVELS[this.bossFight] + ' POUR LE FAIRE REVENIR', time: this.time });
    }
    // Cartes uniques : renfort (un membre de la famille au hasard vient tirer à côté de nous), grosse bombe, jauge pleine
    callGuest(secs) {
      const taken = new Set([this.player.id, this.ally && this.ally.id, this.ally2 && this.ally2.id, this.guest && this.guest.id].filter(Boolean));
      const pool = CB.PLAYERS.filter(m => !taken.has(m.id)); if (!pool.length) return null; const m = pool[Math.floor(this.random() * pool.length)];
      const side = !this.ally ? 1 : !this.ally2 ? -1 : 1, far = !!(this.ally && this.ally2);   // à gauche si libre, sinon à droite, sinon plus loin à gauche
      this.guest = Object.assign(this.makeAlly(m.id, side), { left: secs, far, guest: true }); this.guest.nextSpecial = Math.min(this.guest.nextSpecial, secs * .6);
      this.texts.push({ text: '🤝 RENFORT : ' + m.name.toUpperCase() + ' !', x: 0, y: 13, z: 18, age: 0, color: '#9fdcff', big: true }); this.bursts.push({ x: side * (far ? 26 : 16), y: 3, z: 6, age: 0, kind: 'pop', color: '#9fdcff', size: 3 }); return this.guest;
    }
    blastAll() {
      let n = 0; for (const e of this.enemies) { if (e.dead || e.escaped || e.boss || this.isDecor(e)) continue; n++; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: -Math.min(.5, this.random() * .4), kind: 'kaboom', color: '#ff8c2a', size: 4 + e.size * 2, life: .8 }); this.applyDamage(e, 1e9, true, 'bombe'); }
      this.flash = Math.max(this.flash || 0, .6); this.shake = Math.max(this.shake || 0, 1); this.bursts.push({ x: 0, y: 6, z: 20, age: 0, kind: 'nova', size: 50, life: .8 }); this.texts.push({ text: n ? '💥 GROSSE BOMBE !' : '💥 BOUM… personne !', x: 0, y: 12, z: 16, age: -.5, color: '#ff8c2a', big: true }); return n;
    }
    fillCharge() { if (!this.special || this.specialBusy) return false; this.charge = 1; if (this.special2 && !this.special2Busy) this.charge2 = 1; this.texts.push({ text: '⚡ JAUGE PLEINE !', x: 0, y: 11, z: 14, age: 0, color: '#ffd23f', big: true }); return true; }
    // Tête chercheuse : le boulet se tourne vers le monstre le plus proche (dans la portée du niveau), avec un virage limité ; il garde sa vitesse
    homeBall(ball, dt) {
      const H = CB.HOMING, lvl = this.stats.homing, range = H.range[lvl - 1], turn = H.turn[lvl - 1]; let best = null, bd = range;
      for (const e of this.enemies) { if (e.dead || e.escaped || ball.hitIds.has(e.id) || this.isDecor(e) || e.z <= ball.z - 2) continue; const d = Math.hypot(e.x - ball.x, e.y - ball.y, e.z - ball.z); if (d < bd) { bd = d; best = e; } }
      ball.lock = best ? best.id : null; if (!best) return;
      const sp = Math.hypot(ball.vx, ball.vy, ball.vz) || 1, dx = best.x - ball.x, dy = best.y - ball.y, dz = best.z - ball.z, dl = Math.hypot(dx, dy, dz) || 1;
      const ux = ball.vx / sp, uy = ball.vy / sp, uz = ball.vz / sp, wx = dx / dl, wy = dy / dl, wz = dz / dl;
      const ang = Math.acos(Math.max(-1, Math.min(1, ux * wx + uy * wy + uz * wz))); if (ang < 1e-3) return;
      const k = Math.min(1, turn * dt / ang);   // fraction du virage possible ce tick
      let nx = ux + (wx - ux) * k, ny = uy + (wy - uy) * k, nz = uz + (wz - uz) * k; const nl = Math.hypot(nx, ny, nz) || 1;
      ball.vx = nx / nl * sp; ball.vy = ny / nl * sp + 18 * dt * k; ball.vz = nz / nl * sp;   // on compense un peu la gravité pendant le virage
    }
    // Fin de la nuée : un méga dragon passe de profil, de gauche à droite, et chasse tout ce qui reste hors de l'écran ; le tableau se termine quand tout le monde est sorti
    startOutro() {
      const O = (this.swarm && this.swarm.ramp && this.swarm.ramp.outro) || { speed: 21, flee: 27 }, W = CB.VIEW.spread + 40;
      this.outro = { age: 0, x: -W, y: 13, z: 40, dir: 1, speed: O.speed, flee: O.flee, done: false, roar: 0 }; this.shake = Math.max(this.shake || 0, .8); this.flash = Math.max(this.flash || 0, .5);
      this.texts.push({ text: '🐉 UN MÉGA DRAGON !!!', x: 0, y: 14, z: 26, age: 0, color: '#ff8c2a', big: true });
      for (const e of this.enemies) if (!e.dead && e.def.hazard) { e.dead = true; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'pop', color: '#b14fff' }); }   // les bombes restantes s'éteignent
    }
    updateOutro(dt) {
      const o = this.outro, W = CB.VIEW.spread + 40; o.age += dt; o.x += o.speed * dt; o.y = 13 + Math.sin(o.age * 2.2) * 1.5;
      if (o.age < 1.2) this.shake = Math.max(this.shake || 0, .25);
      for (const e of this.enemies) { if (e.dead || e.escaped || e.flee || e.boss || this.isDecor(e)) continue; if (e.x < o.x + 34) { e.flee = o.flee + this.random() * 6; e.frozen = 0; e.swept = null; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'crit', color: '#ff8c2a' }); } }
      if (o.x > W + 6) o.done = true;
      if (o.done && !this.enemies.some(e => !e.dead && !e.escaped && !this.isDecor(e))) this.finish(true, 'nuee');
    }
    // Nuée : palier de couleur (rouge, doré) de plus en plus probable avec le temps
    swarmTier() { const R = this.swarm && this.swarm.ramp; if (!R || !R.tiers) return 0; for (let i = R.tiers.length - 1; i >= 0; i--) { const [from, max] = R.tiers[i]; if (this.time >= from && this.random() < max * Math.min(1, (this.time - from) / Math.max(1, this.def.seconds - from))) return i + 1; } return 0; }
    spawnInterval() { if (this.boss && this.boss.mini) return 2.2 / this.def.density; if (this.swarm) return Math.max(.17, .95 - this.time * .0029) / this.def.density; if (this.endless) return Math.max(.3, 1.25 - this.time * .0025) / this.def.density; return Math.max(.32, (1.3 - this.time * .006) / this.def.density / (1 + CB.tierOf(this.wi) * .12)); }
    update(dt) {
      if (this.over || this.choice) return;
      dt = clamp(dt, 0, .05); this.time += dt; const s = this.stats, r = this.random;
      for (const k in this.fx) this.fx[k] = Math.max(0, this.fx[k] - dt);
      if (this.fx.pika > 0) { this.pikaTick -= dt; if (this.pikaTick <= 0) { this.pikaTick = .2; let from = { x: 0, y: 2, z: 0 }; const total = (this.spOf('adam') || {}).seconds || 2.5;
        for (const e of this.enemies) { if (e.dead || e.escaped || e.def.crystal || e.def.gift || e.def.chest || e.def.portal) continue; this.bursts.push({ x: from.x, y: from.y, z: from.z, to: { x: e.x, y: e.y, z: e.z }, age: 0, kind: 'bolt', life: .25, color: '#ffe76c', width: 7, seed: Math.floor(this.random() * 999) }); if (!e.boss) e.frozen = Math.max(e.frozen, this.fx.pika); this.applyDamage(e, s.damage * 4 * .2 / total * this.spPower, false, 'eclair'); from = e; } } }
      // étourdissement (choc, glace) : on tape vite sur tirer pour se libérer, sinon ça passe tout seul ; poison et magie noire
      if (this.stun) { this.stun.time -= dt; if (this.stun.time <= 0) this.freeStun('OUF…'); }
      if (this.poison > 0) { this.poison = Math.max(0, this.poison - dt); this.hp = Math.max(1, this.hp - 1.5 * dt); }
      if (this.dark > 0) this.dark = Math.max(0, this.dark - dt);
      // événements loufoques
      if (this.time >= this.nextEvent && !this.boss && !this.puzzle) { const kinds = CB.EVENTS.kinds; this.triggerEvent(kinds[Math.floor(r() * kinds.length)]); const [a, b] = CB.EVENTS.every; this.nextEvent = this.time + a + r() * (b - a); }
      if (this.puzzle) { this.puzzle.time -= dt; if (this.puzzle.time <= 0) this.endPuzzle(false); }
      if (this.unicorn) this.updateUnicorn(dt);
      if (this.outro) this.updateOutro(dt);
      if (this.angels) this.updateAngels(dt);
      if (this.pirates) this.updatePirates(dt);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.4);
      if (this.fx.laser > 0 || this.fx.tornado > 0) { this.fxTick -= dt; if (this.fxTick <= 0) { this.fxTick = .12;
        if (this.fx.laser > 0) { const g = this.laserGrow; for (const e of this.enemies) { if (e.dead) continue; const p = CB.project(e); if (Math.abs(p.x - this.aim.x) < Math.max(34 * g, p.scale * 2.2 * e.size)) this.applyDamage(e, s.damage * (.25 + .55 * g) * this.spPower, false, 'laser'); } }
        if (this.fx.tornado > 0) for (const e of this.enemies) { if (e.dead || !e.boss) continue; this.applyDamage(e, s.damage * .35, false, 'tornade'); } } }
      this.beamStep(dt);
      if (this.fx.blizzard > 0) { this.blizzTick -= dt; if (this.blizzTick <= 0) { this.blizzTick = .25; for (const e of this.enemies) if (!e.dead && !e.escaped && !this.isDecor(e)) this.applyDamage(e, s.damage * .2 * this.spPower, false, 'neige'); } }
      if (this.fx.protect > 0) { this.hp = Math.min(this.maxHp, this.hp + 2 * dt); for (const e of this.enemies) { if (e.dead || e.escaped || e.boss || e.swept || e.warp || this.isDecor(e) || e.z >= 13) continue; e.z += 30; e.baseX = e.x; e.frozen = Math.max(e.frozen, .8); this.bursts.push({ x: e.x, y: e.y, z: e.z - 30, age: 0, kind: 'hearts', size: 4, life: .8 }); this.applyDamage(e, s.damage * 3, false, 'amour'); if (!this.protectHint2 || this.time - this.protectHint2 > .8) { this.protectHint2 = this.time; this.texts.push({ text: 'PAS TOUCHE !', x: 0, y: 7, z: 8, age: 0, color: '#ff8ac6' }); } } }
      if (this.spirits) this.updateSpirits(dt);
      if (this.tornadoes) this.updateTornadoes(dt);
      if (this.vortex) { this.vortex.age += dt; if (!(this.fx.teleport > 0)) this.vortex = null; }
      if (this.portal) { this.portal.t += dt; this.enemies = this.enemies.filter(e => !e.dead); for (const b of this.bursts) b.age += dt; this.bursts = this.bursts.filter(b => b.age < 1); for (const tx of this.texts) tx.age += dt; this.texts = this.texts.filter(tx => tx.age < 1.4); if (this.portal.t >= CB.PORTAL_TIME) this.finish(true, 'portail'); return; }
      this.cooldown = Math.max(0, this.cooldown - dt); this.recoil = Math.max(0, this.recoil - dt * 4); this.hurt = Math.max(0, this.hurt - dt);
      this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
      if (this.ally) this.updateAlly(dt, this.ally); if (this.ally2) this.updateAlly(dt, this.ally2); if (this.guest) { this.updateAlly(dt, this.guest); this.guest.left -= dt; if (this.guest.left <= 0) { this.texts.push({ text: 'MERCI ' + CB.playerById(this.guest.id).name.toUpperCase() + ' !', x: this.guest.side * 10, y: 8, z: 10, age: 0, color: '#9fdcff' }); this.guest = null; } } if (this.towers.length) this.updateTowers(dt); if (this.sphere) this.updateSphere(dt);
      if (s.regen > 0) { this.regenTimer += dt; if (this.regenTimer >= 5) { this.regenTimer -= 5; this.hp = Math.min(this.maxHp, this.hp + s.regen); } }
      // apparitions
      if (this.time >= this.intro && !this.outro) {   // plus rien n'apparaît pendant le passage du dragon
        if (!this.puzzle) this.spawn -= dt;   // pendant le puzzle, le temps s'arrête
        const randomOn = !this.cibles && !this.brigands && (!this.custom || (this.custom.random && this.custom.random.enabled !== false && this.world.enemies.length));
        const bossOnly = this.def.type === 'boss' && !!this.boss; // pendant un acte, le boss est seul devant nous
        if (this.spawn <= 0 && !bossOnly) { if (this.endless && !this.custom) { const pk = this.pickEndless(); this.spawnEnemy(pk.type, null, undefined, pk.tier); } else if (this.def.night && !this.custom) { this.spawnEnemy(this.pickEndless(this.def.night.timeScale).type); } else if (this.swarm && !this.custom) { const list = this.swarm.roster, R = this.swarm.ramp || {}, pr = Math.min(1, this.time / this.def.seconds); this.spawnEnemy(list[Math.floor(r() * list.length)], null, undefined, this.swarmTier()); if (R.pairFrom != null && this.time > R.pairFrom && r() < (R.pairMax || .6) * (this.time - R.pairFrom) / (this.def.seconds - R.pairFrom)) this.spawnEnemy(list[Math.floor(r() * list.length)], null, undefined, this.swarmTier()); } else if (randomOn) { const cap = this.custom ? +this.custom.maxAlive || 0 : this.def.maxAlive || 0; if (!cap || this.enemies.filter(e => !e.dead && !e.escaped && !this.isDecor(e)).length < cap) this.spawnEnemy(this.pickWorldEnemy()); } this.spawn = this.spawnInterval(); }   // maxAlive : jamais plus de N monstres en même temps (la mer : 4)
        // tableau 1-3 : trois cibles passent à des moments fixes ; mini-jeu 1-7 : des cibles ailées traversent le ciel, de plus en plus vite
        if (this.targetTimes && this.targetTimes.length && this.time >= this.targetTimes[0]) { this.targetTimes.shift(); this.spawnEnemy('cible', { x: (r() - .5) * CB.VIEW.spread * 1.4, y: 6 + r() * 6, z: 95 }); this.texts.push({ text: '🎯 UNE CIBLE !', x: 0, y: 14, z: 30, age: 0, color: '#ffd23f' }); }
        if (this.brigands && !this.panels && this.round < this.brigands.rounds && this.time >= this.nextRound) this.spawnRound();
        if (this.cibles && this.targetsSpawned < this.cibles.count && this.time >= this.nextTarget) { this.spawnFlyer(); const [a, b] = this.cibles.every; this.nextTarget = this.time + a + (b - a) * this.targetsSpawned / this.cibles.count; }
        // la vallée : cadeaux étoilés, puis le Mégaoiseau du temps après miniBossAt secondes
        if (this.endless && this.time >= this.nextGift) { this.spawnEnemy('cadeau'); this.gifts++; this.nextGift = this.time + this.E.gift.every; }
        if (this.endless && this.E.miniBoss && !this.miniBossDone && !this.boss && !this.custom && this.time >= this.E.miniBossAt) this.spawnMiniBoss();
        // bombes magiques de la nuée : de plus en plus souvent (toutes les 12 s au début, 7 s à la fin)
        if (this.swarm && this.time >= this.nextBomb) { this.spawnEnemy('bombeMagique'); this.bombs++; const [a, b] = this.swarm.bombEvery; this.nextBomb = this.time + a + (b - a) * Math.min(1, this.time / this.def.seconds); }
        // le bateau volant secret de la nuée : passe de gauche à droite tant qu'on ne l'a pas brisé (3 coups) ; jamais revu une fois le secret trouvé
        if (this.swarm && this.swarm.boatAt && !this.boatSecret && !this.boatSecretBefore && !this.outro && !this.enemies.some(e => e.def.secretBoat && !e.dead && !e.escaped) && this.time >= (this.nextBoat == null ? this.swarm.boatAt : this.nextBoat)) {
          const b = this.spawnEnemy('bateauVolant', { x: -CB.VIEW.spread - 12, y: 13, z: 46 }); b.vx = 6.5; b.baseY = 13; b.hp = b.maxHp = b.def.hits; this.nextBoat = this.time + this.swarm.boatEvery;
          this.texts.push({ text: '⛵ UN BATEAU VOLANT ! TIRE DESSUS 3 FOIS !', x: 0, y: 16, z: 30, age: 0, color: '#ffd23f', big: true }); }
        // coffres mystères (une fois le tableau 2 mérité), puis le coffre doré, unique, après portalAt secondes
        if (this.time >= this.nextChest && (this.custom ? +this.custom.chestEvery > 0 : this.endless && this.E.chest && this.nightKillsBefore + this.kills >= this.E.unlockKills)) { this.spawnEnemy('coffre'); this.chestsSeen++; this.nextChest = this.time + (this.custom ? +this.custom.chestEvery : this.E.chest.every); }   // éditeur : chestAt / chestEvery (0 = jamais)   // depuis maintenant, pas depuis le début : sinon les coffres manqués arrivent tous d'un coup
        { const portalAt = this.custom ? +this.custom.portalAt || 0 : this.endless ? this.E.portalAt : 0, dbg = !!(window.CB.app && window.CB.app.debug);   // éditeur : portalAt (0 = jamais) ; en Debug, le coffre doré passe même si le portail est déjà trouvé
          if (portalAt > 0 && (!this.portalSeen || dbg) && !this.portalSpawned && this.time >= portalAt) { this.spawnEnemy('coffreOr'); this.portalSpawned = true; } }
        // bateaux pirates (monde caché) : de plus en plus souvent, jamais plus de « max » à la fois
        if (this.def.ships && !this.custom && !this.outro) { const Sh = this.def.ships; if (this.nextShip == null) this.nextShip = Sh.first; if (this.time >= this.nextShip) { if (this.enemies.filter(e => !e.dead && !e.escaped && e.def.ship).length < Sh.max) { this.spawnEnemy(Sh.kinds[Math.floor(r() * Sh.kinds.length)]); this.ships++; } const k = Math.min(1, this.time / (this.def.seconds || 150)); this.nextShip = this.time + Sh.every[0] + (Sh.every[1] - Sh.every[0]) * k; } }
        // le boss sort quand le niveau de partie atteint le palier de l'acte, et seulement une fois le tirage de cartes réglé (bossFull : un seul grand combat, puis le vrai boss)
        if (this.def.type === 'boss' && !this.boss && this.world.boss && (this.def.bossFull ? !this.bossSpawned && this.runLevel >= CB.BOSS_LEVELS[0] : this.bossFight < CB.BOSS_LEVELS.length && this.runLevel >= CB.BOSS_LEVELS[this.bossFight]) && !this.choice && !this.pendingLevels) { for (const o of this.enemies) if (!o.boss && !o.def.ship) { o.dead = true; this.bursts.push({ x: o.x, y: o.y, z: o.z, age: 0, kind: 'pop', color: o.color }); } this.spawnBoss(this.world.boss, !!this.def.bossFull); }
      }
      // arrivées planifiées (tableaux personnalisés) : paquets de X ennemis, répétés toutes les N secondes
      if (this.schedule) for (const sp of this.schedule) while (sp.next != null && this.time >= sp.next) {
        this.spawnEnemy(sp.type, null, sp.elite); sp.left--;
        if (sp.left > 0) sp.next += sp.every; else if (sp.packsLeft > 0) { sp.packsLeft--; sp.left = sp.count; sp.next += sp.interval; } else sp.next = null;
      }
      if (this.sequence && (this.seq.i < this.sequence.length || this.seq.active.length)) {
        const q = this.seq; q.alive = q.alive.filter(e => !e.dead && !e.escaped);
        while (q.i < this.sequence.length) {   // lancement des groupes, dans l'ordre ; plusieurs peuvent être actifs en même temps (temps absolu ou relatif)
          const g = this.sequence[q.i]; let go = false;
          if (g.at != null) go = this.time >= g.at;
          else if (g.rel != null) go = q.lastEnd == null ? this.time >= 1 : this.time >= q.lastEnd + g.rel;
          else if (q.i === 0) go = this.time >= 1;
          else if (!q.active.length && !q.alive.length) { if (q.clearAt == null) q.clearAt = this.time; go = this.time >= q.clearAt + q.gap; }
          if (!go) break;
          const list = []; for (const k of g.kinds) for (let n = 0; n < k.count; n++) list.push(k);   // chaque entrée garde sa sorte et son drapeau élite for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
          g.launched = true; g.launchedAt = this.time; q.active.push({ g, queue: list, next: this.time }); q.lastEnd = this.time + Math.max(0, list.length - 1) * g.every; q.clearAt = null; q.i++;
        }
        for (const a of q.active) while (a.queue.length && this.time >= a.next) { const k = a.queue.shift(), sp = k.type.startsWith('boss:') ? this.spawnBossOf(k.type.slice(5)) : this.spawnEnemy(k.type, null, !!k.elite); if (sp) { q.alive.push(sp); a.g.spawned.push(sp); } a.next += a.g.every; }
        q.active = q.active.filter(a => a.queue.length);
      }
      const slowAll = (1 - Math.min(.6, s.slow)) * (this.fx.slowmo > 0 ? .4 : 1) * (this.fx.blizzard > 0 ? .45 : 1);
      for (const e of this.enemies) {
        e.previous = { x: e.x, y: e.y, z: e.z }; e.frozen = Math.max(0, e.frozen - dt); if (!(e.frozen > 0)) e.age += dt;   // figé : plus d'animation non plus
        const speed = e.speed * slowAll;
        if (e.boss) {
          if (e.leaving) { e.z += (speed + 18) * dt; e.y += dt * 3; if (e.z > 130) e.dead = true; continue; }
          if (e.diving) { e.diveT += dt; e.y -= dt * 7; e.alpha = Math.max(0, 1 - e.diveT / 1.3); if (Math.floor(e.diveT * 6) !== Math.floor((e.diveT - dt) * 6)) { this.bursts.push({ x: e.x + (this.random() - .5) * 10, y: 0, z: e.z, age: 0, kind: 'splash', size: 2.5, life: .9 }); this.splashes++; } if (e.diveT >= 1.4) { e.dead = true; e.quiet = true; this.boss = null; this.bossSpawned = false; this.spawnBoss(e.def.next, true); } continue; }   // le Léviathan plonge : le vrai boss arrive
          if (e.def.next && e.hp <= e.maxHp * (e.def.nextAt || .2)) { e.diving = true; e.diveT = 0; this.beam = null; this.shake = Math.max(this.shake || 0, .8); this.news.push({ kind: 'boss', text: e.name.toUpperCase() + ' PLONGE… LE VRAI BOSS ARRIVE !', time: this.time }); continue; }
          if (e.z > e.hover) e.z = Math.max(e.hover, e.z - speed * dt);
          else { e.x = Math.sin(e.age * .5) * 10 * Math.min(1, CB.VIEW.spread / 22); e.y = e.def.sea ? .4 + Math.sin(e.age * 1.2) * .3 : Math.min(CB.VIEW.spreadY - 3, 9) + Math.sin(e.age * .8) * 2;
            // attaques spéciales en rotation ; de plus en plus vite d'un acte à l'autre
            e.boltTimer -= dt; if (e.boltTimer <= 0) { e.boltTimer = e.def.boltEvery * (1 - .18 * e.act); this.bossAttack(e, e.powers[e.powerIndex++ % e.powers.length]); } }
          continue;
        }
        const d = e.def;
        if (e.swept) { this.sweepStep(e, dt); continue; }
        if (d.panel) { const P = e.panel, rs = P.rise || .35; P.age += dt; P.up = P.age < rs ? P.age / rs : P.age > P.life - rs ? Math.max(0, (P.life - P.age) / rs) : 1; if (P.age >= P.life) e.escaped = true; continue; }   // panneaux du brigand : ils se lèvent, attendent, redescendent
        if (d.cross) { e.x += e.vx * dt; e.baseX = e.x; e.y = e.baseY + Math.sin(e.age * 1.6 + e.phase) * .7; if (e.x > CB.VIEW.spread + 12) { e.escaped = true; this.texts.push({ text: 'IL S’ÉLOIGNE…', x: e.x - 6, y: e.y + 3, z: e.z, age: 0, color: '#cfe8ff' }); } continue; }   // bateau volant : traverse de gauche à droite
        if (e.vanish) { const v = e.vanish; v.age += dt; e.flash = 1; if (v.age > v.delay) { const k = (v.age - v.delay) / .45; e.alpha = Math.max(0, 1 - k); e.warpScale = 1 + k * .7; e.y += dt * 5; if (k >= 1) { e.quiet = true; e.killedBy = 'triche'; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'crit', color: '#fff' }); this.applyDamage(e, 1e9, true, 'triche'); } } continue; }   // claquement de doigts : figé, blanc, puis s'évapore
        if (e.flee) { e.x += e.flee * dt; e.y += dt * 1.6; e.baseX = e.x; if (e.x > CB.VIEW.spread + 18) e.dead = true; continue; }   // chassé par le dragon : il sort par la droite
        if (e.warp) { this.warpStep(e, dt); continue; }
        if (d.crystal || d.shieldAll || d.orb) continue; // cristaux, boucliers et orbes restent en place
        if (this.puzzle && !this.isDecor(e)) continue;   // tout le monde attend pendant le puzzle // les cristaux du temps restent en place jusqu'à ce qu'on les casse
        if (d.life != null) { e.life = (e.life == null ? d.life : e.life) - dt; if (e.life < 1.2) e.alpha = Math.max(0, e.life / 1.2); if (e.life <= 0) { e.escaped = true; this.texts.push({ text: 'ENVOLÉ…', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffe36b' }); continue; } }   // coffre doré : il disparaît si on tarde
        if (d.hazard) { e.fuse -= dt; if (e.fuse <= 0) { e.dead = true; this.bombsExploded++; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'kaboom', color: '#b14fff', size: 7, life: .9 }); this.shake = Math.max(this.shake || 0, .6); this.texts.push({ text: 'BOUM !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#b14fff', big: true }); this.damage(e.damage, e); } continue; }
        if (e.frozen > 0 && !e.boss) continue;   // figé (Pikachu, Josué, blizzard, boulet de neige, Horloge…) : il ne bouge plus du tout, ne crache ni ne soigne
        // cracheurs (feu, poison, magie noire) et soigneurs
        if (d.spit && !e.flyer && e.z > 14 && e.z < 90) { e.spitTimer = (e.spitTimer == null ? d.spit.first : e.spitTimer) - dt; if (e.spitTimer <= 0) { e.spitTimer = d.spit.every; const n = d.spit.salvo || 1; for (let i = 0; i < n; i++) { const sh = this.spawnEnemy(d.spit.type, { x: e.x + (i - (n - 1) / 2) * 2.2, y: e.y - .5 + (d.ship ? 1.6 : 0), z: e.z - 2 }); if (sh && n > 1) sh.tx = this.px + (i - (n - 1) / 2) * 2.6; } e.spitFlash = .35; } } if (e.spitFlash > 0) e.spitFlash -= dt;
        if (d.heal) { e.healTimer = (e.healTimer == null ? d.heal.every : e.healTimer) - dt; if (e.healTimer <= 0) { e.healTimer = d.heal.every; for (const o of this.enemies) if (o !== e && !o.dead && !o.escaped && !this.isDecor(o) && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.z - e.z) < d.heal.radius) { o.hp = Math.min(o.maxHp, o.hp + d.heal.amount * CB.hpScale(this.wi)); this.bursts.push({ x: o.x, y: o.y, z: o.z, age: 0, kind: 'heal', size: 2, life: .7 }); this.bursts.push({ x: e.x, y: e.y, z: e.z, to: { x: o.x, y: o.y, z: o.z }, age: 0, kind: 'bolt', life: .35, color: '#7dff9a', width: 4 }); } } }
        if (d.ghostly) e.alpha = .5 + .35 * Math.sin(e.age * 2.5 + e.phase);
        if (d.swim && !d.ship && !e.boss && this.sea) { if (e.bite && e.z > CB.SEA_BITE.z + 4) e.bite = null; if (e.z <= CB.SEA_BITE.z || e.bite) { this.biteStep(e, dt); continue; } }   // à la coque : il attaque le bateau au lieu de disparaître
        e.z -= speed * dt; if (d.anchor && e.z < d.anchor) e.z = d.anchor;   // bateau pirate : il jette l'ancre et canonne de là
        if (d.shot) { e.x += ((e.tx || 0) - e.x) * Math.min(1, speed * dt / Math.max(e.z, 1)); e.y += (2 - e.y) * Math.min(1, speed * dt / Math.max(e.z, 1));
          if (d.hold && e.z <= d.hold) { e.z = d.hold; e.fuse = (e.fuse == null ? d.fuse : e.fuse) - dt; if (e.fuse <= 0) { e.dead = true; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ff8c2a', size: 3 }); this.damage(e.damage, e); } } }
        else if (d.flyer || e.flyer) { this.flyStep(e, dt); continue; }
        else if (d.straight) { }
        else if (d.zigzag) { e.x = e.baseX + Math.sin(e.age * 2.2 + e.phase) * 5 * e.amp; e.y = e.baseY + Math.sin(e.age * 1.8) * 2; }
        else if (d.strafe) { e.x = e.baseX + Math.sin(e.age * 1.3 + e.phase) * 9 * e.amp; }
        else e.x += (e.baseX + Math.sin(e.age * 1.4 + e.phase) * 2 - e.x) * Math.min(1, dt * 3);
      }
      if (this.boostTimer > 0) { this.boostTimer -= dt; if (this.boostTimer <= 0) this.boost = 0; }
      if (s.blackhole) for (const b of this.balls) { if (b.size < 2) continue; const R = 6 + 2 * s.blackhole, k = Math.min(1, dt * .9 * s.blackhole); for (const e of this.enemies) { if (e.boss || e.dead) continue; const d = Math.hypot(e.x - b.x, e.y - b.y, e.z - b.z); if (d < R) { e.x += (b.x - e.x) * k; e.y += (b.y - e.y) * k; e.z += (b.z - e.z) * k * .4; e.baseX = e.x; e.baseY = e.y; } } }
      // boulets
      this._ballSize = 1;
      for (const ball of this.balls) {
        const old = { x: ball.x, y: ball.y, z: ball.z }; ball.trail.push(old); if (ball.trail.length > 12) ball.trail.shift(); ball.age += dt;
        if (ball.rocket) { ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; if (ball.z >= ball.fuseZ || ball.z > 110) { this.kaboom(ball); continue; } }
        else if (ball.mega) { ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; this.shake = Math.max(this.shake || 0, .35); }   // le méga boulet file tout droit et fait trembler l'écran
        else if (ball.straight) { ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; }   // boulets des pirates : en ligne droite, sans gravité
        else { if (s.homing && !ball.ally) this.homeBall(ball, dt); ball.x += ball.vx * dt; ball.y += ball.vy * dt - 9 * dt * dt; ball.vy -= 18 * dt; ball.z += ball.vz * dt; }
        for (const e of this.enemies) {
          if (e.dead || e.escaped || ball.hitIds.has(e.id)) continue;
          const p = e.previous || e, ax = old.x - p.x, ay = old.y - p.y, az = old.z - p.z, dx = ball.x - e.x - ax, dy = ball.y - e.y - ay, dz = ball.z - e.z - az, q = clamp(-(ax * dx + ay * dy + az * dz) / (dx * dx + dy * dy + dz * dz || 1), 0, 1);
          const radius = (e.boss ? e.size * 1.25 * CB.BOSS_SCALE : 2 + (e.size - 1) * 1.3) + (ball.size - 1) * 1.2;
          if (Math.hypot(ax + q * dx, ay + q * dy, az + q * dz) < radius) {
            if (ball.rocket) { this.kaboom(ball); break; }
            ball.hitIds.add(e.id); this.hitEnemy(e, ball); if (ball.mega) { this.shake = Math.max(this.shake || 0, .7); if (!e.dead && !e.boss) e.z += 4; }
            if (ball.pierce) continue;
            if (s.bounces > (ball.bounces || 0)) { const next = this.nearest(e, 40, ball.hitIds); if (next) { ball.bounces = (ball.bounces || 0) + 1; ball.bounced = true; if (s.frostBounce) this.freezeAround(e, 8, s.frostBounce); const t = Math.max(.15, Math.hypot(next.x - ball.x, next.z - ball.z) / ball.vz); ball.vx = (next.x - ball.x) / t; ball.vz = (next.z - ball.z) / t || ball.vz; ball.vy = (next.y - ball.y + 9 * t * t) / t; continue; } }
            ball.hit = true; break;
          }
        }
      }
      if (this.sea) for (const ball of this.balls) if (!ball.hit && !ball.rocket && ball.y <= 0 && ball.z > 1) { ball.hit = true; this.splashes++; this.bursts.push({ x: ball.x, y: 0, z: ball.z, age: 0, kind: 'splash', size: .7 + ball.size * .35, life: .8 }); }   // PLOUF ! le boulet coule
      this.balls = this.balls.filter(b => !b.hit && b.z < 125 && b.z > -12 && b.y > -4 && b.y < 90);
      // ennemis qui nous atteignent
      for (const e of this.enemies) if (!e.dead && !e.boss && e.z < 3) { e.escaped = true; if (e.def.shot && this.canDodge && Math.abs(e.x - this.px) > 2.4) { this.dodged++; this.texts.push({ text: 'RATÉ !', x: e.x, y: 3, z: 5, age: 0, color: '#7fd4ff' }); if (this.sea) { this.bursts.push({ x: e.x, y: 0, z: 4, age: 0, kind: 'splash', size: 1, life: .8 }); this.splashes++; } } else if (e.def.portal) this.openPortal(e); else if (e.def.chest) this.discover(e); else if (e.def.gift || e.def.target || e.target === true) { } else if (e.def.touch) this.stunBy(e.def.touch, e); else if (e.def.status) this.afflict(e.def.status, e); else this.damage(e.damage, e); }
      this.enemies = this.enemies.filter(e => !e.dead && !e.escaped);
      for (const b of this.bursts) b.age += dt; this.bursts = this.bursts.filter(b => b.age < (b.life || .7)); this.shake = Math.max(0, (this.shake || 0) - dt * 1.4);
      for (const t of this.texts) t.age += dt; this.texts = this.texts.filter(t => t.age < 1.1);
      // objectifs
      const d = this.def;
      if (this.over) return;
      if (this.cibles && this.targetsSpawned >= this.cibles.count && !this.enemies.some(e => !e.dead && !e.escaped && (e.def.flyer || e.flyer))) this.finish(true, 'cibles');
      if (this.brigands) { this.endRoundCheck(); if (this.round >= this.brigands.rounds && !this.panels) this.finish(true, 'brigands'); }
      if (d.type === 'kill' && this.kills >= d.goal) this.finish(true);
      else if (d.type === 'sink' && this.shipsSunk >= d.goal) this.finish(true);
      else if (d.type === 'survive' && this.time >= d.seconds) this.finish(true);
      else if (d.type === 'swarm' && this.time >= d.seconds && !this.outro) this.startOutro();
      else if (d.type === 'killTimed') { if (this.kills >= d.goal) this.finish(true); else if (this.time >= d.seconds) this.finish(false, 'temps'); }
    }
    nearest(from, max, exclude) { let best = null, bd = max; for (const e of this.enemies) { if (e === from || e.dead || e.escaped || exclude?.has(e.id)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y, e.z - from.z); if (d < bd) { bd = d; best = e; } } return best; }
    hitEnemy(e, ball) {
      if (e.def.orb) { if (!ball.ally) this.hits++; this.puzzleHit(e); return; }
      const s = this.stats; let dmg = ball.dmg * (1 + this.boost); if (s.cometCap) dmg *= 1 + Math.min(1, ball.z / 70) * s.cometCap;
      const crit = (s.odin && this.shield > 0) || this.fx.cheat > 0 || this.random() < s.crit; if (crit) dmg *= 2;
      if (s.knock && !e.boss && !e.dead) e.z += 2.5 * s.knock;
      if (!ball.ally) this.hits++; this.applyDamage(e, dmg, crit, ball.mega ? 'mega' : ball.effect);
      if (ball.splash > 0) { let touched = 1; for (const o of this.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < ball.splash) { touched++; this.applyDamage(o, dmg * .6, false, 'feu'); } if (s.siphon) this.hp = Math.min(this.maxHp, this.hp + touched * s.siphon); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'fire', size: ball.splash }); }
      if (ball.chain) { let from = e; for (let i = 0; i < 2; i++) { const n = this.nearest(from, 16); if (!n) break; this.bursts.push({ x: from.x, y: from.y, z: from.z, to: { x: n.x, y: n.y, z: n.z }, age: 0, kind: 'bolt' }); this.applyDamage(n, dmg * .8, false, 'eclair'); from = n; } }
      if (ball.freeze) { for (const o of this.enemies) if (!o.boss && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < 8) o.frozen = 3; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 8 }); }
    }
    applyDamage(e, dmg, crit, effect) {
      if (e.dead || e.leaving) return;
      if (e.def.hits) { dmg = 1; crit = false; this.boatHits = (this.boatHits || 0) + 1; if (e.hp > 1) this.texts.push({ text: '💥 ' + (e.def.hits - e.hp + 1) + ' / ' + e.def.hits, x: e.x, y: e.y + 3.5, z: e.z, age: 0, color: '#ffd23f', big: true }); }   // bateau volant : chaque boulet compte pour un coup, peu importe les dégâts
      if (e.boss && e.mini && this.enemies.some(o => !o.dead && o.def.crystal)) { e.flash = .1; if (!this.shieldHint || this.time - this.shieldHint > 1.2) { this.shieldHint = this.time; this.texts.push({ text: 'CASSE LES CRISTAUX !', x: e.x, y: e.y + 5, z: e.z, age: 0, color: '#7fd4ff' }); } this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 3 }); return; }
      if (!e.boss && !this.isDecor(e) && this.enemies.some(o => !o.dead && o.def.shieldAll)) { e.flash = .1; if (!this.shieldHint || this.time - this.shieldHint > 1.2) { this.shieldHint = this.time; this.texts.push({ text: 'CASSE LES BOUCLIERS !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#4fc3ff' }); } this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 2.5 }); return; }
      if (e.boss && effect && CB.BOSS_SPECIAL.sources.includes(effect)) { const B = CB.BOSS_SPECIAL, cap = e.maxHp * B.budget - (this.spBossDealt || 0); dmg = Math.min(dmg * B.resist, Math.max(0, cap)); this.spBossDealt = (this.spBossDealt || 0) + dmg; if (dmg <= 0) { e.flash = .1; if (!this.bossHint || this.time - this.bossHint > 1.5) { this.bossHint = this.time; this.texts.push({ text: 'IL RÉSISTE !', x: e.x, y: e.y + 5, z: e.z, age: 0, color: '#ffd23f' }); } return; } }
      e.hp -= dmg; e.flash = .15; e.killedBy = effect;
      if (e.boss && e.mini && e.stage === 1 && e.hp <= e.maxHp * .5) { e.stage = 2; e.color = e.def.angry; e.powers = e.def.powers[1]; e.powerIndex = 0; this.shake = 1; this.news.push({ kind: 'boss', text: 'IL EST FÂCHÉ ! NOUVEAU : PLUIE DE ROCHERS, RUGISSEMENT', time: this.time }); this.texts.push({ text: 'GRRRR !', x: e.x, y: e.y + 5, z: e.z, age: 0, color: '#ff3a3a', big: true }); }
      if (e.boss && e.act < CB.BOSS_LEVELS.length - 1 && e.hp <= e.target) { this.bossRetreat(e); return; }
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: crit ? 'crit' : 'hit', color: e.color });
      if (crit && effect !== 'triche') this.texts.push({ text: 'CRITIQUE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f' });
      if (e.hp <= 0) this.kill(e);
    }
    kill(e) {
      e.dead = true; const s = this.stats;
      if (e.def.ship) { this.shipsSunk++; this.texts.push({ text: '⚓ COULÉ !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#ffd23f', big: true }); this.bursts.push({ x: e.x, y: 0, z: e.z, age: 0, kind: 'splash', size: 2 + e.size * .6, life: .9 }); this.splashes++; this.shake = Math.max(this.shake || 0, .3); }
      if (e.def.shot) { this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: e.type === 'bolt' ? 'pop' : 'boom', color: e.color, size: e.size });
        if (e.def.explode) { let n = 0; for (const o of this.enemies) if (o !== e && !o.dead && !o.escaped && !this.isDecor(o) && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < e.def.explode) { n++; this.applyDamage(o, this.stats.damage * 2.5, true, 'feu'); } this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'kaboom', color: '#ff8c2a', size: 5, life: .8 }); this.shake = Math.max(this.shake || 0, .4); this.texts.push({ text: n ? 'BOUM ! ' + n + ' BRÛLÉS' : 'BOUM !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ff8c2a', big: true }); }
        else if (e.type !== 'bolt') this.texts.push({ text: 'DÉSAMORCÉ !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#7fd4ff' }); return; }
      if (e.def.secretBoat) { this.boatSecret = true; this.shake = Math.max(this.shake || 0, .7); this.flash = Math.max(this.flash || 0, .4); for (let i = 0; i < 10; i++) this.bursts.push({ x: e.x + (this.random() - .5) * 5, y: e.y + (this.random() - .5) * 3, z: e.z, age: i * .04, kind: 'pop', color: i % 2 ? '#8a5a2b' : '#f1e7d0', size: 1.3 }); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ffd23f', size: 4 });
        this.texts.push({ text: '⛵ LE BATEAU SE BRISE !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#ffd23f', big: true }); this.news.push({ kind: 'discovery', text: 'UN NOUVEAU SECRET S’EST OUVERT SUR LA CARTE !', time: this.time }); return; }
      if (e.def.shieldAll) { this.shieldsBroken++; this.gold += e.def.gold; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 5 }); const left = this.enemies.some(o => o !== e && !o.dead && o.def.shieldAll); this.texts.push({ text: left ? 'BOUCLIER BRISÉ !' : 'PLUS DE BOUCLIERS : À L’ATTAQUE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#4fc3ff', big: !left }); return; }
      if (e.def.crystal) { this.crystalsBroken++; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 5 }); this.texts.push({ text: 'CRAC !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#7fd4ff' }); this.xp += 3; this.gainXp(3); if (this.boss && this.boss.mini && !this.enemies.some(o => !o.dead && o !== e && o.def.crystal)) this.texts.push({ text: 'IL EST VULNÉRABLE !', x: this.boss.x, y: this.boss.y + 5, z: this.boss.z, age: 0, color: '#ffd23f', big: true }); return; }
      if (e.def.panel) { if (e.def.bad) { this.brigandsHit++; this.gold += e.def.gold; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ffd23f', size: 3 }); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: .05, kind: 'crit', color: '#fff' }); this.texts.push({ text: e.face ? 'ATTRAPÉ !' : '🤠 BRIGAND ATTRAPÉ !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#ffd23f', big: true }); if (!(this.panels || []).some(o => o.def.bad && !o.dead)) for (const o of this.panels || []) if (o !== e && !o.dead) o.panel.life = Math.min(o.panel.life, o.panel.age + .35); }
        else { this.civilsHit++; this.hurt = .5; this.shake = Math.max(this.shake || 0, .5); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'pop', color: '#4fa3ff', size: 2 }); this.texts.push({ text: e.face ? 'OUPS ! PAS LUI !' : 'OUPS ! UN CIVIL !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#ff3a3a', big: true }); } return; }
      if (e.def.target || e.target === true) { this.targetsHit++; this.gold += e.def.gold; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ff3a3a', size: 2.5 }); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: .05, kind: 'crit', color: '#fff' });
        if (e.def.flyer || e.flyer) this.texts.push({ text: 'TOUCHÉ !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ffd23f' }); else { const n = Math.min(3, this.targetsBefore + this.targetsHit); this.texts.push({ text: '🎯 CIBLE ' + n + ' / 3 !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f', big: true }); if (n === 3 && this.targetsBefore < 3) this.news.push({ kind: 'discovery', text: 'LES TROIS CIBLES ! UN MINI-JEU APPARAÎT SUR LA CARTE', time: this.time }); } return; }
      if (e.def.gift) { this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ff4f9a', size: 2 }); this.texts.push({ text: 'CADEAU !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f', big: true }); this.pendingLevels++; if (!this.choice && !this.over) this.offerCards(); return; }
      if (e.def.hazard) { this.bombsDefused++; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 6 }); this.texts.push({ text: 'POUF !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#e5bfff' }); this.xp += 4; this.gainXp(4); return; }
      this.kills++; this.combo++; this.comboTimer = 2.5; this.bestCombo = Math.max(this.bestCombo, this.combo);
      if (e.def.portal) { this.openPortal(e); return; }
      if (e.def.chest) { this.discover(e); return; }
      this.killsBy[e.type] = (this.killsBy[e.type] || 0) + 1;
      // secret de la nuit sans fin : au centième monstre abattu, le tableau 2 apparaît sur la carte
      if (this.wi === 0 && this.vi === 0 && this.E.unlockKills && !this.secretFound && this.nightKillsBefore < this.E.unlockKills && this.nightKillsBefore + this.kills >= this.E.unlockKills) this.secretFound = true;   // 100 abattus : le tableau 2 se révèle sur la carte, sans bandeau
      // variantes spéciales : un peu plus d'or (×2) et beaucoup plus d'XP (×5)
      const mult = (e.boss ? 40 : e.elite ? 2 : 1) * (CB.TIERS[e.tier || 0].gold || 1), xpMult = (e.boss ? 40 : e.elite ? 5 : 1) * (1 + (e.tier || 0)) * (this.def.type === 'boss' ? CB.BOSS_XP : 1);
      const gold = ((CB.goldBase(this.wi) + (e.def.gold || 0)) * s.gold + s.goldFlat) * mult * CB.comboMult(this.combo) * (this.fx.magnet > 0 ? 2 : 1), xpGain = CB.xpPerKill(this.wi) * xpMult;
      // Jauge spéciale : elle se remplit avec l'XP « brute » du monstre (élite ×5, palier de couleur, boss ×40 plafonné à la moitié), et chaque lancer du tableau rend le suivant plus long (CB.SPECIAL_RAMP)
      const full = v => v > 1 - 1e-6 ? 1 : v, spXp = CB.xpPerKill(this.wi) * (e.boss ? 40 : e.elite ? 5 : 1) * (1 + (e.tier || 0));
      if (this.special && !this.specialBusy) this.charge = full(this.charge + Math.min(.5, spXp / this.spNeed(this.special, this.spUses)));
      if (this.special2 && !this.special2Busy) this.charge2 = full(this.charge2 + Math.min(.5, spXp / this.spNeed(this.special2, this.spUses2)));   // pendant une attaque à durée (licorne, prière), la jauge ne se remplit pas
      this.gold += gold; this.xp += xpGain; this.gainXp(xpGain);
      if (s.harvest) { this.boost = Math.min(2, this.boost + gold * .01 * s.harvest); this.boostTimer = 5 + (s.harvest - 1); }
      if (s.midas && e.killedBy === 'feu') { for (const o of this.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < 6 + s.midas) this.applyDamage(o, 1.5 * s.midas * s.damage, false, 'midas'); for (let i = 0; i < 3 + s.midas; i++) this.bursts.push({ x: e.x + (this.random() - .5) * 3, y: e.y + this.random() * 3, z: e.z, age: 0, kind: 'pop', color: '#ffd23f', size: .7 }); }
      if (s.lifesteal) this.hp = Math.min(this.maxHp, this.hp + s.lifesteal);
      if (!e.quiet) this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: e.boss ? 'boom' : 'pop', color: e.color, size: e.size });
      this.texts.push({ text: '+' + Math.round(gold), x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ffd23f' });
      if (e.elite) this.elitesKilled++;
      if (e.boss) { this.boss = null; if (e.mini) { this.miniBossDone = true; this.shake = 1.2; this.news.push({ kind: 'discovery', text: 'LE MÉGAOISEAU DU TEMPS EST VAINCU !', time: this.time }); for (let i = 0; i < 5; i++) this.bursts.push({ x: e.x + (this.random() - .5) * 8, y: e.y + (this.random() - .5) * 6, z: e.z, age: -i * .12, kind: 'kaboom', color: '#ffd23f', size: 8, life: 1.2 }); } else if (e.full) { this.shake = 1.2; this.texts.push({ text: '💀 BOSS VAINCU !', x: e.x, y: e.y + 5, z: e.z, age: 0, color: '#ffd23f', big: true }); for (let i = 0; i < 5; i++) this.bursts.push({ x: e.x + (this.random() - .5) * 8, y: e.y + (this.random() - .5) * 6, z: e.z, age: -i * .12, kind: 'kaboom', color: e.color, size: 8, life: 1.2 }); this.beam = null; if (e.def.next) { this.bossSpawned = false; this.spawnBoss(e.def.next, true); } else if (this.def.bossFull) this.finish(true); } else this.finish(true); }   // boss de l'éditeur (full) : le tableau continue
    }
    cardLevel(k) { let n = 0; for (const c of this.cards) if (c === k) n++; return n; }
    freezeAll(sec) { for (const e of this.enemies) if (!e.boss) e.frozen = Math.max(e.frozen, sec); this.bursts.push({ x: 0, y: 8, z: 30, age: 0, kind: 'ice', size: 40 }); this.texts.push({ text: 'GEL TOTAL !', x: 0, y: 12, z: 30, age: 0, color: '#a9e9ff' }); }
    freezeAround(e, radius, sec) { for (const o of this.enemies) if (!o.boss && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < radius) o.frozen = Math.max(o.frozen, sec); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: radius }); }
    // Cartes proposables : niveau < max, et pour un combo secret ses deux ingrédients au niveau 3. Les combos disponibles sont toujours dans le tirage.
    offerCards() {
      const ok = k => { const c = CB.CARDS[k]; if (this.cardLevel(k) >= c.max) return false; if (c.skip && c.skip(this.stats)) return false; if (c.combo) return c.needs.every(n => this.cardLevel(n) >= CB.comboNeed(n)); return true; };
      const combos = Object.keys(CB.CARDS).filter(k => CB.CARDS[k].combo && ok(k)), keys = Object.keys(CB.CARDS).filter(k => !CB.CARDS[k].combo && ok(k)), pick = [];
      while (pick.length < 3 && combos.length) pick.push(combos.splice(Math.floor(this.random() * combos.length), 1)[0]);
      while (pick.length < 3 && keys.length) pick.push(keys.splice(Math.floor(this.random() * keys.length), 1)[0]);
      if (pick.length) this.choice = pick; else this.pendingLevels = 0;
    }
    pickCard(i) { if (!this.choice) return null; const key = this.choice[i] || this.choice[0]; this.cards.push(key); CB.CARDS[key].apply(this.stats, this, this.cardLevel(key)); this.choice = null; this.pendingLevels = Math.max(0, this.pendingLevels - 1); if (this.pendingLevels > 0 && !this.over) this.offerCards(); return key; }
    damage(n, from) {
      if (this.fx.priere > 0) { if (!this.protectHint || this.time - this.protectHint > 1) { this.protectHint = this.time; this.texts.push({ text: '✝ PROTÉGÉ !', x: 0, y: 6, z: 6, age: 0, color: '#fff3a0' }); } this.bursts.push({ x: 0, y: 4, z: 6, age: 0, kind: 'ice', size: 6 }); return false; }
      if (this.fx.ghost > 0 || this.fx.teleport > 0 || this.random() < this.stats.dodge) { this.texts.push({ text: 'ESQUIVE !', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      if (this.shield > 0) { this.shield--; this.hurt = .3; this.texts.push({ text: 'BOUCLIER', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' });
        if (this.shield === 0 && this.stats.odin >= 2) { for (const e of this.enemies.slice()) if (!e.dead) this.applyDamage(e, 6 * this.stats.damage * this.stats.odin, true, 'odin'); this.bursts.push({ x: 0, y: 6, z: 12, age: 0, kind: 'boom', color: '#7fd4ff', size: 3 }); this.texts.push({ text: 'ONDE D’ODIN !', x: 0, y: 10, z: 12, age: 0, color: '#7fd4ff' }); }
        return false; }
      this.hp = Math.max(0, this.hp - n); this.hurt = .6; this.combo = 0;
      if (this.hp <= 0) this.finish(false, 'detruit');
      return true;
    }
    finish(won, reason) {
      if (this.over) return; this.over = true; this.won = won; this.reason = won ? 'gagne' : reason || 'detruit';
      if (this.brigands) { const pct = Math.max(0, this.brigandsHit - this.civilsHit) / (this.brigands.rounds * Math.max(1, Math.round(this.brigands.bads || 1))), m = this.brigands.medals; this.stars = CB.medalStars(pct, m); this.medalMax = m.length; this.won = this.stars > 0; this.reason = 'brigands'; this.bonusGold = this.brigandsHit * 3; this.bonusXp = this.brigandsHit * 4; return; }
      if (this.cibles) { const pct = this.targetsHit / this.cibles.count, m = this.cibles.medals; this.stars = CB.medalStars(pct, m); this.medalMax = m.length; this.won = this.stars > 0; this.reason = 'cibles'; this.bonusGold = this.targetsHit * 2; this.bonusXp = this.targetsHit * 3; return; }
      if (this.swarm) { const st = this.swarm.stars; this.stars = this.time >= st[2] ? 3 : this.time >= st[1] ? 2 : this.time >= st[0] ? 1 : 0; this.won = this.stars > 0; this.reason = reason || 'nuee'; this.bonusGold = Math.round(this.time / 12); this.bonusXp = Math.round(this.time / 3); return; }
      if (this.endless) { // la nuit se termine toujours « bien » : les étoiles dépendent du temps survécu
        const st = this.E.stars; this.stars = this.time >= st[2] ? 3 : this.time >= st[1] ? 2 : this.time >= st[0] ? 1 : 0; this.won = this.stars > 0; this.reason = reason || 'nuit';
        if (reason === 'portail') { this.portalDone = true; this.won = true; this.stars = Math.max(1, this.stars); }
        this.bonusGold = Math.round(this.time / 12); this.bonusXp = Math.round(this.time / 3); return;
      }
      this.stars = won ? CB.starsFor(this.hp, this.maxHp) : 0;
      if (won && this.def.reward === 'pirateWorld') { this.pirateWorldWon = true; this.texts.push({ text: '🏴‍☠️ UN CHEMIN S’OUVRE VERS LA MER DES PIRATES !', x: 0, y: 12, z: 16, age: 0, color: '#ffd23f', big: true }); }
      if (won && this.def.reward === 'pirate') { this.pirateWon = true; this.texts.push({ text: '🏴‍☠️ NOUVEAU POUVOIR : BATEAU PIRATE VOLANT !', x: 0, y: 12, z: 16, age: 0, color: '#ffd23f', big: true }); }
      this.bonusGold = won ? Math.round((6 + 6 * this.wi) * (this.vi + 1) * (this.def.type === 'boss' ? 3 : 1)) : 0;
      this.bonusXp = won ? Math.round((15 + 10 * this.wi) * (this.vi + 1)) : 0;
    }
  };
  // Encaisse les récompenses d'une vague terminée dans le profil (une seule fois).
  CB.claim = (profile, wave) => {
    if (!wave.over || wave.claimed) return null; wave.claimed = true;
    const gold = Math.round(wave.gold) + wave.bonusGold, xp = Math.round(wave.xp) + wave.bonusXp;
    profile.gold += gold; const levels = CB.Save.addXp(profile, xp);
    profile.kills += wave.kills; profile.plays++; profile.seenBy ||= {}; profile.killsBy ||= {};
    for (const [k, n] of Object.entries(wave.seenBy)) profile.seenBy[k] = (profile.seenBy[k] || 0) + n; for (const [k, n] of Object.entries(wave.killsBy)) profile.killsBy[k] = (profile.killsBy[k] || 0) + n; profile.bestCombo = Math.max(profile.bestCombo || 0, wave.bestCombo);
    let newWorld = false, newStars = 0, newNodes = 0; const S = CB.Save, worldBefore = S.worldUnlocked(profile, wave.wi + 1), revealedBefore = S.revealed(profile), portalBefore = !!profile.portal, targetsBefore = profile.targetsHit || 0, b4Before = S.stars(profile, 'foret', 3) > 0, boatBefore = !!profile.boatSecret, pirateBefore = !!profile.pirate;
    if (wave.boatSecret) profile.boatSecret = true; if (wave.pirateWon) profile.pirate = true; const pwBefore = !!profile.pirateWorld; if (wave.pirateWorldWon) profile.pirateWorld = true;
    if (wave.def.targets && wave.targetsHit) profile.targetsHit = Math.min(3, targetsBefore + wave.targetsHit);
    // les secrets comptent quel que soit le type du tableau (le 1-1 est un tableau relié « 100 à abattre », plus la nuit sans fin)
    if (wave.wi === 0 && wave.vi === 0) profile.nightKills = (profile.nightKills || 0) + wave.kills;
    if (wave.discoveries) profile.discovered = Math.min(wave.E.maxDiscoveries, (profile.discovered || 0) + wave.discoveries);
    if (wave.portalDone) profile.portal = true;
    if (wave.openEnded) profile.bestTime = Math.max(profile.bestTime || 0, Math.round(wave.time));
    if (wave.won) {
      profile.wins++; const arr = profile.progress[wave.world.id] ||= []; const before = arr[wave.vi] || 0; arr[wave.vi] = Math.max(before, wave.stars); newStars = Math.max(0, arr[wave.vi] - before);
      newWorld = !worldBefore && S.worldUnlocked(profile, wave.wi + 1) && wave.wi + 1 < CB.WORLDS.length;
    }
    newNodes = S.revealed(profile) - revealedBefore + (profile.portal && !portalBefore ? 1 : 0) + ((profile.targetsHit || 0) >= 3 && targetsBefore < 3 ? 1 : 0) + (wave.wi === 0 && wave.vi === 3 && wave.won && !b4Before ? 1 : 0) + (profile.boatSecret && !boatBefore ? 1 : 0) + (profile.pirateWorld && !pwBefore ? 1 : 0);
    return { gold, xp, levels, stars: wave.stars, newStars, newWorld, newNodes, level: profile.level, newPower: !!profile.pirate && !pirateBefore };
  };
})(window.CB);
