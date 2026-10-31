// Sauvegarde : un profil par membre de la famille (or, niveau, canons, boulets, améliorations, progrès des mondes).
(function (CB) {
  'use strict';
  const KEY = 'cb.save';
  const S = CB.Save = { KEY };
  S.blank = id => ({ id, gold: 0, xp: 0, level: 1, cannon: 'classique', cannons: ['classique'], ball: 'fer', balls: ['fer'], upgrades: {}, cannonUpgrades: {}, effects: {}, talents: {}, points: 0, ally: null, allyBought: false, ally2: null, ally2Bought: false, items: {}, towers: 0, homing: 0, specialLevel: 1, slot2: false, special2: null, discovered: 0, shown: 0, bestTime: 0, nightKills: 0, portal: false, portalShown: false, targetsHit: 0, targetsShown: false, brigandsShown: false, boatShown: false, boatSecret: false, pirate: false, pirateLevel: 1, usePirate: false, hiddenWorlds: {}, hiddenShown: {}, portals: {}, portalsShown: {}, powers: {}, usePower: null, seenBy: {}, killsBy: {}, progress: {}, kills: 0, plays: 0, wins: 0, bestCombo: 0 });
  S.fresh = () => ({ current: null, profiles: {}, settings: { sound: true, music: true, soundVolume: 100, musicVolume: 55, aim: 'auto', fx: 'auto' } });
  S.load = storage => {
    const data = S.fresh();
    try { const raw = JSON.parse(storage.getItem(KEY) || 'null'); if (raw && typeof raw === 'object') { Object.assign(data, raw); data.settings = Object.assign(S.fresh().settings, raw.settings || {}); data.profiles = raw.profiles || {}; } } catch (e) { }
    for (const [id, p] of Object.entries(data.profiles)) { const old = p && p.talents === undefined, q = Object.assign(S.blank(id), p); if (old) q.points = Math.max(0, (q.level || 1) - 1); if (!(q.specialLevel >= 1)) q.specialLevel = 1; if (!(q.towers >= 0)) q.towers = 0; if (q.upgrades && q.upgrades.auto) { delete q.upgrades.auto; q.gold += 60; } if (!q.cannonUpgrades || typeof q.cannonUpgrades !== 'object') q.cannonUpgrades = {}; if (q.upgrades && Object.keys(q.upgrades).length) { const cu = q.cannonUpgrades[q.cannon || 'classique'] ||= { uniques: {} }; for (const [k0, v] of Object.entries(q.upgrades)) { const k = k0 === 'vie' ? 'armure' : k0; if (CB.UPGRADES[k]) cu[k] = Math.max(cu[k] || 0, v); } } for (const cu of Object.values(q.cannonUpgrades)) { if (!cu.uniques || typeof cu.uniques !== 'object') cu.uniques = {}; if (cu.vie) { cu.armure = Math.max(cu.armure || 0, cu.vie); delete cu.vie; } }   /* l'ancienne amélioration « vie » du canon devient l'armure */ q.upgrades = {};   /* les niveaux d'amélioration appartiennent au canon : l'ancien profil les garde sur le canon équipé */ for (const k of ['hiddenWorlds', 'hiddenShown', 'portals', 'portalsShown', 'powers']) if (!q[k] || typeof q[k] !== 'object') q[k] = {}; if (q.usePirate && !q.usePower) q.usePower = 'pirate'; for (const k of ['gold', 'xp', 'kills', 'points', 'discovered', 'shown', 'bestTime', 'nightKills', 'targetsHit']) if (!Number.isFinite(q[k])) q[k] = 0;
      /* l'ancien achat « tir automatique » est remboursé : on tire toujours en continu */ if (q.upgrades && q.upgrades.auto) { delete q.upgrades.auto; q.gold += 60; } { const mig = b => CB.BALL_MIGRATE[b] || b; q.ball = mig(q.ball || 'fer'); q.balls = [...new Set((Array.isArray(q.balls) ? q.balls : ['fer']).map(mig))]; if (!q.balls.includes('fer')) q.balls.unshift('fer'); } data.profiles[id] = q; }
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
  // Mondes cachés : ouverts en réussissant le tableau secret du monde parent (1-9 pour les pirates, N-6 pour les autres) ; pirates garde profile.pirateWorld
  S.hiddenOpen = (p, id) => id === 'pirates' ? !!p.pirateWorld : !!(p.hiddenWorlds || {})[id];
  S.openHidden = (p, id) => { if (id === 'pirates') p.pirateWorld = true; else (p.hiddenWorlds ||= {})[id] = true; return p; };
  S.hiddenShown = (p, id) => id === 'pirates' ? !!p.pirateShown : !!(p.hiddenShown || {})[id];   // la passerelle a déjà été tracée sur la carte
  S.markHiddenShown = (p, id) => { if (id === 'pirates') p.pirateShown = true; else (p.hiddenShown ||= {})[id] = true; return p; };
  // Portails : le coffre doré d'un monde révèle son tableau secret (foret garde profile.portal / portalShown)
  S.portalFound = (p, wid) => wid === 'foret' ? !!p.portal : !!(p.portals || {})[wid];
  S.setPortal = (p, wid) => { if (wid === 'foret') p.portal = true; else (p.portals ||= {})[wid] = true; return p; };
  S.portalShown = (p, wid) => wid === 'foret' ? !!p.portalShown : !!(p.portalsShown || {})[wid];
  S.markPortalShown = (p, wid) => { if (wid === 'foret') p.portalShown = true; else (p.portalsShown ||= {})[wid] = true; return p; };
  S.worldUnlocked = (p, wi) => { const w = CB.WORLDS[wi]; if (w && w.hidden) return S.hiddenOpen(p, w.id); return wi === 0 || S.worldDone(p, wi - 1); };
  // Monde 1 : le tableau 2 se révèle après unlockKills monstres abattus dans la nuit sans fin (secret), les tableaux 3 à 5 par les coffres
  // mystères, et le tableau secret 6 (la Vallée des dinosaures) par le portail du coffre doré. Ailleurs, il faut une étoile au tableau précédent.
  // Monde 1 : combien de tableaux du chemin principal sont révélés, dans l'ordre : 100 monstres → le 2 ; une étoile au 2 → le 3 ;
  // puis les coffres mystères (maxDiscoveries) → le 4 et le 5.
  S.revealed = p => { let n = (p.nightKills || 0) >= CB.ENDLESS.unlockKills ? 1 : 0; for (let vi = 1; vi <= 3 && n === vi; vi++) if (S.stars(p, 'foret', vi) > 0) n = vi + 1; return n; };   // 100 abattus → 2 ; puis chaque étoile ouvre le suivant (3, 4, 5) ; les coffres ne révèlent plus rien
  S.waveUnlocked = (p, wi, vi) => { const w = CB.WORLDS[wi]; if (!w || !S.worldUnlocked(p, wi)) return false; if (vi === 0) return true; if (wi === 0) return vi === 5 ? !!p.portal : vi === 6 ? (p.targetsHit || 0) >= 3 : vi === 7 ? S.stars(p, 'foret', 3) > 0 : vi === 8 ? !!p.boatSecret : vi <= S.revealed(p); if (w.secret && vi === w.secret.vi) return S.portalFound(p, w.id); return S.stars(p, w.id, vi - 1) > 0; };   // tableau secret N-6 : le portail du coffre doré (tableau N-3)
  // Triche de Matthieu : tout débloquer d'un coup (secrets du monde 1, portail, mini-jeu, une étoile sur chaque tableau de chaque monde).
  S.cheatUnlock = p => { p.nightKills = Math.max(p.nightKills || 0, CB.ENDLESS.unlockKills); p.discovered = CB.ENDLESS.maxDiscoveries; p.shown = CB.WAVES_PER_WORLD - 1; p.portal = true; p.portalShown = true; p.targetsHit = 3; p.targetsShown = true; p.brigandsShown = true; p.boatShown = true; p.boatSecret = true; p.pirate = true; p.pirateWorld = true; p.pirateShown = true; for (const w of CB.WORLDS) { if (w.hidden) { S.openHidden(p, w.id); S.markHiddenShown(p, w.id); } if (w.secret) { S.setPortal(p, w.id); S.markPortalShown(p, w.id); } } for (const id of Object.keys(CB.POWERS)) S.grantPower(p, id);
    for (const w of CB.WORLDS) { const arr = p.progress[w.id] ||= []; for (let vi = 0; vi < CB.WAVES_PER_WORLD; vi++) arr[vi] = Math.max(arr[vi] || 0, 1); } return p; };
  S.cannonUnlocked = (p, key) => { const c = CB.CANNONS[key]; return !c.world || S.stars(p, c.world, CB.WAVES_PER_WORLD - 1) > 0; }; // le canon d'un monde : battre son boss
  S.completion = p => { let done = 0, total = 0; for (let wi = 0; wi < CB.WORLDS.length; wi++) { if (CB.WORLDS[wi].hidden) continue; total += CB.WAVES_PER_WORLD; done += S.worldCleared(p, wi); } return Math.round(100 * done / total); };   // le monde caché ne compte pas dans le %
  S.totalStars = p => CB.WORLDS.reduce((a, w) => a + S.worldStars(p, w.id), 0);
  // Ajoute de l'expérience et monte de niveau au besoin. Retourne le nombre de niveaux gagnés.
  S.addXp = (p, xp) => { p.xp += Math.round(xp); let gained = 0; while (p.level < CB.MAX_LEVEL && p.xp >= CB.xpForLevel(p.level)) { p.xp -= CB.xpForLevel(p.level); p.level++; gained++; } p.points = (p.points || 0) + gained; return gained; };
  S.spendPoint = (p, key) => { if (!CB.TALENTS[key] || !(p.points > 0) || (p.talents?.[key] || 0) >= CB.TALENT_MAX) return false; p.talents ||= {}; p.talents[key] = (p.talents[key] || 0) + 1; p.points--; return true; };
  S.buyAlly = p => { if (p.allyBought || p.gold < CB.HELPER.price) return false; p.gold -= CB.HELPER.price; p.allyBought = true; if (!p.ally || p.ally === p.id) p.ally = (CB.PLAYERS.find(m => m.id !== p.id) || {}).id || null; return true; };
  S.buyAlly2 = p => { if (!p.allyBought || p.ally2Bought || p.gold < CB.HELPER.price2) return false; p.gold -= CB.HELPER.price2; p.ally2Bought = true; if (!p.ally2 || p.ally2 === p.id || p.ally2 === p.ally) p.ally2 = (CB.PLAYERS.find(m => m.id !== p.id && m.id !== p.ally) || {}).id || null; return true; };
  S.setAlly3 = (p, id) => { if (!p.ally2Bought || !(p.items && p.items.trio) || id === p.id || id === p.ally || id === p.ally2 || !CB.playerById(id)) return false; p.ally3 = id; return true; };   // la réserve (objet « Trio de choc »)
  // Cheat : tous les canons, boulets, effets au max, objets, tours, tête chercheuse, deuxième case, coéquipiers, niveau 3 du pouvoir, tous les pouvoirs uniques
  S.cheatItems = p => { p.items ||= {}; for (const k of Object.keys(CB.ITEMS)) p.items[k] = true; p.cannons = Object.keys(CB.CANNONS); p.balls = Object.keys(CB.BALLS); p.effects ||= {}; for (const k of Object.keys(CB.EFFECTS)) p.effects[k] = CB.EFFECTS[k].max; p.towers = CB.TOWER.max; p.homing = CB.HOMING.max; p.slot2 = true; p.specialLevel = CB.SPECIAL_LEVELS.length; for (const k of Object.keys(CB.CANNONS)) { const cu = S.cannonUp(p, k); for (const u of Object.keys(CB.UPGRADES)) cu[u] = CB.UPGRADES[u].max; for (const x of CB.CANNON_UNIQUES[k] || []) cu.uniques[x.id] = x.max; }
    p.allyBought = true; p.ally2Bought = true; const free = CB.PLAYERS.map(m => m.id).filter(id => id !== p.id); if (!p.ally || p.ally === p.id) p.ally = free[0]; if (!p.ally2 || p.ally2 === p.id || p.ally2 === p.ally) p.ally2 = free.find(id => id !== p.ally); if (!p.ally3 || [p.id, p.ally, p.ally2].includes(p.ally3)) p.ally3 = free.find(id => id !== p.ally && id !== p.ally2);
    for (const id of Object.keys(CB.POWERS)) S.grantPower(p, id); return p; };
  S.cheatGod = (p, on) => { p.cheats ||= {}; p.cheats.god = on == null ? !p.cheats.god : !!on; return p.cheats.god; };
  S.setAlly2 = (p, id) => { if (!p.ally2Bought || id === p.id || id === p.ally || !CB.playerById(id)) return false; p.ally2 = id; return true; };
  // Pouvoirs débloqués en avançant : la sphère après le monde 1, les tours après le monde 2.
  S.itemUnlocked = (p, key) => { const it = CB.ITEMS[key]; return !!it && (it.unlockWorld == null || S.worldDone(p, it.unlockWorld)); };
  S.towersUnlocked = p => S.worldDone(p, CB.TOWER.unlockWorld);
  S.buySlot2 = p => { if (p.slot2 || p.gold < CB.SLOT2.price) return false; p.gold -= CB.SLOT2.price; p.slot2 = true; return true; };
  // Le pouvoir d'un autre membre se débloque en jouant avec lui et en terminant le monde 1 (data = toute la sauvegarde ; sans data, pas de condition)
  S.powerUnlockedBy = (data, id) => { const q = data && data.profiles && data.profiles[id]; return !!q && S.worldDone(q, 0); };
  S.buyPower2 = (p, id, data) => { if (!p.slot2 || !CB.SPECIALS[id] || !CB.playerById(id) || id === p.id || p.special2 === id || p.gold < CB.SLOT2.powerPrice || (data && !S.powerUnlockedBy(data, id))) return false; p.gold -= CB.SLOT2.powerPrice; p.special2 = id; return true; };   // remplace le pouvoir précédent de la case
  S.homingUnlocked = p => S.worldDone(p, CB.HOMING.unlockWorld);
  S.buyHoming = p => { const n = p.homing || 0; if (!S.homingUnlocked(p) || n >= CB.HOMING.max || p.gold < CB.HOMING.prices[n]) return false; p.gold -= CB.HOMING.prices[n]; p.homing = n + 1; return true; };
  S.buyTower = p => { const n = p.towers || 0; if (!S.towersUnlocked(p) || n >= CB.TOWER.max || p.gold < CB.TOWER.prices[n]) return false; p.gold -= CB.TOWER.prices[n]; p.towers = n + 1; return true; };
  // Niveau de l'attaque spéciale : niv. 2 dès le niveau 9 du personnage, niv. 3 dès le niveau 20.
  S.specialNext = p => CB.SPECIAL_LEVELS[(p.specialLevel || 1)] || null;
  // Pouvoirs uniques (CB.POWERS) : pirate garde ses champs (pirate, pirateLevel, usePirate), les autres vivent dans profile.powers[id] = { level }
  S.powerOwned = (p, id) => id === 'pirate' ? !!p.pirate : !!(p.powers || {})[id];
  S.powerLevel = (p, id) => Math.max(1, id === 'pirate' ? (p.pirateLevel || 1) : (((p.powers || {})[id] || {}).level || 1));
  S.grantPower = (p, id) => { if (!CB.POWERS[id]) return false; if (id === 'pirate') p.pirate = true; else { p.powers ||= {}; p.powers[id] ||= { level: 1 }; } return true; };
  S.usedPower = p => { const id = p.usePower || (p.usePirate ? 'pirate' : null); return id && S.powerOwned(p, id) ? id : null; };   // le pouvoir unique choisi au hangar à la place du sien
  S.togglePower = (p, id) => { if (!S.powerOwned(p, id)) return false; p.usePower = S.usedPower(p) === id ? null : id; p.usePirate = p.usePower === 'pirate'; return true; };
  S.buyPowerLevel = (p, id) => { const P = CB.POWERS[id], n = S.powerLevel(p, id); if (!P || !S.powerOwned(p, id) || n >= P.max || p.gold < P.prices[n]) return false; p.gold -= P.prices[n]; if (id === 'pirate') p.pirateLevel = n + 1; else p.powers[id].level = n + 1; return true; };
  S.buyPirateLevel = p => S.buyPowerLevel(p, 'pirate');
  S.togglePirate = p => S.togglePower(p, 'pirate');
  S.buySpecialLevel = p => { const nx = S.specialNext(p); if (!nx || (p.level || 1) < nx.minLevel || p.gold < nx.price) return false; p.gold -= nx.price; p.specialLevel = (p.specialLevel || 1) + 1; return true; };
  S.setAlly = (p, id) => { if (!p.allyBought || id === p.id || !CB.playerById(id)) return false; p.ally = id; return true; };
  // Sièges de l'équipe (onglet Équipe) : 1 = gauche (ally), 2 = droite (ally2), 3 = réserve (ally3, objet « Trio de choc »). On achète le siège, puis on choisit qui s'y assoit.
  S.seatOpen = (p, n) => n === 1 ? !!p.allyBought : n === 2 ? !!p.ally2Bought : n === 3 ? !!(p.ally2Bought && p.items && p.items.trio) : false;
  S.seatOf = (p, n) => (S.seatOpen(p, n) && CB.playerById(n === 1 ? p.ally : n === 2 ? p.ally2 : p.ally3) && (n === 1 ? p.ally : n === 2 ? p.ally2 : p.ally3) !== p.id) ? (n === 1 ? p.ally : n === 2 ? p.ally2 : p.ally3) : null;
  S.seats = p => [1, 2, 3].filter(n => S.seatOpen(p, n)).length;
  S.nextSeat = p => S.seats(p) >= 3 ? null : { n: S.seats(p) + 1, price: CB.SEATS[S.seats(p)].price, name: CB.SEATS[S.seats(p)].name };   // le prochain siège à acheter (gauche, droite, puis réserve)
  S.buySeat = p => { const nx = S.nextSeat(p); if (!nx || p.gold < nx.price) return false; p.gold -= nx.price; if (nx.n === 1) { p.allyBought = true; p.ally = null; } else if (nx.n === 2) { p.ally2Bought = true; p.ally2 = null; } else { p.items ||= {}; p.items.trio = true; p.ally3 = null; } return true; };   // le siège reste vide tant qu'on n'a choisi personne
  S.setSeat = (p, n, id) => { if (!S.seatOpen(p, n) || id === p.id || !CB.playerById(id)) return false; const cur = S.seatOf(p, n); for (const k of [1, 2, 3]) if (k !== n && S.seatOf(p, k) === id) { if (k === 1) p.ally = cur; else if (k === 2) p.ally2 = cur; else p.ally3 = cur; }   // il était sur un autre siège : les deux s'échangent
    if (n === 1) p.ally = id; else if (n === 2) p.ally2 = id; else p.ally3 = id; return true; };
  S.clearSeat = (p, n) => { if (!S.seatOpen(p, n)) return false; if (n === 1) p.ally = null; else if (n === 2) p.ally2 = null; else p.ally3 = null; return true; };
  // Le dernier tableau joué ou le prochain à faire : premier tableau non terminé.
  S.nextWave = p => { for (let wi = 0; wi < CB.WORLDS.length; wi++) for (let vi = 0; vi < CB.WAVES_PER_WORLD; vi++) if (S.waveUnlocked(p, wi, vi) && !S.stars(p, CB.WORLDS[wi].id, vi)) return { wi, vi }; return { wi: CB.WORLDS.length - 1, vi: CB.WAVES_PER_WORLD - 1 }; };
  // Achats
  S.buyItem = (p, key) => { const it = CB.ITEMS[key]; p.items ||= {}; if (!it || p.items[key] || p.gold < it.price || !S.itemUnlocked(p, key)) return false; p.gold -= it.price; p.items[key] = true; return true; };
  // Améliorations du canon équipé (chaque canon a ses propres niveaux et son palier de prix / de force) et ses spécialités.
  S.cannonUp = (p, key) => { key = key || p.cannon || 'classique'; p.cannonUpgrades ||= {}; const cu = p.cannonUpgrades[key] ||= { uniques: {} }; cu.uniques ||= {}; return cu; };
  S.upgradeLevel = (p, key, cannon) => S.cannonUp(p, cannon)[key] || 0;
  S.uniqueLevel = (p, id, cannon) => S.cannonUp(p, cannon).uniques[id] || 0;
  S.buyUpgrade = (p, key, cannon) => { cannon = cannon || p.cannon || 'classique'; if (!CB.UPGRADES[key] || !p.cannons.includes(cannon)) return false; const cu = S.cannonUp(p, cannon), lvl = cu[key] || 0; if (lvl >= CB.UPGRADES[key].max) return false; const cost = CB.upgradeCost(key, lvl, cannon); if (p.gold < cost) return false; p.gold -= cost; cu[key] = lvl + 1; return true; };   // on peut améliorer un canon acheté sans l'avoir équipé
  S.buyUnique = (p, id, cannon) => { cannon = cannon || p.cannon || 'classique'; const u = CB.uniqueDef(cannon, id); if (!u || !p.cannons.includes(cannon)) return false; const cu = S.cannonUp(p, cannon), lvl = cu.uniques[id] || 0; if (lvl >= u.max) return false; const cost = u.prices[lvl]; if (p.gold < cost) return false; p.gold -= cost; cu.uniques[id] = lvl + 1; return true; };
  S.buyEffect = (p, key) => { const lvl = p.effects[key] || 0; if (lvl >= CB.EFFECTS[key].max) return false; const cost = CB.effectCost(key, lvl); if (p.gold < cost) return false; p.gold -= cost; p.effects[key] = lvl + 1; return true; };
  S.buyCannon = (p, key) => { const c = CB.CANNONS[key]; if (!c || p.cannons.includes(key) || !S.cannonUnlocked(p, key) || p.gold < c.price) return false; p.gold -= c.price; p.cannons.push(key); p.cannon = key; return true; };
  S.buyBall = (p, key) => { const b = CB.BALLS[key]; if (!b || p.balls.includes(key) || p.gold < b.price) return false; p.gold -= b.price; p.balls.push(key); p.ball = key; return true; };
})(window.CB);
