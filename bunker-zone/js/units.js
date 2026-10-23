// ============================================================
//  units.js — Unités, structures et dropships : ordres, déplacement, ciblage
// ============================================================
(function (ZC) {
  'use strict';

  let nextId = 1;

  class Unit {
    constructor(game, owner, type, x, y) {
      this.id = nextId++;
      this.game = game;
      this.owner = owner;
      this.type = type;
      this.def = ZC.UNITS[type];
      this.x = x; this.y = y;
      this.px = x; this.py = y;             // position au pas précédent (détection de blocage)
      this.prevX = x; this.prevY = y;       // position au pas précédent (interpolation du rendu)
      this.radius = this.def.radius;
      this.maxHp = this.def.hp;             // PV max (bonus de campagne, niveau de héros)
      this.hp = this.def.hp;
      this.shield = this.def.shield;
      this.heroLevel = 0; this.xp = 0;      // héros : niveau et expérience en cours de mission
      this.facing = this.def.structure ? 0 : Math.random() * Math.PI * 2;
      this.prevFacing = this.facing;
      this.cooldown = 0;
      this.anim = Math.random() * 10;
      this.order = { type: 'idle' };
      this.target = null;
      this.dead = false;
      this.kills = 0;
      this.moving = false;
      this.wantMove = false;
      this.stuckT = 0;
      this.zoneId = -1;
      this.leashX = x; this.leashY = y;
      this.hitFlash = 0;
      this.attackedT = -100;                // instant (temps de jeu) du dernier coup reçu (alerte minimap des bunkers)
      this.attackAnim = 0;
      this.stimT = 0;
      this.landT = 0;
      this.rally = null;                    // point de ralliement (bunker)
      this.queue = [];                      // dropships en construction (centre de commandement)
      this.up = { weapons: 0, armor: 0, range: 0, stim: 0, evolve: 0 }; // améliorations du bunker (les unités partagent celles de leur bunker d'origine)
      this.home = null;                     // bunker d'origine (unités mobiles)
      this.research = [];                   // recherches en cours { what, t, total } (bunker)
      this.zone = null;                     // zone possédée (bunker)
      this.garrison = [];                   // unités en garnison (bunker) : elles tirent depuis le bunker
      this.inside = null;                   // bunker dans lequel l'unité est en garnison
      this.carry = 0;                       // travailleur : minerai transporté
      this.gatherT = 0;                     // travailleur : progression de la récolte en cours
      this.slot = null;                     // travailleur : gisement dont il occupe un cristal
      this.repairing = false;               // travailleur : en train de réparer (étincelles)
      this.building = false;                // extracteur : en construction ; buildT = progression
      this.buildT = 0; this.patch = null;   // extracteur : gisement exploité ; acc = fraction de minerai accumulée
      this.acc = 0;
    }

    get player() { return this.game.players[this.owner]; }
    get isStructure() { return !!this.def.structure; }
    get isAir() { return !!this.def.air; }
    get mobile() { return !this.def.structure; }
    // Peut entrer dans un bunker : unité au sol, à distance, pas trop grosse
    get canGarrison() { return !this.def.structure && !this.def.air && this.def.range > 0 && this.def.size !== 'large'; }
    get isWorker() { return !!this.def.worker; }

    // Bonus passifs du joueur (boutique de l'aventure), nul hors aventure
    get bonus() { return this.player.bonus; }
    // Stats effectives avec améliorations, stim, bonus de campagne et niveau de héros
    get damage() {
      if (this.def.dmg <= 0) return 0;
      const b = this.bonus, h = this.def.hero ? ZC.heroScale(this.heroLevel) : null;
      return Math.round(this.def.dmg * (h ? h.dmg : 1)) + this.up.weapons + (b ? b.dmg : 0);
    }
    get armor() {
      if (this.def.structure) return this.def.armor;
      const b = this.bonus, h = this.def.hero ? ZC.heroScale(this.heroLevel) : null;
      return this.def.armor + this.up.armor + (b ? b.armor : 0) + (h ? h.armor : 0);
    }
    get range() { return this.def.range + this.up.range * ZC.TILE * (this.def.range > 0 ? 1 : 0.5); }

    // Évolution : l'unité devient son niveau 2 en gardant sa proportion de vie
    transformTo(type) {
      const def = ZC.UNITS[type]; if (!def) return;
      const ratio = this.hp / this.maxHp, b = this.bonus;
      this.type = type; this.def = def; this.radius = def.radius;
      this.maxHp = Math.round(def.hp * (b ? b.hp : 1)); this.hp = Math.max(1, Math.round(this.maxHp * ratio));
      this.shield = def.shield; this.cooldown = Math.max(this.cooldown, 0.5);
    }
    get speed() { return this.def.speed * (this.stimT > 0 ? ZC.STIM.speedMult : 1); }
    get attackCooldown() { return this.def.cooldown * (this.stimT > 0 ? ZC.STIM.cooldownMult : 1); }

    isIdle() {
      return (this.order.type === 'idle' || this.order.type === 'hold') && !this.target;
    }

    canTarget(t) {
      if (t.dead || this.game.allied(this.owner, t.owner)) return false;
      if (this.def.noAttack || this.def.structure) return false;
      if (t.def.air && !this.def.antiAir) return false;
      return true;
    }

    setOrder(o) {
      this.stuckT = 0;
      if (this.def.structure) return;
      this.releaseSlot(); this.repairing = false;
      if (this.def.noAttack && (o.type === 'attack' || o.type === 'attackmove' || o.type === 'patrol')) {
        o = o.type === 'attack' ? { type: 'move', x: o.target.x, y: o.target.y } : { type: 'move', x: o.x, y: o.y };
      }
      switch (o.type) {
        case 'stop':       this.order = { type: 'idle' }; this.target = null; break;
        case 'hold':       this.order = { type: 'hold' }; this.target = null; break;
        case 'move':       this.order = { type: 'move', x: o.x, y: o.y }; this.target = null; break;
        case 'attackmove': this.order = { type: 'attackmove', x: o.x, y: o.y }; this.target = null; break;
        case 'patrol':     this.order = { type: 'patrol', x: o.x, y: o.y, ox: this.x, oy: this.y, phase: 0 }; this.target = null; break;
        case 'attack':
          if (this.canTarget(o.target)) { this.order = { type: 'attack' }; this.target = o.target; }
          else { this.order = { type: 'attackmove', x: o.target.x, y: o.target.y }; this.target = null; }
          break;
        case 'build':      this.order = { type: 'build', x: o.x, y: o.y, zoneId: o.zoneId }; this.target = null; this.landT = 0; break;
        case 'enter':      if (this.canGarrison && o.bunker) { this.order = { type: 'enter', bunker: o.bunker, x: o.bunker.x, y: o.bunker.y }; this.target = null; } break;
        case 'gather':     if (this.isWorker && o.patch) { this.order = { type: 'gather', patch: o.patch, x: o.patch.x, y: o.patch.y, spot: null }; this.target = null; } break;
        case 'repair':     if (this.isWorker && o.target && o.target.def.structure) { this.order = { type: 'repair', target: o.target, x: o.target.x, y: o.target.y, patch: o.patch || null }; this.target = null; } break;
        case 'extract':    if (this.isWorker && o.patch) { this.order = { type: 'extract', patch: o.patch, x: o.patch.x, y: o.patch.y, site: null }; this.target = null; } break;
      }
    }

    // Travailleur : libère le cristal qu'il occupait
    releaseSlot() { if (this.slot) { this.slot.busy = Math.max(0, this.slot.busy - 1); this.slot = null; } this.gatherT = 0; }

    // Travailleur : récolte sur un gisement puis rapporte le minerai à la structure alliée la plus proche
    gather(o, dt) {
      const g = this.game, M = ZC.MINERALS;
      let patch = o.patch;
      if (this.carry >= M.carry) { // retour au dépôt
        const b = g.nearestDepot(this);
        if (!b) { this.order = { type: 'idle' }; return; }
        if (ZC.dist(this.x, this.y, b.x, b.y) > b.radius + this.radius + 8) { this.moveTo(b.x, b.y, dt); return; }
        g.deposit(this, b);
        if (patch.amount <= 0) { patch = g.nearestPatch(this.x, this.y, this.owner); if (!patch) { this.order = { type: 'idle' }; return; } o.patch = patch; o.x = patch.x; o.y = patch.y; }
        o.spot = null;
        return;
      }
      if (patch.amount <= 0) { // gisement épuisé : le plus proche encore riche, sinon on rapporte ce qu'on a
        patch = g.nearestPatch(this.x, this.y, this.owner);
        if (!patch) { if (this.carry > 0) this.carry = M.carry; else this.order = { type: 'idle' }; return; }
        o.patch = patch; o.x = patch.x; o.y = patch.y; o.spot = null;
      }
      if (!o.spot) { // cristal le moins occupé, approché par le côté du centre du gisement
        let best = null, bd = Infinity;
        for (const c of patch.crystals) { const d = ZC.dist(this.x, this.y, c.x, c.y) + c.n * 40; if (d < bd) { bd = d; best = c; } }
        const a = Math.atan2(patch.y - best.y, patch.x - best.x);
        o.spot = { x: best.x + Math.cos(a) * 10 + ZC.rand(-3, 3), y: best.y + Math.sin(a) * 10 + ZC.rand(-3, 3), c: best };
      }
      if (ZC.dist(this.x, this.y, o.spot.x, o.spot.y) > 7 && !this.slot) { this.moveTo(o.spot.x, o.spot.y, dt); if (this.stuckT > 1.2) o.spot = null; return; }
      if (!this.slot) {
        if (patch.busy >= M.crystals) { this.facing = ZC.angleLerp(this.facing, Math.atan2(patch.y - this.y, patch.x - this.x), 0.2); return; } // attend qu'un cristal se libère
        this.slot = patch; patch.busy++; this.gatherT = 0; o.spot.c.n++;
      }
      this.facing = ZC.angleLerp(this.facing, Math.atan2(o.spot.c.y - this.y, o.spot.c.x - this.x), 0.3);
      this.gatherT += dt; this.anim += dt * 6;
      if (this.gatherT >= M.mineTime) {
        const amt = Math.min(M.carry, patch.amount);
        patch.amount -= amt; this.carry += amt;
        o.spot.c.n = Math.max(0, o.spot.c.n - 1);
        this.releaseSlot();
        g.addEffect({ type: 'mine', x: o.spot.c.x, y: o.spot.c.y, life: 0.4 });
        if (patch.amount <= 0) g.emit('patchDepleted', { patch });
        if (this.carry < M.carry && patch.amount > 0) o.spot = null; else this.carry = M.carry;
      }
    }

    // Travailleur : construit (ou finit) l'extracteur d'un gisement, puis y récolte
    extract(o, dt) {
      const g = this.game, p = this.player, E = ZC.EXTRACTOR, patch = o.patch;
      const stop = (then) => { this.repairing = false; if (then && patch.amount > 0) this.setOrder({ type: 'gather', patch }); else this.order = { type: 'idle' }; };
      if (patch.amount <= 0) { stop(false); return; }
      let site = patch.extractor && !patch.extractor.dead ? patch.extractor : null;
      if (site && !site.building) { stop(true); return; }
      if (site && !g.allied(this.owner, site.owner)) { stop(false); return; }
      if (ZC.dist(this.x, this.y, patch.x, patch.y) > ZC.UNITS.extractor.radius + this.radius + 8) { this.repairing = false; this.moveTo(patch.x, patch.y, dt); return; }
      if (!site) { // pose du chantier : le coût est payé ici
        const cost = g.extractorCost(this.owner);
        if (p.minerals < cost) { g.emit('notEnough', { player: this.owner }); stop(true); return; }
        p.minerals -= cost;
        site = g.placeExtractor(patch, this.owner);
      }
      site.buildT += dt; this.repairing = true;
      site.hp = Math.min(site.maxHp, Math.max(site.hp, site.maxHp * (0.1 + 0.9 * site.buildT / E.buildTime)));
      this.facing = ZC.angleLerp(this.facing, Math.atan2(site.y - this.y, site.x - this.x), 0.3); this.anim += dt * 8;
      if (Math.random() < dt * 6) g.addEffect({ type: 'repair', x: site.x + (this.x - site.x) * 0.5, y: site.y + (this.y - site.y) * 0.5, life: 0.3 });
      if (site.buildT >= E.buildTime) { site.building = false; site.hp = site.maxHp; g.emit('extractorDone', { player: this.owner, unit: site, patch }); stop(true); }
    }

    // Travailleur : répare une structure alliée (PV par seconde contre du minerai par seconde)
    repair(o, dt) {
      const g = this.game, b = o.target, R = ZC.REPAIR, p = this.player;
      const done = () => { this.repairing = false; if (o.patch && o.patch.amount > 0) this.setOrder({ type: 'gather', patch: o.patch }); else this.order = { type: 'idle' }; };
      if (!b || b.dead || !g.allied(this.owner, b.owner)) { done(); return; }
      if (b.hp >= b.maxHp) { done(); return; }
      if (ZC.dist(this.x, this.y, b.x, b.y) > b.radius + this.radius + 6) { this.repairing = false; this.moveTo(b.x, b.y, dt); return; }
      const cost = R.costPerSec * dt;
      if (p.minerals < cost) { this.repairing = false; if (!o.warned) { o.warned = true; g.emit('repairNoMinerals', { player: this.owner }); } return; }
      o.warned = false;
      p.minerals -= cost; p.repairSpent = (p.repairSpent || 0) + cost;
      b.hp = Math.min(b.maxHp, b.hp + R.hpPerSec * dt);
      this.repairing = true;
      this.facing = ZC.angleLerp(this.facing, Math.atan2(b.y - this.y, b.x - this.x), 0.3);
      this.anim += dt * 8;
      if (Math.random() < dt * 6) g.addEffect({ type: 'repair', x: b.x + (this.x - b.x) * 0.5, y: b.y + (this.y - b.y) * 0.5, life: 0.3 });
    }

    attackReach(t) {
      return this.range + this.radius + t.radius + (this.def.range === 0 ? 6 : 2);
    }
    inRange(t) {
      return ZC.dist(this.x, this.y, t.x, t.y) <= this.attackReach(t);
    }

    // Ennemi le plus proche dans un rayon donné (unités avant structures)
    acquire(range) {
      const cand = this.game.hash.query(this.x, this.y, range + 30, this.game._q);
      let best = null, bd = Infinity, bestS = null, bdS = Infinity;
      for (let i = 0; i < cand.length; i++) {
        const u = cand[i];
        if (!this.canTarget(u)) continue;
        const d = ZC.dist(this.x, this.y, u.x, u.y) - u.radius;
        if (d > range) continue;
        if (u.def.structure) { if (d < bdS) { bdS = d; bestS = u; } }
        else if (d < bd) { bd = d; best = u; }
      }
      return best || bestS;
    }

    update(dt) {
      if (this.cooldown > 0) this.cooldown -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.attackAnim > 0) this.attackAnim -= dt;
      if (this.stimT > 0) this.stimT -= dt;
      if (this.def.shield > 0 && this.shield < this.def.shield) {
        this.shield = Math.min(this.def.shield, this.shield + 0.7 * dt);
      }
      if (this.def.extractor) { // extracteur : mine le gisement directement dans la banque du propriétaire
        if (this.building || !this.patch || this.patch.amount <= 0) return;
        if (this.hp < this.maxHp && this.hitFlash <= 0) this.hp = Math.min(this.maxHp, this.hp + ZC.BUNKER_REGEN * dt);
        this.anim += dt * 4;
        this.acc += ZC.EXTRACTOR.rate * dt;
        if (this.acc >= 1) {
          const amt = Math.min(Math.floor(this.acc), this.patch.amount); this.acc -= Math.floor(this.acc);
          this.patch.amount -= amt; const p = this.player; p.minerals += amt; p.mineralsEarned += amt; p.mined = (p.mined || 0) + amt;
          if (this.patch.amount <= 0) this.game.emit('patchDepleted', { patch: this.patch });
        }
        return;
      }
      if (this.def.structure) {
        if (this.hp < this.maxHp && this.hitFlash <= 0) this.hp = Math.min(this.maxHp, this.hp + ZC.BUNKER_REGEN * (this.bonus ? this.bonus.regen : 1) * dt);
        if (this.queue.length) {
          const q = this.queue[0];
          q.t += dt;
          if (q.t >= q.total) { this.queue.shift(); this.game.productionDone(this, q); }
        }
        if (this.garrison.length) this.bunkerFire(dt);
        else this.target = null;
        if (this.research.length) {
          const r = this.research[0];
          r.t += dt;
          if (r.t >= r.total) { this.research.shift(); this.game.researchDone(this, r.what); }
        }
        return;
      }
      this.moving = false;
      this.wantMove = false;
      if (!this.moving) this.anim += dt * 2;

      if (this.target && !this.canTarget(this.target)) {
        this.target = null;
        if (this.order.type === 'attack') this.order = { type: 'idle' };
      }

      const o = this.order;
      switch (o.type) {
        case 'move':
          this.moveTo(o.x, o.y, dt);
          if (this.arrived(o.x, o.y)) this.order = { type: 'idle' };
          break;

        case 'build': {
          const z = this.game.map.zones[o.zoneId];
          const claimable = z && z.owner < 0 && !z.bunker;
          if (!claimable) { this.order = { type: 'idle' }; break; }
          const d = ZC.dist(this.x, this.y, o.x, o.y);
          if (d > 6) { this.moveTo(o.x, o.y, dt); this.landT = 0; }
          else {
            this.landT += dt;
            if (this.landT >= this.game.settings.landingTime) {
              this.game.buildBunker(z, this.owner, this);
              return;
            }
          }
          break;
        }

        case 'attack':
          if (!this.target) { this.order = { type: 'idle' }; break; }
          this.engage(this.target, dt);
          break;

        case 'gather': this.gather(o, dt); break;
        case 'repair': this.repair(o, dt); break;
        case 'extract': this.extract(o, dt); break;

        case 'enter': { // rejoindre un bunker allié et y entrer s'il reste de la place
          const b = o.bunker;
          if (!b || b.dead || b.owner !== this.owner || b.garrison.length >= ZC.capacity(b)) { this.order = { type: 'idle' }; break; }
          if (ZC.dist(this.x, this.y, b.x, b.y) > b.radius + this.radius + 6) this.moveTo(b.x, b.y, dt);
          else { this.game.enterBunker(this, b); return; }
          break;
        }

        case 'attackmove':
        case 'patrol':
        case 'idle':
        case 'hold': {
          if (!this.target && !this.def.noAttack) {
            const t = this.acquire(this.def.sight);
            if (t && (o.type !== 'hold' || this.inRange(t))) {
              this.target = t;
              this.leashX = this.x; this.leashY = this.y;
            }
          }
          if (this.target) {
            if (o.type === 'hold') {
              if (this.inRange(this.target)) { this.face(this.target); this.fire(this.target); }
              else this.target = null;
            } else {
              if (o.type === 'idle' && ZC.dist(this.x, this.y, this.leashX, this.leashY) > this.def.sight * 1.6) {
                this.target = null;
                break;
              }
              this.engage(this.target, dt);
            }
          } else if (o.type === 'attackmove') {
            this.moveTo(o.x, o.y, dt);
            if (this.arrived(o.x, o.y)) this.order = { type: 'idle' };
          } else if (o.type === 'patrol') {
            const tx = o.phase === 0 ? o.x : o.ox, ty = o.phase === 0 ? o.y : o.oy;
            this.moveTo(tx, ty, dt);
            if (this.arrived(tx, ty)) { o.phase ^= 1; this.stuckT = 0; }
          }
          break;
        }
      }
    }

    // Bunker occupé : chaque unité en garnison tire depuis le bunker avec sa propre arme, portée +1 case
    bunkerFire(dt) {
      const g = this.game, gar = this.garrison;
      let range = 0;
      for (const u of gar) if (u.range > range) range = u.range;
      range += ZC.BUNKER_RANGE_BONUS * ZC.TILE;
      const reach = (t) => range + this.radius + t.radius;
      let t = this.target;
      if (t && (t.dead || !gar[0].canTarget(t) || ZC.dist(this.x, this.y, t.x, t.y) > reach(t))) t = null;
      if (!t) {
        for (const u of gar) { u.x = this.x; u.y = this.y; }
        t = gar[0].acquire(range + this.radius);
      }
      this.target = t;
      for (const u of gar) {
        if (u.cooldown > 0) u.cooldown -= dt;
        if (!t || u.cooldown > 0 || !u.canTarget(t)) continue;
        if (u.range + ZC.BUNKER_RANGE_BONUS * ZC.TILE + this.radius + t.radius < ZC.dist(this.x, this.y, t.x, t.y)) continue;
        // le tir part d'une meurtrière du bunker, du côté de la cible
        const a = Math.atan2(t.y - this.y, t.x - this.x);
        u.x = this.x + Math.cos(a) * (this.radius - 4); u.y = this.y + Math.sin(a) * (this.radius - 4);
        u.facing = a;
        u.cooldown = u.attackCooldown;
        this.attackAnim = 0.15;
        g.resolveAttack(u, t);
      }
    }

    engage(t, dt) {
      if (this.inRange(t)) { this.face(t); this.fire(t); }
      else this.moveTo(t.x, t.y, dt);
    }

    face(t) {
      this.facing = ZC.angleLerp(this.facing, Math.atan2(t.y - this.y, t.x - this.x), 0.4);
    }

    fire(t) {
      if (this.cooldown > 0) return;
      this.cooldown = this.attackCooldown;
      this.attackAnim = 0.15;
      this.game.resolveAttack(this, t);
    }

    moveTo(x, y, dt) {
      const dx = x - this.x, dy = y - this.y;
      const d = Math.hypot(dx, dy);
      this.wantMove = true;
      if (d < 0.5) return;
      const step = Math.min(d, this.speed * dt);
      this.x += dx / d * step;
      this.y += dy / d * step;
      this.facing = ZC.angleLerp(this.facing, Math.atan2(dy, dx), 0.25);
      this.moving = true;
      this.anim += dt * (this.stimT > 0 ? 15 : 10);
    }

    // Arrivé si proche de la destination, ou bloqué par la foule à proximité
    arrived(x, y) {
      const d = ZC.dist(this.x, this.y, x, y);
      return d < 6 || (this.stuckT > 0.45 && d < 90);
    }

    // Appelé après la séparation : détecte les unités bloquées
    postMove(dt) {
      if (this.wantMove) {
        const moved = ZC.dist(this.px, this.py, this.x, this.y);
        if (moved < this.speed * dt * 0.3) this.stuckT += dt;
        else this.stuckT = Math.max(0, this.stuckT - dt * 2);
      } else this.stuckT = 0;
      this.px = this.x; this.py = this.y;
    }

    stim() {
      if (!this.def.bio || (this.up.stim < 1 && !this.def.hero) || this.hp <= ZC.STIM.hpCost) return false;
      this.hp -= ZC.STIM.hpCost;
      this.stimT = ZC.STIM.duration;
      return true;
    }
  }
  ZC.Unit = Unit;
})(window.ZC);
