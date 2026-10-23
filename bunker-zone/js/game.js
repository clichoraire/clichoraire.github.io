// ============================================================
//  game.js — État de la partie : joueurs, bunkers, vagues, minerais, combat
// ============================================================
(function (ZC) {
  'use strict';

  class Game {
    constructor(settings) {
      this.settings = Object.assign({}, ZC.DEFAULTS, settings || {});
      const s = this.settings;
      ZC.ZONE_TILES = s.zoneTiles || 12;
      ZC.ZONE_PX = ZC.TILE * ZC.ZONE_TILES;
      this.map = new ZC.GameMap(s.mapZones, s.mapZonesY || s.mapZones);
      for (const z of this.map.zones) { z.bunker = null; z.ruined = false; }
      this.players = [];
      this.units = [];
      this.effects = [];
      this.decals = [];
      this.ais = [];
      this.time = 0;
      this.spawnTimer = s.spawnInterval;
      this.roundIndex = 0;
      this.roundTimer = 0;
      this.roundTime = 0;        // temps écoulé depuis le début du round (tournoi) ou de la partie
      this.intermissionT = 0;    // pause entre deux rounds (tournoi)
      this.roundWinner = -1;     // vainqueur du dernier round (tournoi)
      this.hash = new ZC.SpatialHash(64);
      this._q = [];
      this.selection = [];
      this.selectionVersion = 0;
      this.groups = {};
      this.state = 'playing';
      this.winner = -1;
      this.humanId = s.humanPlayer ? 0 : -1;
      this.humanDefeated = false;
      this.listeners = [];
      this.endCheckT = 0;
      this.waveCount = 0;
      // Mode aventure : bonus passifs, héros, objectif de mission
      this.campaign = s.campaign || null;
      this.hero = null; this.heroDown = false; this.heroXpGained = 0;
      this.patches = [];         // gisements de minerai { zone, x, y, amount, max, crystals, busy }
      this.invasionT = s.invasion ? 25 : 0; this.invasionCount = 0; // vagues d'envahisseurs (missions de survie)
      this.nextInvasion = null;  // point du bord d'où la prochaine vague surgira (annoncé à l'avance)
      this.setupPlayers();
      if (s.invasion) this.planInvasion();
      if (this.campaign && this.human) this.spawnHero();
    }

    // ---------------------------------------------------------- héros (mode aventure)
    spawnHero() {
      const c = this.campaign, me = this.human;
      const at = me.hq && !me.hq.dead ? me.hq : this.units.find(u => !u.dead && u.owner === me.id && u.def.structure);
      if (!at) return null;
      const u = this.spawnUnit(me.id, c.hero.unit, at.x + 40, at.y + at.radius + 30);
      u.heroLevel = c.hero.level; u.xp = c.hero.xp; u.up = at.up; u.home = at;
      u.maxHp = Math.round(u.def.hp * ZC.heroScale(u.heroLevel).hp * (me.bonus ? me.bonus.hp : 1)); u.hp = u.maxHp;
      u.facing = Math.PI / 2;
      this.hero = u; this.heroRespawnT = 0;
      this.addEffect({ type: 'spawn', x: u.x, y: u.y, life: 0.8, color: me.hex });
      return u;
    }
    heroGainXp(amount) {
      const h = this.hero; if (!h || h.dead) return;
      const mult = this.human.bonus ? this.human.bonus.heroXp : 1;
      const gain = amount * mult;
      h.xp += gain; this.heroXpGained += gain;
      const lvl = ZC.heroLevel(h.xp);
      if (lvl > h.heroLevel) {
        h.heroLevel = lvl;
        const max = Math.round(h.def.hp * ZC.heroScale(lvl).hp * (this.human.bonus ? this.human.bonus.hp : 1));
        h.hp += max - h.maxHp; h.maxHp = max;
        this.addEffect({ type: 'spawn', x: h.x, y: h.y, life: 0.8, color: '#ffd040' });
        this.emit('heroLevel', { unit: h, level: lvl });
      }
    }
    // Le héros ne revient pas tout seul : on le ressuscite au centre de commandement (carte « Unités », H)
    updateHero() {
      if (!this.campaign || !this.human || !this.hero) return;
      if (this.hero.dead && !this.heroDown) { this.heroDown = true; this.emit('heroDown', { unit: this.hero }); }
    }
    // Résurrection possible : héros mort, pas déjà en cours
    canReviveHero(player) {
      return !!this.campaign && player === this.humanId && !!this.hero && this.hero.dead && !this.heroQueued(player);
    }
    heroQueued(player) {
      for (const u of this.units) if (!u.dead && u.owner === player && u.def.structure && u.queue.some(q => q.what === 'hero')) return true;
      return false;
    }
    heroReviveCost(player) { return this.isAdmin(player) ? 0 : Math.round(ZC.heroReviveCost(this.hero ? this.hero.heroLevel : 0) * (this.human.bonus ? this.human.bonus.costMult : 1)); }
    reviveHero() {
      const dead = this.hero, u = this.spawnHero();
      if (!u) return null;
      u.xp = dead.xp; u.heroLevel = dead.heroLevel;
      u.maxHp = Math.round(u.def.hp * ZC.heroScale(u.heroLevel).hp * (this.human.bonus ? this.human.bonus.hp : 1)); u.hp = u.maxHp;
      this.heroDown = false;
      this.emit('heroBack', { unit: u });
      return u;
    }

    // ---------------------------------------------------------- gisements de minerai et travailleurs
    // Un gisement par zone de départ, puis une part des autres zones ; cinq cristaux en arc, à l'écart du centre
    placeMinerals(startZones) {
      const s = this.settings, M = ZC.MINERALS, map = this.map;
      this.patches = [];
      for (const z of map.zones) z.minerals = null;
      const starts = new Set(startZones.map(z => z.id));
      const frac = s.mineralZones === undefined ? ZC.DEFAULTS.mineralZones : s.mineralZones;
      const others = ZC.shuffle(map.zones.filter(z => !starts.has(z.id)));
      const n = Math.round(others.length * frac);
      let chosen = startZones.concat(others.slice(0, n));
      if (frac <= 0) return;
      // Cartes étroites (couloir, bande) : un gisement dans chaque zone, sinon la partie traîne.
      // Ailleurs : aucune zone ne doit être à plus d'une zone d'un gisement.
      if (map.zx <= 3 || map.zy <= 3) chosen = map.zones.slice();
      else {
        const has = new Set(chosen.map(z => z.id));
        for (const z of map.zones) {
          if (has.has(z.id) || map.neighbors(z, true).some(nb => has.has(nb.id))) continue;
          has.add(z.id); chosen.push(z);
        }
      }
      for (const z of chosen) {
        const off = Math.min(125, ZC.ZONE_PX / 2 - 56);
        const a = (Math.floor(Math.random() * 8) + 0.5) * Math.PI / 4;
        const x = z.cx + Math.cos(a) * off, y = z.cy + Math.sin(a) * off;
        const crystals = [];
        for (let i = 0; i < M.crystals; i++) { // arc tourné vers l'extérieur de la zone
          const b = a + (i - (M.crystals - 1) / 2) * 0.55;
          crystals.push({ x: x + Math.cos(b) * 24, y: y + Math.sin(b) * 24, r: 7 + ((i * 7 + z.id) % 3) * 1.5, n: 0 });
        }
        const amount = Math.round(M.patch * (z.super ? 2 : 1));
        const p = { id: this.patches.length, zone: z, x, y, amount, max: amount, crystals, busy: 0 };
        z.minerals = p; this.patches.push(p);
      }
    }
    // Gisement sous un point (cristal ou centre)
    patchAt(x, y) {
      for (const p of this.patches) {
        if (ZC.dist(x, y, p.x, p.y) < 44) return p;
        for (const c of p.crystals) if (ZC.dist(x, y, c.x, c.y) < c.r + 6) return p;
      }
      return null;
    }
    // Gisement non épuisé le plus proche, hors zones tenues par un ennemi
    nearestPatch(x, y, owner, maxDist) {
      let best = null, bd = maxDist || Infinity;
      for (const p of this.patches) {
        if (p.amount <= 0) continue;
        if (p.zone.owner >= 0 && !this.allied(owner, p.zone.owner)) continue;
        const d = ZC.dist(x, y, p.x, p.y);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }
    // Structure alliée la plus proche où déposer le minerai (bunker ou QG)
    nearestDepot(u) {
      let best = null, bd = Infinity;
      for (const b of this.units) {
        if (b.dead || !b.def.structure || b.def.extractor || b.def.tower || !this.allied(u.owner, b.owner)) continue;
        const d = ZC.dist(u.x, u.y, b.x, b.y);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    deposit(u, b) {
      const p = this.players[u.owner];
      p.minerals += u.carry; p.mineralsEarned += u.carry; p.mined = (p.mined || 0) + u.carry;
      this.addEffect({ type: 'deposit', x: b.x, y: b.y - b.radius, life: 0.6, amount: u.carry });
      u.carry = 0;
    }
    // Extracteur : chantier posé par un travailleur sur un gisement (un seul par gisement)
    extractorCost(player) { const p = this.players[player]; return this.isAdmin(player) ? 0 : Math.round(ZC.EXTRACTOR.cost * (p.bonus ? p.bonus.costMult : 1)); }
    placeExtractor(patch, owner) {
      const u = this.spawnUnit(owner, 'extractor', patch.x, patch.y);
      u.building = true; u.buildT = 0; u.patch = patch; u.hp = u.maxHp * 0.1;
      patch.extractor = u;
      this.addEffect({ type: 'spawn', x: u.x, y: u.y, life: 0.6, color: this.players[owner].hex });
      this.emit('extractorStart', { player: owner, unit: u, patch });
      return u;
    }
    // Tours : placement dans une zone à soi, à l'écart du centre et des autres structures, trois par zone au plus
    towerCost(player) { const p = this.players[player]; return this.isAdmin(player) ? 0 : Math.round(ZC.TOWER.cost * (p.bonus ? p.bonus.costMult : 1)); }
    towers(player) { return this.units.filter(u => !u.dead && u.owner === player && u.def.tower); }
    canPlaceTower(player, x, y) {
      const z = this.map.zoneAt(x, y);
      if (!z) return { ok: false, reason: 'hors carte' };
      if (z.owner !== player) return { ok: false, reason: 'zone' };
      if (ZC.dist(x, y, z.cx, z.cy) < 58) return { ok: false, reason: 'centre' };
      const r = ZC.UNITS[ZC.RACES[this.players[player].race].tower].radius;
      if (x < r + 4 || y < r + 4 || x > this.map.w - r - 4 || y > this.map.h - r - 4) return { ok: false, reason: 'hors carte' };
      let inZone = 0;
      for (const u of this.units) {
        if (u.dead) continue;
        if (u.def.structure && ZC.dist(x, y, u.x, u.y) < r + u.radius + 10) return { ok: false, reason: 'structure' };
        if (u.def.tower && u.owner === player && this.map.zoneAt(u.x, u.y) === z) inZone++;
      }
      for (const pt of this.patches) if (ZC.dist(x, y, pt.x, pt.y) < 60) return { ok: false, reason: 'gisement' };
      if (inZone >= ZC.TOWER.perZone) return { ok: false, reason: 'max' };
      return { ok: true };
    }
    placeTower(player, x, y) {
      const p = this.players[player], u = this.spawnUnit(player, ZC.RACES[p.race].tower, x, y);
      u.building = true; u.buildT = 0; u.hp = u.maxHp * 0.1; u.facing = -Math.PI / 2;
      this.addEffect({ type: 'spawn', x: u.x, y: u.y, life: 0.6, color: p.hex });
      this.emit('towerStart', { player, unit: u });
      return u;
    }
    extractors(player) { return this.units.filter(u => !u.dead && u.owner === player && u.def.extractor); }
    workers(player) { return this.units.filter(u => !u.dead && u.owner === player && u.def.worker); }
    workersQueued(player) {
      let n = 0;
      for (const u of this.units) if (!u.dead && u.owner === player && u.def.structure) for (const q of u.queue) if (q.what === 'worker') n++;
      return n;
    }
    workerCost(player) { const p = this.players[player]; return this.isAdmin(player) ? 0 : Math.round(ZC.WORKER.cost * (p.bonus ? p.bonus.costMult : 1)); }
    workerTime(player) { const p = this.players[player]; return this.isAdmin(player) ? 0 : ZC.WORKER.time * (p.bonus ? p.bonus.timeMult : 1); }
    // Travailleur livré au QG : part récolter le gisement le plus proche (sinon ralliement)
    spawnWorker(b) {
      const p = this.players[b.owner], type = ZC.RACES[p.race].worker;
      const a = Math.PI / 2 + ZC.rand(-0.6, 0.6), r = b.radius + 12;
      const u = this.spawnUnit(b.owner, type, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r);
      u.facing = a; u.home = b;
      this.addEffect({ type: 'spawn', x: u.x, y: u.y, life: 0.5, color: p.hex });
      const patch = this.nearestPatch(b.x, b.y, b.owner, ZC.ZONE_PX * 1.6);
      if (patch) u.setOrder({ type: 'gather', patch });
      else if (b.rally) u.setOrder({ type: 'move', x: b.rally.x + ZC.rand(-12, 12), y: b.rally.y + ZC.rand(-12, 12) });
      this.emit('workerReady', { player: b.owner, unit: u, gathering: !!patch });
      return u;
    }
    // Fin d'une production du centre de commandement
    productionDone(b, q) {
      if (q.what === 'dropship') this.dropshipReady(b);
      else if (q.what === 'worker') this.spawnWorker(b);
      else if (q.what === 'hero') { if (this.hero && this.hero.dead) this.reviveHero(); }
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { for (const l of this.listeners) l(type, data || {}); }

    get human() { return this.humanId >= 0 ? this.players[this.humanId] : null; }
    get isTournament() { return this.settings.mode === 'rounds'; }
    // ---------------------------------------------------------- garnison des bunkers
    enterBunker(u, b) {
      if (b.def.extractor) return false;
      if (u.dead || b.dead || u.inside || b.garrison.length >= ZC.capacity(b) || !u.canGarrison) return false;
      u.inside = b; u.order = { type: 'idle' }; u.target = null; u.moving = false; u.stimT = 0;
      u.x = b.x; u.y = b.y; u.prevX = b.x; u.prevY = b.y;
      b.garrison.push(u);
      const i = this.units.indexOf(u); if (i >= 0) this.units.splice(i, 1);
      const si = this.selection.indexOf(u); if (si >= 0) { this.selection.splice(si, 1); this.selectionVersion++; }
      for (const k in this.groups) this.groups[k] = this.groups[k].filter(x => x !== u);
      this.emit('enter', { unit: u, bunker: b, player: u.owner });
      return true;
    }
    unloadBunker(b) {
      const gar = b.garrison; if (!gar.length) return 0;
      const n = gar.length;
      gar.forEach((u, i) => {
        const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7, r = b.radius + u.radius + 6;
        u.inside = null; u.x = b.x + Math.cos(a) * r; u.y = b.y + Math.sin(a) * r; u.prevX = u.x; u.prevY = u.y; u.px = u.x; u.py = u.y;
        u.facing = a; u.order = { type: 'idle' }; u.target = null; u.cooldown = 0;
        this.units.push(u);
      });
      b.garrison = []; b.target = null;
      this.emit('unload', { bunker: b, player: b.owner, count: n });
      return n;
    }

    // Unité produite par les bunkers d'un joueur : l'unité de niveau 1 de sa race, ou celle du round en évolution / tournoi
    spawnTypeFor(p) {
      const m = this.settings.mode;
      if (m === 'evolution' || m === 'rounds') return ZC.ROUNDS[this.roundIndex % ZC.ROUNDS.length];
      return ZC.RACES[p.race].l1;
    }
    get spawnType() { return this.spawnTypeFor(this.human || this.players[0]); }
    get roundUnit() { return ZC.UNITS[this.spawnType]; }
    // Alliés : même joueur ou même équipe
    allied(a, b) { return a === b || (a >= 0 && b >= 0 && this.players[a].team === this.players[b].team); }

    setupPlayers() {
      const s = this.settings;
      const total = (s.humanPlayer ? 1 : 0) + s.aiCount;
      const colors = ZC.PLAYER_COLORS.map((c, i) => i);
      const names = ZC.shuffle(ZC.AI_NAMES.slice());
      const raceKeys = Object.keys(ZC.RACES);
      let ci = 0;
      for (let i = 0; i < total; i++) {
        const isHuman = s.humanPlayer && i === 0;
        let colorIdx;
        if (isHuman) colorIdx = s.playerColor;
        else {
          while (colors[ci] === s.playerColor && s.humanPlayer) ci++;
          colorIdx = colors[ci++];
        }
        const col = ZC.PLAYER_COLORS[colorIdx % ZC.PLAYER_COLORS.length];
        const p = {
          id: i,
          name: isHuman ? 'Vous' : names[i % names.length],
          hex: col.hex, colorName: col.name,
          isHuman, alive: true,
          zones: 0, bunkers: 0, unitCount: 0, supply: 0, kills: 0, losses: 0, captures: 0, eliminatedAt: -1,
          minerals: s.startMinerals, mineralsEarned: 0, dropshipsBuilt: 0, roundsWon: 0,
          hq: null, bonus: null,
          race: isHuman ? (ZC.RACES[s.playerRace] ? s.playerRace : 'human') : (ZC.RACES[s.aiRace] ? s.aiRace : raceKeys[Math.floor(Math.random() * raceKeys.length)]),
          team: s.teams && s.teams[i] !== undefined ? s.teams[i] : i,
        };
        if (isHuman && s.campaign) { p.bonus = s.campaign.bonus; p.minerals += p.bonus.startMinerals; }
        this.players.push(p);
      }
      // Envahisseurs : un joueur sans base ni IA, dont les vagues arrivent par les bords de la carte
      if (s.invasion) {
        while (colors[ci] === s.playerColor && s.humanPlayer) ci++;
        const col = ZC.PLAYER_COLORS[colors[ci++] % ZC.PLAYER_COLORS.length];
        this.players.push({
          id: this.players.length, name: s.invasion.name || 'Envahisseurs', hex: col.hex, colorName: col.name, isHuman: false, alive: true, invader: true,
          zones: 0, bunkers: 0, unitCount: 0, supply: 0, kills: 0, losses: 0, captures: 0, eliminatedAt: -1, minerals: 0, mineralsEarned: 0, dropshipsBuilt: 0, roundsWon: 0, hq: null, bonus: null,
          race: ZC.RACES[s.aiRace] ? s.aiRace : raceKeys[Math.floor(Math.random() * raceKeys.length)], team: 99,
        });
      }
      for (const z of this.map.zones) z.cnt = new Uint16Array(this.players.length);
      this.placeStart();
    }

    // Place chaque joueur sur une zone de départ : QG, unités de départ, dropship, IA
    placeStart() {
      const s = this.settings, map = this.map;
      const based = this.players.filter(p => !p.invader);
      const starts = ZC.shuffle(map.startPositions(based.length));
      // Départ au centre : le joueur humain prend la zone centrale, les autres gardent les coins
      const center = map.zone(Math.floor(map.zx / 2), Math.floor(map.zy / 2));
      if (s.humanStart === 'center' && this.human) { starts.splice(this.human.id, 0, center); }
      this.placeMinerals(starts.slice(0, based.length));
      const troops = (p, hq, z, n) => {
        const type = this.spawnTypeFor(p);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          const u = this.spawnUnit(p.id, type, z.cx + Math.cos(a) * 64, z.cy + Math.sin(a) * 64);
          u.up = hq.up; u.home = hq;
        }
      };
      for (const p of based) {
        const z = starts[p.id];
        const hq = this.buildBunker(z, p.id, null, 'hq');
        troops(p, hq, z, s.startUnits + (p.bonus ? p.bonus.startUnits : 0));
        for (let k = 0; k < (s.startWorkers || 0); k++) this.spawnWorker(hq);
        this.spawnUnit(p.id, 'dropship', z.cx + 80, z.cy - 70);
        if (!p.isHuman) this.ais.push(new ZC.AI(this, p, s.difficulty));
      }
      // Avance au départ : zones voisines supplémentaires, avec bunker et troupes
      if (s.extraZones > 0 && this.human) {
        const me = this.human, hz = starts[me.id];
        const cheb = (a, b) => Math.max(Math.abs(a.ix - b.ix), Math.abs(a.iy - b.iy));
        const cands = map.zones.filter(z => z.owner < 0 && !z.bunker).sort((a, b) => cheb(a, hz) - cheb(b, hz) || map.manhattan(a, hz) - map.manhattan(b, hz) || Math.random() - 0.5);
        for (const z of cands.slice(0, s.extraZones)) {
          const b = this.buildBunker(z, me.id, null, true);
          troops(me, b, z, Math.max(2, Math.floor(s.startUnits / 2)));
        }
      }
      this.recount();
    }

    // Mode tournoi : remet la carte à zéro pour le round suivant (les scores et statistiques restent)
    resetRound() {
      const s = this.settings;
      for (const u of this.units) { u.dead = true; u.removed = true; }
      this.units = []; this.effects = []; this.decals = []; this.ais = [];
      this.selection = []; this.selectionVersion++; this.groups = {};
      this.hash.clear();
      for (const z of this.map.zones) { z.owner = -1; z.bunker = null; z.ruined = false; z.capturer = -1; z.captureT = 0; z.flashT = 0; z.cnt.fill(0); }
      for (const p of this.players) { p.alive = true; p.eliminatedAt = -1; p.minerals = s.startMinerals + (p.bonus ? p.bonus.startMinerals : 0); p.dropshipsBuilt = 0; p.hq = null; }
      this.spawnTimer = s.spawnInterval;
      this.roundTime = 0; this.roundTimer = 0; this.endCheckT = 0;
      this.humanDefeated = false; this.heroDown = false;
      this.placeStart();
      if (this.campaign && this.human) { const xp = this.hero ? this.hero.xp : this.campaign.hero.xp, lvl = this.hero ? this.hero.heroLevel : this.campaign.hero.level; const u = this.spawnHero(); if (u) { u.xp = xp; u.heroLevel = lvl; } }
    }

    spawnUnit(owner, type, x, y) {
      const r = ZC.UNITS[type].radius;
      const u = new ZC.Unit(this, owner, type,
        ZC.clamp(x, r, this.map.w - r), ZC.clamp(y, r, this.map.h - r));
      const b = this.players[owner] && this.players[owner].bonus;
      if (b && !u.def.structure && !u.def.hero) { u.maxHp = Math.round(u.def.hp * b.hp); u.hp = u.maxHp; }
      this.units.push(u);
      return u;
    }

    // Plafond de travailleurs : 4 par bunker possédé (QG compris), borné par le maximum absolu.
    workerCap(player) { return Math.min(ZC.WORKER.max, ZC.WORKER.perBunker * this.players[player].bunkers); }

    // Plafond de supply : la base + un bonus par bunker (QG compris), borné par unitCap.
    supplyCap(player) {
      const s = this.settings, p = this.players[player];
      return Math.min(s.unitCap, (s.supplyBase || 0) + (s.supplyPerBunker || 0) * p.bunkers);
    }

    recount() {
      for (const p of this.players) { p.zones = 0; p.bunkers = 0; p.unitCount = 0; p.supply = 0; p.hq = null; }
      for (const z of this.map.zones) if (z.owner >= 0) this.players[z.owner].zones++;
      for (const u of this.units) {
        if (u.dead) continue;
        const p = this.players[u.owner];
        if (u.def.structure) {
          if (u.def.extractor || u.def.tower) { for (const gu of u.garrison) { p.unitCount++; p.supply += gu.def.supply; } continue; }
          p.bunkers++; if (u.def.hq && !p.hq) p.hq = u;  // plusieurs centres possibles (amélioration) : le premier sert de QG principal
          for (const gu of u.garrison) { p.unitCount++; p.supply += gu.def.supply; }
        }
        else { p.unitCount++; p.supply += u.def.supply; }
      }
    }

    // ---------------------------------------------------------- bunkers
    buildBunker(zone, owner, dropship, silent) {
      if (zone.bunker) return null;
      // Le premier bunker d'un joueur (ou le premier après avoir tout perdu) est son centre de commandement
      const p = this.players[owner];
      const isHQ = silent === 'hq' || (!p.hq && p.bunkers === 0);
      const b = this.spawnUnit(owner, isHQ ? 'hq' : 'bunker', zone.cx, zone.cy);
      b.zone = zone;
      zone.bunker = b;
      const prev = zone.owner;
      zone.owner = owner;
      zone.ruined = false;
      zone.capturer = -1; zone.captureT = 0; zone.flashT = 1.2;
      if (dropship) { dropship.dead = true; dropship.removed = true; }
      this.recount();
      if (!silent) {
        this.players[owner].captures++;
        this.addEffect({ type: 'spawn', x: zone.cx, y: zone.cy, life: 0.8, color: this.players[owner].hex });
        this.emit('capture', { zone, player: owner, prev, byDropship: !!dropship, hq: isHQ });
      }
      return b;
    }

    // Achat d'un dropship (centre de commandement) ou d'une amélioration (propre au bunker)
    // Mode admin : réservé au joueur humain quand l'option est activée
    isAdmin(player) { return !!this.settings.admin && player === this.humanId; }

    buy(player, what, bunker) {
      const p = this.players[player];
      if (!p.alive) return false;
      const admin = this.isAdmin(player);
      if (what === 'dropship') {
        const cost = this.dropshipCost(player);
        if (p.minerals < cost) { this.emit('notEnough', { player }); return false; }
        const b = this.productionCenter(player, bunker);
        if (b && admin) { // admin : livré immédiatement près du QG
          p.dropshipsBuilt++;
          this.dropshipReady(b);
          return true;
        }
        if (b) {
          if (b.queue.length >= this.settings.dropshipQueueMax) { this.emit('queueFull', { player }); return false; }
          p.minerals -= cost;
          const total = this.dropshipBuildTime(player);
          p.dropshipsBuilt++;
          b.queue.push({ what: 'dropship', t: 0, total, cost });
          this.emit('buy', { player, what, bunker: b, total, queued: b.queue.length });
          return true;
        }
        if (p.bunkers > 0) { this.emit('noHQ', { player }); return false; }
        // Sans aucun bunker : le dropship est livré immédiatement au milieu des troupes
        const spot = this.dropshipSpawnPoint(p);
        if (!spot) { this.emit('cannotBuild', { player }); return false; }
        p.minerals -= cost;
        p.dropshipsBuilt++;
        const d = this.spawnUnit(player, 'dropship', spot.x, spot.y);
        this.addEffect({ type: 'spawn', x: d.x, y: d.y, life: 0.6, color: p.hex });
        this.emit('dropshipReady', { player, unit: d });
        return true;
      }
      if (what === 'worker' || what === 'hero') { // productions du centre de commandement
        const b = this.productionCenter(player, bunker);
        if (!b) { this.emit('noHQ', { player }); return false; }
        if (what === 'worker' && this.workers(player).length + this.workersQueued(player) >= this.workerCap(player)) { this.emit('workerCap', { player, cap: this.workerCap(player) }); return false; }
        if (what === 'hero' && !this.canReviveHero(player)) return false;
        const cost = what === 'worker' ? this.workerCost(player) : this.heroReviveCost(player);
        if (p.minerals < cost) { this.emit('notEnough', { player }); return false; }
        if (admin) { p.minerals -= cost; this.productionDone(b, { what }); return true; }
        if (b.queue.length >= this.settings.dropshipQueueMax) { this.emit('queueFull', { player }); return false; }
        p.minerals -= cost;
        const total = what === 'worker' ? this.workerTime(player) : ZC.HERO_RESPAWN * (p.bonus ? p.bonus.timeMult : 1);
        b.queue.push({ what, t: 0, total, cost });
        this.emit('buy', { player, what, bunker: b, total, queued: b.queue.length });
        return true;
      }
      const def = ZC.UPGRADES[what];
      if (!def || !bunker || bunker.dead || bunker.owner !== player || !bunker.def.structure) return false;
      const lvl = this.pendingLevel(bunker, what);
      if (lvl >= def.max) return false;
      if (what === 'evolve' && !this.canEvolve(bunker)) { this.emit('needUpgrades', { player }); return false; }
      if (what === 'fortify' && bunker.def.hq) return false;
      if (admin) { this.researchDone(bunker, what); return true; } // admin : gratuit et instantané
      if (bunker.research.length >= ZC.RESEARCH_QUEUE_MAX) { this.emit('queueFull', { player }); return false; }
      const cost = def.cost(lvl);
      if (p.minerals < cost) { this.emit('notEnough', { player }); return false; }
      p.minerals -= cost;
      const total = def.time(lvl);
      bunker.research.push({ what, t: 0, total, cost });
      this.emit('buy', { player, what, level: lvl + 1, bunker, total, queued: bunker.research.length });
      return true;
    }
    // Annule un élément d'une file (recherche ou production) et rembourse ce qui a été payé
    cancelQueued(player, bunker, kind, index) {
      const p = this.players[player];
      if (!bunker || bunker.dead || bunker.owner !== player) return false;
      const list = kind === 'research' ? bunker.research : bunker.queue;
      const item = list[index]; if (!item) return false;
      list.splice(index, 1);
      const refund = item.cost || 0;
      p.minerals += refund;
      if (item.what === 'dropship') p.dropshipsBuilt = Math.max(0, p.dropshipsBuilt - 1);
      this.emit('cancel', { player, what: item.what, refund, bunker, kind });
      return true;
    }
    // Niveau atteint une fois les recherches en attente terminées
    pendingLevel(bunker, what) {
      let n = bunker.up[what];
      for (const r of bunker.research) if (r.what === what) n++;
      return n;
    }
    // Centre de commandement qui produit : le bunker sélectionné s'il en est un, sinon le QG principal
    productionCenter(player, bunker) {
      const p = this.players[player];
      if (bunker && !bunker.dead && bunker.def.hq && bunker.owner === player) return bunker;
      return p.hq && !p.hq.dead ? p.hq : null;
    }
    // Amélioration « Centre de commandement » : le bunker prend les stats du QG (PV, armure, taille, 6 places) et ses productions
    promoteBunker(b) {
      const hq = ZC.UNITS.hq, gained = hq.hp - b.maxHp;
      b.type = 'hq'; b.def = hq;
      b.maxHp = hq.hp; b.hp = Math.min(b.maxHp, b.hp + Math.max(0, gained)); b.radius = hq.radius;
      this.recount();
      this.addEffect({ type: 'spawn', x: b.x, y: b.y - 10, life: 0.8, color: this.players[b.owner].hex });
    }
    researchDone(bunker, what) {
      bunker.up[what]++;
      if (what === 'evolve') this.evolveTroops(bunker);
      if (what === 'fortify') this.promoteBunker(bunker);
      this.emit('upgradeDone', { player: bunker.owner, what, level: bunker.up[what], bunker });
    }
    // Évolution possible : armes, armure et portée au niveau requis, et pas déjà évoluée
    // (les niveaux en attente dans la file comptent : la file est traitée dans l'ordre, l'évolution attend son tour)
    canEvolve(b) {
      const r = ZC.UPGRADES.evolve.requires;
      return !b.up.evolve && this.pendingLevel(b, 'weapons') >= r && this.pendingLevel(b, 'armor') >= r && this.pendingLevel(b, 'range') >= r;
    }
    // Prérequis réellement atteints (au moment où l'évolution arrive en tête de file)
    evolveReady(b) {
      const r = ZC.UPGRADES.evolve.requires;
      return b.up.weapons >= r && b.up.armor >= r && b.up.range >= r;
    }
    // Transforme les soldats du bunker (sur la carte et en garnison) en unité de niveau 2
    evolveTroops(b) {
      const all = this.units.filter(u => !u.dead && u.home === b && !u.def.structure && !u.def.air).concat(b.garrison);
      let n = 0;
      for (const u of all) {
        const to = u.def.evolvesTo; if (!to) continue;
        u.transformTo(to); n++;
        if (!u.inside) this.addEffect({ type: 'spawn', x: u.x, y: u.y, life: 0.7, color: '#ffd040' });
      }
      this.recount();
      return n;
    }
    dropshipCost(player) {
      const p = this.players[player];
      if (this.isAdmin(player)) return 0;
      return Math.round((this.settings.dropshipCost + this.settings.dropshipCostPerBunker * Math.max(0, p.bunkers - 1)) * (p.bonus ? p.bonus.costMult : 1));
    }
    dropshipBuildTime(player) {
      const p = this.players[player], s = this.settings;
      if (this.isAdmin(player)) return 0;
      return s.dropshipBuildTime * (1 + s.dropshipBuildGrowth * p.dropshipsBuilt) * (p.bonus ? p.bonus.timeMult : 1);
    }
    dropshipsQueued(player) {
      let n = 0;
      for (const u of this.units) if (!u.dead && u.owner === player && u.def.structure) for (const q of u.queue) if (q.what === 'dropship') n++;
      return n;
    }
    dropshipReady(b) {
      const d = this.spawnUnit(b.owner, 'dropship', b.x + 70, b.y - 60);
      this.addEffect({ type: 'spawn', x: d.x, y: d.y, life: 0.6, color: this.players[b.owner].hex });
      if (b.rally) d.setOrder({ type: 'move', x: b.rally.x + 30, y: b.rally.y - 30 });
      this.emit('dropshipReady', { player: b.owner, unit: d, bunker: b });
    }
    upgradeCost(bunker, what) {
      const def = ZC.UPGRADES[what], lvl = this.pendingLevel(bunker, what);
      if (what === 'fortify' && bunker.def.hq) return -1;  // déjà un centre de commandement
      return lvl >= def.max ? -1 : this.isAdmin(bunker.owner) ? 0 : def.cost(lvl);
    }

    // ---------------------------------------------------------- pouvoirs du mode admin (joueur humain)
    adminPower(what) {
      if (!this.isAdmin(this.humanId)) return false;
      const me = this.human;
      switch (what) {
        case 'minerals': me.minerals += 1000; break;
        case 'heal': // soigne toutes vos unités et structures
          for (const u of this.units) if (!u.dead && u.owner === me.id) { u.hp = u.maxHp; u.shield = u.def.shield; }
          break;
        case 'maxUpgrades': { // toutes les améliorations au maximum sur le bunker sélectionné (ou tous vos bunkers)
          const bs = this.selectedBunker ? [this.selectedBunker] : this.units.filter(u => !u.dead && u.owner === me.id && u.def.structure);
          for (const b of bs) { b.research = []; for (const k in ZC.UPGRADES) if (k !== 'evolve' && k !== 'fortify') b.up[k] = ZC.UPGRADES[k].max; if (!b.up.evolve) this.researchDone(b, 'evolve'); }
          break;
        }
        case 'wave': this.spawnWave(); break;
        case 'kill': // détruit les unités sélectionnées, à qui qu'elles appartiennent
          for (const u of this.selection.slice()) if (!u.dead) this.kill(u, null);
          break;
        default: return false;
      }
      this.emit('admin', { what });
      return true;
    }

    // Touche(s) de groupe de contrôle où figure cette unité (ex. « 1 », « 1,3 »)
    groupKeysOf(u) {
      const ks = [];
      for (const k in this.groups) if (this.groups[k].includes(u)) ks.push(k);
      return ks.join(',');
    }

    // Où apparaît un dropship acheté : près d'un bunker, sinon au milieu des unités
    dropshipSpawnPoint(p) {
      let n = 0, x = 0, y = 0;
      for (const u of this.units) if (!u.dead && u.owner === p.id) { n++; x += u.x; y += u.y; }
      return n ? { x: x / n, y: y / n } : null;
    }

    // ---------------------------------------------------------- boucle (pas fixe)
    update(dt) {
      if (this.state === 'intermission') {
        this.intermissionT -= dt;
        if (this.intermissionT <= 0) this.nextRound();
        return;
      }
      if (this.state !== 'playing') return;
      this.time += dt;
      this.roundTime += dt;
      const units = this.units;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.prevX = u.x; u.prevY = u.y; u.prevFacing = u.facing;
      }

      // Rounds (mode évolution)
      if (this.settings.mode === 'evolution' && this.roundIndex < ZC.ROUNDS.length - 1) {
        this.roundTimer += dt;
        if (this.roundTimer >= this.settings.roundDuration) {
          this.roundTimer = 0;
          this.roundIndex++;
          this.emit('round', { index: this.roundIndex, unit: this.roundUnit });
        }
      }

      // Envahisseurs
      if (this.settings.invasion) {
        this.invasionT -= dt;
        const before = this.invasionT;
        if (this.invasionT <= 0) { this.spawnInvasion(); const inv = this.settings.invasion; this.invasionT = ZC.rand(inv.min || 15, inv.max || 35); }
        else if (before > 5 && this.invasionT <= 5 && this.nextInvasion) this.emit('invasionSoon', this.nextInvasion);
      }

      // Vagues
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer += this.settings.spawnInterval;
        this.spawnWave();
      }

      // Grille spatiale
      this.hash.clear();
      for (let i = 0; i < units.length; i++) if (!units[i].dead) this.hash.insert(units[i]);

      // Unités
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.dead) u.update(dt);
      }
      this.separate();
      for (let i = 0; i < units.length; i++) units[i].postMove(dt);

      // Nettoyage des morts
      let hadDead = false;
      for (let i = 0; i < units.length; i++) if (units[i].dead) { hadDead = true; break; }
      if (hadDead) {
        this.units = this.units.filter(u => !u.dead);
        const before = this.selection.length;
        this.selection = this.selection.filter(u => !u.dead);
        if (this.selection.length !== before) this.selectionVersion++;
        for (const k in this.groups) this.groups[k] = this.groups[k].filter(u => !u.dead);
      }

      this.updateZones(dt);

      // IA
      for (let i = 0; i < this.ais.length; i++) {
        if (this.players[this.ais[i].p.id].alive) this.ais[i].update(dt);
      }

      // Effets
      for (let i = this.effects.length - 1; i >= 0; i--) {
        const e = this.effects[i];
        e.t += dt;
        if (e.t >= e.life) { this.effects[i] = this.effects[this.effects.length - 1]; this.effects.pop(); }
      }
      for (let i = this.decals.length - 1; i >= 0; i--) {
        const d = this.decals[i];
        d.t += dt;
        if (d.t >= d.life) this.decals.splice(i, 1);
      }

      this.updateHero(dt);

      // Fin de partie
      this.endCheckT += dt;
      if (this.endCheckT >= 1) { this.endCheckT = 0; this.checkEnd(); }
    }

    separate() {
      const q = this._q;
      const units = this.units;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (u.dead || u.def.air) continue;
        this.hash.query(u.x, u.y, 48, q);
        for (let j = 0; j < q.length; j++) {
          const v = q[j];
          if (v.id <= u.id || v.dead || v.def.air) continue;
          let dx = v.x - u.x, dy = v.y - u.y;
          let d = Math.hypot(dx, dy);
          const min = u.radius + v.radius;
          if (d >= min - 0.3) continue;
          if (d < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.hypot(dx, dy); }
          // Déplacement amorti pour éviter les tremblements ; structures immobiles
          const push = (min - d) * 0.35;
          const wu = u.def.structure ? 0 : u.order.type === 'hold' ? 0.25 : 1;
          const wv = v.def.structure ? 0 : v.order.type === 'hold' ? 0.25 : 1;
          const tot = wu + wv;
          if (tot === 0) continue;
          u.x -= dx / d * push * (2 * wu / tot);
          u.y -= dy / d * push * (2 * wu / tot);
          v.x += dx / d * push * (2 * wv / tot);
          v.y += dy / d * push * (2 * wv / tot);
        }
      }
      const W = this.map.w, H = this.map.h;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.x = ZC.clamp(u.x, u.radius, W - u.radius);
        u.y = ZC.clamp(u.y, u.radius, H - u.radius);
      }
    }

    // ---------------------------------------------------------- vagues
    // Unité produite par un bunker donné (niveau 2 après l'Évolution)
    bunkerSpawnType(b) {
      const t = this.spawnTypeFor(this.players[b.owner]), d = ZC.UNITS[t];
      return b.up.evolve && d.evolvesTo ? d.evolvesTo : t;
    }
    spawnWave() {
      const s = this.settings;
      this.recount();
      let spawned = 0;
      for (const z of this.map.zones) {
        if (z.owner < 0 || !z.bunker || z.bunker.dead) continue;
        const p = this.players[z.owner];
        if (!p.alive) continue;
        const b = z.bunker;
        const type = this.bunkerSpawnType(b), def = ZC.UNITS[type];
        const n = def.spawn * (z.super ? s.superZoneMult : 1);
        const income = (s.incomePerBunker + (p.bonus ? p.bonus.income : 0)) * (z.super ? s.superZoneMult : 1);
        p.minerals += income;
        p.mineralsEarned += income;
        const cap = this.supplyCap(z.owner);
        for (let k = 0; k < n; k++) {
          if (p.supply + def.supply > cap) {
            if (this.time - (p.supplyBlockedT || -99) > 45) { p.supplyBlockedT = this.time; this.emit('supplyBlocked', { player: p.id, cap }); }
            break;
          }
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, r = b.radius + def.radius + 6 + Math.random() * 10;
          const u = this.spawnUnit(z.owner, type, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r);
          u.facing = a; u.up = b.up; u.home = b;
          if (b.rally) u.setOrder({ type: 'attackmove', x: b.rally.x + ZC.rand(-12, 12), y: b.rally.y + ZC.rand(-12, 12) });
          p.unitCount++; p.supply += def.supply;
          spawned++;
        }
        if (spawned) this.addEffect({ type: 'spawn', x: b.x, y: b.y - 10, life: 0.5, color: p.hex });
      }
      this.waveCount++;
      this.emit('wave', { count: this.waveCount, spawned, unit: this.roundUnit });
    }

    // ---------------------------------------------------------- envahisseurs (missions de survie)
    // Une vague apparaît sur un bord de la carte et fonce sur la structure du joueur la plus proche.
    // Elle grossit avec le temps, passe aux unités de niveau 2 et gagne des améliorations.
    // Choisit à l'avance le bord et le point d'arrivée de la prochaine vague (affiché au joueur)
    planInvasion() {
      const map = this.map, side = Math.floor(Math.random() * 4), f = 0.1 + Math.random() * 0.8, m = 20;
      const x = side === 0 ? map.w * f : side === 1 ? map.w * f : side === 2 ? m : map.w - m;
      const y = side === 0 ? m : side === 1 ? map.h - m : map.h * f;
      this.nextInvasion = { x, y, side, sideName: ['nord', 'sud', 'ouest', 'est'][side] };
    }
    spawnInvasion() {
      const inv = this.players.find(p => p.invader); if (!inv) return;
      const s = this.settings, scale = s.invasion.scale || 1, t = this.time;
      const targets = this.units.filter(u => !u.dead && u.def.structure && !this.players[u.owner].invader);
      if (!targets.length) return;
      if (!this.nextInvasion) this.planInvasion();
      const { x, y, side } = this.nextInvasion;
      this.planInvasion(); // la suivante est déjà annoncée
      let target = null, bd = Infinity;
      for (const u of targets) { const d = ZC.dist(x, y, u.x, u.y); if (d < bd) { bd = d; target = u; } }
      const n = Math.min(30, Math.max(2, Math.round((3 + t / 40) * scale)));
      const race = ZC.RACES[inv.race], l2Share = t < 150 ? 0 : t < 300 ? 0.34 : 0.5;
      const up = { weapons: Math.min(3, Math.floor(t / 120)), armor: Math.min(3, Math.floor(t / 150)), range: 0, stim: 0, evolve: 0 };
      const group = [];
      for (let k = 0; k < n; k++) {
        const type = Math.random() < l2Share ? race.l2 : race.l1;
        const u = this.spawnUnit(inv.id, type, x + ZC.rand(-40, 40), y + ZC.rand(-40, 40));
        u.up = up; group.push(u);
      }
      this.issueOrder(group, { type: 'attackmove', x: target.x + ZC.rand(-20, 20), y: target.y + ZC.rand(-20, 20) });
      // Les envahisseurs déjà sur place et oisifs repartent à l'assaut
      const idle = this.units.filter(u => !u.dead && u.owner === inv.id && u.isIdle() && !group.includes(u));
      if (idle.length) this.issueOrder(idle, { type: 'attackmove', x: target.x, y: target.y });
      this.invasionCount++;
      this.recount();
      this.addEffect({ type: 'spawn', x, y, life: 1, color: inv.hex });
      this.emit('invasion', { wave: this.invasionCount, count: n, x, y, side: ['nord', 'sud', 'ouest', 'est'][side], unit: ZC.UNITS[race.l1], target });
    }

    // ---------------------------------------------------------- zones
    updateZones(dt) {
      const zones = this.map.zones, P = this.players.length;
      for (let i = 0; i < zones.length; i++) {
        zones[i].cnt.fill(0);
        if (zones[i].flashT > 0) zones[i].flashT -= dt;
      }
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        u.zoneId = this.map.zoneIndexAt(u.x, u.y);
        if (!u.def.structure && !u.def.air) zones[u.zoneId].cnt[u.owner]++;
      }
      // Une zone sans bunker (vierge ou en ruines) ne se prend qu'avec un dropship :
      // détruire un bunker ennemi libère la zone mais ne la donne pas.
    }

    // ---------------------------------------------------------- combat
    resolveAttack(att, target) {
      const def = att.def;
      this.applyDamage(target, att.damage, def.hits, def.dtype, att);
      if (def.splash > 0) {
        const cand = this.hash.query(target.x, target.y, def.splash + 16, this._q);
        for (let i = 0; i < cand.length; i++) {
          const v = cand[i];
          if (v === target || v.dead || this.allied(v.owner, att.owner) || v.def.air) continue;
          if (ZC.dist(v.x, v.y, target.x, target.y) <= def.splash + v.radius) {
            this.applyDamage(v, att.damage * 0.5, def.hits, def.dtype, att);
          }
        }
      }
      this.addEffect({
        type: def.fx, x: att.x, y: att.y, tx: target.x, ty: target.y,
        life: def.fx === 'spine' || def.fx === 'bolt' ? 0.22 : def.fx === 'shell' ? 0.3 : def.fx === 'flame' ? 0.35 : 0.12,
        color: this.players[att.owner].hex, r: target.radius,
      });
      this.emit('attack', { unit: att, target });
    }

    applyDamage(target, dmg, hits, dtype, att) {
      if (target.dead) return;
      const mult = ZC.DAMAGE_MULT[dtype][target.def.size];
      const armor = target.armor;
      for (let h = 0; h < hits; h++) {
        let d = dmg * mult;
        if (target.shield > 0) {
          const a = Math.min(target.shield, d);
          target.shield -= a; d -= a;
        }
        if (d > 0) {
          d = Math.max(0.5, d - armor);
          target.hp -= d;
        }
      }
      target.hitFlash = 0.08;
      target.attackedT = this.time;
      if (target.hp <= 0) this.kill(target, att);
    }

    kill(u, att) {
      if (u.dead) return;
      if (u.garrison && u.garrison.length) this.unloadBunker(u); // les occupants survivent à la destruction du bunker
      if (u.slot) u.releaseSlot();
      u.dead = true;
      u.hp = 0;
      const owner = this.players[u.owner];
      if (att && !att.dead && att.owner !== u.owner) {
        att.kills++;
        if (att.def.hero && att === this.hero) this.heroGainXp(u.def.bounty);
        const kp = this.players[att.owner];
        kp.kills++;
        kp.minerals += u.def.bounty;
        kp.mineralsEarned += u.def.bounty;
      }
      owner.losses++;
      const fx = u.def.deathFx;
      this.addEffect({ type: fx, x: u.x, y: u.y, life: fx === 'explosion' ? 0.5 : fx === 'bigExplosion' ? 1.2 : 0.6, r: u.radius, color: owner.hex, race: u.def.race });
      if (!u.def.structure) {
        this.addEffect({ type: 'corpse', x: u.x, y: u.y, life: u.def.air ? 0.8 : 0.7, unitType: u.type, facing: u.facing, color: owner.hex, air: !!u.def.air, up: { weapons: u.up.weapons, armor: u.up.armor } });
      }
      if (fx === 'blood' || fx === 'blood2' || fx === 'explosion' || fx === 'bigExplosion') {
        this.decals.push({ type: fx, x: u.x, y: u.y, t: 0, life: fx === 'bigExplosion' ? 60 : 25, r: u.radius, seed: Math.random() * 1000 });
        if (this.decals.length > 220) this.decals.shift();
      }
      if (u.def.extractor && u.patch && u.patch.extractor === u) u.patch.extractor = null;
      if (u.def.structure && u.zone) {
        const z = u.zone;
        if (u.queue.length || u.research.length) this.emit('queueLost', { player: owner.id, count: u.queue.length, research: u.research.length, hero: u.queue.some(q => q.what === 'hero') });
        u.queue = []; u.research = [];
        z.bunker = null; z.owner = -1; z.ruined = true; z.flashT = 1.2;
        this.recount();
        this.emit('bunkerDestroyed', { zone: z, player: owner.id, killer: att ? att.owner : -1, hq: !!u.def.hq, lastHQ: !!u.def.hq && !(owner.hq && !owner.hq.dead), bounty: u.def.bounty });
        // Un joueur qui perd son dernier bunker reçoit de quoi racheter un dropship
        if (owner.bunkers === 0 && owner.alive) {
          const cost = this.settings.dropshipCost;
          if (owner.minerals < cost) { owner.minerals = cost; this.emit('grant', { player: owner.id }); }
        }
      }
      this.emit('death', { unit: u, killer: att });
    }

    addEffect(e) {
      e.t = 0;
      this.effects.push(e);
      if (this.effects.length > 700) this.effects.shift();
    }

    // ---------------------------------------------------------- ordres
    issueOrder(units, o) {
      units = units.filter(u => !u.dead && !u.def.structure);
      if (!units.length) return;
      if (o.type === 'move' || o.type === 'attackmove' || o.type === 'patrol') {
        let avg = 0;
        for (const u of units) avg += u.radius;
        avg /= units.length;
        const offs = ZC.formation(units.length, avg * 2 + 6);
        let cx = 0, cy = 0;
        for (const u of units) { cx += u.x; cy += u.y; }
        cx /= units.length; cy /= units.length;
        const sortedUnits = units.slice().sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
        const sortedOffs = offs.slice().sort((a, b) => Math.atan2(a.dy, a.dx) - Math.atan2(b.dy, b.dx));
        for (let i = 0; i < sortedUnits.length; i++) {
          const u = sortedUnits[i], f = sortedOffs[i];
          u.setOrder({
            type: o.type,
            x: ZC.clamp(o.x + f.dx, u.radius, this.map.w - u.radius),
            y: ZC.clamp(o.y + f.dy, u.radius, this.map.h - u.radius),
          });
        }
      } else if (o.type === 'enter') {
        for (const u of units) if (u.canGarrison) u.setOrder(o);
      } else if (o.type === 'gather') { // travailleurs : récolter ; les autres s'approchent
        for (const u of units) u.setOrder(u.isWorker ? o : { type: 'move', x: o.patch.x, y: o.patch.y });
      } else if (o.type === 'extract') {
        for (const u of units) u.setOrder(u.isWorker ? o : { type: 'move', x: o.patch.x, y: o.patch.y + 30 });
      } else if (o.type === 'tower') { // un seul travailleur construit, les autres continuent leur travail
        const w = units.filter(u => u.isWorker); if (!w.length) return;
        let best = w[0], bd = Infinity; for (const u of w) { const d = ZC.dist(u.x, u.y, o.x, o.y); if (d < bd) { bd = d; best = u; } }
        best.setOrder({ type: 'tower', x: o.x, y: o.y, patch: best.order.type === 'gather' ? best.order.patch : null });
      } else if (o.type === 'repair') {
        for (const u of units) u.setOrder(u.isWorker ? { type: 'repair', target: o.target, patch: u.order.type === 'gather' ? u.order.patch : null } : { type: 'move', x: o.target.x, y: o.target.y + o.target.radius + 20 });
      } else {
        for (const u of units) u.setOrder(o);
      }
    }

    // Troupes issues d'un bunker (vivantes, mobiles, au sol)
    bunkerTroops(b) {
      return this.units.filter(u => !u.dead && u.home === b && !u.def.structure && !u.def.air && !u.def.worker);
    }

    // Ordre de construction pour les dropships (zone neutre sans bunker)
    orderBuild(dropships, zone) {
      if (!zone || zone.owner >= 0 || zone.bunker) return false;
      const d = dropships.filter(u => !u.dead && u.type === 'dropship');
      if (!d.length) return false;
      d[0].setOrder({ type: 'build', x: zone.cx, y: zone.cy, zoneId: zone.id });
      for (let i = 1; i < d.length; i++) d[i].setOrder({ type: 'move', x: zone.cx + 40 * i, y: zone.cy - 40 });
      return true;
    }

    // ---------------------------------------------------------- sélection
    select(units, add) {
      const limit = this.settings.selectionLimit;
      let own = units.filter(u => !u.dead && u.owner === this.humanId);
      // Comme SC1 : un cadre contenant des unités mobiles ignore les structures
      if (own.some(u => !u.def.structure)) own = own.filter(u => !u.def.structure);
      if (own.length > 1 && own.some(u => !u.def.air)) own = own.filter(u => !u.def.air).concat(own.filter(u => u.def.air));
      let next;
      if (add) {
        next = this.selection.filter(u => u.owner === this.humanId && !u.def.structure);
        for (const u of own) if (!next.includes(u) && !u.def.structure) next.push(u);
        if (!next.length) next = own.slice(0, 1);
      } else {
        next = own.length ? own : units.filter(u => !u.dead).slice(0, 1);
      }
      if (limit > 0 && next.length > limit) next = next.slice(0, limit);
      this.selection = next;
      this.selectionVersion++;
    }
    get ownSelection() { return this.selection.filter(u => u.owner === this.humanId && !u.dead && !u.def.structure); }
    // Bunkers / centres de commandement sélectionnés (la sélection ne doit contenir que ça) ; le premier sert de référence
    get selectedBunkers() {
      const isB = (u) => u.owner === this.humanId && !u.dead && u.def.structure && !u.def.extractor && !u.def.tower;
      return this.selection.length && this.selection.every(isB) ? this.selection : [];
    }
    get selectedBunker() { const bs = this.selectedBunkers; return bs.length ? bs[0] : null; }
    get selectedTower() { const u = this.selection[0]; return this.selection.length === 1 && u.owner === this.humanId && u.def.tower ? u : null; }

    // ---------------------------------------------------------- fin
    checkEnd() {
      this.recount();
      let alive = 0, last = -1;
      for (const p of this.players) {
        if (p.alive && !p.invader && p.bunkers === 0 && p.unitCount === 0) {
          p.alive = false;
          p.eliminatedAt = this.time;
          this.emit('eliminated', { player: p });
        }
        if (p.alive) { alive++; last = p.id; }
      }
      if (this.human && !this.human.alive && !this.humanDefeated) {
        this.humanDefeated = true;
        this.emit(this.isTournament ? 'roundDefeat' : 'defeat', {});
      }
      // Mission de survie : tenir jusqu'à l'heure dite
      const obj = this.campaign && this.campaign.objective;
      if (obj && obj.type === 'survive' && this.human.alive && this.time >= obj.time) {
        this.state = 'over'; this.winner = this.humanId; this.emit('end', { winner: this.humanId, survived: true }); return;
      }
      // Course aux zones : le premier (vous ou un ennemi) à tenir N zones gagne
      if (obj && obj.type === 'zones' && this.human.alive) {
        const first = this.players.filter(p => p.alive && !p.invader && p.zones >= obj.count).sort((a, b) => b.zones - a.zones)[0];
        if (first) { this.state = 'over'; this.winner = first.id; this.emit('end', { winner: first.id, zones: true }); return; }
      }
      // Conquête totale : ennemis éliminés ET toutes les zones à vous ; la partie continue tant que ce n'est pas fait
      if (obj && obj.type === 'conquer' && this.human.alive) {
        const enemiesLeft = this.players.some(p => p.alive && !p.invader && !this.allied(p.id, this.humanId));
        if (!enemiesLeft && this.map.zones.every(z => z.owner === this.humanId)) { this.state = 'over'; this.winner = this.humanId; this.emit('end', { winner: this.humanId, conquered: true }); }
        if (!enemiesLeft) return;
      }
      if (this.isTournament) {
        const limit = this.settings.roundTimeLimit;
        if (new Set(this.players.filter(p => p.alive).map(p => p.team)).size <= 1) this.endRound(last, 'elimination');
        else if (limit > 0 && this.roundTime >= limit) this.endRound(this.roundLeader().id, 'time');
        return;
      }
      const teams = new Set(this.players.filter(p => p.alive).map(p => p.team));
      if (teams.size <= 1) {
        this.state = 'over';
        this.winner = last;
        this.emit('end', { winner: last });
      }
    }

    // ---------------------------------------------------------- tournoi (mode rounds)
    // Joueur en tête du round : vivant, puis le plus de zones, d'unités, de kills
    roundLeader() {
      return this.players.slice().sort((a, b) => (b.alive - a.alive) || b.zones - a.zones || b.unitCount - a.unitCount || b.kills - a.kills)[0];
    }
    // Classement du tournoi (rounds gagnés)
    standings() {
      return this.players.slice().sort((a, b) => b.roundsWon - a.roundsWon || b.zones - a.zones);
    }

    endRound(winnerId, reason) {
      const w = winnerId >= 0 ? this.players[winnerId] : null;
      if (w) w.roundsWon++;
      this.roundWinner = winnerId;
      const final = !w || w.roundsWon >= this.settings.roundsToWin;
      this.emit('roundEnd', { winner: winnerId, index: this.roundIndex, reason, final, unit: this.roundUnit });
      if (final) {
        this.state = 'over';
        this.winner = winnerId;
        this.emit('end', { winner: winnerId });
      } else {
        this.state = 'intermission';
        this.intermissionT = 6;
      }
    }

    nextRound() {
      this.roundIndex++;
      this.resetRound();
      this.state = 'playing';
      this.emit('round', { index: this.roundIndex, unit: this.roundUnit });
    }
  }
  ZC.Game = Game;
})(window.ZC);
