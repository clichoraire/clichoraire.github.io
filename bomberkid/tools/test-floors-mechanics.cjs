// Sols à mécanique : les 20 nouvelles tuiles (roche volcanique … sables mouvants).
const assert = require('node:assert/strict'), BK = require('./headless');
const F = BK.FLOOR_ID_CH, adam = BK.charById('adam');
const mk = (map, props = {}) => new BK.World({ map, props, theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
const run = (W, s) => { for (let i = 0; i < Math.round(s * 60); i++) W.update(1 / 60); };
const hero = (W, c, r) => W.addPlayer(adam, c, r, { hp: 40 });
const flame = (W, c, r) => W.flameAt.has(W.idx(c, r));
const bombAtFeet = (W, p, fire) => { p.fire = fire; assert(W.placeBomb(p)); return W.bombs[W.bombs.length - 1]; };
const ctx = new Proxy({}, { get: (o, k) => k in o ? o[k] : k === 'measureText' ? () => ({ width: 10 }) : /create.*Gradient/.test(k) ? () => ({ addColorStop() { } }) : k === 'canvas' ? { width: 1280, height: 720 } : () => { }, set: (o, k, v) => (o[k] = v, true) });
const realRandom = Math.random;
{   // les 20 tuiles existent, avec leur caractère et leur numéro de terrain
  const ids = ['volcanic', 'coral', 'vines', 'tallgrass', 'slate', 'bronze', 'redbrick', 'linoleum', 'emerald', 'logs', 'steel', 'toxic', 'speedmark', 'mirror', 'conveyor', 'mycelium', 'candy', 'electric', 'magictile', 'quicksand'];
  assert.equal(ids.map(id => F[id]).join(''), 'ÂÊÎÔÛÄËÏÖÜàèìòùáéíóú');
  assert.equal(new Set(BK.EXTRA_FLOORS.map(f => f.terrain)).size, BK.EXTRA_FLOORS.length, 'un numéro de terrain par tuile');
  assert(BK.FLOOR_OVERLAYS.includes('tallgrass') && BK.FLOOR_OVERLAYS.includes('toxic'), 'herbe haute et sol contaminé se posent par-dessus');
  const sols = BK.EDITOR_TABS.find(t => t.id === 'sols').items;
  for (const id of ids) assert(sols.some(it => it.ch === F[id] || it.overlay === id), 'dans l’onglet Sols : ' + id);
}
{   // roche volcanique : rayon réduit d'une case
  const W = mk(['.......', '...' + F.volcanic + '...', '.......']), p = hero(W, 3, 1), b = bombAtFeet(W, p, 2);
  W.explodeBomb(b); assert(flame(W, 4, 1) && !flame(W, 5, 1), 'flamme 2 → 1 sur la roche volcanique');
}
{   // corail : 15 % plus lent ; une bombe qui y explose le change en eau profonde
  const W = mk(['.....', '..' + F.coral + '..', '.....']), p = hero(W, 2, 1);
  assert.equal(W.floorSlow(p), 0.85);
  W.explodeBomb(bombAtFeet(W, p, 1)); const i = W.idx(2, 1);
  assert(W.terrain[i] === 2 && W.deepWater.has(i), 'le corail devient eau profonde');
}
{   // liane : une chance sur quatre de rester pris 1 seconde
  const W = mk(['......', '..' + F.vines + '...', '......']), p = hero(W, 1, 1);
  Math.random = () => 0.1; p.input.dx = 1; let x = null;
  for (let i = 0; i < 90 && !(p.vineT > 0); i++) W.update(1 / 60);
  Math.random = realRandom;
  assert(p.vineT > 0.9, 'pris dans les lianes'); x = p.x; run(W, 0.6); assert(Math.abs(p.x - x) < 0.01, 'on ne bouge pas');
  run(W, 0.6); assert(p.x > x + 0.2, 'libre après 1 seconde');
}
{   // herbe haute : la bombe posée dedans est cachée, le héros caché des ennemis
  const W = mk(['.........', '.........', '.........'], { '4,1': { overlay: 'tallgrass' } }), p = hero(W, 4, 1);
  const b = bombAtFeet(W, p, 1); run(W, 0.05);
  assert(W.grassHides(b) && p.inGrass, 'bombe et héros cachés dans l’herbe');
  assert.equal(W.nearestPlayer(0.5, 1.5), null, 'un ennemi loin ne voit pas le héros');
  assert.equal(W.nearestPlayer(3.5, 1.5), p, 'tout près, il le voit');
  let drawn = 0; const draw = BK.sprites.drawBomb; BK.sprites.drawBomb = () => drawn++;
  const cam = new BK.Camera(1280, 720); cam.fit(9, 3, {}); W.render(ctx, cam, {}); BK.sprites.drawBomb = draw;
  assert.equal(drawn, 0, 'la bombe n’est pas dessinée'); assert(W.bombs.includes(b), 'mais elle est toujours là');
}
{   // ardoise : on glisse encore une demi-case après avoir lâché la direction
  const row = '.' + F.slate.repeat(7) + '.', W = mk(['.........', row, '.........']), p = hero(W, 1, 1);
  p.input.dx = 1; run(W, 0.5); p.input.dx = 0; const x = p.x; run(W, 0.5);
  assert(p.x - x > 0.4 && p.x - x < 0.6, 'demi-case de glissade : ' + (p.x - x).toFixed(2));
}
{   // bronze : la branche ricoche à angle droit des deux côtés au lieu de traverser
  const W = mk(['.......', '.......', '...' + F.bronze + '...', '.......', '.......']), p = hero(W, 1, 2), b = bombAtFeet(W, p, 4);
  W.explodeBomb(b);
  assert(flame(W, 3, 2) && flame(W, 3, 1) && flame(W, 3, 3) && flame(W, 3, 0) && flame(W, 3, 4), 'ricochet vers le haut et le bas');
  assert(!flame(W, 4, 2), 'le souffle ne traverse pas le bronze');
}
{   // briques rouges : le bouclier qui éclate ne fait pas reculer
  for (const [ch, still] of [[F.redbrick, true], ['.', false]]) {
    const W = mk(['.....', '..' + ch + '..', '.....']), p = hero(W, 2, 1); p.shield = 1; p.x = 2.6;
    W.hitPlayer(p, { kind: 'flame', bomb: { x: 1.5, y: 1.5 } });
    assert.equal(p.x === 2.6, still, still ? 'immobile sur les briques' : 'repoussé ailleurs');
  }
}
{   // linoléum : ça grince et ça éclaire le héros la nuit
  const W = mk(['......', '.' + F.linoleum.repeat(4) + '.', '......']), p = hero(W, 1, 1); let squeaks = 0;
  p.input.dx = 1; for (let i = 0; i < 90; i++) { W.update(1 / 60); squeaks += W.events.filter(e => e.type === 'floorSqueak').length; }
  assert(squeaks >= 2, 'des grincements : ' + squeaks); assert(W.lights().some(l => Math.abs(l.x - p.x) < 0.01), 'le héros s’éclaire');
}
{   // émeraude : la bombe glisse sur la case voisine
  const W = mk(['.....', '..' + F.emerald + '..', '.....']), p = hero(W, 2, 1); p.dir = 3;
  assert(W.placeBomb(p)); run(W, 0.6); const b = W.bombs[0];
  assert(b.state === 'idle' && b.cx === 3 && b.cy === 1, 'bombe arrêtée à droite de l’émeraude');
}
{   // rondins : ils brûlent 3 secondes et enlèvent 1 point de vie par seconde
  const W = mk(['......', '.' + F.logs.repeat(3) + '..', '......']), p = hero(W, 1, 1), b = bombAtFeet(W, p, 1);
  p.x = 4.5; p.y = 1.5; W.explodeBomb(b); assert(W.logFires.size === 2, 'deux rondins en feu');
  run(W, 0.8); p.x = 1.5; const hp = p.hp; run(W, 1.5); assert(hp - p.hp >= 1 && hp - p.hp <= 3, 'perd 1 par seconde : ' + (hp - p.hp));
  run(W, 2); assert.equal(W.logFires.size, 0, 'le feu s’éteint');
}
{   // acier : le souffle passe par toutes les plaques collées
  const W = mk(['.........', '.' + F.steel.repeat(6) + '..', '.........']), p = hero(W, 1, 1), b = bombAtFeet(W, p, 1);
  W.explodeBomb(b); for (let c = 1; c <= 6; c++) assert(flame(W, c, 1), 'flamme sur la plaque ' + c);
  assert(!flame(W, 7, 1), 'pas plus loin');
}
{   // sol contaminé : poison doux après une demi-seconde
  const W = mk(['.....', '.....', '.....'], { '2,1': { overlay: 'toxic' } }), p = hero(W, 2, 1);
  run(W, 0.4); assert(!(p.poison > 0)); run(W, 0.3); assert(p.poison > 0 && p.poisonDmg === 1 && p.poisonEvery === 2, 'empoisonné doucement');
  p.x = 0.5; const hp = p.hp; run(W, 6.5); assert.equal(hp - p.hp, 3, '1 point de vie toutes les 2 s pendant 6 s');
}
{   // marquage au sol : +30 % de vitesse pendant 2 secondes
  const go = ch => { const W = mk(['..........', '.' + ch + '........', '..........']), p = hero(W, 0, 1); p.input.dx = 1; run(W, 1.2); return p.x; };
  assert(go(F.speedmark) - 0.5 > (go('.') - 0.5) * 1.1, 'plus loin avec le marquage');
}
{   // tapis roulant : héros, bombe et objet avancent d'une case par seconde dans le sens choisi
  const belt = F.conveyor.repeat(5), props = {}; for (let c = 1; c <= 5; c++) for (const r of [1, 3, 5]) props[c + ',' + r] = { beltDir: 3 };
  const W = mk(['........', '.' + belt + '..', '........', '.' + belt + '..', '........', '.' + belt + '..', '........'], props), p = hero(W, 1, 1);
  run(W, 2); assert(p.x > 3.2 && p.x < 3.8, 'le héros avance : ' + p.x.toFixed(2));
  const q = hero(W, 1, 3), b = bombAtFeet(W, q, 1); b.t = 99; q.x = 0.5; q.y = 6.5; run(W, 2.05); assert.equal(b.cx, 3, 'la bombe avance');
  W.spawnItem(1, 5, 'fire'); const it = W.itemAt(1, 5); run(W, 2.1); assert.equal(it.cx, 3, 'l’objet avance');
}
{   // mycélium : lumière, détruit par une explosion avec un nuage de spores
  const W = mk(['.....', '.' + F.mycelium.repeat(2) + '..', '.....']), p = hero(W, 3, 1);
  assert.equal(W.lights().filter(l => l.warm === 0).length, 2, 'deux lueurs');
  p.x = 1.5; const b = bombAtFeet(W, p, 0); W.explodeBomb(b);
  assert.equal(W.floorId(1, 1), undefined, 'mycélium détruit'); assert.equal(W.spores.length, 1, 'nuage de spores'); run(W, 4.1); assert.equal(W.spores.length, 0, 'disparu après 4 s');
}
{   // bonbon : une bombe poussée s'arrête net en y entrant
  const W = mk(['........', '.....' + F.candy + '..', '........']), p = hero(W, 1, 1), b = bombAtFeet(W, p, 1); b.t = 99; p.x = 1.5; p.y = 0.5;
  W.kickBomb(b, 3, p); run(W, 1.5); assert(b.state === 'idle' && b.cx === 5, 'arrêtée sur le bonbon : ' + b.cx);
}
{   // sol électrifié : allumé, 3 points de vie et paralysé une demi-seconde
  const W = mk(['.....', '..' + F.electric + '..', '.....']), p = hero(W, 1, 1);
  W.time = 3.1; p.input.dx = 1; let i = 0; while (!(p.shockT > 0) && i++ < 60) W.update(1 / 60);
  assert(p.shockT > 0 && p.hp === 37, 'piqué : ' + p.hp); const x = p.x; run(W, 0.3); assert(Math.abs(p.x - x) < 0.01, 'paralysé');
  const W2 = mk(['.....', '..' + F.electric + '..', '.....']), q = hero(W2, 1, 1); W2.time = 0; q.input.dx = 1; run(W2, 0.8); assert.equal(q.hp, 40, 'éteint : rien');
}
{   // carrelage magique : téléporte vers un autre carrelage magique
  const W = mk(['.........', '.' + F.magictile + '.....' + F.magictile + '.', '.........']), p = hero(W, 0, 1);
  p.input.dx = 1; let i = 0; while (p.x < 6 && i++ < 60) W.update(1 / 60);
  assert(Math.floor(p.x) === 7, 'téléporté au bout : ' + p.x.toFixed(2));
}
{   // sables mouvants : immobile 2 secondes, on s'enfonce et on revient au dernier endroit sûr
  const W = mk(['.....', '.' + F.quicksand + '...', '.....']), p = hero(W, 2, 1);
  p.input.dx = -1; run(W, 0.35); p.input.dx = 0; assert.equal(Math.floor(p.x), 1); run(W, 2.2);
  assert.equal(p.falling?.kind, 'sand', 'englouti'); run(W, 1.5);
  assert(!p.falling && p.hp === 30 && Math.floor(p.x) === 2, 'retour sur la case sûre, −10');
}
{   // éditeur : le tapis roulant garde son sens ; tout se dessine
  const E = new BK.Editor({ name: 'S', cols: 25, rows: 3, theme: 'garden', base: '.' }), sols = BK.EDITOR_TABS.find(t => t.id === 'sols').items;
  E.item = sols.find(it => it.ch === F.conveyor); E.beltDir = 2; E.paint(2, 1, true);
  assert.equal(E.data().props['2,1'].beltDir, 2, 'sens vers le haut');
  const row = '.' + BK.EXTRA_FLOORS.slice(-20).filter(f => !BK.FLOOR_OVERLAYS.includes(f.id)).map(f => f.ch).join('') + '......';
  const W = mk(['.'.repeat(row.length), row, '.'.repeat(row.length)], { '2,0': { overlay: 'tallgrass' }, '3,0': { overlay: 'toxic' } }), m = row.indexOf(F.mirror), p = hero(W, m, 1);
  W.bombs.push({ cx: m, cy: 1, x: m + 0.5, y: 1.5, z: 0, t: 2, fire: 1, state: 'idle', born: 0, passers: new Set() });
  W.dayCycle = true; W.time = BK.DAY_CYCLE * 0.7; W.spores.push({ x: 3.5, y: 1.5, z: 0, t: 1, dur: 4 }); W.logFires.set(W.idx(10, 1), { c: 10, r: 1, t: 2 });
  const cam = new BK.Camera(1280, 720); cam.fit(row.length, 3, {}); W.render(ctx, cam, {}); W.renderNight(ctx, cam);
  assert.equal(W.floorId(m, 1), 'mirror');
}
console.log('Sols à mécanique : les 20 nouvelles tuiles passed.');
