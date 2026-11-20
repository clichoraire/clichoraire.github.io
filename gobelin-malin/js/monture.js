// Goblin Malin — Cavalier : pouvoir permanent de l'arbre. Le chef peut grimper sur un animal assez gros (loup, ours, félin), mais seulement une fois transformé.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, P = CG.P, Mt = CG.Monture = {};
  Mt.KINDS = { loup: { spd: 1.55, h: 24 }, felin: { spd: 1.65, h: 21 }, ours: { spd: 1.3, h: 33 } }; // vitesse du chef en selle, hauteur du dos
  Mt.TECH = 'b26';
  CG.TECH.push({ id: 'b26', br: 'clan', t: 5, r: 6, cout: 2, icon: '🏇', nom: 'Cavalier', desc: 'Nouveau pouvoir permanent : en parlant à un loup, un ours ou un félin déjà transformé, tu peux grimper sur son dos. Tu vas bien plus vite, et il mord ce qui s\'approche.', req: ['b24'] });
  CG.TECH_BY_ID.b26 = CG.TECH[CG.TECH.length - 1];
  Mt.can = p => !!(p && p.evo && !p.ko && !(p.evoT > 0) && Mt.KINDS[p.kind]);
  Mt.on = function (p) {
    const R = CG.R, pl = CG.S.player; if (!Mt.can(p) || R.ko > 0) return;
    if (R.mount) Mt.off(true);
    R.mount = p; p.ridden = true; p.eat = null; p.path = null; p.sleep = false; p.x = pl.x; p.y = pl.y;
    G.puff(pl.x, pl.y - 10, '#fff', 12, 90, 3); G.text(pl.x, pl.y - 74, '🏇 En selle sur ' + p.name + ' !', '#ffe9a8', true); CG.sfx('ok');
  };
  Mt.off = function (quiet) {
    const R = CG.R, p = R.mount, pl = CG.S.player; if (!p) return; R.mount = null; p.ridden = false; p.path = null; p.timer = 2; p.moving = false;
    p.x = pl.x - (pl.face || 1) * 30; p.y = pl.y + 6; G.unstick(p, 9);
    if (!quiet) { G.puff(pl.x, pl.y - 6, '#d8c8a0', 8, 70, 3); CG.sfx('ok'); }
  };
  // l'option dans la discussion avec l'animal
  const name0 = G.nameOpt;
  G.nameOpt = function (o) {
    const base = name0.apply(this, arguments) || [];
    if (!o || !o.pet || !G.tech(Mt.TECH) || !Mt.KINDS[o.kind]) return base;
    if (CG.R.mount === o) return [{ label: '⬇️ Descendre', fn: () => Mt.off() }].concat(base);
    return [{ label: '🏇 Monter sur son dos', sub: o.evo ? 'Tu te déplaces bien plus vite. E pour redescendre.' : 'Il est encore trop petit pour te porter', disabled: !Mt.can(o), fn: () => Mt.on(o) }].concat(base);
  };
  // en selle : E redescend quand il n'y a rien d'autre à faire devant soi
  const find0 = D.findInteract;
  D.findInteract = function () {
    const R = CG.R, it = find0.apply(this, arguments);
    if (!R.mount || R.ko > 0 || R.cine) return it;
    if (!it || (it.type === 'pet' && it.obj === R.mount)) return { type: 'descendre', label: 'Descendre de ' + R.mount.name };
    return it;
  };
  const inter0 = D.interact;
  D.interact = function () { const it = D.findInteract(); if (it && it.type === 'descendre') return Mt.off(); return inter0.apply(this, arguments); };
  const hm = G.heroMul; G.heroMul = () => hm() * (CG.R && CG.R.mount ? Mt.KINDS[CG.R.mount.kind].spd : 1);
  const up0 = G.update;
  G.update = function (dt) {
    up0(dt);
    const S = CG.S, R = CG.R, m = R.mount, pl = S.player; if (!m) return;
    if (m.ko || R.ko > 0 || R.death || S.pets.indexOf(m) < 0) return Mt.off(true);
    m.x = pl.x; m.y = pl.y; m.face = pl.face || 1; m.moving = pl.moving; if (pl.moving) m.step += dt * 2.4 * G.heroMul(); m.sleep = false;
    m.atkCd -= dt; if (m.atkAnim > 0) m.atkAnim -= dt * 4; if (m.buffT > 0) m.buffT -= dt;
    if (m.atkCd <= 0) { // la monture mord ce qui passe à portée
      const e = G.nearestEnemy(pl.x, pl.y, 46);
      if (e) { m.atkCd = P.KINDS[m.kind].cd; m.atkAnim = 1; m.face = e.x > pl.x ? 1 : -1; G.hurtEnemy(e, P.dmg(m), pl); P.xp(m, 2); }
    }
    if (pl.moving && Math.random() < dt * 9) R.parts.push({ x: pl.x - R.dir.x * 16, y: pl.y - 1, vx: (Math.random() - 0.5) * 24, vy: -8 - Math.random() * 16, life: 0.4, max: 0.4, col: '#d8c8a0', size: 3, float: true });
  };
  const morn0 = P.morning; P.morning = function () { if (CG.R.mount) Mt.off(true); return morn0.apply(this, arguments); };
  // dessin : l'animal sous le chef ; renvoie de combien remonter le chef
  Mt.pre = function (c, pl, t) {
    const R = CG.R, m = R.mount; if (!m || R.death || R.ko > 0) return 0;
    CG.Art.pet(c, Object.assign({}, m, { x: pl.x, y: pl.y + 2, flash: 0 }), t);
    const sw = m.moving ? Math.abs(Math.sin(m.step * Math.PI * 2)) * 1.6 : Math.sin(t * 2.4) * 0.5;
    return Mt.KINDS[m.kind].h + sw;
  };
})(window.CG);
