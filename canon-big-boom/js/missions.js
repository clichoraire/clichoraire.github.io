// Trois missions indépendantes par tableau. Les étoiles acquises ne se dépensent pas.
(function (CB) {
  'use strict';
  const S = CB.Save;
  const task = (id, kind, target, text, extra = {}) => ({ id, kind, target, text, ...extra });
  const M = CB.Missions = {};
  M.forStage = (wi, vi, def = CB.waveDef(wi, vi)) => {
    if (Array.isArray(def.missions)) return def.missions.slice(0, 3);
    if (wi === 0 && vi === 0) return [task('monstres', 'kills', 100, 'Tuer 100 monstres'), task('elites', 'elites', 3, 'Tuer 3 élites'), task('survie', 'survive', 120, 'Survivre 2 minutes')];
    // L’identifiant historique « survie » conserve les étoiles déjà gagnées.
    if (wi === 0 && vi === 1) return [task('chauves-souris', 'kills', 120, 'Tuer 120 monstres'), task('survie', 'bombsDefused', 5, 'Désamorcer 5 bombes magiques'), task('dragon', 'survive', 120, 'Survivre 2 minutes')];
    const strongCount = 8 + Math.floor(CB.tierOf(wi))*3 + vi*2;
    const strong = id => !def.strongRoster?.length ? task(id, 'runLevel', 4, 'Atteindre le niveau 4 dans ce tableau') : task(id, 'strongKills', strongCount, 'Vaincre ' + strongCount + ' monstres costauds', { enemies: def.strongRoster || [] });
    if (wi === 0 && vi === 2) return [strong('monstres'), task('niveau', 'runLevel', 5, 'Atteindre le niveau 5 dans ce tableau'), task('pouvoirs', 'special', 2, 'Utiliser 2 fois une attaque spéciale')];
    if (def.voyage) return [task('survie','kills',150,'Repousser 150 monstres'),task('niveau','fishers',2,'Amener 2 pêcheurs sur l’île'),task('fin','finish',1,'Atteindre l’île pirate')];
    if (def.dragonOutro) return [task('survie', 'bombsDefused', 5, 'Désamorcer 5 bombes magiques'), strong('niveau'), task('fin', 'finish', 1, 'Tenir jusqu’au passage du dragon')];
    if (def.type === 'boss') return [task('boss', 'finish', 1, 'Vaincre le boss'), task('vie', 'bombsDefused', 3, 'Désamorcer 3 bombes magiques'), task('sans-special', 'boxes', 3, 'Ouvrir 3 boîtes bonus')];
    if (def.type === 'cibles') return [task('cibles', 'targets', 5, 'Toucher 5 cibles'), task('fin', 'quickTargets', 3, 'Toucher 3 cibles en moins de 2 secondes chacune'), task('precision', 'noMissTargets', 1, 'Terminer sans rater une cible')];
    if (def.type === 'brigands') return [task('brigands', 'brigands', 5, 'Toucher 5 brigands'), task('fin', 'quickBrigands', 3, 'Attraper 3 brigands en moins de 1 seconde chacun'), task('civils', 'noCivil', 1, 'Terminer sans toucher de civil')];
    if (def.type === 'survive' || def.type === 'swarm') return [task('survie', 'bombsDefused', 3 + Math.min(3, Math.floor(CB.tierOf(wi))), 'Désamorcer ' + (3 + Math.min(3, Math.floor(CB.tierOf(wi)))) + ' bombes magiques'), strong('niveau'), task('fin', 'finish', 1, 'Terminer le tableau')];
    if (def.type === 'sink') return [task('monstres', 'ships', def.goal, 'Couler ' + def.goal + ' bateaux'), task('niveau', 'bombsDefused', 3, 'Désamorcer 3 bombes magiques'), task('pouvoir', 'special', 1, 'Utiliser une attaque spéciale')];
    const count = Math.min(def.goal || 100, 30 + Math.floor(CB.tierOf(wi)) * 10);
    return [def.strongRoster?.length ? strong('monstres') : task('monstres', 'kills', count, 'Tuer ' + count + ' monstres'), task('niveau', 'runLevel', 4, 'Atteindre le niveau 4 dans ce tableau'), task('pouvoir', 'special', 1, 'Utiliser une attaque spéciale')];
  };
  M.recordKill = (w, e) => {
    if (w.isDecor(e)) return;
    const type = e.boss ? 'boss:' + Object.keys(CB.BOSSES).find(k => CB.BOSSES[k] === e.def) : e.type;
    const key = type + ':' + (e.elite ? 'elite' : 'normal') + ':' + (e.tier || 0);
    (w.stageDiscoveries ||= {})[key] = { type, elite: !!e.elite, tier: e.tier || 0, color: e.color, name: e.name };
  };
  M.knownEnemies = (p, wi, vi) => {
    const seen = new Set();
    return Object.values(p.stageBestiary?.[M.key(wi, vi)] || {}).filter(e => { const key = e.type + ':' + e.color; if (seen.has(key)) return false; seen.add(key); return true; });
  }; // Une seule icône par apparence ; les variantes complètes restent dans la sauvegarde.
  M.compact = m => {
    const time = n => n >= 60 ? Math.floor(n / 60) + ' min' + (n % 60 ? ' ' + n % 60 + ' s' : '') : n + ' s';
    const labels = {
      fishers: ['🎣', 'Pêcheurs à bon port', m.target],
      strongKills: ['👹', 'Monstres costauds', m.target],
      boxes: ['🎁', 'Boîtes bonus', m.target], ships: ['⛵', 'Bateaux coulés', m.target],
      quickTargets: ['⚡', 'Cibles en moins de 2 s', m.target], quickBrigands: ['⚡', 'Brigands en moins de 1 s', m.target],
      bombsDefused: ['💣', 'Bombes désamorcées', m.target],
      kills: ['🎯', 'Monstres', m.target], killType: ['🎯', CB.ENEMIES[m.enemy]?.name || 'Monstres', m.target],
      elites: ['🔥', 'Élites', m.target], eliteType: ['🔥', 'Élites', m.target],
      survive: ['⏱', 'Survivre', time(m.target)], runLevel: ['⬆', 'Niveau', m.target],
      special: ['⚡', 'Attaque spéciale', m.target + ' ×'], finish: ['🏁', /dragon/i.test(m.text) ? 'Passage du dragon' : /boss/i.test(m.text) ? 'Battre le boss' : 'Terminer', ''],
      finishHealth: ['♥', 'Vie à la victoire', m.target + ' %'], bossNoSpecial: ['⚡', 'Boss sans spécial', ''],
      targets: ['🎯', 'Cibles', m.target], brigands: ['🤠', 'Brigands', m.target],
      sniperClean: ['🎯', 'Au plus un raté', ''], sniperPerfect: ['★', 'Aucun tir raté', ''],
      fuses: ['💥', 'Citrouilles dorées', m.target],
      noCivil: ['🛡', 'Aucun civil touché', ''], noMissTargets: ['🎯', 'Aucun raté', ''],
      gold: ['●', 'Or ramassé', m.target], burn: ['🔥', 'Ennemis en feu', m.target], freeze: ['❄', 'Ennemis gelés', m.target]
    };
    const [icon, label, value] = labels[m.kind] || ['🎯', m.text, '']; return {icon, label, value};
  };
  M.rewardGold = (wi, vi) => Math.round(100 * (1 + CB.tierOf(wi)) * (1 + vi * .25));
  M.key = (wi, vi) => CB.WORLDS[wi].id + '-' + (vi + 1);
  M.init = w => {
    w.missions = M.forStage(w.wi, w.vi, { ...w.def, missions: w.custom?.missions || w.def.missions }); w.missionCounters = { damage: 0, firstDamage: Infinity, elites: {}, burn: new Set(), freeze: new Set(), bounce: new Set(), dual: new Set(), projectiles: 0, closeKills: 0, farKills: 0, distance: 0, still: 0, bestStill: 0, lastX: 0, healthAt: {}, killsAt: [], bestBurst: {}, maxBefore: {}, eliteClean: 0 };
    // Ces tableaux n'ont pas d'événement de fin : les missions sont évaluées à la mort ou au départ.
    w.missionsEndless = w.wi === 0 && (w.vi >= 0 && w.vi <= 2) && ['kill', 'endless'].includes(w.def.type);
    if (w.missionsEndless) w.def = { ...w.def, text: 'Remplis tes trois missions. Chaque étoile reste acquise !' };
  };
  M.pressure = w => {
    const eligible = !w.def.sniper && ['kill', 'endless', 'survive', 'swarm', 'killTimed', 'sink'].includes(w.def.type);
    const start = w.def.dragonOutro ? 120 : Math.min(120, ['survive', 'swarm', 'killTimed'].includes(w.def.type) && w.def.seconds ? w.def.seconds * .6 : 120);
    const begins = w.def.opening && !w.custom ? Math.max(start, (w.openingEndedAt ?? Infinity) + 45) : start;
    const step = eligible && w.time >= begins ? 1 + Math.floor((w.time - begins) / 30) : 0;
    return { step, hp: 1 + step * .4, speed: 1 + step * .12, every: Math.max(.18, 1.2 * Math.pow(.65, Math.max(0, step - 1))), count: Math.min(3, 1 + Math.floor(Math.max(0, step - 1) / 2)) };
  };
  M.hordeEnemy = w => {
    if (w.wi === 0 && w.vi === 0 && w.custom) return w.random() < .25 ? 'owl' : 'bat';
    if (w.def.opening && !w.custom) return w.pickWorldEnemy();
    if (w.endless && !w.custom) return w.pickEndless().type;
    if (w.def.night && !w.custom) return w.pickEndless(w.def.night.timeScale).type;
    return w.pickWorldEnemy();
  };
  M.tick = (w, dt) => {
    const c = w.missionCounters; if (!c) return;
    const moved = Math.abs(w.px - c.lastX); c.distance += moved; c.lastX = w.px; c.still = moved > .001 ? 0 : c.still + dt; c.bestStill = Math.max(c.bestStill, c.still);
    for (const m of w.missions) {
      if (m.kind === 'healthAt' && w.time >= m.seconds && c.healthAt[m.id] == null) c.healthAt[m.id] = w.hp / w.maxHp * 100;
      if (m.kind === 'maxBefore' && w.time <= m.seconds && Object.keys(CB.CARDS).some(k => !CB.CARDS[k].instant && Number.isFinite(CB.CARDS[k].max) && w.cardLevel(k) >= CB.CARDS[k].max)) c.maxBefore[m.id] = true;
    }
    for (const e of w.enemies) if (!w.isDecor(e)) { if (e.burn) c.burn.add(e.id); if (e.frozen > 0 || e.chill > 0) c.freeze.add(e.id); if (e.burn && (e.frozen > 0 || e.chill > 0)) c.dual.add(e.id); }
    const pressure = M.pressure(w);
    if (pressure.step && !w.over && !w.outro && !w.puzzle && !w.boss && dt > 0) {
      if (w.pressureStep !== pressure.step) { w.pressureStep = pressure.step; w.pressureNext = Math.min(w.pressureNext || w.time, w.time); w.texts.push({ text: pressure.step === 1 ? 'LA HORDE ARRIVE !' : 'LA HORDE S’INTENSIFIE !', x: 0, y: 13, z: 24, age: 0, color: '#ffbc54', big: true }); }
      if (w.time >= (w.pressureNext || 0)) {
        w.pressureNext = w.time + pressure.every;
        const room = Math.max(0, (w.custom?.maxAlive || w.def.maxAlive || 40) - w.enemies.filter(e => !e.dead && !e.escaped && !w.isDecor(e)).length);
        if (room) { w.pressureWaves = (w.pressureWaves || 0) + 1;
          for (let i = 0; i < Math.min(room, pressure.count); i++) w.spawnEnemy(M.hordeEnemy(w), undefined, i === 0 && w.pressureWaves % Math.max(2, 6 - pressure.step) === 0);
        }
      }
    }
    // Les groupes personnalisés du premier tableau restent intacts ; après eux, la survie continue.
    if (!pressure.step && w.missionsEndless && w.custom && w.sequence?.length && w.sequence.every((g, i) => w.seqStatus(i) === 'done') && !w.over) {
      w.missionSpawn = (w.missionSpawn || 0) - dt;
      if (w.missionSpawn <= 0) { w.missionSpawn = Math.max(.45, 1.1 - w.time / 600); w.spawnEnemy(w.random() < .2 ? 'owl' : 'bat'); }
    }
  };
  M.value = (w, m) => {
    const c = w.missionCounters || {}, finished = !!w.eventFinished, cards = w.cards || [];
    switch (m.kind) {
      case 'fishers': return w.eventFinished ? (w.fishers||[]).filter(f=>f.fledAt==null).length : 0;
      case 'strongKills': return (m.enemies || []).reduce((total,key)=>total+(w.killsBy[key] || 0),0);
      case 'boxes': return w.boxesHit || 0;
      case 'ships': return w.shipsSunk || 0;
      case 'quickTargets': return w.quickTargets || 0;
      case 'quickBrigands': return w.quickBrigands || 0;
      case 'bombsDefused': return w.bombsDefused || 0;
      case 'kills': return w.kills;
      case 'killType': return w.killsBy[m.enemy] || 0;
      case 'elites': return w.elitesKilled;
      case 'eliteType': return c.elites?.[m.enemy] || 0;
      case 'survive': return w.time;
      case 'healthAt': return c.healthAt?.[m.id] || 0;
      case 'special': return w.specialsUsed;
      case 'finish': return +finished;
      case 'finishHealth': return finished ? w.hp / w.maxHp * 100 : 0;
      case 'finishNoDamage': return +(finished && !c.damage);
      case 'runLevel': return w.runLevel;
      case 'combo': return w.bestCombo;
      case 'comboCard': return w.cardLevel(m.card);
      case 'cardLevel': return w.cardLevel(m.card);
      case 'burn': return c.burn?.size || 0;
      case 'freeze': return c.freeze?.size || 0;
      case 'bounce': return c.bounce?.size || 0;
      case 'gold': return Math.floor(w.gold);
      case 'coins': return w.coinsCollected;
      case 'projectiles': return c.projectiles || 0;
      case 'closeKills': return c.closeKills || 0;
      case 'farKills': return c.farKills || 0;
      case 'distance': return c.distance || 0;
      case 'still': return c.bestStill || 0;
      case 'diverse': return new Set(cards.filter(k => !CB.CARDS[k].instant)).size;
      case 'maxBefore': return +(c.maxBefore?.[m.id] || false);
      case 'eliteClean': return c.eliteClean || 0;
      case 'dualStatus': return c.dual?.size || 0;
      case 'cleanStart': return c.firstDamage >= m.target ? w.time : 0;
      case 'noSpecial': return (finished || w.time >= (m.seconds || 120)) && !w.specialsUsed ? 1 : 0;
      case 'bossNoSpecial': return +(finished && !w.specialsUsed);
      case 'noCard': return (finished || w.time >= (m.seconds || 120)) && !cards.includes(m.card) ? 1 : 0;
      case 'baseOnly': return (finished || w.time >= (m.seconds || 120)) && !cards.some(k => !CB.CARDS[k].instant) ? 1 : 0;
      case 'targets': return w.targetsHit;
      case 'brigands': return w.brigandsHit;
      case 'sniperClean': return +(finished && w.sniperMisses <= 1);
      case 'sniperPerfect': return +(finished && w.sniperMisses === 0);
      case 'fuses': return w.fusesHit || 0;
      case 'noCivil': return +(finished && !w.civilsHit);
      case 'noMissTargets': return +(finished && w.targetsHit >= w.cibles.count && !w.targetsMissed);
      default: return 0;
    }
  };
  M.results = w => (w.missions || []).map(m => ({ ...m, value: M.value(w, m), complete: M.value(w, m) >= m.target }));
  M.finish = (w, won, reason) => {
    w.eventFinished = !!won && !w.missionsEndless && !['portail', 'abandon', 'nuit'].includes(reason) && (!w.def.dragonOutro || !!w.outro?.done);
    M.tick(w, 0); w.missionResults = M.results(w); w.medalMax = 3; w.stars = w.missionResults.filter(m => m.complete).length;
    w.missionRewardGold = M.rewardGold(w.wi, w.vi); w.missionBonusGold = w.stars * w.missionRewardGold; w.bonusGold = (w.bonusGold || 0) + w.missionBonusGold;
    // Une étoile reste gagnée même si le canon a été détruit.
    w.won = w.eventFinished || w.stars > 0;
    if (reason === 'detruit') w.reason = 'detruit';
  };
  // Déverrouillage explicite : seuil croissant sur les tableaux précédents du monde, sans dépenser les étoiles.
  const blank = S.blank;
  S.blank = id => ({ ...blank(id), missionVersion: 1, missionStars: {}, stageOpen: {}, stageFinished: {} });
  const legacyUnlocked = S.waveUnlocked, legacyWorldDone = S.worldDone;
  S.worldDone = (p, wi) => p.missionVersion ? !!p.stageFinished?.[CB.WORLDS[wi]?.id + '-' + CB.WAVES_PER_WORLD] : legacyWorldDone(p, wi);
  S.waveUnlocked = (p, wi, vi) => {
    if (!p.missionVersion || vi >= CB.WAVES_PER_WORLD) return legacyUnlocked(p, wi, vi);
    return S.worldUnlocked(p, wi) && (vi === 0 || !!p.stageOpen?.[M.key(wi, vi)]);
  };
  S.stageStarRequirement = vi => Math.max(0, vi * 2);
  S.stageStarCount = (p, wi) => S.worldStars(p, CB.WORLDS[wi].id);
  S.canUnlockStage = (p, wi, vi) => vi > 0 && vi < CB.WAVES_PER_WORLD && !S.waveUnlocked(p, wi, vi) && S.worldUnlocked(p, wi) && S.waveUnlocked(p, wi, vi - 1) && S.stars(p, CB.WORLDS[wi].id, vi - 1) >= 1 && S.stageStarCount(p, wi) >= S.stageStarRequirement(vi);
  S.unlockStage = (p, wi, vi) => { if (!S.canUnlockStage(p, wi, vi)) return false; (p.stageOpen ||= {})[M.key(wi, vi)] = true; return true; };
  const oldRevealed = S.revealed;
  S.revealed = p => { if (!p.missionVersion) return oldRevealed(p); let n = 0; for (let vi = 1; vi < CB.WAVES_PER_WORLD; vi++) if (S.waveUnlocked(p, 0, vi) || S.canUnlockStage(p, 0, vi)) n = vi; return n; };
  const load = S.load;
  S.load = storage => {
    const data = load(storage);
    for (const p of Object.values(data.profiles)) {
      // S.load fusionne le profil avec blank : détecter les anciennes données sur la source.
      let raw = null; try { raw = JSON.parse(storage.getItem(S.KEY))?.profiles?.[p.id]; } catch (_) { }
      if (raw && !raw.missionVersion) {
        p.missionVersion = 1; p.stageOpen ||= {}; p.stageFinished ||= {}; p.missionStars ||= {};
        for (let wi = 0; wi < CB.WORLDS.length; wi++) {
          const wid = CB.WORLDS[wi].id, old = { ...p, missionVersion: 0 };
          for (let vi = 1; vi < CB.WAVES_PER_WORLD; vi++) if (legacyUnlocked(old, wi, vi)) p.stageOpen[M.key(wi, vi)] = true;
          if ((p.progress[wid] || [])[CB.WAVES_PER_WORLD - 1]) p.stageFinished[wid + '-' + CB.WAVES_PER_WORLD] = true;
        }
      }
    }
    return data;
  };
  const cheat = S.cheatUnlock;
  S.cheatUnlock = p => { cheat(p); for (let wi = 0; wi < CB.WORLDS.length; wi++) { p.stageFinished ||= {}; p.stageOpen ||= {}; p.stageFinished[CB.WORLDS[wi].id + '-' + CB.WAVES_PER_WORLD] = true; for (let vi = 1; vi < CB.WAVES_PER_WORLD; vi++) p.stageOpen[M.key(wi, vi)] = true; } return p; };
})(window.CB);
