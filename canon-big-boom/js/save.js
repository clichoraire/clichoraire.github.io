// Sauvegarde : un profil par membre de la famille (or, niveau, canons, boulets, améliorations, progrès des mondes).
(function (CB) {
  'use strict';
  const KEY = 'cb.save';
  const S = CB.Save = { KEY };
  S.blank = id => ({ id, gold: 0, xp: 0, level: 1, cannon: 'classique', cannons: ['classique'], ball: 'fer', balls: ['fer'], upgrades: {}, effects: {}, talents: {}, points: 0, ally: null, allyBought: false, discovered: 0, shown: 0, bestTime: 0, nightKills: 0, portal: false, portalShown: false, seenBy: {}, killsBy: {}, progress: {}, kills: 0, plays: 0, wins: 0, bestCombo: 0 });
  S.fresh = () => ({ current: null, profiles: {}, settings: { sound: true, music: true, aim: 'auto' } });
  S.load = storage => {
    const data = S.fresh();
    try { const raw = JSON.parse(storage.getItem(KEY) || 'null'); if (raw && typeof raw === 'object') { Object.assign(data, raw); data.settings = Object.assign(S.fresh().settings, raw.settings || {}); data.profiles = raw.profiles || {}; } } catch (e) { }
    for (const [id, p] of Object.entries(data.profiles)) { const old = p && p.talents === undefined, q = Object.assign(S.blank(id), p); if (old) q.points = Math.max(0, (q.level || 1) - 1); for (const k of ['gold', 'xp', 'kills', 'points', 'discovered', 'shown', 'bestTime', 'nightKills']) if (!Number.isFinite(q[k])) q[k] = 0;
      /* l'ancien achat « tir automatique » est remboursé : on tire toujours en continu */ if (q.upgrades && q.upgrades.auto) { delete q.upgrades.auto; q.gold += 60; } data.profiles[id] = q; }
    return data;
  };
  S.store = (data, storage) => { try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } };
  S.profile = (data, id) => (data.profiles[id] ||= S.blank(id));
  S.stars = (p, worldId, vi) => (p.progress[worldId] || [])[vi] || 0;
  S.worldStars = (p, worldId) => (p.progress[worldId] || []).reduce((a, b) => a + (b || 0), 0);
  // Tableaux réussis (une étoile ou plus) sur le chemin principal d'un monde (le tableau secret ne compte pas).
  S.worldCleared = (p, wi) => { const w = CB.WORLDS[wi]; return w ? (p.progress[w.id] || []).slice(0, CB.WAVES_PER_WORLD).filter(Boolean).length : 0; };
  S.worldDone = (p, wi) => !!CB.WORLDS[wi] && S.worldCleared(p, wi) >= CB.WORLD_NEED;   // assez de tableaux réussis pour ouvrir le monde suivant
  S.worldUnlocked = (p, wi) => wi === 0 || S.worldDone(p, wi - 1);
  // Monde 1 : le tableau 2 se révèle après unlockKills monstres abattus dans la nuit sans fin (secret), les tableaux 3 à 5 par les coffres
  // mystères, et le tableau secret 6 (la Vallée des dinosaures) par le portail du coffre doré. Ailleurs, il faut une étoile au tableau précédent.
  S.revealed = p => ((p.nightKills || 0) >= CB.ENDLESS.unlockKills ? 1 : 0) + Math.min(CB.ENDLESS.maxDiscoveries, p.discovered || 0);
  S.waveUnlocked = (p, wi, vi) => S.worldUnlocked(p, wi) && (vi === 0 || (wi === 0 ? (vi === 5 ? !!p.portal : vi <= S.revealed(p)) : S.stars(p, CB.WORLDS[wi].id, vi - 1) > 0));
  S.cannonUnlocked = (p, key) => { const c = CB.CANNONS[key]; return !c.world || S.stars(p, c.world, CB.WAVES_PER_WORLD - 1) > 0; }; // le canon d'un monde : battre son boss
  S.completion = p => { let done = 0, total = CB.WORLDS.length * CB.WAVES_PER_WORLD; for (let wi = 0; wi < CB.WORLDS.length; wi++) done += S.worldCleared(p, wi); return Math.round(100 * done / total); };
  S.totalStars = p => CB.WORLDS.reduce((a, w) => a + S.worldStars(p, w.id), 0);
  // Ajoute de l'expérience et monte de niveau au besoin. Retourne le nombre de niveaux gagnés.
  S.addXp = (p, xp) => { p.xp += Math.round(xp); let gained = 0; while (p.level < CB.MAX_LEVEL && p.xp >= CB.xpForLevel(p.level)) { p.xp -= CB.xpForLevel(p.level); p.level++; gained++; } p.points = (p.points || 0) + gained; return gained; };
  S.spendPoint = (p, key) => { if (!CB.TALENTS[key] || !(p.points > 0) || (p.talents?.[key] || 0) >= CB.TALENT_MAX) return false; p.talents ||= {}; p.talents[key] = (p.talents[key] || 0) + 1; p.points--; return true; };
  S.buyAlly = p => { if (p.allyBought || p.gold < CB.HELPER.price) return false; p.gold -= CB.HELPER.price; p.allyBought = true; if (!p.ally || p.ally === p.id) p.ally = (CB.PLAYERS.find(m => m.id !== p.id) || {}).id || null; return true; };
  S.setAlly = (p, id) => { if (!p.allyBought || id === p.id || !CB.playerById(id)) return false; p.ally = id; return true; };
  // Le dernier tableau joué ou le prochain à faire : premier tableau non terminé.
  S.nextWave = p => { for (let wi = 0; wi < CB.WORLDS.length; wi++) for (let vi = 0; vi < CB.WAVES_PER_WORLD; vi++) if (S.waveUnlocked(p, wi, vi) && !S.stars(p, CB.WORLDS[wi].id, vi)) return { wi, vi }; return { wi: CB.WORLDS.length - 1, vi: CB.WAVES_PER_WORLD - 1 }; };
  // Achats
  S.buyUpgrade = (p, key) => { const lvl = p.upgrades[key] || 0; if (lvl >= CB.UPGRADES[key].max) return false; const cost = CB.upgradeCost(key, lvl); if (p.gold < cost) return false; p.gold -= cost; p.upgrades[key] = lvl + 1; return true; };
  S.buyEffect = (p, key) => { const lvl = p.effects[key] || 0; if (lvl >= CB.EFFECTS[key].max) return false; const cost = CB.effectCost(key, lvl); if (p.gold < cost) return false; p.gold -= cost; p.effects[key] = lvl + 1; return true; };
  S.buyCannon = (p, key) => { const c = CB.CANNONS[key]; if (!c || p.cannons.includes(key) || !S.cannonUnlocked(p, key) || p.gold < c.price) return false; p.gold -= c.price; p.cannons.push(key); p.cannon = key; return true; };
  S.buyBall = (p, key) => { const b = CB.BALLS[key]; if (!b || p.balls.includes(key) || p.gold < b.price) return false; p.gold -= b.price; p.balls.push(key); p.ball = key; return true; };
})(window.CB);
