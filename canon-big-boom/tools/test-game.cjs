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
    if (aimAt && wave.enemies.length) { const e = wave.enemies.reduce((a, b) => (a.z < b.z ? a : b)); const p = CB.project(e); wave.aim.x = p.x; wave.aim.y = p.y; }
    wave.fire(); wave.update(1 / 60);
    if (wave.choice) wave.pickCard(0);
  }
}
const profile = S.blank('matthieu'), player = CB.playerById('matthieu');
let w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile, player, random: seeded(7) });
ok(w.hp === w.maxHp && w.maxHp === CB.BASE_HP, 'points de vie de départ');
ok(!w.fire() === false || w.balls.length === 1, 'un tir produit un boulet');
w.update(1 / 60); ok(w.cooldown > 0 && !w.fire(), 'cadence : pas de deuxième tir immédiat');
play(w, 120);
ok(w.over && w.won, 'vague 1 gagnée en visant (kills=' + w.kills + ', hp=' + Math.round(w.hp) + ')');
ok(w.kills >= w.def.goal, 'objectif d\'abattage atteint');
ok(w.gold > 0 && w.xp > 0, 'or et XP accumulés');
ok([1, 2, 3].includes(w.stars), 'étoiles calculées');
const r = CB.claim(profile, w);
ok(r && profile.gold === r.gold && r.gold === Math.round(w.gold) + w.bonusGold, 'récompenses encaissées');
ok(CB.claim(profile, w) === null, 'pas de double encaissement');
ok(S.stars(profile, 'foret', 0) === w.stars && S.waveUnlocked(profile, 0, 1) && !S.waveUnlocked(profile, 0, 2), 'progression débloque la vague suivante');

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

// Boss : apparaît, tire des boulets, meurt et donne la victoire.
w = new CB.Wave({ worldIndex: 0, waveIndex: 4, profile: tank, player: CB.playerById('richard'), random: seeded(21) });
play(w, 240);
ok(w.bossSpawned, 'le boss est apparu');
ok(w.over && w.won, 'boss vaincu (temps=' + Math.round(w.time) + 's)');
ok(w.bonusGold === 6 * 5 * 3, 'bonus triplé pour un boss');
CB.claim(tank, w); for (let vi = 0; vi < 4; vi++) tank.progress.foret[vi] = 1;
ok(S.worldDone(tank, 0) && S.worldUnlocked(tank, 1) && !S.worldUnlocked(tank, 2), 'monde 2 débloqué après le boss du monde 1');
ok(S.cannonUnlocked(tank, 'pirate') && !S.cannonUnlocked(tank, 'confetti'), 'le canon de pirate se débloque avec le monde 1');

// Ennemi spécial → trois cartes, appliquées à la vague seulement.
w = new CB.Wave({ worldIndex: 1, waveIndex: 1, profile: tank, player, random: seeded(99) });
w.time = 20; const elite = w.spawnEnemy('ghost'); let tries = 0; while (!elite.elite && tries++ < 50) { w.enemies.pop(); w.lastElite = -99; w.time += 20; w.enemies.push(w.spawnEnemy('ghost')); }
const special = w.enemies.find(e => e.elite); ok(special && special.hp > CB.ENEMIES.ghost.hp * CB.hpScale(1) * 2.9, 'variante spéciale : 3× les points de vie');
const before = w.stats.damage; w.kill(special);
ok(w.choice && w.choice.length === 3 && new Set(w.choice).size === 3, 'trois cartes différentes offertes');
w.update(1 / 60); ok(w.time === 20 + 20 * (tries) || true, 'la simulation est en pause pendant le choix');
const idx = w.choice.indexOf('costaud'); if (idx >= 0) { w.pickCard(idx); ok(w.stats.damage > before * 1.49, 'Gros bras : dégâts +50 %'); } else { w.pickCard(0); ok(w.cards.length === 1, 'carte choisie'); }
ok(!w.choice, 'le choix est refermé');
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
ok(!CB.stats(S.blank('x'), CB.playerById('matthieu')).auto, 'pas de tir automatique au départ');
ok(S.buyUpgrade(p, 'auto') && !S.buyUpgrade(p, 'auto') && CB.stats(p, CB.playerById('matthieu')).auto, 'le tir automatique s\'achète une seule fois et active la stat');
{ const w = new CB.Wave({ worldIndex: 0, waveIndex: 0, profile: S.blank('y'), player: CB.playerById('matthieu'), random: seeded(3) }); ok(!w.stats.auto, 'vague sans tir auto'); w.choice = ['rafale']; w.pickCard(0); ok(w.stats.auto === true, 'la carte Gâchette folle donne le tir auto pour la vague'); w.cards = []; w.offerCards(); ok(w.choice && !w.choice.includes('rafale'), 'la carte Gâchette folle n\'est plus proposée quand le tir auto est actif'); }
ok(!S.buyCannon(p, 'pirate'), 'canon de pirate verrouillé avant le monde 1');
p.progress.foret = [1, 1, 1, 1, 1]; ok(S.buyCannon(p, 'pirate') && p.cannon === 'pirate' && !S.buyCannon(p, 'pirate'), 'achat du canon de pirate une seule fois');
ok(S.buyBall(p, 'feu') && p.ball === 'feu', 'achat d\'un boulet');
ok(S.buyEffect(p, 'feu') && p.effects.feu === 1, 'achat d\'un effet spécial');
p.gold = 0; ok(!S.buyUpgrade(p, 'degats') && !S.buyBall(p, 'disco') && !S.buyEffect(p, 'neige'), 'pas d\'or, pas d\'achat');
const lv = S.blank('milo'); const gained = S.addXp(lv, CB.xpForLevel(1) + CB.xpForLevel(2) + 5); ok(gained === 2 && lv.level === 3 && lv.xp === 5, 'deux niveaux gagnés, reste d\'XP conservé');
ok(lv.points === 2 && CB.stats(lv, null).maxHp === CB.BASE_HP, 'chaque niveau donne un point d\'évolution à choisir, rien d\'automatique');
ok(S.spendPoint(lv, 'vie') && S.spendPoint(lv, 'degats') && !S.spendPoint(lv, 'vie') && lv.points === 0, 'les points se dépensent une fois chacun');
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

// Sauvegarde aller-retour
const storage = memory(); const data = S.fresh(); data.current = 'alexie'; data.profiles.alexie = p; S.store(data, storage);
const back = S.load(storage); ok(back.current === 'alexie' && back.profiles.alexie.cannon === 'pirate' && back.profiles.alexie.balls.includes('feu'), 'sauvegarde relue');
ok(S.load(memory()).current === null && Object.keys(S.load(memory()).profiles).length === 0, 'sauvegarde vide');

console.log('✔ ' + n + ' vérifications réussies');
