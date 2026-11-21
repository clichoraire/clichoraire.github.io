// Goblin Malin — une demande propre aux guérisseurs : « relève cet animal ». Dans la discussion avec un guérisseur, on choisit
// un compagnon tombé au combat. Le guérisseur va jusqu'à lui et le soigne, de 0 jusqu'à toute sa vie : là seulement l'animal
// se remet sur pied. Il faut le faire avant le lendemain matin (au réveil, un animal resté à terre est perdu).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, P = CG.P, Re = CG.Relever = { DUREE: 9, PRES: 34, VITESSE: 125 };
  Re.tombes = () => CG.S.pets.filter(p => p.ko && P.KINDS[p.kind]);
  const pris = p => CG.S.goblins.some(g => g.releve === p);
  Re.demander = function (g) {
    const opts = Re.tombes().map(p => ({ label: (P.KINDS[p.kind].icon || '🐾') + ' ' + p.name, sub: pris(p) ? 'Quelqu\'un s\'en occupe déjà' : '', disabled: pris(p), fn: () => Re.partir(g, p) }));
    UI.dialog({ goblin: g, who: g.name, tag: '🌿 ' + (g.sex === 'f' ? 'guérisseuse' : 'guérisseur'), text: 'Qui dois-je relever, chef ?', options: opts.concat([{ label: '↩ Retour', fn: () => UI.talkGoblin(g) }]) });
  };
  Re.partir = function (g, p) {
    if (!p.ko || !CG.S.pets.includes(p)) return; G.resetGoblin(g); g.releve = p; g.patient = null; p.hp = Math.max(0, p.hp || 0);
    G.say(g, 'J\'y cours, chef ! Tiens bon, ' + p.name + ' !', 3.5);
  };
  const fini = g => { g.releve = null; g.pose = null; G.resetGoblin(g); };
  // il passe avant son poste à la hutte de soins
  const hs0 = G.healerStep; G.healerStep = function (g, dt) {
    const p = g.releve; if (!p) return hs0.apply(this, arguments);
    const S = CG.S, R = CG.R; if (!S.pets.includes(p) || !p.ko || g.job !== 'guerisseur') { fini(g); return hs0.apply(this, arguments); }
    if (g.hidden) g.hidden = false; g.bubble = null;
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d > Re.PRES) { // en route
      if (g.state !== 'toReleve' || !g.path || !g.path.length) { g.state = 'toReleve'; if (!G.goTo(g, p.x + (g.x > p.x ? 20 : -20), p.y + 4)) { g.x = p.x + 20; g.y = p.y + 4; } }
      G.follow(g, Re.VITESSE, dt); g.pose = null; return true;
    }
    // à genoux près de lui : la vie remonte, de zéro jusqu'en haut
    const max = P.maxHp(p); g.state = 'releve'; g.moving = false; g.pose = 'work'; g.face = p.x > g.x ? 1 : -1;
    p.hp = Math.min(max, (p.hp || 0) + max / Re.DUREE * dt);
    if (Math.random() < dt * 9) R.parts.push({ x: p.x + CG.rand(-14, 14), y: p.y - CG.rand(2, 22), vx: CG.rand(-6, 6), vy: CG.rand(-34, -14), life: 0.7, max: 0.7, col: Math.random() < 0.5 ? '#8aff9a' : '#e8ffd0', size: 2.6, float: true });
    if ((g.releveT = (g.releveT || 0) - dt) <= 0) { g.releveT = 1.5; G.text(p.x, p.y - 40, '❤ ' + Math.round(p.hp / max * 100) + ' %', '#b8ffb0'); if (CG.onScreen(p.x, p.y)) CG.sfx('heal'); }
    if (p.hp >= max - 0.01) {
      p.hp = max; p.ko = false; p.target = null; p.path = null; if (P.reset) { const x = p.x, y = p.y; P.reset(p); p.x = x; p.y = y; }
      G.puff(p.x, p.y - 14, '#b8ffb0', 22, 130, 4); R.rings.push({ x: p.x, y: p.y - 6, r: 70, life: 0.5, col: '#8aff9a' }); G.text(p.x, p.y - 58, '✨ ' + p.name + ' se relève !', '#b8ffb0', true); CG.sfx('level');
      S.morale = Math.min(100, S.morale + 2); G.say(g, CG.pick(['Et voilà ! Comme neuf.', 'Debout, mon grand !', 'Ouf... il était moins une.']), 3); fini(g);
    }
    return true;
  };
  // dans la discussion avec un guérisseur
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin; if (g && g.job === 'guerisseur' && !g.child && Array.isArray(o.options) && o.options.some(x => x && /^🛠/.test(x.label || ''))) {
      const opts = o.options.slice(), i = opts.findIndex(x => x && /^👋/.test(x.label || '')), n = Re.tombes().length, occupe = g.releve && g.releve.ko;
      opts.splice(i < 0 ? opts.length : i, 0, { label: '🐾 Lui demander de relever un animal', sub: occupe ? 'En train de relever ' + g.releve.name : n ? '' : 'Aucun animal à terre', disabled: !n || !!occupe, fn: () => Re.demander(g) });
      o = Object.assign({}, o, { options: opts });
    }
    return dl0.call(this, o);
  };
})(window.CG);
