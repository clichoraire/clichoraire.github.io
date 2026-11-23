// Goblin Malin — la consigne du chasseur. Par défaut, un chasseur ne chasse que les animaux (faisans, biches, cerfs) : devant un
//   monstre, il fait comme les autres travailleurs, il détale. Il ne sort son arc contre les monstres que pendant une attaque
//   du village (il se poste près du feu, derrière les gardes).
//   En lui parlant, le chef peut lui demander de tirer aussi sur les monstres qu'il croise (g.chasseMonstres), et le lui retirer.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Gi = CG.Gibier, pick = CG.pick; if (!Gi || !Gi.brave) return;
  const Cm = CG.ChasseMonstres = {
    OUI: ['Enfin ! Ils vont goûter à mes flèches.', 'Compris, chef. Tout ce qui grogne, je tire dessus.', 'Les monstres aussi ? D\'accord… je vais viser entre les deux yeux.'],
    NON: ['Ouf. Les biches, ça ne lance pas de bombes.', 'Compris, chef. Seulement ce qui se mange.', 'D\'accord. Si ça grogne, je me sauve.']
  };
  const br0 = Gi.brave; Gi.brave = function (g) { return br0.apply(this, arguments) && (!!g.chasseMonstres || !!(CG.R && CG.R.alarm)); };
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.chasseMonstres) o.chasseMonstres = true; }); return d; }; }
  Cm.changer = function (g) {
    g.chasseMonstres = !g.chasseMonstres; G.text(g.x, g.y - 62, pick(g.chasseMonstres ? Cm.OUI : Cm.NON), '#fff2a8', true); CG.sfx('ok');
    UI.toast((g.chasseMonstres ? '🏹 ' + g.name + ' tire maintenant aussi sur les monstres.' : '🦌 ' + g.name + ' ne chasse plus que les animaux.'));
  };
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin;
    if (g && g.job === 'chasseur' && !g.child && !g.bebe && Array.isArray(o.options) && o.options.some(q => q && /Modifier le travail/.test(q.label || '')) && !o.options.some(q => q && q.chasseM)) {
      const l = o.options.slice(), i = l.findIndex(q => q && /Modifier le travail/.test(q.label || ''));
      l.splice(i + 1, 0, { chasseM: true, label: g.chasseMonstres ? '🦌 Chasse seulement les animaux' : '🏹 Tire aussi sur les monstres', sub: g.chasseMonstres ? 'En ce moment : il tire sur les monstres qu\'il croise' : 'En ce moment : il ne chasse que les animaux', fn: () => Cm.changer(g) });
      o = Object.assign({}, o, { options: l });
    }
    return dl0.call(this, o);
  };
})(window.CG);
