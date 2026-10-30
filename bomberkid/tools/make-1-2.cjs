// « Niveau 1-2 · version Claude » : un château dans le ciel, quatre salles à fosse traversées sur des plateformes mobiles.
// node tools/make-1-2.cjs [sortie.json]
const fs = require('fs'); const BK = require('./headless.js');
const COLS = 24, ROWS = 74, g = Array.from({ length: ROWS }, () => Array(COLS).fill(' ')), props = {}, enemies = [];
const fill = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; };
const put = (c, r, ch, pr) => { g[r][c] = ch; if (pr) props[c + ',' + r] = Object.assign(props[c + ',' + r] || {}, pr); };
const room = (c0, r0, c1, r1) => { fill(c0, r0, c1, r1, '#'); fill(c0 + 1, r0 + 1, c1 - 1, r1 - 1, '.'); };
const en = (type, c, r) => enemies.push({ type, c, r });
// escalier de deux étages : rampe, palier d'étage 1, rampe (dc,dr = sens de la montée, depuis la case de fosse c,r)
const stairs = (c, r, dc, dr) => { put(c, r, '/'); put(c + dc, r + dr, '.', { lv: 1 }); put(c + 2 * dc, r + 2 * dr, '/'); };
// ---- arène finale (rangées 1-8) : le diamant sur une corniche d'étage 3, atteinte par l'ascenseur
room(5, 1, 16, 8); fill(6, 2, 15, 7, ':');
for (let r = 2; r <= 3; r++) for (let c = 9; c <= 11; c++) put(c, r, ':', { lv: 4 });
put(10, 3, '|', { lv: 4 }); put(9, 2, '$', { lv: 4 }); put(11, 2, '$', { lv: 4 });
put(10, 4, '{', { lv: 2 }); put(7, 5, 'X'); put(14, 5, 'X'); put(8, 6, '$'); put(13, 6, '$'); put(6, 2, 'l'); put(15, 2, 'l');
en('canon_rouge', 12, 6); en('chevalier', 7, 7); en('chevalier', 13, 7);
fill(11, 8, 13, 9, ':');   // passage arène ↔ salle du serpent
// ---- salle D (rangées 9-24) : le grand serpent, rail en L (8 cases vers l'est puis 10 vers le nord)
room(1, 9, 22, 24); fill(11, 8, 13, 9, ':'); fill(11, 10, 13, 11, ':'); fill(2, 20, 4, 23, ':');
for (let c = 5; c <= 12; c++) put(c, 22, '('); for (let r = 12; r <= 21; r++) put(12, r, '(');
stairs(7, 23, -1, 0); put(8, 20, '$'); put(15, 16, '$'); put(20, 11, 'h'); put(20, 22, 'O'); put(14, 20, '"', { deco: 'skullpile' }); put(3, 12, '"', { deco: 'bones' }); put(19, 15, 'x');
en('canon_rouge', 16, 18); en('chevalier', 8, 15); en('squelette', 16, 13); en('guepe', 6, 12); en('ballon', 18, 21);
fill(2, 24, 4, 26, ':');   // passage serpent ↔ tour
// ---- salle C (rangées 26-42) : la tour, rail vertical ; balcon d'étage 1 en haut avec deux chevaliers
room(1, 26, 22, 42); fill(2, 24, 4, 26, ':'); fill(2, 27, 21, 28, ':'); fill(18, 38, 21, 41, ':');
for (let r = 29; r <= 37; r++) put(18, r, '('); stairs(15, 41, 1, 0);
put(5, 27, 'O'); put(8, 27, '$'); put(12, 27, '$'); put(15, 28, '$'); put(10, 27, 'X'); put(3, 40, 'h'); put(8, 36, '"', { deco: 'skullpile' }); put(11, 39, 'x'); put(6, 30, 'x');
en('chevalier', 6, 28); en('chevalier', 14, 28); en('canon_bleu', 10, 34); en('squelette', 6, 32); en('ballon', 13, 38); en('gluant', 4, 39);
fill(19, 42, 21, 44, ':');   // passage tour ↔ pont
// ---- salle B (rangées 44-58) : le pont glissant, rail horizontal au-dessus de la fosse
room(1, 44, 22, 58); fill(19, 42, 21, 44, ':'); fill(19, 45, 21, 53, ':'); fill(2, 47, 3, 57, ':');
for (let c = 4; c <= 18; c++) put(c, 50, '('); stairs(6, 55, -1, 0);
put(6, 56, '$'); put(16, 46, '$'); put(20, 56, 'h'); put(10, 46, 'x'); put(13, 54, 'x'); put(9, 52, '"', { deco: 'bones' });
en('gluant', 9, 47); en('gluant', 14, 53); en('ballon', 7, 54); en('chevalier', 12, 48);
fill(2, 58, 3, 60, ':');   // passage pont ↔ cour
// ---- cour de départ (rangées 60-73) : campement, fontaine, ruche, coffre, deux ballounets
room(1, 60, 22, 73); fill(2, 61, 21, 72, ':'); fill(2, 58, 3, 60, ':'); put(2, 58, '/'); put(3, 58, '/');   // deux rampes montent de la cour (étage 1) au couloir du pont (étage 2)
put(11, 69, '1'); put(6, 64, 'i'); put(16, 64, 'J'); put(5, 67, 'X'); put(9, 62, 'X'); put(14, 62, 'X'); put(18, 70, 'X');
put(7, 66, '$'); put(15, 67, '$'); put(11, 63, '$'); put(4, 63, 'I'); put(19, 63, 'I'); put(8, 71, 'l'); put(14, 71, 'l'); put(18, 67, '"', { deco: 'beehive' }); put(3, 71, 'O'); put(21, 72, 'Z'); put(2, 72, '3');
en('ballon', 6, 70); en('ballon', 16, 69);
// murs de part et d'autre des passages entre salles (sinon on marcherait dans le vide)
for (const [c, r] of [[1, 25], [5, 25], [18, 43], [22, 43], [1, 59], [4, 59]]) put(c, r, '#');
for (let r = 0; r < 59; r++) for (let c = 0; c < COLS; c++) if (g[r][c] === ':' && !(props[c + ',' + r] || {}).lv) props[c + ',' + r] = Object.assign(props[c + ',' + r] || {}, { lv: 2 });
const m = { id: 'claude-1-2', name: 'Niveau 1-2 · version Claude', cols: COLS, rows: ROWS, theme: 'castle', base: ' ', grid: g.map(l => l.join('')), enemies, props, houses: {}, npcs: [], shop: [], updated: Date.now() };
// vérifications : chargement, plateformes, chemin départ → diamant (fosses, rails et rampes compris), monstres sur des cases valides
const W = new BK.World({ map: m.grid, theme: m.theme, mode: 'adventure', hearts: true, explore: true, houses: {}, props });
if (W.movers.length !== 3) throw Error('3 plateformes attendues, ' + W.movers.length);
for (const M of W.movers) if (Math.abs(M.top - 1.2) > 0.01) throw Error('plateforme pas à l’étage 2 : ' + M.top);
// depuis la fosse, aucune case d'étage 2 à portée d'un bond de bombe (un étage, pas deux) ; les paliers d'étage 1 ne touchent pas l'étage 2
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const h = W.hAt(c, r); if (Math.abs(h - 0.6) > 0.01 || W.cell(c, r) || !W.walkableTerrain(c, r) || W.ramp[W.idx(c, r)] || r > 58) continue; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (W.inside(c + dc, r + dr) && !W.cell(c + dc, r + dr) && !W.ramp[W.idx(c + dc, r + dr)] && W.hAt(c + dc, r + dr) > 1.1) throw Error('palier ' + c + ',' + r + ' collé à l’étage 2'); }
if (Math.abs(W.hAt(10, 3) - 2.4) > 0.01 || !W.exit || W.exit.kind !== 'diamond') throw Error('corniche ou diamant');
const pass = ch => !'~ #TrWHlnosuwKijOLINV23456789JMRSUYZ@+?"'.includes(ch) && ch !== 'P'; let s = null, t = null;
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (g[r][c] === '1') s = [c, r]; if (g[r][c] === '|') t = [c, r]; }
const seen = new Set([s.join()]), q = [s]; let found = false; while (q.length) { const [c, r] = q.shift(); if (c === t[0] && r === t[1]) { found = true; break; } for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue; const k = cc + ',' + rr; if (seen.has(k) || !pass(g[rr][cc])) continue; seen.add(k); q.push([cc, rr]); } }
if (!found) throw Error('pas de chemin jusqu’au diamant');
for (const e of enemies) { if (!BK.ENEMIES[e.type]) throw Error('ennemi ' + e.type); if (' #'.includes(g[e.r][e.c]) || W.cell(e.c, e.r)) throw Error('ennemi mal placé ' + e.type + ' ' + e.c + ',' + e.r); }
const A = new BK.Adventure('adam', 0, { custom: BK.mapToStage(m) }); if (A.world.enemies.length !== enemies.length) throw Error('ennemis');
const out = process.argv[2] || 'maps/niveau-1-2-claude.bomberkid.json'; fs.writeFileSync(out, JSON.stringify(m, null, 1)); console.log('✔ ' + out + ' (' + enemies.length + ' monstres, ' + W.movers.length + ' plateformes)');
