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
      ally: profile.allyBought && profile.ally && profile.ally !== profile.id && CB.playerById(profile.ally) ? profile.ally : null,
      regen: up('reparation') * 1,
      auto: true, // on tire en continu tant qu'on maintient ; c'est la cadence qui est lente au départ
      shots: 1 + (cannon.shots || 0),
      size: 1, // 1 = une bille ; la carte « Boulets géants » multiplie sans plafond
      splash: 0, bounces: 0, lifesteal: 0,
      // combos secrets
      fan: false, siphon: 0, knock: 0, frostBounce: 0, cometCap: 0, odin: 0, midas: 0, blackhole: 0, anesthesie: 0, harvest: 0, rafale: 0,
      slow: pm.slow || 0, dodge: pm.dodge || 0, shield: pm.shield || 0,
      effects: Object.assign({}, profile.effects || {}),
      cannon: profile.cannon || 'classique', ball: profile.ball || 'fer',
    };
  };
  CB.comboMult = combo => Math.min(2, 1 + Math.floor(combo / 5) * .25);
  CB.starsFor = (hp, maxHp) => hp >= maxHp * .7 ? 3 : hp >= maxHp * .35 ? 2 : 1;

  let nextId = 1;
  CB.Wave = class {
    // custom (optionnel) : tableau personnalisé (voir CB.Custom dans debug.js et CB.CUSTOM_WAVES dans custom-waves.js).
    constructor({ worldIndex = 0, waveIndex = 0, profile, player, random = Math.random, custom = null, carry = null }) {
      this.random = random; this.wi = worldIndex; this.vi = waveIndex; this.world = CB.WORLDS[worldIndex];
      this.def = CB.waveDef(worldIndex, waveIndex);
      custom = custom || (window.CB.CUSTOM_WAVES || {})[this.world.id + '-' + (waveIndex + 1)] || null;
      if (custom) {
        this.custom = custom; const base = CB.worldById(custom.world) || this.world;
        this.world = Object.assign({}, base, { scene: custom.scene || base.id, sky: custom.sky || base.sky, ground: custom.ground || base.ground, space: !!custom.space, enemies: (custom.random && custom.random.enemies || []).filter(k => CB.ENEMIES[k]), boss: custom.boss || null });
        this.def = { world: worldIndex, index: waveIndex, type: custom.type || 'kill', goal: custom.goal || 10, seconds: custom.seconds || 40, density: custom.density || 1, name: custom.name || 'Tableau', text: custom.text || '' };
        this.schedule = (custom.spawns || []).filter(s => CB.ENEMIES[s.type]).map(s => ({ type: s.type, elite: !!s.elite, every: Math.max(.05, +s.every || .5), interval: Math.max(.1, +s.interval || 5), count: Math.max(1, Math.round(+s.count || 1)), next: Math.max(0, +s.at || 0), left: Math.max(1, Math.round(+s.count || 1)), packsLeft: Math.max(1, Math.round(+s.packs || 1)) - 1 }));
      }
      this.stats = CB.stats(profile || CB.Save.blank('x'), player);
      this.maxHp = this.stats.maxHp; this.hp = this.maxHp; this.shield = this.stats.shield;
      this.time = 0; this.intro = 2.2; this.kills = 0; this.gold = 0; this.xp = 0; this.shots = 0; this.hits = 0;
      this.enemies = []; this.balls = []; this.bursts = []; this.texts = []; this.cards = []; this.choice = null;
      this.spawn = .8; this.cooldown = 0; this.aim = { x: CB.VIEW.cx, y: CB.VIEW.horizon * .55 }; this.over = false; this.won = false; this.reason = '';
      this.lastElite = -99; this.combo = 0; this.comboTimer = 0; this.bestCombo = 0; this.boss = null; this.bossSpawned = false;
      this.bossFight = 0; this.bossHpLeft = null; this.bossActs = 0; // tableau de boss : acte en cours (0-2), PV qu'il lui reste entre deux actes, actes joués
      this.hurt = 0; this.regenTimer = 0; this.recoil = 0; this.lastEffect = null; this.elitesKilled = 0;
      this.ally = this.stats.ally ? { id: this.stats.ally, cooldown: 1.2, recoil: 0, aim: { x: CB.VIEW.allyOrigin, y: CB.VIEW.horizon * .55 }, shots: 0 } : null;
      // nuit sans fin
      this.seenBy = {}; this.killsBy = {}; this.boost = 0; this.boostTimer = 0;
      this.runXp = 0; this.runLevel = 1; this.pendingLevels = 0; // niveaux gagnés pendant la vague : chacun offre trois cartes
      this.E = this.def.endless === 'dinos' ? CB.ENDLESS_DINOS : CB.ENDLESS; // réglages du mode sans fin selon le tableau
      this.scenery = this.def.scene && CB.SCENERY[this.def.scene] ? Object.assign({}, this.world, CB.SCENERY[this.def.scene]) : null;
      this.endless = this.def.type === 'endless'; this.discoveries = 0; this.discoveredBefore = (profile && profile.discovered) || 0; this.seen = []; this.news = []; this.nextChest = this.E.chest ? this.E.chest.firstAt : Infinity; this.chestsSeen = 0;
      this.seenBefore = (profile && profile.seenBy) || {}; this.nightKillsBefore = (profile && profile.nightKills) || 0; this.portalSeen = !!(profile && profile.portal); this.portal = null; this.portalSpawned = false; this.portalDone = false; this.secretFound = false;
      // Voyage par le portail : on garde les cartes, le niveau de la partie et la vie du tableau précédent.
      if (carry) { for (const k of carry.cards || []) if (CB.CARDS[k]) { this.cards.push(k); CB.CARDS[k].apply(this.stats, this, this.cardLevel(k)); } this.runLevel = carry.runLevel || 1; this.runXp = carry.runXp || 0; this.maxHp = this.stats.maxHp; this.shield = this.stats.shield; this.hp = Math.max(1, Math.round(this.maxHp * (carry.hpRatio == null ? 1 : carry.hpRatio))); this.news.push({ kind: 'discovery', text: 'BIENVENUE DANS LE PASSÉ : LA VALLÉE DES DINOSAURES', time: 0 }); }
    }
    get runProgress() { return Math.min(1, this.runXp / CB.runXpFor(this.runLevel)); }
    // XP de la vague : à chaque niveau, un tirage de trois cartes (les niveaux en attente s'enchaînent).
    gainXp(n) {
      this.runXp += n; let need = CB.runXpFor(this.runLevel);
      while (this.runXp >= need) { this.runXp -= need; this.runLevel++; this.pendingLevels++; this.texts.push({ text: 'NIVEAU ' + this.runLevel + ' !', x: 0, y: 9, z: 20, age: 0, color: '#ffd23f' }); need = CB.runXpFor(this.runLevel); }
      if (this.pendingLevels > 0 && !this.choice && !this.over) this.offerCards();
    }
    get timeLeft() { return this.def.seconds != null ? Math.max(0, this.def.seconds - this.time) : null; }
    get progress() { const d = this.def; if (this.endless) { const E = this.E.chest; if (!E) return 0; const prev = this.chestsSeen ? E.firstAt + (this.chestsSeen - 1) * E.every : 0; return Math.min(1, (this.time - prev) / (this.nextChest - prev)); } if (d.type === 'kill' || d.type === 'killTimed') return Math.min(1, this.kills / d.goal); if (d.type === 'survive') return Math.min(1, this.time / d.seconds); if (this.boss) return 1 - this.boss.hp / this.boss.maxHp; return 0; }
    radiusOf(e) { return (e.boss ? e.size * 1.25 : 2 + (e.size - 1) * 1.3) * (this._ballSize || 1); }
    // Profondeur visée : l'ennemi sous le réticule, sinon une distance moyenne.
    target() {
      let depth = 45, best = Infinity;
      for (const e of this.enemies) { const p = CB.project(e), d = Math.hypot(p.x - this.aim.x, p.y - this.aim.y); if (d < Math.max(28, p.scale * 2.3 * e.size) && d < best) { best = d; depth = e.boss ? e.z : e.z * 65 / (65 + e.speed); } }
      const t = depth / (CB.BASE_SPEED * this.stats.range);
      return Object.assign(CB.unproject(this.aim.x, this.aim.y, depth), { t });
    }
    rollEffect() { for (const [key, lvl] of Object.entries(this.stats.effects)) if (lvl > 0 && this.random() < lvl * CB.EFFECT_CHANCE) return key; return null; }
    // Lance un (ou plusieurs) boulets depuis la position x "origin" (0 = notre canon, CB.HELPER.x = le coéquipier).
    launch(origin, target, dmgMult = 1, ally = false) {
      const s = this.stats, t = target.t, vz = CB.BASE_SPEED * s.range, effect = this.rollEffect();
      const count = s.shots + (effect === 'etoiles' ? 2 : 0), spread = (effect === 'etoiles' ? 3.2 : 2.4) * (s.fan ? 1.8 : 1);
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * spread, tx = target.x + off;
        this.balls.push({ x: origin, y: 1.8, z: 0, vx: (tx - origin) / t, vy: (target.y - 1.8 + 9 * t * t) / t, vz, trail: [], dmg: s.damage * dmgMult, size: s.size * (effect === 'bowling' ? 2.2 : 1) * (effect === 'etoiles' ? .8 : 1),
          pierce: effect === 'bowling', splash: effect === 'feu' ? 6 : s.splash, chain: effect === 'eclair', freeze: effect === 'neige', effect, ally, hitIds: new Set(), bounced: false, age: 0 });
      }
      return effect;
    }
    fire() {
      if (this.over || this.choice || this.cooldown > 0) return false;
      this.lastEffect = this.launch(0, this.target()); this.cooldown = CB.BASE_COOLDOWN / this.stats.rate; this.shots++; this.recoil = 1;
      return true;
    }
    // Le coéquipier vise l'ennemi le plus proche et tire dès qu'il est rechargé.
    updateAlly(dt) {
      const a = this.ally, s = this.stats; a.cooldown = Math.max(0, a.cooldown - dt); a.recoil = Math.max(0, a.recoil - dt * 4);
      let best = null; for (const e of this.enemies) if (!e.dead && !e.escaped && e.z > 4 && (!best || e.z < best.z)) best = e;
      if (!best) return;
      const p = CB.project(best); a.aim.x += (p.x - a.aim.x) * Math.min(1, dt * 6); a.aim.y += (p.y - a.aim.y) * Math.min(1, dt * 6);
      if (a.cooldown > 0 || this.time < this.intro) return;
      const depth = best.boss ? best.z : best.z * 65 / (65 + best.speed), t = depth / (CB.BASE_SPEED * s.range);
      this.launch(CB.VIEW.allyX, { x: best.x, y: best.y, z: depth, t }, CB.HELPER.damage, true); a.cooldown = CB.BASE_COOLDOWN / s.rate; a.recoil = 1; a.shots++;
    }
    // Multiplicateur de PV du moment : tableau personnalisé, et montée progressive de la nuit sans fin.
    hpMult() { const E = this.E; return ((this.custom || {}).hpScale || 1) * (this.endless ? 1 + Math.floor(this.time / E.hpRamp) * E.hpPerRamp : 1); }
    spawnEnemy(type, at, forceElite, tier = 0) {
      const def = CB.ENEMIES[type], r = this.random, wi = this.wi, cs = this.custom || {}, T = CB.TIERS[tier] || CB.TIERS[0];
      const elite = forceElite != null ? (forceElite && !def.noElite) : !def.noElite && !at && this.time > 8 && this.time - this.lastElite > 11 && !this.enemies.some(e => e.elite) && r() < .13;
      if (elite) this.lastElite = this.time;
      const e = { id: nextId++, type, def, elite, tier, name: (elite ? def.variant.name : def.name) + (T.name ? ' ' + T.name : ''), color: elite ? def.variant.color : (T.color || def.color), size: def.size * (elite ? 1.25 : 1) * (tier ? 1 + tier * .08 : 1),
        hp: def.hp * CB.hpScale(wi) * this.hpMult() * T.hp * (elite ? 3 : 1), speed: def.speed * CB.speedScale(wi) * (cs.speedScale || 1) * T.speed * (.9 + r() * .25) * (elite ? 1.15 : 1), damage: def.damage,
        x: 0, baseX: 0, y: 0, baseY: 0, z: at ? at.z : 80 + r() * 12, phase: r() * 6.28, age: 0, frozen: 0, amp: Math.min(1, CB.VIEW.spread / 22) };
      // Position : parfois (35 %) les monstres arrivent très larges, jusqu'au bord de la zone visible ; sinon plus groupés au centre.
      { const V = CB.VIEW, wide = r() < .35, sx = V.spread * (wide ? 1 : .6), sy = Math.min(17, V.spreadY), margin = 9 * e.amp;
        e.x = at ? at.x : (r() - .5) * 2 * sx; e.baseX = at ? at.x : Math.max(-V.spread + margin, Math.min(V.spread - margin, e.x * .85));
        e.y = at ? at.y : 4 + r() * (sy - 4); e.baseY = at ? e.y : 4 + r() * (sy - 4); }
      e.maxHp = e.hp; if (at) e.baseX = at.x;
      if (def.shot) { e.x = at.x; e.y = at.y; }
      if (def.chest) { e.y = 4 + r() * 6; e.z = 95; }
      if (!def.chest && !def.shot) this.seenBy[type] = (this.seenBy[type] || 0) + 1;
      if (this.endless && !def.chest && !this.seen.includes(type)) { this.seen.push(type); if (!(this.seenBefore[type] > 0)) this.news.push({ kind: 'monster', text: 'NOUVEAU MONSTRE : ' + def.name.toUpperCase(), time: this.time }); }
      this.enemies.push(e); return e;
    }
    // Nuit sans fin : choix du style (les derniers débloqués sont favorisés) et du palier de couleur selon le temps.
    pickEndless() {
      const E = this.E, r = this.random, avail = E.roster.filter((k, i) => E.firstAt[i] <= this.time && CB.ENEMIES[k]);
      const type = avail[Math.min(avail.length - 1, Math.floor(Math.pow(r(), .65) * avail.length))] || 'bat';
      let tier = 0; for (let ti = CB.TIERS.length - 1; ti >= 1; ti--) { const p = Math.min(E.tierMax[ti], Math.max(0, (this.time - E.tierFrom[ti]) / E.tierRamp[ti]) * E.tierMax[ti]); if (this.time >= E.tierFrom[ti] && r() < p) { tier = ti; break; } }
      return { type, tier };
    }
    discover(e) {
      this.discoveries++; this.chestsFound = (this.chestsFound || 0) + 1; const s = this.stats;
      const gold = (CB.goldBase(this.wi) + e.def.gold) * s.gold * 3; this.gold += gold; this.xp += 10; this.gainXp(10);
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ffd23f', size: 2 });
      const left = this.E.maxDiscoveries - Math.min(this.E.maxDiscoveries, (this.discoveredBefore || 0) + this.discoveries);
      this.texts.push({ text: 'DÉCOUVERTE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f' });
      this.news.push({ kind: 'discovery', text: left >= 0 && (this.discoveredBefore || 0) + this.discoveries <= this.E.maxDiscoveries ? 'DÉCOUVERTE ! UN NOUVEAU TABLEAU APPARAÎT SUR LA CARTE' : 'COFFRE MYSTÈRE : +' + Math.round(gold) + ' PIÈCES', time: this.time });
    }
    // Le coffre doré touché : un portail bleu s'ouvre, les monstres disparaissent, puis on est transporté dans le passé (finish 'portail').
    openPortal(e) {
      if (this.portal) return; this.portal = { t: 0, x: e.x, y: e.y, z: e.z }; e.dead = true;
      for (const o of this.enemies) if (!o.boss) o.dead = true;
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#7fd4ff', size: 3 });
      this.texts.push({ text: 'UN PORTAIL S’OUVRE !', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#8fd6ff' });
      this.news.push({ kind: 'discovery', text: '🌀 UN PORTAIL VERS LE PASSÉ S’OUVRE !', time: this.time });
    }
    bossAttack(b, power) {
      const at = { x: b.x, y: b.y - 1, z: b.z - 2 };
      if (power === 'eventail') { for (const dx of [-7, 0, 7]) this.spawnEnemy('bolt', { x: b.x + dx, y: b.y - 1, z: b.z - 2 }); }
      else this.spawnEnemy(power, at);
      this.texts.push({ text: power === 'bolt' ? '!' : CB.BOSS_POWER_NAMES[power].toUpperCase() + ' !', x: b.x, y: b.y + 4, z: b.z, age: 0, color: power === 'rayon' ? '#b14fff' : '#ff3a3a' });
    }
    spawnBoss() {
      const def = CB.BOSSES[this.world.boss]; if (!def) return null; const cs = this.custom || {};
      const b = { id: nextId++, type: 'boss', boss: true, def, name: def.name, color: def.color, size: def.size, hp: def.hp * CB.hpScale(this.wi) * (cs.hpScale || 1), speed: 6, damage: 20, x: 0, y: 11, z: 100, baseX: 0, baseY: 11, phase: 0, age: 0, frozen: 0, minionTimer: def.every, boltTimer: def.boltEvery * 1.5, hover: 24 };
      b.maxHp = b.hp; if (this.bossHpLeft != null) b.hp = this.bossHpLeft;
      b.act = this.bossFight; b.powers = CB.BOSS_POWERS[Math.min(b.act, CB.BOSS_POWERS.length - 1)]; b.powerIndex = 0; b.target = b.maxHp * (2 - b.act) / 3; // PV à atteindre pour finir l'acte
      this.boss = b; this.bossSpawned = true; this.bossActs++; this.enemies.push(b);
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
    spawnInterval() { if (this.endless) return Math.max(.3, 1.25 - this.time * .0025) / this.def.density; return Math.max(.32, (1.3 - this.time * .006) / this.def.density / (1 + this.wi * .12)); }
    update(dt) {
      if (this.over || this.choice) return;
      dt = clamp(dt, 0, .05); this.time += dt; const s = this.stats, r = this.random;
      if (this.portal) { this.portal.t += dt; this.enemies = this.enemies.filter(e => !e.dead); for (const b of this.bursts) b.age += dt; this.bursts = this.bursts.filter(b => b.age < 1); for (const tx of this.texts) tx.age += dt; this.texts = this.texts.filter(tx => tx.age < 1.4); if (this.portal.t >= CB.PORTAL_TIME) this.finish(true, 'portail'); return; }
      this.cooldown = Math.max(0, this.cooldown - dt); this.recoil = Math.max(0, this.recoil - dt * 4); this.hurt = Math.max(0, this.hurt - dt);
      this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
      if (this.ally) this.updateAlly(dt);
      if (s.regen > 0) { this.regenTimer += dt; if (this.regenTimer >= 5) { this.regenTimer -= 5; this.hp = Math.min(this.maxHp, this.hp + s.regen); } }
      // apparitions
      if (this.time >= this.intro) {
        this.spawn -= dt;
        const randomOn = !this.custom || (this.custom.random && this.custom.random.enabled !== false && this.world.enemies.length);
        const bossOnly = this.def.type === 'boss' && !!this.boss; // pendant un acte, le boss est seul devant nous
        if (this.spawn <= 0 && !bossOnly) { if (this.endless && !this.custom) { const pk = this.pickEndless(); this.spawnEnemy(pk.type, null, undefined, pk.tier); } else if (randomOn) { const list = this.world.enemies; this.spawnEnemy(list[Math.floor(r() * list.length)]); } this.spawn = this.spawnInterval(); }
        // coffres mystères (une fois le tableau 2 mérité), puis le coffre doré, unique, après portalAt secondes
        if (this.endless && this.E.chest && this.time >= this.nextChest && this.nightKillsBefore + this.kills >= this.E.unlockKills) { this.spawnEnemy('coffre'); this.chestsSeen++; this.nextChest += this.E.chest.every; }
        if (this.endless && this.E.portalAt && !this.custom && !this.portalSeen && !this.portalSpawned && this.time >= this.E.portalAt) { this.spawnEnemy('coffreOr'); this.portalSpawned = true; }
        // le boss sort quand le niveau de partie atteint le palier de l'acte, et seulement une fois le tirage de cartes réglé
        if (this.def.type === 'boss' && !this.boss && this.world.boss && this.bossFight < CB.BOSS_LEVELS.length && this.runLevel >= CB.BOSS_LEVELS[this.bossFight] && !this.choice && !this.pendingLevels) { for (const o of this.enemies) if (!o.boss) { o.dead = true; this.bursts.push({ x: o.x, y: o.y, z: o.z, age: 0, kind: 'pop', color: o.color }); } this.spawnBoss(); }
      }
      // arrivées planifiées (tableaux personnalisés) : paquets de X ennemis, répétés toutes les N secondes
      if (this.schedule) for (const sp of this.schedule) while (sp.next != null && this.time >= sp.next) {
        this.spawnEnemy(sp.type, null, sp.elite); sp.left--;
        if (sp.left > 0) sp.next += sp.every; else if (sp.packsLeft > 0) { sp.packsLeft--; sp.left = sp.count; sp.next += sp.interval; } else sp.next = null;
      }
      const slowAll = 1 - Math.min(.6, s.slow);
      for (const e of this.enemies) {
        e.previous = { x: e.x, y: e.y, z: e.z }; e.age += dt; e.frozen = Math.max(0, e.frozen - dt);
        const speed = e.speed * slowAll * (e.frozen > 0 ? .5 : 1);
        if (e.boss) {
          if (e.leaving) { e.z += (speed + 18) * dt; e.y += dt * 3; if (e.z > 130) e.dead = true; continue; }
          if (e.z > e.hover) e.z = Math.max(e.hover, e.z - speed * dt);
          else { e.x = Math.sin(e.age * .5) * 10 * Math.min(1, CB.VIEW.spread / 22); e.y = Math.min(CB.VIEW.spreadY - 3, 10) + Math.sin(e.age * .8) * 3;
            // attaques spéciales en rotation ; de plus en plus vite d'un acte à l'autre
            e.boltTimer -= dt; if (e.boltTimer <= 0) { e.boltTimer = e.def.boltEvery * (1 - .18 * e.act); this.bossAttack(e, e.powers[e.powerIndex++ % e.powers.length]); } }
          continue;
        }
        e.z -= speed * dt;
        const d = e.def;
        if (d.shot) { e.x += (0 - e.x) * Math.min(1, speed * dt / Math.max(e.z, 1)); e.y += (2 - e.y) * Math.min(1, speed * dt / Math.max(e.z, 1));
          if (d.hold && e.z <= d.hold) { e.z = d.hold; e.fuse = (e.fuse == null ? d.fuse : e.fuse) - dt; if (e.fuse <= 0) { e.dead = true; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'boom', color: '#ff8c2a', size: 3 }); this.damage(e.damage, e); } } }
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
        const old = { x: ball.x, y: ball.y, z: ball.z }; ball.trail.push(old); if (ball.trail.length > 8) ball.trail.shift(); ball.age += dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt - 9 * dt * dt; ball.vy -= 18 * dt; ball.z += ball.vz * dt;
        for (const e of this.enemies) {
          if (e.dead || e.escaped || ball.hitIds.has(e.id)) continue;
          const p = e.previous || e, ax = old.x - p.x, ay = old.y - p.y, az = old.z - p.z, dx = ball.x - e.x - ax, dy = ball.y - e.y - ay, dz = ball.z - e.z - az, q = clamp(-(ax * dx + ay * dy + az * dz) / (dx * dx + dy * dy + dz * dz || 1), 0, 1);
          const radius = (e.boss ? e.size * 1.25 : 2 + (e.size - 1) * 1.3) + (ball.size - 1) * 1.2;
          if (Math.hypot(ax + q * dx, ay + q * dy, az + q * dz) < radius) {
            ball.hitIds.add(e.id); this.hitEnemy(e, ball);
            if (ball.pierce) continue;
            if (s.bounces > (ball.bounces || 0)) { const next = this.nearest(e, 40, ball.hitIds); if (next) { ball.bounces = (ball.bounces || 0) + 1; ball.bounced = true; if (s.frostBounce) this.freezeAround(e, 8, s.frostBounce); const t = Math.max(.15, Math.hypot(next.x - ball.x, next.z - ball.z) / ball.vz); ball.vx = (next.x - ball.x) / t; ball.vz = (next.z - ball.z) / t || ball.vz; ball.vy = (next.y - ball.y + 9 * t * t) / t; continue; } }
            ball.hit = true; break;
          }
        }
      }
      this.balls = this.balls.filter(b => !b.hit && b.z < 125 && b.y > -4);
      // ennemis qui nous atteignent
      for (const e of this.enemies) if (!e.dead && !e.boss && e.z < 3) { e.escaped = true; if (e.def.portal) this.openPortal(e); else if (e.def.chest) this.discover(e); else this.damage(e.damage, e); }
      this.enemies = this.enemies.filter(e => !e.dead && !e.escaped);
      for (const b of this.bursts) b.age += dt; this.bursts = this.bursts.filter(b => b.age < .7);
      for (const t of this.texts) t.age += dt; this.texts = this.texts.filter(t => t.age < 1.1);
      // objectifs
      const d = this.def;
      if (this.over) return;
      if (d.type === 'kill' && this.kills >= d.goal) this.finish(true);
      else if (d.type === 'survive' && this.time >= d.seconds) this.finish(true);
      else if (d.type === 'killTimed') { if (this.kills >= d.goal) this.finish(true); else if (this.time >= d.seconds) this.finish(false, 'temps'); }
    }
    nearest(from, max, exclude) { let best = null, bd = max; for (const e of this.enemies) { if (e === from || e.dead || e.escaped || exclude?.has(e.id)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y, e.z - from.z); if (d < bd) { bd = d; best = e; } } return best; }
    hitEnemy(e, ball) {
      const s = this.stats; let dmg = ball.dmg * (1 + this.boost); if (s.cometCap) dmg *= 1 + Math.min(1, ball.z / 70) * s.cometCap;
      const crit = (s.odin && this.shield > 0) || this.random() < s.crit; if (crit) dmg *= 2;
      if (s.knock && !e.boss && !e.dead) e.z += 2.5 * s.knock;
      if (!ball.ally) this.hits++; this.applyDamage(e, dmg, crit, ball.effect);
      if (ball.splash > 0) { let touched = 1; for (const o of this.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < ball.splash) { touched++; this.applyDamage(o, dmg * .6, false, 'feu'); } if (s.siphon) this.hp = Math.min(this.maxHp, this.hp + touched * s.siphon); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'fire', size: ball.splash }); }
      if (ball.chain) { let from = e; for (let i = 0; i < 2; i++) { const n = this.nearest(from, 16); if (!n) break; this.bursts.push({ x: from.x, y: from.y, z: from.z, to: { x: n.x, y: n.y, z: n.z }, age: 0, kind: 'bolt' }); this.applyDamage(n, dmg * .8, false, 'eclair'); from = n; } }
      if (ball.freeze) { for (const o of this.enemies) if (!o.boss && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < 8) o.frozen = 3; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 8 }); }
    }
    applyDamage(e, dmg, crit, effect) {
      if (e.dead || e.leaving) return; e.hp -= dmg; e.flash = .15; e.killedBy = effect;
      if (e.boss && e.act < CB.BOSS_LEVELS.length - 1 && e.hp <= e.target) { this.bossRetreat(e); return; }
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: crit ? 'crit' : 'hit', color: e.color });
      if (crit) this.texts.push({ text: 'CRITIQUE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f' });
      if (e.hp <= 0) this.kill(e);
    }
    kill(e) {
      e.dead = true; const s = this.stats;
      if (e.def.shot) { this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: e.type === 'bolt' ? 'pop' : 'boom', color: e.color, size: e.size }); if (e.type !== 'bolt') this.texts.push({ text: 'DÉSAMORCÉ !', x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#7fd4ff' }); return; }
      this.kills++; this.combo++; this.comboTimer = 2.5; this.bestCombo = Math.max(this.bestCombo, this.combo);
      if (e.def.portal) { this.openPortal(e); return; }
      if (e.def.chest) { this.discover(e); return; }
      this.killsBy[e.type] = (this.killsBy[e.type] || 0) + 1;
      // secret de la nuit sans fin : au centième monstre abattu, le tableau 2 apparaît sur la carte
      if (this.endless && this.E.unlockKills && !this.secretFound && this.nightKillsBefore < this.E.unlockKills && this.nightKillsBefore + this.kills >= this.E.unlockKills) { this.secretFound = true; this.news.push({ kind: 'discovery', text: 'DÉCOUVERTE ! UN NOUVEAU TABLEAU APPARAÎT SUR LA CARTE', time: this.time }); this.texts.push({ text: 'SECRET DÉCOUVERT !', x: 0, y: 9, z: 20, age: 0, color: '#ffd23f' }); }
      // variantes spéciales : un peu plus d'or (×2) et beaucoup plus d'XP (×5)
      const mult = (e.boss ? 40 : e.elite ? 2 : 1) * (CB.TIERS[e.tier || 0].gold || 1), xpMult = (e.boss ? 40 : e.elite ? 5 : 1) * (1 + (e.tier || 0)) * (this.def.type === 'boss' ? CB.BOSS_XP : 1);
      const gold = ((CB.goldBase(this.wi) + (e.def.gold || 0)) * s.gold + s.goldFlat) * mult * CB.comboMult(this.combo), xpGain = CB.xpPerKill(this.wi) * xpMult;
      this.gold += gold; this.xp += xpGain; this.gainXp(xpGain);
      if (s.harvest) { this.boost = Math.min(2, this.boost + gold * .01 * s.harvest); this.boostTimer = 5 + (s.harvest - 1); }
      if (s.midas && e.killedBy === 'feu') { for (const o of this.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < 6 + s.midas) this.applyDamage(o, 1.5 * s.midas * s.damage, false, 'midas'); for (let i = 0; i < 3 + s.midas; i++) this.bursts.push({ x: e.x + (this.random() - .5) * 3, y: e.y + this.random() * 3, z: e.z, age: 0, kind: 'pop', color: '#ffd23f', size: .7 }); }
      if (s.lifesteal) this.hp = Math.min(this.maxHp, this.hp + s.lifesteal);
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: e.boss ? 'boom' : 'pop', color: e.color, size: e.size });
      this.texts.push({ text: '+' + Math.round(gold), x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ffd23f' });
      if (e.elite) this.elitesKilled++;
      if (e.boss) { this.boss = null; this.finish(true); }
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
      if (this.random() < this.stats.dodge) { this.texts.push({ text: 'ESQUIVE !', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      if (this.shield > 0) { this.shield--; this.hurt = .3; this.texts.push({ text: 'BOUCLIER', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' });
        if (this.shield === 0 && this.stats.odin >= 2) { for (const e of this.enemies.slice()) if (!e.dead) this.applyDamage(e, 6 * this.stats.damage * this.stats.odin, true, 'odin'); this.bursts.push({ x: 0, y: 6, z: 12, age: 0, kind: 'boom', color: '#7fd4ff', size: 3 }); this.texts.push({ text: 'ONDE D’ODIN !', x: 0, y: 10, z: 12, age: 0, color: '#7fd4ff' }); }
        return false; }
      this.hp = Math.max(0, this.hp - n); this.hurt = .6; this.combo = 0;
      if (this.hp <= 0) this.finish(false, 'detruit');
      return true;
    }
    finish(won, reason) {
      if (this.over) return; this.over = true; this.won = won; this.reason = won ? 'gagne' : reason || 'detruit';
      if (this.endless) { // la nuit se termine toujours « bien » : les étoiles dépendent du temps survécu
        const st = this.E.stars; this.stars = this.time >= st[2] ? 3 : this.time >= st[1] ? 2 : this.time >= st[0] ? 1 : 0; this.won = this.stars > 0; this.reason = reason || 'nuit';
        if (reason === 'portail') { this.portalDone = true; this.won = true; this.stars = Math.max(1, this.stars); }
        this.bonusGold = Math.round(this.time / 8); this.bonusXp = Math.round(this.time / 3); return;
      }
      this.stars = won ? CB.starsFor(this.hp, this.maxHp) : 0;
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
    let newWorld = false, newStars = 0, newNodes = 0; const S = CB.Save, worldBefore = S.worldUnlocked(profile, wave.wi + 1);
    if (wave.endless) {
      const revealedBefore = S.revealed(profile), portalBefore = !!profile.portal;
      if (wave.wi === 0 && wave.vi === 0) profile.nightKills = (profile.nightKills || 0) + wave.kills;
      profile.discovered = Math.min(wave.E.maxDiscoveries, (profile.discovered || 0) + wave.discoveries);
      if (wave.portalDone) profile.portal = true;
      newNodes = S.revealed(profile) - revealedBefore + (profile.portal && !portalBefore ? 1 : 0);
      profile.bestTime = Math.max(profile.bestTime || 0, Math.round(wave.time));
    }
    if (wave.won) {
      profile.wins++; const arr = profile.progress[wave.world.id] ||= []; const before = arr[wave.vi] || 0; arr[wave.vi] = Math.max(before, wave.stars); newStars = Math.max(0, arr[wave.vi] - before);
      newWorld = !worldBefore && S.worldUnlocked(profile, wave.wi + 1) && wave.wi + 1 < CB.WORLDS.length;
    }
    return { gold, xp, levels, stars: wave.stars, newStars, newWorld, newNodes, level: profile.level };
  };
})(window.CB);
