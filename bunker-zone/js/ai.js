// ============================================================
//  ai.js — Intelligence artificielle des adversaires
//  - Attaques par cible : l'IA additionne ses unités libres dans les
//    zones voisines et attaque quand le rapport de force suffit.
//  - Dropships : expansion vers les zones neutres sûres.
//  - Minerais : dropships puis améliorations.
// ============================================================
(function (ZC) {
  'use strict';

  class AI {
    constructor(game, player, diffKey) {
      this.game = game;
      this.p = player;
      this.cfg = ZC.DIFFICULTY[diffKey] || ZC.DIFFICULTY.normal;
      this.timer = 1 + Math.random() * this.cfg.think;
      this.upgradeOrder = ['weapons', 'weapons', 'armor', 'range', 'weapons', 'siege', 'armor', 'range', 'stim', 'siege', 'armor', 'range', 'siege', 'evolve'];
    }

    update(dt) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.cfg.think * (0.8 + Math.random() * 0.4);
        this.think();
      }
    }

    think() {
      const g = this.game, map = g.map, me = this.p.id, P = g.players.length, zones = map.zones;
      const cfg = this.cfg;
      const friendly = (o) => o >= 0 && g.allied(me, o); // moi ou un allié

      // Tables de force par zone et par joueur
      const str = new Float32Array(zones.length * P);
      const idle = zones.map(() => []);
      const incoming = new Float32Array(zones.length);
      const dropships = [];
      const buildTargets = new Set();
      for (let i = 0; i < g.units.length; i++) {
        const u = g.units[i];
        if (u.dead || u.def.structure) continue;
        if (u.def.air) {
          if (u.owner === me) { dropships.push(u); if (u.order.type === 'build') buildTargets.add(u.order.zoneId); }
          continue;
        }
        const z = u.zoneId;
        if (z < 0 || u.def.worker) continue; // les travailleurs ne comptent pas dans les armées
        str[z * P + u.owner] += u.def.strength;
        if (u.owner !== me) continue;
        if (u.isIdle()) idle[z].push(u);
        else if (u.order.x !== undefined) {
          const dz = map.zoneAt(u.order.x, u.order.y);
          if (dz) incoming[dz.id] += u.def.strength;
        }
      }
      const enemyStr = (z) => {
        let s = 0;
        for (let p = 0; p < P; p++) if (!friendly(p)) s += str[z.id * P + p];
        return s;
      };
      const myStr = (z) => str[z.id * P + me];
      const sumStr = (arr) => { let s = 0; for (const u of arr) s += u.def.strength; return s; };
      const myZones = zones.filter(z => z.owner === me);
      const adjacentToMine = (z) => map.neighbors(z, true).some(n => n.owner === me);

      // ------------------------------------------------ garnison : des unités oisives entrent dans leur bunker
      for (const z of myZones) {
        const posts = [z.bunker].concat(g.units.filter(u => !u.dead && u.owner === me && u.def.tower && u.def.manned && !u.building && u.zoneId === z.id));
        for (const b of posts) {
          if (!b || b.dead) continue;
          const free = ZC.capacity(b) - b.garrison.length;
          if (free <= 0) continue;
          const cands = idle[z.id].filter(u => u.canGarrison && u.inside === null).slice(0, free);
          if (cands.length) { g.issueOrder(cands, { type: 'enter', bunker: b }); for (const u of cands) { const i = idle[z.id].indexOf(u); if (i >= 0) idle[z.id].splice(i, 1); } }
        }
      }

      // ------------------------------------------------ dropships, travailleurs et achats
      this.manageDropships(dropships, buildTargets, enemyStr, adjacentToMine);
      this.manageWorkers(enemyStr);
      this.spend(enemyStr, adjacentToMine, dropships);

      // ------------------------------------------------ joueur en tête
      let leader = -1, leaderZones = 0;
      for (const p of g.players) if (!friendly(p.id) && p.alive && p.zones > leaderZones) { leaderZones = p.zones; leader = p.id; }

      // Zones de l'IA menacées
      const threatened = new Set();
      for (const z of myZones) {
        if (enemyStr(z) > 0 && myStr(z) + incoming[z.id] < enemyStr(z) * 1.1) threatened.add(z.id);
      }

      // Candidats : zones ennemies ou zones à moi menacées (les zones sans bunker se prennent au dropship).
      // Les sources sont mes zones avec des unités libres à distance <= R.
      const zonesWithIdle = zones.filter(z => idle[z.id].length);
      const buildCandidates = (R) => {
        const out = [];
        for (const n of zones) {
          if (n.owner === me && !threatened.has(n.id)) continue;
          if (n.owner < 0) continue;                                              // zone libre : dropship
          if (n.owner !== me && friendly(n.owner)) continue;                      // zone d'un allié
          if (n.owner >= 0 && n.owner !== me && g.roundTime < cfg.truce) continue; // trêve initiale (par round en tournoi)
          const srcs = zonesWithIdle.filter(z => z !== n && Math.max(Math.abs(z.ix - n.ix), Math.abs(z.iy - n.iy)) <= R
            && !threatened.has(z.id) && (z.owner === me || enemyStr(z) === 0));
          if (!srcs.length) continue;
          const es = enemyStr(n);
          let around = 0;
          for (const nn of map.neighbors(n, true)) if (!friendly(nn.owner)) around += enemyStr(nn);
          // Un bunker ennemi demande du temps à abattre : on exige un peu plus
          // Un bunker ennemi est très résistant : il faut une vraie armée (moins avec des armes améliorées)
          const need = es * cfg.margin + 0.5 + around * 0.35 + (n.owner >= 0 && n.owner !== me ? (n.bunker && n.bunker.def.hq ? 200 : 120) / (1 + this.bestWeapons()) : 0);
          let gain = n.owner === me ? 2.2 : 1.6;
          if (n.super) gain += 0.8;
          if (n.owner === leader) gain += 0.3;
          let dist = 99;
          for (const z of srcs) dist = Math.min(dist, map.manhattan(z, n));
          out.push({ zone: n, es, need, srcs, score: gain / (need + 1) / (1 + dist * 0.3) });
        }
        return out;
      };
      let candidates = buildCandidates(2);
      if (!candidates.some(c => c.zone.owner !== me)) candidates = candidates.concat(buildCandidates(5).filter(c => !candidates.includes(c)));
      candidates.sort((a, b) => b.score - a.score);

      const sources = (t) => t.srcs.slice();

      const attack = (t, srcs, force) => {
        let have = incoming[t.zone.id];
        srcs.sort((a, b) => sumStr(idle[b.id]) - sumStr(idle[a.id]));
        const group = [];
        for (const sz of srcs) {
          if (have >= t.need && !force) break;
          const units = idle[sz.id];
          if (t.es === 0 && t.need < 2 && units.length > 3) {
            const take = units.splice(0, Math.max(3, Math.ceil(units.length / 3)));
            for (const u of take) { group.push(u); have += u.def.strength; }
          } else {
            while (units.length && (have < t.need || force)) {
              const u = units.pop();
              group.push(u); have += u.def.strength;
            }
            if (force) break;
          }
        }
        if (group.length) {
          g.issueOrder(group, { type: 'attackmove', x: t.zone.cx + ZC.rand(-20, 20), y: t.zone.cy + ZC.rand(-20, 20) });
          incoming[t.zone.id] += sumStr(group);
        }
        return group.length;
      };

      const defense = candidates.filter(c => threatened.has(c.zone.id));
      const offense = candidates.filter(c => !threatened.has(c.zone.id));

      for (const t of defense) {
        const srcs = sources(t);
        const avail = srcs.reduce((a, n) => a + sumStr(idle[n.id]), 0) + incoming[t.zone.id];
        if (avail >= t.need * 0.6) attack(t, srcs, false);
      }
      let bestInfeasible = null, ops = 0;
      for (const t of offense) {
        const srcs = sources(t);
        if (!srcs.length) continue;
        const avail = srcs.reduce((a, n) => a + sumStr(idle[n.id]), 0) + incoming[t.zone.id];
        if (avail >= t.need) { if (ops < cfg.maxOps && attack(t, srcs, false)) ops++; }
        else if (!bestInfeasible) bestInfeasible = { t, srcs, avail };
      }

      if (bestInfeasible && cfg.dumb > 0 && Math.random() < cfg.dumb && bestInfeasible.avail >= bestInfeasible.t.need * 0.45) {
        attack(bestInfeasible.t, bestInfeasible.srcs, true);
        bestInfeasible = null;
      }

      // Regroupement des unités intérieures vers le front
      if (cfg.rally === 'none') return;
      const frontier = myZones.filter(z => map.neighbors(z, true).some(n => !friendly(n.owner)));
      if (!frontier.length) return;
      let staging = null;
      if (cfg.rally === 'staging' && bestInfeasible) {
        let best = -1;
        for (const n of map.neighbors(bestInfeasible.t.zone, true)) {
          if (n.owner !== me) continue;
          const s = myStr(n);
          if (s > best) { best = s; staging = n; }
        }
      }
      for (const z of zones) {
        const units = idle[z.id];
        if (!units.length || z.owner !== me) continue;
        const isFrontier = map.neighbors(z, true).some(n => !friendly(n.owner));
        let dest = null;
        if (staging && staging !== z && (!isFrontier || cfg.rally === 'staging')) {
          if (!isFrontier || enemyStr(z) === 0) dest = staging;
        } else if (!isFrontier) {
          let bd = Infinity;
          for (const f of frontier) { const d = map.manhattan(z, f); if (d < bd) { bd = d; dest = f; } }
        }
        if (dest && dest !== z) {
          // On garde une petite garnison près du bunker
          const keep = Math.min(2, Math.floor(units.length / 4));
          const group = units.splice(0, units.length - keep);
          if (!group.length) continue;
          g.issueOrder(group, { type: 'attackmove', x: dest.cx + ZC.rand(-24, 24), y: dest.cy + ZC.rand(-24, 24) });
          incoming[dest.id] += sumStr(group);
        }
      }
    }

    // Zones constructibles : neutres sans bunker, sans ennemis, loin des menaces
    claimable(enemyStr, adjacentToMine, exclude) {
      const g = this.game, map = g.map, out = [];
      for (const z of map.zones) {
        if (z.owner >= 0 || z.bunker || exclude.has(z.id)) continue;
        if (enemyStr(z) > 0) continue;
        let threat = 0, adjEnemy = 0;
        for (const n of map.neighbors(z, true)) {
          threat += enemyStr(n);
          if (n.owner >= 0 && !g.allied(this.p.id, n.owner)) adjEnemy++;
        }
        const adj = adjacentToMine(z);
        const held = z.cnt && z.cnt[this.p.id] > 0;   // mes unités sont déjà sur place
        let dist = 99;
        for (const m of map.zones) if (m.owner === this.p.id) dist = Math.min(dist, map.manhattan(z, m));
        if (dist > 3 && this.p.bunkers > 0) continue;
        out.push({ zone: z, score: (adj ? 1 : 0.4) * (z.super ? 1.5 : 1) * (held ? 2 : 1) / (1 + threat * 0.05 + adjEnemy * 0.4 + dist * 0.2) });
      }
      return out;
    }

    manageDropships(dropships, buildTargets, enemyStr, adjacentToMine) {
      const g = this.game;
      for (const d of dropships) {
        if (d.order.type === 'build') continue;
        const options = this.claimable(enemyStr, adjacentToMine, buildTargets);
        if (!options.length) {
          // Rien à prendre : se mettre à l'abri près d'un bunker
          if (d.isIdle()) {
            const b = g.units.find(u => !u.dead && u.owner === this.p.id && u.def.structure);
            if (b && ZC.dist(d.x, d.y, b.x, b.y) > 80) d.setOrder({ type: 'move', x: b.x + 50, y: b.y - 40 });
          }
          continue;
        }
        let best = null, bs = -Infinity;
        for (const o of options) {
          const dist = ZC.dist(d.x, d.y, o.zone.cx, o.zone.cy);
          const s = o.score / (1 + dist / 600);
          if (s > bs) { bs = s; best = o.zone; }
        }
        if (best) { g.orderBuild([d], best); buildTargets.add(best.id); }
      }
    }

    // Travailleurs : en produire tant qu'il y a des gisements accessibles, envoyer les oisifs récolter, réparer les bunkers abîmés
    manageWorkers(enemyStr) {
      const g = this.game, p = this.p, me = p.id;
      const hq = p.hq && !p.hq.dead ? p.hq : null;
      const workers = g.workers(me);
      const patches = g.patches.filter(pt => pt.amount > 0 && (pt.zone.owner === me || (pt.zone.owner < 0 && enemyStr(pt.zone) === 0 && g.map.neighbors(pt.zone, true).some(n => n.owner === me))));
      // Oisifs : au gisement le plus proche
      for (const w of workers) {
        if (!w.isIdle() || !patches.length) continue;
        let best = null, bd = Infinity;
        for (const pt of patches) { const d = ZC.dist(w.x, w.y, pt.x, pt.y); if (d < bd) { bd = d; best = pt; } }
        if (best) w.setOrder({ type: 'gather', patch: best });
      }
      // Réparation : un bunker sous 60 % qui n'est plus sous le feu, si la trésorerie le permet
      if (workers.length && p.minerals > 120) {
        const hurt = g.units.filter(u => !u.dead && u.owner === me && u.def.structure && !u.def.extractor && !u.building && u.hp < u.maxHp * 0.6 && g.time - u.attackedT > 6 && enemyStr(u.zone || g.map.zoneAt(u.x, u.y)) === 0);
        for (const b of hurt) {
          if (g.units.some(u => !u.dead && u.owner === me && u.def.worker && u.order.type === 'repair' && u.order.target === b)) continue;
          let best = null, bd = Infinity;
          for (const w of workers) { if (w.order.type === 'repair') continue; const d = ZC.dist(w.x, w.y, b.x, b.y); if (d < bd) { bd = d; best = w; } }
          if (best && bd < ZC.ZONE_PX * 2.5) g.issueOrder([best], { type: 'repair', target: b });
        }
      }
      // Extracteur sur un gisement tenu, quand la trésorerie le permet (un travailleur libre y va)
      if (workers.length && p.minerals >= g.extractorCost(me) + 150) {
        const pt = patches.find(x => x.zone.owner === me && !x.extractor && x.amount > 400 && !workers.some(w => w.order.type === 'extract' && w.order.patch === x));
        if (pt) { let best = null, bd = Infinity; for (const w of workers) { if (w.order.type === 'extract' || w.order.type === 'repair') continue; const d = ZC.dist(w.x, w.y, pt.x, pt.y); if (d < bd) { bd = d; best = w; } } if (best) best.setOrder({ type: 'extract', patch: pt }); }
      }
      // Une tour par zone de front, quand la trésorerie le permet
      if (workers.length && p.minerals >= g.towerCost(me) + 200 && !workers.some(w => w.order.type === 'tower')) {
        const front = g.map.zones.filter(z => z.owner === me && z.bunker && g.map.neighbors(z, true).some(n => n.owner >= 0 && !g.allied(me, n.owner)));
        const z = front.find(z => !g.units.some(u => !u.dead && u.owner === me && u.def.tower && u.zoneId === z.id));
        if (z) {
          const en = g.map.neighbors(z, true).find(n => n.owner >= 0 && !g.allied(me, n.owner));
          const a = Math.atan2(en.cy - z.cy, en.cx - z.cx), tx = z.cx + Math.cos(a) * 110, ty = z.cy + Math.sin(a) * 110;
          if (g.canPlaceTower(me, tx, ty).ok) { let best = null, bd = Infinity; for (const w of workers) { if (w.order.type === 'extract' || w.order.type === 'repair') continue; const d = ZC.dist(w.x, w.y, tx, ty); if (d < bd) { bd = d; best = w; } } if (best) g.issueOrder([best], { type: 'tower', x: tx, y: ty }); }
        }
      }
      // Production : environ quatre travailleurs par gisement accessible
      if (!hq || !patches.length) return;
      const want = Math.min(g.workerCap(me), patches.length * 4);
      const have = workers.length + g.workersQueued(me);
      if (have < want && hq.queue.length < 2 && p.minerals >= g.workerCost(me) + (have < 2 ? 0 : 40)) g.buy(me, 'worker');
    }

    bestWeapons() {
      let b = 0;
      for (const u of this.game.units) if (!u.dead && u.owner === this.p.id && u.def.structure && u.up.weapons > b) b = u.up.weapons;
      return b;
    }

    // Bunker à améliorer : ceux du front d'abord, puis le moins amélioré
    upgradeTarget() {
      const g = this.game, map = g.map, me = this.p.id;
      let best = null, bs = -Infinity;
      for (const u of g.units) {
        if (u.dead || u.owner !== me || !u.def.structure || u.def.extractor || u.def.tower || !u.zone) continue;
        const front = map.neighbors(u.zone, true).some(n => !(n.owner >= 0 && g.allied(me, n.owner))) ? 1 : 0;
        const lvl = u.up.weapons + u.up.armor + u.up.range + u.up.siege + u.up.stim + u.up.evolve * 3 + u.research.length * 2;
        if (u.research.length >= ZC.RESEARCH_QUEUE_MAX) continue;
        const s = front * 10 - lvl + (u.def.hq ? 2 : 0) + Math.random();
        if (s > bs) { bs = s; best = u; }
      }
      return best;
    }

    spend(enemyStr, adjacentToMine, dropships) {
      const g = this.game, p = this.p, cfg = this.cfg;
      const options = this.claimable(enemyStr, adjacentToMine, new Set(dropships.filter(d => d.order.type === 'build').map(d => d.order.zoneId)));
      const freeDrops = dropships.filter(d => d.order.type !== 'build').length + g.dropshipsQueued(p.id);
      if (p.hq && !p.hq.dead && p.hq.queue.length >= this.game.settings.dropshipQueueMax) return;
      const canBuild = (p.hq && !p.hq.dead) || p.bunkers === 0;
      if (canBuild && options.length && freeDrops === 0 && p.minerals >= g.dropshipCost(p.id)) {
        if (p.bunkers === 0 || Math.random() < 0.9) { g.buy(p.id, 'dropship'); return; }
      }
      // Centre de commandement : environ un bunker sur trois est promu (le plus amélioré du front), une fois à l'aise en minerai
      const centers = g.units.filter(u => !u.dead && u.owner === p.id && u.def.structure && (u.def.hq || u.research.some(r => r.what === 'fortify'))).length;
      if (p.bunkers >= 3 && centers < Math.ceil(p.bunkers / 3)) {
        const cands = g.units.filter(u => !u.dead && u.owner === p.id && u.def.structure && !u.def.hq && !u.def.extractor && !u.def.tower && u.zone && u.research.length < ZC.RESEARCH_QUEUE_MAX && g.upgradeCost(u, 'fortify') >= 0);
        if (cands.length) {
          const score = (u) => (g.map.neighbors(u.zone, true).some(n => !(n.owner >= 0 && g.allied(p.id, n.owner))) ? 10 : 0) + u.up.weapons + u.up.armor + u.up.range;
          cands.sort((a, b) => score(b) - score(a));
          const cost = g.upgradeCost(cands[0], 'fortify'), reserve = canBuild && options.length ? g.dropshipCost(p.id) : 0;
          if (p.minerals - cost >= reserve) { if (Math.random() < cfg.spend) g.buy(p.id, 'fortify', cands[0]); return; }
          if (Math.random() < 0.7) return; // on économise pour le centre, en laissant passer quelques améliorations
        }
      }
      // Améliorations sur un bunker, en gardant de quoi racheter un dropship si une zone est libre
      let guard = 0;
      while (guard++ < 4) {
        const reserve = canBuild && options.length ? g.dropshipCost(p.id) : 0;
        const b = this.upgradeTarget();
        if (!b) return;
        let bought = false;
        for (const what of this.upgradeOrder) {
          const cost = g.upgradeCost(b, what);
          if (cost < 0) continue;
          if (what === 'evolve' && !g.canEvolve(b)) continue;
          if (p.minerals - cost < reserve) break;
          if (Math.random() > cfg.spend) return;
          bought = g.buy(p.id, what, b);
          break;
        }
        if (!bought) return;
      }
    }
  }
  ZC.AI = AI;
})(window.ZC);
