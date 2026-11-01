// Éditeur : métal en un seul outil, traînée de poudre sous les objets, plateforme mobile sur le sol, blocs cubiques pleine case.
const assert = require('node:assert/strict'), BK = require('./headless');
const tab = id => BK.EDITOR_TABS.find(t => t.id === id).items;
const all = BK.EDITOR_TABS.flatMap(t => t.items || []);
{
  assert(!all.some(it => it.ch === 'X'), 'plus de buisson haut');
  assert(!all.some(it => it.ch === '(' && !it.opts), 'plus de rail de plateforme seul');
  assert.equal(all.filter(it => '<>^v'.includes(it.ch || '#')).length, 1, 'un seul outil de métal');
  assert.deepEqual(tab('objets').slice(0, 3).map(it => it.ch), ['1', 'G', '|'], 'départ, portail et diamant en premier');
}
{
  const E = new BK.Editor({ name: 'M', cols: 9, rows: 7, theme: 'garden', base: ',' });
  E.item = all.find(it => it.opts === 'metal'); E.metalSide = '<'; E.paint(3, 3, true);
  assert.equal(E.grid[3][3], '<', 'face en bois choisie : à gauche');
  const W = new BK.World({ map: E.data().grid, props: E.data().props, theme: 'garden', mode: 'adventure', explore: true });
  assert.equal(W.cell(3, 3), BK.METAL);
}
{
  const E = new BK.Editor({ name: 'T', cols: 9, rows: 7, theme: 'garden', base: ',' });
  E.item = all.find(it => it.ch === 'p'); for (const c of [2, 3, 4]) E.paint(c, 3, c === 2);
  E.item = all.find(it => it.ch === 'K'); E.paint(3, 3, true);
  assert.equal(E.grid[3][3], 'K'); assert(E.data().props['3,3'].trail, 'la traînée reste sous la caisse');
  const W = new BK.World({ map: E.data().grid, props: E.data().props, theme: 'garden', mode: 'adventure', explore: true });
  assert.equal(W.trail[W.idx(3, 3)], 1, 'le jeu voit la traînée sous l’objet');
  E.item = all.find(it => it.tool === 'erase'); E.paint(3, 3, true); assert.equal(E.grid[3][3], 'p', 'la gomme rend la traînée intacte');
}
{
  const E = new BK.Editor({ name: 'P', cols: 11, rows: 7, theme: 'garden', base: ',' });
  E.item = all.find(it => it.opts === 'movingPlatform'); E.paint(4, 3, true); for (const c of [5, 6, 7]) E.paint(c, 3, false);
  const d = E.data(), W = new BK.World({ map: d.grid, props: d.props, theme: 'garden', mode: 'adventure', hearts: true, explore: true }), p = W.addPlayer(BK.charById('adam'), 2, 3, { hp: 40 });
  p.input.dx = 1; let fell = false; for (let i = 0; i < 200; i++) { W.update(1 / 60); fell ||= !!p.falling; }
  assert(!fell && p.x > 7, 'on marche sur les rails posés au sol sans tomber');
  const W2 = new BK.World({ map: d.grid, props: d.props, theme: 'garden', mode: 'adventure', hearts: true, explore: true }), q = W2.addPlayer(BK.charById('adam'), 4, 3, { hp: 40 });
  for (let i = 0; i < 120; i++) W2.update(1 / 60); assert(q.x > 5 && !q.falling, 'la plateforme au ras du sol transporte le héros');
}
{
  const W = new BK.World({ map: ['.....', '.1"..', '.....'], props: { '2,1': { deco: 'cheese' } }, theme: 'garden', mode: 'adventure', explore: true });
  assert(BK.CUBE_BLOCKS.includes('cheese') && W.cell(2, 1) === BK.SOFT, 'le fromage est un bloc qui se casse');
  const ctx = new Proxy({}, { get: (o, k) => k in o ? o[k] : k === 'measureText' ? () => ({ width: 10 }) : /create.*Gradient/.test(k) ? () => ({ addColorStop() { } }) : () => { }, set: (o, k, v) => (o[k] = v, true) });
  const cam = new BK.Camera(1280, 720); cam.fit(5, 3, {}); W.render(ctx, cam, {});
  assert(BK.TREE_STYLES.length >= 17 && BK.TREE_SIZES.length === 5, '17 arbres et 5 grosseurs');
  for (const [style] of BK.TREE_STYLES) for (const [size] of BK.TREE_SIZES) BK.sprites.drawTree(ctx, 0, 0, 40, 1, { style, size });
}
console.log('Éditeur : métal unique, traînée cachée, plateforme au sol, blocs pleine case et nouveaux arbres passed.');
