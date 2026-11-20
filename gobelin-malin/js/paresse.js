// Goblin Malin — les paresseux : certains gobelins s'endorment au travail (au village seulement) ; on les réveille, ou ils se réveillent seuls au bout d'une heure.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Pa = CG.Paresse = {};
  Pa.SHARE = 0.3;          // part des gobelins qui sont paresseux
  Pa.EVERY = 75;           // secondes de travail, en moyenne, avant qu'un vrai paresseux s'endorme
  Pa.VILLAGE = 560;        // « au village » : à cette distance du feu, pas plus loin
  Pa.HOURS = 1;            // il se réveille seul après une heure du jeu
  const MOTS = ['Hein ?! Je dormais pas, chef !', 'Je... je réfléchissais les yeux fermés.', 'Cinq minutes de plus...', 'Quoi ? Qui ? Ah. Oui. Au travail.', 'J\'inspectais mes paupières de l\'intérieur.'];
  Pa.wake = function (g, byChief) {
    if (!g.nap) return; g.nap = false; g.pose = null; g.bubble = null; g.napCd = 60;
    if (byChief) { G.text(g.x, g.y - 52, '😳 ' + CG.pick(MOTS), '#ffe9a8', true); G.puff(g.x, g.y - 30, '#fff', 6, 70, 2); CG.sfx('ok'); g.boost = Math.max(g.boost || 0, 12); } // réveillé par le chef : il se dépêche un moment
  };
  Pa.step = function (g, dt) {
    const S = CG.S, R = CG.R;
    if (g.lazy === undefined) g.lazy = !g.child && Math.random() < Pa.SHARE ? 0.5 + Math.random() * 0.5 : 0;
    if (g.nap) {
      if (R.alarm || S.hour >= g.napUntil || S.hour < g.napFrom) { Pa.wake(g, false); return false; }
      g.moving = false; g.pose = 'nap'; g.bubble = null; return true;
    }
    if (g.napCd > 0) g.napCd -= dt;
    if (!g.lazy || g.napCd > 0 || g.state !== 'work' || g.cls || R.alarm || S.hour > 17) return false;
    if (CG.dist(g, G.firePos()) > Pa.VILLAGE) return false; // jamais ailleurs qu'au village
    if (Math.random() < dt * g.lazy / Pa.EVERY) { g.nap = true; g.napFrom = S.hour; g.napUntil = S.hour + Pa.HOURS; g.path = null; G.text(g.x, g.y - 46, '💤', '#e8f0ff'); }
    return !!g.nap;
  };
  // devant un dormeur : « Réveiller » à la place de « Parler »
  const find0 = D.findInteract;
  D.findInteract = function () { const it = find0.apply(this, arguments); if (it && it.type === 'goblin' && it.obj.nap) return { type: 'reveil', obj: it.obj, label: 'Réveiller ' + it.obj.name + ' 💤' }; return it; };
  const inter0 = D.interact;
  D.interact = function () { const it = D.findInteract(); if (it && it.type === 'reveil') return Pa.talk(it.obj); return inter0.apply(this, arguments); };
  // on discute avec le dormeur : le secouer, le réveiller gentiment, ou le laisser dormir
  const RONF = ['Zzz... rrron... encore un champignon... zzz...', 'Rrrron... pfff... rrrron...', 'Zzz... non, pas la hache... zzz...', 'Mmmh... cinq minutes... zzz...'];
  const DOUX = ['Oh ! Pardon, chef. J\'y retourne, promis.', 'Mmmh ? Ah oui, le travail. Merci de pas crier, chef.', 'D\'accord, d\'accord. C\'était une belle sieste, quand même.'];
  Pa.talk = function (g) {
    const S = CG.S, ami = d => { g.ami = CG.clamp((g.ami || 0) + d, -6, 6); };
    { Pa.wake(g, false); g.napCd = 100; g.pep = Math.max(g.pep || 0, 40); ami(1); S.morale = Math.min(100, S.morale + 1); G.text(g.x, g.y - 52, '🥱 ' + CG.pick(DOUX), '#e8ffd0', true); CG.sfx('ok'); return; } // un seul E : on le réveille doucement, sans fenêtre
    CG.UI.dialog({ goblin: g, who: g.name, tag: (g.sex === 'f' ? 'endormie' : 'endormi') + ' en plein travail', text: CG.pick(RONF), options: [
      { label: '💢 Debout ! Retourne travailler, et plus vite que ça !', sub: (g.sex === 'f' ? 'Elle' : 'Il') + ' file au travail en courant, mais boude un peu', fn: () => { Pa.wake(g, true); g.boost = Math.max(g.boost || 0, 25); g.napCd = 150; ami(-1); } },
      { label: '🙂 Réveille-toi doucement. On a besoin de toi.', sub: (g.sex === 'f' ? 'Elle' : 'Il') + ' se remet au travail de bonne humeur', fn: () => { Pa.wake(g, false); g.napCd = 100; g.pep = Math.max(g.pep || 0, 40); ami(1); S.morale = Math.min(100, S.morale + 1); G.text(g.x, g.y - 52, '🥱 ' + CG.pick(DOUX), '#e8ffd0', true); CG.sfx('ok'); } },
      { label: '😴 Dors encore un peu...', sub: 'La sieste continue. Le travail attendra.', fn: () => { ami(1); G.text(g.x, g.y - 40, '💤', '#e8f0ff'); } }
    ] });
  };
  // couché dans l'herbe, les mains sur le ventre, avec des « z » qui montent : on voit de loin qu'il ne travaille pas
  Pa.draw = function (c, g, t) {
    const f = g.face < 0 ? -1 : 1, br = Math.sin(t * 1.6 + g.id) * 0.03;
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(g.x, g.y + 1, 25, 7, 0, 0, 6.3); c.fill();
    c.save(); c.translate(g.x - f * 14, g.y - 5); c.rotate(-f * (1.42 + br)); c.scale(1, 1 + br);
    CG.Art.goblin(c, { x: 0, y: 0, face: f, dir: 'S', t: t, sex: g.sex, hue: g.hue, lum: g.lum, job: g.job, equip: g.equip, tool: null, pose: 'nap', noZ: true, look: g.look, cls: g.cls || (g.nomme ? 'hob' : null), evolved: !!g.nomme, noHat: !g.hat, hatJob: g.hat, fun: g.fun });
    c.restore();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) { const u = (t * 0.45 + i / 3) % 1; c.globalAlpha = Math.sin(u * Math.PI); c.font = 'bold ' + Math.round(11 + u * 13) + 'px "Trebuchet MS", sans-serif'; c.lineWidth = 3; c.strokeStyle = 'rgba(20,24,40,0.7)'; const x = g.x + f * (20 + u * 16) + Math.sin(u * 6 + i) * 3, y = g.y - 24 - u * 34; c.strokeText('z', x, y); c.fillStyle = '#e8f0ff'; c.fillText('z', x, y); }
    c.globalAlpha = 1; c.textBaseline = 'alphabetic';
  };
})(window.CG);
