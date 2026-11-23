// Goblin Malin — l'Illusion terrifiante fait peur à tout le monde... y compris à tes propres gobelins !
//   Ceux qui sont près du chef quand le monstre apparaît détalent quelques secondes en criant, puis reviennent, un peu gênés.
//   Les gardes font les braves (mais ils tremblent), les enfants adorent ça ou pleurent. Aucune pénalité : c'est juste drôle.
//   Tout se règle dans CG.Frousse.
'use strict';
(function (CG) {
  const G = CG.G, pick = CG.pick, rand = CG.rand;
  const Fr = CG.Frousse = { RAYON: 300, DUREE: [2.6, 4.2], GARDE: 1.1, VITESSE: 165, APRES: 0.55,
    CRIS: ['AAAAH ! UN MONSTRE !', 'MAMAAAAN !', 'Sauve qui peut !', 'Chef ! Derrière toi ! DERRIÈRE TOI !', 'Je veux rentrer dans ma hutte !', 'Pas moi ! Mange le voisin !', 'J\'ai rien vu, j\'ai rien vu, j\'ai rien vu...', 'Mes jambes courent toutes seules !',
      'C\'est quoi ÇA ?!', 'Je démissionne !', 'Au secours ! Il a des dents partout !', 'Je savais que j\'aurais dû rester couché !', 'Courez ! Moi je cours déjà !', 'Aaah ! Mon cœur ! Mes oreilles ! Tout !', 'Il m\'a regardé ! IL M\'A REGARDÉ !',
      'Je suis trop jeune pour être mangé !', 'Prends mes champignons, mais laisse-moi !', 'Nooon, pas les orteils !', 'Je fais le mort ! ...ah non, je cours !', 'Qui a éteint mon courage ?!'],
    GARDES: ['M-même pas p-peur.', 'Je... je protège le clan. De loin.', 'Un garde ne recule pas ! Il... change d\'angle.', 'Halte, monstre ! ...s\'il te plaît ?', 'J\'ai vu pire. Non, c\'est faux. J\'ai jamais vu pire.', 'Mon épée tremble. Pas moi. Mon épée.'],
    ENFANTS: ['OUIIIN !', 'Encore ! Encore ! ...non, pas encore !', 'Il est gros le monsieur !', 'Je vais le dire à maman !', 'Trop cool ! AAAH ! Trop peur !', 'Je me cache derrière toi, d\'accord ?'],
    APRES_TXT: ['...C\'était le chef ? Oh. Je le savais.', 'Hum. Je courais pour me réchauffer.', 'Chef ! Préviens, la prochaine fois !', 'J\'ai pas eu peur. J\'ai eu... de l\'élan.', 'On n\'en parle à personne, d\'accord ?', 'Mon cœur fait encore boum boum.', 'Bon. Où est-ce que j\'ai lâché mon panier ?',
      'Très drôle, chef. Très, très drôle.', 'Je crois que j\'ai fait pipi. Un peu.', 'Il était faux ?! Mais il avait l\'air tellement vrai !', 'Je testais mes jambes. Elles marchent bien.', 'La prochaine fois, je te mords, chef.'] };
  function effrayer() {
    const S = CG.S, R = CG.R, p = S.player; let n = 0; const sacs = {}, tire = l => { const k = l === Fr.GARDES ? 'g' : l === Fr.ENFANTS ? 'e' : 'c'; if (!sacs[k] || !sacs[k].length) sacs[k] = CG.shuffle ? CG.shuffle(l.slice()) : l.slice().sort(() => Math.random() - 0.5); return sacs[k].pop(); }; /* pas deux fois la même réplique tant qu'il en reste */
    for (const g of S.goblins) { if (g.hidden || g.perch || g.ko === true || g.dead || Math.hypot(g.x - p.x, g.y - p.y) > Fr.RAYON) continue;
      const garde = g.job === 'garde', petit = !!(g.child || g.bebe), dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + rand(-0.5, 0.5);
      g.frousse = { t: garde ? Fr.GARDE : rand(Fr.DUREE[0], Fr.DUREE[1]), ux: d < 4 ? (Math.random() < 0.5 ? 1 : -1) : Math.cos(a), uy: d < 4 ? 0 : Math.sin(a), garde, zig: Math.random() * 6 };
      g.bubble = garde ? '😬' : '😱'; G.say(g, tire(garde ? Fr.GARDES : petit ? Fr.ENFANTS : Fr.CRIS), 2.6, n * 0.12); G.text(g.x, g.y - 52, garde ? '😬' : '😱', '#fff'); n++; }
    if (n > 2 && R) R.shake = Math.max(R.shake || 0, 0.12);
    return n;
  }
  Fr.effrayer = effrayer;
  { const c0 = G.cast; G.cast = function (id) { if (id !== 'illusion' || !CG.S || !CG.R) return c0.apply(this, arguments); const p = CG.S.player, mp = p.mp, r = c0.apply(this, arguments); try { if (p.mp < mp) effrayer(); } catch (e) { /* jamais bloquant */ } return r; }; }
  { const up0 = G.update; G.update = function (dt) { const r = up0.apply(this, arguments), S = CG.S; if (!S || !CG.R) return r;
    for (const g of S.goblins) { const f = g.frousse; if (!f) continue; f.t -= dt;
      if (f.t <= 0 || g.hidden) { g.frousse = null; if (g.bubble === '😱' || g.bubble === '😬') g.bubble = null; if (!g.hidden && !f.garde && Math.random() < Fr.APRES) G.say(g, pick(Fr.APRES_TXT), 3.2, rand(0.2, 1.4)); continue; }
      const v = Fr.VITESSE * (f.garde ? 0.25 : 1) * dt, z = Math.sin(f.zig + f.t * 9) * 0.5, ux = f.ux - f.uy * z, uy = f.uy + f.ux * z; /* il zigzague en courant */
      if (!G.slide(g, ux * v, uy * v, 8)) { const t = f.ux; f.ux = -f.uy; f.uy = t; } /* un mur : il part de côté */
      g.face = f.garde ? (CG.S.player.x > g.x ? 1 : -1) : (ux > 0 ? 1 : -1); g.moving = true; g.step = (g.step || 0) + dt * (f.garde ? 14 : 11); g.path = null; }
    return r; }; }
})(window.CG);
