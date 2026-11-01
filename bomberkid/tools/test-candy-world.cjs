// Thème guimauve : saut écrasé du monstre, bloc de guimauve à manger, nuage « pouf », trampoline 2 / 3 cases.
const assert = require('node:assert/strict'), BK = require('./headless');
const mk = (map, props = {}) => new BK.World({ map, props, theme: 'garden', mode: 'adventure', hearts: true, explore: true, itemChance: 0 });
{
  const W = mk(['.........', '.........', '.........']), p = W.addPlayer(BK.charById('adam'), 7, 1, { hp: 40 }); p.invuln = 0;
  const e = W.addEnemy('guimauve', 4, 1); e.mallowCool = 0; let crouched = false, flew = false, landed = false, maxZ = 0;
  for (let i = 0; i < 120; i++) { W.updateEnemy(e, 1 / 60); const ph = e.mallow?.phase; crouched ||= ph === 'crouch'; flew ||= ph === 'air'; landed ||= ph === 'land'; maxZ = Math.max(maxZ, e.z || 0); }
  assert(crouched && flew && landed && maxZ > 0.8, 'la guimauve s’accroupit, saute haut et atterrit');
  assert.equal(Math.floor(e.x), 6, 'elle saute 2 cases vers le héros');
  e.mallow = { phase: 'land', t: 0 }; const q = BK.mallowSquash(e); assert(q.sy < 0.7 && q.sx > 1.2, 'écrasée à l’atterrissage');
  e.mallow.t = 0.6; const q2 = BK.mallowSquash(e); assert(Math.abs(q2.sy - 1) < 0.05, 'reprend sa forme (rebond élastique)');
  const p2 = W.players[0]; p2.x = 6.5; p2.y = 1.5; p2.invuln = 0; const hp = p2.hp; e.x = 4.5; e.y = 1.5; e.mallow = null; e.mallowCool = 0;
  for (let i = 0; i < 120; i++) W.updateEnemy(e, 1 / 60); assert(p2.hp < hp, 'elle écrase le héros sur sa case d’atterrissage');
}
{
  const W = mk(['.....', '.."..', '.....'], { '2,1': { deco: 'marshmallow', color: '#c8f2e0' } }); const p = W.addPlayer(BK.charById('adam'), 0, 0, { hp: 40 });
  assert.equal(W.cell(2, 1), BK.SOFT); W.destroyBlock(2, 1, p); assert(W.items.some(it => it.type === 'marshmallow'), 'le bloc donne une guimauve');
  p.hp = 20; p.inv = [{ type: 'marshmallow', n: 1 }]; assert(W.useItem(p, 0) && p.hp === 25, 'manger la guimauve : +5 de vie');
}
{
  const W = mk(['.....', '.."..', '.....'], { '2,1': { deco: 'cloudblock', color: '#ffd1e3' } }); assert.equal(W.cell(2, 1), BK.SOFT, 'le nuage se casse');
  const n = W.particles.length; W.destroyBlock(2, 1, null); assert(W.particles.length - n >= 10 && W.cell(2, 1) === 0, 'pouf !');
}
for (const [run, want] of [[false, 4], [true, 5]]) {
  const W = mk(['.........', '.."......', '.........'], { '2,1': { deco: 'trampoline' } }), p = W.addPlayer(BK.charById('adam'), 1, 1, { hp: 40 });
  assert.equal(W.cell(2, 1), 0, 'on marche sur le trampoline'); p.dir = 3; p.input.dx = 1;
  for (let i = 0; i < 40 && !p.air; i++) { if (run) p.running = true; W.updatePlayer(p, 1 / 60); }
  assert(p.air, 'le trampoline fait bondir'); p.input.dx = 0; p.running = false; for (let i = 0; i < 80 && p.air; i++) W.updatePlayer(p, 1 / 60);
  assert.equal(Math.floor(p.x), want, (run ? 'en courant : 3 cases' : 'en marchant : 2 cases'));
}
{
  const ctx = new Proxy({}, { get: (o, k) => k in o ? o[k] : k === 'measureText' ? () => ({ width: 10 }) : /create.*Gradient/.test(k) ? () => ({ addColorStop() { } }) : () => { }, set: (o, k, v) => (o[k] = v, true) });
  BK.sprites.drawEnemy(ctx, 'guimauve', { s: 60, t: 1, creature: { mallow: { phase: 'land', t: 0.1 } } }); BK.sprites.drawTree(ctx, 0, 0, 40, 1, { style: 'guimauve' });
  BK.sprites.drawDeco(ctx, 'cloudblock', 0, 0, 40, 1, null, 1, 0, null, { color: '#ffd1e3' }); BK.sprites.drawDeco(ctx, 'trampoline', 0, 0, 40, 1, null, 1); BK.sprites.drawItem(ctx, 'marshmallow', 40, 1);
}
console.log('Thème guimauve : saut écrasé, bloc et guimauve à manger, nuage pouf, trampoline 2/3 cases passed.');
