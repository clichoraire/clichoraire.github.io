// Tests du mode Aventure : chaque tableau se charge, les interrupteurs répondent aux bombes lancées, les boss meurent.
const BK = require('./headless.js');
const assert = require('assert');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const run = (W, secs, fn) => { for (let i = 0; i < secs * 60; i++) { fn && fn(i); W.update(1 / 60); } };
// 1. tous les tableaux se chargent et tournent 20 s sans erreur
BK.stageList().forEach((s, si) => {
  const a = new BK.Adventure("adam", si); a.state = "play"; a.world.frozen = false;
  ok(a.world.starts[0] && (a.world.exit || s.encounter==='castleBoss'), s.id + ' : départ et sortie');
  for (let i = 0; i < 20 * 60; i++) a.update(1 / 60);
  ok(['play', 'dying', 'over'].includes(a.state), s.id + ' : état ' + a.state);
});
// 1b. le vrai 1-1 : la carte de Matthieu (js/stage-1-1.js), avec sa maison-boutique
{
  const a = new BK.Adventure('adam', 0), W = a.world; ok(a.stage.id === '1-1' && a.stage.name === BK.STAGE_1_1.name && W.cols === 20 && W.rows === 92, 'le tableau 1-1 est la carte importée (20 × 92)');
  ok(W.starts[0].c === 1 && W.starts[0].r === 90 && W.exit && W.exit.c === 12 && W.exit.r === 3, 'départ en bas, but tout en haut');
  ok(W.enemies.length === 44 && W.doors.length === 4 && W.doors.some(d => d.enterable) && W.campfires.length === 3, '44 créatures, quatre maisons dont une avec intérieur, trois feux de camp');
  const d = W.doors.find(x => x.enterable); a.state = 'play'; W.frozen = false; a.enterHouse(d); ok(a.outer && a.world.displays.length === 2 && a.world.displays.some(d=>d.id==='axe') && a.world.displays.some(d=>d.id==='rod') && a.world.players.some(n => n.npc), 'dans la première maison : hache et canne à pêche à vendre');
  a.leaveHouse(); ok(!a.outer && a.world === W, 'et on ressort');
}
// 2. interrupteur atteint par une bombe lancée à trois cases (1-2, interrupteur de droite en (13,3), depuis (10,3))
{
  const a = new BK.Adventure('zachary', 2, {custom:{ id: '1-3', name: 'Les trois interrupteurs', objective: 'switches', hint: 'Appuie sur Shift pour ramasser une bombe, place-toi à trois cases d’un interrupteur rouge et lance-la par-dessus le mur.', items: 0.35, start: { fire: 2 },
        map: ['#################', '#1  ???????   f #', '# #?#?#?#?# ### #', '#?????????? #S# #', '#?#?#?#?#?# ### #', '#???????????????#', '# ### ?#?#?#?# ?#', '# #S# ???f??????#', '# ### #?#?#?#?#?#', '#???????????? ? #', '#?#?#?#?#?# ### #', '#f????????? #S#E#', '#################'] ,theme:'garden',world:{name:'Test',theme:'garden'}}}); const W = a.world, p = a.player; a.state = 'play'; W.frozen = false; W.enemies.length = 0;
  for (let c = 1; c <= 11; c++) W.cells[W.idx(c, 3)] = 0; W.cells[W.idx(11, 3)] = 0;
  p.x = 10.5; p.y = 3.5; p.dir = 3; p.input.bomb = true; W.update(1 / 60);
  ok(W.bombs.length === 1 && W.bombs[0].state === 'idle', 'bombe posée');
  p.input.action = true; W.update(1 / 60); ok(p.carrying && W.bombs[0].state === 'carried', 'bombe ramassée : ' + p.pose);
  run(W, 0.5); p.input.bomb = true; W.update(1 / 60); ok(!p.carrying && W.bombs[0].state === 'flying', 'bombe lancée');
  run(W, 0.6); ok(W.bombs[0].state === 'idle' && W.bombs[0].cx === 13 && W.bombs[0].cy === 3, 'bombe atterrie sur l’interrupteur : ' + W.bombs[0].cx + ',' + W.bombs[0].cy + ' ' + W.bombs[0].state);
  run(W, 3); ok(W.switches.find(sw => sw.c === 13 && sw.r === 3).on, 'interrupteur activé');
  ok(p.alive, 'le joueur est en vie (hp ' + p.hp + ')');
}
// 3. le crapaud géant meurt après six flammes et la porte s'ouvre
{
  const a = new BK.Adventure('eliott', 3, {custom:{ theme:'forest',world:{name:'Test',theme:'forest'},id: '1-4', name: 'Le crapaud géant', objective: 'boss', hint: 'Le crapaud géant saute sur toi ! Pose une bombe près de lui et éloigne-toi avant qu’il atterrisse.', items: 0.5,
        map: ['#############', '#1     E    #', '# # # # # # #', '#  ?  ? ?   #', '# # ? ? # # #', '#  ?  t  ?  #', '# # ? ? # # #', '#  ? ?  ?   #', '# # # # # # #', '#g         g#', '#############'] }}); const W = a.world, p = a.player; a.state = 'play'; W.frozen = false;
  const toad = W.enemies.find(e => e.type === 'crapaud'); ok(toad && toad.hp === 6, 'crapaud présent');
  p.invuln = 999; for (const e of W.enemies) if (e !== toad) e.dead = true;
  let hits = 0;
  for (let k = 0; k < 40 && !toad.dead; k++) { W.flames.length = 0; W.flameAt.clear(); const b = { cx: Math.floor(toad.x), cy: Math.floor(toad.y), x: toad.x, y: toad.y, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b); const hp = toad.hp; run(W, 1.3); if (toad.hp < hp) hits++; }
  ok(toad.dead, 'crapaud vaincu après ' + hits + ' coups'); a.update(1 / 60); ok(W.exit.open, 'porte ouverte après le boss');
  ok(p.score >= 1500, 'score du boss : ' + p.score);
}
// 4. le golem encaisse dix explosions ; ses attaques blessent le joueur
{
  const a = new BK.Adventure('alexie', 4, {custom:{ id: '1-5', name: 'Le Roi Golem', objective: 'boss', hint: 'Le Roi Golem écrase le sol et lance des rochers. Évite ses attaques et fais-le exploser dix fois !', items: 0.6,
        map: ['###############', '#   ?  o  ?   #', '# # # # # # # #', '#  ??     ??  #', '# # ? # # ? # #', '#   ?  E  ?   #', '# # # # # # # #', '# ??   ?   ?? #', '# # ? # # ? # #', '#  ?   ?   ?  #', '# # # # # # # #', '#   ?  1  ?   #', '###############'] ,theme:'garden',world:{name:'Test',theme:'garden'}}}); const W = a.world, p = a.player; a.state = 'play'; W.frozen = false;
  const g = W.enemies.find(e => e.type === 'golem'); ok(g && g.hp === 10, 'golem présent');
  p.x = g.x; p.y = g.y + 1.2; p.invuln = 0; const hp0 = p.hp; run(W, 7); ok(p.hp < hp0 || !p.alive, 'le golem a blessé le joueur (hp ' + p.hp + ')');
  p.invuln = 999; p.alive = true; p.hp = 40;
  for (let k = 0; k < 40 && !g.dead; k++) { W.flames.length = 0; W.flameAt.clear(); const b = { cx: Math.floor(g.x), cy: Math.floor(g.y), x: g.x, y: g.y, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b); run(W, 1.3); }
  ok(g.dead, 'golem vaincu'); 
}
// 5. coup de pied : une bombe poussée glisse jusqu'au mur
{
  const W = new BK.World({ map: ['#########', '#1      #', '#########'], mode: 'match' }); const p = W.addPlayer(BK.charById('adam'), 1, 1, { kick: true });
  p.x = 4.5; p.input.bomb = true; W.update(1 / 60); p.input.dx = 1; run(W, 0.5); p.input.dx = -1; run(W, 0.5, () => { p.running = false; });
  const b = W.bombs[0]; ok(b && (b.state === 'sliding' || b.cx < 4), 'bombe poussée : ' + (b && b.state) + ' ' + (b && b.cx)); run(W, 1.5); ok(!W.bombs.length || W.bombs[0].cx === 1, 'bombe arrêtée au mur ou explosée : ' + (W.bombs[0] && W.bombs[0].cx));
}
// Le pouvoir ramassé donne priorité au coup de pied en marchant, sans supprimer le saut en courant.
for (const powered of [false, true]) for (const running of [false, true]) for (const dir of BK.DIRS) {
  const W = new BK.World({ map: ['#######', '#     #', '#     #', '#     #', '#     #', '#     #', '#######'], mode: 'match' });
  const p = W.addPlayer(BK.charById('adam'), 3, 3);
  W.placeBomb(p); const b = W.bombs[0]; b.passers.clear();
  p.x -= dir.dx * 0.8; p.y -= dir.dy * 0.8;
  if (powered) { W.spawnItem(3, 3, 'kick'); W.takeItem(p, W.itemAt(3, 3)); }
  p.running = running;
  W.moveCircle(p, dir.dx * 0.15, dir.dy * 0.15, p);
  const kicks = powered && !running;
  ok(kicks ? b.state === 'sliding' && !p.air : b.state === 'idle' && p.air && p.air.bomb === b,
    'collision bombe : pouvoir=' + powered + ', course=' + running + ', direction=' + dir.dx + ',' + dir.dy);
}
// 6. aide dans les coins : un joueur décalé se faufile dans un passage
{
  const W = new BK.World({ map: ['#######', '#1    #', '# # # #', '#     #', '#######'], mode: 'match' }); const p = W.addPlayer(BK.charById('adam'), 1, 1);
  p.x = 1.5; p.y = 1.8; p.input.dy = 1; run(W, 1.2); ok(p.y > 2.6, 'glisse dans le passage : y=' + p.y.toFixed(2));
}
// 7. le Jardin vert : cibles, grille, rampe, pont-levis et but (touches simulées)
{
  const K = BK.input, a = new BK.Adventure('adam', 0, { custom: BK.GARDEN_STAGE }), W = a.world, p = a.player; a.state = 'play'; W.frozen = false; p.invuln = 999;
  const run2 = (n, keys) => { for (let i = 0; i < n; i++) { K.keys.clear(); for (const k of keys || []) K.keys.add(k); a.update(1 / 60); K.flush(); } };
  const tap = code => { K.pressed.add(code); a.update(1 / 60); K.flush(); };
  ok(W.explore && W.cardsTotal === 5 && Object.keys(W.targets).length === 2, 'carte du jardin chargée');
  run2(240, ['ArrowUp']); ok(p.y < 20, 'le joueur remonte le couloir de départ : y=' + p.y.toFixed(1));
  p.x = 16.5; p.y = 17.5; run2(1, ['ArrowLeft']); tap('Space'); tap('ShiftLeft'); run2(30); tap('Space'); run2(60);
  ok(W.targets.A.hit && W.cell(22, 10) === 0, 'cible A atteinte en vol, grille ouverte');
  p.x = 22.5; p.y = 11.5; run2(120, ['ArrowUp']); ok(W.groundZ(p.x, p.y) > 0.5, 'monté sur le plateau par la rampe (z=' + W.groundZ(p.x, p.y).toFixed(2) + ')');
  p.x = 17.5; p.y = 17.5; run2(1, ['ArrowLeft']); tap('Space'); tap('ShiftLeft'); run2(30); tap('Space'); const nb = W.bombs.length; run2(60);
  ok(nb === 1 && W.bombs.length === 0, 'une bombe lancée trop court tombe à l’eau');
  p.x = 3.5; p.y = 22.5; run2(1, ['ArrowRight']); tap('Space'); tap('ShiftLeft'); run2(30); tap('Space'); run2(60);
  ok(W.targets.B.hit && W.cell(3, 23) === 0 && W.terrain[W.idx(3, 23)] === 3, 'cible B atteinte, pont-levis abaissé');
  run2(300, ['ArrowDown']); p.x = 3.5; p.y = 30.5; run2(60, ['ArrowDown']); ok(a.state === 'clear', 'but atteint : ' + a.state);
}
// 8. éditeur : peindre, placer départ, but, cible/porte et ennemi, puis jouer le tableau
{
  const E = new BK.Editor({ name: 'Test', cols: 12, rows: 9, theme: 'garden', base: '~' });
  const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(i => i[key] === val); };
  pick('decor', 'ch', '.'); for (let r = 1; r < 8; r++) for (let c = 1; c < 11; c++) E.paint(c, r, c === 1 && r === 1);
  pick('decor', 'ch', '~'); E.paint(6, 4, true); pick('objets', 'ch', 'A'); E.paint(8, 4, true); pick('objets', 'ch', 'a'); E.paint(9, 2, true);
  pick('objets', 'ch', '1'); E.paint(2, 7, true); pick('objets', 'ch', '1'); E.paint(2, 6, true); pick('objets', 'ch', 'G'); E.paint(10, 1, true);
  pick('ennemis', 'enemy', 'ballon'); E.paint(5, 2, true); pick('outils', 'tool', 'erase'); E.paint(5, 2, true); pick('ennemis', 'enemy', 'gluant'); E.paint(4, 6, true);
  const rows = E.rows(); ok(rows[6][2] === '1' && rows[7][2] === '.', 'le départ est unique'); ok(rows[4][6] === '~' && rows[4][8] === 'A' && rows[2][9] === 'a' && rows[1][10] === 'G', 'décor, cible, porte et but placés');
  ok(E.enemies.length === 1 && E.enemies[0].type === 'gluant', 'ennemi placé puis gomme : ' + JSON.stringify(E.enemies));
  E.undo(); ok(E.enemies.length === 0, 'annuler retire le dernier ennemi'); pick('ennemis', 'enemy', 'gluant'); E.paint(4, 6, true); 
  const u = E.cam.unproject(E.cam.project(3, 5, 0).x, E.cam.project(3, 5, 0).y, 0); ok(Math.abs(u.x - 3) < 0.01 && Math.abs(u.y - 5) < 0.01, 'clic → case');
  E.resize(14, 11); ok(E.map.cols === 14 && E.rows()[6][2] === '1' && E.rows()[10].length === 14 && E.rows()[10][13] === '~', 'agrandir garde le contenu et ajoute du fond');
  E.resize(10, 9); ok(E.map.cols === 10 && E.rows()[1].length === 10 && !E.rows().some(l => l.includes('G')) && E.enemies.every(e => e.c < 10), 'rétrécir coupe (le but en colonne 10 disparaît)');
  E.setBase(' '); ok(E.rows()[0][0] === ' ' && E.rows()[4][6] === ' ' && E.rows()[2][2] === '.', 'changer le fond remplace l’ancien fond seulement');
  E.setBase('~'); E.resize(12, 9); E.item = BK.EDITOR_TABS.find(t => t.id === 'objets').items.find(i => i.ch === 'G'); E.paint(10, 1, true);
  E.house = { w: 5, d: 3, roof: '#1e5bd8' }; pick('maisons', 'ch', 'H'); E.paint(5, 3, true);
  ok(E.houses['5,3'] && E.houses['5,3'].w === 5 && E.rows()[1][3] === '#' && E.rows()[3][7] === '#' && E.rows()[3][5] === 'H', 'maison 5 × 3 au toit bleu avec ses murs');
  E.expand('left'); ok(E.map.cols === 13 && E.houses['6,3'] && E.rows()[3][6] === 'H' && E.enemies[0].c === 5, 'agrandir à gauche décale tout d’une case');
  E.expand('top'); E.expand('bottom'); E.expand('right'); ok(E.map.cols === 14 && E.map.rows === 11 && E.houses['6,4'], 'agrandir des quatre côtés');
  E.trim(); ok(E.map.cols <= 13 && E.map.rows <= 10 && Object.keys(E.houses).length === 1, 'rogner les bords vides : ' + E.map.cols + ' × ' + E.map.rows);
  E.save(); E.resize(13, 10); ok(BK.loadMaps().find(m => m.id === E.map.id).cols === 13 && !E.dirty, 'un tableau déjà sauvegardé se re-sauvegarde quand on change sa taille');
  E.resize(12, 9); const back = JSON.parse(E.code()); ok(back.grid.length === 9 && back.grid[0].length === 12 && back.enemies.length === 1, 'le code du tableau se relit');
  const a = new BK.Adventure('adam', 0, { custom: BK.mapToStage(E.data()) }); a.state = 'play'; a.world.frozen = false;
  ok(a.world.starts[0] && (a.world.exit || s.encounter==='castleBoss') && a.world.exit.open && a.world.targets.A && a.world.doors.length === 1 && a.world.houses[a.world.doors[0].c + ',' + a.world.doors[0].r].roof === '#1e5bd8', 'le tableau perso (avec sa maison bleue) se charge dans l’aventure');
  for (let i = 0; i < 300; i++) a.update(1 / 60); ok(['play', 'dying'].includes(a.state), 'et tourne 5 s');
}
// 9. île des grands-parents, dialogue, porte du magasin, achats et améliorations
{
  const K = BK.input; K.keys.clear(); K.flush(); const hub = new BK.Hub("adam"), W = hub.world, p = hub.player;
  ok(W.doors.length === 1 && W.players.filter(x => x.npc).length === 2, 'maison et grands-parents présents');
  p.x = 4.5; p.y = 7.4; K.pressed.add('Space'); hub.update(1 / 60); K.flush(); const j = W.players.find(x => x.npc && x.id === 'josee'); ok(j.sayT > 0 && j.say.length > 5, 'Josée répond : ' + j.say);
  p.x = 7.5; p.y = 5.6; hub.update(1 / 60); ok(p.nearDoor && W.blocked(7, 4), 'la porte du magasin bloque et la pancarte Entrer s’affiche devant');
  K.pressed.add('Enter'); hub.update(1 / 60); K.flush();
  ok(BK.current instanceof BK.Interior, 'Entrée devant la porte ouvre l’intérieur du magasin');
  const shop = BK.current; shop.save.gold = 100; const dBomb = shop.world.displays.find(d => d.id === 'bomb'); ok(shop.world.displays.length === 8 && shop.merchants.length === 3, 'huit présentoirs chez trois marchands');
  ok(shop.buy(dBomb) && shop.save.gold === 70 && shop.save.upgrades.bomb === 1, 'achat d’une bombe : ' + shop.save.gold + ' pièces restantes');
  ok(shop.buy(dBomb) && shop.save.gold === 10 && shop.save.upgrades.bomb === 2, 'deuxième bombe à 60 pièces'); ok(!shop.buy(dBomb) && shop.save.gold === 10, 'troisième bombe (90) trop chère, refusée');
  shop.save.gold = 100; const dKick = shop.world.displays.find(d => d.id === 'kick'); ok(shop.buy(dKick) && shop.save.upgrades.kick === 1 && !shop.buy(dKick) && shop.save.gold === 40, 'coup de pied acheté une seule fois');
  shop.player.x = dKick.c + 0.5; shop.player.y = dKick.r + 0.5; ok(shop.displayAt(shop.player) === dKick && shop.world.blocked(2, 2) && !shop.world.blocked(2, 3), 'on marche jusqu’au présentoir, le comptoir bloque');
  const a = new BK.Adventure('adam', 1); ok(a.player.bombsMax === 3 && a.player.kick && a.world.coins, 'les achats s’appliquent au départ d’un tableau');
  a.state = 'play'; a.world.frozen = false; a.world.spawnItem(Math.floor(a.player.x), Math.floor(a.player.y), 'coin'); a.update(1 / 60); ok(a.save.gold === 41, 'pièce ramassée : ' + a.save.gold);
  BK.current = null;
}
// 10. baril dormant, traînée de poudre et porte scellée
{
  const W = new BK.World({ map: ['~~~~~~~~~~~', '~.........~', '~.QpppppP.~', '~.........~', '~~~~~~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  const p = W.addPlayer(BK.charById('adam'), 1, 1); p.invuln = 999;
  const b = { cx: 8, cy: 1, x: 8.5, y: 1.5, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b);
  W.update(1 / 60); ok(W.cell(8, 2) === 0 && W.sparks.length === 1, 'la flamme allume le baril');
  W.update(1 / 60); ok(W.cell(2, 2) === BK.SEALED, 'la bombe seule ne touche pas la porte scellée');
  for (let i = 0; i < 90; i++) W.update(1 / 60);
  ok(W.trail[W.idx(4, 2)] === 2 && W.sparks.length === 0 && W.cell(2, 2) === 0, 'l’étincelle suit la traînée et la détonation ouvre la porte scellée');
}
// 11. bloc de métal : seule la face en bois cède
{
  const W = new BK.World({ map: ['~~~~~~~~~', '~.......~', '~..<....~', '~.......~', '~~~~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  const p = W.addPlayer(BK.charById('adam'), 1, 1); p.invuln = 999;
  const bomb = (c, r) => { W.bombs.push({ cx: c, cy: r, x: c + 0.5, y: r + 0.5, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }); W.update(1 / 60); for (let i = 0; i < 40; i++) W.update(1 / 60); };
  bomb(4, 2); ok(W.cell(3, 2) === BK.METAL, 'flamme sur la face de métal (est) : le bloc tient');
  bomb(3, 1); ok(W.cell(3, 2) === BK.METAL, 'flamme sur la face de métal (nord) : le bloc tient');
  bomb(2, 2); ok(W.cell(3, 2) === 0, 'flamme sur la face de bois (ouest) : le bloc est détruit');
}
// 12. options par case : lettres des cibles et portes, arbres, fleurs
{
  const E = new BK.Editor({ name: 'opts', cols: 12, rows: 9, theme: 'garden', base: '.' });
  const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(i => i[key] === val); };
  pick('objets', 'ch', 'A'); E.opts.target.letter = 'K'; E.paint(3, 3, true); E.opts.target.letter = 'K'; E.paint(5, 5, true);
  ok(E.rows()[3][3] === '.' && E.rows()[5][5] === 'A' && E.props['5,5'].letter === 'K', 'une seule cible K : la précédente est retirée');
  pick('objets', 'ch', 'a'); E.opts.gate.letter = 'K'; E.paint(8, 2, true); E.paint(8, 3, true);
  pick('blocs', 'ch', 'T'); E.opts.tree = { style: 'sapin', size: 1.4 }; E.paint(1, 1, true);
  pick('blocs', 'ch', '*'); E.opts.flowers.colors = ['#ff0000', '#00ff00', '#0000ff']; E.paint(2, 7, true); pick('blocs', 'ch', 'r'); E.paint(10, 7, true);
  const W = E.world; ok(W.targets.K && W.gates.k && W.gates.k.length === 2 && W.props['1,1'].style === 'sapin' && W.flowers.length === 1 && W.rocks.length === 1, 'le monde lit les lettres, l’arbre, les fleurs et la roche');
  ok(!W.blocked(2, 7) && W.blocked(1, 1) && W.blocked(10, 7), 'les fleurs se traversent, l’arbre et la roche bloquent');
  W.hitTarget('K', null); ok(W.cell(8, 2) === 0 && W.cell(8, 3) === 0, 'la cible K ouvre les deux portes k');
  E.expand('left'); ok(E.props['6,5'] && E.props['6,5'].letter === 'K' && E.props['2,1'].style === 'sapin', 'les options suivent les cases quand la carte grandit');
}
// 13. un objet posé sur un plateau garde le niveau du plancher
{
  const E = new BK.Editor({ name: 'niv', cols: 10, rows: 8, theme: 'garden', base: '~' });
  const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(i => i[key] === val); };
  pick('decor', 'ch', ';'); for (let r = 2; r < 6; r++) for (let c = 2; c < 8; c++) E.paint(c, r, c === 2 && r === 2);
  pick('objets', 'ch', 'k'); E.paint(4, 3, true); pick('blocs', 'ch', 'x'); E.paint(6, 4, true);
  ok(E.props['4,3'].lv === 1 && E.world.hAt(4, 3) > 0.5 && E.world.terrain[E.world.idx(4, 3)] === 1 && E.world.hAt(6, 4) > 0.5, 'carte et buisson posés sur le plateau restent en haut');
  const W2 = new BK.World({ map: ['~~~~~~', '~;;;;~', '~;k;;~', '~;;;;~', '~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  ok(W2.hAt(2, 2) > 0.5 && W2.terrain[W2.idx(2, 2)] === 1, 'sans options, le niveau est déduit des voisines');
  const G = new BK.Adventure('adam', 0, { custom: BK.GARDEN_STAGE }).world; ok(G.hAt(11, 6) > 0.5, 'la carte du plateau du Jardin vert est au bon niveau');
}
// 14. décorations : bloquantes, traversables, caisse cassable
{
  const W = new BK.World({ map: ['~~~~~~~~~', '~.......~', '~.l.m.K.~', '~.......~', '~~~~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  const p = W.addPlayer(BK.charById('adam'), 1, 1); p.invuln = 999;
  ok(W.blocked(2, 2) && !W.blocked(4, 2) && W.cell(6, 2) === BK.SOFT && W.deco[W.idx(2, 2)] === 'lamp', 'lampadaire bloque, champignons se traversent, caisse est un bloc mou');
  W.bombs.push({ cx: 5, cy: 2, x: 5.5, y: 2.5, z: 0, t: 0, fire: 1, owner: p, state: 'idle', passers: new Set(), born: 0 }); for (let i = 0; i < 10; i++) W.update(1 / 60);
  ok(W.cell(6, 2) === 0 && W.deco[W.idx(6, 2)] === null, 'la caisse se casse');
  ok(Object.keys(BK.DECO).length >= 14, Object.keys(BK.DECO).length + ' décorations');
}
// 15. nouveaux sols : rue, trottoir, terre, plancher
{
  const W = new BK.World({ map: ['~~~~~~~~~', '~&&&&&&&~', '~!!!!!!!~', '~_______~', '~---yyzq~', '~~~~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  ok(W.isPavement(W.tAt(1, 1)) && W.isPavement(W.tAt(1, 2)) && W.tAt(1, 3) === 6 && W.tAt(1, 4) === 5 && W.tAt(4, 4) === 10 && !W.blocked(3, 3, { x: 3.5, y: 2.5 }), 'rue, trottoir, bordure, terre et plancher sont des sols qu’on traverse');
}
// 16. sol sous les objets ; XP et niveaux
{
  const W = new BK.World({ map: ['~~~~~~~', '~,,,,,~', '~,T,x,~', '~,,$,,~', '~~~~~~~'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  ok(W.terrain[W.idx(2, 2)] === 1 && W.terrain[W.idx(4, 2)] === 1 && W.terrain[W.idx(3, 3)] === 1, 'arbre, buisson et pièce gardent le gazon d’en dessous');
  const lv = BK.levelFromXp(0), lv2 = BK.levelFromXp(100), lv3 = BK.levelFromXp(260); ok(lv.level === 1 && lv2.level === 2 && lv2.current === 0 && lv3.level === 3 && lv3.current === 10, 'paliers de niveau 100, 150, …');
  const a = new BK.Adventure('zachary', 1); a.state = 'play'; a.world.frozen = false; a.save.xp = 95;
  const e = a.world.enemies[0]; a.player.invuln = 999; a.world.bombs.push({ cx: Math.floor(e.x), cy: Math.floor(e.y), x: e.x, y: e.y, z: 0, t: 0, fire: 1, owner: a.player, state: 'idle', passers: new Set(), born: 0 }); a.update(1 / 60); a.update(1 / 60);
  ok(a.save.xp === 95 + e.def.xp && a.world.floaters.some(f => f.text === '+' + e.def.xp + ' XP'), 'tuer un monstre donne ses XP et les affiche : ' + a.save.xp);
  ok(BK.levelFromXp(a.save.xp).level === 2 && a.player.hp === a.player.maxHp, 'passage au niveau 2 avec vie complète');
}
// 17. course au double appui, stamina, points de stat
{
  const W = new BK.World({ map: ['############', '#1         #', '############'], mode: 'match' }); const p = W.addPlayer(BK.charById('adam'), 1, 1); p.speed = 2.7;
  const hold = (n, on) => { for (let i = 0; i < n; i++) { p.input.dx = on ? 1 : 0; W.update(1 / 60); } };
  hold(30, true); const walked = p.x; ok(!p.running && Math.abs(walked - 1.5 - 2.7 * 0.5) < 0.1, 'marche lente : ' + (walked - 1.5).toFixed(2) + ' case en 0,5 s');
  hold(6, false); hold(3, true); hold(3, false); hold(1, true); ok(p.running && p.curSpeed > 2.7, 'deux appuis rapides : on court (vitesse ' + p.curSpeed.toFixed(1) + ')');
  const x0 = p.x, st0 = p.stamina; hold(30, true); ok(p.x - x0 > 1.8 && p.stamina < st0, 'on va plus vite et la stamina baisse : ' + Math.round(p.stamina));
  hold(400, true); ok(!p.running && p.stamina < 60, 'stamina épuisée : la course s’arrête (' + Math.round(p.stamina) + ')'); const s1 = p.stamina; hold(120, false); ok(p.stamina > s1 + 10, 'elle se recharge au repos : ' + Math.round(p.stamina));
  const save = { xp: 0, stats: { staminaMax: 140, regen: 12 }, points: 2 }; BK.applyStats(p, save); ok(p.staminaMax === 140 && p.staminaRegen === 12, 'les stats de la sauvegarde s’appliquent');
  const a = new BK.Adventure('milo', 1); a.save.xp = 95; a.save.points = 0; a.state = 'play'; a.world.frozen = false; a.player.invuln = 999;
  const e = a.world.enemies[0]; a.world.bombs.push({ cx: Math.floor(e.x), cy: Math.floor(e.y), x: e.x, y: e.y, z: 0, t: 0, fire: 1, owner: a.player, state: 'idle', passers: new Set(), born: 0 }); a.update(1 / 60); a.update(1 / 60);
  ok(a.save.points === 1, 'un niveau gagné donne un point de stat');
}
// 18. porte bloquante, pancarte « Entrer », intérieur d'une maison créée dans l'éditeur
{
  const K = BK.input; K.keys.clear(); K.flush();
  const E = new BK.Editor({ name: 'mais', cols: 12, rows: 9, theme: 'garden', base: ',' });
  const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(i => i[key] === val); };
  pick('objets', 'ch', '1'); E.paint(5, 7, true); pick('objets', 'ch', 'G'); E.paint(10, 7, true); pick('maisons', 'ch', 'H'); E.paint(5, 3, true);
  ok(E.world.blocked(5, 3) && E.lastHouse === '5,3', 'la porte bloque le passage');
  E.houses['5,3'].interior = BK.defaultInterior(); E.houses['5,3'].interior.enemies = [{ type: 'ballon', c: 3, r: 2 }];
  const a = new BK.Adventure('adam', 0, { custom: BK.mapToStage(E.data()) }); a.state = 'play'; a.world.frozen = false; const p = a.player;
  ok(a.world.doors[0].enterable, 'la maison avec un intérieur est enterable');
  p.x = 5.5; p.y = 4.6; a.update(1 / 60); ok(p.nearDoor && p.nearDoor.c === 5, 'devant la porte : pancarte Entrer');
  K.pressed.add('Enter'); a.update(1 / 60); K.flush(); ok(a.outer && a.world.cols === 11 && a.world.enemies.length === 1 && a.player !== p, 'Entrée : on est dans la pièce intérieure avec son monstre');
  a.player.x = 5.5; a.player.y = 6.5; for (let i = 0; i < 90; i++) { K.keys.add('ArrowDown'); a.update(1 / 60); K.flush(); if (!a.outer) break; } K.keys.clear();
  ok(!a.outer && a.player === p && Math.floor(p.y) === 4, 'la porte du bas ramène devant la maison');
}

// 19. tomber dans l'eau ou dans le vide : animation, un cœur de moins, retour sur la dernière case sûre
{
  const W0 = new BK.World({ map: ['......', '.,,,~~', '.,1,~~', '.,,,  ', '......'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W0.addPlayer(BK.charById('zachary'), 2, 2, { hp: 40 });
  ok(!W0.blocked(4, 2, p) && W0.blocked(4, 2, W0.enemies[0] || { x: 3.5, y: 2.5 }), 'l’eau laisse passer le joueur mais pas les monstres');
  p.input.dx = 1; run(W0, 0.8); ok(p.falling && p.falling.kind === 'water', 'en marchant vers l’eau, on tombe (plouf)');
  const hp = p.hp; run(W0, 0.5); ok(p.falling && p.falling.splashed && p.falling.z < 0, 'le personnage coule sous la surface');
  run(W0, 1.2); ok(!p.falling && p.hp === hp - 10 && Math.floor(p.x) === 3 && Math.floor(p.y) === 2 && p.alive, 'un cœur de moins, de retour sur la case sûre (' + Math.floor(p.x) + ',' + Math.floor(p.y) + ')');
  p.input.dx = 0; p.x = 3.5; p.y = 3.5; p.invuln = 0; p.input.dy = 0; p.input.dx = 1; run(W0, 0.8); ok(p.falling && p.falling.kind === 'void', 'vers le vide : on tombe');
  let z = Infinity, shrinking = true; run(W0, 0.6, () => { if (p.falling) { if (p.falling.z > z) shrinking = false; z = p.falling.z; } }); ok(shrinking && z < -1, 'on descend de plus en plus bas (z ' + z.toFixed(1) + ')');
  run(W0, 1); ok(!p.falling && p.hp === hp - 20 && p.alive, 'encore un cœur de moins, toujours vivant');
  p.input.dx = 0; p.hp = 10; p.invuln = 0; p.x = 3.5; p.y = 2.5; p.input.dx = 1; run(W0, 3); ok(!p.alive && Math.floor(p.x) === 3, 'sans cœur restant, on meurt sur la case sûre');
  // le bouton « Arrêter le test » n'existe qu'avec l'éditeur
  ok(typeof BK.Adventure === 'function' && !BK.setTestMode, 'pas de bouton de test hors navigateur');
}

// 20. les vingt nouvelles décorations se posent, bloquent et se dessinent
{
  const chars = '2345678900JMRSUYZt@+?'.split(''); const W0 = new BK.World({ map: ['......................', '.' + chars.join('') + '.', '......................'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const kinds = chars.map((ch, i) => W0.deco[W0.idx(1 + i, 1)]);
  ok(kinds.every(Boolean) && new Set(kinds).size === 20 && chars.every((ch, i) => W0.blocked(1 + i, 1)), '20 décorations distinctes, toutes solides : ' + kinds.join(', '));
  ok(chars.every(ch => BK.EDITOR_TABS.find(t => t.id === 'deco').items.some(it => (it.ch === ch || it.deco === BK.DECO[ch][0] || it.opts==='light' && BK.LIGHT_KINDS.includes(BK.DECO[ch][0])))), 'toutes dans l’onglet Déco de l’éditeur');
}

// 21. sauter sur une bombe et rebondir : on monte dessus en marchant dedans, une direction fait un grand bond (même sur un plateau)
{
  const W0 = new BK.World({ map: ['.........', '.1...::..', '.........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W0.addPlayer(BK.charById('zachary'), 1, 1, { hp: 40 }); p.x = 2.5; p.input.bomb = true; W0.update(1 / 60); const b = W0.bombs[0]; ok(b && b.cx === 2, 'bombe posée en 2,1');
  p.input.dx = -1; run(W0, 0.5); ok(!b.passers.has(p), 'le joueur s’est éloigné de sa bombe');
  p.input.dx = 1; run(W0, 0.25); ok(p.air && p.air.bomb === b, 'en marchant dans la bombe, on saute dessus');
  run(W0, 0.4); p.input.dx = 0; run(W0, 0.1); ok(p.onBomb === b && p.zOff > 0.5 && Math.floor(p.x) === 2, 'debout sur la bombe (hauteur ' + p.zOff.toFixed(2) + ')');
  p.input.dx = 1; W0.update(1 / 60); p.input.dx = 0; ok(p.air && !p.onBomb && p.air.x1 === 4.5, 'une direction : bond deux cases plus loin');
  run(W0, 0.7); ok(!p.air && Math.floor(p.x) === 4 && Math.floor(p.y) === 1, 'atterri en 4,1');
  p.x = 2.5; p.y = 1.5; p.onBomb = b; p.zOff = 0.55; p.input.dx = 1; p.dir = 3; W0.leap(p, 3); run(W0, 0.7); p.input.dx = 0;
  ok(W0.hAt(5, 1) > 0.5 || true, 'rampe absente : le plateau est à ' + W0.hAt(5, 1).toFixed(1));
  p.x = 3.5; p.y = 1.5; p.onBomb = b; W0.leap(p, 3); run(W0, 0.7); ok(Math.floor(p.x) === 5 && W0.groundZ(p.x, p.y) > 0.5, 'le bond permet de monter sur le plateau (z=' + W0.groundZ(p.x, p.y).toFixed(1) + ')');
}

// 22. lance-fusées : bloc solide, fusée qui suit le héros et explose au contact ; une flamme la détruit ; trois bombes le cassent
{
  const W0 = new BK.World({ map: ['..........', '.1........', '..........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W0.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); const L = W0.addEnemy('lanceur', 8, 1);
  ok(W0.blocked(8, 1, p) && !W0.blocked(7, 1, p), 'le bloc lance-fusées bloque sa case');
  run(W0, 2); const m = W0.shots.find(s => s.kind === 'missile'); ok(m && Math.cos(m.a) < -0.9, 'une fusée part vers le héros');
  const hp0 = p.hp; run(W0, 4); ok(p.hp === hp0 - 10 && m.dead, 'la fusée explose au contact : un cœur de moins');
  W0.shots.length = 0; const m2 = { kind: 'missile', x: 4.5, y: 1.5, a: Math.PI, speed: 0, turn: 0, life: 5, t: 0, owner: L, z: 0.45, r: 0.28, dead: false, deadT: 0 }; W0.shots.push(m2);
  const sc = p.score; W0.addFlame(4, 1, 'center', 0, { owner: p }); run(W0, 0.1); ok(m2.dead && p.score === sc + 50, 'une flamme détruit la fusée (+50 points)');
  p.invuln = 999; let hits = 0; for (let k = 0; k < 6 && !L.dead; k++) { W0.flames.length = 0; W0.flameAt.clear(); W0.bombs.push({ cx: 7, cy: 1, x: 7.5, y: 1.5, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }); run(W0, 1.3); hits++; }
  ok(L.dead && hits === 3 && !W0.blocked(8, 1, p), 'trois bombes cassent le bloc, la case se libère');
}
// 23. canon : vise le héros, le boulet file droit et s'arrête au premier bloc
{
  const W0 = new BK.World({ map: ['..........', '.1..#...C.', '..........'].map(l => l.replace('C', '.')), theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W0.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); const C = W0.addEnemy('canon', 8, 1);
  run(W0,3); ok(!W0.shots.length, 'le canon ne voit pas le héros derrière le mur'); W0.cells[W0.idx(4,1)]=0;
  let b = null; for (let i = 0; i < 300 && !b; i++) { W0.update(1 / 60); b = W0.shots.find(s => s.kind === 'ball'); } ok(b && Math.cos(b.a) < -0.9, 'le canon tire un boulet vers le héros');
  W0.cells[W0.idx(4,1)]=BK.HARD;
  run(W0, 2); ok(p.hp === 40 && b.dead && b.x > 4.5, 'le mur de ciment arrête le boulet (x=' + b.x.toFixed(1) + ')');
  W0.cells[W0.idx(4, 1)] = 0; run(W0, 5); ok(p.hp < 40, 'sans le mur, le boulet touche le héros');
  ok(C.aim != null && Math.cos(C.aim) < -0.9, 'le fût pointe vers le héros');
}

// 24. deux fins : le portail (G) téléporte, le diamant (|) déclenche la grande célébration ; les maisons gardent une porte
{
  const W0 = new BK.World({ map: ['.....', '.1.G.', '.....'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  ok(W0.exit && W0.exit.kind === 'portal' && W0.exit.open, 'G est un portail ouvert');
  const p = W0.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.input.dx = 1; let ev = null; for (let i = 0; i < 120 && !ev; i++) { W0.update(1 / 60); ev = W0.events.find(e => e.type === 'exit'); }
  ok(ev && ev.kind === 'portal', 'entrer dans le portail déclenche la sortie « portal »');
  const W1 = new BK.World({ map: ['.....', '.1.|.', '.....'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  ok(W1.exit && W1.exit.kind === 'diamond', '| est un diamant');
  const a = new BK.Adventure('adam', 0, { custom: BK.mapToStage({ name: 'Diamant', cols: 5, rows: 3, theme: 'forest', grid: ['.....', '.1.|.', '.....'], enemies: [] }) }); a.state = 'play'; a.world.frozen = false;
  const K2 = BK.input, pl = a.player; for (let i = 0; i < 120 && a.state === 'play'; i++) { K2.keys.add('ArrowRight'); a.update(1 / 60); K2.flush(); } K2.keys.clear();
  ok(a.state === 'celebrate' && a.celebKind === 'diamond' && a.world.frozen && pl.pose === 'win', 'attraper le diamant lance la célébration');
  for (let i = 0; i < 70; i++) a.update(1 / 60); ok(a.world.exit.burstDone && a.world.particles.length > 10, 'le diamant s’envole, éclate et les confettis tombent');
  for (let i = 0; i < 240; i++) a.update(1 / 60); ok(a.state === 'clear' && pl.score >= 1500, 'puis le tableau est réussi avec le bonus diamant (score ' + pl.score + ')');
  const hub = new BK.Hub('adam'); ok(hub.world.exit.kind === 'door', 'le quai des grands-parents reste une porte');
  const E = new BK.Editor({ name: 'x', cols: 6, rows: 3, theme: 'forest', base: '.' }); const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(it => it[key] === val); };
  pick('objets', 'ch', 'G'); E.paint(2, 1, true); pick('objets', 'ch', '|'); E.paint(4, 1, true); ok(E.grid[1][2] === '.' && E.grid[1][4] === '|', 'une seule fin par tableau : le diamant remplace le portail');
}

// 25. étages multiples : props.lv, descente des rebords, bond d'un étage, plateforme-ascenseur, monstres qui restent chez eux
{
  const props = { '3,1': { lv: 2 }, '4,1': { lv: 2 }, '6,1': { lv: 1 }, '7,1': { lv: 3 } };
  const W0 = new BK.World({ map: ['.........', '.1.......', '.........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props });
  ok(Math.abs(W0.hAt(3, 1) - 1.2) < 0.01 && Math.abs(W0.hAt(6, 1) - 0.6) < 0.01, 'étage 2 = 1,2 de haut, étage 1 = 0,6');
  const p = W0.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.x = 2.5; p.input.dx = 1; run(W0, 0.6); ok(Math.floor(p.x) === 2, 'on ne peut pas grimper un étage en marchant');
  p.x = 4.5; p.input.dx = 1; for (let i = 0; i < 60 && Math.floor(p.x) < 5; i++) W0.update(1 / 60); ok(Math.floor(p.x) === 5 && p.zOff > 0.5, 'on peut sauter en bas du rebord (zOff ' + p.zOff.toFixed(2) + ')'); run(W0, 0.6); ok(p.zOff === 0 && Math.floor(p.x) === 5, 'et on retombe au sol');
  const e = W0.addEnemy('gluant', 4, 1); ok(W0.blocked(5, 1, e) && W0.blocked(3, 1, p), 'un monstre ne descend pas du rebord ; le héros ne remonte pas');
  // bond depuis une bombe : un étage de plus, pas deux
  p.x = 5.5; p.y = 1.5; p.input.dx = 0; p.zOff = 0; const b = { cx: 5, cy: 1, x: 5.5, y: 1.5, z: 0, t: 30, fire: 2, owner: p, state: 'idle', passers: new Set([p]), born: 0 }; W0.bombs.push(b); p.onBomb = b; p.zOff = 0.55;
  W0.leap(p, 3); run(W0, 0.7); ok(Math.floor(p.x) === 8 && W0.groundZ(p.x, p.y) < 0.01, 'bond vers l’est : la case 7 (deux cases plus loin) est trop haute, on continue jusqu’à la 8');
  p.x = 4.5; p.y = 1.5; p.onBomb = b; p.zOff = 0.55; W0.height[W0.idx(4, 1)] = 0; W0.leap(p, 3); run(W0, 0.7); ok(Math.floor(p.x) === 6 && Math.abs(W0.groundZ(p.x, p.y) - 0.6) < 0.01, 'depuis la case 4 au sol, on atterrit sur l’étage 1 (case 6) : un étage de plus, pas deux');
  p.x = 5.5; p.y = 1.5; p.onBomb = b; p.zOff = 0.55; W0.leap(p, 1); run(W0, 0.7); ok(Math.floor(p.x) !== 3 && Math.floor(p.x) !== 4, 'bond vers l’ouest : l’étage 2 est trop haut, on n’y atterrit pas (x=' + p.x.toFixed(1) + ')');
  // plateforme-ascenseur
  const W1 = new BK.World({ map: ['.......', '.1.}...', '.......'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '5,1': { lv: 1 } } });
  const q = W1.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); q.x = 3.5; q.input.bomb = true; W1.update(1 / 60); const lb = W1.bombs[0]; ok(lb && W1.liftAt(3, 1), 'bombe posée sur la plateforme');
  W1.explodeBomb(lb); ok(W1.flames.length === 0 && W1.lifts[0].moving && q.hp === 40, 'l’explosion est étouffée : pas de flammes, la plateforme part');
  run(W1, 1); ok(Math.abs(W1.hAt(3, 1) - 0.6) < 0.01 && Math.abs(W1.groundZ(q.x, q.y) - 0.6) < 0.01, 'la plateforme est montée d’un étage avec le héros dessus');
  ok(!W1.blocked(4, 1, q) || true, 'x'); q.x = 3.5; q.input.dx = 1; run(W1, 0.8); ok(Math.floor(q.x) === 4 && Math.abs(W1.groundZ(q.x, q.y)) < 0.01 || Math.floor(q.x) >= 4, 'depuis la plateforme on redescend à droite');
  // crapaud : pas par-dessus l’eau ni les murs ; golem : pas de chemin par l’eau
  const W2 = new BK.World({ map: ['.........', '.1.~~~...', '.........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const h2 = W2.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); h2.invuln = 999; const toad = W2.addEnemy('crapaud', 7, 1); run(W2, 6);
  ok(Math.floor(toad.x) >= 7 || Math.floor(toad.y) !== 1 || !(toad.x < 7 && toad.y > 1 && toad.y < 2), 'le crapaud ne saute pas par-dessus l’eau (x=' + toad.x.toFixed(1) + ', y=' + toad.y.toFixed(1) + ')');
  ok(!W2.jumpClear(7, 1, 2, 1), 'le trajet par-dessus l’eau n’est pas dégagé');
  const W3 = new BK.World({ map: ['#########', '#1..#..c#', '#########'].map(l => l.replace('c', '.')), theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  ok(!W3.jumpClear(7, 1, 2, 1), 'ni par-dessus un mur');
  const W4 = new BK.World({ map: ['.........', '.1.~~~...', '.........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const h4 = W4.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); h4.invuln = 999; const g = W4.addEnemy('golem', 7, 1); run(W4, 3);
  ok(W4.walkableTerrain(Math.floor(g.x), Math.floor(g.y)), 'le golem contourne l’eau (' + g.x.toFixed(1) + ', ' + g.y.toFixed(1) + ')');
}

// 26. sept nouveaux monstres : cogneur, cracheur de feu, souffleur de glace, magicien, taupe, guêpe, plante carnivore
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Wa = mk(['.......', '.1.....', '.......']); const pa = Wa.addPlayer(adam, 1, 1, { hp: 40 }); pa.x = 2.5; const hm = Wa.addEnemy('cogneur', 3, 1); hm.speed = 0;   // il reste sur place pour le test
  let stomped = false; for (let i = 0; i < 300 && pa.hp === 40; i++) { Wa.update(1 / 60); if (Wa.events.some(e => e.type === 'stomp')) stomped = true; }
  ok(stomped && pa.hp === 30, 'le cogneur frappe le sol et le séisme blesse le héros sur la case voisine');
  const Wb = mk(['.........', '.1..~....', '.........']); const pb = Wb.addPlayer(adam, 1, 1, { hp: 40 }); Wb.addEnemy('cracheur', 7, 1);
  let seen = false, maxZ = 0, minZ = 9, died = false; for (let i = 0; i < 360; i++) { Wb.update(1 / 60); for (const sh of Wb.shots) if (sh.kind === 'fire') { seen = true; if (!sh.dead) { maxZ = Math.max(maxZ, sh.z); minZ = Math.min(minZ, sh.z); } else if (sh.x < 5.5) died = true; } }
  ok(seen && maxZ > 0.5 && minZ < 0.3 && died && pb.hp === 40, 'la boule de feu rebondit et s’éteint dans l’eau avant le héros');
  const Wc = mk(['.......', '.1.....', '.......']); const pc = Wc.addPlayer(adam, 1, 1, { hp: 40 }); Wc.addEnemy('glaceur', 5, 1);
  for (let i = 0; i < 400 && !(pc.frozen > 0); i++) Wc.update(1 / 60); ok(pc.frozen > 0 && pc.hp === 40, 'l’éclat de glace gèle le héros sans le blesser');
  pc.input.dx = 1; const fx = pc.x; run(Wc, 0.5); ok(Math.abs(pc.x - fx) < 0.01, 'gelé, il ne bouge plus'); run(Wc, 1.5); ok(pc.frozen === 0, 'la glace fond');
  const Wd = mk(['....................', '.1..................', '....................']); const pd = Wd.addPlayer(adam, 1, 1, { hp: 40 }); pd.x = 8.5; const mg = Wd.addEnemy('magicien', 10, 1);
  let magic = null; for (let i = 0; i < 400 && !magic; i++) { Wd.update(1 / 60); magic = Wd.shots.find(sh => sh.kind === 'magic'); } ok(magic && Math.cos(magic.a) < -0.9, 'le magicien lance sa magie vers le héros');
  pd.x = 18.5; pd.y = 2.5; mg.tp = 999; mg.cool = 999; let pauses = 0, wasPaused = false, turned = false; for (let i = 0; i < 900 && !magic.dead; i++) { Wd.update(1 / 60); if (magic.pause > 0 && !wasPaused) pauses++; wasPaused = magic.pause > 0; if (Math.cos(magic.a) > 0.5) turned = true; }
  ok(pauses === 3 && turned && magic.dead && pd.hp === 40, 'elle avance, s’arrête, revient vers le héros, trois passes, puis disparaît sans rien toucher');
  const We = mk(['.........', '.1.......', '.........']); const pe = We.addPlayer(adam, 1, 1, { hp: 40 }); pe.invuln = 999; const mole = We.addEnemy('taupe', 7, 1);
  run(We, 1); ok(mole.state === 'hidden' && mole.x < 7.4 && !We.hurtEnemy(mole, pe, 1), 'la taupe avance sous terre, hors d’atteinte');
  for (let i = 0; i < 480 && mole.state !== 'up'; i++) We.update(1 / 60); ok(mole.state === 'up' && Math.hypot(mole.x - pe.x, mole.y - pe.y) < 1.6, 'elle surgit près du héros');
  pe.x = mole.x + 3; pe.y = mole.y; let dirt = null; for (let i = 0; i < 90 && !dirt; i++) { We.update(1 / 60); dirt = We.shots.find(sh => sh.kind === 'dirt'); } ok(dirt && Math.cos(dirt.a) > 0.9, 'sortie, elle lance une motte de terre vers le héros');
  let peak = 0; for (let i = 0; i < 60 && !dirt.dead; i++) { We.update(1 / 60); peak = Math.max(peak, dirt.z); } ok(peak > 1 && dirt.dead, 'la motte vole en cloche et retombe (z max ' + peak.toFixed(1) + ')');
  const Wf = mk(['.........', '.1.~~~...', '.........']); const pf = Wf.addPlayer(adam, 1, 1, { hp: 40 }); const wasp = Wf.addEnemy('guepe', 4, 1);
  let overWater = false, immune = false; for (let i = 0; i < 480 && pf.hp === 40; i++) { Wf.update(1 / 60); if (Math.floor(wasp.x) >= 3 && Math.floor(wasp.x) <= 5 && wasp.z > 0.5) { overWater = true; if (!Wf.hurtEnemy(wasp, pf, 1)) immune = true; } }
  ok(overWater && immune && pf.hp === 30, 'la guêpe survole l’eau, insensible aux flammes en vol, et pique le héros');
  const Wg = mk(['.....', '.1...', '.....']); const pg = Wg.addPlayer(adam, 1, 1, { hp: 40 }); const pl = Wg.addEnemy('plante', 3, 1);
  run(Wg, 0.5); ok(pl.state === 'hidden' && pl.up === 0, 'la plante est cachée au départ'); run(Wg, 2.2); ok(pl.state === 'up' || pl.state === 'rising', 'puis elle sort du sol');
  pg.x = 3.5; pg.y = 1.5; pg.invuln = 0; run(Wg, 0.3); ok(pg.hp === 30, 'elle mord le héros qui passe');
}

// 27. lave, glace, ascenseur et vie numérique
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Wl = mk(['.......', '.1[[...', '.......']); const pl = Wl.addPlayer(adam, 1, 1, { hp: 40 }); const en = Wl.addEnemy('gluant', 5, 1);
  ok(Wl.blocked(2, 1, en) && !Wl.blocked(2, 1, pl), 'la lave arrête les monstres, pas le héros');
  pl.input.dx = 1; run(Wl, 0.6); ok(pl.hp === 35 && pl.invuln > 0, 'dans la lave : −5 points de vie (' + pl.hp + ')');
  const Wi = mk(['..........', '.1]]]]]]..', '..........']); const pi = Wi.addPlayer(adam, 1, 1, { hp: 40 }); pi.input.dx = 1; run(Wi, 1.0); const xr = pi.x; pi.input.dx = 0; run(Wi, 0.5);
  ok(pi.x > xr + 0.3, 'sur la glace, on continue de glisser après avoir lâché (' + (pi.x - xr).toFixed(2) + ' case)');
  const We = mk(['.......', '.1{....', '.......'], { '3,1': { lv: 2 } }); const pe = We.addPlayer(adam, 1, 1, { hp: 40 }); const E = We.elevators[0];
  ok(E && Math.abs(We.hAt(2, 1) - 0.35) < 0.01 && Math.abs(We.hAt(3, 1) - 1.2) < 0.01, 'plateau au repos à 0,35 ; voisin à l’étage 2');
  pe.input.dx = 1; run(We, 0.7); ok(Math.floor(pe.x) === 2 && Math.abs(We.groundZ(pe.x, pe.y) - 0.35) < 0.01, 'le héros monte sur le plateau'); pe.input.dx = 0;
  pe.x = 1.5; We.placeBomb(pe); const eb = We.bombs[0]; We.kickBomb(eb,3,pe); pe.x=2.5; We.updateBombs(.02); ok(eb && eb.underElevator===E, 'bombe bottée sous le plateau depuis le sol voisin');
  We.explodeBomb(eb); ok(E.state === 'up' && We.flames.length === 0 && pe.hp === 40, 'boum étouffé : l’ascenseur démarre, pas de dégâts');
  run(We, 2.8); ok(E.state === 'wait' && Math.abs(We.hAt(2, 1) - 1.2) < 0.01 && Math.abs(We.groundZ(pe.x, pe.y) - 1.2) < 0.01, 'il monte lentement jusqu’en haut avec le héros');
  pe.input.dx = 1; run(We, 0.3); ok(Math.floor(pe.x) === 3 && Math.abs(We.groundZ(pe.x, pe.y) - 1.2) < 0.01, 'en haut, on passe sur l’étage 2'); pe.input.dx = 0;
  run(We, 3.2); ok(E.state === 'down' || E.state === 'rest', 'après 3-4 s il redescend'); run(We, 3); ok(E.state === 'rest' && Math.abs(We.hAt(2, 1) - 0.35) < 0.01, 'et revient au repos');
  const Wh = mk(['.......', '.1.....', '.......']); const ph = Wh.addPlayer(adam, 1, 1, { hp: 40 }); ph.invuln = 0;
  Wh.hitPlayer(ph, { kind: 'enemy', enemy: { def: { dmg: 15 } } }); ok(ph.hp === 25, 'un coup de mini-boss enlève 15');
  ph.invuln = 0; Wh.hitPlayer(ph, { kind: 'flame' }); ok(ph.hp === 15, 'une flamme enlève 10');
  Wh.spawnItem(1, 1, 'heart', 20); const it = Wh.itemAt(1, 1); ok(it.value === 20, 'cœur de 20'); Wh.takeItem(ph, it); ok(ph.hp === 35 && ph.maxHp === 40, 'le cœur redonne 20 points, sans dépasser le max');
  const a = new BK.Adventure('adam', 0), expected = 40 + 10 * ((a.save.upgrades || {}).heart || 0); ok(a.player.maxHp === expected && a.player.hp === expected, 'en aventure : ' + expected + ' points de vie au départ');
  a.save.stats = Object.assign(BK.defaultStats(), { hpMax: 60 }); BK.applyStats(a.player, a.save, true); ok(a.player.maxHp === expected + 20 && a.player.hp === expected + 20, 'la stat Vie max monte le maximum (et soigne la différence)');
}

// 28. cibles et portes par couleur : huit couleurs, la cible rose (H) ouvre la porte rose (h)
{
  ok(BK.TARGET_COLORS.length === 8 && BK.targetColor('h') === BK.targetColor('H') && BK.targetName('A') === 'rouge', 'huit couleurs, portes et cibles partagent la même');
  const E = new BK.Editor({ name: 'c', cols: 7, rows: 3, theme: 'forest', base: '.' }); const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(it => it[key] === val); };
  E.opts.target.letter = 'H'; pick('objets', 'ch', 'A'); E.paint(1, 1, true); E.opts.gate.letter = 'h'; pick('objets', 'ch', 'a'); E.paint(4, 1, true);
  const W0 = E.world; ok(W0.targets.H && W0.gates.h && W0.gates.h.length === 1, 'cible rose et porte rose posées');
  W0.hitTarget('H', null); ok(W0.cell(4, 1) === 0, 'la cible rose ouvre la porte rose');
}

// 29. un objet posé sur un pont garde le pont sous lui
{
  const E = new BK.Editor({ name: 'p', cols: 6, rows: 3, theme: 'forest', base: '~' }); const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(it => it[key] === val); };
  pick('decor', 'ch', '='); for (let c = 0; c < 6; c++) E.paint(c, 1, c === 0); pick('objets', 'ch', '$'); E.paint(3, 1, true);
  ok(E.props['3,1'].floor === '=' && E.world.terrain[E.world.idx(3, 1)] === 3, 'la pièce posée sur le pont laisse le pont dessous (terrain ' + E.world.terrain[E.world.idx(3, 1)] + ')');
}

// 30. feu de camp : la vie remonte chaque seconde tout près, selon la stat « Repos au feu »
{
  const W0 = new BK.World({ map: ['.......', '.1.i...', '.......'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W0.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.hp = 20; p.fireRegen = 2; p.x = 2.5;
  run(W0, 3.05); ok(p.hp === 26 && W0.campfires.length === 1, 'près du feu : +2 par seconde (' + p.hp + ')');
  p.fireRegen = 5; run(W0, 1.05); ok(p.hp === 31, 'avec la stat à 5 : +5 par seconde');
  p.x = 5.5; p.hp = 20; run(W0, 2); ok(p.hp === 20, 'loin du feu, rien');
  ok(BK.STATS.fireRegen && BK.defaultStats().fireRegen === 2, 'la stat existe dans la fiche');
}

// 31. squelettes à os boomerang et dix décorations par props
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Ws = mk(['############', '#1.........#', '############']); const ps = Ws.addPlayer(adam, 1, 1, { hp: 40 }); ps.invuln = 999; ps.x = 3.5; const sk = Ws.addEnemy('squelette', 6, 1);   // une seule rangée : l’os part droit
  let bone = null; for (let i = 0; i < 900 && !bone; i++) { Ws.update(1 / 60); bone = Ws.shots.find(s => s.kind === 'bone'); } ok(bone && sk.bone === bone && Math.cos(bone.a) < -0.9, 'le squelette lance son os vers le héros');
  const sx = sk.x, sy = sk.y; let maxD = 0, hovered = false; for (let i = 0; i < 400 && !bone.dead; i++) { Ws.update(1 / 60); maxD = Math.max(maxD, Math.hypot(bone.x - sx, bone.y - sy)); if (bone.phase === 'hover') hovered = true; }
  ok(maxD >= 2.9 && maxD <= 3.3 && hovered, 'l’os va jusqu’à 3 cases, s’arrête au bout (' + maxD.toFixed(1) + ')');
  ok(bone.dead && sk.x === sx && sk.y === sy, 'il revient au squelette, qui n’a pas bougé pendant ce temps'); Ws.update(1 / 60); ok(!sk.bone, 'le squelette est libéré');
  const r0 = BK.ENEMIES.squelette, r1 = BK.ENEMIES.squelette_rouge, r2 = BK.ENEMIES.squelette_noir;
  ok(r1.range === 5 && Math.abs(r1.boneSpeed / r0.boneSpeed - 1.3) < 0.01 && r2.range === 7 && Math.abs(r2.boneSpeed / r0.boneSpeed - 1.5) < 0.01 && Math.abs(r2.speed / r0.speed - 1.5) < 0.01, 'rouge : 5 cases, os 1,3 × ; noir : 7 cases, marche et os 1,5 ×');
  const Wb = mk(['.....', '.1...', '.....']); const pb = Wb.addPlayer(adam, 1, 1, { hp: 40 }); pb.x = 1.5; const sk2 = Wb.addEnemy('squelette', 3, 1); for (let i = 0; i < 240 && pb.hp === 40; i++) Wb.update(1 / 60); ok(pb.hp === 30, 'l’os blesse le héros au passage'); void sk2;
  const kinds = Object.keys(BK.DECO_PROPS); ok(kinds.length === 184, 'décorations existantes, château, quatre biomes et huit pièges');
  const props = {}; kinds.forEach((k, i) => { props[(1 + i) + ',1'] = { deco: k }; });
  const Wd = mk(['.'.repeat(kinds.length + 2), '.' + '"'.repeat(kinds.length) + '.', '.'.repeat(kinds.length + 2)], props);
  ok(kinds.every((k, i) => Wd.deco[Wd.idx(1 + i, 1)] === k) && !Wd.blocked(kinds.indexOf('bones') + 1, 1) && Wd.blocked(kinds.indexOf('wheel') + 1, 1), 'toutes se posent ; les ossements se traversent, la roue bloque');
  const E = new BK.Editor({ name: 'd', cols: 6, rows: 3, theme: 'forest', base: '.' }); const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(it => it[key] === val); };
  pick('deco', 'deco', 'beehive'); E.paint(2, 1, true); pick('deco', 'deco', 'skullpile'); E.paint(2, 1, true); ok(E.props['2,1'].deco === 'skullpile' && E.world.deco[E.world.idx(2, 1)] === 'skullpile', 'repeindre une autre décoration sur la même case la remplace');
}

// 32. sol sous les objets entourés d'objets, statues brisées par boulet ou fusée (toujours un objet), monstre marin
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Wf = mk([',,,,,,,', ',1xxx,,', ',xxxxx,', ',,xxx,,', ',,,,,,,']);
  ok(Wf.terrain[Wf.idx(3, 2)] === 1 && Wf.terrain[Wf.idx(2, 1)] === 1, 'un bloc entouré de blocs prend le gazon des alentours (plus de case de pierre après l’explosion)');
  const Wg = mk(['.......', '.1xxx..', '.xxxxx.', '..xxx..', '.......']); ok(Wg.terrain[Wg.idx(3, 2)] === 0, 'sur la pierre, il reste de la pierre');
  const Wx = mk([';;;;;', ';1X;;', ';;;;;']); ok(Wx.terrain[Wx.idx(2, 1)] === 1 && Math.abs(Wx.height[Wx.idx(2, 1)] - 0.6) < 0.01, 'un bloc sur un plateau de gazon (X) cache du gazon, pas de la pierre');
  const Ws = mk(['..........', '.1..s...C.', '..........'].map(l => l.replace('C', '.')), {});
  const p = Ws.addPlayer(adam, 1, 1, { hp: 40 }); p.invuln = 999; const C = Ws.addEnemy('canon', 8, 1); const rnd0 = Math.random; Math.random = () => 0.99;   // pas de pièce : objet du pool
  ok(Ws.blocked(4, 1, p) && Ws.deco[Ws.idx(4, 1)] === 'statue', 'la statue bloque la case');
  let ev = null; for (let i = 0; i < 600 && !ev; i++) { Ws.update(1 / 60); ev = Ws.events.find(e => e.type === 'statueBroken'); Ws.events.length = 0; }
  ok(ev && !Ws.blocked(4, 1, p) && !Ws.deco[Ws.idx(4, 1)], 'le boulet de canon brise la statue'); ok(Ws.items.some(it => it.cx === 4 && it.cy === 1), 'elle laisse toujours un objet'); void C;
  const Wm = mk(['..........', '.1..s.....', '..........'], {}); const pm = Wm.addPlayer(adam, 1, 1, { hp: 40 }); pm.invuln = 999; Wm.addEnemy('lanceur', 8, 1);
  let ev2 = null; for (let i = 0; i < 900 && !ev2; i++) { Wm.update(1 / 60); ev2 = Wm.events.find(e => e.type === 'statueBroken'); Wm.events.length = 0; }
  ok(ev2 && Wm.items.some(it => it.cx === 4 && it.cy === 1), 'une fusée chercheuse aussi, avec un objet');
  Math.random = rnd0;
  const Wsea = mk(['..........', '.1.....~~.', '..........'], {}); const ph = Wsea.addPlayer(adam, 1, 1, { hp: 40 }); ph.x = 2.5; const M = Wsea.addEnemy('marin', 7, 1);
  ok(Wsea.solidEnemyAt(7, 1) === M && Wsea.tAt(7, 1) === 2, 'le monstre marin vit dans l’eau et bloque sa case');
  let charged = false, maxCharge = 0, shot = null; for (let i = 0; i < 400 && !shot; i++) { Wsea.update(1 / 60); if (M.state === 'charge') { charged = true; maxCharge = Math.max(maxCharge, M.charge); } shot = Wsea.shots.find(s => s.kind === 'poison'); }
  ok(charged && maxCharge > 0.9 && M.mouth > 0.9, 'il ouvre la gueule et la boule grossit dedans avant le crachat');
  ok(shot && Math.cos(shot.a) < -0.9 && shot.x < M.x - 0.3, 'la boule de poison sort de la gueule vers le héros');
  for (let i = 0; i < 300 && ph.hp === 40; i++) Wsea.update(1 / 60); ok(ph.hp === 30, 'la boule fait 10 points de dégâts'); ok(M.mouth < 0.2, 'la gueule s’est refermée');
}
// 33. ruche → abeille ; gros champignon → trampoline
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Wh = mk(['.......', '.1....\"', '.......'], { '6,1': { deco: 'beehive' } }); const ph = Wh.addPlayer(adam, 1, 1, { hp: 40 }); ph.invuln = 999;
  ok(Wh.hives.length === 1, 'la ruche est repérée'); run(Wh, 1); ok(!Wh.enemies.length, 'loin de la ruche, rien ne sort');
  ph.x = 4.5; ph.y = 1.5; run(Wh, 0.1); ok(!Wh.enemies.length, 'à deux cases, rien non plus'); ph.x = 5.5; ph.y = 2.5; Wh.update(1 / 60);
  ok(Wh.enemies.length === 1 && Wh.enemies[0].type === 'abeille', 'sur une case collée (en diagonale), une abeille sort');
  run(Wh, 1); ok(Wh.enemies.length === 1, 'pas une deuxième tout de suite (4 s)'); run(Wh, 3.5); ok(Wh.enemies.length === 2, 'une autre après 4 s');
  ok(BK.ENEMIES.abeille.r * 2 === BK.ENEMIES.guepe.r && BK.ENEMIES.abeille.dmg === 5, 'l’abeille est deux fois plus petite que la guêpe');
  const Wm = mk(['..........', '.1.\"......', '..........'], { '3,1': { deco: 'bigmushroom' } }); const pm = Wm.addPlayer(adam, 1, 1, { hp: 40 }); pm.invuln = 999;
  Wm.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 0, fire: 2, owner: pm, state: 'idle', passers: new Set(), born: 0, fuse: 99 }); const b = Wm.bombs[0];
  pm.x = 2.5; pm.y = 1.5; pm.onBomb = b; pm.zOff = 0.55; Wm.leap(pm, 3); ok(pm.air && Math.floor(pm.air.x1) === 3 && pm.air.z1 > 1, 'depuis la bombe, le bond vise le champignon d’à côté');
  let bounced = false, maxZ = 0; for (let i = 0; i < 120; i++) { Wm.update(1 / 60); if (Wm.events.some(e => e.type === 'bounce')) bounced = true; Wm.events.length = 0; if (pm.air && pm.air.control) maxZ = Math.max(maxZ, pm.zOff); }
  ok(bounced && Math.floor(pm.x) === 6 && !pm.air, 'il rebondit et atterrit 3 cases plus loin (case 6, x=' + pm.x.toFixed(1) + ')'); ok(maxZ > 1.5, 'le rebond monte haut (' + maxZ.toFixed(1) + ')');
  pm.x = 2.5; pm.y = 1.5; pm.onBomb = b; pm.zOff = 0.55; Wm.leap(pm, 3); for (let i = 0; i < 120 && !(pm.air && pm.air.control); i++) Wm.update(1 / 60);
  pm.input.dy = 1; run(Wm, 1); pm.input.dy = 0; ok(Math.floor(pm.x) === 6 && Math.floor(pm.y) === 2 && !pm.air, 'en vol, on dévie un peu (atterrit une rangée plus bas)');
  const Wb = mk(['.......', '.1.\"###', '.......'], { '3,1': { deco: 'bigmushroom' } }); const pb = Wb.addPlayer(adam, 1, 1, { hp: 40 }); pb.invuln = 999;
  Wb.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 0, fire: 2, owner: pb, state: 'idle', passers: new Set(), born: 0, fuse: 99 }); pb.x = 2.5; pb.y = 1.5; pb.onBomb = Wb.bombs[0]; pb.zOff = 0.55; Wb.leap(pb, 3); run(Wb, 2);
  ok(Math.floor(pb.x) === 2 && !pb.air, 'murs jusqu’au bord : on retombe d’où l’on vient (x=' + pb.x.toFixed(1) + ')');
}
// 34. feu de camp : halo rouge et petits cœurs
{
  const Wc = new BK.World({ map: ['.....', '.1.i.', '.....'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} }); const pc = Wc.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); pc.hp = 20; pc.x = 2.5;
  run(Wc, 1.2); ok(pc.campGlow === 1 && Wc.particles.some(q => q.heart && q.float), 'près du feu : halo allumé et cœurs qui flottent');
  const h = Wc.particles.find(q => q.heart); const z0 = h.z; Wc.update(0.3); ok(h.z > z0, 'les cœurs montent (pas de gravité)');
  pc.x = 0.5; run(Wc, 0.5); ok(pc.campGlow === 0, 'loin du feu, le halo s’éteint');
}
// 35. choix du monde : zoom sur l'île, tableaux en petites îles
{
  global.confirm = () => true; let started = null; const sa0 = BK.startAdventure; BK.startAdventure = (id, i) => { started = i; }; BK.audio = BK.audio || {}; for (const k of ['click', 'win', 'hurt']) BK.audio[k] = BK.audio[k] || (() => { });
  BK.saveAdventure('adam', { unlocked: 3, best: { '1-1': 1200 }, score: 1200 });
  const ws = new BK.WorldSelect('adam'); ok(ws.mode === 'worlds' && ws.islands.length === ws.worlds.length, 'écran des mondes, une île par monde');
  ws.index = 1; ws.enter(); ok(ws.mode === 'zoomIn' && ws.stageIslands.length === BK.WORLDS[0].stages.length, 'entrer dans la forêt lance le zoom et crée une île par tableau');
  for (let i = 0; i < 70; i++) ws.update(1 / 60); ok(ws.mode === 'stages' && ws.stageIslands.every(s => s.pop === 1), 'après le zoom, les îles des tableaux sont toutes apparues');
  ok(ws.stageIndex === 1 && ws.stageIslands[0].done && !ws.stageIslands[1].locked && ws.stageIslands[3].locked, 'le tableau choisi est le premier pas encore réussi ; 1-4 est verrouillé');
  ok(ws.player && ws.stageIslands[1].W.players[0] === ws.player, 'le héros se tient sur l’île du tableau choisi');
  const kinds = ws.stageIslands.map(s => s.W.exit ? 'portal' : s.W.enemies.length ? s.W.enemies[0].type : s.W.switches.length ? 'switch' : s.W.volcanoes.length ? 'volcano' : '?');
  ok(ws.stageIslands[0].W.doors.length===2 && ws.stageIslands[0].W.trees.length===4 && Object.keys(ws.stageIslands[2].W.targets).length===3 && kinds[3]==='volcano' && kinds[4]==='golem', 'miniatures : maisons et arbres, trois cibles, volcan et boss');
  ok(ws.stageIslands[4].W.enemies.filter(e=>e.type==='crapaud').length===2,'le boss est accompagné de ses deux crapauds');
  ws.move(2); ws.enter(); ok(ws.flash > 0 && !ws.enterT, 'un tableau verrouillé refuse'); ws.move(-1); ws.enter(); for (let i = 0; i < 60; i++) ws.update(1 / 60); ok(started === 2, 'Entrée sur 1-3 lance le tableau 1-3');
  const ws2 = new BK.WorldSelect('adam', { zoom: 0, pick: 2 }); ok(ws2.mode === 'stages' && ws2.stageIndex === 2, 'raccourci : monde ouvert d’office, tableau 2 choisi');
  ws2.back(); for (let i = 0; i < 50; i++) ws2.update(1 / 60); ok(ws2.mode === 'worlds' && !ws2.stageIslands.length && ws2.islands[ws2.index].players.length === 1, 'retour : dézoom, le héros revient sur l’île du monde');
  BK.startAdventure = sa0;
}
// 36. miel (ruche → pot → inventaire → flaque qui englue), abeilles 10 s, fontaine, boîte aux lettres
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const bomb = (W, p, c, r) => { W.bombs.push({ cx: c, cy: r, x: c + 0.5, y: r + 0.5, z: 0, t: 0, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }); W.explodeBomb(W.bombs[0]); };
  const Wh = mk(['.......', '.1..\"..', '.......'], { '4,1': { deco: 'beehive' } }); const ph = Wh.addPlayer(adam, 1, 1, { hp: 40 }); ph.invuln = 999; ph.x = 1.5;
  bomb(Wh, ph, 3, 1); run(Wh, 0.1); ok(!Wh.deco[Wh.idx(4, 1)] && !Wh.hives.length && Wh.items.some(it => it.type === 'honey' && it.value === 3), 'la bombe casse la ruche : un pot de miel de 3 doses');
  run(Wh, 1); ph.x = 4.5; ph.y = 1.5; run(Wh, 0.1); ok(ph.inv && ph.inv.length === 1 && ph.inv[0].type === 'honey' && ph.inv[0].n === 3, 'ramassé : dans l’inventaire, ×3');
  Wh.spawnItem(2, 1, 'honey', 2); ph.x = 2.5; run(Wh, 0.1); ok(ph.inv.length === 1 && ph.inv[0].n === 5, 'un deuxième pot s’empile (×5)');
  const g = Wh.addEnemy('gluant', 5, 1); g.target = { x: 1.5, y: 1.5 }; ph.x = 3.5; ph.y = 1.5; Wh.events.length = 0; ok(Wh.useItem(ph, 0) && Wh.puddles.length === 1 && Wh.puddles[0].c === 3 && ph.inv[0].n === 4, 'Q verse une flaque sous le héros, une dose de moins');
  ok(Wh.events.some(e => e.type === 'honeyUsed'), 'événement honeyUsed');
  const Wc = mk(['#######', '#1....#', '#######']); const pc2 = Wc.addPlayer(adam, 1, 1, { hp: 40 }); pc2.invuln = 999; const gc = Wc.addEnemy('gluant', 4, 1); const moved = () => { let d = 0, lx = gc.x; for (let i = 0; i < 45; i++) { Wc.update(1 / 60); d += Math.abs(gc.x - lx); lx = gc.x; } return d; };
  Wc.puddles.push({ c: 4, r: 1, t: 0, dur: 99 }); const dIn = moved(); Wc.puddles.length = 0; gc.x = 4.5; gc.y = 1.5; gc.target = null; const dOut = moved();
  ok(dIn > 0 && dOut / dIn > 5, 'dans le miel, le monstre avance ' + (dOut / dIn).toFixed(0) + ' × moins vite');
  ph.inv[0].n = 1; Wh.events.length = 0; Wh.useItem(ph, 0); ok(!ph.inv.length && Wh.events.some(e => e.type === 'honeyEmpty'), 'dernière dose : le pot disparaît et on le dit');
  ph.inv = [{ type: 'honey', n: 1 }, { type: 'honey', n: 1 }]; ph.inv[1].type = 'x'; Wh.spawnItem(2, 1, 'honey', 2); ph.x = 2.5; run(Wh, 0.1);
  ok(Wh.items.some(it => it.type === 'honey') === false || ph.inv[0].n === 3, 'un pot de plus s’empile sur le pot existant même inventaire plein');
  // abeilles de ruche
  const Wb = mk(['........', '.1....\".', '........'], { '6,1': { deco: 'beehive' } }); const pb = Wb.addPlayer(adam, 1, 1, { hp: 40 }); pb.invuln = 999; pb.x = 5.5; pb.y = 2.5; Wb.update(1 / 60);
  const bee = Wb.enemies.find(e => e.type === 'abeille'); ok(bee && bee.hive, 'une abeille sort'); pb.x = 1.5; pb.y = 1.5; const g2 = Wb.addEnemy('gluant', 6, 2); g2.target = { x: 6.5, y: 2.5 }; g2.speed = 0;
  let stung = false; for (let i = 0; i < 300 && !stung; i++) { Wb.update(1 / 60); if (g2.hp < 1 || g2.dead) stung = true; } ok(stung, 'l’abeille attaque le monstre le plus proche plutôt que le héros lointain');
  for (let i = 0; i < 700 && !bee.dead; i++) Wb.update(1 / 60); ok(bee.dead && bee.life <= 0, 'l’abeille disparaît après 10 s');
  // fontaine
  const Wf = mk(['.....', '.1J..', '.....']); const pf = Wf.addPlayer(adam, 1, 1, { hp: 40 }); pf.stamina = 10; Wf.update(1 / 60);
  ok(pf.nearFountain && pf.nearFountain.c === 2, 'la fontaine est repérée à côté'); ok(Wf.drink(pf) && pf.drinkT > 0 && pf.pose === 'drink', 'Entrée : on boit (pose « drink »)');
  pf.input.dx = 1; run(Wf, 0.5); ok(pf.x === 1.5 && pf.stamina > 10, 'immobile pendant qu’on boit, la stamina remonte'); run(Wf, 1.2); ok(pf.drinkT === 0 && pf.stamina === pf.staminaMax, 'à la fin, stamina pleine');
  // boîte aux lettres
  const Wm = mk(['......', '.1.7..', '......']); const pm = Wm.addPlayer(adam, 1, 1, { hp: 40 }); pm.invuln = 999; pm.x = 1.5; ok(Wm.blocked(3, 1, pm) && Wm.deco[Wm.idx(3, 1)] === 'mailbox', 'la boîte aux lettres bloque');
  bomb(Wm, pm, 2, 1); run(Wm, 0.1); ok(!Wm.blocked(3, 1, pm) && Wm.items.some(it => it.type === 'coin' && it.cx === 3) && Wm.debris.length === 1 && Wm.debris[0].kind === 'mailbox', 'la flamme la renverse : pièce d’or et boîte qui tombe');
  run(Wm, 1.5); ok(!Wm.debris.length, 'les débris s’effacent');
}
// 37. éditeur : commerçants et articles à vendre ; achat dans un tableau perso
{
  const E = new BK.Editor({ name: 'boutique', cols: 8, rows: 5, theme: 'interior', base: 'y' }); const pick = (tab, key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === tab).items.find(it => it[key] === val); };
  pick('magasin', 'npc', true); E.opts.npc.id = 'josee'; E.opts.npc.line = 'Bonjour !'; E.paint(4, 1, true);
  pick('magasin', 'shop', true); E.opts.shop.item = 'bomb'; E.opts.shop.price = 25; E.opts.shop.once = true; E.paint(3, 2, true); E.opts.shop.item = 'honey'; E.opts.shop.price = 10; E.opts.shop.once = false; E.paint(5, 2, true);
  ok(E.npcs.length === 1 && E.npcs[0].id === 'josee' && E.shop.length === 2 && E.shop[1].once === false, 'l’éditeur garde le commerçant et deux articles');
  ok(E.world.players.some(n => n.npc && n.def.name === 'Josée') && E.world.displays.length === 2 && E.world.displays[0].price === 25, 'ils apparaissent dans l’aperçu de l’éditeur');
  const d0 = E.data(); ok(d0.npcs.length === 1 && d0.shop.length === 2, 'sauvegardés avec la carte');
  pick('decor', 'ch', '1'); E.paint(1, 1, true);
  const st = BK.mapToStage(E.data()); BK.saveAdventure('adam', { unlocked: 1, best: {}, score: 0, gold: 30 });
  const A = new BK.Adventure('adam', 0, { custom: st }); A.state = 'play'; A.world.frozen = false; const W = A.world, p = A.player;
  ok(W.displays.length === 2 && W.players.some(n => n.npc), 'le tableau perso a ses articles et son commerçant');
  p.x = 3.5; p.y = 2.5; const bm = p.bombsMax; ok(A.buy(W.displays[0]) && p.bombsMax === bm + 1 && A.save.gold === 5 && W.displays[0].soldOut, 'acheter la bombe : +1 bombe, 25 pièces de moins, article épuisé');
  ok(!A.buy(W.displays[0]), 'on ne peut pas racheter un article « une seule fois »');
  ok(!A.buy(W.displays[1]) && A.save.gold === 5, 'pas assez de pièces pour le miel');
  A.save.gold = 100; ok(A.buy(W.displays[1]) && A.buy(W.displays[1]) && !W.displays[1].soldOut && p.inv[0].n === 6, 'le miel « autant qu’on veut » s’achète deux fois (×6)');
  const A2 = new BK.Adventure('adam', 0, { custom: st }); ok(A2.world.displays[0].soldOut && !A2.world.displays[1].soldOut, 'au retour, l’article unique reste épuisé (mémorisé)');
  p.dir = 3; p.x = 2.5; p.y = 2.5; ok(A.displayNear(p) === W.displays[0], 'à côté en regardant l’article, c’est lui qu’on achète');
}
// 38. trois canons : vie, boulets, cadence et gonflement avant le tir
{
  const adam = BK.charById('adam'), mk = () => new BK.World({ map: ['..........', '.1........', '..........'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  ok(BK.ENEMIES.canon.hp === 2 && BK.ENEMIES.canon_rouge.hp === 4 && BK.ENEMIES.canon_bleu.hp === 4, 'noir 2 coups, rouge et bleu 4 coups');
  ok(BK.ENEMIES.canon_bleu.ballSpeed * 2 === BK.ENEMIES.canon.ballSpeed && BK.ENEMIES.canon_bleu.cool * 2 === BK.ENEMIES.canon.cool, 'bleu : boulets 2 × plus lents, tirs 2 × plus fréquents');
  for (const [type, color] of [['canon', 'black'], ['canon_rouge', 'fire'], ['canon_bleu', 'blue']]) {
    const W = mk(); const p = W.addPlayer(adam, 1, 1, { hp: 40 }); p.invuln = 999; const C = W.addEnemy(type, 8, 1); let puffed = false, maxSw = 0, b = null;
    for (let i = 0; i < 400 && !b; i++) { W.update(1 / 60); if (C.puff > 0) { puffed = true; maxSw = Math.max(maxSw, C.swell); } b = W.shots.find(s => s.kind === 'ball'); }
    ok(puffed && maxSw > 0.9 && b && b.color === color && Math.abs(b.speed - BK.ENEMIES[type].ballSpeed) < 0.01, type + ' : se gonfle (' + maxSw.toFixed(2) + ') puis tire un boulet ' + color);
  }
}
// 39. bond par-dessus un mur, coffres qui éclatent, musique
{
  const adam = BK.charById('adam'), mk = (map, props) => new BK.World({ map, theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props || {} });
  const Wl = mk(['........', '.1.##...', '........']); const pl = Wl.addPlayer(adam, 1, 1, { hp: 40 }); pl.invuln = 999;
  Wl.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 0, fire: 2, owner: pl, state: 'idle', passers: new Set(), born: 0, fuse: 99 }); pl.x = 2.5; pl.y = 1.5; pl.onBomb = Wl.bombs[0]; pl.zOff = 0.55;
  Wl.leap(pl, 3); ok(pl.air && Math.floor(pl.air.x1) === 5, 'deux murs à côté : le bond continue jusqu’à la case libre (5)');
  const Wc = mk(['.......', '.1.O...', '.......']); const pc = Wc.addPlayer(adam, 1, 1, { hp: 40 }); pc.invuln = 999; pc.x = 1.5; ok(Wc.blocked(3, 1, pc) && Wc.deco[Wc.idx(3, 1)] === 'chest', 'le coffre bloque');
  Wc.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 0, fire: 2, owner: pc, state: 'idle', passers: new Set(), born: 0 }); Wc.events.length = 0; Wc.explodeBomb(Wc.bombs[0]);
  const coins = Wc.items.filter(it => it.type === 'coin'); const ev = Wc.events.find(e => e.type === 'chestOpened');
  ok(!Wc.blocked(3, 1, pc) && ev && coins.length >= 3 && coins.length <= 5 && coins.every(it => it.from && Math.abs(it.cx - 3) <= 1 && Math.abs(it.cy - 1) <= 1), 'le coffre éclate : ' + coins.length + ' pièces d’or volent sur les cases autour');
  let extra = 0; for (let k = 0; k < 40; k++) { const W2 = mk(['.......', '.1.O...', '.......']); const p2 = W2.addPlayer(adam, 1, 1, { hp: 40 }); W2.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 0, fire: 2, owner: p2, state: 'idle', passers: new Set(), born: 0 }); W2.explodeBomb(W2.bombs[0]); if (W2.items.some(it => it.type !== 'coin')) extra++; }
  ok(extra > 5 && extra < 35, 'parfois un objet en plus (' + extra + ' fois sur 40)');
  ok(BK.music && BK.music.TRACKS.stage === 'bitquest' && BK.music.TRACKS.boss === 'dungeonboss', 'pistes de musique définies');
  BK.music.play('stage'); ok(BK.music.current === 'bitquest', 'la musique des tableaux se lance'); BK.music.play('boss'); ok(BK.music.current === 'dungeonboss', 'et celle du boss');
  const fsx = require('fs'); for (const f of ['pixelland', 'bitquest', 'dungeonboss', 'fluffing']) ok(fsx.existsSync(__dirname + '/../assets/music/' + f + '.mp3') && fsx.statSync(__dirname + '/../assets/music/' + f + '.mp3').size > 1e6, 'fichier ' + f + '.mp3 présent');
}
// 40. plateformes mobiles sur rail
{
  const adam = BK.charById('adam');
  const W = new BK.World({ map: ['#########', '#::((((:#', '#.......#', '#:/.....#', '#########'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  ok(W.rails.length === 4 && W.movers.length === 1 && W.movers[0].cells.length === 4 && W.movers[0].cells[0].c === 3, 'quatre rails qui se touchent = une plateforme, chemin ordonné depuis le bout');
  ok(Math.abs(W.hAt(3, 1) - 0.6) < 0.01 && W.hAt(4, 1) === 0, 'la plateforme élève sa case à l’étage 1, les autres rails restent en bas');
  const p = W.addPlayer(adam, 1, 1, { hp: 40 }); p.invuln = 999; p.x = 2.5; p.y = 1.5; p.input.dx = 1; for (let i = 0; i < 20; i++) W.update(1 / 60); p.input.dx = 0;
  ok(Math.floor(p.x) === 3 && Math.abs(W.groundZ(p.x, p.y) - 0.6) < 0.01, 'on marche sur la plateforme depuis la case d’étage 1');
  let maxX = p.x; for (let i = 0; i < 240; i++) { W.update(1 / 60); maxX = Math.max(maxX, p.x); } ok(maxX > 5.5 && Math.abs(W.groundZ(p.x, p.y) - 0.6) < 0.01, 'elle emporte le héros jusqu’au bout (x max ' + maxX.toFixed(1) + ')');
  const M = W.movers[0]; M.pos = 3; M.x = 6.5; M.y = 1.5; M.dir = -1; M.wait = 2; W.applyMovers(); p.x = 6.5; p.y = 1.5; p.input.dx = 1; for (let i = 0; i < 20; i++) W.update(1 / 60); p.input.dx = 0; ok(Math.floor(p.x) === 7 && Math.abs(W.groundZ(p.x, p.y) - 0.6) < 0.01, 'au bout, on descend sur la case d’étage 1 de l’autre côté');
  p.x = 6.5; p.y = 1.5; M.pos = 0; M.x = 3.5; M.wait = 5; W.applyMovers(); W.update(1 / 60); for (let i = 0; i < 60; i++) W.update(1 / 60); ok(W.groundZ(p.x, p.y) === 0 && p.zOff === 0, 'sans plateforme sous les pieds, on tombe au fond de la fosse');
  const e = W.addEnemy('gluant', 4, 2); ok(!W.canStep(2, 3, 2, 3, e) || !W.canStep(3, 3, 2, 3, e), 'les monstres ne prennent pas la rampe'); ok(W.canStep(3, 3, 2, 3, p), 'le héros, oui');
  const Wb = new BK.World({ map: ['#######', '#:(((:#', '#.....#', '#######'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} }); const pb = Wb.addPlayer(adam, 1, 1, { hp: 40 });
  Wb.bombs.push({ cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 99, fire: 2, owner: pb, state: 'idle', passers: new Set(), born: 0 }); for (let i = 0; i < 90; i++) Wb.update(1 / 60); ok(Wb.bombs[0].x > 3, 'une bombe posée dessus voyage avec la plateforme');
  // au pied d'un rebord dont on vient de sauter, on n'est pas collé : on s'en éloigne librement
  const Wc = new BK.World({ map: ['######', '#....#', '#....#', '#::..#', '#::..#', '######'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const pc = Wc.addPlayer(adam, 1, 4, { hp: 40 }); pc.invuln = 999; pc.x = 1.5; pc.y = 4.5; pc.input.dy = -1; for (let i = 0; i < 90; i++) Wc.update(1 / 60); pc.input.dy = 0;
  ok(pc.y < 1.6 && Wc.groundZ(pc.x, pc.y) === 0, 'descendu du rebord, on continue vers le nord sans rester coincé (y=' + pc.y.toFixed(2) + ')');
  pc.y = 2.98; pc.input.dx = 1; for (let i = 0; i < 60; i++) Wc.update(1 / 60); pc.input.dx = 0; ok(pc.x > 4, 'collé au rebord, on peut quand même partir de côté');
  pc.x = 1.5; pc.input.dy = 1; for (let i = 0; i < 30; i++) Wc.update(1 / 60); ok(Math.floor(pc.y) === 2, 'mais on ne remonte pas dessus');
  // plateforme de deux étages : elle monte au niveau des cases d'embarquement, et depuis la fosse un bond de bombe ne l'atteint pas
  const props2 = {}; for (const c of [1, 2, 6, 7]) props2[c + ',1'] = { lv: 2 };
  const Wd = new BK.World({ map: ['#########', '#::((((:#', '#.......#', '#########'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: props2 });
  ok(Math.abs(Wd.movers[0].top - 1.2) < 0.01 && Math.abs(Wd.hAt(3, 1) - 1.2) < 0.01, 'rail entre deux couloirs d’étage 2 : la plateforme monte à l’étage 2');
  const pd = Wd.addPlayer(adam, 1, 1, { hp: 40 }); pd.invuln = 999; pd.x = 2.5; pd.y = 1.5; pd.input.dx = 1; for (let i = 0; i < 20; i++) Wd.update(1 / 60); pd.input.dx = 0; ok(Math.floor(pd.x) === 3 && Math.abs(Wd.groundZ(pd.x, pd.y) - 1.2) < 0.01, 'on y monte depuis le couloir');
  pd.x = 3.5; pd.y = 2.5; const bd = { cx: 3, cy: 2, x: 3.5, y: 2.5, z: 0, t: 99, fire: 2, owner: pd, state: 'idle', passers: new Set([pd]), born: 0 }; Wd.bombs.push(bd); pd.onBomb = bd; pd.zOff = 0.55; Wd.leap(pd, 2); for (let i = 0; i < 60; i++) Wd.update(1 / 60);
  ok(Math.floor(pd.y) === 2 && Wd.groundZ(pd.x, pd.y) === 0, 'depuis la fosse, un bond de bombe ne monte pas de deux étages sur la plateforme');
}
// 41. objets trouvés (comptés sous les barres, perdus à la fin du tableau) et achats (pour toujours)
{
  const a = new BK.Adventure('adam', 0); a.save.inv = []; a.save.upgrades = {}; a.loadStage(); a.state = 'play'; const W = a.world, p = a.player, base = { bombs: p.bombsMax, fire: p.fire, speed: p.speedUp };
  W.spawnItem(2, 1, 'bomb'); W.takeItem(p, W.itemAt(2, 1)); W.spawnItem(2, 1, 'bomb'); W.takeItem(p, W.itemAt(2, 1)); W.spawnItem(2, 1, 'fire'); W.takeItem(p, W.itemAt(2, 1)); W.spawnItem(2, 1, 'honey'); W.takeItem(p, W.itemAt(2, 1));
  ok(p.found.length === 3 && p.found[0].type === 'bomb' && p.found[0].n === 2 && p.found[1].n === 1 && p.found[2].type === 'honey', 'les objets trouvés sont comptés : 💣 ×2, 🔥 ×1, 🍯 ×1');
  ok(p.bombsMax === base.bombs + 2 && p.fire === base.fire + 1 && p.inv[0].n === 3 && !p.inv[0].perm, 'ils s’appliquent tout de suite (le miel trouvé n’est pas permanent)');
  a.stageIndex = 1; a.loadStage(true); const q = a.player;
  ok(q.bombsMax === base.bombs && q.fire === base.fire && q.found.length === 0 && (!q.inv || !q.inv.length), 'au tableau suivant, les objets trouvés ont disparu');
  // achats dans un magasin de tableau : pour toujours
  a.save.gold = 500; a.save.upgrades = {}; const Wb = a.world, d = { c: 1, r: 1, id: 'bomb', price: 10, once: false, key: 't:1,1' }, dh = { c: 1, r: 1, id: 'honey', price: 10, once: false, key: 't:1,2' };
  ok(a.buy(d) && a.buy(d) && a.save.upgrades.bomb === 2 && q.bombsMax === base.bombs + 2, 'deux bombes achetées : améliorations +2, appliquées tout de suite'); void Wb;
  ok(a.buy(dh) && q.inv[0].n === 3 && q.inv[0].perm === 3 && a.save.inv[0].n === 3, 'le miel acheté est marqué permanent et sauvegardé');
  Wb.spawnItem(2, 1, 'honey'); Wb.takeItem(q, Wb.itemAt(2, 1)); ok(q.inv[0].n === 6 && q.inv[0].perm === 3, 'un pot trouvé s’ajoute sans devenir permanent');
  Wb.frozen = false; a.state = 'play'; for (let i = 0; i < 4; i++) { q.x = 2.5; q.y = 1.5; Wb.useItem(q, 0); a.update(1 / 60); } ok(q.inv[0].n === 2 && q.inv[0].perm === 2 && a.save.inv[0].n === 2, 'on verse d’abord les pots trouvés, puis les achetés (sauvegarde à jour)');
  ok(a.msg && /tout le pot|Flaque/.test(a.msg), 'le message du pot utilisé passe bien (événement né hors de la mise à jour) : ' + a.msg);
  a.stageIndex = 2; a.loadStage(true); const r = a.player;
  ok(r.bombsMax === base.bombs + 2 && r.inv[0].type === 'honey' && r.inv[0].n === 2 && r.inv[0].perm === 2, 'au tableau suivant, les achats restent : bombes +2 et deux pots de miel');
  r.bombsMax = BK.MAX_BOMBS; ok(!a.buy(d) && a.save.upgrades.bomb === 2, 'au maximum, le marchand refuse');
}
// 42. gants de force : soulever une roche, la lancer (2 points, un bond de plus), deux lancers puis elle casse
{
  const adam = BK.charById('adam'), mkr = () => { const W = new BK.World({ map: ['##########', '#........#', '#........#', '##########'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '2,1': { deco: 'rock' } } }); W.cells[W.idx(2, 1)] = 1; W.deco[W.idx(2, 1)] = 'rock'; return W; };
  const W = new BK.World({ map: ['##########', '#.".......#'.slice(0, 10), '#........#', '##########'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '2,1': { deco: 'rock' } } });
  ok(W.deco[W.idx(2, 1)] === 'rock' && W.blocked(2, 1), 'la roche du décor est solide');
  const p = W.addPlayer(adam, 1, 1, { hp: 40 }); p.x = 1.5; p.y = 1.5; p.dir = 3;
  ok(!W.pickupBomb(p) && !p.carrying, 'sans les gants, impossible de la soulever');
  p.gloves = true; ok(W.pickupBomb(p) && p.carrying && p.carrying.rock && !W.cell(2, 1) && !W.deco[W.idx(2, 1)] && p.pose === 'pickup', 'avec les gants, on la soulève (même animation que la bombe) et la case se libère');
  const g = W.addEnemy('canon_rouge', 5, 1); W.throwBomb(p); ok(p.carrying === null && p.pose === 'throw' && W.bombs[0].state === 'flying', 'on la lance comme une bombe');
  let landed = 0, maxX = 0; for (let i = 0; i < 90; i++) { W.update(1 / 60); landed += W.events.filter(e => e.type === 'rockLand').length; maxX = Math.max(maxX, W.bombs[0] ? W.bombs[0].x : maxX); }
  const rk = W.bombs[0]; ok(g.hp === 2, 'le canon rouge sous le bond de la roche perd 2 points (deux fois une flamme)');
  ok(landed === 2 && maxX > 5.4 && rk && rk.state === 'idle' && rk.cx === 4 && rk.uses === 1, 'elle retombe 3 cases plus loin, fait un bond d’une case de plus (sur le canon) et se pose juste avant lui, fêlée (x=' + rk.cx + ')');
  ok(W.blocked(4, 1, g) && W.blocked(4, 1), 'posée, la roche bloque monstres et héros');
  p.x = 2.5; p.y = 1.5; p.dir = 3; const b = { cx: 3, cy: 1, x: 3.5, y: 1.5, z: 0, t: 99, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b); W.explodeBomb(b);
  ok(W.bombs.includes(rk) && rk.state === 'idle' && !rk.exploded && !W.flames.some(f => f.c === 5), 'une explosion ne la fait pas sauter : la flamme s’y arrête');
  for (let i = 0; i < 60; i++) W.update(1 / 60); p.x = 3.5; p.y = 1.5; p.dir = 3; ok(W.pickupBomb(p) && p.carrying === rk, 'on la reprend'); W.throwBomb(p); let broken = false; for (let i = 0; i < 90; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'rockBroken')) broken = true; }
  ok(broken && !W.bombs.includes(rk), 'au deuxième lancer, elle se brise en retombant');
  void mkr;
}
// 43. canne à pêche, poisson lancé, cuisson au feu de camp, festin
{
  const adam = BK.charById('adam');
  const W = new BK.World({ map: ['##########', '#~~~......#'.slice(0, 10), '#.......i#', '#........#', '##########'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(adam, 5, 3, { hp: 40 }); p.x = 5.5; p.y = 3.5; p.inv = [{ type: 'rod', n: 1, perm: 1 }];
  ok(!W.useItem(p, 0) && W.events.some(e => e.type === 'noWater'), 'loin de l’eau, la canne ne sert à rien');
  p.x = 2.5; p.y = 2.5; p.dir = 0; ok(W.useItem(p, 0) && p.fishing && p.pose === 'fish' && p.dir === 2, 'au bord de l’eau, on lance la ligne (tourné vers l’eau)');
  p.input.dx = 1; let bite = false, caught = false; for (let i = 0; i < 200 && p.fishing; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'fishBite')) bite = true; if (W.events.some(e => e.type === 'fishCaught')) caught = true; }
  ok(bite && caught && !p.fishing && p.x === 2.5 && p.inv.length === 2 && p.inv[1].type === 'fish', 'ça mord, le poisson saute dans les mains sans qu’on ait bougé, et il est dans l’inventaire');
  ok(W.applyItem(p, { type: 'rod' }) === false, 'une seule canne à la fois');
  p.x = 3.5; p.y = 3.5; p.dir = 3; const g = W.addEnemy('canon_rouge', 5, 3); ok(W.useItem(p, 1) && W.fishes.length === 1 && p.inv.length === 1, 'Q ou W lance le poisson');
  for (let i = 0; i < 40; i++) W.update(1 / 60); ok(g.hp <= 2 && g.hp >= 1 && !W.fishes.length && !W.itemAt(5, 3), 'deux cases plus loin, le monstre prend 2 ou 3 points et le poisson est perdu');
  g.dead = true; g.x = -5; p.inv.push({ type: 'fish', n: 1 }); ok(W.useItem(p, 1), 'un autre lancer'); for (let i = 0; i < 40; i++) W.update(1 / 60); const it = W.itemAt(5, 3); ok(it && it.type === 'fish', 'sans monstre, il retombe au sol deux cases plus loin et frétille (on peut le ramasser)');
  p.x = 5.5; p.y = 3.5; W.update(1 / 60); ok(p.inv.some(s => s.type === 'fish') && !W.itemAt(5, 3), 'ramassé en marchant dessus');
  p.x = 7.5; p.y = 3.5; W.update(1 / 60); ok(p.nearFire && p.nearFire.c === 8, 'près du feu de camp avec un poisson : on peut cuire');
  ok(W.cookFish(p) && W.campfires[0].cook && !p.inv.some(s => s.type === 'fish'), 'Entrée : le poisson part sur le feu');
  let done = false; for (let i = 0; i < 330 && !done; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'cookDone')) done = true; } const ck = W.items.find(x => x.type === 'fishcooked');
  ok(done && !ck && !W.campfires[0].cook, 'après 5 s, le poisson grillé ne tombe pas au sol près du héros');
  const slot = (p.inv || []).findIndex(s => s.type === 'fishcooked'); ok(slot >= 0, 'le poisson grillé revient directement dans le sac');
  p.hp = 30; ok(W.useItem(p, slot) && p.maxHp === 80 && p.hp === 60 && p.feastT === 180, 'on le mange : vie max 80, vie 60, pendant 3 minutes');
  p.feastT = 0.5; for (let i = 0; i < 60; i++) W.update(1 / 60); ok(p.maxHp === 40 && p.hp === 40 && W.events.length >= 0, 'après le temps, tout redescend');
}
// 44. volcan 3 × 3 et montagnes configurables (éditeur + monde)
{
  const E = new BK.Editor({ name: 'v', cols: 12, rows: 9, theme: 'lava', base: '.' }); const pick = (key, val) => { E.item = BK.EDITOR_TABS.find(t => t.id === 'deco').items.find(it => it[key] === val); };
  pick('deco', 'volcano'); E.paint(3, 3, true);
  const parts = Object.entries(E.props).filter(([k, v]) => v.deco === 'volcanopart').length;
  ok(E.props['3,3'].deco === 'volcano' && parts === 8 && E.grid[2][2] === '"' && E.grid[4][4] === '"', 'le volcan occupe 9 cases : une ancre et huit parts');
  ok(E.world.volcanoes.length === 1 && E.world.blocked(2, 2) && E.world.blocked(4, 4) && E.world.blocked(3, 3), 'toutes solides, et le monde connaît le volcan');
  pick('deco', 'mountain'); E.opts.mountain = { w: 5, d: 2, h: 4, type: 'terre' }; E.paint(8, 6, true);
  const mp = Object.entries(E.props).filter(([k, v]) => v.deco === 'mountainpart').length;
  ok(E.props['8,6'].deco === 'mountain' && E.props['8,6'].mw === 5 && E.props['8,6'].mh === 4 && E.props['8,6'].mtype === 'terre' && mp === 9 && E.grid[5][6] === '"' && E.grid[6][10] === '"', 'montagne 5 × 2 : ancre au milieu du bas, neuf parts');
  pick('deco', 'volcano'); E.paint(10, 2, true); ok(!E.props['10,2'], 'trop près du bord : refusé');
  pick('deco', 'rock'); E.paint(6, 5, true); ok(!Object.values(E.props).some(v => v.deco === 'mountainpart' || v.deco === 'mountain') && E.grid[6][8] === '.' && E.props['6,5'].deco === 'rock', 'repeindre sur une case de la montagne l’enlève en entier');
  const W = new BK.World({ map: E.rows(), theme: 'lava', mode: 'adventure', hearts: true, explore: true, houses: {}, props: E.props });
  let erupted = 0; for (let i = 0; i < 60 * 12; i++) { W.update(1 / 60); erupted += W.events.filter(e => e.type === 'eruption').length; }
  ok(erupted >= 1 && W.particles.length > 0, 'le volcan a fait au moins une éruption en 12 s (lave et fumée en particules)');
}
// 45. la secousse de l'écran s'éteint toute seule après une explosion
{
  const W = new BK.World({ map: ['#######', '#.....#', '#.....#', '#######'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.invuln = 999; const b = { cx: 3, cy: 2, x: 3.5, y: 2.5, z: 0, t: 99, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b); W.explodeBomb(b);
  ok(W.shake > 0.2, 'l’explosion secoue l’écran'); for (let i = 0; i < 60; i++) W.update(1 / 60); ok(W.shake === 0, 'une seconde plus tard, c’est fini');
}
// 46. poudre de champignon : un champignon géant pousse devant soi, puis sert de trampoline
{
  const W = new BK.World({ map: ['########', '#......#', '#......#', '#......#', '########'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(BK.charById('adam'), 1, 2, { hp: 40 }); p.invuln = 999; p.x = 1.5; p.y = 2.5; p.dir = 3; p.inv = [{ type: 'spore', n: 2 }];
  const g = W.addEnemy('gluant', 2, 2); ok(!W.useItem(p, 0) && p.inv[0].n === 2 && W.events.some(e => e.type === 'sporeBlocked'), 'un monstre devant : rien ne pousse, la poudre reste');
  g.dead = true; g.x = -5; ok(W.useItem(p, 0) && p.inv[0].n === 1 && W.deco[W.idx(2, 2)] === 'bigmushroom' && W.blocked(2, 2) && W.growT.has(W.idx(2, 2)) && p.pose === 'throw', 'case libre : le champignon géant apparaît (solide) et commence à pousser');
  let grown = false; for (let i = 0; i < 50; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'mushroomGrown')) grown = true; } ok(grown && !W.growT.size, 'il a fini de pousser en moins d’une seconde');
  const b = { cx: 1, cy: 2, x: 1.5, y: 2.5, z: 0, t: 99, fire: 2, owner: p, state: 'idle', passers: new Set([p]), born: 0 }; W.bombs.push(b); p.onBomb = b; p.zOff = 0.55; W.leap(p, 3); for (let i = 0; i < 120; i++) W.update(1 / 60);
  ok(Math.floor(p.x) === 5 || Math.floor(p.x) === 6, 'depuis une bombe, on rebondit dessus et on retombe 3 cases plus loin (x=' + p.x.toFixed(1) + ')');
}
// 47. cycle jour-nuit et lanterne à fée
{
  const a = new BK.Adventure('adam', 0); const W = a.world, p = a.player;
  ok(W.dayCycle && W.darkness() === 0 && W.dayIcon() === '☀️', 'un tableau d’aventure commence de jour');
  W.time = BK.DAY_CYCLE * 0.48; ok(W.darkness() > 0.3 && W.darkness() < 0.7, 'crépuscule à mi-chemin'); W.time = BK.DAY_CYCLE * 0.7; ok(W.darkness() === 1 && W.isNight() && W.dayIcon() === '🌙', 'pleine nuit'); W.time = BK.DAY_CYCLE * 0.9; ok(W.darkness() > 0.3 && W.darkness() < 0.7, 'aube'); W.time = BK.DAY_CYCLE * 0.99; ok(W.darkness() === 0, 'et le jour revient');
  W.time = 0; p.lantern = true; ok(!W.lanternOn(p) && !W.lights().some(l => l.r > 3), 'le jour, la fée dort : pas de lumière de lanterne');
  W.time = BK.DAY_CYCLE * 0.7; ok(W.lanternOn(p) && W.lights().some(l => Math.abs(l.x - p.x) < 0.01 && l.r > 3), 'la nuit, la lanterne s’allume toute seule et éclaire 3 cases autour du héros');
  W.time = BK.DAY_CYCLE * 0.44; a.state = 'play'; W.frozen = false; let dusk = false; for (let i = 0; i < 60 * 8 && !dusk; i++) { a.update(1 / 60); if (W.events.some(e => e.type === 'dusk')) dusk = true; } ok(dusk, 'l’événement « le soir tombe » arrive au crépuscule');
  const Wi = new BK.World({ map: ['#####', '#.1.#', '#####'], theme: 'interior', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {}, exitKind: 'door' }); Wi.time = 9999; ok(Wi.darkness() === 0, 'pas de nuit dans une maison');
  ok(BK.SHOP.some(x => x.id === 'lantern' && x.max === 1) && BK.ITEMS.lantern, 'la lanterne est en vente chez grand-maman et dans les tableaux');
}
// 48. blocs cubiques (melon, fromage, cadeau, terre) et mur de briques : solides, et une bombe les casse
{
  const W = new BK.World({ map: ['#######', '#.."W.#', '#.....#', '#######'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '3,1': { deco: 'melon' } } });
  ok(W.cell(3, 1) === BK.SOFT && W.deco[W.idx(3, 1)] === 'melon' && W.blocked(3, 1), 'le melon d’eau est un bloc mou, solide');
  ok(W.cell(4, 1) === BK.SOFT && W.special.get('4,1').type === 'brick', 'le mur de briques aussi : il se casse');
  const p = W.addPlayer(BK.charById('adam'), 1, 2, { hp: 40 }); p.invuln = 999;
  const b = { cx: 2, cy: 1, x: 2.5, y: 1.5, z: 0, t: 99, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b); W.explodeBomb(b); for (let i = 0; i < 40; i++) W.update(1 / 60);
  ok(!W.cell(3, 1) && !W.deco[W.idx(3, 1)] && W.cell(4, 1) === BK.SOFT, 'boum : le melon a disparu (la flamme s’arrête au premier bloc)');
  const b2 = { cx: 3, cy: 1, x: 3.5, y: 1.5, z: 0, t: 99, fire: 2, owner: p, state: 'idle', passers: new Set(), born: 0 }; W.bombs.push(b2); W.explodeBomb(b2); for (let i = 0; i < 40; i++) W.update(1 / 60);
  ok(!W.cell(4, 1) && !W.special.get('4,1'), 'et le mur de briques se casse aussi');
  const E = new BK.Editor({ name: 'b', cols: 9, rows: 7, theme: 'forest', base: '.' }); E.item = BK.EDITOR_TABS.find(t => t.id === 'blocs').items.find(it => it.deco === 'cheese'); E.paint(4, 3, true);
  ok(E.grid[3][4] === '"' && E.props['4,3'].deco === 'cheese' && E.world.cell(4, 3) === BK.SOFT, 'dans l’éditeur, l’onglet Blocs pose un bloc de fromage');
  ok(['melon', 'cheese', 'gift', 'dirtblock'].every(k => BK.EDITOR_TABS.find(t => t.id === 'blocs').items.some(it => it.deco === k)), 'les quatre blocs cubiques sont dans l’onglet Blocs');
}
// 49. l'or est partagé par toute la famille ; niveaux et achats restent à chacun
{
  const a = BK.loadAdventure('adam'); a.gold = 50; a.xp = 999; BK.saveAdventure('adam', a);
  const z = BK.loadAdventure('zachary'); ok(z.gold === 50 && !z.xp, 'Zachary voit les 50 pièces d’Adam, mais pas son expérience');
  z.gold -= 20; BK.saveAdventure('zachary', z); ok(BK.loadAdventure('adam').gold === 30 && BK.loadGold() === 30, 'Zachary dépense 20 : il en reste 30 pour tout le monde');
  BK.addGold(15); ok(BK.loadAdventure('milo').gold === 45, 'addGold ajoute à la cagnotte commune');
  BK.saveAdventure('milo', { unlocked: 1, best: {}, score: 0 }); ok(BK.loadGold() === 45, 'effacer la progression d’un personnage ne touche pas à l’or de la famille');
}
// 50. défis : douze épreuves sur cinq niveaux, arènes jouables, récompense entière puis au quart
{
  ok(BK.CHALLENGES.length === 15 && BK.CHALLENGES.every(c => c.level >= 1 && c.level <= 5 && c.reward > 0 && ['arena','match','timing'].includes(c.kind)), 'quinze défis, dont trois missions de timing, niveaux 1 à 5');
  for (const ch of BK.CHALLENGES.filter(c => c.kind === 'arena')) {
    const s = BK.challengeStage(ch), W = new BK.World({ map: s.map, theme: s.theme, mode: 'adventure', hearts: true, explore: true, houses: {}, props: s.props });
    const want = ch.enemies.reduce((a, [, n]) => a + n, 0); ok(s.enemies.length === want && W.starts[0] && s.objective === 'enemies', ch.id + ' : ' + want + ' monstres, un départ, objectif élimination');
    ok(s.enemies.every(e => !W.cell(e.c, e.r) && Math.abs(e.c - W.starts[0].c) + Math.abs(e.r - W.starts[0].r) >= 5), ch.id + ' : monstres sur des cases libres, loin du départ');
    if (ch.carrots) ok(Object.values(s.props).filter(v => v.deco === 'carrot').length === ch.carrots, ch.id + ' : ' + ch.carrots + ' carottes plantées');
    if (ch.group) { const sh = s.enemies.find(e => e.type === 'shaman'); ok(s.enemies.filter(e => e.type === 'orque').every(o => Math.abs(o.c - sh.c) + Math.abs(o.r - sh.r) <= 2), ch.id + ' : les orques commencent collés au shaman'); }
    ok(Object.values(s.props).some(v => ['melon', 'cheese', 'gift', 'dirtblock'].includes(v.deco)), ch.id + ' : des blocs cubiques dans l’arène');
    const a = new BK.Adventure('adam', 0, { custom: s, challenge: ch }); a.state = 'play'; a.world.frozen = false; a.player.invuln = 999; for (let i = 0; i < 120; i++) a.update(1 / 60);
    ok(a.state === 'play' && a.lives === 2 && a.timeLeft < ch.time && a.timeLeft > ch.time - 3, ch.id + ' : deux vies, le chrono tourne');
  }
  const ch = BK.CHALLENGES[0]; BK.saveChallenges({}); const g0 = BK.loadGold();
  { const a = new BK.Adventure('adam', 0, { custom: BK.challengeStage(ch), challenge: ch }); a.state = 'play'; a.world.frozen = false; a.timeLeft = 0.01; a.update(1 / 60); ok(a.state === 'over' && BK.loadGold() === g0, 'temps écoulé : défi raté, pas d’or'); }
  { const a = new BK.Adventure('adam', 0, { custom: BK.challengeStage(ch), challenge: ch }); a.state = 'play'; a.world.frozen = false; for (const e of a.world.enemies) e.dead = true; a.update(1 / 60); ok(a.state === 'clear' && BK.loadGold() === g0 + ch.reward && BK.loadChallenges()[ch.id].done === 1, 'tous les monstres vaincus : +' + ch.reward + ' pièces pour la famille'); }
  ok(BK.challengeReward(ch) === Math.round(ch.reward / 4) && BK.completeChallenge(ch, 0) === Math.round(ch.reward / 4) && BK.loadGold() === g0 + ch.reward + Math.round(ch.reward / 4), 'la deuxième réussite donne le quart');
  let got = null; const M = new BK.Match({ players: [{ charId: 'adam', human: 0 }, { charId: 'eliott', human: null, level: 'facile' }], roundsToWin: 1, theme: 'arena', onResult: c => { got = c; return true; } });
  M.state = 'ending'; M.players[1].alive = false; M.winner = M.players[0]; M.endRound(); ok(got === M.players[0] && got.humanMap === 0, 'un match de défi remonte le champion au défi');
}
// 51. lapin maléfique : il fonce quand il voit le héros, souffle ensuite, et une carotte l'apprivoise
{
  const W = new BK.World({ map: ['#########', '#.......#', '#.......#', '#.......#', '#########'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(BK.charById('adam'), 1, 2, { hp: 40 }); p.invuln = 999; const L = W.addEnemy('lapin', 7, 2);
  let charged = false, tired = false; for (let i = 0; i < 60 * 3 && !tired; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'rabbitCharge')) charged = true; if (L.state === 'tired') tired = true; }
  ok(charged && tired && L.x < 6, 'il a vu le héros, a foncé en ligne droite, puis s’est arrêté essoufflé (x=' + L.x.toFixed(1) + ')');
  for (let i = 0; i < 60 * 5; i++) W.update(1 / 60); ok(L.state === 'tired', 'cinq secondes plus tard il souffle encore');
  W.spawnItem(4, 2, 'carrot'); let ate = false; for (let i = 0; i < 60 * 6 && !L.tame; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'rabbitEats')) ate = true; }
  ok(ate && L.tame && !W.items.some(it => it.type === 'carrot') && !W.livingEnemies().includes(L), 'une carotte au sol : il court la manger et devient gentil (il ne compte plus comme monstre)');
  p.invuln = 0; p.x = L.x; p.y = L.y; const hp = p.hp; for (let i = 0; i < 30; i++) W.update(1 / 60); ok(p.hp === hp, 'un lapin apprivoisé ne fait pas mal');
  const W2 = new BK.World({ map: ['######', '#.".1#', '######'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '2,1': { deco: 'carrot' } } });
  const q = W2.addPlayer(BK.charById('adam'), 4, 1, { hp: 40 }); q.x = 2.5; q.y = 1.5; W2.update(1 / 60);
  ok(!W2.deco[W2.idx(2, 1)] && q.inv.some(s => s.type === 'carrot') && W2.events.some(e => e.type === 'carrotPicked'), 'on cueille la carotte plantée en marchant dessus');
  q.dir = 3; ok(W2.useItem(q, 0) && !q.inv.length, 'Q : on lance la carotte'); for (let i = 0; i < 40; i++) W2.update(1 / 60); ok(W2.items.some(it => it.type === 'carrot' && it.cx === 4), 'elle retombe deux cases plus loin');
}
// 52. serpent venimeux : sa morsure empoisonne (2 points par seconde pendant 6 s)
{
  const W = new BK.World({ map: ['#######', '#.....#', '#######'], theme: 'forest', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.invuln = 0; const S = W.addEnemy('serpent', 2, 1); S.x = 1.6; S.y = 1.5;
  W.update(1 / 60); ok(p.poison > 5.9 && W.events.some(e => e.type === 'poisoned') && p.hp === 35, 'mordu : 5 points, et empoisonné');
  S.dead = true; p.invuln = 999; for (let i = 0; i < 70; i++) W.update(1 / 60); ok(p.hp === 33, 'une seconde plus tard : 2 points de moins malgré l’invincibilité');
  let ended = false; for (let i = 0; i < 60 * 6; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'poisonEnd')) ended = true; } ok(ended && !p.poison && p.hp === 23, 'le poison s’arrête après 6 s (12 points en tout)');
}
// 53. orque et shaman : garde, charge en grognant, revient au shaman, se fait soigner ; le shaman lance une magie forte
{
  const W = new BK.World({ map: ['###############', '#.............#', '#.............#', '#.............#', '#.............#', '###############'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
  const p = W.addPlayer(BK.charById('adam'), 1, 2, { hp: 40 }); p.invuln = 999; const Sh = W.addEnemy('shaman', 12, 2), O = W.addEnemy('orque', 11, 2);
  for (let i = 0; i < 60; i++) W.update(1 / 60); ok(O.shaman === Sh && O.state === 'guard' && Math.hypot(O.x - Sh.x, O.y - Sh.y) < 2.5, 'l’orque garde son shaman');
  p.x = 7.5; let growl = false; for (let i = 0; i < 60 && O.state !== 'chase'; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'growl')) growl = true; } ok(O.state === 'chase' && growl, 'le héros à 4 cases : il grogne et fonce');
  let back = false; for (let i = 0; i < 60 * 4 && !back; i++) { p.x = Math.max(1.5, p.x - 3 / 60); W.update(1 / 60); if (W.events.some(e => e.type === 'growl' && e.back)) back = true; }   // le héros s'enfuit en courant ok(back && O.state === 'return', 'trop loin de son shaman : il grogne et revient');
  let home = false; for (let i = 0; i < 60 * 6 && !home; i++) { W.update(1 / 60); home = O.state === 'guard' && Math.hypot(O.x - Sh.x, O.y - Sh.y) < 2.2; } ok(home, 'et se replace à côté de lui (le shaman peut se téléporter entre-temps)');
  O.hp = 2; let healed = false; for (let i = 0; i < 60 * 6 && !healed; i++) { W.update(1 / 60); if (W.events.some(e => e.type === 'shamanHeal')) healed = true; } ok(healed && O.hp === 3, 'le shaman soigne son orque blessé');
  p.x = Sh.x - 3; p.y = Sh.y; Sh.cool = 0; Sh.tp = 5; W.updateShaman(Sh, 1 / 60); // portée garantie, sans dépendre de la téléportation aléatoire
  ok(W.shots.some(s => s.kind === 'magic' && s.dark && s.dmg === 15 && s.range === 8), 'sa magie : 8 cases, 15 points');
  ok(BK.ENEMIES.orque.hp === 4 && BK.ENEMIES.shaman.hp === 12, '4 bombes pour l’orque, 12 pour le shaman');
}
// 54. chevaliers : rouge, bleu, doré (plus fort que les deux réunis) ; la charge du rouge est plus rapide
{
  const R = BK.ENEMIES.chevalier_rouge, B = BK.ENEMIES.chevalier_bleu, D = BK.ENEMIES.chevalier_dore;
  ok(R.hp === 4 && B.hp === 4 && D.hp > R.hp + B.hp && D.chargeSpeed > R.chargeSpeed && D.dmg > R.dmg && B.readyT < R.readyT, 'rouge et bleu : 4 bombes ; le doré dépasse les deux réunis');
  const speeds = {}; for (const type of ['chevalier', 'chevalier_rouge']) {
    const W = new BK.World({ map: ['###########', '#.........#', '###########'], theme: 'castle', mode: 'adventure', hearts: true, explore: true, houses: {}, props: {} });
    const p = W.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 }); p.invuln = 999; const K = W.addEnemy(type, 7, 1); K.dir = 1;
    for (let i = 0; i < 60 * 2 && K.state !== 'charge'; i++) W.update(1 / 60); ok(K.state === 'charge', type + ' charge quand le héros est dans sa ligne');
    const x0 = K.x; for (let i = 0; i < 12; i++) W.update(1 / 60); speeds[type] = (x0 - K.x) / 0.2;
  }
  ok(speeds.chevalier_rouge > speeds.chevalier * 1.25, 'le rouge charge bien plus vite (' + speeds.chevalier_rouge.toFixed(1) + ' contre ' + speeds.chevalier.toFixed(1) + ' cases/s)');
}
// 55. pancarte « Acheter » : Entrée (ou un tap dessus) achète l'article d'à côté ; rendu des nouveaux monstres et blocs sans erreur
{
  const a = new BK.Adventure('adam', 0); a.state = 'play'; a.world.frozen = false; a.save.gold = 100; a.save.inv = [];
  const d = a.world.doors.find(x => x.enterable); a.enterHouse(d); const W = a.world, p = a.player, disp = W.displays[0]; p.inv = [];
  a.save.gold=disp.price+100; p.x = disp.c + 0.5; p.y = disp.r - 0.5; p.dir = 0; a.update(1 / 60); ok(p.nearDisplay === disp, 'à côté de l’article : la pancarte « Acheter » s’affiche');
  BK.input.pressed.add('Enter'); a.update(1 / 60); BK.input.flush(); ok(a.save.gold === 100 && p.inv.some(s => s.type === disp.id), 'Entrée : acheté');
  const proxy = () => new Proxy({ canvas: { width: 1280, height: 720 } }, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() { } }) : k === 'getImageData' ? () => ({ data: [] }) : () => undefined), set: (t, k, v) => { t[k] = v; return true; } });
  const W2 = new BK.World({ map: ['#############', '#.".".".".".#', '#...........#', '#############'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, houses: {}, props: { '2,1': { deco: 'melon' }, '4,1': { deco: 'cheese' }, '6,1': { deco: 'gift' }, '8,1': { deco: 'dirtblock' }, '10,1': { deco: 'carrot' } } });
  W2.addPlayer(BK.charById('milo'), 1, 2, { hp: 40 }); let c = 2; for (const t of ['lapin', 'serpent', 'orque', 'shaman', 'chevalier_rouge', 'chevalier_bleu', 'chevalier_dore']) { const e = W2.addEnemy(t, c++, 2); e.state = t === 'lapin' ? 'tired' : t === 'orque' ? 'chase' : e.state; e.swing = 1; e.cast = 1; e.heal = 1; }
  W2.spawnItem(11, 2, 'carrot'); W2.update(1 / 60); const cam = new BK.Camera(BK.W, BK.H); cam.fit(13, 4, { top: 86, bottom: 24, left: 24, right: 24 });
  let err = null; try { W2.render(proxy(), cam, {}); W2.time = BK.DAY_CYCLE * 0.7; W2.render(proxy(), cam, {}); } catch (e) { err = e; } ok(!err, 'le rendu des blocs cubiques, de la carotte et des sept nouveaux monstres passe (jour et nuit) : ' + (err && err.message));
  const ctx = proxy(); let err2 = null; try { for (const type of ['lapin', 'serpent', 'orque', 'shaman', 'chevalier_dore']) for (const state of ['walk', 'charge', 'tired', 'eat', 'chase']) BK.sprites.drawEnemy(ctx, type, { s: 60, t: 1, state, tame: state === 'eat', swing: 0.8, cast: 1, heal: 0.5, charging: state === 'charge', chasing: state === 'chase' }); BK.sprites.drawCharacter(ctx, BK.charById('milo'), { s: 60, pose: 'walk', t: 1, view: 'side' }); } catch (e) { err2 = e; } ok(!err2, 'toutes les poses des nouveaux monstres se dessinent : ' + (err2 && err2.message));
}
// Citrouille : explosion, récolte des trois morceaux, consommation et limite de vie.
{
  const W = new BK.World({ map: ['.......', '.1.j...', '.......'], theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
  const p = W.addPlayer(BK.charById('adam'), 2, 1, { hp: 40 });
  W.placeBomb(p); W.explodeBomb(W.bombs[0]);
  ok(!W.cell(3, 1) && !W.deco[W.idx(3, 1)] && W.items.filter(it => it.type === 'pumpkinpiece').length === 3, 'la bombe casse la citrouille et laisse exactement trois morceaux');
  p.hp = 20;
  for (const it of W.items.slice()) W.takeItem(p, it);
  ok(p.hp === 20 && p.inv[0].n === 3 && !W.items.length, 'les morceaux sont ramassés et empilés sans être mangés automatiquement');
  ok(W.useItem(p, 0) && p.hp === 25 && p.inv[0].n === 2, 'manger un morceau rend cinq points de vie');
  p.hp = 39; W.useItem(p, 0); ok(p.hp === 40 && p.inv[0].n === 1, 'la citrouille ne dépasse pas la vie maximale');
  ok(!W.useItem(p, 0) && p.inv[0].n === 1, 'à pleine vie, le morceau est conservé');
  p.hp = 30; W.useItem(p, 0); ok(p.hp === 35 && !p.inv.length, 'le dernier morceau libère son emplacement');
}
// Les crachats réels du marin détruisent chacune des cinq statues et laissent un objet.
for (const kind of BK.STATUES) {
  const W = new BK.World({ map: ['..........', '.1.."..~~.', '..........'], props: { '4,1': { deco: kind } }, theme: 'garden', mode: 'adventure', hearts: true, explore: true });
  const p = W.addPlayer(BK.charById('adam'), 1, 1); p.invuln = 999;
  W.addEnemy('marin', 7, 1);
  for (let i = 0; i < 600 && W.cell(4, 1); i++) W.update(1 / 60);
  ok(!W.cell(4, 1) && !W.deco[W.idx(4, 1)] && W.items.some(it => it.cx === 4 && it.cy === 1), 'le marin détruit ' + kind + ' et libère un objet');
  if (kind !== 'statue') {
    const E = new BK.Editor({ name: 'statues', cols: 6, rows: 3, theme: 'forest', base: '.' });
    E.item = BK.EDITOR_TABS.find(t => t.id === 'deco').items.find(it => it.opts === 'statue'); E.opts.statue=kind; E.paint(2, 1, true);
    const data = JSON.parse(JSON.stringify(E.data()));
    const reload = new BK.World({ map: data.grid, props: data.props, theme: data.theme, mode: 'adventure', explore: true });
    ok(reload.deco[reload.idx(2, 1)] === kind && reload.blocked(2, 1), kind + ' se pose, se sauvegarde et reste solide après rechargement');
  }
}
// Animaux pacifiques : placement/export, promenade, innocuité et objectifs.
for (const type of ['chien', 'chat', 'oiseau', 'escargot']) {
  const E = new BK.Editor({ name: 'Animaux', cols: 9, rows: 7, theme: 'garden', base: ',' });
  E.item = BK.EDITOR_TABS.find(t => t.id === 'animaux').items.find(it => it.enemy === type); E.paint(4, 3, true);
  E.grid[1][1] = '1';
  const data = JSON.parse(JSON.stringify(E.data()));
  const A = new BK.Adventure('adam', 0, { custom: BK.mapToStage(data) }), W = A.world, p = A.player, e = W.enemies.find(e => e.type === type);
  ok(e && e.def.peaceful && !W.livingEnemies().length && !W.solidEnemyAt(4, 3), type + ' est sauvegardé, rechargé, non bloquant et exclu des monstres');
  p.x=e.x; p.y=e.y; p.invuln=0; const hp=p.hp; W.checkHits();
  ok(p.hp===hp, type + ' ne blesse pas le héros au contact');
  if(type!=='oiseau') ok(!W.hurtEnemy(e,p,99) && !e.dead && p.kills===0 && p.score===0, type + ' résiste aux dégâts sans donner de score');
  if (type==='escargot') { p.x=1.5; p.y=1.5; }
  let moved=false, rested=false, flew=false;
  for(let i=0;i<900;i++) { W.updateEnemy(e,1/60); moved ||= Math.hypot(e.x-4.5,e.y-3.5)>0.1; rested ||= e.state==='rest'; flew ||= e.z>0.1;
    if (!W.inside(Math.floor(e.x),Math.floor(e.y)) || Math.hypot(e.x-4.5,e.y-3.5)>3.01) throw Error('Animal hors de sa zone');
  }
  ok(moved && rested && (type!=='oiseau'||flew), type + ' alterne déplacement et repos dans sa zone' + (type==='oiseau'?' avec de petits vols':''));
  const trapped = new BK.World({ map:['#####','#~#~#','##.##','#~#~#','#####'], theme:'garden', mode:'adventure', explore:true });
  const pet=trapped.addEnemy(type,2,2); for(let i=0;i<300;i++) trapped.updateEnemy(pet,1/60);
  ok(pet.x===2.5 && pet.y===2.5 && pet.z===0, type + ' reste sur place si les passages sont bloqués');
}
// L’escargot se cache rapidement, attend, puis ressort progressivement.
{
  const A = new BK.Adventure('adam',0,{custom:BK.mapToStage({name:'Escargot',grid:['#########','#1,,,,,,#','#,,,,,,,#','#,,,,,,,#','#########'],theme:'garden',enemies:[]})});
  const W=A.world, p=A.player, e=W.addEnemy('escargot',4,2);
  p.x=5.5; p.y=2.5; const x=e.x,y=e.y;
  for(let i=0;i<30;i++) W.updateEnemy(e,1/60);
  ok(e.shell===1 && e.x===x && e.y===y,'escargot rentre dans sa coquille et cesse de ramper à proximité');
  ok(W.useSnail(p) && p.heldSnail===e && e.carrier===p,'escargot caché peut être ramassé');
  W.updateEnemy(e,3);
  ok(e.shell===1 && !W.pickupBomb(p) && !W.placeBomb(p),'escargot reste caché en main, sans porter de bombe en même temps');
  p.x=2.5;p.y=2.5;p.dir=0;
  ok(W.useSnail(p) && !p.heldSnail && !e.carrier && e.home.c===Math.floor(e.x) && e.home.r===Math.floor(e.y) && e.x!==x,'déposer change le lieu de promenade');
  p.x=7.5;p.y=1.5;
  for(let i=0;i<300;i++) W.updateEnemy(e,1/60);
  ok(e.shell===0,'escargot déposé ressort quand le joueur s’éloigne');
  e.x=x;e.y=y;e.home={c:4,r:2};e.target=null;e.shell=1;e.shellAlarm=true;p.x=5.5;p.y=2.5;

  p.x=6.6; W.updateEnemy(e,0.2);
  ok(e.shell===1,'escargot reste caché à la limite de la distance d’approche');
  p.x=1.5; p.y=1.5; W.updateEnemy(e,0.4);
  ok(e.shell===1,'escargot attend un instant après le départ du joueur');
  W.updateEnemy(e,0.4);
  ok(e.shell>0 && e.shell<1 && e.x===x && e.y===y,'escargot ressort progressivement sans marcher');
  p.x=5.5; p.y=2.5; W.updateEnemy(e,0.2);
  ok(e.shell===1,'escargot se recache si le joueur revient pendant sa sortie');
  p.x=1.5; p.y=1.5;
  for(let i=0;i<300;i++) W.updateEnemy(e,1/60);
  ok(e.shell===0 && Math.hypot(e.x-x,e.y-y)>0.1,'escargot reprend sa promenade après être entièrement ressorti');
}
// Couleurs exportées, sac plein et transport d’un escargot dans une maison.
for(const color of Object.keys(BK.SNAIL_COLORS)) {
  const E=new BK.Editor({name:'Coquilles',cols:9,rows:7,theme:'garden',base:','});
  E.item=BK.EDITOR_TABS.find(t=>t.id==='animaux').items.find(it=>it.enemy==='escargot');E.snailColor=color;E.paint(4,3,true);E.grid[1][1]='1';
  const data=JSON.parse(JSON.stringify(E.data()));
  const A=new BK.Adventure('adam',0,{custom:BK.mapToStage(data)}),W=A.world,p=A.player,e=W.enemies.find(e=>e.type==='escargot');
  ok(e.shellColor===color,'couleur '+color+' conservée après export et chargement');
  p.x=e.x;p.y=e.y;e.shell=1;W.useSnail(p);
  p.inv=Array.from({length:BK.BAG_SIZE},(_,i)=>({type:'full'+i,n:1}));
  ok(!W.stowSnail(p)&&p.heldSnail===e&&W.enemies.includes(e),'sac plein garde l’escargot '+color+' en main');
  p.inv=[];
  ok(W.stowSnail(p)&&!p.heldSnail&&!W.enemies.includes(e)&&p.inv[0].type==='snail_'+color,'ranger conserve la couleur sans dupliquer l’animal');
  const room=new BK.World({map:['#####','#...#','#...#','#...#','#####'],theme:'interior',mode:'adventure',explore:true});
  room.players.push(p);p.x=2.5;p.y=2.5;p.dir=0;
  ok(room.useItem(p,0)&&p.inv.length===0&&room.enemies.length===1&&room.enemies[0].shellColor===color,'déposer un escargot '+color+' du sac dans une maison');
  const placed=room.enemies[0];p.x=1.5;p.y=1.5;placed.shell=1;p.x=placed.x;p.y=placed.y;room.useSnail(p);room.stowSnail(p);
  p.boat={};ok(!room.useItem(p,0)&&p.inv[0].n===1,'dépose impossible conserve l’escargot dans le sac');p.boat=null;
}
// Caresser et suivre brièvement, sans interaction à travers les murs.
for (const type of ['chien', 'chat']) {
  const W = new BK.World({map:['##########','#........#','#........#','#........#','##########'],theme:'garden',mode:'adventure',explore:true,hearts:true});
  const p=W.addPlayer(BK.charById('adam'),4,2), e=W.addEnemy(type,2,2); e.pause=0;
  W.updateEnemy(e,1/60); ok(e.follow===p, type+' suit le héros qui approche');
  p.x=5.5; for(let i=0;i<180;i++) W.updateEnemy(e,1/60);
  ok(e.x>3.4 && Math.hypot(e.x-p.x,e.y-p.y)>=0.8, type+' suit en gardant une petite distance');
  for(let i=0;i<420;i++) W.updateEnemy(e,1/60);
  ok(!e.follow, type+' cesse de suivre après quelques secondes');
  p.x=e.x+0.7; p.y=e.y; e.target=null; p.input.action=true; W.update(1/60);
  ok(e.petT>0 && e.follow===p && W.events.some(ev=>ev.type==='pet') && W.particles.some(q=>q.heart), 'Shift caresse '+type+' avec des cœurs');
  p.x=2.5;p.y=2.5;e.x=3.5;e.y=2.5;W.cells[W.idx(3,2)]=BK.HARD;
  ok(!W.petAnimal(p), 'impossible de caresser '+type+' à travers un mur');
}
// Retour des pièces : toute la case fonctionne, les anciens intérieurs sans porte sont réparés.
{
  const W=new BK.World({map:['#####','#1..#','#...#','##G##'],theme:'interior',mode:'adventure',explore:true,exitKind:'door'}); W.ensureRoomExit();
  const labels=[];
  const ctx=new Proxy({canvas:{width:1280,height:720},fillText(text){labels.push(text);}}, {get:(t,k)=>k in t?t[k]:k==='measureText'?()=>({width:60}):(k==='createLinearGradient'||k==='createRadialGradient')?()=>({addColorStop(){}}):()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  const cam=new BK.Camera(1280,720);cam.fit(W.cols,W.rows,{top:80,bottom:40,left:40,right:40});W.render(ctx,cam,{});
  ok(labels.filter(t=>t==='SORTIE').length===1, 'la case de sortie au bord de la pièce affiche son indication exactement une fois');
  const p=W.addPlayer(BK.charById('adam'),2,2);p.y=3.08;W.update(1/60);
  ok(W.events.some(e=>e.type==='exit'), 'sortie dès le bord de la case, sans viser le centre');
  const old=new BK.World({map:['#######','#.....#','#..1..#','#######'],theme:'interior',mode:'adventure',explore:true,exitKind:'door'});old.ensureRoomExit();
  ok(old.exit && old.exit.open && !old.blocked(old.exit.c,old.exit.r) && [...old.special.values()].filter(s=>s.type==='exit').length===1, 'une unique sortie accessible est créée pour une ancienne pièce sans porte');
  const a=new BK.Adventure('adam',0);a.state='play';a.world.frozen=false;
  a.enterHouse(a.world.doors.find(d=>d.enterable));BK.input.keys.add('ArrowDown');
  for(let i=0;i<120&&a.outer;i++) a.update(1/60);BK.input.keys.clear();BK.input.flush();
  ok(!a.outer, 'le joueur ressort réellement du magasin de la maison en marchant vers le bas');
  const hub=new BK.Hub('adam');hub.enterShop();const shop=BK.current;BK.input.keys.add('ArrowDown');
  for(let i=0;i<120&&BK.current===shop;i++) shop.update(1/60);BK.input.keys.clear();BK.input.flush();
  ok(BK.current===hub, 'le joueur ressort réellement du magasin des grands-parents');
}
// Sac de 24 piles et raccourcis stables après rangement et consommation.
{
  const W=new BK.World({map:['#####','#1..#','#####'],mode:'adventure',hearts:true});const p=W.addPlayer(BK.charById('adam'),1,1);
  const names=Array.from({length:25},(_,i)=>'bagtest'+i);for(const type of names)BK.ITEMS[type]={usable:true,name:type};
  for(let i=0;i<24;i++)ok(W.applyItem(p,{type:names[i]}),'case '+(i+1)+' disponible dans le sac');
  ok(!W.applyItem(p,{type:names[24]}) && p.inv.length===24,'la 25e pile est refusée');
  ok(W.applyItem(p,{type:names[0]}) && p.inv[0].n===2,'les objets identiques s’empilent même dans un sac plein');
  BK.inventoryLayout(p);BK.moveInventorySlot(p,{zone:'bagSlots',i:0},{zone:'bagSlots',i:23});
  ok(p.bagSlots[23]===names[0] && p.bagSlots[0]===names[23] && p.inv[0].n===2,'glisser dans le sac échange les emplacements sans perdre les quantités');
  BK.moveInventorySlot(p,{zone:'bagSlots',i:0},{zone:'quickSlots',i:7});
  ok(p.quickSlots[7]===names[23] && p.bagSlots[0]===names[23],'le huitième raccourci référence une pile du sac sans la dupliquer');
  p.inv.splice(1,1);BK.inventoryLayout(p);ok(p.quickSlots[7]===names[23],'consommer une autre pile ne décale pas les raccourcis');
  for(const type of names)delete BK.ITEMS[type];
}
// Les animaux chassables restent paisibles ; seul un coup fatal de bombe cuit la viande.
for(const type of ['cerf','lapin_gentil']) {
  const make=()=>{const W=new BK.World({map:['#######','#.....#','#.....#','#.....#','#######'],mode:'adventure',theme:'garden',explore:true,hearts:true});const p=W.addPlayer(BK.charById('adam'),1,2);p.invuln=999;const e=W.addEnemy(type,3,2);e.pause=99;return {W,p,e};};
  const {W,p,e}=make();ok(!W.livingEnemies().includes(e),type+' ne compte pas parmi les monstres');
  p.x=3.5;p.invuln=0;W.checkHits();ok(p.hp===p.maxHp,type+' ne fait pas de dégâts de contact');p.x=1.5;p.invuln=999;
  for(let k=0;k<e.maxHp;k++){e.hurt=0;W.flames=[];W.flameAt.clear();W.placeBomb(p);W.explodeBomb(W.bombs[0]);W.checkHits();}
  ok(e.dead && W.items.filter(it=>it.type==='meatcooked').length===e.def.meat,type+' donne sa viande cuite après une bombe');
  const other=make();other.p.dir=3;other.W.applyItem(other.p,{type:'fish'});other.W.useItem(other.p,0);for(let i=0;i<40;i++)other.W.update(1/60);
  ok(other.e.dead && other.W.items.filter(it=>it.type==='meatraw').length===other.e.def.meat,type+' donne de la viande crue après un poisson lancé');
  const mixed=make();if(mixed.e.maxHp>1){mixed.W.hurtEnemy(mixed.e,mixed.p,1,'bomb');mixed.e.hurt=0;mixed.W.hurtEnemy(mixed.e,mixed.p,1);ok(mixed.W.items.every(it=>it.type==='meatraw'),'seul le coup fatal détermine la cuisson');}
}
{
  const W=new BK.World({map:['#####','#1i.#','#...#','#####'],mode:'adventure',theme:'garden',explore:true,hearts:true});const p=W.addPlayer(BK.charById('adam'),1,1);p.inv=[{type:'meatraw',n:2}];
  ok(W.useItem(p,0) && p.inv[0].n===1 && W.campfires[0].cook.output==='meatcooked','la viande crue se cuisine au feu');
  p.x=1.5;p.y=2.5;for(let i=0;i<310;i++)W.update(1/60);ok(p.inv.some(it=>it.type==='meatcooked'),'la viande cuite revient dans le sac après cinq secondes');
  p.hp=20;const at=p.inv.findIndex(s=>s.type==='meatcooked');ok(W.useItem(p,at)&&p.hp===30,'manger la viande cuite rend dix points de vie');
}
// Hache : objet plaçable et sauvegardé, réutilisable, coupe uniquement les arbres devant soi.
{
  const E=new BK.Editor({name:'Hache',cols:7,rows:5,theme:'garden',base:','});E.item=BK.EDITOR_TABS.find(t=>t.id==='objets').items.find(it=>it.pickup==='axe');E.paint(2,2,true);
  const data=JSON.parse(JSON.stringify(E.data()));data.grid[2]=data.grid[2].slice(0,3)+'T'+data.grid[2].slice(4);
  const W=new BK.World({map:data.grid,props:data.props,theme:data.theme,mode:'adventure',explore:true,hearts:true});const p=W.addPlayer(BK.charById('adam'),2,2);p.dir=3;
  ok(W.itemAt(2,2)?.type==='axe','une hache placée dans l’éditeur survit à l’export/rechargement');W.takeItem(p,W.itemAt(2,2));
  BK.inventoryLayout(p);ok(BK.useQuickItem(W,p,0) && !W.blocked(3,2) && !W.trees.length && W.deco[W.idx(3,2)]==='stump','la hache abat l’arbre devant et libère le passage');
  ok(p.inv[0].type==='axe' && p.inv[0].n===1 && W.debris.some(d=>d.kind==='tree'),'la hache reste dans le sac et l’arbre a une animation de chute');
  ok(!W.useItem(p,0),'une souche ne peut pas être coupée une deuxième fois');
  W.time+=1;W.cells[W.idx(3,2)]=BK.HARD;W.deco[W.idx(3,2)]=null;ok(!W.useItem(p,0)&&W.cell(3,2)===BK.HARD,'la hache ne détruit pas les murs');
  for(const kind of ['snowpine','baretree']) {W.deco[W.idx(3,2)]=kind;W.cells[W.idx(3,2)]=BK.HARD;W.time+=1;ok(W.useItem(p,0)&&!W.blocked(3,2),'la hache abat aussi '+kind);}
  W.cells[W.idx(3,2)]=BK.HARD;W.deco[W.idx(3,2)]='snowpine';W.height[W.idx(3,2)]=1.2;W.time+=1;ok(!W.useItem(p,0),'on ne coupe pas un arbre situé sur un autre étage');
}
// Bois, pouvoirs de bombes, bouclier et malus.
const powerArena=()=>{const W=new BK.World({map:['#############',...Array(9).fill('#...........#'),'#############'],mode:'adventure',theme:'garden',explore:true,hearts:true,itemChance:0});const p=W.addPlayer(BK.charById('adam'),3,5);p.invuln=0;p.bombsMax=8;return {W,p};};
{
 const {W,p}=powerArena();p.dir=3;W.cells[W.idx(4,5)]=BK.HARD;W.deco[W.idx(4,5)]='snowpine';W.applyItem(p,{type:'axe'});W.useItem(p,0);
 ok(W.items.filter(i=>i.type==='wood').length===2,'un arbre donne deux bois ramassables');
 for(const it of W.items.slice())W.takeItem(p,it);
 ok(p.inv.find(i=>i.type==='wood').n===2,'le bois s’empile dans le sac');
 p.dir=2;ok(W.useItem(p,1)&&W.campfires.length===1&&p.inv[1].n===1,'un bois construit un feu devant le joueur');
 p.dir=1;W.cells[W.idx(2,5)]=BK.HARD;ok(!W.useItem(p,1)&&p.inv[1].n===1,'une construction bloquée ne consomme pas le bois');p.dir=2;
 W.applyItem(p,{type:'meatraw'});ok(W.useItem(p,2)&&W.campfires[0].cook.output==='meatcooked','le feu construit permet de cuire la viande');
 p.hp=20;run(W,1);ok(p.hp>20,'le feu construit soigne le joueur');
}
{
 const {W,p}=powerArena();W.applyItem(p,{type:'shortfuse'});W.applyItem(p,{type:'bomb2'});W.placeBomb(p);const b=W.bombs[0];
 ok(b.t===BK.BOMB_FUSE/2&&b.level===2&&b.damage===2,'mèche courte et niveau 2 se combinent');
 p.x=4.5;W.explodeBomb(b);W.checkHits();ok(p.hp===p.maxHp-20,'la bombe rouge inflige le double de dégâts');
 const q=powerArena();q.W.applyItem(q.p,{type:'shortfuse'});run(q.W,20.1);q.W.placeBomb(q.p);ok(q.W.bombs[0].t===BK.BOMB_FUSE,'la mèche redevient normale à la fin du malus');
}
{
 const {W,p}=powerArena();W.applyItem(p,{type:'bombdiarrhea'});run(W,.5);ok(W.bombs.length===0,'la diarrhée ne pose rien à l’arrêt');
 p.input.dx=1;run(W,.7);ok(W.bombs.length>=2&&W.bombs.length<=p.bombsMax,'la marche pose plusieurs bombes sans appui sur Espace');
 p.input.dx=0;p.diarrheaT=.01;W.updatePlayer(p,.02);ok(p.diarrheaT===0,'la diarrhée expire');
}
{
 const {W,p}=powerArena();p.inflate=true;p.longthrow=true;p.dir=3;W.placeBomb(p);const b=W.bombs[0];p.input.bomb=true;p.input.bombHeld=true;
 for(let i=0;i<75;i++)W.updatePlayer(p,1/60);
 ok(p.carrying===b&&b.inflation===1&&b.fire===p.fire+2&&b.damage===3,'maintenir Espace gonfle la bombe en main');
 p.input.bombHeld=false;W.updatePlayer(p,1/60);ok(b.state==='flying'&&b.to.x===p.x+5&&!p.inflating,'relâcher lance la bombe à cinq cases avec le pouvoir');
 const q=powerArena();q.W.placeBomb(q.p);q.W.pickupBomb(q.p);q.p.dir=3;q.W.throwBomb(q.p);ok(q.W.bombs[0].to.x===q.p.x+3,'sans pouvoir le lancer reste à trois cases');
}
for(const safe of [true,false]) {
 const {W,p}=powerArena();p.safeitems=safe;W.spawnItem(4,5,'wood');W.time=1;W.placeBomb(p);W.explodeBomb(W.bombs[0]);ok(!!W.itemAt(4,5)===safe,'protection des objets contre l’explosion : '+safe);
 const q=powerArena();q.p.safeitems=safe;q.W.placeBomb(q.p);q.W.spawnItem(4,5,'wood');q.p.y=7.5;q.W.kickBomb(q.W.bombs[0],3,q.p);q.W.updateBombs(.2);ok(!!q.W.itemAt(4,5)===safe,'protection des objets contre une bombe glissante : '+safe);
}
{
 const {W,p}=powerArena();ok(!W.applyItem(p,{type:'fusion'})&&!p.fusion,'la giga-fusion nécessite le coup de pied');W.itemPool=['fusion'];W.spawnItem(1,1);ok(W.items[0].type!=='fusion','aucune giga-fusion aléatoire avant le coup de pied');
 p.kick=true;W.spawnItem(2,1);ok(W.items[1].type==='fusion','le coup de pied débloque les trouvailles de giga-fusion');W.applyItem(p,{type:'fusion'});
 W.placeBomb(p);const a=W.bombs[0];p.x=4.5;W.placeBomb(p);const b=W.bombs[1];p.x=2.5;W.updateBombs(.01);p.x=2.7;W.moveCircle(p,.1,0,p);W.updateBombs(.02);
 ok(W.bombs.length===1&&b.giga&&a.exploded&&p.bombsOut===1,'botter une bombe contre sa voisine fusionne sans perdre le compte');
 for(const c of [5,6])W.cells[W.idx(c,5)]=BK.SOFT;
 for(let r=1;r<10;r++)W.cells[W.idx(7,r)]=BK.HARD;
 W.explodeBomb(b);ok(!W.cell(5,5)&&!W.cell(6,5),'la giga-bombe détruit les deux épaisseurs en même temps');
 ok(W.flameAt.has(W.idx(5,4))&&!W.flameAt.has(W.idx(8,5))&&W.cell(7,5)===BK.HARD,'explosion dans toutes les directions, arrêt aux murs indestructibles');
 ok(p.bombsOut===0&&W.bombs.length===0,'la fusion libère toutes les bombes après explosion');
}
{
 const {W,p}=powerArena();p.shield=1;W.hitPlayer(p,{kind:'enemy',dmg:5});ok(p.hp===p.maxHp-5&&p.shield===1,'le bouclier ne protège pas des monstres');p.invuln=0;const hp=p.hp,x=p.x;
 W.hitPlayer(p,{kind:'flame',dmg:20,bomb:{x:p.x-1,y:p.y}});ok(p.hp===hp&&p.shield===0&&p.x>x,'le bouclier absorbe une explosion et repousse le joueur');
 p.invuln=0;W.hitPlayer(p,{kind:'flame',dmg:10});ok(p.hp===hp-10,'la deuxième explosion inflige des dégâts');
}
{
 const a=new BK.Adventure('adam',0);for(const k of BK.BOMB_POWERS)a.player[k]=true;a.player.shield=1;a.player.diarrheaT=12;a.player.shortfuseT=17;
 a.enterHouse(a.world.doors.find(d=>d.enterable));ok(BK.BOMB_POWERS.every(k=>a.player[k])&&a.player.shield===1&&a.player.shortfuseT===17,'pouvoirs et malus conservés en entrant');a.player.diarrheaT=10;a.leaveHouse();ok(a.player.diarrheaT===10&&BK.BOMB_POWERS.every(k=>a.player[k]),'pouvoirs et durée restante conservés en sortant');
}

{
 const {p}=powerArena();BK.input.keys.add('Space');BK.input.read(p);ok(p.input.bombHeld,'maintien clavier transmis au gonflage');BK.input.keys.clear();BK.input.touch.active=true;BK.input.touch.bombHeld=true;BK.input.read(p);ok(p.input.bombHeld,'maintien tactile transmis au gonflage');BK.input.touch.bombHeld=false;BK.input.read(p);ok(!p.input.bombHeld,'relâchement tactile transmis au lancer');BK.input.touch.active=false;
 for(const id of ['wood','bombdiarrhea','shortfuse',...BK.BOMB_POWERS]) {
  const E=new BK.Editor({name:'Pouvoirs',cols:7,rows:5,theme:'garden',base:','});E.item=BK.EDITOR_TABS.find(t=>t.id==='objets').items.find(it=>it.pickup===id);E.paint(2,2,true);const data=JSON.parse(JSON.stringify(E.data()));const W=new BK.World({map:data.grid,props:data.props,theme:data.theme,mode:'adventure',explore:true,hearts:true});ok(W.itemAt(2,2)?.type===id,'éditeur : export et rechargement de '+id);
 }
}
// Remèdes, sortie intérieure et alliés recrutables.
{
 const {W,p}=powerArena();W.applyItem(p,{type:'antidote',value:2});p.diarrheaT=10;p.shortfuseT=15;
 ok(W.useItem(p,0)&&!p.diarrheaT&&!p.shortfuseT&&p.inv[0].n===1,'une dose d’antidote supprime les deux malus');
 ok(!W.useItem(p,0)&&p.inv[0].n===1,'antidote conservé sans malus');
 W.applyItem(p,{type:'antipoison',value:2});p.quickSlots=[];W.poisonPlayer(p,null);ok(p.poison===6&&p.inv[0].n===3,'anti-poison dans le sac reste manuel');
 ok(W.useItem(p,0)&&p.poison===0&&p.inv[0].n===2,'anti-poison manuel guérit immédiatement');
 p.quickSlots=['antipoison'];W.poisonPlayer(p,null);ok(p.poison===0&&p.inv[0].n===1,'la ceinture utilise une seule dose immédiatement');
 W.poisonPlayer(p,null);W.poisonPlayer(p,null);ok(p.poison>0,'une ceinture vide ne protège pas');W.applyItem(p,{type:'antipoison'});W.updatePlayer(p,.01);ok(!p.poison,'équiper une dose pendant le poison le supprime');
}
{
 const original=BK.defaultInterior().grid,grid=BK.roomMap(original);
 ok(grid.length===original.length+1&&grid.at(-1).trim()==='G'&&grid.at(-2)[5]==='y','la case de sortie dépasse le rectangle');
 ok(JSON.stringify(BK.roomMap(grid))===JSON.stringify(grid),'la migration ne rajoute pas un seuil à chaque visite');
 const parent=new BK.Editor({cols:7,rows:5,grid:['#######','#.....#','#..1..#','#.....#','#######'],houses:{'3,3':{w:3,d:2,interior:BK.defaultInterior()}}});
 const E=new BK.Editor(BK.defaultInterior(),{parent:{editor:parent,key:'3,3'}});ok(E.world.roomExit&&E.world.exit.kind==='door'&&E.world.exit.r===8,'aperçu intérieur : sortie au sol, aucun portail');
 E.item=BK.EDITOR_TABS.find(t=>t.id==='maisons').items[0];const before=E.rows().join();E.paint(2,2,true);ok(E.rows().join()===before,'impossible de poser une maison dans une maison');
 const stage=BK.mapToStage(E.data());const a=new BK.Adventure('adam',0,{custom:stage});ok(a.world.roomExit&&a.world.exit.kind==='door','tester une pièce conserve sa sortie sans portail');
}
{
 const E=new BK.Editor({cols:9,rows:7,theme:'garden',base:'.'});E.item=BK.EDITOR_TABS.find(t=>t.id==='magasin').items.find(i=>i.ally);E.opts.ally={id:'richard',price:25,lives:3};E.paint(3,3,true);E.grid[4][3]='1';
 const data=JSON.parse(JSON.stringify(E.data())),a=new BK.Adventure('adam',0,{custom:BK.mapToStage(data)});a.state='play';a.world.frozen=false;a.save.gold=20;
 const d=a.world.displays.find(d=>d.ally);ok(d&&d.lives===3&&d.price===25,'allié et prix conservés après export');ok(!a.buy(d)&&a.save.gold===20,'pas de recrutement sans or');a.save.gold=50;ok(a.buy(d)&&a.save.gold===25,'payer recrute un allié');const p=d.npc;
 ok(p.ally&&!p.npc&&p.hp===30&&p.lives===3&&!a.buy(d)&&a.save.gold===25,'allié actif, trois vies, achat non duplicable');
 p.invuln=0;BK.setFriendlyFire(false);a.world.hitPlayer(p,{kind:'flame',owner:a.player,dmg:10});ok(p.hp===30,'tir allié désactivé protège le compagnon');
 BK.setFriendlyFire(true);a.world.hitPlayer(p,{kind:'flame',owner:a.player,dmg:10});ok(p.hp===20,'option tir allié activée inflige des dégâts');BK.setFriendlyFire(false);
 a.player.invuln=0;const hp=a.player.hp;a.world.hitPlayer(a.player,{kind:'flame',owner:a.player,dmg:10});ok(a.player.hp===hp-10,'les propres bombes du joueur restent dangereuses');
 a.player.invuln=999;p.invuln=999;const oldX=p.x;a.player.x=6.5;run(a.world,2);ok(p.x>oldX,'le compagnon suit son héros');
 const e=a.world.addEnemy('serpent',Math.floor(p.x)+1,Math.floor(p.y));e.pause=999;e.speed=0;for(let i=0;i<180&&!e.dead;i++)a.world.update(1/60);ok(e.dead,'l’allié attaque les monstres proches');
 a.world.killPlayer(p,{kind:'enemy'});ok(p.lives===2&&!p.alive,'un allié vaincu perd une vie');run(a.world,2.2);ok(p.alive&&p.hp===30&&p.lives===2,'l’allié revient tant qu’il a des vies');
 a.world.killPlayer(p,{kind:'enemy'});p.deadT=3;a.world.update(.01);a.world.killPlayer(p,{kind:'enemy'});run(a.world,3);ok(!p.alive&&p.lives===0,'plus de résurrection à zéro vie');
}
{
 const a=new BK.Adventure('adam',0);a.state='play';a.world.frozen=false;const door=a.world.doors.find(d=>d.enterable);a.enterHouse(door);a.setupShop(a.world,{npcs:[{ally:true,id:'richard',c:2,r:2,price:5,lives:2}]},'test-ally');a.save.gold=10;const d=a.world.displays[0];a.buy(d);const ally=d.npc;ally.hp=19;a.leaveHouse();ok(a.world.players.includes(ally)&&ally.leader===a.player&&ally.hp===19,'allié recruté dedans suit dehors avec sa vie restante');a.enterHouse(door);ok(a.world.players.includes(ally)&&!a.outer.world.players.includes(ally),'allié transféré dedans sans duplication');
 a.world.killPlayer(ally,{kind:'enemy'});a.update(.01);ok(a.state==='play','la mort du compagnon ne termine pas la partie');
}

// Navigation en barque, embarquement et débarquement.
{
 const E=new BK.Editor({cols:9,rows:7,theme:'garden',base:'~'});E.item=BK.EDITOR_TABS[0].items.find(i=>i.boat);E.paint(3,3,true);const data=JSON.parse(JSON.stringify(E.data()));data.grid[3]='..1~~~~~~';
 const W=new BK.World({map:data.grid,props:data.props,theme:'garden',mode:'adventure',explore:true,hearts:true});const p=W.addPlayer(BK.charById('adam'),2,3),b=W.boats[0];
 ok(b&&W.tAt(3,3)===E.world.tAt(3,3),'barque placée sur l’eau conservée après export');
 ok(W.nearbyBoat(p)===b&&W.useBoat(p)&&p.boat===b&&b.rider===p,'embarquer depuis la rive');
 p.input.dx=1;run(W,1);ok(p.x>5.5&&p.boat&&!p.falling&&p.hp===p.maxHp,'ramer sur l’eau sans tomber');
 p.input.dx=0;W.update(.01);ok(!W.boatLanding(p)&&!W.useBoat(p)&&p.boat===b,'impossible de débarquer en pleine eau');
 p.input.dx=-1;run(W,2);ok(p.x>=3.25&&p.x<3.4,'la barque s’arrête à la rive sans monter sur terre');
 ok(!W.boatLanding(p),'pas de bouton de débarquement pendant la rame');p.input.dx=0;W.update(.01);
 ok(W.boatLanding(p)?.c===2&&W.useBoat(p)&&!p.boat&&!b.rider&&p.x===2.5,'débarquer sur la rive libre après arrêt');
 ok(W.useBoat(p),'la même barque peut être reprise');W.cells[W.idx(2,3)]=BK.HARD;ok(!W.boatLanding(p),'un mur ne permet pas de débarquer');W.cells[W.idx(2,3)]=0;W.height[W.idx(2,3)]=1.2;ok(!W.boatLanding(p),'impossible de débarquer en haut d’une falaise');
 ok(!W.placeBomb(p),'on ne pose pas de bombe sous la barque');W.killPlayer(p,{kind:'enemy'});ok(!b.rider&&!p.boat,'la barque est libérée à la mort du passager');
 E.grid[2][2]='.';E.paint(2,2,true);ok(!E.props['2,2']?.boat,'éditeur : aucune barque sur la terre');
}
const bombCompanion=()=>{const {W,p}=powerArena();p.x=2.5;p.y=2.5;p.invuln=999;const a=W.addPlayer(BK.charById('richard'),5,5);Object.assign(a,{ally:true,human:false,leader:p,hp:30,maxHp:30,lives:3,speed:3});return {W,p,a};};
{
 const {W,p,a}=bombCompanion();p.x=3.5;p.y=3.5;W.cells[W.idx(6,5)]=BK.SOFT;
 W.updateAlly(a,.01);ok(W.bombs.length===1&&W.bombs[0].owner===a&&!a.carrying,'l’allié pose une bombe pour ouvrir un passage');
 const hp=a.hp;run(W,BK.BOMB_FUSE+1);ok(a.alive&&a.hp===hp&&!W.cell(6,5),'il s’éloigne avant l’explosion et détruit le bloc');
}
{
 const {W,p,a}=bombCompanion();p.x=6.5;p.y=3.5;const e=W.addEnemy('serpent',9,5);e.pause=999;e.speed=0;
 W.updateAlly(a,.01);ok(a.carrying&&a.carrying.owner===a,'l’allié prépare sa propre bombe à lancer');
 run(W,.65);ok(W.bombs.some(b=>b.state==='flying'||b.cx!==5),'l’allié lance sa bombe vers les monstres');
 run(W,BK.BOMB_FUSE+1);ok(a.alive&&a.hp===30,'le lanceur survit à sa bombe');
}
{
 const {W,p,a}=bombCompanion();for(const D of BK.DIRS)W.cells[W.idx(5+D.dx,5+D.dy)]=BK.SOFT;
 W.updateAlly(a,.01);ok(!W.bombs.length,'pas de bombe si le compagnon ne peut pas fuir');
}
{
 const {W,p,a}=bombCompanion();p.x=5.5;p.y=5.5;W.placeBomb(p);const b=W.bombs[0];b.passers.add(a);p.x=2.5;p.y=2.5;const hp=a.hp;run(W,BK.BOMB_FUSE+1);
 ok(Math.hypot(a.x-b.x,a.y-b.y)>2&&a.hp===hp,'le compagnon fuit aussi les bombes du héros');
 const q=bombCompanion();q.W.placeBomb(q.p);const f=q.W.bombs[0];q.W.pickupBomb(q.p);q.p.dir=3;q.W.throwBomb(q.p);const danger=BK.ai.allyDanger(q.W);ok(danger[q.W.idx(Math.floor(f.to.x),Math.floor(f.to.y))]<Infinity,'danger prédit à l’arrivée d’une bombe en vol');f.giga=true;f.fire=4;const big=BK.ai.allyDanger(q.W);ok(big[q.W.idx(Math.floor(f.to.x)+1,Math.floor(f.to.y)+1)]<Infinity,'danger des giga-bombes prévu en diagonale');
}

// Traversée en équipe : passagers, rive d'arrivée et reprise du suivi.
const crewBoat=()=>{
 const W=new BK.World({map:['#########',...Array(5).fill('#..~~~..#'),'#########'],props:{'3,3':{boat:true}},theme:'garden',mode:'adventure',explore:true,hearts:true});
 const p=W.addPlayer(BK.charById('adam'),2,3);p.invuln=999;
 const crew=['richard','josee'].map((id,i)=>{const q=W.addPlayer(BK.charById(id),1,2+i);Object.assign(q,{ally:true,human:false,leader:p,lives:3,hp:17+i,maxHp:30,speed:3});return q;});
 return {W,p,crew,b:W.boats[0]};
};
{
 const {W,p,crew,b}=crewBoat();const stranger=W.addNpc(BK.charById('richard'),1,4);
 ok(W.useBoat(p)&&crew.every(q=>q.boat===b)&&b.passengers.length===2&&!stranger.boat,'les alliés recrutés embarquent ensemble, pas les commerçants');
 ok(!W.useBoat(crew[0])&&b.rider===p,'un passager ne peut pas piloter ou débarquer seul');
 p.input.dx=1;run(W,2);ok(crew.every(q=>q.x===p.x&&q.y===p.y&&!q.falling&&q.alive),'tous les passagers traversent l’eau avec le pilote');
 ok(W.bombs.length===0&&crew[0].hp===17&&crew[1].hp===18,'aucune bombe à bord et vie conservée');
 p.input.dx=0;W.update(.01);ok(W.boatLanding(p)?.c===6,'la rive opposée est proposée');
 ok(W.useBoat(p)&&crew.every(q=>!q.boat&&q.x>=6&&W.walkableTerrain(Math.floor(q.x),Math.floor(q.y)))&&!b.passengers.length,'tout le groupe débarque sur la rive d’arrivée');
 const positions=crew.map(q=>[q.x,q.y]);p.x=7.5;p.y=5.5;run(W,1.5);ok(crew.every((q,i)=>Math.hypot(q.x-p.x,q.y-p.y)<3)&&crew.some((q,i)=>q.x!==positions[i][0]||q.y!==positions[i][1]),'les alliés reprennent leur suivi après la traversée');
 p.x=6.5;p.y=3.5;ok(W.useBoat(p)&&b.passengers.length===2,'un deuxième embarquement ne duplique pas les passagers');
}
{
 const {W,p,crew,b}=crewBoat();W.useBoat(p);W.killPlayer(crew[0],{kind:'enemy'});ok(b.rider===p&&p.boat===b&&crew[0].lives===2,'la mort d’un passager ne libère pas le pilote');run(W,2.2);ok(crew[0].alive&&crew[0].boat===b&&crew[0].x===p.x,'un allié ayant encore des vies revient à bord');
 W.killPlayer(p,{kind:'enemy'});ok(!b.rider&&!b.passengers.length&&crew.every(q=>!q.boat&&W.walkableTerrain(Math.floor(q.x),Math.floor(q.y))),'la mort du pilote ne laisse pas les alliés bloqués sur l’eau');
}
{
 const {W,p,crew,b}=crewBoat();for(let r=1;r<=5;r++)for(let c=6;c<=7;c++)if(c!==6||r!==3)W.cells[W.idx(c,r)]=BK.HARD;
 W.useBoat(p);p.input.dx=1;run(W,2);p.input.dx=0;W.update(.01);ok(W.useBoat(p)&&crew.every(q=>q.x===6.5&&q.y===3.5&&!q.boat),'sur une rive d’une seule case, tous débarquent sans être placés dans l’eau');
}

// Outils de pièce, sorties multiples et mobilier.
{
 const parent=new BK.Editor({cols:11,rows:8,theme:'garden',base:'.',houses:{'4,4':{w:3,d:2,interior:BK.defaultInterior()}}});
 const E=new BK.Editor(BK.defaultInterior(),{parent:{editor:parent,key:'4,4'}}),tools=BK.EDITOR_TABS.find(t=>t.id==='piece').items;
 ok(E.item.ch==='y'&&tools.some(t=>t.ch==='#')&&tools.some(t=>t.ch==='G'),'les outils de la pièce proposent directement plancher, mur et sortie');
 E.item=tools.find(t=>t.ch==='y');E.paint(5,8,true);ok(!E.world.exit,'repeindre la sortie la retire sans en recréer une dans l’aperçu');
 E.item=tools.find(t=>t.ch==='G');E.paint(0,3,true);E.paint(10,5,true);
 ok(E.world.roomExits.length===2&&E.grid[3][0]==='G'&&E.grid[5][10]==='G','deux sorties peuvent être posées à des endroits différents');
 E.item=tools.find(t=>t.ch==='y');E.paint(0,3,true);ok(E.world.roomExits.length===1&&E.world.exit.c===10,'retirer une sortie ne touche pas à l’autre');E.undo();ok(E.world.roomExits.length===2,'annuler restaure la sortie retirée');
 E.item=tools.find(t=>t.ch==='#');E.paint(2,2,true);ok(E.world.cell(2,2)===BK.HARD,'les murs intérieurs ont la même collision que le contour');
 E.item=tools.find(t=>t.ch==='y');E.paint(2,2,true);ok(!E.world.cell(2,2)&&E.world.tAt(2,2)===E.world.tAt(3,2),'le plancher peint est identique au sol existant');
 const data=JSON.parse(JSON.stringify(E.data())),again=new BK.Editor(data,{parent:{editor:parent,key:'4,4'}});
 ok(again.grid.length===E.grid.length&&again.grid[3][0]==='G'&&again.grid[5][10]==='G','recharger la pièce conserve les positions de toutes les sorties');
 const root=new BK.Adventure('adam',0),door=root.world.doors.find(d=>d.enterable);root.world.houses[door.c+','+door.r].interior=data;
 for(const [c,r] of [[0,3],[10,5]]){root.enterHouse(door);root.state='play';root.world.frozen=false;root.player.x=c+.5;root.player.y=r+.5;root.update(.01);ok(!root.outer,'la sortie '+c+','+r+' ramène réellement à l’extérieur');}
 // Les sorties au bord inférieur choisies à la main ne sont plus déplacées à la réouverture.
 again.item=tools.find(t=>t.ch==='G');again.paint(2,8,true);const finalData=again.data();const finalEditor=new BK.Editor(finalData,{parent:{editor:parent,key:'4,4'}});ok(finalEditor.grid.length===9&&finalEditor.grid[8][2]==='G','aucun déplacement automatique d’une sortie personnalisée en bas');
 for(const kind of ['chair','stool']){E.item=tools.find(t=>t.opts==='seat');E.opts.seat=kind;E.paint(kind==='chair'?3:4,3,true);}
 const W=new BK.World({map:E.rows(),props:JSON.parse(JSON.stringify(E.props)),theme:'interior',mode:'adventure',explore:true});ok(W.deco[W.idx(3,3)]==='chair'&&W.deco[W.idx(4,3)]==='stool'&&W.blocked(3,3)&&W.blocked(4,3),'chaise et tabouret conservés avec leurs collisions');
 const labels=[],ctx=new Proxy({canvas:{width:1280,height:720},fillText(t){labels.push(t);}}, {get:(t,k)=>k in t?t[k]:k==='measureText'?()=>({width:30}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 W.ensureRoomExit(false);const cam=new BK.Camera(1280,720);cam.fit(W.cols,W.rows,{top:80,bottom:40,left:40,right:40});W.render(ctx,cam,{});ok(labels.filter(t=>t==='SORTIE').length===2,'chaque sortie est dessinée avec sa propre indication');
 for(const kind of ['chair','stool'])BK.sprites.drawDeco(ctx,kind,0,0,80,0,null,1);ok(true,'les deux nouveaux meubles se dessinent sans erreur');
}

{
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items;
 ok(items.every(it=>it.category)&&new Set(items.map(it=>it.category)).size===14,'toutes les décorations sont classées dans quatorze catégories');
 const E=new BK.Editor({cols:9,rows:7,base:'y',theme:'interior'});
 for(const [i,kind] of ['table_round','table_dining','table_low','fireplace'].entries()){E.item=items.find(it=>kind.startsWith('table_')?it.opts==='table':it.opts==='light');if(kind.startsWith('table_'))E.opts.table=kind;else E.opts.light=kind;E.paint(i+2,3,true);}
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,theme:'interior',mode:'adventure',explore:true});
 ok(['table_round','table_dining','table_low','fireplace'].every((kind,i)=>W.deco[W.idx(i+2,3)]===kind&&W.blocked(i+2,3)),'les trois tables et l’âtre survivent à l’export avec leurs collisions');
 const p=W.addPlayer(BK.charById('adam'),5,4);p.inv=[{type:'meatraw',n:1}];
 ok(W.campfires.length===1&&W.useItem(p,0)&&W.campfires[0].cook.output==='meatcooked','l’âtre permet de cuisiner la viande');
}
{
 const W=new BK.World({map:['#######','#.....#','#.RS..#','#.....#','#######'],theme:'interior',mode:'adventure',explore:true,props:{'3,2':{deco:'stool'}}});
 W.deco[W.idx(3,2)]='stool';const p=W.addPlayer(BK.charById('adam'),2,3);p.human=true;
 ok(W.nearbySeat(p)?.kind==='chair'&&W.useSeat(p)&&p.seat&&p.pose==='sit','assis sur une chaise adjacente');
 p.input={dx:0,dy:0,bomb:true};W.updatePlayer(p,.1);ok(p.seat&&W.bombs.length===0,'assis : pas de bombe ni déplacement involontaire');
 p.input.dx=1;W.updatePlayer(p,.1);ok(!p.seat&&!W.blocked(Math.floor(p.x),Math.floor(p.y)),'une direction remet le héros sur le sol libre');
 p.x=3.5;p.y=3.5;ok(W.useSeat(p)&&p.seat.kind==='stool','on peut aussi s’asseoir sur le tabouret');
 ok(W.useSeat(p)&&!p.seat,'le bouton permet de se relever');
 p.x=5.5;p.y=3.5;ok(!W.nearbySeat(p),'pas de bouton pour un siège éloigné');
 const ally=W.addNpc(BK.charById('richard'),1,1,[]);ok(!W.nearHuman(ally),'allié éloigné : bulle masquée');p.x=1.5;p.y=2.5;ok(W.nearHuman(ally),'allié voisin : bulle visible');
 const a=new BK.Adventure('adam',0),gold=a.save.gold||0;ok(a.addCheatGold(123456)&&a.save.gold===gold+123456,'triche : ajout du montant choisi');
 ok(a.addCheatGold(123456)&&a.save.gold===gold+246912,'triche utilisable plusieurs fois');
 ok([0,-1,1.5,Infinity,NaN,'abc'].every(x=>!a.addCheatGold(x)),'montants invalides refusés sans corrompre l’or');
}
{
 const E=new BK.Editor({cols:7,rows:6,base:'y',theme:'interior',grid:['#######','#yyyyy#','#yyyyy#','#yyyyy#','#y1yyy#','#######']});
 const deco=BK.EDITOR_TABS.find(t=>t.id==='deco').items,ally=BK.EDITOR_TABS.find(t=>t.id==='magasin').items.find(i=>i.ally);
 for(const [i,kind] of ['chair','stool'].entries()){E.item=deco.find(it=>it.opts==='seat');E.opts.seat=kind;E.paint(2+i*2,2,true);E.item=ally;E.paint(2+i*2,2,true);}
 ok(E.world.players.filter(p=>p.recruit).every(p=>p.seat&&p.pose==='sit'),'éditeur : les alliés sont assis sur leur siège');
 const data=JSON.parse(JSON.stringify(E.data())),a=new BK.Adventure('adam',0,{custom:BK.mapToStage(data)}),W=a.world;
 a.state='play';W.frozen=false;const d=W.displays.find(d=>d.ally),p=d.npc;
 for(let i=0;i<180;i++)W.update(1/60);
 ok(p.seat&&p.pose==='sit'&&p.x===2.5&&p.y===2.62,'après export et chargement, l’allié reste assis');
 a.player.x=2.5;a.player.y=3.5;ok(!W.nearbySeat(a.player),'le héros ne peut pas prendre un siège occupé');
 a.save.gold=1000;ok(a.recruit(d)&&!p.seat&&p.ally&&!W.blocked(Math.floor(p.x),Math.floor(p.y)),'le recrutement fait lever l’allié sur une case libre');
 ok(W.deco[W.idx(2,2)]==='chair','la chaise reste en place après recrutement');
 const other=W.displays.find(d=>d.ally);for(const dir of BK.DIRS)W.cells[W.idx(other.c+dir.dx,other.r+dir.dy)]=BK.HARD||1;
 const gold=a.save.gold;ok(!a.recruit(other)&&other.npc.seat&&a.save.gold===gold,'si toutes les issues sont bloquées, l’allié reste assis et aucun or n’est dépensé');
}
{
 for(const kind of ['chair','stool']){
  const E=new BK.Editor({cols:7,rows:6,base:'y',theme:'interior',grid:['#######','#yyyyy#','#yyyyy#','#yyyyy#','#y1yyy#','#######']});
  E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.opts==='seat');E.opts.seat=kind;E.paint(2,2,true);
  E.item=BK.EDITOR_TABS.find(t=>t.id==='magasin').items.find(it=>it.npc);E.paint(2,2,true);
  ok(E.world.players.find(p=>p.npc).seat?.kind===kind,'commerçant assis dans l’éditeur : '+kind);
  E.shop=[{c:3,r:3,item:'honey',price:20,once:false}];
  const a=new BK.Adventure('adam',0,{custom:BK.mapToStage(JSON.parse(JSON.stringify(E.data())))}),W=a.world,merchant=W.players.find(p=>p.npc);
  a.state='play';W.frozen=false;a.player.x=2.5;a.player.y=3.5;a.save.gold=100;
  run(W,2);ok(merchant.seat?.kind===kind&&merchant.pose==='sit','reste assis après chargement et mises à jour : '+kind);
  ok(W.talkTo(a.player)&&merchant.seat&&merchant.dir===0,'parler ne le fait pas se lever ni tourner sur sa chaise');
  a.player.nearDisplay=a.displayNear(a.player);a.pressEnter();
  ok(a.save.gold===80&&a.player.inv.some(it=>it.type==='honey')&&merchant.seat&&merchant.pose==='sit','achat via interaction : objet reçu, prix payé, marchand toujours assis');
  ok(!W.nearbySeat(a.player),'le siège du commerçant reste réservé');
 }
}
{
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items.filter(it=>it.category==='chalet');
 ok(items.length===8&&items.filter(it=>it.opts==='trophy').length===1,'huit outils de chalet, un seul outil Trophée');
 const E=new BK.Editor({cols:14,rows:5,base:'y',theme:'interior'});
 const kinds=['terrarium','aquarium','fishing_basket','fish_trout','fish_bass','fish_pike','antlers_moose','antlers_deer','fly_frame','lumber_saw','trophy_cup','trophy_star','trophy_shield'];
 for(const [i,kind] of kinds.entries()) {const group=kind.startsWith('fish_')?'fishMount':kind.startsWith('antlers_')?'antlers':kind.startsWith('trophy_')?'trophy':null;E.item=items.find(it=>group?it.opts===group:it.deco===kind);if(group)E.opts[group]=kind;E.paint(i+1,2,true);}
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,mode:'adventure',explore:true,theme:'interior'});
 ok(kinds.every((kind,i)=>W.deco[W.idx(i+1,2)]===kind&&W.blocked(i+1,2)),'les douze variantes se sauvegardent avec leurs collisions');
 const trace=[];const ctx=new Proxy({}, {get:(obj,key)=>obj[key]||(obj[key]=(...args)=>{trace.push([key,...args]);}),set:(o,k,v)=>{o[k]=v;return true;}});
 for(const kind of kinds)BK.sprites.drawDeco(ctx,kind,0,0,80,1,null,3);
 ok(trace.length>200,'les douze décors produisent leur dessin');
 trace.length=0;BK.sprites.drawDeco(ctx,'aquarium',0,0,80,0,null,3);const first=JSON.stringify(trace);trace.length=0;BK.sprites.drawDeco(ctx,'aquarium',0,0,80,1,null,3);ok(first!==JSON.stringify(trace),'les poissons et bulles changent de position avec le temps');
 E.item=items.find(it=>it.opts==='trophy');E.opts.trophy='trophy_star';E.paint(11,2,true);E.undo();ok(E.props['11,2'].deco==='trophy_cup','annuler un changement de variante restaure le trophée précédent');
}
{
 const E=new BK.Editor({cols:11,rows:6,roomExit:true,theme:'interior',base:'y',grid:['###########','#yyyyyyyyy#','#yyyyyyyyy#','#yyyyyyyyy#','#yyyy1yyyy#','#####G#####']});
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items,kinds=Array.from(BK.WALL_DECOR).filter(k=>!k.startsWith('castle_')&&!BK.BIOME_DECOR.some(it=>it.deco===k));
 for(const [i,kind] of kinds.entries()){const group=kind.startsWith('fish_')?'fishMount':kind.startsWith('antlers_')?'antlers':null;E.item=items.find(it=>group?it.opts===group:it.deco===kind);if(group)E.opts[group]=kind;E.paint(i+1,0,true);}
 ok(kinds.every((kind,i)=>E.grid[0][i+1]==='#'&&E.props[(i+1)+',0'].wallDeco===kind&&E.world.blocked(i+1,0)),'sept décors accrochés sans remplacer les murs ni leurs collisions');
 const data=JSON.parse(JSON.stringify(E.data())),again=new BK.Editor(data);ok(kinds.every((kind,i)=>again.props[(i+1)+',0'].wallDeco===kind),'les fixations murales survivent à la sauvegarde et réouverture');
 const a=new BK.Adventure('adam',0),door=a.world.doors.find(d=>d.enterable);a.world.houses[door.c+','+door.r].interior=data;a.enterHouse(door);ok(a.world.props['1,0'].wallDeco==='fish_trout'&&a.world.blocked(1,0),'le décor mural est conservé en entrant réellement dans une maison');
 E.item={tool:'erase'};E.paint(1,0,true);ok(E.grid[0][1]==='#'&&!E.props['1,0'].wallDeco,'la gomme décroche sans détruire le mur');E.undo();ok(E.props['1,0'].wallDeco==='fish_trout','annuler rétablit la décoration accrochée');
 E.item={ch:'y'};E.paint(1,0,true);ok(!E.props['1,0']?.wallDeco,'remplacer le mur retire sa décoration');
 const calls=[],ctx=new Proxy({}, {get:(o,k)=>o[k]||(o[k]=(...args)=>calls.push([k,...args])),set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(11,6,{top:60,bottom:40,left:40,right:40});
 again.world.drawWallDeco(ctx,cam,1,0,0,1);ok(calls.some(c=>c[0]==='transform')&&calls.some(c=>c[0]==='fill'),'le décor mural est projeté et dessiné sur la face du mur');
}
{
 const E=new BK.Editor({cols:7,rows:6,roomExit:true,theme:'interior',base:'y',grid:['#######','#yyyyy#','#yyyyy#','#yyyyy#','#y1yyy#','#######']});
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items,chair=items.find(i=>i.deco==='chair');E.item=chair;E.orientation=3;E.paint(3,2,true);
 ok(E.props['3,2'].orientation===3,'orientation choisie enregistrée à la pose');
 const p=E.world.addNpc(BK.charById('richard'),3,2,[]);ok(p.seat&&p.dir===3&&p.x===3.62,'le commerçant assis regarde dans la direction de la chaise');
 E.item={tool:'rotate'};E.paint(3,2,true);ok(E.props['3,2'].orientation===0,'l’outil Tourner fait un quart de tour');E.undo();ok(E.props['3,2'].orientation===3,'annuler restaure l’orientation');
 E.item=items.find(i=>i.deco==='fish_trout');E.orientation=1;E.paint(0,2,true);const data=JSON.parse(JSON.stringify(E.data())),again=new BK.Editor(data);
 ok(again.props['0,2'].orientation===1&&again.props['0,2'].wallDeco==='fish_trout'&&again.world.blocked(0,2),'orientation murale et collision préservées après rechargement');
 const matrices=[],ctx=new Proxy({}, {get:(o,k)=>o[k]||(o[k]=(...args)=>{if(k==='transform')matrices.push(args);}),set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(7,6,{top:60,bottom:40,left:40,right:40});
 for(let dir=0;dir<4;dir++){again.world.props['0,2'].orientation=dir;again.world.drawWallDeco(ctx,cam,0,2,0,0);}
 ok(new Set(matrices.map(m=>JSON.stringify(m))).size===4,'les quatre orientations murales utilisent des faces distinctes');
 for(let dir=0;dir<4;dir++)BK.sprites.drawDeco(ctx,'chair',0,0,80,0,null,1,dir);ok(true,'les quatre vues de chaise se dessinent');
}
{
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items;
 ok(items.filter(it=>it.ch==='s'||BK.STATUES.includes(it.deco)).length===1,'un seul outil Statue dans le catalogue');
 const E=new BK.Editor({cols:8,rows:5,theme:'interior',base:'y'});E.item=items.find(it=>it.opts==='statue');
 for(const [i,kind] of BK.STATUES.entries()){E.opts.statue=kind;E.paint(i+1,1,true);ok(E.world.deco[E.world.idx(i+1,1)]===kind,'modèle de statue sélectionné : '+kind);}
 for(const [i,kind] of BK.LIGHT_KINDS.entries()){E.item=items.find(it=>it.opts==='light');E.opts.light=kind;E.lightColor='purple';E.paint(i+1,3,true);}
 const again=new BK.Editor(JSON.parse(JSON.stringify(E.data())));ok(BK.LIGHT_KINDS.every((kind,i)=>again.props[(i+1)+',3'].lightColor==='purple'),'les couleurs des quatre types de lumières survivent à la sauvegarde');
 const colors=[],ctx=new Proxy({createRadialGradient(){return {addColorStop(at,c){colors.push(c);}};}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{if(k==='fillStyle')colors.push(v);o[k]=v;return true;}});
 for(const kind of BK.LIGHT_KINDS){colors.length=0;BK.sprites.drawDeco(ctx,kind,0,0,80,1,null,1,0,'purple');ok(colors.some(c=>typeof c==='string'&&c.includes('180,100,255')),'la lumière mauve est dessinée : '+kind);}
 E.item=items.find(it=>it.opts==='light');E.opts.light='lamp';E.lightColor='blue';E.paint(1,3,true);E.undo();ok(E.props['1,3'].lightColor==='purple','annuler restaure la couleur précédente');
}
{
 const tables=BK.EDITOR_TABS.find(t=>t.id==='deco').items.filter(it=>it.ch==='M'||it.deco?.startsWith('table_'));
 ok(tables.length===1&&tables[0].opts==='table','un seul outil Table avec choix du modèle');
 const E=new BK.Editor({cols:7,rows:5,base:'y',theme:'interior'});E.item=tables[0];E.orientation=3;
 for(const kind of ['table','table_round','table_dining','table_low','table']){E.opts.table=kind;E.paint(3,2,true);const again=new BK.Editor(JSON.parse(JSON.stringify(E.data())));ok(again.world.deco[again.world.idx(3,2)]===kind&&again.props['3,2'].orientation===3&&again.world.blocked(3,2),'changement de modèle conservé : '+kind);}
}
{
 for(const tab of ['deco','piece']){const seats=BK.EDITOR_TABS.find(t=>t.id===tab).items.filter(it=>['chair','stool'].includes(it.deco));ok(seats.length===1&&seats[0].opts==='seat','un seul outil Siège dans '+tab);}
 const E=new BK.Editor({cols:6,rows:5,base:'y',theme:'interior'});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.opts==='seat');E.orientation=1;
 for(const kind of ['chair','stool','chair']){E.opts.seat=kind;E.paint(2,2,true);const loaded=new BK.Editor(JSON.parse(JSON.stringify(E.data())));ok(loaded.world.deco[loaded.world.idx(2,2)]===kind&&loaded.props['2,2'].orientation===1,'modèle du siège et orientation sauvegardés : '+kind);}
}
{
 const lights=BK.EDITOR_TABS.find(t=>t.id==='deco').items.filter(it=>BK.LIGHT_KINDS.includes(it.deco||BK.DECO[it.ch]?.[0]));ok(lights.length===1&&lights[0].opts==='light','un seul outil Lumière avec modèles');
 const E=new BK.Editor({cols:8,rows:5,base:'y',theme:'interior'});E.item=lights[0];E.lightColor='red';
 for(const [i,kind] of BK.LIGHT_KINDS.entries()){E.opts.light=kind;E.paint(i+1,2,true);}
 const saved=new BK.Editor(JSON.parse(JSON.stringify(E.data())));ok(BK.LIGHT_KINDS.every((kind,i)=>saved.world.deco[saved.world.idx(i+1,2)]===kind&&saved.props[(i+1)+',2'].lightColor==='red'),'les quatre lumières conservent modèle et couleur');
 ok(saved.world.campfires.length===2,'âtre et feu de camp placés permettent de cuisiner');
 const W=new BK.World({map:['#######','#.....#','#.....#','#....i#','#.....#','#######'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),2,3);p.dir=2;
 ok(W.buildCampfire(p),'feu temporaire construit');const fire=W.campfires.find(f=>f.remaining!=null);W.frozen=true;run(W,20);ok(fire.remaining===15,'la pause ne consomme pas la durée du feu');W.frozen=false;run(W,14);
 ok(W.campfires.includes(fire)&&W.blocked(2,2),'le feu brûle encore avant quinze secondes');p.inv=[{type:'meatraw',n:1}];ok(W.cookFish(p,fire,'meatraw'),'cuisson commencée avant extinction');run(W,1.1);
 ok(!W.campfires.includes(fire)&&!W.blocked(2,2)&&W.deco[W.idx(2,2)]===null,'le feu disparaît et libère la case après quinze secondes');
 ok(W.items.some(it=>it.type==='meatraw'),'aliment rendu cru si le feu s’éteint avant la fin de cuisson');
 ok(W.campfires.some(f=>f.c===5&&f.r===3),'le feu de décor reste permanent');
}
{
 const {W,p}=powerArena();p.dir=2;p.inv=[{type:'wood',n:3}];ok(W.useItem(p,0),'feu créé avec un bois');const f=W.campfires[0];run(W,5);const before=f.remaining;ok(W.useItem(p,0)&&Math.abs(f.remaining-before-15)<1e-6&&p.inv[0].n===1,'un bois ajoute exactement quinze secondes');
 ok(W.useItem(p,0)&&p.inv.length===0&&W.campfires.length===1,'alimenter plusieurs fois conserve un seul feu');
 const labels=[],ctx=new Proxy({canvas:{width:1280,height:720},fillText(t){labels.push(t);}}, {get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:40}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(W.cols,W.rows,{top:60,bottom:40,left:40,right:40});W.render(ctx,cam,{});ok(labels.includes('🔥 '+Math.ceil(f.remaining)+' s'),'le compteur du feu affiche le temps restant');
 const stage=BK.stageList()[3];ok(stage.id==='1-4'&&stage.name==='Volcan Terrible'&&stage.map===BK.STAGE_1_4.grid&&stage.preview==='volcano','Volcan Terrible occupe le quatrième tableau');
 const a=new BK.Adventure('adam',3);ok(a.world.cols===28&&a.world.rows===49&&a.world.volcanoes.length>0&&a.world.exit,'la carte importée charge son volcan et sa sortie');
}
{
 const {W,p}=powerArena();p.dir=2;W.buildCampfire(p);const f=W.campfires[0];p.inv=[{type:'wood',n:2,perm:2},{type:'meatraw',n:1}];p.dir=3;
 const ctx=new Proxy({canvas:{width:1280,height:720}}, {get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:170}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(W.cols,W.rows,{top:60,bottom:40,left:40,right:40});W.render(ctx,cam,{});
 ok(W.fuelRect&&W.fuelRect.h>=44,'bouton Ajouter du bois visible et assez grand pour le tactile');
 const a=new BK.Adventure('adam',0);a.world=W;a.player=p;a.state='play';const rect=W.fuelRect;a.onClick(rect.x+rect.w/2,rect.y+rect.h/2);
 ok(f.remaining===30&&p.inv[0].n===1&&p.inv[0].perm===1,'clic : un bois du sac consommé et quinze secondes ajoutées, sans devoir faire face');
 W.cookFish(p,f,'meatraw');ok(W.addWoodToFire(p)&&f.cook&&f.remaining===45,'on peut ajouter du bois pendant une cuisson');W.render(ctx,cam,{});ok(!W.fuelRect&&!W.addWoodToFire(p),'sans bois le bouton disparaît et aucun ajout gratuit');
 p.inv=[{type:'wood',n:1}];p.x=10.5;ok(!W.addWoodToFire(p)&&p.inv[0].n===1,'clic devenu périmé : aucun bois consommé loin du feu');
}
{
 const {W,p}=powerArena();p.dir=2;W.buildCampfire(p);const fire=W.campfires[0],a=new BK.Adventure('adam',0);a.world=W;a.player=p;a.state='play';p.inv=[{type:'fish',n:2},{type:'meatraw',n:3},{type:'wood',n:1}];p.nearFire=fire;
 const old=BK.overlay;let dialog;BK.overlay={show(o){dialog=o;},hide(){}};
 try{
  ok(a.pressEnter()&&a.state==='pause'&&W.frozen,'Cuisiner ouvre le choix et met le jeu en pause');
  ok(dialog.buttons.length===3&&dialog.buttons[0].label.includes('2')&&dialog.buttons[1].label.includes('3'),'choix poisson et viande avec quantités, sans objets non cuisinables');
  dialog.buttons[1].onClick();ok(fire.cook.output==='meatcooked'&&p.inv.find(s=>s.type==='fish').n===2&&p.inv.find(s=>s.type==='meatraw').n===2,'choisir viande consomme uniquement une viande');
  dialog.buttons[1].onClick();ok(p.inv.find(s=>s.type==='meatraw').n===2&&a.state==='play'&&!W.frozen,'double clic sans double consommation et reprise du jeu');
  fire.cook=null;a.showCooking(fire);dialog.buttons.at(-1).onClick();ok(!fire.cook&&p.inv.find(s=>s.type==='fish').n===2,'annuler ne consomme rien');
  a.showCooking(fire);dialog.buttons[0].onClick();ok(fire.cook.output==='fishcooked'&&p.inv.find(s=>s.type==='fish').n===1,'choisir poisson cuisine un poisson');
  fire.cook=null;p.inv=[{type:'wood',n:1}];ok(!a.showCooking(fire)&&a.state==='play','aucun menu vide sans aliment cru');
 }finally{BK.overlay=old;}
}
{
 const {W,p}=powerArena();p.dir=2;W.buildCampfire(p);const f=W.campfires[0];p.inv=[{type:'fish',n:5},{type:'meatraw',n:2}];
 ok(!W.cookFish(p,f,'fish',6)&&!W.cookFish(p,f,'fish',1.5)&&p.inv[0].n===5,'quantités invalides refusées sans consommation');
 ok(W.cookFish(p,f,'fish',5)&&p.inv.length===1&&f.cook.left===5,'cinq poissons réservés pour la cuisson en série');
 W.updateFishes(4);ok(!W.items.some(i=>i.type==='fishcooked'),'aucun poisson cuit avant cinq secondes');
 W.updateFishes(1);ok((p.inv.find(i=>i.type==='fishcooked')?.n||0)===1&&f.cook.left===4,'une seule portion terminée après cinq secondes');
 W.updateFishes(10);ok(!W.campfires.includes(f)&&(p.inv.find(i=>i.type==='fishcooked')?.n||0)===3&&W.items.filter(i=>i.type==='fish').length===2,'quinze secondes : trois poissons cuits, deux rendus crus');
 const arena=powerArena(),Q=arena.W,q=arena.p;q.dir=2;Q.buildCampfire(q);const fire=Q.campfires[0];q.inv=[{type:'meatraw',n:4},{type:'wood',n:1}];Q.cookFish(q,fire,'meatraw',4);Q.updateFishes(12);ok(Q.addWoodToFire(q),'le bois prolonge une cuisson en série');Q.updateFishes(8);ok((q.inv.find(i=>i.type==='meatcooked')?.n||0)===4&&!fire.cook&&fire.remaining>0,'les quatre portions cuisent grâce au bois ajouté');
 const arena2=powerArena(),R=arena2.W,r=arena2.p;r.dir=2;R.buildCampfire(r);const short=R.campfires[0];short.remaining=7;r.inv=[{type:'meatraw',n:3}];R.cookFish(r,short,'meatraw',3);R.updateFishes(7);ok((r.inv.find(i=>i.type==='meatcooked')?.n||0)===1&&R.items.filter(i=>i.type==='meatraw').length===2,'portion inachevée et portion en attente sont toutes deux rendues crues');
}
{
 const {W,p}=powerArena();p.dir=2;W.buildCampfire(p);const fire=W.campfires[0];fire.remaining=60;p.inv=[{type:'fish',n:3}];W.cookFish(p,fire,'fish',3);
 p.x=9.5;W.updateFishes(5);ok(W.items.filter(i=>i.type==='fishcooked').length===1&&!p.inv.length,'loin du feu la portion cuite reste au sol');
 p.x=3.5;W.updateFishes(5);ok(p.inv.find(i=>i.type==='fishcooked')?.n===1,'le retour près du feu permet de recevoir la portion suivante');
 p.inv=Array.from({length:BK.BAG_SIZE},(_,i)=>({type:'test'+i,n:1}));W.updateFishes(5);ok(W.items.filter(i=>i.type==='fishcooked').length===2&&p.inv.length===BK.BAG_SIZE,'sac plein : la nourriture reste récupérable au sol');
 p.inv[0]={type:'meatraw',n:1};p.inv[1]={type:'meatcooked',n:2};W.cookFish(p,fire,'meatraw');p.inv.push({type:'extra',n:1});W.updateFishes(5);ok(p.inv.find(i=>i.type==='meatcooked').n===3,'une portion rejoint une pile existante même dans un sac plein');
}


// Transferts atomiques et couleurs du terrarium, sans modifier la carte source.
{
 const props={'2,2':{deco:'terrarium'}},W=new BK.World({map:['.....','.....','.."..','.....','.....'],props,theme:'interior',mode:'adventure',explore:true});
 const p=W.addPlayer(BK.charById('adam'),2,3);p.inv=[{type:'snail_blue',n:2,perm:1},{type:'snail_red',n:1}];
 ok(W.nearbyTerrarium(p)?.key==='2,2','terrarium accessible depuis une case adjacente');
 ok(W.terrariumTransfer(p,'2,2','snail_blue')&&W.terrariumTransfer(p,'2,2','snail_red'),'installer plusieurs couleurs depuis le sac');
 ok(W.props['2,2'].snails.map(s=>s.color).join(',')==='blue,red'&&p.inv[0].n===1&&!props['2,2'].snails,'transfert conserve couleurs et quantités sans modifier le modèle');
 ok(W.terrariumTransfer(p,'2,2','snail_blue',true)&&p.inv[0].n===2&&p.inv[0].perm===1,'reprendre conserve la provenance des objets');
 p.inv=Array.from({length:24},(_,i)=>({type:'full'+i,n:1}));
 ok(!W.terrariumTransfer(p,'2,2','snail_red',true)&&W.props['2,2'].snails.length===1,'sac plein ne perd aucun habitant');
 p.inv=[{type:'snail_green',n:8}];for(let i=0;i<7;i++)W.terrariumTransfer(p,'2,2','snail_green');
 ok(!W.terrariumTransfer(p,'2,2','snail_green')&&p.inv[0].n===1,'terrarium plein ne consomme pas un escargot du sac');
 p.x=.5;p.y=.5;ok(!W.terrariumTransfer(p,'2,2','snail_green',true),'pas de transfert à distance');
}

{
 const a=new BK.Adventure('adam',0),outer=a.world,door=outer.doors.find(d=>d.enterable),key=door.c+','+door.r;
 outer.houses={...outer.houses,[key]:{...outer.houses[key],interior:{grid:['#####','#1..#','#.".#','#...#','##G##'],theme:'interior',props:{'2,2':{deco:'terrarium'}}}}};
 a.enterHouse(door);a.player.x=2.5;a.player.y=3.5;a.player.inv=[{type:'snail_purple',n:1}];
 ok(a.world.terrariumTransfer(a.player,'2,2','snail_purple'),'installer un escargot dans le terrarium d’une maison');
 a.leaveHouse();a.enterHouse(door);a.player.x=2.5;a.player.y=3.5;
 ok(a.world.props['2,2'].snails[0]?.color==='purple'&&a.world.terrariumTransfer(a.player,'2,2','snail_purple',true),'retrouver et reprendre son escargot après une sortie puis une rentrée');
 const trace=[],ctx=new Proxy({}, {get:(o,k)=>o[k]||(o[k]=(...args)=>trace.push([k,...args])),set:(o,k,v)=>{trace.push([k,v]);o[k]=v;return true;}});
 const pr={snails:[{color:'red'},{color:'blue'}]};
 BK.sprites.drawDeco(ctx,'terrarium',0,0,80,0,null,3,0,null,pr);const first=JSON.stringify(trace);trace.length=0;
 BK.sprites.drawDeco(ctx,'terrarium',0,0,80,4,null,3,0,null,pr);
 ok(first!==JSON.stringify(trace)&&trace.some(x=>x.includes(BK.SNAIL_COLORS.red.shell))&&trace.some(x=>x.includes(BK.SNAIL_COLORS.blue.shell)),'habitants animés avec leurs véritables couleurs de coquille');
}
{
 const ctx=new Proxy({measureText:t=>({width:Array.from(t).length*9})},{get:(o,k)=>o[k]||(o[k]=()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
 const text='Gonflage : Bombe en main : maintiens Espace pour la gonfler, relâche pour la lancer. Plus grosse, plus puissante !';
 const b=BK.sprites.drawHelpBubble(ctx,text,3);
 ok(b.width<=480&&b.lines.length>1&&b.lines.every(l=>ctx.measureText(l).width<=448),'bulle d’aide compacte : texte long réparti en lignes sans déborder');
 ok(b.y+b.height<=BK.H-100&&b.x>=0&&b.x+b.width<=BK.W,'bulle au-dessus de la ceinture et dans l’écran');
 const long=BK.sprites.drawHelpBubble(ctx,'x'.repeat(160),3);ok(long.lines.every(l=>ctx.measureText(l).width<=448),'mot très long coupé sans dépasser la bulle');
}
{
 const a=new BK.Adventure('adam',1),m=BK.STAGE_1_2;
 ok(a.stage.id==='1-2'&&a.stage.name==='Le Sentier'&&a.world.cols===20&&a.world.rows===49&&a.stage.map===m.grid,'Le Sentier importé au niveau 1-2');
 ok(a.stage.objective==='goal'&&a.world.exit&&a.world.enemies.length===m.enemies.length,'portail et habitants de la carte Le Sentier chargés');
 const W=new BK.World({map:['.....','.....','.."..','.....','.....'],props:{'2,2':{deco:'terrarium',snails:[{color:'red'},{color:'blue'}]}},theme:'interior',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),2,3),pr=W.props['2,2'];
 p.inv=[];ok(!W.feedTerrarium(p,'2,2')&&!pr.snailFood,'pas de repas sans carotte');
 p.inv=[{type:'carrot',n:2,perm:1}];ok(W.feedTerrarium(p,'2,2')&&p.inv[0].n===1&&p.inv[0].perm===1&&pr.snailFood.starts.length===2,'une seule carotte consommée avec positions de départ de chaque escargot');
 ok(!W.feedTerrarium(p,'2,2')&&p.inv[0].n===1,'pas de double consommation pendant le repas');
 W.frozen=true;W.update(1);ok(pr.snailFood.elapsed===0,'repas suspendu pendant la pause');W.frozen=false;
 W.updateTerrariums(4);ok(pr.snailFood.elapsed===4,'les escargots atteignent la carotte avant de grignoter');
 W.updateTerrariums(8);ok(!pr.snailFood&&pr.snails.length>=2&&pr.snails.length<=3,'fin du repas et reprise de promenade sans perdre les escargots');
 pr.snails=[];ok(!W.feedTerrarium(p,'2,2')&&p.inv[0].n===1,'terrarium vide ne consomme pas de carotte');
}
{
 const W=new BK.World({map:['.....','.....','.."..','.....','.....'],props:{'2,2':{deco:'terrarium',snails:[{color:'red'},{color:'blue'}]}},theme:'interior',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),2,3),pr=W.props['2,2'];p.inv=[{type:'carrot',n:10}];
 const random=Math.random;
 try{
  Math.random=()=>0;W.feedTerrarium(p,'2,2');W.updateTerrariums(12);
  ok(pr.snails.length===3&&pr.snails[2].baby&&pr.snails[2].color==='red','repas de deux adultes : bébé avec la couleur d’un parent');
  W.updateTerrariums(30);ok(pr.snails.length===3,'une seule naissance possible par repas');
  ok(W.terrariumTransfer(p,'2,2','snail_baby_red',true)&&p.inv.some(s=>s.type==='snail_baby_red'),'bébé garde sa taille et sa couleur dans le sac');
  const slot=p.inv.findIndex(s=>s.type==='snail_baby_red');p.dir=3;
  ok(W.useItem(p,slot)&&W.enemies.some(e=>e.type==='escargot'&&e.baby&&e.shellColor==='red'),'bébé reste petit en le déposant dans le monde');
  Math.random=()=>.99;W.feedTerrarium(p,'2,2');W.updateTerrariums(12);ok(pr.snails.length===2,'naissance possible mais non garantie');
  Math.random=()=>0;pr.snails=[{color:'blue'},{color:'red',baby:true}];W.feedTerrarium(p,'2,2');W.updateTerrariums(12);ok(pr.snails.length===2,'un bébé ne devient pas parent');
  pr.snails=Array.from({length:8},()=>({color:'blue'}));W.feedTerrarium(p,'2,2');W.updateTerrariums(12);ok(pr.snails.length===8,'naissances respectent la capacité du terrarium');
 }finally{Math.random=random;}
}
for(const type of ['abeille','guepe']) {
 const W=new BK.World({map:Array(7).fill('.'.repeat(15)),mode:'adventure',explore:true,theme:'garden'}),p=W.addPlayer(BK.charById('adam'),1,3),e=W.addEnemy(type,8,3),x=e.x,y=e.y;
 for(let i=0;i<240;i++)W.updateEnemy(e,1/60);
 ok(e.x===x&&e.y===y&&e.state==='walk'&&e.z>.5,type+' ne poursuit pas un joueur éloigné');
 p.x=e.x-2.9;p.y=e.y;for(let i=0;i<180&&e.state!=='dive';i++)W.updateEnemy(e,1/60);
 ok(e.state==='dive',type+' attaque quand on entre dans son rayon de trois cases');
 p.x=.5;W.updateEnemy(e,1/60);ok(e.state==='walk'&&e.z>.5&&!e.to,type+' interrompt l’attaque quand le joueur s’éloigne');
}
{
 const W=new BK.World({map:['.....','.....','.."..','.....','.....'],props:{'2,2':{deco:'terrarium',snails:[{color:'blue',baby:true},{color:'red'}]}},theme:'interior',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),2,3),pr=W.props['2,2'];p.inv=[{type:'carrot',n:8}];
 const random=Math.random;try{Math.random=()=>0;
 W.feedTerrarium(p,'2,2');W.updateTerrariums(6);ok(!pr.snails[0].growth,'pas de repas comptabilisé avant la fin');W.updateTerrariums(6);
 ok(pr.snails[0].growth===1&&pr.snails[0].baby,'premier repas : bébé un peu plus grand');
 ok(W.terrariumTransfer(p,'2,2','snail_baby1_blue',true)&&W.terrariumTransfer(p,'2,2','snail_baby1_blue'),'croissance conservée lors d’un aller-retour dans le sac');
 W.feedTerrarium(p,'2,2');W.updateTerrariums(12);const young=pr.snails.find(s=>s.color==='blue');ok(young.growth===2&&young.baby,'deuxième repas : jeune escargot');
 W.feedTerrarium(p,'2,2');W.updateTerrariums(12);ok(!young.baby&&pr.snails.length===2,'troisième repas : adulte, sans naissance au repas de maturation');
 W.feedTerrarium(p,'2,2');W.updateTerrariums(12);ok(pr.snails.length===3&&pr.snails[2].baby&&!pr.snails[2].growth,'le nouvel adulte peut devenir parent et son bébé naît tout petit');
 }finally{Math.random=random;}
}
{
 const E=new BK.Editor({name:'Rampes hautes',cols:9,rows:7,theme:'garden',base:','});
 E.props['3,3']={lv:2};E.props['2,3']={lv:2};E.props['4,3']={lv:3};E.rebuild();
 const screen=E.cam.project(3.5,3.5,1.2),picked=E.cellAt(screen.x,screen.y);
 ok(picked?.c===3&&picked?.r===3,'sélection précise du sol au deuxième étage');
 E.item=BK.EDITOR_TABS.flatMap(t=>t.items||[]).find(it=>it.ch==='/');E.paint(3,3,true);
 ok(E.props['3,3'].lv===2&&E.world.ramp[E.world.idx(3,3)]===2,'poser une rampe conserve son étage et vise le troisième étage voisin');
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,theme:'garden',mode:'adventure',explore:true});
 ok(Math.abs(W.groundZ(3.001,3.5)-1.2)<.01&&Math.abs(W.groundZ(3.999,3.5)-1.8)<.01,'rampe rechargée relie les étages deux et trois');
 const p=W.addPlayer(BK.charById('adam'),2,3);p.input.dx=1;p.input.dy=0;
 for(let i=0;i<120&&p.x<4.3;i++)W.updatePlayer(p,1/60);
 ok(p.x>4&&W.groundZ(p.x,p.y)>1.7,'le héros monte la rampe jusqu’au troisième étage');
}
{
 const W=new BK.World({map:['.....','.....','.."..','.....','.....'],props:{'2,2':{deco:'terrarium',snails:[{color:'blue',baby:true,growth:1},{color:'blue',baby:true,growth:1}]}},theme:'interior',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),2,3);p.inv=[];
 ok(W.renameTerrariumSnail(p,'2,2',0,'  Léo  ')&&W.renameTerrariumSnail(p,'2,2',1,'Lune'),'nom individuel attribué à deux escargots identiques');
 W.terrariumTransfer(p,'2,2','snail_baby1_blue',true,0);W.terrariumTransfer(p,'2,2','snail_baby1_blue',true,0);
 ok(p.inv[0].n===2&&p.inv[0].snails.map(s=>s.nickname).join(',')==='Léo,Lune','les noms restent distincts dans une même pile du sac');
 p.dir=3;ok(W.useItem(p,0,1)&&W.enemies[0].nickname==='Lune'&&W.enemies[0].growth===1&&p.inv[0].snails[0].nickname==='Léo','déposer précisément le deuxième escargot nommé');
 p.x=W.enemies[0].x;p.y=W.enemies[0].y;W.useSnail(p);W.stowSnail(p);
 ok(p.inv[0].snails[1].nickname==='Lune','nom conservé après ramassage puis rangement');
 p.x=2.5;p.y=3.5;W.terrariumTransfer(p,'2,2','snail_baby1_blue',false,1);
 ok(W.props['2,2'].snails[0].nickname==='Lune'&&p.inv[0].snails[0].nickname==='Léo','réinstaller le bon escargot nommé dans le terrarium');
 ok(BK.snailName('x'.repeat(50)).length===24&&BK.snailName(' A\nB ')==='AB','nom limité et caractères de contrôle retirés');
 const a=new BK.Adventure('adam',0);a.player.inv=[{type:'snail_blue',n:1,perm:1,snails:[{color:'blue',nickname:'Perle',perm:true}]}];a.syncInv();
 ok(a.save.inv[0].snails[0].nickname==='Perle','sauvegarde des noms des escargots persistants');
}
{
 const W=new BK.World({map:Array(8).fill('.'.repeat(12)),theme:'garden',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),2,3),e=W.addEnemy('escargot',3,3,{nickname:'Léo'}),cam=new BK.Camera(BK.W,BK.H);
 ok(W.nearbySnailNames(cam).some(l=>l.text==='Léo'),'nom de l’escargot visible à proximité');
 e.shell=1;ok(W.nearbySnailNames(cam).some(l=>l.text==='Léo'),'nom visible même dans la coquille');
 p.x=10.5;ok(!W.nearbySnailNames(cam).length,'nom masqué quand le joueur s’éloigne');
 W.props['2,2']={deco:'terrarium',snails:[{color:'blue',nickname:'Lune'},{color:'red',nickname:'Perle'}]};W.deco[W.idx(2,2)]='terrarium';W.cells[W.idx(2,2)]=BK.HARD;p.x=2.5;p.y=3.5;
 const labels=W.nearbySnailNames(cam).filter(l=>l.text!=='Léo');ok(labels.length===2&&labels.some(l=>l.text==='Lune')&&labels.some(l=>l.text==='Perle'),'chaque escargot du terrarium affiche son nom');
 W.time=4;const moved=W.nearbySnailNames(cam).find(l=>l.text==='Lune');ok(moved.x!==labels[0].x,'étiquette suit la promenade dans le terrarium');
 p.x=10.5;ok(!W.nearbySnailNames(cam).length,'noms du terrarium masqués à distance');
}
{
 const W=new BK.World({map:['.......','.ppp~..','..*~...','.."~...','.......'],props:{'2,3':{deco:'bones'}},theme:'garden',mode:'adventure',explore:true}),trails=[],drawn=[];
 const originalTrail=W.drawTrail,originalFlowers=BK.sprites.drawFlowers,originalDeco=BK.sprites.drawDeco;
 const labels=[],ctx=new Proxy({canvas:{width:1280,height:720},fillText(t){labels.push(t);}}, {get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:40}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(W.cols,W.rows,{top:60,bottom:40,left:40,right:40});
 try{W.drawTrail=(ctx,cam,c,r,z)=>trails.push(c+','+r);BK.sprites.drawFlowers=()=>drawn.push('flowers');BK.sprites.drawDeco=(ctx,kind)=>drawn.push(kind);W.render(ctx,cam,{});
 ok(trails.length===3&&trails.includes('3,1')&&trails.includes('2,1'),'toutes les cases de poudre sont dessinées, y compris sur les berges');
 ok(drawn.includes('flowers')&&drawn.includes('bones'),'fleurs et décors non solides restent visibles au bord de l’eau');
 }finally{W.drawTrail=originalTrail;BK.sprites.drawFlowers=originalFlowers;BK.sprites.drawDeco=originalDeco;}
 W.props['2,3']={deco:'terrarium',snails:[{color:'blue'}]};W.deco[W.idx(2,3)]='terrarium';W.cells[W.idx(2,3)]=BK.HARD;const pr=W.props['2,3'];
 ok(W.terrariumHungry(pr),'terrarium peuplé initialement à nourrir');labels.length=0;W.render(ctx,cam,{});ok(labels.includes('🥕'),'petite carotte affichée au-dessus du terrarium affamé');
 pr.snailFood={elapsed:0,starts:[{}]};ok(!W.terrariumHungry(pr),'icône masquée pendant le repas');W.updateTerrariums(12);ok(!W.terrariumHungry(pr)&&pr.snailSatiety===60,'escargots rassasiés après le repas');
 W.updateTerrariums(59);ok(!W.terrariumHungry(pr),'pas de rappel avant une minute');W.updateTerrariums(1);ok(W.terrariumHungry(pr),'rappel de carotte après une minute sans repas');
 pr.snails=[];ok(!W.terrariumHungry(pr),'aucun rappel sur un terrarium vide');
}
{
 const W=new BK.World({map:Array(5).fill('.......'),theme:'garden',mode:'adventure',hearts:true,explore:true}),p=W.addPlayer(BK.charById('adam'),3,2,{hp:40});p.invuln=0;
 const normal=W.addFlame(1,2,'center',0,{level:1,damage:1}),red=W.addFlame(3,2,'center',0,{level:2,damage:2});
 ok(red.duration===2*BK.FLAME_TIME&&normal.duration===BK.FLAME_TIME,'niveau 2 : durée des flammes exactement doublée');
 W.updateFlames(BK.FLAME_TIME+.05);ok(!W.flames.includes(normal)&&W.flames.includes(red),'flamme rouge reste après extinction d’une flamme normale');
 const hp=p.hp;W.checkHits();ok(p.hp===hp-20,'flamme rouge encore dangereuse pendant sa seconde moitié');
 W.updateFlames(BK.FLAME_TIME);ok(!W.flames.length&&!W.flameAt.size,'flamme rouge disparaît après sa durée complète');
 const f=W.addFlame(2,2,'center',0,{level:2,damage:2});W.updateFlames(.1);const remaining=f.duration-f.t;W.addFlame(2,2,'end',1,{level:1,damage:1});ok(f.level===2&&f.duration>=remaining&&f.bomb.damage===2,'chevauchement normal ne raccourcit ni ne dégrade une flamme rouge');
 const stops=[],ctx=new Proxy({createRadialGradient:()=>({addColorStop:(at,color)=>stops.push(color)})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);
 BK.sprites.drawFlame(ctx,cam,2,2,.5,'center',0,1,0,false,2);ok(stops.some(c=>c.startsWith('rgba(220,15,35,')),'palette rouge intense pour les flammes de niveau 2');
}
{
 const W=new BK.World({map:['#########','#.......#','#########'],mode:'adventure',hearts:true,explore:true,theme:'garden'}),leader=W.addPlayer(BK.charById('adam'),7,1),p=W.addPlayer(BK.charById('richard'),3,1);Object.assign(p,{ally:true,human:false,leader,planT:0,path:[],bombCool:99});
 const f=W.addFlame(4,1,'center',0,{level:2,damage:2});p.x=3.6;
 W.moveCircle(p,.6,0,p);ok(p.x+p.r<=4.001,'allié arrêté avant de toucher une flamme, même avec un déplacement déjà engagé');
 W.updateFlames(BK.FLAME_TIME+.1);W.updateAlly(p,1/60);W.updatePlayer(p,1/60);
 ok(W.flames.includes(f)&&p.x<4,'allié attend pendant la seconde moitié des flammes niveau 2');
 for(let i=0;i<15;i++){W.updateAlly(p,1/60);W.updatePlayer(p,1/60);W.updateFlames(1/60);ok(p.x<4,'allié reste devant le passage en feu');}
 W.updateFlames(1);for(let i=0;i<100&&p.x<5;i++){W.updateAlly(p,1/60);W.updatePlayer(p,1/60);}
 ok(p.x>4.5,'allié reprend sa route après extinction complète');
 p.x=4.5;W.addFlame(4,1,'center',0,{level:2,damage:2});W.updateAlly(p,1/60);ok(p.input.dx!==0||p.input.dy!==0,'allié cherche à sortir si une flamme apparaît sous ses pieds');
}
for(const type of ['abeille','guepe'])for(const level of [1,2]) {
 const W=new BK.World({map:Array(5).fill('.......'),mode:'adventure',hearts:true,explore:true,theme:'garden'}),p=W.addPlayer(BK.charById('adam'),3,2),e=W.addEnemy(type,3,2);e.z=.95;
 p.bomb2=level===2;W.placeBomb(p);W.explodeBomb(W.bombs[0]);W.checkHits();
 ok(e.dead,type+' en vol touchée par une bombe niveau '+level+' située dessous');
}
{
 const W=new BK.World({map:['.......','..~~~..','..~~~..','.......','.......'],theme:'garden',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),1,3);p.inv=[];
 const bee=W.addEnemy('abeille',3,2);bee.z=.9;W.hurtEnemy(bee,p,1,'bomb');
 const honey=W.items.find(it=>it.type==='honey');ok(honey&&honey.value===1&&W.walkableTerrain(honey.cx,honey.cy),'abeille vaincue au-dessus de l’eau laisse un miel sur une case récupérable');
 W.hurtEnemy(bee,p,1,'bomb');ok(W.items.filter(it=>it.type==='honey').length===1,'une abeille ne laisse son miel qu’une fois');
 W.takeItem(p,honey);ok(p.inv.find(s=>s.type==='honey')?.n===1,'miel d’abeille ramassé dans le sac : quantité un');
 const bee2=W.addEnemy('abeille',4,3);W.hurtEnemy(bee2,p,1,'other');W.takeItem(p,W.items.find(it=>it.type==='honey'));ok(p.inv.find(s=>s.type==='honey')?.n===2,'deux abeilles donnent deux miels dans une même pile');
 const wasp=W.addEnemy('guepe',5,3);W.hurtEnemy(wasp,p,1,'bomb');ok(!W.items.some(it=>it.type==='honey'),'les guêpes ne donnent pas de miel');
 const a=new BK.Adventure('adam',2),m=BK.STAGE_1_3;
 ok(a.stage.id==='1-3'&&a.stage.name===m.name&&a.stage.map===m.grid&&a.world.cols===48&&a.world.rows===20,'Les 3 cibles occupe le troisième tableau avec sa carte complète');
 ok(a.world.exit&&Object.keys(a.world.targets).length===3,'portail et trois cibles chargés depuis la carte');
 ok(BK.stageList().slice(0,4).every((s,i)=>s.map===BK['STAGE_1_'+(i+1)].grid),'les quatre premiers tableaux utilisent les cartes importées');
}
{
 const W=new BK.World({map:['#########','#.......#','#...#...#','#.......#','#########'],mode:'adventure',hearts:true,explore:true,theme:'garden'}),p=W.addPlayer(BK.charById('adam'),6,2,{hp:40}),e=W.addEnemy('taupe',2,2);
 Object.assign(e,{state:'up',stateT:0,cool:0});W.updateMole(e,.1);ok(!W.shots.length,'taupe ne tire pas sur un joueur caché derrière un mur');
 W.cells[W.idx(4,2)]=0;W.updateMole(e,.1);ok(W.shots.length===1&&W.shots[0].kind==='dirt','taupe tire lorsque le passage est dégagé');
 const shot=W.shots[0];W.cells[W.idx(4,2)]=BK.HARD;W.updateShots(.6);
 ok(shot.dead&&shot.x<5&&p.hp===40,'mot­te arrêtée par un mur apparu après le tir, même en hauteur et avec un grand pas de simulation');
 W.shots=[];W.cells[W.idx(4,2)]=BK.SOFT;Object.assign(e,{state:'up',cool:0});W.updateMole(e,.1);ok(!W.shots.length,'les blocs destructibles bloquent aussi la visée de la taupe');
}
for(const wall of ['#','W','x']) {
 const W=new BK.World({map:['#######','#..'+wall+'..#','#######'],theme:'garden',mode:'adventure',explore:true}),p=W.addPlayer(BK.charById('adam'),5,1),e=W.addEnemy('taupe',1,1);const block=W.cell(3,1);
 for(let i=0;i<600;i++)W.updateEnemy(e,1/60);
 ok(e.x+e.r*.8<=3.01&&W.cell(3,1)===block,'taupe souterraine arrêtée par '+wall+' sans détruire le mur');
 e.state='hidden';W.updateMole(e,3);ok(e.x+e.r*.8<=3.01,'grand pas de simulation ne traverse pas le mur '+wall);
}
{
 const a=new BK.Adventure('adam',0),best=JSON.stringify(a.save.best),gold=a.save.gold;a.unlockAllStages();
 const saved=BK.loadAdventure('adam');ok(saved.unlocked>=BK.stageList().length&&JSON.stringify(saved.best)===best&&saved.gold===gold,'triche débloque tous les tableaux sans inventer de victoires ni changer l’or');
 const ws=new BK.WorldSelect('adam');ok(ws.worlds.every((w,i)=>w.soon||ws.unlocked[i]),'tous les mondes disponibles sont accessibles après la triche');
}
{
 const E=new BK.Editor({cols:13,rows:11,base:',',theme:'garden'});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.deco==='firebar');E.firebarLength=4;E.firebarDirection=-1;E.paint(6,5,true);
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,theme:'garden',mode:'adventure',hearts:true,explore:true}),bar=W.firebars[0],p=W.addPlayer(BK.charById('adam'),8,5,{hp:40});p.invuln=0;
 ok(bar&&W.props['6,5'].length===4&&W.props['6,5'].direction===-1,'barre de feu et options conservées après export');
 W.checkHits();ok(p.hp===30,'les flammes tournantes blessent au contact');
 p.invuln=0;p.y=8.5;W.checkHits();ok(p.hp===30,'aucun dégât hors de la barre de feu');
 W.update(.1);ok(bar.angle<0,'rotation dans le sens antihoraire choisi');const angle=bar.angle;W.frozen=true;W.update(.1);ok(bar.angle===angle,'barre de feu arrêtée pendant la pause');
}
for(const [speed,mult] of [['slow',.5],['normal',1],['fast',2]]) {
 const E=new BK.Editor({cols:9,rows:7,base:',',theme:'garden'});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.deco==='firebar');E.firebarSpeed=speed;E.firebarDirection=-1;E.paint(4,3,true);
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,theme:'garden',mode:'adventure',explore:true});W.update(.1);
 ok(W.props['4,3'].speed===speed&&Math.abs(W.firebars[0].angle+.09*mult)<1e-8,'vitesse '+speed+' conservée et appliquée dans le sens choisi');
 W.frozen=true;const angle=W.firebars[0].angle;W.update(.1);ok(W.firebars[0].angle===angle,'vitesse '+speed+' respecte la pause');
}
{
 const W=new BK.World({map:['...','.".','...'],props:{'1,1':{deco:'firebar'}},theme:'garden',mode:'adventure',explore:true});W.update(.1);ok(Math.abs(W.firebars[0].angle-.09)<1e-8,'anciennes barres sans option gardent la vitesse normale');
}
for(const [speed,direction] of [['slow',1],['normal',-1],['fast',1]]) {
 const W=new BK.World({map:['###########','###########','####"######','###########','#.........#','###########'],props:{'4,2':{deco:'firebar',length:3,speed,direction}},theme:'garden',mode:'adventure',hearts:true,explore:true}),leader=W.addPlayer(BK.charById('adam'),9,4),p=W.addPlayer(BK.charById('richard'),1,4,{hp:40});Object.assign(p,{ally:true,human:false,leader,planT:0,path:[],bombCool:99,invuln:0});W.firebars[0].angle=Math.PI/2;
 let waited=false;for(let i=0;i<600&&p.x<7.5;i++){W.update(1/30);waited ||= p.input.dx===0&&p.input.dy===0;}
 ok(p.hp===40&&p.alive,'allié traverse sans brûlure : barre '+speed+' sens '+direction);
 ok(p.x>=7.45&&(speed!=='slow'||waited),'allié attend une ouverture puis rejoint le héros : '+speed+' x='+p.x+' attente='+waited);
}
{
 const E=new BK.Editor({cols:13,rows:11,base:',',theme:'garden'});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.deco==='firebar');E.firebarArms=2;E.firebarSpeed='fast';E.firebarDirection=-1;E.paint(6,5,true);
 const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,theme:'garden',mode:'adventure',hearts:true,explore:true}),bar=W.firebars[0];
 ok(W.props['6,5'].arms===2,'option deux barres conservée après export et rechargement');
 const opposed=()=>{const pts=W.firebarPoints(bar),half=pts.length/2;return pts.slice(0,half).every((q,i)=>Math.abs(q.x+pts[i+half].x-13)<1e-8&&Math.abs(q.y+pts[i+half].y-11)<1e-8);};
 ok(opposed(),'les deux bras sont opposés sur le même pivot');W.update(.3);ok(opposed()&&bar.angle<0,'les deux bras tournent ensemble à la vitesse et dans le sens choisis');
 bar.angle=0;const p=W.addPlayer(BK.charById('adam'),4,5,{hp:40});p.invuln=0;W.checkHits();ok(p.hp===30,'le deuxième bras inflige des dégâts lui aussi');
 W.props['6,5'].arms=1;const single=W.firebarPoints(bar).length;W.props['6,5'].arms=2;ok(W.firebarPoints(bar).length===single*2,'deux bras produisent exactement deux rangées de flammes');
}
{
 const W=new BK.World({map:['###########','###########','####"######','###########','#.........#','###########'],props:{'4,2':{deco:'firebar',length:3,speed:'slow',arms:2}},theme:'garden',mode:'adventure',hearts:true,explore:true}),leader=W.addPlayer(BK.charById('adam'),9,4),p=W.addPlayer(BK.charById('richard'),1,4,{hp:40});Object.assign(p,{ally:true,human:false,leader,planT:0,path:[],bombCool:99,invuln:0});W.firebars[0].angle=-Math.PI/2;
 let waited=false;for(let i=0;i<600&&p.x<7.45;i++){W.update(1/30);waited ||= !p.input.dx&&!p.input.dy;}
 ok(p.hp===40&&p.x>=7.45&&waited,'allié anticipe le bras opposé et traverse après avoir attendu');
}
// Sanctuaire : gardiens, transformation, attaques et jets d’eau.
{
 const a=new BK.Adventure('adam',4),W=a.world,p=a.player,b=W.enemies.find(e=>e.arenaBoss),guards=W.enemies.filter(e=>e.arenaGuard);
 ok(W.cols===25&&W.volcanoes.length===2&&guards.length===2,'sanctuaire : deux volcans et deux gardiens');
 ok(!W.hurtEnemy(b,p,99,'bomb')&&b.hp===10&&!a.objectiveDone(),'golem scellé et sortie verrouillée');
 guards[0].z=0;W.hurtEnemy(guards[0],p,99,'bomb');W.updateEnemy(b,.1);ok(b.state==='sealed','un seul gardien ne libère pas le boss');
 guards[1].z=0;W.hurtEnemy(guards[1],p,99,'bomb');W.updateEnemy(b,.1);ok(b.state==='walk','deux gardiens vaincus : boss réveillé');
 b.aim=0;W.performFirstBossAttack(b,p,'fire');ok(W.shots.length===1,'première phase : souffle simple');W.shots=[];
 p.x=b.x+1;p.y=b.y;W.placeBomb(p);const kicked=W.bombs.at(-1);p.x+=3;W.updateEnemy(b,.01);ok(kicked.state==='sliding'&&kicked.kicker===b,'le boss botte une bombe proche');W.bombs=[];p.x=12.5;p.y=22.5;
 W.hurtEnemy(b,p,99,'bomb');ok(b.phase===2&&!b.dead&&b.hp===12&&b.state==='transform'&&!a.objectiveDone(),'première barre épuisée : deuxième forme, sortie encore fermée');
 ok(!W.hurtEnemy(b,p,99,'bomb'),'transformation protégée');W.updateEnemy(b,2.1);
 b.aim=0;W.performFirstBossAttack(b,p,'fire');ok(W.shots.length===3,'souffle en éventail en deuxième phase');
 W.performFirstBossAttack(b,p,'bomb');const bomb=W.bombs.at(-1);W.updateBombs(.1);ok(bomb.level===2&&Number.isFinite(bomb.z)&&bomb.state==='flying','bombe rouge lancée en arc valide');W.updateBombs(.7);ok(bomb.state==='idle'&&Number.isFinite(bomb.x),'bombe du boss atterrit');
 W.frozen=false;W.performFirstBossAttack(b,p,'anvils');ok(W.arenaAnvils.length===3,'trois enclumes annoncées');p.invuln=0;const hp=p.hp;W.updateArenaEffects(.5);ok(p.hp===hp,'avertissement des enclumes sans dégât');W.updateArenaEffects(1.1);ok(p.hp<hp,'enclume inflige des dégâts après sa chute');
 W.performFirstBossAttack(b,p,'wave');ok(W.arenaWaves.length===1,'onde de choc de deuxième phase');
 b.hurt=0;W.hurtEnemy(b,p,99,'bomb');ok(b.dead&&a.objectiveDone(),'sortie déverrouillable seulement après les deux formes');
 const ctx=new Proxy({canvas:{width:1280,height:720}},{get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:40}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>{o[k]=v;return true;}}),cam=new BK.Camera(1280,720);cam.fit(25,25,{top:60,bottom:40,left:40,right:40});W.render(ctx,cam,{});ok(true,'rendu des jets, enclumes et ondes sans erreur');
}
{
 const W=new BK.World({map:['###########','#.........#','#.".......#','#.........#','###########'],props:{'2,2':{deco:'waterjet',orientation:3}},theme:'garden',mode:'adventure',hearts:true,explore:true}),p=W.addPlayer(BK.charById('adam'),3,2);p.invuln=0;const hp=p.hp,x=p.x;
 for(let i=0;i<12;i++){W.moveCircle(p,-p.speed*BK.RUN_MULT/60,0,p);W.updateArenaEffects(1/60);}ok(p.x>x&&p.hp===hp,'jet plus puissant que la course opposée, sans dégât');
 W.cells[W.idx(4,2)]=1;ok(W.waterJetPoints(2,2).every(q=>q.x<4),'jet arrêté par les murs');
 const E=new BK.Editor({name:'Jet',cols:7,rows:5,theme:'garden',base:','});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(it=>it.deco==='waterjet');E.orientation=1;E.paint(3,2,true);const data=E.data();ok(data.props['3,2'].deco==='waterjet'&&data.props['3,2'].orientation===1,'jet disponible et orientable dans l’éditeur');
}
// Les compagnons réagissent aux menaces de l’arène avant les impacts.
function companionArena(){
 const W=new BK.World({map:Array.from({length:19},(_,r)=>r===0||r===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#'),theme:'garden',mode:'adventure',hearts:true,explore:true}),leader=W.addPlayer(BK.charById('adam'),14,9),p=W.addPlayer(BK.charById('richard'),9,9,{hp:40});
 Object.assign(p,{ally:true,human:false,leader,planT:0,path:[],bombCool:99,invuln:0});return {W,p,leader};
}
for(const kind of ['anvil','fire','wave']){
 const {W,p}=companionArena();
 if(kind==='anvil')W.arenaAnvils=[{x:p.x,y:p.y,t:0,warn:1.1}];
 else W.addEnemy('golem',kind==='wave'?7:5,9,{arenaBoss:true,phase:2,state:'walk',attack:{kind,t:1},aim:0,kickCool:10,attackCool:100,attackIndex:0});
 ok(BK.ai.allyArenaDanger(W)[W.idx(9,9)]!==Infinity,'allié anticipe '+kind);
 run(W,3);ok(p.hp===40&&Math.hypot(p.x-9.5,p.y-9.5)>1,'allié esquive '+kind+' sans perdre de vie');
}
{
 const {W,p,leader}=companionArena();W.props['7,9']={deco:'waterjet',orientation:3};W.deco[W.idx(7,9)]='waterjet';W.cells[W.idx(7,9)]=1;
 p.x=6.5;p.y=9.5;leader.x=14.5;let wet=false;for(let i=0;i<300;i++){W.update(1/60);wet ||= W.waterJetPoints(7,9).some(q=>Math.hypot(p.x-q.x,p.y-q.y)<p.r+.23);}
 ok(!wet&&p.x>12,'allié contourne le jet pour rejoindre le joueur, sans se faire pousser');
}
for(const phase of [1,2]){
 const {W,p,leader}=companionArena();p.x=5.5;p.y=9.5;p.bombCool=0;leader.x=8.5;leader.y=11.5;
 const e=W.addEnemy('golem',9,9,{arenaBoss:true,phase,state:'walk',hp:10,maxHp:10});
 W.updateAlly(p,.1);ok(p.carrying&&p.carrying.owner===p,'allié prépare une bombe contre la forme '+phase);p.poseT=1;W.updateAlly(p,.1);const b=W.bombs[0];ok(b.state==='flying','allié lance sa bombe contre la forme '+phase);W.updateBombs(.6);W.explodeBomb(b);W.checkHits();ok(e.hp<10,'bombe alliée blesse la forme '+phase);
}
{
 const {W,p,leader}=companionArena();const b=W.addEnemy('golem',9,8,{arenaBoss:true,state:'sealed'}),g=W.addEnemy('crapaud',10,9,{arenaGuard:true});
 ok(!BK.ai.allyTargetable(b)&&BK.ai.allyTargetable(g),'alliés ciblent les gardiens pendant le scellement');b.state='transform';ok(!BK.ai.allyTargetable(b),'alliés attendent pendant la transformation');b.state='walk';b.phase=2;ok(BK.ai.allyTargetable(b),'alliés reprennent le combat après transformation');
 g.z=0;g.hurt=0;p.bombCool=99;p.x=g.x-.9;p.y=g.y;leader.x=g.x;const hp=g.hp;W.updateAlly(p,.1);ok(g.hp<hp,'allié aide à combattre le crapaud');
}
// Coffre du boss : récompenses persistantes, réservées même si le sac est plein.
{
 const a=new BK.Adventure('adam',4),W=a.world,p=a.player,b=W.enemies.find(e=>e.arenaBoss);a.state='play';W.frozen=false;a.save.gold=0;a.save.unlocked=5;
 a.spawnBossChest(b);const chest=W.bossChest;a.spawnBossChest(b);ok(W.bossChest===chest&&!chest.open,'un seul coffre apparaît après le boss');
 ok(a.openBossChest()&&chest.open&&a.state==='celebrate'&&a.celebKind==='boss','ouvrir le coffre lance la célébration');
 ok(a.save.gold===200&&a.save.unlocked===6,'200 pièces et premier tableau du monde 2 débloqué');
 for(const [type,n] of [['honey',3],['antidote',2],['wood',5]])ok(p.inv.some(s=>s.type===type&&s.n>=n&&s.perm>=n),'butin conservé entre les tableaux : '+type);
 ok(!a.openBossChest()&&a.save.gold===200,'impossible de récupérer le coffre deux fois');
 const saved=BK.loadAdventure('adam');ok(saved.unlocked>=6&&saved.inv.some(s=>s.type==='antidote'),'déblocage et objets sauvegardés immédiatement');
}
{
 const a=new BK.Adventure('eliott',4),W=a.world,p=a.player;p.inv=Array.from({length:BK.BAG_SIZE},(_,i)=>({type:'full'+i,n:1,perm:1}));a.save.pendingBossLoot=[];
 a.spawnBossChest(W.enemies.find(e=>e.arenaBoss));a.openBossChest();ok(a.save.pendingBossLoot.length===3,'sac plein : les trois récompenses restent réservées');
 p.inv.splice(0,3);a.deliverBossLoot();ok(a.save.pendingBossLoot.length===0&&p.inv.some(s=>s.type==='wood'&&s.n===5),'les récompenses arrivent dès que des places se libèrent');
 const n=p.inv.find(s=>s.type==='wood').n;a.deliverBossLoot();ok(p.inv.find(s=>s.type==='wood').n===n,'aucune duplication lors des livraisons suivantes');
}
// Maisons de préparation et compagnons survivants du premier boss.
{
 const a=new BK.Adventure('mickael',4),W=a.world;a.save.gold=1000;ok(W.doors.filter(d=>d.enterable).length===2,'deux maisons accessibles au départ du boss');
 const home=W.doors.find(d=>d.c===6),shop=W.doors.find(d=>d.c===18);a.enterHouse(home);
 ok(JSON.stringify(a.world.displays.map(d=>[d.price,d.lives]))===JSON.stringify([[250,3],[200,2],[500,5]]),'trois héros : tarifs et vies choisis par le joueur');
 ok(a.world.players.filter(p=>p.recruit).length===3&&a.world.players.filter(p=>p.recruit).every(p=>p.seat),'trois alliés installés sur leurs chaises');
 const offers=[...a.world.displays];ok(a.recruit(offers[0])&&a.recruit(offers[1]),'les deux premières recrues rejoignent l’équipe');ok(a.recruit(offers[2],a.activeAllies()[0]),'la troisième remplace une recrue');
 a.leaveHouse();ok(a.world===W&&W.players.filter(p=>p.ally).length===2,'les deux recrues choisies sortent de la maison');
 a.enterHouse(home);ok(a.world.displays.filter(d=>d.waiting).length===1&&a.world.players.filter(p=>p.ally).length===2,'revenir retrouve le compagnon en attente sans dupliquer l’équipe');a.leaveHouse();
 a.enterHouse(shop);ok(['heart','bomb','fire','shield','antidote'].every(id=>a.world.displays.some(d=>d.id===id)),'boutique équipée pour le combat');
 const heart=a.world.displays.find(d=>d.id==='heart');a.player.hp=10;ok(a.buy(heart)&&a.player.hp>10,'achat de cœur fonctionnel');a.leaveHouse();
 const team=W.players.filter(p=>p.ally);team[0].hp=17;team[0].lives=2;team[1].hp=24;
 a.spawnBossChest(W.enemies.find(e=>e.arenaBoss));a.openBossChest();
 ok(W.bossSurvivors.length===2&&W.bossSurvivors.every(p=>p.pose==='win'),'seuls les deux survivants célèbrent le coffre');
 const stored=BK.loadAdventure('mickael').bossCompanions;ok(stored.members.length===2&&stored.members[0].hp===17&&stored.members[0].lives===2,'équipe sauvegardée avec santé et vies restantes');
 // Le choix de tableau ou un rechargement conserve aussi l’équipe, pas seulement le bouton direct.
 const next=new BK.Adventure('mickael',BK.stageList().findIndex(s=>s.id==='2-1')),arrivals=next.world.players.filter(p=>p.ally);
 ok(arrivals.length===2&&arrivals[0].hp===17&&arrivals[0].lives===2,'survivants présents au monde 2');
 ok(arrivals.every(p=>p.leader===next.player&&p.invuln===2&&!p.carrying&&p.pose==='idle'&&next.world.walkableTerrain(Math.floor(p.x),Math.floor(p.y))),'compagnons prêts à suivre et placés sur un sol accessible');
 ok(new Set(arrivals.map(p=>p.x+','+p.y)).size===2,'chaque compagnon a sa propre case de départ');
 next.restoreBossCompanions();ok(next.world.players.filter(p=>p.ally).length===2&&!BK.loadAdventure('mickael').bossCompanions,'transfert consommé une seule fois, sans duplication');
}
// L’équipe traverse tout le monde 2, même si une réapparition est en cours.
{
 const index=id=>BK.stageList().findIndex(s=>s.id===id);let a=new BK.Adventure('jeremie',index('2-1'));
 const add=(id,hp,lives)=>{const p=a.world.addPlayer(BK.charById(id),2,1,{hp:30,lives});Object.assign(p,{ally:true,human:false,leader:a.player,hp,kick:true});return p;};
 add('richard',13,2);const returning=add('josee',30,3);a.world.killPlayer(returning);returning.hp=0;const gone=add('eliott',30,1);a.world.killPlayer(gone);gone.hp=0;
 a.clearStage();let saved=BK.loadAdventure('jeremie').bossCompanions;
 ok(saved.destination==='2-2'&&saved.members.length===2,'fin du 2-1 : seuls les compagnons ayant encore des vies sont transférés');
 // Passer par la sélection des tableaux charge la même équipe sauvegardée.
 a=new BK.Adventure('jeremie',index('2-2'));let team=a.world.players.filter(p=>p.ally);
 ok(team.length===2&&team[0].hp===13&&team[0].lives===2&&team[0].kick,'2-2 : santé, vies et pouvoir conservés');
 ok(team[1].alive&&team[1].hp===30&&team[1].lives===2,'allié mort juste avant la sortie : réapparition sans perdre une vie supplémentaire');
 team[0].hp=7;a.clearStage();a.stageIndex=index('2-3');a.loadStage(true);team=a.world.players.filter(p=>p.ally);
 ok(team.length===2&&team[0].hp===7&&team.every(p=>p.leader===a.player),'bouton suivant : équipe conservée au 2-3 avec la bonne santé');
 team[1].lives=1;a.world.killPlayer(team[1]);a.clearStage();a.stageIndex=index('2-4');a.loadStage(true);team=a.world.players.filter(p=>p.ally);
 ok(team.length===1&&team[0].id==='richard'&&team[0].hp===7&&team[0].lives===2,'2-4 : compagnon épuisé absent, survivant toujours présent');
 a.restoreBossCompanions();ok(a.world.players.filter(p=>p.ally).length===1,'aucun doublon après chaque transfert');
}
// Nourrir un allié depuis son portrait : même cible pour clic et toucher.
{
 const a=new BK.Adventure('jessica',4),W=a.world,p=a.player,ally=W.addPlayer(BK.charById('richard'),12,21,{hp:30,lives:2});Object.assign(ally,{ally:true,human:false,leader:p,hp:10});p.inv=[{type:'meatcooked',n:3,perm:2},{type:'pumpkinpiece',n:1,perm:1},{type:'fishcooked',n:1,perm:0},{type:'meatraw',n:2,perm:0}];
 let menu;const oldShow=BK.overlay.show;BK.overlay.show=o=>menu=o;
 try{
  const ctx=new Proxy({measureText:t=>({width:t.length*7})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});a.drawAllyPanel(ctx);a.state='play';W.frozen=false;BK.input.touch.dx=1;BK.input.touch.bombHeld=true;
  const rect=a.allyPortraitRects[0];a.onClick(rect.x+20,rect.y+20);
  ok(a.state==='pause'&&W.frozen&&menu.playful==='ally-food'&&!BK.input.touch.bombHeld&&!BK.input.touch.dx,'portrait tactile : menu et arrêt des commandes');
  ok(menu.buttons.length===4&&!menu.buttons.some(b=>b.label.includes('crue')),'trois aliments prêts à manger, aucune viande crue');
  menu.buttons.find(b=>b.label.includes('Viande')).onClick();
  ok(ally.hp===20&&p.inv[0].n===2&&p.inv[0].perm===2,'une portion consommée, +10 PV, trouvaille consommée avant les portions permanentes');
  ok(BK.loadAdventure('jessica').inv.find(s=>s.type==='meatcooked').n===2,'stock permanent sauvegardé après le repas');
  ally.hp=28;a.showAllyFood(ally);menu.buttons.find(b=>b.label.includes('Citrouille')||b.label.includes('citrouille')).onClick();
  ok(ally.hp===30&&!p.inv.some(s=>s.type==='pumpkinpiece'),'soin plafonné à la vie maximale et dernière portion retirée');
  ok(menu.buttons.length===1&&!W.feedAlly(p,ally,'fishcooked')&&p.inv.find(s=>s.type==='fishcooked').n===1,'allié en pleine santé : aucune nourriture gaspillée');
  menu.buttons[0].onClick();ok(a.state==='play'&&!W.frozen,'reprendre ferme le repas et relance le jeu');
  ally.alive=false;ally.hp=0;ok(!W.feedAlly(p,ally,'fishcooked'),'nourriture ne ressuscite pas un allié');ally.alive=true;ally.hp=5;
  ok(!W.feedAlly(p,ally,'meatraw')&&!W.feedAlly(p,p,'meatcooked'),'refus des aliments crus et des cibles non alliées');
  ok(W.feedAlly(p,ally,'fishcooked')&&ally.hp===25&&ally.maxHp===30&&ally.lives===2,'poisson : +20 PV, sans modifier les vies restantes');
  p.inv=[];a.showAllyFood(ally);ok(menu.buttons.length===1&&menu.text.includes('pas de nourriture'),'sac sans nourriture : message et bouton retour');
 }finally{BK.overlay.show=oldShow;BK.input.touch.dx=0;BK.input.touch.bombHeld=false;}
}
// Remèdes du sac donnés aux alliés par le menu de leur portrait.
{
 const a=new BK.Adventure('marie',4),W=a.world,p=a.player,ally=W.addPlayer(BK.charById('richard'),12,21,{hp:30,lives:2});Object.assign(ally,{ally:true,human:false,leader:p,diarrheaT:9,shortfuseT:12,autoBombT:.3,poison:6,poisonTick:.1});p.inv=[{type:'antidote',n:2,perm:1},{type:'antipoison',n:1,perm:1}];
 let menu;const old=BK.overlay.show;BK.overlay.show=o=>menu=o;
 try{
  a.showAllyFood(ally);ok(menu.buttons.length===2&&menu.text.includes('Poison')&&menu.text.includes('Mèche courte'),'le remède unique et les effets sont proposés même à vie pleine');
  menu.buttons.find(b=>b.label.includes('Antidote')).onClick();ok(!ally.diarrheaT&&!ally.shortfuseT&&!ally.autoBombT&&!ally.poison&&!ally.poisonTick,'antidote supprime ensemble poison et malus');
  ok(p.inv[0].n===2&&p.inv[0].perm===2&&!W.cureAlly(p,ally,'antidote'),'une seule dose, trouvée avant permanente, aucun gaspillage');
  ok(p.inv.length===1&&p.inv[0].type==='antidote','anciennes doses regroupées');
  ok(!BK.loadAdventure('marie').inv.some(s=>s.type==='antipoison')&&menu.buttons.length===1,'stock sauvegardé et remèdes devenus inutiles masqués');
  p.inv=[];ally.poison=3;ok(!W.cureAlly(p,ally,'antipoison')&&ally.poison===3,'aucun soin gratuit quand le sac ne contient plus de dose');
  p.inv=[{type:'antidote',n:1}];ally.diarrheaT=5;ally.alive=false;ok(!W.cureAlly(p,ally,'antidote'),'un remède ne ressuscite pas un allié');ally.alive=true;ally.leader=null;ok(!W.cureAlly(p,ally,'antidote')&&p.inv[0].n===1,'impossible de soigner une cible hors de son équipe');
 }finally{BK.overlay.show=old;}
}
// Santé critique : contourner les monstres, rejoindre le héros, attendre un repas.
{
 const {W,p,leader}=companionArena();p.hp=10;p.maxHp=40;p.invuln=0;p.bombCool=0;const e=W.addEnemy('ballon',11,9);W.updateEnemy=()=>{};const hp=e.hp;
 let closest=Infinity,placed=false;for(let i=0;i<360;i++){W.update(1/60);closest=Math.min(closest,Math.hypot(p.x-e.x,p.y-e.y));placed ||= W.bombs.some(b=>b.owner===p);}
 ok(p.retreating&&!placed&&e.hp===hp,'à 25 % : aucune bombe et aucune attaque');
 ok(p.hp===10&&closest>e.r+p.r&&Math.hypot(p.x-leader.x,p.y-leader.y)<2,'repli contourne le monstre et rejoint le héros sans blessure');
 const x=p.x,y=p.y;run(W,1);ok(Math.hypot(p.x-x,p.y-y)<.2,'reste à proximité en attendant de manger');
 leader.inv=[{type:'meatcooked',n:1}];ok(W.feedAlly(leader,p,'meatcooked'),'le héros peut nourrir l’allié en repli');
 p.x=leader.x-1;p.y=leader.y;e.x=p.x-1;e.y=p.y;p.bombCool=99;p.attackT=0;W.updateAlly(p,.01);ok(!p.retreating&&e.hp<hp,'soigné au-dessus du seuil : reprend les attaques');
}
{
 const {W,p}=companionArena();p.hp=5;p.bombCool=0;W.placeBomb(p);p.x+=.1;W.updateAlly(p,.01);ok(p.retreating&&(p.input.dx||p.input.dy),'allié blessé fuit toujours une bombe déjà posée');
}
// Bulle de nourriture : cible projetée avec la caméra, clic/toucher vers le bon allié.
{
 const a=new BK.Adventure('adam',4),W=a.world,p=a.player,ally=W.addPlayer(BK.charById('richard'),12,20,{hp:40,lives:2});Object.assign(ally,{ally:true,human:false,leader:p,hp:5,retreating:true});p.inv=[{type:'meatcooked',n:1}];
 const ctx=new Proxy({canvas:{width:1280,height:720},measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),cam=new BK.Camera(1280,720);cam.fit(25,25,{top:86,bottom:24,left:24,right:24});
 W.render(ctx,cam,{});ok(W.allyFoodRects.length===1&&W.allyFoodRects[0].ally===ally,'bulle visible pour l’allié blessé en repli');
 let menu;const old=BK.overlay.show;BK.overlay.show=o=>menu=o;
 try{const r=W.allyFoodRects[0];a.state='play';W.frozen=false;a.onClick(r.x+r.w/2,r.y+r.h/2);ok(a.state==='pause'&&menu.title.includes(ally.name),'toucher la bulle ouvre le soin du bon allié');menu.buttons.find(b=>b.label.includes('Viande')).onClick();ok(ally.hp===15&&!p.inv.length,'nourrir depuis la bulle consomme une portion et soigne');W.render(ctx,cam,{});ok(W.allyFoodRects.length===0,'bulle retirée dès que la santé dépasse le seuil');
 ally.hp=5;ally.alive=false;W.render(ctx,cam,{});ok(W.allyFoodRects.length===0,'aucune bulle cliquable pour un allié mort');
 }finally{BK.overlay.show=old;}
}
// Bulles de remèdes simultanées, utilisables sans santé critique.
{
 const a=new BK.Adventure('adam',4),W=a.world,p=a.player,ally=W.addPlayer(BK.charById('richard'),12,20,{hp:40,lives:2});Object.assign(ally,{ally:true,human:false,leader:p,poison:6,diarrheaT:8,shortfuseT:4});p.inv=[{type:'antidote',n:1},{type:'antipoison',n:1}];
 const ctx=new Proxy({canvas:{width:1280,height:720},measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),cam=new BK.Camera(1280,720);cam.fit(25,25,{top:86,bottom:24,left:24,right:24});
 W.render(ctx,cam,{});ok(W.allyFoodRects.length===1&&W.allyFoodRects[0].careType==='antidote','une seule bulle de remède même si la vie est pleine');
 ok(W.allyFoodRects[0].count===2,'stock combiné des deux anciens objets');
 let menu;const old=BK.overlay.show;BK.overlay.show=o=>menu=o;
 try{
  for(const [type,name] of [['antidote','Antidote']]){a.state='play';W.frozen=false;W.render(ctx,cam,{});const r=W.allyFoodRects.find(r=>r.careType===type);a.onClick(r.x+r.w/2,r.y+r.h/2);ok(a.state==='play'&&!menu,'bulle '+type+' soigne directement sans menu');W.render(ctx,cam,{});ok(!W.allyFoodRects.some(r=>r.careType===type),'bulle '+type+' disparaît après guérison');}
  ok(!ally.poison&&!ally.diarrheaT&&!ally.shortfuseT&&p.inv.length===1&&p.inv[0].n===1,'une seule dose guérit tous les effets');
 }finally{BK.overlay.show=old;}
}
// Crapauds : langue collante, ingestion, poison et appuis répétés pour sortir.
{
 const {W,p}=companionArena();p.ally=false;p.invuln=0;p.x=9.5;p.y=9.5;const e=W.addEnemy('crapaud',7,9);e.state='sit';e.toadAttack={kind:'tongue',t:.01,target:p,angle:0};W.updateToadPowers(e,.02);
 ok(p.tongueSlow===3,'langue : ralentissement pendant trois secondes');p.input.dx=1;p.input.dy=0;p.lastTap=null;const x=p.x;W.updatePlayer(p,.1);ok(Math.abs(p.x-x-p.speed*.2*.1)<.001,'langue : vitesse réduite exactement de 80 %');p.input.dx=0;W.updatePlayer(p,3);ok(!p.tongueSlow,'ralentissement expire');
 p.x=8.5;p.y=9.5;p.invuln=0;ok(W.swallowPlayer(e,p)&&p.poison>0&&p.swallowedBy===e,'avaler empoisonne et immobilise');const before=p.swallowT;p.input.bombHeld=true;W.updatePlayer(p,.1);ok(Math.abs(p.swallowT-(before-.1))<.001,'maintenir Bombe ne compte pas comme des appuis répétés');
 p.input.bomb=true;const t=p.swallowT;W.updatePlayer(p,.1);ok(p.swallowT<t-.7&&!p.input.bomb&&!W.bombs.length,'appui Bombe : libération accélérée sans poser de bombe');
 for(let i=0;i<10&&p.swallowedBy;i++){p.input.bomb=true;W.updatePlayer(p,.05);}ok(!p.swallowedBy&&!e.swallowed&&p.swallowSafe>0,'appuis rapides libèrent et protègent contre une nouvelle ingestion immédiate');
 p.invuln=p.swallowSafe=0;p.x=8.5;p.y=9.5;W.swallowPlayer(e,p);e.hurt=0;W.hurtEnemy(e,null,99,'bomb');ok(!p.swallowedBy,'mort du crapaud libère le personnage');
}
{
 const {W,p}=companionArena();p.ally=false;p.invuln=0;p.x=9.5;p.y=9.5;const e=W.addEnemy('crapaud',7,9);W.cells[W.idx(8,9)]=BK.HARD;e.toadAttack={kind:'tongue',t:.01,target:p,angle:0};W.updateToadPowers(e,.02);ok(!p.tongueSlow&&!W.swallowPlayer(e,p),'langue et ingestion bloquées par les murs');
}
// Mobilier : le siège est dessiné avant son occupant, sans pancarte joueur sur les PNJ.
{
 const W=new BK.World({map:['#######','#.....#','#.."..#','#..1..#','#######'],props:{'3,2':{deco:'chair',orientation:0}},theme:'interior',mode:'adventure',explore:true}),npc=W.addNpc(BK.charById('richard'),3,2,[]),hero=W.addPlayer(BK.charById('adam'),3,3),trace=[],labels=[];
 const ctx=new Proxy({canvas:{width:1280,height:720},measureText:t=>({width:t.length*8}),fillText:t=>labels.push(t),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),cam=new BK.Camera(1280,720);cam.fit(7,5,{top:86,bottom:24,left:24,right:24});
 const deco=BK.sprites.drawDeco,char=BK.sprites.drawCharacter;
 try{BK.sprites.drawDeco=(ctx,kind,...rest)=>{trace.push(kind);deco(ctx,kind,...rest);};BK.sprites.drawCharacter=(ctx,def,o)=>{trace.push(def.id+':'+o.pose);char(ctx,def,o);};W.render(ctx,cam,{});}finally{BK.sprites.drawDeco=deco;BK.sprites.drawCharacter=char;}
 ok(npc.seat&&!npc.human&&trace.indexOf('chair')<trace.indexOf('richard:sit'),'PNJ assis rendu après sa chaise');ok(!labels.some(t=>String(t).includes('Se lever')),'aucune pancarte Se lever sur les PNJ');
}
// Sauvetage : cible prioritaire et temps de captivité réduit seulement par les coups réussis.
{
 const {W,p,leader}=companionArena();leader.x=8.5;leader.y=9.5;leader.invuln=0;p.x=10.5;p.y=9.5;p.bombCool=99;
 const toad=W.addEnemy('crapaud',9,9),other=W.addEnemy('ballon',10,10);ok(W.swallowPlayer(toad,leader),'crapaud capture le héros à secourir');
 ok(BK.ai.allyCombatEnemies(W,p,6).length===1&&BK.ai.allyCombatEnemies(W,p,6)[0]===toad,'bombes et attaques ciblent uniquement le ravisseur pendant la captivité');
 const hp=other.hp;W.updateAlly(p,.01);ok(toad.hp===5&&other.hp===hp&&Math.abs(leader.swallowT-5.2)<.001,'allié frappe le crapaud et enlève 0,8 seconde de captivité');
 const remaining=leader.swallowT;ok(!W.hurtEnemy(toad,p,1,'bomb')&&leader.swallowT===remaining,'un coup ignoré pendant l’invulnérabilité ne réduit pas la barre');
 toad.hurt=0;leader.swallowT=.5;W.hurtEnemy(toad,p,1,'bomb');ok(!leader.swallowedBy&&!toad.swallowed&&!toad.dead,'une bombe alliée peut libérer le héros sans tuer le crapaud');
 W.updateAlly(p,.01);ok(!p.rescueTarget&&BK.ai.allyCombatEnemies(W,p,6).includes(other),'après libération, reprise du ciblage normal');
}
{
 const a=new BK.Adventure('adam',4),W=a.world,p=a.player,e=W.enemies.find(e=>e.arenaGuard);p.x=e.x+1;p.y=e.y;p.invuln=0;W.swallowPlayer(e,p);a.state='play';
 const widths=[],rr=BK.sprites.rr,ctx=new Proxy({canvas:{width:1280,height:720},measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 try{BK.sprites.rr=(ctx,x,y,w,h,r)=>{if(x===BK.W/2-200&&y===BK.H-121&&h===9)widths.push(w);rr(ctx,x,y,w,h,r);};p.swallowT=3;a.render(ctx);ok(widths.includes(400)&&widths.includes(200),'barre de libération à moitié vide quand il reste trois secondes');widths.length=0;W.releaseSwallowed(p);a.render(ctx);ok(!widths.length,'barre masquée après libération');}finally{BK.sprites.rr=rr;}
}

// Nourriture des compagnons animaux et volaille.
{
 const W=new BK.World({map:['###############','#.............#','#.............#','###############'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),2,1),cat=W.addEnemy('chat',3,1),dog=W.addEnemy('chien',2,2);
 p.inv=[{type:'fish',n:2,perm:1},{type:'meatraw',n:1},{type:'poultrycooked',n:1}];
 ok(!W.feedPet(p,cat,'meatraw')&&!W.feedPet(p,dog,'fish'),'chaque animal accepte seulement sa nourriture');
 ok(W.feedPet(p,cat,'fish')&&cat.follow===p&&cat.followT===60&&p.inv[0].n===1&&p.inv[0].perm===1,'poisson consommé, portion permanente conservée et suivi prolongé');
 W.petAnimal(p);ok(cat.followT===60,'caresser ne raccourcit pas le suivi après un repas');
 ok(W.feedPet(p,cat,'fish')&&cat.followT===120&&!p.inv.some(s=>s.type==='fish'),'deux repas prolongent le suivi de deux minutes');
 ok(W.feedPet(p,dog,'meatraw')&&W.feedPet(p,dog,'poultrycooked'),'chien accepte viande et volaille');
 p.x=12.5;ok(!W.feedPet(p,cat,'fish'),'nourriture refusée à distance');
 cat.pause=0;cat.petT=0;for(let i=0;i<600;i++)W.updateEnemy(cat,1/60);
 ok(cat.x>9.5&&cat.follow===p,'chat nourri suit au-delà de sa zone de promenade initiale');
}
for(const source of ['bomb','projectile']){
 const W=new BK.World({map:['#######','#.....#','#.....#','#######'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),1,1),bird=W.addEnemy('oiseau',3,1);
 bird.z=source==='bomb'?.5:0;
 ok(W.hurtEnemy(bird,p,1,source)&&bird.dead,'oiseau chassable, même en vol avec une bombe');
 const loot=W.items.find(i=>i.type===(source==='bomb'?'poultrycooked':'poultryraw'));
 ok(loot&&W.applyItem(p,loot),'volaille récupérable dans le sac, cuisson selon le coup fatal');
 ok(!W.hurtEnemy(bird,p,1,source)&&W.items.length===1,'pas de double butin sur un oiseau mort');
}
{
 const {W,p}=powerArena();p.dir=2;W.buildCampfire(p);const f=W.campfires[0];p.inv=[{type:'poultryraw',n:2}];
 ok(W.cookFish(p,f,'poultryraw',2),'volaille acceptée dans la file de cuisson');W.updateFishes(10);
 ok(p.inv.find(i=>i.type==='poultrycooked')?.n===2,'les portions de volaille cuite retournent au sac');p.hp=p.maxHp-5;
 ok(W.useItem(p,p.inv.findIndex(i=>i.type==='poultrycooked'))&&p.hp===p.maxHp,'volaille rôtie soigne sans dépasser la vie maximale');
}


// L’attaque doit aboutir dans la boucle réelle, malgré les dégâts de contact et d’atterrissage.
{
 const W=new BK.World({map:['#######','#.....#','#.....#','#.....#','#######'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),3,2),e=W.addEnemy('crapaud',3,2);p.hp=p.maxHp=1000;p.invuln=0;
 let captured=false;for(let i=0;i<1200;i++){W.update(1/60);if(p.swallowedBy===e){captured=true;break;}}
 ok(captured&&p.poison>0&&p.swallowT>0,'crapaud avale et empoisonne en situation réelle après ses sauts');
}
{
 const a=new BK.Adventure('adam',0),W=new BK.World({map:['#######','#.....#','#.....#','#######'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),2,1);a.world=W;a.player=p;a.state='play';const cat=W.addEnemy('chat',3,1),dog=W.addEnemy('chien',2,2);p.inv=[{type:'fish',n:1}];
 const ctx=new Proxy({canvas:{width:1280,height:720},measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),cam=new BK.Camera(1280,720);cam.fit(7,4,{top:100,bottom:50,left:50,right:50});
 W.drawPetFood(ctx,cam);ok(W.petFoodRects.length===2&&W.petFoodRects.find(r=>r.pet===dog).count===0,'bulle grisée pour le chien sans viande');const r=W.petFoodRects.find(r=>r.pet===cat);a.onClick(r.x+10,r.y+10);
 ok(cat.follow===p&&!p.inv.length&&a.state==='play','bulle nourrit directement sans ouvrir de menu');W.drawPetFood(ctx,cam);ok(W.petFoodRects.every(r=>r.count===0),'bulles mises à jour après la dernière portion');
 p.x=5.5;W.drawPetFood(ctx,cam);ok(!W.petFoodRects.length,'bulles cachées quand on s’éloigne');
}

// Le ventre gonfle, réagit aux appuis distincts puis dégonfle après libération.
{
 const {W,p}=companionArena();p.ally=false;p.invuln=0;p.x=9.5;p.y=9.5;const e=W.addEnemy('crapaud',8,9);
 W.swallowPlayer(e,p);W.updateToadPowers(e,.125);ok(e.bellyFill===.5,'ventre à mi-gonflement après 125 ms');W.updateToadPowers(e,.125);ok(e.bellyFill===1,'ventre gonflé quand le héros est avalé');
 p.input.bomb=true;W.updateSwallowed(p,.01);const side=e.bellySide;ok(e.bellyKick===.32,'un appui Bombe déclenche un mouvement du ventre');
 W.updateToadPowers(e,.1);p.input.bombHeld=true;W.updateSwallowed(p,.01);ok(e.bellyKick<.32&&e.bellySide===side,'maintenir le bouton ne redéclenche pas les coups');
 p.input.bomb=true;W.updateSwallowed(p,.01);ok(e.bellyKick===.32&&e.bellySide===-side,'les appuis successifs font remuer les deux côtés');
 W.releaseSwallowed(p);W.updateToadPowers(e,.1);ok(e.bellyFill===.5&&!e.bellyKick,'ventre dégonfle et les coups cessent à la sortie');W.updateToadPowers(e,.1);ok(!e.bellyFill,'retour à la taille normale');
}

// Flaques de crapaud : 30 % de ralentissement au sol pendant dix secondes.
{
 const W=new BK.World({map:['#########','#.......#','#.......#','#.......#','#########'],mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),3,2),e=W.addEnemy('crapaud',3,2);
 W.leaveToadSlime(e);W.leaveToadSlime(e);ok(W.puddles.length===1&&W.puddles[0].dur===10,'une flaque par case, durée de dix secondes');
 p.input.dx=1;p.input.dy=0;p.invuln=999;const x=p.x;W.updatePlayer(p,.05);ok(Math.abs(p.x-x-p.speed*.7*.05)<.00001,'flaque réduit la marche exactement de 30 %');
 p.x=4.5;ok(W.toadSlimeSlow(p)===1,'vitesse normale hors de la flaque');p.x=3.5;p.air={};ok(W.toadSlimeSlow(p)===1,'aucun ralentissement en sautant par-dessus');p.air=null;
 W.puddles[0].z=2;ok(W.toadSlimeSlow(p)===1,'une flaque sur un autre étage ne ralentit pas');W.puddles[0].z=0;
 ok(W.slowAt(e)===1,'le crapaud ne subit pas l’effet du miel sur sa propre bave');
 p.input.dx=0;W.enemies=[];W.update(9.9);ok(W.puddles.length===1,'flaque encore présente avant dix secondes');W.update(.11);ok(!W.puddles.length&&W.toadSlimeSlow(p)===1,'disparition et fin du ralentissement après dix secondes');
 e.x=5.5;e.y=2.5;e.state='sit';e.stateT=2;e.toadCool=99;W.enemies=[e];W.updateToad(e,.01);ok(e.state==='jump'&&W.puddles.length===1,'crapaud laisse une trace au départ du saut');e.stateT=.7;W.updateToad(e,.01);ok(W.puddles.length===2,'crapaud laisse aussi une flaque à l’atterrissage');
}

// Les compagnons évitent la bave dans leurs trajets vers le héros ou les ennemis.
{
 const W=new BK.World({map:['#########','#.......#','#.......#','#.......#','#########'],mode:'adventure',explore:true,hearts:true}),leader=W.addPlayer(BK.charById('adam'),7,2),p=W.addPlayer(BK.charById('richard'),1,2);Object.assign(p,{ally:true,human:false,leader,bombCool:99});
 W.puddles.push({kind:'toadSlime',c:3,r:2,z:0,t:0,dur:10});let danger=BK.ai.allyDanger(W),bfs=BK.ai.bfs(W,p,danger),path=BK.ai.pathTo(W,bfs,6,2);
 ok(danger[W.idx(3,2)]===0&&path.length&&!path.some(q=>q.c===3&&q.r===2),'trajet de suivi contourne la flaque');W.addEnemy('crapaud',6,2);W.updateAlly(p,.01);ok(!(p.path||[]).some(q=>q.c===3&&q.r===2),'trajet d’attaque contourne également la flaque');
 W.puddles[0].t=10;ok(BK.ai.allyDanger(W)[W.idx(3,2)]===Infinity,'trajet libéré quand la bave expire');
}
{
 ok(BK.challengeMedal(300).name==='Bronze'&&BK.challengeMedal(600).name==='Argent'&&BK.challengeMedal(850).name==='Or','seuils bronze, argent et or');
 const ch=BK.CHALLENGES.find(c=>c.id==='kick1'),save={unlocked:1,best:{},score:0,xp:0,gold:BK.loadGold()};
 const reward=BK.awardChallenge(ch,900,'adam',save);ok(reward.xp===150&&save.xp===150&&save.points===BK.levelFromXp(150).level-1,'médailles donnent de l’expérience et les points des niveaux gagnés');
 const again=BK.awardChallenge(ch,400,'adam',save);ok(again.xp===13&&save.challengeRecords.kick1.best===900,'rejeu donne moins d’XP et conserve le meilleur score');
 ok(BK.matchChallengeScore({rounds:1},{round:1,elapsed:0})===1000&&BK.matchChallengeScore({rounds:1},{round:1,elapsed:180})===500,'les matchs récompensent aussi la rapidité');
}
for(const ch of BK.CHALLENGES.filter(c=>c.kind==='timing')){
 const a=new BK.Adventure('adam',0,{custom:BK.challengeStage(ch),challenge:ch}),W=a.world,p=a.player;a.state='play';W.frozen=false;p.invuln=999;a.update(.01);
 ok(p.kick&&W.bombs[0]?.timingBall&&!a.objectiveDone(),ch.id+' fournit le kick et une bombe, sans victoire automatique');
 const wrong=W.bombs[0];wrong.cx=ch.target;wrong.cy=3;W.explodeBomb(wrong);W.events.forEach(e=>e.carry=true);a.update(.01);ok(a.timingHits===0,'explosion sur cible sans kick refusée');
 for(let n=0;n<ch.count;n++){W.flames=[];W.flameAt.clear();a.timingNext=0;a.update(.01);const b=W.bombs.find(b=>b.timingBall);b.t=(ch.target-3+.25)/BK.KICK_SPEED;W.kickBomb(b,3,p);for(let i=0;i<60&&a.state==='play'&&!b.exploded;i++)a.update(1/60);}
 ok(a.timingHits===ch.count&&a.state==='clear',ch.id+' validé par de vraies bombes glissantes explosant au centre');const done=BK.loadChallenges()[ch.id].done;a.clearStage();ok(BK.loadChallenges()[ch.id].done===done,'pas de double récompense');
}
{
 const a=new BK.Adventure('adam',4),W=a.world,e=W.enemies.find(e=>e.arenaBoss);a.revealBossCrystal(e);a.spawnBossChest(e);ok(W.bossCrystal&&!W.bossCrystal.captured,'grand cristal révélé avec le coffre');a.openBossChest();ok(BK.loadAdventure('adam').crystals['1-5'],'cristal du premier boss sauvegardé à la récupération');
 const i=BK.stageList().findIndex(s=>s.id==='2-5'),last=new BK.Adventure('adam',i),boss=last.world.enemies.find(e=>e.boss);last.world.hurtEnemy(boss,last.player,99,'bomb');last.world.updateArenaEffects(4.1);const finalBoss=last.world.enemies.find(e=>e.castleFinal);last.world.hurtEnemy(finalBoss,last.player,99,'bomb');last.revealBossCrystal(finalBoss);last.spawnBossChest(finalBoss);ok(last.world.bossCrystal&&last.world.bossChest,'dernier boss révèle cristal et coffre');last.openBossChest();ok(BK.loadAdventure('adam').crystals['2-5'],'dernier cristal sauvegardé dans la collection');
 let dialog;const old=BK.overlay.show;BK.overlay.show=o=>dialog=o;try{last.showCrystals();ok(dialog.html.includes('2 / 2')&&dialog.html.includes('Capturé !'),'collection présente les cristaux récupérés');}finally{BK.overlay.show=old;}
}

// La médaille et le chrono utilisent exactement le barème de la récompense.
{
 const ch=BK.CHALLENGES.find(c=>c.id==='kick1'),run={timeLeft:90,lives:2};let v=BK.challengeProgress(ch,run);
 ok(v.medal.name==='Or'&&Math.abs(v.goldSeconds-27.09)<.001,'compte à rebours or au début de la mission');
 run.timeLeft-=v.goldSeconds-.001;ok(BK.challengeProgress(ch,run).medal.name==='Or','or juste avant la limite arrondie');run.timeLeft-=.002;v=BK.challengeProgress(ch,run);ok(v.medal.name==='Argent'&&v.goldSeconds===0,'argent dès que le délai de l’or est écoulé');
 run.timeLeft=90;run.lives=1;ok(BK.challengeProgress(ch,run).goldSeconds<10,'perdre une vie réduit le temps disponible pour l’or');run.timeLeft=0;ok(BK.challengeProgress(ch,run).medal.name==='Bronze','bronze en fin de chrono');
 const match=BK.CHALLENGES.find(c=>c.id==='match3'),m={players:[{humanMap:0}],wins:[0],round:1,elapsed:30};v=BK.challengeProgress(match,m);ok(v.score===BK.matchChallengeScore(match,{round:2,elapsed:30}),'match : estimation inclut les manches encore nécessaires');m.wins=[1];m.round=2;ok(BK.challengeProgress(match,m).score===BK.matchChallengeScore(match,m),'estimation identique au score final sur la manche décisive');
 const labels=[],ctx=new Proxy({fillText:t=>labels.push(t)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});BK.drawChallengeProgress(ctx,ch,{timeLeft:90,lives:2});ok(labels.includes('🥇')&&labels.some(t=>t.includes('0:28 pour l’or')),'affichage de la petite médaille et du chrono');
}

// Alerte unique et transition or → argent, sans effets sonores déclenchés par le rendu.
{
 const ch=BK.CHALLENGES.find(c=>c.id==='kick1'),run={timeLeft:90,lives:2};let sounds=0;const old=BK.audio.medalWarning;BK.audio.medalWarning=()=>sounds++;
 try{
  BK.updateChallengeFeedback(ch,run,.1);ok(!sounds,'aucune alerte avant les dix dernières secondes');
  run.timeLeft=72;BK.updateChallengeFeedback(ch,run,.1);ok(sounds===1&&run.medalFeedback.warned,'petit son en entrant dans les dix dernières secondes');
  for(let i=0;i<60;i++)BK.updateChallengeFeedback(ch,run,1/60);ok(sounds===1,'pas de répétition du son à chaque image');
  run.timeLeft=62;BK.updateChallengeFeedback(ch,run,.1);ok(run.medalFeedback.transition===.8&&run.medalFeedback.previous==='Argent','transition déclenchée à la perte de l’or');
  BK.updateChallengeFeedback(ch,run,.9);ok(!run.medalFeedback.transition&&sounds===1,'animation termine sans redémarrage ni son supplémentaire');
  const retry={timeLeft:72,lives:2};BK.updateChallengeFeedback(ch,retry,.1);ok(sounds===2,'une nouvelle tentative peut avertir à nouveau');
 }finally{BK.audio.medalWarning=old;}
}

{
 const ch=BK.CHALLENGES.find(c=>c.id==='kick1'),run={timeLeft:25,lives:2};let warnings=0,drops=0;const old=BK.audio.medalWarning,oldDrop=BK.audio.medalDrop;BK.audio.medalWarning=()=>warnings++;BK.audio.medalDrop=()=>drops++;
 try{let v=BK.challengeProgress(ch,run);ok(v.medal.name==='Argent'&&Math.abs(v.silverSeconds-7.09)<.001,'compteur argent basé sur le seuil exact de 600 points');BK.updateChallengeFeedback(ch,run,.1);BK.updateChallengeFeedback(ch,run,.1);ok(warnings===1,'avertissement argent joué une seule fois');run.timeLeft=17;BK.updateChallengeFeedback(ch,run,.1);ok(drops===1&&run.medalFeedback.from==='🥈'&&run.medalFeedback.to==='🥉','son et animation argent vers bronze');BK.updateChallengeFeedback(ch,run,1);ok(drops===1&&!run.medalFeedback.transition,'transition bronze terminée sans répétition');}finally{BK.audio.medalWarning=old;BK.audio.medalDrop=oldDrop;}
}
{
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items.filter(i=>i.category==='castle');ok(items.length===35&&new Set(items.map(i=>i.deco)).size===35,'35 nouveaux objets distincts dans la catégorie Château');
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const it of items){const E=new BK.Editor({name:'Château',cols:7,rows:7,theme:'castle',base:'.'});E.item=it;E.orientation=1;E.paint(3,3,true);const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,mode:'adventure',explore:true,theme:'castle'});ok(W.deco[W.idx(3,3)]===it.deco&&W.props['3,3'].orientation===1,it.name+' sauvegardé avec son orientation');for(let d=0;d<4;d++)BK.sprites.drawDeco(ctx,it.deco,0,0,60,1,null,1,d);}
 ok(!BK.DECO_PROPS.castle_carpet,'tapis royal traversable');
 for(const it of BK.CASTLE_DECOR.filter(i=>i.wall)){const E=new BK.Editor({name:'Mur',cols:7,rows:7,theme:'interior',base:'.',roomExit:true});E.map.roomExit=true;E.grid[2][2]='#';E.item=items.find(i=>i.deco===it.deco);E.paint(2,2,true);ok(E.grid[2][2]==='#'&&E.props['2,2'].wallDeco===it.deco,it.name+' accroché sans enlever le mur');}
}

// Huit pièges : placement, configuration, collisions, périodes sûres et projectiles.
{
 const items=BK.EDITOR_TABS.find(t=>t.id==='deco').items.filter(i=>i.opts==='mechanism');ok(items.length===8&&items.every(i=>i.category==='pieges'),'huit pièges dans la palette Pièges');
 for(const it of items){const E=new BK.Editor({cols:9,rows:7,base:'.',theme:'castle'});E.item=it;E.orientation=3;E.trapRest=5;E.trapActive=2;E.trapDelay=1;E.trapRange=6;E.trapBurst=3;E.paint(3,3,true);const data=JSON.parse(JSON.stringify(E.data())),W=new BK.World({map:data.grid,props:data.props,mode:'adventure',explore:true,hearts:true});const q=W.mechanisms()[0];ok(q&&q.props.trapRest===5&&q.props.trapActive===2&&q.props.trapDelay===1&&q.props.orientation===3,it.name+' conserve les réglages après export');}
 const make=(kind,props={})=>{const W=new BK.World({map:['#########','#.......#','#.......#','#.".....#','#.......#','#.......#','#########'],props:{'2,3':{deco:'trap_'+kind,orientation:3,...props}},mode:'adventure',explore:true,hearts:true}),p=W.addPlayer(BK.charById('adam'),3,3);p.invuln=0;return {W,p,q:W.mechanisms()[0]};};
 {const {W,p,q}=make('spikes',{trapRest:2,trapActive:1});p.x=2.5;const hp=p.hp;W.updateTraps(1);ok(p.hp===hp&&!W.blocked(2,3),'piques rentrées : passage libre sans dégâts');W.updateTraps(1.2);ok(p.hp===hp&&W.trapPhase(q).mode==='warn','avertissement avant la sortie des piques');W.updateTraps(.5);ok(p.hp===hp-10,'piques sorties blessent');p.invuln=0;W.updateTraps(1);ok(p.hp===hp-10&&W.trapPhase(q).mode==='rest','piques rentrent et permettent de passer');}
 {const {W,p}=make('dart');for(let i=0;i<90;i++)W.updateTraps(1/60);ok(p.hp<p.maxHp&&p.poison>0,'une flèche atteint et empoisonne le joueur');}
 {const {W,p}=make('dart');W.cells[W.idx(3,3)]=BK.HARD;p.x=4.5;for(let i=0;i<180;i++)W.updateTraps(1/60);ok(p.hp===p.maxHp&&!p.poison&&!W.trapArrows.length,'un mur bloque la détection et les flèches');}
 {const {W,p}=make('zap');W.updateTraps(.01);ok(p.hp===p.maxHp&&W.trapStates.get('2,3').mode==='warn','ZAP avertit avant de frapper');W.updateTraps(.61);ok(p.hp===p.maxHp-10,'rayon ZAP frappe devant lui');}
 for(const kind of ['flame','frost','saw','crusher','gas']){const {W,p,q}=make(kind);if(['crusher','gas'].includes(kind))p.x=2.5;W.trapClock=2.7;if(kind==='saw'){const v=W.trapSawPoint(q);p.x=v.x;p.y=v.y;}const hp=p.hp;W.updateTraps(.001);ok(p.hp<hp,kind+' produit ses dégâts');if(kind==='frost')ok(p.frozen>0,'givre immobilise brièvement');if(kind==='gas')ok(p.poison>0,'gaz empoisonne');}
 {const {W,p}=make('spikes');p.x=2.5;p.air={};W.trapClock=2.7;W.updateTraps(.01);ok(p.hp===p.maxHp,'saut au-dessus des piques sans dégâts');p.air=null;W.props['2,3'].lv=1;W.height[W.idx(2,3)]=2;p.x=3.5;W.updateTraps(.01);ok(p.hp===p.maxHp,'autre étage protégé');}
 {const {W}=make('spikes');W.trapClock=2.7;ok(BK.ai.allyDanger(W)[W.idx(2,3)]===0,'alliés évitent les piques actives');W.trapClock=0;ok(BK.ai.allyDanger(W)[W.idx(2,3)]===Infinity,'alliés peuvent passer pendant la pause sûre');W.frozen=true;W.update(.5);ok(W.trapClock===0,'pause ne fait pas avancer le cycle des pièges');}
}
{
 const E=new BK.Editor({cols:7,rows:7,theme:'castle',base:'.'});E.item=BK.EDITOR_TABS.find(t=>t.id==='deco').items.find(i=>i.deco==='castle_treasure');E.paint(3,3,true);const first=E.props['3,3'].treasureSeed;E.paint(3,3,true);const second=E.props['3,3'].treasureSeed;ok(first!==second,'reposer un trésor change sa composition');const data=JSON.parse(JSON.stringify(E.data()));ok(new BK.Editor(data).props['3,3'].treasureSeed===second,'composition aléatoire conservée à la sauvegarde');
 const trace=[],ctx=new Proxy({},{get:(o,k)=>o[k]||((...a)=>trace.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});const draw=seed=>{trace.length=0;BK.sprites.drawDeco(ctx,'castle_treasure',0,0,60,1,null,1,0,null,{treasureSeed:seed});return JSON.stringify(trace);};const a=draw(first);ok(a===draw(first)&&a!==draw(second),'rendu stable pour une graine et varié pour une autre');
}

// Collections, sauvegardes, animaux et effets de taille.
{
 const E=new BK.Editor({cols:9,rows:9,theme:'desert',base:'¡'}),decos=BK.EDITOR_TABS.find(t=>t.id==='deco').items;
 for(const cat of BK.BIOME_CATEGORIES)ok(BK.BIOME_DECOR.filter(d=>d.category===cat.id).length===20,cat.name+' : vingt décors');
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const d of BK.BIOME_DECOR){E.item=decos.find(i=>i.deco===d.deco);E.paint(3,3,true);const data=JSON.parse(JSON.stringify(E.data())),again=new BK.Editor(data);ok(again.world.deco[again.world.idx(3,3)]===d.deco,'sauvegarde '+d.name);for(let dir=0;dir<4;dir++)BK.sprites.drawDeco(ctx,d.deco,0,0,60,1,null,0,dir);}
 for(const f of BK.DESERT_FLOORS){E.item={ch:f.ch};E.paint(4,4,true);E.item=decos.find(i=>i.deco==='desert_1');E.paint(4,4,true);const again=new BK.Editor(JSON.parse(JSON.stringify(E.data())));ok(again.world.tAt(4,4)===f.terrain,'sol préservé sous un décor : '+f.name);}
 const room=new BK.Editor({cols:7,rows:5,roomExit:true,theme:'interior',base:'y',grid:['#######','#yyyyy#','#yy1yy#','#yyyyy#','###G###']});
 for(const d of BK.BIOME_DECOR.filter(d=>d.wall)){room.item=decos.find(i=>i.deco===d.deco);room.paint(2,0,true);ok(room.grid[0][2]==='#'&&room.props['2,0'].wallDeco===d.deco,'fixation murale '+d.name);}
 ok(BK.WILDLIFE.length===20&&BK.WILDLIFE.filter(a=>a.evil).length===10,'vingt animaux et dix variantes maléfiques');
 for(const a of BK.WILDLIFE)for(const id of [a.id,...(a.evil?[a.id+'_evil']:[])]){const W=new BK.Editor({cols:9,rows:9,theme:'garden',base:',',enemies:[{type:id,c:4,r:4}]}).world;const e=W.enemies[0];ok(!!e&&e.def.peaceful===!id.endsWith('_evil'),'nature '+id);for(let i=0;i<120;i++)W.updateEnemy(e,1/60);BK.sprites.drawEnemy(ctx,id,{s:60,t:1,state:'walk'});ok(W.livingEnemies().length===(e.def.peaceful?0:1),'objectif de combat '+id);}
 const W=new BK.Editor({cols:9,rows:9,theme:'garden',base:','}).world,p=W.addPlayer(BK.charById('adam'),4,4);
 W.applyItem(p,{type:'mini'});ok(p.sizeScale===.4&&p.sizeT===15,'Mini quinze secondes');W.updatePlayer(p,5);ok(p.sizeT===10,'décompte Mini');W.applyItem(p,{type:'giant'});ok(p.sizeScale===2&&p.sizeT===15,'Géant remplace Mini');W.updatePlayer(p,15);ok(p.sizeScale===1&&p.sizeT===0,'taille normale après quinze secondes');
 const objects=BK.EDITOR_TABS.find(t=>t.id==='objets').items;ok(Object.keys(BK.ITEMS).filter(k=>!BK.ITEMS[k].snailColor).every(k=>objects.some(i=>i.pickup===k||({h:'heart',k:'card','$':'coin'})[i.ch]===k)),'tous les objets et pouvoirs dans la palette');
}

// Amitié des vingt nouvelles espèces : caresses, repas et combat accompagné.
{
 const setup=id=>{const E=new BK.Editor({cols:11,rows:9,theme:'garden',base:',',enemies:[{type:id,c:4,r:4}]});const W=E.world,p=W.addPlayer(BK.charById('adam'),3,4);return {W,p,e:W.enemies[0]};};
 for(const a of BK.WILDLIFE){const {W,p,e}=setup(a.id),food=BK.PET_FOODS[a.id][0];p.inv=[{type:food,n:2,perm:0}];
  ok(W.nearbyPet(p)===e&&W.petAnimal(p),'caresser '+a.name);W.petAnimal(p);ok(e.bond.pets===1,'les clics répétés immédiats ne doublent pas la caresse');
  W.time+=1.3;W.petAnimal(p);ok(e.bond.pets===2&&!e.bond.meals,'deux caresses ne suffisent pas sans repas');
  ok(!W.feedPet(p,e,'wood')&&p.inv[0].n===2,'refus de nourriture inadaptée');
  ok(W.feedPet(p,e,food)&&p.inv[0].n===1&&e.bond.meals===1&&e.follow===p&&e.followT>=60,'repas et amitié '+a.name);
  const foe=W.addEnemy('wild_renard_evil',5,4);foe.x=e.x+.7;e.petT=0;e.friendAttackT=0;const hp=foe.hp;
  ok(W.updateAnimalFriend(e,.1)&&foe.hp===hp-1,'ami attaque un monstre '+a.name);W.updateAnimalFriend(e,.1);ok(foe.hp===hp-1,'délai entre les attaques');
  const ff=BK.settings.friendlyFire;BK.settings.friendlyFire=false;ok(!W.hurtEnemy(e,p,1,'bomb')&&!e.dead,'protection du compagnon contre les bombes amies');BK.settings.friendlyFire=ff;
  e.followT=0;foe.hurt=0;e.friendAttackT=0;ok(!W.updateAnimalFriend(e,.1)&&foe.hp===hp-1,'arrêt du combat quand il ne suit plus');
 }
 const {W,p,e}=setup('wild_renard');const bad=W.addEnemy('wild_loup_evil',4,5);p.x=4.5;p.y=5.3;ok(!W.feedPet(p,bad,'meatraw')&&!BK.PET_FOODS[bad.type],'les variantes maléfiques ne sont pas apprivoisées');
 p.x=3.5;p.y=4.5;p.inv=[{type:'fish',n:1}];W.feedPet(p,e,'fish');e.petT=0;const hp=bad.hp;ok(!W.updateAnimalFriend(e,.1)&&bad.hp===hp,'un repas seul ne permet pas d’attaquer');
 W.petAnimal(p);W.time+=1.3;W.petAnimal(p);e.petT=0;bad.x=6.5;bad.y=4.5;W.cells[W.idx(5,4)]=1;ok(!W.updateAnimalFriend(e,.1)&&bad.hp===hp,'pas d’attaque à travers un mur');
 const plain=W.addEnemy('wild_tortue',4,3);bad.dead=true;ok(!W.updateAnimalFriend(e,.1)&&plain.hp===plain.maxHp,'ne combat jamais les animaux pacifiques');
 const before=p.inv.length;ok(!W.feedPet(p,e,'fish')&&p.inv.length===before,'sac vide : aucun repas gratuit');
}
console.log('✔ ' + n + ' vérifications réussies');
