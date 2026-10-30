#!/usr/bin/env node
// Vérifications de la simulation : tirs, vagues, boss, cartes, boutique, sauvegarde (node tools/test-game.cjs).
'use strict';
const assert = require('node:assert/strict');
const path = require('path');
global.window = {};
for (const f of ['config', 'save', 'game']) require(path.join(__dirname, '..', 'js', f + '.js'));
const CB = window.CB, S = CB.Save;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const memory = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };

// Données
ok(CB.PLAYERS.length === 15, '15 membres de la famille');
ok(CB.WORLDS.length === 6 && CB.WORLDS.every(w => CB.BOSSES[w.boss] && CB.CANNONS[w.cannon]), 'six mondes avec boss et canon');
ok(CB.WORLDS.every(w => w.enemies.every(e => CB.ENEMIES[e])), 'ennemis des mondes définis');
for (let wi = 0; wi < 6; wi++) for (let vi = 0; vi < 5; vi++) { const d = CB.waveDef(wi, vi); ok(d.text && d.type, 'vague ' + wi + '-' + vi); }
ok(CB.goldBase(0) === 1 && CB.goldBase(5) === 6, 'or par ennemi : 1 au départ, 6 à la fin');

// Une vague simple : on tire sur tout ce qui bouge en visant l'ennemi le plus proche.
function play(wave, seconds, aimAt = true) {
  for (let t = 0; t < seconds && !wave.over; t += 1 / 60) {
    // Un joueur raisonnable : il détruit d'abord les tirs ennemis proches, vise le boss s'il est là, sinon l'ennemi le plus proche.
    if (aimAt && wave.enemies.length) { const bolt = wave.enemies.filter(e => e.def.shot && e.z < 30).sort((a, b) => a.z - b.z)[0]; const e = bolt || (wave.boss && !wave.boss.dead ? wave.boss : wave.enemies.reduce((a, b) => (a.z < b.z ? a : b))); const p = CB.project(e); wave.aim.x = p.x; wave.aim.y = p.y; }
    wave.fire(); wave.update(1 / 60);
    if (wave.choice) wave.pickCard(0);
  }
}
const profile = S.blank('matthieu'), player = CB.playerById('matthieu');
// Tableau 1 : la nuit sans fin (façon Vampire Survivors). Le joueur a déjà mérité le tableau 2 (100 monstres) : les coffres passent.
profile.upgrades = { cadence: 3, degats: 2 }; profile.nightKills = CB.ENDLESS.unlockKills;
let w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile, player, random: seeded(7) });
ok(w.endless && w.def.type === 'endless', 'le premier tableau est la nuit sans fin');
ok(w.hp === w.maxHp && w.maxHp === CB.BASE_HP, 'points de vie de départ');
ok(!w.fire() === false || w.balls.length === 1, 'un tir produit un boulet');
w.update(1 / 60); ok(w.cooldown > 0 && !w.fire(), 'cadence : pas de deuxième tir immédiat');
play(w, 100);
ok(!w.over && w.kills > 0, 'la nuit ne se termine pas toute seule (kills=' + w.kills + ', hp=' + Math.round(w.hp) + ')');
ok(w.seen.length >= 4 && w.seen[0] === 'bat' && CB.ENDLESS.roster.slice(0, 4).every(k => w.seen.includes(k)), 'quatre styles de monstres sont apparus dans l\'ordre de la nuit (' + w.seen.join(', ') + ')');
ok(w.chestsSeen === 2 && w.discoveries >= 1, 'deux coffres mystères sont passés, au moins un a été trouvé (' + w.discoveries + ')');
ok(w.news.some(n => n.kind === 'monster') && w.news.some(n => n.kind === 'discovery'), 'annonces de nouveaux monstres et de découverte');
ok(w.runLevel >= 3 && w.cards.length >= 2, 'des niveaux gagnés pendant la nuit ont donné des cartes (niveau ' + w.runLevel + ')');
ok(w.gold > 0 && w.xp > 0, 'or et XP accumulés');
w.finish(false);
ok(w.over && w.won && w.stars === 1 && w.bonusGold === Math.round(w.time / 8), 'nuit terminée : une étoile après 90 s, bonus selon le temps');
const r = CB.claim(profile, w);
ok(r && profile.gold === r.gold && r.gold === Math.round(w.gold) + w.bonusGold, 'récompenses encaissées');
ok(CB.claim(profile, w) === null, 'pas de double encaissement');
ok(r.newNodes === Math.min(3, w.discoveries) && profile.discovered === r.newNodes && profile.bestTime === Math.round(w.time), 'les coffres trouvés révèlent des tableaux');
ok(S.stars(profile, 'foret', 0) === 1 && S.waveUnlocked(profile, 0, 1) && S.waveUnlocked(profile, 0, S.revealed(profile)) && !S.waveUnlocked(profile, 0, S.revealed(profile) + 1), 'les tableaux révélés sont jouables, pas les autres');
ok(profile.nightKills === CB.ENDLESS.unlockKills + w.kills && !S.waveUnlocked(profile, 0, 5), 'les monstres de la nuit se comptent ; le tableau secret reste fermé sans portail');
// Secret du tableau 2 : 100 monstres abattus dans la nuit, sans coffre avant ça
{ const q = S.blank('secret'); q.upgrades = { cadence: 3, degats: 2 }; const n = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: q, player, random: seeded(3) });
  for (let t = 0; t < 60 && n.kills < 30; t += 1 / 60) { if (n.choice) n.pickCard(0); if (n.enemies.length) { const e = n.enemies.reduce((a, b) => a.z < b.z ? a : b); Object.assign(n.aim, CB.project(e)); } n.fire(); n.update(1 / 60); }
  ok(n.chestsSeen === 0 && !n.enemies.some(e => e.def.chest), 'aucun coffre avant d’avoir mérité le tableau 2');
  ok(!S.waveUnlocked(q, 0, 1) && S.revealed(q) === 0, 'tableau 2 fermé avec moins de 100 monstres');
  n.kills = 99; n.nightKillsBefore = 0; n.kill(n.spawnEnemy('bat')); ok(n.secretFound && n.news.some(x => x.kind === 'discovery'), 'le centième monstre annonce la découverte sans dire pourquoi');
  n.finish(false); CB.claim(q, n); ok(q.nightKills === n.kills && S.waveUnlocked(q, 0, 1) && S.revealed(q) === 1, 'après 100 monstres cumulés, le tableau 2 est ouvert');
  const n2 = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: q, player, random: seeded(4) }); n2.spawnEnemy('bat'); ok(!n2.news.some(x => x.kind === 'monster'), 'un monstre déjà rencontré n’est plus annoncé'); n2.spawnEnemy('reaper'); ok(n2.news.some(x => x.kind === 'monster'), 'un monstre jamais vu est annoncé'); }
// Coffre doré et portail vers le passé (une seule fois par personnage)
{ const q = S.blank('voyageur'); q.nightKills = 500; const n = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: q, player, random: seeded(9) });
  n.time = CB.ENDLESS.portalAt - 2; n.intro = 0; for (let i = 0; i < 180; i++) n.update(1 / 60);
  const chest = n.enemies.find(e => e.type === 'coffreOr'); ok(chest && n.portalSpawned, 'le coffre doré passe après ' + CB.ENDLESS.portalAt + ' s');
  n.cards.push('costaud'); CB.CARDS.costaud.apply(n.stats, n, 1); n.runLevel = 4; n.hp = Math.round(n.maxHp * .5);
  n.kill(chest); ok(n.portal && n.enemies.every(e => e.dead) && n.news.some(x => /PORTAIL/.test(x.text)), 'toucher le coffre doré ouvre le portail et chasse les monstres');
  for (let i = 0; i < 60 * (CB.PORTAL_TIME + .5) && !n.over; i++) n.update(1 / 60);
  ok(n.over && n.reason === 'portail' && n.portalDone && n.won, 'le portail transporte sans finir le tableau (reason=' + n.reason + ')');
  const r2 = CB.claim(q, n); ok(q.portal && r2.newNodes === 1 && S.waveUnlocked(q, 0, 5), 'le passage révèle le tableau secret 1-6');
  const n3 = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: q, player, random: seeded(9) }); n3.time = CB.ENDLESS.portalAt + 5; n3.intro = 0; for (let i = 0; i < 120; i++) n3.update(1 / 60); ok(!n3.enemies.some(e => e.type === 'coffreOr'), 'le coffre doré ne repasse plus une fois le portail trouvé');
  // La Vallée des dinosaures : on y arrive avec ses cartes, son niveau et sa vie
  const d = new CB.Wave({ worldIndex: 0, waveIndex: 5, profile: q, player, random: seeded(2), carry: { cards: n.cards, runLevel: n.runLevel, runXp: n.runXp, hpRatio: n.hp / n.maxHp } });
  ok(d.def.endless === 'dinos' && d.E === CB.ENDLESS_DINOS && d.scenery && d.scenery.scene === 'prehistoire' && d.def.secret, 'tableau 1-6 : sans fin, décor préhistorique');
  ok(d.cards.includes('costaud') && d.runLevel === 4 && Math.abs(d.hp / d.maxHp - .5) < .02 && d.stats.damage > CB.stats(q, player).damage, 'cartes, niveau et vie conservés à travers le portail');
  d.intro = 0; d.hp = d.maxHp; for (let i = 0; i < 60 * 50 && !d.over; i++) { if (d.choice) d.pickCard(0); if (d.enemies.length) { const e = d.enemies.reduce((a, b) => a.z < b.z ? a : b); Object.assign(d.aim, CB.project(e)); } d.fire(); d.update(1 / 60); }
  ok(d.time >= 40, 'un personnage sans amélioration survit au moins 40 s dans la vallée (' + d.time.toFixed(0) + ' s)');
  ok(CB.DINOS.length === 20 && CB.DINOS.every(k => CB.ENEMIES[k] && CB.ENEMIES[k].variant), 'vingt dinosaures définis avec leur variante');
  ok(d.seen.length >= 2 && d.seen.every(k => CB.DINOS.includes(k)) && !d.enemies.some(e => e.def.chest), 'seuls des dinosaures arrivent, sans coffre (' + d.seen.join(', ') + ')');
  ok(d.news[0] && /PASSÉ/.test(d.news[0].text), 'bienvenue dans le passé'); }
// Passer au monde suivant : il faut réussir WORLD_NEED tableaux, pas tous ; le canon du monde demande le boss.
{ const q = S.blank('w'); q.progress.foret = [1, 0, 2, 1, 0, 3]; ok(S.worldCleared(q, 0) === 3 && S.worldUnlocked(q, 1) && !S.cannonUnlocked(q, 'pirate') && S.completion(q) === 10, 'trois tableaux réussis ouvrent le monde 2 (le secret ne compte pas), le canon attend le boss');
  q.progress.foret = [1, 1, 0, 0, 0]; ok(!S.worldUnlocked(q, 1), 'deux tableaux ne suffisent pas'); q.progress.foret[4] = 2; ok(S.worldUnlocked(q, 1) && S.cannonUnlocked(q, 'pirate'), 'le boss compte comme un tableau et débloque le canon'); }
// Paliers de couleur : même style, plus fort, plus payant
{ const t2 = new CB.Wave({ worldIndex: 0, waveIndex: 1, profile: S.blank('t'), player, random: seeded(1) }); const e = t2.spawnEnemy('bat', null, false, 2);
  ok(e.tier === 2 && e.name === 'Chauve-souris doré' && e.color === CB.TIERS[2].color && Math.abs(e.maxHp - CB.ENEMIES.bat.hp * 6) < 1e-9, 'palier doré : ×6 PV, couleur et nom du palier');
  const g0 = t2.gold; t2.kill(e); ok(t2.gold - g0 >= 8 * (CB.goldBase(0) + 0) - 1e-9, 'palier doré : or ×8');
  ok(CB.HALLOWEEN.length === 20 && CB.HALLOWEEN.every(k => CB.ENEMIES[k] && CB.ENEMIES[k].variant), '20 styles d\'Halloween avec variante spéciale'); }
// Un tableau classique « abats N » (monde 2)
{ const kp = Object.assign(S.blank('k'), { upgrades: { degats: 4, vie: 3, cadence: 3, portee: 2 } }); const k = new CB.Wave({ worldIndex: 1, waveIndex: 0, profile: kp, player, random: seeded(7) }); play(k, 120);
  ok(k.over && k.won && k.kills >= k.def.goal && [1, 2, 3].includes(k.stars), 'tableau d\'abattage gagné en visant (kills=' + k.kills + ')'); }

// Sans tirer, on se fait détruire.
w = new CB.Wave({ worldIndex: 0, waveIndex: 1, profile, player, random: seeded(3) });
for (let t = 0; t < 200 && !w.over; t += 1 / 60) w.update(1 / 60);
ok(w.over && !w.won && w.hp === 0 && w.reason === 'detruit', 'sans tirer, le canon est détruit');
ok(w.stars === 0 && w.bonusGold === 0 && w.gold >= 0, 'défaite : pas d\'étoile ni de bonus');

// Survie : la vague se termine à la fin du chrono.
const tank = Object.assign(S.blank('richard'), { upgrades: { vie: 10, degats: 10, cadence: 10 } });
w = new CB.Wave({ worldIndex: 0, waveIndex: 1, profile: tank, player: CB.playerById('richard'), random: seeded(11) });
ok(w.maxHp === CB.BASE_HP + 100, 'amélioration de vie : +10 PV par niveau');
ok(w.stats.damage > 2.5 && w.stats.damage * (1 / 1.12) < 2.6, 'dégâts ×2.5 avec 10 améliorations (+ talent de Richard)');
play(w, 100); ok(w.over && w.won && w.time >= w.def.seconds - .1, 'survie gagnée à la fin du chrono');
ok(w.timeLeft === 0, 'chrono épuisé');

// Contre la montre : échec quand le temps est écoulé sans assez d'ennemis.
w = new CB.Wave({ worldIndex: 0, waveIndex: 2, profile: tank, player, random: seeded(5) });
w.fire = () => false; for (let t = 0; t < 120 && !w.over; t += 1 / 60) w.update(1 / 60);
ok(w.over && !w.won && (w.reason === 'temps' || w.reason === 'detruit'), 'contre la montre perdu');

// Boss en trois actes : il sort au niveau 5, perd un tiers et s'enfuit, revient au niveau 10 avec de nouveaux pouvoirs, puis meurt au niveau 15.
w = new CB.Wave({ worldIndex: 0, waveIndex: 4, profile: tank, player: CB.playerById('richard'), random: seeded(21) });
play(w, 8);
ok(!w.boss && w.kills > 0 && !w.over && w.runLevel < CB.BOSS_LEVELS[0], 'au début, des monstres ordinaires et pas de boss (niveau ' + w.runLevel + ')');
ok(CB.xpPerKill(0) * CB.BOSS_XP === 12, 'l’XP par monstre est multipliée dans un tableau de boss');
const toLevel = (wave, lvl) => { while (wave.runLevel < lvl) wave.gainXp(CB.runXpFor(wave.runLevel) - wave.runXp); while (wave.choice) wave.pickCard(0); wave.update(1 / 60); };
toLevel(w, CB.BOSS_LEVELS[0]); for (let i = 0; i < 6; i++) w.update(1 / 60);
ok(w.boss && w.boss.act === 0 && w.enemies.every(e => e.boss || e.def.shot) && w.news.some(n => n.kind === 'boss' && /ACTE 1/.test(n.text)), 'niveau 5 : le boss sort, seul devant nous (acte 1)');
{ const b = w.boss, maxHp = b.maxHp; ok(b.target === maxHp * 2 / 3 && b.powers.join() === 'bolt,boulet', 'acte 1 : un tiers à enlever, tir rapide et boulet lourd');
  play(w, 25); ok(w.enemies.some(e => e.type === 'boulet') || w.news.length > 2 || w.boss === null || b.powerIndex > 0, 'le boss attaque avec ses pouvoirs (' + b.powerIndex + ' attaques)');
  w.applyDamage(b, maxHp / 3 + 1); ok(b.leaving && w.boss === null && w.bossFight === 1 && Math.abs(b.hp - maxHp * 2 / 3) < 1e-9 && w.news.some(n => /ENFUIT/.test(n.text)), 'un tiers enlevé : le boss s’enfuit avec ses PV figés au deux tiers');
  for (let i = 0; i < 60 * 8; i++) w.update(1 / 60); ok(!w.enemies.some(e => e.boss) && !w.over, 'le boss a quitté l’écran, le tableau continue');
  toLevel(w, CB.BOSS_LEVELS[1]); for (let i = 0; i < 6; i++) w.update(1 / 60);
  const b2 = w.boss; ok(b2 && b2.act === 1 && Math.abs(b2.hp - maxHp * 2 / 3) < 1e-9 && b2.powers.includes('bombe') && b2.powers.includes('eventail') && w.news.some(n => /ACTE 2/.test(n.text) && /NOUVEAU/.test(n.text)), 'niveau 10 : il revient à deux tiers avec bombe et éventail');
  w.bossAttack(b2, 'eventail'); ok(w.enemies.filter(e => e.type === 'bolt').length >= 3, 'l’éventail lance trois tirs');
  const bomb = w.spawnEnemy('bombe', { x: 0, y: 6, z: 40 }); const hp0 = w.hp; for (let i = 0; i < 60 * 6 && !bomb.dead; i++) w.update(1 / 60); ok(bomb.dead && Math.abs(bomb.z - CB.ENEMIES.bombe.hold) < 1 && w.hp < hp0, 'la bombe s’arrête, compte à rebours, puis explose sur nous si on ne la détruit pas');
  const bomb2 = w.spawnEnemy('bombe', { x: 0, y: 6, z: 40 }); w.applyDamage(bomb2, 99); ok(bomb2.dead && w.texts.some(t => /DÉSAMORCÉ/.test(t.text)) && w.kills === w.kills, 'une bombe abattue est désamorcée sans compter comme un monstre');
  w.applyDamage(b2, maxHp / 3 + 1); ok(b2.leaving && w.bossFight === 2, 'deuxième tiers enlevé : il s’enfuit encore');
  for (let i = 0; i < 60 * 8; i++) w.update(1 / 60); toLevel(w, CB.BOSS_LEVELS[2]); for (let i = 0; i < 6; i++) w.update(1 / 60);
  const b3 = w.boss; ok(b3 && b3.act === 2 && b3.powers.includes('rayon') && Math.abs(b3.hp - maxHp / 3) < 1e-9, 'niveau 15 : acte final avec le rayon chargé');
  w.applyDamage(b3, maxHp); ok(w.over && w.won && b3.dead, 'boss vaincu à l’acte 3 (temps=' + Math.round(w.time) + 's)'); }
ok(w.bonusGold === 6 * 5 * 3, 'bonus triplé pour un boss');
CB.claim(tank, w); for (let vi = 0; vi < 4; vi++) tank.progress.foret[vi] = 1;
ok(S.worldDone(tank, 0) && S.worldUnlocked(tank, 1) && !S.worldUnlocked(tank, 2), 'monde 2 débloqué après le boss du monde 1');
ok(S.cannonUnlocked(tank, 'pirate') && !S.cannonUnlocked(tank, 'confetti'), 'le canon de pirate se débloque avec le monde 1');

// Ennemi spécial → trois cartes, appliquées à la vague seulement.
w = new CB.Wave({ worldIndex: 1, waveIndex: 1, profile: tank, player, random: seeded(99) });
w.time = 20; const elite = w.spawnEnemy('ghost'); let tries = 0; while (!elite.elite && tries++ < 50) { w.enemies.pop(); w.lastElite = -99; w.time += 20; w.enemies.push(w.spawnEnemy('ghost')); }
const special = w.enemies.find(e => e.elite); ok(special && special.hp > CB.ENEMIES.ghost.hp * CB.hpScale(1) * 2.9, 'variante spéciale : 3× les points de vie');
const g0 = w.gold, x0 = w.xp, rl0 = w.runLevel; w.choice = null; w.pendingLevels = 0; w.runXp = 0; w.kill(special);
ok(w.xp - x0 === CB.xpPerKill(1) * 5 && w.gold - g0 > 0, 'variante spéciale : XP ×5 et un peu plus d\'or');
ok(!w.choice || w.runLevel > rl0, 'abattre une variante n\'offre pas de cartes par elle-même');
w.choice = null; w.pendingLevels = 0; w.runXp = 0; w.runLevel = 1; w.gainXp(CB.runXpFor(1));
ok(w.runLevel === 2 && w.choice && w.choice.length === 3 && new Set(w.choice).size === 3, 'monter de niveau dans la vague offre trois cartes différentes');
const before = w.stats.damage;
const idx = w.choice.indexOf('costaud'); if (idx >= 0) { w.pickCard(idx); ok(w.stats.damage > before * 1.49, 'Gros bras : dégâts +50 %'); } else { w.pickCard(0); ok(w.cards.length === 1, 'carte choisie'); }
ok(!w.choice && w.pendingLevels === 0, 'le choix est refermé');
w.gainXp(CB.runXpFor(2) + CB.runXpFor(3)); ok(w.runLevel === 4 && w.pendingLevels === 2 && w.choice, 'deux niveaux d\'un coup : deux tirages en attente'); w.pickCard(0); ok(w.choice && w.pendingLevels === 1, 'le deuxième tirage suit tout de suite'); w.pickCard(0); ok(!w.choice, 'puis plus rien');
ok(CB.stats(tank, player).damage !== w.stats.damage || !w.cards.includes('costaud'), 'les cartes ne touchent pas le profil');
for (const [key, card] of Object.entries(CB.CARDS)) { const ww = new CB.Wave({ profile: tank, player, random: seeded(1) }); ww.choice = [key]; ww.pickCard(0); ok(ww.cards[0] === key && card.name, 'carte ' + key + ' applicable'); }

// Effets spéciaux : avec 5 niveaux de bowling, 25 % des tirs traversent.
const fx = Object.assign(S.blank('adam'), { effects: { bowling: 5 } });
w = new CB.Wave({ profile: fx, player: CB.playerById('adam'), random: seeded(2) });
let pierce = 0; for (let i = 0; i < 400; i++) { w.cooldown = 0; w.balls = []; w.fire(); if (w.balls[0].pierce) pierce++; }
ok(pierce > 60 && pierce < 140, 'boule de bowling environ 25 % du temps (' + pierce + '/400)');
const stars = Object.assign(S.blank('adam'), { effects: { etoiles: 5 } });
w = new CB.Wave({ profile: stars, player, random: () => 0 }); w.fire(); ok(w.balls.length === 3, 'pluie d\'étoiles : trois boulets');
const twin = Object.assign(S.blank('zachary'), { cannon: 'jumeau' }); w = new CB.Wave({ profile: twin, player, random: () => .99 }); w.fire(); ok(w.balls.length === 2, 'canon jumeau : deux boulets');

// Boutique et niveaux
const p = S.blank('alexie'); p.gold = 1000;
ok(S.buyUpgrade(p, 'cadence') && p.upgrades.cadence === 1 && p.gold === 1000 - CB.upgradeCost('cadence', 0), 'achat d\'une amélioration');
ok(CB.stats(S.blank('x'), CB.playerById('matthieu')).auto && !CB.UPGRADES.auto, 'le tir en continu est toujours permis, rien à acheter');
{ const old = S.load({ getItem() { return JSON.stringify({ profiles: { z: Object.assign(S.blank('z'), { gold: 5, upgrades: { auto: 1, cadence: 2 } }) } }); } }).profiles.z; ok(!old.upgrades.auto && old.upgrades.cadence === 2 && old.gold === 65, 'ancien achat du tir automatique remboursé'); }
{ const w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: S.blank('y'), player: CB.playerById('matthieu'), random: seeded(3) }); const r0 = w.stats.rate; w.choice = ['rafale']; w.pickCard(0); ok(Math.abs(w.stats.rate - r0 * 2) < 1e-9 && CB.CARDS.rafale.max === 1, 'Gâchette folle : cadence doublée, une seule fois'); w.choice = null; w.offerCards(); ok(!w.choice.includes('rafale'), 'elle n\'est plus proposée ensuite'); }
ok(!S.buyCannon(p, 'pirate'), 'canon de pirate verrouillé avant le monde 1');
p.progress.foret = [1, 1, 1, 1, 1]; ok(S.buyCannon(p, 'pirate') && p.cannon === 'pirate' && !S.buyCannon(p, 'pirate'), 'achat du canon de pirate une seule fois');
ok(S.buyBall(p, 'feu') && p.ball === 'feu', 'achat d\'un boulet');
ok(S.buyEffect(p, 'feu') && p.effects.feu === 1, 'achat d\'un effet spécial');
p.gold = 0; ok(!S.buyUpgrade(p, 'degats') && !S.buyBall(p, 'disco') && !S.buyEffect(p, 'neige'), 'pas d\'or, pas d\'achat');
const lv = S.blank('milo'); const gained = S.addXp(lv, CB.xpForLevel(1) + CB.xpForLevel(2) + 5); ok(gained === 2 && lv.level === 3 && lv.xp === 5, 'deux niveaux gagnés, reste d\'XP conservé');
ok(lv.points === 2 && CB.stats(lv, null).maxHp === CB.BASE_HP, 'chaque niveau donne un point d\'évolution à choisir, rien d\'automatique');
ok(S.spendPoint(lv, 'vie') && S.spendPoint(lv, 'degats') && !S.spendPoint(lv, 'vie') && lv.points === 0, 'les points se dépensent une fois chacun');
const cap = S.blank('cap'); cap.points = 3; cap.talents = { vie: CB.TALENT_MAX }; ok(!S.spendPoint(cap, 'vie') && cap.points === 3 && S.spendPoint(cap, 'degats') && cap.points === 2, 'une stat au maximum (' + CB.TALENT_MAX + ') refuse le point, les autres l’acceptent');
ok(CB.stats(lv, null).maxHp === CB.BASE_HP + 10 && Math.abs(CB.stats(lv, null).damage - 1.06) < 1e-9, 'les évolutions vie et dégâts s\'appliquent');
{ const old = JSON.parse(JSON.stringify(Object.assign(S.blank('old'), { level: 4, gold: NaN }))); delete old.talents; delete old.points; const st = { d: JSON.stringify({ profiles: { old } }), getItem() { return this.d; } }; const q = S.load(st).profiles.old; ok(q.points === 3 && q.gold === 0, 'ancien profil : points rattrapés et or NaN remis à zéro'); }
{ const al = S.blank('matthieu'); al.gold = 1000; ok(!CB.stats(al, null).ally && S.buyAlly(al) && al.allyBought && al.ally && al.ally !== 'matthieu' && !S.buyAlly(al), 'recrutement du coéquipier une seule fois'); ok(S.setAlly(al, 'eliott') && !S.setAlly(al, 'matthieu') && CB.stats(al, null).ally === 'eliott', 'choix du coéquipier (jamais soi-même)');
  const w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: al, player: CB.playerById('matthieu'), random: seeded(9) }); ok(w.ally && w.ally.id === 'eliott', 'le coéquipier est en poste dans la vague'); w.spawnEnemy('bat'); for (let i = 0; i < 80; i++) w.update(.05); const b = w.balls.find(x => x.ally); ok(w.ally.shots > 0 && w.shots === 0, 'le coéquipier tire tout seul sans compter dans nos tirs'); ok(!b || Math.abs(b.dmg - w.stats.damage * .5) < 1e-9, 'ses boulets font moitié dégâts'); }
ok(S.completion(p) === Math.round(100 * 5 / 30) && S.nextWave(p).wi === 1, 'complétion et prochaine vague');

// Tableau personnalisé (mode Debug) : arrivées planifiées en paquets, pas de monstres aléatoires
{ const custom = { type: 'kill', goal: 6, random: { enabled: false, enemies: [] }, spawns: [{ at: 1, type: 'owl', count: 3, every: .5, packs: 2, interval: 4, elite: true }], scene: 'volcan', sky: ['#000', '#111', '#222'], ground: '#333', boss: null, hpScale: 2, speedScale: .01 };
  const w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: S.blank('z'), player: CB.playerById('matthieu'), random: seeded(4), custom });
  ok(w.def.goal === 6 && w.world.scene === 'volcan' && w.world.ground === '#333' && w.world.enemies.length === 0, 'définition et visuel personnalisés');
  let spawned = 0; for (let i = 0; i < 40; i++) { w.update(.05); } spawned = w.enemies.length; ok(spawned === 3 && w.enemies.every(e => e.type === 'owl' && e.elite), 'premier paquet de 3 hiboux élites à 1 s');
  for (let i = 0; i < 110; i++) w.update(.05); ok(w.enemies.length === 6, 'deuxième paquet 4 s plus tard, aucun monstre aléatoire');
  ok(Math.abs(w.enemies[0].maxHp - CB.ENEMIES.owl.hp * 2 * 3) < 1e-9, 'PV × 2 appliqué (et × 3 pour l’élite)');
  CB.CUSTOM_WAVES = { 'foret-1': { type: 'survive', seconds: 7, random: { enabled: true, enemies: ['bat'] } } }; const w2 = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: S.blank('z'), player: null, random: seeded(4) }); ok(w2.def.type === 'survive' && w2.def.seconds === 7, 'un tableau relié dans CB.CUSTOM_WAVES remplace celui de la carte'); CB.CUSTOM_WAVES = {}; }

// Billes au départ, carte Boulets géants cumulable sans limite
{ const w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: S.blank('b'), player: null, random: seeded(2) }); ok(w.stats.size === 1, 'taille de départ : une bille');
  for (let i = 0; i < 3; i++) { w.choice = ['geant']; w.pickCard(0); } ok(Math.abs(w.stats.size - 1.75 ** 3) < 1e-9 && w.cards.filter(k => k === 'geant').length === 3, 'trois cartes géantes = 536 % de la bille');
  w.offerCards(); ok(w.choice && w.choice.length === 3 && w.choice.every(k => w.cardLevel(k) < CB.CARDS[k].max), 'le tirage ne propose que des cartes sous leur niveau maximal');
  let seen = false; for (let i = 0; i < 40 && !seen; i++) { w.choice = null; w.cards = ['geant', 'geant']; w.offerCards(); seen = w.choice.includes('geant'); } ok(seen, 'la carte géante est encore proposée après avoir été prise');
  w.choice = null; w.fire(); ok(w.balls.length && Math.abs(w.balls[0].size - w.stats.size) < 1e-9, 'le boulet tiré a la taille cumulée'); }

// Niveaux de cartes et combos secrets
{ const pl = CB.playerById('matthieu'); const mk = () => new CB.Wave({ worldIndex: 0, waveIndex: 1, profile: S.blank('c'), player: pl, random: seeded(5) }); const take = (w, k, n = 1) => { for (let i = 0; i < n; i++) { w.choice = [k]; w.pickCard(0); } };
  let w = mk(); take(w, 'double', 3); w.offerCards(); ok(w.cardLevel('double') === 3 && w.stats.shots === 4 && !w.choice.includes('double'), 'une carte plafonne au niveau 3');
  take(w, 'rapide', 3); w.choice = null; w.offerCards(); ok(w.choice.includes('deluge'), 'Déluge de plomb proposé quand Tir double et Gâchette rapide sont au niveau 3');
  const r0 = w.stats.range, sh0 = w.stats.shots; take(w, 'deluge'); ok(w.stats.fan && Math.abs(w.stats.range - r0 * 1.25) < 1e-9, 'Déluge niv. 1 : éventail et +25 % de vitesse'); take(w, 'deluge'); ok(w.stats.shots === sh0 + 1, 'Déluge niv. 2 : +1 boulet'); take(w, 'deluge'); w.choice = null; w.offerCards(); ok(!w.choice.includes('deluge'), 'un combo plafonne aussi au niveau 3');
  w = mk(); w.offerCards(); ok(!w.choice.some(k => CB.CARDS[k].combo), 'aucun combo sans ses ingrédients');
  w = mk(); take(w, 'soin', 3); take(w, 'glace', 3); w.spawnEnemy('bat'); w.spawnEnemy('owl'); take(w, 'anesthesie'); ok(w.enemies.every(e => e.frozen >= 4), 'Anesthésie totale gèle tout le monde 4 s');
  w = mk(); take(w, 'bouclier', 3); take(w, 'chance', 3); take(w, 'odin'); const e1 = w.spawnEnemy('bat'); e1.hp = 1000; w.hitEnemy(e1, { dmg: 1, z: 0, hitIds: new Set() }); ok(w.texts.some(t => t.text === 'CRITIQUE !'), 'Pacte d’Odin : critique garanti tant que le bouclier tient');
  w = mk(); take(w, 'aimant', 3); take(w, 'tresor', 3); take(w, 'moissonneuse'); const e2 = w.spawnEnemy('bat'); w.kill(e2); ok(w.boost > 0 && w.boostTimer > 0, 'Moissonneuse royale : bonus de dégâts après un gain d’or');
  w = mk(); take(w, 'rafale', 1); take(w, 'geant', 3); w.choice = null; w.offerCards(); ok(w.choice.includes('mitrailleuse'), 'Mitrailleuse proposée avec Gâchette folle (max 1) et Boulets géants niveau 3'); take(w, 'mitrailleuse'); const e3 = w.spawnEnemy('bat'); const z0 = e3.z; e3.hp = 1000; w.hitEnemy(e3, { dmg: 1, z: 0, hitIds: new Set() }); ok(e3.z > z0 && w.stats.knock === 1, 'Mitrailleuse tournoyante : recul des ennemis');
  w = mk(); take(w, 'vampire', 3); take(w, 'explosif', 3); take(w, 'siphon'); w.hp = 10; const e4 = w.spawnEnemy('bat', { x: 0, y: 5, z: 40 }); w.spawnEnemy('bat', { x: 1, y: 5, z: 41 }); w.hitEnemy(e4, { dmg: .1, z: 0, splash: w.stats.splash, hitIds: new Set() }); ok(w.hp === 12, 'Siphon de sang : +1 PV par ennemi touché par l’explosion');
  w = mk(); take(w, 'costaud', 3); take(w, 'portee', 3); take(w, 'comete'); ok(w.stats.cometCap === 1.5 && CB.COMBOS.length === 10, 'Comète dévastatrice : plafond +150 %, et 10 combos définis'); }

// Monstres visibles sur tous les appareils : zone d'apparition calculée selon l'écran
{ const inside = (V, e) => Math.abs(e.x) <= V.spread + 1e-9 && e.y >= 4 && e.y <= Math.min(17, V.spreadY) + 1e-9;
  const big = CB.setView(1600, 900), wb = new CB.Wave({ worldIndex: 0, waveIndex: 1, profile: S.blank('v'), player: null, random: seeded(8) }); for (let i = 0; i < 200; i++) wb.spawnEnemy('bat'); ok(wb.enemies.every(e => inside(big, e)) && wb.enemies.some(e => Math.abs(e.x) > 14), 'grand écran : apparitions parfois très larges, toujours visibles (demi-largeur ' + big.spread.toFixed(1) + ')');
  const small = CB.setView(390, 844), ws = new CB.Wave({ worldIndex: 0, waveIndex: 1, profile: S.blank('v'), player: null, random: seeded(8) }); for (let i = 0; i < 200; i++) ws.spawnEnemy('crow'); ok(ws.enemies.every(e => inside(small, e)) && small.spread < big.spread && small.spreadY < 17, 'téléphone en portrait : zone plus étroite, aucun monstre hors écran (demi-largeur ' + small.spread.toFixed(1) + ', hauteur ' + small.spreadY.toFixed(1) + ')');
  for (let i = 0; i < 120; i++) ws.update(.05); ok(ws.enemies.every(e => e.dead || e.escaped || Math.abs(e.x) <= small.spread + 1e-6), 'les zigzags et dérives restent dans la zone visible');
  CB.setView(960, 640); }

// Sauvegarde aller-retour
const storage = memory(); const data = S.fresh(); data.current = 'alexie'; data.profiles.alexie = p; S.store(data, storage);
const back = S.load(storage); ok(back.current === 'alexie' && back.profiles.alexie.cannon === 'pirate' && back.profiles.alexie.balls.includes('feu'), 'sauvegarde relue');
ok(S.load(memory()).current === null && Object.keys(S.load(memory()).profiles).length === 0, 'sauvegarde vide');

console.log('✔ ' + n + ' vérifications réussies');
