// Sauvegarde : un profil par membre de la famille (or, niveau, canons, boulets, améliorations, progrès des mondes).
(function (CB) {
  'use strict';
  const KEY = 'cb.save';
  const S = CB.Save = { KEY };
  S.blank = id => ({ id, gold: 0, xp: 0, level: 1, cannon: 'classique', cannons: ['classique'], ball: 'fer', balls: ['fer'], upgrades: {}, effects: {}, talents: {}, points: 0, ally: null, allyBought: false, ally2: null, ally2Bought: false, items: {}, towers: 0, homing: 0, specialLevel: 1, slot2: false, special2: null, discovered: 0, shown: 0, bestTime: 0, nightKills: 0, portal: false, portalShown: false, targetsHit: 0, targetsShown: false, brigandsShown: false, boatShown: false, boatSecret: false, pirate: false, pirateLevel: 1, usePirate: false, seenBy: {}, killsBy: {}, progress: {}, kills: 0, plays: 0, wins: 0, bestCombo: 0 });
  S.fresh = () => ({ current: null, profiles: {}, settings: { sound: true, music: true, soundVolume: 100, musicVolume: 55, aim: 'auto' } });
  S.load = storage => {
    const data = S.fresh();
    try { const raw = JSON.parse(storage.getItem(KEY) || 'null'); if (raw && typeof raw === 'object') { Object.assign(data, raw); data.settings = Object.assign(S.fresh().settings, raw.settings || {}); data.profiles = raw.profiles || {}; } } catch (e) { }
    for (const [id, p] of Object.entries(data.profiles)) { const old = p && p.talents === undefined, q = Object.assign(S.blank(id), p); if (old) q.points = Math.max(0, (q.level || 1) - 1); if (!(q.specialLevel >= 1)) q.specialLevel = 1; if (!(q.towers >= 0)) q.towers = 0; for (const k of ['gold', 'xp', 'kills', 'points', 'discovered', 'shown', 'bestTime', 'nightKills', 'targetsHit']) if (!Number.isFinite(q[k])) q[k] = 0;
      /* l'ancien achat « tir automatique » est remboursé : on tire toujours en continu */ if (q.upgrades && q.upgrades.auto) { delete q.upgrades.auto; q.gold += 60; } if (q.ball === 'planete') q.ball = 'galaxie'; if (Array.isArray(q.balls)) q.balls = q.balls.map(b => b === 'planete' ? 'galaxie' : b); data.profiles[id] = q; }
    return data;
  };
  S.store = (data, storage) => { try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } };
  S.wipe = storage => { try { storage.removeItem(KEY); return true; } catch (e) { return false; } };   // efface tout : profils, or, étoiles, réglages
  S.profile = (data, id) => (data.profiles[id] ||= S.blank(id));
  S.stars = (p, worldId, vi) => (p.progress[worldId] || [])[vi] || 0;
  S.worldStars = (p, worldId) => (p.progress[worldId] || []).reduce((a, b) => a + (b || 0), 0);
  // Tableaux réussis (une étoile ou plus) sur le chemin principal d'un monde (le tableau secret ne compte pas).
  S.worldCleared = (p, wi) => { const w = CB.WORLDS[wi]; return w ? (p.progress[w.id] || []).slice(0, CB.WAVES_PER_WORLD).filter(Boolean).length : 0; };
  S.worldDone = (p, wi) => !!CB.WORLDS[wi] && S.worldCleared(p, wi) >= CB.WORLD_NEED;   // assez de tableaux réussis pour ouvrir le monde suivant
  S.worldUnlocked = (p, wi) => { const w = CB.WORLDS[wi]; if (w && w.hidden) return !!p.pirateWorld; return wi === 0 || S.worldDone(p, wi - 1); };   // monde caché : ouvert par le bateau pirate (1-9)
  // Monde 1 : le tableau 2 se révèle après unlockKills monstres abattus dans la nuit sans fin (secret), les tableaux 3 à 5 par les coffres
  // mystères, et le tableau secret 6 (la Vallée des dinosaures) par le portail du coffre doré. Ailleurs, il faut une étoile au tableau précédent.
  // Monde 1 : combien de tableaux du chemin principal sont révélés, dans l'ordre : 100 monstres → le 2 ; une étoile au 2 → le 3 ;
  // puis les coffres mystères (maxDiscoveries) → le 4 et le 5.
  S.revealed = p => { let n = (p.nightKills || 0) >= CB.ENDLESS.unlockKills ? 1 : 0; for (let vi = 1; vi <= 3 && n === vi; vi++) if (S.stars(p, 'foret', vi) > 0) n = vi + 1; return n; };   // 100 abattus → 2 ; puis chaque étoile ouvre le suivant (3, 4, 5) ; les coffres ne révèlent plus rien
  S.waveUnlocked = (p, wi, vi) => S.worldUnlocked(p, wi) && (vi === 0 || (wi === 0 ? (vi === 5 ? !!p.portal : vi === 6 ? (p.targetsHit || 0) >= 3 : vi === 7 ? S.stars(p, 'foret', 3) > 0 : vi === 8 ? !!p.boatSecret : vi <= S.revealed(p)) : S.stars(p, CB.WORLDS[wi].id, vi - 1) > 0));
  // Triche de Matthieu : tout débloquer d'un coup (secrets du monde 1, portail, mini-jeu, une étoile sur chaque tableau de chaque monde).
  S.cheatUnlock = p => { p.nightKills = Math.max(p.nightKills || 0, CB.ENDLESS.unlockKills); p.discovered = CB.ENDLESS.maxDiscoveries; p.shown = CB.WAVES_PER_WORLD - 1; p.portal = true; p.portalShown = true; p.targetsHit = 3; p.targetsShown = true; p.brigandsShown = true; p.boatShown = true; p.boatSecret = true; p.pirate = true; p.pirateWorld = true; p.pirateShown = true;
    for (const w of CB.WORLDS) { const arr = p.progress[w.id] ||= []; for (let vi = 0; vi < CB.WAVES_PER_WORLD; vi++) arr[vi] = Math.max(arr[vi] || 0, 1); } return p; };
  S.cannonUnlocked = (p, key) => { const c = CB.CANNONS[key]; return !c.world || S.stars(p, c.world, CB.WAVES_PER_WORLD - 1) > 0; }; // le canon d'un monde : battre son boss
  S.completion = p => { let done = 0, total = 0; for (let wi = 0; wi < CB.WORLDS.length; wi++) { if (CB.WORLDS[wi].hidden) continue; total += CB.WAVES_PER_WORLD; done += S.worldCleared(p, wi); } return Math.round(100 * done / total); };   // le monde caché ne compte pas dans le %
  S.totalStars = p => CB.WORLDS.reduce((a, w) => a + S.worldStars(p, w.id), 0);
  // Ajoute de l'expérience et monte de niveau au besoin. Retourne le nombre de niveaux gagnés.
  S.addXp = (p, xp) => { p.xp += Math.round(xp); let gained = 0; while (p.level < CB.MAX_LEVEL && p.xp >= CB.xpForLevel(p.level)) { p.xp -= CB.xpForLevel(p.level); p.level++; gained++; } p.points = (p.points || 0) + gained; return gained; };
  S.spendPoint = (p, key) => { if (!CB.TALENTS[key] || !(p.points > 0) || (p.talents?.[key] || 0) >= CB.TALENT_MAX) return false; p.talents ||= {}; p.talents[key] = (p.talents[key] || 0) + 1; p.points--; return true; };
  S.buyAlly = p => { if (p.allyBought || p.gold < CB.HELPER.price) return false; p.gold -= CB.HELPER.price; p.allyBought = true; if (!p.ally || p.ally === p.id) p.ally = (CB.PLAYERS.find(m => m.id !== p.id) || {}).id || null; return true; };
  S.buyAlly2 = p => { if (!p.allyBought || p.ally2Bought || p.gold < CB.HELPER.price2) return false; p.gold -= CB.HELPER.price2; p.ally2Bought = true; if (!p.ally2 || p.ally2 === p.id || p.ally2 === p.ally) p.ally2 = (CB.PLAYERS.find(m => m.id !== p.id && m.id !== p.ally) || {}).id || null; return true; };
  S.setAlly2 = (p, id) => { if (!p.ally2Bought || id === p.id || id === p.ally || !CB.playerById(id)) return false; p.ally2 = id; return true; };
  // Pouvoirs débloqués en avançant : la sphère après le monde 1, les tours après le monde 2.
  S.itemUnlocked = (p, key) => { const it = CB.ITEMS[key]; return !!it && (it.unlockWorld == null || S.worldDone(p, it.unlockWorld)); };
  S.towersUnlocked = p => S.worldDone(p, CB.TOWER.unlockWorld);
  S.buySlot2 = p => { if (p.slot2 || p.gold < CB.SLOT2.price) return false; p.gold -= CB.SLOT2.price; p.slot2 = true; return true; };
  S.buyPower2 = (p, id) => { if (!p.slot2 || !CB.SPECIALS[id] || !CB.playerById(id) || id === p.id || p.special2 === id || p.gold < CB.SLOT2.powerPrice) return false; p.gold -= CB.SLOT2.powerPrice; p.special2 = id; return true; };   // remplace le pouvoir précédent de la case
  S.homingUnlocked = p => S.worldDone(p, CB.HOMING.unlockWorld);
  S.buyHoming = p => { const n = p.homing || 0; if (!S.homingUnlocked(p) || n >= CB.HOMING.max || p.gold < CB.HOMING.prices[n]) return false; p.gold -= CB.HOMING.prices[n]; p.homing = n + 1; return true; };
  S.buyTower = p => { const n = p.towers || 0; if (!S.towersUnlocked(p) || n >= CB.TOWER.max || p.gold < CB.TOWER.prices[n]) return false; p.gold -= CB.TOWER.prices[n]; p.towers = n + 1; return true; };
  // Niveau de l'attaque spéciale : niv. 2 dès le niveau 9 du personnage, niv. 3 dès le niveau 20.
  S.specialNext = p => CB.SPECIAL_LEVELS[(p.specialLevel || 1)] || null;
  S.buyPirateLevel = p => { const P = CB.PIRATE, n = p.pirateLevel || 1; if (!p.pirate || n >= P.max || p.gold < P.prices[n]) return false; p.gold -= P.prices[n]; p.pirateLevel = n + 1; return true; };
  S.togglePirate = p => { if (!p.pirate) return false; p.usePirate = !p.usePirate; return true; };
  S.buySpecialLevel = p => { const nx = S.specialNext(p); if (!nx || (p.level || 1) < nx.minLevel || p.gold < nx.price) return false; p.gold -= nx.price; p.specialLevel = (p.specialLevel || 1) + 1; return true; };
  S.setAlly = (p, id) => { if (!p.allyBought || id === p.id || !CB.playerById(id)) return false; p.ally = id; return true; };
  // Le dernier tableau joué ou le prochain à faire : premier tableau non terminé.
  S.nextWave = p => { for (let wi = 0; wi < CB.WORLDS.length; wi++) for (let vi = 0; vi < CB.WAVES_PER_WORLD; vi++) if (S.waveUnlocked(p, wi, vi) && !S.stars(p, CB.WORLDS[wi].id, vi)) return { wi, vi }; return { wi: CB.WORLDS.length - 1, vi: CB.WAVES_PER_WORLD - 1 }; };
  // Achats
  S.buyItem = (p, key) => { const it = CB.ITEMS[key]; p.items ||= {}; if (!it || p.items[key] || p.gold < it.price || !S.itemUnlocked(p, key)) return false; p.gold -= it.price; p.items[key] = true; return true; };
  S.buyUpgrade = (p, key) => { const lvl = p.upgrades[key] || 0; if (lvl >= CB.UPGRADES[key].max) return false; const cost = CB.upgradeCost(key, lvl); if (p.gold < cost) return false; p.gold -= cost; p.upgrades[key] = lvl + 1; return true; };
  S.buyEffect = (p, key) => { const lvl = p.effects[key] || 0; if (lvl >= CB.EFFECTS[key].max) return false; const cost = CB.effectCost(key, lvl); if (p.gold < cost) return false; p.gold -= cost; p.effects[key] = lvl + 1; return true; };
  S.buyCannon = (p, key) => { const c = CB.CANNONS[key]; if (!c || p.cannons.includes(key) || !S.cannonUnlocked(p, key) || p.gold < c.price) return false; p.gold -= c.price; p.cannons.push(key); p.cannon = key; return true; };
  S.buyBall = (p, key) => { const b = CB.BALLS[key]; if (!b || p.balls.includes(key) || p.gold < b.price) return false; p.gold -= b.price; p.balls.push(key); p.ball = key; return true; };
})(window.CB);
