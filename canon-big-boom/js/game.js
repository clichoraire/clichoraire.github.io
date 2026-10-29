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
    return { w, h, cx: w / 2, size, f, fy, ground, muzzle, horizon: muzzle - 2.2 * fy / 18, allySize, allyOrigin, allyLift: w < h ? h * .08 : 0, allyX: -(w / 2 - allyOrigin - 1.05 * allySize) * 18 / f };
  };
  CB.VIEW = CB.layout(960, 640);
  CB.setView = (w, h) => { if (CB.VIEW.w !== w || CB.VIEW.h !== h) CB.VIEW = CB.layout(w, h); return CB.VIEW; };
  CB.project = p => { const V = CB.VIEW, k = p.z + 18; return { x: V.cx + p.x * V.f / k, y: V.horizon - (p.y - 4) * V.fy / k, scale: V.f / k }; };
  // Point d'écran -> coordonnées du monde à la profondeur donnée.
  CB.unproject = (x, y, depth) => { const V = CB.VIEW, k = depth + 18; return { x: (x - V.cx) * k / V.f, y: 4 - (y - V.horizon) * k / V.fy, z: depth }; };
  CB.clampAim = (x, y) => { const V = CB.VIEW; return { x: Math.max(16, Math.min(V.w - 16, x)), y: Math.max(16, Math.min(V.horizon + V.size * .5, y)) }; };
  CB.BASE_COOLDOWN = .42; CB.BASE_SPEED = 65; CB.BASE_HP = 50;

  // Stats de tir à partir du profil (améliorations, canon, niveau) et du talent du personnage.
  CB.stats = (profile, player) => {
    const up = k => profile.upgrades?.[k] || 0, tal = k => profile.talents?.[k] || 0, cannon = CB.CANNONS[profile.cannon] || CB.CANNONS.classique, cm = cannon.mods || {}, pm = player?.perk?.mods || {};
    const level = profile.level || 1;
    return {
      rate: (1 + .065 * up('cadence') + .04 * tal('cadence')) * (1 + (cm.rate || 0)) * (1 + (pm.rate || 0)),
      range: (1 + .07 * up('portee') + .04 * tal('portee')) * (1 + (cm.range || 0)) * (1 + (pm.range || 0)),
      damage: (1 + .15 * up('degats') + .06 * tal('degats')) * (1 + (cm.damage || 0)) * (1 + (pm.damage || 0)),
      maxHp: CB.BASE_HP + 10 * up('vie') + 10 * tal('vie') + (pm.hp || 0),
      gold: (1 + .12 * up('butin') + .05 * tal('butin')) * (1 + (cm.gold || 0)) * (1 + (pm.gold || 0)),
      goldFlat: 0,
      crit: .03 * up('critique') + .02 * tal('critique') + (cm.crit || 0) + (pm.crit || 0),
      level,
      ally: profile.allyBought && profile.ally && profile.ally !== profile.id && CB.playerById(profile.ally) ? profile.ally : null,
      regen: up('reparation'),
      auto: up('auto') > 0 || !!cm.auto || !!pm.auto,
      shots: 1 + (cannon.shots || 0),
      size: 1, splash: 0, ricochet: false, lifesteal: 0,
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
    constructor({ worldIndex = 0, waveIndex = 0, profile, player, random = Math.random, custom = null }) {
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
      this.hurt = 0; this.regenTimer = 0; this.recoil = 0; this.lastEffect = null; this.elitesKilled = 0;
      this.ally = this.stats.ally ? { id: this.stats.ally, cooldown: 1.2, recoil: 0, aim: { x: CB.VIEW.allyOrigin, y: CB.VIEW.horizon * .55 }, shots: 0 } : null;
    }
    get timeLeft() { return this.def.seconds != null ? Math.max(0, this.def.seconds - this.time) : null; }
    get progress() { const d = this.def; if (d.type === 'kill' || d.type === 'killTimed') return Math.min(1, this.kills / d.goal); if (d.type === 'survive') return Math.min(1, this.time / d.seconds); if (this.boss) return 1 - this.boss.hp / this.boss.maxHp; return 0; }
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
      const count = s.shots + (effect === 'etoiles' ? 2 : 0), spread = effect === 'etoiles' ? 3.2 : 2.4;
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
    spawnEnemy(type, at, forceElite) {
      const def = CB.ENEMIES[type], r = this.random, wi = this.wi, cs = this.custom || {};
      const elite = forceElite != null ? (forceElite && !def.noElite) : !def.noElite && !at && this.time > 8 && this.time - this.lastElite > 11 && !this.enemies.some(e => e.elite) && r() < .13;
      if (elite) this.lastElite = this.time;
      const e = { id: nextId++, type, def, elite, name: elite ? def.variant.name : def.name, color: elite ? def.variant.color : def.color, size: def.size * (elite ? 1.25 : 1),
        hp: def.hp * CB.hpScale(wi) * (cs.hpScale || 1) * (elite ? 3 : 1), speed: def.speed * CB.speedScale(wi) * (cs.speedScale || 1) * (.9 + r() * .25) * (elite ? 1.15 : 1), damage: def.damage,
        x: at ? at.x : (r() - .5) * 26, baseX: (r() - .5) * 24, y: at ? at.y : 5 + r() * 12, baseY: 5 + r() * 12, z: at ? at.z : 80 + r() * 12, phase: r() * 6.28, age: 0, frozen: 0 };
      e.maxHp = e.hp; if (at) e.baseX = at.x;
      if (type === 'bolt') { e.x = at.x; e.y = at.y; }
      this.enemies.push(e); return e;
    }
    spawnBoss() {
      const def = CB.BOSSES[this.world.boss]; if (!def) return null; const cs = this.custom || {};
      const b = { id: nextId++, type: 'boss', boss: true, def, name: def.name, color: def.color, size: def.size, hp: def.hp * CB.hpScale(this.wi) * (cs.hpScale || 1), speed: 6, damage: 20, x: 0, y: 11, z: 100, baseX: 0, baseY: 11, phase: 0, age: 0, frozen: 0, minionTimer: def.every, boltTimer: def.boltEvery * 1.5, hover: 24 };
      b.maxHp = b.hp; this.boss = b; this.bossSpawned = true; this.enemies.push(b); return b;
    }
    spawnInterval() { return Math.max(.32, (1.3 - this.time * .006) / this.def.density / (1 + this.wi * .12)); }
    update(dt) {
      if (this.over || this.choice) return;
      dt = clamp(dt, 0, .05); this.time += dt; const s = this.stats, r = this.random;
      this.cooldown = Math.max(0, this.cooldown - dt); this.recoil = Math.max(0, this.recoil - dt * 4); this.hurt = Math.max(0, this.hurt - dt);
      this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
      if (this.ally) this.updateAlly(dt);
      if (s.regen > 0) { this.regenTimer += dt; if (this.regenTimer >= 5) { this.regenTimer -= 5; this.hp = Math.min(this.maxHp, this.hp + s.regen); } }
      // apparitions
      if (this.time >= this.intro) {
        this.spawn -= dt;
        const randomOn = !this.custom || (this.custom.random && this.custom.random.enabled !== false && this.world.enemies.length);
        if (this.spawn <= 0) { if (randomOn) { const list = this.world.enemies; this.spawnEnemy(list[Math.floor(r() * list.length)]); } this.spawn = this.spawnInterval(); }
        if (this.def.type === 'boss' && !this.bossSpawned && this.world.boss && this.time >= this.intro + 1.5) this.spawnBoss();
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
          if (e.z > e.hover) e.z = Math.max(e.hover, e.z - speed * dt);
          else { e.x = Math.sin(e.age * .5) * 10; e.y = 10 + Math.sin(e.age * .8) * 3;
            e.minionTimer -= dt; if (e.minionTimer <= 0) { e.minionTimer = e.def.every; this.spawnEnemy(e.def.minion, { x: e.x, y: e.y, z: e.z }); }
            e.boltTimer -= dt; if (e.boltTimer <= 0) { e.boltTimer = e.def.boltEvery; this.spawnEnemy('bolt', { x: e.x, y: e.y - 1, z: e.z - 2 }); this.texts.push({ text: '!', x: e.x, y: e.y + 4, z: e.z, age: 0, color: '#ff3a3a' }); } }
          continue;
        }
        e.z -= speed * dt;
        const d = e.def;
        if (e.type === 'bolt') { e.x += (0 - e.x) * Math.min(1, speed * dt / Math.max(e.z, 1)); e.y += (2 - e.y) * Math.min(1, speed * dt / Math.max(e.z, 1)); }
        else if (d.straight) { }
        else if (d.zigzag) { e.x = e.baseX + Math.sin(e.age * 2.2 + e.phase) * 5; e.y = e.baseY + Math.sin(e.age * 1.8) * 2; }
        else if (d.strafe) { e.x = e.baseX + Math.sin(e.age * 1.3 + e.phase) * 9; }
        else e.x += (e.baseX + Math.sin(e.age * 1.4 + e.phase) * 2 - e.x) * Math.min(1, dt * 3);
      }
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
            if (s.ricochet && !ball.bounced) { const next = this.nearest(e, 40, ball.hitIds); if (next) { ball.bounced = true; const t = Math.max(.15, Math.hypot(next.x - ball.x, next.z - ball.z) / ball.vz); ball.vx = (next.x - ball.x) / t; ball.vz = (next.z - ball.z) / t || ball.vz; ball.vy = (next.y - ball.y + 9 * t * t) / t; continue; } }
            ball.hit = true; break;
          }
        }
      }
      this.balls = this.balls.filter(b => !b.hit && b.z < 125 && b.y > -4);
      // ennemis qui nous atteignent
      for (const e of this.enemies) if (!e.dead && !e.boss && e.z < 3) { e.escaped = true; this.damage(e.damage, e); }
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
      const s = this.stats; let dmg = ball.dmg; const crit = this.random() < s.crit; if (crit) dmg *= 2;
      if (!ball.ally) this.hits++; this.applyDamage(e, dmg, crit, ball.effect);
      if (ball.splash > 0) { for (const o of this.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < ball.splash) this.applyDamage(o, dmg * .6, false, 'feu'); this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'fire', size: ball.splash }); }
      if (ball.chain) { let from = e; for (let i = 0; i < 2; i++) { const n = this.nearest(from, 16); if (!n) break; this.bursts.push({ x: from.x, y: from.y, z: from.z, to: { x: n.x, y: n.y, z: n.z }, age: 0, kind: 'bolt' }); this.applyDamage(n, dmg * .8, false, 'eclair'); from = n; } }
      if (ball.freeze) { for (const o of this.enemies) if (!o.boss && Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z) < 8) o.frozen = 3; this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'ice', size: 8 }); }
    }
    applyDamage(e, dmg, crit, effect) {
      if (e.dead) return; e.hp -= dmg; e.flash = .15;
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: crit ? 'crit' : 'hit', color: e.color });
      if (crit) this.texts.push({ text: 'CRITIQUE !', x: e.x, y: e.y + 3, z: e.z, age: 0, color: '#ffd23f' });
      if (e.hp <= 0) this.kill(e);
    }
    kill(e) {
      e.dead = true; const s = this.stats;
      if (e.type === 'bolt') { this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: 'pop', color: e.color }); return; }
      this.kills++; this.combo++; this.comboTimer = 2.5; this.bestCombo = Math.max(this.bestCombo, this.combo);
      const mult = e.boss ? 40 : e.elite ? 5 : 1;
      const gold = ((CB.goldBase(this.wi) + (e.def.gold || 0)) * s.gold + s.goldFlat) * mult * CB.comboMult(this.combo);
      this.gold += gold; this.xp += CB.xpPerKill(this.wi) * mult;
      if (s.lifesteal) this.hp = Math.min(this.maxHp, this.hp + s.lifesteal);
      this.bursts.push({ x: e.x, y: e.y, z: e.z, age: 0, kind: e.boss ? 'boom' : 'pop', color: e.color, size: e.size });
      this.texts.push({ text: '+' + Math.round(gold), x: e.x, y: e.y + 2, z: e.z, age: 0, color: '#ffd23f' });
      if (e.elite) { this.elitesKilled++; this.offerCards(); }
      if (e.boss) { this.boss = null; this.finish(true); }
    }
    offerCards() {
      const keys = Object.keys(CB.CARDS).filter(k => !this.cards.includes(k) && !(CB.CARDS[k].skip && CB.CARDS[k].skip(this.stats))), pick = [];
      while (pick.length < 3 && keys.length) pick.push(keys.splice(Math.floor(this.random() * keys.length), 1)[0]);
      if (pick.length) this.choice = pick;
    }
    pickCard(i) { if (!this.choice) return null; const key = this.choice[i] || this.choice[0]; this.cards.push(key); CB.CARDS[key].apply(this.stats, this); this.choice = null; return key; }
    damage(n, from) {
      if (this.random() < this.stats.dodge) { this.texts.push({ text: 'ESQUIVE !', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      if (this.shield > 0) { this.shield--; this.hurt = .3; this.texts.push({ text: 'BOUCLIER', x: 0, y: 6, z: 6, age: 0, color: '#7fd4ff' }); return false; }
      this.hp = Math.max(0, this.hp - n); this.hurt = .6; this.combo = 0;
      if (this.hp <= 0) this.finish(false, 'detruit');
      return true;
    }
    finish(won, reason) {
      if (this.over) return; this.over = true; this.won = won; this.reason = won ? 'gagne' : reason || 'detruit';
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
    profile.kills += wave.kills; profile.plays++; profile.bestCombo = Math.max(profile.bestCombo || 0, wave.bestCombo);
    let newWorld = false, newStars = 0;
    if (wave.won) {
      profile.wins++; const arr = profile.progress[wave.world.id] ||= []; const before = arr[wave.vi] || 0; arr[wave.vi] = Math.max(before, wave.stars); newStars = Math.max(0, arr[wave.vi] - before);
      newWorld = wave.vi === CB.WAVES_PER_WORLD - 1 && before === 0 && wave.wi + 1 < CB.WORLDS.length;
    }
    return { gold, xp, levels, stars: wave.stars, newStars, newWorld, level: profile.level };
  };
})(window.CB);
