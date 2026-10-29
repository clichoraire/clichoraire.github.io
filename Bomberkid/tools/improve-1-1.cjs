// Copie améliorée de « Niveau 1-1 » (carte de Matthieu) : monstres plus doux, labyrinthe de clôtures, ruche et miel,
// île au champignon-trampoline, fontaines, commerçante dans la maison. node tools/improve-1-1.cjs <export.json> <sortie.json>
const fs = require('fs'); const BK = require('./headless.js');
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const m = JSON.parse(JSON.stringify(src)); m.name = 'Niveau 1-1 · version Claude'; m.id = 'claude-1-1'; m.updated = Date.now();
const g = m.grid.map(l => l.split('')); const set = (c, r, ch, props) => { g[r][c] = ch; if (props) m.props[c + ',' + r] = Object.assign({}, m.props[c + ',' + r] || {}, props); else if (m.props[c + ',' + r] && !'~ '.includes(ch)) { const p = m.props[c + ',' + r]; for (const k of ['deco', 'style', 'size', 'colors', 'letter']) delete p[k]; } };
const log = [];
// 1. monstres : premier niveau, donc pas de squelettes, de fantômes ni de lance-fusées ; un seul canon, près du but
let sk = 0; m.enemies = m.enemies.map(e => {
  if (e.type === 'squelette') return { ...e, type: (sk++ % 2) ? 'gluant' : 'ballon' };
  if (e.type === 'fantome') return { ...e, type: 'gluant' };
  if (e.type === 'lanceur') return { ...e, type: 'plante' };
  if (e.type === 'canon' && !(e.c === 6 && e.r === 6)) return { ...e, type: (e.c === 7 && e.r === 36) || (e.c === 11 && e.r === 50) ? 'plante' : 'ballon' };
  return e;
});
m.enemies.push({ type: 'marin', c: 10, r: 57 });   // monstre marin dans l'eau, deux cases sous le grand pont
log.push('Monstres : squelettes → ballounets et gluants, fantômes → gluants, lance-fusées → plante carnivore, 5 canons sur 6 → plantes et ballounets (il reste celui du haut, près du portail), + 1 monstre marin près du grand pont.');
// 2. labyrinthe de clôtures dans la poche de droite (cols 13-17, rangées 42-48), pièces aux culs-de-sac, cœur au bout
const maze = { 42: '.w...', 43: '.w.w$', 44: '...wT', 45: 'ww..', 46: '$..T', 47: '$w.', 48: 'h$' };
for (const [r, row] of Object.entries(maze)) row.split('').forEach((ch, i) => { const c = 13 + i; set(c, +r, ch === '.' ? ',' : ch); });
log.push('Labyrinthe de clôtures à droite de la plaine (rangées 42-48) : entrée en haut à gauche, pièces aux culs-de-sac, cœur +10 tout au bout.');
// 3. ruche près du village (le pot de miel servira contre les gluants) ; champignons remplacés
set(8, 84, '"', { deco: 'beehive' }); log.push('Ruche près du village (8,84) : une bombe la casse → pot de miel (3 doses), abeilles si on s’approche.');
// 4. île au trésor avec champignon-trampoline (rangées 33-35) : bombe en (15,33), on saute dessus, bond vers l’ouest → champignon → 3 cases plus loin, sur l’île ; pont de retour
for (let r = 33; r <= 35; r++) for (let c = 9; c <= 11; c++) set(c, r, ',');
set(9, 33, '$'); set(11, 33, '$'); set(9, 35, '$'); set(11, 35, '$'); set(10, 34, 'O');
set(15, 33, ','); set(14, 33, '"', { deco: 'bigmushroom' }); for (const c of [12, 13, 14, 15]) set(c, 35, '=');
log.push('Île au trésor (cols 9-11, rangées 33-35) : coffre et 4 pièces ; on y arrive en sautant sur une bombe posée en (15,33) puis bond vers l’ouest sur le gros champignon (14,33) qui propulse 3 cases ; pont de retour rangée 35.');
// 5. fontaines (Entrée pour boire : stamina pleine) au village et sur la plaine
set(10, 85, 'J'); set(16, 42, 'J'); log.push('Deux fontaines : au village (10,85) et sur la plaine (16,42).');
// 6. commerçante dans la maison du village (12,87) : articles sur le comptoir
const h = m.houses['12,87']; h.interior.npcs = [{ c: 3, r: 1, id: 'josee', lines: ['Bienvenue ! Regarde mes articles sur le comptoir.', 'Le miel englue les monstres, essaie-le !'] }];
h.interior.shop = [{ c: 2, r: 2, item: 'bomb', price: 20, once: true }, { c: 4, r: 2, item: 'heart', price: 15, once: false }, { c: 6, r: 2, item: 'honey', price: 12, once: false }];
log.push('Dans la maison du village (12,87) : Josée tient boutique ; sur le comptoir, bombe en plus (20, une fois), cœur (15, sans limite), pot de miel (12, sans limite).');
m.grid = g.map(l => l.join(''));
// vérification : le tableau se charge et le portail reste atteignable (blocs cassables, grilles, pont-levis et porte scellée comptent comme passables)
const W = new BK.World({ map: m.grid, theme: m.theme, mode: 'adventure', hearts: true, explore: true, houses: m.houses, props: m.props });
const reach = (grid) => { const rows = grid.length, cols = grid[0].length; let s = null, t = null; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (grid[r][c] === '1') s = [c, r]; if (grid[r][c] === 'G') t = [c, r]; }
  const pass = ch => !'~ #TrWHlnosuwKijOLINV23456789JMRSUYZ@+?"'.includes(ch) && ch !== 'P'; const seen = new Set([s.join()]), q = [s];
  while (q.length) { const [c, r] = q.shift(); if (c === t[0] && r === t[1]) return true; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue; const k = cc + ',' + rr; if (seen.has(k)) continue; const ch = grid[rr][cc]; if (!pass(ch) && !(ch === '"' && (m.props[k] || {}).deco === 'bones')) continue; seen.add(k); q.push([cc, rr]); } } return false; };
if (!reach(src.grid)) throw Error('la carte originale n’a pas de chemin ?'); if (!reach(m.grid)) throw Error('le chemin vers le portail est cassé');
for (const e of m.enemies) { if (!BK.ENEMIES[e.type]) throw Error('ennemi inconnu ' + e.type); const ch = m.grid[e.r][e.c]; if ((ch === '~' && e.type !== 'marin') || ch === ' ') throw Error('ennemi dans l’eau ' + e.type + ' ' + e.c + ',' + e.r); }
const A = new BK.Adventure('adam', 0, { custom: BK.mapToStage(m) }); if (!A.world.enemies.some(e => e.type === 'marin')) throw Error('marin manquant'); void W;
fs.writeFileSync(process.argv[3], JSON.stringify(m, null, 1)); console.log('✔ ' + process.argv[3]); console.log(log.map(l => ' - ' + l).join('\n'));
