// Goblin Malin — pas d'écriture inutile quand on lance un sort : si le texte qui s'affiche ne fait que répéter le nom du sort
// (« 🔮 Bouclier ! »), on ne l'affiche pas. Les textes qui disent autre chose (dégâts, soins, « Pas assez de mana ») restent.
// Chargé en dernier, pour envelopper tout ce que les autres fichiers ajoutent au lancement d'un sort.
'use strict';
(function (CG) {
  const G = CG.G; if (!G || !G.cast || !G.text) return;
  const mots = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  let sort = null;
  const t0 = G.text; G.text = function (x, y, txt) {
    if (sort) { const m = mots(txt); if (m.length && m.every(w => sort.includes(w))) return; } // rien que le nom du sort : on se tait
    return t0.apply(this, arguments);
  };
  const c0 = G.cast; G.cast = function (id) {
    const sp = CG.SPELLS && CG.SPELLS[id], avant = sort; sort = sp ? mots(sp.nom) : null;
    try { return c0.apply(this, arguments); } finally { sort = avant; }
  };
})(window.CG);
